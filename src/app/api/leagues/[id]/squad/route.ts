import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

async function resolveTeam(leagueId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return null;
  const team = await prisma.team.findUnique({
    where: { userId_leagueId: { userId: dbUser.id, leagueId } },
  });
  return team;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const team = await resolveTeam(leagueId);
  if (!team) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const activeGw = await prisma.gameweek.findFirst({
    where: { status: { in: ["UPCOMING", "ACTIVE"] } },
    orderBy: { startDate: "asc" },
  });
  if (!activeGw) return Response.json({ selections: [] });

  const selections = await prisma.gameweekSelection.findMany({
    where: { teamId: team.id, gameweekId: activeGw.id },
  });

  return Response.json({ selections, gameweekId: activeGw.id });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const team = await resolveTeam(leagueId);
  if (!team) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const activeGw = await prisma.gameweek.findFirst({
    where: { status: { in: ["UPCOMING", "ACTIVE"] } },
    orderBy: { startDate: "asc" },
  });
  if (!activeGw) return Response.json({ error: "No active gameweek" }, { status: 400 });

  // Deadline check
  if (new Date() > activeGw.deadline) {
    return Response.json({ error: "Gameweek deadline has passed" }, { status: 400 });
  }

  const { selections } = await request.json() as {
    selections: { playerId: string; isStarting: boolean; benchPriority: number | null }[];
  };

  const starters = selections.filter((s) => s.isStarting);
  if (starters.length !== 11) {
    return Response.json({ error: "Must select exactly 11 starters" }, { status: 400 });
  }

  // Validate team owns all these players
  const playerIds = selections.map((s) => s.playerId);
  const ownedPlayers = await prisma.teamPlayer.findMany({
    where: { teamId: team.id, playerId: { in: playerIds }, droppedAt: null },
    include: { player: true },
  });
  if (ownedPlayers.length !== playerIds.length) {
    return Response.json({ error: "Invalid player selection" }, { status: 400 });
  }

  // Validate formation
  const starterPlayers = ownedPlayers.filter((tp) =>
    starters.some((s) => s.playerId === tp.playerId)
  );
  const posCounts = starterPlayers.reduce((acc, tp) => {
    acc[tp.player.position] = (acc[tp.player.position] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if ((posCounts["GK"] ?? 0) !== 1) {
    return Response.json({ error: "Must have exactly 1 starting GK" }, { status: 400 });
  }
  if ((posCounts["DEF"] ?? 0) < 3) {
    return Response.json({ error: "Must have at least 3 starting DEF" }, { status: 400 });
  }
  if ((posCounts["FWD"] ?? 0) < 1) {
    return Response.json({ error: "Must have at least 1 starting FWD" }, { status: 400 });
  }

  // Upsert all selections
  await prisma.$transaction(
    selections.map((s) =>
      prisma.gameweekSelection.upsert({
        where: {
          teamId_gameweekId_playerId: {
            teamId: team.id,
            gameweekId: activeGw.id,
            playerId: s.playerId,
          },
        },
        update: { isStarting: s.isStarting, benchPriority: s.benchPriority },
        create: {
          teamId: team.id,
          gameweekId: activeGw.id,
          playerId: s.playerId,
          isStarting: s.isStarting,
          benchPriority: s.benchPriority,
        },
      })
    )
  );

  return Response.json({ success: true });
}
