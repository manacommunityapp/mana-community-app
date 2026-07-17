import { useState, useEffect } from "react";
import { Loader2, Settings, CalendarIcon, Users, Trophy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { showError } from "../../../../utils/ToastUtils";
import { sportsAdminService, type AdminTournamentRow } from "../../../../services/sportsAdminService";
import { format, parseISO } from "date-fns";
import type { TabId } from "./useSportsAdminState";

interface SettingsTabProps {
  setActiveTab?: (tab: TabId) => void;
}

export function SettingsTab({ setActiveTab }: SettingsTabProps) {
  const [tournaments, setTournaments] = useState<AdminTournamentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    sportsAdminService.getOverview()
      .then(data => setTournaments(data.tournaments))
      .catch(() => showError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    try { return format(parseISO(d), "MMM dd, yyyy"); } catch { return d; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up text-left">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Tournament Configuration</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">View and manage settings for each tournament</p>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No tournaments configured yet. Create one from the Sports Event tab.
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map(t => {
              const isExpanded = expandedId === t.id;
              const isLive = t.registrationStatus === "LIVE";
              const isDone = t.registrationStatus === "COMPLETED";
              return (
                <div key={t.id} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{t.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {t.events.length} event{t.events.length !== 1 ? "s" : ""} configured
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        isLive ? "bg-red-50 text-red-600 border border-red-100" :
                        isDone ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        "bg-slate-50 text-slate-400 border border-slate-100"
                      }`}>
                        {t.registrationStatus || "DRAFT"}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-100 bg-slate-50/50">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Start Date</span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <CalendarIcon className="w-3 h-3 text-slate-400" />
                            {fmtDate(t.eventDateStart)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">End Date</span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <CalendarIcon className="w-3 h-3 text-slate-400" />
                            {fmtDate(t.eventDateEnd)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Max Participants</span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <Users className="w-3 h-3 text-slate-400" />
                            {t.maxParticipants ?? "Unlimited"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Status</span>
                          <div className="text-xs text-slate-700 font-medium">
                            {t.registrationStatus || "DRAFT"}
                          </div>
                        </div>
                      </div>

                      {t.events.length > 0 && (
                        <div>
                          <h5 className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Events</h5>
                          <div className="space-y-2">
                            {t.events.map(e => (
                              <div key={e.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-100">
                                <div>
                                  <span className="text-xs font-semibold text-slate-800">{e.name}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {e.sport?.name && (
                                      <span className="text-[10px] text-indigo-500 font-medium">{e.sport.icon} {e.sport.name}</span>
                                    )}
                                    {e.gender && (
                                      <span className="text-[10px] text-slate-400">{e.gender}</span>
                                    )}
                                    {e.tournamentType && (
                                      <span className="text-[10px] text-slate-400">{e.tournamentType}</span>
                                    )}
                                  </div>
                                </div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  e.registrationStatus === "REGISTRATION_OPEN" ? "bg-emerald-50 text-emerald-600" :
                                  e.registrationStatus === "LIVE" ? "bg-red-50 text-red-600" :
                                  "bg-slate-50 text-slate-400"
                                }`}>
                                  {e.registrationStatus || "DRAFT"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {setActiveTab && (
                        <button
                          onClick={() => setActiveTab("sports-event")}
                          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Edit Tournament Events
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {setActiveTab && (
          <>
            <button
              onClick={() => setActiveTab("create-venue")}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-left hover:shadow-md transition group"
            >
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">Venue Settings</h4>
              <p className="text-[11px] text-slate-400 mt-1">Manage venues, courts, and booking configurations</p>
            </button>
            <button
              onClick={() => setActiveTab("player-category")}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-left hover:shadow-md transition group"
            >
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">Player Categories</h4>
              <p className="text-[11px] text-slate-400 mt-1">Configure age groups, tiers, and grading boundaries</p>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
