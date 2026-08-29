import React, { useState, useEffect } from "react";
import { Sparkles, Users, Clock, Loader2, AlertCircle } from "lucide-react";
import { GlassCard, TouchButton, StatusChip, BottomSheet } from "./EventDesignSystem";
import { eventService } from "../../../../services/events/eventService";

interface CulturalActivitiesViewProps {
  isDark?: boolean;
  mainEventId?: number;
}

export const CulturalActivitiesView: React.FC<CulturalActivitiesViewProps> = ({ isDark = false, mainEventId }) => {
  const [selectedAct, setSelectedAct] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Registration form state
  const [participantName, setParticipantName] = useState("");
  const [regSaving, setRegSaving] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      eventService.getCulturalEvents(mainEventId),
      eventService.getMyCulturalRegistrations(),
    ])
      .then(([acts, regs]) => {
        setActivities(acts || []);
        setRegistrations(regs || []);
      })
      .catch(e => setError(e?.message || "Failed to load cultural activities"))
      .finally(() => setLoading(false));
  }, [mainEventId]);

  const isRegistered = (act: any) =>
    registrations.some(r => r.culturalEventId === act.id && r.status !== "CANCELLED");

  const bookedCount = (act: any) =>
    registrations.filter(r => r.culturalEventId === act.id && r.status !== "CANCELLED")
      .reduce((sum: number, r: any) => sum + (r.devoteeCount || 1), 0);

  const isFull = (act: any) =>
    act.capacity != null && bookedCount(act) >= act.capacity;

  const getStatus = (act: any) => {
    if (act.status === "CANCELLED") return "Cancelled";
    if (isFull(act)) return "Seats Full";
    if (!act.needsRegistration) return "Open - No Sign-up";
    return "Registration Open";
  };

  const handleEnroll = async () => {
    if (!selectedAct || !participantName.trim()) {
      setRegError("Participant name is required");
      return;
    }
    setRegSaving(true);
    setRegError("");
    try {
      const created = await eventService.createCulturalRegistration({
        culturalEventId: selectedAct.id,
        participantName: participantName.trim(),
        devoteeCount: 1,
      });
      setRegistrations(prev => [...prev, created]);
      setRegSuccess(created.regCode || "Registration confirmed!");
      setParticipantName("");
      setTimeout(() => { setSelectedAct(null); setRegSuccess(null); }, 2500);
    } catch (e: any) {
      setRegError(e?.message || "Registration failed. Please try again.");
    } finally {
      setRegSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading cultural activities...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-sm font-semibold">No cultural activities scheduled yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <span className="text-[11px] font-extrabold text-[#FF6B00] uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Cultural Extravaganza
        </span>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Cultural Performances</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Register your family members for music, dance, drama and art performances.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activities.map((act) => {
          const booked = bookedCount(act);
          const total = act.capacity ?? null;
          const seatsLeft = total != null ? total - booked : null;
          const registered = isRegistered(act);
          const full = isFull(act);
          const status = getStatus(act);

          return (
            <GlassCard
              key={act.id}
              isDark={isDark}
              hoverScale={false}
              className="overflow-hidden border flex flex-col justify-between"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{act.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#FF6B00]">{act.category}</span>
                      {act.perfType && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{act.perfType}</span>}
                      {act.ageGroup && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700">{act.ageGroup}</span>}
                    </div>
                  </div>
                  <StatusChip status={status} isDark={isDark} />
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  {act.date && <span className="flex items-center gap-1">📅 {act.date}</span>}
                  {act.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {act.startTime}{act.duration ? ` (${act.duration}m)` : ""}</span>}
                  {act.stage && <span className="flex items-center gap-1">📍 {act.stage}</span>}
                </div>

                {total != null && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Users className="w-3 h-3 text-[#FF6B00]" /> {booked} / {total} Enrolled
                      </span>
                      <span className={full ? "text-rose-500" : seatsLeft! <= 5 ? "text-amber-500" : "text-emerald-500"}>
                        {full ? "FULL" : `${seatsLeft} seats left`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        style={{ width: `${(booked / total) * 100}%` }}
                        className="h-full bg-gradient-to-r from-[#FF6B00] to-[#4F46E5] rounded-full"
                      />
                    </div>
                  </div>
                )}

                <TouchButton
                  variant={registered ? "glass" : full ? "ghost" : act.needsRegistration === false ? "ghost" : "primary"}
                  size="sm"
                  fullWidth
                  disabled={full || act.needsRegistration === false || act.status === "CANCELLED"}
                  onClick={() => { setSelectedAct(act); setParticipantName(""); setRegError(""); setRegSuccess(null); }}
                >
                  {registered
                    ? "✅ Registered"
                    : act.needsRegistration === false
                    ? "Open — No Registration Needed"
                    : full
                    ? "Registration Closed"
                    : "Register Now"}
                </TouchButton>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Enroll Sheet */}
      <BottomSheet
        isOpen={!!selectedAct}
        onClose={() => setSelectedAct(null)}
        title={selectedAct?.name}
        subtitle={`Confirm participation details for ${selectedAct?.category}.`}
        isDark={isDark}
      >
        {selectedAct && (
          <div className="space-y-4 p-2">
            {regSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <p className="font-bold text-emerald-700 text-sm">Registered!</p>
                <p className="font-mono text-emerald-600 text-xs mt-1">{regSuccess}</p>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 space-y-1 text-xs">
                  {selectedAct.date && <p className="text-slate-500">Date: {selectedAct.date}{selectedAct.startTime ? ` at ${selectedAct.startTime}` : ""}</p>}
                  {selectedAct.stage && <p className="text-slate-500">Venue: {selectedAct.stage}</p>}
                  {selectedAct.ageGroup && <p className="text-slate-500">Age Group: {selectedAct.ageGroup}</p>}
                </div>

                {regError && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                    <AlertCircle className="w-3.5 h-3.5" /> {regError}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Participant / Group Name *</label>
                  <input
                    type="text"
                    value={participantName}
                    onChange={e => setParticipantName(e.target.value)}
                    placeholder="e.g. Aarav Kumar or Nataraj Group"
                    className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-[#FF6B00]/30"
                  />
                </div>

                <TouchButton variant="primary" fullWidth disabled={regSaving} onClick={handleEnroll}>
                  {regSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm & Book Slot"}
                </TouchButton>
              </>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
