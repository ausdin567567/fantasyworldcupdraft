import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { Position } from "@prisma/client";

const SQUAD_LIMITS: Record<Position, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return Response.json({ error: "User not found" }, { status: 404 });

  const { playerId } = await request.json();

  const team = await prisma.team.findUnique({
    where: { userId_leagueId: { userId: dbUser.id, leagueId } },
  });
  if (!team) return Response.json({ error: "Not in this league" }, { status: 403 });

  const draft = await prisma.draft.findFirst({
    where: { leagueId, status: "IN_PROGRESS" },
    include: { picks: true },
  });
  if (!draft) return Response.json({ error: "No draft in progress" }, { status: 400 });

  const draftOrder = draft.draftOrder as string[];
  const totalPicks = draft.picks.length;
  const teamsCount = draftOrder.length;
  const round = Math.floor(totalPicks / teamsCount) + 1;
  const pickInRound = totalPicks % teamsCount;

  // Snake order: even rounds go forward, odd rounds reverse
  const roundOrder = round % 2 === 1 ? draftOrder : [...draftOrder].reverse();
  const currentTeamId = roundOrder[pickInRound];

  if (currentTeamId !== team.id) {
    return Response.json({ error: "Not your turn" }, { status: 403 });
  }

  // Check player availability
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return Response.json({ error: "Player not found" }, { status: 404 });

  const alreadyPicked = await prisma.draftPick.findFirst({
    where: { draftId: draft.id, playerId },
  });
  if (alreadyPicked) return Response.json({ error: "Player already drafted" }, { status: 400 });

  // Check squad position limits
  const teamPicks = draft.picks.filter((p) => p.teamId === team.id);
  const teamPickPlayerIds = teamPicks.map((p) => p.playerId);
  const teamPlayers = await prisma.player.findMany({
    where: { id: { in: teamPickPlayerIds } },
  });
  const positionCounts = teamPlayers.reduce((acc, p) => {
    acc[p.position] = (acc[p.position] ?? 0) + 1;
    return acc;
  }, {} as Record<Position, number>);

  if (teamPicks.length >= 15) {
    return Response.json({ error: "Squad is already full (15 players)" }, { status: 400 });
  }

  if ((positionCounts[player.position] ?? 0) >= SQUAD_LIMITS[player.position]) {
    return Response.json({ error: `Already have max ${player.position}s` }, { status: 400 });
  }

  const pick = await prisma.draftPick.create({
    data: {
      draftId: draft.id,
      teamId: team.id,
      playerId,
      round,
      pick: totalPicks + 1,
    },
    include: { player: true, team: { include: { user: true } } },
  });

  await prisma.teamPlayer.create({
    data: { teamId: team.id, playerId, acquisitionType: "DRAFT" },
  });
  await prisma.player.update({ where: { id: playerId }, data: { status: "OWNED" } });

  // Remove the drafted player from every team's watchlist in this league
  await prisma.watchlist.deleteMany({
    where: { playerId, team: { leagueId } },
  });

  // Check if draft is complete (15 rounds * team count = total picks)
  const newTotal = totalPicks + 1;
  const totalPicksNeeded = 15 * teamsCount;
  if (newTotal >= totalPicksNeeded) {
    await prisma.draft.update({
      where: { id: draft.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await prisma.league.update({
      where: { id: leagueId },
      data: { status: "ACTIVE" },
    });
  }

  return Response.json({ pick, nextTeamId: currentTeamId });
}
