import React from 'react';
import {
  Zap,
  Shield,
  ArrowRight,
  X,
  Check,
  AlertCircle,
  Trophy,
  Wallet,
  Ticket,
} from 'lucide-react';
import type { AuctionTeam } from '../../../../types/api';

export interface RtmPromptData {
  playerId: number;
  playerName: string;
  playerRole?: string;
  category?: string;
  bidAmount: number;
  highestBidderTeam: {
    id: number;
    name: string;
    emoji?: string;
    color?: string;
  };
  rtmEligibleTeam: {
    id: number;
    name: string;
    emoji?: string;
    color?: string;
    budget: number;
    spent: number;
    remainingBudget: number;
    rtmCardsLeft: number;
  };
}

interface AuctionRtmModalProps {
  data: RtmPromptData;
  onExerciseRtm: (teamId: number, matchAmount: number) => void;
  onDeclineRtm: () => void;
  onClose: () => void;
}

export const AuctionRtmModal: React.FC<AuctionRtmModalProps> = ({
  data,
  onExerciseRtm,
  onDeclineRtm,
  onClose,
}) => {
  const rtmTeam = data.rtmEligibleTeam;
  const bidderTeam = data.highestBidderTeam;
  const canAfford = rtmTeam.remainingBudget >= data.bidAmount;
  const hasCards = rtmTeam.rtmCardsLeft > 0;
  const canExercise = canAfford && hasCards;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-slate-950 text-white rounded-3xl p-6 sm:p-7 border-2 border-amber-500/60 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 space-y-6 text-left"
        style={{
          boxShadow: '0 0 60px rgba(245, 158, 11, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Right To Match (RTM) Card
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Exercise RTM for {data.playerName}?
            </h2>
            <p className="text-xs text-slate-400">
              {data.playerName} previously played for <strong className="text-white">{rtmTeam.name}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Franchise Showdown Card ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Current Winning Bidder Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Current Winning Bidder
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{bidderTeam.emoji || '🏆'}</span>
              <div className="min-w-0">
                <strong className="text-sm font-bold text-white truncate block">
                  {bidderTeam.name}
                </strong>
                <span className="text-xs font-black text-indigo-400">
                  Bid: ₹{data.bidAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* RTM Eligible Franchise Card */}
          <div
            className="p-4 rounded-2xl border space-y-2"
            style={{
              background: `linear-gradient(135deg, ${rtmTeam.color || '#f59e0b'}22, #0f172a)`,
              borderColor: `${rtmTeam.color || '#f59e0b'}66`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Eligible Franchise
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-200 border border-amber-500/40">
                <Ticket className="w-3 h-3" />
                {rtmTeam.rtmCardsLeft} RTM Card{rtmTeam.rtmCardsLeft !== 1 ? 's' : ''} Left
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{rtmTeam.emoji || '⚡'}</span>
              <div className="min-w-0">
                <strong className="text-sm font-bold text-white truncate block">
                  {rtmTeam.name}
                </strong>
                <span className="text-[11px] text-slate-300">
                  Purse: ₹{rtmTeam.remainingBudget.toLocaleString('en-IN')} left
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Rule Notice / Status Alert ──────────────────────────── */}
        {!canAfford ? (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>
              <strong>{rtmTeam.name}</strong> does not have enough remaining purse (₹{rtmTeam.remainingBudget.toLocaleString('en-IN')}) to match ₹{data.bidAmount.toLocaleString('en-IN')}.
            </span>
          </div>
        ) : !hasCards ? (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span><strong>{rtmTeam.name}</strong> has 0 RTM cards remaining this season.</span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-center gap-2">
            <Zap className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Exercising RTM will immediately award <strong>{data.playerName}</strong> to <strong>{rtmTeam.name}</strong> at <strong>₹{data.bidAmount.toLocaleString('en-IN')}</strong> and consume 1 RTM card.
            </span>
          </div>
        )}

        {/* ── Modal Actions ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onDeclineRtm}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-700 text-center"
          >
            ❌ Decline RTM (Sell to {bidderTeam.name})
          </button>

          <button
            type="button"
            onClick={() => onExerciseRtm(rtmTeam.id, data.bidAmount)}
            disabled={!canExercise}
            className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
              canExercise
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 active:scale-98 shadow-amber-500/25'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>⚡ Exercise RTM (Match ₹{data.bidAmount.toLocaleString('en-IN')})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
