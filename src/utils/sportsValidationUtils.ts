/**
 * Utilities for Sports Module validation, eligibility, tournament scheduling, and auction business rules.
 */

export interface SportsDateRange {
  startDate: string;
  endDate: string;
}

export interface PlayerAgeCheckParams {
  birthDate: string;
  minAge?: number | null;
  maxAge?: number | null;
  playersBornAfter?: string | null;
  referenceDate?: string | null;
}

export interface TeamRosterCheckParams {
  minPlayers?: number | null;
  maxPlayers?: number | null;
  players: Array<{
    id?: number | string;
    name?: string;
    gender?: "Male" | "Female" | "Other" | string;
  }>;
  mandatoryMixedDoubles?: boolean;
}

export interface AuctionBidValidationParams {
  currentBid: number;
  newBid: number;
  minIncrement?: number;
  teamAvailablePurse: number;
  reservePrice?: number;
}

export interface RegistrationCapacityParams {
  startDate?: string | null;
  endDate?: string | null;
  registrationStatus?: string | null;
  maxParticipants?: number | null;
  confirmedCount?: number;
  now?: Date;
}

/**
 * Validates that tournament end date is on or after start date.
 */
export function isTournamentDateRangeValid(startDate?: string | null, endDate?: string | null): boolean {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  return end.getTime() >= start.getTime();
}

/**
 * Validates that a sports event falls completely within its parent tournament date window.
 */
export function isEventWithinTournamentWindow(
  eventDates: SportsDateRange,
  tournamentDates: SportsDateRange
): boolean {
  if (!eventDates.startDate || !eventDates.endDate || !tournamentDates.startDate || !tournamentDates.endDate) {
    return false;
  }
  const eStart = new Date(eventDates.startDate).getTime();
  const eEnd = new Date(eventDates.endDate).getTime();
  const tStart = new Date(tournamentDates.startDate).getTime();
  const tEnd = new Date(tournamentDates.endDate).getTime();

  if (isNaN(eStart) || isNaN(eEnd) || isNaN(tStart) || isNaN(tEnd)) return false;
  return eStart >= tStart && eEnd <= tEnd && eEnd >= eStart;
}

/**
 * Calculates accurate age in full years from birthdate.
 */
export function calculateAge(birthDate: string, referenceDate?: string | null): number {
  const birth = new Date(birthDate);
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  if (isNaN(birth.getTime()) || isNaN(ref.getTime())) return -1;

  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Evaluates whether a player meets the sports category age requirements.
 */
export function isPlayerAgeEligible(params: PlayerAgeCheckParams): { eligible: boolean; reason?: string } {
  const { birthDate, minAge, maxAge, playersBornAfter, referenceDate } = params;
  if (!birthDate) {
    return { eligible: false, reason: "Birth date is required" };
  }

  const age = calculateAge(birthDate, referenceDate);
  if (age < 0) {
    return { eligible: false, reason: "Invalid birth date format" };
  }

  if (minAge != null && age < minAge) {
    return { eligible: false, reason: `Player age (${age}) is below minimum required age of ${minAge}` };
  }

  if (maxAge != null && age > maxAge) {
    return { eligible: false, reason: `Player age (${age}) exceeds maximum allowed age of ${maxAge}` };
  }

  if (playersBornAfter) {
    const cutoff = new Date(playersBornAfter).getTime();
    const birth = new Date(birthDate).getTime();
    if (birth < cutoff) {
      return { eligible: false, reason: `Player must be born on or after ${playersBornAfter}` };
    }
  }

  return { eligible: true };
}

/**
 * Validates team roster player count and mandatory mixed doubles requirements.
 */
export function validateTeamRoster(params: TeamRosterCheckParams): { valid: boolean; errors: string[] } {
  const { minPlayers, maxPlayers, players, mandatoryMixedDoubles } = params;
  const errors: string[] = [];

  const count = players?.length ?? 0;

  if (minPlayers != null && count < minPlayers) {
    errors.push(`Team has ${count} players, but minimum required is ${minPlayers}`);
  }

  if (maxPlayers != null && count > maxPlayers) {
    errors.push(`Team has ${count} players, which exceeds maximum limit of ${maxPlayers}`);
  }

  if (mandatoryMixedDoubles) {
    const hasMale = players.some((p) => p.gender?.toLowerCase() === "male");
    const hasFemale = players.some((p) => p.gender?.toLowerCase() === "female");

    if (!hasMale || !hasFemale) {
      errors.push("Mixed Doubles requires at least one Male and one Female player");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an auction bid against increment rules and team available purse.
 */
export function validateAuctionBid(params: AuctionBidValidationParams): { valid: boolean; error?: string } {
  const { currentBid, newBid, minIncrement = 100, teamAvailablePurse, reservePrice = 0 } = params;

  if (newBid <= 0) {
    return { valid: false, error: "Bid amount must be greater than zero" };
  }

  if (newBid < reservePrice) {
    return { valid: false, error: `Bid cannot be lower than reserve base price of ${reservePrice}` };
  }

  const requiredMinBid = currentBid > 0 ? currentBid + minIncrement : reservePrice || minIncrement;
  if (newBid < requiredMinBid) {
    return { valid: false, error: `Bid must be at least ${requiredMinBid} (increment of ${minIncrement})` };
  }

  if (newBid > teamAvailablePurse) {
    return {
      valid: false,
      error: `Bid of ${newBid} exceeds team's available purse budget of ${teamAvailablePurse}`,
    };
  }

  return { valid: true };
}

/**
 * Calculates remaining team purse after a successful bid acquisition.
 */
export function calculateRemainingPurse(totalPurse: number, spent: number, currentWinningBid: number): number {
  return Math.max(0, totalPurse - spent - currentWinningBid);
}

/**
 * Evaluates sports event registration status (OPEN, CLOSED, FULL, UPCOMING).
 */
export function evaluateRegistrationStatus(params: RegistrationCapacityParams): "OPEN" | "CLOSED" | "FULL" | "UPCOMING" {
  const { startDate, endDate, registrationStatus, maxParticipants, confirmedCount = 0, now = new Date() } = params;

  if (registrationStatus?.toUpperCase() === "CLOSED") {
    return "CLOSED";
  }

  if (maxParticipants != null && maxParticipants > 0 && confirmedCount >= maxParticipants) {
    return "FULL";
  }

  const currentTime = now.getTime();

  if (startDate) {
    const start = new Date(startDate).getTime();
    if (!isNaN(start) && currentTime < start) {
      return "UPCOMING";
    }
  }

  if (endDate) {
    const end = new Date(endDate).getTime();
    if (!isNaN(end) && currentTime > end) {
      return "CLOSED";
    }
  }

  return "OPEN";
}
