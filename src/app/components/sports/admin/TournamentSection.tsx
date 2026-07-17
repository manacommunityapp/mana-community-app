import { useState } from "react";
import { Loader2, Plus, ClipboardList, Users, Edit2, Trash2, CalendarIcon, CheckCircle2, XCircle, Megaphone } from "lucide-react";
import { format } from "date-fns";
import type { TournamentRegistration, AuctionTeam } from "../../../../types/api";
import { isTeamSport } from "../utils/sportsConstants";

interface TournamentSectionProps {
  title: string;
  badge: number;
  badgeColor: string;
  emptyText: string;
  events: any[];
  onEdit: (ev: any) => void;
  onDelete: (id: number) => void;
  onActivate?: (id: number) => void;
  showActivate?: boolean;
  onAnnounce?: (id: number, name: string) => void;
  onViewPlayers?: (eventId: number) => void;
  onViewCaptains?: (eventId: number) => void;
  viewMode?: "players" | "captains";
  viewingEventId?: number | null;
  registrations?: TournamentRegistration[];
  nominatedCaptains?: AuctionTeam[];
  loadingRegs?: boolean;
  onConfirmRegistration?: (regId: number) => void;
  onRejectRegistration?: (regId: number) => void;
  onConfirmCaptain?: (regId: number, confirm: boolean) => void;
  onAddParticipant?: (eventId: number) => void;
  onImportParticipants?: (eventId: number) => void;
}

export function TournamentSection({
  title, badge, badgeColor, emptyText, events,
  onEdit, onDelete, onActivate, showActivate, onAnnounce,
  onViewPlayers, onViewCaptains, viewMode = "players",
  viewingEventId, registrations, nominatedCaptains,
  loadingRegs, onConfirmRegistration, onRejectRegistration, onConfirmCaptain,
  onAddParticipant, onImportParticipants,
}: TournamentSectionProps) {
  const [expandedTournamentIds, setExpandedTournamentIds] = useState<Record<number, boolean>>({});

  const toggleEvents = (tournamentId: number) => {
    setExpandedTournamentIds(prev => ({
      ...prev,
      [tournamentId]: !prev[tournamentId]
    }));
  };

  const hasRegistrationButtons = !!(onViewPlayers || onViewCaptains);

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":    return "bg-[#eab308]/20 text-[#eab308]";
      case "REGISTERED": return "bg-[#f97316]/20 text-[#f97316]";
      case "CONFIRMED":  return "bg-[#10b981]/20 text-[#10b981]";
      case "WITHDRAWN":  return "bg-[#ef4444]/20 text-[#ef4444]";
      case "REJECTED":   return "bg-[#ef4444]/20 text-[#ef4444]";
      default:           return "bg-[#475569]/20 text-[#94a3b8]";
    }
  };

  const renderRegistrationPanel = (ev: any) => (
    <div className="mt-2 bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-[#94a3b8] uppercase tracking-widest">
            {viewMode === "captains" ? "Captain Nominations (from Auction Teams)" : "Registered Players"}
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#3b82f6]/20 text-[#3b82f6]">
            {viewMode === "captains" ? (nominatedCaptains?.length ?? 0) : (registrations?.length ?? 0)}{" "}
            {viewMode === "captains" ? "captains" : "players"}
          </span>
        </div>
        {viewMode === "players" && onAddParticipant && onImportParticipants && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddParticipant(ev.id)}
              className="px-2.5 py-1 bg-[#f97316]/10 hover:bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30 hover:border-[#f97316]/50 text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Participant
            </button>
            <button
              onClick={() => onImportParticipants(ev.id)}
              className="px-2.5 py-1 bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 hover:border-[#10b981]/50 text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" /> Import
            </button>
          </div>
        )}
      </div>

      {loadingRegs && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-[#f97316]" />
        </div>
      )}

      {/* Players list */}
      {!loadingRegs && viewMode === "players" && registrations && registrations.length > 0 && (
        <div className="space-y-2">
          {registrations.map((reg, idx) => (
            <div key={reg.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{reg.playerName || reg.user?.fullName || "—"}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                    {reg.category?.name && <span>{reg.category.name}</span>}
                    {reg.age && <span>Age: {reg.age}</span>}
                    {reg.flatNumber && <span>Flat: {reg.flatNumber}</span>}
                    {reg.relation && <span>({reg.relation})</span>}
                    {reg.registeredAt && <span>· {format(new Date(reg.registeredAt), "MMM d, h:mm a")}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] px-2 py-1 rounded font-medium ${statusBadge(reg.status)}`}>
                  {reg.status}
                </span>
                {(reg.status === "REGISTERED" || reg.status === "PENDING") && onConfirmRegistration && (
                  <button
                    onClick={() => onConfirmRegistration(reg.id)}
                    className="text-[10px] px-3 py-1.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 rounded-lg hover:bg-[#10b981]/20 transition-colors flex items-center gap-1 font-medium"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Confirm
                  </button>
                )}
                {(reg.status === "REGISTERED" || reg.status === "PENDING") && onRejectRegistration && (
                  <button
                    onClick={() => onRejectRegistration(reg.id)}
                    className="text-[10px] px-3 py-1.5 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 rounded-lg hover:bg-[#ef4444]/20 transition-colors flex items-center gap-1 font-medium"
                  >
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Captains list */}
      {!loadingRegs && viewMode === "captains" && nominatedCaptains && nominatedCaptains.length > 0 && (
        <div className="space-y-2">
          {nominatedCaptains.map((team) => (
            <div key={team.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
                <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-[10px] font-bold text-[#f97316] flex-shrink-0">
                  C
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{team.ownerName || team.ownerUser?.fullName || "—"}</div>
                  <div className="text-[10px] text-[#f97316] mt-1 font-semibold tracking-wide">
                    Proposed Team: {team.teamName}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Budget: ₹{team.totalBudget?.toLocaleString()}</span>
                    {team.ownerUser?.phone && <span>· {team.ownerUser.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {team.captainConfirmation ? (
                  <span className="text-[10px] px-2 py-1 rounded font-medium bg-[#10b981]/20 text-[#10b981] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Confirmed
                  </span>
                ) : (
                  onConfirmCaptain && (
                    <button
                      onClick={() => onConfirmCaptain(team.id, true)}
                      className="text-[10px] px-3 py-1.5 bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/30 rounded-lg hover:bg-[#f97316]/20 transition-colors flex items-center gap-1 font-medium"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Confirm Captain
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!loadingRegs && viewMode === "players" && (!registrations || registrations.length === 0) && (
        <div className="flex flex-col items-center justify-center py-10 px-4 gap-3 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="flex items-center justify-center w-16 h-16 border border-slate-200 rounded-full bg-slate-50 shadow-inner">
            <Users className="text-2xl text-slate-400" />
          </div>
          <h6 className="text-sm md:text-base font-bold text-slate-800">No Participants to show</h6>
          {onAddParticipant && onImportParticipants && (
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
              <button
                onClick={() => onAddParticipant(ev.id)}
                className="px-4 py-2 border border-[#f97316]/30 hover:border-[#f97316] bg-[#f97316]/5 hover:bg-[#f97316]/10 text-[#f97316] text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Participants
              </button>
              <span className="text-[#64748b] font-semibold text-xs md:text-sm">OR</span>
              <button
                onClick={() => onImportParticipants(ev.id)}
                className="px-4 py-2 border border-[#10b981]/30 hover:border-[#10b981] bg-[#10b981]/5 hover:bg-[#10b981]/10 text-[#10b981] text-xs md:text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" /> Import Participants
              </button>
            </div>
          )}
        </div>
      )}
      {!loadingRegs && viewMode === "captains" && (!nominatedCaptains || nominatedCaptains.length === 0) && (
        <div className="text-center py-6 text-[10px] text-[#475569] italic">No nominated captains found</div>
      )}
    </div>
  );

  // ─── Button helpers ───────────────────────────────────────────────────────

  const PlayersBtn = ({ evId, size = "sm" }: { evId: number; size?: "sm" | "xs" }) =>
    onViewPlayers ? (
      <button
        onClick={() => onViewPlayers(evId)}
        className={`${size === "xs" ? "text-[9px] px-2 py-1" : "text-[10px] px-2 py-1.5"} rounded${size === "xs" ? "" : "-lg"} transition-colors flex items-center gap-1 cursor-pointer ${
          viewingEventId === evId && viewMode === "players"
            ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30"
            : "border border-slate-200 text-slate-500 hover:border-[#3b82f6] hover:text-[#3b82f6]"
        }`}
      >
        <ClipboardList className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {viewingEventId === evId && viewMode === "players" ? "Hide Players" : "View Players"}
      </button>
    ) : null;

  const CaptainsBtn = ({ evId, sportName, size = "sm" }: { evId: number; sportName: string; size?: "sm" | "xs" }) => {
    if (!onViewCaptains || !isTeamSport(sportName)) return null;
    return (
      <button
        onClick={() => onViewCaptains(evId)}
        className={`${size === "xs" ? "text-[9px] px-2 py-1" : "text-[10px] px-2 py-1.5"} rounded${size === "xs" ? "" : "-lg"} transition-colors flex items-center gap-1 cursor-pointer ${
          viewingEventId === evId && viewMode === "captains"
            ? "bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30"
            : "border border-slate-200 text-slate-500 hover:border-[#f97316] hover:text-[#f97316]"
        }`}
      >
        <Users className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {viewingEventId === evId && viewMode === "captains" ? "Hide Captains" : "Nominated Captains"}
      </button>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl p-4"
      style={{
        background: "white",
        border: "1px solid rgba(99, 102, 241, 0.12)",
        boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
      }}
    >
      <div className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-between" style={{ color: "#6b7094" }}>
        <span>{title}</span>
        <span className={`px-2 py-0.5 rounded text-[10px] ${badgeColor}`}>{badge}</span>
      </div>
      <div className="space-y-2">
        {events.map(item => {
          // ── Multi-event tournaments (nested sportsEvents array) ──
          if (item.sportsEvents && item.sportsEvents.length > 0) {
            const isExpanded = !!expandedTournamentIds[item.id];
            return (
              <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3">
                {/* Tournament header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-sm font-bold text-slate-800">{item.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {item.eventDateStart && item.eventDateEnd
                        ? `${item.eventDateStart} — ${item.eventDateEnd}`
                        : item.createdAt ? `Created: ${format(new Date(item.createdAt), "MMM d")}` : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {showActivate && onActivate && (
                      <button onClick={() => onActivate(item.id)} className="text-[10px] px-2.5 py-1.5 bg-green-500/10 text-[#10b981] border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors font-medium cursor-pointer">
                        Open for Registration
                      </button>
                    )}
                    {onAnnounce && (
                      <button onClick={() => onAnnounce(item.id, item.name)} className="text-[10px] px-2.5 py-1.5 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-colors font-medium cursor-pointer flex items-center gap-1">
                        <Megaphone className="w-3 h-3" /> Announce
                      </button>
                    )}
                    <button
                      onClick={() => toggleEvents(item.id)}
                      className={`text-[10px] px-2 py-1.5 border rounded-lg transition-colors cursor-pointer ${
                        isExpanded
                          ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-semibold"
                          : "border-slate-200 text-slate-500 hover:border-indigo-500 hover:text-indigo-600"
                      }`}
                    >
                      Events ({item.sportsEvents.length})
                    </button>
                    <button onClick={() => onEdit(item)} className="text-[10px] px-2 py-1.5 border border-slate-200 text-slate-500 rounded-lg hover:border-[#f97316] hover:text-[#f97316] transition-colors cursor-pointer">
                      Edit
                    </button>
                    <button onClick={() => onDelete(item.id)} className="text-[10px] px-2 py-1.5 border border-slate-200 text-[#ef4444]/60 rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] transition-colors cursor-pointer">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Nested sports events */}
                {isExpanded && (
                  <div className="space-y-3 pl-3.5 border-l-2 border-slate-200 mt-2">
                    {item.sportsEvents.map((ev: any) => {
                      const registrationStatus = ev.registrationStatus || ev.status;
                      return (
                        <div key={ev.id} className="space-y-2">
                          <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200/60 shadow-sm">
                            <div className="min-w-0 flex-1 text-left">
                              <div className="text-xs font-semibold text-slate-800">{ev.name}</div>
                              <div className="text-[9px] text-slate-500 flex items-center gap-2 mt-0.5">
                                {ev.gender && <span>Gender: {ev.gender}</span>}
                                {ev.minAge && ev.maxAge && <span>Age: {ev.minAge}–{ev.maxAge}</span>}
                                {ev.maxParticipants && <span>Max Participants: {ev.maxParticipants}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {registrationStatus && registrationStatus !== "DRAFT" && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                  registrationStatus === "LIVE" || registrationStatus === "REGISTRATION_OPEN"
                                    ? "bg-green-500/20 text-[#10b981]"
                                    : registrationStatus === "COMPLETED"
                                    ? "bg-blue-500/20 text-[#3b82f6]"
                                    : "bg-[#f97316]/20 text-[#f97316]"
                                }`}>
                                  {registrationStatus}
                                </span>
                              )}
                              {hasRegistrationButtons && (
                                <>
                                  <PlayersBtn evId={ev.id} size="xs" />
                                  <CaptainsBtn evId={ev.id} sportName={ev.sport?.name || ""} size="xs" />
                                </>
                              )}
                            </div>
                          </div>
                          {hasRegistrationButtons && viewingEventId === ev.id && renderRegistrationPanel(ev)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // ── Single-event / fallback ──
          const ev = item.event
            ? { ...item.event, id: item.event.id, name: item.name || item.event.name, tournamentId: item.id }
            : item;
          const targetId = ev.tournamentId || ev.id;
          const registrationStatus = ev.registrationStatus || ev.status;

          return (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm">
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-sm font-semibold text-slate-800 truncate">{ev.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {ev.eventDateStart && ev.eventDateEnd
                      ? `${ev.eventDateStart} — ${ev.eventDateEnd}`
                      : item.createdAt ? `Created: ${format(new Date(item.createdAt), "MMM d")}` : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {registrationStatus && registrationStatus !== "DRAFT" && (
                    <span className={`text-[10px] px-2 py-1 rounded ${
                      registrationStatus === "LIVE" || registrationStatus === "REGISTRATION_OPEN"
                        ? "bg-green-500/20 text-[#10b981]"
                        : registrationStatus === "COMPLETED"
                        ? "bg-blue-500/20 text-[#3b82f6]"
                        : "bg-[#f97316]/20 text-[#f97316]"
                    }`}>
                      {registrationStatus}
                    </span>
                  )}
                  {hasRegistrationButtons && (
                    <>
                      <PlayersBtn evId={ev.id} />
                      <CaptainsBtn evId={ev.id} sportName={ev.sport?.name || ""} />
                    </>
                  )}
                  {showActivate && onActivate && (
                    <button onClick={() => onActivate(targetId)} className="text-[10px] px-2.5 py-1.5 bg-green-500/10 text-[#10b981] border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors font-medium cursor-pointer">
                      Open for Registration
                    </button>
                  )}
                  {onAnnounce && (
                    <button onClick={() => onAnnounce(targetId, ev.name)} className="text-[10px] px-2.5 py-1.5 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-colors font-medium cursor-pointer flex items-center gap-1">
                      <Megaphone className="w-3 h-3" /> Announce
                    </button>
                  )}
                  <button onClick={() => onEdit(item)} className="text-[10px] px-2 py-1.5 border border-slate-200 text-slate-500 rounded-lg hover:border-[#f97316] hover:text-[#f97316] transition-colors cursor-pointer">
                    Edit
                  </button>
                  <button onClick={() => onDelete(targetId)} className="text-[10px] px-2 py-1.5 border border-slate-200 text-[#ef4444]/60 rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] transition-colors cursor-pointer">
                    Delete
                  </button>
                </div>
              </div>
              {hasRegistrationButtons && viewingEventId === ev.id && renderRegistrationPanel(ev)}
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="text-center py-6 text-[10px] text-[#475569] italic">{emptyText}</div>
        )}
      </div>
    </div>
  );
}
