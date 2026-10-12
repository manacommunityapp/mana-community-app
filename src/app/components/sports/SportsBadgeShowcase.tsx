import { useState, useEffect } from "react";
import { Award, Loader2, Lock } from "lucide-react";
import { sportsEnhancedService } from "../../../services/sports/sportsEnhancedService";
import type { Badge, PlayerProfile } from "../../../types/sports-enhanced";

interface SportsBadgeShowcaseProps {
  userId?: number;
  inline?: boolean;
}

const RARITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)", text: "#64748b" },
  rare: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", text: "#3b82f6" },
  epic: { bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.2)", text: "#a855f7" },
  legendary: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", text: "#f59e0b" },
};

const CATEGORY_LABELS: Record<string, string> = {
  achievement: "Achievements",
  milestone: "Milestones",
  participation: "Participation",
};

export function SportsBadgeShowcase({ userId, inline = false }: SportsBadgeShowcaseProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const [profileBadges, catalog] = await Promise.all([
          userId
            ? sportsEnhancedService.getPlayerProfile(userId).then(p => p.badges)
            : sportsEnhancedService.getMyProfile().then(p => p.badges),
          sportsEnhancedService.getAllBadges().catch(() => []),
        ]);
        setBadges(profileBadges || []);
        setAllBadges(catalog.length > 0 ? catalog : profileBadges || []);
      } catch {
        setBadges([]);
        setAllBadges([]);
      }
      setLoading(false);
    };
    loadBadges();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
        <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
        <div style={{ fontSize: 12 }}>Loading badges...</div>
      </div>
    );
  }

  const earnedIds = new Set(badges.filter(b => b.isEarned).map(b => b.id));
  const displayBadges = allBadges.map(b => ({ ...b, isEarned: earnedIds.has(b.id) || b.isEarned }));

  const filtered = filter === "all" ? displayBadges
    : filter === "earned" ? displayBadges.filter(b => b.isEarned)
    : displayBadges.filter(b => !b.isEarned);

  const grouped = filtered.reduce<Record<string, Badge[]>>((acc, b) => {
    const cat = b.category || "achievement";
    (acc[cat] ??= []).push(b);
    return acc;
  }, {});

  const earnedCount = displayBadges.filter(b => b.isEarned).length;

  return (
    <div style={{ padding: inline ? 0 : 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Award size={18} style={{ color: "var(--gold)" }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Badges & Achievements</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
            background: "rgba(212,160,23,0.12)", color: "var(--gold)",
          }}>
            {earnedCount}/{displayBadges.length}
          </span>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {(["all", "earned", "locked"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
            border: `1px solid ${filter === f ? "var(--gold)" : "rgba(148,163,184,0.15)"}`,
            background: filter === f ? "rgba(212,160,23,0.1)" : "transparent",
            color: filter === f ? "var(--gold)" : "var(--muted)", cursor: "pointer",
            textTransform: "capitalize",
          }}>
            {f === "all" ? `All (${displayBadges.length})` : f === "earned" ? `Earned (${earnedCount})` : `Locked (${displayBadges.length - earnedCount})`}
          </button>
        ))}
      </div>

      {/* Badge Grid by Category */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          <Award size={28} style={{ margin: "0 auto 8px", opacity: 0.2 }} />
          <div style={{ fontSize: 12 }}>No badges to show</div>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catBadges]) => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              {CATEGORY_LABELS[cat] || cat}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
              {catBadges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const rarity = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;

  return (
    <div style={{
      padding: "10px 12px", borderRadius: 10, textAlign: "center",
      border: `1px solid ${badge.isEarned ? rarity.border : "rgba(148,163,184,0.1)"}`,
      background: badge.isEarned ? rarity.bg : "rgba(148,163,184,0.02)",
      opacity: badge.isEarned ? 1 : 0.5,
      transition: "transform 0.1s",
    }}>
      <div style={{ fontSize: 28, marginBottom: 4, filter: badge.isEarned ? "none" : "grayscale(1)" }}>
        {badge.emoji}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: badge.isEarned ? "var(--text)" : "var(--muted)", marginBottom: 2 }}>
        {badge.name}
      </div>
      <div style={{ fontSize: 9, color: "var(--muted)", marginBottom: 4, lineHeight: 1.3 }}>
        {badge.description}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <span style={{
          fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
          background: rarity.bg, color: rarity.text, textTransform: "uppercase",
        }}>
          {badge.rarity}
        </span>
        {!badge.isEarned && <Lock size={8} style={{ color: "var(--muted)" }} />}
        {badge.isEarned && badge.earnedAt && (
          <span style={{ fontSize: 8, color: "var(--muted)" }}>
            {new Date(badge.earnedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}
