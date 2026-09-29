import React, { useState } from 'react';
import type { MatchRatingSummary, PlayerReaction } from '../../types/sports-enhanced';
import { sportsEnhancedService } from '../../services/sportsEnhancedService';

const REACTIONS: { key: PlayerReaction; emoji: string; label: string }[] = [
  { key: 'BEST_PLAYER', emoji: '🌟', label: 'Best Player' },
  { key: 'CLUTCH',      emoji: '🎯', label: 'Clutch'      },
  { key: 'TEAM_PLAYER', emoji: '🤝', label: 'Team Player' },
  { key: 'CONSISTENT',  emoji: '💪', label: 'Consistent'  },
  { key: 'GOOD_SPORT',  emoji: '🏅', label: 'Good Sport'  },
];

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange?.(n)}
          disabled={!onChange}
          className={`text-2xl transition-transform hover:scale-110 ${n <= value ? 'text-amber-400' : 'text-gray-200'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

interface Props {
  matchId:  number;
  summary:  MatchRatingSummary;
  onClose:  () => void;
  onDone:   () => void;
}

export function PeerRatingModal({ matchId, summary, onClose, onDone }: Props) {
  const [ratings,  setRatings]  = useState<Record<number, { stars: number; reaction?: PlayerReaction; isManOfMatch: boolean }>>({});
  const [momId,    setMomId]    = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setStars(playerId: number, stars: number) {
    setRatings((prev) => ({ ...prev, [playerId]: { stars, reaction: prev[playerId]?.reaction, isManOfMatch: prev[playerId]?.isManOfMatch ?? false } }));
  }

  function setReaction(playerId: number, reaction: PlayerReaction) {
    setRatings((prev) => ({ ...prev, [playerId]: { stars: prev[playerId]?.stars ?? 3, reaction, isManOfMatch: prev[playerId]?.isManOfMatch ?? false } }));
  }

  function toggleMom(playerId: number) {
    const newMom = momId === playerId ? null : playerId;
    setMomId(newMom);
    setRatings((prev) => {
      const updated: typeof prev = {};
      Object.entries(prev).forEach(([k, v]) => {
        updated[Number(k)] = { ...v, isManOfMatch: Number(k) === newMom };
      });
      if (newMom && !updated[newMom]) {
        updated[newMom] = { stars: 4, reaction: 'BEST_PLAYER', isManOfMatch: true };
      }
      return updated;
    });
  }

  async function handleSubmit() {
    const ratingList = summary.players
      .filter((p) => ratings[p.playerId]?.stars)
      .map((p) => ({
        playerId:     p.playerId,
        stars:        ratings[p.playerId].stars,
        reaction:     ratings[p.playerId].reaction,
        isManOfMatch: ratings[p.playerId].isManOfMatch ?? false,
      }));
    if (ratingList.length === 0) return;
    setSubmitting(true);
    try {
      await sportsEnhancedService.submitRatings(matchId, ratingList);
      onDone();
    } catch {
      setSubmitting(false);
    }
  }

  // Result view (already rated)
  if (summary.hasRated) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-bold">Match Ratings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
          <div className="p-6 space-y-4">
            {summary.manOfMatch && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <span className="text-3xl">⭐</span>
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase">Man of the Match</p>
                  <p className="font-bold text-amber-900">{summary.manOfMatch.playerName}</p>
                  <p className="text-sm text-amber-700">{summary.manOfMatch.voteCount} votes</p>
                </div>
              </div>
            )}
            {summary.players.map((p) => (
              <div key={p.playerId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                  {p.playerName[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{p.playerName}</p>
                  {p.topReaction && (
                    <p className="text-xs text-gray-500">
                      {REACTIONS.find((r) => r.key === p.topReaction)?.emoji}{' '}
                      {REACTIONS.find((r) => r.key === p.topReaction)?.label}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <Stars value={Math.round(p.averageRating)} />
                  <p className="text-xs text-gray-400">{p.averageRating.toFixed(1)} avg</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const canSubmit = Object.values(ratings).some((r) => r.stars > 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold">Rate Your Players</h2>
            <p className="text-sm text-gray-500">Ratings are anonymous</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* MOM vote */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-amber-800">⭐ Vote for Man of the Match</p>
            <div className="flex flex-wrap gap-2">
              {summary.players.map((p) => (
                <button
                  key={p.playerId}
                  onClick={() => toggleMom(p.playerId)}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition-all',
                    momId === p.playerId
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white border-amber-200 text-amber-800 hover:border-amber-400',
                  ].join(' ')}
                >
                  <span className="text-base">{p.playerName[0]}</span>
                  {p.playerName.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Per-player ratings */}
          {summary.players.map((p) => {
            const r = ratings[p.playerId];
            const isMom = momId === p.playerId;
            return (
              <div
                key={p.playerId}
                className={[
                  'border-2 rounded-xl p-4 space-y-3 transition-colors',
                  isMom ? 'border-amber-300 bg-amber-50' : 'border-gray-200',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                    {p.playerName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{p.playerName}</p>
                    {p.flatNo && <p className="text-xs text-gray-400">{p.flatNo}</p>}
                  </div>
                  {isMom && (
                    <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
                      ⭐ MOM
                    </span>
                  )}
                </div>

                <Stars value={r?.stars ?? 0} onChange={(v) => setStars(p.playerId, v)} />

                <div className="flex flex-wrap gap-1.5">
                  {REACTIONS.map((react) => (
                    <button
                      key={react.key}
                      onClick={() => setReaction(p.playerId, react.key)}
                      className={[
                        'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
                        r?.reaction === react.key
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300',
                      ].join(' ')}
                    >
                      {react.emoji} {react.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit Ratings'}
          </button>
        </div>
      </div>
    </div>
  );
}
