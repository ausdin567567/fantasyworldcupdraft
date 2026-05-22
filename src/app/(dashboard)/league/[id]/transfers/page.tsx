"use client";

import { use, useEffect, useState } from "react";
import { Position } from "@prisma/client";

type Player = {
  id: string;
  name: string;
  position: Position;
  countryCode: string;
  clubTeam: string | null;
  status: string;
};

const POSITION_COLORS: Record<Position, string> = {
  GK: "bg-yellow-100 text-yellow-800",
  DEF: "bg-blue-100 text-blue-800",
  MID: "bg-green-100 text-green-800",
  FWD: "bg-red-100 text-red-800",
};

export default function TransfersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = use(params);
  const [myPlayers, setMyPlayers] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [playerOut, setPlayerOut] = useState<Player | null>(null);
  const [playerIn, setPlayerIn] = useState<Player | null>(null);
  const [mode, setMode] = useState<"waiver" | "free">("waiver");
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<Position | "ALL">("ALL");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [waiverPriority, setWaiverPriority] = useState(1);

  useEffect(() => {
    fetch(`/api/leagues/${leagueId}/myteam`).then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      setMyPlayers(data.players ?? []);
    });

    fetch(`/api/players?status=AVAILABLE`).then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      setAvailablePlayers(data.players ?? []);
    });

    fetch(`/api/leagues/${leagueId}/gameweek`).then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      setMode(data.mode ?? "waiver");
    });
  }, [leagueId]);

  async function submitTransfer() {
    if (!playerOut || !playerIn) return;
    setLoading(true);
    setMessage(null);

    const endpoint = mode === "waiver"
      ? `/api/leagues/${leagueId}/waivers`
      : `/api/leagues/${leagueId}/free-agency`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerInId: playerIn.id, playerOutId: playerOut.id, priority: waiverPriority }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage({ type: "success", text: mode === "waiver" ? "Waiver request submitted!" : "Transfer complete!" });
      if (mode === "free") {
        setMyPlayers((prev) => [...prev.filter((p) => p.id !== playerOut.id), playerIn]);
        setAvailablePlayers((prev) => [...prev.filter((p) => p.id !== playerIn.id), playerOut]);
      }
      setPlayerOut(null);
      setPlayerIn(null);
    } else {
      setMessage({ type: "error", text: data.error });
    }
    setLoading(false);
  }

  const filtered = availablePlayers.filter((p) => {
    if (posFilter !== "ALL" && p.position !== posFilter) return false;
    if (playerOut && p.position !== playerOut.position) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.countryCode.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          mode === "free" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
        }`}>
          {mode === "free" ? "Free Agency Active" : "Waiver Period"}
        </span>
      </div>

      {message && (
        <p className={`px-4 py-3 rounded-lg text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          {message.text}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Squad */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">My Squad — Select Player Out</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {myPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setPlayerOut(playerOut?.id === player.id ? null : player)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition ${
                  playerOut?.id === player.id ? "bg-red-50 border-l-4 border-red-500" : ""
                }`}
              >
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${POSITION_COLORS[player.position]}`}>
                  {player.position}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{player.name}</p>
                  <p className="text-xs text-gray-400">{player.countryCode} · {player.clubTeam}</p>
                </div>
                {playerOut?.id === player.id && (
                  <span className="ml-auto text-xs text-red-600 font-medium">OUT</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Available Players */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100 space-y-2">
            <h2 className="font-semibold text-gray-800">
              Available Players{playerOut ? ` (${playerOut.position} only)` : ""}
            </h2>
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {!playerOut && (
                <div className="flex gap-1">
                  {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPosFilter(pos)}
                      className={`px-2 py-1 text-xs rounded transition ${
                        posFilter === pos ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {filtered.map((player) => (
              <button
                key={player.id}
                onClick={() => setPlayerIn(playerIn?.id === player.id ? null : player)}
                disabled={!!playerOut && player.position !== playerOut.position}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition disabled:opacity-40 ${
                  playerIn?.id === player.id ? "bg-green-50 border-l-4 border-green-500" : ""
                }`}
              >
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${POSITION_COLORS[player.position]}`}>
                  {player.position}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{player.name}</p>
                  <p className="text-xs text-gray-400">{player.countryCode} · {player.clubTeam}</p>
                </div>
                {playerIn?.id === player.id && (
                  <span className="ml-auto text-xs text-green-600 font-medium">IN</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transfer Summary */}
      {playerOut && playerIn && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Confirm Transfer</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 p-3 bg-red-50 rounded-lg text-center">
              <p className="text-xs text-red-500 font-medium mb-1">OUT</p>
              <p className="font-semibold text-gray-900">{playerOut.name}</p>
              <p className="text-xs text-gray-400">{playerOut.countryCode}</p>
            </div>
            <span className="text-2xl text-gray-400">⇄</span>
            <div className="flex-1 p-3 bg-green-50 rounded-lg text-center">
              <p className="text-xs text-green-500 font-medium mb-1">IN</p>
              <p className="font-semibold text-gray-900">{playerIn.name}</p>
              <p className="text-xs text-gray-400">{playerIn.countryCode}</p>
            </div>
          </div>

          {mode === "waiver" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Waiver Priority #{waiverPriority}
              </label>
              <input
                type="number"
                min={1}
                value={waiverPriority}
                onChange={(e) => setWaiverPriority(+e.target.value)}
                className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}

          <button
            onClick={submitTransfer}
            disabled={loading}
            className="w-full py-2.5 bg-green-700 text-white font-semibold rounded-lg hover:bg-green-800 disabled:opacity-60 transition"
          >
            {loading
              ? "Processing..."
              : mode === "waiver"
              ? "Submit Waiver Request"
              : "Complete Transfer"}
          </button>
        </div>
      )}
    </div>
  );
}
