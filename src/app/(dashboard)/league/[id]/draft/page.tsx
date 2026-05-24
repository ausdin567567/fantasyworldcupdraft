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

type WatchlistEntry = {
  playerId: string;
  priority: number;
  player: Player;
};

type Draft = {
  id: string;
  status: string;
  scheduledAt: string;
  draftOrder: string[];
  currentRound: number;
  picks: DraftPick[];
};

const POSITION_ORDER: Position[] = ["GK", "DEF", "MID", "FWD"];
const POSITION_COLORS: Record<Position, string> = {
  GK: "bg-yellow-100 text-yellow-800",
  DEF: "bg-blue-100 text-blue-800",
  MID: "bg-green-100 text-green-800",
  FWD: "bg-red-100 text-red-800",
};

// ─── Countdown component ───────────────────────────────────────────────────────

function Countdown({ target, onComplete }: { target: Date; onComplete: () => void }) {
  const [diff, setDiff] = useState(target.getTime() - Date.now());

  useEffect(() => {
    if (diff <= 0) { onComplete(); return; }
    const t = setInterval(() => {
      const remaining = target.getTime() - Date.now();
      setDiff(remaining);
      if (remaining <= 0) { clearInterval(t); onComplete(); }
    }, 1000);
    return () => clearInterval(t);
  }, [target, onComplete, diff]);

  const total = Math.max(0, Math.floor(diff / 1000));
  const days    = Math.floor(total / 86400);
  const hours   = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-3">
      {days > 0 && (
        <Unit value={pad(days)} label="Days" />
      )}
      <Unit value={pad(hours)} label="Hours" />
      <Colon />
      <Unit value={pad(minutes)} label="Mins" />
      <Colon />
      <Unit value={pad(seconds)} label="Secs" />
    </div>
  );
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl font-mono font-bold text-white tabular-nums">{value}</span>
      <span className="text-xs text-green-200 uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
}

function Colon() {
  return <span className="text-4xl font-bold text-green-300 mb-4">:</span>;
}

// ─── Schedule form ─────────────────────────────────────────────────────────────

function ScheduleForm({ leagueId, onScheduled }: { leagueId: string; onScheduled: () => void }) {
  const [dateTime, setDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/leagues/${leagueId}/draft/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: new Date(dateTime).toISOString() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    onScheduled();
  }

  // Default to 1 hour from now
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString().slice(0, 16);

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/80 mb-1">
          Draft Date & Time
        </label>
        <input
          type="datetime-local"
          required
          min={minDateTime}
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="w-full px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 scheme-dark"
        />
      </div>
      {error && <p className="text-red-300 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || !dateTime}
        className="w-full py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-lg transition disabled:opacity-50"
      >
        {loading ? "Scheduling..." : "Schedule Draft"}
      </button>
    </form>
  );
}

// ─── Main Draft Room ───────────────────────────────────────────────────────────

export default function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = use(params);
  const [players, setPlayers] = useState<Player[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [timer, setTimer] = useState(90);
  const [pickTimerMax, setPickTimerMax] = useState(90);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<Position | "ALL">("ALL");
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const picks = draft?.picks ?? [];
  const draftOrder = (draft?.draftOrder ?? []) as string[];
  const draftStatus = draft?.status ?? "NONE";

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
    const data = await res.json();
    setDraft(data.draft);
    setTeams(data.league?.teams ?? []);
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
      const leagueRes = await fetch(`/api/leagues/${leagueId}/info`);
      if (leagueRes.ok) {
        const leagueData = await leagueRes.json();
        setIsAdmin(leagueData.adminId === leagueData.myUserId);
      }
    });

    const interval = setInterval(fetchDraft, 3000);
    return () => clearInterval(interval);
  }, [leagueId, fetchDraft, fetchPlayers]);

  // Pick timer countdown
  useEffect(() => {
    if (draftStatus !== "IN_PROGRESS") return;
    setTimer(pickTimerMax);
    const t = setInterval(() => {
      setTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [totalPicks, draftStatus, pickTimerMax]);

  async function handleDraftStarted() {
    const res = await fetch(`/api/leagues/${leagueId}/draft/start`, { method: "POST" });
    if (res.ok) fetchDraft();
  }

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
    const existing = watchlist.find((w) => w.playerId === playerId);
    if (existing) {
      setWatchlist((prev) => prev.filter((w) => w.playerId !== playerId));
      await fetch(`/api/leagues/${leagueId}/watchlist`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
    } else {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;
      const newEntry: WatchlistEntry = { playerId, priority: watchlist.length + 1, player };
      setWatchlist((prev) => [...prev, newEntry]);
      await fetch(`/api/leagues/${leagueId}/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
    }
  }

  async function moveWatchlistUp(index: number) {
    if (index === 0) return;
    const next = [...watchlist];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setWatchlist(next);
    await fetch(`/api/leagues/${leagueId}/watchlist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((w) => w.playerId) }),
    });
  }

  async function moveWatchlistDown(index: number) {
    if (index >= watchlist.length - 1) return;
    const next = [...watchlist];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setWatchlist(next);
    await fetch(`/api/leagues/${leagueId}/watchlist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((w) => w.playerId) }),
    });
  }

  const draftedIds = new Set(picks.map((p) => p.player.id));
  const myPicks = picks.filter((p) => p.team.id === myTeamId);
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
  const scheduledAt = draft?.scheduledAt ? new Date(draft.scheduledAt) : null;

  // ── Pre-draft: no draft scheduled yet ─────────────────────────────────────
  if (draftStatus === "NONE" || !draft) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-green-800 rounded-2xl p-8 text-center shadow-xl">
          <div className="text-5xl mb-4">⚽</div>
          <h2 className="text-2xl font-bold text-white mb-2">Draft Not Scheduled</h2>
          <p className="text-green-200 text-sm mb-6">
            {isAdmin
              ? "As league admin, set a date and time for the draft."
              : "Waiting for the league admin to schedule the draft."}
          </p>
          {isAdmin && (
            <ScheduleForm leagueId={leagueId} onScheduled={fetchDraft} />
          )}
        </div>
      </div>
    );
  }

  // ── Pre-draft: scheduled, showing countdown ────────────────────────────────
  if (draftStatus === "SCHEDULED" && scheduledAt) {
    return (
      <div className="space-y-6">
        <div className="bg-linear-to-br from-green-800 to-green-900 rounded-2xl p-8 text-center shadow-xl">
          <p className="text-green-300 text-sm font-semibold uppercase tracking-widest mb-2">
            Draft starts in
          </p>
          <Countdown
            target={scheduledAt}
            onComplete={handleDraftStarted}
          />
          <p className="text-green-200 text-sm mt-4">
            {scheduledAt.toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>

          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-green-300 text-xs mb-3">Reschedule draft</p>
              <ScheduleForm leagueId={leagueId} onScheduled={fetchDraft} />
            </div>
          )}
        </div>

        {/* Draft order preview */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Draft Order</h3>
          <div className="space-y-2">
            {draftOrder.map((teamId, i) => {
              const t = teams.find((t) => t.id === teamId);
              return (
                <div key={teamId} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="font-medium text-gray-900">{t?.name}</span>
                  <span className="text-gray-400 text-xs">@{t?.user.username}</span>
                  {t?.id === myTeamId && (
                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">You</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Watchlist builder */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Build Your Watchlist</h3>
          <p className="text-xs text-gray-400 mb-3">Add players to your watchlist — they&apos;ll be auto-drafted if you miss your pick.</p>
          <div className="flex gap-2 mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {(["ALL", ...POSITION_ORDER] as const).map((pos) => (
              <button key={pos} onClick={() => setPosFilter(pos)}
                className={`px-2 py-1 text-xs rounded transition ${posFilter === pos ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600"}`}>
                {pos}
              </button>
            ))}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {filteredPlayers.slice(0, 50).map((player) => (
              <div key={player.id} className="flex items-center gap-3 py-2">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${POSITION_COLORS[player.position]}`}>
                  {player.position}
                </span>
                <span className="text-sm text-gray-800 flex-1">{player.name}</span>
                <span className="text-xs text-gray-400">{player.countryCode}</span>
                <button onClick={() => toggleWatchlist(player.id)}
                  className={`text-xs px-2 py-1 rounded transition ${watchlist.some((w) => w.playerId === player.id) ? "bg-yellow-100 text-yellow-700 font-medium" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {watchlist.some((w) => w.playerId === player.id) ? "★" : "☆"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Draft completed ────────────────────────────────────────────────────────
  if (draftStatus === "COMPLETED") {
    return (
      <div className="bg-green-800 rounded-2xl p-8 text-center shadow-xl">
        <div className="text-5xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-white mb-2">Draft Complete!</h2>
        <p className="text-green-200">All {picks.length} picks have been made. Good luck this tournament!</p>
      </div>
    );
  }

  // ── Draft in progress ──────────────────────────────────────────────────────
  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
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
                <button key={pos} onClick={() => setPosFilter(pos)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition ${posFilter === pos ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredPlayers.map((player) => (
            <div key={player.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition">
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
                <button onClick={() => toggleWatchlist(player.id)}
                  className={`text-xs px-2 py-1 rounded transition ${watchlist.some((w) => w.playerId === player.id) ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {watchlist.some((w) => w.playerId === player.id) ? "★" : "☆"}
                </button>
                <button onClick={() => makePick(player.id)} disabled={!isMyTurn || loading}
                  className="text-xs px-3 py-1.5 bg-green-700 text-white rounded-lg disabled:opacity-40 hover:bg-green-800 transition disabled:cursor-not-allowed">
                  Draft
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Status + My Squad */}
      <div className="w-80 flex flex-col gap-4">
        {/* Pick timer */}
        <div className={`rounded-xl p-4 text-center shadow-sm ${isMyTurn ? "bg-green-700 text-white" : "bg-white border border-gray-100"}`}>
          <p className={`text-sm ${isMyTurn ? "text-green-100" : "text-gray-500"}`}>
            Round {round} · Pick {totalPicks + 1}
          </p>
          <p className={`font-bold text-lg mt-1 ${isMyTurn ? "text-white" : "text-gray-800"}`}>
            {isMyTurn ? "YOUR PICK!" : `${currentPicker?.name ?? "..."}'s turn`}
          </p>
          <div className={`mt-2 text-4xl font-mono font-bold tabular-nums ${timer <= 10 ? "text-red-400" : isMyTurn ? "text-green-100" : "text-gray-700"}`}>
            {String(Math.floor(timer / 60)).padStart(2, "0")}:{String(timer % 60).padStart(2, "0")}
          </div>
          {/* Timer bar */}
          <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timer <= 10 ? "bg-red-400" : "bg-green-300"}`}
              style={{ width: `${(timer / pickTimerMax) * 100}%` }}
            />
          </div>
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
                  {t?.id === myTeamId && <span className="text-gray-400">(you)</span>}
                  {isNext && <span className="ml-auto text-green-600">▶</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Watchlist */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-sm text-gray-800">
              Watchlist
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                ({watchlist.filter((w) => !draftedIds.has(w.playerId)).length})
              </span>
            </p>
            <span className="text-xs text-gray-400">auto-drafts if you miss</span>
          </div>
          {watchlist.filter((w) => !draftedIds.has(w.playerId)).length === 0 ? (
            <p className="text-xs text-gray-400">
              ☆ Star players in the pool to queue them up
            </p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {watchlist
                .filter((w) => !draftedIds.has(w.playerId))
                .map((w, i, arr) => (
                  <div key={w.playerId} className="flex items-center gap-1.5 text-xs group">
                    <span className="text-gray-300 w-4 text-right tabular-nums">{i + 1}</span>
                    <span className={`px-1 py-0.5 rounded font-medium text-[10px] ${POSITION_COLORS[w.player.position]}`}>
                      {w.player.position}
                    </span>
                    <span className="text-gray-800 truncate flex-1 text-xs">{w.player.name}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveWatchlistUp(watchlist.findIndex((e) => e.playerId === w.playerId))}
                        disabled={i === 0}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                        title="Move up"
                      >↑</button>
                      <button
                        onClick={() => moveWatchlistDown(watchlist.findIndex((e) => e.playerId === w.playerId))}
                        disabled={i === arr.length - 1}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                        title="Move down"
                      >↓</button>
                      <button
                        onClick={() => toggleWatchlist(w.playerId)}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 text-gray-300 hover:text-red-400"
                        title="Remove"
                      >✕</button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
