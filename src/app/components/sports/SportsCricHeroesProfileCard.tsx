import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, Link2, Unlink, ChevronDown, ChevronUp, Star, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { sportsCricHeroesService } from "../../../services/sports/sportsCricHeroesService";
import { computeLocalRating } from "../../../hooks/useSportsCricHeroesProfile";
import type {
  CricHeroesPlayerProfile,
  PlayerRating,
  RecentInning,
} from "../../../types/sportsCricheroes";
import { TIER_CONFIG, BADGE_CONFIG } from "../../../types/sportsCricheroes";

interface SportsCricHeroesProfileCardProps {
  playerId: number;
  playerName: string;
  compact?: boolean;
  canEdit?: boolean;
  onProfileLinked?: (profile: CricHeroesPlayerProfile) => void;
}

export function SportsCricHeroesProfileCard({ playerId, playerName, compact = false, canEdit = false, onProfileLinked }: SportsCricHeroesProfileCardProps) {
  const [profile, setProfile] = useState<CricHeroesPlayerProfile | null>(null);
  const [rating, setRating] = useState<PlayerRating | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [preview, setPreview] = useState<CricHeroesPlayerProfile | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    sportsCricHeroesService.getProfile(playerId)
      .then(p => {
        if (cancelled) return;
        setProfile(p);
        setRating(computeLocalRating(p));
      })
      .catch(() => { if (!cancelled) setProfile(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [playerId]);

  const handlePreview = async () => {
    if (!linkUrl.trim()) return;
    setLoading(true);
    try {
      const p = await sportsCricHeroesService.previewProfile(linkUrl.trim());
      setPreview(p);
    } catch (err: any) {
      toast.error(err?.message || "Invalid CricHeroes URL");
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!linkUrl.trim()) return;
    setLoading(true);
    try {
      const result = await sportsCricHeroesService.linkProfile({ playerId, cricHeroesUrl: linkUrl.trim() });
      setProfile(result.profile);
      setRating(computeLocalRating(result.profile));
      setShowLink(false);
      setLinkUrl("");
      setPreview(null);
      toast.success("CricHeroes profile linked");
      onProfileLinked?.(result.profile);
    } catch (err: any) {
      toast.error(err?.message || "Failed to link profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    try {
      await sportsCricHeroesService.unlinkProfile(playerId);
      setProfile(null);
      setRating(null);
      toast.success("CricHeroes profile unlinked");
    } catch (err: any) {
      toast.error(err?.message || "Failed to unlink");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const p = await sportsCricHeroesService.refreshProfile(playerId);
      setProfile(p);
      setRating(computeLocalRating(p));
      toast.success("Profile stats refreshed");
    } catch (err: any) {
      toast.error(err?.message || "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !profile) {
    return (
      <div style={{ padding: 12, textAlign: 'center', color: 'var(--muted)', fontSize: 11 }}>
        Loading CricHeroes data...
      </div>
    );
  }

  if (!profile) {
    if (!canEdit) return null;
    return (
      <div style={{ borderRadius: 10, border: '1px dashed rgba(212,160,23,0.3)', padding: '12px 14px', marginTop: 8 }}>
        {showLink ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)', marginBottom: 8 }}>Link CricHeroes Profile</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                style={{ flex: 1, fontSize: 11, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(212,160,23,0.2)', background: 'rgba(0,0,0,0.02)', color: 'var(--text)' }}
                placeholder="https://cricheroes.com/player-profile/..."
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (preview ? handleLink() : handlePreview())}
              />
              {preview ? (
                <button className="btn btn-gold btn-sm" style={{ fontSize: 10, padding: '4px 10px' }} onClick={handleLink} disabled={loading}>
                  Confirm
                </button>
              ) : (
                <button className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: '4px 10px' }} onClick={handlePreview} disabled={loading || !linkUrl.trim()}>
                  Preview
                </button>
              )}
              <button className="btn btn-outline btn-sm" style={{ fontSize: 10, padding: '4px 8px', color: 'var(--muted)' }} onClick={() => { setShowLink(false); setPreview(null); setLinkUrl(""); }}>
                Cancel
              </button>
            </div>
            {preview && (
              <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#000' }}>
                    {preview.bio.fullName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{preview.bio.fullName}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{preview.bio.primaryRole} &middot; {preview.bio.battingStyle}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  <MiniStat label="Matches" value={preview.batting.matches} />
                  <MiniStat label="Runs" value={preview.batting.runs} />
                  <MiniStat label="Wickets" value={preview.bowling.wickets} />
                  <MiniStat label="SR" value={preview.batting.strikeRate.toFixed(1)} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowLink(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Link2 size={13} /> Link CricHeroes Profile
          </button>
        )}
      </div>
    );
  }

  const tierCfg = rating ? TIER_CONFIG[rating.tier] : null;

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
        {tierCfg && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: `${tierCfg.color}20`, color: tierCfg.color, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {tierCfg.label}
          </span>
        )}
        {rating && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Star size={10} fill="var(--gold)" /> {rating.overall.toFixed(1)}
          </span>
        )}
        {rating?.badges.slice(0, 2).map(b => (
          <span key={b} title={BADGE_CONFIG[b].description} style={{ fontSize: 12 }}>{BADGE_CONFIG[b].emoji}</span>
        ))}
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 10, border: '1px solid rgba(212,160,23,0.15)', overflow: 'hidden', marginTop: 8 }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', background: 'rgba(212,160,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: tierCfg?.color || 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
            {profile.bio.avatarUrl ? (
              <img src={profile.bio.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              profile.bio.fullName.charAt(0)
            )}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              {profile.bio.fullName}
              {tierCfg && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: `${tierCfg.color}20`, color: tierCfg.color }}>
                  {tierCfg.label}
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>
              {profile.bio.primaryRole} &middot; {profile.bio.battingStyle} &middot; {profile.bio.bowlingStyle}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {rating && (
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Star size={14} fill="var(--gold)" /> {rating.overall.toFixed(1)}
            </span>
          )}
          {profile.shareUrl && (
            <a href={profile.shareUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', display: 'flex' }} title="View on CricHeroes">
              <ExternalLink size={14} />
            </a>
          )}
          {canEdit && (
            <>
              <button onClick={handleRefresh} disabled={refreshing} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 2 }} title="Refresh stats">
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button onClick={handleUnlink} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', display: 'flex', padding: 2 }} title="Unlink profile">
                <Unlink size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Badges */}
      {rating && rating.badges.length > 0 && (
        <div style={{ display: 'flex', gap: 4, padding: '6px 14px', flexWrap: 'wrap' }}>
          {rating.badges.map(b => (
            <span key={b} title={BADGE_CONFIG[b].description} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.15)', display: 'flex', alignItems: 'center', gap: 3 }}>
              {BADGE_CONFIG[b].emoji} {BADGE_CONFIG[b].label}
            </span>
          ))}
        </div>
      )}

      {/* Key Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, padding: '0 14px 10px' }}>
        <MiniStat label="Matches" value={profile.batting.matches} />
        <MiniStat label="Runs" value={profile.batting.runs} accent />
        <MiniStat label="Wickets" value={profile.bowling.wickets} accent />
        <MiniStat label="Catches" value={profile.fielding.catches} />
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0', fontSize: 10, color: 'var(--gold)', background: 'rgba(212,160,23,0.04)', border: 'none', borderTop: '1px solid rgba(212,160,23,0.1)', cursor: 'pointer' }}
      >
        {showDetails ? 'Hide Details' : 'Show Full Stats'} {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {showDetails && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(212,160,23,0.08)' }}>
          {/* Batting */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Batting</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              <MiniStat label="Innings" value={profile.batting.innings} />
              <MiniStat label="Avg" value={profile.batting.average.toFixed(1)} />
              <MiniStat label="SR" value={profile.batting.strikeRate.toFixed(1)} />
              <MiniStat label="HS" value={profile.batting.highestScore} />
              <MiniStat label="50s/100s" value={`${profile.batting.fifties}/${profile.batting.hundreds}`} />
              <MiniStat label="4s" value={profile.batting.fours} />
              <MiniStat label="6s" value={profile.batting.sixes} />
              {profile.batting.boundaryPercentage != null && <MiniStat label="Boundary%" value={`${profile.batting.boundaryPercentage.toFixed(0)}%`} />}
            </div>
          </div>

          {/* Bowling */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Bowling</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              <MiniStat label="Innings" value={profile.bowling.innings} />
              <MiniStat label="Overs" value={profile.bowling.overs} />
              <MiniStat label="Econ" value={profile.bowling.economy.toFixed(1)} />
              <MiniStat label="Avg" value={profile.bowling.average.toFixed(1)} />
              <MiniStat label="Best" value={profile.bowling.bestFigures} />
              <MiniStat label="Maidens" value={profile.bowling.maidens} />
              <MiniStat label="3W" value={profile.bowling.threeWickets} />
              <MiniStat label="5W" value={profile.bowling.fiveWickets} />
              {profile.bowling.dotBallPercentage != null && <MiniStat label="Dot%" value={`${profile.bowling.dotBallPercentage.toFixed(0)}%`} />}
            </div>
          </div>

          {/* Fielding */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Fielding</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              <MiniStat label="Catches" value={profile.fielding.catches} />
              <MiniStat label="Stumpings" value={profile.fielding.stumpings} />
              <MiniStat label="Run Outs" value={profile.fielding.runOuts} />
            </div>
          </div>

          {/* Recent Form */}
          {profile.recentForm.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={11} /> Recent Form (Last {profile.recentForm.length})
              </div>
              <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
                {profile.recentForm.map((inning, i) => (
                  <RecentFormChip key={i} inning={inning} />
                ))}
              </div>
            </div>
          )}

          {/* Rating Breakdown */}
          {rating && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Rating Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.entries(rating.breakdown).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)', width: 70, textTransform: 'capitalize' }}>{key}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(212,160,23,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(val / 10) * 100}%`, borderRadius: 3, background: val >= 7 ? 'var(--green)' : val >= 4 ? 'var(--gold)' : 'var(--red)', transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, width: 24, textAlign: 'right' }}>{val.toFixed(1)}</span>
                  </div>
                ))}
              </div>
              {rating.suggestedBasePrice > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                  Suggested Base Price: <span style={{ fontWeight: 700, color: 'var(--gold)' }}>&#8377;{rating.suggestedBasePrice.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{ textAlign: 'center', padding: '4px 0' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: accent ? 'var(--gold)' : 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

function RecentFormChip({ inning }: { inning: RecentInning }) {
  const hasBatting = inning.runs != null;
  const hasBowling = inning.wickets != null;
  const runs = inning.runs ?? 0;
  const balls = inning.balls ?? 0;
  const sr = balls > 0 ? ((runs / balls) * 100).toFixed(0) : '-';

  const bgColor = runs >= 50 ? 'rgba(34,197,94,0.12)' : runs >= 30 ? 'rgba(212,160,23,0.12)' : 'rgba(148,163,184,0.08)';
  const borderColor = runs >= 50 ? 'rgba(34,197,94,0.25)' : runs >= 30 ? 'rgba(212,160,23,0.25)' : 'rgba(148,163,184,0.15)';

  return (
    <div style={{ minWidth: 64, padding: '6px 8px', borderRadius: 8, background: bgColor, border: `1px solid ${borderColor}`, textAlign: 'center', flexShrink: 0 }}>
      {hasBatting && (
        <div style={{ fontSize: 13, fontWeight: 700, color: runs >= 50 ? 'var(--green)' : 'var(--text)' }}>
          {runs}{balls > 0 ? `(${balls})` : ''}
        </div>
      )}
      {hasBowling && (
        <div style={{ fontSize: 11, color: 'var(--text)' }}>
          {inning.wickets}/{inning.runsConceded}
        </div>
      )}
      {inning.opponent && <div style={{ fontSize: 8, color: 'var(--muted)', marginTop: 2 }}>vs {inning.opponent}</div>}
    </div>
  );
}
