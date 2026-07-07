// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeType = "orange" | "green" | "blue" | "purple";
export type EventStatus = "LIVE" | "UPCOMING" | "COMPLETED" | "SCHEDULED";

export interface StatItem {
  id: number;
  value: number;
  label: string;
  badge: string;
  badgeType: BadgeType;
  color: string;
}

export interface UpcomingEvent {
  id: number;
  name: string;
  subtitle: string;
  venue: string;
  category: string;
  status: EventStatus;
  statusText: string;
  statusSub: string;
  dotColor: string;
  dotPulse?: boolean;
  timeColor: string;
  wonColor?: string;
}

export interface OpenRegistration {
  id: number;
  /** Public, non-sequential id used in the shareable registration link. */
  uuid?: string;
  name: string;
  date: string;
  category: string;
  spots: string;
  progress: number;
  progressColor: string;
  dotColor: string;
  action: "Register" | "View" | "Withdraw" | "Confirmed" | string;
  status: "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | string;
  registrationId?: number;
  auctionStatus?: string;
  isTeamSport?: boolean;
}

export interface Notification {
  id: number;
  icon: string;
  iconBg: string;
  iconColor: string;
  text: string;
  bold: string;
  textAfter: string;
  time: string;
}

export interface NextMatch {
  title: string;
  subtitle: string;
  initialHours: number;
  initialMinutes: number;
  initialSeconds: number;
}

// ─── Default empty data (populated from API at runtime) ─────────────────────

export const SPORTS_DATA = {
  user: { name: "", initials: "", verified: false },

  stats: [] as StatItem[],

  upcomingEvents: [] as UpcomingEvent[],

  openRegistrations: [] as OpenRegistration[],

  notifications: [] as Notification[],

  nextMatch: {
    title: "",
    subtitle: "",
    initialHours: 0,
    initialMinutes: 0,
    initialSeconds: 0,
  } as NextMatch,
};
