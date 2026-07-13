import { useState } from "react";
import { Loader2, Plus, Trash2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { TIME_OPTIONS } from "../../../../constants/timeOptions";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import { Button } from "../../ui/button";
import { cn } from "../../ui/utils";
import { CalendarIcon } from "lucide-react";
import { ContactNameAutocomplete } from "./ContactNameAutocomplete";
import type { CommunityResponse, Venue } from "../../../../types/api";

interface CreateTournamentTabProps {
  user: any;
  editingEventId: number | null;
  eventName: string;
  setEventName: (v: string) => void;
  selectedCommId: number | "";
  setSelectedCommId: (v: number | "") => void;
  maxPax: string;
  setMaxPax: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  communities: CommunityResponse[];
  startDate?: Date;
  setStartDate: (v: Date | undefined) => void;
  endDate?: Date;
  setEndDate: (v: Date | undefined) => void;
  regStartDate?: Date;
  setRegStartDate: (v: Date | undefined) => void;
  regEndDate?: Date;
  setRegEndDate: (v: Date | undefined) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  dueTime: string;
  setDueTime: (v: string) => void;
  tournamentLevel: "Standard" | "Professional" | "Premium";
  setTournamentLevel: (v: "Standard" | "Professional" | "Premium") => void;
  bannerImage: string;
  setBannerImage: (v: string) => void;
  handleBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  eventContactName: string;
  setEventContactName: (v: string) => void;
  eventContactNumber: string;
  setEventContactNumber: (v: string) => void;
  eventContactEmail: string;
  setEventContactEmail: (v: string) => void;
  otherContacts: { title: string; name: string; detail: string }[];
  addOtherContact: () => void;
  removeOtherContact: (index: number) => void;
  updateOtherContact: (index: number, field: "title" | "name" | "detail", value: string) => void;
  sponsors: { category: string; name: string; url: string }[];
  addSponsor: () => void;
  removeSponsor: (index: number) => void;
  updateSponsor: (index: number, field: "category" | "name" | "url", value: string) => void;
  allowAdminChat: boolean;
  totalEnabledCount: number;
  globalChannels: string[];
  customTriggers: any[];
  totalOutputSends: number;
  setShowNotificationModal: (v: boolean) => void;
  submitting: boolean;
  handleSave: () => void;
  resetForm: () => void;
  setActiveTab: (tab: any) => void;
  onAddEvents?: (id: number, name: string) => void;
}

export function CreateTournamentTab({
  user,
  editingEventId,
  eventName,
  setEventName,
  selectedCommId,
  setSelectedCommId,
  maxPax,
  setMaxPax,
  description,
  setDescription,
  communities,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  regStartDate,
  setRegStartDate,
  regEndDate,
  setRegEndDate,
  startTime,
  setStartTime,
  dueTime,
  setDueTime,
  tournamentLevel,
  setTournamentLevel,
  bannerImage,
  setBannerImage,
  handleBannerUpload,
  eventContactName,
  setEventContactName,
  eventContactNumber,
  setEventContactNumber,
  eventContactEmail,
  setEventContactEmail,
  otherContacts,
  addOtherContact,
  removeOtherContact,
  updateOtherContact,
  sponsors,
  addSponsor,
  removeSponsor,
  updateSponsor,
  allowAdminChat,
  totalEnabledCount,
  globalChannels,
  customTriggers,
  totalOutputSends,
  setShowNotificationModal,
  submitting,
  handleSave,
  resetForm,
  setActiveTab,
  onAddEvents,
}: CreateTournamentTabProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h3 className="text-xl font-bold text-slate-800">
            {editingEventId ? "Edit Tournament" : "CREATE TOURNAMENT"}
          </h3>
          <p className="text-sm text-slate-500 mt-1">{editingEventId ? "Update tournament details" : "Step 1: Create your tournament, then add sports events to it"}</p>
        </div>
        <button
          onClick={() => { resetForm(); setActiveTab("sports-event"); }}
          className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer bg-white shadow-sm"
        >
          ← Back to List
        </button>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">Tournament Details</div>

          {editingEventId && onAddEvents && (
            <div className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3 text-left">
              <div>
                <span className="text-xs font-semibold text-indigo-700 block">Configure Events for this Tournament</span>
                <span className="text-[10px] text-indigo-500 mt-0.5">Manage, add, or edit the sports events associated with this tournament.</span>
              </div>
              <button
                type="button"
                onClick={() => onAddEvents(editingEventId, eventName)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow transition-all cursor-pointer border-none"
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
              >
                Configure Events
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-left">
              <label className="text-xs text-slate-500 font-semibold block mb-1.5">Tournament Name</label>
              <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. Box Cricket Tournament Season 2" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
            </div>

            {user?.role === "SUPER_ADMIN" ? (
              <div className="text-left">
                <label className="text-xs text-slate-500 font-semibold block mb-1.5">Target Community</label>
                <div className="relative">
                  <select
                    value={selectedCommId}
                    onChange={e => setSelectedCommId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none appearance-none transition-colors"
                  >
                    <option value="">Select Community...</option>
                    {communities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-left">
                <label className="text-xs text-slate-500 font-semibold block mb-1.5">Max Participants</label>
                <input type="number" value={maxPax} onChange={e => setMaxPax(e.target.value)} placeholder="64" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
              </div>
            )}

            <div className="md:col-span-2 text-left">
              <label className="text-xs text-slate-500 font-semibold block mb-1.5">About This Tournament (Say something about this tournament)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Say something about this tournament (rules, schedule, special terms, prizes...)"
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none resize-none transition-colors"
              />
            </div>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            {([
              { label: "Tournament Start Date", value: startDate, setter: setStartDate, key: "startDate" },
              { label: "Tournament End Date", value: endDate, setter: setEndDate, key: "endDate" },
              { label: "Reg Start Date", value: regStartDate, setter: setRegStartDate, key: "regStartDate" },
              { label: "Reg End Date", value: regEndDate, setter: setRegEndDate, key: "regEndDate" },
            ] as const).map(({ label, value, setter, key }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">{label}</label>
                <Popover open={openPopover === key} onOpenChange={(open) => setOpenPopover(open ? key : null)}>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full bg-slate-50 border-slate-200 hover:bg-slate-100 hover:text-slate-800 text-slate-800 justify-start text-left font-normal px-3 py-5 transition-colors shadow-sm", !value && "text-slate-400")}>
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                      {value ? format(value, "PPP") : <span>Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <Calendar
                      mode="single"
                      selected={value}
                      onSelect={(val) => {
                        setter(val);
                        setOpenPopover(null);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            ))}
          </div>

          {/* Time Pickers */}
          <div className="grid grid-cols-2 gap-6 text-left">
            {([
              { label: "Start Time", value: startTime, setter: setStartTime },
              { label: "Due Time", value: dueTime, setter: setDueTime },
            ] as const).map(({ label, value, setter }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">{label}</label>
                <div className="relative">
                  <select
                    value={value}
                    onChange={e => setter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none appearance-none transition-colors"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {user?.role === "SUPER_ADMIN" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1.5">Max Participants</label>
                <input type="number" value={maxPax} onChange={e => setMaxPax(e.target.value)} placeholder="64" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
              </div>
            </div>
          )}

          {/* Tournament Level & Branding */}
          <div className="pt-2 text-left">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Tournament Level & Branding</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-2">Tournament Type</label>
                <div className="flex gap-3">
                  {(["Standard", "Professional", "Premium"] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTournamentLevel(type)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border cursor-pointer transition-all ${
                        tournamentLevel === type
                          ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-indigo-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1.5">Banner Image</label>
                {bannerImage ? (
                  <div className="relative h-[42px] w-full rounded-lg overflow-hidden border border-slate-200 group flex items-center justify-between px-3 bg-slate-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={bannerImage} alt="Banner Preview" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      <span className="text-xs text-slate-700 truncate font-medium">Banner Uploaded</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBannerImage("")}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded border border-red-200 hover:border-red-600 text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-between border border-dashed border-slate-200 hover:border-indigo-500 rounded-lg px-3 py-1.5 bg-slate-50 transition-colors cursor-pointer group h-[42px]">
                    <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">Upload banner image (Max 2MB)</span>
                    <div className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[10px] text-indigo-600 font-semibold group-hover:border-indigo-400 transition-colors flex items-center gap-1 shadow-sm">
                      Browse
                    </div>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="pt-2 text-left">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Tournament Contact Information</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1.5">Contact Name *</label>
                <ContactNameAutocomplete
                  value={eventContactName}
                  onChange={setEventContactName}
                  onSelect={(u) => {
                    setEventContactName(u.fullName);
                    setEventContactNumber(u.phone);
                    setEventContactEmail(u.email);
                  }}
                  placeholder="Type 3+ letters to search members"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1.5">Contact Number *</label>
                <input value={eventContactNumber} onChange={e => setEventContactNumber(e.target.value)} placeholder="e.g. +91 9876543210" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1.5">Contact Email *</label>
                <input type="email" value={eventContactEmail} onChange={e => setEventContactEmail(e.target.value)} placeholder="e.g. contact@tournament.com" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
              </div>
            </div>

            {/* Other Contacts */}
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Other Information (Multiple entries)</span>
                <button type="button" onClick={addOtherContact} className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer font-bold">
                  <Plus className="w-3.5 h-3.5" /> Add Contact
                </button>
              </div>

              {otherContacts.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                  No extra contact information added yet. Click "+ Add Contact" if you'd like to list volunteers, referees, or co-organizers.
                </div>
              ) : (
                <div className="space-y-3">
                  {otherContacts.map((contact, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg relative group text-left">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Title (Contact Title)</label>
                        <input value={contact.title} onChange={e => updateOtherContact(index, "title", e.target.value)} placeholder="e.g. Organizer" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Name (Full Name)</label>
                        <input value={contact.name} onChange={e => updateOtherContact(index, "name", e.target.value)} placeholder="e.g. John Doe" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Detail (Number/Email)</label>
                          <input value={contact.detail} onChange={e => updateOtherContact(index, "detail", e.target.value)} placeholder="e.g. john@mail.com" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
                        </div>
                        <button type="button" onClick={() => removeOtherContact(index)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border border-red-200 cursor-pointer mb-0.5" title="Remove Contact">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sponsors */}
          <div className="pt-2 text-left">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Tournament Sponsors</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Sponsors List (Multiple entries)</span>
                <button type="button" onClick={addSponsor} className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer font-bold">
                  <Plus className="w-3.5 h-3.5" /> Add Sponsor
                </button>
              </div>

              {sponsors.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                  No tournament sponsors added yet. Click "+ Add Sponsor" to highlight title or category sponsors.
                </div>
              ) : (
                <div className="space-y-3">
                  {sponsors.map((sponsor, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg relative group text-left">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Sponsor Category *</label>
                        <input value={sponsor.category} onChange={e => updateSponsor(index, "category", e.target.value)} placeholder="e.g. Title Sponsor" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {["Title Sponsor", "Gold Sponsor", "Silver Sponsor", "Associate Sponsor"].map(suggestion => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => updateSponsor(index, "category", suggestion)}
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[9px] border transition-all cursor-pointer font-semibold",
                                sponsor.category === suggestion
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                  : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                              )}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Sponsor Name *</label>
                        <input value={sponsor.name} onChange={e => updateSponsor(index, "name", e.target.value)} placeholder="e.g. Google DeepMind" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Sponsor URL (Optional)</label>
                          <input type="url" value={sponsor.url || ""} onChange={e => updateSponsor(index, "url", e.target.value)} placeholder="e.g. https://deepmind.google" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 outline-none transition-colors" />
                        </div>
                        <button type="button" onClick={() => removeSponsor(index)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border border-red-200 cursor-pointer mb-0.5 h-[34px] flex items-center justify-center" title="Remove Sponsor">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Configuration */}
          <div className="pt-2 text-left">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Chat Configuration</div>
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 opacity-65 cursor-not-allowed">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Chat With Administrator</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Allow applicants to chat with Administrator? (Presently disabled)</span>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed">
                <input type="checkbox" disabled checked={allowAdminChat} className="sr-only peer" />
                <div className="w-9 h-5 rounded-full bg-slate-200 relative">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </label>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="pt-2 text-left">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">Notification Settings</div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                  📡 Automated Notification Scheduler
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-full font-bold">
                    {totalEnabledCount} Active Triggers
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xl">
                  Configure multi-channel automated triggers (Email, Push, WhatsApp, SMS) relative to tournament kick-off. Customize delivery channels, custom templates, and analyze audience reach metrics.
                </p>
                <div className="flex gap-4 mt-3 flex-wrap text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Active Channels: {globalChannels.join(", ").toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    <span>Custom Triggers: {customTriggers.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>Total Dispatches: {totalOutputSends} sends</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationModal(true)}
                className="w-full md:w-auto px-5 py-3 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md border-none cursor-pointer flex items-center justify-center gap-2 flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  boxShadow: "0 2px 10px rgba(99,102,241,0.3)"
                }}
              >
                <span>⚙️ Configure Scheduler</span>
              </button>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            {editingEventId && (
              <button onClick={() => { resetForm(); setActiveTab("sports-event"); }} className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 text-sm font-semibold rounded-lg hover:border-red-500 hover:text-red-500 cursor-pointer transition-colors shadow-sm">
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={submitting}
              className="flex-[2] py-3 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-sm"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                boxShadow: "0 2px 10px rgba(99,102,241,0.3)"
              }}
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (editingEventId ? "Update Tournament" : "Create Tournament & Add Events →")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
