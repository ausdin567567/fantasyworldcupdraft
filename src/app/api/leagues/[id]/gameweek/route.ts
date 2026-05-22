import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // leagueId not needed for gameweek lookup

  const now = new Date();
  const activeGw = await prisma.gameweek.findFirst({
    where: { status: { in: ["UPCOMING", "ACTIVE"] } },
    orderBy: { startDate: "asc" },
  });

  if (!activeGw) return Response.json({ mode: "none" });

  const freeAgencyStart = new Date(activeGw.deadline.getTime() - 24 * 60 * 60 * 1000);
  const mode =
    now >= freeAgencyStart && now < activeGw.deadline
      ? "free"
      : now < activeGw.waiverDeadline
      ? "waiver"
      : "none";

  return Response.json({ mode, gameweek: activeGw });
}
