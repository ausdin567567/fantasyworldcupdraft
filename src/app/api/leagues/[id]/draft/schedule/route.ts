import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const dbUser = await getDbUser();
  if (!dbUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: { _count: { select: { teams: true } } },
  });
  if (!league) return Response.json({ error: "League not found" }, { status: 404 });
  if (league.adminId !== dbUser.id) return Response.json({ error: "Only the admin can schedule the draft" }, { status: 403 });

  if (league._count.teams < league.minTeams) {
    return Response.json({ error: `Need at least ${league.minTeams} teams before scheduling` }, { status: 400 });
  }

  const { scheduledAt } = await request.json();
  const date = new Date(scheduledAt);
  if (isNaN(date.getTime()) || date <= new Date()) {
    return Response.json({ error: "Draft time must be in the future" }, { status: 400 });
  }

  // Cancel existing scheduled draft if any
  await prisma.draft.updateMany({
    where: { leagueId, status: "SCHEDULED" },
    data: { status: "CANCELLED" },
  });

  // Build random snake draft order from current teams
  const teams = await prisma.team.findMany({ where: { leagueId } });
  const shuffled = teams.map((t) => t.id).sort(() => Math.random() - 0.5);

  // Assign draft positions
  await Promise.all(
    shuffled.map((teamId, i) =>
      prisma.team.update({ where: { id: teamId }, data: { draftPosition: i + 1 } })
    )
  );

  const draft = await prisma.draft.create({
    data: {
      leagueId,
      scheduledAt: date,
      status: "SCHEDULED",
      draftOrder: shuffled,
    },
  });

  await prisma.league.update({
    where: { id: leagueId },
    data: { status: "DRAFT_SCHEDULED" },
  });

  return Response.json({ draft }, { status: 201 });
}
