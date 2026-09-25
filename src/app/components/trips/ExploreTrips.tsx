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
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import {
  tripService,
  type Trip,
  type TripBooking,
  type TripCategory,
} from "../../../services/trips/tripService";
import { useAuth } from "../../../contexts/AuthContext";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState("explore");

  // Detail Modal
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Booking Modal
  const [bookingTrip, setBookingTrip] = useState<Trip | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // QR Boarding Pass Modal
  const [qrBooking, setQrBooking] = useState<TripBooking | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTrips(tripService.getTrips());
    setMyBookings(tripService.getMyBookings(user?.userId || "user-1"));
  };

  const filteredTrips = trips.filter((t) => {
    if (selectedCategory === "ALL") return true;
    return t.category === selectedCategory;
  });

  const handleOpenBooking = (trip: Trip) => {
    setBookingTrip(trip);
    setPassengerCount(1);
    setBookingSuccess(false);
    setIsBooking(true);
  };

  const handleConfirmBooking = () => {
    if (!bookingTrip) return;
    tripService.bookTrip(bookingTrip.id, passengerCount, user?.userId || "user-1");
    setBookingSuccess(true);
    loadData();
    setTimeout(() => {
      setIsBooking(false);
      setBookingSuccess(false);
      setActiveTab("my-trips");
    }, 1200);
  };

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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mana Community Travel & Trips</h1>
          </div>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl">
            Explore curated weekend treks, family outings, and spiritual yatras hosted by fellow community residents.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-xs h-auto p-1 bg-slate-100 rounded-xl">
          <TabsTrigger value="explore" className="py-2.5 font-semibold gap-2">
            <Compass className="w-4 h-4 text-blue-600" />
            Explore Trips ({trips.length})
          </TabsTrigger>
          <TabsTrigger value="my-trips" className="py-2.5 font-semibold gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            My Bookings ({myBookings.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Explore Trips */}
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
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
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
              const progressPct = Math.round((trip.bookedSeats / trip.totalSeats) * 100);

              return (
                <Card key={trip.id} className="border hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden">
                  <div>
                    {/* Header Color Accent */}
                    <div
                      className="h-28 w-full flex items-center justify-between p-4 text-white relative"
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
                      <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                        <MapPin className="w-3.5 h-3.5" />
                        {trip.destination}
                      </div>
                      <CardTitle className="text-lg text-slate-900 line-clamp-1">{trip.title}</CardTitle>
                      <CardDescription className="text-xs text-slate-500 line-clamp-2">
                        {trip.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      {/* Dates & Departure */}
                      <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Departure:
                          </span>
                          <strong className="text-slate-800 font-semibold">
                            {new Date(trip.departureDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            Pickup:
                          </span>
                          <span className="text-slate-800 font-medium">{trip.departurePoint}</span>
                        </div>
                      </div>

                      {/* Seats Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            {trip.bookedSeats} / {trip.totalSeats} Booked
                          </span>
                          <span className={seatsLeft <= 5 ? "text-red-600 font-bold" : "text-slate-500"}>
                            {seatsLeft} seat(s) left
                          </span>
                        </div>
                        <Progress value={progressPct} className="h-2 bg-slate-100" />
                      </div>

                      {/* Price & Host */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Cost per seat</p>
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
                      onClick={() => setSelectedTrip(trip)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold text-xs"
                      onClick={() => handleOpenBooking(trip)}
                      disabled={seatsLeft <= 0}
                    >
                      {seatsLeft <= 0 ? "Sold Out" : "Book Seats &rarr;"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: My Bookings */}
        <TabsContent value="my-trips" className="space-y-6 pt-4">
          {myBookings.length === 0 ? (
            <Card className="p-12 text-center text-slate-400">
              <Compass className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-base font-semibold text-slate-700">No trip bookings yet</p>
              <p className="text-xs text-slate-500 mt-1">Discover thrilling weekend getaways with your society neighbours.</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setActiveTab("explore")}>
                Explore Trips
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBookings.map((b) => (
                <Card key={b.id} className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-xs">{b.id}</Badge>
                      <Badge className="bg-emerald-600 font-semibold text-xs">{b.status}</Badge>
                    </div>
                    <CardTitle className="text-base text-slate-900 pt-2">{b.tripTitle}</CardTitle>
                    <CardDescription className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      {b.destination}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Departure:</span>
                        <strong className="text-slate-800">{new Date(b.departureDate).toLocaleDateString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Passengers:</span>
                        <strong className="text-slate-800">{b.participantCount} Person(s)</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t">
                        <span className="text-slate-500">Amount Paid:</span>
                        <strong className="text-indigo-700 font-bold text-sm">₹{b.totalAmount.toLocaleString()}</strong>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full font-semibold text-xs gap-2 border-slate-300"
                      onClick={() => setQrBooking(b)}
                    >
                      <QrCode className="w-4 h-4 text-slate-700" />
                      Digital Boarding Pass
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Trip Details Dialog */}
      <Dialog open={!!selectedTrip} onOpenChange={() => setSelectedTrip(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedTrip && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedTrip.category}</Badge>
                  <Badge className="bg-blue-600">{selectedTrip.transport}</Badge>
                </div>
                <DialogTitle className="text-xl font-bold text-slate-900 pt-1">{selectedTrip.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-red-500" />
                  {selectedTrip.destination} &bull; Hosted by {selectedTrip.host} ({selectedTrip.hostFlatNumber})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">About the Trip</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedTrip.description}</p>
                </div>

                {/* Itinerary Timeline */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800">Day-by-Day Itinerary</h4>
                  <div className="space-y-3">
                    {selectedTrip.itinerary.map((day) => (
                      <div key={day.day} className="p-3 bg-slate-50 rounded-xl border space-y-1">
                        <div className="font-bold text-blue-700">Day {day.day}: {day.title}</div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <h5 className="font-bold text-emerald-800">What's Included</h5>
                    <ul className="list-disc list-inside text-emerald-900 space-y-0.5">
                      {selectedTrip.includes.map((inc, i) => (
                        <li key={i}>{inc}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                    <h5 className="font-bold text-rose-800">What's Excluded</h5>
                    <ul className="list-disc list-inside text-rose-900 space-y-0.5">
                      {selectedTrip.excludes.map((exc, i) => (
                        <li key={i}>{exc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-between items-center">
                <div className="text-left">
                  <span className="text-slate-400 text-[10px]">Price per person</span>
                  <p className="text-lg font-bold text-indigo-700">₹{selectedTrip.pricePerPerson.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedTrip(null)}>Close</Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 font-bold"
                    onClick={() => {
                      const t = selectedTrip;
                      setSelectedTrip(null);
                      handleOpenBooking(t);
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

      {/* Booking Modal */}
      <Dialog open={isBooking} onOpenChange={setIsBooking}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Book Trip Seats</DialogTitle>
            <DialogDescription>{bookingTrip?.title}</DialogDescription>
          </DialogHeader>

          {bookingSuccess ? (
            <div className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-slate-900">Seats Confirmed!</h3>
              <p className="text-xs text-slate-500">Your digital boarding pass is ready in My Bookings.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs">
              {bookingTrip && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Number of Passengers</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                      >
                        -
                      </Button>
                      <span className="font-bold text-base text-slate-800 w-8 text-center">{passengerCount}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPassengerCount(passengerCount + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Per Person Rate:</span>
                      <strong>₹{bookingTrip.pricePerPerson.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Pickup Point:</span>
                      <strong>{bookingTrip.departurePoint}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Departure:</span>
                      <strong>{new Date(bookingTrip.departureDate).toLocaleDateString()}</strong>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-2 border-t text-sm">
                      <span>Total Amount:</span>
                      <span className="text-indigo-700">₹{(bookingTrip.pricePerPerson * passengerCount).toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {!bookingSuccess && (
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsBooking(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 font-bold" onClick={handleConfirmBooking}>
                Confirm & Pay
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Boarding Pass QR Modal */}
      <Dialog open={!!qrBooking} onOpenChange={() => setQrBooking(null)}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Digital Boarding Pass</DialogTitle>
            <DialogDescription>{qrBooking?.tripTitle}</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="w-48 h-48 mx-auto bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-4 shadow-inner">
              <QrCode className="w-28 h-28 text-slate-800" />
              <span className="font-mono font-bold text-xs text-slate-600 mt-2">{qrBooking?.boardingPassQR}</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>{qrBooking?.participantCount} Passenger(s)</strong></p>
              <p className="text-slate-400">Show this QR code to the trip marshal at the pickup point.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
