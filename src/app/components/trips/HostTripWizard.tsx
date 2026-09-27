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
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Compass,
  Bus,
  Calendar,
  Shield,
  MapPin,
  Users,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { tripService, type TripCategory } from "../../../services/trips/tripService";

interface HostTripWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated: () => void;
  currentUser: { id: string; fullName: string; flatNo?: string; phone?: string };
}

export function HostTripWizard({ isOpen, onClose, onTripCreated, currentUser }: HostTripWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Basics
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TripCategory>("OUTING");
  const [description, setDescription] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [departurePoint, setDeparturePoint] = useState("Society Main Clubhouse Gate");
  const [pricePerPerson, setPricePerPerson] = useState<number>(3500);

  // Step 2: Transport & Stay
  const [transportType, setTransportType] = useState("AC Volvo Mini-Bus");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [roomTypes, setRoomTypes] = useState("Twin Sharing, Family Suite");

  // Step 3: Itinerary & Inclusions
  const [itineraryDays, setItineraryDays] = useState([
    { day: 1, title: "Departure & Arrival", activities: "Morning departure from society gate, hotel check-in, evening group campfire" },
    { day: 2, title: "Sightseeing & Return", activities: "Guided morning nature trail, local lunch, return journey by 8 PM" },
  ]);
  const [includes, setIncludes] = useState("AC Transport, 1-Night Resort Stay, Breakfast & Dinner, Guide Charges");
  const [excludes, setExcludes] = useState("Lunch, Personal Expenses, Extra Activities");
  const [emergencyMarshalName, setEmergencyMarshalName] = useState(currentUser.fullName);
  const [emergencyMarshalPhone, setEmergencyMarshalPhone] = useState(currentUser.phone || "+91 98450 12345");

  // Step 4: Capacity & Policy
  const [totalSeats, setTotalSeats] = useState(25);
  const [maxWaitlist, setMaxWaitlist] = useState(10);
  const [freeCancellationDays, setFreeCancellationDays] = useState(5);
  const [penaltyPercent, setPenaltyPercent] = useState(30);

  const handleAddDay = () => {
    setItineraryDays([
      ...itineraryDays,
      {
        day: itineraryDays.length + 1,
        title: `Day ${itineraryDays.length + 1} Activities`,
        activities: "Activity description...",
      },
    ]);
  };

  const handleRemoveDay = (index: number) => {
    if (itineraryDays.length <= 1) return;
    const updated = itineraryDays.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }));
    setItineraryDays(updated);
  };

  const handlePublishTrip = () => {
    setIsSubmitting(true);
    try {
      const itineraryFormatted = itineraryDays.map((d) => ({
        day: d.day,
        title: d.title,
        activities: d.activities.split(",").map((a) => a.trim()).filter(Boolean),
      }));

      const categoryColors: Record<TripCategory, string> = {
        TREKKING: "#059669",
        PILGRIMAGE: "#7c3aed",
        OUTING: "#2563eb",
        CAMPING: "#0891b2",
        ADVENTURE: "#ea580c",
        WELLNESS: "#db2777",
      };

      tripService.createTrip(
        {
          title: title || `${destination} Community Getaway`,
          category,
          description: description || "Curated community outing hosted by neighbor.",
          destination: destination || "Scenic Getaway",
          departureDate: departureDate ? new Date(departureDate).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString(),
          returnDate: returnDate ? new Date(returnDate).toISOString() : new Date(Date.now() + 16 * 86400000).toISOString(),
          departurePoint,
          pickupStops: [departurePoint],
          totalSeats: Number(totalSeats),
          maxWaitlist: Number(maxWaitlist),
          pricePerPerson: Number(pricePerPerson),
          hostId: currentUser.id,
          host: currentUser.fullName,
          hostFlatNumber: currentUser.flatNo || "A-101",
          hostPhone: currentUser.phone || "+91 98450 00000",
          itinerary: itineraryFormatted,
          transport: transportType,
          transportDetails: {
            vehicleType: transportType,
            vehicleNumber,
            driverName,
            driverPhone,
          },
          accommodationDetails: {
            hotelName: hotelName || "Curated Homestay / Resort",
            hotelAddress: hotelAddress || destination,
            roomTypes: roomTypes.split(",").map((r) => r.trim()).filter(Boolean),
          },
          emergencyMarshal: {
            name: emergencyMarshalName,
            phone: emergencyMarshalPhone,
            firstAidCertified: true,
          },
          includes: includes.split(",").map((i) => i.trim()).filter(Boolean),
          excludes: excludes.split(",").map((e) => e.trim()).filter(Boolean),
          cancellationPolicy: {
            freeCancellationBeforeDays: Number(freeCancellationDays),
            penaltyPercentAfterDeadline: Number(penaltyPercent),
            policyNotes: `Full refund up to ${freeCancellationDays} days before departure. ${100 - Number(penaltyPercent)}% refund up to 24 hours prior.`,
          },
          imagePlaceholderColor: categoryColors[category] || "#2563eb",
        },
        currentUser
      );

      onTripCreated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: { label: string; value: TripCategory }[] = [
    { label: "Outing & Sightseeing", value: "OUTING" },
    { label: "Trekking & Trails", value: "TREKKING" },
    { label: "Pilgrimage & Spiritual", value: "PILGRIMAGE" },
    { label: "Camping & Bonfire", value: "CAMPING" },
    { label: "Adventure Sports", value: "ADVENTURE" },
    { label: "Wellness & Retreat", value: "WELLNESS" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Compass className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Host a Community Trip</DialogTitle>
              <DialogDescription className="text-xs">
                Step {step} of 4 &bull; Organize an unforgettable travel experience for your society neighbors
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Stepper Header */}
        <div className="grid grid-cols-4 gap-2 py-2 border-b">
          {[
            { num: 1, label: "Basics" },
            { num: 2, label: "Transport & Stay" },
            { num: 3, label: "Itinerary & Safety" },
            { num: 4, label: "Capacity & Policy" },
          ].map((s) => (
            <div
              key={s.num}
              className={`text-center pb-2 text-xs font-bold border-b-2 transition-all ${
                step === s.num
                  ? "border-indigo-600 text-indigo-700"
                  : step > s.num
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-400"
              }`}
            >
              Step {s.num}: {s.label}
            </div>
          ))}
        </div>

        {/* STEP 1: Basic Trip Details */}
        {step === 1 && (
          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Trip Title *</label>
              <Input
                placeholder="e.g. Ooty Tea Gardens & Peak Trek"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TripCategory)}
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Destination *</label>
                <Input
                  placeholder="e.g. Ooty & Coonoor, Tamil Nadu"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Trip Overview & Description</label>
              <Textarea
                placeholder="Describe what makes this trip special, expected weather, vibe, and highlights..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Departure Date *</label>
                <Input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Return Date *</label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Society Pickup Point</label>
                <Input
                  placeholder="e.g. Clubhouse Main Gate"
                  value={departurePoint}
                  onChange={(e) => setDeparturePoint(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Estimated Cost per Seat (₹) *</label>
                <Input
                  type="number"
                  placeholder="e.g. 4500"
                  value={pricePerPerson}
                  onChange={(e) => setPricePerPerson(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Transport & Stay */}
        {step === 2 && (
          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                <Bus className="w-4 h-4 text-blue-600" />
                Transport Logistics
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Transport Type</label>
                  <Input
                    placeholder="e.g. AC Volvo Bus / Force Urbania"
                    value={transportType}
                    onChange={(e) => setTransportType(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Vehicle Number (Optional)</label>
                  <Input
                    placeholder="e.g. KA 01 F 9823"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Driver / Fleet Lead Name</label>
                  <Input
                    placeholder="e.g. Ramesh Kumar"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Driver Phone Number</label>
                  <Input
                    placeholder="e.g. +91 98450 98765"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
              <h4 className="font-bold text-indigo-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Accommodation &amp; Rooms
              </h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Hotel / Resort / Homestay Name</label>
                  <Input
                    placeholder="e.g. Sterling Ooty Fern Hill Resort"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Address / Location</label>
                  <Input
                    placeholder="e.g. Fern Hill, Ooty Nilgiris"
                    value={hotelAddress}
                    onChange={(e) => setHotelAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Available Room Types (comma-separated)</label>
                  <Input
                    placeholder="e.g. Twin Sharing, Triple Sharing, Family Suite (4 Bed)"
                    value={roomTypes}
                    onChange={(e) => setRoomTypes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Detailed Itinerary & Safety */}
        {step === 3 && (
          <div className="space-y-4 py-2 text-xs">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-800">Day-by-Day Itinerary</h4>
              <Button size="sm" variant="outline" onClick={handleAddDay} className="text-xs gap-1">
                <Plus className="w-3.5 h-3.5" />
                Add Day
              </Button>
            </div>

            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {itineraryDays.map((day, idx) => (
                <div key={day.day} className="p-3 bg-slate-50 border rounded-xl space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-700">Day {day.day}</span>
                    {itineraryDays.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDay(idx)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="Day Title (e.g. Abbey Falls & Jeep Safari)"
                    value={day.title}
                    onChange={(e) => {
                      const updated = [...itineraryDays];
                      updated[idx].title = e.target.value;
                      setItineraryDays(updated);
                    }}
                  />
                  <Textarea
                    placeholder="List activities (e.g. 6 AM sunrise walk, breakfast, river rafting, return)"
                    rows={2}
                    value={day.activities}
                    onChange={(e) => {
                      const updated = [...itineraryDays];
                      updated[idx].activities = e.target.value;
                      setItineraryDays(updated);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-1">
                <label className="font-bold text-emerald-800">What's Included (comma-separated)</label>
                <Textarea
                  rows={2}
                  value={includes}
                  onChange={(e) => setIncludes(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-rose-800">What's Excluded (comma-separated)</label>
                <Textarea
                  rows={2}
                  value={excludes}
                  onChange={(e) => setExcludes(e.target.value)}
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <h5 className="font-bold text-amber-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-600" />
                Emergency Trip Marshal &amp; First Aid
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Marshal Name</label>
                  <Input
                    value={emergencyMarshalName}
                    onChange={(e) => setEmergencyMarshalName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Marshal Phone</label>
                  <Input
                    value={emergencyMarshalPhone}
                    onChange={(e) => setEmergencyMarshalPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Capacity & Refund Policy */}
        {step === 4 && (
          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Total Seat Capacity *</label>
                <Input
                  type="number"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Waitlist Capacity Limit</label>
                <Input
                  type="number"
                  value={maxWaitlist}
                  onChange={(e) => setMaxWaitlist(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border rounded-xl space-y-3">
              <h4 className="font-bold text-slate-900">Cancellation &amp; Refund Rules</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">100% Free Cancellation Window (Days before departure)</label>
                  <Input
                    type="number"
                    value={freeCancellationDays}
                    onChange={(e) => setFreeCancellationDays(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Penalty Percentage After Deadline (%)</label>
                  <Input
                    type="number"
                    value={penaltyPercent}
                    onChange={(e) => setPenaltyPercent(Number(e.target.value))}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                * Note: In case of cancellations, the next waitlisted passenger is automatically promoted to confirmed status.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Ready to Publish Community Trip!
              </div>
              <p className="text-emerald-700 text-xs">
                Your trip will be instantly published on the community explore board. You can manage passenger rosters and check-in attendees from your Host Hub.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between items-center pt-2 border-t">
          <div>
            {step > 1 && (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                &larr; Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {step < 4 ? (
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => setStep(step + 1)}>
                Continue &rarr;
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-1.5"
                onClick={handlePublishTrip}
                disabled={isSubmitting}
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? "Publishing..." : "Publish Trip"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
