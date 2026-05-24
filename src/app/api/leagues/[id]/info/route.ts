import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const dbUser = await getDbUser();
  if (!dbUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      scoringType: true,
      maxTeams: true,
      minTeams: true,
      adminId: true,
      inviteCode: true,
      _count: { select: { teams: true } },
    },
  });

  if (!league) return Response.json({ error: "League not found" }, { status: 404 });

  return Response.json({ ...league, myUserId: dbUser.id });
}
