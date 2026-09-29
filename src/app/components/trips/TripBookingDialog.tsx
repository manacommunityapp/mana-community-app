import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Users,
  Shield,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  MapPin,
  Bed,
  QrCode,
} from "lucide-react";
import {
  tripService,
  type Trip,
  type PassengerInfo,
  type TripBooking,
} from "../../../services/trips/tripService";

interface TripBookingDialogProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete: (booking: TripBooking) => void;
  currentUser: { id: string; fullName: string; flatNo?: string; phone?: string };
}

export function TripBookingDialog({
  trip,
  isOpen,
  onClose,
  onBookingComplete,
  currentUser,
}: TripBookingDialogProps) {
  const [passengers, setPassengers] = useState<PassengerInfo[]>([
    {
      id: "p-1",
      name: currentUser.fullName || "Primary Traveler",
      age: 32,
      gender: "MALE",
      emergencyPhone: currentUser.phone || "+91 98450 12345",
      bloodGroup: "O+",
      medicalNotes: "",
    },
  ]);

  const [selectedRoomType, setSelectedRoomType] = useState<string>(
    trip?.accommodationDetails?.roomTypes?.[0] || "Twin Sharing"
  );
  const [selectedPickup, setSelectedPickup] = useState<string>(
    trip?.pickupStops?.[0] || trip?.departurePoint || "Society Main Gate"
  );
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<TripBooking | null>(null);

  if (!trip) return null;

  const seatsLeft = trip.totalSeats - trip.bookedSeats;
  const isWaitlistBooking = seatsLeft < passengers.length;
  const totalPayable = trip.pricePerPerson * passengers.length;

  const handleAddPassenger = () => {
    setPassengers([
      ...passengers,
      {
        id: `p-${passengers.length + 1}`,
        name: "",
        age: 28,
        gender: "FEMALE",
        emergencyPhone: currentUser.phone || "+91 98450 12345",
        bloodGroup: "B+",
        medicalNotes: "",
      },
    ]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length <= 1) return;
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handleUpdatePassenger = (index: number, field: keyof PassengerInfo, val: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: val };
    setPassengers(updated);
  };

  const handlePayAndConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const booking = tripService.bookTrip(
          trip.id,
          {
            passengers,
            selectedRoomType,
            selectedPickupPoint: selectedPickup,
            paymentMethod,
          },
          currentUser
        );
        setConfirmedBooking(booking);
        onBookingComplete(booking);
      } catch (err: any) {
        alert(err.message || "Failed to book trip");
      } finally {
        setIsProcessing(false);
      }
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {trip.category}
            </Badge>
            <span className="text-xs font-bold text-indigo-700">
              ₹{trip.pricePerPerson.toLocaleString()} / seat
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {confirmedBooking ? "Booking Confirmed 🎉" : "Trip Registration & Passenger Details"}
          </DialogTitle>
          <DialogDescription className="text-xs flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            {trip.destination} &bull; Departs: {new Date(trip.departureDate).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        {confirmedBooking ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {confirmedBooking.status === "CONFIRMED" ? "Seats Confirmed!" : "Added to Priority Waitlist!"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Booking ID: <span className="font-mono font-bold text-slate-700">{confirmedBooking.id}</span>.
                Your digital boarding pass has been saved to My Bookings.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border rounded-2xl max-w-xs mx-auto space-y-2">
              <QrCode className="w-28 h-28 text-slate-800 mx-auto" />
              <p className="font-mono text-xs font-bold text-indigo-700">{confirmedBooking.boardingPassQR}</p>
              <p className="text-[11px] text-slate-400">Show this QR code at pickup for instant check-in.</p>
            </div>

            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={onClose}>
              View in My Bookings
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-2 text-xs">
            {/* Capacity Status Alert */}
            {isWaitlistBooking ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Only {seatsLeft} confirmed seat(s) remaining. Booking now will place you on the Priority Waitlist.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800">
                <span className="font-semibold">{seatsLeft} confirmed seats available</span>
                <Badge className="bg-emerald-600 text-white font-bold text-[10px]">Instant Confirmation</Badge>
              </div>
            )}

            {/* Passenger Roster Entry */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Traveler Details ({passengers.length})
                </h4>
                <Button size="sm" variant="outline" onClick={handleAddPassenger} className="text-xs gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  Add Passenger
                </Button>
              </div>

              {passengers.map((p, idx) => (
                <div key={p.id} className="p-3.5 bg-slate-50 border rounded-xl space-y-2.5 relative">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">Passenger #{idx + 1}</span>
                    {passengers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePassenger(idx)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-semibold text-slate-600">Full Name *</label>
                      <Input
                        placeholder="Traveler Full Name"
                        value={p.name}
                        onChange={(e) => handleUpdatePassenger(idx, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Age *</label>
                      <Input
                        type="number"
                        value={p.age}
                        onChange={(e) => handleUpdatePassenger(idx, "age", Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Gender</label>
                      <select
                        value={p.gender}
                        onChange={(e) => handleUpdatePassenger(idx, "gender", e.target.value)}
                        className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Emergency Phone *</label>
                      <Input
                        placeholder="+91..."
                        value={p.emergencyPhone}
                        onChange={(e) => handleUpdatePassenger(idx, "emergencyPhone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Blood Group</label>
                      <Input
                        placeholder="e.g. O+, B+"
                        value={p.bloodGroup}
                        onChange={(e) => handleUpdatePassenger(idx, "bloodGroup", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Room Preference & Pickup Stop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-indigo-600" />
                  Room Preference
                </label>
                <select
                  value={selectedRoomType}
                  onChange={(e) => setSelectedRoomType(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                >
                  {(trip.accommodationDetails?.roomTypes || ["Twin Sharing", "Double Room"]).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  Pickup Point
                </label>
                <select
                  value={selectedPickup}
                  onChange={(e) => setSelectedPickup(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs"
                >
                  {(trip.pickupStops || [trip.departurePoint]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Breakdown & Method */}
            <div className="p-3.5 bg-slate-50 border rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Fare Summary &amp; Payment
              </h4>

              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Rate per traveler:</span>
                  <strong>₹{trip.pricePerPerson.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total travelers:</span>
                  <strong>{passengers.length} Person(s)</strong>
                </div>
                <div className="flex justify-between pt-1 border-t text-sm font-bold text-slate-900">
                  <span>Total Amount Payable:</span>
                  <span className="text-indigo-700">₹{totalPayable.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t flex gap-2">
                {(["UPI", "CARD", "NETBANKING"] as const).map((method) => (
                  <Button
                    key={method}
                    type="button"
                    size="sm"
                    variant={paymentMethod === method ? "default" : "outline"}
                    className={`flex-1 text-xs font-bold ${
                      paymentMethod === method ? "bg-indigo-600 text-white" : ""
                    }`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {!confirmedBooking && (
          <DialogFooter className="flex gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 font-bold gap-1.5"
              onClick={handlePayAndConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing Payment..." : `Pay ₹${totalPayable.toLocaleString()} & Confirm`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
