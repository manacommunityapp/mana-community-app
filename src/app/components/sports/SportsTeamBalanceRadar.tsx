import { useState, useEffect } from "react";
import { Users, TrendingUp, Shield, Crosshair } from "lucide-react";
import { sportsCricHeroesService } from "../../../services/sports/sportsCricHeroesService";
import type { TeamComposition } from "../../../types/sportsCricheroes";
import type { AuctionTeam } from "../../../types/api";

interface SportsTeamBalanceRadarProps {
  configId: number;
  teams: AuctionTeam[];
}

export function SportsTeamBalanceRadar({ configId, teams }: SportsTeamBalanceRadarProps) {
  const [compositions, setCompositions] = useState<Record<number, TeamComposition>>({});
  const [loading, setLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  useEffect(() => {
    if (!teams.length || !configId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all(
      teams.map(t =>
        sportsCricHeroesService.getTeamComposition(configId, t.id)
          .then(comp => ({ teamId: t.id, comp }))
          .catch(() => null)
      )
    ).then(results => {
      if (cancelled) return;
      const map: Record<number, TeamComposition> = {};
      for (const r of results) {
        if (r) map[r.teamId] = r.comp;
      }
      setCompositions(map);
      if (teams.length > 0 && !selectedTeamId) setSelectedTeamId(teams[0].id);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [configId, teams.length]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 11 }}>
        Analyzing team compositions...
      </div>
    );
  }

  if (Object.keys(compositions).length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--muted)' }}>
        <Users size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
        <div style={{ fontSize: 12 }}>Team composition data unavailable</div>
        <div style={{ fontSize: 10, marginTop: 4 }}>Link CricHeroes profiles to players to see team analytics</div>
      </div>
    );
  }

  const selected = selectedTeamId ? compositions[selectedTeamId] : null;
  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div>
      {/* Team Selector Pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {teams.map(team => {
          const comp = compositions[team.id];
          const isActive = team.id === selectedTeamId;
          return (
            <button
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                border: `1px solid ${isActive ? team.colorHex || 'var(--gold)' : 'rgba(148,163,184,0.15)'}`,
                background: isActive ? `${team.colorHex || 'var(--gold)'}15` : 'transparent',
                color: isActive ? team.colorHex || 'var(--gold)' : 'var(--muted)',
                fontSize: 11, fontWeight: isActive ? 700 : 400, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span>{team.emoji}</span> {team.name || team.teamName}
              {comp && <span style={{ fontSize: 9, opacity: 0.7 }}>({comp.totalPlayers})</span>}
            </button>
          );
        })}
      </div>

      {selected && selectedTeam && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {/* Role Distribution */}
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(212,160,23,0.04)', border: '1px solid rgba(212,160,23,0.1)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={11} /> Squad Composition
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <RoleBar label="Batters" count={selected.batters} total={selected.totalPlayers} color="#3b82f6" />
              <RoleBar label="Bowlers" count={selected.bowlers} total={selected.totalPlayers} color="#ef4444" />
              <RoleBar label="All-Rounders" count={selected.allRounders} total={selected.totalPlayers} color="#8b5cf6" />
              <RoleBar label="Keepers" count={selected.wicketKeepers} total={selected.totalPlayers} color="#f59e0b" />
            </div>
          </div>

          {/* Batting/Bowling Balance */}
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(212,160,23,0.04)', border: '1px solid rgba(212,160,23,0.1)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Crosshair size={11} /> Batting & Bowling
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <StatBlock label="Left-Hand Bats" value={selected.leftHandBats} sub={`${selected.rightHandBats} Right-Hand`} />
              <StatBlock label="Pace Bowlers" value={selected.pacers} sub={`${selected.spinners} Spinners`} />
              <StatBlock label="Team Runs" value={selected.totalRuns.toLocaleString('en-IN')} />
              <StatBlock label="Team Wickets" value={selected.totalWickets} />
            </div>
          </div>

          {/* Performance Averages */}
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(212,160,23,0.04)', border: '1px solid rgba(212,160,23,0.1)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={11} /> Team Averages
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <BigStat label="Bat Avg" value={selected.avgBattingAverage.toFixed(1)} good={selected.avgBattingAverage > 25} />
              <BigStat label="Bowl Econ" value={selected.avgBowlingEconomy.toFixed(1)} good={selected.avgBowlingEconomy < 7} />
              <BigStat label="Strike Rate" value={selected.avgStrikeRate.toFixed(1)} good={selected.avgStrikeRate > 120} />
            </div>
          </div>

          {/* Budget Overview */}
          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(212,160,23,0.04)', border: '1px solid rgba(212,160,23,0.1)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={11} /> Budget
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>&#8377;{selected.budgetSpent.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>Spent</div>
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>/</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>&#8377;{(selected.budgetSpent + selected.budgetRemaining).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>Total</div>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${((selected.budgetSpent / (selected.budgetSpent + selected.budgetRemaining)) * 100).toFixed(0)}%`,
                background: selectedTeam.colorHex || 'var(--gold)',
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, textAlign: 'right' }}>
              &#8377;{selected.budgetRemaining.toLocaleString('en-IN')} remaining
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: 'var(--text)' }}>{label}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>{count}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function StatBlock({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 4px' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function BigStat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 4px' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: good ? 'var(--green)' : 'var(--red)' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}
