import { useState, useEffect, useMemo } from "react";
import { Trophy, Calendar, ChevronDown, Check, Loader2 } from "lucide-react";
import { tournamentService, type ConfigInfo, type EventInfo, type TournamentDropdownItem } from "../../../../services/sports/tournamentService";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../ui/command";

interface TournamentEventSelectorProps {
  onConfigIdChange: (configId: number) => void;
  initialConfigId?: number;
}

export function TournamentEventSelector({ onConfigIdChange, initialConfigId }: TournamentEventSelectorProps) {
  const [tournamentConfigs, setTournamentConfigs] = useState<ConfigInfo[]>([]);
  const [tournaments, setTournaments] = useState<TournamentDropdownItem[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [tournamentPickerOpen, setTournamentPickerOpen] = useState(false);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      tournamentService.getConfigs().catch(() => [] as ConfigInfo[]),
      tournamentService.getTournamentsForDropdown().catch(() => [] as TournamentDropdownItem[]),
      tournamentService.getEventsForDropdown().catch(() => [] as EventInfo[]),
    ]).then(([configs, tourns, evts]) => {
      if (cancelled) return;
      setTournamentConfigs(configs);
      setTournaments(tourns);
      setEvents(evts);
      setLoading(false);

      if (initialConfigId && initialConfigId > 0) {
        const cfg = configs.find(c => c.id === initialConfigId);
        if (cfg) {
          const evt = evts.find(e => Number(e.id) === cfg.eventId);
          if (evt?.tournamentId) setSelectedTournamentId(Number(evt.tournamentId));
          setSelectedEventId(cfg.eventId);
        }
      }
    });
    return () => { cancelled = true; };
  }, [initialConfigId]);

  const tournamentOptions = useMemo(() => {
    return tournaments.map(t => {
      const name = t.name?.trim() || "";
      const relatedEvents = events.filter(e =>
        (e.tournamentId != null && Number(e.tournamentId) === Number(t.id)) ||
        (e.tournamentName?.trim().toLowerCase() === name.toLowerCase())
      );
      const eventIds = new Set(relatedEvents.map(e => Number(e.id)));
      const configs = tournamentConfigs.filter(c => eventIds.has(Number(c.eventId)));
      const sports = Array.from(new Set(relatedEvents.map(e => e.sportName).filter(Boolean)));
      return {
        id: Number(t.id),
        name,
        relatedEvents,
        configs,
        sports,
        searchValue: [name, ...relatedEvents.map(e => e.name), ...sports].filter(Boolean).join(" "),
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [tournaments, events, tournamentConfigs]);

  const selectedTournamentName = useMemo(() => {
    return tournamentOptions.find(o => o.id === selectedTournamentId)?.name || "";
  }, [tournamentOptions, selectedTournamentId]);

  const filteredEvents = useMemo(() => {
    if (!selectedTournamentId) return events;
    return tournamentOptions.find(o => o.id === selectedTournamentId)?.relatedEvents || [];
  }, [events, tournamentOptions, selectedTournamentId]);

  const selectedEventName = useMemo(() => {
    return events.find(e => Number(e.id) === selectedEventId)?.name || "";
  }, [events, selectedEventId]);

  const resolvedConfigId = useMemo(() => {
    if (selectedEventId) {
      const cfg = tournamentConfigs.find(c => Number(c.eventId) === selectedEventId);
      if (cfg) return cfg.id;
    }
    if (selectedTournamentId) {
      const option = tournamentOptions.find(o => o.id === selectedTournamentId);
      if (option?.configs.length) return option.configs[0].id;
    }
    return tournamentConfigs[0]?.id ?? 0;
  }, [selectedEventId, selectedTournamentId, tournamentConfigs, tournamentOptions]);

  useEffect(() => {
    if (resolvedConfigId > 0) {
      onConfigIdChange(resolvedConfigId);
    }
  }, [resolvedConfigId, onConfigIdChange]);

  const resolvedConfig = tournamentConfigs.find(c => c.id === resolvedConfigId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading tournaments...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {/* Tournament dropdown */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider truncate">
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">Tournament</span>
          </label>
          <Popover open={tournamentPickerOpen} onOpenChange={setTournamentPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                role="combobox"
                aria-expanded={tournamentPickerOpen}
                className="flex w-full items-center justify-between gap-1.5 sm:gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-left text-xs sm:text-sm font-semibold text-slate-900 shadow-xs outline-none transition-all hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 min-w-0"
              >
                <span className={`min-w-0 truncate ${selectedTournamentName ? "text-slate-900" : "text-slate-500"}`}>
                  {selectedTournamentName || "Select Tournament"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="z-[80] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl">
              <Command>
                <CommandInput placeholder="Search tournaments..." />
                <CommandList>
                  <CommandEmpty className="px-3 py-6 text-center text-xs text-slate-500">No matching tournaments.</CommandEmpty>
                  <CommandGroup>
                    {tournamentOptions.map(option => (
                      <CommandItem
                        key={option.id}
                        value={option.searchValue}
                        onSelect={() => {
                          setSelectedTournamentId(option.id);
                          setSelectedEventId(null);
                          setTournamentPickerOpen(false);
                        }}
                        className="cursor-pointer px-3 py-2.5 aria-selected:bg-indigo-50"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-2.5">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <Trophy className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold text-slate-900">{option.name}</span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                              {option.sports.length > 0 && <span>{option.sports.join(", ")}</span>}
                              <span>{option.relatedEvents.length} event(s)</span>
                              <span>{option.configs.length} config(s)</span>
                            </span>
                          </span>
                        </div>
                        {selectedTournamentId === option.id && <Check className="h-4 w-4 shrink-0 text-indigo-600" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Event / Sport dropdown */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider truncate">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600 shrink-0" />
            <span className="truncate">Event / Sport</span>
          </label>
          <Popover open={eventPickerOpen} onOpenChange={setEventPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                role="combobox"
                aria-expanded={eventPickerOpen}
                className="flex w-full items-center justify-between gap-1.5 sm:gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-left text-xs sm:text-sm font-semibold text-slate-900 shadow-xs outline-none transition-all hover:bg-white focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 min-w-0"
              >
                <span className={`min-w-0 truncate ${selectedEventName ? "text-slate-900" : "text-slate-500"}`}>
                  {selectedEventName || "Select Event / Sport"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="z-[80] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl">
              <Command>
                <CommandInput placeholder="Search events, sports..." />
                <CommandList>
                  <CommandEmpty className="px-3 py-6 text-center text-xs text-slate-500">
                    {selectedTournamentId ? "No events in this tournament." : "Select a tournament first."}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredEvents.map(evt => {
                      const config = tournamentConfigs.find(c => Number(c.eventId) === Number(evt.id));
                      const sport = evt.sportName || config?.sportName || "";
                      const format = config?.tournamentType || "";
                      const teams = Number(evt.totalTeams ?? config?.totalTeams) || 0;
                      return (
                        <CommandItem
                          key={evt.id}
                          value={[evt.name, sport, format, evt.tournamentName].filter(Boolean).join(" ")}
                          onSelect={() => {
                            setSelectedEventId(Number(evt.id));
                            setEventPickerOpen(false);
                          }}
                          className="cursor-pointer px-3 py-2.5 aria-selected:bg-sky-50"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-2.5">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                              <Calendar className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-bold text-slate-900">{evt.name}</span>
                              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                                {sport && <span>{sport}</span>}
                                {format && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{format.replace(/_/g, " ")}</span>}
                                {teams > 0 && <span>{teams} teams</span>}
                              </span>
                            </span>
                          </div>
                          {selectedEventId === Number(evt.id) && <Check className="h-4 w-4 shrink-0 text-sky-600" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active config info badge */}
      {resolvedConfig && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 bg-indigo-50/60 border border-indigo-100 rounded-lg px-3 py-2">
          <span className="font-bold text-indigo-700">Active Config:</span>
          <span className="font-semibold text-slate-800">{resolvedConfig.tournamentName}</span>
          <span className="text-slate-400">|</span>
          <span>{resolvedConfig.eventName}</span>
          <span className="text-slate-400">|</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">{resolvedConfig.tournamentType?.replace(/_/g, " ")}</span>
          <span className="text-slate-400">|</span>
          <span>{resolvedConfig.totalTeams} teams</span>
          <span className="ml-auto text-[10px] text-slate-400">ID: {resolvedConfig.id}</span>
        </div>
      )}
    </div>
  );
}
