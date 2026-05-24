import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { Position, PlayerStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as PlayerStatus | null;
  const position = searchParams.get("position") as Position | null;
  const country = searchParams.get("country");
  const search = searchParams.get("search");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 200, 500) : 200;

  const players = await prisma.player.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(position ? { position } : {}),
      ...(country ? { countryCode: country } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { countryCode: { contains: search, mode: "insensitive" } },
              { clubTeam: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { country: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    take: limit,
  });

  return Response.json({ players });
}
