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

/**
 * Formats block and flat into a clean, standard community address string.
 * Examples:
 * - ("1008", "Block B") => "Block B, Flat 1008"
 * - ("1008", "B") => "Block B, Flat 1008"
 * - ("401", "Tower 2") => "Tower 2, Flat 401"
 * - ("B-1008") => "Block B, Flat 1008"
 * - ("1008") => "Flat 1008"
 * - ("Block B, Flat 1008") => "Block B, Flat 1008"
 * - ("Villa 42") => "Villa 42"
 */
export function formatFlatLabel(flat?: string | null, block?: string | null): string {
  if (!flat && !block) return "";
  let f = (flat || "").trim();
  let b = (block || "").trim();

  if (!f && !b) return "";

  // Already fully formatted e.g. "Block B, Flat 1008" or "Tower 2, Flat 401"
  if (/^(?:block|tower|wing)\s+[a-z0-9_-]+,\s*flat\s+[a-z0-9_-]+$/i.test(f)) {
    return f;
  }

  // Standalone villa/house
  if (/^(?:villa|house|penthouse|row\s*house)\b/i.test(f)) {
    return f;
  }

  // Hyphenated e.g. "B-1008" or "Tower 2-401"
  const hyphenMatch = f.match(/^((?:(?:block|tower|wing)\s+)?[a-z0-9]+)\s*[-/]\s*([a-z0-9]+)$/i);
  if (hyphenMatch) {
    const extractedBlock = hyphenMatch[1].trim();
    const extractedFlat = hyphenMatch[2].trim();
    const cleanB = /^(?:block|tower|wing)\b/i.test(extractedBlock) ? extractedBlock : `Block ${extractedBlock}`;
    return `${cleanB}, Flat ${extractedFlat}`;
  }

  // Spaced e.g. "Block B 1008"
  const spacedMatch = f.match(/^((?:block|tower|wing)\s+[a-z0-9]+)\s+(?:flat\s+)?([a-z0-9]+)$/i);
  if (spacedMatch) {
    return `${spacedMatch[1]}, Flat ${spacedMatch[2]}`;
  }

  // Clean leading "Flat " from f if present
  f = f.replace(/^flat\s+/i, "").trim();

  if (b) {
    const cleanB = /^(?:block|tower|wing)\b/i.test(b) ? b : `Block ${b}`;
    if (!f) return cleanB;
    if (f.toLowerCase() === cleanB.toLowerCase() || f.toLowerCase().startsWith(cleanB.toLowerCase() + " ")) {
      return f;
    }
    if (f.toLowerCase() === b.toLowerCase() || f.toLowerCase().startsWith(b.toLowerCase() + " ")) {
      return `${cleanB}${f.slice(b.length)}`;
    }
    return `${cleanB}, Flat ${f}`;
  }

  if (f) {
    return `Flat ${f}`;
  }

  return "";
}

/**
 * Removes double prefixes like "Flat Block B, Flat 1008" or "Flat Flat 1008"
 * ensuring clean rendering anywhere a flat string is output.
 */
export function formatUnitDisplay(address?: string | null): string {
  if (!address) return "";
  const cleaned = address.trim();
  // Strip duplicate leading "Flat " if followed by "Block " or "Tower " or "Flat "
  return cleaned.replace(/^flat\s+(?=(?:block|tower|wing|flat|villa)\b)/i, "");
}

/**
 * Detects whether a match object represents a BYE match or an auto-advanced slot.
 * Covers all status variants ("BYE", "AUTO_ADVANCED"), boolean flag `isBye`,
 * team names ("BYE"), and team IDs ("bye").
 */
export function isByeMatch(match: any): boolean {
  if (!match) return false;
  if (match.isBye === true) return true;

  const status = String(match.status || "").trim().toUpperCase();
  if (status === "BYE" || status === "AUTO_ADVANCED") return true;

  const teamAName = String(
    match.teamAName || match.homeName || match.team1 || match.teamA?.name || match.home?.name || ""
  ).trim().toUpperCase();
  const teamBName = String(
    match.teamBName || match.awayName || match.team2 || match.teamB?.name || match.away?.name || ""
  ).trim().toUpperCase();

  if (teamAName === "BYE" || teamBName === "BYE") return true;

  const teamAId = String(match.teamAId ?? match.homeId ?? match.home?.id ?? "").trim().toLowerCase();
  const teamBId = String(match.teamBId ?? match.awayId ?? match.away?.id ?? "").trim().toLowerCase();

  if (teamAId === "bye" || teamBId === "bye") return true;

  return false;
}

/**
 * Checks if a match has an explicitly scheduled time, avoiding fake midnight (00:00:00 / 12:00 AM) defaults.
 */
export function isExplicitTime(timeStr?: string | null, dateTimeIso?: string | null): boolean {
  if (timeStr && timeStr.trim().length > 0) {
    const norm = timeStr.trim().toUpperCase();
    if (norm !== "00:00" && norm !== "00:00:00" && norm !== "12:00 AM") {
      return true;
    }
  }

  if (dateTimeIso && dateTimeIso.trim().length > 0) {
    const raw = dateTimeIso.trim();
    // If it's date only (e.g. YYYY-MM-DD), no explicit time
    if (!raw.includes("T") && !raw.includes(" ")) return false;
    // Check if time portion is exactly midnight 00:00:00
    const timePortion = raw.split(/[T ]/)[1];
    if (timePortion) {
      const cleanTime = timePortion.replace(/Z|[+-]\d{2}(?::?\d{2})?$/, "");
      if (cleanTime.startsWith("00:00:00") || cleanTime === "00:00") {
        return false;
      }
      return true;
    }
  }

  return false;
}

/**
 * Checks if a participant or team name represents a placeholder, TBD, or feeder reference
 * (e.g., "Winner of Match 1", "Match 1 Winner", "TBD", "TBA", "BYE", "—", "").
 */
export function isPlaceholderOrTbd(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (trimmed === "" || trimmed === "—" || trimmed === "-") return true;
  const upper = trimmed.toUpperCase();
  if (upper === "TBD" || upper === "TBA" || upper === "BYE" || upper === "AUTO_ADVANCED") return true;
  if (/^(?:winner|loser)\s+of\b/i.test(trimmed)) return true;
  if (/\b(?:winner|loser)\b/i.test(trimmed) && /(?:match|qf|sf|r\d+|round|seed)/i.test(trimmed)) return true;
  return false;
}

/**
 * Propagates players/teams that receive a BYE in earlier knockout rounds into their downstream matches.
 * 
 * In single-elimination brackets, when a player has a BYE in Round R (e.g. Round 1), they automatically
 * advance to Round R+1 (e.g. Quarter-Finals or Round 2). Downstream matches often initially have placeholder
 * names like "Winner of Match 1" or "TBD". This function advances the BYE participant into the downstream
 * match, allowing user-matching widgets like "Your Upcoming Matches" and tournament schedules to show the
 * player's actual upcoming playable match with its scheduled date, time, and court.
 */
export function propagateByeAdvancements<T = any>(matches: T[]): T[] {
  if (!Array.isArray(matches) || matches.length === 0) {
    return matches || [];
  }

  // Create shallow clones of match objects so callers retain immutability
  const cloned: any[] = matches.map((m: any) => ({ ...m }));

  // Helper to extract the advancing participant details from a BYE match
  const getAdvancingParticipant = (m: any) => {
    const rawAName = m.teamAName || m.homeName || m.team1 || m.teamA?.name || m.home?.name || "";
    const rawBName = m.teamBName || m.awayName || m.team2 || m.teamB?.name || m.away?.name || "";
    const aId = m.teamAId ?? m.homeId ?? m.team1Id ?? m.teamA?.id ?? m.home?.id;
    const bId = m.teamBId ?? m.awayId ?? m.team2Id ?? m.teamB?.id ?? m.away?.id;

    const aIsBye = String(rawAName).trim().toUpperCase() === "BYE" || String(aId).toLowerCase() === "bye";
    const bIsBye = String(rawBName).trim().toUpperCase() === "BYE" || String(bId).toLowerCase() === "bye";

    let advSide: "A" | "B" | null = null;
    if (bIsBye && !aIsBye) {
      advSide = "A";
    } else if (aIsBye && !bIsBye) {
      advSide = "B";
    } else if (!isPlaceholderOrTbd(rawAName) && isPlaceholderOrTbd(rawBName)) {
      advSide = "A";
    } else if (!isPlaceholderOrTbd(rawBName) && isPlaceholderOrTbd(rawAName)) {
      advSide = "B";
    } else if (!aIsBye) {
      advSide = "A";
    }

    if (!advSide) return null;

    const isAdvA = advSide === "A";
    const name = isAdvA ? rawAName : rawBName;
    if (!name || isPlaceholderOrTbd(name)) return null;

    const id = isAdvA ? aId : bId;
    const flat = isAdvA
      ? (m.teamAFlat || m.homeFlat || m.team1Flat || m.teamA?.flatNumber || m.home?.flatNumber)
      : (m.teamBFlat || m.awayFlat || m.team2Flat || m.teamB?.flatNumber || m.away?.flatNumber);
    const players = isAdvA
      ? (m.teamA?.players || m.teamAPlayers)
      : (m.teamB?.players || m.teamBPlayers);
    const teamObj = isAdvA ? (m.teamA || m.home) : (m.teamB || m.away);

    return { name, id, flat, players, teamObj };
  };

  // Helper to determine round order/index of a match
  const getRoundNumber = (m: any): number => {
    if (typeof m.roundIndex === "number") return m.roundIndex;
    if (typeof m.roundNumber === "number") return m.roundNumber;
    const roundStr = String(m.roundName || m.round || m.roundType || m.stage || "").trim().toUpperCase();
    const roundMatch = roundStr.match(/ROUND\s*(\d+)/i);
    if (roundMatch) return parseInt(roundMatch[1], 10);
    const KNOCKOUT_ROUND_ORDER: Record<string, number> = {
      ROUND_OF_128: 0,
      ROUND_OF_64: 1,
      ROUND_OF_32: 2,
      ROUND_OF_16: 3,
      QUARTER_FINAL: 4,
      QUARTER_FINALS: 4,
      QUARTERFINAL: 4,
      QUARTERFINALS: 4,
      SEMI_FINAL: 5,
      SEMI_FINALS: 5,
      SEMIFINAL: 5,
      SEMIFINALS: 5,
      FINAL: 6,
      FINALS: 6,
    };
    const key = roundStr.replace(/[\s-]+/g, "_");
    if (key in KNOCKOUT_ROUND_ORDER) return KNOCKOUT_ROUND_ORDER[key];
    return 0;
  };

  // Populate target match with advancing participant
  const applyAdvancement = (target: any, side: "A" | "B", adv: { name: string; id?: any; flat?: string; players?: any[]; teamObj?: any }) => {
    let modified = false;
    if (side === "A") {
      const curName = target.teamAName || target.homeName || target.team1 || target.teamA?.name || target.home?.name;
      if (curName !== adv.name) {
        target.teamAName = adv.name;
        target.homeName = adv.name;
        target.team1 = adv.name;
        modified = true;
      }
      if (adv.id != null && target.teamAId !== adv.id && target.homeId !== adv.id) {
        target.teamAId = adv.id;
        target.homeId = adv.id;
        modified = true;
      }
      if (adv.flat && !target.teamAFlat) {
        target.teamAFlat = adv.flat;
        target.homeFlat = adv.flat;
        target.team1Flat = adv.flat;
      }
      if (adv.players && !target.teamAPlayers) {
        target.teamAPlayers = adv.players;
      }
      if (target.teamA && typeof target.teamA === "object") {
        target.teamA = { ...target.teamA, name: adv.name, id: adv.id ?? target.teamA.id };
      }
      if (target.home && typeof target.home === "object") {
        target.home = { ...target.home, name: adv.name, id: adv.id ?? target.home.id, flatNumber: adv.flat ?? target.home.flatNumber };
      }
    } else {
      const curName = target.teamBName || target.awayName || target.team2 || target.teamB?.name || target.away?.name;
      if (curName !== adv.name) {
        target.teamBName = adv.name;
        target.awayName = adv.name;
        target.team2 = adv.name;
        modified = true;
      }
      if (adv.id != null && target.teamBId !== adv.id && target.awayId !== adv.id) {
        target.teamBId = adv.id;
        target.awayId = adv.id;
        modified = true;
      }
      if (adv.flat && !target.teamBFlat) {
        target.teamBFlat = adv.flat;
        target.awayFlat = adv.flat;
        target.team2Flat = adv.flat;
      }
      if (adv.players && !target.teamBPlayers) {
        target.teamBPlayers = adv.players;
      }
      if (target.teamB && typeof target.teamB === "object") {
        target.teamB = { ...target.teamB, name: adv.name, id: adv.id ?? target.teamB.id };
      }
      if (target.away && typeof target.away === "object") {
        target.away = { ...target.away, name: adv.name, id: adv.id ?? target.away.id, flatNumber: adv.flat ?? target.away.flatNumber };
      }
    }
    return modified;
  };

  // Iteratively propagate advancements (supports multi-round / cascading BYEs)
  let changed = true;
  let passes = 0;
  while (changed && passes < 10) {
    changed = false;
    passes++;

    // Group matches by round for bracket positional matching
    const roundGroups = new Map<number, any[]>();
    for (const m of cloned) {
      const rNum = getRoundNumber(m);
      if (!roundGroups.has(rNum)) roundGroups.set(rNum, []);
      roundGroups.get(rNum)!.push(m);
    }
    // Sort matches within each round group by matchNumber or original index
    const sortedRounds = Array.from(roundGroups.keys()).sort((a, b) => a - b);
    for (const rNum of sortedRounds) {
      roundGroups.get(rNum)!.sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0));
    }

    for (const byeM of cloned) {
      if (!isByeMatch(byeM)) continue;

      const adv = getAdvancingParticipant(byeM);
      if (!adv) continue;

      const byeId = byeM.id ?? byeM.matchId;
      const byeIdStr = byeId != null ? String(byeId) : "";
      const byeNum = byeM.matchNumber != null ? String(byeM.matchNumber) : "";

      let target: any = null;
      let targetSide: "A" | "B" | null = null;

      // 1. Direct link on the BYE match (winnerAdvancesToMatchId / winnerAdvancesTo)
      const nextMatchId = byeM.winnerAdvancesToMatchId ?? byeM.winnerAdvancesTo ?? byeM.nextMatchId;
      if (nextMatchId != null) {
        const nextIdStr = String(nextMatchId);
        target = cloned.find((m: any) => String(m.id ?? m.matchId) === nextIdStr);
        if (target) {
          if (byeIdStr && String(target.winnerFeedFromMatchA) === byeIdStr) {
            targetSide = "A";
          } else if (byeIdStr && String(target.winnerFeedFromMatchB) === byeIdStr) {
            targetSide = "B";
          } else if (target.placeholderTeamA && byeNum && target.placeholderTeamA.includes(byeNum)) {
            targetSide = "A";
          } else if (target.placeholderTeamB && byeNum && target.placeholderTeamB.includes(byeNum)) {
            targetSide = "B";
          }
        }
      }

      // 2. Target references the BYE match via feeder links (winnerFeedFromMatchA/B)
      if (!target && byeIdStr) {
        target = cloned.find((m: any) => String(m.winnerFeedFromMatchA) === byeIdStr);
        if (target) {
          targetSide = "A";
        } else {
          target = cloned.find((m: any) => String(m.winnerFeedFromMatchB) === byeIdStr);
          if (target) targetSide = "B";
        }
      }

      // 3. Downstream match references BYE match in placeholder text or team name
      if (!target && (byeNum || byeIdStr)) {
        for (const m of cloned) {
          if (m === byeM) continue;
          const aPlace = String(m.placeholderTeamA || m.teamAName || m.homeName || m.team1 || "");
          const bPlace = String(m.placeholderTeamB || m.teamBName || m.awayName || m.team2 || "");
          const aMatches = isPlaceholderOrTbd(aPlace) && ((byeNum && aPlace.includes(`Match ${byeNum}`)) || (byeIdStr && aPlace.includes(byeIdStr)));
          const bMatches = isPlaceholderOrTbd(bPlace) && ((byeNum && bPlace.includes(`Match ${byeNum}`)) || (byeIdStr && bPlace.includes(byeIdStr)));
          if (aMatches) {
            target = m;
            targetSide = "A";
            break;
          } else if (bMatches) {
            target = m;
            targetSide = "B";
            break;
          }
        }
      }

      // 4. Knockout bracket tree positional matching (Round R match i -> Round R+1 match Math.floor(i / 2))
      if (!target) {
        const curRound = getRoundNumber(byeM);
        const curMatches = roundGroups.get(curRound) || [];
        const nextRoundIdx = sortedRounds.find(r => r > curRound);
        if (nextRoundIdx !== undefined) {
          const nextMatches = roundGroups.get(nextRoundIdx) || [];
          const posInRound = curMatches.indexOf(byeM);
          if (posInRound >= 0 && nextMatches.length > 0) {
            const targetPos = Math.min(Math.floor(posInRound / 2), nextMatches.length - 1);
            target = nextMatches[targetPos];
            targetSide = posInRound % 2 === 0 ? "A" : "B";
          }
        }
      }

      if (target) {
        // Resolve target side if still ambiguous
        if (!targetSide) {
          const aName = target.teamAName || target.homeName || target.team1 || target.teamA?.name || target.home?.name;
          const bName = target.teamBName || target.awayName || target.team2 || target.teamB?.name || target.away?.name;
          if (isPlaceholderOrTbd(aName) && !isPlaceholderOrTbd(bName)) {
            targetSide = "A";
          } else if (isPlaceholderOrTbd(bName) && !isPlaceholderOrTbd(aName)) {
            targetSide = "B";
          } else if (isPlaceholderOrTbd(aName)) {
            targetSide = "A";
          } else {
            targetSide = "B";
          }
        }

        const targetCurName = targetSide === "A"
          ? (target.teamAName || target.homeName || target.team1 || target.teamA?.name || target.home?.name)
          : (target.teamBName || target.awayName || target.team2 || target.teamB?.name || target.away?.name);

        if (isPlaceholderOrTbd(targetCurName) && targetCurName !== adv.name) {
          const wasModified = applyAdvancement(target, targetSide, adv);
          if (wasModified) changed = true;
        }
      }
    }
  }

  return cloned as T[];
}
