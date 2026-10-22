import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Ambulance, MapPin, User, Phone, Clock, CheckCircle2, X } from "lucide-react";
import { healthGuardService } from "../../../services/healthguard/healthGuardService";

type BookingStatus = "REQUESTED" | "CONFIRMED" | "DISPATCHED" | "ARRIVED" | "COMPLETED" | "CANCELLED";

interface AmbulanceBookingData {
  id: number;
  bookingUuid: string;
  status: BookingStatus;
  pickupAddress: string;
  destinationAddress: string;
  patientName: string;
  patientPhone: string;
  emergencyDescription: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  estimatedArrivalMinutes: number;
  requestedAt: string;
  confirmedAt: string;
  dispatchedAt: string;
  arrivedAt: string;
  notes: string;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; step: number }> = {
  REQUESTED: { label: "Requested", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", step: 1 },
  CONFIRMED: { label: "Confirmed", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", step: 2 },
  DISPATCHED: { label: "On the Way", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", step: 3 },
  ARRIVED: { label: "Arrived", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", step: 4 },
  COMPLETED: { label: "Completed", color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300", step: 5 },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", step: 0 },
};

const STEPS = ["Requested", "Confirmed", "On the Way", "Arrived"];

export default function AmbulanceBookingScreen() {
  const [activeBooking, setActiveBooking] = useState<AmbulanceBookingData | null>(null);
  const [history, setHistory] = useState<AmbulanceBookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pickupAddress: "",
    destinationAddress: "",
    patientName: "",
    patientPhone: "",
    emergencyDescription: "",
  });

  const loadData = () => {
    Promise.all([
      healthGuardService.getActiveAmbulanceBooking().then(r => r.status !== 204 ? r.data : null).catch(() => null),
      healthGuardService.getAmbulanceHistory().then(r => r.data ?? []).catch(() => []),
    ]).then(([active, hist]) => {
      setActiveBooking(active);
      setHistory(hist.filter((b: AmbulanceBookingData) => b.status === "COMPLETED" || b.status === "CANCELLED"));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleBook = async () => {
    if (!form.pickupAddress.trim()) return;
    setBooking(true);
    try {
      const r = await healthGuardService.bookAmbulance(form);
      setActiveBooking(r.data);
      setShowForm(false);
      setForm({ pickupAddress: "", destinationAddress: "", patientName: "", patientPhone: "", emergencyDescription: "" });
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async () => {
    if (!activeBooking) return;
    try {
      await healthGuardService.cancelAmbulanceBooking(activeBooking.id);
      setHistory(h => [{ ...activeBooking, status: "CANCELLED" }, ...h]);
      setActiveBooking(null);
    } catch {/* ignore */}
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading ambulance services...</div>;
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
          <Ambulance className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Ambulance Booking</h1>
          <p className="text-sm text-muted-foreground">Book emergency medical transport</p>
        </div>
      </div>

      {activeBooking ? (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Ambulance className="w-5 h-5 text-red-500" />
                Active Booking
              </span>
              <Badge className={STATUS_CONFIG[activeBooking.status].color}>
                {STATUS_CONFIG[activeBooking.status].label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress steps */}
            {activeBooking.status !== "CANCELLED" && (
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {STEPS.map((step, i) => {
                  const stepNum = i + 1;
                  const current = STATUS_CONFIG[activeBooking.status].step;
                  const done = stepNum < current;
                  const active = stepNum === current;
                  return (
                    <React.Fragment key={step}>
                      <div className={`flex flex-col items-center min-w-[60px] ${active ? "text-red-500" : done ? "text-green-500" : "text-muted-foreground"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${active ? "border-red-500 bg-red-50 dark:bg-red-950" : done ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-muted"}`}>
                          {done ? "✓" : stepNum}
                        </div>
                        <span className="text-xs mt-1 text-center">{step}</span>
                      </div>
                      {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${stepNum < current ? "bg-green-400" : "bg-muted"}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            <div className="space-y-2 text-sm">
              {activeBooking.pickupAddress && (
                <div className="flex gap-2"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /><span>{activeBooking.pickupAddress}</span></div>
              )}
              {activeBooking.patientName && (
                <div className="flex gap-2"><User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /><span>{activeBooking.patientName}</span></div>
              )}
              {activeBooking.estimatedArrivalMinutes && (
                <div className="flex gap-2"><Clock className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" /><span className="text-orange-600 font-medium">ETA: {activeBooking.estimatedArrivalMinutes} min</span></div>
              )}
              {activeBooking.driverName && (
                <div className="flex gap-2"><User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /><span>Driver: {activeBooking.driverName} {activeBooking.vehicleNumber && `(${activeBooking.vehicleNumber})`}</span></div>
              )}
              {activeBooking.driverPhone && (
                <div className="flex gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <a href={`tel:${activeBooking.driverPhone}`} className="text-blue-500 hover:underline">{activeBooking.driverPhone}</a>
                </div>
              )}
            </div>

            {(activeBooking.status === "REQUESTED" || activeBooking.status === "CONFIRMED") && (
              <Button variant="destructive" size="sm" onClick={handleCancel} className="w-full">
                <X className="w-4 h-4 mr-1" /> Cancel Booking
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {showForm ? (
            <Card>
              <CardHeader>
                <CardTitle>Book Ambulance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Pickup Address *</label>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm bg-background resize-none"
                    rows={2}
                    placeholder="House/Flat No, Street, Area, City"
                    value={form.pickupAddress}
                    onChange={e => setForm(f => ({ ...f, pickupAddress: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Hospital / Destination</label>
                  <input
                    className="w-full border rounded-md p-2 text-sm bg-background"
                    placeholder="Nearest hospital or specific destination"
                    value={form.destinationAddress}
                    onChange={e => setForm(f => ({ ...f, destinationAddress: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Patient Name</label>
                  <input
                    className="w-full border rounded-md p-2 text-sm bg-background"
                    placeholder="Full name of patient"
                    value={form.patientName}
                    onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Patient Phone</label>
                  <input
                    type="tel"
                    className="w-full border rounded-md p-2 text-sm bg-background"
                    placeholder="+91 98765 43210"
                    value={form.patientPhone}
                    onChange={e => setForm(f => ({ ...f, patientPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Emergency Description</label>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm bg-background resize-none"
                    rows={2}
                    placeholder="Briefly describe the emergency"
                    value={form.emergencyDescription}
                    onChange={e => setForm(f => ({ ...f, emergencyDescription: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleBook} disabled={booking || !form.pickupAddress.trim()} className="flex-1 bg-red-600 hover:bg-red-700">
                    {booking ? "Booking..." : "Book Ambulance"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  For immediate help, call <a href="tel:108" className="text-red-500 font-medium">108</a> directly
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-4xl">🚑</div>
                  <p className="font-medium">No active ambulance booking</p>
                  <p className="text-sm text-muted-foreground">Book an ambulance for non-critical transport or when 108 is unavailable</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="w-full bg-red-600 hover:bg-red-700">
                  <Ambulance className="w-4 h-4 mr-2" /> Book Ambulance
                </Button>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">National Ambulance</p>
                    <a href="tel:108" className="text-lg font-bold text-red-500">108</a>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">National Emergency</p>
                    <a href="tel:112" className="text-lg font-bold text-red-500">112</a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Booking History</h2>
          <div className="space-y-3">
            {history.slice(0, 5).map(b => (
              <Card key={b.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        {b.status === "COMPLETED"
                          ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          : <X className="w-4 h-4 text-red-400 shrink-0" />}
                        <span className="font-medium">{b.pickupAddress || "Booking #" + b.id}</span>
                      </div>
                      {b.requestedAt && (
                        <p className="text-xs text-muted-foreground ml-6">
                          {new Date(b.requestedAt).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                    <Badge className={STATUS_CONFIG[b.status]?.color}>{STATUS_CONFIG[b.status]?.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
