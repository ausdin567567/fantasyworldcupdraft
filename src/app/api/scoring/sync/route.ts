import { prisma } from "@/lib/prisma";
import { syncMatchStats } from "@/lib/scoring-engine";
import { NextRequest } from "next/server";

// Called by a cron job every ~60s during active match windows
// Protected by a secret header
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const liveMatches = await prisma.match.findMany({
    where: { status: "LIVE" },
  });

  const results = await Promise.allSettled(
    liveMatches
      .filter((m) => m.apiMatchId !== null)
      .map((m) => syncMatchStats(m.apiMatchId!))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return Response.json({ synced: succeeded, failed, total: liveMatches.length });
}
