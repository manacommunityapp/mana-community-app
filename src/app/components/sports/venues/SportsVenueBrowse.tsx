import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Trophy,
  MapPin,
  Star,
  Search,
  Filter,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell
} from "lucide-react";
import { sportsVendorService } from "../../../../services/sports/sportsVendorService";
import type { SportsFacility, SportType } from "../../../../types/sportsVendor";
import { SportsCourtBookingModal } from "./SportsCourtBookingModal";

const SPORTS_CATEGORIES: { id: string; label: string; sport?: SportType; emoji: string }[] = [
  { id: "all", label: "All Sports", emoji: "🏅" },
  { id: "badminton", label: "Badminton", sport: "BADMINTON", emoji: "🏸" },
  { id: "cricket", label: "Box Cricket", sport: "CRICKET", emoji: "🏏" },
  { id: "football", label: "Football Turf", sport: "FOOTBALL", emoji: "⚽" },
  { id: "tennis", label: "Tennis", sport: "TENNIS", emoji: "🎾" },
  { id: "swimming", label: "Aquatics", sport: "SWIMMING", emoji: "🏊" },
  { id: "basketball", label: "Basketball", sport: "BASKETBALL", emoji: "🏀" },
  { id: "table_tennis", label: "Table Tennis", sport: "TABLE_TENNIS", emoji: "🏓" },
];

export function SportsVenueBrowse() {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<SportsFacility[]>([]);
  const [selectedSport, setSelectedSport] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [federatedOnly, setFederatedOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Quick Booking Modal state
  const [bookingFacility, setBookingFacility] = useState<SportsFacility | null>(null);

  useEffect(() => {
    loadVenues();
  }, []);

  async function loadVenues() {
    setLoading(true);
    try {
      const facs = await sportsVendorService.getFacilities();
      setFacilities(facs);
    } catch (err) {
      console.error("Failed to load sports venues", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = facilities.filter((fac) => {
    if (federatedOnly && !fac.isFederated) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = fac.name.toLowerCase().includes(q);
      const matchArea = fac.area.toLowerCase().includes(q);
      const matchCity = fac.city.toLowerCase().includes(q);
      if (!matchName && !matchArea && !matchCity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* Ecosystem Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Courts & Venues
          </span>
          <Link
            to="/sports/tournaments"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Tournaments
          </Link>
          <Link
            to="/sports/schedule"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            Match Schedule
          </Link>
          <Link
            to="/sports"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors hidden md:flex items-center gap-1.5"
          >
            <Dumbbell className="w-3.5 h-3.5 text-purple-500" />
            Sports Hub
          </Link>
        </div>

        <Link
          to="/vendor-portal/sports"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
        >
          <span>💼 Sports Vendor Portal</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 p-8 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-emerald-100">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Mana Community Sports Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Book Sports Venues & Courts
          </h1>
          <p className="text-sm text-emerald-100 leading-relaxed">
            Discover community clubhouses and verified commercial sports arenas. Enjoy exclusive resident discounts, instant slot reservations, and guaranteed court access.
          </p>
        </div>

        {/* Search Bar Overlay */}
        <div className="relative z-10 mt-6 max-w-3xl flex flex-col sm:flex-row items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/20">
          <div className="flex-1 flex items-center gap-2 px-3 w-full">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by arena name, area, or locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden py-1.5"
            />
          </div>
          <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-700 cursor-pointer shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200">
            <input
              type="checkbox"
              checked={federatedOnly}
              onChange={(e) => setFederatedOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-0"
            />
            <span className="text-emerald-700">Resident Partner Venues Only</span>
          </label>
        </div>
      </div>

      {/* Sport Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SPORTS_CATEGORIES.map((cat) => {
          const isSelected = selectedSport === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedSport(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Venues Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Available Venues ({filtered.length})
          </h2>
          <span className="text-xs text-slate-500">Live slot inventory updated real-time</span>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            No sports arenas found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col group"
              >
                {/* Photo & Badges */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={venue.images[0]}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {venue.isFederated && (
                      <span className="px-2.5 py-1 rounded-full bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-xs">
                        Community Partner
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-xs">
                      {venue.courtsCount} Courts
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-slate-900 text-xs font-bold shadow-xs">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{venue.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({venue.totalReviews})
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {venue.name}
                    </h3>

                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {venue.area}, {venue.city}
                    </p>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {venue.description}
                    </p>

                    {/* Amenities pills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {venue.amenities.slice(0, 4).map((amenity) => (
                        <span
                          key={amenity}
                          className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Court Slots From
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-slate-900">₹380</span>
                        <span className="text-xs text-slate-400">/hr</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setBookingFacility(venue)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Book Court
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingFacility && (
        <SportsCourtBookingModal
          facility={bookingFacility}
          onClose={() => setBookingFacility(null)}
        />
      )}
    </div>
  );
}
