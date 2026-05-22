import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return Response.json({ error: "Not found" }, { status: 404 });

  const team = await prisma.team.findUnique({
    where: { userId_leagueId: { userId: dbUser.id, leagueId } },
  });
  if (!team) return Response.json({ error: "Not in league" }, { status: 403 });

  const activeGw = await prisma.gameweek.findFirst({
    where: { status: { in: ["UPCOMING", "ACTIVE"] } },
    orderBy: { startDate: "asc" },
  });
  if (!activeGw) return Response.json({ error: "No active gameweek" }, { status: 400 });

  // Free agency only active in 24h window before deadline
  const now = new Date();
  const freeAgencyStart = new Date(activeGw.deadline.getTime() - 24 * 60 * 60 * 1000);
  const isWaiverPeriod = now < activeGw.waiverDeadline;
  const isFreeAgencyWindow = now >= freeAgencyStart && now < activeGw.deadline;

  if (!isFreeAgencyWindow && !isWaiverPeriod) {
    return Response.json({ error: "No transfer window is currently open" }, { status: 400 });
  }

  if (isWaiverPeriod && !isFreeAgencyWindow) {
    return Response.json({ error: "Use waivers during this period" }, { status: 400 });
  }

  const { playerInId, playerOutId } = await request.json();

  const [playerIn, playerOut] = await Promise.all([
    prisma.player.findUnique({ where: { id: playerInId } }),
    prisma.player.findUnique({ where: { id: playerOutId } }),
  ]);

  if (!playerIn || !playerOut) return Response.json({ error: "Player not found" }, { status: 404 });
  if (playerIn.position !== playerOut.position) {
    return Response.json({ error: "Must be same position swap" }, { status: 400 });
  }
  if (playerIn.status !== "AVAILABLE") {
    return Response.json({ error: "Player not available" }, { status: 400 });
  }

  const ownsOut = await prisma.teamPlayer.findFirst({
    where: { teamId: team.id, playerId: playerOutId, droppedAt: null },
  });
  if (!ownsOut) return Response.json({ error: "You don't own that player" }, { status: 400 });

  await prisma.$transaction([
    prisma.teamPlayer.updateMany({
      where: { teamId: team.id, playerId: playerOutId, droppedAt: null },
      data: { droppedAt: now },
    }),
    prisma.teamPlayer.create({
      data: { teamId: team.id, playerId: playerInId, acquisitionType: "FREE_AGENCY" },
    }),
    prisma.player.update({ where: { id: playerInId }, data: { status: "OWNED" } }),
    prisma.player.update({ where: { id: playerOutId }, data: { status: "LOCKED" } }),
  ]);

  return Response.json({ success: true });
}
