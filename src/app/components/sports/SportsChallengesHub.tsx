import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Trophy,
  Swords,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Flame,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import {
  sportsChallengeService,
  type SportsChallengeDto,
  type SportType,
  type CreateSportsChallengeRequest,
} from "../../../services/sports/sportsChallengeService";

const SPORT_OPTIONS: { label: string; value: SportType | "ALL"; emoji: string }[] = [
  { label: "All Sports", value: "ALL", emoji: "⚡" },
  { label: "Badminton", value: "BADMINTON", emoji: "🏸" },
  { label: "Cricket", value: "CRICKET", emoji: "🏏" },
  { label: "Table Tennis", value: "TABLE_TENNIS", emoji: "🏓" },
  { label: "Tennis", value: "TENNIS", emoji: "🎾" },
  { label: "Football", value: "FOOTBALL", emoji: "⚽" },
  { label: "Basketball", value: "BASKETBALL", emoji: "🏀" },
  { label: "Volleyball", value: "VOLLEYBALL", emoji: "🏐" },
  { label: "Squash", value: "SQUASH", emoji: "🏸" },
  { label: "Chess", value: "CHESS", emoji: "♟️" },
];

export function SportsChallengesHub() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<SportsChallengeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<SportType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState<SportType>("BADMINTON");
  const [format, setFormat] = useState("1v1 Best of 3 Sets");
  const [venue, setVenue] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sportsChallengeService.getChallenges(
        selectedSport === "ALL" ? undefined : selectedSport
      );
      setChallenges(data);
    } catch {
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a challenge title.");
      return;
    }

    const payload: CreateSportsChallengeRequest = {
      title: title.trim(),
      sport,
      format,
      venue: venue.trim() || undefined,
      scheduledTime: scheduledTime.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await sportsChallengeService.createChallenge(payload);
      setShowCreateModal(false);
      setTitle("");
      setVenue("");
      setScheduledTime("");
      setNotes("");
      loadChallenges();
    } catch (err: any) {
      alert(err?.message || "Failed to post challenge");
    }
  };

  const handleAcceptChallenge = async (item: SportsChallengeDto) => {
    if (!window.confirm(`Accept open challenge "${item.title}" against ${item.creatorName}?`)) {
      return;
    }
    setActionLoading(item.id);
    try {
      await sportsChallengeService.acceptChallenge(item.id, "You (Challenger)", "Resident");
      loadChallenges();
    } catch (err: any) {
      alert(err?.message || "Could not accept challenge");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredChallenges = challenges.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.venue && c.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.format.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/sports")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sports Arena
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/sports/rankings")}
            className="text-xs font-bold px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 hover:bg-amber-100 transition cursor-pointer flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            View Player Rankings
          </button>
          <span className="text-xs font-semibold px-3 py-1.5 bg-violet-50 text-violet-800 rounded-xl border border-violet-200 flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-violet-600" />
            Resident Pickup Matches
          </span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 text-violet-100/10 pointer-events-none select-none">
          <Swords className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-violet-100">
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            Community Matchmaking & Challenges
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Sports Challenges & Open Duels
          </h1>
          <p className="text-violet-100/90 text-sm leading-relaxed">
            Looking for a sparring partner or team to play against today? Broadcast an open challenge to
            all neighbors in badminton, cricket, tennis, table tennis, or squash.
          </p>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5" />
                <h3 className="text-base font-bold">Post Open Match Challenge</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Challenge Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Badminton Singles 1v1 / Box Cricket 6-a-side"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sport</label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value as SportType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  >
                    {SPORT_OPTIONS.filter((s) => s.value !== "ALL").map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.emoji} {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Match Format</label>
                  <input
                    type="text"
                    placeholder="e.g. 1v1 Friendly (Best of 3)"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Court / Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Clubhouse Court 1"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    placeholder="e.g. Today · 06:30 PM"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stakes / Extra Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Intermediate level players preferred, loser treats for juice at cafe!"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition shadow-md cursor-pointer"
                >
                  Broadcast Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sport Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SPORT_OPTIONS.map((item) => (
          <button
            key={item.value}
            onClick={() => setSelectedSport(item.value)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              selectedSport === item.value
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
            }`}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search challenges, players, venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Post New Challenge
        </button>
      </div>

      {/* Challenges List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredChallenges.map((item) => {
          const isOpen = item.status === "OPEN";
          return (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-5 border transition flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                isOpen ? "border-slate-200/80" : "border-slate-200/50 bg-slate-50/50"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 rounded-2xl bg-slate-50 border border-slate-100">
                      {item.emoji || "🏅"}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200">
                        {item.sport}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.title}</h3>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isOpen
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-400">Host / Creator:</span>
                    <span className="font-semibold">
                      {item.creatorName} {item.creatorFlat ? `(${item.creatorFlat})` : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-400">Match Format:</span>
                    <span className="font-semibold text-slate-800">{item.format}</span>
                  </div>

                  {item.venue && (
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">Venue:</span>
                      <span className="font-medium text-slate-800">{item.venue}</span>
                    </div>
                  )}

                  {item.scheduledTime && (
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">Time:</span>
                      <span className="font-medium text-violet-800">{item.scheduledTime}</span>
                    </div>
                  )}

                  {item.challengerName && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-emerald-800 font-semibold">
                      <span>Accepted By:</span>
                      <span>{item.challengerName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  {isOpen ? "Waiting for opponent..." : "Match confirmed! See you on court."}
                </span>

                {isOpen ? (
                  <button
                    onClick={() => handleAcceptChallenge(item)}
                    disabled={actionLoading === item.id}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Accept Challenge
                  </button>
                ) : (
                  <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Matched
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SportsChallengesHub;
