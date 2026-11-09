import React from "react";
import { Plus, X, Search, Loader2, Trash2, CalendarIcon, Users, Edit2, ChevronDown, Check, Gavel, CheckCircle2, Layers, Trophy, AlertCircle, Crown } from "lucide-react";
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
  handleSportPickerSelect: (sport: { name: string; icon: string; iconUrl?: string }) => void;
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
  /** Refreshes sports metadata (GET /api/sports/meta) — called when opening the sport picker modal. */
  onLoadConfig?: () => void;
  activeTournamentId?: number | null;
  activeTournamentName?: string | null;
  activeTournaments?: any[];
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
  onLoadConfig,
  activeTournamentId,
  activeTournamentName,
  activeTournaments,
}: SportsEventSectionProps) {
  const [openDatePickerKey, setOpenDatePickerKey] = React.useState<string | null>(null);

  // Filters for Scheduled Community Events
  const [selectedSportFilter, setSelectedSportFilter] = React.useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string>("");
  const [selectedAgeCategoryFilter, setSelectedAgeCategoryFilter] = React.useState<string>("");
  const [selectedGenderFilter, setSelectedGenderFilter] = React.useState<string>("");

  const getEventSportName = React.useCallback((e: any): string => {
    if (e.sport?.name) return e.sport.name;
    if (e.sportName) return e.sportName;
    if (e.sportId) {
      const found = sportsMeta.find(s => s.id === e.sportId || s.id === e.sport?.id);
      if (found?.name) return found.name;
    }
    const eventNameLower = (e.name || "").toLowerCase();
    for (const sm of sportsMeta) {
      if (sm.name && eventNameLower.includes(sm.name.toLowerCase())) {
        return sm.name;
      }
    }
    for (const ps of PREDEFINED_SPORTS) {
      if (ps.name && eventNameLower.includes(ps.name.toLowerCase())) {
        return ps.name;
      }
    }
    return "";
  }, [sportsMeta]);

  // Merge database sports (sportsMeta) with predefined template sports so custom sports appear in the picker
  const allSelectableSports = React.useMemo(() => {
    const list: {
      name: string;
      icon: string;
      iconUrl?: string;
      isCustom?: boolean;
      alreadyAdded: boolean;
      sportId?: number;
    }[] = [];
    const seen = new Set<string>();

    // 1. All active sports configured in DB (sportsMeta)
    (sportsMeta || []).forEach(sm => {
      if (!sm.name || sm.active === false) return;
      const lower = sm.name.trim().toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        const isPredefined = PREDEFINED_SPORTS.some(ps => ps.name.toLowerCase() === lower);
        list.push({
          name: sm.name.trim(),
          icon: sm.icon || "🏆",
          iconUrl: sm.iconUrl,
          isCustom: !isPredefined,
          alreadyAdded: true,
          sportId: sm.id,
        });
      }
    });

    // 2. Predefined sports not yet registered in sportsMeta
    PREDEFINED_SPORTS.forEach(ps => {
      if (!ps.name) return;
      const lower = ps.name.trim().toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        list.push({
          name: ps.name.trim(),
          icon: ps.icon || "🏆",
          isCustom: false,
          alreadyAdded: false,
        });
      }
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [sportsMeta]);

  // Helper to format an age range into an age category label
  const formatAgeCategoryLabel = React.useCallback((minAge?: number | null, maxAge?: number | null): string => {
    const min = minAge != null ? Number(minAge) : null;
    const max = maxAge != null ? Number(maxAge) : null;

    if ((min == null || min <= 0) && (max == null || max >= 90)) {
      return "Open (All Ages)";
    }
    if ((min == null || min <= 0) && max != null && max < 90) {
      return `Under ${max} (U-${max})`;
    }
    if (min != null && min > 0 && (max == null || max >= 90)) {
      return `${min}+ Yrs`;
    }
    if (min != null && max != null) {
      return `${min}–${max} Yrs`;
    }
    return "Open (All Ages)";
  }, []);

  // Helper to resolve an event's primary age category
  const getEventAgeCategory = React.useCallback((e: any): string => {
    // 1. Direct property if explicitly provided
    if (e.ageCategory) return String(e.ageCategory);
    if (e.ageGroup) return String(e.ageGroup);

    // 2. Direct event minAge / maxAge
    if (e.minAge != null || e.maxAge != null) {
      return formatAgeCategoryLabel(e.minAge, e.maxAge);
    }

    // 3. Category array
    if (Array.isArray(e.categories) && e.categories.length > 0) {
      const firstCat = e.categories[0];
      if (firstCat && (firstCat.minAge != null || firstCat.maxAge != null)) {
        return formatAgeCategoryLabel(firstCat.minAge, firstCat.maxAge);
      }
    }

    // 4. Category IDs matching playerCategories
    if (Array.isArray(e.categoryIds) && e.categoryIds.length > 0) {
      const matched = playerCategories.find(pc => e.categoryIds.some((id: any) => Number(id) === Number(pc.id)));
      if (matched && (matched.minAge != null || matched.maxAge != null)) {
        return formatAgeCategoryLabel(matched.minAge, matched.maxAge);
      }
    }

    // 5. Detect from event name
    const nameLower = (e.name || "").toLowerCase();
    const uMatch = nameLower.match(/\b(?:u-?|under\s*)(\d+)\b/i);
    if (uMatch) return `Under ${uMatch[1]} (U-${uMatch[1]})`;
    const plusMatch = nameLower.match(/\b(\d+)\s*\+/);
    if (plusMatch) return `${plusMatch[1]}+ Yrs`;
    const rangeMatch = nameLower.match(/\b(\d+)\s*[-–]\s*(\d+)\b/);
    if (rangeMatch) return `${rangeMatch[1]}–${rangeMatch[2]} Yrs`;
    if (/\bopen\b/i.test(nameLower)) return "Open (All Ages)";

    return "Open (All Ages)";
  }, [playerCategories, formatAgeCategoryLabel]);

  const matchesEventCategory = React.useCallback((e: any, targetCategoryName: string): boolean => {
    if (!targetCategoryName) return true;
    const target = targetCategoryName.toLowerCase();

    // 1. Direct categoryName or category property
    if (e.categoryName && e.categoryName.toLowerCase() === target) return true;
    if (typeof e.category === "string" && e.category.toLowerCase() === target) return true;
    if (e.category?.name && e.category.name.toLowerCase() === target) return true;

    // 2. categories array
    if (Array.isArray(e.categories) && e.categories.some((c: any) => c?.name?.toLowerCase() === target)) {
      return true;
    }

    // 3. categoryIds matching playerCategories
    const targetCat = playerCategories.find(pc => pc.name.toLowerCase() === target);
    if (targetCat) {
      if (Array.isArray(e.categoryIds) && e.categoryIds.some((id: any) => Number(id) === Number(targetCat.id))) {
        return true;
      }
      if (e.categoryId && Number(e.categoryId) === Number(targetCat.id)) {
        return true;
      }
      // Age and gender match if category has them
      if (
        (e.gender === targetCat.gender || e.gender === "ALL" || !e.gender) &&
        (e.minAge === targetCat.minAge || (e.minAge == null && targetCat.minAge === 0)) &&
        (e.maxAge === targetCat.maxAge || (e.maxAge == null && targetCat.maxAge === 99))
      ) {
        return true;
      }
    }

    // 4. Check if event name includes the category name
    if (e.name && e.name.toLowerCase().includes(target)) {
      return true;
    }

    return false;
  }, [playerCategories]);

  const matchesEventAgeCategory = React.useCallback((e: any, targetAgeCategory: string): boolean => {
    if (!targetAgeCategory) return true;

    // Direct computed age category comparison
    const eventAgeCategory = getEventAgeCategory(e);
    if (eventAgeCategory.toLowerCase() === targetAgeCategory.toLowerCase()) {
      return true;
    }

    // Check categories array
    if (Array.isArray(e.categories)) {
      for (const c of e.categories) {
        if (c.minAge != null || c.maxAge != null) {
          const label = formatAgeCategoryLabel(c.minAge, c.maxAge);
          if (label.toLowerCase() === targetAgeCategory.toLowerCase()) return true;
        }
      }
    }

    // Check categoryIds
    if (Array.isArray(e.categoryIds)) {
      for (const id of e.categoryIds) {
        const cat = playerCategories.find(pc => Number(pc.id) === Number(id));
        if (cat && (cat.minAge != null || cat.maxAge != null)) {
          const label = formatAgeCategoryLabel(cat.minAge, cat.maxAge);
          if (label.toLowerCase() === targetAgeCategory.toLowerCase()) return true;
        }
      }
    }

    // Check numerical range compatibility if target specifies numbers
    const uMatch = targetAgeCategory.match(/\b(?:u-?|under\s*)(\d+)\b/i);
    if (uMatch) {
      const targetMax = parseInt(uMatch[1], 10);
      if (e.maxAge != null && Number(e.maxAge) === targetMax) return true;
      if (e.name && new RegExp(`\\b(u-?|under\\s*)${targetMax}\\b`, "i").test(e.name)) return true;
    }
    const plusMatch = targetAgeCategory.match(/\b(\d+)\s*\+/);
    if (plusMatch) {
      const targetMin = parseInt(plusMatch[1], 10);
      if (e.minAge != null && Number(e.minAge) === targetMin) return true;
      if (e.name && e.name.includes(`${targetMin}+`)) return true;
    }
    const rangeMatch = targetAgeCategory.match(/\b(\d+)\s*[-–]\s*(\d+)\b/);
    if (rangeMatch) {
      const targetMin = parseInt(rangeMatch[1], 10);
      const targetMax = parseInt(rangeMatch[2], 10);
      if (e.minAge != null && e.maxAge != null && Number(e.minAge) === targetMin && Number(e.maxAge) === targetMax) return true;
    }

    return false;
  }, [getEventAgeCategory, formatAgeCategoryLabel, playerCategories]);

  const availableSports = React.useMemo(() => {
    const set = new Set<string>();
    activeEvents.forEach(e => {
      const s = getEventSportName(e);
      if (s) set.add(s);
    });
    if (set.size === 0) {
      sportsMeta.forEach(s => { if (s.name) set.add(s.name); });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activeEvents, getEventSportName, sportsMeta]);

  const availableCategories = React.useMemo(() => {
    const set = new Set<string>();
    activeEvents.forEach(e => {
      if (e.categoryName) set.add(e.categoryName);
      if (typeof e.category === 'string') set.add(e.category);
      if (e.category?.name) set.add(e.category.name);
      if (Array.isArray(e.categories)) {
        e.categories.forEach((c: any) => {
          if (c?.name) set.add(c.name);
        });
      }
      if (Array.isArray(e.categoryIds)) {
        e.categoryIds.forEach((id: any) => {
          const found = playerCategories.find(pc => Number(pc.id) === Number(id));
          if (found?.name) set.add(found.name);
        });
      }
    });
    playerCategories.forEach(c => {
      if (c.name) set.add(c.name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activeEvents, playerCategories]);

  const availableAgeCategories = React.useMemo(() => {
    const set = new Set<string>();
    activeEvents.forEach(e => {
      const ac = getEventAgeCategory(e);
      if (ac) set.add(ac);
    });

    playerCategories.forEach(cat => {
      if (cat.minAge != null || cat.maxAge != null) {
        const label = formatAgeCategoryLabel(cat.minAge, cat.maxAge);
        if (label) set.add(label);
      }
    });

    if (set.size === 0) {
      ["Open (All Ages)", "Under 12 (U-12)", "Under 14 (U-14)", "Under 16 (U-16)", "Under 19 (U-19)", "18–35 Yrs", "35+ Yrs", "40+ Yrs"].forEach(s => set.add(s));
    }

    // Sort age categories: U-X first by age, then ranges, then X+, then Open
    return Array.from(set).sort((a, b) => {
      const getSortKey = (str: string) => {
        const u = str.match(/\b(?:u-?|under\s*)(\d+)\b/i);
        if (u) return parseInt(u[1], 10);
        const r = str.match(/\b(\d+)\s*[-–]\s*(\d+)\b/);
        if (r) return parseInt(r[1], 10) + 100;
        const p = str.match(/\b(\d+)\s*\+/);
        if (p) return parseInt(p[1], 10) + 200;
        if (/open/i.test(str)) return 999;
        return 500;
      };
      return getSortKey(a) - getSortKey(b);
    });
  }, [activeEvents, playerCategories, getEventAgeCategory, formatAgeCategoryLabel]);

  const getEventGender = React.useCallback((e: any): string => {
    // 1. Direct event gender property
    let raw = e.gender;

    // 2. Direct category or categories array
    if (!raw && e.category?.gender) raw = e.category.gender;
    if (!raw && Array.isArray(e.categories) && e.categories[0]?.gender) raw = e.categories[0].gender;

    // 3. Category IDs matching playerCategories
    if (!raw && Array.isArray(e.categoryIds) && e.categoryIds.length > 0) {
      const matched = playerCategories.find(pc => e.categoryIds.some((id: any) => Number(id) === Number(pc.id)));
      if (matched?.gender) raw = matched.gender;
    }

    // 4. Infer from event name
    if (!raw) {
      const nameLower = (e.name || "").toLowerCase();
      if (/\b(women|female|girls?)\b/i.test(nameLower)) return "Female";
      if (/\b(men|male|boys?)\b/i.test(nameLower)) return "Male";
      if (/\bmixed\b/i.test(nameLower)) return "Mixed";
      return "Open (All Genders)";
    }

    const upper = String(raw).trim().toUpperCase();
    if (upper === "MALE" || upper === "MEN" || upper === "BOYS" || upper === "BOY") return "Male";
    if (upper === "FEMALE" || upper === "WOMEN" || upper === "GIRLS" || upper === "GIRL") return "Female";
    if (upper === "MIXED") return "Mixed";
    if (upper === "ALL" || upper === "ANY" || upper === "OPEN") return "Open (All Genders)";

    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }, [playerCategories]);

  const matchesEventGender = React.useCallback((e: any, targetGender: string): boolean => {
    if (!targetGender) return true;
    const eventGender = getEventGender(e);
    return eventGender.toLowerCase() === targetGender.toLowerCase();
  }, [getEventGender]);

  const availableGenders = React.useMemo(() => {
    const set = new Set<string>();
    activeEvents.forEach(e => {
      const g = getEventGender(e);
      if (g) set.add(g);
    });

    if (set.size === 0) {
      ["Male", "Female", "Mixed", "Open (All Genders)"].forEach(g => set.add(g));
    }

    const order = ["Male", "Female", "Mixed", "Open (All Genders)"];
    return Array.from(set).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [activeEvents, getEventGender]);

  const filteredEvents = React.useMemo(() => {
    return activeEvents.filter(e => {
      if (selectedSportFilter) {
        const sName = getEventSportName(e);
        if (sName.toLowerCase() !== selectedSportFilter.toLowerCase()) {
          return false;
        }
      }
      if (selectedCategoryFilter) {
        if (!matchesEventCategory(e, selectedCategoryFilter)) {
          return false;
        }
      }
      if (selectedAgeCategoryFilter) {
        if (!matchesEventAgeCategory(e, selectedAgeCategoryFilter)) {
          return false;
        }
      }
      if (selectedGenderFilter) {
        if (!matchesEventGender(e, selectedGenderFilter)) {
          return false;
        }
      }
      return true;
    });
  }, [
    activeEvents,
    selectedSportFilter,
    selectedCategoryFilter,
    selectedAgeCategoryFilter,
    selectedGenderFilter,
    getEventSportName,
    matchesEventCategory,
    matchesEventAgeCategory,
    matchesEventGender,
  ]);

  const isFiltered = Boolean(selectedSportFilter || selectedCategoryFilter || selectedAgeCategoryFilter || selectedGenderFilter);

  const isEditing = sportForms.some(f => Boolean(f.editingSportId));

  // Close edit modal on Escape key press
  React.useEffect(() => {
    if (!isEditing || !showSportForm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sportSubmitting) {
        resetSportForm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, showSportForm, sportSubmitting, resetSportForm]);

  const isTournamentMode = Boolean(activeTournamentId || activeTournamentName);
  const [tournamentViewMode, setTournamentViewMode] = React.useState<"all" | "added" | "not-added">("all");

  const isEventInTournament = React.useCallback(
    (e: any): boolean => {
      if (!activeTournamentId && !activeTournamentName) return false;

      if (activeTournamentId != null) {
        const tid = Number(activeTournamentId);
        if (e.tournament?.id != null && Number(e.tournament.id) === tid) return true;
        if (e.tournamentId != null && Number(e.tournamentId) === tid) return true;
        if (e.sportsTournamentId != null && Number(e.sportsTournamentId) === tid) return true;
        if (e.sportsTournament?.id != null && Number(e.sportsTournament.id) === tid) return true;
      }

      if (activeTournamentName && activeTournamentName.trim()) {
        const tName = activeTournamentName.trim().toLowerCase();
        if (e.tournament?.name && e.tournament.name.trim().toLowerCase() === tName) return true;
        if (e.sportsTournament?.name && e.sportsTournament.name.trim().toLowerCase() === tName) return true;
        if (e.tournamentName && e.tournamentName.trim().toLowerCase() === tName) return true;
        const evName = (e.name || "").toLowerCase();
        if (evName.includes(`(${tName})`) || evName.includes(`[${tName}]`)) return true;
      }

      return false;
    },
    [activeTournamentId, activeTournamentName]
  );

  const { addedEvents, notAddedEvents } = React.useMemo(() => {
    if (!isTournamentMode) {
      return { addedEvents: [], notAddedEvents: filteredEvents };
    }
    const added: any[] = [];
    const notAdded: any[] = [];
    filteredEvents.forEach(e => {
      if (isEventInTournament(e)) {
        added.push(e);
      } else {
        notAdded.push(e);
      }
    });
    return { addedEvents: added, notAddedEvents: notAdded };
  }, [filteredEvents, isTournamentMode, isEventInTournament]);

  const renderEventCard = (e: any, isAdded: boolean) => {
    const iconUrl = e.sport?.iconUrl || e.iconUrl;
    const icon = e.sport?.icon || e.icon || "🏆";
    const startStr = e.eventDateStart ? format(new Date(e.eventDateStart), "MMM d") : "";
    const endStr = e.eventDateEnd ? format(new Date(e.eventDateEnd), "MMM d, yyyy") : "";
    const sportLabel = getEventSportName(e);
    const categoryLabel = e.categoryName || (typeof e.category === 'string' ? e.category : e.category?.name) || (Array.isArray(e.categories) && e.categories[0]?.name);
    const ageCategoryLabel = getEventAgeCategory(e);

    return (
      <div
        key={e.id}
        className={cn(
          "p-4 rounded-xl transition-all duration-200 flex flex-col justify-between border shadow-2xs",
          isAdded
            ? "bg-white border-emerald-300 ring-1 ring-emerald-500/20 hover:border-emerald-500 hover:shadow-xs"
            : e.active !== false
              ? "bg-white border-slate-200/90 hover:border-indigo-400 hover:shadow-xs"
              : "bg-slate-50 border-slate-200/60 opacity-75"
        )}
      >
        <div className="flex gap-3">
          {iconUrl ? (
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-slate-50 border border-slate-200 shadow-2xs">
              <img src={iconUrl} alt={e.name} className="w-7 h-7 object-cover rounded" />
            </div>
          ) : (
            <span className="text-[10px] leading-none">{icon}</span>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
              {e.name}
              {e.tournament?.name && (
                <span className="font-medium text-slate-500"> ({e.tournament.name})</span>
              )}
            </h4>

            <div className="flex flex-wrap items-center gap-1 mt-2">
              {isAdded && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" /> Added
                </span>
              )}
              {e.active !== false ? (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  Active
                </span>
              ) : (
                <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  Closed
                </span>
              )}
              {sportLabel && (
                <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  {sportLabel}
                </span>
              )}
              {categoryLabel && (
                <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded font-bold tracking-wide">
                  {categoryLabel}
                </span>
              )}
              {ageCategoryLabel && (
                <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold tracking-wide">
                  {ageCategoryLabel}
                </span>
              )}
              {e.status && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border",
                    e.status === "REGISTRATION_OPEN"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : e.status === "LIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : e.status === "COMPLETED"
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : e.status === "CANCELLED"
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                  )}
                >
                  {e.status.replace(/_/g, " ")}
                </span>
              )}
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                {e.format || "SINGLES"}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                {e.tournamentType ? e.tournamentType.replace(/_/g, " ") : "KNOCKOUT"}
              </span>
              {e.auctionEnabled && (
                <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-0.5">
                  <Gavel className="w-2.5 h-2.5" /> Auction
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">
                  {startStr} - {endStr}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">
                  {e.gender || "ALL"} • {e.minAge != null ? e.minAge : 0}-{e.maxAge != null ? e.maxAge : 99} Yrs
                </span>
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
  };

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

  const renderSportFormCards = () => (
    <div className="space-y-4">
            {sportForms.map((form, idx) => (
              <div
                key={form.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs transition-all text-left space-y-4"
              >
                {/* Sport Header with icon, name, index badge and remove button */}
                {!isEditing && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2 flex-1">
                     {form.iconUrl ? (
                       <div className="w-7 h-7 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-white border border-slate-200 shadow-2xs">
                         <img src={form.iconUrl} alt={form.name} className="w-6 h-6 object-cover rounded" />
                       </div>
                     ) : (
                       <span className="text-[10px] leading-none">{form.icon || "🏆"}</span>
                     )}
                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Sport {idx + 1}</label>
                      <h4 className="text-xs font-bold text-slate-800 truncate">{form.name}</h4>
                    </div>
                  </div>
                  {sportForms.length > 1 && (
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
                )}

                {/* Event Configurations */}
                <div className="space-y-3">
                  {form.events.map((ev, eIdx) => {
                    const effectiveTourneyId = (ev as any).tournamentId !== undefined && (ev as any).tournamentId !== "change"
                      ? (ev as any).tournamentId
                      : ((form as any).tournamentId !== undefined ? (form as any).tournamentId : activeTournamentId);
                    const selectedTournament = (activeTournaments || []).find(
                      (t: any) => Number(t.id) === Number(effectiveTourneyId)
                    );
                    const tourneyStartStr = selectedTournament?.eventDateStart || selectedTournament?.startDate || (selectedTournament?.event?.eventDateStart || selectedTournament?.event?.startDate);
                    const tourneyEndStr = selectedTournament?.eventDateEnd || selectedTournament?.endDate || (selectedTournament?.event?.eventDateEnd || selectedTournament?.event?.endDate);
                    const isChangingTournament = (ev as any).tournamentId === "change";

                    return (
                    <div
                      key={ev.id}
                      className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 space-y-3 relative shadow-2xs"
                    >
                      {/* Event header */}
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">{isEditing ? "Event Configuration & Rules" : `Configuration #${eIdx + 1}`}</span>
                        {!isEditing && form.events.length > 1 && (
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

                      {/* Tournament Selection */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-slate-600 font-semibold block">
                            Tournament <span className="text-red-500">*</span>
                          </label>
                          {!isEditing && selectedTournament && !isChangingTournament && (
                            <button
                              type="button"
                              onClick={() => updateSportFormEvent(form.id, ev.id, "tournamentId", "change")}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                            >
                              Change Tournament
                            </button>
                          )}
                        </div>

                        {selectedTournament && !isChangingTournament ? (
                          <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-200/80 rounded-xl px-3.5 py-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                <Trophy className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-indigo-900 truncate">
                                  {selectedTournament.name || activeTournamentName || `Tournament #${selectedTournament.id}`}
                                </p>
                                {tourneyStartStr && tourneyEndStr && (
                                  <p className="text-[11px] text-indigo-600 font-medium">
                                    Timeline: {format(new Date(tourneyStartStr), "MMM d")} - {format(new Date(tourneyEndStr), "MMM d, yyyy")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
                              Linked
                            </span>
                          </div>
                        ) : activeTournaments && activeTournaments.length > 0 ? (
                          <div className="space-y-1">
                            <div className="relative">
                              <select
                                value={isChangingTournament ? "" : (effectiveTourneyId || "")}
                                onChange={e => {
                                  const val = e.target.value ? Number(e.target.value) : undefined;
                                  updateSportFormEvent(form.id, ev.id, "tournamentId", val);
                                }}
                                className={`w-full bg-white border rounded-xl px-3 py-2 text-xs sm:text-[13px] text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none transition-all shadow-2xs cursor-pointer ${
                                  !effectiveTourneyId || isChangingTournament ? "border-red-300" : "border-slate-200"
                                }`}
                              >
                                <option value="" disabled>-- Select Tournament (Required) * --</option>
                                {activeTournaments.map((t: any) => {
                                  const sDate = t.eventDateStart || t.startDate || t.event?.eventDateStart;
                                  const eDate = t.eventDateEnd || t.endDate || t.event?.eventDateEnd;
                                  const dateStr = sDate && eDate
                                    ? ` (${format(new Date(sDate), "MMM d")} - ${format(new Date(eDate), "MMM d, yyyy")})`
                                    : "";
                                  return (
                                    <option key={t.id} value={t.id}>
                                      {t.name}{dateStr}
                                    </option>
                                  );
                                })}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </div>
                            {(!effectiveTourneyId || isChangingTournament) && (
                              <span className="text-[10px] text-red-500 font-medium block">
                                Please select a tournament for this event. All events must belong to a tournament.
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1 text-xs text-amber-800">
                              <p className="font-semibold">No Tournaments Available</p>
                              <p className="text-[11px] text-amber-700 mt-0.5">
                                All sports events must belong to a tournament. Please create a tournament first.
                              </p>
                              <button
                                type="button"
                                onClick={() => setActiveTab("create-tournament")}
                                className="mt-2 text-xs px-2.5 py-1 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition cursor-pointer"
                              >
                                + Create Tournament
                              </button>
                            </div>
                          </div>
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
                            min={tourneyStartStr}
                            max={tourneyEndStr}
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
                            min={ev.startDate || tourneyStartStr}
                            max={tourneyEndStr}
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
                      {tourneyStartStr && tourneyEndStr && (
                        <span className="text-[11px] text-indigo-600 font-medium block -mt-1">
                          Tournament window: {format(new Date(tourneyStartStr), "MMM d")} - {format(new Date(tourneyEndStr), "MMM d, yyyy")}
                        </span>
                      )}

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
                            <PopoverContent className="w-[280px] sm:w-[320px] p-0 bg-white border border-slate-200 text-slate-800 shadow-xl rounded-xl z-[60]" align="start">
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
                              <div
                                onClick={() => {
                                  setOpenDropdownEventId(null);
                                  setActiveTab("player-category");
                                }}
                                className="p-2.5 border-t border-slate-100 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/70 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Manage / Create Player Categories ↗
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
                              <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer select-none">
                                <span>Approval</span>
                                <input
                                  type="checkbox"
                                  checked={ev.adminApprovalRequired !== false}
                                  onChange={e => updateSportFormEvent(form.id, ev.id, "adminApprovalRequired", e.target.checked)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                />
                              </label>
                              {ev.formats && ev.formats.includes("MIXED_DOUBLES") && (
                                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer select-none" title="Strict Mixed Doubles (Requires 1 Male + 1 Female)">
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

                      {/* ─── Team Sport Options (Captaincy & Auction) ─── */}
                      {isTeamSport(form.name) && (
                        <div className="space-y-2.5">
                          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 cursor-pointer hover:bg-indigo-50/70 transition-colors">
                            <input
                              type="checkbox"
                              checked={!!ev.captainNominationOpen}
                              onChange={e => updateSportFormEvent(form.id, ev.id, "captainNominationOpen", e.target.checked)}
                              className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-indigo-950">
                                <Crown className="w-3.5 h-3.5 text-indigo-600" /> Allow Captaincy Nominations
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 leading-tight">
                                Open captaincy nominations for registered players in this team event.
                              </p>
                            </div>
                          </label>

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
                              <p className="text-xs text-slate-500 mt-0.5 leading-tight">
                                Mark this team event for player auction. Teams, budget and bidding are configured on the Auction screen.
                              </p>
                            </div>
                          </label>
                        </div>
                      )}

                      {/* ─── Event Contact Information ─── */}
                      <div className="pt-3 mt-1 border-t border-slate-200/80">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event Contact Information</div>
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
                            <span className="text-[10px] font-semibold text-slate-600">Other Contacts / Volunteers</span>
                            <button
                              type="button"
                              onClick={() => updateSportFormEvent(form.id, ev.id, "otherContacts", [...(ev.otherContacts || []), { title: "", name: "", detail: "" }])}
                              className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer font-bold border-none bg-transparent"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Contact
                            </button>
                          </div>

                          {(ev.otherContacts || []).length === 0 ? (
                            <div className="text-center py-2.5 bg-white border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                              No extra contact information added yet.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(ev.otherContacts || []).map((contact, cIdx) => (
                                <div key={cIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-left shadow-2xs">
                                  <div>
                                    <label className="text-xs text-slate-400 block mb-1 font-semibold">Title</label>
                                    <input
                                      value={contact.title}
                                      onChange={e => updateSportFormEvent(form.id, ev.id, "otherContacts", (ev.otherContacts || []).map((c, i) => i === cIdx ? { ...c, title: e.target.value } : c))}
                                      placeholder="e.g. Referee"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-slate-400 block mb-1 font-semibold">Name</label>
                                    <input
                                      value={contact.name}
                                      onChange={e => updateSportFormEvent(form.id, ev.id, "otherContacts", (ev.otherContacts || []).map((c, i) => i === cIdx ? { ...c, name: e.target.value } : c))}
                                      placeholder="e.g. John Doe"
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                                    />
                                  </div>
                                  <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                      <label className="text-xs text-slate-400 block mb-1 font-semibold">Number / Email</label>
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
                  );
                })}
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
  );

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="text-left">
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">Sports Management</h3>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5">Configure and manage active sports metadata in the system</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showSportForm) {
              resetSportForm();
            } else {
              resetSportForm();
              onLoadConfig?.();
              setShowSportPicker(true);
            }
          }}
          className="px-3.5 py-2 text-white text-xs sm:text-[13px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-xs hover:brightness-105 shrink-0 self-start sm:self-auto"
          style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            boxShadow: "0 2px 8px rgba(99,102,241,0.25)"
          }}
        >
          <Plus className="w-3.5 h-3.5" /> {showSportForm && !isEditing ? "Close Form" : "Select a Sport"}
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
                <h2 className="text-xs font-bold text-slate-800">Select a Sport</h2>
                <p className="text-xs text-slate-400 mt-0.5">Choose from the list below to configure its defaults</p>
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
                {allSelectableSports.filter(sp => sp.name.toLowerCase().includes(sportPickerSearch.toLowerCase())).map(sp => {
                  const alreadyQueued = sportForms.some(form => form.name.toLowerCase() === sp.name.toLowerCase());
                  const isUnavailable = alreadyQueued;
                  const effectiveIcon = sp.iconUrl || sp.icon;

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
                       {effectiveIcon && (effectiveIcon.startsWith("data:image/") || effectiveIcon.startsWith("http")) ? (
                         <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0 bg-slate-100 border border-slate-200 shadow-2xs">
                           <img src={effectiveIcon} alt={sp.name} className="w-7 h-7 object-cover rounded" />
                         </div>
                       ) : (
                         <span className="text-xl sm:text-2xl leading-none">{sp.icon || "🏆"}</span>
                       )}
                      <span className="text-[10px] font-semibold leading-tight text-slate-800">{sp.name}</span>
                      <div className="flex items-center gap-1 flex-wrap justify-center">
                        {sp.isCustom ? (
                          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Custom</span>
                        ) : sp.alreadyAdded ? (
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Registered</span>
                        ) : null}
                        {alreadyQueued && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Queued</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {allSelectableSports.filter(sp => sp.name.toLowerCase().includes(sportPickerSearch.toLowerCase())).length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-500 text-xs sm:text-[13px] mb-3">No sports match your search.</p>
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

      {/* ─── Edit Sport Event Popup Modal ─── */}
      {showSportForm && sportForms.length > 0 && isEditing && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            if (!sportSubmitting) resetSportForm();
          }}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
                  {sportForms[0]?.iconUrl ? (
                    <img src={sportForms[0].iconUrl} alt={sportForms[0].name} className="w-6 h-6 object-cover rounded" />
                  ) : sportForms[0]?.icon ? (
                    <span className="text-lg leading-none">{sportForms[0].icon}</span>
                  ) : (
                    <Edit2 className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-bold text-slate-800">Edit Sport Event</h2>
                    {sportForms[0]?.name && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                        {sportForms[0].name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {sportForms[0]?.events?.[0]?.eventName
                      ? `Editing: ${sportForms[0].events[0].eventName}`
                      : "Update event schedule, format, and configuration rules"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetSportForm}
                disabled={sportSubmitting}
                className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {renderSportFormCards()}
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={resetSportForm}
                disabled={sportSubmitting}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs sm:text-[13px] font-semibold rounded-xl hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSportSave}
                disabled={sportSubmitting}
                className="px-5 py-2 text-white text-xs sm:text-[13px] font-semibold rounded-xl border-none cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm hover:brightness-105 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  boxShadow: "0 2px 8px rgba(99,102,241,0.25)"
                }}
              >
                {sportSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Event</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Inline Form Section (When configuring new sports) ─── */}
      {showSportForm && sportForms.length > 0 && !isEditing && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header bar with count and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Configure Sport Events ({sportForms.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowSportPicker(true)}
              className="px-3 py-1.5 text-xs text-indigo-600 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-semibold shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Another Sport
            </button>
          </div>

          {/* Sport Form Cards */}
          {renderSportFormCards()}

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
              {sportSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</> : "Save Event ↗"}
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
            <h4 className="text-xs font-bold text-slate-800 mb-1">No Sports Events Configured</h4>
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
            <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
                    Scheduled Community Events
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {filteredEvents.length}
                    {isFiltered ? ` / ${activeEvents.length}` : ""}
                  </span>
                </div>

                {/* Filters for sports type, player category, age category, and gender */}
                <div className="flex flex-wrap items-center gap-2">
                  {isFiltered && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-1.5 py-0.5 rounded">
                      {[Boolean(selectedSportFilter), Boolean(selectedCategoryFilter), Boolean(selectedAgeCategoryFilter), Boolean(selectedGenderFilter)].filter(Boolean).length} { [Boolean(selectedSportFilter), Boolean(selectedCategoryFilter), Boolean(selectedAgeCategoryFilter), Boolean(selectedGenderFilter)].filter(Boolean).length === 1 ? "filter" : "filters" }
                    </span>
                  )}

                  {/* Sports Type Filter */}
                  <div className="relative min-w-[125px] sm:min-w-[145px]">
                    <select
                      value={selectedSportFilter}
                      onChange={(e) => setSelectedSportFilter(e.target.value)}
                      className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-colors"
                      aria-label="Filter by sport type"
                    >
                      <option value="">All Sports {availableSports.length > 0 ? `(${availableSports.length})` : ""}</option>
                      {availableSports.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Player Category Filter */}
                  <div className="relative min-w-[130px] sm:min-w-[155px]">
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-colors"
                      aria-label="Filter by player category"
                    >
                      <option value="">All Categories {availableCategories.length > 0 ? `(${availableCategories.length})` : ""}</option>
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gender Filter */}
                  <div className="relative min-w-[120px] sm:min-w-[140px]">
                    <select
                      value={selectedGenderFilter}
                      onChange={(e) => setSelectedGenderFilter(e.target.value)}
                      className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-colors"
                      aria-label="Filter by gender"
                    >
                      <option value="">All Genders {availableGenders.length > 0 ? `(${availableGenders.length})` : ""}</option>
                      {availableGenders.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Age Category Filter */}
                  <div className="relative min-w-[135px] sm:min-w-[165px]">
                    <select
                      value={selectedAgeCategoryFilter}
                      onChange={(e) => setSelectedAgeCategoryFilter(e.target.value)}
                      className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-colors"
                      aria-label="Filter by age category"
                    >
                      <option value="">All Ages {availableAgeCategories.length > 0 ? `(${availableAgeCategories.length})` : ""}</option>
                      {availableAgeCategories.map((ac) => (
                        <option key={ac} value={ac}>
                          {ac}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear filters button */}
                  {isFiltered && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSportFilter("");
                        setSelectedCategoryFilter("");
                        setSelectedAgeCategoryFilter("");
                        setSelectedGenderFilter("");
                      }}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors cursor-pointer border border-indigo-200 bg-white flex items-center gap-1 shadow-2xs"
                      title="Clear filters"
                    >
                      <X className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {isTournamentMode && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTournamentViewMode("all")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer",
                        tournamentViewMode === "all"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      All Events ({filteredEvents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTournamentViewMode("added")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                        tournamentViewMode === "added"
                          ? "bg-emerald-600 text-white shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Added ({addedEvents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTournamentViewMode("not-added")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer",
                        tournamentViewMode === "not-added"
                          ? "bg-slate-700 text-white shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      Not Added ({notAddedEvents.length})
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium">
                    Tournament Context: <span className="font-bold text-indigo-700">{activeTournamentName || `#${activeTournamentId}`}</span>
                  </div>
                </div>
              )}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400 text-lg">
                  🔍
                </div>
                <h4 className="text-xs font-bold text-slate-700 mb-1">No matching events found</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mb-3">
                  No scheduled events match the selected sports type, player category, gender, or age category filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSportFilter("");
                    setSelectedCategoryFilter("");
                    setSelectedAgeCategoryFilter("");
                    setSelectedGenderFilter("");
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : isTournamentMode ? (
              <div className="space-y-8">
                {/* Section 1: Already Added Events */}
                {(tournamentViewMode === "all" || tournamentViewMode === "added") && (
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3.5 border-b border-emerald-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider m-0">
                              Already Added Events
                            </h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {addedEvents.length}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 m-0">
                            Events associated with {activeTournamentName || "this tournament"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {addedEvents.length === 0 ? (
                      <div className="text-center py-6 px-4 bg-emerald-50/40 rounded-xl border border-dashed border-emerald-200">
                        <p className="text-xs font-medium text-emerald-700">No events currently linked to this tournament.</p>
                        <p className="text-[11px] text-emerald-600/80 mt-0.5">Use the configuration form above to add sports events to this tournament.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {addedEvents.map(e => renderEventCard(e, true))}
                      </div>
                    )}
                  </div>
                )}

                {/* Section 2: Not Added Events (Other Community Events) */}
                {(tournamentViewMode === "all" || tournamentViewMode === "not-added") && (
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3.5 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
                              Not Added Events (Other Community Events)
                            </h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {notAddedEvents.length}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 m-0">
                            Scheduled community events not associated with {activeTournamentName || "this tournament"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {notAddedEvents.length === 0 ? (
                      <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs font-medium text-slate-600">All available community events are linked to this tournament.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {notAddedEvents.map(e => renderEventCard(e, false))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredEvents.map(e => renderEventCard(e, false))}
              </div>
            )}
          </>
      )}
      </div>
    </div>
  );
}


