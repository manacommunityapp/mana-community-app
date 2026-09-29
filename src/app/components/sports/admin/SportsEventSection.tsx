import React from "react";
import { Plus, X, Search, Loader2, Trash2, CalendarIcon, Users, Edit2, ChevronDown, Check, Gavel } from "lucide-react";
import { ContactNameAutocomplete } from "./ContactNameAutocomplete";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { Calendar } from "../../ui/calendar";
import { DatePicker } from "../../ui/date-picker";
import { format } from "date-fns";
import { cn } from "../../ui/utils";
import type { SportMeta, PlayerCategory, Venue, SportFormEntry } from "../../../../types/api";
import { PREDEFINED_SPORTS, isTeamSport } from "../utils/sportsConstants";
import { isValidIndianPhone, isValidEmail } from "../sportsValidation";

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
  tournamentStartDate?: Date;
  tournamentEndDate?: Date;
  /** Loads player categories (GET /api/player-categories) — called when the add/update form opens. */
  onLoadCategories?: () => void;
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
  tournamentStartDate,
  tournamentEndDate,
  onLoadCategories,
}: SportsEventSectionProps) {
  const [openDatePickerKey, setOpenDatePickerKey] = React.useState<string | null>(null);

  const isDateDisabled = React.useCallback((date: Date) => {
    if (tournamentStartDate) {
      const minDate = new Date(tournamentStartDate);
      minDate.setHours(0, 0, 0, 0);
      if (date < minDate) return true;
    }
    if (tournamentEndDate) {
      const maxDate = new Date(tournamentEndDate);
      maxDate.setHours(23, 59, 59, 999);
      if (date > maxDate) return true;
    }
    return false;
  }, [tournamentStartDate, tournamentEndDate]);

  // Reload player categories whenever the add/update sports event form is opened,
  // so the Player Category Template dropdown reflects the latest data.
  React.useEffect(() => {
    if (showSportForm) onLoadCategories?.();
  }, [showSportForm, onLoadCategories]);

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="text-left">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">Sports Management</h3>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5">Configure and manage active sports metadata in the system</p>
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
          className="px-3.5 py-2 text-white text-xs sm:text-[13px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-xs hover:brightness-105 shrink-0 self-start sm:self-auto"
          style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            boxShadow: "0 2px 8px rgba(99,102,241,0.25)"
          }}
        >
          <Plus className="w-3.5 h-3.5" /> {showSportForm ? "Close Form" : "Select a Sport"}
        </button>
      </div>

      {/* ─── Sport Picker Modal ─── */}
      {showSportPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="text-left">
                <h2 className="text-sm sm:text-base font-bold text-slate-800">Select a Sport</h2>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Choose from the list below to configure its defaults</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowSportPicker(false); setSportPickerSearch(""); }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={sportPickerSearch}
                  onChange={e => setSportPickerSearch(e.target.value)}
                  placeholder="Search sports..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs sm:text-[13px] text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
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
                        "flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer shadow-2xs",
                        isUnavailable
                          ? "bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed text-slate-400"
                          : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/20 hover:scale-[1.02] hover:shadow-sm"
                      )}
                    >
                       {sp.icon && (sp.icon.startsWith("data:image/") || sp.icon.startsWith("http")) ? (
                         <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-slate-100 border border-slate-200 shadow-2xs">
                           <img src={sp.icon} alt={sp.name} className="w-7 h-7 object-cover rounded" />
                         </div>
                       ) : (
                         <span className="text-2xl leading-none">{sp.icon}</span>
                       )}
                      <span className="text-xs font-semibold leading-tight text-slate-800">{sp.name}</span>
                      {alreadyAdded && (
                        <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Registered</span>
                      )}
                      {alreadyQueued && (
                        <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Queued</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {PREDEFINED_SPORTS.filter(sp => sp.name.toLowerCase().includes(sportPickerSearch.toLowerCase())).length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-500 text-xs sm:text-[13px] mb-3">No predefined sports match your search.</p>
                  <button
                    type="button"
                    onClick={handleCreateCustomSport}
                    disabled={sportSubmitting}
                    className="px-3.5 py-2 text-white text-xs font-semibold rounded-xl border-none cursor-pointer transition-colors flex items-center justify-center gap-1.5 mx-auto shadow-sm hover:brightness-105"
                    style={{
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)"
                    }}
                  >
                    {sportSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Create Custom Sport: "{sportPickerSearch}"
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => { setShowSportPicker(false); setSportPickerSearch(""); }}
                className="px-3.5 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-xl hover:bg-white transition-colors bg-white cursor-pointer shadow-2xs font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Form Section (When showSportForm is active) ─── */}
      {showSportForm && sportForms.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header bar with count and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                {sportForms.some(f => f.editingSportId) ? "Edit Sport Event" : `Configure Sport Events (${sportForms.length})`}
              </h3>
            </div>
            {!sportForms.some(f => f.editingSportId) && (
              <button
                type="button"
                onClick={() => setShowSportPicker(true)}
                className="px-3 py-1.5 text-xs text-indigo-600 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-semibold shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Sport
              </button>
            )}
          </div>

          {/* Sport Form Cards */}
          <div className="space-y-4">
            {sportForms.map((form, idx) => (
              <div
                key={form.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs transition-all text-left space-y-4"
              >
                {/* Sport Header with icon, name, index badge and remove button */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2 flex-1">
                     {form.iconUrl ? (
                       <div className="w-7 h-7 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-white border border-slate-200 shadow-2xs">
                         <img src={form.iconUrl} alt={form.name} className="w-6 h-6 object-cover rounded" />
                       </div>
                     ) : (
                       <span className="text-xl leading-none">{form.icon || "🏆"}</span>
                     )}
                    <div className="flex-1 min-w-0">
                      <label className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Sport {idx + 1}</label>
                      <h4 className="text-xs sm:text-[13px] font-bold text-slate-800 truncate">{form.name}</h4>
                    </div>
                  </div>
                  {!form.editingSportId && sportForms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSportForm(form.id)}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors border border-slate-200 hover:border-red-300 bg-white cursor-pointer shadow-2xs"
                      title="Remove this sport"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Event Configurations */}
                <div className="space-y-3">
                  {form.events.map((ev, eIdx) => (
                    <div
                      key={ev.id}
                      className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 space-y-3 relative shadow-2xs"
                    >
                      {/* Event header */}
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                        <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Configuration #{eIdx + 1}</span>
                        {form.events.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEventFromSportForm(form.id, ev.id)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            title="Remove event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Event Name */}
                      <div>
                        <label className="text-xs text-slate-600 font-semibold block mb-1">Event Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={ev.eventName}
                          onChange={e => updateSportFormEvent(form.id, ev.id, "eventName", e.target.value)}
                          maxLength={150}
                          placeholder="e.g. Men's Singles Open"
                          className={`w-full bg-white border rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-2xs ${
                            !ev.eventName.trim() ? "border-red-300" : "border-slate-200"
                          }`}
                        />
                      </div>

                      {/* Start Date & End Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-slate-600 font-semibold">Start Date <span className="text-red-500">*</span></label>
                          <DatePicker
                            value={ev.startDate}
                            onChange={(v) => updateSportFormEvent(form.id, ev.id, "startDate", v)}
                            placeholder="Pick start date"
                            size="sm"
                          />
                          {!ev.startDate && (
                            <span className="text-[10px] text-red-500 font-medium">Start Date is required</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-slate-600 font-semibold">End Date <span className="text-red-500">*</span></label>
                          <DatePicker
                            value={ev.endDate}
                            min={ev.startDate || undefined}
                            onChange={(v) => updateSportFormEvent(form.id, ev.id, "endDate", v)}
                            placeholder="Pick end date"
                            size="sm"
                          />
                          {!ev.endDate && (
                            <span className="text-[10px] text-red-500 font-medium">End Date is required</span>
                          )}
                          {Boolean(ev.endDate && ev.startDate && new Date(ev.endDate) < new Date(ev.startDate)) && (
                            <span className="text-[10px] text-red-500 font-medium">End Date cannot be before Start Date</span>
                          )}
                        </div>
                      </div>

                      {/* Venue Selection */}
                      <div>
                        <label className="text-xs text-slate-600 font-semibold block mb-1">Venue</label>
                        <div className="relative">
                          <select
                            value={ev.venueId || ""}
                            onChange={e => updateSportFormEvent(form.id, ev.id, "venueId", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none font-normal transition-all shadow-2xs cursor-pointer"
                          >
                            <option value="">No Venue / Online / Outside</option>
                            {venues.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* Config Row 1: Gender & Format */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-600 font-semibold block mb-1">Gender <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <select
                              value={ev.gender}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "gender", e.target.value)}
                              className={`w-full bg-white border rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all shadow-2xs cursor-pointer ${
                                !ev.gender ? "border-red-300" : "border-slate-200"
                              }`}
                            >
                              <option value="" disabled>Select Gender...</option>
                              <option value="ALL">All Genders</option>
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                              <option value="MIXED">Mixed</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 font-semibold block mb-1">Tournament Format <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <select
                              value={ev.tournamentType || ""}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "tournamentType", e.target.value)}
                              className={`w-full bg-white border rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all shadow-2xs cursor-pointer ${
                                !ev.tournamentType ? "border-red-300" : "border-slate-200"
                              }`}
                            >
                              <option value="" disabled>Select Format...</option>
                              <option value="KNOCKOUT_SINGLE">Knockout (Single Elimination)</option>
                              <option value="KNOCKOUT_DOUBLE">Double Elimination</option>
                              <option value="ROUND_ROBIN">Round Robin</option>
                              <option value="LEAGUE">League</option>
                              <option value="GROUP_PLAYOFF">Group Stage + Playoffs</option>
                              <option value="CUSTOM">Custom Bracket</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Config Row 2: Player Category Template & Players Born After */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-600 font-semibold block mb-1">Category Template <span className="text-red-500">*</span></label>
                          <Popover
                            open={openDropdownEventId === ev.id}
                            onOpenChange={(open) => setOpenDropdownEventId(open ? ev.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openDropdownEventId === ev.id}
                                className={cn(
                                  "w-full bg-white hover:bg-slate-50 hover:text-slate-800 text-slate-800 justify-between text-left font-normal px-3 py-2 h-auto text-xs sm:text-[13px] truncate rounded-xl shadow-2xs",
                                  selectedTemplates[ev.id] ? "border-slate-200" : "border-red-300"
                                )}
                              >
                                {selectedTemplates[ev.id]
                                  ? playerCategories.find((cat) => String(cat.id) === selectedTemplates[ev.id])?.name
                                  : "Select Template..."}
                                <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] sm:w-[320px] p-0 bg-white border border-slate-200 text-slate-800 shadow-xl rounded-xl" align="start">
                              <div className="flex items-center border-b border-slate-100 px-3 py-2">
                                <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-50 text-slate-400" />
                                <input
                                  placeholder="Search template..."
                                  value={searchQueries[ev.id] || ""}
                                  onChange={(e) => setSearchQueries(prev => ({ ...prev, [ev.id]: e.target.value }))}
                                  className="h-7 w-full bg-transparent text-xs sm:text-[13px] outline-none placeholder:text-slate-400 border-none text-slate-800"
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
                                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-50 text-slate-500 transition-colors"
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
                                            const bornAfterYear = new Date().getFullYear() - cat.maxAge;
                                            updateSportFormEvent(form.id, ev.id, "playersBorn", `${bornAfterYear}-01-01`);
                                          }
                                          if (cat.gender) {
                                            updateSportFormEvent(form.id, ev.id, "gender", cat.gender);
                                          }
                                          setSearchQueries(prev => ({ ...prev, [ev.id]: "" }));
                                          setOpenDropdownEventId(null);
                                        }}
                                        className={cn(
                                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors text-left",
                                          isSelected
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "hover:bg-slate-50 text-slate-700"
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
                        <div>
                          <label className="text-xs text-slate-600 font-semibold block mb-1">Players Born After <span className="text-red-500">*</span></label>
                          <DatePicker
                            value={ev.playersBorn}
                            onChange={(v) => updateSportFormEvent(form.id, ev.id, "playersBorn", v)}
                            placeholder="Pick born after date"
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Config Row 3: Age Rules */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-600 font-semibold block mb-1">Min Age <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            value={ev.minAge}
                            onChange={e => updateSportFormEvent(form.id, ev.id, "minAge", e.target.value)}
                            placeholder="e.g. 10"
                            className={`w-full bg-white border rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-2xs ${
                              !ev.minAge?.trim() ? "border-red-300" : "border-slate-200"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 font-semibold block mb-1">Max Age <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            value={ev.maxAge}
                            onChange={e => updateSportFormEvent(form.id, ev.id, "maxAge", e.target.value)}
                            placeholder="e.g. 70"
                            className={`w-full bg-white border rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-2xs ${
                              !ev.maxAge?.trim() ? "border-red-300" : "border-slate-200"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Participant Type (Singles, Doubles pills) or Min/Max Players (Teams) */}
                      {!isTeamSport(form.name) ? (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs text-slate-600 font-semibold">Participant Formats <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold cursor-pointer select-none">
                                <span>Approval</span>
                                <input
                                  type="checkbox"
                                  checked={ev.adminApprovalRequired !== false}
                                  onChange={e => updateSportFormEvent(form.id, ev.id, "adminApprovalRequired", e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                />
                              </label>
                              {ev.formats && ev.formats.includes("MIXED_DOUBLES") && (
                                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold cursor-pointer select-none" title="Strict Mixed Doubles (Requires 1 Male + 1 Female)">
                                  <span>Strict 1M+1F</span>
                                  <input
                                    type="checkbox"
                                    checked={ev.mandatoryMixedDoubles !== false}
                                    onChange={e => updateSportFormEvent(form.id, ev.id, "mandatoryMixedDoubles", e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                          <div className={`flex gap-2 flex-wrap rounded-xl transition-all ${
                            !ev.formats || ev.formats.length === 0 ? "border border-red-300 p-1.5" : ""
                          }`}>
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
                                    "px-3 py-1 border text-xs font-semibold rounded-full cursor-pointer transition-all shadow-2xs",
                                    isSelected
                                      ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-xs"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                  )}
                                >
                                  {formatType.replace(/_/g, ' ')}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-600 font-semibold block mb-1">Min Players/Team <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              value={ev.minPlayers}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "minPlayers", e.target.value)}
                              placeholder="e.g. 5"
                              className={`w-full bg-white border rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-2xs ${
                                !ev.minPlayers || parseInt(ev.minPlayers) <= 0 ? "border-red-300" : "border-slate-200"
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 font-semibold block mb-1">Max Players/Team <span className="text-red-500">*</span></label>
                            <input
                              type="number"
                              value={ev.maxPlayers}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "maxPlayers", e.target.value)}
                              placeholder="e.g. 11"
                              className={`w-full bg-white border rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-2xs ${
                                !ev.maxPlayers || parseInt(ev.maxPlayers) <= 0 ? "border-red-300" : "border-slate-200"
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      {/* ─── Auction-based event (team sports only) ─── */}
                      {isTeamSport(form.name) && (
                        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/50 cursor-pointer hover:bg-amber-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={!!ev.auctionEnabled}
                            onChange={e => updateSportFormEvent(form.id, ev.id, "auctionEnabled", e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-amber-600 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-amber-900">
                              <Gavel className="w-3.5 h-3.5 text-amber-700" /> Auction-based event
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                              Mark this team event for player auction. Teams, budget and bidding are configured on the Auction screen.
                            </p>
                          </div>
                        </label>
                      )}

                      {/* ─── Event Contact Information ─── */}
                      <div className="pt-3 mt-1 border-t border-slate-200/80">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Event Contact Information</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-xs text-slate-600 font-semibold block mb-1">Contact Name <span className="text-red-500">*</span></label>
                            <ContactNameAutocomplete
                              value={ev.contactName || ""}
                              onChange={(name) => updateSportFormEvent(form.id, ev.id, "contactName", name)}
                              onSelect={(u) => {
                                updateSportFormEvent(form.id, ev.id, "contactName", u.fullName);
                                updateSportFormEvent(form.id, ev.id, "contactNumber", u.phone);
                                updateSportFormEvent(form.id, ev.id, "contactEmail", u.email);
                              }}
                              placeholder="Search member..."
                              className={`w-full bg-white border rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-2xs ${
                                !ev.contactName?.trim() ? "border-red-300" : "border-slate-200"
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 font-semibold block mb-1">Contact Number <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={ev.contactNumber || ""}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "contactNumber", e.target.value)}
                              placeholder="e.g. +91 9876543210"
                              className={`w-full bg-white border rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-2xs ${
                                !ev.contactNumber?.trim() || !isValidIndianPhone(ev.contactNumber) ? "border-red-300" : "border-slate-200"
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 font-semibold block mb-1">Contact Email <span className="text-red-500">*</span></label>
                            <input
                              type="email"
                              value={ev.contactEmail || ""}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "contactEmail", e.target.value)}
                              placeholder="e.g. contact@sports.com"
                              className={`w-full bg-white border rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-2xs ${
                                !ev.contactEmail?.trim() || !isValidEmail(ev.contactEmail) ? "border-red-300" : "border-slate-200"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Other Information (multiple entries) */}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">Other Contacts / Volunteers</span>
                            <button
                              type="button"
                              onClick={() => updateSportFormEvent(form.id, ev.id, "otherContacts", [...(ev.otherContacts || []), { title: "", name: "", detail: "" }])}
                              className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer font-bold border-none bg-transparent"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Contact
                            </button>
                          </div>

                          {(ev.otherContacts || []).length === 0 ? (
                            <div className="text-center py-2.5 bg-white border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400">
                              No extra contact information added yet.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(ev.otherContacts || []).map((contact, cIdx) => (
                                <div key={cIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-left shadow-2xs">
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Title</label>
                                    <input
                                      value={contact.title}
                                      onChange={e => updateSportFormEvent(form.id, ev.id, "otherContacts", (ev.otherContacts || []).map((c, i) => i === cIdx ? { ...c, title: e.target.value } : c))}
                                      placeholder="e.g. Referee"
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
                                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Number / Email</label>
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
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border border-red-200 cursor-pointer mb-0.5 shrink-0"
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
                    className="w-full py-2 border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Event Configuration
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Submission and Save Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={resetSportForm}
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs sm:text-[13px] font-semibold rounded-xl hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSportSave}
              disabled={sportSubmitting}
              className="flex-[2] py-2.5 text-white text-xs sm:text-[13px] font-semibold rounded-xl border-none cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm hover:brightness-105"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                boxShadow: "0 2px 8px rgba(99,102,241,0.25)"
              }}
            >
              {sportSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</> : (sportForms.some(f => f.editingSportId) ? "Update Event" : "Save Event ↗")}
            </button>
          </div>
        </div>
      )}

      {/* List of active scheduled sports events or Clean Select a Sport empty state */}
      <div 
        className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-left shadow-xs"
      >
        {activeEvents.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50/60 rounded-xl border border-dashed border-indigo-200/80">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3 text-xl shadow-2xs">
              🏆
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-800 mb-1">No Sports Events Configured</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              There are no sports events configured yet. Select a sport from the list to get started.
            </p>
            <button
              type="button"
              onClick={() => {
                resetSportForm();
                setShowSportPicker(true);
              }}
              className="px-4 py-2 text-white text-xs sm:text-[13px] font-semibold rounded-xl border-none cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm hover:brightness-105"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                boxShadow: "0 2px 8px rgba(99,102,241,0.25)"
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Select a Sport
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Scheduled Community Events ({activeEvents.length})</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeEvents.map(e => {
              const iconUrl = e.sport?.iconUrl || e.iconUrl;
              const icon = e.sport?.icon || e.icon || "🏆";
              const startStr = e.eventDateStart ? format(new Date(e.eventDateStart), "MMM d") : "";
              const endStr = e.eventDateEnd ? format(new Date(e.eventDateEnd), "MMM d, yyyy") : "";
              
              return (
                <div key={e.id} className={cn("p-4 rounded-xl transition-all duration-200 flex flex-col justify-between border shadow-2xs", e.active !== false ? "bg-white border-slate-200/90 hover:border-indigo-400 hover:shadow-xs" : "bg-slate-50 border-slate-200/60 opacity-75")}>
                  <div className="flex gap-3">
                    {iconUrl ? (
                      <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-slate-50 border border-slate-200 shadow-2xs">
                        <img src={iconUrl} alt={e.name} className="w-7 h-7 object-cover rounded" />
                      </div>
                    ) : (
                      <span className="text-2xl leading-none">{icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-[13px] font-bold text-slate-800 truncate leading-snug">
                        {e.name}
                        {e.tournament?.name && (
                          <span className="font-medium text-slate-500"> ({e.tournament.name})</span>
                        )}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-1 mt-2">
                        {e.active !== false ? (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                            Active
                          </span>
                        ) : (
                          <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                            Closed
                          </span>
                        )}
                        {e.status && (
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border",
                            e.status === "REGISTRATION_OPEN"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : e.status === "LIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : e.status === "COMPLETED"
                                  ? "bg-slate-100 text-slate-600 border-slate-200"
                                  : e.status === "CANCELLED"
                                    ? "bg-red-50 text-red-600 border-red-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                          )}>
                            {e.status.replace(/_/g, ' ')}
                          </span>
                        )}
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                          {e.format || "SINGLES"}
                        </span>
                        <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                          {e.tournamentType ? e.tournamentType.replace(/_/g, ' ') : "KNOCKOUT"}
                        </span>
                        {e.auctionEnabled && (
                          <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-0.5">
                            <Gavel className="w-2.5 h-2.5" /> Auction
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{startStr} - {endStr}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{e.gender || "ALL"} • {e.minAge || 10}-{e.maxAge || 70} Yrs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSportEdit(e)}
                      className="p-1.5 hover:bg-indigo-50 text-slate-500 hover:text-indigo-700 rounded-lg transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title="Edit Event"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSportDelete(e.id)}
                      className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1 text-xs font-semibold"
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
        </>
      )}
      </div>
    </div>
  );
}


