import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Car, Plus, X, Loader2, Trash2, Edit3, ParkingCircle,
  Search, ChevronDown, MapPin, Layers, Tag, UserCheck, RotateCcw,
  Zap, ShieldAlert, ArrowLeftRight, Clock, AlertTriangle, CheckCircle2,
  Calendar, DollarSign, Store, Shield, Sparkles, Filter, ExternalLink,
  ChevronRight, Users, Check
} from "lucide-react";
import {
  parkingService,
  type ParkingSlotResponse,
  type ParkingSlotRequest,
  type ResidentVehicleResponse,
  type ResidentVehicleRequest,
  type ParkingMarketplaceListingDto,
  type ParkingMarketplaceBookingDto,
  type ParkingViolationReportDto,
  type ParkingSlotSwapRequestDto,
  type ParkingWaitlistEntryDto,
  type ViolationType,
  type MarketplacePricingType
} from "../../../services/parking/parkingService";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";

type TabKey = "slots" | "vehicles" | "marketplace" | "swaps" | "violations";

const slotTypeLabels: Record<string, string> = {
  COVERED: "Covered",
  OPEN: "Open",
  BASEMENT: "Basement",
  STILT: "Stilt",
  RESERVED: "Reserved",
};

const slotStatusColors: Record<string, { label: string; bg: string; text: string }> = {
  AVAILABLE: { label: "Available", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  OCCUPIED: { label: "Occupied", bg: "bg-red-50 border-red-200", text: "text-red-700" },
  RESERVED: { label: "Reserved", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  MAINTENANCE: { label: "Maintenance", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
};

const vehicleTypeLabels: Record<string, string> = {
  CAR: "Car",
  BIKE: "Bike",
  SCOOTER: "Scooter",
  EV: "EV",
  SUV: "SUV",
  OTHER: "Other",
};

const vehicleStatusColors: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "Active", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  INACTIVE: { label: "Inactive", bg: "bg-slate-50 border-slate-200", text: "text-slate-500" },
  SOLD: { label: "Sold", bg: "bg-red-50 border-red-200", text: "text-red-700" },
};

export function ParkingManagement() {
  const [tab, setTab] = useState<TabKey>("slots");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Core Datasets
  const [slots, setSlots] = useState<ParkingSlotResponse[]>([]);
  const [vehicles, setVehicles] = useState<ResidentVehicleResponse[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<ParkingMarketplaceListingDto[]>([]);
  const [myBookings, setMyBookings] = useState<ParkingMarketplaceBookingDto[]>([]);
  const [swaps, setSwaps] = useState<ParkingSlotSwapRequestDto[]>([]);
  const [waitlist, setWaitlist] = useState<ParkingWaitlistEntryDto[]>([]);
  const [violations, setViolations] = useState<ParkingViolationReportDto[]>([]);

  // Sub-filters
  const [vehicleView, setVehicleView] = useState<"all" | "mine">("all");
  const [marketplaceView, setMarketplaceView] = useState<"browse" | "bookings">("browse");

  // Modals
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ParkingSlotResponse | null>(null);
  const [slotForm, setSlotForm] = useState<ParkingSlotRequest>({ slotNumber: "" });

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<ResidentVehicleResponse | null>(null);
  const [vehicleForm, setVehicleForm] = useState<ResidentVehicleRequest>({ numberPlate: "" });

  // Marketplace Modals
  const [showListModal, setShowListModal] = useState(false);
  const [listForm, setListForm] = useState({
    spotNumber: "B1-P12",
    level: "Basement 1",
    spotType: "CAR" as "CAR" | "BIKE" | "EV",
    hasEVCharger: false,
    startDate: "2026-10-15",
    endDate: "2026-10-25",
    pricingType: "DAILY_RATE" as MarketplacePricingType,
    rateINR: 80,
    notes: "",
  });

  const [bookingModalListing, setBookingModalListing] = useState<ParkingMarketplaceListingDto | null>(null);
  const [bookingForm, setBookingForm] = useState({
    vehicleNumber: "KA-01-AB-1234",
    startDate: "2026-10-15",
    endDate: "2026-10-20",
  });

  // Swap & Waitlist Modals
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapForm, setSwapForm] = useState({
    targetSpotNumber: "B1-P05",
    targetLevel: "Basement 1",
    targetOwnerFlat: "Tower A1 - 102",
    reason: "Need slot closer to elevator for elder family member.",
  });

  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistLevel, setWaitlistLevel] = useState("Basement 1");

  // Violation Modal
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationForm, setViolationForm] = useState({
    spotNumber: "B1-P12",
    level: "Basement 1",
    offendingVehicleNumber: "",
    violationType: "WRONG_SLOT" as ViolationType,
    remarks: "",
  });

  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        slotsData,
        vehiclesData,
        mktListings,
        mktBookings,
        swapsData,
        waitlistData,
        violationsData
      ] = await Promise.all([
        parkingService.getSlots().catch(() => []),
        parkingService.getVehicles().catch(() => []),
        parkingService.getMarketplaceListings().catch(() => []),
        parkingService.getMyMarketplaceBookings().catch(() => []),
        parkingService.getSwapRequests().catch(() => []),
        parkingService.getWaitlist().catch(() => []),
        parkingService.getViolations().catch(() => []),
      ]);
      setSlots(slotsData);
      setVehicles(vehiclesData);
      setMarketplaceListings(mktListings);
      setMyBookings(mktBookings);
      setSwaps(swapsData);
      setWaitlist(waitlistData);
      setViolations(violationsData);
    } catch {
      setError("Failed to load parking management data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Slot Handlers
  const openSlotModal = (slot?: ParkingSlotResponse) => {
    if (slot) {
      setEditingSlot(slot);
      setSlotForm({
        slotNumber: slot.slotNumber,
        zone: slot.zone || "",
        floor: slot.floor || "",
        slotType: slot.slotType || "COVERED",
        notes: slot.notes || "",
      });
    } else {
      setEditingSlot(null);
      setSlotForm({ slotNumber: "", zone: "", floor: "", slotType: "COVERED", notes: "" });
    }
    setShowSlotModal(true);
  };

  const saveSlot = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editingSlot) {
        await parkingService.updateSlot(editingSlot.id, slotForm);
      } else {
        await parkingService.createSlot(slotForm);
      }
      setShowSlotModal(false);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save slot");
    } finally {
      setSaving(false);
    }
  };

  const deleteSlot = async (id: number) => {
    if (!confirm("Delete this parking slot?")) return;
    try {
      await parkingService.deleteSlot(id);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to delete slot");
    }
  };

  // Vehicle Handlers
  const openVehicleModal = (vehicle?: ResidentVehicleResponse) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setVehicleForm({
        vehicleType: vehicle.vehicleType || "CAR",
        make: vehicle.make || "",
        model: vehicle.model || "",
        color: vehicle.color || "",
        numberPlate: vehicle.numberPlate,
        parkingSlotId: vehicle.parkingSlotId,
        stickerNumber: vehicle.stickerNumber || "",
        primary: vehicle.primary,
      });
    } else {
      setEditingVehicle(null);
      setVehicleForm({
        vehicleType: "CAR",
        make: "",
        model: "",
        color: "",
        numberPlate: "",
        parkingSlotId: null,
        stickerNumber: "",
        primary: false,
      });
    }
    setShowVehicleModal(true);
  };

  const saveVehicle = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editingVehicle) {
        await parkingService.updateVehicle(editingVehicle.id, vehicleForm);
      } else {
        await parkingService.registerVehicle(vehicleForm);
      }
      setShowVehicleModal(false);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  const deleteVehicle = async (id: number) => {
    if (!confirm("Delete this vehicle registration?")) return;
    try {
      await parkingService.deleteVehicle(id);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to delete vehicle");
    }
  };

  // Marketplace Handlers
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await parkingService.createMarketplaceListing({
        spotNumber: listForm.spotNumber,
        level: listForm.level,
        spotType: listForm.spotType,
        hasEVCharger: listForm.hasEVCharger,
        startDate: listForm.startDate,
        endDate: listForm.endDate,
        pricingType: listForm.pricingType,
        rateINR: Number(listForm.rateINR),
        notes: listForm.notes,
      });
      setShowListModal(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to create marketplace listing");
    } finally {
      setSaving(false);
    }
  };

  const handleBookListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalListing) return;
    setSaving(true);
    try {
      await parkingService.bookMarketplaceSlot({
        listingId: bookingModalListing.id,
        vehicleNumber: bookingForm.vehicleNumber,
        startDate: bookingForm.startDate,
        endDate: bookingForm.endDate,
      });
      setBookingModalListing(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to complete slot booking");
    } finally {
      setSaving(false);
    }
  };

  // Swap Handlers
  const handleCreateSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await parkingService.createSwapRequest(swapForm);
      setShowSwapModal(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to submit swap request");
    } finally {
      setSaving(false);
    }
  };

  const handleJoinWaitlist = async () => {
    setSaving(true);
    try {
      await parkingService.joinWaitlist(waitlistLevel);
      setShowWaitlistModal(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to join parking waitlist");
    } finally {
      setSaving(false);
    }
  };

  // Violation Handlers
  const handleReportViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationForm.offendingVehicleNumber) return;
    setSaving(true);
    try {
      await parkingService.reportViolation(violationForm);
      setShowViolationModal(false);
      setViolationForm({ spotNumber: "B1-P12", level: "Basement 1", offendingVehicleNumber: "", violationType: "WRONG_SLOT", remarks: "" });
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to record violation");
    } finally {
      setSaving(false);
    }
  };

  // Filtering
  const filteredSlots = useMemo(() => {
    return slots.filter(
      (s) =>
        !search ||
        s.slotNumber.toLowerCase().includes(search.toLowerCase()) ||
        (s.zone || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.assignedToName || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.vehicleNumberPlate || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [slots, search]);

  const filteredVehicles = useMemo(() => {
    const list = vehicleView === "mine" ? vehicles.filter((v) => v.ownerName === "You") : vehicles;
    return list.filter(
      (v) =>
        !search ||
        v.numberPlate.toLowerCase().includes(search.toLowerCase()) ||
        v.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        (v.make || "").toLowerCase().includes(search.toLowerCase()) ||
        (v.model || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [vehicles, vehicleView, search]);

  const availableSlots = slots.filter((s) => s.status === "AVAILABLE");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D09C]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-900">
      {/* ── Top Header / Hero ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <ParkingCircle className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Smart Parking OS
                <Badge className="bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] text-xs">
                  ANPR & EV Integrated
                </Badge>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {slots.length} total slots · {availableSlots.length} available · {vehicles.length} resident vehicles · ANPR Gate Barrier live
              </p>
            </div>
          </div>
        </div>

        {/* Quick System Links */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/parking/anpr"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <Shield className="w-4 h-4 text-emerald-600" />
            ANPR Gate Live
          </a>
          <a
            href="/parking/ev-charging"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            EV Charging Hub
          </a>
          {tab === "slots" && (
            <Button
              onClick={() => openSlotModal()}
              className="bg-[#00D09C] hover:bg-[#008767] text-white font-semibold text-xs h-9 shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Slot
            </Button>
          )}
          {tab === "vehicles" && (
            <Button
              onClick={() => openVehicleModal()}
              className="bg-[#00D09C] hover:bg-[#008767] text-white font-semibold text-xs h-9 shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1" /> Register Vehicle
            </Button>
          )}
          {tab === "marketplace" && (
            <Button
              onClick={() => setShowListModal(true)}
              className="bg-[#00D09C] hover:bg-[#008767] text-white font-semibold text-xs h-9 shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1" /> List My Spot
            </Button>
          )}
          {tab === "swaps" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowWaitlistModal(true)}
                className="border-slate-200 text-xs h-9"
              >
                Join Waitlist
              </Button>
              <Button
                onClick={() => setShowSwapModal(true)}
                className="bg-[#00D09C] hover:bg-[#008767] text-white font-semibold text-xs h-9"
              >
                <ArrowLeftRight className="w-4 h-4 mr-1" /> Propose Swap
              </Button>
            </div>
          )}
          {tab === "violations" && (
            <Button
              onClick={() => setShowViolationModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-9 shadow-xs"
            >
              <ShieldAlert className="w-4 h-4 mr-1" /> Report Violation
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Tabs Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: "slots", label: "Parking Slots", icon: ParkingCircle, count: slots.length },
          { key: "vehicles", label: "Resident Vehicles", icon: Car, count: vehicles.length },
          { key: "marketplace", label: "Spot Marketplace", icon: Store, count: marketplaceListings.length },
          { key: "swaps", label: "Swaps & Waitlist", icon: ArrowLeftRight, count: swaps.length + waitlist.length },
          { key: "violations", label: "Violations Desk", icon: ShieldAlert, count: violations.length },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { setTab(item.key as TabKey); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-[#008767] text-white" : "bg-slate-100 text-slate-600"}`}>
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── TAB: SLOTS ── */}
      {tab === "slots" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search slots by slot number, basement level, zone, assigned resident, or plate..."
              className="pl-10 text-xs sm:text-sm bg-white border-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSlots.map((slot) => {
              const statusCfg = slotStatusColors[slot.status] || slotStatusColors.AVAILABLE;
              return (
                <div key={slot.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xl font-black text-slate-900 tracking-tight">
                          {slot.slotNumber}
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {slot.floor || "Basement 1"} · {slot.zone || "Zone A"} · {slotTypeLabels[slot.slotType] || slot.slotType}
                        </div>
                      </div>
                      <Badge className={`text-[10px] font-semibold border ${statusCfg.bg} ${statusCfg.text}`}>
                        {statusCfg.label}
                      </Badge>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Allotted To:</span>
                        <span className="font-semibold text-slate-800">{slot.assignedToName || "Unassigned"}</span>
                      </div>
                      {slot.vehicleNumberPlate && (
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Vehicle:</span>
                          <span className="font-mono font-semibold text-slate-800">{slot.vehicleNumberPlate}</span>
                        </div>
                      )}
                      {slot.notes && (
                        <p className="text-[11px] text-slate-400 italic pt-1">{slot.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openSlotModal(slot)} className="text-xs h-7 text-slate-600">
                      <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteSlot(slot.id)} className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: VEHICLES ── */}
      {tab === "vehicles" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vehicles by number plate, owner name, make..."
                className="pl-10 text-xs sm:text-sm bg-white border-slate-200"
              />
            </div>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold w-full sm:w-auto">
              <button
                onClick={() => setVehicleView("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${vehicleView === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"}`}
              >
                All Community ({vehicles.length})
              </button>
              <button
                onClick={() => setVehicleView("mine")}
                className={`px-3 py-1.5 rounded-lg transition-all ${vehicleView === "mine" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"}`}
              >
                My Vehicles
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((v) => {
              const statusCfg = vehicleStatusColors[v.status] || vehicleStatusColors.ACTIVE;
              return (
                <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-base font-black text-slate-900 tracking-tight font-mono">
                            {v.numberPlate}
                          </div>
                          <div className="text-xs text-slate-500">
                            {v.make} {v.model} · {v.color}
                          </div>
                        </div>
                      </div>
                      <Badge className={`text-[10px] font-semibold border ${statusCfg.bg} ${statusCfg.text}`}>
                        {statusCfg.label}
                      </Badge>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Owner:</span>
                        <span className="font-semibold text-slate-800">{v.ownerName}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Assigned Slot:</span>
                        <span className="font-semibold text-blue-600">{v.parkingSlotNumber || "None"}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Security RFID Sticker:</span>
                        <span className="font-mono text-slate-700">{v.stickerNumber || "Pending"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openVehicleModal(v)} className="text-xs h-7 text-slate-600">
                      <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteVehicle(v.id)} className="text-xs h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: MARKETPLACE ── */}
      {tab === "marketplace" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Resident Parking Spot Marketplace</h2>
              <p className="text-xs text-slate-500">
                Lend or rent your assigned parking spot to neighbors while traveling. Instant ANPR barrier whitelisting.
              </p>
            </div>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setMarketplaceView("browse")}
                className={`px-3 py-1.5 rounded-lg transition-all ${marketplaceView === "browse" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600"}`}
              >
                Available Spots ({marketplaceListings.length})
              </button>
              <button
                onClick={() => setMarketplaceView("bookings")}
                className={`px-3 py-1.5 rounded-lg transition-all ${marketplaceView === "bookings" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"}`}
              >
                My Bookings ({myBookings.length})
              </button>
            </div>
          </div>

          {marketplaceView === "browse" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketplaceListings.map((mkt) => (
                <div key={mkt.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-lg font-black text-slate-900 tracking-tight">
                          Spot {mkt.spotNumber}
                        </span>
                        <p className="text-xs text-slate-500">{mkt.level} · {mkt.spotType}</p>
                      </div>
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                        {mkt.pricingType === "FREE_GOOD_NEIGHBOR" ? "Free Neighbor Lend" : `₹${mkt.rateINR}/day`}
                      </Badge>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Host:</span>
                        <span className="font-semibold text-slate-800">{mkt.ownerName} ({mkt.ownerFlat})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Available Window:</span>
                        <span className="font-semibold text-emerald-700">{mkt.startDate} to {mkt.endDate}</span>
                      </div>
                      {mkt.hasEVCharger && (
                        <div className="flex items-center gap-1 text-amber-700 font-semibold pt-1">
                          <Zap className="w-3.5 h-3.5" /> EV Charging Point Available
                        </div>
                      )}
                      {mkt.notes && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg mt-2 italic">
                          "{mkt.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Zero Commission</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        setBookingModalListing(mkt);
                        setBookingForm({ vehicleNumber: "KA-01-AB-1234", startDate: mkt.startDate, endDate: mkt.endDate });
                      }}
                      className="bg-[#00D09C] hover:bg-[#008767] text-white text-xs font-semibold h-8"
                    >
                      Book This Spot
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map((b) => (
                <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Spot {b.spotNumber} ({b.level}) · Pass: <span className="font-mono text-indigo-700">{b.bookingCode}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.startDate} to {b.endDate} ({b.totalDays} days) · Vehicle: <span className="font-mono font-semibold">{b.vehicleNumber}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">₹{b.totalAmountINR}</p>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                        ANPR Auto-Whitelisted
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: SWAPS & WAITLIST ── */}
      {tab === "swaps" && (
        <div className="space-y-6">
          {/* Peer Swaps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Peer-to-Peer Parking Spot Swap Proposals</h3>
                <p className="text-xs text-slate-500">Request to permanently or temporarily trade parking slots with a neighbor.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {swaps.map((s) => (
                <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Proposal from {s.requesterName}
                    </span>
                    <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]">
                      {s.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">THEIR SPOT</span>
                      <span className="font-bold text-slate-900">{s.currentSpotNumber} ({s.currentLevel})</span>
                    </div>
                    <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">TARGET SPOT</span>
                      <span className="font-bold text-indigo-700">{s.targetSpotNumber} ({s.targetLevel})</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{s.reason}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Allocation Waitlist */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Society Parking Allocation Waitlist</h3>
            <p className="text-xs text-slate-500 mb-4">Official transparent queue for additional 2nd vehicle slot allotments.</p>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Queue Position</th>
                    <th className="px-4 py-3">Resident</th>
                    <th className="px-4 py-3">Preferred Level</th>
                    <th className="px-4 py-3">Request Date</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitlist.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-bold text-slate-900">#{w.queuePosition}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{w.residentName}</td>
                      <td className="px-4 py-3 text-slate-600">{w.preferredLevel}</td>
                      <td className="px-4 py-3 text-slate-500">{w.requestDate}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                          {w.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: VIOLATIONS DESK ── */}
      {tab === "violations" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Parking Infractions & Violations Desk</h2>
            <p className="text-xs text-slate-500">
              Report vehicles parked in wrong deeded spots, blocking basement driveways, or obstructing EV chargers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {violations.map((viol) => (
              <div key={viol.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-base font-black text-rose-700 font-mono tracking-tight">
                        {viol.offendingVehicleNumber}
                      </span>
                      <p className="text-xs text-slate-500">{viol.spotNumber} ({viol.level})</p>
                    </div>
                    <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-xs">
                      {viol.status}
                    </Badge>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Violation:</span>
                      <span className="font-semibold text-slate-800">{viol.violationType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reported By:</span>
                      <span className="text-slate-700">{viol.reporterFlat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Time:</span>
                      <span className="text-slate-500">{viol.timestamp}</span>
                    </div>
                    {viol.fineAmountINR && (
                      <div className="flex justify-between text-rose-700 font-semibold pt-1">
                        <span>Fine Imposed:</span>
                        <span>₹{viol.fineAmountINR}</span>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg mt-2">
                      "{viol.remarks}"
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Guard Desk Notified</span>
                  <Badge className="bg-slate-100 text-slate-700 text-[10px]">
                    Inspection In-Progress
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Modal: Add/Edit Slot */}
      <Dialog open={showSlotModal} onOpenChange={setShowSlotModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Parking Slot" : "Add Parking Slot"}</DialogTitle>
            <DialogDescription>Configure slot number, zone, and parking type.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Slot Number *</label>
              <Input
                value={slotForm.slotNumber}
                onChange={(e) => setSlotForm({ ...slotForm, slotNumber: e.target.value })}
                placeholder="e.g. B1-P12, B2-P44"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Level / Floor</label>
                <Input
                  value={slotForm.floor || ""}
                  onChange={(e) => setSlotForm({ ...slotForm, floor: e.target.value })}
                  placeholder="Basement 1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Zone</label>
                <Input
                  value={slotForm.zone || ""}
                  onChange={(e) => setSlotForm({ ...slotForm, zone: e.target.value })}
                  placeholder="Zone A"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Slot Type</label>
              <select
                value={slotForm.slotType || "COVERED"}
                onChange={(e) => setSlotForm({ ...slotForm, slotType: e.target.value })}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
              >
                <option value="COVERED">Covered</option>
                <option value="OPEN">Open</option>
                <option value="BASEMENT">Basement</option>
                <option value="STILT">Stilt</option>
                <option value="RESERVED">Reserved</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSlotModal(false)}>Cancel</Button>
              <Button onClick={saveSlot} disabled={saving} className="bg-[#00D09C] hover:bg-[#008767] text-white">
                {saving ? "Saving..." : "Save Slot"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Add/Edit Vehicle */}
      <Dialog open={showVehicleModal} onOpenChange={setShowVehicleModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Update Vehicle" : "Register Vehicle"}</DialogTitle>
            <DialogDescription>Add vehicle details for gate ANPR automation and security tags.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">License Plate *</label>
              <Input
                value={vehicleForm.numberPlate}
                onChange={(e) => setVehicleForm({ ...vehicleForm, numberPlate: e.target.value.toUpperCase() })}
                placeholder="e.g. KA-01-AB-1234"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Make / Brand</label>
                <Input
                  value={vehicleForm.make || ""}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                  placeholder="Hyundai"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Model</label>
                <Input
                  value={vehicleForm.model || ""}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  placeholder="Creta"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Vehicle Type</label>
                <select
                  value={vehicleForm.vehicleType || "CAR"}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="CAR">Car</option>
                  <option value="BIKE">Bike</option>
                  <option value="SCOOTER">Scooter</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                  <option value="SUV">SUV</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Color</label>
                <Input
                  value={vehicleForm.color || ""}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                  placeholder="White"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVehicleModal(false)}>Cancel</Button>
              <Button onClick={saveVehicle} disabled={saving} className="bg-[#00D09C] hover:bg-[#008767] text-white">
                {saving ? "Saving..." : "Save Vehicle"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: List Spot in Marketplace */}
      <Dialog open={showListModal} onOpenChange={setShowListModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>List Spot for Rent / Lend</DialogTitle>
            <DialogDescription>Share your empty spot with community members while you're away.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateListing} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Spot Number</label>
                <Input
                  value={listForm.spotNumber}
                  onChange={(e) => setListForm({ ...listForm, spotNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Level</label>
                <Input
                  value={listForm.level}
                  onChange={(e) => setListForm({ ...listForm, level: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Start Date</label>
                <Input
                  type="date"
                  value={listForm.startDate}
                  onChange={(e) => setListForm({ ...listForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">End Date</label>
                <Input
                  type="date"
                  value={listForm.endDate}
                  onChange={(e) => setListForm({ ...listForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Pricing Model</label>
                <select
                  value={listForm.pricingType}
                  onChange={(e) => setListForm({ ...listForm, pricingType: e.target.value as MarketplacePricingType })}
                  className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="DAILY_RATE">Daily Rate (INR)</option>
                  <option value="FREE_GOOD_NEIGHBOR">Free Neighbor Lend</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Rate (₹/day)</label>
                <Input
                  type="number"
                  value={listForm.rateINR}
                  disabled={listForm.pricingType === "FREE_GOOD_NEIGHBOR"}
                  onChange={(e) => setListForm({ ...listForm, rateINR: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Notes / Directions</label>
              <Input
                placeholder="e.g. Near Lift A, Pillar 12"
                value={listForm.notes}
                onChange={(e) => setListForm({ ...listForm, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowListModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Publish Listing
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Book Spot */}
      <Dialog open={!!bookingModalListing} onOpenChange={(open) => !open && setBookingModalListing(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Book Spot {bookingModalListing?.spotNumber}</DialogTitle>
            <DialogDescription>Whitelists your vehicle plate with security barrier for this duration.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookListing} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Vehicle Number Plate</label>
              <Input
                value={bookingForm.vehicleNumber}
                onChange={(e) => setBookingForm({ ...bookingForm, vehicleNumber: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Start Date</label>
                <Input
                  type="date"
                  value={bookingForm.startDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">End Date</label>
                <Input
                  type="date"
                  value={bookingForm.endDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBookingModalListing(null)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Confirm & Whitelist
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Propose Swap */}
      <Dialog open={showSwapModal} onOpenChange={setShowSwapModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Propose Parking Spot Swap</DialogTitle>
            <DialogDescription>Send a slot exchange request to a neighbor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSwap} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Desired Spot Number</label>
                <Input
                  value={swapForm.targetSpotNumber}
                  onChange={(e) => setSwapForm({ ...swapForm, targetSpotNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Desired Level</label>
                <Input
                  value={swapForm.targetLevel}
                  onChange={(e) => setSwapForm({ ...swapForm, targetLevel: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Neighbor Flat / Tower</label>
              <Input
                value={swapForm.targetOwnerFlat}
                onChange={(e) => setSwapForm({ ...swapForm, targetOwnerFlat: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Reason for Request</label>
              <Input
                value={swapForm.reason}
                onChange={(e) => setSwapForm({ ...swapForm, reason: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSwapModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Send Swap Proposal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Waitlist */}
      <Dialog open={showWaitlistModal} onOpenChange={setShowWaitlistModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Join Slot Allotment Waitlist</DialogTitle>
            <DialogDescription>Queue up for an additional parking slot allocation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Preferred Level</label>
              <select
                value={waitlistLevel}
                onChange={(e) => setWaitlistLevel(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
              >
                <option value="Basement 1">Basement 1</option>
                <option value="Basement 2">Basement 2</option>
                <option value="Open Ground">Open Ground</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWaitlistModal(false)}>Cancel</Button>
              <Button onClick={handleJoinWaitlist} disabled={saving} className="bg-[#00D09C] hover:bg-[#008767] text-white">
                Join Queue
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Report Violation */}
      <Dialog open={showViolationModal} onOpenChange={setShowViolationModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Report Parking Violation</DialogTitle>
            <DialogDescription>Notify security desk of unauthorized or obstructed parking.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReportViolation} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Offending Vehicle License Plate *</label>
              <Input
                value={violationForm.offendingVehicleNumber}
                onChange={(e) => setViolationForm({ ...violationForm, offendingVehicleNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. KA-04-XX-4321"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Infraction Spot</label>
                <Input
                  value={violationForm.spotNumber}
                  onChange={(e) => setViolationForm({ ...violationForm, spotNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Level</label>
                <Input
                  value={violationForm.level}
                  onChange={(e) => setViolationForm({ ...violationForm, level: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Violation Type</label>
              <select
                value={violationForm.violationType}
                onChange={(e) => setViolationForm({ ...violationForm, violationType: e.target.value as ViolationType })}
                className="w-full text-xs sm:text-sm border border-slate-200 rounded-lg p-2 bg-white"
              >
                <option value="WRONG_SLOT">Wrong Slot Parking</option>
                <option value="BLOCKING_DRIVEWAY">Blocking Driveway / Lane</option>
                <option value="NON_EV_ON_CHARGER">Non-EV parked at EV Charger</option>
                <option value="NO_STICKER">No Resident Sticker / Unauthorized Entry</option>
                <option value="SPEEDING_IN_BASEMENT">Speeding in Basement</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Remarks / Description</label>
              <Input
                value={violationForm.remarks}
                onChange={(e) => setViolationForm({ ...violationForm, remarks: e.target.value })}
                placeholder="e.g. Parked in my deeded spot without permission"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowViolationModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-rose-600 hover:bg-rose-700 text-white">
                Submit Report to Guard Desk
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ParkingManagement;
