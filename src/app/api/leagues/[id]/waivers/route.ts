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

  // Must be before waiver deadline
  if (new Date() > activeGw.waiverDeadline) {
    return Response.json({ error: "Waiver deadline has passed" }, { status: 400 });
  }

  const { playerInId, playerOutId, priority } = await request.json();

  // Validate ownership
  const ownsPlayerOut = await prisma.teamPlayer.findFirst({
    where: { teamId: team.id, playerId: playerOutId, droppedAt: null },
  });
  if (!ownsPlayerOut) return Response.json({ error: "You don't own that player" }, { status: 400 });

  const playerIn = await prisma.player.findUnique({ where: { id: playerInId } });
  const playerOut = await prisma.player.findUnique({ where: { id: playerOutId } });

  if (!playerIn || !playerOut) return Response.json({ error: "Player not found" }, { status: 404 });
  if (playerIn.position !== playerOut.position) {
    return Response.json({ error: "Must be same position swap" }, { status: 400 });
  }
  if (playerIn.status !== "AVAILABLE") {
    return Response.json({ error: "Player not available" }, { status: 400 });
  }

  const waiver = await prisma.waiverRequest.create({
    data: {
      teamId: team.id,
      gameweekId: activeGw.id,
      playerInId,
      playerOutId,
      priority: priority ?? 1,
    },
  });

  return Response.json({ waiver }, { status: 201 });
}

export async function GET(
  _request: NextRequest,
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

  const waivers = await prisma.waiverRequest.findMany({
    where: { teamId: team.id, status: "PENDING" },
    include: {
      playerIn: true,
      playerOut: true,
      gameweek: true,
    },
    orderBy: { priority: "asc" },
  });

  return Response.json({ waivers });
}
