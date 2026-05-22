import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: leagueId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (!league) redirect("/dashboard");

  const tabs = [
    { href: `/league/${leagueId}/squad`, label: "My Squad" },
    { href: `/league/${leagueId}/draft`, label: "Draft Room" },
    { href: `/league/${leagueId}/transfers`, label: "Transfers" },
    { href: `/league/${leagueId}/standings`, label: "Standings" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{league.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {league.scoringType === "HEAD_TO_HEAD" ? "Head-to-Head" : "Classic"} ·{" "}
          {league.type === "PRIVATE" ? `Code: ${league.inviteCode}` : "Public League"}
        </p>
      </div>
      <nav className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-green-700 border-b-2 border-transparent hover:border-green-700 transition -mb-px"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
