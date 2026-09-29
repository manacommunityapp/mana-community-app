import {
  Car, Plus, X, Loader2, Trash2, Edit3, ParkingCircle,
  Search, ChevronDown, MapPin, Layers, Tag, UserCheck, RotateCcw
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  parkingService,
  type ParkingSlotResponse,
  type ParkingSlotRequest,
  type ResidentVehicleResponse,
  type ResidentVehicleRequest,
} from "../../../services/parking/parkingService";

type TabKey = "slots" | "vehicles" | "my-vehicles";

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
  const [slots, setSlots] = useState<ParkingSlotResponse[]>([]);
  const [vehicles, setVehicles] = useState<ResidentVehicleResponse[]>([]);
  const [myVehicles, setMyVehicles] = useState<ResidentVehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ParkingSlotResponse | null>(null);
  const [slotForm, setSlotForm] = useState<ParkingSlotRequest>({ slotNumber: "" });

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<ResidentVehicleResponse | null>(null);
  const [vehicleForm, setVehicleForm] = useState<ResidentVehicleRequest>({ numberPlate: "" });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsData, vehiclesData, myData] = await Promise.all([
        parkingService.getSlots().catch(() => []),
        parkingService.getVehicles().catch(() => []),
        parkingService.getMyVehicles().catch(() => []),
      ]);
      setSlots(slotsData);
      setVehicles(vehiclesData);
      setMyVehicles(myData);
    } catch {
      setError("Failed to load parking data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

  const releaseSlot = async (id: number) => {
    try {
      await parkingService.releaseSlot(id);
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to release slot");
    }
  };

  const openVehicleModal = (vehicle?: ResidentVehicleResponse) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setVehicleForm({
        vehicleType: vehicle.vehicleType,
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
      setVehicleForm({ numberPlate: "", vehicleType: "CAR", make: "", model: "", color: "", primary: false });
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

  const filteredSlots = slots.filter((s) =>
    !search || s.slotNumber.toLowerCase().includes(search.toLowerCase()) ||
    (s.zone || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.assignedToName || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.vehicleNumberPlate || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredVehicles = (tab === "my-vehicles" ? myVehicles : vehicles).filter((v) =>
    !search || v.numberPlate.toLowerCase().includes(search.toLowerCase()) ||
    v.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    (v.make || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.model || "").toLowerCase().includes(search.toLowerCase())
  );

  const availableSlots = slots.filter((s) => s.status === "AVAILABLE");

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "slots", label: "Parking Slots", icon: <ParkingCircle className="w-4 h-4" />, count: slots.length },
    { key: "vehicles", label: "All Vehicles", icon: <Car className="w-4 h-4" />, count: vehicles.length },
    { key: "my-vehicles", label: "My Vehicles", icon: <Car className="w-4 h-4" />, count: myVehicles.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ParkingCircle className="w-7 h-7 text-blue-600" />
            Parking Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {slots.length} slots · {availableSlots.length} available · {vehicles.length} vehicles registered
          </p>
        </div>
        <div className="flex gap-2">
          {tab === "slots" && (
            <button
              onClick={() => openSlotModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          )}
          {(tab === "vehicles" || tab === "my-vehicles") && (
            <button
              onClick={() => openVehicleModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Register Vehicle
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(""); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors flex-1 justify-center ${
              tab === t.key
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.icon} {t.label}
            <span className="ml-1 text-xs bg-slate-200 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "slots" ? "Search slots by number, zone, assignee..." : "Search vehicles by plate, owner, make..."}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Slots Tab */}
      {tab === "slots" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Slot #</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Zone</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Floor</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Assigned To</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Vehicle</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSlots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    {search ? "No slots match your search" : "No parking slots configured yet"}
                  </td>
                </tr>
              ) : (
                filteredSlots.map((slot) => {
                  const st = slotStatusColors[slot.status] || slotStatusColors.AVAILABLE;
                  return (
                    <tr key={slot.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{slot.slotNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{slot.zone || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{slot.floor || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {slotTypeLabels[slot.slotType] || slot.slotType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{slot.assignedToName || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{slot.vehicleNumberPlate || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openSlotModal(slot)} className="p-1.5 rounded hover:bg-slate-100" title="Edit">
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          {slot.status === "OCCUPIED" && (
                            <button onClick={() => releaseSlot(slot.id)} className="p-1.5 rounded hover:bg-amber-50" title="Release">
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            </button>
                          )}
                          <button onClick={() => deleteSlot(slot.id)} className="p-1.5 rounded hover:bg-red-50" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Vehicles Tab */}
      {(tab === "vehicles" || tab === "my-vehicles") && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Plate</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Make / Model</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Color</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Owner</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Parking Slot</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    {search ? "No vehicles match your search" : "No vehicles registered yet"}
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => {
                  const vs = vehicleStatusColors[v.status] || vehicleStatusColors.ACTIVE;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{v.numberPlate}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {vehicleTypeLabels[v.vehicleType] || v.vehicleType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {[v.make, v.model].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{v.color || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{v.ownerName}</td>
                      <td className="px-4 py-3 text-slate-600">{v.parkingSlotNumber || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${vs.bg} ${vs.text}`}>
                          {vs.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openVehicleModal(v)} className="p-1.5 rounded hover:bg-slate-100" title="Edit">
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          <button onClick={() => deleteVehicle(v.id)} className="p-1.5 rounded hover:bg-red-50" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingSlot ? "Edit Slot" : "Add Parking Slot"}
              </h2>
              <button onClick={() => setShowSlotModal(false)} className="p-1 rounded hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slot Number *</label>
                <input
                  value={slotForm.slotNumber}
                  onChange={(e) => setSlotForm({ ...slotForm, slotNumber: e.target.value })}
                  placeholder="e.g. A-101"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zone</label>
                  <input
                    value={slotForm.zone || ""}
                    onChange={(e) => setSlotForm({ ...slotForm, zone: e.target.value })}
                    placeholder="e.g. A, B, North"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Floor</label>
                  <input
                    value={slotForm.floor || ""}
                    onChange={(e) => setSlotForm({ ...slotForm, floor: e.target.value })}
                    placeholder="e.g. B1, Ground, 1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slot Type</label>
                <select
                  value={slotForm.slotType || "COVERED"}
                  onChange={(e) => setSlotForm({ ...slotForm, slotType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(slotTypeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={slotForm.notes || ""}
                  onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSlotModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveSlot}
                disabled={saving || !slotForm.slotNumber.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingSlot ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingVehicle ? "Edit Vehicle" : "Register Vehicle"}
              </h2>
              <button onClick={() => setShowVehicleModal(false)} className="p-1 rounded hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Number Plate *</label>
                <input
                  value={vehicleForm.numberPlate}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, numberPlate: e.target.value.toUpperCase() })}
                  placeholder="e.g. KA01AB1234"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleForm.vehicleType || "CAR"}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(vehicleTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                  <input
                    value={vehicleForm.color || ""}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                    placeholder="e.g. White"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
                  <input
                    value={vehicleForm.make || ""}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                    placeholder="e.g. Maruti"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                  <input
                    value={vehicleForm.model || ""}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    placeholder="e.g. Swift"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parking Slot</label>
                <select
                  value={vehicleForm.parkingSlotId ?? ""}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, parkingSlotId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No slot assigned</option>
                  {availableSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.slotNumber} ({s.zone || "No zone"} / {s.floor || "No floor"})
                    </option>
                  ))}
                  {editingVehicle?.parkingSlotId && !availableSlots.find(s => s.id === editingVehicle.parkingSlotId) && (
                    <option value={editingVehicle.parkingSlotId}>
                      {editingVehicle.parkingSlotNumber} (current)
                    </option>
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sticker #</label>
                  <input
                    value={vehicleForm.stickerNumber || ""}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, stickerNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vehicleForm.primary || false}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, primary: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Primary vehicle
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowVehicleModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveVehicle}
                disabled={saving || !vehicleForm.numberPlate.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingVehicle ? "Update" : "Register"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
