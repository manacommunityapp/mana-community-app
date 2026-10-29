import { useState, useEffect } from "react";
import {
  Plus,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sun,
  Shield,
  X,
  Dumbbell
} from "lucide-react";
import { toast } from "sonner";
import { sportsVendorService } from "../../../../../services/sports/sportsVendorService";
import type {
  SportsFacility,
  SportsCourtConfig,
  SportType,
  CourtSurface,
} from "../../../../../types/sportsVendor";

const AVAILABLE_SPORTS: SportType[] = [
  "BADMINTON",
  "TENNIS",
  "CRICKET",
  "FOOTBALL",
  "BASKETBALL",
  "SWIMMING",
  "SQUASH",
  "TABLE_TENNIS",
  "PICKLEBALL",
  "VOLLEYBALL",
];

const AVAILABLE_SURFACES: CourtSurface[] = [
  "SYNTHETIC_MAT",
  "WOODEN",
  "CLAY",
  "GRASS_TURF",
  "ACRYLIC",
  "CONCRETE",
  "TILED",
  "SAND",
];

export function SportsVenueManager() {
  const [facilities, setFacilities] = useState<SportsFacility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<SportsFacility | null>(null);
  const [courts, setCourts] = useState<SportsCourtConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showCourtModal, setShowCourtModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState<SportsCourtConfig | null>(null);

  // Facility Form State
  const [facForm, setFacForm] = useState({
    name: "",
    description: "",
    address: "",
    area: "",
    city: "Bangalore",
    pinCode: "",
    openingTime: "06:00",
    closingTime: "23:00",
    amenities: "Lighting, Drinking Water, Parking, Locker Room",
    isFederated: true,
  });

  // Court Form State
  const [courtForm, setCourtForm] = useState<{
    name: string;
    sportType: SportType;
    surfaceType: CourtSurface;
    courtDimension: string;
    isIndoor: boolean;
    hasLighting: boolean;
    baseHourlyPrice: number;
    residentDiscountPercent: number;
    rules: string;
  }>({
    name: "",
    sportType: "BADMINTON",
    surfaceType: "SYNTHETIC_MAT",
    courtDimension: "44ft x 20ft",
    isIndoor: true,
    hasLighting: true,
    baseHourlyPrice: 500,
    residentDiscountPercent: 15,
    rules: "Non-marking shoes mandatory, Only water allowed inside",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const facs = await sportsVendorService.getFacilities();
      setFacilities(facs);
      if (facs.length > 0) {
        const current = selectedFacility ? facs.find((f) => f.id === selectedFacility.id) || facs[0] : facs[0];
        setSelectedFacility(current);
        const crts = await sportsVendorService.getCourts(current.id);
        setCourts(crts);
      }
    } catch (err) {
      toast.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectFacility(fac: SportsFacility) {
    setSelectedFacility(fac);
    try {
      const crts = await sportsVendorService.getCourts(fac.id);
      setCourts(crts);
    } catch (err) {
      toast.error("Failed to load courts for venue");
    }
  }

  async function handleSaveFacility(e: React.FormEvent) {
    e.preventDefault();
    if (!facForm.name || !facForm.area) {
      toast.error("Please fill in facility name and area");
      return;
    }

    try {
      const saved = await sportsVendorService.createFacility({
        name: facForm.name,
        description: facForm.description,
        address: facForm.address,
        area: facForm.area,
        city: facForm.city,
        pinCode: facForm.pinCode,
        openingTime: facForm.openingTime,
        closingTime: facForm.closingTime,
        amenities: facForm.amenities.split(",").map((s) => s.trim()),
        isFederated: facForm.isFederated,
      });
      toast.success("Facility created successfully!");
      setShowFacilityModal(false);
      await loadData();
      setSelectedFacility(saved);
    } catch (err) {
      toast.error("Failed to create facility");
    }
  }

  async function handleSaveCourt(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFacility) return;
    if (!courtForm.name) {
      toast.error("Please specify court name");
      return;
    }

    try {
      if (editingCourt) {
        await sportsVendorService.updateCourt(editingCourt.id, {
          name: courtForm.name,
          sportType: courtForm.sportType,
          surfaceType: courtForm.surfaceType,
          courtDimension: courtForm.courtDimension,
          isIndoor: courtForm.isIndoor,
          hasLighting: courtForm.hasLighting,
          baseHourlyPrice: Number(courtForm.baseHourlyPrice),
          residentDiscountPercent: Number(courtForm.residentDiscountPercent),
          rules: courtForm.rules.split(",").map((s) => s.trim()),
        });
        toast.success("Court configuration updated!");
      } else {
        await sportsVendorService.createCourt(selectedFacility.id, {
          name: courtForm.name,
          sportType: courtForm.sportType,
          surfaceType: courtForm.surfaceType,
          courtDimension: courtForm.courtDimension,
          isIndoor: courtForm.isIndoor,
          hasLighting: courtForm.hasLighting,
          baseHourlyPrice: Number(courtForm.baseHourlyPrice),
          residentDiscountPercent: Number(courtForm.residentDiscountPercent),
          rules: courtForm.rules.split(",").map((s) => s.trim()),
        });
        toast.success("New court added successfully!");
      }
      setShowCourtModal(false);
      setEditingCourt(null);
      const crts = await sportsVendorService.getCourts(selectedFacility.id);
      setCourts(crts);
    } catch (err) {
      toast.error("Failed to save court");
    }
  }

  async function toggleCourtMaintenance(court: SportsCourtConfig) {
    try {
      const updated = await sportsVendorService.updateCourt(court.id, {
        isMaintenance: !court.isMaintenance,
        maintenanceReason: !court.isMaintenance ? "Routine court re-finishing and maintenance" : undefined,
      });
      setCourts((prev) => prev.map((c) => (c.id === court.id ? updated : c)));
      toast.success(
        updated.isMaintenance
          ? "Court marked under maintenance (slots blocked)"
          : "Court reopened for resident booking"
      );
    } catch (err) {
      toast.error("Failed to update court status");
    }
  }

  function openEditCourt(court: SportsCourtConfig) {
    setEditingCourt(court);
    setCourtForm({
      name: court.name,
      sportType: court.sportType,
      surfaceType: court.surfaceType,
      courtDimension: court.courtDimension || "",
      isIndoor: court.isIndoor,
      hasLighting: court.hasLighting,
      baseHourlyPrice: court.baseHourlyPrice,
      residentDiscountPercent: court.residentDiscountPercent,
      rules: court.rules?.join(", ") || "",
    });
    setShowCourtModal(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Venues & Court Inventory</h1>
          <p className="text-xs text-slate-500">
            Configure sports facilities, court surfaces, lighting conditions, and pricing tiers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFacilityModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Facility
          </button>
        </div>
      </div>

      {/* Facilities Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {facilities.map((fac) => {
          const isSelected = selectedFacility?.id === fac.id;
          return (
            <button
              key={fac.id}
              onClick={() => handleSelectFacility(fac)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {fac.name}
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? "bg-emerald-700 text-emerald-100" : "bg-slate-100 text-slate-600"
                }`}
              >
                {fac.courtsCount}
              </span>
            </button>
          );
        })}
      </div>

      {selectedFacility && (
        <div className="space-y-6">
          {/* Facility Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex gap-4">
                <img
                  src={selectedFacility.images[0]}
                  alt={selectedFacility.name}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900">{selectedFacility.name}</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedFacility.status}
                    </span>
                    {selectedFacility.isFederated && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Community Federated
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 max-w-2xl">{selectedFacility.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedFacility.address}, {selectedFacility.area}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {selectedFacility.openingTime} - {selectedFacility.closingTime}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingCourt(null);
                  setCourtForm({
                    name: `Court ${courts.length + 1}`,
                    sportType: "BADMINTON",
                    surfaceType: "SYNTHETIC_MAT",
                    courtDimension: "44ft x 20ft",
                    isIndoor: true,
                    hasLighting: true,
                    baseHourlyPrice: 500,
                    residentDiscountPercent: 15,
                    rules: "Non-marking shoes mandatory",
                  });
                  setShowCourtModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add Court
              </button>
            </div>
          </div>

          {/* Courts Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Courts & Resource Units ({courts.length})
              </h3>
              <p className="text-xs text-slate-500">Each court acts as a bookable inventory slot</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courts.map((court) => (
                <div
                  key={court.id}
                  className={`bg-white rounded-2xl border p-5 transition-all shadow-xs ${
                    court.isMaintenance
                      ? "border-amber-300 bg-amber-50/20"
                      : "border-slate-200/80 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        {court.sportType}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{court.name}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditCourt(court)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit Court"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Surface:</span>
                      <span className="font-semibold text-slate-800">{court.surfaceType.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Environment:</span>
                      <span className="font-semibold text-slate-800">
                        {court.isIndoor ? "Indoor Court" : "Outdoor"} • {court.hasLighting ? "Floodlit" : "Natural"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Hourly Rate:</span>
                      <span className="font-bold text-slate-900">₹{court.baseHourlyPrice} / hr</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Resident Rate:</span>
                      <span className="font-bold text-emerald-600">
                        ₹{Math.round(court.baseHourlyPrice * (1 - court.residentDiscountPercent / 100))} / hr
                        <span className="text-[10px] font-normal ml-1">({court.residentDiscountPercent}% off)</span>
                      </span>
                    </div>
                  </div>

                  {court.isMaintenance && (
                    <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>{court.maintenanceReason || "Court currently under maintenance"}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => toggleCourtMaintenance(court)}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                        court.isMaintenance
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                      }`}
                    >
                      {court.isMaintenance ? "Reopen Court" : "Maintenance Block"}
                    </button>
                    <span className="text-[11px] font-medium text-slate-400">
                      ID: {court.id.replace("court-", "#")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Facility Creation Modal */}
      {showFacilityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Sports Facility</h3>
              <button onClick={() => setShowFacilityModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveFacility} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Facility Name</label>
                <input
                  type="text"
                  placeholder="e.g., SmashZone Badminton Arena - HSR"
                  value={facForm.name}
                  onChange={(e) => setFacForm({ ...facForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Area / Locality</label>
                  <input
                    type="text"
                    placeholder="e.g., HSR Layout Sector 2"
                    value={facForm.area}
                    onChange={(e) => setFacForm({ ...facForm, area: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={facForm.city}
                    onChange={(e) => setFacForm({ ...facForm, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Address</label>
                <input
                  type="text"
                  placeholder="Street address or landmark"
                  value={facForm.address}
                  onChange={(e) => setFacForm({ ...facForm, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Opening Time</label>
                  <input
                    type="time"
                    value={facForm.openingTime}
                    onChange={(e) => setFacForm({ ...facForm, openingTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Closing Time</label>
                  <input
                    type="time"
                    value={facForm.closingTime}
                    onChange={(e) => setFacForm({ ...facForm, closingTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={facForm.amenities}
                  onChange={(e) => setFacForm({ ...facForm, amenities: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFacilityModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Court Creation / Edit Modal */}
      {showCourtModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingCourt ? "Edit Court Configuration" : "Add New Court"}
              </h3>
              <button onClick={() => setShowCourtModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCourt} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Court Name / Identifier</label>
                <input
                  type="text"
                  placeholder="e.g., Court 1 (Teak Wood Flooring)"
                  value={courtForm.name}
                  onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sport Type</label>
                  <select
                    value={courtForm.sportType}
                    onChange={(e) => setCourtForm({ ...courtForm, sportType: e.target.value as SportType })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {AVAILABLE_SPORTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Court Surface</label>
                  <select
                    value={courtForm.surfaceType}
                    onChange={(e) => setCourtForm({ ...courtForm, surfaceType: e.target.value as CourtSurface })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {AVAILABLE_SURFACES.map((surf) => (
                      <option key={surf} value={surf}>
                        {surf.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Price / Hour (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={courtForm.baseHourlyPrice}
                    onChange={(e) => setCourtForm({ ...courtForm, baseHourlyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Resident Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={courtForm.residentDiscountPercent}
                    onChange={(e) => setCourtForm({ ...courtForm, residentDiscountPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={courtForm.isIndoor}
                    onChange={(e) => setCourtForm({ ...courtForm, isIndoor: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  Indoor Facility
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={courtForm.hasLighting}
                    onChange={(e) => setCourtForm({ ...courtForm, hasLighting: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  Floodlights Available
                </label>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Court Guidelines / Rules</label>
                <input
                  type="text"
                  placeholder="e.g. Non-marking shoes mandatory, towel required"
                  value={courtForm.rules}
                  onChange={(e) => setCourtForm({ ...courtForm, rules: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCourtModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                  {editingCourt ? "Update Court" : "Add Court"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
