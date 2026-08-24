import { useState, useEffect, useMemo } from "react";
import {
  QrCode, Search, CheckCircle2, LogIn, LogOut, Loader2,
  ShieldCheck, Users, Clock, AlertCircle, Calendar, MapPin, Ticket
} from "lucide-react";
import { ErrorBanner, LoadingSpinner } from "./shared";
import {
  eventVolunteerService,
  type EventVolunteerResponse,
} from "../../../services/events/eventVolunteerService";
import { eventService, type EventResponse } from "../../../services/events/eventService";

type PassType = "VOLUNTEER" | "DEVOTEE";

interface DevoteePass {
  id: number | string;
  regCode: string;
  devoteeName: string;
  phone: string;
  activityTitle: string;
  activityType?: string;
  headCount: number;
  paymentStatus: string;
  status: string;
  gateStatus: "CHECKED_IN" | "AWAITING";
  checkInTime?: string;
  createdAt?: string;
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; Icon: typeof CheckCircle2 }> = {
  ACTIVE:       { label: "Active",       bg: "bg-blue-50",    text: "text-blue-700",   Icon: ShieldCheck  },
  CHECKED_IN:   { label: "Checked In",   bg: "bg-emerald-50", text: "text-emerald-700",Icon: CheckCircle2 },
  CHECKED_OUT:  { label: "Checked Out",  bg: "bg-slate-100",  text: "text-slate-500",  Icon: LogOut       },
  NO_SHOW:      { label: "No Show",      bg: "bg-rose-50",    text: "text-rose-700",   Icon: AlertCircle  },
  AWAITING:     { label: "Awaiting Gate", bg: "bg-amber-50",   text: "text-amber-700",  Icon: Clock        },
};

export function EventsGatePass() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [volunteers, setVolunteers] = useState<EventVolunteerResponse[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState<number | string | null>(null);
  const [tab, setTab] = useState<"ALL" | "VOLUNTEERS" | "DEVOTEES">("ALL");

  // Gate Scanner Lookup State
  const [qrSearch, setQrSearch] = useState("");
  const [qrResult, setQrResult] = useState<{
    type: PassType;
    volunteer?: EventVolunteerResponse;
    devotee?: DevoteePass;
  } | null>(null);
  const [qrNotFound, setQrNotFound] = useState(false);

  useEffect(() => {
    eventService.getAll()
      .then(evts => {
        const activeList = (evts || []).filter(e => {
          const s = String(e.status || "").toUpperCase();
          return s !== "CANCELLED" && s !== "CLOSED" && s !== "ARCHIVED";
        });
        setEvents(activeList);
        if (activeList.length > 0) setSelectedEventId(activeList[0].id);
      })
      .catch(() => {});
  }, []);

  const load = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setError("");
    try {
      const [vData, rData] = await Promise.all([
        eventVolunteerService.getAll(selectedEventId).catch(() => []),
        eventService.getAllRegistrations().catch(() => []),
      ]);
      setVolunteers(vData || []);

      const scopedRegs = (rData || []).filter((r: any) => {
        const s = String(r.status || "").toUpperCase();
        if (s === "CANCELLED" || s === "REJECTED") return false;
        return r.mainEventId === selectedEventId || r.eventId === selectedEventId;
      });
      setRegistrations(scopedRegs);
    } catch (e: any) {
      if (!e?.message?.toLowerCase().includes("403")) {
        setError(e?.message || "Failed to load gate pass data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedEventId]);

  const devoteePasses: DevoteePass[] = useMemo(() => {
    return registrations.map((r: any, idx) => ({
      id: r.id || `DEV-${idx}`,
      regCode: r.regCode || `REG-${String(r.id || idx + 1000).padStart(4, "0")}`,
      devoteeName: r.participantName || r.userName || r.userFullName || "Devotee Guest",
      phone: r.phone || r.contactNumber || "—",
      activityTitle: r.activityTitle || "Community Event Pass",
      activityType: r.category || r.activityType || "General",
      headCount: Number(r.devoteeCount ?? r.membersCount ?? 1) || 1,
      paymentStatus: r.paymentStatus || (r.isFree ? "FREE" : "PAID"),
      status: r.status || "CONFIRMED",
      gateStatus: r.gateCheckedIn ? "CHECKED_IN" : "AWAITING",
      checkInTime: r.gateCheckedInAt,
      createdAt: r.createdAt,
    }));
  }, [registrations]);

  const handleCheckIn = async (vol: EventVolunteerResponse) => {
    setActioningId(vol.id);
    try {
      await eventVolunteerService.checkIn(vol.id);
      await load();
      if (qrResult?.volunteer?.id === vol.id) {
        setQrResult({
          type: "VOLUNTEER",
          volunteer: { ...vol, status: "CHECKED_IN", checkInTime: new Date().toISOString() }
        });
      }
    } catch (e: any) {
      setError(e?.message || "Volunteer check-in failed");
    } finally {
      setActioningId(null);
    }
  };

  const handleCheckOut = async (vol: EventVolunteerResponse) => {
    setActioningId(vol.id);
    try {
      await eventVolunteerService.checkOut(vol.id);
      await load();
      if (qrResult?.volunteer?.id === vol.id) {
        setQrResult({
          type: "VOLUNTEER",
          volunteer: { ...vol, status: "CHECKED_OUT", checkOutTime: new Date().toISOString() }
        });
      }
    } catch (e: any) {
      setError(e?.message || "Volunteer check-out failed");
    } finally {
      setActioningId(null);
    }
  };

  const handleDevoteeCheckIn = (d: DevoteePass) => {
    setActioningId(d.id);
    setRegistrations(prev =>
      prev.map(r => (r.id === d.id || r.regCode === d.regCode) ? { ...r, gateCheckedIn: true, gateCheckedInAt: new Date().toISOString() } : r)
    );
    if (qrResult?.devotee?.id === d.id) {
      setQrResult({
        type: "DEVOTEE",
        devotee: { ...d, gateStatus: "CHECKED_IN", checkInTime: new Date().toISOString() }
      });
    }
    setTimeout(() => setActioningId(null), 300);
  };

  const handleQrLookup = () => {
    const q = qrSearch.trim().toLowerCase();
    if (!q) return;

    // Search volunteers first
    const foundVol = volunteers.find(v =>
      v.userName?.toLowerCase().includes(q) ||
      String(v.id).includes(q) ||
      String(v.userId).includes(q)
    );

    if (foundVol) {
      setQrResult({ type: "VOLUNTEER", volunteer: foundVol });
      setQrNotFound(false);
      return;
    }

    // Search devotee registrations
    const foundDev = devoteePasses.find(d =>
      d.regCode.toLowerCase().includes(q) ||
      d.devoteeName.toLowerCase().includes(q) ||
      d.phone.toLowerCase().includes(q) ||
      String(d.id).includes(q)
    );

    if (foundDev) {
      setQrResult({ type: "DEVOTEE", devotee: foundDev });
      setQrNotFound(false);
      return;
    }

    setQrResult(null);
    setQrNotFound(true);
  };

  const filteredVolunteers = volunteers.filter(v => {
    const q = search.toLowerCase();
    return !q || v.userName?.toLowerCase().includes(q) || (v.role ?? "").toLowerCase().includes(q) || (v.zone ?? "").toLowerCase().includes(q);
  });

  const filteredDevotees = devoteePasses.filter(d => {
    const q = search.toLowerCase();
    return !q || d.devoteeName.toLowerCase().includes(q) || d.regCode.toLowerCase().includes(q) || d.activityTitle.toLowerCase().includes(q) || d.phone.includes(q);
  });

  const volCheckedIn = volunteers.filter(v => v.status === "CHECKED_IN").length;
  const devCheckedIn = devoteePasses.filter(d => d.gateStatus === "CHECKED_IN").length;
  const totalCheckedIn = volCheckedIn + devCheckedIn;
  const totalAwaiting = volunteers.filter(v => v.status !== "CHECKED_IN" && v.status !== "CHECKED_OUT").length + devoteePasses.filter(d => d.gateStatus !== "CHECKED_IN").length;

  const activeEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Event Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              Gate Pass & Security Check-In
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Gate Scanner Active
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              QR badge scanning for Volunteers, Coordinators, and Devotee Attendees
            </p>
          </div>
        </div>

        {events.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <select
              value={selectedEventId ?? ""}
              onChange={(e) => setSelectedEventId(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer max-w-[200px] sm:max-w-[240px] truncate"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} {ev.startDate ? `(${ev.startDate})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeEvent && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold">📅 Scoped Event:</span>
            <span className="font-extrabold text-slate-900">{activeEvent.title}</span>
            {activeEvent.startDate && (
              <span className="text-slate-600 font-medium">
                ({activeEvent.startDate} {activeEvent.endDate ? `to ${activeEvent.endDate}` : ""})
              </span>
            )}
          </div>
          {activeEvent.location && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-500" /> {activeEvent.location}
            </span>
          )}
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: "Total Checked-In", value: totalCheckedIn, color: "#10b981", sub: "Admitted to venue" },
          { label: "Volunteers In", value: volCheckedIn, color: "#6366f1", sub: `of ${volunteers.length} total` },
          { label: "Devotees In", value: devCheckedIn, color: "#0ea5e9", sub: `of ${devoteePasses.length} registered` },
          { label: "Awaiting Gate", value: totalAwaiting, color: "#f59e0b", sub: "Expected arrivals" },
        ].map((k, i) => (
          <div
            key={k.label}
            className={`animate-fade-in-up stagger-${i + 1} bg-white rounded-2xl p-3 sm:p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-center`}
          >
            <p className="text-xl sm:text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{k.label}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* QR / Name lookup scanner simulation */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 pb-3 border-b border-slate-50">
          <QrCode className="w-4 h-4 text-emerald-500" />
          <h2 className="font-bold text-slate-800">Live Gate Pass Scanner</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex gap-2">
            <input
              value={qrSearch}
              onChange={e => { setQrSearch(e.target.value); setQrNotFound(false); setQrResult(null); }}
              onKeyDown={e => e.key === "Enter" && handleQrLookup()}
              placeholder="Scan QR code or enter Reg Code (e.g. REG-1001), Devotee Name, or Phone…"
              className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button
              onClick={handleQrLookup}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-sm"
            >
              <Search className="w-3.5 h-3.5" /> Lookup Pass
            </button>
          </div>

          {qrNotFound && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-xl text-rose-700 text-sm font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              No pass record found for &quot;{qrSearch}&quot; in this event
            </div>
          )}

          {qrResult && qrResult.type === "VOLUNTEER" && qrResult.volunteer && (
            <div className="flex items-center gap-4 p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
              <ShieldCheck className="w-10 h-10 text-indigo-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-900 text-sm sm:text-base">{qrResult.volunteer.userName}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    Official Volunteer Pass
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Role: <strong>{qrResult.volunteer.role ?? "General Volunteer"}</strong> · Zone: {qrResult.volunteer.zone ?? "Main"} · Shift: {qrResult.volunteer.shift ?? "Full Day"}
                </p>
                <div className="mt-1.5">
                  {(() => {
                    const s = STATUS_MAP[qrResult.volunteer.status] ?? STATUS_MAP.ACTIVE;
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
                {qrResult.volunteer.status !== "CHECKED_IN" && qrResult.volunteer.status !== "CHECKED_OUT" && (
                  <button
                    onClick={() => handleCheckIn(qrResult.volunteer!)}
                    disabled={actioningId === qrResult.volunteer.id}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
                  >
                    {actioningId === qrResult.volunteer.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                    Gate Check-In
                  </button>
                )}
                {qrResult.volunteer.status === "CHECKED_IN" && (
                  <button
                    onClick={() => handleCheckOut(qrResult.volunteer!)}
                    disabled={actioningId === qrResult.volunteer.id}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {actioningId === qrResult.volunteer.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                    Check Out
                  </button>
                )}
              </div>
            </div>
          )}

          {qrResult && qrResult.type === "DEVOTEE" && qrResult.devotee && (
            <div className="flex items-center gap-4 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
              <Ticket className="w-10 h-10 text-emerald-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-900 text-sm sm:text-base">{qrResult.devotee.devoteeName}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                    {qrResult.devotee.regCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                    {qrResult.devotee.paymentStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Activity / Pass: <strong>{qrResult.devotee.activityTitle}</strong> · Devotees: <strong>{qrResult.devotee.headCount} Persons</strong> · Phone: {qrResult.devotee.phone}
                </p>
                <div className="mt-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    qrResult.devotee.gateStatus === "CHECKED_IN" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {qrResult.devotee.gateStatus === "CHECKED_IN" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {qrResult.devotee.gateStatus === "CHECKED_IN" ? "Gate Admitted" : "Awaiting Admission"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {qrResult.devotee.gateStatus !== "CHECKED_IN" ? (
                  <button
                    onClick={() => handleDevoteeCheckIn(qrResult.devotee!)}
                    disabled={actioningId === qrResult.devotee.id}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
                  >
                    {actioningId === qrResult.devotee.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                    Admit Devotees
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Admitted
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendance & Passes List */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-slate-50 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" /> Gate Admissions Ledger
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTab("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${tab === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                All ({filteredVolunteers.length + filteredDevotees.length})
              </button>
              <button
                onClick={() => setTab("VOLUNTEERS")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${tab === "VOLUNTEERS" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Volunteers ({filteredVolunteers.length})
              </button>
              <button
                onClick={() => setTab("DEVOTEES")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${tab === "DEVOTEES" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Devotees ({filteredDevotees.length})
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, pass code, or phone…"
              className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 w-44 sm:w-60"
            />
          </div>
        </div>

        {loading && <LoadingSpinner label="Loading attendance data…" />}

        {!loading && filteredVolunteers.length === 0 && filteredDevotees.length === 0 && (
          <div className="px-6 py-12 text-center">
            <QrCode className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No passes or attendees registered for this event yet</p>
          </div>
        )}

        {/* Volunteer List */}
        {(tab === "ALL" || tab === "VOLUNTEERS") && filteredVolunteers.length > 0 && (
          <div className="divide-y divide-slate-50">
            {filteredVolunteers.map((vol, i) => {
              const s = STATUS_MAP[vol.status] ?? STATUS_MAP.ACTIVE;
              const SIcon = s.Icon;
              const isActioning = actioningId === vol.id;
              return (
                <div key={`vol-${vol.id}`} className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-slate-50/60 transition-colors`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-semibold text-sm text-slate-800">{vol.userName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">Volunteer</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.bg} ${s.text}`}>
                        <SIcon className="w-3 h-3" /> {s.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-slate-400">
                      {vol.role && <span>Role: {vol.role}</span>}
                      {vol.zone && <span>Zone: {vol.zone}</span>}
                      {vol.shift && <span>Shift: {vol.shift}</span>}
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
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <LogIn className="w-3 h-3" /> Check In
                          </button>
                        )}
                        {vol.status === "CHECKED_IN" && (
                          <button
                            onClick={() => handleCheckOut(vol)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-3 h-3" /> Check Out
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

        {/* Devotees List */}
        {(tab === "ALL" || tab === "DEVOTEES") && filteredDevotees.length > 0 && (
          <div className="divide-y divide-slate-50">
            {filteredDevotees.map((dev, i) => {
              const isActioning = actioningId === dev.id;
              const isCheckedIn = dev.gateStatus === "CHECKED_IN";
              return (
                <div key={`dev-${dev.id}`} className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)} flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-slate-50/60 transition-colors`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-semibold text-sm text-slate-800">{dev.devoteeName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 font-mono">
                        {dev.regCode}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                        {dev.headCount} Devotee(s)
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCheckedIn ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {isCheckedIn ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {isCheckedIn ? "Admitted" : "Awaiting"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-slate-400">
                      <span>Pass: {dev.activityTitle}</span>
                      {dev.phone && <span>Phone: {dev.phone}</span>}
                      <span>Payment: {dev.paymentStatus}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isActioning ? (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : (
                      !isCheckedIn ? (
                        <button
                          onClick={() => handleDevoteeCheckIn(dev)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                        >
                          <LogIn className="w-3 h-3" /> Admit Pass
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Admitted
                        </span>
                      )
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
