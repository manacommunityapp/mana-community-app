import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, Clock, Users, Shield, AlertTriangle, RefreshCw,
  CheckCircle, XCircle, Timer, List, Plus, Zap
} from "lucide-react";
import * as amenityService from "../../../services/amenity/amenityBookingService";

type Tab = "booking" | "waitlist" | "admin";

export function AmenityBookingDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("booking");
  const communityId = 1;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "booking", label: "Book Facility", icon: <Calendar className="w-4 h-4" /> },
    { key: "waitlist", label: "My Waitlist", icon: <List className="w-4 h-4" /> },
    { key: "admin", label: "Manage Facilities", icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Amenity & Facility Booking</h1>
        <p className="text-gray-500 mt-1">Book courts, clubhouses, and community spaces</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "booking" && <BookingPanel communityId={communityId} />}
      {activeTab === "waitlist" && <WaitlistPanel />}
      {activeTab === "admin" && <AdminPanel communityId={communityId} />}
    </div>
  );
}

// ── Booking Panel ──

function BookingPanel({ communityId }: { communityId: number }) {
  const [facilities, setFacilities] = useState<amenityService.Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<amenityService.Facility | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<amenityService.FacilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    amenityService.getFacilities(communityId).then((r) => setFacilities(r.data)).catch(() => {});
  }, [communityId]);

  const loadSlots = useCallback(async () => {
    if (!selectedFacility) return;
    setLoading(true);
    try {
      const res = await amenityService.getSlots(selectedFacility.id, selectedDate);
      setSlots(res.data);
    } catch {
      console.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  }, [selectedFacility, selectedDate]);

  useEffect(() => { if (selectedFacility) loadSlots(); }, [loadSlots, selectedFacility]);

  const handleBook = async (slotId: number) => {
    setBookingMsg(null);
    try {
      const res = await amenityService.bookSlot(slotId, 1, "A-101");
      if (res.data.success) {
        setBookingMsg({ type: "success", text: `Booked! Ref: ${res.data.bookingReference}` });
      } else {
        setBookingMsg({ type: "error", text: res.data.message });
      }
      await loadSlots();
    } catch (err: any) {
      setBookingMsg({ type: "error", text: err?.response?.data?.message || "Booking failed" });
    }
  };

  const handleJoinWaitlist = async (slotId: number) => {
    try {
      const res = await amenityService.joinWaitlist(slotId, 1, "A-101");
      setBookingMsg({
        type: res.data.success ? "success" : "error",
        text: res.data.message,
      });
    } catch (err: any) {
      setBookingMsg({ type: "error", text: "Failed to join waitlist" });
    }
  };

  const handleCancel = async (slotId: number) => {
    try {
      const res = await amenityService.cancelBooking(slotId, 1);
      setBookingMsg({
        type: res.data.success ? "success" : "error",
        text: res.data.message,
      });
      await loadSlots();
    } catch {
      setBookingMsg({ type: "error", text: "Cancel failed" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Facility + Date selector */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Facility</label>
          <select
            value={selectedFacility?.id || ""}
            onChange={(e) => setSelectedFacility(facilities.find((f) => f.id === Number(e.target.value)) || null)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select a facility</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.name} ({f.facilityType})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={loadSlots} disabled={loading || !selectedFacility}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Facility info */}
      {selectedFacility && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><span className="text-gray-500">Slot Duration:</span> <strong>{selectedFacility.slotDurationMinutes}min</strong></div>
            <div><span className="text-gray-500">Hours:</span> <strong>{selectedFacility.openHour}:00–{selectedFacility.closeHour}:00</strong></div>
            <div><span className="text-gray-500">Peak Hours:</span> <strong className="text-orange-600">{selectedFacility.peakStartHour}:00–{selectedFacility.peakEndHour}:00</strong></div>
            <div><span className="text-gray-500">Rate:</span> <strong>₹{selectedFacility.hourlyRate}/hr</strong></div>
            <div><span className="text-gray-500">Max/Week:</span> <strong>{selectedFacility.maxBookingsPerFlatPerWeek} bookings</strong></div>
            <div><span className="text-gray-500">Peak Limit:</span> <strong>{selectedFacility.maxConcurrentPeakBookings} concurrent</strong></div>
            <div><span className="text-gray-500">Advance:</span> <strong>{selectedFacility.advanceBookingDays} days</strong></div>
            <div><span className="text-gray-500">Cancel By:</span> <strong>{selectedFacility.cancellationCutoffHours}h before</strong></div>
          </div>
        </div>
      )}

      {/* Booking message */}
      {bookingMsg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          bookingMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {bookingMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {bookingMsg.text}
        </div>
      )}

      {/* Slot grid */}
      {slots.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {slots.map((slot) => (
            <div key={slot.id} className={`border rounded-lg p-3 text-center ${
              slot.status === "AVAILABLE" ? "border-green-200 bg-green-50" :
              slot.status === "HELD" ? "border-amber-200 bg-amber-50" :
              "border-gray-200 bg-gray-50"
            }`}>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <Clock className="w-3 h-3" />
                {slot.startTime.substring(0, 5)}–{slot.endTime.substring(0, 5)}
              </div>
              {slot.isPeakHour && (
                <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                  <Zap className="w-3 h-3 inline" /> Peak
                </span>
              )}
              <div className="mt-2">
                {slot.status === "AVAILABLE" ? (
                  <button onClick={() => handleBook(slot.id)}
                    className="w-full text-xs px-2 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                    Book
                  </button>
                ) : slot.status === "BOOKED" && slot.bookedByResidentId === 1 ? (
                  <button onClick={() => handleCancel(slot.id)}
                    className="w-full text-xs px-2 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200">
                    Cancel
                  </button>
                ) : slot.status === "BOOKED" ? (
                  <button onClick={() => handleJoinWaitlist(slot.id)}
                    className="w-full text-xs px-2 py-1.5 bg-amber-100 text-amber-700 rounded hover:bg-amber-200">
                    <Users className="w-3 h-3 inline mr-1" />Waitlist
                  </button>
                ) : (
                  <span className="text-xs text-amber-600"><Timer className="w-3 h-3 inline" /> Held</span>
                )}
              </div>
              {slot.bookedByFlatNo && slot.status === "BOOKED" && (
                <div className="text-xs text-gray-400 mt-1">Flat {slot.bookedByFlatNo}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedFacility && slots.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          No slots generated for this date. Admin can generate slots.
        </div>
      )}
    </div>
  );
}

// ── Waitlist Panel ──

function WaitlistPanel() {
  const [entries, setEntries] = useState<amenityService.BookingWaitlistEntry[]>([]);

  useEffect(() => {
    amenityService.getMyWaitlistEntries(1).then((r) => setEntries(r.data)).catch(() => {});
  }, []);

  const handleAccept = async (slotId: number) => {
    try {
      await amenityService.acceptWaitlistOffer(slotId, 1);
      const res = await amenityService.getMyWaitlistEntries(1);
      setEntries(res.data);
    } catch {
      console.error("Accept failed");
    }
  };

  const handleCancel = async (slotId: number) => {
    try {
      await amenityService.cancelWaitlist(slotId, 1);
      const res = await amenityService.getMyWaitlistEntries(1);
      setEntries(res.data);
    } catch {
      console.error("Cancel failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">How Waitlist Promotion Works</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>1. Join:</strong> When a slot is booked, join the waitlist to get in line.</p>
          <p><strong>2. Offer:</strong> When the booker cancels, the first person in line gets a 15-minute offer.</p>
          <p><strong>3. Accept or Expire:</strong> Accept within 15 min to book, or it rolls to the next person.</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">You have no active waitlist entries.</div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer Expires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((e) => (
                <tr key={e.id} className={e.status === "OFFERED" ? "bg-amber-50" : ""}>
                  <td className="px-4 py-3 text-sm">Slot #{e.slotId}</td>
                  <td className="px-4 py-3 text-sm">#{e.position}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      e.status === "OFFERED" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {e.status === "OFFERED" ? <Timer className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {e.offerExpiresAt ? new Date(e.offerExpiresAt).toLocaleTimeString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    {e.status === "OFFERED" && (
                      <button onClick={() => handleAccept(e.slotId)}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                        Accept & Book
                      </button>
                    )}
                    <button onClick={() => handleCancel(e.slotId)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200">
                      Leave
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Admin Panel ──

function AdminPanel({ communityId }: { communityId: number }) {
  const [facilities, setFacilities] = useState<amenityService.Facility[]>([]);
  const [genFacilityId, setGenFacilityId] = useState<number | "">("");
  const [genDate, setGenDate] = useState(new Date().toISOString().split("T")[0]);
  const [genResult, setGenResult] = useState<string | null>(null);

  useEffect(() => {
    amenityService.getFacilities(communityId).then((r) => setFacilities(r.data)).catch(() => {});
  }, [communityId]);

  const handleGenerate = async () => {
    if (!genFacilityId) return;
    try {
      const res = await amenityService.generateSlots(Number(genFacilityId), genDate);
      setGenResult(`Generated ${res.data.length} slots for ${genDate}`);
    } catch {
      setGenResult("Failed to generate slots");
    }
  };

  const handleProcessExpired = async () => {
    try {
      const res = await amenityService.processExpiredOffers();
      setGenResult(`Processed expired offers. ${res.data.promotedCount} promoted.`);
    } catch {
      setGenResult("Failed to process expired offers");
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate slots */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Generate Slots</h3>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Facility</label>
            <select value={genFacilityId} onChange={(e) => setGenFacilityId(Number(e.target.value) || "")}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Select</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input type="date" value={genDate} onChange={(e) => setGenDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={handleGenerate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            <Plus className="w-4 h-4 inline mr-1" /> Generate
          </button>
        </div>
        {genResult && <p className="mt-2 text-sm text-gray-600">{genResult}</p>}
      </div>

      {/* Process expired */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Waitlist Maintenance</h3>
        <p className="text-sm text-gray-500 mb-3">Process expired 15-minute offers and promote next in line.</p>
        <button onClick={handleProcessExpired}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
          <RefreshCw className="w-4 h-4 inline mr-1" /> Process Expired Offers
        </button>
      </div>

      {/* Contention strategy */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Contention Handling Strategy</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Pessimistic Row Lock:</strong> SELECT … FOR UPDATE on the slot row guarantees only one transaction books it, even under 500 concurrent attempts. The database serializes access.</p>
          <p><strong>Fair-Usage Quota:</strong> Per-flat weekly booking count and peak-hour concurrency limits enforced atomically via pessimistic lock on the quota row. Multiple family members hitting the API simultaneously see a consistent counter.</p>
          <p><strong>Waitlist Promotion:</strong> Sequential offers with 15-minute payment windows. Expired offers auto-promote the next person. No slot sits idle while waitlisted residents exist.</p>
        </div>
      </div>

      {/* Facility table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max/Week</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peak Limit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {facilities.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-3 text-sm font-medium">{f.name}</td>
                <td className="px-4 py-3 text-sm">{f.facilityType}</td>
                <td className="px-4 py-3 text-sm">{f.openHour}:00–{f.closeHour}:00</td>
                <td className="px-4 py-3 text-sm">{f.slotDurationMinutes}min</td>
                <td className="px-4 py-3 text-sm">{f.maxBookingsPerFlatPerWeek}</td>
                <td className="px-4 py-3 text-sm">{f.maxConcurrentPeakBookings}</td>
                <td className="px-4 py-3 text-sm">₹{f.hourlyRate}</td>
              </tr>
            ))}
            {facilities.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No facilities configured</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
