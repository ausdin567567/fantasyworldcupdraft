import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { Position } from "@prisma/client";

const SQUAD_LIMITS: Record<Position, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const TOTAL_ROUNDS = 15;

/**
 * Checks whether the current pick timer has expired and, if so, auto-picks
 * for the team whose clock ran out. Uses the team's watchlist (in priority
 * order) as the first source, then falls back to the best available player.
 *
 * Returns true if a pick was made (caller should re-fetch the draft).
 */
async function maybeAutoPick(
  draft: Awaited<ReturnType<typeof fetchDraft>>,
  leagueId: string,
  pickTimerSeconds: number
): Promise<boolean> {
  if (!draft || draft.status !== "IN_PROGRESS") return false;

  const draftOrder = draft.draftOrder as string[];
  const totalPicks = draft.picks.length;
  const teamsCount = draftOrder.length;

  if (teamsCount === 0 || totalPicks >= TOTAL_ROUNDS * teamsCount) return false;

  // Clock for the current pick started when the draft began (first pick)
  // or when the last pick was made.
  const lastPickTime =
    totalPicks > 0
      ? draft.picks[totalPicks - 1].pickedAt   // picks ordered asc
      : draft.startedAt;

  if (!lastPickTime) return false;

  const deadline = new Date(lastPickTime.getTime() + pickTimerSeconds * 1000);
  if (Date.now() <= deadline.getTime()) return false;

  // Timer expired — determine who should be picking
  const round = Math.floor(totalPicks / teamsCount) + 1;
  const pickInRound = totalPicks % teamsCount;
  const roundOrder = round % 2 === 1 ? draftOrder : [...draftOrder].reverse();
  const currentTeamId = roundOrder[pickInRound];

  const draftedIds = new Set(draft.picks.map((p) => p.playerId));
  const teamPicks = draft.picks.filter((p) => p.teamId === currentTeamId);

  if (teamPicks.length >= TOTAL_ROUNDS) return false;

  // Position counts for this team
  const posCounts: Partial<Record<Position, number>> = {};
  for (const p of teamPicks) {
    posCounts[p.player.position] = (posCounts[p.player.position] ?? 0) + 1;
  }

  const neededPositions = (["GK", "DEF", "MID", "FWD"] as Position[]).filter(
    (pos) => (posCounts[pos] ?? 0) < SQUAD_LIMITS[pos]
  );
  if (neededPositions.length === 0) return false;

  // 1. Try watchlist in priority order
  let pickedPlayerId: string | null = null;

  const watchlistEntries = await prisma.watchlist.findMany({
    where: { teamId: currentTeamId },
    include: { player: true },
    orderBy: { priority: "asc" },
  });

  for (const entry of watchlistEntries) {
    const pos = entry.player.position;
    if (
      !draftedIds.has(entry.playerId) &&
      neededPositions.includes(pos) &&
      (posCounts[pos] ?? 0) < SQUAD_LIMITS[pos]
    ) {
      pickedPlayerId = entry.playerId;
      break;
    }
  }

  // 2. Fallback: first available player that fills a needed position
  if (!pickedPlayerId) {
    const fallback = await prisma.player.findFirst({
      where: {
        id: { notIn: [...draftedIds] },
        position: { in: neededPositions },
        status: "AVAILABLE",
      },
    });
    pickedPlayerId = fallback?.id ?? null;
  }

  if (!pickedPlayerId) return false;

  try {
    await prisma.$transaction([
      prisma.draftPick.create({
        data: {
          draftId: draft.id,
          teamId: currentTeamId,
          playerId: pickedPlayerId,
          round,
          pick: totalPicks + 1,
        },
      }),
      prisma.teamPlayer.create({
        data: {
          teamId: currentTeamId,
          playerId: pickedPlayerId,
          acquisitionType: "DRAFT",
        },
      }),
      prisma.player.update({
        where: { id: pickedPlayerId },
        data: { status: "OWNED" },
      }),
    ]);

    // Remove the drafted player from every team's watchlist in this league
    await prisma.watchlist.deleteMany({
      where: { playerId: pickedPlayerId, team: { leagueId } },
    });

    // Mark draft complete if all picks are done
    const newTotal = totalPicks + 1;
    if (newTotal >= TOTAL_ROUNDS * teamsCount) {
      await prisma.draft.update({
        where: { id: draft.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      await prisma.league.update({
        where: { id: leagueId },
        data: { status: "ACTIVE" },
      });
    }

    return true;
  } catch {
    // Another client already made this pick (unique constraint violation) — ignore
    return false;
  }
}

async function fetchDraft(leagueId: string) {
  return prisma.draft.findFirst({
    where: {
      leagueId,
      status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
    },
    include: {
      picks: {
        include: { player: true, team: true },
        orderBy: [{ round: "asc" }, { pick: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;

  const [draft, league] = await Promise.all([
    fetchDraft(leagueId),
    prisma.league.findUnique({
      where: { id: leagueId },
      include: { teams: { include: { user: true } } },
    }),
  ]);

  if (!draft) return Response.json({ error: "No active draft" }, { status: 404 });

  // Auto-pick if the current pick timer has expired
  if (league && draft.status === "IN_PROGRESS") {
    const autoPickFired = await maybeAutoPick(draft, leagueId, league.pickTimerSeconds);
    if (autoPickFired) {
      // Return fresh state so the client immediately sees the new pick
      const updatedDraft = await prisma.draft.findUnique({
        where: { id: draft.id },
        include: {
          picks: {
            include: { player: true, team: true },
            orderBy: [{ round: "asc" }, { pick: "asc" }],
          },
        },
      });
      return Response.json({ draft: updatedDraft, league });
    }
  }

  return Response.json({ draft, league });
}
