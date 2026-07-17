import React from "react";
import { Activity, Target } from "lucide-react";

const TEAM_SPORT_KEYWORDS = [
  "cricket", "football", "volleyball", "basketball",
  "kabaddi", "hockey", "soccer", "throwball", "rugby",
  "tug of war", "baseball",
];

export function isTeamSport(sportName: string): boolean {
  const name = sportName.toLowerCase();
  return TEAM_SPORT_KEYWORDS.some(k => name.includes(k));
}

export function getDefaultMinPlayers(sportName: string): number {
  const name = sportName.toLowerCase();
  if (name.includes("cricket")) return 11;
  if (name.includes("football")) return 11;
  if (name.includes("basketball")) return 5;
  if (name.includes("volleyball")) return 6;
  if (name.includes("kabaddi")) return 7;
  return 5;
}

export const PREDEFINED_SPORTS: { name: string; icon: string }[] = [
  { name: "Badminton", icon: "\u{1F3F8}" },
  { name: "Basketball", icon: "\u{1F3C0}" },
  { name: "Beach Volleyball", icon: "\u{1F3D0}" },
  { name: "Beach Tennis", icon: "\u{1F3BE}" },
  { name: "Billiards", icon: "\u{1F3B1}" },
  { name: "Bowling", icon: "\u{1F3B3}" },
  { name: "Carrom", icon: "\u{1F3AF}" },
  { name: "Chess", icon: "♟️" },
  { name: "Cricket (Tennis Ball)", icon: "\u{1F3CF}" },
  { name: "Cycling", icon: "\u{1F6B4}" },
  { name: "Dart", icon: "\u{1F3AF}" },
  { name: "Foosball", icon: "⚽" },
  { name: "Grass Volleyball", icon: "\u{1F3D0}" },
  { name: "Kabaddi", icon: "\u{1F93C}" },
  { name: "Pickleball", icon: "\u{1F3D3}" },
  { name: "Pool", icon: "\u{1F3B1}" },
  { name: "Running (100M)", icon: "\u{1F3C3}" },
  { name: "Running (1500M)", icon: "\u{1F3C3}" },
  { name: "Running (200M)", icon: "\u{1F3C3}" },
  { name: "Running (400M)", icon: "\u{1F3C3}" },
  { name: "Running (800M)", icon: "\u{1F3C3}" },
  { name: "Running (Others)", icon: "\u{1F3C3}" },
  { name: "Snooker", icon: "\u{1F3B1}" },
  { name: "Soccer", icon: "⚽" },
  { name: "Squash", icon: "\u{1F3BE}" },
  { name: "Swimming Race", icon: "\u{1F3CA}" },
  { name: "Table Tennis", icon: "\u{1F3D3}" },
  { name: "Tennis", icon: "\u{1F3BE}" },
  { name: "Throwball", icon: "\u{1F93E}" },
  { name: "Tug of War", icon: "\u{1FAA2}" },
  { name: "Volleyball", icon: "\u{1F3D0}" },
];

export const BasketballIcon = ({ size = 24, className, ...props }: React.ComponentPropsWithoutRef<"svg"> & { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v20" />
    <path d="M2 12h20" />
    <path d="M4.93 4.93a10 10 0 0 1 0 14.14" />
    <path d="M19.07 4.93a10 10 0 0 0 0 14.14" />
  </svg>
);

export const SPORT_ICONS: Record<string, React.ElementType> = {
  basketball: BasketballIcon,
  soccer: Target,
  football: Target,
  volleyball: Activity,
  cricket: Target,
  badminton: Activity,
};

export const SPORT_COLORS: Record<string, { color: string; bg: string }> = {
  basketball: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  soccer: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  football: { color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  volleyball: { color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  cricket: { color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
  badminton: { color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
};

export function getSportIcon(sportName: string): React.ElementType {
  return SPORT_ICONS[sportName.toLowerCase()] || Activity;
}

export function getSportColor(sportName: string): { color: string; bg: string } {
  return SPORT_COLORS[sportName.toLowerCase()] || { color: "#64748b", bg: "rgba(100,116,139,0.1)" };
}

export const DEFAULT_AVATAR_URL = "https://firebasestorage.googleapis.com/v0/b/playingaid.appspot.com/o/default%2Fplayer.png?alt=media";
