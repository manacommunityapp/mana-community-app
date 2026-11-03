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

export const tournamentPaymentService = {
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
        return saved;
      }
    } catch {
      // If backend endpoint is unavailable, local paymentRecord is preserved
    }

    return paymentRecord;
  },

  /**
   * Helper to deduplicate registrations across all events in a tournament
   * and merge them with their tournament payment record.
   */
  deduplicatePlayers(
    eventsWithRegistrations: Array<{
      event: DashboardEventCard | { id: number; name?: string; sportName?: string; categoryName?: string };
      registrations: TournamentRegistration[];
    }>,
    paymentsMap: Record<string, TournamentPlayerPayment>
  ): UniqueTournamentPlayer[] {
    const playerMap = new Map<string, UniqueTournamentPlayer>();

    for (const { event, registrations } of eventsWithRegistrations) {
      for (const reg of registrations || []) {
        if (!reg || reg.status === "WITHDRAWN" || reg.status === "REJECTED") {
          continue;
        }

        // Generate deterministic player key:
        // Priority 1: family member ID
        // Priority 2: user ID
        // Priority 3: normalized player name + flat number
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

        const eventDetail = {
          eventId: event.id,
          eventName: (event as any).name || (event as any).categoryName || `Event #${event.id}`,
          sportName: (event as any).sportName,
          categoryName: (event as any).categoryName,
          matchType: (reg as any).matchType || (reg as any).format || reg.matchFormat,
          status: reg.status || "CONFIRMED",
          registeredAt: (reg as any).registeredAt || (reg as any).createdAt,
          partnerName: reg.partnerName,
          partnerPhone: reg.partnerPhone,
        };

        if (playerMap.has(key)) {
          const existing = playerMap.get(key)!;
          // Avoid duplicate event entries if registered multiple times
          const alreadyAdded = existing.registeredEvents.some(
            (e) => e.eventId === event.id && e.matchType === eventDetail.matchType
          );
          if (!alreadyAdded) {
            existing.registeredEvents.push(eventDetail);
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
            registeredEvents: [eventDetail],
            payment,
            paymentStatus: payment?.paymentStatus || "UNPAID",
          });
        }
      }
    }

    return Array.from(playerMap.values()).sort((a, b) =>
      a.playerName.localeCompare(b.playerName)
    );
  },
};
