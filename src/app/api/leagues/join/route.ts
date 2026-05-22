import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return Response.json({ error: "User not found" }, { status: 404 });

  const { inviteCode, teamName } = await request.json();

  const league = await prisma.league.findUnique({ where: { inviteCode } });
  if (!league) return Response.json({ error: "Invalid invite code" }, { status: 404 });

  if (league.status !== "PENDING" && league.status !== "DRAFT_SCHEDULED") {
    return Response.json({ error: "League is no longer accepting new members" }, { status: 400 });
  }

  const teamCount = await prisma.team.count({ where: { leagueId: league.id } });
  if (teamCount >= league.maxTeams) {
    return Response.json({ error: "League is full" }, { status: 400 });
  }

  const existing = await prisma.team.findUnique({
    where: { userId_leagueId: { userId: dbUser.id, leagueId: league.id } },
  });
  if (existing) return Response.json({ error: "You are already in this league" }, { status: 400 });

  // Enforce private league cap
  const privateCount = await prisma.league.count({
    where: { type: "PRIVATE", teams: { some: { userId: dbUser.id } } },
  });
  if (privateCount >= 10) {
    return Response.json({ error: "Maximum 10 private leagues reached" }, { status: 400 });
  }

  await prisma.team.create({
    data: { name: teamName, userId: dbUser.id, leagueId: league.id },
  });

  return Response.json({ leagueId: league.id }, { status: 201 });
}
