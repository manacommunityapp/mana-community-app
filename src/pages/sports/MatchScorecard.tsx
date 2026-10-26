import React, { useState, useEffect } from 'react';
import { CricketScorecard } from '../../components/sports/CricketScorecard';
import { MatchPhotoGallery } from '../../components/sports/MatchPhotoGallery';
import { PeerRatingModal } from '../../components/sports/PeerRatingModal';
import { sportsEnhancedService } from '../../services/sportsEnhancedService';
import type {
  CricketScorecard as IScorecard,
  MatchPhoto, MatchRatingSummary,
} from '../../types/sports-enhanced';

interface Props {
  matchId:       number;
  matchTitle:    string;
  sport:         string;
  isCompleted:   boolean;
  isAdmin:       boolean;
  currentUserId: number;
}

type Tab = 'scorecard' | 'photos' | 'ratings';

export function MatchScorecard({
  matchId, matchTitle, sport, isCompleted, isAdmin, currentUserId,
}: Props) {
  const [tab,      setTab]      = useState<Tab>('scorecard');
  const [scorecard, setScorecard] = useState<IScorecard | null>(null);
  const [photos,    setPhotos]    = useState<MatchPhoto[]>([]);
  const [ratings,   setRatings]   = useState<MatchRatingSummary | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const isCricket = sport === 'CRICKET';

  useEffect(() => {
    if (tab === 'scorecard' && isCricket) {
      setLoading(true);
      sportsEnhancedService.getScorecard(matchId)
        .then(setScorecard)
        .catch(() => setScorecard(null))
        .finally(() => setLoading(false));
    } else if (tab === 'photos') {
      refreshPhotos();
    } else if (tab === 'ratings') {
      sportsEnhancedService.getMatchRatings(matchId).then(setRatings).catch(console.error);
    }
  }, [tab, matchId]);

  function refreshPhotos() {
    sportsEnhancedService.getMatchPhotos(matchId).then(setPhotos).catch(console.error);
  }

  const tabs = [
    isCricket && { key: 'scorecard' as const, label: '📋 Scorecard' },
    { key: 'photos'   as const, label: '📸 Photos'    },
    isCompleted && { key: 'ratings' as const, label: '⭐ Ratings' },
  ].filter(Boolean) as { key: Tab; label: string }[];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
              tab === t.key ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scorecard tab */}
      {tab === 'scorecard' && isCricket && (
        <div className="space-y-4">
          {isAdmin && (
            <a
              href={`/sports/scorecard/entry/${matchId}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-semibold text-sm hover:bg-indigo-50"
            >
              ✏️ {scorecard ? 'Update' : 'Enter'} Scorecard
            </a>
          )}
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-20 bg-gray-100 rounded-xl" />
              <div className="h-40 bg-gray-100 rounded-xl" />
            </div>
          ) : scorecard ? (
            <CricketScorecard scorecard={scorecard} />
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-3xl mb-2">📋</p>
              <p className="font-semibold text-gray-700">No scorecard yet</p>
              {isAdmin && (
                <p className="text-sm text-gray-500 mt-1">
                  Enter the match details using the button above.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Photos tab */}
      {tab === 'photos' && (
        <MatchPhotoGallery
          matchId={matchId}
          photos={photos}
          currentUserId={currentUserId}
          onRefresh={refreshPhotos}
        />
      )}

      {/* Ratings tab */}
      {tab === 'ratings' && (
        <div className="space-y-4">
          {ratings?.canRate && !ratings.hasRated && (
            <button
              onClick={() => setShowRatingModal(true)}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700"
            >
              ⭐ Rate Your Players
            </button>
          )}

          {ratings?.manOfMatch && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <span className="text-3xl">⭐</span>
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase">Man of the Match</p>
                <p className="font-bold text-amber-900 text-base">{ratings.manOfMatch.playerName}</p>
                <p className="text-sm text-amber-600">{ratings.manOfMatch.voteCount} votes</p>
              </div>
            </div>
          )}

          {ratings?.players.map((p) => (
            <div key={p.playerId} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white">
              <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                {p.playerName[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{p.playerName}</p>
                {p.topReaction && (
                  <p className="text-xs text-gray-500">
                    {['🌟','🎯','🤝','💪','🏅'][[
                      'BEST_PLAYER','CLUTCH','TEAM_PLAYER','CONSISTENT','GOOD_SPORT',
                    ].indexOf(p.topReaction)] ?? ''}{' '}
                    {p.topReaction.replace('_', ' ').toLowerCase()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-amber-400">{'★'.repeat(Math.round(p.averageRating))}{'☆'.repeat(5 - Math.round(p.averageRating))}</p>
                <p className="text-xs text-gray-400">{p.averageRating.toFixed(1)}</p>
              </div>
            </div>
          ))}

          {!ratings && (
            <div className="text-center py-8 text-gray-500">
              <p>Ratings will be available after the match ends.</p>
            </div>
          )}
        </div>
      )}

      {/* Rating modal */}
      {showRatingModal && ratings && (
        <PeerRatingModal
          matchId={matchId}
          summary={ratings}
          onClose={() => setShowRatingModal(false)}
          onDone={() => {
            setShowRatingModal(false);
            sportsEnhancedService.getMatchRatings(matchId).then(setRatings).catch(console.error);
          }}
        />
      )}
    </div>
  );
}
