import { useState, useMemo } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from "recharts";
import {
  ChevronDown, ChevronUp, Shield, Users, CheckCircle, ExternalLink, Star, Award
} from "lucide-react";
import type { AuctionPlayer, AuctionTeam, PlayerCategory } from "../../../types/api";
import type { CricHeroesPlayerProfile } from "../../../types/sportsCricheroes";
import { TIER_CONFIG, BADGE_CONFIG } from "../../../types/sportsCricheroes";
import { computeLocalRating } from "../../../hooks/useSportsCricHeroesProfile";

interface SportsPlayerProfileCardProps {
  player: AuctionPlayer;
  team?: AuctionTeam;
  cricHeroesProfile?: CricHeroesPlayerProfile;
  familyRelation?: string;
  kycVerified?: boolean;
  categories?: PlayerCategory[];
  compact?: boolean;
}

interface RadarDatum {
  stat: string;
  value: number;
  fullMark: number;
}

function buildRadarData(player: AuctionPlayer, profile?: CricHeroesPlayerProfile): RadarDatum[] {
  if (profile) {
    const bat = profile.batting;
    const bowl = profile.bowling;
    const field = profile.fielding;
    return [
      { stat: "Batting", value: Math.min((bat?.average ?? 0) / 50, 1) * 100, fullMark: 100 },
      { stat: "Strike Rate", value: Math.min((bat?.strikeRate ?? 0) / 200, 1) * 100, fullMark: 100 },
      { stat: "Bowling", value: bowl?.wickets ? Math.min(bowl.wickets / 100, 1) * 100 : 0, fullMark: 100 },
      { stat: "Economy", value: bowl?.economy ? Math.max(0, (1 - (bowl.economy - 4) / 10)) * 100 : 0, fullMark: 100 },
      { stat: "Fielding", value: Math.min(((field?.catches ?? 0) + (field?.stumpings ?? 0)) / 30, 1) * 100, fullMark: 100 },
      { stat: "Experience", value: Math.min((bat?.matches ?? 0) / 100, 1) * 100, fullMark: 100 },
    ];
  }

  let stats: Record<string, number> = {};
  try { stats = player.statsJson ? JSON.parse(player.statsJson) : {}; } catch { /* empty */ }

  return [
    { stat: "Batting", value: Math.min(((player.avgScore ?? stats.avgScore ?? 0) / 50) * 100, 100), fullMark: 100 },
    { stat: "Strike Rate", value: Math.min(((player.strikeRate ?? stats.strikeRate ?? 0) / 200) * 100, 100), fullMark: 100 },
    { stat: "Bowling", value: Math.min(((player.wickets ?? stats.wickets ?? 0) / 50) * 100, 100), fullMark: 100 },
    { stat: "Economy", value: player.economy ? Math.max(0, (1 - (player.economy - 4) / 10)) * 100 : 0, fullMark: 100 },
    { stat: "Runs", value: Math.min(((player.runs ?? stats.runs ?? 0) / 2000) * 100, 100), fullMark: 100 },
    { stat: "Experience", value: Math.min(((player.matches ?? stats.matches ?? 0) / 50) * 100, 100), fullMark: 100 },
  ];
}

function matchCategory(player: AuctionPlayer, categories: PlayerCategory[]): PlayerCategory | null {
  if (!categories.length || !player.age) return null;
  const age = player.age;
  const role = (player.role || player.category || "").toLowerCase();
  const gender = role.includes("women") || role.includes("girl") ? "FEMALE" : "MALE";

  return categories.find(c => {
    if (c.minAge && age < c.minAge) return false;
    if (c.maxAge && age > c.maxAge) return false;
    if (c.gender !== "ALL" && c.gender !== gender) return false;
    return true;
  }) || null;
}

export function SportsPlayerProfileCard({
  player, team, cricHeroesProfile, familyRelation, kycVerified, categories = [], compact = false
}: SportsPlayerProfileCardProps) {
  const [expanded, setExpanded] = useState(false);

  const radarData = useMemo(() => buildRadarData(player, cricHeroesProfile), [player, cricHeroesProfile]);
  const hasRadarData = radarData.some(d => d.value > 0);

  const rating = useMemo(() => cricHeroesProfile ? computeLocalRating(cricHeroesProfile) : null, [cricHeroesProfile]);
  const tierCfg = rating ? TIER_CONFIG[rating.tier] : null;

  const matchedCategory = useMemo(() => matchCategory(player, categories), [player, categories]);

  const playerName = (player as any).playerName || player.name;
  const playerRole = (player as any).playerRole || player.role || player.category || "Player";
  const initials = player.initials || playerName?.match(/\b\w/g)?.join("")?.substring(0, 2)?.toUpperCase() || "P";

  const isSold = player.status === "SOLD";
  const teamName = team?.name || team?.teamName || player.assignedTeam?.name || (player.assignedTeam as any)?.teamName;
  const teamColor = team?.colorHex || team?.color || player.assignedTeam?.colorHex || "var(--gold)";

  if (compact) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10,
        background: isSold ? "rgba(34,197,94,0.05)" : "rgba(99,102,241,0.03)",
        border: `1px solid ${isSold ? "rgba(34,197,94,0.15)" : "rgba(99,102,241,0.1)"}`,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: tierCfg?.color || (isSold ? "var(--green)" : "var(--gold)"), color: "#fff", fontSize: 13, fontWeight: 700,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{playerName}</span>
            {kycVerified && <Shield size={10} style={{ color: "#22c55e" }} />}
            {familyRelation && <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 3, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", fontWeight: 600 }}>{familyRelation}</span>}
            {tierCfg && <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: `${tierCfg.color}18`, color: tierCfg.color }}>{tierCfg.label}</span>}
            {rating && rating.badges.length > 0 && rating.badges.slice(0, 2).map(b => (
              <span key={b} title={BADGE_CONFIG[b].description} style={{ fontSize: 12 }}>{BADGE_CONFIG[b].emoji}</span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>
            {playerRole} · Base ₹{(player.basePrice || 0).toLocaleString("en-IN")}
            {matchedCategory && matchedCategory.name !== player.category && <span style={{ color: "#f59e0b" }}> · Suggested: {matchedCategory.name}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {isSold ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>₹{(player.soldPrice || 0).toLocaleString("en-IN")}</div>
              {teamName && <div style={{ fontSize: 9, color: "var(--muted)" }}>{teamName}</div>}
            </>
          ) : (
            <span className={`tag ${player.status === "QUEUED" || player.status === "queue" ? "tag-blue" : "tag-amber"}`} style={{ fontSize: 9 }}>{player.status}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      background: isSold ? "rgba(34,197,94,0.03)" : "var(--card)",
      border: `1px solid ${isSold ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.1)"}`,
    }}>
      {/* Header */}
      <div
        style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{
          width: 48, height: 48, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: tierCfg?.color || (isSold ? "var(--green)" : "var(--gold)"), color: "#fff", fontSize: 17, fontWeight: 700,
          boxShadow: isSold ? `0 0 0 3px ${teamColor}30` : "none",
        }}>{initials}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{playerName}</span>
            {kycVerified && <span title="KYC Verified" style={{ display: "inline-flex" }}><Shield size={12} style={{ color: "#22c55e" }} /></span>}
            {player.verifiedAt && <span title="Stats Verified" style={{ display: "inline-flex" }}><CheckCircle size={11} style={{ color: "#22c55e" }} /></span>}
            {player.cricHeroesUrl && (
              <a href={player.cricHeroesUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-flex", color: "var(--gold)" }}>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{playerRole}</span>
            {player.age && <span style={{ fontSize: 10, color: "var(--muted)" }}>· Age {player.age}</span>}
            {familyRelation && (
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(139,92,246,0.1)", color: "#8b5cf6", fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>
                <Users size={8} /> {familyRelation}
              </span>
            )}
            {matchedCategory && matchedCategory.name !== player.category && (
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontWeight: 600 }}>
                Suggested: {matchedCategory.name}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          {isSold ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--green)" }}>₹{(player.soldPrice || 0).toLocaleString("en-IN")}</div>
              {teamName && (
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${teamColor}15`, color: teamColor, fontWeight: 600, border: `1px solid ${teamColor}30` }}>
                  {teamName}
                </span>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)" }}>₹{(player.basePrice || 0).toLocaleString("en-IN")}</div>
              <span className={`tag ${player.status === "QUEUED" || player.status === "queue" ? "tag-blue" : "tag-amber"}`} style={{ fontSize: 9 }}>{player.status}</span>
            </>
          )}
          {expanded ? <ChevronUp size={14} style={{ color: "var(--muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--muted)" }} />}
        </div>
      </div>

      {/* Tier & Badges row */}
      {(tierCfg || (rating && rating.badges.length > 0)) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 16px 10px", flexWrap: "wrap" }}>
          {tierCfg && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: `${tierCfg.color}15`, color: tierCfg.color, border: `1px solid ${tierCfg.color}25` }}>
              {tierCfg.label}
            </span>
          )}
          {rating && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", display: "flex", alignItems: "center", gap: 2 }}>
              <Star size={11} fill="var(--gold)" /> {rating.overall.toFixed(1)}
            </span>
          )}
          {rating && rating.badges.map(b => (
            <span key={b} title={BADGE_CONFIG[b].description} style={{
              fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
              background: "rgba(212,160,23,0.08)", color: "var(--gold)", display: "flex", alignItems: "center", gap: 3,
            }}>
              {BADGE_CONFIG[b].emoji} {BADGE_CONFIG[b].label}
            </span>
          ))}
        </div>
      )}

      {/* Expanded: Stats Radar + Details */}
      {expanded && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: hasRadarData ? "1fr 1fr" : "1fr", gap: 14 }}>
            {/* Stats Radar */}
            {hasRadarData && (
              <div style={{ padding: 10, borderRadius: 10, background: "rgba(212,160,23,0.04)", border: "1px solid rgba(212,160,23,0.08)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <Award size={10} /> Player Stats Radar
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData} outerRadius="70%">
                    <PolarGrid stroke="rgba(148,163,184,0.15)" />
                    <PolarAngleAxis dataKey="stat" tick={{ fontSize: 9, fill: "var(--muted)" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 10, background: "var(--card)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 8 }} />
                    <Radar name="Stats" dataKey="value" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Stat Numbers */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cricHeroesProfile ? (
                <>
                  <StatSection label="Batting" items={[
                    { k: "Matches", v: cricHeroesProfile.batting?.matches },
                    { k: "Runs", v: cricHeroesProfile.batting?.runs },
                    { k: "Avg", v: cricHeroesProfile.batting?.average?.toFixed(1) },
                    { k: "SR", v: cricHeroesProfile.batting?.strikeRate?.toFixed(1) },
                    { k: "HS", v: cricHeroesProfile.batting?.highestScore },
                  ]} />
                  <StatSection label="Bowling" items={[
                    { k: "Wkts", v: cricHeroesProfile.bowling?.wickets },
                    { k: "Econ", v: cricHeroesProfile.bowling?.economy?.toFixed(1) },
                    { k: "Avg", v: cricHeroesProfile.bowling?.average?.toFixed(1) },
                    { k: "Best", v: cricHeroesProfile.bowling?.bestFigures },
                  ]} />
                  {(cricHeroesProfile.fielding?.catches || cricHeroesProfile.fielding?.stumpings) && (
                    <StatSection label="Fielding" items={[
                      { k: "Catches", v: cricHeroesProfile.fielding?.catches },
                      { k: "Stumpings", v: cricHeroesProfile.fielding?.stumpings },
                    ]} />
                  )}
                </>
              ) : (
                <StatSection label="Stats" items={[
                  { k: "Matches", v: player.matches },
                  { k: "Runs", v: player.runs },
                  { k: "Wickets", v: player.wickets },
                  { k: "SR", v: player.strikeRate?.toFixed(1) },
                  { k: "Econ", v: player.economy?.toFixed(1) },
                  { k: "Best", v: player.bestBowling },
                ].filter(i => i.v != null && i.v !== 0)} />
              )}

              {/* Sale Details */}
              {isSold && (
                <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.1)" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Sale Details</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <div><div style={{ fontSize: 16, fontWeight: 700, color: "var(--green)" }}>₹{(player.soldPrice || 0).toLocaleString("en-IN")}</div><div style={{ fontSize: 9, color: "var(--muted)" }}>Sold Price</div></div>
                    <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>₹{(player.basePrice || 0).toLocaleString("en-IN")}</div><div style={{ fontSize: 9, color: "var(--muted)" }}>Base Price</div></div>
                    <div><div style={{ fontSize: 14, fontWeight: 600, color: (player.soldPrice || 0) > (player.basePrice || 0) ? "#ef4444" : "var(--green)" }}>
                      {((player.soldPrice || 0) / Math.max(player.basePrice || 1, 1)).toFixed(1)}x
                    </div><div style={{ fontSize: 9, color: "var(--muted)" }}>Multiplier</div></div>
                  </div>
                </div>
              )}

              {/* Verification & KYC */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {(player.cricHeroesUrl || cricHeroesProfile || player.verifiedAt) && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 4, background: "rgba(34,197,94,0.12)", color: "#22c55e", letterSpacing: 0.5, textTransform: "uppercase" }}>
                    Stats Scope: CricHeroes Career
                  </span>
                )}
                {kycVerified && (
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 7px", borderRadius: 4, background: "rgba(34,197,94,0.08)", color: "#22c55e", display: "flex", alignItems: "center", gap: 3, border: "1px solid rgba(34,197,94,0.15)" }}>
                    <Shield size={9} /> KYC Verified
                  </span>
                )}
                {player.verifiedAt && (
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 7px", borderRadius: 4, background: "rgba(34,197,94,0.08)", color: "#22c55e", display: "flex", alignItems: "center", gap: 3, border: "1px solid rgba(34,197,94,0.15)" }}>
                    <CheckCircle size={9} /> Verified {new Date(player.verifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
                {familyRelation && (
                  <span style={{ fontSize: 9, fontWeight: 600, padding: "3px 7px", borderRadius: 4, background: "rgba(139,92,246,0.08)", color: "#8b5cf6", display: "flex", alignItems: "center", gap: 3, border: "1px solid rgba(139,92,246,0.15)" }}>
                    <Users size={9} /> {familyRelation}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatSection({ label, items }: { label: string; items: { k: string; v: string | number | undefined | null }[] }) {
  const validItems = items.filter(i => i.v != null && i.v !== "" && i.v !== 0);
  if (validItems.length === 0) return null;
  return (
    <div style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(148,163,184,0.04)", border: "1px solid rgba(148,163,184,0.06)" }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {validItems.map(i => (
          <div key={i.k} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{i.v}</div>
            <div style={{ fontSize: 8, color: "var(--muted)", textTransform: "uppercase" }}>{i.k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
