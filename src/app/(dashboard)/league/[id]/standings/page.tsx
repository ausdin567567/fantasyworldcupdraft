import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      teams: {
        include: {
          user: true,
          gameweekScores: {
            include: { gameweek: true },
            orderBy: { gameweek: { startDate: "asc" } },
          },
        },
      },
    },
  });

  if (!league) redirect("/dashboard");

  const isH2H = league.scoringType === "HEAD_TO_HEAD";

  const sorted = [...league.teams].sort((a, b) => {
    if (isH2H) {
      if (b.h2hPoints !== a.h2hPoints) return b.h2hPoints - a.h2hPoints;
      return b.totalPoints - a.totalPoints;
    }
    return b.totalPoints - a.totalPoints;
  });

  const gameweeks = await prisma.gameweek.findMany({
    where: { status: { in: ["ACTIVE", "COMPLETE"] } },
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Standings — {league.name}</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {isH2H ? "Head-to-Head" : "Classic"}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 w-8">#</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Team</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Manager</th>
              {isH2H && (
                <>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600">W</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600">D</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600">L</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600">H2H Pts</th>
                </>
              )}
              {gameweeks.map((gw: { id: string; round: string }) => (
                <th key={gw.id} className="text-center px-2 py-3 font-semibold text-gray-600 text-xs">
                  {gw.round.replace("GROUP_", "MD").replace("_", " ").replace("ROUND_OF_32", "R32").replace("ROUND_OF_16", "R16").replace("QUARTERFINAL", "QF").replace("SEMIFINAL", "SF").replace("THIRD_PLACE_FINAL", "3P")}
                </th>
              ))}
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((team, i) => {
              return (
                <tr key={team.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{team.name}</td>
                  <td className="px-4 py-3 text-gray-500">{team.user.username}</td>
                  {isH2H && (
                    <>
                      <td className="px-3 py-3 text-center text-green-600 font-medium">{team.h2hWins}</td>
                      <td className="px-3 py-3 text-center text-gray-500">{team.h2hDraws}</td>
                      <td className="px-3 py-3 text-center text-red-500">{team.h2hLosses}</td>
                      <td className="px-3 py-3 text-center font-bold text-gray-900">{team.h2hPoints}</td>
                    </>
                  )}
                  {gameweeks.map((gw: { id: string; round: string }) => {
                    const score = team.gameweekScores.find((s: { gameweekId: string; points: number }) => s.gameweekId === gw.id);
                    return (
                      <td key={gw.id} className="px-2 py-3 text-center text-gray-600">
                        {score?.points ?? "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center font-bold text-gray-900">
                    {team.totalPoints}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
