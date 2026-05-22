import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Trophy, Plus, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user!.id },
    include: {
      teams: {
        include: {
          league: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const activeGameweek = await prisma.gameweek.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { startDate: "asc" },
  });

  const nextGameweek = await prisma.gameweek.findFirst({
    where: { status: "UPCOMING" },
    orderBy: { startDate: "asc" },
  });

  const currentGw = activeGameweek ?? nextGameweek;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {dbUser?.username ?? "Manager"}
          </h1>
          {currentGw && (
            <p className="text-sm text-gray-500 mt-1">
              {currentGw.status === "ACTIVE" ? "Current" : "Next"}: {currentGw.name}
              {" · "}Deadline:{" "}
              {new Date(currentGw.deadline).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <Link
          href="/leagues"
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition"
        >
          <Plus size={16} /> Join / Create League
        </Link>
      </div>

      {/* My Teams */}
      {dbUser?.teams && dbUser.teams.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">My Teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dbUser.teams.map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{team.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{team.league.name}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      team.league.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : team.league.status === "DRAFTING"
                        ? "bg-yellow-100 text-yellow-700"
                        : team.league.status === "COMPLETE"
                        ? "bg-gray-100 text-gray-500"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {team.league.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Trophy size={14} /> {team.totalPoints} pts
                  </span>
                  <Link
                    href={`/league/${team.leagueId}/squad`}
                    className="flex items-center gap-1 text-green-700 font-medium hover:underline"
                  >
                    Manage <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Trophy size={40} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No leagues yet</h3>
          <p className="text-gray-400 text-sm mt-1 mb-6">
            Create a private league, join one with a code, or enter a public league.
          </p>
          <Link
            href="/leagues"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white font-medium rounded-lg hover:bg-green-800 transition"
          >
            <Plus size={16} /> Get Started
          </Link>
        </div>
      )}
    </div>
  );
}
