import { useState } from "react";
import {
  User, Star, Calendar, CheckCircle, Search, GraduationCap, Video, Users, BookOpen, MessageCircle, Clock, Award
} from "lucide-react";

interface Mentor {
  id: number;
  name: string;
  avatar: string;
  flat: string;
  headline: string;
  expertise: string[];
  rating: number;
  reviews: number;
  sessions: number;
  isFree: boolean;
  rate: string | null;
  freeSessionsLeft: number;
  isAvailable: boolean;
  responseTime: string;
  languages: string[];
  isVerified: boolean;
  isCommunity: boolean;
}

const MOCK_MENTORS: Mentor[] = [
  {
    id: 1, name: "Dr. Kavitha Rao", avatar: "KR", flat: "B-301",
    headline: "Engineering Director @ Microsoft | Ex-Amazon",
    expertise: ["System Design", "Career Growth", "FAANG Prep", "Leadership"],
    rating: 4.9, reviews: 87, sessions: 312, isFree: false, rate: "₹800/hr",
    freeSessionsLeft: 0, isAvailable: true, responseTime: "< 1 hr",
    languages: ["English", "Telugu", "Hindi"], isVerified: true, isCommunity: true,
  },
  {
    id: 2, name: "Arjun Mehta", avatar: "AM", flat: "Villa 5",
    headline: "Product Manager @ Razorpay | IIM-A Alumni",
    expertise: ["Product Management", "Interview Prep", "VC Funding", "Startups"],
    rating: 4.7, reviews: 43, sessions: 156, isFree: true, rate: null,
    freeSessionsLeft: 2, isAvailable: true, responseTime: "Same day",
    languages: ["English", "Hindi"], isVerified: true, isCommunity: true,
  },
  {
    id: 3, name: "Sneha Nair", avatar: "SN", flat: "A-102",
    headline: "Senior UX Designer @ Swiggy | 8 yrs experience",
    expertise: ["UX Design", "Portfolio Review", "Design Thinking", "Figma"],
    rating: 4.8, reviews: 29, sessions: 94, isFree: false, rate: "₹600/hr",
    freeSessionsLeft: 0, isAvailable: false, responseTime: "< 4 hrs",
    languages: ["English", "Malayalam"], isVerified: false, isCommunity: true,
  },
];

const SESSION_TYPES = [
  { icon: Video, label: "1-on-1 Video", desc: "Private 45-min session" },
  { icon: Users, label: "Group Session", desc: "Up to 5 mentees" },
  { icon: BookOpen, label: "Resume Review", desc: "Async feedback" },
  { icon: MessageCircle, label: "Quick Chat", desc: "15-min check-in" },
];

function MentorCard({ mentor, onBook }: { mentor: Mentor; onBook: (mentor: Mentor) => void }) {
  return (
    <div className="bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all hover:border-indigo-200 dark:hover:border-indigo-900 group">
      {/* Header */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-black text-lg">
            {mentor.avatar}
          </div>
          {mentor.isAvailable && (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs">{mentor.name}</h3>
            {mentor.isVerified && (
              <span className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-2.5 h-2.5 text-white" />
              </span>
            )}
            {mentor.isCommunity && (
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md font-bold">Community</span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{mentor.headline}</p>
          <p className="text-[10px] text-slate-450 mt-0.5">{mentor.flat}</p>
        </div>
      </div>

      {/* Expertise */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {mentor.expertise.map((e) => (
          <span key={e} className="text-[10px] px-2.5 py-1 bg-slate-105 dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-lg font-bold border border-slate-200/50 dark:border-slate-700">{e}</span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-center gap-1">
            <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">{mentor.rating}</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">{mentor.reviews} reviews</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-900 dark:text-white">{mentor.sessions}</div>
          <div className="text-[9px] text-slate-400 mt-0.5">sessions</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-900 dark:text-white">{mentor.responseTime}</div>
          <div className="text-[9px] text-slate-400 mt-0.5">response</div>
        </div>
      </div>

      {/* Languages */}
      <div className="flex items-center gap-1 mb-4 text-[10px] text-slate-500">
        <span className="font-bold">Languages:</span>
        {mentor.languages.map((l, i) => (
          <span key={l}>{l}{i < mentor.languages.length - 1 ? "," : ""}</span>
        ))}
      </div>

      {/* Pricing + CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <div>
          {mentor.isFree ? (
            <div>
              <span className="text-xs font-bold text-emerald-600">Free</span>
              {mentor.freeSessionsLeft > 0 && (
                <div className="text-[9px] text-emerald-500">{mentor.freeSessionsLeft} free left</div>
              )}
            </div>
          ) : (
            <span className="text-xs font-black text-slate-900 dark:text-white">{mentor.rate}</span>
          )}
        </div>
        <button
          onClick={() => onBook(mentor)}
          disabled={!mentor.isAvailable}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mentor.isAvailable
              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              : "bg-slate-105 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border-0"
          }`}
        >
          <Calendar className="w-4 h-4" />
          {mentor.isAvailable ? "Book Session" : "Unavailable"}
        </button>
      </div>
    </div>
  );
}

function BookingModal({ mentor, onClose }: { mentor: Mentor | null; onClose: () => void }) {
  const [selectedType, setSelectedType] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [goal, setGoal] = useState("");

  const slots = ["Mon 10 AM", "Mon 3 PM", "Tue 11 AM", "Tue 4 PM", "Wed 9 AM", "Wed 2 PM"];

  if (!mentor) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1E1E36] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-250">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white">
          <h3 className="font-black text-sm">Book a Session</h3>
          <p className="text-indigo-200 text-xs mt-1">with {mentor.name}</p>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Session Type */}
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-2">Session Type</p>
            <div className="grid grid-cols-2 gap-2">
              {SESSION_TYPES.map((type, i) => (
                <button
                  key={type.label}
                  onClick={() => setSelectedType(i)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedType === i ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <type.icon className={`w-4.5 h-4.5 ${selectedType === i ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                  <div>
                    <div className={`text-[10px] font-bold ${selectedType === i ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-400"}`}>{type.label}</div>
                    <div className="text-[9px] text-slate-450">{type.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-2">Available Slots (This Week)</p>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2.5 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                    selectedSlot === slot ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-750 dark:text-indigo-300" : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-300"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-2">Your Goal for This Session</p>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., I want to prepare for FAANG system design interviews..."
              rows={3}
              className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#262644] transition-all cursor-pointer">
            Cancel
          </button>
          <button
            disabled={!selectedSlot || !goal.trim()}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}

export function CPNMentorship() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  const filters = [
    { key: "all", label: "All Mentors" },
    { key: "community", label: "Community Neighbors" },
    { key: "free", label: "Free Sessions" },
    { key: "available", label: "Available Now" },
  ];

  const filtered = MOCK_MENTORS.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.expertise.some(e => e.toLowerCase().includes(q));
    const matchesFilter = activeFilter === "all"
      || (activeFilter === "community" && m.isCommunity)
      || (activeFilter === "free" && m.isFree)
      || (activeFilter === "available" && m.isAvailable);
    return matchesSearch && matchesFilter;
  });

  const handleBook = (mentor: Mentor) => { setSelectedMentor(mentor); setShowBooking(true); };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-black">Find Your Mentor in the Community</h2>
          <p className="text-violet-200 text-xs mt-1 leading-relaxed">
            Learn from experienced industry professionals living right in your gated community.
          </p>
          <div className="flex gap-4 mt-3 text-xs">
            {[["50+", "Mentors"], ["1K+", "Sessions"], ["4.8★", "Avg Rating"]].map(([v, l]) => (
              <div key={l}><span className="font-black">{v}</span> <span className="text-violet-300 font-semibold">{l}</span></div>
            ))}
          </div>
        </div>
        <button className="self-start sm:self-center flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-black rounded-xl text-xs hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer">
          <GraduationCap className="w-4.5 h-4.5 animate-bounce" />
          Become a Mentor
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, skill, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer ${
                activeFilter === f.key ? "bg-indigo-600 text-white shadow-sm" : "bg-white dark:bg-[#1E1E36] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-355 hover:border-indigo-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mentor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((mentor) => (
          <MentorCard key={mentor.id} mentor={mentor} onBook={handleBook} />
        ))}
      </div>

      {showBooking && (
        <BookingModal mentor={selectedMentor} onClose={() => setShowBooking(false)} />
      )}
    </div>
  );
}
