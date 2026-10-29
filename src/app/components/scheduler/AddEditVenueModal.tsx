import React, { useState, useEffect } from "react";
import { X, MapPin, Plus, Trash2, Clock, Loader2, Building2 } from "lucide-react";
import { venueService } from "../../../services/bookings/venueService";
import { showSuccess, showError } from "../../../utils/ToastUtils";
import type { Venue, Court } from "../../../types/api";

const TIME_OPTIONS = [
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
  "08:00 PM", "09:00 PM", "10:00 PM"
];

const COURT_COLORS = [
  "#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6"
];

interface AddEditVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVenueSaved: (savedVenue: Venue) => void;
  communityId?: number | null;
  venueToEdit?: Venue | null;
  existingVenues?: Venue[];
}

export const AddEditVenueModal: React.FC<AddEditVenueModalProps> = ({
  isOpen,
  onClose,
  onVenueSaved,
  communityId,
  venueToEdit,
  existingVenues = [],
}) => {
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [venueType, setVenueType] = useState("COMMUNITY");
  const [openingTime, setOpeningTime] = useState("08:00 AM");
  const [closingTime, setClosingTime] = useState("08:00 PM");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [capacity, setCapacity] = useState("");
  const [courts, setCourts] = useState<Court[]>([
    { name: "Court 1", color: COURT_COLORS[0] },
    { name: "Court 2", color: COURT_COLORS[1] },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Initialize or populate form
  useEffect(() => {
    if (!isOpen) return;

    if (venueToEdit) {
      setMode("edit");
      setSelectedVenueId(venueToEdit.id);
      populateForm(venueToEdit);
    } else {
      setMode("create");
      setSelectedVenueId(null);
      resetForm();
    }
  }, [isOpen, venueToEdit]);

  const populateForm = (v: Venue) => {
    setName(v.name || "");
    setVenueType(v.venueType || "COMMUNITY");
    setOpeningTime(v.openingTime || "08:00 AM");
    setClosingTime(v.closingTime || "08:00 PM");
    setAddress(v.address || "");
    setCity(v.city || "");
    setArea(v.area || "");
    setPinCode(v.pinCode || "");
    setMapLink(v.mapLink || "");
    setCapacity(v.capacity ? String(v.capacity) : "");
    if (v.courts && v.courts.length > 0) {
      setCourts(v.courts.map((c, i) => ({
        ...c,
        color: c.color || COURT_COLORS[i % COURT_COLORS.length]
      })));
    } else {
      setCourts([
        { name: "Court 1", color: COURT_COLORS[0] },
      ]);
    }
  };

  const resetForm = () => {
    setName("");
    setVenueType("COMMUNITY");
    setOpeningTime("08:00 AM");
    setClosingTime("08:00 PM");
    setAddress("");
    setCity("");
    setArea("");
    setPinCode("");
    setMapLink("");
    setCapacity("");
    setCourts([
      { name: "Court 1", color: COURT_COLORS[0] },
      { name: "Court 2", color: COURT_COLORS[1] },
    ]);
  };

  const handleSelectVenueToEdit = (venueIdStr: string) => {
    const id = Number(venueIdStr);
    setSelectedVenueId(id);
    const found = existingVenues.find((v) => v.id === id);
    if (found) {
      populateForm(found);
    }
  };

  const handleAddCourt = () => {
    const nextIdx = courts.length + 1;
    setCourts((prev) => [
      ...prev,
      {
        name: `Court ${nextIdx}`,
        color: COURT_COLORS[(nextIdx - 1) % COURT_COLORS.length],
        openingTime,
        closingTime,
      },
    ]);
  };

  const handleRemoveCourt = (index: number) => {
    if (courts.length <= 1) {
      showError("A venue must have at least one court.");
      return;
    }
    setCourts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCourtNameChange = (index: number, newName: string) => {
    setCourts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, name: newName } : c))
    );
  };

  const handleCourtColorChange = (index: number, newColor: string) => {
    setCourts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, color: newColor } : c))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError("Please enter a venue name.");
      return;
    }

    const validCourts = courts.map((c, idx) => ({
      name: c.name.trim() || `Court ${idx + 1}`,
      color: c.color || COURT_COLORS[idx % COURT_COLORS.length],
      openingTime: c.openingTime || openingTime,
      closingTime: c.closingTime || closingTime,
    }));

    const payload: Omit<Venue, "id"> = {
      name: name.trim(),
      venueType,
      openingTime,
      closingTime,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      area: area.trim() || undefined,
      pinCode: pinCode.trim() || undefined,
      mapLink: mapLink.trim() || undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      courts: validCourts,
    };

    setSubmitting(true);
    try {
      let savedVenue: Venue;
      if (mode === "edit" && selectedVenueId) {
        savedVenue = await venueService.updateVenue(selectedVenueId, payload);
        showSuccess(`Venue "${savedVenue.name}" updated successfully!`);
      } else {
        savedVenue = await venueService.createVenue(communityId ?? null, payload);
        showSuccess(`Venue "${savedVenue.name}" created successfully!`);
      }
      onVenueSaved(savedVenue);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save venue.";
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 m-0">
                {mode === "create" ? "Add New Venue" : "Edit Venue"}
              </h3>
              <p className="text-[11px] text-slate-500 m-0">
                Configure courts, timings and venue details for scheduling
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode selector tab when venues already exist */}
        {existingVenues.length > 0 && !venueToEdit && (
          <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={() => {
                setMode("create");
                setSelectedVenueId(null);
                resetForm();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                mode === "create"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              + Create New Venue
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("edit");
                if (existingVenues[0]) {
                  handleSelectVenueToEdit(String(existingVenues[0].id));
                }
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                mode === "edit"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Edit Existing Venue ({existingVenues.length})
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {mode === "edit" && !venueToEdit && existingVenues.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Venue to Edit <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedVenueId ?? ""}
                onChange={(e) => handleSelectVenueToEdit(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {existingVenues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.courts?.length || 1} court{v.courts?.length !== 1 ? "s" : ""})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Venue Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Venue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mana Sports Complex / Main Turf"
                className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Venue Type
              </label>
              <select
                value={venueType}
                onChange={(e) => setVenueType(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="COMMUNITY">Community</option>
                <option value="OUTSIDE">Outside / External</option>
                <option value="CLUB">Sports Club</option>
                <option value="ACADEMY">Academy</option>
              </select>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Open Time
              </label>
              <select
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Close Time
              </label>
              <select
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Courts List */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Courts / Pitches</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  {courts.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddCourt}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Court
              </button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {courts.map((court, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                  <input
                    type="color"
                    value={court.color || COURT_COLORS[idx % COURT_COLORS.length]}
                    onChange={(e) => handleCourtColorChange(idx, e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                    title="Court color indicator"
                  />
                  <input
                    type="text"
                    value={court.name}
                    onChange={(e) => handleCourtNameChange(idx, e.target.value)}
                    placeholder={`Court ${idx + 1}`}
                    className="flex-1 text-xs font-medium px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCourt(idx)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    title="Remove Court"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Location & Address */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Location Details (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street Address / Landmark"
                  className="w-full text-xs font-medium px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City (e.g. Bangalore)"
                  className="w-full text-xs font-medium px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  value={mapLink}
                  onChange={(e) => setMapLink(e.target.value)}
                  placeholder="Google Maps URL"
                  className="w-full text-xs font-medium px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Capacity (e.g. 100)"
                  className="w-full text-xs font-medium px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : mode === "create" ? (
                <>
                  <Plus className="w-3.5 h-3.5" /> Save Venue
                </>
              ) : (
                "Update Venue"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
