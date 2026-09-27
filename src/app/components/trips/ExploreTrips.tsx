import { useState, useEffect } from "react";
import {
  Compass,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  QrCode,
  Bus,
  Plus,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  Mountain,
  Tent,
  HeartHandshake,
  Star,
  Download,
  AlertCircle,
  Bed,
  Phone,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Progress } from "../ui/progress";
import {
  tripService,
  type Trip,
  type TripBooking,
  type TripCategory,
} from "../../../services/trips/tripService";
import { useAuth } from "../../../contexts/AuthContext";
import { HostTripWizard } from "./HostTripWizard";
import { TripBookingDialog } from "./TripBookingDialog";
import { HostRosterModal } from "./HostRosterModal";
import { TripReviewModal } from "./TripReviewModal";
import { TripCancellationModal } from "./TripCancellationModal";

const CATEGORY_ICONS: Record<TripCategory, React.ComponentType<{ className?: string }>> = {
  TREKKING: Mountain,
  PILGRIMAGE: Sparkles,
  OUTING: Compass,
  CAMPING: Tent,
  ADVENTURE: Compass,
  WELLNESS: HeartHandshake,
};

export function ExploreTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [myBookings, setMyBookings] = useState<TripBooking[]>([]);
  const [hostTrips, setHostTrips] = useState<Trip[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState("explore");

  // Modals state
  const [selectedTripDetails, setSelectedTripDetails] = useState<Trip | null>(null);
  const [bookingTrip, setBookingTrip] = useState<Trip | null>(null);
  const [isHostWizardOpen, setIsHostWizardOpen] = useState(false);
  const [rosterTrip, setRosterTrip] = useState<Trip | null>(null);
  const [reviewTrip, setReviewTrip] = useState<Trip | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<TripBooking | null>(null);
  const [qrBoardingPass, setQrBoardingPass] = useState<TripBooking | null>(null);

  const currentUser = {
    id: user?.userId || "user-resident-1",
    fullName: user?.fullName || "Community Member",
    flatNo: user?.flatNo || "Flat A-204",
    phone: user?.email ? "+91 98450 12345" : "+91 98450 12345",
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTrips(tripService.getTrips());
    setMyBookings(tripService.getMyBookings(currentUser.id));
    setHostTrips(tripService.getHostTrips(currentUser.id));
  };

  const filteredTrips = trips.filter((t) => {
    if (selectedCategory === "ALL") return true;
    return t.category === selectedCategory;
  });

  const categories: { label: string; value: string }[] = [
    { label: "All Getaways", value: "ALL" },
    { label: "Trekking & Trails", value: "TREKKING" },
    { label: "Pilgrimages", value: "PILGRIMAGE" },
    { label: "Day Outings", value: "OUTING" },
    { label: "Camping", value: "CAMPING" },
    { label: "Adventure", value: "ADVENTURE" },
    { label: "Wellness", value: "WELLNESS" },
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-8 h-8 text-blue-200 animate-spin-slow" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mana Community Trips OS</h1>
          </div>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl">
            Curated weekend getaways, passenger rosters, transport logistics, and digital boarding passes hosted by verified neighbors.
          </p>
        </div>

        <Button
          className="bg-white text-indigo-700 hover:bg-blue-50 font-bold shadow-md gap-2"
          onClick={() => setIsHostWizardOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Host a Trip
        </Button>
      </div>

      {/* Primary Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md h-auto p-1 bg-slate-100 rounded-xl">
          <TabsTrigger value="explore" className="py-2.5 font-semibold text-xs gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            Explore ({trips.length})
          </TabsTrigger>
          <TabsTrigger value="my-trips" className="py-2.5 font-semibold text-xs gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            My Bookings ({myBookings.length})
          </TabsTrigger>
          <TabsTrigger value="host-hub" className="py-2.5 font-semibold text-xs gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            Host Hub ({hostTrips.length})
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Explore Trips ── */}
        <TabsContent value="explore" className="space-y-6 pt-4">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                size="sm"
                variant={selectedCategory === cat.value ? "default" : "outline"}
                className={`rounded-full text-xs font-semibold whitespace-nowrap ${
                  selectedCategory === cat.value
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Trips Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => {
              const Icon = CATEGORY_ICONS[trip.category] || Compass;
              const seatsLeft = trip.totalSeats - trip.bookedSeats;
              const progressPct = Math.min(100, Math.round((trip.bookedSeats / trip.totalSeats) * 100));

              return (
                <Card key={trip.id} className="border hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group">
                  <div>
                    {/* Header Banner */}
                    <div
                      className="h-28 w-full flex items-center justify-between p-4 text-white relative transition-all"
                      style={{ backgroundColor: trip.imagePlaceholderColor || "#3b82f6" }}
                    >
                      <Badge className="bg-black/30 backdrop-blur-md text-white border-0 text-xs flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5" />
                        {trip.category}
                      </Badge>
                      <Badge className="bg-white text-slate-800 font-bold shadow text-xs">
                        {trip.transport}
                      </Badge>
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs font-bold text-indigo-600">
                          <MapPin className="w-3.5 h-3.5" />
                          {trip.destination}
                        </div>
                        {trip.reviews && trip.reviews.length > 0 && (
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            {(
                              trip.reviews.reduce((s, r) => s + r.rating, 0) / trip.reviews.length
                            ).toFixed(1)}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-lg text-slate-900 line-clamp-1">{trip.title}</CardTitle>
                      <CardDescription className="text-xs text-slate-500 line-clamp-2">
                        {trip.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      {/* Dates & Departure */}
                      <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Departure:
                          </span>
                          <strong className="text-slate-800 font-semibold">
                            {new Date(trip.departureDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            Pickup:
                          </span>
                          <span className="text-slate-800 font-medium truncate max-w-[170px]">{trip.departurePoint}</span>
                        </div>
                      </div>

                      {/* Seats Progress & Waitlist */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            {trip.bookedSeats} / {trip.totalSeats} Booked
                          </span>
                          <span className={seatsLeft <= 3 ? "text-rose-600 font-bold" : "text-slate-500"}>
                            {seatsLeft > 0 ? `${seatsLeft} seat(s) left` : `Waitlist: ${trip.waitlistCount} pax`}
                          </span>
                        </div>
                        <Progress value={progressPct} className="h-2 bg-slate-100" />
                      </div>

                      {/* Price & Host */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Price per person</p>
                          <p className="text-xl font-black text-indigo-700">₹{trip.pricePerPerson.toLocaleString()}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-slate-400 text-[10px]">Trip Host</p>
                          <p className="font-bold text-slate-800">{trip.host} ({trip.hostFlatNumber})</p>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="pt-2 border-t bg-slate-50/50 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 font-semibold text-xs"
                      onClick={() => setSelectedTripDetails(trip)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      className={`flex-1 font-bold text-xs ${
                        seatsLeft <= 0 ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                      onClick={() => setBookingTrip(trip)}
                    >
                      {seatsLeft <= 0 ? "Join Waitlist" : "Book Seats →"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── TAB 2: My Bookings ── */}
        <TabsContent value="my-trips" className="space-y-6 pt-4">
          {myBookings.length === 0 ? (
            <Card className="p-12 text-center text-slate-400">
              <Compass className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-base font-semibold text-slate-700">No trip bookings yet</p>
              <p className="text-xs text-slate-500 mt-1">Discover thrilling weekend getaways with your society neighbours.</p>
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => setActiveTab("explore")}>
                Explore Trips Board
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBookings.map((b) => (
                <Card key={b.id} className="border shadow-sm flex flex-col justify-between">
                  <div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-xs">{b.id}</Badge>
                        <Badge
                          className={`text-xs font-bold ${
                            b.status === "CONFIRMED"
                              ? "bg-emerald-600 text-white"
                              : b.status === "WAITLISTED"
                              ? "bg-amber-500 text-white"
                              : "bg-rose-600 text-white"
                          }`}
                        >
                          {b.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base text-slate-900 pt-2 line-clamp-1">{b.tripTitle}</CardTitle>
                      <CardDescription className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500" />
                        {b.destination}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border">
                        <div className="flex justify-between text-slate-600">
                          <span>Departure:</span>
                          <strong className="text-slate-800">{new Date(b.departureDate).toLocaleDateString()}</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Passengers:</span>
                          <strong className="text-slate-800">{b.participantCount} Person(s)</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Pickup Point:</span>
                          <strong className="text-slate-800 truncate max-w-[150px]">{b.selectedPickupPoint || "Main Gate"}</strong>
                        </div>
                        <div className="flex justify-between pt-1.5 border-t">
                          <span className="text-slate-500">Amount Paid:</span>
                          <strong className="text-indigo-700 font-bold text-sm">₹{b.totalAmount.toLocaleString()}</strong>
                        </div>
                      </div>

                      {/* Passenger chips */}
                      <div className="flex flex-wrap gap-1">
                        {b.passengers.map((p) => (
                          <Badge key={p.id} variant="secondary" className="text-[10px] font-medium bg-slate-100">
                            {p.name} ({p.age}y)
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="pt-2 border-t bg-slate-50/50 flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full font-semibold text-xs gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => setQrBoardingPass(b)}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Digital Boarding Pass
                    </Button>

                    <div className="flex gap-2 w-full">
                      {b.status === "CONFIRMED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-[11px] text-rose-600 hover:bg-rose-50 font-semibold"
                          onClick={() => setCancellingBooking(b)}
                        >
                          Cancel &amp; Refund
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-[11px] text-amber-700 hover:bg-amber-50 font-semibold"
                        onClick={() => {
                          const tripObj = tripService.getTripById(b.tripId);
                          if (tripObj) setReviewTrip(tripObj);
                        }}
                      >
                        Rate Trip
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 3: Host Hub ── */}
        <TabsContent value="host-hub" className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Hosted Trips &amp; Passenger Manifests</h3>
              <p className="text-xs text-slate-500">Manage travelers, scan boarding QR passes, and view trip earnings.</p>
            </div>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-1.5"
              onClick={() => setIsHostWizardOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Host New Trip
            </Button>
          </div>

          {hostTrips.length === 0 ? (
            <Card className="p-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-base font-semibold text-slate-700">You haven't hosted any trips yet</p>
              <p className="text-xs text-slate-500 mt-1">Lead your neighbors on weekend road trips, pilgrimages, or treks!</p>
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => setIsHostWizardOpen(true)}>
                Create First Trip
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hostTrips.map((trip) => {
                const confirmedCount = trip.bookedSeats;
                const totalRevenue = trip.bookedSeats * trip.pricePerPerson;

                return (
                  <Card key={trip.id} className="border shadow-sm flex flex-col justify-between">
                    <div>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-indigo-100 text-indigo-700 font-bold text-xs">{trip.category}</Badge>
                          <Badge className="bg-emerald-600 text-white font-bold text-xs">{trip.status}</Badge>
                        </div>
                        <CardTitle className="text-base text-slate-900 pt-2 line-clamp-1">{trip.title}</CardTitle>
                        <CardDescription className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500" />
                          {trip.destination}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-0 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 bg-slate-50 rounded-lg border text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Booked Seats</span>
                            <p className="text-base font-bold text-slate-800">{confirmedCount} / {trip.totalSeats}</p>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-lg border text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Revenue</span>
                            <p className="text-base font-bold text-indigo-700">₹{totalRevenue.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg space-y-1 text-slate-600">
                          <div className="flex justify-between">
                            <span>Transport:</span>
                            <strong className="text-slate-800">{trip.transport}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Driver Phone:</span>
                            <strong className="text-slate-800">{trip.transportDetails?.driverPhone || "N/A"}</strong>
                          </div>
                        </div>
                      </CardContent>
                    </div>

                    <CardFooter className="pt-2 border-t bg-slate-50/50">
                      <Button
                        size="sm"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold text-xs gap-1.5"
                        onClick={() => setRosterTrip(trip)}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Open Passenger Roster &amp; QR Scanner
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Trip Full Details ── */}
      <Dialog open={!!selectedTripDetails} onOpenChange={() => setSelectedTripDetails(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedTripDetails && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedTripDetails.category}</Badge>
                  <Badge className="bg-indigo-600 text-white">{selectedTripDetails.transport}</Badge>
                </div>
                <DialogTitle className="text-xl font-bold text-slate-900 pt-1">{selectedTripDetails.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-1 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  {selectedTripDetails.destination} &bull; Hosted by {selectedTripDetails.host} ({selectedTripDetails.hostFlatNumber})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">About the Trip</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedTripDetails.description}</p>
                </div>

                {/* Logistics Info Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                    <h5 className="font-bold text-blue-900 flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5 text-blue-700" />
                      Transport &amp; Vehicle
                    </h5>
                    <p className="text-slate-700"><strong>Type:</strong> {selectedTripDetails.transport}</p>
                    {selectedTripDetails.transportDetails?.driverName && (
                      <p className="text-slate-700"><strong>Driver:</strong> {selectedTripDetails.transportDetails.driverName} ({selectedTripDetails.transportDetails.driverPhone})</p>
                    )}
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                    <h5 className="font-bold text-indigo-900 flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-indigo-700" />
                      Accommodation Stay
                    </h5>
                    <p className="text-slate-700"><strong>Stay:</strong> {selectedTripDetails.accommodationDetails?.hotelName || "Resort / Camps"}</p>
                    <p className="text-slate-700"><strong>Rooms:</strong> {selectedTripDetails.accommodationDetails?.roomTypes?.join(", ") || "Twin Sharing"}</p>
                  </div>
                </div>

                {/* Itinerary Timeline */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-slate-800">Day-by-Day Itinerary</h4>
                  <div className="space-y-2">
                    {selectedTripDetails.itinerary.map((day) => (
                      <div key={day.day} className="p-3 bg-slate-50 rounded-xl border space-y-1">
                        <div className="font-bold text-indigo-700">Day {day.day}: {day.title}</div>
                        <ul className="list-disc list-inside text-slate-600 space-y-0.5 pl-1">
                          {day.activities.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inclusions & Exclusions */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <h5 className="font-bold text-emerald-800">What's Included</h5>
                    <ul className="list-disc list-inside text-emerald-900 space-y-0.5">
                      {selectedTripDetails.includes.map((inc, i) => (
                        <li key={i}>{inc}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                    <h5 className="font-bold text-rose-800">What's Excluded</h5>
                    <ul className="list-disc list-inside text-rose-900 space-y-0.5">
                      {selectedTripDetails.excludes.map((exc, i) => (
                        <li key={i}>{exc}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Cancellation Rules */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900">
                  <h5 className="font-bold flex items-center gap-1 text-amber-900">
                    <Shield className="w-3.5 h-3.5" />
                    Cancellation &amp; Refund Policy
                  </h5>
                  <p className="text-xs text-amber-800">
                    {selectedTripDetails.cancellationPolicy.policyNotes}
                  </p>
                </div>
              </div>

              <DialogFooter className="flex justify-between items-center pt-2 border-t">
                <div className="text-left">
                  <span className="text-slate-400 text-[10px]">Price per person</span>
                  <p className="text-lg font-black text-indigo-700">₹{selectedTripDetails.pricePerPerson.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedTripDetails(null)}>Close</Button>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                    onClick={() => {
                      const t = selectedTripDetails;
                      setSelectedTripDetails(null);
                      setBookingTrip(t);
                    }}
                  >
                    Proceed to Book
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Digital Boarding Pass QR ── */}
      <Dialog open={!!qrBoardingPass} onOpenChange={() => setQrBoardingPass(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Digital Boarding Pass</DialogTitle>
            <DialogDescription className="text-xs">{qrBoardingPass?.tripTitle}</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div className="w-48 h-48 mx-auto bg-slate-50 border-2 border-dashed border-indigo-300 rounded-2xl flex flex-col items-center justify-center p-3 shadow-inner">
              <QrCode className="w-28 h-28 text-slate-800" />
              <span className="font-mono font-bold text-xs text-indigo-700 mt-2">{qrBoardingPass?.boardingPassQR}</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>{qrBoardingPass?.participantCount} Traveler(s)</strong> &bull; Pickup: {qrBoardingPass?.selectedPickupPoint || "Main Gate"}</p>
              <p className="text-slate-400 text-[11px]">Show this QR code to the trip marshal at the pickup point.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modals ── */}
      <HostTripWizard
        isOpen={isHostWizardOpen}
        onClose={() => setIsHostWizardOpen(false)}
        onTripCreated={loadData}
        currentUser={currentUser}
      />

      <TripBookingDialog
        trip={bookingTrip}
        isOpen={!!bookingTrip}
        onClose={() => setBookingTrip(null)}
        onBookingComplete={() => {
          loadData();
          setActiveTab("my-trips");
        }}
        currentUser={currentUser}
      />

      <HostRosterModal
        trip={rosterTrip}
        isOpen={!!rosterTrip}
        onClose={() => setRosterTrip(null)}
        currentUser={currentUser}
      />

      <TripReviewModal
        trip={reviewTrip}
        isOpen={!!reviewTrip}
        onClose={() => setReviewTrip(null)}
        currentUser={currentUser}
      />

      <TripCancellationModal
        booking={cancellingBooking}
        isOpen={!!cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        onCancellationComplete={loadData}
      />
    </div>
  );
}
