"use client";

import { useEffect, useRef, useState } from "react";

type Position = "GK" | "DEF" | "MID" | "FWD";

type Player = {
  id: string;
  name: string;
  position: Position;
  countryCode: string;
  clubTeam: string | null;
};

type TeamData = {
  name: string;
  isCPU: boolean;
  players: Player[];
};

type PickRecord = {
  teamName: string;
  player: Player;
  pickNumber: number;
  round: number;
};

const POS_LIMITS: Record<Position, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
const ROUNDS = 15;
const CPU_DELAY = 1500;
const USER_TIMER = 60;

const POS_BG: Record<Position, string> = {
  GK: "bg-yellow-500", DEF: "bg-blue-500", MID: "bg-green-500", FWD: "bg-red-500",
};

const POS_HEX: Record<Position, string> = {
  GK: "#f5a623", DEF: "#4a90d9", MID: "#7ed321", FWD: "#d0021b",
};

const FLAGS: Record<string, string> = {
  ARG: "🇦🇷", BRA: "🇧🇷", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", FRA: "🇫🇷", ESP: "🇪🇸",
  GER: "🇩🇪", POR: "🇵🇹", NED: "🇳🇱", BEL: "🇧🇪", URU: "🇺🇾",
  COL: "🇨🇴", MAR: "🇲🇦", JAP: "🇯🇵", KOR: "🇰🇷", SEN: "🇸🇳",
  USA: "🇺🇸", MEX: "🇲🇽", CRO: "🇭🇷", ITA: "🇮🇹", AUS: "🇦🇺",
};

const TIER: Record<string, number> = {
  ARG: 1, BRA: 1, FRA: 1, ENG: 1, ESP: 1,
  GER: 2, POR: 2, NED: 2, BEL: 2, URU: 2,
  COL: 3, CRO: 3, ITA: 3, MEX: 3, USA: 3,
  MAR: 4, JAP: 4, KOR: 4, SEN: 4, AUS: 4,
};

const CPU_NAMES = [
  "FC Braindead", "Team Robot", "CPU United", "AI Athletic", "Digital FC",
  "Bot City", "Neural FC", "Algorithm SC", "Data FC", "Logic United",
  "Binary XI", "Pixel FC", "Code Athletic", "Script United", "Hash FC",
];

function MiniJersey({ player }: { player: Player }) {
  const color = POS_HEX[player.position];
  const flag = FLAGS[player.countryCode] ?? "🏳️";
  const shortName = player.name.split(" ").slice(-1)[0].slice(0, 9);
  return (
    <div className="flex flex-col items-center gap-0.5 w-12">
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-md">
          <path d="M15 18 L8 28 L16 30 L16 52 L44 52 L44 30 L52 28 L45 18 C42 20 38 22 30 22 C22 22 18 20 15 18Z" fill={color} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <path d="M22 18 Q30 24 38 18 Q34 14 30 14 Q26 14 22 18Z" fill={color} stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
          <path d="M15 18 L8 28 L16 30 L18 22Z" fill={color} opacity="0.85" />
          <path d="M45 18 L52 28 L44 30 L42 22Z" fill={color} opacity="0.85" />
          <path d="M22 22 Q30 26 38 22 L36 38 Q30 40 24 38Z" fill="rgba(255,255,255,0.1)" />
        </svg>
        <span className="absolute bottom-0 right-0 text-xs leading-none">{flag}</span>
      </div>
      <div className="bg-[#1a1a2e]/90 text-white text-[9px] font-bold px-1 py-0.5 rounded w-full text-center truncate leading-tight">
        {shortName}
      </div>
    </div>
  );
}

function EmptySlot({ pos }: { pos: Position }) {
  return (
    <div className="flex flex-col items-center gap-0.5 w-12">
      <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/25 flex items-center justify-center">
        <span className="text-white/35 text-[9px] font-bold">{pos}</span>
      </div>
      <div className="bg-black/20 text-white/30 text-[9px] px-1 py-0.5 rounded w-full text-center leading-tight">—</div>
    </div>
  );
}

function MiniPitch({ players }: { players: Player[] }) {
  const byPos: Record<Position, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  players.forEach((p) => byPos[p.position].push(p));
  const rows: { pos: Position; slots: number }[] = [
    { pos: "FWD", slots: 3 },
    { pos: "MID", slots: 5 },
    { pos: "DEF", slots: 5 },
    { pos: "GK",  slots: 2 },
  ];
  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #2d7a2d 0%, #3a8f3a 12.5%, #2d7a2d 12.5%, #2d7a2d 25%, #3a8f3a 25%, #3a8f3a 37.5%, #2d7a2d 37.5%, #2d7a2d 50%, #3a8f3a 50%, #3a8f3a 62.5%, #2d7a2d 62.5%, #2d7a2d 75%, #3a8f3a 75%, #3a8f3a 87.5%, #2d7a2d 87.5%)",
      }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 360" preserveAspectRatio="none">
        <circle cx="150" cy="180" r="38" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <line x1="0" y1="180" x2="300" y2="180" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <rect x="75" y="6" width="150" height="55" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <rect x="75" y="299" width="150" height="55" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <rect x="4" y="4" width="292" height="352" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
      </svg>
      <div className="relative z-10 py-3 px-2 space-y-2">
        {rows.map(({ pos, slots }) => (
          <div key={pos} className="flex justify-center gap-2">
            {Array.from({ length: slots }, (_, i) => {
              const player = byPos[pos][i];
              return player
                ? <MiniJersey key={player.id} player={player} />
                : <EmptySlot key={i} pos={pos} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function pickerIdx(pickNum: number, n: number) {
  const round = Math.floor((pickNum - 1) / n);
  const pos = (pickNum - 1) % n;
  return round % 2 === 0 ? pos : n - 1 - pos;
}

function autoPick(available: Player[], myPlayers: Player[]): Player | null {
  if (!available.length) return null;
  const counts: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  myPlayers.forEach((p) => counts[p.position]++);
  const remaining = Math.max(ROUNDS - myPlayers.length, 1);
  const needed = (["GK", "DEF", "MID", "FWD"] as Position[])
    .filter((pos) => counts[pos] < POS_LIMITS[pos])
    .sort((a, b) => {
      const uA = (POS_LIMITS[a] - counts[a]) / remaining;
      const uB = (POS_LIMITS[b] - counts[b]) / remaining;
      return uB - uA;
    });
  for (const pos of needed) {
    const cands = available
      .filter((p) => p.position === pos)
      .sort((a, b) => (TIER[a.countryCode] ?? 5) - (TIER[b.countryCode] ?? 5));
    if (cands.length) return cands[Math.floor(Math.random() * Math.min(3, cands.length))];
  }
  return available[0];
}

export default function MockDraftPage() {
  const [step, setStep] = useState<"setup" | "drafting" | "done">("setup");
  const [numTeams, setNumTeams] = useState(8);
  const [myPos, setMyPos] = useState(1);
  const [myName, setMyName] = useState("My Team");

  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [available, setAvailable] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [currentPick, setCurrentPick] = useState(1);
  const [history, setHistory] = useState<PickRecord[]>([]);
  const [timer, setTimer] = useState(USER_TIMER);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<Position | "ALL">("ALL");
  const [tab, setTab] = useState<"squad" | "teams" | "history">("squad");
  const [pickError, setPickError] = useState<string | null>(null);

  // Stable refs so effects always see current state
  const teamsRef = useRef<TeamData[]>([]);
  const availableRef = useRef<Player[]>([]);
  const currentPickRef = useRef(1);
  // Prevents race condition between timer auto-pick and manual click
  const isPickingRef = useRef(false);
  // Immediately tracks picked player IDs so concurrent CPU timeouts can't
  // both grab the same player before the available state update propagates
  const pickedIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => { teamsRef.current = teams; }, [teams]);
  useEffect(() => { availableRef.current = available; }, [available]);
  useEffect(() => { currentPickRef.current = currentPick; }, [currentPick]);

  useEffect(() => {
    setLoadingPlayers(true);
    fetch("/api/players?limit=500")
      .then((r) => r.json())
      .then((d) => { setAllPlayers(d.players ?? []); setLoadingPlayers(false); })
      .catch(() => setLoadingPlayers(false));
  }, []);

  // Always-fresh pick executor — reassigned every render
  const doPickRef = useRef<(teamIdx: number, player: Player) => void>(() => {});
  doPickRef.current = (teamIdx: number, player: Player) => {
    if (isPickingRef.current) return;
    // Guard against duplicate picks before state update propagates
    if (pickedIdsRef.current.has(player.id)) return;
    isPickingRef.current = true;
    pickedIdsRef.current.add(player.id);

    const team = teamsRef.current[teamIdx];
    if (!team || team.players.length >= ROUNDS) { isPickingRef.current = false; return; }
    const posCount = team.players.filter((p) => p.position === player.position).length;
    if (posCount >= POS_LIMITS[player.position]) { isPickingRef.current = false; return; }

    const pick = currentPickRef.current;
    const round = Math.floor((pick - 1) / numTeams) + 1;
    const teamName = team.name;
    setAvailable((prev) => prev.filter((p) => p.id !== player.id));
    setTeams((prev) =>
      prev.map((t, i) => i === teamIdx ? { ...t, players: [...t.players, player] } : t)
    );
    setHistory((prev) => [{ teamName, player, pickNumber: pick, round }, ...prev]);
    setCurrentPick((prev) => prev + 1);
    isPickingRef.current = false;
  };

  // Drive all pick logic from currentPick
  useEffect(() => {
    if (step !== "drafting") return;
    const total = numTeams * ROUNDS;
    if (currentPick > total) { setStep("done"); return; }

    const idx = pickerIdx(currentPick, numTeams);
    const isMe = idx === myPos - 1;

    if (!isMe) {
      const t = setTimeout(() => {
        // Filter against pickedIdsRef so two near-simultaneous timeouts
        // can't both claim the same player before state propagates
        const avail = availableRef.current.filter((p) => !pickedIdsRef.current.has(p.id));
        const pick = autoPick(avail, teamsRef.current[idx]?.players ?? []);
        if (pick) doPickRef.current(idx, pick);
      }, CPU_DELAY);
      return () => clearTimeout(t);
    } else {
      setTimer(USER_TIMER);
      // Use a local variable for the countdown so the auto-pick call never
      // happens inside a state-updater function (React 18 calls those twice
      // in dev/StrictMode, which would fire two picks).
      let timeLeft = USER_TIMER;
      const iv = setInterval(() => {
        timeLeft -= 1;
        setTimer(timeLeft);
        if (timeLeft <= 0) {
          clearInterval(iv);
          const avail = availableRef.current.filter((p) => !pickedIdsRef.current.has(p.id));
          const pick = autoPick(avail, teamsRef.current[myPos - 1]?.players ?? []);
          if (pick) doPickRef.current(myPos - 1, pick);
        }
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [currentPick, step, numTeams, myPos]);

  function startDraft() {
    pickedIdsRef.current = new Set();
    isPickingRef.current = false;
    const teamList: TeamData[] = Array.from({ length: numTeams }, (_, i) => ({
      name: i === myPos - 1 ? myName : CPU_NAMES[i % CPU_NAMES.length],
      isCPU: i !== myPos - 1,
      players: [],
    }));
    setTeams(teamList);
    setAvailable([...allPlayers]);
    setCurrentPick(1);
    setHistory([]);
    setTimer(USER_TIMER);
    setSearch("");
    setPosFilter("ALL");
    setTab("squad");
    setStep("drafting");
  }

  function handleUserPick(player: Player) {
    if (!isMyTurn) return;
    const team = teams[myPos - 1];
    if (!team || team.players.length >= ROUNDS) return;
    const posCount = team.players.filter((p) => p.position === player.position).length;
    if (posCount >= POS_LIMITS[player.position]) {
      setPickError(`Max ${POS_LIMITS[player.position]} ${player.position}s already drafted`);
      setTimeout(() => setPickError(null), 2500);
      return;
    }
    setPickError(null);
    doPickRef.current(myPos - 1, player);
  }

  const total = numTeams * ROUNDS;
  const myTeam = teams[myPos - 1];
  const currentPickerIdx = step === "drafting" && currentPick <= total ? pickerIdx(currentPick, numTeams) : -1;
  const isMyTurn = currentPickerIdx === myPos - 1 && (myTeam?.players.length ?? 0) < ROUNDS;
  const round = Math.floor((currentPick - 1) / numTeams) + 1;

  const filtered = available.filter((p) => {
    if (posFilter !== "ALL" && p.position !== posFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.countryCode.toLowerCase().includes(q) ||
        (p.clubTeam ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (step === "setup") {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-green-800 px-6 py-5">
            <h1 className="text-2xl font-bold text-white">Mock Draft</h1>
            <p className="text-green-200 text-sm mt-1">Practice your strategy against CPU opponents</p>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Your Team Name</label>
              <input
                type="text"
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="My Team"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Teams</label>
              <div className="flex gap-2 flex-wrap">
                {[4, 6, 8, 10, 12].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setNumTeams(n); if (myPos > n) setMyPos(n); }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${numTeams === n ? "bg-green-700 text-white border-green-700" : "border-gray-300 text-gray-600 hover:border-green-500"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Your Draft Position</label>
              <select
                value={myPos}
                onChange={(e) => setMyPos(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {Array.from({ length: numTeams }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Pick {i + 1}
                    {i === 0 ? " (1st overall)" : i === numTeams - 1 ? " (last)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Snake draft — your picks: {myPos}, {numTeams * 2 + 1 - myPos}, {numTeams * 2 + myPos}…
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
              <p>• {numTeams} teams · 15 rounds · snake draft</p>
              <p>• Squad: 2 GK · 5 DEF · 5 MID · 3 FWD</p>
              <p>• 60 seconds per pick, then auto-pick kicks in</p>
              <p>• {numTeams - 1} CPU opponents draft automatically</p>
            </div>
            <button
              onClick={startDraft}
              disabled={loadingPlayers || allPlayers.length === 0}
              className="w-full py-3 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 disabled:opacity-50 transition"
            >
              {loadingPlayers ? "Loading players…" : `Start Mock Draft (${allPlayers.length} players)`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  if (step === "done") {
    const byPos: Record<Position, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
    myTeam?.players.forEach((p) => byPos[p.position].push(p));
    return (
      <div className="max-w-2xl mx-auto mt-8 space-y-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-green-700 px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Draft Complete!</h1>
              <p className="text-green-200 text-sm mt-1">{myName} — your drafted squad</p>
            </div>
            <button
              onClick={() => setStep("setup")}
              className="px-4 py-2 bg-white text-green-800 text-sm font-bold rounded-lg hover:bg-green-50 transition"
            >
              Draft Again
            </button>
          </div>
          <div className="p-6 space-y-4">
            {(["GK", "DEF", "MID", "FWD"] as Position[]).map((pos) => (
              <div key={pos}>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{pos}</h3>
                <div className="space-y-1">
                  {byPos[pos].map((p) => (
                    <div key={p.id} className="flex items-center gap-3 py-1.5 px-3 bg-gray-50 rounded-lg">
                      <span className={`text-xs font-bold text-white px-2 py-0.5 rounded ${POS_BG[p.position]}`}>
                        {p.position}
                      </span>
                      <span className="text-base">{FLAGS[p.countryCode] ?? "🏳️"}</span>
                      <span className="text-sm font-semibold text-gray-900 flex-1">{p.name}</span>
                      <span className="text-xs text-gray-400">{p.clubTeam ?? p.countryCode}</span>
                    </div>
                  ))}
                  {byPos[pos].length === 0 && (
                    <p className="text-xs text-red-400 px-3">No {pos} drafted</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Drafting ───────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 10rem)" }}>
      {/* Left: Available players */}
      <div className="w-1/2 flex flex-col bg-white rounded-xl shadow overflow-hidden">
        <div className="p-3 border-b space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">Available ({available.length})</h2>
            {isMyTurn && (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold tabular-nums ${timer <= 10 ? "text-red-600" : "text-green-700"}`}>
                  {timer}s
                </span>
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${timer <= 10 ? "bg-red-500" : "bg-green-500"}`}
                    style={{ width: `${(timer / USER_TIMER) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players…"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <div className="flex gap-1">
            {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className={`flex-1 py-1 text-xs font-semibold rounded transition ${posFilter === pos ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {pos}
              </button>
            ))}
          </div>
          {pickError && (
            <p className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded px-2 py-1">
              {pickError}
            </p>
          )}
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.slice(0, 150).map((player) => (
            <div key={player.id} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 hover:bg-gray-50">
              <span className={`text-xs font-bold text-white px-1.5 py-0.5 rounded min-w-[34px] text-center ${POS_BG[player.position]}`}>
                {player.position}
              </span>
              <span className="text-base leading-none">{FLAGS[player.countryCode] ?? "🏳️"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{player.name}</p>
                <p className="text-xs text-gray-400 truncate">{player.clubTeam ?? player.countryCode}</p>
              </div>
              <button
                onClick={() => handleUserPick(player)}
                disabled={!isMyTurn}
                className={`text-xs font-bold px-2.5 py-1 rounded transition flex-shrink-0 ${
                  isMyTurn
                    ? "bg-green-700 text-white hover:bg-green-800 cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Pick
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">No players found</p>
          )}
        </div>
      </div>

      {/* Right: Status + tabs */}
      <div className="w-1/2 flex flex-col gap-3 min-h-0">
        {/* Status bar */}
        <div className={`rounded-xl px-4 py-3 text-white flex-shrink-0 ${isMyTurn ? "bg-green-700" : "bg-gray-700"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-70 uppercase tracking-wide">
                Round {round} / 15 · Pick {currentPick} / {total}
              </p>
              <p className="font-bold text-lg">
                {isMyTurn ? "Your Pick!" : `${teams[currentPickerIdx]?.name ?? "…"} is picking`}
              </p>
            </div>
            {!isMyTurn && (
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow flex flex-col overflow-hidden flex-1 min-h-0">
          <div className="flex border-b flex-shrink-0">
            {(["squad", "teams", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition ${
                  tab === t ? "border-b-2 border-green-700 text-green-700" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t === "squad" ? "My Squad" : t === "teams" ? "All Teams" : "History"}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 p-3">
            {/* My Squad tab */}
            {tab === "squad" && (
              <MiniPitch players={myTeam?.players ?? []} />
            )}

            {/* All Teams tab */}
            {tab === "teams" && (
              <div className="grid grid-cols-2 gap-2">
                {teams.map((team, i) => {
                  const picking = i === currentPickerIdx;
                  const isMe = i === myPos - 1;
                  return (
                    <div
                      key={i}
                      className={`rounded-lg p-2.5 border text-sm ${
                        isMe
                          ? "border-green-500 bg-green-50"
                          : picking
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-bold text-gray-800 truncate leading-tight">
                          {team.name} {isMe && <span className="text-green-600">(You)</span>}
                        </p>
                        <span className="text-xs text-gray-400 ml-1 flex-shrink-0">{team.players.length}/{ROUNDS}</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {(["GK", "DEF", "MID", "FWD"] as Position[]).map((pos) => {
                          const count = team.players.filter((p) => p.position === pos).length;
                          return (
                            <span key={pos} className={`text-[10px] font-bold text-white px-1 py-0.5 rounded ${POS_BG[pos]}`}>
                              {pos} {count}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* History tab */}
            {tab === "history" && (
              <div className="space-y-1">
                {history.slice(0, 60).map((h, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm ${
                      h.teamName === myName ? "bg-green-50 border border-green-200" : "bg-gray-50"
                    }`}
                  >
                    <span className="text-xs text-gray-400 w-7 text-right tabular-nums">#{h.pickNumber}</span>
                    <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${POS_BG[h.player.position]}`}>
                      {h.player.position}
                    </span>
                    <span className="text-sm leading-none">{FLAGS[h.player.countryCode] ?? "🏳️"}</span>
                    <span className="font-semibold text-gray-800 truncate flex-1">{h.player.name}</span>
                    <span className="text-xs text-gray-500 truncate max-w-[90px]">{h.teamName}</span>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-6">No picks yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
