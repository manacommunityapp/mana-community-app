import React from "react";
import { Plus, X, Search, Loader2, Trash2, CalendarIcon, Users, Edit2, ChevronDown, Check, Gavel } from "lucide-react";
import { ContactNameAutocomplete } from "./ContactNameAutocomplete";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { Calendar } from "../../ui/calendar";
import { format } from "date-fns";
import { cn } from "../../ui/utils";
import type { SportMeta, PlayerCategory, Venue, SportFormEntry } from "../../../../types/api";

const PREDEFINED_SPORTS: { name: string; icon: string }[] = [
  { name: "Badminton", icon: "🏸" },
  { name: "Basketball", icon: "🏀" },
  { name: "Beach Volleyball", icon: "🏐" },
  { name: "Beach Tennis", icon: "🎾" },
  { name: "Billiards", icon: "🎱" },
  { name: "Bowling", icon: "🎳" },
  { name: "Carrom", icon: "🎯" },
  { name: "Chess", icon: "♟️" },
  { name: "Cricket (Tennis Ball)", icon: "🏏" },
  { name: "Cycling", icon: "🚴" },
  { name: "Dart", icon: "🎯" },
  { name: "Foosball", icon: "⚽" },
  { name: "Grass Volleyball", icon: "🏐" },
  { name: "Kabaddi", icon: "🤼" },
  { name: "Pickleball", icon: "🏓" },
  { name: "Pool", icon: "🎱" },
  { name: "Running (100M)", icon: "🏃" },
  { name: "Running (1500M)", icon: "🏃" },
  { name: "Running (200M)", icon: "🏃" },
  { name: "Running (400M)", icon: "🏃" },
  { name: "Running (800M)", icon: "🏃" },
  { name: "Running (Others)", icon: "🏃" },
  { name: "Snooker", icon: "🎱" },
  { name: "Soccer", icon: "⚽" },
  { name: "Squash", icon: "🎾" },
  { name: "Swimming Race", icon: "🏊" },
  { name: "Table Tennis", icon: "🏓" },
  { name: "Tennis", icon: "🎾" },
  { name: "Throwball", icon: "🤾" },
  { name: "Tug of War", icon: "🪢" },
  { name: "Volleyball", icon: "🏐" },
];

const isTeamSport = (sportName: string): boolean => {
  const name = sportName.toLowerCase();
  return (
    name.includes("cricket") ||
    name.includes("football") ||
    name.includes("soccer") ||
    name.includes("basketball") ||
    name.includes("volleyball") ||
    name.includes("kabaddi") ||
    name.includes("tug of war") ||
    name.includes("throwball") ||
    name.includes("hockey") ||
    name.includes("baseball") ||
    name.includes("rugby")
  );
};

interface SportsEventSectionProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  showSportForm: boolean;
  setShowSportForm: (val: boolean) => void;
  showSportPicker: boolean;
  setShowSportPicker: (val: boolean) => void;
  sportPickerSearch: string;
  setSportPickerSearch: (val: string) => void;
  sportSubmitting: boolean;
  sportForms: SportFormEntry[];
  sportsMeta: SportMeta[];
  playerCategories: PlayerCategory[];
  venues: Venue[];
  activeEvents: any[];
  handleSportPickerSelect: (sport: { name: string; icon: string }) => void;
  handleCreateCustomSport: () => void;
  removeSportForm: (id: string) => void;
  addEventToSportForm: (id: string) => void;
  removeEventFromSportForm: (formId: string, eventId: string) => void;
  updateSportFormEvent: (formId: string, eventId: string, field: string, value: any) => void;
  handleSportSave: () => void;
  handleSportEdit: (ev: any) => void;
  handleSportDelete: (id: number) => void;
  resetSportForm: () => void;
  selectedTemplates: Record<string, string>;
  setSelectedTemplates: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  openDropdownEventId: string | null;
  setOpenDropdownEventId: React.Dispatch<React.SetStateAction<string | null>>;
  searchQueries: Record<string, string>;
  setSearchQueries: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeCommId: number | undefined;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

export function SportsEventSection({
  user,
  activeTab,
  setActiveTab,
  showSportForm,
  setShowSportForm,
  showSportPicker,
  setShowSportPicker,
  sportPickerSearch,
  setSportPickerSearch,
  sportSubmitting,
  sportForms,
  sportsMeta,
  playerCategories,
  venues,
  activeEvents,
  handleSportPickerSelect,
  handleCreateCustomSport,
  removeSportForm,
  addEventToSportForm,
  removeEventFromSportForm,
  updateSportFormEvent,
  handleSportSave,
  handleSportEdit,
  handleSportDelete,
  resetSportForm,
  selectedTemplates,
  setSelectedTemplates,
  openDropdownEventId,
  setOpenDropdownEventId,
  searchQueries,
  setSearchQueries,
  activeCommId,
  isSuperAdmin,
  isAdmin,
}: SportsEventSectionProps) {
  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h3 className="text-xl font-bold text-slate-800">Sports Management</h3>
          <p className="text-sm text-slate-500 mt-1">Configure and manage active sports metadata in the system</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showSportForm) {
              resetSportForm();
            } else {
              resetSportForm();
              setShowSportPicker(true);
            }
          }}
          className="px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer border-none shadow-sm"
          style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            boxShadow: "0 2px 10px rgba(99,102,241,0.3)"
          }}
        >
          <Plus className="w-4 h-4" /> {showSportForm ? "Close Form" : "Add Event"}
        </button>
      </div>

      {/* ─── Sport Picker Modal ─── */}
      {showSportPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="text-left">
                <h2 className="text-lg font-bold text-slate-800">Select a Sport</h2>
                <p className="text-xs text-slate-500 mt-0.5">Choose from the list below to configure its defaults</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowSportPicker(false); setSportPickerSearch(""); }}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={sportPickerSearch}
                  onChange={e => setSportPickerSearch(e.target.value)}
                  placeholder="Search sports..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {PREDEFINED_SPORTS.filter(sp => sp.name.toLowerCase().includes(sportPickerSearch.toLowerCase())).map(sp => {
                  const alreadyAdded = sportsMeta.some(meta => meta.name.toLowerCase() === sp.name.toLowerCase());
                  const alreadyQueued = sportForms.some(form => form.name.toLowerCase() === sp.name.toLowerCase());
                  const isUnavailable = alreadyQueued;

                  return (
                    <button
                      key={sp.name}
                      type="button"
                      onClick={() => !isUnavailable && handleSportPickerSelect(sp)}
                      disabled={isUnavailable}
                      className={cn(
                        "flex flex-col items-center gap-2.5 p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer",
                        isUnavailable
                          ? "bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed text-slate-400"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-500 hover:bg-indigo-50/20 hover:scale-[1.03] hover:shadow-sm"
                      )}
                    >
                       {sp.icon && (sp.icon.startsWith("data:image/") || sp.icon.startsWith("http")) ? (
                         <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-slate-100 border border-slate-200 shadow-inner">
                           <img src={sp.icon} alt={sp.name} className="w-9 h-9 object-cover rounded" />
                         </div>
                       ) : (
                         <span className="text-3xl leading-none">{sp.icon}</span>
                       )}
                      <span className="text-xs font-semibold leading-tight">{sp.name}</span>
                      {alreadyAdded && (
                        <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wide">Registered</span>
                      )}
                      {alreadyQueued && (
                        <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wide">Queued</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {PREDEFINED_SPORTS.filter(sp => sp.name.toLowerCase().includes(sportPickerSearch.toLowerCase())).length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-500 text-sm mb-4">No predefined sports match your search.</p>
                  <button
                    type="button"
                    onClick={handleCreateCustomSport}
                    disabled={sportSubmitting}
                    className="px-4 py-2.5 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2 mx-auto shadow-md"
                    style={{
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)"
                    }}
                  >
                    {sportSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Custom Sport: "{sportPickerSearch}"
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => { setShowSportPicker(false); setSportPickerSearch(""); }}
                className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors bg-white cursor-pointer shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSportForm && sportForms.length > 0 && (
        <div className="space-y-4">
          {/* Header bar with count and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {sportForms.some(f => f.editingSportId) ? "Edit Sport Event" : `Configure Sports Event (${sportForms.length})`}
              </h3>
            </div>
            {!sportForms.some(f => f.editingSportId) && (
              <button
                type="button"
                onClick={() => setShowSportPicker(true)}
                className="px-3 py-1.5 text-xs text-indigo-600 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer flex items-center gap-2 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Event
              </button>
            )}
          </div>

          {/* Sport Form Cards */}
          <div className="space-y-5">
            {sportForms.map((form, idx) => (
              <div
                key={form.id}
                className="rounded-xl p-5 hover:border-indigo-500/20 transition-all text-left"
                style={{
                  background: "white",
                  border: "1px solid rgba(99, 102, 241, 0.12)",
                  boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
                }}
              >
                {/* Sport Header with icon, name, index badge and remove button */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex-1">
                     {form.iconUrl ? (
                       <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-white border border-slate-200 shadow-sm">
                         <img src={form.iconUrl} alt={form.name} className="w-7 h-7 object-cover rounded" />
                       </div>
                     ) : (
                       <span className="text-2xl leading-none">{form.icon || "🏆"}</span>
                     )}
                    <div className="flex-1 min-w-0">
                      <label className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Sport {idx + 1}</label>
                      <h4 className="text-sm font-bold text-slate-800 truncate">{form.name}</h4>
                    </div>
                  </div>
                  {!form.editingSportId && sportForms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSportForm(form.id)}
                      className="p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors border border-slate-200 hover:border-red-500/30 bg-white cursor-pointer"
                      title="Remove this sport"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Event Configurations */}
                <div className="space-y-3">
                  {form.events.map((ev, eIdx) => (
                    <div
                      key={ev.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative"
                    >
                      {/* Event header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Event {eIdx + 1}</span>
                        {form.events.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEventFromSportForm(form.id, ev.id)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title="Remove event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Event Name */}
                      <div>
                        <label className="text-xs text-slate-500 font-semibold block mb-1">Name *</label>
                        <input
                          type="text"
                          value={ev.eventName}
                          onChange={e => updateSportFormEvent(form.id, ev.id, "eventName", e.target.value)}
                          placeholder="Event Name"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                        />
                      </div>

                      {/* Start Date & End Date */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-slate-500 font-semibold">Start Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-800 justify-start text-left font-normal px-3 py-2 h-auto text-sm transition-colors shadow-sm", !ev.startDate && "text-slate-400")}>
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                {ev.startDate ? format(new Date(ev.startDate), "PPP") : <span>Pick date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                              <Calendar
                                mode="single"
                                selected={ev.startDate ? new Date(ev.startDate) : undefined}
                                onSelect={(date) => updateSportFormEvent(form.id, ev.id, "startDate", date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-slate-500 font-semibold">End Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-800 justify-start text-left font-normal px-3 py-2 h-auto text-sm transition-colors shadow-sm", !ev.endDate && "text-slate-400")}>
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                {ev.endDate ? format(new Date(ev.endDate), "PPP") : <span>Pick date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                              <Calendar
                                mode="single"
                                selected={ev.endDate ? new Date(ev.endDate) : undefined}
                                onSelect={(date) => updateSportFormEvent(form.id, ev.id, "endDate", date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Venue Selection */}
                      <div>
                        <label className="text-xs text-slate-500 font-semibold block mb-1">Venue</label>
                        <div className="relative">
                          <select
                            value={ev.venueId || ""}
                            onChange={e => updateSportFormEvent(form.id, ev.id, "venueId", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none appearance-none font-normal transition-colors"
                          >
                            <option value="">No Venue / Online / Outside</option>
                            {venues.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Config Row 1: Gender & Players Born */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 font-semibold block mb-1">Gender *</label>
                          <div className="relative">
                            <select
                              value={ev.gender}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "gender", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none appearance-none transition-colors"
                            >
                              <option value="ALL">All Genders</option>
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                              <option value="MIXED">Mixed</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-semibold block mb-1">Players Born After *</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant={"outline"} className={cn("w-full bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-800 justify-start text-left font-normal px-3 py-2 h-auto text-sm transition-colors shadow-sm", !ev.playersBorn && "text-slate-400")}>
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                {ev.playersBorn ? format(new Date(ev.playersBorn), "PPP") : <span>Pick date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white" align="start">
                              <Calendar
                                mode="single"
                                selected={ev.playersBorn ? new Date(ev.playersBorn) : undefined}
                                onSelect={(date) => updateSportFormEvent(form.id, ev.id, "playersBorn", date ? format(date, "yyyy-MM-dd") : "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Config Row 2: Format & Player Category Template */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 font-semibold block mb-1">Format *</label>
                          <div className="relative">
                            <select
                              value={ev.tournamentType}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "tournamentType", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none appearance-none transition-colors"
                            >
                              <option value="KNOCKOUT_SINGLE">Knockout (Single Elimination)</option>
                              <option value="KNOCKOUT_DOUBLE">Double Elimination</option>
                              <option value="ROUND_ROBIN">Round Robin</option>
                              <option value="LEAGUE">League</option>
                              <option value="GROUP_PLAYOFF">Group Stage + Playoffs</option>
                              <option value="CUSTOM">Custom Bracket</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-semibold block mb-1">Player Category Template</label>
                          <Popover
                            open={openDropdownEventId === ev.id}
                            onOpenChange={(open) => setOpenDropdownEventId(open ? ev.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openDropdownEventId === ev.id}
                                className="w-full bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-800 justify-between text-left font-normal px-3 py-2 h-auto text-sm truncate shadow-sm"
                              >
                                {selectedTemplates[ev.id]
                                  ? playerCategories.find((cat) => String(cat.id) === selectedTemplates[ev.id])?.name
                                  : "Select Template..."}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0 bg-white border border-slate-200 text-slate-800 shadow-2xl" align="start">
                              <div className="flex items-center border-b border-slate-200 px-3 py-2">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
                                <input
                                  placeholder="Search template..."
                                  value={searchQueries[ev.id] || ""}
                                  onChange={(e) => setSearchQueries(prev => ({ ...prev, [ev.id]: e.target.value }))}
                                  className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-slate-400 border-none text-slate-800"
                                />
                              </div>
                              <div className="max-h-[200px] overflow-y-auto p-1 space-y-0.5">
                                <div
                                  onClick={() => {
                                    setSelectedTemplates(prev => {
                                      const copy = { ...prev };
                                      delete copy[ev.id];
                                      return copy;
                                    });
                                    updateSportFormEvent(form.id, ev.id, "categoryIds", undefined);
                                    setSearchQueries(prev => ({ ...prev, [ev.id]: "" }));
                                    setOpenDropdownEventId(null);
                                  }}
                                  className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-50 text-slate-500 transition-colors"
                                >
                                  <span>Clear Selection</span>
                                  {!selectedTemplates[ev.id] && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                </div>
                                {playerCategories
                                  .filter((cat) => {
                                    const q = (searchQueries[ev.id] || "").toLowerCase();
                                    return (
                                      cat.name.toLowerCase().includes(q) ||
                                      (cat.gender || "").toLowerCase().includes(q) ||
                                      String(cat.minAge).includes(q) ||
                                      String(cat.maxAge).includes(q)
                                    );
                                  })
                                  .map((cat) => {
                                    const isSelected = selectedTemplates[ev.id] === String(cat.id);
                                    return (
                                      <div
                                        key={cat.id}
                                        onClick={() => {
                                          setSelectedTemplates(prev => ({ ...prev, [ev.id]: String(cat.id) }));
                                          updateSportFormEvent(form.id, ev.id, "categoryIds", [cat.id]);
                                          // Autofill age rules if available
                                          if (cat.minAge != null) {
                                            updateSportFormEvent(form.id, ev.id, "minAge", String(cat.minAge));
                                          }
                                          if (cat.maxAge != null) {
                                            updateSportFormEvent(form.id, ev.id, "maxAge", String(cat.maxAge));
                                          }
                                          if (cat.gender) {
                                            updateSportFormEvent(form.id, ev.id, "gender", cat.gender);
                                          }
                                          setSearchQueries(prev => ({ ...prev, [ev.id]: "" }));
                                          setOpenDropdownEventId(null);
                                        }}
                                        className={cn(
                                          "flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-left",
                                          isSelected
                                            ? "bg-indigo-50 text-indigo-600"
                                            : "hover:bg-slate-50 text-slate-600"
                                        )}
                                      >
                                        <div className="flex flex-col gap-0.5">
                                          <span>{cat.name}</span>
                                          <span className="text-[10px] opacity-75 font-normal">
                                            {cat.gender || "All Genders"} • {cat.minAge ?? 0}–{cat.maxAge ?? 99} yrs
                                          </span>
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                      </div>
                                    );
                                  })}
                                {playerCategories.filter((cat) => {
                                  const q = (searchQueries[ev.id] || "").toLowerCase();
                                  return (
                                    cat.name.toLowerCase().includes(q) ||
                                    (cat.gender || "").toLowerCase().includes(q) ||
                                    String(cat.minAge).includes(q) ||
                                    String(cat.maxAge).includes(q)
                                  );
                                }).length === 0 && (
                                  <div className="text-center py-4 text-xs text-slate-400 italic">No matching templates.</div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Config Row 3: Age Rules */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 font-semibold block mb-1">Min Age *</label>
                          <input
                            type="number"
                            value={ev.minAge}
                            onChange={e => updateSportFormEvent(form.id, ev.id, "minAge", e.target.value)}
                            placeholder="e.g. 10"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-semibold block mb-1">Max Age *</label>
                          <input
                            type="number"
                            value={ev.maxAge}
                            onChange={e => updateSportFormEvent(form.id, ev.id, "maxAge", e.target.value)}
                            placeholder="e.g. 70"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                          />
                        </div>
                      </div>

                      {/* Participant Type (Singles, Doubles pills) or Min/Max Players (Teams) */}
                      {!isTeamSport(form.name) ? (
                        <div>
                          <label className="text-xs text-slate-500 font-semibold block mb-1.5">Participant Type *</label>
                          <div className="flex gap-2 flex-wrap">
                            {["SINGLES", "DOUBLES", "MIXED_DOUBLES"].map(formatType => {
                              const list = ev.formats || [];
                              const isSelected = list.includes(formatType);
                              return (
                                <button
                                  key={formatType}
                                  type="button"
                                  onClick={() => {
                                    let next = [...list];
                                    if (isSelected) {
                                      next = next.filter(x => x !== formatType);
                                    } else {
                                      next.push(formatType);
                                    }
                                    updateSportFormEvent(form.id, ev.id, "formats", next);
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 border text-xs font-semibold rounded-full cursor-pointer transition-all",
                                    isSelected
                                      ? "bg-indigo-50 border-indigo-400 text-indigo-600 shadow-sm"
                                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                  )}
                                >
                                  {formatType.replace(/_/g, ' ')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 font-semibold block mb-1">Min Players/Team *</label>
                            <input
                              type="number"
                              value={ev.minPlayers}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "minPlayers", e.target.value)}
                              placeholder="e.g. 5"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 font-semibold block mb-1">Max Players/Team *</label>
                            <input
                              type="number"
                              value={ev.maxPlayers}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "maxPlayers", e.target.value)}
                              placeholder="e.g. 11"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                            />
                          </div>
                        </div>
                      )}

                      {/* ─── Auction-based event (team sports only) ─── */}
                      {isTeamSport(form.name) && (
                        <label className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/40 cursor-pointer hover:bg-amber-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={!!ev.auctionEnabled}
                            onChange={e => updateSportFormEvent(form.id, ev.id, "auctionEnabled", e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-amber-600 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                              <Gavel className="w-3.5 h-3.5" /> Auction-based event
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Mark this team event for a player auction. Teams, budget and bidding are configured later on the Auction screen.
                            </p>
                          </div>
                        </label>
                      )}

                      {/* ─── Event Contact Information ─── */}
                      <div className="pt-3 mt-1 border-t border-slate-200">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Event Contact Information</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 font-semibold block mb-1">Contact Name *</label>
                            <ContactNameAutocomplete
                              value={ev.contactName || ""}
                              onChange={(name) => updateSportFormEvent(form.id, ev.id, "contactName", name)}
                              onSelect={(u) => {
                                updateSportFormEvent(form.id, ev.id, "contactName", u.fullName);
                                updateSportFormEvent(form.id, ev.id, "contactNumber", u.phone);
                                updateSportFormEvent(form.id, ev.id, "contactEmail", u.email);
                              }}
                              placeholder="Type 3+ letters to search members"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 font-semibold block mb-1">Contact Number *</label>
                            <input
                              type="text"
                              value={ev.contactNumber || ""}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "contactNumber", e.target.value)}
                              placeholder="e.g. +91 9876543210"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 font-semibold block mb-1">Contact Email *</label>
                            <input
                              type="email"
                              value={ev.contactEmail || ""}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "contactEmail", e.target.value)}
                              placeholder="e.g. contact@tournament.com"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                            />
                          </div>
                        </div>

                        {/* Other Information (multiple entries) */}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">Other Information (Multiple entries)</span>
                            <button
                              type="button"
                              onClick={() => updateSportFormEvent(form.id, ev.id, "otherContacts", [...(ev.otherContacts || []), { title: "", name: "", detail: "" }])}
                              className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer font-bold border-none bg-transparent"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Contact
                            </button>
                          </div>

                          {(ev.otherContacts || []).length === 0 ? (
                            <div className="text-center py-3 bg-white border border-dashed border-slate-200 rounded-lg text-[11px] text-slate-400">
                              No extra contact information added yet. Click "+ Add Contact" to list volunteers, referees, or co-organizers.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(ev.otherContacts || []).map((contact, cIdx) => (
                                <div key={cIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-white border border-slate-200 rounded-lg text-left">
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Title</label>
                                    <input
                                      value={contact.title}
                                      onChange={e => updateSportFormEvent(form.id, ev.id, "otherContacts", (ev.otherContacts || []).map((c, i) => i === cIdx ? { ...c, title: e.target.value } : c))}
                                      placeholder="e.g. Organizer"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Name</label>
                                    <input
                                      value={contact.name}
                                      onChange={e => updateSportFormEvent(form.id, ev.id, "otherContacts", (ev.otherContacts || []).map((c, i) => i === cIdx ? { ...c, name: e.target.value } : c))}
                                      placeholder="e.g. John Doe"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                                    />
                                  </div>
                                  <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Detail (Number/Email)</label>
                                      <input
                                        value={contact.detail}
                                        onChange={e => updateSportFormEvent(form.id, ev.id, "otherContacts", (ev.otherContacts || []).map((c, i) => i === cIdx ? { ...c, detail: e.target.value } : c))}
                                        placeholder="e.g. john@mail.com"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => updateSportFormEvent(form.id, ev.id, "otherContacts", (ev.otherContacts || []).filter((_, i) => i !== cIdx))}
                                      className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border border-red-200 cursor-pointer mb-0.5"
                                      title="Remove Contact"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add sub-event configuration trigger button */}
                {!form.editingSportId && (
                  <button
                    type="button"
                    onClick={() => addEventToSportForm(form.id)}
                    className="w-full py-2.5 mt-3 border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Event Configuration
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Submission and Save Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetSportForm}
              className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 text-sm font-semibold rounded-lg hover:border-red-500 hover:text-red-500 cursor-pointer transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSportSave}
              disabled={sportSubmitting}
              className="flex-[2] py-3 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                boxShadow: "0 2px 10px rgba(99,102,241,0.3)"
              }}
            >
              {sportSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : (sportForms.some(f => f.editingSportId) ? "Update Event" : "Save Event ↗")}
            </button>
          </div>
        </div>
      )}

      {/* List of active scheduled sports events */}
      <div 
        className="rounded-xl p-6 text-left"
        style={{
          background: "white",
          border: "1px solid rgba(99, 102, 241, 0.12)",
          boxShadow: "rgba(99, 102, 241, 0.06) 0px 2px 12px",
        }}
      >
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2.5">Scheduled Community Events</h3>
        {activeEvents.length === 0 ? (
          <div className="text-center py-10 text-slate-400 italic">No community events scheduled yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {activeEvents.map(e => {
              const iconUrl = e.sport?.iconUrl || e.iconUrl;
              const icon = e.sport?.icon || e.icon || "🏆";
              const startStr = e.eventDateStart ? format(new Date(e.eventDateStart), "MMM d") : "";
              const endStr = e.eventDateEnd ? format(new Date(e.eventDateEnd), "MMM d, yyyy") : "";
              
              return (
                <div key={e.id} className="p-4 rounded-xl transition-all duration-300 flex flex-col justify-between bg-slate-50 border border-slate-200 hover:border-indigo-500/20 shadow-sm">
                  <div className="flex gap-3">
                    {iconUrl ? (
                      <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-white border border-slate-200 shadow-sm">
                        <img src={iconUrl} alt={e.name} className="w-7 h-7 object-cover rounded" />
                      </div>
                    ) : (
                      <span className="text-2xl leading-none">{icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-800 truncate leading-snug">{e.name}</h4>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                          {e.format || "SINGLES"}
                        </span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                          {e.tournamentType ? e.tournamentType.replace(/_/g, ' ') : "KNOCKOUT"}
                        </span>
                        {e.auctionEnabled && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-0.5">
                            <Gavel className="w-2.5 h-2.5" /> Auction
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 mt-4">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{startStr} - {endStr}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{e.gender || "ALL"} • {e.minAge || 10}-{e.maxAge || 70} Yrs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSportEdit(e)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-md transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title="Edit Event"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSportDelete(e.id)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-500 rounded-md transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
