import React, { useState } from "react";
import { kittyPartyService } from "../../../services/kittyPartyService";
import type { CreateKittyPartyEventRequest, KittyPartyEventType, KittyPartyVenueType } from "../../../types/kittyPartyTypes";

interface Props {
  circleId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const KittyPartyEventCreateModal: React.FC<Props> = ({
  circleId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<KittyPartyEventType>("KITTY_MONTHLY");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venueType, setVenueType] = useState<KittyPartyVenueType>("HOST_HOME");
  const [venueAddress, setVenueAddress] = useState("");
  const [maxAttendees, setMaxAttendees] = useState<number | "">("");
  const [recurrenceRule, setRecurrenceRule] = useState("NONE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !startTime || !endTime) {
      setError("Please fill in event name, start time, and end time.");
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const payload: CreateKittyPartyEventRequest = {
        eventName: eventName.trim(),
        description: description.trim() || undefined,
        eventType,
        startTime,
        endTime,
        venueType,
        venueAddress: venueAddress.trim() || undefined,
        maxAttendees: maxAttendees === "" ? undefined : Number(maxAttendees),
        recurrenceRule,
      };

      await kittyPartyService.createEvent(circleId, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to schedule party event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule Party Gathering</h2>
            <p className="text-xs text-gray-500 mt-0.5">Plan your monthly kitty meet, theme party, or casual meetup</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. November Gold Kitty & High Tea"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as KittyPartyEventType)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="KITTY_MONTHLY">Monthly Kitty Gathering</option>
                <option value="THEMED_PARTY">Themed Celebration</option>
                <option value="CASUAL_MEETUP">Casual Coffee / Meetup</option>
                <option value="FESTIVAL_CELEBRATION">Festival Celebration</option>
                <option value="OTHER">Other Gathering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Venue Type
              </label>
              <select
                value={venueType}
                onChange={(e) => setVenueType(e.target.value as KittyPartyVenueType)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="HOST_HOME">Host's Home</option>
                <option value="COMMUNITY_HALL">Clubhouse / Community Hall</option>
                <option value="RESTAURANT">Café / Restaurant</option>
                <option value="ONLINE_VIRTUAL">Virtual / Online Room</option>
                <option value="OTHER">Other Venue</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Venue Address / Details
            </label>
            <input
              type="text"
              placeholder="e.g. Villa #42, Rosewood Block or Clubhouse 2nd Floor"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Max Capacity
              </label>
              <input
                type="number"
                min="1"
                placeholder="Leave blank for unlimited"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Recurrence
              </label>
              <select
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="NONE">One-time Gathering</option>
                <option value="MONTHLY">Monthly</option>
                <option value="BI_WEEKLY">Bi-weekly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Description & Theme
            </label>
            <textarea
              rows={3}
              placeholder="Dress code, games planned (Tambola, antakshari), potluck instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition"
            >
              {submitting ? "Scheduling..." : "Schedule Gathering"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
