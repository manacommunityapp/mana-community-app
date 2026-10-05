import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Filter,
  Search,
  Plus,
  Clock,
  MapPin,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  Trophy,
  GraduationCap,
  Compass,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Wrench,
  Store,
  UserCheck,
} from "lucide-react";
import { manaCalendarService } from "../../../services/manaCalendarService";
import type { CalendarDomain, CalendarEventItem } from "../../../types/manaCalendar";

const DOMAIN_METADATA: Record<
  CalendarDomain,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  EVENT: { label: "Events", color: "#8B5CF6", bg: "bg-purple-50 text-purple-700 border-purple-200", icon: Sparkles },
  POOJA: { label: "Pooja", color: "#F97316", bg: "bg-orange-50 text-orange-700 border-orange-200", icon: Flame },
  SPORTS: { label: "Sports", color: "#10B981", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Trophy },
  ACADEMY: { label: "Academy", color: "#6366F1", bg: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: GraduationCap },
  TRIP: { label: "Trips", color: "#06B6D4", bg: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: Compass },
  GOVERNANCE: { label: "Governance", color: "#F59E0B", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: ShieldCheck },
  GROUP_BUY_PICKUP: { label: "Group Buy Pickup", color: "#F43F5E", bg: "bg-rose-50 text-rose-700 border-rose-200", icon: ShoppingBag },
  BOOKING: { label: "Bookings", color: "#3B82F6", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: CalendarIcon },
  PAYMENT: { label: "Payments", color: "#EF4444", bg: "bg-red-50 text-red-700 border-red-200", icon: CreditCard },
  MAINTENANCE: { label: "Maintenance", color: "#64748B", bg: "bg-slate-100 text-slate-700 border-slate-300", icon: Wrench },
  COMMUNITY_MARKET: { label: "Markets", color: "#14B8A6", bg: "bg-teal-50 text-teal-700 border-teal-200", icon: Store },
};

export const ManaCommunityCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<CalendarDomain | "ALL">("ALL");
  const [onlyMine, setOnlyMine] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"TIMELINE" | "AGENDA">("TIMELINE");

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await manaCalendarService.getTimeline({
        domain: selectedDomain === "ALL" ? undefined : selectedDomain,
        onlyMine: onlyMine ? true : undefined,
        q: searchQuery || undefined,
      });
      setEvents(data || []);
    } catch (e) {
      console.warn("Failed to load timeline events:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedDomain, onlyMine, searchQuery]);

  const formatEventDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatEventTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  // Group events by date for timeline view
  const groupedEvents = events.reduce((acc, ev) => {
    const dateKey = formatEventDate(ev.startTime);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(ev);
    return acc;
  }, {} as Record<string, CalendarEventItem[]>);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-cyan-300 mb-3">
              <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
              Mana Calendar • Unified 11-Domain Timeline
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Centralized Community Schedule</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              One unified timeline for Events, Pooja, Sports, Academy, Trips, Governance, Group Buy Pickups, Bookings, Payments, Maintenance, and Markets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setOnlyMine(!onlyMine)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                onlyMine
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md"
                  : "bg-white/10 hover:bg-white/20 text-white border-white/20"
              }`}
            >
              {onlyMine ? "✓ My Schedule Only" : "Show All Community"}
            </button>
          </div>
        </div>
      </div>

      {/* Domain Filters Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedDomain("ALL")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
            selectedDomain === "ALL"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          All Domains
        </button>

        {(Object.keys(DOMAIN_METADATA) as CalendarDomain[]).map((dom) => {
          const meta = DOMAIN_METADATA[dom];
          const Icon = meta.icon;
          const isSelected = selectedDomain === dom;
          return (
            <button
              key={dom}
              onClick={() => setSelectedDomain(isSelected ? "ALL" : dom)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition shrink-0 border ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
              <Icon className="w-3.5 h-3.5" />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Timeline Control */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search timeline for tournaments, pooja, pickup, AGM, tank cleaning..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{events.length}</span> scheduled items
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse">Loading unified timeline...</div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No Scheduled Items Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Try resetting your domain filters or search query to view the full community timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedEvents) as [string, CalendarEventItem[]][]).map(([dateLabel, dateItems]) => (
            <div key={dateLabel} className="space-y-3">
              <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md py-1 px-3 rounded-lg border border-slate-200 inline-block font-bold text-xs text-slate-800 shadow-sm">
                📅 {dateLabel} ({dateItems.length})
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateItems.map((ev) => {
                  const meta = DOMAIN_METADATA[ev.domain] || DOMAIN_METADATA.EVENT;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={ev.id}
                      className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5"
                        style={{ backgroundColor: meta.color }}
                      />

                      <div className="pl-2 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${meta.bg}`}>
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>

                          {ev.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {ev.badge}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm line-clamp-2">{ev.title}</h4>

                        {ev.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">{ev.description}</p>
                        )}

                        <div className="space-y-1 text-xs text-slate-600 pt-1">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {formatEventTime(ev.startTime)} - {formatEventTime(ev.endTime)}
                            </span>
                          </div>

                          {ev.location && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pl-2 pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        {ev.googleCalendarUrl ? (
                          <a
                            href={ev.googleCalendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 transition"
                          >
                            <ExternalLink className="w-3 h-3" /> + Google Cal
                          </a>
                        ) : <span />}

                        <button
                          onClick={() => {
                            if (ev.targetRoute) window.location.href = ev.targetRoute;
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                        >
                          {ev.actionLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
