import type { EventRegistration } from "../../../types/api";
import { getPartnerDetails } from "../sports/admin/sportsPartnerUtils";
import { formatFlatLabel } from "../../../utils/sportsValidationUtils";

export interface DoublesTeamPair {
  id: string;
  name: string;
  player1: EventRegistration;
  player2: EventRegistration | null;
  flatNumber?: string;
  rating?: number | null;
  isAutoPaired: boolean;
}

export interface PartitionResult {
  fixedPairs: DoublesTeamPair[];
  openPool: EventRegistration[];
}

export interface PairingResult {
  pairedTeams: DoublesTeamPair[];
  unpairedPlayers: EventRegistration[];
}

/**
 * Extracts and formats flat number from a registration object.
 */
export function getRegistrationFlatNumber(reg: EventRegistration): string | undefined {
  if (!reg) return undefined;
  const rawFlat = (
    reg.flatNumber ||
    (reg as any).flatNo ||
    reg.user?.flatNo ||
    (reg.user as any)?.flatNumber ||
    (reg as any).unit ||
    ""
  ).trim();
  const block = (reg as any).block || (reg.user as any)?.block || (reg.user as any)?.tower;
  const formatted = formatFlatLabel(rawFlat, block);
  return formatted || rawFlat || undefined;
}

/**
 * Normalizes and formats player name from registration object.
 */
export function getRegistrationPlayerName(reg: EventRegistration): string {
  return (
    reg.playerName ||
    reg.user?.fullName ||
    (reg as any).userName ||
    `Player #${reg.id}`
  ).trim();
}

/**
 * Combines two flat numbers avoiding duplicates (e.g. "A-101" + "B-202" -> "A-101 / B-202", or "A-101" + "A-101" -> "A-101").
 */
export function combineFlats(flat1?: string | null, flat2?: string | null): string | undefined {
  const f1 = (flat1 || "").trim();
  const f2 = (flat2 || "").trim();
  if (f1 && f2) {
    return f1 === f2 ? f1 : `${f1} / ${f2}`;
  }
  return f1 || f2 || undefined;
}

/**
 * Partitions confirmed registrations in a doubles event into:
 * 1. Fixed confirmed / reciprocal pairs
 * 2. Unpartnered open-pool players seeking a partner
 */
export function partitionDoublesRegistrations(
  registrations: EventRegistration[],
  event?: any
): PartitionResult {
  const fixedPairs: DoublesTeamPair[] = [];
  const openPool: EventRegistration[] = [];
  const processedRegIds = new Set<number>();

  for (const reg of registrations) {
    if (processedRegIds.has(reg.id)) continue;
    processedRegIds.add(reg.id);

    const partnerInfo = getPartnerDetails(reg as any, registrations as any, event);

    if (partnerInfo.hasPartner && partnerInfo.name) {
      // Find partner's reciprocal registration if present so we don't duplicate
      let partnerReg: EventRegistration | null = null;
      if (reg.partnerUserId != null) {
        partnerReg = registrations.find(
          other =>
            other.id !== reg.id &&
            ((other.user?.id != null && other.user.id === reg.partnerUserId) || other.id === reg.partnerUserId)
        ) || null;
      }

      if (partnerReg) {
        processedRegIds.add(partnerReg.id);
      }

      const p1Name = getRegistrationPlayerName(reg);
      const p2Name = partnerInfo.name;
      const proposedTeam = reg.proposedTeamName?.trim();
      const name = proposedTeam ? `${proposedTeam} (${p1Name} / ${p2Name})` : `${p1Name} / ${p2Name}`;

      const p1Flat = getRegistrationFlatNumber(reg);
      const p2Flat = partnerInfo.flat;
      const combinedFlat = combineFlats(p1Flat, p2Flat);

      const r1 = reg.rating ?? null;
      const r2 = (partnerReg as any)?.rating ?? null;
      const avgRating = r1 != null && r2 != null ? (r1 + r2) / 2 : (r1 ?? r2 ?? null);

      fixedPairs.push({
        id: `fixed-${reg.id}${partnerReg ? `-${partnerReg.id}` : ''}`,
        name,
        player1: reg,
        player2: partnerReg,
        flatNumber: combinedFlat,
        rating: avgRating,
        isAutoPaired: false,
      });
    } else {
      openPool.push(reg);
    }
  }

  return { fixedPairs, openPool };
}

/**
 * Standard Fisher-Yates array shuffle.
 */
export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pairs open-pool solo players into complete 2-player doubles teams.
 * Supports random Fisher-Yates shuffle and Mixed Doubles 1M + 1F matching when gender is known.
 */
export function pairOpenPoolPlayers(
  openPoolPlayers: EventRegistration[],
  options?: { isMixedDoubles?: boolean }
): PairingResult {
  if (openPoolPlayers.length < 2) {
    return {
      pairedTeams: [],
      unpairedPlayers: [...openPoolPlayers],
    };
  }

  const pairedTeams: DoublesTeamPair[] = [];
  const unpairedPlayers: EventRegistration[] = [];

  if (options?.isMixedDoubles) {
    const isMale = (r: EventRegistration) => {
      const g = (r.gender || (r as any).user?.gender || '').toUpperCase();
      return g === 'MALE' || g === 'M';
    };
    const isFemale = (r: EventRegistration) => {
      const g = (r.gender || (r as any).user?.gender || '').toUpperCase();
      return g === 'FEMALE' || g === 'F';
    };

    const males = shuffleArray(openPoolPlayers.filter(isMale));
    const females = shuffleArray(openPoolPlayers.filter(isFemale));
    const others = shuffleArray(openPoolPlayers.filter(r => !isMale(r) && !isFemale(r)));

    const pairCount = Math.min(males.length, females.length);
    for (let i = 0; i < pairCount; i++) {
      const m = males[i];
      const f = females[i];
      const p1Name = getRegistrationPlayerName(m);
      const p2Name = getRegistrationPlayerName(f);
      const combinedFlat = combineFlats(getRegistrationFlatNumber(m), getRegistrationFlatNumber(f));
      const r1 = m.rating ?? null;
      const r2 = f.rating ?? null;
      const avgRating = r1 != null && r2 != null ? (r1 + r2) / 2 : (r1 ?? r2 ?? null);

      pairedTeams.push({
        id: `auto-mixed-${m.id}-${f.id}`,
        name: `${p1Name} / ${p2Name}`,
        player1: m,
        player2: f,
        flatNumber: combinedFlat,
        rating: avgRating,
        isAutoPaired: true,
      });
    }

    const leftover = [
      ...males.slice(pairCount),
      ...females.slice(pairCount),
      ...others,
    ];

    if (leftover.length >= 2) {
      const sub = pairOpenPoolPlayers(leftover, { isMixedDoubles: false });
      pairedTeams.push(...sub.pairedTeams);
      unpairedPlayers.push(...sub.unpairedPlayers);
    } else {
      unpairedPlayers.push(...leftover);
    }

    return { pairedTeams, unpairedPlayers };
  }

  // General random pairing
  const shuffled = shuffleArray(openPoolPlayers);
  const totalPairs = Math.floor(shuffled.length / 2);

  for (let i = 0; i < totalPairs; i++) {
    const p1 = shuffled[2 * i];
    const p2 = shuffled[2 * i + 1];
    const p1Name = getRegistrationPlayerName(p1);
    const p2Name = getRegistrationPlayerName(p2);
    const combinedFlat = combineFlats(getRegistrationFlatNumber(p1), getRegistrationFlatNumber(p2));

    const r1 = p1.rating ?? null;
    const r2 = p2.rating ?? null;
    const avgRating = r1 != null && r2 != null ? (r1 + r2) / 2 : (r1 ?? r2 ?? null);

    pairedTeams.push({
      id: `auto-${p1.id}-${p2.id}`,
      name: `${p1Name} / ${p2Name}`,
      player1: p1,
      player2: p2,
      flatNumber: combinedFlat,
      rating: avgRating,
      isAutoPaired: true,
    });
  }

  if (shuffled.length % 2 !== 0) {
    unpairedPlayers.push(shuffled[shuffled.length - 1]);
  }

  return { pairedTeams, unpairedPlayers };
}
