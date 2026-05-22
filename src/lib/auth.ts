import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

/**
 * Gets the current user's DB record, creating it if it doesn't exist yet.
 * This handles cases where Supabase auth succeeded but the DB record wasn't created.
 */
export async function getDbUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const existing = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (existing) return existing;

  // Auto-create the DB record using data from Supabase auth
  const email = user.email!;
  const username = user.user_metadata?.username
    || email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20)
    || `user_${user.id.slice(0, 8)}`;

  // Handle duplicate usernames by appending a random suffix
  try {
    return await prisma.user.create({
      data: { supabaseId: user.id, email, username },
    });
  } catch {
    return await prisma.user.create({
      data: {
        supabaseId: user.id,
        email,
        username: `${username}_${Math.random().toString(36).slice(2, 6)}`,
      },
    });
  }
}
