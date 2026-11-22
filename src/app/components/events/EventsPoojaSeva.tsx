import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Flame,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Search,
  Ticket,
  Printer,
  Share2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { eventService, type EventResponse } from "../../../services/events/eventService";

interface PoojaSevaItem {
  id: number;
  name: string;
  type: string;
  date: string;
  startTime: string;
  mandap: string;
  pandit: string;
  fee: number;
  isFree: boolean;
  slots: number;
  description: string;
}

const SAMPLE_SEVAS: PoojaSevaItem[] = [
  {
    id: 1,
    name: "Ganesh Maha Ganapati Homam",
    type: "Vedic Homam",
    date: "Day 1 (Morning)",
    startTime: "08:30 AM",
    mandap: "Main Temple Mandap",
    pandit: "Acharya Shastri",
    fee: 501,
    isFree: false,
    slots: 25,
    description: "Sacred Vedic fire ritual for prosperity, barrier removal, and new beginnings for the entire family.",
  },
  {
    id: 2,
    name: "Sahasranama Archana & Prasadam",
    type: "Archana",
    date: "Daily",
    startTime: "10:00 AM",
    mandap: "Sanctum Sanctorum",
    pandit: "Pt. Ramanujam",
    fee: 251,
    isFree: false,
    slots: 50,
    description: "Chanting of 1000 names with sacred bilva & pushpa offering, with energized prasadam distribution.",
  },
  {
    id: 3,
    name: "Community Maha Aarti & Pushpanjali",
    type: "Community Aarti",
    date: "Daily Evening",
    startTime: "07:30 PM",
    mandap: "Open Amphitheatre Pavillion",
    pandit: "Temple Board Priests",
    fee: 0,
    isFree: true,
    slots: 200,
    description: "Grand community evening deepotsav, Vedic hymns, mass chanting, and flower offerings for all residents.",
  },
  {
    id: 4,
    name: "Satyanarayan Vrat Katha & Pooja",
    type: "Katha & Sankalp",
    date: "Auspicious Weekend",
    startTime: "04:30 PM",
    mandap: "Clubhouse Hall A",
    pandit: "Pt. Joshi",
    fee: 351,
    isFree: false,
    slots: 40,
    description: "Complete chapter reading, panchamrit abhishekam, family sankalpam, and sacred sheera prasad.",
  },
  {
    id: 5,
    name: "Navagraha Shanti Jaap",
    type: "Shanti Pooja",
    date: "Day 2",
    startTime: "09:00 AM",
    mandap: "East Lawns Mandap",
    pandit: "Pt. Srinivas",
    fee: 401,
    isFree: false,
    slots: 30,
    description: "Planetary balance and peace jaap with planetary grain offerings and raksha sutra tying.",
  },
];

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu",
  "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta",
  "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
  "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati"
];

const RASHIS = [
  "Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)",
  "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrishchika (Scorpio)",
  "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"
];

export function EventsPoojaSeva() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = id ? Number(id) : null;

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSeva, setSelectedSeva] = useState<PoojaSevaItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Booking Form State
  const [devoteeName, setDevoteeName] = useState("");
  const [gotram, setGotram] = useState("");
  const [nakshatram, setNakshatram] = useState("");
  const [rashi, setRashi] = useState("");
  const [headCount, setHeadCount] = useState("1");
  const [phone, setPhone] = useState("");
  const [sankalpNotes, setSankalpNotes] = useState("");

  // Confirmed Token State
  const [confirmedToken, setConfirmedToken] = useState<{
    tokenNumber: string;
    seva: PoojaSevaItem;
    devoteeName: string;
    gotram: string;
    nakshatram: string;
    headCount: string;
    bookedAt: string;
  } | null>(null);

  useEffect(() => {
    if (eventId) {
      setLoading(true);
      eventService
        .getById(eventId)
        .then((ev) => setEvent(ev))
        .catch(() => setEvent(null))
        .finally(() => setLoading(false));
    }
  }, [eventId]);

  const filteredSevas = SAMPLE_SEVAS.filter((s) => {
    const matchQuery =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mandap.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "ALL" || s.type === filterType;
    return matchQuery && matchType;
  });

  const handleBook = (seva: PoojaSevaItem) => {
    setSelectedSeva(seva);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devoteeName.trim()) {
      alert("Please enter primary devotee name.");
      return;
    }
    if (!selectedSeva) return;

    const tokenNumber = `SEVA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmedToken({
      tokenNumber,
      seva: selectedSeva,
      devoteeName,
      gotram: gotram.trim() || "Kashyapa",
      nakshatram: nakshatram || "Rohini",
      headCount,
      bookedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    });
    setSelectedSeva(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => (eventId ? navigate(`/events/${eventId}`) : navigate("/events"))}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Events
        </button>
        <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
          Cultural & Ritual Portal
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 text-amber-100/10 pointer-events-none select-none">
          <Flame className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-amber-100">
            <Sparkles className="w-3.5 h-3.5" />
            Sacred Rituals & Family Sankalp
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {event?.title ? `${event.title} — Pooja & Seva Tokens` : "Community Pooja & Sacred Seva Booking"}
          </h1>
          <p className="text-amber-100/90 text-sm leading-relaxed">
            Reserve dedicated archana, homam, and community maha aarti sankalp slots for your family.
            Names will be chanted in the sacred sankalp by our temple priests.
          </p>
        </div>
      </div>

      {/* Confirmed Token Modal */}
      {confirmedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-amber-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center space-y-2">
              <div className="w-12 h-12 mx-auto bg-white/20 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold">Pooja Token Confirmed! 🙏</h3>
              <p className="text-xs text-amber-100">Please present this token at the temple mandap desk</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 space-y-2">
                <div className="flex justify-between items-center border-b border-amber-200/60 pb-2">
                  <span className="text-xs text-amber-800 font-semibold uppercase tracking-wider">Token Number</span>
                  <span className="font-mono font-bold text-amber-900 text-base">{confirmedToken.tokenNumber}</span>
                </div>
                <div className="text-sm font-bold text-slate-800">{confirmedToken.seva.name}</div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  {confirmedToken.seva.date} · {confirmedToken.seva.startTime}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  {confirmedToken.seva.mandap} (Priest: {confirmedToken.seva.pandit})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Primary Devotee</span>
                  <span className="font-semibold text-slate-800">{confirmedToken.devoteeName}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Gotram / Nakshatram</span>
                  <span className="font-semibold text-slate-800">
                    {confirmedToken.gotram} · {confirmedToken.nakshatram}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Head Count</span>
                  <span className="font-semibold text-slate-800">{confirmedToken.headCount} Member(s)</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-slate-400 block mb-0.5">Dakshina / Seva Fee</span>
                  <span className="font-semibold text-emerald-700">
                    {confirmedToken.seva.isFree ? "Free Community Seva" : `₹${confirmedToken.seva.fee}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Token
                </button>
                <button
                  onClick={() => setConfirmedToken(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {selectedSeva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-100">
                  {selectedSeva.type}
                </span>
                <h3 className="text-lg font-bold">{selectedSeva.name}</h3>
              </div>
              <button
                onClick={() => setSelectedSeva(null)}
                className="text-white/80 hover:text-white p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-amber-900 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Mandap: {selectedSeva.mandap}</span>
                  <span className="text-emerald-700 font-bold">
                    {selectedSeva.isFree ? "Free Seva" : `₹${selectedSeva.fee}`}
                  </span>
                </div>
                <div className="text-amber-800 text-xs">
                  Timing: {selectedSeva.date} at {selectedSeva.startTime} (Lead: {selectedSeva.pandit})
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Primary Devotee Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra Sharma"
                  value={devoteeName}
                  onChange={(e) => setDevoteeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gotram (Lineage)</label>
                  <input
                    type="text"
                    placeholder="e.g. Kashyapa / Bharadwaja"
                    value={gotram}
                    onChange={(e) => setGotram(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Janma Nakshatram</label>
                  <select
                    value={nakshatram}
                    onChange={(e) => setNakshatram(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="">Select Nakshatram...</option>
                    {NAKSHATRAS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rashi (Zodiac)</label>
                  <select
                    value={rashi}
                    onChange={(e) => setRashi(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="">Select Rashi...</option>
                    {RASHIS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Family Attendees Count</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={headCount}
                    onChange={(e) => setHeadCount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp / Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Special Sankalp Prayers / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. For health, children's education, birthday, or anniversary sankalp"
                  value={sankalpNotes}
                  onChange={(e) => setSankalpNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedSeva(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold transition shadow-md cursor-pointer"
                >
                  Confirm & Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search sevas, homams, aartis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "Vedic Homam", "Archana", "Community Aarti", "Katha & Sankalp", "Shanti Pooja"].map(
            (type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  filterType === type
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {type}
              </button>
            )
          )}
        </div>
      </div>

      {/* Sevas Listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSevas.map((seva) => (
          <div
            key={seva.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                    {seva.type}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{seva.name}</h3>
                </div>
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                    seva.isFree
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {seva.isFree ? "FREE" : `₹${seva.fee}`}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{seva.description}</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>{seva.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{seva.startTime}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{seva.mandap}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>{seva.pandit}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 font-medium">
                  {seva.slots} family slots remaining
                </span>
                <button
                  onClick={() => handleBook(seva)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  Book Seva Token
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventsPoojaSeva;
