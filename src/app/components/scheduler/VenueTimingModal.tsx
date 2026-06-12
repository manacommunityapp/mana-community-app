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
        className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
        style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3a5c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-[#f97316]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f1f5f9]">Configure Operating Hours</h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">{venue.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#1e293b] rounded-lg text-[#94a3b8] hover:text-white transition-colors border-none bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Section 1: Venue-wide timing */}
          <div className="bg-[#0c1220]/40 border border-[#2a3a5c]/60 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Venue Timing (Default)
              </span>
              {!canEditTiming && (
                <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/10">
                  Read Only
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1">Opening Time</label>
                <select
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  disabled={!canEditTiming}
                  className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1">Closing Time</label>
                <select
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  disabled={!canEditTiming}
                  className="w-full bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-3 py-2.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Court-Specific Timings
              </span>
              {canEditTiming && courts.length > 0 && (
                <button
                  type="button"
                  onClick={handleSyncAll}
                  className="inline-flex items-center gap-1 text-[11px] text-[#f97316] hover:text-[#ea580c] transition-colors bg-transparent border-none cursor-pointer font-medium"
                >
                  <RefreshCw className="w-3 h-3" /> Sync All with Venue
                </button>
              )}
            </div>

            {courts.length === 0 ? (
              <p className="text-xs text-[#475569] italic bg-[#0c1220]/20 p-4 rounded-xl text-center border border-dashed border-[#2a3a5c]">
                No courts defined for this venue.
              </p>
            ) : (
              <div className="space-y-3">
                {courts.map((court, idx) => (
                  <div
                    key={court.id || idx}
                    className="p-4 bg-[#0c1220]/20 border border-[#2a3a5c]/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-inner shrink-0"
                        style={{ backgroundColor: court.color || "#3b82f6" }}
                      />
                      <span className="text-xs font-semibold text-slate-200">
                        {court.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#94a3b8]">Open</span>
                        <select
                          value={court.openingTime || openingTime}
                          onChange={(e) =>
                            handleCourtTimeChange(idx, "openingTime", e.target.value)
                          }
                          disabled={!canEditTiming}
                          className="bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#94a3b8]">Close</span>
                        <select
                          value={court.closingTime || closingTime}
                          onChange={(e) =>
                            handleCourtTimeChange(idx, "closingTime", e.target.value)
                          }
                          disabled={!canEditTiming}
                          className="bg-[#0c1220] border border-[#2a3a5c] rounded-lg px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:border-[#f97316] outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2a3a5c] bg-[#0c1220]/40 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#1a2540] hover:bg-[#2a3a5c] text-xs font-semibold text-[#94a3b8] rounded-xl transition-colors border border-[#2a3a5c] cursor-pointer"
          >
            Close
          </button>
          {canEditTiming && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSave}
              className="px-5 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-none flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
