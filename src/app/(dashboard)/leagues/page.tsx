"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Globe, Plus } from "lucide-react";

type Tab = "create" | "join" | "public";

export default function LeaguesPage() {
  const [tab, setTab] = useState<Tab>("create");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Create league form
  const [leagueName, setLeagueName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [scoringType, setScoringType] = useState<"CLASSIC" | "HEAD_TO_HEAD">("CLASSIC");
  const [maxTeams, setMaxTeams] = useState(8);
  const [tradeMode, setTradeMode] = useState<"NONE" | "ALL" | "ADMIN_APPROVAL" | "MANAGER_APPROVAL">("ALL");
  const [pickTimer, setPickTimer] = useState(90);

  // Join league form
  const [inviteCode, setInviteCode] = useState("");
  const [joinTeamName, setJoinTeamName] = useState("");

  // Public league form
  const [publicTeamName, setPublicTeamName] = useState("");
  const [publicSize, setPublicSize] = useState<4 | 6 | 8>(8);
  const [publicScoring, setPublicScoring] = useState<"CLASSIC" | "HEAD_TO_HEAD">("CLASSIC");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leagueName, teamName, scoringType, maxTeams, tradeMode, pickTimer, type: "PRIVATE" }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    router.push(`/league/${data.leagueId}/squad`);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/leagues/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: inviteCode.toUpperCase(), teamName: joinTeamName }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    router.push(`/league/${data.leagueId}/squad`);
  }

  async function handlePublic(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/leagues/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName: publicTeamName, maxTeams: publicSize, scoringType: publicScoring }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    router.push(`/league/${data.leagueId}/squad`);
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "create", label: "Create Private League", icon: <Plus size={16} /> },
    { id: "join", label: "Join with Code", icon: <Lock size={16} /> },
    { id: "public", label: "Public League", icon: <Globe size={16} /> },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Join or Create a League</h1>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
              tab === t.id
                ? "bg-green-700 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {/* Create */}
        {tab === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="League Name">
              <input required value={leagueName} onChange={e => setLeagueName(e.target.value)} className={input} placeholder="World Cup Warriors" />
            </Field>
            <Field label="Your Team Name">
              <input required value={teamName} onChange={e => setTeamName(e.target.value)} className={input} placeholder="The Goats FC" />
            </Field>
            <Field label="Scoring">
              <select value={scoringType} onChange={e => setScoringType(e.target.value as "CLASSIC" | "HEAD_TO_HEAD")} className={input}>
                <option value="CLASSIC">Classic (Total Points)</option>
                <option value="HEAD_TO_HEAD">Head-to-Head</option>
              </select>
            </Field>
            <Field label={`Max Teams (2–16, ideal 8)`}>
              <input type="number" min={2} max={16} value={maxTeams} onChange={e => setMaxTeams(+e.target.value)} className={input} />
            </Field>
            <Field label="Trade Mode">
              <select value={tradeMode} onChange={e => setTradeMode(e.target.value as typeof tradeMode)} className={input}>
                <option value="ALL">All Trades Allowed</option>
                <option value="NONE">No Trades</option>
                <option value="ADMIN_APPROVAL">Admin Approval</option>
                <option value="MANAGER_APPROVAL">Manager Approval (50%)</option>
              </select>
            </Field>
            <Field label={`Pick Timer: ${pickTimer}s`}>
              <input type="range" min={30} max={120} step={10} value={pickTimer} onChange={e => setPickTimer(+e.target.value)} className="w-full" />
              <div className="flex justify-between text-xs text-gray-400"><span>30s</span><span>120s</span></div>
            </Field>
            <button type="submit" disabled={loading} className={btn}>
              {loading ? "Creating..." : "Create League"}
            </button>
          </form>
        )}

        {/* Join */}
        {tab === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <Field label="Invite Code">
              <input required value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} className={`${input} uppercase tracking-widest font-mono`} placeholder="ABC123" maxLength={6} />
            </Field>
            <Field label="Your Team Name">
              <input required value={joinTeamName} onChange={e => setJoinTeamName(e.target.value)} className={input} placeholder="The Goats FC" />
            </Field>
            <button type="submit" disabled={loading} className={btn}>
              {loading ? "Joining..." : "Join League"}
            </button>
          </form>
        )}

        {/* Public */}
        {tab === "public" && (
          <form onSubmit={handlePublic} className="space-y-4">
            <p className="text-sm text-gray-500">You&apos;ll be matched with random managers. Draft starts ~15 min after the league fills.</p>
            <Field label="Your Team Name">
              <input required value={publicTeamName} onChange={e => setPublicTeamName(e.target.value)} className={input} placeholder="The Goats FC" />
            </Field>
            <Field label="League Size">
              <select value={publicSize} onChange={e => setPublicSize(+e.target.value as 4 | 6 | 8)} className={input}>
                <option value={4}>4 Managers</option>
                <option value={6}>6 Managers</option>
                <option value={8}>8 Managers</option>
              </select>
            </Field>
            <Field label="Scoring">
              <select value={publicScoring} onChange={e => setPublicScoring(e.target.value as "CLASSIC" | "HEAD_TO_HEAD")} className={input}>
                <option value="CLASSIC">Classic</option>
                <option value="HEAD_TO_HEAD">Head-to-Head</option>
              </select>
            </Field>
            <button type="submit" disabled={loading} className={btn}>
              {loading ? "Finding league..." : "Join Public League"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const input = "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
const btn = "w-full py-2.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg transition disabled:opacity-60";
