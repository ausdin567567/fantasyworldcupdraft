import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;

  const draft = await prisma.draft.findFirst({
    where: { leagueId, status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
    include: {
      picks: {
        include: { player: true, team: true },
        orderBy: [{ round: "asc" }, { pick: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!draft) return Response.json({ error: "No active draft" }, { status: 404 });

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: { teams: { include: { user: true } } },
  });

  return Response.json({ draft, league });
}
