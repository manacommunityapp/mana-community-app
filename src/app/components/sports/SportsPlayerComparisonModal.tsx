import { useState, useEffect } from "react";
import { X, ArrowRightLeft, Star, TrendingUp, Trophy } from "lucide-react";
import { sportsCricHeroesService } from "../../../services/sports/sportsCricHeroesService";
import { computeLocalRating } from "../../../hooks/useSportsCricHeroesProfile";
import type { CricHeroesPlayerProfile, PlayerRating } from "../../../types/sportsCricheroes";
import { TIER_CONFIG, BADGE_CONFIG } from "../../../types/sportsCricheroes";
import type { AuctionPlayer } from "../../../types/api";

interface SportsPlayerComparisonModalProps {
  open: boolean;
  onClose: () => void;
  players: AuctionPlayer[];
  profiles: Record<number, CricHeroesPlayerProfile>;
}

interface ComparedPlayer {
  player: AuctionPlayer;
  profile: CricHeroesPlayerProfile;
  rating: PlayerRating;
}

export function SportsPlayerComparisonModal({ open, onClose, players, profiles }: SportsPlayerComparisonModalProps) {
  const [playerAId, setPlayerAId] = useState<number | null>(null);
  const [playerBId, setPlayerBId] = useState<number | null>(null);
  const [compA, setCompA] = useState<ComparedPlayer | null>(null);
  const [compB, setCompB] = useState<ComparedPlayer | null>(null);

  const linkedPlayers = players.filter(p => profiles[p.id]);

  useEffect(() => {
    if (playerAId && profiles[playerAId]) {
      const player = players.find(p => p.id === playerAId)!;
      const profile = profiles[playerAId];
      setCompA({ player, profile, rating: computeLocalRating(profile) });
    } else {
      setCompA(null);
    }
  }, [playerAId, profiles, players]);

  useEffect(() => {
    if (playerBId && profiles[playerBId]) {
      const player = players.find(p => p.id === playerBId)!;
      const profile = profiles[playerBId];
      setCompB({ player, profile, rating: computeLocalRating(profile) });
    } else {
      setCompB(null);
    }
  }, [playerBId, profiles, players]);

  if (!open) return null;

  const statRows: { label: string; getA: (c: ComparedPlayer) => number | string; getB: (c: ComparedPlayer) => number | string; higherBetter?: boolean }[] = [
    { label: 'Overall Rating', getA: c => c.rating.overall, getB: c => c.rating.overall, higherBetter: true },
    { label: 'Matches', getA: c => c.profile.batting.matches, getB: c => c.profile.batting.matches, higherBetter: true },
    { label: 'Runs', getA: c => c.profile.batting.runs, getB: c => c.profile.batting.runs, higherBetter: true },
    { label: 'Batting Avg', getA: c => c.profile.batting.average, getB: c => c.profile.batting.average, higherBetter: true },
    { label: 'Strike Rate', getA: c => c.profile.batting.strikeRate, getB: c => c.profile.batting.strikeRate, higherBetter: true },
    { label: 'Highest Score', getA: c => c.profile.batting.highestScore, getB: c => c.profile.batting.highestScore },
    { label: '50s / 100s', getA: c => `${c.profile.batting.fifties} / ${c.profile.batting.hundreds}`, getB: c => `${c.profile.batting.fifties} / ${c.profile.batting.hundreds}` },
    { label: '4s / 6s', getA: c => `${c.profile.batting.fours} / ${c.profile.batting.sixes}`, getB: c => `${c.profile.batting.fours} / ${c.profile.batting.sixes}` },
    { label: 'Wickets', getA: c => c.profile.bowling.wickets, getB: c => c.profile.bowling.wickets, higherBetter: true },
    { label: 'Bowling Avg', getA: c => c.profile.bowling.average, getB: c => c.profile.bowling.average, higherBetter: false },
    { label: 'Economy', getA: c => c.profile.bowling.economy, getB: c => c.profile.bowling.economy, higherBetter: false },
    { label: 'Best Figures', getA: c => c.profile.bowling.bestFigures, getB: c => c.profile.bowling.bestFigures },
    { label: 'Catches', getA: c => c.profile.fielding.catches, getB: c => c.profile.fielding.catches, higherBetter: true },
    { label: 'Stumpings', getA: c => c.profile.fielding.stumpings, getB: c => c.profile.fielding.stumpings, higherBetter: true },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ width: '95%', maxWidth: 720, maxHeight: '90vh', background: 'var(--card)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '14px 18px', background: 'rgba(212,160,23,0.06)', borderBottom: '1px solid rgba(212,160,23,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowRightLeft size={16} style={{ color: 'var(--gold)' }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Head-to-Head Comparison</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Player Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, padding: '14px 18px', alignItems: 'center' }}>
          <select
            value={playerAId ?? ''}
            onChange={e => setPlayerAId(e.target.value ? Number(e.target.value) : null)}
            style={{ fontSize: 12, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(212,160,23,0.2)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="">Select Player A</option>
            {linkedPlayers.filter(p => p.id !== playerBId).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>VS</div>
          <select
            value={playerBId ?? ''}
            onChange={e => setPlayerBId(e.target.value ? Number(e.target.value) : null)}
            style={{ fontSize: 12, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(212,160,23,0.2)', background: 'var(--card)', color: 'var(--text)' }}
          >
            <option value="">Select Player B</option>
            {linkedPlayers.filter(p => p.id !== playerAId).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Comparison Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 18px' }}>
          {compA && compB ? (
            <>
              {/* Player Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginBottom: 14 }}>
                <PlayerHeader comp={compA} />
                <div />
                <PlayerHeader comp={compB} />
              </div>

              {/* Stat Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {statRows.map(row => {
                  const valA = row.getA(compA);
                  const valB = row.getB(compB);
                  const numA = typeof valA === 'number' ? valA : NaN;
                  const numB = typeof valB === 'number' ? valB : NaN;
                  let winnerA = false, winnerB = false;
                  if (!isNaN(numA) && !isNaN(numB) && numA !== numB && row.higherBetter !== undefined) {
                    if (row.higherBetter) { winnerA = numA > numB; winnerB = numB > numA; }
                    else { winnerA = numA < numB; winnerB = numB < numA; }
                  }
                  return (
                    <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: winnerA ? 700 : 400, color: winnerA ? 'var(--green)' : 'var(--text)' }}>
                        {typeof valA === 'number' ? formatNum(valA) : valA}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', width: 90, textAlign: 'center', alignSelf: 'center' }}>{row.label}</div>
                      <div style={{ textAlign: 'left', fontSize: 13, fontWeight: winnerB ? 700 : 400, color: winnerB ? 'var(--green)' : 'var(--text)' }}>
                        {typeof valB === 'number' ? formatNum(valB) : valB}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Form Comparison */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendingUp size={11} /> Recent Form
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FormStrip innings={compA.profile.recentForm} />
                  <FormStrip innings={compB.profile.recentForm} />
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)' }}>
              <ArrowRightLeft size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 13, marginBottom: 4 }}>Select two players with linked CricHeroes profiles</div>
              <div style={{ fontSize: 11 }}>{linkedPlayers.length} player{linkedPlayers.length !== 1 ? 's' : ''} available for comparison</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerHeader({ comp }: { comp: ComparedPlayer }) {
  const tierCfg = TIER_CONFIG[comp.rating.tier];
  return (
    <div style={{ textAlign: 'center', padding: 12, borderRadius: 10, background: 'rgba(212,160,23,0.04)', border: '1px solid rgba(212,160,23,0.1)' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: tierCfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 16, fontWeight: 700, color: '#fff' }}>
        {comp.profile.bio.fullName.charAt(0)}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{comp.player.name}</div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{comp.profile.bio.primaryRole}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${tierCfg.color}20`, color: tierCfg.color }}>{tierCfg.label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Star size={11} fill="var(--gold)" /> {comp.rating.overall.toFixed(1)}
        </span>
      </div>
      {comp.rating.badges.length > 0 && (
        <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
          {comp.rating.badges.map(b => (
            <span key={b} title={BADGE_CONFIG[b].description} style={{ fontSize: 14 }}>{BADGE_CONFIG[b].emoji}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function FormStrip({ innings }: { innings: { runs?: number; balls?: number; wickets?: number; runsConceded?: number }[] }) {
  if (!innings.length) return <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>No recent data</div>;
  return (
    <div style={{ display: 'flex', gap: 3, overflowX: 'auto' }}>
      {innings.slice(0, 8).map((inn, i) => {
        const runs = inn.runs ?? 0;
        const bg = runs >= 50 ? 'rgba(34,197,94,0.15)' : runs >= 30 ? 'rgba(212,160,23,0.15)' : 'rgba(148,163,184,0.08)';
        return (
          <div key={i} style={{ minWidth: 40, padding: '4px 6px', borderRadius: 6, background: bg, textAlign: 'center', flexShrink: 0 }}>
            {inn.runs != null && <div style={{ fontSize: 12, fontWeight: 700, color: runs >= 50 ? 'var(--green)' : 'var(--text)' }}>{runs}</div>}
            {inn.wickets != null && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{inn.wickets}w</div>}
          </div>
        );
      })}
    </div>
  );
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString('en-IN');
  return n.toFixed(1);
}
