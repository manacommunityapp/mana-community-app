export const SPORT_EVENT_TYPES: Record<string, { label: string; eventType: string; points: number; color: string; icon?: string }[]> = {
  BADMINTON: [
    { label: "Point", eventType: "POINT", points: 1, color: "green" },
    { label: "Ace", eventType: "ACE", points: 1, color: "blue" },
    { label: "Service Error", eventType: "SERVICE_ERROR", points: 1, color: "red" },
  ],
  FOOTBALL: [
    { label: "Goal", eventType: "GOAL", points: 1, color: "green" },
    { label: "Yellow Card", eventType: "YELLOW_CARD", points: 0, color: "yellow" },
    { label: "Red Card", eventType: "RED_CARD", points: 0, color: "red" },
    { label: "Substitution", eventType: "SUBSTITUTION", points: 0, color: "blue" },
    { label: "Penalty Goal", eventType: "PENALTY_GOAL", points: 1, color: "green" },
    { label: "Own Goal", eventType: "OWN_GOAL", points: 1, color: "orange" },
  ],
  BASKETBALL: [
    { label: "3-Pointer", eventType: "THREE_POINTER", points: 3, color: "purple" },
    { label: "2-Pointer", eventType: "TWO_POINTER", points: 2, color: "blue" },
    { label: "Free Throw", eventType: "FREE_THROW", points: 1, color: "green" },
    { label: "Foul", eventType: "FOUL", points: 0, color: "yellow" },
    { label: "Timeout", eventType: "TIMEOUT", points: 0, color: "gray" },
  ],
  VOLLEYBALL: [
    { label: "Point", eventType: "POINT", points: 1, color: "green" },
    { label: "Ace", eventType: "ACE", points: 1, color: "blue" },
    { label: "Kill", eventType: "KILL", points: 1, color: "purple" },
    { label: "Block", eventType: "BLOCK", points: 1, color: "indigo" },
    { label: "Service Error", eventType: "SERVICE_ERROR", points: 1, color: "red" },
  ],
  TENNIS: [
    { label: "Point", eventType: "POINT", points: 1, color: "green" },
    { label: "Ace", eventType: "ACE", points: 1, color: "blue" },
    { label: "Double Fault", eventType: "DOUBLE_FAULT", points: 1, color: "red" },
  ],
  TABLE_TENNIS: [
    { label: "Point", eventType: "POINT", points: 1, color: "green" },
    { label: "Ace", eventType: "ACE", points: 1, color: "blue" },
    { label: "Service Error", eventType: "SERVICE_ERROR", points: 1, color: "red" },
  ],
  SOCCER: [
    { label: "Goal", eventType: "GOAL", points: 1, color: "green" },
    { label: "Yellow Card", eventType: "YELLOW_CARD", points: 0, color: "yellow" },
    { label: "Red Card", eventType: "RED_CARD", points: 0, color: "red" },
    { label: "Substitution", eventType: "SUBSTITUTION", points: 0, color: "blue" },
    { label: "Penalty Goal", eventType: "PENALTY_GOAL", points: 1, color: "green" },
    { label: "Own Goal", eventType: "OWN_GOAL", points: 1, color: "orange" },
  ],
};

export const SPORT_TYPE_MAP: Record<string, string> = {
  'badminton': 'BADMINTON',
  'football': 'FOOTBALL',
  'soccer': 'SOCCER',
  'basketball': 'BASKETBALL',
  'volleyball': 'VOLLEYBALL',
  'beach volleyball': 'VOLLEYBALL',
  'grass volleyball': 'VOLLEYBALL',
  'tennis': 'TENNIS',
  'table tennis': 'TABLE_TENNIS',
  'pickleball': 'BADMINTON',
  'squash': 'BADMINTON',
  'throwball': 'VOLLEYBALL',
};

export const PERIOD_LABELS: Record<string, string[]> = {
  BADMINTON: ["Set 1", "Set 2", "Set 3"],
  FOOTBALL: ["1st Half", "2nd Half", "Extra Time 1", "Extra Time 2", "Penalties"],
  SOCCER: ["1st Half", "2nd Half", "Extra Time 1", "Extra Time 2", "Penalties"],
  BASKETBALL: ["Q1", "Q2", "Q3", "Q4", "OT"],
  VOLLEYBALL: ["Set 1", "Set 2", "Set 3", "Set 4", "Set 5"],
  TENNIS: ["Set 1", "Set 2", "Set 3", "Set 4", "Set 5"],
  TABLE_TENNIS: ["Set 1", "Set 2", "Set 3", "Set 4", "Set 5", "Set 6", "Set 7"],
};

export const getSportType = (sportName: string): string | null => {
  const lower = sportName.toLowerCase();
  for (const [key, value] of Object.entries(SPORT_TYPE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return null;
};

export const isCricketSport = (sportName: string): boolean => {
  const lower = sportName.toLowerCase();
  return lower.includes('cricket');
};
