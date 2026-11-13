import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  AlertTriangle,
  X,
  CheckCircle2,
  RefreshCw,
  FastForward,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { tournamentService, type BatchRescheduleRequest } from '../../../../services/sports/tournamentService';
import { showError, showSuccess } from '../../../../utils/ToastUtils';

interface MatchRowLike {
  id: number;
  matchNumber?: number;
  scheduledAt?: string;
  status?: string;
}

interface BatchRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  configId: number;
  tournamentName: string;
  matches: MatchRowLike[];
  selectedMatchIds?: number[];
  onSuccess: (updatedMatches: any[]) => void;
}

export function BatchRescheduleModal({
  isOpen,
  onClose,
  configId,
  tournamentName,
  matches,
  selectedMatchIds,
  onSuccess,
}: BatchRescheduleModalProps) {
  const [mode, setMode] = useState<'TIME_SHIFT' | 'NEW_DATE'>('TIME_SHIFT');

  // TIME_SHIFT state
  const [delayMinutes, setDelayMinutes] = useState<number>(60);
  const [customDelayInput, setCustomDelayInput] = useState<string>('60');

  // NEW_DATE state
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);
  const [newDate, setNewDate] = useState<string>(tomorrowStr);
  const [startTime, setStartTime] = useState<string>('09:00 AM');
  const [spacingOption, setSpacingOption] = useState<'PRESERVE' | '30' | '45' | '60'>('PRESERVE');

  // Scope state
  const [applyCutoff, setApplyCutoff] = useState<boolean>(false);
  const [cutoffTime, setCutoffTime] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isSelective = Boolean(selectedMatchIds && selectedMatchIds.length > 0);

  // Match statistics
  const stats = useMemo(() => {
    const sourceMatches = isSelective
      ? matches.filter((m) => selectedMatchIds!.includes(m.id))
      : matches;

    const total = sourceMatches.length;
    const completed = sourceMatches.filter(
      (m) => (m.status || '').toUpperCase() === 'COMPLETED'
    ).length;
    const byes = sourceMatches.filter((m) =>
      ['BYE', 'AUTO_ADVANCED'].includes((m.status || '').toUpperCase())
    ).length;

    let uncompleted = sourceMatches.filter((m) => {
      const s = (m.status || '').toUpperCase();
      return s !== 'COMPLETED' && s !== 'CANCELLED' && s !== 'BYE' && s !== 'AUTO_ADVANCED';
    });

    if (applyCutoff && cutoffTime) {
      try {
        const cutoffDt = new Date(cutoffTime);
        if (!isNaN(cutoffDt.getTime())) {
          uncompleted = uncompleted.filter((m) => {
            if (!m.scheduledAt) return false;
            const mDt = new Date(m.scheduledAt);
            return !isNaN(mDt.getTime()) && mDt >= cutoffDt;
          });
        }
      } catch {
        // ignore
      }
    }

    return {
      total,
      completed,
      byes,
      eligible: uncompleted.length,
    };
  }, [matches, selectedMatchIds, isSelective, applyCutoff, cutoffTime]);

  if (!isOpen) return null;

  const handleQuickDelay = (mins: number) => {
    setDelayMinutes(mins);
    setCustomDelayInput(String(mins));
  };

  const handleCustomDelayChange = (val: string) => {
    setCustomDelayInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setDelayMinutes(num);
    }
  };

  const handleSubmit = async () => {
    if (stats.eligible === 0) {
      showError('No eligible uncompleted matches found to reschedule');
      return;
    }

    setIsSubmitting(true);
    try {
      const req: BatchRescheduleRequest = {
        configId,
        mode,
        delayMinutes: mode === 'TIME_SHIFT' ? delayMinutes : undefined,
        newDate: mode === 'NEW_DATE' ? newDate : undefined,
        startTime: mode === 'NEW_DATE' ? startTime : undefined,
        intervalMinutes:
          mode === 'NEW_DATE' && spacingOption !== 'PRESERVE'
            ? parseInt(spacingOption, 10)
            : undefined,
        fromDateTime: applyCutoff && cutoffTime ? cutoffTime : undefined,
        matchIds: isSelective ? selectedMatchIds : undefined,
      };

      const res = await tournamentService.batchRescheduleMatches(configId, req);
      showSuccess(res.message || `Rescheduled ${res.updatedCount} matches successfully`);
      onSuccess(res.updatedMatches || []);
      onClose();
    } catch (err: any) {
      showError(err?.message || 'Failed to batch reschedule matches on server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-900 via-amber-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <FastForward className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                {isSelective
                  ? `Reschedule ${selectedMatchIds!.length} Selected Matches`
                  : 'Reschedule Remaining Matches / Delay'}
              </h3>
              <p className="text-[11px] text-amber-200 truncate max-w-sm">
                {tournamentName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Status summary banner */}
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="leading-relaxed">
              <span className="font-bold text-slate-800">
                {isSelective ? 'Selective Reschedule: ' : 'Safety Guarantee: '}
              </span>
              {isSelective ? (
                <>
                  Applying only to the <strong>{stats.eligible} selected</strong> matches. All other unselected and completed matches will remain completely untouched.
                </>
              ) : (
                <>
                  {stats.completed} completed match{stats.completed !== 1 ? 'es are' : ' is'} locked and will{' '}
                  <strong className="text-emerald-700">NOT</strong> be touched.
                  Only the <strong>{stats.eligible} uncompleted</strong> matches will be shifted.
                </>
              )}
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Rescheduling Action:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('TIME_SHIFT')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  mode === 'TIME_SHIFT'
                    ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-400'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Time Delay (Same Day)</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Postpone remaining matches by minutes/hours (e.g. for rain delays).
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('NEW_DATE')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  mode === 'NEW_DATE'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Move to New Date</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Carry over remaining fixtures to tomorrow or next weekend.
                </span>
              </button>
            </div>
          </div>

          {/* Mode Options */}
          {mode === 'TIME_SHIFT' ? (
            <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Quick Delay Duration:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[30, 45, 60, 90, 120, 180].map((mins) => {
                    const isSelected = delayMinutes === mins;
                    const label =
                      mins < 60
                        ? `+${mins}m`
                        : mins % 60 === 0
                        ? `+${mins / 60}h`
                        : `+${Math.floor(mins / 60)}h ${mins % 60}m`;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleQuickDelay(mins)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Or Custom Delay (in minutes):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={customDelayInput}
                    onChange={(e) => handleCustomDelayChange(e.target.value)}
                    className="w-32 px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg bg-white focus:border-amber-500 outline-none"
                  />
                  <span className="text-xs text-slate-500 font-medium">
                    minutes (= {Math.floor(delayMinutes / 60)}h {delayMinutes % 60}m)
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal pt-1">
                All {stats.eligible} eligible matches will be delayed by{' '}
                <strong className="text-amber-700">+{delayMinutes} minutes</strong>, maintaining
                all existing court assignments and time gaps.
              </p>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Scheduled Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 px-3 py-2 border border-slate-200 rounded-lg bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  First Match Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09:00 AM or 14:00"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 px-3 py-2 border border-slate-200 rounded-lg bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Match Spacing on New Date:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'PRESERVE', label: 'Keep original spacing' },
                    { key: '30', label: 'Every 30 minutes' },
                    { key: '45', label: 'Every 45 minutes' },
                    { key: '60', label: 'Every 60 minutes' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSpacingOption(opt.key as any)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border text-left cursor-pointer transition ${
                        spacingOption === opt.key
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Optional Cutoff Filter */}
          <div className="pt-1 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={applyCutoff}
                onChange={(e) => setApplyCutoff(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
              />
              <span>Only shift matches scheduled after a specific time</span>
            </label>

            {applyCutoff && (
              <div className="mt-2 pl-5">
                <input
                  type="datetime-local"
                  value={cutoffTime}
                  onChange={(e) => setCutoffTime(e.target.value)}
                  className="text-xs font-medium text-slate-700 px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:border-indigo-500 outline-none w-full"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Earlier matches on the same day will remain unchanged.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500">
            {stats.eligible} match{stats.eligible !== 1 ? 'es' : ''} will update
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || stats.eligible === 0}
              onClick={handleSubmit}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Rescheduling…</span>
                </>
              ) : (
                <>
                  <span>Apply Reschedule ({stats.eligible})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
