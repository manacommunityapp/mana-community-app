/**
 * Sports Module Validation Utilities
 * Enforces Indian mobile number standards and strict email validation across sports components.
 */

/**
 * Validates an Indian phone number.
 * Accepts:
 * - 10-digit numbers starting with 6, 7, 8, or 9 (e.g. 9876543210)
 * - Prefixed with +91, 91, or 0 (e.g. +91 9876543210, 91-9876543210, 09876543210)
 */
export function isValidIndianPhone(phone?: string | null): boolean {
  if (!phone) return false;
  const clean = phone.trim().replace(/[\s\-\(\)]/g, "");
  // Matches optional +91, 91, or 0 followed by a 10-digit number starting with 6-9
  const indianPhoneRegex = /^(?:(?:\+|0{0,2})91)?[6-9]\d{9}$|^0[6-9]\d{9}$/;
  return indianPhoneRegex.test(clean);
}

/**
 * Validates Indian phone number or allows empty string/null/undefined.
 */
export function validateIndianPhoneOrEmpty(phone?: string | null): boolean {
  if (!phone || !phone.trim()) return true;
  return isValidIndianPhone(phone);
}

/**
 * Normalizes an Indian phone number to 10-digit standard.
 */
export function normalizeIndianPhone(phone?: string | null): string {
  if (!phone) return "";
  const clean = phone.trim().replace(/[\s\-\(\)]/g, "");
  const match = clean.match(/^(?:(?:\+|0{0,2})91|0)?([6-9]\d{9})$/);
  return match ? match[1] : clean;
}

/**
 * Validates standard email address format.
 */
export function isValidEmail(email?: string | null): boolean {
 if (!email) return false;
 const clean = email.trim();
 const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
 return emailRegex.test(clean);
}

/**
 * Validates email or allows empty string/null/undefined.
 */
export function validateEmailOrEmpty(email?: string | null): boolean {
  if (!email || !email.trim()) return true;
  return isValidEmail(email);
}

// ─── Tournament & Event Date Validations ──────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEventDates(startDate?: string | Date | null, endDate?: string | Date | null): ValidationResult {
  if (!startDate) return { valid: false, error: "Event start date is required." };
  if (!endDate) return { valid: false, error: "Event end date is required." };

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) return { valid: false, error: "Invalid start date format." };
  if (isNaN(end.getTime())) return { valid: false, error: "Invalid end date format." };

  if (start > end) {
    return { valid: false, error: "Event start date cannot be after end date." };
  }

  return { valid: true };
}

// ─── Age Bracket & Eligibility Validations ────────────────────────────────────

export function calculateAgeFromDob(dob: string | Date, referenceDate: Date = new Date()): number {
  const birth = new Date(dob);
  let age = referenceDate.getFullYear() - birth.getFullYear();
  const m = referenceDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function validatePlayerAge(
  dob?: string | Date | null,
  minAge?: number | null,
  maxAge?: number | null,
  bornAfter?: string | null
): ValidationResult & { age?: number } {
  if (!dob) return { valid: false, error: "Date of Birth is mandatory for tournament verification." };

  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return { valid: false, error: "Invalid Date of Birth." };

  const age = calculateAgeFromDob(birthDate);

  if (minAge != null && age < minAge) {
    return { valid: false, age, error: `Under-age: Minimum age requirement is ${minAge} years (player is ${age} years old).` };
  }

  if (maxAge != null && age > maxAge) {
    return { valid: false, age, error: `Over-age: Maximum age limit is ${maxAge} years (player is ${age} years old).` };
  }

  if (bornAfter) {
    const cutoff = new Date(bornAfter);
    if (!isNaN(cutoff.getTime()) && birthDate < cutoff) {
      return { valid: false, age, error: `Born before category cutoff date (${bornAfter}).` };
    }
  }

  return { valid: true, age };
}

// ─── Gender & Mixed Doubles Validations ────────────────────────────────────────

export function validateGenderEligibility(playerGender?: string | null, allowedCategoryGender?: string | null): ValidationResult {
  if (!allowedCategoryGender || allowedCategoryGender.toUpperCase() === "OPEN" || allowedCategoryGender.toUpperCase() === "MIXED") {
    return { valid: true };
  }

  if (!playerGender) return { valid: false, error: "Gender specification is required for this tournament category." };

  const pg = playerGender.trim().toUpperCase();
  const cg = allowedCategoryGender.trim().toUpperCase();

  const isMale = ["MALE", "M", "MEN", "BOYS"].includes(pg);
  const isFemale = ["FEMALE", "F", "WOMEN", "GIRLS"].includes(pg);

  const reqMale = ["MALE", "M", "MEN", "BOYS"].includes(cg);
  const reqFemale = ["FEMALE", "F", "WOMEN", "GIRLS"].includes(cg);

  if (reqMale && !isMale) return { valid: false, error: "Only Male players are eligible for this category." };
  if (reqFemale && !isFemale) return { valid: false, error: "Only Female players are eligible for this category." };

  return { valid: true };
}

export function validateDoublesPair(
  playerGender?: string | null,
  partnerGender?: string | null,
  isMixedDoubles?: boolean
): ValidationResult {
  if (!partnerGender) return { valid: false, error: "Partner information and gender are required for doubles registration." };

  if (isMixedDoubles) {
    const pgMale = ["MALE", "M", "MEN", "BOYS"].includes(String(playerGender).toUpperCase());
    const partMale = ["MALE", "M", "MEN", "BOYS"].includes(String(partnerGender).toUpperCase());

    if (pgMale === partMale) {
      return {
        valid: false,
        error: "Mixed doubles requires exactly one Male and one Female partner pairing.",
      };
    }
  }

  return { valid: true };
}

// ─── Auction Bidding Edge Cases & Negativity Checks ───────────────────────────

export function validateAuctionBid(
  currentBid: number,
  newBid: number,
  remainingPurse: number,
  currentSquadCount: number,
  maxSquadCount: number,
  minIncrement: number = 100
): ValidationResult {
  if (currentSquadCount >= maxSquadCount) {
    return { valid: false, error: `Squad full: Team already has maximum squad size (${maxSquadCount} players).` };
  }

  if (newBid <= currentBid) {
    return { valid: false, error: `Bid must be strictly higher than current bid of ${currentBid}.` };
  }

  if (newBid < currentBid + minIncrement) {
    return { valid: false, error: `Minimum bid increment is ${minIncrement} points.` };
  }

  // Ensure remaining budget can cover this bid plus at least base price for remaining required squad slots
  const remainingSlotsNeeded = maxSquadCount - (currentSquadCount + 1);
  const minimumReserveNeeded = remainingSlotsNeeded * 100; // minimum base price per remaining slot

  if (newBid + minimumReserveNeeded > remainingPurse) {
    return {
      valid: false,
      error: `Purse deficit: Bidding ${newBid} leaves only ${remainingPurse - newBid} points, insufficient to fill remaining ${remainingSlotsNeeded} squad slots.`,
    };
  }

  return { valid: true };
}

// ─── Scoring Integrity Validations ────────────────────────────────────────────

export function validateCricketScore(runs: number, wickets: number, oversString: string, maxOvers: number = 20): ValidationResult {
  if (runs < 0) return { valid: false, error: "Runs scored cannot be negative." };
  if (wickets < 0 || wickets > 10) return { valid: false, error: "Wickets must be between 0 and 10." };

  const parsedOvers = parseFloat(oversString);
  if (isNaN(parsedOvers) || parsedOvers < 0) return { valid: false, error: "Invalid overs format." };

  const wholeOvers = Math.floor(parsedOvers);
  const balls = Math.round((parsedOvers - wholeOvers) * 10);
  if (balls >= 6) return { valid: false, error: "Invalid ball count in over (must be 0 to 5 balls before over completion)." };

  if (wholeOvers > maxOvers || (wholeOvers === maxOvers && balls > 0)) {
    return { valid: false, error: `Overs cannot exceed tournament limit of ${maxOvers} overs.` };
  }

  return { valid: true };
}

// ─── Self-Bidding & Auction Guards ────────────────────────────────────────────

export function validateSelfBidding(currentHighestBidderTeamId?: number | null, biddingTeamId?: number | null): ValidationResult {
  if (currentHighestBidderTeamId != null && biddingTeamId != null && currentHighestBidderTeamId === biddingTeamId) {
    return { valid: false, error: "Self-bidding prohibited: Your team already holds the highest bid on this player." };
  }
  return { valid: true };
}

// ─── Tournament Dates & Registration Deadline Guards ──────────────────────────

export function validateTournamentDatesWithDeadline(
  startDate?: string | Date | null,
  endDate?: string | Date | null,
  regDeadline?: string | Date | null
): ValidationResult {
  const baseResult = validateEventDates(startDate, endDate);
  if (!baseResult.valid) return baseResult;

  if (regDeadline) {
    const reg = new Date(regDeadline);
    const start = new Date(startDate!);
    if (isNaN(reg.getTime())) return { valid: false, error: "Invalid registration deadline format." };
    if (reg > start) {
      return { valid: false, error: "Registration deadline cannot be after tournament start date." };
    }
  }

  return { valid: true };
}

// ─── Fixture Scheduling Conflicts & Rest Time Guards ──────────────────────────

export interface FixtureScheduleItem {
  matchId?: number;
  teamAId: number;
  teamBId: number;
  venueId: number;
  startTime: string | Date;
  endTime: string | Date;
}

export function validateFixtureSchedulingConflict(
  match1: FixtureScheduleItem,
  match2: FixtureScheduleItem,
  minRestMinutes = 30
): ValidationResult {
  if (match1.matchId && match2.matchId && match1.matchId === match2.matchId) {
    return { valid: true };
  }

  const m1Start = new Date(match1.startTime).getTime();
  const m1End = new Date(match1.endTime).getTime();
  const m2Start = new Date(match2.startTime).getTime();
  const m2End = new Date(match2.endTime).getTime();

  if (isNaN(m1Start) || isNaN(m1End) || isNaN(m2Start) || isNaN(m2End)) {
    return { valid: false, error: "Invalid date/time format in fixtures." };
  }

  // 1. Same venue double-booking check
  if (match1.venueId === match2.venueId) {
    const venuesOverlap = m1Start < m2End && m2Start < m1End;
    if (venuesOverlap) {
      return {
        valid: false,
        error: `Venue Conflict: The selected court/ground is already booked for another match during this time window.`,
      };
    }
  }

  // 2. Team conflict and minimum rest period check
  const m1Teams = new Set([match1.teamAId, match1.teamBId]);
  const sharedTeam = [match2.teamAId, match2.teamBId].find(tId => m1Teams.has(tId));

  if (sharedTeam) {
    // Check direct time overlap
    const teamsOverlap = m1Start < m2End && m2Start < m1End;
    if (teamsOverlap) {
      return {
        valid: false,
        error: `Team Scheduling Conflict: Team #${sharedTeam} is scheduled for two matches simultaneously.`,
      };
    }

    // Check rest period between back-to-back matches
    const restBetween = Math.min(
      Math.abs(m2Start - m1End),
      Math.abs(m1Start - m2End)
    ) / (1000 * 60);

    if (restBetween < minRestMinutes) {
      return {
        valid: false,
        error: `Insufficient Rest: Team #${sharedTeam} only has ${Math.round(restBetween)} mins rest between matches (minimum required is ${minRestMinutes} mins).`,
      };
    }
  }

  return { valid: true };
}

// ─── Walkover & Forfeit Grace Period Check ─────────────────────────────────────

export function validateWalkoverForfeit(
  scheduledStart: string | Date,
  reportedArrival: string | Date,
  playersPresent: number,
  minRequiredPlayers: number,
  gracePeriodMinutes = 15
): { eligibleForWalkover: boolean; reason?: string } {
  const start = new Date(scheduledStart).getTime();
  const arrival = new Date(reportedArrival).getTime();

  if (isNaN(start) || isNaN(arrival)) {
    return { eligibleForWalkover: false, reason: "Invalid timestamp provided." };
  }

  const delayMinutes = (arrival - start) / (1000 * 60);

  if (delayMinutes > gracePeriodMinutes) {
    return {
      eligibleForWalkover: true,
      reason: `Opposing team failed to report within official ${gracePeriodMinutes}-minute grace period (late by ${Math.round(delayMinutes)} mins). Walkover forfeit awarded.`,
    };
  }

  if (playersPresent < minRequiredPlayers) {
    return {
      eligibleForWalkover: true,
      reason: `Insufficient squad: Team has only ${playersPresent} players present (minimum required to field a team is ${minRequiredPlayers}). Match forfeited.`,
    };
  }

  return { eligibleForWalkover: false };
}

// ─── Rain Curtailment & DLS Run Rate Calculation ──────────────────────────────

export function calculateRainRevisedTarget(
  firstInningsRuns: number,
  firstInningsOvers: number,
  revisedSecondInningsOvers: number,
  minOversThreshold = 5
): { isValidMatch: boolean; revisedTarget?: number; runRateNeeded?: number; reason?: string } {
  if (revisedSecondInningsOvers < minOversThreshold) {
    return {
      isValidMatch: false,
      reason: `Match Abandoned: Available overs (${revisedSecondInningsOvers}) are below minimum valid match threshold of ${minOversThreshold} overs.`,
    };
  }

  if (firstInningsOvers <= 0) {
    return { isValidMatch: false, reason: "1st innings overs must be greater than zero." };
  }

  const originalRunRate = firstInningsRuns / firstInningsOvers;
  // Standard Community Rain Rule (Proportionate overs calculation with 5% buffer for shortened chase)
  const adjustedTarget = Math.round(originalRunRate * revisedSecondInningsOvers * 1.05) + 1;
  const runRateNeeded = parseFloat((adjustedTarget / revisedSecondInningsOvers).toFixed(2));

  return {
    isValidMatch: true,
    revisedTarget: adjustedTarget,
    runRateNeeded,
  };
}

// ─── Racket Sports (Badminton/Tennis/Table Tennis) Score Validation ───────────

export function validateRacketSportsScore(
  pointsA: number,
  pointsB: number,
  targetPoints = 21,
  capPoints = 30
): ValidationResult & { isDeuce?: boolean; isGameWonBy?: 'A' | 'B' | null } {
  if (pointsA < 0 || pointsB < 0) return { valid: false, error: "Scores cannot be negative." };
  if (pointsA > capPoints || pointsB > capPoints) {
    return { valid: false, error: `Score cannot exceed sudden death cap of ${capPoints} points.` };
  }

  const isDeuce = pointsA >= targetPoints - 1 && pointsB >= targetPoints - 1;

  let isGameWonBy: 'A' | 'B' | null = null;
  if (pointsA >= targetPoints && pointsA - pointsB >= 2) {
    isGameWonBy = 'A';
  } else if (pointsB >= targetPoints && pointsB - pointsA >= 2) {
    isGameWonBy = 'B';
  } else if (pointsA === capPoints) {
    isGameWonBy = 'A';
  } else if (pointsB === capPoints) {
    isGameWonBy = 'B';
  }

  return { valid: true, isDeuce, isGameWonBy };
}

// ─── Code of Conduct & Toxicity Assessment ────────────────────────────────────

const SEVERE_PROFANITY_LIST = [
  "abuse", "idiot", "cheat", "scam", "fraud", "fixer", "corrupt", "kill", "threat", "hate",
  "bastard", "loser", "rigged", "thief", "violent", "punch", "fight", "asshole", "bitch"
];

export function assessCodeOfConduct(incidentText: string): {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedPenalty: string;
  flaggedWords: string[];
} {
  if (!incidentText || !incidentText.trim()) {
    return { severity: 'LOW', recommendedPenalty: "No action required.", flaggedWords: [] };
  }

  const lower = incidentText.toLowerCase();
  const flagged = SEVERE_PROFANITY_LIST.filter(word => lower.includes(word));

  if (flagged.length >= 3 || lower.includes("kill") || lower.includes("fight") || lower.includes("threat")) {
    return {
      severity: 'CRITICAL',
      recommendedPenalty: "Immediate match suspension, red card, referral to Community Disciplinary Committee.",
      flaggedWords: flagged,
    };
  }

  if (flagged.length >= 1) {
    return {
      severity: 'HIGH',
      recommendedPenalty: "Official warning, yellow card, 5-point conduct deduction.",
      flaggedWords: flagged,
    };
  }

  if (incidentText.length > 50 && (lower.includes("unfair") || lower.includes("dissent") || lower.includes("argue"))) {
    return {
      severity: 'MEDIUM',
      recommendedPenalty: "Verbal warning by match referee; captain informed.",
      flaggedWords: [],
    };
  }

  return {
    severity: 'LOW',
    recommendedPenalty: "Standard review; log incident notes.",
    flaggedWords: [],
  };
}


