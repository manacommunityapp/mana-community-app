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
  SOCCER: [
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
  PICKLEBALL: [
    { label: "Point", eventType: "POINT", points: 1, color: "green" },
    { label: "Ace", eventType: "ACE", points: 1, color: "blue" },
    { label: "Fault", eventType: "SERVICE_ERROR", points: 1, color: "red" },
  ],
  SQUASH: [
    { label: "Point", eventType: "POINT", points: 1, color: "green" },
    { label: "Stroke", eventType: "STROKE", points: 1, color: "blue" },
    { label: "Let", eventType: "LET", points: 0, color: "gray" },
    { label: "Fault", eventType: "SERVICE_ERROR", points: 1, color: "red" },
  ],
  KABADDI: [
    { label: "Raid Point", eventType: "RAID_POINT", points: 1, color: "green" },
    { label: "Tackle Point", eventType: "TACKLE_POINT", points: 1, color: "blue" },
    { label: "Bonus Point", eventType: "BONUS_POINT", points: 1, color: "indigo" },
    { label: "Super Tackle", eventType: "SUPER_TACKLE", points: 2, color: "purple" },
    { label: "All Out", eventType: "ALL_OUT", points: 2, color: "orange" },
  ],
  CARROM: [
    { label: "White Coin (+1)", eventType: "POINT", points: 1, color: "blue" },
    { label: "Black Coin (+1)", eventType: "POINT", points: 1, color: "gray" },
    { label: "Queen (+3)", eventType: "QUEEN", points: 3, color: "purple" },
    { label: "Foul", eventType: "FOUL", points: 0, color: "red" },
  ],
  CHESS: [
    { label: "Win (+1)", eventType: "WIN", points: 1, color: "green" },
    { label: "Draw (+0.5)", eventType: "DRAW", points: 1, color: "blue" },
    { label: "Illegal Move", eventType: "FOUL", points: 0, color: "red" },
  ],
  FOOSBALL: [
    { label: "Goal", eventType: "GOAL", points: 1, color: "green" },
    { label: "Own Goal", eventType: "OWN_GOAL", points: 1, color: "orange" },
  ],
  POOL: [
    { label: "Ball Potted", eventType: "POT", points: 1, color: "green" },
    { label: "Foul", eventType: "FOUL", points: 0, color: "red" },
  ],
  DART: [
    { label: "Single (+1)", eventType: "POINT", points: 1, color: "blue" },
    { label: "Double (+2)", eventType: "DOUBLE", points: 2, color: "purple" },
    { label: "Triple (+3)", eventType: "TRIPLE", points: 3, color: "indigo" },
    { label: "Bullseye (+50)", eventType: "BULLSEYE", points: 50, color: "green" },
  ],
  BOWLING: [
    { label: "Strike (+10)", eventType: "STRIKE", points: 10, color: "green" },
    { label: "Spare (+10)", eventType: "SPARE", points: 10, color: "blue" },
    { label: "Pin (+1)", eventType: "POINT", points: 1, color: "gray" },
  ],
  TUG_OF_WAR: [
    { label: "Round Won", eventType: "ROUND_WON", points: 1, color: "green" },
  ],
  DEFAULT: [
    { label: "Point (+1)", eventType: "POINT", points: 1, color: "green" },
    { label: "+2 Points", eventType: "POINT_2", points: 2, color: "blue" },
    { label: "+3 Points", eventType: "POINT_3", points: 3, color: "purple" },
    { label: "Foul / Error", eventType: "FOUL", points: 0, color: "red" },
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
  'pickleball': 'PICKLEBALL',
  'squash': 'SQUASH',
  'throwball': 'VOLLEYBALL',
  'kabaddi': 'KABADDI',
  'carrom': 'CARROM',
  'chess': 'CHESS',
  'foosball': 'FOOSBALL',
  'pool': 'POOL',
  'billiards': 'POOL',
  'snooker': 'POOL',
  'dart': 'DART',
  'bowling': 'BOWLING',
  'tug of war': 'TUG_OF_WAR',
};

export const PERIOD_LABELS: Record<string, string[]> = {
  BADMINTON: ["Set 1", "Set 2", "Set 3"],
  FOOTBALL: ["1st Half", "2nd Half", "Extra Time 1", "Extra Time 2", "Penalties"],
  SOCCER: ["1st Half", "2nd Half", "Extra Time 1", "Extra Time 2", "Penalties"],
  BASKETBALL: ["Q1", "Q2", "Q3", "Q4", "OT"],
  VOLLEYBALL: ["Set 1", "Set 2", "Set 3", "Set 4", "Set 5"],
  TENNIS: ["Set 1", "Set 2", "Set 3", "Set 4", "Set 5"],
  TABLE_TENNIS: ["Set 1", "Set 2", "Set 3", "Set 4", "Set 5", "Set 6", "Set 7"],
  PICKLEBALL: ["Set 1", "Set 2", "Set 3"],
  SQUASH: ["Set 1", "Set 2", "Set 3", "Set 4", "Set 5"],
  KABADDI: ["1st Half", "2nd Half", "Extra Time"],
  CARROM: ["Board 1", "Board 2", "Board 3", "Board 4", "Board 5", "Board 6", "Board 7", "Board 8"],
  CHESS: ["Game 1", "Game 2", "Game 3", "Tiebreak"],
  FOOSBALL: ["Game 1", "Game 2", "Game 3", "Game 4", "Game 5"],
  POOL: ["Frame 1", "Frame 2", "Frame 3", "Frame 4", "Frame 5"],
  DART: ["Leg 1", "Leg 2", "Leg 3", "Leg 4", "Leg 5"],
  BOWLING: ["Game 1", "Game 2", "Game 3"],
  TUG_OF_WAR: ["Round 1", "Round 2", "Round 3"],
  DEFAULT: ["Period 1", "Period 2", "Period 3", "Period 4", "Period 5"],
};

export const getSportType = (sportName: string): string | null => {
  if (!sportName) return null;
  const lower = sportName.toLowerCase();
  for (const [key, value] of Object.entries(SPORT_TYPE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return null;
};

export const isCricketSport = (sportName: string): boolean => {
  if (!sportName) return false;
  const lower = sportName.toLowerCase();
  return lower.includes('cricket');
};

const TIME_BASED_SPORTS = [
  'running', 'swimming', 'cycling', 'athletics', 'track and field',
  'track_and_field', 'marathon', 'sprint', 'skating', 'skate', 'rowing', 'triathlon'
];

export const isTimeSport = (sportName: string): boolean => {
  if (!sportName) return false;
  const lower = sportName.toLowerCase();
  return TIME_BASED_SPORTS.some(s => lower.includes(s));
};
