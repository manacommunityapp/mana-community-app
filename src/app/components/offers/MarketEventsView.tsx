import { useState, useEffect } from 'react';
import {
  Store,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Users,
  ShieldCheck,
  Music,
  ShoppingBag,
  Plus,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { CommunityMarketEvent, MarketBooth } from '../../../types/offers';
import { offersApi } from '../../../services/offers/offersApi';
import { toast } from 'sonner';

export function MarketEventsView() {
  const [events, setEvents] = useState<CommunityMarketEvent[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<MarketBooth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await offersApi.getMarketEvents('comm-mana-residency');
      setEvents(data);
    } catch (err) {
      console.error('Failed to load market events', err);
    } finally {
      setLoading(false);
    }
  };

  const currentEvent = events[0];

  return (
    <div className="space-y-8">
      {loading || !currentEvent ? (
        <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
      ) : (
        <>
          {/* Main Event Showcase Hero */}
          <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-rose-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-amber-500/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                  <Store className="w-3.5 h-3.5" />
                  <span>Upcoming Community Shopping Festival</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {currentEvent.title}
                </h2>
                <p className="text-sm font-semibold text-amber-300">
                  Theme: {currentEvent.theme}
                </p>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {currentEvent.description}
                </p>

                {/* Event Schedule Info Pills */}
                <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>{currentEvent.eventDate} (Saturday)</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{currentEvent.startTime} – {currentEvent.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>{currentEvent.venue}</span>
                  </div>
                </div>
              </div>

              {/* Stats Badge */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
                  <div className="text-2xl font-black text-amber-400">
                    {currentEvent.allocatedBooths}/{currentEvent.totalBooths}
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">Stalls Allocated</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-center">
                  <div className="text-2xl font-black text-emerald-400">
                    {currentEvent.expectedVisitors}+
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">Neighbors Expected</div>
                </div>
              </div>
            </div>
          </div>

          {/* Entertainment & Activities Strip */}
          {currentEvent.entertainmentHighlights && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20 flex items-center gap-3 text-xs">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300 shrink-0">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <strong className="block font-bold text-slate-900 dark:text-white">
                  Event Entertainment &amp; Fun Zones:
                </strong>
                <span className="text-slate-600 dark:text-slate-300">
                  {currentEvent.entertainmentHighlights}
                </span>
              </div>
            </div>
          )}

          {/* Interactive Clubhouse Booth Map / Floor Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-600" />
                  <span>Interactive Clubhouse Booth Layout</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Click any stall booth to view today's special offer and participating business details
                </p>
              </div>

              {/* Map Legend */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
                  <span className="text-slate-600 dark:text-slate-400">Occupied Stall</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-700 inline-block" />
                  <span className="text-slate-600 dark:text-slate-400">Available Stall</span>
                </div>
              </div>
            </div>

            {/* Visual Floor Grid */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="text-center font-bold text-xs uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
                ★ Clubhouse Central Stage &amp; Performance Area ★
              </div>

              {/* Row A */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  ROW A — Premium Pavilion
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {currentEvent.booths.filter(b => b.boothNumber.startsWith('A')).map((booth) => (
                    <button
                      key={booth.id}
                      onClick={() => setSelectedBooth(booth)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                        selectedBooth?.id === booth.id
                          ? 'ring-2 ring-emerald-500 scale-102'
                          : ''
                      } ${
                        booth.isOccupied
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 hover:shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black font-mono">
                          {booth.boothNumber}
                        </span>
                        {booth.isOccupied && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>

                      {booth.isOccupied ? (
                        <div className="mt-auto">
                          <div className="text-xs font-bold truncate">
                            {booth.assignedBusinessName}
                          </div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 truncate">
                            {booth.zone}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-auto text-[10px] font-medium text-slate-400">
                          Available Slot
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row B */}
              <div className="space-y-1 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  ROW B — Food Court &amp; Artisans Lane
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {currentEvent.booths.filter(b => b.boothNumber.startsWith('B')).map((booth) => (
                    <button
                      key={booth.id}
                      onClick={() => setSelectedBooth(booth)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                        selectedBooth?.id === booth.id
                          ? 'ring-2 ring-emerald-500 scale-102'
                          : ''
                      } ${
                        booth.isOccupied
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 hover:shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black font-mono">
                          {booth.boothNumber}
                        </span>
                        {booth.isOccupied && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>

                      {booth.isOccupied ? (
                        <div className="mt-auto">
                          <div className="text-xs font-bold truncate">
                            {booth.assignedBusinessName}
                          </div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 truncate">
                            {booth.zone}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-auto text-[10px] font-medium text-slate-400">
                          Available Slot
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Booth Details Drawer/Card */}
            {selectedBooth && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs">
                      Booth {selectedBooth.boothNumber}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      {selectedBooth.zone}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedBooth.assignedBusinessName || 'Unassigned Stall (Open for Booking)'}
                  </h4>
                  {selectedBooth.todaysSpecialOffer && (
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      🎁 <strong>Market Day Special:</strong> {selectedBooth.todaysSpecialOffer}
                    </p>
                  )}
                </div>

                {!selectedBooth.isOccupied && (
                  <button
                    onClick={() => toast.info('To book this booth, apply via the Partner Portal')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    Apply for this Stall
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
