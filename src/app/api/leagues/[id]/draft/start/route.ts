import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;
  const dbUser = await getDbUser();
  if (!dbUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const draft = await prisma.draft.findFirst({
    where: { leagueId, status: "SCHEDULED" },
    orderBy: { createdAt: "desc" },
  });
  if (!draft) return Response.json({ error: "No scheduled draft found" }, { status: 404 });

  if (new Date() < draft.scheduledAt) {
    return Response.json({ error: "Draft time has not arrived yet" }, { status: 400 });
  }

  const updated = await prisma.draft.update({
    where: { id: draft.id },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });

  await prisma.league.update({
    where: { id: leagueId },
    data: { status: "DRAFTING" },
  });

  return Response.json({ draft: updated });
}
