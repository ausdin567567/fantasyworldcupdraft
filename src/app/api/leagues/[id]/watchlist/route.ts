import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

async function resolveTeam(leagueId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return null;
  return prisma.team.findUnique({
    where: { userId_leagueId: { userId: dbUser.id, leagueId } },
  }).then((team) => (team ? { team, userId: dbUser.id } : null));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const ctx = await resolveTeam(leagueId);
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { playerId } = await request.json();

  const count = await prisma.watchlist.count({ where: { teamId: ctx.team.id } });
  const entry = await prisma.watchlist.create({
    data: { teamId: ctx.team.id, userId: ctx.userId, playerId, priority: count + 1 },
  });

  return Response.json({ entry }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const ctx = await resolveTeam(leagueId);
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { playerId } = await request.json();

  await prisma.watchlist.deleteMany({
    where: { teamId: ctx.team.id, playerId },
  });

  return Response.json({ success: true });
}
