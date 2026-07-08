import { Plus, Clock, Users, Trash2, MapPin, Edit2, EyeOff, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { TIME_OPTIONS } from "../../../../constants/timeOptions";
import type { Court, CommunityResponse, Venue, EventContact } from "../../../../types/api";
import { useAuth } from "../../../../contexts/AuthContext";
import { VenueTimingModal } from "../../scheduler/VenueTimingModal";

interface VenueCreationSectionProps {
  user: any;
  communities: CommunityResponse[];
  venueCommunities: CommunityResponse[];
  activeTab: string;
  setActiveTab: (tab: any) => void;
  showVenueForm: boolean;
  setShowVenueForm: (val: boolean) => void;
  editingVenueId: number | null;
  venueName: string;
  setVenueName: (val: string) => void;
  venueType: string;
  setVenueType: (val: string) => void;
  venueCommId: number | "";
  setVenueCommId: (val: number | "") => void;
  venueAddress: string;
  setVenueAddress: (val: string) => void;
  venueCity: string;
  setVenueCity: (val: string) => void;
  venueArea: string;
  setVenueArea: (val: string) => void;
  venueCapacity: string;
  setVenueCapacity: (val: string) => void;
  venuePinCode: string;
  setVenuePinCode: (val: string) => void;
  venueMapLink: string;
  setVenueMapLink: (val: string) => void;
  venueOpeningTime: string;
  setVenueOpeningTime: (val: string) => void;
  venueClosingTime: string;
  setVenueClosingTime: (val: string) => void;
  venueContacts: EventContact[];
  addVenueContact: () => void;
  removeVenueContact: (index: number) => void;
  updateVenueContact: (index: number, field: keyof EventContact, value: string) => void;
  courts: Court[];
  addCourt: () => void;
  removeCourt: (index: number) => void;
  updateCourt: (index: number, field: any, value: string) => void;
  venueSubmitting: boolean;
  resetVenueForm: () => void;
  handleVenueSave: () => void;
  venues: Venue[];
  hiddenVenues: Set<number>;
  handleVenueEdit: (v: Venue) => void;
  handleVenueHide: (id: number) => void;
  handleVenueDelete: (id: number) => void;
  refreshVenues?: () => void;
}

export function VenueCreationSection({
  user,
  communities,
  venueCommunities,
  activeTab,
  setActiveTab,
  showVenueForm,
  setShowVenueForm,
  editingVenueId,
  venueName,
  setVenueName,
  venueType,
  setVenueType,
  venueCommId,
  setVenueCommId,
  venueAddress,
  setVenueAddress,
  venueCity,
  setVenueCity,
  venueArea,
  setVenueArea,
  venueCapacity,
  setVenueCapacity,
  venuePinCode,
  setVenuePinCode,
  venueMapLink,
  setVenueMapLink,
  venueOpeningTime,
  setVenueOpeningTime,
  venueClosingTime,
  setVenueClosingTime,
  venueContacts,
  addVenueContact,
  removeVenueContact,
  updateVenueContact,
  courts,
  addCourt,
  removeCourt,
  updateCourt,
  venueSubmitting,
  resetVenueForm,
  handleVenueSave,
  venues,
  hiddenVenues,
  handleVenueEdit,
  handleVenueHide,
  handleVenueDelete,
  refreshVenues,
}: VenueCreationSectionProps) {
  const { hasPermission } = useAuth();
  const canEditTiming = hasPermission("Edit Venue Timing");
  const [timingModalOpen, setTimingModalOpen] = useState(false);
  const [selectedTimingVenue, setSelectedTimingVenue] = useState<Venue | null>(null);

  return (
    <div className="space-y-4">
      {/* Title section */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h3 className="text-xl font-bold" style={{ color: "#0d0d2b" }}>Venue Management</h3>
          <p className="text-sm mt-1" style={{ color: "#6b7094" }}>Create, edit, and manage your community venues</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { resetVenueForm(); setShowVenueForm(!showVenueForm); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:shadow-lg cursor-pointer border-none"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              boxShadow: "0 2px 10px rgba(99,102,241,0.35)"
            }}
          >
            <Plus className="w-4 h-4" /> {showVenueForm ? "Cancel" : "New Venue"}
          </button>
          <button
            onClick={() => setActiveTab("sports-event")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border cursor-pointer bg-white shadow-sm"
            style={{ borderColor: "rgba(99,102,241,0.15)", color: "#6b7094" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.06)"; e.currentTarget.style.color = "#4f46e5"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#6b7094"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Venue Create/Edit Form */}
      {showVenueForm && (
        <div 
          className="rounded-2xl p-5 space-y-4 text-left"
          style={{
            background: "white",
            border: "1px solid rgba(99, 102, 241, 0.12)",
            boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
          }}
        >
          <div className="text-sm font-bold uppercase tracking-wider border-b pb-2.5" style={{ color: "#4f46e5", borderColor: "rgba(99, 102, 241, 0.12)" }}>
            {editingVenueId ? "Edit Venue" : "Create New Venue"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6b7094" }}>Venue Name *</label>
              <input 
                value={venueName} 
                onChange={e => setVenueName(e.target.value)} 
                placeholder="e.g. Community Sports Ground" 
                className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500" 
                style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6b7094" }}>Venue Type</label>
              <div className="relative">
                <select 
                  value={venueType} 
                  onChange={e => { setVenueType(e.target.value); setVenueCommId(""); }} 
                  className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm outline-none appearance-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
                >
                  <option value="">Select</option>
                  <option value="COMMUNITY">Community</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="OUTSIDE">Outside</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3" style={{ color: "#4f46e5" }}>
                  <Clock className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
            {venueType !== "OUTSIDE" && user?.role === "SUPER_ADMIN" && (
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6b7094" }}>Community</label>
                <div className="relative">
                  <select 
                    value={venueCommId} 
                    onChange={e => setVenueCommId(e.target.value ? Number(e.target.value) : "")} 
                    className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm outline-none appearance-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
                  >
                    <option value="">Select Community...</option>
                    {venueCommunities.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3" style={{ color: "#4f46e5" }}>
                    <Clock className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6b7094" }}>Address</label>
              <input 
                value={venueAddress} 
                onChange={e => setVenueAddress(e.target.value)} 
                placeholder="Street address" 
                className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500" 
                style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6b7094" }}>City</label>
              <input 
                value={venueCity} 
                onChange={e => setVenueCity(e.target.value)} 
                placeholder="City" 
                className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500" 
                style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6b7094" }}>Area</label>
              <input 
                value={venueArea} 
                onChange={e => setVenueArea(e.target.value)} 
                placeholder="Area / Locality" 
                className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500" 
                style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6b7094" }}>Capacity</label>
              <input 
                type="number" 
                value={venueCapacity} 
                onChange={e => setVenueCapacity(e.target.value)} 
                placeholder="e.g. 200" 
                className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500" 
                style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6b7094" }}>Pin / Zip code</label>
              <input 
                value={venuePinCode} 
                onChange={e => setVenuePinCode(e.target.value)} 
                placeholder="Pin or Zip code" 
                className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500" 
                style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6b7094" }}>Map Link</label>
              <input 
                value={venueMapLink} 
                onChange={e => setVenueMapLink(e.target.value)} 
                placeholder="https://maps.google.com/..." 
                className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500" 
                style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
              />
            </div>
            <div className="md:col-span-2 border rounded-2xl p-4 space-y-3"
              style={{ background: "rgba(99, 102, 241, 0.03)", borderColor: "rgba(99, 102, 241, 0.08)" }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: "#4f46e5" }} />
                <span className="text-sm font-bold text-slate-800">Timings</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6b7094" }}>
                    Opening Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={venueOpeningTime}
                      onChange={e => setVenueOpeningTime(e.target.value)}
                      disabled={!canEditTiming}
                      required
                      className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
                    >
                      {TIME_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3" style={{ color: "#4f46e5" }}>
                      <Clock className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "#6b7094" }}>
                    Closing Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={venueClosingTime}
                      onChange={e => setVenueClosingTime(e.target.value)}
                      disabled={!canEditTiming}
                      required
                      className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
                    >
                      {TIME_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3" style={{ color: "#4f46e5" }}>
                      <Clock className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="md:col-span-2 border-t pt-4 mt-2" style={{ borderColor: "rgba(99, 102, 241, 0.12)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: "#4f46e5" }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7094" }}>Contact Information</span>
                </div>
                <button
                  type="button"
                  onClick={addVenueContact}
                  className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer font-bold bg-transparent border-none outline-none"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Contact
                </button>
              </div>

              <div className="space-y-4">
                {venueContacts.map((contact, index) => (
                  <div key={index} className="relative p-4 rounded-xl border bg-slate-50/50 flex flex-col gap-3" style={{ borderColor: "rgba(99, 102, 241, 0.12)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Contact #{index + 1}</span>
                      {venueContacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVenueContact(index)}
                          className="text-red-500 hover:text-red-700 transition-colors cursor-pointer bg-transparent border-none outline-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold block mb-1" style={{ color: "#6b7094" }}>Contact Name *</label>
                        <input
                          value={contact.name}
                          onChange={e => updateVenueContact(index, "name", e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full bg-white border rounded-xl px-3 py-2 text-xs outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                          style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold block mb-1" style={{ color: "#6b7094" }}>Title (Role/Designation)</label>
                        <input
                          value={contact.title || ""}
                          onChange={e => updateVenueContact(index, "title", e.target.value)}
                          placeholder="e.g. Manager / Secretary"
                          className="w-full bg-white border rounded-xl px-3 py-2 text-xs outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                          style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold block mb-1" style={{ color: "#6b7094" }}>Contact Number *</label>
                        <input
                          value={contact.number}
                          onChange={e => updateVenueContact(index, "number", e.target.value)}
                          placeholder="e.g. +91 9876543210"
                          className="w-full bg-white border rounded-xl px-3 py-2 text-xs outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                          style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold block mb-1" style={{ color: "#6b7094" }}>Contact Email *</label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={e => updateVenueContact(index, "email", e.target.value)}
                          placeholder="e.g. john@example.com"
                          className="w-full bg-white border rounded-xl px-3 py-2 text-xs outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                          style={{ borderColor: "rgba(99, 102, 241, 0.18)", color: "#0d0d2b" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Courts Section */}
            <div className="md:col-span-2 border-t pt-4 mt-2" style={{ borderColor: "rgba(99, 102, 241, 0.12)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" style={{ color: "#4f46e5" }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7094" }}>Courts</span>
                  {courts.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: "rgba(99,102,241,0.1)", color: "#4f46e5", border: "1px solid rgba(99,102,241,0.2)" }}>
                      {courts.length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addCourt}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                  style={{ background: "rgba(99,102,241,0.1)", color: "#4f46e5", border: "1px solid rgba(99,102,241,0.2)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; }}
                >
                  <Plus className="w-3 h-3" /> Add Court
                </button>
              </div>

              {courts.length === 0 ? (
                <p className="text-xs italic" style={{ color: "#6b7094" }}>No courts added yet. Click 'Add Court' to define courts for this venue.</p>
              ) : (
                <div className="space-y-2">
                  {courts.map((court, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-2.5 rounded-xl transition-all"
                      style={{ background: "rgba(99, 102, 241, 0.02)", border: "1px solid rgba(99, 102, 241, 0.08)" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.08)"; }}
                    >
                      <span className="text-xs font-semibold w-5 text-center" style={{ color: "#6b7094" }}>
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={court.name}
                          onChange={e => updateCourt(index, "name", e.target.value)}
                          placeholder="Court Name (e.g. Court 1, Badminton Court A)"
                          className="w-full bg-white border rounded-xl px-3 py-2 text-xs outline-none transition-colors"
                          style={{ borderColor: "rgba(99, 102, 241, 0.15)", color: "#0d0d2b" }}
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-white border rounded-xl px-2.5 py-1" style={{ borderColor: "rgba(99, 102, 241, 0.15)" }}>
                        <span className="text-[10px]" style={{ color: "#6b7094" }}>Color</span>
                        <input
                          type="color"
                          value={court.color}
                          onChange={e => updateCourt(index, "color", e.target.value)}
                          className="w-6 h-6 border-0 bg-transparent rounded cursor-pointer outline-none p-0 flex-shrink-0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCourt(index)}
                        className="p-2 border rounded-xl transition-all cursor-pointer bg-transparent"
                        style={{ borderColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.06)"; e.currentTarget.style.borderColor = "#ef4444"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.15)"; }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            {editingVenueId && (
              <button 
                onClick={resetVenueForm} 
                className="flex-1 py-2.5 bg-transparent border text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer"
                style={{ borderColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleVenueSave}
              disabled={venueSubmitting}
              className="flex-[2] py-2.5 text-white text-sm font-medium rounded-xl border-none cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                boxShadow: "0 2px 10px rgba(99,102,241,0.35)"
              }}
            >
              {venueSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (editingVenueId ? "Update Venue" : "Create Venue ↗")}
            </button>
          </div>
        </div>
      )}

      {/* Venue List */}
      <div 
        className="rounded-2xl p-5 text-left"
        style={{
          background: "white",
          border: "1px solid rgba(99, 102, 241, 0.12)",
          boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
        }}
      >
        <div className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center justify-between border-b pb-2.5" style={{ color: "#6b7094", borderColor: "rgba(99, 102, 241, 0.12)" }}>
          <span>All Venues</span>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold"
            style={{ background: "rgba(99,102,241,0.1)", color: "#4f46e5", border: "1px solid rgba(99,102,241,0.2)" }}>
            {venues.length}
          </span>
        </div>
        <div className="space-y-3">
          {venues.filter(v => !hiddenVenues.has(v.id)).map(v => (
            <div 
              key={v.id} 
              className="flex flex-col gap-2 p-4 rounded-xl transition-all"
              style={{ background: "rgba(99, 102, 241, 0.03)", border: "1px solid rgba(99, 102, 241, 0.08)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.25)"; e.currentTarget.style.background = "rgba(99, 102, 241, 0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.08)"; e.currentTarget.style.background = "rgba(99, 102, 241, 0.03)"; }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(99, 102, 241, 0.12)" }}>
                    <MapPin className="h-5 w-5" style={{ color: "#4f46e5" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate" style={{ color: "#0d0d2b" }}>
                      {v.name}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: "#6b7094" }}>
                      {[v.area, v.city, v.pinCode].filter(Boolean).join(", ") || "No location details"}
                      {v.capacity ? ` · Capacity: ${v.capacity}` : ""}
                      {(v.openingTime || v.closingTime) && (
                        <> · Timings: {v.openingTime || '—'} – {v.closingTime || '—'}</>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  {v.venueType && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border"
                      style={
                        v.venueType === "OUTSIDE"
                          ? { background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", borderColor: "rgba(59, 130, 246, 0.2)" }
                          : { background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.2)" }
                      }
                    >
                      {v.venueType}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTimingVenue(v);
                      setTimingModalOpen(true);
                    }}
                    className="text-[10px] px-2.5 py-1.5 border rounded-lg transition-all flex items-center gap-1 cursor-pointer bg-white shadow-sm"
                    style={{ borderColor: "rgba(99, 102, 241, 0.15)", color: "#6b7094" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.color = "#4f46e5"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.15)"; e.currentTarget.style.color = "#6b7094"; }}
                  >
                    <Clock className="w-3 h-3" /> Timings
                  </button>
                  <button 
                    onClick={() => handleVenueEdit(v)} 
                    className="text-[10px] px-2.5 py-1.5 border rounded-lg transition-all flex items-center gap-1 cursor-pointer bg-white shadow-sm"
                    style={{ borderColor: "rgba(99, 102, 241, 0.15)", color: "#6b7094" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.color = "#4f46e5"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.15)"; e.currentTarget.style.color = "#6b7094"; }}
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button 
                    onClick={() => handleVenueHide(v.id)} 
                    className="text-[10px] px-2.5 py-1.5 border rounded-lg transition-all flex items-center gap-1 cursor-pointer bg-white shadow-sm"
                    style={{ borderColor: "rgba(245, 158, 11, 0.2)", color: "#6b7094" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.background = "rgba(245, 158, 11, 0.05)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.2)"; e.currentTarget.style.color = "#6b7094"; e.currentTarget.style.background = "white"; }}
                  >
                    <EyeOff className="w-3 h-3" /> Hide
                  </button>
                  <button 
                    onClick={() => handleVenueDelete(v.id)} 
                    className="text-[10px] px-2.5 py-1.5 border rounded-lg transition-all flex items-center gap-1 cursor-pointer bg-white shadow-sm"
                    style={{ borderColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)"; e.currentTarget.style.background = "white"; }}
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>

              {/* Courts list & Contact info display inside card */}
              {((v.courts && v.courts.length > 0) || (v.contacts && v.contacts.length > 0) || v.contactName) && (
                <div className="mt-1 ml-[52px] flex flex-col gap-1 border-t pt-2.5" style={{ borderColor: "rgba(99, 102, 241, 0.08)" }}>
                  {v.contacts && v.contacts.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {v.contacts.map((c, idx) => (
                        <span key={idx} className="text-[10px] flex items-center gap-1 flex-wrap" style={{ color: "#6b7094" }}>
                          <Users className="w-3.5 h-3.5 text-slate-400" /> 
                          Contact #{idx + 1}: <strong className="font-semibold text-slate-700">{c.name}</strong> 
                          {c.title && <span className="text-slate-500">({c.title})</span>}
                          <span className="text-slate-600">· {c.number}</span>
                          {c.email && <span className="text-slate-400">· {c.email}</span>}
                        </span>
                      ))}
                    </div>
                  ) : v.contactName ? (
                    <span className="text-[10px] flex items-center gap-1 flex-wrap" style={{ color: "#6b7094" }}>
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Contact: <strong className="font-semibold text-slate-700">{v.contactName}</strong> ({v.contactNumber}) {v.contactEmail && <span className="text-slate-400">· {v.contactEmail}</span>}
                    </span>
                  ) : null}
                  {v.courts && v.courts.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "#6b7094" }}>Courts:</span>
                      {v.courts.map((court, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold text-white flex items-center gap-1 shadow-sm"
                          style={{ backgroundColor: court.color || "#6366f1" }}
                        >
                          {court.name || `Court ${i + 1}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {hiddenVenues.size > 0 && (
            <div className="border-t pt-4 mt-4" style={{ borderColor: "rgba(99, 102, 241, 0.12)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "#6b7094" }}>Hidden Venues ({hiddenVenues.size})</div>
              {venues.filter(v => hiddenVenues.has(v.id)).map(v => (
                <div 
                  key={v.id} 
                  className="flex items-center justify-between p-3 rounded-xl border opacity-60 mb-2"
                  style={{ background: "rgba(99, 102, 241, 0.01)", borderColor: "rgba(99, 102, 241, 0.05)" }}
                >
                  <div className="text-sm truncate flex items-center gap-2" style={{ color: "#6b7094" }}>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /> {v.name}
                  </div>
                  <button 
                    onClick={() => handleVenueHide(v.id)} 
                    className="text-[10px] px-2.5 py-1.5 border rounded-lg transition-colors flex items-center gap-1 cursor-pointer bg-white"
                    style={{ borderColor: "rgba(99, 102, 241, 0.15)", color: "#6b7094" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.color = "#4f46e5"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.15)"; e.currentTarget.style.color = "#6b7094"; }}
                  >
                    <Eye className="w-3 h-3" /> Show
                  </button>
                </div>
              ))}
            </div>
          )}
          {venues.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(99, 102, 241, 0.3)" }} />
              <div className="text-sm italic font-medium" style={{ color: "#6b7094" }}>No venues yet. Create your first venue above.</div>
            </div>
          )}
        </div>
      </div>
      <VenueTimingModal
        isOpen={timingModalOpen}
        onClose={() => {
          setTimingModalOpen(false);
          setSelectedTimingVenue(null);
        }}
        venue={selectedTimingVenue}
        canEditTiming={canEditTiming}
        onSaveSuccess={() => {
          if (refreshVenues) refreshVenues();
        }}
      />
    </div>
  );
}
