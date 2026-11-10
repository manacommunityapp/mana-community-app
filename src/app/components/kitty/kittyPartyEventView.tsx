import React, { useEffect, useState } from "react";
import { kittyPartyService } from "../../../services/kittyPartyService";
import type {
  KittyPartyEvent,
  KittyPartyRsvp,
  KittyPartyRsvpResponse,
  KittyPartyAttendance,
  MemberRole,
} from "../../../types/kittyPartyTypes";
import { hasPermission } from "../../../utils/kittyPartyPermissions";
import { KittyPartyEventCreateModal } from "./kittyPartyEventCreateModal";

interface Props {
  circleId: number;
  currentUserRole?: MemberRole;
}

export const KittyPartyEventView: React.FC<Props> = ({ circleId, currentUserRole }) => {
  const [events, setEvents] = useState<KittyPartyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // RSVP Dialog state
  const [activeRsvpEvent, setActiveRsvpEvent] = useState<KittyPartyEvent | null>(null);
  const [guestCount, setGuestCount] = useState(0);
  const [rsvpNotes, setRsvpNotes] = useState("");
  const [submittingRsvp, setSubmittingRsvp] = useState(false);

  // Attendees modal state
  const [viewAttendeesEvent, setViewAttendeesEvent] = useState<KittyPartyEvent | null>(null);
  const [attendeeList, setAttendeeList] = useState<KittyPartyRsvp[]>([]);
  const [attendanceList, setAttendanceList] = useState<KittyPartyAttendance[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  useEffect(() => {
    if (circleId) {
      loadEvents();
    }
  }, [circleId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kittyPartyService.getEvents(circleId);
      setEvents(data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRsvp = async (event: KittyPartyEvent, response: KittyPartyRsvpResponse) => {
    try {
      await kittyPartyService.submitRsvp(event.id, {
        response,
        guestCount: 0,
      });
      loadEvents();
    } catch (err: any) {
      alert(err?.message || "Failed to submit RSVP");
    }
  };

  const handleDetailedRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRsvpEvent) return;
    try {
      setSubmittingRsvp(true);
      await kittyPartyService.submitRsvp(activeRsvpEvent.id, {
        response: "GOING",
        guestCount,
        notes: rsvpNotes.trim() || undefined,
      });
      setActiveRsvpEvent(null);
      loadEvents();
    } catch (err: any) {
      alert(err?.message || "Failed to submit RSVP");
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const handleOpenAttendees = async (event: KittyPartyEvent) => {
    setViewAttendeesEvent(event);
    try {
      setLoadingAttendees(true);
      const [rsvps, attendances] = await Promise.all([
        kittyPartyService.getEventRsvps(event.id),
        kittyPartyService.getEventAttendance(event.id),
      ]);
      setAttendeeList(rsvps || []);
      setAttendanceList(attendances || []);
    } catch (err: any) {
      console.error("Failed to load attendees", err);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleMarkAttendance = async (eventId: number, userId: number, status: "PRESENT" | "ABSENT" | "LATE") => {
    try {
      await kittyPartyService.markAttendance(eventId, {
        userId,
        attendanceStatus: status,
      });
      const updated = await kittyPartyService.getEventAttendance(eventId);
      setAttendanceList(updated || []);
    } catch (err: any) {
      alert(err?.message || "Failed to mark attendance");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const getVenueLabel = (type: string) => {
    switch (type) {
      case "HOST_HOME":
        return "Host's Residence";
      case "COMMUNITY_HALL":
        return "Clubhouse / Community Hall";
      case "RESTAURANT":
        return "Café / Restaurant";
      case "ONLINE_VIRTUAL":
        return "Virtual Online Gathering";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>🎉</span> Kitty Gatherings & Event Calendar
          </h3>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            Schedule recurring kitty meets, track RSVPs, manage potluck themes, and record member attendance.
          </p>
        </div>
        {hasPermission(currentUserRole, 'CREATE_EVENT') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0"
          >
            <span>+</span> Schedule Gathering
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading gatherings...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">{error}</div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6">
          <div className="text-4xl mb-2">🗓️</div>
          <h4 className="text-base font-semibold text-gray-900">No Gatherings Scheduled Yet</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
            Organize your circle's next monthly meetup, food tasting, or games evening.
          </p>
          {hasPermission(currentUserRole, 'CREATE_EVENT') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow"
            >
              Plan First Gathering
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => {
            const isGoing = event.currentUserRsvp === "GOING";
            const isMaybe = event.currentUserRsvp === "MAYBE";
            const isNotGoing = event.currentUserRsvp === "NOT_GOING";
            const isWaitlisted = event.currentUserRsvp === "WAITLISTED";

            return (
              <div
                key={event.id}
                className="rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                        {event.eventType.replace(/_/g, " ")}
                      </span>
                      <h4 className="text-base font-bold text-gray-900 line-clamp-1">{event.eventName}</h4>
                    </div>
                    {event.recurrenceRule && event.recurrenceRule !== "NONE" && (
                      <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 shrink-0">
                        🔁 {event.recurrenceRule}
                      </span>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3">{event.description}</p>
                  )}

                  <div className="space-y-1.5 text-xs text-gray-600 mb-4 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">📅</span>
                      <span className="font-medium text-gray-800">
                        {formatDate(event.startTime)} • {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">📍</span>
                      <span className="text-gray-700 truncate">
                        {getVenueLabel(event.venueType)}
                        {event.venueAddress ? ` • ${event.venueAddress}` : ""}
                      </span>
                    </div>
                    {event.hostName && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">👑</span>
                        <span>
                          Host: <strong className="text-gray-800 font-semibold">{event.hostName}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* RSVP stats */}
                  <div className="flex items-center justify-between text-xs py-2 border-t border-b border-gray-100 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-emerald-700">✓ {event.goingCount} Going</span>
                      <span className="text-amber-700 font-medium">? {event.maybeCount} Maybe</span>
                      <span className="text-gray-400">✕ {event.notGoingCount} Can't</span>
                    </div>
                    {event.maxAttendees && (
                      <span className="text-gray-500 font-medium text-[11px]">
                        Cap: {event.goingCount}/{event.maxAttendees}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {/* Current User Status & Gate Pass Pill */}
                  {event.currentUserRsvp && (
                    <div className="mb-2 space-y-1.5 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          isGoing
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : isMaybe
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : isWaitlisted
                            ? "bg-purple-100 text-purple-800 border border-purple-300"
                            : "bg-gray-100 text-gray-700 border border-gray-300"
                        }`}
                      >
                        Your Status: {event.currentUserRsvp}
                      </span>
                      {isGoing && event.gatePassCode && (
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-left">
                          <div className="text-[10px] font-bold text-amber-900 uppercase flex items-center justify-between">
                            <span>🎟️ Visitor Gate Pass</span>
                            <span className="font-mono text-xs bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded font-extrabold tracking-wider">
                              {event.gatePassCode}
                            </span>
                          </div>
                          <p className="text-[10px] text-amber-700 mt-0.5">
                            Show this pass code at the security gate for smooth society entry.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleQuickRsvp(event, "GOING")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition border ${
                        isGoing
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      Going
                    </button>
                    <button
                      onClick={() => setActiveRsvpEvent(event)}
                      title="Bring guests / add potluck notes"
                      className="px-2 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                    >
                      + Guests
                    </button>
                    <button
                      onClick={() => handleQuickRsvp(event, "MAYBE")}
                      className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition border ${
                        isMaybe
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
                      }`}
                    >
                      Maybe
                    </button>
                    <button
                      onClick={() => handleQuickRsvp(event, "NOT_GOING")}
                      className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition border ${
                        isNotGoing
                          ? "bg-gray-600 text-white border-gray-600"
                          : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Can't
                    </button>
                    <button
                      onClick={() => handleOpenAttendees(event)}
                      className="p-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition border border-gray-200"
                      title="View attendees & attendance"
                    >
                      👥
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `🎉 You're invited to "${event.eventName}" on ${formatDate(event.startTime)} (${getVenueLabel(
                          event.venueType
                        )})! RSVP on Mana Community App: ${window.location.origin}/kitty-party/${circleId}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-xs text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition border border-emerald-200"
                      title="Share invite on WhatsApp"
                    >
                      💬
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <KittyPartyEventCreateModal
        circleId={circleId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadEvents}
      />

      {/* Guest Count RSVP Dialog */}
      {activeRsvpEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
            <h4 className="text-base font-bold text-gray-900 mb-1">RSVP with Guests</h4>
            <p className="text-xs text-gray-500 mb-4">
              Joining <strong className="text-gray-800">{activeRsvpEvent.eventName}</strong>
            </p>
            <form onSubmit={handleDetailedRsvpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Extra Guests (Family / Friends)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGuestCount(Math.max(0, guestCount - 1))}
                    className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                  >
                    -
                  </button>
                  <span className="text-base font-bold text-gray-800 w-8 text-center">{guestCount}</span>
                  <button
                    type="button"
                    onClick={() => setGuestCount(guestCount + 1)}
                    className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Potluck / Special Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bringing Gulab Jamun & samosas"
                  value={rsvpNotes}
                  onChange={(e) => setRsvpNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveRsvpEvent(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRsvp}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow"
                >
                  {submittingRsvp ? "Saving..." : "Confirm Going"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendees and Check-in Modal */}
      {viewAttendeesEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h4 className="text-base font-bold text-gray-900">Attendees & Attendance Check-in</h4>
                <p className="text-xs text-gray-500">{viewAttendeesEvent.eventName}</p>
              </div>
              <button
                onClick={() => setViewAttendeesEvent(null)}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto mt-4 space-y-3 pr-1 flex-1">
              {loadingAttendees ? (
                <div className="py-8 text-center text-xs text-gray-500">Loading attendee records...</div>
              ) : attendeeList.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">No RSVPs recorded yet.</div>
              ) : (
                attendeeList.map((rsvp) => {
                  const att = attendanceList.find((a) => a.userId === rsvp.userId);

                  return (
                    <div
                      key={rsvp.id}
                      className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">
                          {rsvp.userName}
                          {rsvp.guestCount > 0 && (
                            <span className="ml-1 text-[11px] text-gray-500 font-normal">
                              (+{rsvp.guestCount} guests)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span>Status: <strong className="text-emerald-700">{rsvp.response}</strong></span>
                          {rsvp.notes && <span>• "{rsvp.notes}"</span>}
                          {rsvp.gatePassCode && (
                            <span className="font-mono text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                              🎟️ {rsvp.gatePassCode}
                            </span>
                          )}
                        </div>
                        {att && (
                          <div className="mt-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                att.attendanceStatus === "PRESENT"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : att.attendanceStatus === "LATE"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              Check-in: {att.attendanceStatus}
                            </span>
                          </div>
                        )}
                      </div>

                      {hasPermission(currentUserRole, 'CHECK_IN_ATTENDEES') && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleMarkAttendance(viewAttendeesEvent.id, rsvp.userId, "PRESENT")}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-medium hover:bg-emerald-700"
                            title="Mark Present"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(viewAttendeesEvent.id, rsvp.userId, "LATE")}
                            className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] font-medium hover:bg-amber-600"
                            title="Mark Late"
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(viewAttendeesEvent.id, rsvp.userId, "ABSENT")}
                            className="px-2 py-1 bg-gray-400 text-white rounded text-[10px] font-medium hover:bg-gray-500"
                            title="Mark Absent"
                          >
                            Absent
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
