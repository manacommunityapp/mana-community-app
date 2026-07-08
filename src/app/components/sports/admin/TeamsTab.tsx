import React, { useEffect, useState, useCallback } from "react";
import {
  Clock, Check, Search, Trophy, ChevronDown, ChevronUp,
  Users, Calendar, RefreshCw, AlertCircle, Shield, Star,
  Hash, Wallet, CheckCircle2, XCircle, Loader2, X
} from "lucide-react";
import { sportsService } from "../../../../services/sportsService";
import { auctionService } from "../../../../services/auctionService";
import { showSuccess, showError, showInfo } from "../../../../utils/ToastUtils";
import type { SportsTournament, AuctionTeam, EventRegistration, SportsEvent } from "../../../../types/api";

const toast = {
  success: (msg: string) => showSuccess(msg),
  error: (msg: string) => showError(msg),
  info: (msg: string) => showInfo(msg),
};

interface TeamsTabProps {
  activeTournaments: SportsTournament[];
  activeEvents?: SportsEvent[];
  communityId?: number | null;
  isSuperAdmin?: boolean;
}

interface TournamentTeamGroup {
  tournament: SportsTournament;
  teams: AuctionTeam[];
  pendingRegs: EventRegistration[];
  loading: boolean;
  teamsExpanded: boolean;
  pendingExpanded: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    PENDING:    { bg: "rgba(245,158,11,0.12)",  text: "#d97706", label: "Pending" },
    REGISTERED: { bg: "rgba(99,102,241,0.12)",  text: "#4f46e5", label: "Registered" },
    CONFIRMED:  { bg: "rgba(16,185,129,0.12)",  text: "#059669", label: "Confirmed" },
    WITHDRAWN:  { bg: "rgba(107,114,128,0.12)", text: "#6b7280", label: "Withdrawn" },
    REJECTED:   { bg: "rgba(239,68,68,0.12)",   text: "#dc2626", label: "Rejected" },
  };
  const s = map[status] || map["REGISTERED"];
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function TeamCard({ team, eventName }: { team: AuctionTeam; eventName?: string }) {
  const [expanded, setExpanded] = useState(false);
  const color = team.colorHex || team.color || "#6366f1";
  const memberCount = team.players?.length ?? 0;
  const spent = team.spent ?? 0;
  const budget = team.totalBudget ?? 0;
  const spentPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{ borderColor: "rgba(99,102,241,0.12)", background: "white" }}
    >
      {/* Team header row */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Color swatch / emoji */}
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold text-white shadow-sm"
          style={{ background: color }}
        >
          {team.emoji || (team.teamName || team.name || "T")[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold" style={{ color: "#0d0d2b" }}>
              {team.teamName || team.name}
            </p>
            {team.captainConfirmation && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Confirmed
              </span>
            )}
            {team.captainNomination && !team.captainConfirmation && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> Nominated
              </span>
            )}
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "#6b7094" }}>
            {team.ownerName && <span>Owner: <strong>{team.ownerName}</strong> · </span>}
            {team.captainUser?.fullName && <span>Captain: <strong>{team.captainUser.fullName}</strong> · </span>}
            {memberCount} player{memberCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Budget mini bar */}
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-bold" style={{ color: "#0d0d2b" }}>
              ₹{(budget - spent).toLocaleString()} left
            </p>
            <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${spentPct}%`,
                  background: spentPct > 80 ? "#ef4444" : spentPct > 50 ? "#f59e0b" : "#10b981"
                }}
              />
            </div>
          </div>
          <button className="p-1.5 rounded-lg transition-colors" style={{ color: "#6b7094" }}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="px-4 pb-4 border-t space-y-3"
          style={{ borderColor: "rgba(99,102,241,0.08)" }}
        >
          {/* Budget row */}
          <div className="grid grid-cols-3 gap-3 pt-3">
            {[
              { label: "Total Budget", value: `₹${budget.toLocaleString()}`, icon: Wallet, color: "#4f46e5" },
              { label: "Spent",        value: `₹${spent.toLocaleString()}`,  icon: Hash,   color: "#f59e0b" },
              { label: "Remaining",    value: `₹${(budget - spent).toLocaleString()}`, icon: Star, color: "#10b981" },
            ].map(({ label, value, icon: Icon, color: c }) => (
              <div
                key={label}
                className="rounded-xl p-2.5 text-center"
                style={{ background: `${c}0d`, border: `1px solid ${c}22` }}
              >
                <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: c }} />
                <p className="text-sm font-bold" style={{ color: c }}>{value}</p>
                <p className="text-[9px] uppercase tracking-wider font-semibold mt-0.5" style={{ color: "#6b7094" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Players list */}
          {team.players && team.players.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: "#6b7094" }}>
                Players ({team.players.length})
              </p>
              <div className="space-y-1.5">
                {team.players.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg"
                    style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.08)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ background: color }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-xs font-medium" style={{ color: "#0d0d2b" }}>{p.name}</span>
                      {p.category && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">{p.category}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold" style={{ color: "#4f46e5" }}>
                      ₹{p.soldPrice?.toLocaleString() ?? "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eventName && (
            <div
              className="flex items-center gap-2 pt-1 text-[10px] font-medium"
              style={{ color: "#6b7094" }}
            >
              <Trophy className="w-3 h-3 text-indigo-400" />
              Event: <span className="font-bold text-indigo-600">{eventName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PendingRegistrationCard({
  reg,
  onApprove,
  onReject,
  approving,
}: {
  reg: EventRegistration;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  approving: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.18)" }}
    >
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
      >
        {(reg.proposedTeamName || reg.playerName || "T")[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-bold truncate" style={{ color: "#0d0d2b" }}>
          {reg.proposedTeamName || reg.playerName || `Registration #${reg.id}`}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "#6b7094" }}>
          {reg.user?.fullName && <span>{reg.user.fullName} · </span>}
          {reg.flatNumber && <span>Flat {reg.flatNumber} · </span>}
          {reg.registeredAt && (
            <span>{new Date(reg.registeredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
          )}
          <StatusBadge status={reg.status} />
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onReject(reg.id)}
          disabled={approving}
          className="p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          title="Reject"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={() => onApprove(reg.id)}
          disabled={approving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
          style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}
        >
          {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Approve
        </button>
      </div>
    </div>
  );
}

export function TeamsTab({ activeTournaments, activeEvents = [], communityId, isSuperAdmin }: TeamsTabProps) {
  const [groups, setGroups] = useState<TournamentTeamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());
  const [globalExpanded, setGlobalExpanded] = useState<"pending" | "all" | null>(null);

  const loadTeamData = useCallback(async () => {
    if (!activeTournaments || activeTournaments.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const built: TournamentTeamGroup[] = [];

    for (const t of activeTournaments) {
      const eventId = t.event?.id ?? (t as any).eventId;
      let teams: AuctionTeam[] = [];
      let pendingRegs: EventRegistration[] = [];

      try {
        // Try fetching auction teams (for team sports / auction)
        if (t.id) {
          const configId = (t as any).auctionConfigId;
          if (configId) {
            teams = await auctionService.getTeamsSummary(configId).catch(() => []);
          } else {
            teams = await auctionService.getNominatedCaptains(eventId || t.id).catch(() => []);
          }
        }
      } catch { /* no teams */ }

      try {
        // Fetch pending registrations for this event
        if (eventId) {
          const regs = await sportsService.getTournamentRegistrations(eventId).catch(() => []);
          pendingRegs = regs.filter(r => r.status === "PENDING");
        }
      } catch { /* no regs */ }

      built.push({
        tournament: t,
        teams,
        pendingRegs,
        loading: false,
        teamsExpanded: true,
        pendingExpanded: true,
      });
    }

    setGroups(built);
    setLoading(false);
  }, [activeTournaments]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const handleApprove = async (regId: number, eventId: number) => {
    setApprovingIds(prev => new Set(prev).add(regId));
    try {
      await sportsService.confirmRegistration(regId);
      toast.success("Registration approved!");
      // Refresh the group
      setGroups(prev => prev.map(g => {
        if (g.tournament.event?.id === eventId || (g.tournament as any).eventId === eventId) {
          return { ...g, pendingRegs: g.pendingRegs.filter(r => r.id !== regId) };
        }
        return g;
      }));
    } catch {
      toast.error("Failed to approve registration");
    } finally {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(regId); return s; });
    }
  };

  const handleReject = async (regId: number, eventId: number) => {
    setApprovingIds(prev => new Set(prev).add(regId));
    try {
      await sportsService.rejectRegistration(regId);
      toast.info("Registration rejected");
      setGroups(prev => prev.map(g => {
        if (g.tournament.event?.id === eventId || (g.tournament as any).eventId === eventId) {
          return { ...g, pendingRegs: g.pendingRegs.filter(r => r.id !== regId) };
        }
        return g;
      }));
    } catch {
      toast.error("Failed to reject registration");
    } finally {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(regId); return s; });
    }
  };

  const toggleSection = (idx: number, key: "teamsExpanded" | "pendingExpanded") => {
    setGroups(prev => prev.map((g, i) => i === idx ? { ...g, [key]: !g[key] } : g));
  };

  const allPendingCount = groups.reduce((n, g) => n + g.pendingRegs.length, 0);
  const allTeamsCount = groups.reduce((n, g) => n + g.teams.length, 0);

  // Filter groups by search
  const filtered = groups.map(g => ({
    ...g,
    teams: g.teams.filter(t =>
      !searchQuery ||
      (t.teamName || t.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.ownerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.captainUser?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
    ),
    pendingRegs: g.pendingRegs.filter(r =>
      !searchQuery ||
      (r.proposedTeamName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.playerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.user?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(g => g.teams.length > 0 || g.pendingRegs.length > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-500">Loading teams data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-extrabold text-slate-800">Teams Management</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {allTeamsCount} team{allTeamsCount !== 1 ? "s" : ""} across {groups.length} tournament{groups.length !== 1 ? "s" : ""}
            {allPendingCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                <Clock className="w-2.5 h-2.5" /> {allPendingCount} pending
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)" }}
        >
          <Search className="h-3.5 w-3.5 text-indigo-400" />
          <input
            type="text"
            placeholder="Search teams…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-36"
            style={{ color: "#0d0d2b" }}
          />
        </div>

        <button
          onClick={loadTeamData}
          className="p-2 rounded-xl transition-colors cursor-pointer"
          style={{ background: "rgba(99,102,241,0.07)", color: "#4f46e5" }}
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Global Pending Approvals section ── */}
      {allPendingCount > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1.5px solid rgba(245,158,11,0.28)", background: "white", boxShadow: "0 2px 16px rgba(245,158,11,0.07)" }}
        >
          <button
            className="w-full flex items-center justify-between px-5 py-4 cursor-pointer text-left"
            onClick={() => setGlobalExpanded(v => v === "pending" ? null : "pending")}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl" style={{ background: "rgba(245,158,11,0.12)" }}>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Pending Approvals</p>
                <p className="text-[11px] text-amber-600 font-semibold">{allPendingCount} registration{allPendingCount !== 1 ? "s" : ""} awaiting review</p>
              </div>
            </div>
            {globalExpanded === "pending" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {globalExpanded === "pending" && (
            <div className="px-5 pb-5 space-y-5 border-t" style={{ borderColor: "rgba(245,158,11,0.15)" }}>
              {groups.filter(g => g.pendingRegs.length > 0).map((g, idx) => {
                const eventId = g.tournament.event?.id ?? (g.tournament as any).eventId;
                const tournamentName = g.tournament.name || g.tournament.event?.name || `Tournament #${g.tournament.id}`;
                return (
                  <div key={g.tournament.id} className="pt-4">
                    {/* Tournament label */}
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-700">{tournamentName}</span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: "rgba(245,158,11,0.12)", color: "#d97706" }}
                      >
                        {g.pendingRegs.length} pending
                      </span>
                    </div>
                    <div className="space-y-2">
                      {g.pendingRegs.map(reg => (
                        <PendingRegistrationCard
                          key={reg.id}
                          reg={reg}
                          onApprove={id => handleApprove(id, eventId)}
                          onReject={id => handleReject(id, eventId)}
                          approving={approvingIds.has(reg.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tournament groups ── */}
      {filtered.length === 0 && !loading && (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-16 gap-4"
          style={{ border: "1.5px dashed rgba(99,102,241,0.18)", background: "rgba(99,102,241,0.02)" }}
        >
          <div className="p-4 rounded-2xl" style={{ background: "rgba(99,102,241,0.08)" }}>
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-600">
              {searchQuery ? "No teams match your search" : "No teams found"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? "Try a different search term" : "Teams will appear here once players register for tournaments"}
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {filtered.map((g, idx) => {
        const tournamentName = g.tournament.name || g.tournament.event?.name || `Tournament #${g.tournament.id}`;
        const eventName = g.tournament.event?.name || tournamentName;
        const sport = (g.tournament.event as any)?.sport?.name || (g.tournament as any).sportName || "";
        const eventId = g.tournament.event?.id ?? (g.tournament as any).eventId;
        const status = (g.tournament.event?.registrationStatus || (g.tournament as any).registrationStatus || "DRAFT") as string;

        const statusStyles: Record<string, { bg: string; text: string }> = {
          DRAFT:             { bg: "rgba(107,114,128,0.1)",  text: "#6b7280" },
          REGISTRATION_OPEN: { bg: "rgba(16,185,129,0.1)",   text: "#059669" },
          LIVE:              { bg: "rgba(99,102,241,0.12)",   text: "#4f46e5" },
          COMPLETED:         { bg: "rgba(107,114,128,0.1)",  text: "#6b7280" },
        };
        const ss = statusStyles[status] || statusStyles["DRAFT"];

        return (
          <div
            key={g.tournament.id}
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(99,102,241,0.12)", background: "white", boxShadow: "0 2px 12px rgba(99,102,241,0.05)" }}
          >
            {/* Tournament header */}
            <div className="px-5 py-4 flex items-center gap-3 flex-wrap" style={{ borderBottom: "1px solid rgba(99,102,241,0.08)" }}>
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))" }}
              >
                🏆
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-extrabold text-slate-800 truncate">{tournamentName}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={ss}>
                    {status.replace(/_/g, " ")}
                  </span>
                  {sport && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600">
                      {sport}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  <Calendar className="w-2.5 h-2.5 inline mr-1" />
                  {g.tournament.event?.eventDateStart
                    ? new Date(g.tournament.event.eventDateStart).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                  {" · "}
                  {g.teams.length} team{g.teams.length !== 1 ? "s" : ""}
                  {g.pendingRegs.length > 0 && (
                    <span className="ml-2 text-amber-600 font-semibold">· {g.pendingRegs.length} pending</span>
                  )}
                </p>
              </div>
            </div>

            {/* Teams section */}
            {g.teams.length > 0 && (
              <div className="px-5 py-3">
                <button
                  className="w-full flex items-center justify-between py-2 cursor-pointer text-left"
                  onClick={() => toggleSection(groups.indexOf(groups.find(x => x.tournament.id === g.tournament.id)!), "teamsExpanded")}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-700">All Teams</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(99,102,241,0.1)", color: "#4f46e5" }}
                    >
                      {g.teams.length}
                    </span>
                  </div>
                  {g.teamsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                {g.teamsExpanded && (
                  <div className="space-y-3 mt-2 pb-2">
                    {g.teams.map(team => (
                      <TeamCard key={team.id} team={team} eventName={eventName} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pending regs for this tournament */}
            {g.pendingRegs.length > 0 && (
              <div
                className="px-5 py-3 border-t"
                style={{ borderColor: "rgba(99,102,241,0.08)", background: "rgba(245,158,11,0.02)" }}
              >
                <button
                  className="w-full flex items-center justify-between py-2 cursor-pointer text-left"
                  onClick={() => toggleSection(groups.indexOf(groups.find(x => x.tournament.id === g.tournament.id)!), "pendingExpanded")}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-amber-700">Pending Approvals</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(245,158,11,0.15)", color: "#d97706" }}
                    >
                      {g.pendingRegs.length}
                    </span>
                  </div>
                  {g.pendingExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                {g.pendingExpanded && (
                  <div className="space-y-2 mt-2 pb-2">
                    {g.pendingRegs.map(reg => (
                      <PendingRegistrationCard
                        key={reg.id}
                        reg={reg}
                        onApprove={id => handleApprove(id, eventId)}
                        onReject={id => handleReject(id, eventId)}
                        approving={approvingIds.has(reg.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
