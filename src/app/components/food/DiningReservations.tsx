import { useState, useEffect } from "react";
import {
  CalendarDays, Clock, Users, MapPin, Search, Filter,
  CheckCircle2, XCircle, AlertCircle, ChevronRight, Phone, Utensils
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { foodDiningService } from "../../../services/food/foodDiningService";
import { foodRestaurantService } from "../../../services/food/foodRestaurantService";
import type { DiningReservation, DiningReservationRequest, FoodRestaurant } from "../../../types/food";

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  CONFIRMED: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  PENDING: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: AlertCircle },
  COMPLETED: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle2 },
  CANCELLED: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  SEATED: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: CheckCircle2 },
  NO_SHOW: { color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400", icon: XCircle },
};

const timeSlots = ["12:00", "12:30", "13:00", "13:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

export function DiningReservations() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("book");
  const [reservations, setReservations] = useState<DiningReservation[]>([]);
  const [restaurants, setRestaurants] = useState<FoodRestaurant[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<DiningReservation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Form states
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resData, restData] = await Promise.allSettled([
        foodDiningService.getMyReservations(0, 50),
        foodRestaurantService.getRestaurants(0, 50),
      ]);

      if (resData.status === "fulfilled" && resData.value?.content) {
        setReservations(resData.value.content);
      }
      if (restData.status === "fulfilled" && restData.value?.content) {
        setRestaurants(restData.value.content);
      }
    } catch (err) {
      console.error("Failed to load dining data:", err);
      setError("Failed to load dining reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDetail = (r: DiningReservation) => {
    setSelectedReservation(r);
    setDetailOpen(true);
  };

  const handleBookTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant || !selectedDate || !selectedTime) {
      alert("Please select a restaurant, date, and time.");
      return;
    }
    try {
      setSubmitting(true);
      const req: DiningReservationRequest = {
        restaurantId: Number(selectedRestaurant),
        partySize: Number(guestCount),
        date: selectedDate,
        time: selectedTime,
        specialRequests: specialRequests || undefined,
      };
      await foodDiningService.createReservation(req);
      await loadData();
      setActiveTab("upcoming");
      setSelectedRestaurant("");
      setSelectedDate("");
      setSelectedTime("");
      setSpecialRequests("");
    } catch (err) {
      console.error("Failed to create reservation:", err);
      alert("Failed to make reservation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReservation = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await foodDiningService.cancelReservation(id, "Cancelled by user");
      setDetailOpen(false);
      await loadData();
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
      alert("Failed to cancel reservation.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const upcomingReservations = reservations.filter((r) => r.status === "CONFIRMED" || r.status === "PENDING");
  const pastReservations = reservations.filter((r) => r.status === "COMPLETED" || r.status === "CANCELLED" || r.status === "NO_SHOW");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dining Reservations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Book tables and manage your community dining</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-700 dark:text-amber-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="book">Book Table</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingReservations.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastReservations.length})</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reserve a Table</CardTitle>
                <CardDescription>Select your preferences and book instantly</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBookTable} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Restaurant</Label>
                    <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                      <SelectTrigger><SelectValue placeholder="Choose restaurant" /></SelectTrigger>
                      <SelectContent>
                        {restaurants.length === 0 ? (
                          <SelectItem value="none" disabled>No restaurants available</SelectItem>
                        ) : (
                          restaurants.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>{r.name} {r.cuisineTypes ? `- ${r.cuisineTypes}` : ""}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Date</Label>
                      <Input type="date" required value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Guests</Label>
                      <Select value={guestCount} onValueChange={setGuestCount}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "Guest" : "Guests"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Time Slot</Label>
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedTime === t
                              ? "bg-orange-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Special Requests (optional)</Label>
                    <Textarea
                      placeholder="Window seat, high chair needed, anniversary setup..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="h-20 text-sm"
                    />
                  </div>
                  <Button type="submit" disabled={submitting || !selectedRestaurant || !selectedTime} className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
                    <CalendarDays className="w-4 h-4" /> {submitting ? "Booking..." : "Confirm Reservation"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Restaurants</h3>
              {restaurants.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center flex flex-col items-center">
                    <Utensils className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-medium text-slate-500">No restaurants available</p>
                    <p className="text-xs text-slate-400 mt-1">Restaurants supporting reservations will appear here once listed.</p>
                  </CardContent>
                </Card>
              ) : (
                restaurants.map((r) => (
                  <Card key={r.id} className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-all ${selectedRestaurant === String(r.id) ? "ring-2 ring-orange-500" : ""}`} onClick={() => setSelectedRestaurant(String(r.id))}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{r.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.cuisineTypes || "Multi-Cuisine"}</p>
                        {r.address && (
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-400">{r.address}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {r.rating ? <Badge variant="secondary" className="text-xs">{r.rating.toFixed(1)} ★</Badge> : null}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {upcomingReservations.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No upcoming reservations</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveTab("book")}>Book Now</Button>
              </CardContent>
            </Card>
          ) : (
            upcomingReservations.map((r) => {
              const cfg = statusConfig[r.status] || { color: "bg-slate-100 text-slate-700", icon: Clock };
              const StatusIcon = cfg.icon;
              return (
                <Card key={r.id} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => openDetail(r)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{r.restaurantName || `Restaurant #${r.restaurantId}`}</p>
                          <Badge className={`text-[10px] ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />{r.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {r.date && (
                            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
                          )}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.time}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.partySize} guests</span>
                        </div>
                        {r.occasion && <Badge variant="outline" className="text-[10px] mt-2">{r.occasion}</Badge>}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-4">
          {pastReservations.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center text-slate-400">
                <p className="text-sm font-medium">No past dining history</p>
              </CardContent>
            </Card>
          ) : (
            pastReservations.map((r) => {
              const cfg = statusConfig[r.status] || { color: "bg-slate-100 text-slate-700", icon: Clock };
              const StatusIcon = cfg.icon;
              return (
                <Card key={r.id} className="border-0 shadow-sm opacity-80 cursor-pointer hover:opacity-100 transition-all" onClick={() => openDetail(r)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{r.restaurantName || `Restaurant #${r.restaurantId}`}</p>
                          <Badge className={`text-[10px] ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />{r.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {r.date && (
                            <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</span>
                          )}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.time}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.partySize} guests</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="waitlist" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No active waitlist entries</p>
              <p className="text-xs text-slate-400 mt-1">Join a waitlist when your preferred table time is fully booked.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reservation Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
            <DialogDescription>{selectedReservation?.restaurantName || `Reservation #${selectedReservation?.id}`}</DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Date</p>
                  <p className="text-sm font-semibold">{new Date(selectedReservation.date).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Time</p>
                  <p className="text-sm font-semibold">{selectedReservation.time}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Guests</p>
                  <p className="text-sm font-semibold">{selectedReservation.partySize}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                  <Badge className={`text-[10px] ${statusConfig[selectedReservation.status]?.color || ""}`}>{selectedReservation.status}</Badge>
                </div>
              </div>
              {selectedReservation.confirmationCode && (
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Confirmation Code</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{selectedReservation.confirmationCode}</p>
                </div>
              )}
              {selectedReservation.specialRequests && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Special Requests</p>
                  <p className="text-sm">{selectedReservation.specialRequests}</p>
                </div>
              )}
              <div className="flex gap-3">
                {selectedReservation.status === "CONFIRMED" && (
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleCancelReservation(selectedReservation.id)}>
                    Cancel Reservation
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
