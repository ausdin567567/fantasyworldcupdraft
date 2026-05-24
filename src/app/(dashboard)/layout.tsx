import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Trophy, Users, Home, ClipboardList } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-green-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <Trophy size={22} /> Fantasy World Cup 2026
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-green-200 transition">
              <Home size={16} /> Dashboard
            </Link>
            <Link href="/leagues" className="flex items-center gap-1 hover:text-green-200 transition">
              <Users size={16} /> Leagues
            </Link>
            <Link href="/mock-draft" className="flex items-center gap-1 hover:text-green-200 transition">
              <ClipboardList size={16} /> Mock Draft
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="flex items-center gap-1 hover:text-green-200 transition">
                <LogOut size={16} /> Sign Out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
