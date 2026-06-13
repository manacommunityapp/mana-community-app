import React, { useState, useEffect } from "react";
import { X, Clock, Loader2, RefreshCw } from "lucide-react";
import { TIME_OPTIONS } from "../../../constants/timeOptions";
import { venueService } from "../../../services/venueService";
import type { Venue, Court } from "../../../types/api";

interface VenueTimingModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: Venue | null;
  canEditTiming: boolean;
  onSaveSuccess?: (updatedVenue: Venue) => void;
}

export const VenueTimingModal: React.FC<VenueTimingModalProps> = ({
  isOpen,
  onClose,
  venue,
  canEditTiming,
  onSaveSuccess,
}) => {
  const [openingTime, setOpeningTime] = useState("08:00 AM");
  const [closingTime, setClosingTime] = useState("08:00 PM");
  const [courts, setCourts] = useState<Court[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (venue) {
      setOpeningTime(venue.openingTime || "08:00 AM");
      setClosingTime(venue.closingTime || "08:00 PM");
      setCourts(
        venue.courts?.map((c) => ({
          ...c,
          openingTime: c.openingTime || venue.openingTime || "08:00 AM",
          closingTime: c.closingTime || venue.closingTime || "08:00 PM",
        })) || []
      );
      setError(null);
    }
  }, [venue]);

  if (!isOpen || !venue) return null;

  const handleSyncAll = () => {
    if (!canEditTiming) return;
    setCourts((prev) =>
      prev.map((c) => ({
        ...c,
        openingTime: openingTime,
        closingTime: closingTime,
      }))
    );
  };

  const handleCourtTimeChange = (
    index: number,
    field: "openingTime" | "closingTime",
    value: string
  ) => {
    if (!canEditTiming) return;
    setCourts((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!canEditTiming) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Venue = {
        ...venue,
        openingTime,
        closingTime,
        courts: courts.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          openingTime: c.openingTime,
          closingTime: c.closingTime,
        })),
      };
      const updated = await venueService.updateVenue(venue.id, payload);
      if (onSaveSuccess) {
        onSaveSuccess(updated);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save timings");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
        style={{ borderColor: "rgba(99, 102, 241, 0.15)", boxShadow: "0 25px 80px rgba(99, 102, 241, 0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(99, 102, 241, 0.12)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#4f46e5" }}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#0d0d2b" }}>Configure Operating Hours</h2>
              <p className="text-xs mt-0.5" style={{ color: "#6b7094" }}>{venue.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
            style={{ color: "#6b7094" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)"; e.currentTarget.style.color = "#4f46e5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7094"; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Section 1: Venue-wide timing */}
          <div className="border rounded-2xl p-4 space-y-4" style={{ background: "rgba(99, 102, 241, 0.03)", borderColor: "rgba(99, 102, 241, 0.08)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7094" }}>
                Venue Timing (Default)
              </span>
              {!canEditTiming && (
                <span className="text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-full border" style={{ color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.2)" }}>
                  Read Only
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs block mb-1.5 font-semibold" style={{ color: "#6b7094" }}>Opening Time</label>
                <select
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  disabled={!canEditTiming}
                  className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs block mb-1.5 font-semibold" style={{ color: "#6b7094" }}>Closing Time</label>
                <select
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  disabled={!canEditTiming}
                  className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Court-wise timing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7094" }}>
                Court-Specific Timings
              </span>
              {canEditTiming && courts.length > 0 && (
                <button
                  type="button"
                  onClick={handleSyncAll}
                  className="inline-flex items-center gap-1 text-[11px] transition-colors bg-transparent border-none cursor-pointer font-medium"
                  style={{ color: "#4f46e5" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#7c3aed"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#4f46e5"; }}
                >
                  <RefreshCw className="w-3 h-3" /> Sync All with Venue
                </button>
              )}
            </div>

            {courts.length === 0 ? (
              <p className="text-xs italic p-4 rounded-2xl text-center border border-dashed"
                style={{ background: "rgba(99, 102, 241, 0.01)", borderColor: "rgba(99, 102, 241, 0.15)", color: "#6b7094" }}>
                No courts defined for this venue.
              </p>
            ) : (
              <div className="space-y-3">
                {courts.map((court, idx) => (
                  <div
                    key={court.id || idx}
                    className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    style={{ background: "rgba(99, 102, 241, 0.02)", borderColor: "rgba(99, 102, 241, 0.08)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: court.color || "#6366f1" }}
                      />
                      <span className="text-xs font-bold" style={{ color: "#0d0d2b" }}>
                        {court.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]" style={{ color: "#6b7094" }}>Open</span>
                        <select
                          value={court.openingTime || openingTime}
                          onChange={(e) =>
                            handleCourtTimeChange(idx, "openingTime", e.target.value)
                          }
                          disabled={!canEditTiming}
                          className="bg-white border rounded-xl px-2.5 py-1.5 text-xs outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                          style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]" style={{ color: "#6b7094" }}>Close</span>
                        <select
                          value={court.closingTime || closingTime}
                          onChange={(e) =>
                            handleCourtTimeChange(idx, "closingTime", e.target.value)
                          }
                          disabled={!canEditTiming}
                          className="bg-white border rounded-xl px-2.5 py-1.5 text-xs outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                          style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-2xl"
          style={{ background: "rgba(99, 102, 241, 0.02)", borderColor: "rgba(99, 102, 241, 0.12)" }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer bg-white"
            style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#6b7094" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.color = "#4f46e5"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.18)"; e.currentTarget.style.color = "#6b7094"; }}
          >
            Close
          </button>
          {canEditTiming && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSave}
              className="px-5 py-2 text-white text-xs font-medium uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-none flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                boxShadow: "0 2px 10px rgba(99,102,241,0.35)"
              }}
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Timings
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
