import React from "react";
import { X, Trash2, Search, ChevronDown, Check, CalendarIcon } from "lucide-react";
import { cn } from "../../ui/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Button } from "../../ui/button";
import { Calendar } from "../../ui/calendar";
import { format } from "date-fns";
import type { PlayerCategory } from "../../../../types/api";
import type { SelectedSportWithEvents } from "../types";

interface SportEventConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  configuringSportId: number | null;
  selectedSportsWithEvents: SelectedSportWithEvents[];
  addEventToSport: (sportId: number) => void;
  removeEvent: (sportId: number, eventId: string) => void;
  updateEventField: (sportId: number, eventId: string, field: any, value: any) => void;
  playerCategories: PlayerCategory[];
}

const isTeamSport = (sportName: string): boolean => {
  const name = sportName.toLowerCase();
  return (
    name.includes("cricket") ||
    name.includes("football") ||
    name.includes("volleyball") ||
    name.includes("basketball") ||
    name.includes("kabaddi") ||
    name.includes("hockey") ||
    name.includes("soccer") ||
    name.includes("throwball") ||
    name.includes("rugby")
  );
};

export const SportEventConfigModal: React.FC<SportEventConfigModalProps> = ({
  isOpen,
  onClose,
  configuringSportId,
  selectedSportsWithEvents,
  addEventToSport,
  removeEvent,
  updateEventField,
  playerCategories,
}) => {
  const [selectedTemplates, setSelectedTemplates] = React.useState<Record<string, string>>({});
  const [openDropdownEventId, setOpenDropdownEventId] = React.useState<string | null>(null);
  const [searchQueries, setSearchQueries] = React.useState<Record<string, string>>({});
  const [openDatePickerId, setOpenDatePickerId] = React.useState<string | null>(null);

  if (!isOpen || configuringSportId === null) return null;

  const configuringSport = selectedSportsWithEvents.find(s => s.sportId === configuringSportId);
  if (!configuringSport) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-left animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            {configuringSport.sportIconUrl ? (
              <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-indigo-50 border border-indigo-100 shadow-sm">
                <img src={configuringSport.sportIconUrl} alt={configuringSport.sportName} className="w-7 h-7 object-cover rounded" />
              </div>
            ) : (
              <span className="text-2xl leading-none">{configuringSport.sportIcon || "🏆"}</span>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {configuringSport.sportName} Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure sport events and match categories
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer text-base"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 #f8fafc" }}>
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
              Event Configurations ({configuringSport.events.length})
            </h3>
            <button
              type="button"
              onClick={() => addEventToSport(configuringSport.sportId)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              + Add Event
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {configuringSport.events.map((ev, index) => {
              const isTeam = isTeamSport(configuringSport.sportName);

              return (
                <div key={ev.id} className="p-5 border border-slate-200 bg-slate-50 rounded-xl space-y-4 relative text-left">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Event #{index + 1}</span>
                    {configuringSport.events.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEvent(configuringSport.sportId, ev.id)}
                        className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-colors cursor-pointer bg-transparent border-none"
                        title="Remove Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Event Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500 font-semibold">Event Name *</label>
                    <input
                      type="text"
                      value={ev.name}
                      onChange={e => updateEventField(configuringSport.sportId, ev.id, "name", e.target.value)}
                      placeholder="e.g. Men's Singles Open"
                      className={cn(
                        "w-full bg-white border rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none placeholder-slate-400 transition-colors",
                        !ev.name.trim() ? "border-red-300" : "border-slate-200"
                      )}
                    />
                    {!ev.name.trim() && (
                      <span className="text-[10px] text-red-500 font-medium">Event Name is required</span>
                    )}
                  </div>

                  {/* Auto-fill Category Template Searchable Select */}
                  <div className="flex flex-col gap-1 relative">
                    <label className="text-xs text-slate-500 font-semibold">Auto-fill Category Template</label>
                    
                    {/* Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setOpenDropdownEventId(openDropdownEventId === ev.id ? null : ev.id)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 outline-none flex items-center justify-between cursor-pointer text-left transition-colors"
                    >
                      <span className="truncate">
                        {(() => {
                          const selId = selectedTemplates[ev.id];
                          const sel = playerCategories.find(c => String(c.id) === selId);
                          return sel ? `${sel.name} (${sel.gender}, Age: ${sel.minAge}-${sel.maxAge})` : "-- Search & Select Template --";
                        })()}
                      </span>
                      <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", openDropdownEventId === ev.id && "rotate-180")} />
                    </button>

                    {/* Searchable Dropdown Overlay */}
                    {openDropdownEventId === ev.id && (
                      <>
                        {/* Overlay backdrop to close */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => {
                            setOpenDropdownEventId(null);
                            setSearchQueries(prev => ({ ...prev, [ev.id]: "" }));
                          }} 
                        />
                        
                        {/* Dropdown Card */}
                        <div className="absolute top-[100%] left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={searchQueries[ev.id] || ""}
                              onChange={e => setSearchQueries(prev => ({ ...prev, [ev.id]: e.target.value }))}
                              placeholder="Search templates..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 outline-none placeholder-slate-400 transition-colors"
                              autoFocus
                            />
                          </div>

                          {/* List of Options */}
                          <div className="max-h-48 overflow-y-auto space-y-0.5 flex flex-col">
                            {(() => {
                                const query = (searchQueries[ev.id] || "").toLowerCase();
                                const filtered = playerCategories.filter(c => 
                                  c.name.toLowerCase().includes(query) ||
                                  (c.gender || "").toLowerCase().includes(query) ||
                                  String(c.minAge).includes(query) ||
                                  String(c.maxAge).includes(query)
                                );

                                if (filtered.length === 0) {
                                  return (
                                    <div className="text-center py-4 text-xs text-slate-400 italic">
                                      No templates match your search
                                    </div>
                                  );
                                }

                                return filtered.map(c => {
                                  const isSelected = selectedTemplates[ev.id] === String(c.id);
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => {
                                        const catId = String(c.id);
                                        setSelectedTemplates(prev => ({ ...prev, [ev.id]: catId }));
                                        setSearchQueries(prev => ({ ...prev, [ev.id]: "" }));
                                        setOpenDropdownEventId(null);

                                        updateEventField(configuringSport.sportId, ev.id, "gender", c.gender || "ALL");
                                        if (c.minAge) updateEventField(configuringSport.sportId, ev.id, "minAge", c.minAge);
                                        if (c.maxAge) updateEventField(configuringSport.sportId, ev.id, "maxAge", c.maxAge);
                                      }}
                                      className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer hover:bg-slate-50",
                                        isSelected ? "bg-indigo-50 text-indigo-600 font-semibold" : "text-slate-600"
                                      )}
                                    >
                                      <span className="truncate">
                                        {c.name} ({c.gender}, Age: {c.minAge}-{c.maxAge})
                                      </span>
                                      {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600" />}
                                    </button>
                                  );
                                });
                            })()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Gender and Format */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs text-slate-500 font-semibold">Gender</label>
                      <div className="relative">
                        <select
                          value={ev.gender}
                          onChange={e => updateEventField(configuringSport.sportId, ev.id, "gender", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none appearance-none cursor-pointer transition-colors"
                        >
                          <option value="ALL">All (Co-Ed)</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="MIXED">Mixed</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs text-slate-500 font-semibold">Choose Format *</label>
                      <div className="relative">
                        <select
                          value={ev.tournamentType || ""}
                          onChange={e => updateEventField(configuringSport.sportId, ev.id, "tournamentType", e.target.value)}
                          className={cn(
                            "w-full bg-white border rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none appearance-none cursor-pointer transition-colors",
                            !ev.tournamentType ? "border-red-300" : "border-slate-200"
                          )}
                        >
                          <option value="" disabled>Select Format...</option>
                          <option value="ROUND_ROBIN">Round Robin</option>
                          <option value="KNOCKOUT_SINGLE">Knockout (Single)</option>
                          <option value="KNOCKOUT_DOUBLE">Knockout (Double)</option>
                          <option value="GROUP_PLAYOFF">Group Playoff</option>
                          <option value="CUSTOM">Custom</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                      {!ev.tournamentType && (
                        <span className="text-[10px] text-red-500 font-medium">Format is required</span>
                      )}
                    </div>
                  </div>

                  {/* Players Born */}
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs text-slate-500 font-semibold">Players Born After</label>
                    <Popover open={openDatePickerId === ev.id} onOpenChange={(open) => setOpenDatePickerId(open ? ev.id : null)}>
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
                          onSelect={(date) => {
                            updateEventField(configuringSport.sportId, ev.id, "playersBorn", date ? format(date, "yyyy-MM-dd") : "");
                            setOpenDatePickerId(null);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Match Format / Team Settings */}
                  {isTeam ? (
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 font-semibold">Min Players *</label>
                        <input
                          type="number"
                          value={ev.minPlayers || ""}
                          onChange={e => updateEventField(configuringSport.sportId, ev.id, "minPlayers", e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g. 11"
                          className={cn(
                            "w-full bg-white border rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors",
                            !ev.minPlayers ? "border-red-300" : "border-slate-200"
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 font-semibold">Max Players *</label>
                        <input
                          type="number"
                          value={ev.maxPlayers || ""}
                          onChange={e => updateEventField(configuringSport.sportId, ev.id, "maxPlayers", e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="e.g. 15"
                          className={cn(
                            "w-full bg-white border rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none transition-colors",
                            !ev.maxPlayers ? "border-red-300" : "border-slate-200"
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-xs text-slate-500 font-semibold">Participant Type</label>
                      <div className="relative">
                        <select
                          value={ev.format || "SINGLES"}
                          onChange={e => updateEventField(configuringSport.sportId, ev.id, "format", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 outline-none appearance-none cursor-pointer transition-colors"
                        >
                          <option value="SINGLES">Singles</option>
                          <option value="DOUBLES">Doubles</option>
                          <option value="MIXED_DOUBLES">Mixed Doubles</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0 rounded-b-2xl gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-none flex items-center gap-1.5"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              boxShadow: "0 2px 10px rgba(99,102,241,0.3)"
            }}
          >
            <span>💾</span> Save & Apply Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
