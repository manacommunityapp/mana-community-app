import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import {
  Trophy, Users, Calendar, Award, Flame, Zap, Footprints,
  Droplets, Apple, Target, Star, ChevronDown, ChevronUp,
  Plus, CheckCircle, TrendingUp, Medal, X,
} from 'lucide-react';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { WellnessChallengeDto, ChallengeStatus, ChallengeParticipantDto } from '../../../types/wellness';

// ─── helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: typeof Footprints; color: string; bg: string }> = {
  WALKING:   { label: 'Walking',   icon: Footprints, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  HYDRATION: { label: 'Hydration', icon: Droplets,   color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950/40'    },
  NUTRITION: { label: 'Nutrition', icon: Apple,      color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40' },
  FITNESS:   { label: 'Fitness',   icon: Zap,        color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
  YOGA:      { label: 'Yoga',      icon: Target,     color: 'text-pink-600 dark:text-pink-400',   bg: 'bg-pink-50 dark:bg-pink-950/40'    },
  CUSTOM:    { label: 'Custom',    icon: Star,       color: 'text-slate-600 dark:text-slate-400',  bg: 'bg-slate-50 dark:bg-slate-800'     },
};

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function daysTotal(start: string, end: string) {
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
}

function daysElapsed(start: string) {
  const diff = Date.now() - new Date(start).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

// Mock leaderboard for a challenge (backend doesn't expose /leaderboard yet)
function mockLeaderboard(challenge: WellnessChallengeDto): { rank: number; name: string; progress: number; completed: boolean }[] {
  const seed = challenge.id * 7;
  const names = ['Ravi Kumar', 'Deepak Nair', 'Anitha Reddy', 'Kavya S', 'Rohit Menon', 'Suresh Babu', 'Tarun Reddy', 'Imran Khan'];
  const count = Math.min(8, (seed % 5) + 4);
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    name: names[i % names.length],
    progress: Math.max(10, 100 - i * 11 - (seed % 7)),
    completed: i < 2 && challenge.status === 'COMPLETED',
  }));
}

type ViewTab = 'discover' | 'my' | 'leaderboard';

// ─── progress modal ───────────────────────────────────────────────────────────

function ProgressModal({
  challenge,
  current,
  onSave,
  onClose,
}: {
  challenge: WellnessChallengeDto;
  current: number;
  onSave: (v: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(current);
  const max = challenge.targetValue ?? 100;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Update Progress</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-2">{challenge.title}</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Progress</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{value} / {max} {challenge.targetUnit ?? ''}</span>
          </div>
          <input type="range" min={0} max={max} value={value} onChange={e => setValue(Number(e.target.value))}
            className="w-full accent-indigo-600" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>0</span><span>{max}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 cursor-pointer">Cancel</button>
          <button type="button" onClick={() => onSave(value)}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer">Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── challenge card ───────────────────────────────────────────────────────────

function ChallengeCard({
  challenge,
  joined,
  myProgress,
  onJoin,
  onUpdateProgress,
  onViewLeaderboard,
}: {
  challenge: WellnessChallengeDto;
  joined: boolean;
  myProgress?: number;
  onJoin: (c: WellnessChallengeDto) => void;
  onUpdateProgress: (c: WellnessChallengeDto) => void;
  onViewLeaderboard: (c: WellnessChallengeDto) => void;
}) {
  const meta = TYPE_META[challenge.challengeType] ?? TYPE_META.CUSTOM;
  const Icon = meta.icon;
  const left = daysLeft(challenge.endDate);
  const total = daysTotal(challenge.startDate, challenge.endDate);
  const elapsed = daysElapsed(challenge.startDate);
  const timeProgress = Math.min(100, Math.round((elapsed / total) * 100));
  const actProgress = joined && challenge.targetValue ? Math.min(100, Math.round(((myProgress ?? 0) / challenge.targetValue) * 100)) : 0;
  const isCompleted = actProgress >= 100;

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden ${isCompleted ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-800'}`}>
      {/* Top bar */}
      <div className={`px-4 py-3 flex items-center gap-3 ${meta.bg}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg} border border-current/20`}>
          <Icon className={`w-5 h-5 ${meta.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{challenge.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold ${meta.color}`}>{meta.label}</span>
            {challenge.badgeName && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
                <Award className="w-2.5 h-2.5" />{challenge.badgeName}
              </span>
            )}
          </div>
        </div>
        {isCompleted && (
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {challenge.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{challenge.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {left > 0 ? `${left} days left` : 'Ended'}
          </span>
          {challenge.targetValue && (
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              Target: {challenge.targetValue} {challenge.targetUnit ?? ''}
            </span>
          )}
          {challenge.participantCount !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {challenge.participantCount} joined
            </span>
          )}
        </div>

        {/* Time progress bar */}
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Time elapsed</span>
            <span>{timeProgress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-slate-300 dark:bg-slate-600 rounded-full transition-all" style={{ width: `${timeProgress}%` }} />
          </div>
        </div>

        {/* My progress bar (if joined) */}
        {joined && challenge.targetValue && (
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className={`font-bold ${meta.color}`}>My progress</span>
              <span className={`font-black ${meta.color}`}>{actProgress}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${actProgress}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>{myProgress ?? 0} {challenge.targetUnit ?? ''}</span>
              <span>{challenge.targetValue} {challenge.targetUnit ?? ''}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {!joined && challenge.status === 'ACTIVE' && (
            <button type="button" onClick={() => onJoin(challenge)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer transition">
              <Plus className="w-3.5 h-3.5" />Join Challenge
            </button>
          )}
          {joined && challenge.status === 'ACTIVE' && (
            <button type="button" onClick={() => onUpdateProgress(challenge)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 cursor-pointer transition border border-indigo-200 dark:border-indigo-800">
              <TrendingUp className="w-3.5 h-3.5" />Update Progress
            </button>
          )}
          <button type="button" onClick={() => onViewLeaderboard(challenge)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />Board
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function WellnessChallenges() {
  const [viewTab, setViewTab] = useState<ViewTab>('discover');
  const [statusTab, setStatusTab] = useState<ChallengeStatus>('ACTIVE');
  const [challenges, setChallenges] = useState<WellnessChallengeDto[]>([]);
  const [loading, setLoading] = useState(true);
  // Track which challenges the user has joined + their progress (localStorage)
  const [joined, setJoined] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem('mana_challenge_progress') || '{}'); } catch { return {}; }
  });
  const [progressModal, setProgressModal] = useState<WellnessChallengeDto | null>(null);
  const [leaderboard, setLeaderboard] = useState<WellnessChallengeDto | null>(null);

  useEffect(() => { load(); }, [statusTab, viewTab]);

  async function load() {
    setLoading(true);
    try {
      const status = viewTab === 'my' ? undefined : statusTab;
      setChallenges(await wellnessService.getChallenges(status));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleJoin(challenge: WellnessChallengeDto) {
    try {
      await wellnessService.joinChallenge(challenge.id);
    } catch { /* continue even if API fails */ }
    const updated = { ...joined, [challenge.id]: 0 };
    setJoined(updated);
    localStorage.setItem('mana_challenge_progress', JSON.stringify(updated));
  }

  async function handleSaveProgress(challenge: WellnessChallengeDto, value: number) {
    try {
      await wellnessService.updateProgress(challenge.id, value);
    } catch { /* continue */ }
    const updated = { ...joined, [challenge.id]: value };
    setJoined(updated);
    localStorage.setItem('mana_challenge_progress', JSON.stringify(updated));
    setProgressModal(null);
  }

  const myChallenges = useMemo(() => challenges.filter(c => joined[c.id] !== undefined), [challenges, joined]);
  const displayChallenges = viewTab === 'my' ? myChallenges : challenges;

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">Fitness Challenges</h1>
            <p className="text-xs text-slate-500 mt-0.5">Community-wide goals &amp; leaderboards</p>
          </div>
        </div>
        <Link to="/wellness/profile"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          Set Goals
        </Link>
      </div>

      {/* View tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
        {([
          { id: 'discover'    as const, label: 'Discover',    icon: Flame   },
          { id: 'my'          as const, label: 'My Challenges',icon: CheckCircle },
          { id: 'leaderboard' as const, label: 'Top Finishers',icon: Medal  },
        ] as const).map(t => (
          <button key={t.id} type="button" onClick={() => setViewTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewTab === t.id ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
            {t.id === 'my' && Object.keys(joined).length > 0 && (
              <span className="text-[9px] font-black bg-indigo-600 text-white rounded-full px-1 ml-0.5">{Object.keys(joined).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════ DISCOVER / MY CHALLENGES ════ */}
      {(viewTab === 'discover' || viewTab === 'my') && (
        <>
          {/* Status filter (only on Discover) */}
          {viewTab === 'discover' && (
            <div className="flex gap-1.5">
              {(['ACTIVE', 'UPCOMING', 'COMPLETED'] as ChallengeStatus[]).map(s => (
                <button key={s} type="button" onClick={() => setStatusTab(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    statusTab === s ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
            </div>
          ) : displayChallenges.length === 0 ? (
            <div className="text-center py-14 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                {viewTab === 'my' ? "You haven't joined any challenges yet." : `No ${statusTab.toLowerCase()} challenges.`}
              </p>
              {viewTab === 'my' && (
                <button type="button" onClick={() => setViewTab('discover')}
                  className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 cursor-pointer">
                  Browse Challenges
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayChallenges.map(c => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  joined={joined[c.id] !== undefined}
                  myProgress={joined[c.id]}
                  onJoin={handleJoin}
                  onUpdateProgress={setProgressModal}
                  onViewLeaderboard={setLeaderboard}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ════ TOP FINISHERS ════ */}
      {viewTab === 'leaderboard' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-14 text-slate-400 text-sm">No challenges available.</div>
          ) : (
            challenges.filter(c => c.status === 'ACTIVE' || c.status === 'COMPLETED').map(c => {
              const board = mockLeaderboard(c);
              const meta = TYPE_META[c.challengeType] ?? TYPE_META.CUSTOM;
              const Icon = meta.icon;
              return (
                <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className={`px-4 py-3 flex items-center gap-2 ${meta.bg}`}>
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                    <p className="text-sm font-bold text-slate-900 dark:text-white flex-1 truncate">{c.title}</p>
                    <span className="text-[10px] font-bold text-slate-500">{board.length} participants</span>
                  </div>
                  {/* Podium top 3 */}
                  <div className="px-4 py-3 flex justify-center gap-2 sm:gap-4">
                    {[board[1], board[0], board[2]].map((entry, podiumIdx) => {
                      if (!entry) return <div key={podiumIdx} className="flex-1" />;
                      const heights = ['h-16', 'h-20', 'h-14'];
                      const medals = ['🥈', '🥇', '🥉'];
                      return (
                        <div key={entry.rank} className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                            {getInitials(entry.name)}
                          </div>
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">{entry.name.split(' ')[0]}</p>
                          <div className={`w-full ${heights[podiumIdx]} rounded-t-xl flex flex-col items-center justify-end pb-1 ${podiumIdx === 1 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            <span className="text-lg">{medals[podiumIdx]}</span>
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{entry.progress}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Rest of leaderboard */}
                  <div className="px-4 pb-3 space-y-2">
                    {board.slice(3).map(entry => (
                      <div key={entry.rank} className="flex items-center gap-3">
                        <span className="w-5 text-[10px] font-black text-slate-400 text-right">{entry.rank}</span>
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-[10px] font-bold">
                          {getInitials(entry.name)}
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-1">{entry.name}</p>
                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${entry.progress}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{entry.progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Progress update modal */}
      {progressModal && (
        <ProgressModal
          challenge={progressModal}
          current={joined[progressModal.id] ?? 0}
          onSave={(v) => handleSaveProgress(progressModal, v)}
          onClose={() => setProgressModal(null)}
        />
      )}

      {/* Leaderboard modal (from card button) */}
      {leaderboard && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />{leaderboard.title}
              </h3>
              <button type="button" onClick={() => setLeaderboard(null)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-2">
              {mockLeaderboard(leaderboard).map(entry => (
                <div key={entry.rank} className="flex items-center gap-3">
                  <span className={`w-6 text-xs font-black text-center ${entry.rank <= 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-1">{entry.name}</p>
                  <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${entry.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 w-8 text-right">{entry.progress}%</span>
                  {entry.completed && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
