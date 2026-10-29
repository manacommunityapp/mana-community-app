import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Star,
  ChevronLeft,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { sportsVendorService } from "../../../../services/sports/sportsVendorService";
import type {
  SportsFacility,
  SportsCourtConfig,
} from "../../../../types/sportsVendor";
import { SportsCourtBookingModal } from "./SportsCourtBookingModal";

export function SportsVenueDetail() {
  const { venueId } = useParams<{ venueId: string }>();
  const [facility, setFacility] = useState<SportsFacility | null>(null);
  const [courts, setCourts] = useState<SportsCourtConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (venueId) {
      loadFacility(venueId);
    }
  }, [venueId]);

  async function loadFacility(id: string) {
    setLoading(true);
    try {
      const fac = await sportsVendorService.getFacilityById(id);
      setFacility(fac);
      const crts = await sportsVendorService.getCourts(fac.id);
      setCourts(crts);
    } catch (err) {
      toast.error("Failed to load facility details");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading sports venue profile...
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-800">Sports Venue Not Found</h2>
        <Link to="/sports/venues" className="text-emerald-600 font-bold hover:underline mt-2 inline-block">
          Return to Venues Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/sports/venues"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Sports Venues
        </Link>
      </div>

      {/* Hero Gallery & Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="relative h-64 sm:h-80 w-full bg-slate-900">
          <img
            src={facility.images[0]}
            alt={facility.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold">
                  {facility.courtsCount} Courts
                </span>
                {facility.isFederated && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/90 text-white text-[11px] font-bold">
                    Apartment Partner Venue
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">{facility.name}</h1>
              <p className="text-xs text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {facility.address}, {facility.area}, {facility.city} - {facility.pinCode}
              </p>
            </div>

            <button
              onClick={() => setShowBookingModal(true)}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all self-start sm:self-auto"
            >
              <Calendar className="w-4 h-4" />
              Book a Court
            </button>
          </div>
        </div>

        {/* Info Strip */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border-t border-slate-100 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Rating</span>
            <div className="flex items-center gap-1 font-bold text-slate-900 mt-0.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{facility.rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({facility.totalReviews} reviews)</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Hours</span>
            <span className="font-bold text-slate-900 block mt-0.5">
              {facility.openingTime} - {facility.closingTime}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Contact</span>
            <span className="font-semibold text-slate-800 block mt-0.5 truncate">
              {facility.contactPhone}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Email</span>
            <span className="font-semibold text-slate-800 block mt-0.5 truncate">
              {facility.contactEmail}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Courts & Facility Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Courts Showcase (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Courts & Turf Inventory</h2>
              <p className="text-xs text-slate-500">
                Bookable playing courts with specifications, surface types, and resident rates.
              </p>
            </div>

            <div className="space-y-3">
              {courts.map((court) => (
                <div
                  key={court.id}
                  className="p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{court.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {court.sportType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {court.surfaceType.replace("_", " ")} • {court.isIndoor ? "Indoor Court" : "Outdoor"} •{" "}
                      {court.hasLighting ? "Floodlit" : "Natural Light"}
                    </p>
                    {court.rules && court.rules.length > 0 && (
                      <p className="text-[11px] text-slate-400">Rules: {court.rules.join(" • ")}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">₹{court.baseHourlyPrice} /hr</div>
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        Resident: ₹{Math.round(court.baseHourlyPrice * (1 - court.residentDiscountPercent / 100))}
                      </span>
                    </div>

                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Book Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Amenities & Community Perks */}
        <div className="space-y-6">
          {/* Amenities */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Facility Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {facility.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          {/* Partner Communities */}
          {facility.isFederated && (
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-3xl border border-indigo-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Federated Partner Communities
                </h3>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Residents of the following verified communities enjoy preferred slot bookings and 15% instant checkout discounts:
              </p>
              <div className="space-y-1 text-xs font-bold text-indigo-950">
                {facility.partnerCommunities?.map((comm) => (
                  <div key={comm} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>{comm}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <SportsCourtBookingModal
          facility={facility}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
}
