"use client";

import { useEffect, useState, useCallback, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Position } from "@prisma/client";

type Player = {
  id: string;
  name: string;
  position: Position;
  countryCode: string;
  clubTeam: string | null;
  status: string;
};

type DraftPick = {
  id: string;
  round: number;
  pick: number;
  player: Player;
  team: { id: string; name: string; user: { username: string } };
};

type Team = {
  id: string;
  name: string;
  user: { username: string };
};

const POSITION_ORDER: Position[] = ["GK", "DEF", "MID", "FWD"];
const POSITION_COLORS: Record<Position, string> = {
  GK: "bg-yellow-100 text-yellow-800",
  DEF: "bg-blue-100 text-blue-800",
  MID: "bg-green-100 text-green-800",
  FWD: "bg-red-100 text-red-800",
};

export default function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = use(params);
  const [players, setPlayers] = useState<Player[]>([]);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [draftOrder, setDraftOrder] = useState<string[]>([]);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [timer, setTimer] = useState(90);
  const [pickTimerMax, setPickTimerMax] = useState(90);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<Position | "ALL">("ALL");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [draftStatus, setDraftStatus] = useState<string>("SCHEDULED");
  const [loading, setLoading] = useState(false);

  const totalPicks = picks.length;
  const teamsCount = draftOrder.length;
  const round = teamsCount > 0 ? Math.floor(totalPicks / teamsCount) + 1 : 1;
  const pickInRound = teamsCount > 0 ? totalPicks % teamsCount : 0;
  const roundOrder = round % 2 === 1 ? draftOrder : [...draftOrder].reverse();
  const currentTeamId = roundOrder[pickInRound] ?? null;
  const isMyTurn = currentTeamId === myTeamId;

  const fetchDraft = useCallback(async () => {
    const res = await fetch(`/api/draft/${leagueId}`);
    if (!res.ok) return;
    const { draft, league } = await res.json();
    setPicks(draft.picks ?? []);
    setDraftOrder(draft.draftOrder ?? []);
    setDraftStatus(draft.status);
    setTeams(league.teams ?? []);
  }, [leagueId]);

  const fetchPlayers = useCallback(async () => {
    const res = await fetch(`/api/players?status=AVAILABLE`);
    if (res.ok) {
      const data = await res.json();
      setPlayers(data.players);
    }
  }, []);

  useEffect(() => {
    fetchDraft();
    fetchPlayers();

    // Identify current user's team
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const res = await fetch(`/api/leagues/${leagueId}/myteam`);
      if (res.ok) {
        const data = await res.json();
        setMyTeamId(data.teamId);
        setPickTimerMax(data.pickTimerSeconds ?? 90);
        setWatchlist(data.watchlist ?? []);
      }
    });

    // Poll for updates every 3s during draft
    const interval = setInterval(fetchDraft, 3000);
    return () => clearInterval(interval);
  }, [leagueId, fetchDraft, fetchPlayers]);

  // Timer countdown
  useEffect(() => {
    if (draftStatus !== "IN_PROGRESS") return;
    setTimer(pickTimerMax);
    const t = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [totalPicks, draftStatus, pickTimerMax]);

  async function makePick(playerId: string) {
    if (!isMyTurn || loading) return;
    setLoading(true);
    await fetch(`/api/draft/${leagueId}/pick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    await fetchDraft();
    await fetchPlayers();
    setLoading(false);
  }

  async function toggleWatchlist(playerId: string) {
    const isIn = watchlist.includes(playerId);
    setWatchlist(isIn ? watchlist.filter((id) => id !== playerId) : [...watchlist, playerId]);
    await fetch(`/api/leagues/${leagueId}/watchlist`, {
      method: isIn ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
  }

  const draftedIds = new Set(picks.map((p) => p.player.id));
  const myPicks = picks.filter((p) => p.teamId === myTeamId);
  const myPositionCounts = myPicks.reduce((acc, p) => {
    acc[p.player.position] = (acc[p.player.position] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredPlayers = players.filter((p) => {
    if (draftedIds.has(p.id)) return false;
    if (posFilter !== "ALL" && p.position !== posFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.countryCode.toLowerCase().includes(search.toLowerCase()) &&
      !(p.clubTeam ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const currentPicker = teams.find((t) => t.id === currentTeamId);

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left: Player Pool */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-1">
              {(["ALL", ...POSITION_ORDER] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosFilter(pos)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition ${
                    posFilter === pos ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${POSITION_COLORS[player.position]}`}>
                  {player.position}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{player.name}</p>
                  <p className="text-xs text-gray-400">{player.countryCode} · {player.clubTeam}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleWatchlist(player.id)}
                  className={`text-xs px-2 py-1 rounded transition ${
                    watchlist.includes(player.id) ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {watchlist.includes(player.id) ? "★ Watchlist" : "☆ Watch"}
                </button>
                <button
                  onClick={() => makePick(player.id)}
                  disabled={!isMyTurn || loading}
                  className="text-xs px-3 py-1.5 bg-green-700 text-white rounded-lg disabled:opacity-40 hover:bg-green-800 transition disabled:cursor-not-allowed"
                >
                  Draft
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Draft Status + My Squad */}
      <div className="w-80 flex flex-col gap-4">
        {/* Current Pick Banner */}
        <div className={`rounded-xl p-4 text-center shadow-sm ${isMyTurn ? "bg-green-700 text-white" : "bg-white border border-gray-100"}`}>
          {draftStatus === "SCHEDULED" ? (
            <p className="font-semibold text-gray-600">Draft has not started yet</p>
          ) : draftStatus === "COMPLETED" ? (
            <p className="font-semibold text-gray-600">Draft Complete!</p>
          ) : (
            <>
              <p className={`text-sm ${isMyTurn ? "text-green-100" : "text-gray-500"}`}>
                Round {round} · Pick {totalPicks + 1}
              </p>
              <p className={`font-bold text-lg mt-1 ${isMyTurn ? "text-white" : "text-gray-800"}`}>
                {isMyTurn ? "YOUR PICK!" : `${currentPicker?.name ?? "..."}'s turn`}
              </p>
              <div className={`mt-2 text-2xl font-mono font-bold ${timer <= 10 ? "text-red-400" : isMyTurn ? "text-green-100" : "text-gray-700"}`}>
                {timer}s
              </div>
            </>
          )}
        </div>

        {/* My Squad */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <p className="font-semibold text-sm text-gray-800">My Squad ({myPicks.length}/15)</p>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            {POSITION_ORDER.map((pos) => {
              const posPicks = myPicks.filter((p) => p.player.position === pos);
              return (
                <div key={pos}>
                  <p className="text-xs font-medium text-gray-400 px-1 mt-2 mb-1">
                    {pos} ({myPositionCounts[pos] ?? 0})
                  </p>
                  {posPicks.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${POSITION_COLORS[pos]}`}>{pos}</span>
                      <span className="text-sm text-gray-800 truncate">{p.player.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{p.player.countryCode}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Draft Order */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <p className="font-semibold text-sm text-gray-800 mb-2">Draft Order</p>
          <div className="space-y-1">
            {draftOrder.map((teamId, i) => {
              const t = teams.find((t) => t.id === teamId);
              const isNext = roundOrder[pickInRound] === teamId;
              return (
                <div key={teamId} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${isNext ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600"}`}>
                  <span className="text-gray-400 w-4">{i + 1}.</span>
                  <span className="truncate">{t?.name ?? teamId}</span>
                  {isNext && <span className="ml-auto text-green-600">▶</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
