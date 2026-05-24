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

// GET — return full watchlist with player details, ordered by priority
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const ctx = await resolveTeam(leagueId);
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.watchlist.findMany({
    where: { teamId: ctx.team.id },
    include: { player: true },
    orderBy: { priority: "asc" },
  });

  return Response.json({
    watchlist: items.map((w) => ({
      playerId: w.playerId,
      priority: w.priority,
      player: w.player,
    })),
  });
}

// POST — add a player to watchlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const ctx = await resolveTeam(leagueId);
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { playerId } = await request.json();

  // Idempotent: skip if already watchlisted
  const existing = await prisma.watchlist.findUnique({
    where: { teamId_playerId: { teamId: ctx.team.id, playerId } },
  });
  if (existing) return Response.json({ entry: existing }, { status: 200 });

  const count = await prisma.watchlist.count({ where: { teamId: ctx.team.id } });
  const entry = await prisma.watchlist.create({
    data: { teamId: ctx.team.id, userId: ctx.userId, playerId, priority: count + 1 },
  });

  return Response.json({ entry }, { status: 201 });
}

// DELETE — remove a player from watchlist
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

// PATCH — reorder watchlist by providing the new ordered array of playerIds
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const ctx = await resolveTeam(leagueId);
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { order } = await request.json() as { order: string[] };
  if (!Array.isArray(order)) {
    return Response.json({ error: "order must be an array of playerIds" }, { status: 400 });
  }

  // Update each entry's priority in a single transaction
  await prisma.$transaction(
    order.map((playerId, i) =>
      prisma.watchlist.updateMany({
        where: { teamId: ctx.team.id, playerId },
        data: { priority: i + 1 },
      })
    )
  );

  return Response.json({ success: true });
}
