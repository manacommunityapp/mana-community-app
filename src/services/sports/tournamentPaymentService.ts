import { apiClient } from "../common/apiClient";
import { safeStorage } from "../../utils/storage";
import type { DashboardEventCard } from "./sportsDashboardService";
import type { TournamentRegistration } from "../../types/api";

export interface TournamentPlayerPayment {
  id?: number | string;
  tournamentId: number;
  playerKey: string; // Composite key: user_123 or fam_456 or name_flat
  userId?: number | null;
  familyMemberId?: number | null;
  playerName: string;
  flatNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  paymentStatus: "PAID" | "UNPAID" | "WAIVED";
  amount: number;
  paymentMode: "CASH" | "UPI" | "BANK_TRANSFER" | "ONLINE" | "WAIVED";
  transactionRef?: string | null;
  notes?: string | null;
  collectedByName?: string | null;
  collectedByContact?: string | null;
  markedByUserId?: number | string | null;
  markedByUserName?: string | null;
  paidAt?: string | null;
  createdAt?: string;
}

export type TournamentPaymentsSource = "SERVER" | "SERVER_AND_LOCAL" | "LOCAL";

export interface UniqueTournamentPlayer {
  playerKey: string;
  playerName: string;
  flatNumber?: string;
  phone?: string;
  email?: string;
  relation?: string;
  userId?: number;
  familyMemberId?: number;
  isPartnerOnly?: boolean;
  registeredEvents: Array<{
    eventId: number;
    eventName: string;
    sportName?: string;
    categoryName?: string;
    matchType?: string;
    status: string;
    registeredAt?: string;
    partnerName?: string;
    partnerPhone?: string;
    isPartner?: boolean;
    partnerConfirmationStatus?: string;
  }>;
  payment?: TournamentPlayerPayment;
  paymentStatus: "PAID" | "UNPAID" | "WAIVED";
}

export interface RecordPaymentPayload {
  playerKey: string;
  userId?: number | null;
  familyMemberId?: number | null;
  playerName: string;
  flatNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  amount: number;
  paymentMode: "CASH" | "UPI" | "BANK_TRANSFER" | "ONLINE" | "WAIVED";
  transactionRef?: string | null;
  notes?: string | null;
  collectedByName?: string | null;
  collectedByContact?: string | null;
  adminUserId?: number | string | null;
  adminUserName?: string | null;
}

const STORAGE_KEY_PREFIX = "mana_tournament_payments_";

function getLocalPayments(tournamentId: number): Record<string, TournamentPlayerPayment> {
  try {
    const raw = safeStorage.getItem(`${STORAGE_KEY_PREFIX}${tournamentId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalPayments(tournamentId: number, payments: Record<string, TournamentPlayerPayment>): void {
  try {
    safeStorage.setItem(`${STORAGE_KEY_PREFIX}${tournamentId}`, JSON.stringify(payments));
  } catch {
    // Ignore storage quota errors
  }
}

interface TournamentRosterCacheEntry {
  timestamp: number;
  players: UniqueTournamentPlayer[];
}

const tournamentRosterCache = new Map<number, TournamentRosterCacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds TTL for instant warm loads

export const tournamentPaymentService = {
  /**
   * Retrieve cached tournament players if fresh (younger than 60s)
   */
  getCachedPlayers(tournamentId: number): UniqueTournamentPlayer[] | null {
    const entry = tournamentRosterCache.get(tournamentId);
    if (!entry) return null;
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.players;
    }
    return null;
  },

  /**
   * Invalidate cached tournament players so next load fetches fresh data from server
   */
  invalidateRosterCache(tournamentId?: number): void {
    if (tournamentId != null) {
      tournamentRosterCache.delete(tournamentId);
    } else {
      tournamentRosterCache.clear();
    }
  },

  /**
   * Access local payments synchronously for immediate zero-latency UI hydration
   */
  getLocalPayments(tournamentId: number): Record<string, TournamentPlayerPayment> {
    return getLocalPayments(tournamentId);
  },

  /**
   * High-performance loader for tournament players & payment details:
   * 1. Returns fresh cached data immediately if available (0ms warm load).
   * 2. Uses the single batch API `/sports/tournaments/{tournamentId}/all-registrations`
   *    in parallel with `getPayments`, reducing N+1 round-trips to just 2 parallel requests.
   * 3. Falls back seamlessly to individual event queries if batch endpoint fails.
   * 4. Updates the in-memory SWR cache.
   */
  async loadTournamentPlayers(
    tournament: { id: number; events?: Array<{ id: number; name?: string | null; sportName?: string | null; categoryName?: string | null; [key: string]: any }> },
    options?: { forceRefresh?: boolean }
  ): Promise<UniqueTournamentPlayer[]> {
    const tournamentId = tournament.id;
    if (!options?.forceRefresh) {
      const cached = this.getCachedPlayers(tournamentId);
      if (cached && cached.length > 0) {
        return cached;
      }
    }

    const rawEvents = tournament.events || [];
    const uniqueEventIds = Array.from(
      new Set(
        rawEvents
          .map((ev) => ev.id)
          .filter((id): id is number => typeof id === "number" && id > 0)
      )
    );

    // Parallel fetch: (1) Payments and (2) Registrations
    const paymentsPromise = this.getPayments(tournamentId);

    let eventsWithRegs: Array<{
      event: DashboardEventCard | { id: number; name?: string | null; sportName?: string | null; categoryName?: string | null; [key: string]: any };
      registrations: TournamentRegistration[];
    }> = [];

    // Attempt 1: Single Batch Registrations Endpoint
    try {
      const qs = uniqueEventIds.length > 0 ? `?eventIds=${uniqueEventIds.join(",")}` : "";
      const batchRegs = await apiClient.get<TournamentRegistration[]>(
        `/sports/tournaments/${tournamentId}/all-registrations${qs}`
      );

      if (Array.isArray(batchRegs)) {
        const regsByEventId = new Map<number, TournamentRegistration[]>();
        for (const r of batchRegs) {
          const evId = r.event?.id != null ? Number(r.event.id) : (r as any).eventId != null ? Number((r as any).eventId) : undefined;
          if (evId) {
            if (!regsByEventId.has(evId)) regsByEventId.set(evId, []);
            regsByEventId.get(evId)!.push(r);
          }
        }

        eventsWithRegs = rawEvents.map((ev) => ({
          event: ev,
          registrations: regsByEventId.get(ev.id) || (uniqueEventIds.length === 1 && batchRegs.length > 0 ? batchRegs : []),
        }));
      }
    } catch {
      // Fallback: If batch endpoint is not reachable, query each event in parallel
      const registrationsByEventId = new Map<number, TournamentRegistration[]>();
      await Promise.all(
        uniqueEventIds.map(async (eventId) => {
          try {
            const regs = await apiClient.get<TournamentRegistration[]>(
              `/sports/tournaments/${eventId}/registrations`
            );
            registrationsByEventId.set(eventId, regs || []);
          } catch {
            registrationsByEventId.set(eventId, []);
          }
        })
      );

      eventsWithRegs = rawEvents.map((ev) => ({
        event: ev,
        registrations: registrationsByEventId.get(ev.id) || [],
      }));
    }

    const paymentsMap = await paymentsPromise;
    const deduplicated = this.deduplicatePlayers(eventsWithRegs, paymentsMap);

    // Update in-memory cache
    tournamentRosterCache.set(tournamentId, {
      timestamp: Date.now(),
      players: deduplicated,
    });

    return deduplicated;
  },

  /**
   * Pre-fetches tournament players and payment records on user hover or focus,
   * warming the cache 150-300ms before click so the modal opens instantaneously.
   */
  prefetchTournamentData(
    tournament: { id: number; events?: Array<{ id: number; name?: string | null; sportName?: string | null; categoryName?: string | null; [key: string]: any }> }
  ): void {
    if (!tournament?.id) return;
    const entry = tournamentRosterCache.get(tournament.id);
    if (entry && Date.now() - entry.timestamp < 30_000) {
      return; // Already warm in memory
    }
    // Background fire-and-forget
    this.loadTournamentPlayers(tournament).catch(() => {
      // Ignore background prefetch network errors
    });
  },

  /**
   * Fetch all payment records for a tournament
   */
  async getPayments(tournamentId: number): Promise<Record<string, TournamentPlayerPayment>> {
    return (await this.getPaymentsWithSource(tournamentId)).payments;
  },

  /** Fetch tournament payment records and identify when offline browser data is included. */
  async getPaymentsWithSource(tournamentId: number): Promise<{
    payments: Record<string, TournamentPlayerPayment>;
    source: TournamentPaymentsSource;
    serverPlayerKeys: string[];
  }> {
    const local = getLocalPayments(tournamentId);
    try {
      const serverPayments = await apiClient.get<TournamentPlayerPayment[]>(
        `/sports/tournaments/${tournamentId}/payments`
      );
      if (Array.isArray(serverPayments)) {
        const map: Record<string, TournamentPlayerPayment> = { ...local };
        const serverKeys = new Set(serverPayments.map((payment) => payment.playerKey).filter(Boolean));
        serverPayments.forEach((p) => {
          if (p.playerKey) {
            map[p.playerKey] = p;
          }
        });
        saveLocalPayments(tournamentId, map);
        const hasLocalOnlyPayments = Object.keys(local).some((playerKey) => !serverKeys.has(playerKey));
        return { payments: map, source: hasLocalOnlyPayments ? "SERVER_AND_LOCAL" : "SERVER", serverPlayerKeys: [...serverKeys] };
      }
    } catch {
      // Backend endpoint might not be deployed yet or offline; fallback to safe local storage
    }
    return { payments: local, source: "LOCAL", serverPlayerKeys: [] };
  },

  /**
   * Record a player as paid for the tournament
   */
  async recordPayment(
    tournamentId: number,
    payload: RecordPaymentPayload
  ): Promise<TournamentPlayerPayment> {
    const nowIso = new Date().toISOString();
    const paymentRecord: TournamentPlayerPayment = {
      id: `pay-${Date.now()}`,
      tournamentId,
      playerKey: payload.playerKey,
      userId: payload.userId,
      familyMemberId: payload.familyMemberId,
      playerName: payload.playerName,
      flatNumber: payload.flatNumber,
      phone: payload.phone,
      email: payload.email,
      paymentStatus: payload.paymentMode === "WAIVED" ? "WAIVED" : "PAID",
      amount: payload.amount,
      paymentMode: payload.paymentMode,
      transactionRef: payload.transactionRef,
      notes: payload.notes,
      collectedByName: payload.collectedByName,
      collectedByContact: payload.collectedByContact,
      markedByUserId: payload.adminUserId,
      markedByUserName: payload.adminUserName || "Admin",
      paidAt: nowIso,
      createdAt: nowIso,
    };

    // Save locally first to guarantee zero latency and offline support
    const localMap = getLocalPayments(tournamentId);
    localMap[payload.playerKey] = paymentRecord;
    saveLocalPayments(tournamentId, localMap);

    // Sync with backend API
    try {
      const saved = await apiClient.post<TournamentPlayerPayment>(
        `/sports/tournaments/${tournamentId}/payments/mark-paid`,
        paymentRecord
      );
      if (saved && saved.playerKey) {
        localMap[payload.playerKey] = saved;
        saveLocalPayments(tournamentId, localMap);
        this.invalidateRosterCache(tournamentId);
        return saved;
      }
    } catch {
      // If backend endpoint is unavailable, local paymentRecord is preserved
    }

    this.invalidateRosterCache(tournamentId);
    return paymentRecord;
  },

  /**
   * Mark a player as unpaid for the tournament (revert payment record)
   */
  async markUnpaid(tournamentId: number, playerKey: string): Promise<void> {
    this.invalidateRosterCache(tournamentId);
    // Remove from local storage first for instant zero-latency UI update
    const localMap = getLocalPayments(tournamentId);
    if (localMap[playerKey]) {
      delete localMap[playerKey];
      saveLocalPayments(tournamentId, localMap);
    }

    // Sync with backend API
    try {
      await apiClient.post(
        `/sports/tournaments/${tournamentId}/payments/mark-unpaid?playerKey=${encodeURIComponent(playerKey)}`
      );
    } catch {
      // If backend endpoint is unavailable, local removal is preserved
    }
  },

  /**
   * Helper to deduplicate registrations across all events in a tournament
   * and merge them with their tournament payment record.
   *
   * Seamlessly includes:
   * 1. Primary registered players (individual, head of household, family members, guests).
   * 2. Confirmed doubles or mixed doubles partners (from partnerUserId, partnerFamilyMemberId,
   *    or partnerName/partnerFlatNumber), ensuring players whose sole participation in the
   *    tournament is as an invited doubles partner appear in the tournament roster, flat groupings,
   *    and payment audit views.
   */
  deduplicatePlayers(
    eventsWithRegistrations: Array<{
      event: DashboardEventCard | { id: number; name?: string | null; sportName?: string | null; categoryName?: string | null; [key: string]: any };
      registrations: TournamentRegistration[];
    }>,
    paymentsMap: Record<string, TournamentPlayerPayment>
  ): UniqueTournamentPlayer[] {
    const playerMap = new Map<string, UniqueTournamentPlayer>();

    // Step 1: Pre-populate directory mappings (userContactMap, famContactMap) across all registrations
    // This allows backfilling contact info (flat, phone, email, relation) if a partner row only contains an ID or name
    const userContactMap = new Map<number, { name?: string; flatNumber?: string; phone?: string; email?: string }>();
    const famContactMap = new Map<number, { name?: string; flatNumber?: string; phone?: string; email?: string; relation?: string }>();

    for (const { registrations } of eventsWithRegistrations) {
      for (const reg of registrations || []) {
        if (!reg) continue;

        // User contact info
        const uId = reg.user?.id != null ? Number(reg.user.id) : (reg as any).userId != null ? Number((reg as any).userId) : undefined;
        if (uId) {
          const existing = userContactMap.get(uId) || {};
          userContactMap.set(uId, {
            name: reg.playerName || reg.user?.fullName || existing.name,
            flatNumber: reg.flatNumber || (reg.user as any)?.flatNo || existing.flatNumber,
            phone: reg.phone || (reg.user as any)?.phone || existing.phone,
            email: reg.email || reg.user?.email || existing.email,
          });
        }

        // Partner user contact info
        const pUId = reg.partner?.id != null ? Number(reg.partner.id) : (reg as any).partnerUserId != null ? Number((reg as any).partnerUserId) : undefined;
        if (pUId) {
          const existing = userContactMap.get(pUId) || {};
          userContactMap.set(pUId, {
            name: reg.partnerName || reg.partner?.fullName || reg.partner?.name || existing.name,
            flatNumber: reg.partnerFlatNumber || reg.partner?.flatNo || (reg.partner as any)?.flatNumber || existing.flatNumber,
            phone: reg.partnerPhone || reg.partner?.phone || existing.phone,
            email: reg.partner?.email || (reg as any).partnerEmail || existing.email,
          });
        }

        // Family member info
        const fId = (reg as any).familyMemberId != null ? Number((reg as any).familyMemberId) : reg.familyMember?.id != null ? Number(reg.familyMember.id) : undefined;
        if (fId) {
          const existing = famContactMap.get(fId) || {};
          famContactMap.set(fId, {
            name: reg.playerName || reg.familyMember?.name || existing.name,
            flatNumber: reg.flatNumber || existing.flatNumber,
            phone: reg.phone || existing.phone,
            email: reg.email || existing.email,
            relation: reg.relation || reg.familyMember?.relation || existing.relation,
          });
        }

        // Partner family member info
        const pFId = reg.partnerFamilyMember?.id != null ? Number(reg.partnerFamilyMember.id) : (reg as any).partnerFamilyMemberId != null ? Number((reg as any).partnerFamilyMemberId) : undefined;
        if (pFId) {
          const existing = famContactMap.get(pFId) || {};
          famContactMap.set(pFId, {
            name: reg.partnerName || reg.partnerFamilyMember?.name || existing.name,
            flatNumber: reg.partnerFlatNumber || existing.flatNumber,
            phone: reg.partnerPhone || existing.phone,
            email: (reg as any).partnerEmail || existing.email,
            relation: reg.partnerFamilyMember?.relation || (reg as any).partnerRelation || existing.relation,
          });
        }
      }
    }

    // Step 2: Process registrations
    for (const { event, registrations } of eventsWithRegistrations) {
      for (const reg of registrations || []) {
        if (!reg || reg.status === "WITHDRAWN" || reg.status === "REJECTED") {
          continue;
        }

        // ─── A. Process Primary Player ───────────────────────────────────────────
        const familyMemberId = (reg as any).familyMemberId != null
          ? Number((reg as any).familyMemberId)
          : (reg as any).familyMember?.id != null
          ? Number((reg as any).familyMember.id)
          : undefined;
        const userId = (reg as any).userId != null
          ? Number((reg as any).userId)
          : reg.user?.id != null
          ? Number(reg.user.id)
          : undefined;

        let key = "";
        if (familyMemberId) {
          key = `fam_${familyMemberId}`;
        } else if (userId) {
          key = `user_${userId}`;
        } else {
          const normName = (reg.playerName || "").trim().toLowerCase();
          const normFlat = (reg.flatNumber || "").trim().toLowerCase();
          key = `guest_${normName}_${normFlat}`;
        }

        const primaryPartnerName = reg.partnerName || reg.partner?.fullName || reg.partner?.name || reg.partnerFamilyMember?.name;
        const primaryPartnerPhone = reg.partnerPhone || reg.partner?.phone;

        const eventDetail = {
          eventId: event.id,
          eventName: (event as any).name || (event as any).categoryName || `Event #${event.id}`,
          sportName: (event as any).sportName,
          categoryName: (event as any).categoryName,
          matchType: (reg as any).matchType || (reg as any).format || reg.matchFormat,
          status: reg.status || "CONFIRMED",
          registeredAt: (reg as any).registeredAt || (reg as any).createdAt,
          partnerName: primaryPartnerName,
          partnerPhone: primaryPartnerPhone,
          isPartner: false,
          partnerConfirmationStatus: reg.partnerConfirmationStatus,
        };

        if (playerMap.has(key)) {
          const existing = playerMap.get(key)!;
          // When a primary registration is encountered, ensure isPartnerOnly is false
          existing.isPartnerOnly = false;

          const alreadyAdded = existing.registeredEvents.some(
            (e) => e.eventId === event.id && e.matchType === eventDetail.matchType
          );
          if (!alreadyAdded) {
            existing.registeredEvents.push(eventDetail);
          } else {
            // If it was previously added as partner-only event for this same player, upgrade it with primary details
            const idx = existing.registeredEvents.findIndex(
              (e) => e.eventId === event.id && e.matchType === eventDetail.matchType
            );
            if (idx >= 0 && existing.registeredEvents[idx].isPartner) {
              existing.registeredEvents[idx] = eventDetail;
            }
          }
          if (!existing.phone && reg.phone) existing.phone = reg.phone;
          if (!existing.email && reg.email) existing.email = reg.email;
          if (!existing.flatNumber && reg.flatNumber) existing.flatNumber = reg.flatNumber;
          if (!existing.relation && reg.relation) existing.relation = reg.relation;
        } else {
          const payment = paymentsMap[key];
          playerMap.set(key, {
            playerKey: key,
            playerName: reg.playerName || "Participant",
            flatNumber: reg.flatNumber,
            phone: reg.phone,
            email: reg.email,
            relation: reg.relation,
            userId,
            familyMemberId,
            isPartnerOnly: false,
            registeredEvents: [eventDetail],
            payment,
            paymentStatus: payment?.paymentStatus || "UNPAID",
          });
        }

        // ─── B. Process Confirmed Doubles / Mixed Partner ───────────────────────
        const rawPartnerStatus = String(
          reg.partnerConfirmationStatus || (reg as any).partnerStatus || ""
        ).toUpperCase().trim();
        const isPartnerDeclined = rawPartnerStatus === "DECLINED" || rawPartnerStatus === "REJECTED";
        const hasPartnerIdentity = Boolean(
          reg.partner ||
          (reg as any).partnerUserId != null ||
          reg.partnerFamilyMember ||
          (reg as any).partnerFamilyMemberId != null ||
          reg.partnerName
        );

        // Partner is participating if confirmed or accepted, or if legacy record without explicit decline/pending
        const isPartnerConfirmed =
          hasPartnerIdentity &&
          !isPartnerDeclined &&
          (rawPartnerStatus === "CONFIRMED" ||
            rawPartnerStatus === "ACCEPTED" ||
            (!rawPartnerStatus && (reg.partner != null || (reg as any).partnerUserId != null || (reg as any).partnerFamilyMemberId != null)));

        if (isPartnerConfirmed) {
          const partnerUserId = reg.partner?.id != null
            ? Number(reg.partner.id)
            : (reg as any).partnerUserId != null
            ? Number((reg as any).partnerUserId)
            : undefined;

          const partnerFamilyMemberId = reg.partnerFamilyMember?.id != null
            ? Number(reg.partnerFamilyMember.id)
            : (reg as any).partnerFamilyMemberId != null
            ? Number((reg as any).partnerFamilyMemberId)
            : undefined;

          let partnerName = (
            reg.partnerName ||
            reg.partner?.fullName ||
            reg.partner?.name ||
            reg.partnerFamilyMember?.name ||
            (reg as any).partnerPlayerName ||
            ""
          ).trim();

          let partnerFlat = (
            reg.partnerFlatNumber ||
            reg.partner?.flatNo ||
            (reg.partner as any)?.flatNumber ||
            ""
          ).trim();

          let partnerPhone = (
            reg.partnerPhone ||
            reg.partner?.phone ||
            ""
          ).trim();

          let partnerEmail = (
            reg.partner?.email ||
            (reg as any).partnerEmail ||
            ""
          ).trim();

          let partnerRelation = (
            reg.partnerFamilyMember?.relation ||
            (reg as any).partnerRelation ||
            ""
          ).trim();

          // Backfill from pre-built contact maps if missing
          if (partnerUserId && userContactMap.has(partnerUserId)) {
            const contact = userContactMap.get(partnerUserId)!;
            if (!partnerName && contact.name) partnerName = contact.name;
            if (!partnerFlat && contact.flatNumber) partnerFlat = contact.flatNumber;
            if (!partnerPhone && contact.phone) partnerPhone = contact.phone;
            if (!partnerEmail && contact.email) partnerEmail = contact.email;
          }

          if (partnerFamilyMemberId && famContactMap.has(partnerFamilyMemberId)) {
            const contact = famContactMap.get(partnerFamilyMemberId)!;
            if (!partnerName && contact.name) partnerName = contact.name;
            if (!partnerFlat && contact.flatNumber) partnerFlat = contact.flatNumber;
            if (!partnerPhone && contact.phone) partnerPhone = contact.phone;
            if (!partnerEmail && contact.email) partnerEmail = contact.email;
            if (!partnerRelation && contact.relation) partnerRelation = contact.relation;
          }

          // If partner is a household family member of the primary player, inherit flat/phone if unassigned
          if ((partnerFamilyMemberId || partnerRelation) && !partnerFlat && reg.flatNumber) {
            partnerFlat = reg.flatNumber;
          }
          if ((partnerFamilyMemberId || partnerRelation) && !partnerPhone && reg.phone) {
            partnerPhone = reg.phone;
          }

          if (!partnerName && partnerUserId) {
            partnerName = `Partner (User #${partnerUserId})`;
          }

          if (partnerName) {
            let partnerKey = "";
            if (partnerFamilyMemberId) {
              partnerKey = `fam_${partnerFamilyMemberId}`;
            } else if (partnerUserId) {
              partnerKey = `user_${partnerUserId}`;
            } else {
              const normPName = partnerName.toLowerCase();
              const normPFlat = partnerFlat.toLowerCase();
              partnerKey = `guest_${normPName}_${normPFlat}`;
            }

            const partnerEventDetail = {
              eventId: event.id,
              eventName: (event as any).name || (event as any).categoryName || `Event #${event.id}`,
              sportName: (event as any).sportName,
              categoryName: (event as any).categoryName,
              matchType: (reg as any).matchType || (reg as any).format || reg.matchFormat || "DOUBLES",
              status: reg.status || "CONFIRMED",
              registeredAt: (reg as any).partnerConfirmedAt || (reg as any).registeredAt || (reg as any).createdAt,
              partnerName: reg.playerName || reg.user?.fullName || "Primary Registrant",
              partnerPhone: reg.phone,
              isPartner: true,
              partnerConfirmationStatus: rawPartnerStatus || "CONFIRMED",
            };

            if (playerMap.has(partnerKey)) {
              const existingPartner = playerMap.get(partnerKey)!;
              const alreadyAdded = existingPartner.registeredEvents.some(
                (e) => e.eventId === event.id && e.matchType === partnerEventDetail.matchType
              );
              if (!alreadyAdded) {
                existingPartner.registeredEvents.push(partnerEventDetail);
              }
              if (!existingPartner.phone && partnerPhone) existingPartner.phone = partnerPhone;
              if (!existingPartner.email && partnerEmail) existingPartner.email = partnerEmail;
              if (!existingPartner.flatNumber && partnerFlat) existingPartner.flatNumber = partnerFlat;
              if (!existingPartner.relation && partnerRelation) existingPartner.relation = partnerRelation;
            } else {
              const payment = paymentsMap[partnerKey];
              playerMap.set(partnerKey, {
                playerKey: partnerKey,
                playerName: partnerName,
                flatNumber: partnerFlat || undefined,
                phone: partnerPhone || undefined,
                email: partnerEmail || undefined,
                relation: partnerRelation || (partnerFamilyMemberId ? "Family Member" : undefined),
                userId: partnerUserId,
                familyMemberId: partnerFamilyMemberId,
                isPartnerOnly: true,
                registeredEvents: [partnerEventDetail],
                payment,
                paymentStatus: payment?.paymentStatus || "UNPAID",
              });
            }
          }
        }
      }
    }

    return Array.from(playerMap.values()).sort((a, b) =>
      a.playerName.localeCompare(b.playerName)
    );
  },

  /** Updates the otherContacts JSON on a tournament (used for payment coordinators) */
  async updateTournamentOtherContacts(tournamentId: number, otherContacts: string, fallbackTournament?: any): Promise<void> {
    try {
      await apiClient.put(`/sports/tournaments/${tournamentId}/other-contacts`, {
        otherContacts,
      });
    } catch {
      // Fallback to updateTournament endpoint if other-contacts endpoint isn't available
      const payload: any = {
        name: fallbackTournament?.name,
        communityId: fallbackTournament?.communityId || fallbackTournament?.community?.id,
        eventDateStart: fallbackTournament?.eventDateStart || fallbackTournament?.startDate,
        eventDateEnd: fallbackTournament?.eventDateEnd || fallbackTournament?.endDate,
        otherContacts,
      };
      await apiClient.put(`/sports/tournaments/${tournamentId}`, payload);
    }
  },
};
