import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { supabaseId, email, username } = await request.json();

  if (!supabaseId || !email || !username) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: { supabaseId, email, username },
    });
    return Response.json({ user }, { status: 201 });
  } catch {
    return Response.json({ error: "Username or email already taken" }, { status: 409 });
  }
}
