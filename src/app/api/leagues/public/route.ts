import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const dbUser = await getDbUser();
  if (!dbUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { teamName, maxTeams, scoringType } = await request.json();

  const validSizes = [4, 6, 8];
  if (!validSizes.includes(maxTeams)) {
    return Response.json({ error: "Public leagues must have 4, 6, or 8 teams" }, { status: 400 });
  }

  // Enforce public league cap (3 per user)
  const publicCount = await prisma.league.count({
    where: { type: "PUBLIC", teams: { some: { userId: dbUser.id } } },
  });
  if (publicCount >= 3) {
    return Response.json({ error: "Maximum 3 public leagues reached" }, { status: 400 });
  }

  // Find an open public league of matching size/scoring
  const openLeague = await prisma.league.findFirst({
    where: {
      type: "PUBLIC",
      scoringType,
      maxTeams,
      status: "PENDING",
      teams: { none: { userId: dbUser.id } },
    },
    include: { _count: { select: { teams: true } } },
  });

  let leagueId: string;

  if (openLeague && openLeague._count.teams < openLeague.maxTeams) {
    // Join existing open public league
    await prisma.team.create({
      data: { name: teamName, userId: dbUser.id, leagueId: openLeague.id },
    });
    leagueId = openLeague.id;

    // If league is now full, schedule draft for ~15 min from now
    const newCount = openLeague._count.teams + 1;
    if (newCount >= openLeague.maxTeams) {
      const draftTime = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.league.update({
        where: { id: openLeague.id },
        data: { status: "DRAFT_SCHEDULED" },
      });
      await prisma.draft.create({
        data: {
          leagueId: openLeague.id,
          scheduledAt: draftTime,
          draftOrder: [],
        },
      });
    }
  } else {
    // Create a new public league
    const league = await prisma.league.create({
      data: {
        name: `Public League`,
        type: "PUBLIC",
        scoringType,
        maxTeams,
        minTeams: maxTeams,
        tradeMode: "ALL",
        adminId: dbUser.id,
        teams: { create: { name: teamName, userId: dbUser.id } },
      },
    });
    leagueId = league.id;
  }

  return Response.json({ leagueId }, { status: 201 });
}
