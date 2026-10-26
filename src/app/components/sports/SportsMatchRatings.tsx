import { useState, useEffect } from "react";
import { Star, Trophy, ThumbsUp, Zap, Users, Heart, Loader2 } from "lucide-react";
import { sportsEnhancedService } from "../../../services/sports/sportsEnhancedService";
import type { MatchRatingSummary, PlayerReaction, RatingPlayer } from "../../../types/sports-enhanced";

interface SportsMatchRatingsProps {
  matchId: number;
  inline?: boolean;
}

const REACTIONS: { type: PlayerReaction; label: string; icon: typeof Star; color: string }[] = [
  { type: "BEST_PLAYER", label: "Best Player", icon: Trophy, color: "#f59e0b" },
  { type: "CLUTCH", label: "Clutch", icon: Zap, color: "#ef4444" },
  { type: "TEAM_PLAYER", label: "Team Player", icon: Users, color: "#3b82f6" },
  { type: "GOOD_SPORT", label: "Good Sport", icon: Heart, color: "#ec4899" },
  { type: "CONSISTENT", label: "Consistent", icon: ThumbsUp, color: "#10b981" },
];

export function SportsMatchRatings({ matchId, inline = false }: SportsMatchRatingsProps) {
  const [summary, setSummary] = useState<MatchRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState<Record<number, { stars: number; reaction?: PlayerReaction; isManOfMatch: boolean }>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    sportsEnhancedService.getMatchRatings(matchId)
      .then(data => {
        setSummary(data);
        if (data.hasRated) setSubmitted(true);
      })
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [matchId]);

  const setPlayerStars = (playerId: number, stars: number) => {
    setRatings(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], stars, isManOfMatch: prev[playerId]?.isManOfMatch || false },
    }));
  };

  const setPlayerReaction = (playerId: number, reaction: PlayerReaction) => {
    setRatings(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        stars: prev[playerId]?.stars || 0,
        isManOfMatch: prev[playerId]?.isManOfMatch || false,
        reaction: prev[playerId]?.reaction === reaction ? undefined : reaction,
      },
    }));
  };

  const setMOM = (playerId: number) => {
    setRatings(prev => {
      const updated: typeof prev = {};
      for (const [pid, r] of Object.entries(prev)) {
        updated[Number(pid)] = { ...r, isManOfMatch: Number(pid) === playerId };
      }
      if (!updated[playerId]) {
        updated[playerId] = { stars: 0, isManOfMatch: true };
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    const entries = Object.entries(ratings)
      .filter(([, r]) => r.stars > 0)
      .map(([pid, r]) => ({ playerId: Number(pid), stars: r.stars, reaction: r.reaction, isManOfMatch: r.isManOfMatch }));
    if (entries.length === 0) return;
    setSubmitting(true);
    try {
      await sportsEnhancedService.submitRatings(matchId, entries);
      setSubmitted(true);
      const updated = await sportsEnhancedService.getMatchRatings(matchId);
      setSummary(updated);
    } catch { /* toast */ }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
        <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
        <div style={{ fontSize: 12 }}>Loading ratings...</div>
      </div>
    );
  }

  if (!summary) return null;

  const canRate = summary.canRate && !submitted;

  return (
    <div style={{ padding: inline ? 0 : 16 }}>
      {/* MOM Banner */}
      {summary.manOfMatch && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
          background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))",
          borderRadius: 10, border: "1px solid rgba(245,158,11,0.2)", marginBottom: 14,
        }}>
          <Trophy size={18} style={{ color: "#f59e0b" }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Man of the Match</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              {summary.manOfMatch.playerName} ({summary.manOfMatch.voteCount} votes)
            </div>
          </div>
        </div>
      )}

      {/* Player Rating Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {summary.players.map(player => (
          <PlayerRatingCard
            key={player.playerId}
            player={player}
            canRate={canRate}
            rating={ratings[player.playerId]}
            onSetStars={s => setPlayerStars(player.playerId, s)}
            onSetReaction={r => setPlayerReaction(player.playerId, r)}
            onSetMOM={() => setMOM(player.playerId)}
            isMOM={ratings[player.playerId]?.isManOfMatch || false}
          />
        ))}
      </div>

      {/* Submit */}
      {canRate && (
        <button onClick={handleSubmit} disabled={submitting || Object.values(ratings).every(r => r.stars === 0)} style={{
          width: "100%", marginTop: 14, padding: "10px 0", borderRadius: 8, border: "none",
          background: submitting ? "var(--muted)" : "var(--gold)", color: "#000",
          fontWeight: 700, fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
          {submitting ? "Submitting..." : "Submit Ratings"}
        </button>
      )}

      {submitted && (
        <div style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: "var(--success, #10b981)", fontWeight: 600 }}>
          Your ratings have been submitted
        </div>
      )}
    </div>
  );
}

function PlayerRatingCard({
  player, canRate, rating, onSetStars, onSetReaction, onSetMOM, isMOM,
}: {
  player: RatingPlayer;
  canRate: boolean;
  rating?: { stars: number; reaction?: PlayerReaction; isManOfMatch: boolean };
  onSetStars: (s: number) => void;
  onSetReaction: (r: PlayerReaction) => void;
  onSetMOM: () => void;
  isMOM: boolean;
}) {
  const initials = player.playerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{
      padding: "10px 12px", borderRadius: 10,
      border: `1px solid ${player.isManOfMatch ? "rgba(245,158,11,0.3)" : "rgba(148,163,184,0.12)"}`,
      background: player.isManOfMatch ? "rgba(245,158,11,0.04)" : "rgba(148,163,184,0.03)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: "50%", fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(148,163,184,0.12)", color: "var(--muted)",
        }}>
          {initials}
        </div>

        {/* Name & existing rating */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 4 }}>
            {player.playerName}
            {player.isManOfMatch && <Trophy size={11} style={{ color: "#f59e0b" }} />}
          </div>
          {player.flatNo && <div style={{ fontSize: 10, color: "var(--muted)" }}>{player.flatNo}</div>}
        </div>

        {/* Existing rating display */}
        {player.ratingCount > 0 && (
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Star size={12} fill="#f59e0b" stroke="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{player.averageRating.toFixed(1)}</span>
            </div>
            <div style={{ fontSize: 9, color: "var(--muted)" }}>{player.ratingCount} ratings</div>
          </div>
        )}
      </div>

      {/* Rating Input */}
      {canRate && (
        <div style={{ marginTop: 8 }}>
          {/* Stars */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 6 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => onSetStars(s)} style={{
                background: "none", border: "none", cursor: "pointer", padding: 2,
              }}>
                <Star size={18}
                  fill={(rating?.stars ?? 0) >= s ? "#f59e0b" : "none"}
                  stroke={(rating?.stars ?? 0) >= s ? "#f59e0b" : "rgba(148,163,184,0.4)"}
                />
              </button>
            ))}
            {/* MOM vote chip */}
            <button onClick={onSetMOM} style={{
              marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "3px 8px",
              borderRadius: 10, border: `1px solid ${isMOM ? "#f59e0b" : "rgba(148,163,184,0.2)"}`,
              background: isMOM ? "rgba(245,158,11,0.15)" : "transparent",
              color: isMOM ? "#f59e0b" : "var(--muted)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <Trophy size={9} /> MOM
            </button>
          </div>

          {/* Reaction chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {REACTIONS.map(({ type, label, icon: Icon, color }) => {
              const selected = rating?.reaction === type;
              return (
                <button key={type} onClick={() => onSetReaction(type)} style={{
                  fontSize: 9, fontWeight: 600, padding: "3px 7px", borderRadius: 8,
                  border: `1px solid ${selected ? color : "rgba(148,163,184,0.15)"}`,
                  background: selected ? `${color}18` : "transparent",
                  color: selected ? color : "var(--muted)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 3,
                }}>
                  <Icon size={9} /> {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Top reaction badge (when viewing results) */}
      {!canRate && player.topReaction && (
        <div style={{ marginTop: 6 }}>
          {(() => {
            const r = REACTIONS.find(r => r.type === player.topReaction);
            if (!r) return null;
            const Icon = r.icon;
            return (
              <span style={{
                fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 6,
                background: `${r.color}15`, color: r.color,
                display: "inline-flex", alignItems: "center", gap: 3,
              }}>
                <Icon size={9} /> {r.label}
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}
