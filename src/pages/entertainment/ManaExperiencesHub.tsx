import React, { useState, useEffect, useCallback } from "react";
import { Search, X, Star, Users, Clock, MapPin, Tag, ChevronRight, RefreshCw, Ticket, BarChart2, Store, Sparkles } from "lucide-react";
import {
  experiencesService,
  type Experience, type Booking, type Partner, type CoachingSession, type Review,
  type InterestTag, type ItineraryItem, type BuddyRecommendation, type InterestMatch,
  CATEGORY_META, INTEREST_META,
  type ExperienceCategory,
} from "../../services/entertainment/experiencesService";

type CategoryKey = ExperienceCategory | "ALL";
const CATEGORIES: CategoryKey[] = ["ALL", "MOVIES", "LIVE_EVENTS", "SPORTS", "KIDS_FAMILY", "WORKSHOPS", "OUTINGS", "ONLINE"];

type MainView = "discover" | "bookings" | "partners" | "buddy";
type BuddyTab = "for-you" | "itinerary" | "chat";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  } catch { return d; }
}

function spotsColor(e: Experience) {
  const left = e.capacity - e.registeredCount;
  if (left <= 0) return "text-red-600";
  if (left <= 5) return "text-orange-500";
  return "text-green-600";
}

function spotsLeft(e: Experience) {
  const left = e.capacity - e.registeredCount;
  if (left <= 0) return "Full";
  if (left <= 5) return `${left} spots left`;
  return `${left} spots`;
}

// ── Booking Modal ─────────────────────────────────────────────────────────────

function BookingModal({ exp, onClose, onBooked }: {
  exp: Experience;
  onClose: () => void;
  onBooked: (bookingId: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [count, setCount] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "done">("details");
  const [bookingId, setBookingId] = useState("");

  const basePrice = (exp.priceIndividual ?? 0) * count;
  const total = Math.max(0, basePrice - discount);

  async function applyCoupon() {
    if (!coupon.trim()) return;
    const res = await experiencesService.validateCoupon(coupon, exp.id, basePrice);
    if (res.valid) { setDiscount(res.discountAmount); setCouponApplied(true); setCouponMsg(res.message); }
    else { setCouponMsg(res.message); }
  }

  async function handleBook() {
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    try {
      const res = await experiencesService.bookExperience({ experienceId: exp.id, name, phone, attendeeCount: count, ticketType: "GENERAL", couponCode: couponApplied ? coupon : undefined });
      setBookingId(res.bookingId);
      setStep("done");
      onBooked(res.bookingId);
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Book</p>
            <p className="font-semibold text-gray-900 text-sm">{exp.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {step === "details" ? (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phone Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile" type="tel" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tickets</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setCount(Math.max(1, count - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-700">−</button>
                <span className="font-semibold text-gray-900 w-6 text-center">{count}</span>
                <button onClick={() => setCount(Math.min(10, count + 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center font-bold text-gray-700">+</button>
              </div>
            </div>

            {!exp.isFree && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Coupon Code</label>
                <div className="flex gap-2">
                  <input value={coupon} onChange={e => { setCoupon(e.target.value); setCouponApplied(false); setDiscount(0); setCouponMsg(""); }} placeholder="Enter code (try MANA10)" className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={applyCoupon} className="bg-indigo-50 text-indigo-700 font-medium text-sm px-4 rounded-xl hover:bg-indigo-100 transition-colors">Apply</button>
                </div>
                {couponMsg && <p className={`text-xs mt-1 ${couponApplied ? "text-green-600" : "text-red-500"}`}>{couponMsg}</p>}
              </div>
            )}

            {!exp.isFree && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Base ({count}×₹{exp.priceIndividual})</span><span>₹{basePrice}</span>
                </div>
                {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount ({coupon})</span><span>−₹{discount.toFixed(0)}</span></div>}
                <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={loading || !name.trim() || !phone.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? "Booking…" : exp.isFree ? "Confirm Free Registration" : `Pay ₹${total.toFixed(0)}`}
            </button>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-bold text-gray-900 text-lg">Booking Confirmed!</p>
            <p className="text-gray-500 text-sm mt-1 mb-4">Booking ID: <span className="font-mono text-indigo-700">{bookingId}</span></p>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 mb-4">
              <p>{exp.title}</p>
              <p>{fmtDate(exp.startDate)} · {exp.startTime}</p>
              <p>{exp.venue}, {exp.venueArea}</p>
            </div>
            <button onClick={onClose} className="bg-indigo-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-indigo-700 transition-colors">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Experience Card ───────────────────────────────────────────────────────────

function ExperienceCard({ exp, onBook }: { exp: Experience; onBook: () => void }) {
  const meta = CATEGORY_META[exp.category];
  const full = exp.registeredCount >= exp.capacity;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-24 flex items-center justify-center text-4xl relative" style={{ background: `linear-gradient(135deg, ${exp.backdropColor}CC, ${exp.backdropColor})` }}>
        {exp.emoji}
        {exp.isFeatured && <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">⭐ Featured</span>}
        {exp.visibility === "MEMBERS_ONLY" && <span className="absolute top-2 right-2 text-xs">🔒</span>}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
        </div>
        <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{exp.title}</p>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={11} /><span>{fmtDate(exp.startDate)} · {exp.startTime}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={11} /><span>{exp.venue}, {exp.venueArea}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className={`text-sm font-bold ${exp.isFree ? "text-green-600" : "text-indigo-700"}`}>
            {exp.isFree ? "FREE" : `₹${exp.priceIndividual}`}
          </span>
          <span className={`text-xs font-medium ${spotsColor(exp)}`}>{spotsLeft(exp)}</span>
        </div>
        <button
          onClick={onBook}
          disabled={full}
          className="w-full mt-1 py-2 rounded-xl text-sm font-semibold transition-colors disabled:bg-gray-100 disabled:text-gray-400 bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {full ? "Sold Out" : "Book Now"}
        </button>
      </div>
    </div>
  );
}

// ── Discover View ─────────────────────────────────────────────────────────────

function DiscoverView({ onBook }: { onBook: (exp: Experience) => void }) {
  const [category, setCategory] = useState<CategoryKey>("ALL");
  const [search, setSearch] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [featured, setFeatured] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [all, feat] = await Promise.all([
      experiencesService.getExperiences({ category: category === "ALL" ? undefined : category, query: search || undefined }),
      experiencesService.getExperiences({ featured: true }),
    ]);
    setExperiences(all);
    setFeatured(feat);
    setLoading(false);
  }, [category, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => {
          const m = CATEGORY_META[cat as ExperienceCategory] ?? CATEGORY_META.ALL;
          const active = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${active ? "text-white shadow" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}
              style={active ? { background: `linear-gradient(135deg, ${m.color}, ${m.color}CC)` } : {}}
            >
              {m.emoji} {m.label}
            </button>
          );
        })}
      </div>

      {search === "" && category === "ALL" && featured.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">✨ Featured</p>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {featured.map(exp => (
              <div key={exp.id} className="w-64 flex-shrink-0">
                <ExperienceCard exp={exp} onBook={() => onBook(exp)} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">
          {category === "ALL" ? "All Experiences" : CATEGORY_META[category as ExperienceCategory]?.label} ({experiences.length})
        </p>
        {loading ? (
          <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-indigo-600" size={24} /></div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-sm">No experiences found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {experiences.map(exp => <ExperienceCard key={exp.id} exp={exp} onBook={() => onBook(exp)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bookings View ─────────────────────────────────────────────────────────────

function BookingsView() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    experiencesService.getMyBookings().then(d => { setBookings(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-indigo-600" size={24} /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-gray-900">My Bookings ({bookings.length})</p>
      {bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><p className="text-3xl mb-2">🎟️</p><p className="text-sm">No bookings yet</p></div>
      ) : (
        bookings.map(b => (
          <div key={b.bookingId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${b.backdropColor}30` }}>
                {b.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{b.experienceTitle}</p>
                <p className="text-xs text-gray-500">Booking: <span className="font-mono">{b.bookingId}</span></p>
                <p className="text-xs text-gray-500">{b.attendeeCount} ticket{b.attendeeCount > 1 ? "s" : ""} · ₹{b.totalAmount}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${b.status === "CONFIRMED" ? "bg-green-100 text-green-700" : b.status === "CANCELLED" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                {b.status}
              </span>
            </div>
            {b.couponCode && <p className="text-xs text-indigo-600 mt-2">🏷️ Coupon: {b.couponCode}</p>}
            <div className="flex gap-2 mt-3">
              <div className="flex-1 bg-gray-50 rounded-xl p-2 text-center">
                <p className="text-xs text-gray-500">QR Pass</p>
                <p className="text-xs font-mono text-gray-700 truncate">{b.qrData}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Partners View ─────────────────────────────────────────────────────────────

function PartnersView() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [coaching, setCoaching] = useState<CoachingSession[]>([]);
  const [tab, setTab] = useState<"partners" | "coaching">("partners");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([experiencesService.getPartners(), experiencesService.getCoachingSessions()])
      .then(([p, c]) => { setPartners(p); setCoaching(c); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-10"><RefreshCw className="animate-spin text-indigo-600" size={24} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {(["partners", "coaching"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"}`}
          >
            {t === "partners" ? "🏪 Partners" : "🏅 Coaching"}
          </button>
        ))}
      </div>

      {tab === "partners" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {partners.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-20 flex items-center justify-center text-3xl" style={{ background: `linear-gradient(135deg, ${p.backdropColor}CC, ${p.backdropColor})` }}>
                {p.emoji}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.tagline}</p>
                  </div>
                  {p.isVerified && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">✓ Verified</span>}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400" />{p.rating} ({p.reviewCount})</span>
                  <span className="flex items-center gap-1"><MapPin size={11} />{p.area}</span>
                  <span>{p.priceRange}</span>
                </div>
                {p.discountForMembers && (
                  <div className="mt-2 bg-green-50 rounded-lg px-2 py-1.5">
                    <p className="text-xs text-green-700 font-medium">🎁 {p.discountForMembers}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.amenities.slice(0, 3).map(a => <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>)}
                </div>
                {p.contactPhone && (
                  <a href={`tel:${p.contactPhone}`} className="mt-3 flex items-center justify-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold py-2 rounded-xl hover:bg-indigo-700 transition-colors">
                    📞 Call Partner
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "coaching" && (
        <div className="space-y-4">
          {coaching.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><p className="text-3xl mb-2">🏅</p><p className="text-sm">No coaching sessions available</p></div>
          ) : (
            coaching.map(s => (
              <div key={s.sessionId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{s.emoji}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{s.sport} — {s.partnerName}</p>
                    <p className="text-xs text-gray-500">with {s.coachName}</p>
                  </div>
                  <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${s.level === "BEGINNER" ? "bg-green-100 text-green-700" : s.level === "ADVANCED" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                    {s.level}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{s.coachBio}</p>
                <div className="flex gap-4 text-xs text-gray-600 mb-3">
                  <span>⏱ {s.durationMins}min</span>
                  <span>💰 ₹{s.pricePerSession}</span>
                  <span>👥 Max {s.groupSizeMax}</span>
                </div>
                {s.availableSlots.slice(0, 2).map((slot, i) => (
                  <div key={i} className="bg-indigo-50 rounded-xl px-3 py-2 mb-2 flex items-center justify-between">
                    <span className="text-xs text-indigo-700 font-medium">{fmtDate(slot.date)} · {slot.time}</span>
                    <span className="text-xs text-gray-500">{slot.spotsLeft} spots</span>
                  </div>
                ))}
                <button className="w-full bg-indigo-600 text-white text-sm font-semibold py-2 rounded-xl hover:bg-indigo-700 transition-colors mt-1">Book Session</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Buddy View ────────────────────────────────────────────────────────────────

function BuddyView() {
  const [tab, setTab] = useState<BuddyTab>("for-you");
  const [interests, setInterests] = useState<InterestTag[]>([]);
  const [onboarded, setOnboarded] = useState(false);
  const [recos, setRecos] = useState<BuddyRecommendation[]>([]);
  const [matches, setMatches] = useState<InterestMatch[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [messages, setMessages] = useState<{ id: string; role: string; text: string }[]>([
    { id: "welcome", role: "buddy", text: "Hi! 👋 I'm Mana Buddy. I can suggest experiences, plan your weekend, or help you find residents with similar interests. What would you like?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    experiencesService.getUserInterests().then(saved => {
      if (saved.length > 0) { setInterests(saved); setOnboarded(true); }
    });
  }, []);

  useEffect(() => {
    if (onboarded && interests.length > 0) {
      Promise.all([
        experiencesService.getBuddyRecommendations(interests),
        experiencesService.getInterestMatches(),
      ]).then(([r, m]) => { setRecos(r); setMatches(m); });
    }
  }, [onboarded, interests]);

  async function buildItinerary(weekend: "THIS" | "NEXT") {
    setBuilding(true);
    const result = await experiencesService.buildItinerary(interests, weekend);
    setItinerary(result);
    setTab("itinerary");
    setBuilding(false);
  }

  async function sendMessage() {
    const text = chatInput.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    setChatInput("");
    setChatLoading(true);
    const reply = await experiencesService.sendBuddyMessage(text);
    setMessages(prev => [...prev, { id: reply.id, role: reply.role, text: reply.text }]);
    setChatLoading(false);
  }

  const INTEREST_CATEGORIES = ["Sports", "Wellness", "Entertainment", "Hobbies", "Adventure", "Family"];

  if (!onboarded) {
    return (
      <div className="space-y-5">
        <div className="text-center py-4">
          <p className="text-4xl mb-2">🤖</p>
          <p className="font-bold text-gray-900 text-lg">Meet Mana Buddy</p>
          <p className="text-sm text-gray-500 mt-1">Pick your interests and I'll personalise your experience</p>
        </div>
        <p className="text-sm text-gray-500">Select at least 3 interests ({interests.length} selected)</p>
        {INTEREST_CATEGORIES.map(cat => {
          const tags = (Object.keys(INTEREST_META) as InterestTag[]).filter(t => INTEREST_META[t].category === cat);
          return (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat}</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                  const m = INTEREST_META[tag];
                  const sel = interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => setInterests(prev => sel ? prev.filter(t => t !== tag) : [...prev, tag])}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${sel ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"}`}
                    >
                      {m.emoji} {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <button
          disabled={interests.length < 3}
          onClick={() => { experiencesService.saveUserInterests(interests); setOnboarded(true); }}
          className="w-full bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {interests.length < 3 ? `Pick ${3 - interests.length} more` : "Let's Go! 🚀"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {(["for-you", "itinerary", "chat"] as BuddyTab[]).map(t => {
          const labels = { "for-you": "✨ For You", itinerary: "🗓️ Itinerary", chat: "💬 Chat" };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"}`}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {tab === "for-you" && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">Your Interests</p>
            <div className="flex flex-wrap gap-2">
              {interests.map(tag => <span key={tag} className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full">{INTEREST_META[tag].emoji} {INTEREST_META[tag].label}</span>)}
              <button onClick={() => setOnboarded(false)} className="text-xs text-gray-400 hover:text-gray-600 underline">Edit</button>
            </div>
          </div>

          {recos.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Picked for You</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {recos.map(r => (
                  <div key={r.experience.id} className="w-48 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="h-20 flex items-center justify-center text-3xl relative" style={{ background: `linear-gradient(135deg, ${r.experience.backdropColor}CC, ${r.experience.backdropColor})` }}>
                      {r.experience.emoji}
                      <span className="absolute top-1.5 right-1.5 bg-white/30 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{r.matchScore}%</span>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-gray-900 text-xs line-clamp-2">{r.experience.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.reason}</p>
                      <p className={`text-xs font-bold mt-1.5 ${r.experience.isFree ? "text-green-600" : "text-indigo-700"}`}>
                        {r.experience.isFree ? "FREE" : `₹${r.experience.priceIndividual}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🗓️</span>
              <div>
                <p className="font-bold text-white text-sm">Plan My Weekend</p>
                <p className="text-xs text-white/60">AI-curated schedule based on your interests</p>
              </div>
            </div>
            <div className="flex gap-2">
              {(["THIS", "NEXT"] as const).map(w => (
                <button key={w} onClick={() => buildItinerary(w)} disabled={building} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${w === "THIS" ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-white/10 text-white hover:bg-white/20 border border-white/20"}`}>
                  {building ? "Building…" : w === "THIS" ? "This Weekend" : "Next Weekend"}
                </button>
              ))}
            </div>
          </div>

          {matches.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Find Your Tribe</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {matches.map(m => (
                  <div key={m.residentName} className="w-44 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">{m.residentInitials}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-xs truncate">{m.residentName}</p>
                        <p className="text-xs text-gray-400">{m.flat}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {m.sharedInterests.slice(0, 2).map(t => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{INTEREST_META[t].emoji}</span>)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-700">{m.matchScore}% match</span>
                      {m.openToGroup && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Open</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "itinerary" && (
        <div>
          {itinerary.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">🗓️</p>
              <p className="text-sm mb-4">No itinerary yet. Go to For You and tap Plan My Weekend.</p>
              <button onClick={() => setTab("for-you")} className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">Plan My Weekend</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-indigo-50 rounded-xl p-3 flex items-center gap-2">
                <span className="text-xl">✨</span>
                <div>
                  <p className="text-sm font-semibold text-indigo-700">Your Weekend Plan</p>
                  <p className="text-xs text-gray-500">{itinerary.length} experiences curated for you</p>
                </div>
              </div>
              {itinerary.map((item, i) => {
                const colors = ["#4F46E5", "#0891B2", "#059669", "#D97706", "#DB2777"];
                const color = colors[i % colors.length];
                return (
                  <div key={item.experienceId + i} className="bg-white rounded-2xl shadow-sm border-l-4 p-4" style={{ borderLeftColor: color }}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-900 text-sm">{item.experienceTitle}</p>
                          <span className={`text-xs font-bold flex-shrink-0 ${item.isFree ? "text-green-600" : "text-indigo-700"}`}>{item.isFree ? "FREE" : `₹${item.price}`}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{fmtDate(item.date)}</span>
                          <span>{item.startTime}</span>
                          <span>{item.venueArea}</span>
                        </div>
                        {item.notes && <p className="text-xs text-gray-400 mt-1">💡 {item.notes}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "chat" && (
        <div className="space-y-3">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {m.role === "buddy" && <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-base flex-shrink-0">🤖</div>}
                <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${m.role === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-base">🤖</div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <RefreshCw className="animate-spin text-indigo-400" size={14} />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask Mana Buddy anything…"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={sendMessage}
              disabled={!chatInput.trim() || chatLoading}
              className="w-10 h-10 rounded-xl bg-indigo-600 disabled:bg-gray-200 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors"
            >
              →
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Free events this weekend?", "Find a fitness partner", "Best budget experiences?"].map(q => (
              <button key={q} onClick={() => { setChatInput(q); }} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors">{q}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Hub ──────────────────────────────────────────────────────────────────

export function ManaExperiencesHub() {
  const [view, setView] = useState<MainView>("discover");
  const [search, setSearch] = useState("");
  const [bookingExp, setBookingExp] = useState<Experience | null>(null);

  const NAV = [
    { key: "discover" as const, icon: <Sparkles size={18} />, label: "Discover" },
    { key: "bookings" as const, icon: <Ticket size={18} />, label: "My Bookings" },
    { key: "partners" as const, icon: <Store size={18} />, label: "Partners" },
    { key: "buddy" as const, icon: <span className="text-base">🤖</span>, label: "Buddy AI" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 px-4 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">✨ Mana Experiences</h1>
            <p className="text-xs text-indigo-300">Discover · Connect · Experience</p>
          </div>
        </div>

        {view === "discover" && (
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 mb-4">
            <Search size={15} className="text-white/50 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search experiences, workshops, events…"
              className="flex-1 bg-transparent text-white placeholder-white/40 text-sm focus:outline-none"
            />
            {search && <button onClick={() => setSearch("")}><X size={14} className="text-white/50" /></button>}
          </div>
        )}

        {/* Nav Tabs */}
        <div className="flex">
          {NAV.map(n => (
            <button
              key={n.key}
              onClick={() => setView(n.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 border-b-2 transition-colors ${view === n.key ? "border-white text-white" : "border-transparent text-indigo-300 hover:text-indigo-100"}`}
            >
              {n.icon}
              <span className="text-xs font-medium">{n.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {view === "discover" && <DiscoverView onBook={exp => setBookingExp(exp)} />}
        {view === "bookings" && <BookingsView />}
        {view === "partners" && <PartnersView />}
        {view === "buddy" && <BuddyView />}
      </div>

      {/* Booking Modal */}
      {bookingExp && (
        <BookingModal
          exp={bookingExp}
          onClose={() => setBookingExp(null)}
          onBooked={() => {}}
        />
      )}
    </div>
  );
}
