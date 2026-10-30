import { useState, useEffect } from "react";
import {
  Trophy,
  Calendar,
  Users,
  Award,
  DollarSign,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  X,
  Phone,
  Mail,
  Camera,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { sportsCommerceService } from "../../../../../services/sports/sportsCommerceService";
import { sportsVendorService } from "../../../../../services/sports/sportsVendorService";
import type {
  TournamentOrganizerEvent,
  SportsOfficial,
  OfficialAssignment,
  OfficialRole,
} from "../../../../../types/sportsCommerce";
import type { SportsFacility, SportType } from "../../../../../types/sportsVendor";

type Tab = "EVENTS" | "OFFICIALS" | "ASSIGNMENTS";

export function SportsEventsOrganizerPortal() {
  const [activeTab, setActiveTab] = useState<Tab>("EVENTS");
  const [events, setEvents] = useState<TournamentOrganizerEvent[]>([]);
  const [officials, setOfficials] = useState<SportsOfficial[]>([]);
  const [assignments, setAssignments] = useState<OfficialAssignment[]>([]);
  const [facilities, setFacilities] = useState<SportsFacility[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Event Form
  const [eventForm, setEventForm] = useState<{
    title: string;
    sport: SportType;
    tournamentFormat: "KNOCKOUT" | "LEAGUE_CUM_KNOCKOUT" | "ROUND_ROBIN";
    facilityId: string;
    startDate: string;
    endDate: string;
    teamsLimit: number;
    entryFeePerTeam: number;
    totalPrizePool: number;
  }>({
    title: "",
    sport: "BADMINTON",
    tournamentFormat: "LEAGUE_CUM_KNOCKOUT",
    facilityId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    teamsLimit: 16,
    entryFeePerTeam: 4000,
    totalPrizePool: 30000,
  });

  // Assign Official Form
  const [assignForm, setAssignForm] = useState<{
    tournamentId: string;
    officialId: string;
    matchTitle: string;
    courtOrPitch: string;
    matchDate: string;
    startTime: string;
  }>({
    tournamentId: "",
    officialId: "",
    matchTitle: "",
    courtOrPitch: "Court 1",
    matchDate: new Date().toISOString().split("T")[0],
    startTime: "10:00",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [eData, oData, aData, fData] = await Promise.all([
        sportsCommerceService.getOrganizerEvents(),
        sportsCommerceService.getOfficials(),
        sportsCommerceService.getAssignments(),
        sportsVendorService.getFacilities(),
      ]);
      setEvents(eData);
      setOfficials(oData);
      setAssignments(aData);
      setFacilities(fData);

      if (fData.length > 0 && !eventForm.facilityId) {
        setEventForm((prev) => ({ ...prev, facilityId: fData[0].id }));
      }
      if (eData.length > 0 && !assignForm.tournamentId) {
        setAssignForm((prev) => ({ ...prev, tournamentId: eData[0].id }));
      }
      if (oData.length > 0 && !assignForm.officialId) {
        setAssignForm((prev) => ({ ...prev, officialId: oData[0].id }));
      }
    } catch (err) {
      toast.error("Failed to load organizer event data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventForm.title) {
      toast.error("Please enter tournament title");
      return;
    }

    const facility = facilities.find((f) => f.id === eventForm.facilityId);

    try {
      const saved = await sportsCommerceService.saveOrganizerEvent({
        title: eventForm.title,
        sport: eventForm.sport,
        tournamentFormat: eventForm.tournamentFormat,
        facilityId: eventForm.facilityId,
        facilityName: facility?.name || "Sports Facility",
        startDate: eventForm.startDate,
        endDate: eventForm.endDate,
        teamsLimit: Number(eventForm.teamsLimit),
        entryFeePerTeam: Number(eventForm.entryFeePerTeam),
        totalPrizePool: Number(eventForm.totalPrizePool),
      });
      setEvents((prev) => [saved, ...prev]);
      setShowEventModal(false);
      toast.success("Tournament league published!");
    } catch (err) {
      toast.error("Failed to create tournament");
    }
  }

  async function handleAssignOfficial(e: React.FormEvent) {
    e.preventDefault();
    if (!assignForm.matchTitle) {
      toast.error("Please enter match title");
      return;
    }

    const targetEvent = events.find((ev) => ev.id === assignForm.tournamentId);

    try {
      const saved = await sportsCommerceService.assignOfficial({
        tournamentId: assignForm.tournamentId,
        tournamentTitle: targetEvent?.title || "Tournament Match",
        sport: targetEvent?.sport || "BADMINTON",
        officialId: assignForm.officialId,
        matchTitle: assignForm.matchTitle,
        courtOrPitch: assignForm.courtOrPitch,
        matchDate: assignForm.matchDate,
        startTime: assignForm.startTime,
        venueName: targetEvent?.facilityName || "Arena",
      });
      setAssignments((prev) => [saved, ...prev]);
      setShowAssignModal(false);
      toast.success("Match official booked and assigned!");
    } catch (err) {
      toast.error("Failed to assign official");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tournament Organizer & Officials Hub</h1>
          <p className="text-xs text-slate-500">
            Publish commercial tournaments, reserve facility courts, book certified match officials, and coordinate sponsors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "EVENTS" ? (
            <button
              onClick={() => setShowEventModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Publish Tournament
            </button>
          ) : (
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Book Match Official
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab("EVENTS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "EVENTS"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Tournament Events ({events.length})
        </button>

        <button
          onClick={() => setActiveTab("OFFICIALS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "OFFICIALS"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Certified Officials Directory ({officials.length})
        </button>

        <button
          onClick={() => setActiveTab("ASSIGNMENTS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ASSIGNMENTS"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Match Assignments ({assignments.length})
        </button>
      </div>

      {/* Tab 1: Tournament Events */}
      {activeTab === "EVENTS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((evt) => {
              const fillRate = Math.round((evt.teamsRegistered / evt.teamsLimit) * 100);

              return (
                <div
                  key={evt.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-emerald-300 transition-all space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {evt.sport} • {evt.tournamentFormat.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {evt.status.replace("_", " ")}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{evt.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {evt.facilityName}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {evt.startDate} to {evt.endDate}
                    </p>
                  </div>

                  {/* Team Registration Gauge */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Team Slots</span>
                      <span className="font-bold text-slate-800">
                        {evt.teamsRegistered} / {evt.teamsLimit} Teams ({fillRate}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(fillRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Entry Fee</span>
                      <span className="text-xs font-black text-slate-900">₹{evt.entryFeePerTeam}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Prize Pool</span>
                      <span className="text-xs font-black text-emerald-600">₹{evt.totalPrizePool}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Revenue</span>
                      <span className="text-xs font-black text-indigo-700">₹{evt.totalRevenue}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{evt.officialsAssignedCount} Assigned Officials</span>
                    <span>{evt.sponsorsCount} Active Sponsors</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Officials Directory */}
      {activeTab === "OFFICIALS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {officials.map((official) => (
            <div
              key={official.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {official.role}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {official.status}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">{official.fullName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{official.certification}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{official.experienceYears} Years Officiating</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Match Fee</span>
                  <span className="font-black text-slate-900">₹{official.matchFee} / match</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-500">★ {official.rating}</span>
                  <span className="text-[10px] text-slate-400 block">({official.totalMatches} matches)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Match Assignments */}
      {activeTab === "ASSIGNMENTS" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Match / Fixture</th>
                  <th className="py-3.5 px-4">Tournament</th>
                  <th className="py-3.5 px-4">Assigned Official</th>
                  <th className="py-3.5 px-4">Venue & Court</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4">Fee</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {asg.matchTitle}
                      <span className="block text-[10px] font-normal text-slate-400">{asg.sport}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px]">
                      {asg.tournamentTitle}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{asg.officialName}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        {asg.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{asg.venueName}</span>
                      <span className="text-[10px] text-slate-400">{asg.courtOrPitch}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{asg.matchDate}</span>
                      <span className="text-[10px] text-slate-400">{asg.startTime}</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">₹{asg.matchFee}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {asg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Publish Tournament League</h3>
              <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tournament Title</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore Inter-Society Football League 2026"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sport</label>
                  <select
                    value={eventForm.sport}
                    onChange={(e) => setEventForm({ ...eventForm, sport: e.target.value as SportType })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="BADMINTON">BADMINTON</option>
                    <option value="CRICKET">CRICKET</option>
                    <option value="FOOTBALL">FOOTBALL</option>
                    <option value="TENNIS">TENNIS</option>
                    <option value="BASKETBALL">BASKETBALL</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Host Facility</label>
                  <select
                    value={eventForm.facilityId}
                    onChange={(e) => setEventForm({ ...eventForm, facilityId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Teams</label>
                  <input
                    type="number"
                    min="4"
                    max="64"
                    value={eventForm.teamsLimit}
                    onChange={(e) => setEventForm({ ...eventForm, teamsLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Entry Fee (₹)</label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={eventForm.entryFeePerTeam}
                    onChange={(e) => setEventForm({ ...eventForm, entryFeePerTeam: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prize Pool (₹)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={eventForm.totalPrizePool}
                    onChange={(e) => setEventForm({ ...eventForm, totalPrizePool: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                  Publish Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Official Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Assign Certified Match Official</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignOfficial} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Tournament Event</label>
                <select
                  value={assignForm.tournamentId}
                  onChange={(e) => setAssignForm({ ...assignForm, tournamentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Official</label>
                <select
                  value={assignForm.officialId}
                  onChange={(e) => setAssignForm({ ...assignForm, officialId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  {officials.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.fullName} ({o.role} • ₹{o.matchFee}/match • ★{o.rating})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Match Fixture Title</label>
                <input
                  type="text"
                  placeholder="e.g. Semifinal 1: Red Dragons vs Blue Wings"
                  value={assignForm.matchTitle}
                  onChange={(e) => setAssignForm({ ...assignForm, matchTitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Court / Pitch</label>
                  <input
                    type="text"
                    value={assignForm.courtOrPitch}
                    onChange={(e) => setAssignForm({ ...assignForm, courtOrPitch: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Match Date</label>
                  <input
                    type="date"
                    value={assignForm.matchDate}
                    onChange={(e) => setAssignForm({ ...assignForm, matchDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={assignForm.startTime}
                    onChange={(e) => setAssignForm({ ...assignForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                  Confirm Official Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
