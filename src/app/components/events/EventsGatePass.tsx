import { useState, useEffect } from "react";
import {
  QrCode, Search, CheckCircle2, LogIn, LogOut, Loader2,
  ShieldCheck, Users, Clock, AlertCircle,
} from "lucide-react";
import { ErrorBanner, LoadingSpinner } from "./shared";
import {
  eventVolunteerService,
  type EventVolunteerResponse,
} from "../../../services/events/eventVolunteerService";
import { eventService, type EventResponse } from "../../../services/events/eventService";

type CheckStatus = "active" | "checked_in" | "checked_out";

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; Icon: typeof CheckCircle2 }> = {
  ACTIVE:       { label: "Active",       bg: "bg-blue-50",    text: "text-blue-700",   Icon: ShieldCheck  },
  CHECKED_IN:   { label: "Checked In",   bg: "bg-emerald-50", text: "text-emerald-700",Icon: CheckCircle2 },
  CHECKED_OUT:  { label: "Checked Out",  bg: "bg-slate-100",  text: "text-slate-500",  Icon: LogOut       },
  NO_SHOW:      { label: "No Show",      bg: "bg-rose-50",    text: "text-rose-700",   Icon: AlertCircle  },
};

export function EventsGatePass() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [volunteers, setVolunteers] = useState<EventVolunteerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [qrSearch, setQrSearch] = useState("");
  const [qrResult, setQrResult] = useState<EventVolunteerResponse | null>(null);
  const [qrNotFound, setQrNotFound] = useState(false);

  useEffect(() => {
    eventService.getAll()
      .then(evts => {
        setEvents(evts);
        if (evts.length > 0) setSelectedEventId(evts[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    load();
  }, [selectedEventId]);

  const load = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setError("");
    try {
      const data = await eventVolunteerService.getAll(selectedEventId);
      setVolunteers(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load gate pass data");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (vol: EventVolunteerResponse) => {
    setActioningId(vol.id);
    try {
      await eventVolunteerService.checkIn(vol.id);
      await load();
      if (qrResult?.id === vol.id) {
        const updated = volunteers.find(v => v.id === vol.id);
        if (updated) setQrResult({ ...updated, status: "CHECKED_IN", checkInTime: new Date().toISOString() });
      }
    } catch (e: any) {
      setError(e?.message || "Check-in failed");
    } finally {
      setActioningId(null);
    }
  };

  const handleCheckOut = async (vol: EventVolunteerResponse) => {
    setActioningId(vol.id);
    try {
      await eventVolunteerService.checkOut(vol.id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Check-out failed");
    } finally {
      setActioningId(null);
    }
  };

  const handleQrLookup = () => {
    const q = qrSearch.trim().toLowerCase();
    if (!q) return;
    const found = volunteers.find(v =>
      v.userName?.toLowerCase().includes(q) ||
      String(v.id).includes(q) ||
      String(v.userId).includes(q)
    );
    setQrResult(found ?? null);
    setQrNotFound(!found);
  };

  const filtered = volunteers.filter(v => {
    const q = search.toLowerCase();
    return !q || v.userName?.toLowerCase().includes(q) || (v.role ?? "").toLowerCase().includes(q) || (v.zone ?? "").toLowerCase().includes(q);
  });

  const checkedIn = volunteers.filter(v => v.status === "CHECKED_IN").length;
  const checkedOut = volunteers.filter(v => v.status === "CHECKED_OUT").length;
  const active = volunteers.filter(v => v.status !== "CHECKED_IN" && v.status !== "CHECKED_OUT").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && <ErrorBanner message={error} />}

      {/* Event selector */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedEventId ?? ""}
          onChange={e => setSelectedEventId(Number(e.target.value))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {events.length === 0 && <option value="">Loading events…</option>}
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: "Checked In",  value: checkedIn,  color: "#10b981" },
          { label: "Checked Out", value: checkedOut, color: "#6366f1" },
          { label: "Awaiting",    value: active,     color: "#f59e0b" },
        ].map((k, i) => (
          <div
            key={k.label}
            className={`animate-fade-in-up stagger-${i + 1} bg-white rounded-2xl p-3 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center`}
          >
            <p className="text-xl sm:text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* QR / Name lookup scanner simulation */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 pb-3 border-b border-slate-50">
          <QrCode className="w-4 h-4 text-indigo-500" />
          <h2 className="font-bold text-slate-800">Gate Scanner</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex gap-2">
            <input
              value={qrSearch}
              onChange={e => { setQrSearch(e.target.value); setQrNotFound(false); setQrResult(null); }}
              onKeyDown={e => e.key === "Enter" && handleQrLookup()}
              placeholder="Enter volunteer name or ID to simulate scan…"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={handleQrLookup}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
            >
              <Search className="w-3.5 h-3.5" /> Lookup
            </button>
          </div>

          {qrNotFound && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-xl text-rose-700 text-sm font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              No match found for "{qrSearch}"
            </div>
          )}

          {qrResult && (
            <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-emerald-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-slate-800">{qrResult.userName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {qrResult.role ?? "Volunteer"} · {qrResult.zone ?? "General"} · {qrResult.shift ?? "—"}
                </p>
                <div className="mt-1.5">
                  {(() => {
                    const s = STATUS_MAP[qrResult.status] ?? STATUS_MAP.ACTIVE;
                    const SIcon = s.Icon;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>
                        <SIcon className="w-3 h-3" /> {s.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {qrResult.status !== "CHECKED_IN" && qrResult.status !== "CHECKED_OUT" && (
                  <button
                    onClick={() => handleCheckIn(qrResult)}
                    disabled={actioningId === qrResult.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {actioningId === qrResult.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                    Check In
                  </button>
                )}
                {qrResult.status === "CHECKED_IN" && (
                  <button
                    onClick={() => handleCheckOut(qrResult)}
                    disabled={actioningId === qrResult.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    {actioningId === qrResult.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                    Check Out
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Volunteer attendance list */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-slate-50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" /> Volunteer Attendance
          </h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter…"
              className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-36 sm:w-48"
            />
          </div>
        </div>

        {loading && <LoadingSpinner label="Loading attendance…" />}

        {!loading && filtered.length === 0 && (
          <div className="px-6 py-12 text-center">
            <QrCode className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No volunteers registered yet</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="divide-y divide-slate-50">
            {filtered.map((vol, i) => {
              const s = STATUS_MAP[vol.status] ?? STATUS_MAP.ACTIVE;
              const SIcon = s.Icon;
              const isActioning = actioningId === vol.id;
              return (
                <div key={vol.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} flex items-center gap-3 px-4 sm:px-6 py-3`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-semibold text-sm text-slate-800">{vol.userName}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.bg} ${s.text}`}>
                        <SIcon className="w-3 h-3" /> {s.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {vol.role && <span className="text-xs text-slate-400">{vol.role}</span>}
                      {vol.zone && <span className="text-xs text-slate-400">Zone: {vol.zone}</span>}
                      {vol.shift && <span className="text-xs text-slate-400">Shift: {vol.shift}</span>}
                    </div>
                    {(vol.checkInTime || vol.checkOutTime) && (
                      <div className="flex gap-3 mt-0.5">
                        {vol.checkInTime && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                            <Clock className="w-3 h-3" />
                            In: {new Date(vol.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        {vol.checkOutTime && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            Out: {new Date(vol.checkOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isActioning ? (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : (
                      <>
                        {vol.status !== "CHECKED_IN" && vol.status !== "CHECKED_OUT" && (
                          <button
                            onClick={() => handleCheckIn(vol)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          >
                            <LogIn className="w-3 h-3" /> In
                          </button>
                        )}
                        {vol.status === "CHECKED_IN" && (
                          <button
                            onClick={() => handleCheckOut(vol)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            <LogOut className="w-3 h-3" /> Out
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
