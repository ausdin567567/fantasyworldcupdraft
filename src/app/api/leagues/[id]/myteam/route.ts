import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

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
    include: {
      league: true,
      players: {
        where: { droppedAt: null },
        include: { player: { include: { country: true } } },
      },
      watchlist: {
        orderBy: { priority: "asc" },
      },
    },
  });

  if (!team) return Response.json({ error: "Not in this league" }, { status: 403 });

  return Response.json({
    teamId: team.id,
    teamName: team.name,
    pickTimerSeconds: team.league.pickTimerSeconds,
    players: team.players.map((tp) => tp.player),
    watchlist: team.watchlist.map((w) => w.playerId),
  });
}
