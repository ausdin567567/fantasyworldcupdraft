"use client";

import { use, useEffect, useState } from "react";
import { Position } from "@prisma/client";

type Player = {
  id: string;
  name: string;
  position: Position;
  countryCode: string;
  clubTeam: string | null;
};

type Selection = {
  playerId: string;
  isStarting: boolean;
  benchPriority: number | null;
};

const FORMATION_DISPLAY = ["FWD", "MID", "DEF", "GK"];
const POSITION_COLORS: Record<Position, string> = {
  GK: "bg-yellow-400",
  DEF: "bg-blue-500",
  MID: "bg-green-500",
  FWD: "bg-red-500",
};

export default function SquadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = use(params);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/leagues/${leagueId}/myteam`).then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      setPlayers(data.players ?? []);
    });

    fetch(`/api/leagues/${leagueId}/squad`).then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      setSelections(data.selections ?? []);
    });
  }, [leagueId]);

  function isStarting(playerId: string) {
    return selections.find((s) => s.playerId === playerId)?.isStarting ?? false;
  }

  function benchPriority(playerId: string) {
    return selections.find((s) => s.playerId === playerId)?.benchPriority ?? null;
  }

  function toggleStarting(player: Player) {
    const startingCount = selections.filter((s) => s.isStarting).length;
    const playerSel = selections.find((s) => s.playerId === player.id);
    const currently = playerSel?.isStarting ?? false;

    // Validate formation rules
    if (!currently && startingCount >= 11) return;

    if (!currently) {
      // Check minimum formation: 1 GK, 3 DEF, 1 FWD
      const startingPlayers = players.filter((p) =>
        selections.find((s) => s.playerId === p.id && s.isStarting)
      );
      if (player.position === "GK" && startingPlayers.filter(p => p.position === "GK").length >= 1) return;
    } else {
      // Removing from starting — ensure min formation maintained
      const startingPlayers = players.filter((p) =>
        selections.find((s) => s.playerId === p.id && s.isStarting)
      );
      const posCount = startingPlayers.filter((p) => p.position === player.position).length;
      if (player.position === "GK" && posCount <= 1) return;
      if (player.position === "DEF" && posCount <= 3) return;
      if (player.position === "FWD" && posCount <= 1) return;
    }

    setSelections((prev) => {
      const next = prev.filter((s) => s.playerId !== player.id);
      const benchPlayers = next.filter((s) => !s.isStarting);
      return [
        ...next,
        {
          playerId: player.id,
          isStarting: !currently,
          benchPriority: !currently ? null : benchPlayers.length + 1,
        },
      ];
    });
  }

  async function saveSelections() {
    setSaving(true);
    await fetch(`/api/leagues/${leagueId}/squad`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selections }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const starters = players.filter((p) => isStarting(p.id));
  const bench = players.filter((p) => !isStarting(p.id)).sort((a, b) => {
    const pa = benchPriority(a.id) ?? 99;
    const pb = benchPriority(b.id) ?? 99;
    return pa - pb;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Squad</h1>
        <button
          onClick={saveSelections}
          disabled={saving || selections.length === 0}
          className="px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50 transition"
        >
          {saved ? "Saved!" : saving ? "Saving..." : "Save Team"}
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Click a player to move them between starting XI and bench. Minimum formation: 1 GK · 3 DEF · 1 FWD.
        Starters: {starters.length}/11
      </p>

      {/* Pitch View */}
      <div className="bg-gradient-to-b from-green-700 to-green-600 rounded-2xl p-6 shadow-inner">
        {FORMATION_DISPLAY.map((pos) => {
          const row = starters.filter((p) => p.position === pos);
          return (
            <div key={pos} className="flex justify-center gap-4 mb-6 last:mb-0">
              {row.map((player) => (
                <button
                  key={player.id}
                  onClick={() => toggleStarting(player)}
                  className="flex flex-col items-center group"
                >
                  <div className={`w-14 h-14 rounded-full ${POSITION_COLORS[player.position as Position]} flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:ring-4 ring-white transition`}>
                    {player.name.split(" ").pop()?.slice(0, 6)}
                  </div>
                  <span className="mt-1 text-xs text-white font-medium text-center max-w-[60px] truncate">
                    {player.countryCode}
                  </span>
                </button>
              ))}
            </div>
          );
        })}

        {starters.length === 0 && (
          <p className="text-center text-green-200 text-sm py-8">
            No starting players selected yet — click players in the bench below to add them.
          </p>
        )}
      </div>

      {/* Bench */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Bench ({bench.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {bench.map((player, i) => (
            <button
              key={player.id}
              onClick={() => toggleStarting(player)}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 transition text-left"
            >
              <div className={`w-8 h-8 rounded-full ${POSITION_COLORS[player.position as Position]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {player.position}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{player.name}</p>
                <p className="text-xs text-gray-400">{player.countryCode}</p>
              </div>
              <span className="ml-auto text-xs text-gray-400">#{i + 1}</span>
            </button>
          ))}
          {players.length === 0 && (
            <p className="col-span-4 text-center text-gray-400 text-sm py-6">
              Your squad will appear here after the draft.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
