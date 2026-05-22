import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/utils";
import { NextRequest } from "next/server";

async function getDbUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return prisma.user.findUnique({ where: { supabaseId: user.id } });
}

export async function POST(request: NextRequest) {
  const dbUser = await getDbUser();
  if (!dbUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { leagueName, teamName, scoringType, maxTeams, tradeMode, pickTimer, type } =
    await request.json();

  // Enforce private league cap (10 per user)
  const privateCount = await prisma.league.count({
    where: { type: "PRIVATE", teams: { some: { userId: dbUser.id } } },
  });
  if (privateCount >= 10) {
    return Response.json({ error: "Maximum 10 private leagues reached" }, { status: 400 });
  }

  const inviteCode = generateInviteCode();

  const league = await prisma.league.create({
    data: {
      name: leagueName,
      type: type ?? "PRIVATE",
      scoringType,
      maxTeams: Math.min(Math.max(maxTeams, 2), 16),
      minTeams: 2,
      tradeMode,
      pickTimerSeconds: Math.min(Math.max(pickTimer, 30), 120),
      inviteCode,
      adminId: dbUser.id,
      teams: {
        create: {
          name: teamName,
          userId: dbUser.id,
        },
      },
    },
    include: { teams: true },
  });

  return Response.json({ leagueId: league.id, inviteCode }, { status: 201 });
}

export async function GET() {
  const dbUser = await getDbUser();
  if (!dbUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const leagues = await prisma.league.findMany({
    where: { teams: { some: { userId: dbUser.id } } },
    include: { teams: { include: { user: true } }, _count: { select: { teams: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ leagues });
}
