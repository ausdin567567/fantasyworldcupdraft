"use client";

import { use, useEffect, useState } from "react";
import { Position } from "@prisma/client";

type Player = {
  id: string;
  name: string;
  position: Position;
  countryCode: string;
  clubTeam: string | null;
  totalPoints?: number;
};

type Selection = {
  playerId: string;
  isStarting: boolean;
  benchPriority: number | null;
};

const POSITION_COLORS: Record<Position, string> = {
  GK: "#f5a623",
  DEF: "#4a90d9",
  MID: "#7ed321",
  FWD: "#d0021b",
};

const COUNTRY_FLAGS: Record<string, string> = {
  ARG: "🇦🇷", BRA: "🇧🇷", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", FRA: "🇫🇷", ESP: "🇪🇸",
  GER: "🇩🇪", POR: "🇵🇹", NED: "🇳🇱", BEL: "🇧🇪", URU: "🇺🇾",
  COL: "🇨🇴", MAR: "🇲🇦", JAP: "🇯🇵", KOR: "🇰🇷", SEN: "🇸🇳",
  USA: "🇺🇸", MEX: "🇲🇽", CRO: "🇭🇷", ITA: "🇮🇹", AUS: "🇦🇺",
};

function JerseyIcon({ color, flag }: { color: string; flag: string }) {
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-md">
        {/* Jersey body */}
        <path
          d="M15 18 L8 28 L16 30 L16 52 L44 52 L44 30 L52 28 L45 18 C42 20 38 22 30 22 C22 22 18 20 15 18Z"
          fill={color}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />
        {/* Collar */}
        <path
          d="M22 18 Q30 24 38 18 Q34 14 30 14 Q26 14 22 18Z"
          fill={color}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="0.5"
        />
        {/* Sleeves */}
        <path d="M15 18 L8 28 L16 30 L18 22Z" fill={color} opacity="0.85" />
        <path d="M45 18 L52 28 L44 30 L42 22Z" fill={color} opacity="0.85" />
        {/* Highlight */}
        <path
          d="M22 22 Q30 26 38 22 L36 38 Q30 40 24 38Z"
          fill="rgba(255,255,255,0.1)"
        />
      </svg>
      <span className="absolute bottom-0.5 text-base leading-none">{flag}</span>
    </div>
  );
}

function PlayerCard({
  player,
  isSelected,
  onClick,
  points,
}: {
  player: Player;
  isSelected?: boolean;
  onClick: () => void;
  points?: number;
}) {
  const shortName = player.name.split(" ").slice(-1)[0].slice(0, 10);
  const flag = COUNTRY_FLAGS[player.countryCode] ?? "🏳️";

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 group cursor-pointer"
    >
      <div className={`relative transition-transform group-hover:scale-110 ${isSelected ? "ring-4 ring-white ring-offset-1 ring-offset-transparent rounded-full" : ""}`}>
        <JerseyIcon color={POSITION_COLORS[player.position]} flag={flag} />
      </div>
      <div className="bg-[#1a1a2e] text-white text-[11px] font-bold px-2 py-0.5 rounded min-w-[64px] text-center truncate max-w-[80px] leading-tight">
        {shortName}
      </div>
      <div className="bg-[#2d2d4e] text-[#a8d8a8] text-[11px] px-2 py-0.5 rounded min-w-[64px] text-center leading-tight">
        {points ?? 0}
      </div>
    </button>
  );
}

export default function SquadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = use(params);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/leagues/${leagueId}/myteam`).then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      setPlayers(data.players ?? []);
      // Auto-generate default selections if none exist
      if (data.players?.length > 0) {
        setSelections(buildDefaultSelections(data.players));
      }
    });

    fetch(`/api/leagues/${leagueId}/squad`).then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      if (data.selections?.length > 0) setSelections(data.selections);
    });
  }, [leagueId]);

  function buildDefaultSelections(playerList: Player[]): Selection[] {
    const byPos: Record<Position, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
    playerList.forEach((p) => byPos[p.position].push(p));

    const starters: string[] = [
      ...(byPos.GK.slice(0, 1).map((p) => p.id)),
      ...(byPos.DEF.slice(0, 4).map((p) => p.id)),
      ...(byPos.MID.slice(0, 4).map((p) => p.id)),
      ...(byPos.FWD.slice(0, 2).map((p) => p.id)),
    ];

    return playerList.map((p, i) => ({
      playerId: p.id,
      isStarting: starters.includes(p.id),
      benchPriority: starters.includes(p.id) ? null : (i % 4) + 1,
    }));
  }

  function toggleStarting(player: Player) {
    const sel = selections.find((s) => s.playerId === player.id);
    const currently = sel?.isStarting ?? false;
    const starters = selections.filter((s) => s.isStarting);

    if (!currently) {
      if (starters.length >= 11) { setError("Already have 11 starters"); return; }
      const gwGks = players.filter((p) =>
        p.position === "GK" && selections.find((s) => s.playerId === p.id && s.isStarting)
      );
      if (player.position === "GK" && gwGks.length >= 1) { setError("Can only have 1 starting GK"); return; }
    } else {
      const starterPlayers = players.filter((p) =>
        selections.find((s) => s.playerId === p.id && s.isStarting)
      );
      const posCount = starterPlayers.filter((p) => p.position === player.position).length;
      if (player.position === "GK" && posCount <= 1) { setError("Need at least 1 GK"); return; }
      if (player.position === "DEF" && posCount <= 3) { setError("Need at least 3 DEF"); return; }
      if (player.position === "FWD" && posCount <= 1) { setError("Need at least 1 FWD"); return; }
    }

    setError(null);
    setSelections((prev) => {
      const next = prev.filter((s) => s.playerId !== player.id);
      const benchPlayers = next.filter((s) => !s.isStarting);
      return [...next, {
        playerId: player.id,
        isStarting: !currently,
        benchPriority: !currently ? null : benchPlayers.length + 1,
      }];
    });
  }

  async function saveSelections() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/leagues/${leagueId}/squad`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selections }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const starters = players.filter((p) => selections.find((s) => s.playerId === p.id && s.isStarting));
  const bench = players
    .filter((p) => !selections.find((s) => s.playerId === p.id && s.isStarting))
    .sort((a, b) => {
      const pa = selections.find((s) => s.playerId === a.id)?.benchPriority ?? 99;
      const pb = selections.find((s) => s.playerId === b.id)?.benchPriority ?? 99;
      return pa - pb;
    });

  const gks = starters.filter((p) => p.position === "GK");
  const defs = starters.filter((p) => p.position === "DEF");
  const mids = starters.filter((p) => p.position === "MID");
  const fwds = starters.filter((p) => p.position === "FWD");

  // Bench GK first, then outfield by priority
  const benchGK = bench.filter((p) => p.position === "GK");
  const benchOutfield = bench.filter((p) => p.position !== "GK");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Squad</h1>
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <span className="text-sm text-gray-500">{starters.length}/11 selected</span>
          <button
            onClick={saveSelections}
            disabled={saving || players.length === 0}
            className="px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50 transition"
          >
            {saved ? "Saved ✓" : saving ? "Saving..." : "Save Team"}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">Click a player to swap between starting XI and bench.</p>

      {/* Pitch */}
      <div
        className="relative rounded-xl overflow-hidden shadow-xl"
        style={{
          background: "linear-gradient(180deg, #2d7a2d 0%, #3a8f3a 12.5%, #2d7a2d 12.5%, #2d7a2d 25%, #3a8f3a 25%, #3a8f3a 37.5%, #2d7a2d 37.5%, #2d7a2d 50%, #3a8f3a 50%, #3a8f3a 62.5%, #2d7a2d 62.5%, #2d7a2d 75%, #3a8f3a 75%, #3a8f3a 87.5%, #2d7a2d 87.5%)",
        }}
      >
        {/* Pitch markings */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 520" preserveAspectRatio="none">
          {/* Center circle */}
          <circle cx="200" cy="260" r="50" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <line x1="0" y1="260" x2="400" y2="260" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          {/* Top penalty area */}
          <rect x="100" y="10" width="200" height="80" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <rect x="150" y="10" width="100" height="35" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          {/* Bottom penalty area */}
          <rect x="100" y="430" width="200" height="80" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <rect x="150" y="475" width="100" height="35" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          {/* Border */}
          <rect x="5" y="5" width="390" height="510" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        </svg>

        {/* Players on pitch */}
        <div className="relative z-10 py-6 px-4 space-y-2">
          {/* Forwards */}
          <div className="flex justify-center gap-6 mb-2">
            {fwds.map((p) => (
              <PlayerCard key={p.id} player={p} onClick={() => toggleStarting(p)} points={p.totalPoints} isSelected />
            ))}
          </div>
          {/* Midfielders */}
          <div className="flex justify-center gap-4 mb-2">
            {mids.map((p) => (
              <PlayerCard key={p.id} player={p} onClick={() => toggleStarting(p)} points={p.totalPoints} isSelected />
            ))}
          </div>
          {/* Defenders */}
          <div className="flex justify-center gap-4 mb-2">
            {defs.map((p) => (
              <PlayerCard key={p.id} player={p} onClick={() => toggleStarting(p)} points={p.totalPoints} isSelected />
            ))}
          </div>
          {/* Goalkeeper */}
          <div className="flex justify-center gap-4">
            {gks.map((p) => (
              <PlayerCard key={p.id} player={p} onClick={() => toggleStarting(p)} points={p.totalPoints} isSelected />
            ))}
          </div>

          {players.length === 0 && (
            <div className="text-center py-20 text-white/60 text-sm">
              Your squad will appear here after the draft.
            </div>
          )}
        </div>
      </div>

      {/* Bench */}
      <div
        className="rounded-xl p-4 shadow-inner"
        style={{ background: "linear-gradient(180deg, #4a9e4a 0%, #3d8f3d 100%)" }}
      >
        <p className="text-center text-white/70 text-xs font-semibold uppercase tracking-widest mb-3">Bench</p>
        <div className="flex justify-center gap-6">
          {/* Bench GK */}
          {benchGK.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <PlayerCard player={p} onClick={() => toggleStarting(p)} points={p.totalPoints} />
              <span className="text-[10px] text-white/60 font-medium">GK</span>
            </div>
          ))}
          {/* Bench outfield */}
          {benchOutfield.slice(0, 3).map((p, i) => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <PlayerCard player={p} onClick={() => toggleStarting(p)} points={p.totalPoints} />
              <span className="text-[10px] text-white/60 font-medium">{i + 1}</span>
            </div>
          ))}
          {bench.length === 0 && players.length > 0 && (
            <p className="text-white/50 text-sm py-4">All players in starting XI</p>
          )}
        </div>
      </div>
    </div>
  );
}
