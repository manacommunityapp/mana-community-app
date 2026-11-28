import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  authorizePosOrder,
  enqueueOfflinePosOrder,
  loadOfflinePosOutbox,
  quoteGuestPasses,
  syncOfflinePosOrders,
  validateTurnstileScan,
} from './clubhouseService';
import apiClient from '../apiClient';

vi.mock('../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Clubhouse POS, Offline Outbox & Pool Guest Pass Service', () => {
  const mem = new Map<string, string>();

  beforeEach(() => {
    vi.clearAllMocks();
    mem.clear();
    if (typeof globalThis.localStorage === 'undefined') {
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => mem.get(k) ?? null,
        setItem: (k: string, v: string) => mem.set(k, v),
        removeItem: (k: string) => mem.delete(k),
        clear: () => mem.clear(),
      });
    } else {
      localStorage.clear();
    }
  });

  it('enforces offline conservative floor cap on POS queue and clears outbox on sync', async () => {
    // Cached available credit ₹10,000, floor cap ₹1,500 -> max offline ticket ₹1,500
    expect(() =>
      enqueueOfflinePosOrder(
        {
          clientTxUuid: 'tx-too-big',
          flatId: 1204,
          unitCode: 'Tower A - 1204',
          terminalId: 'CAFE-POS-1',
          outletName: 'Club Café',
          itemsSummary: 'Dinner Platter',
          subtotalPaise: 180000,
          gstPaise: 9000,
          authMethod: 'OFFLINE_QR',
          orderedAt: '2026-11-28T01:00:00Z',
        },
        1000000,
        150000,
      ),
    ).toThrow(/Offline cap exceeded/);

    const queued = enqueueOfflinePosOrder(
      {
        clientTxUuid: 'tx-coffee-1',
        flatId: 1204,
        unitCode: 'Tower A - 1204',
        terminalId: 'CAFE-POS-1',
        outletName: 'Club Café',
        itemsSummary: 'Cappuccino x2',
        subtotalPaise: 32000,
        gstPaise: 1600,
        authMethod: 'OFFLINE_QR',
        orderedAt: '2026-11-28T01:00:00Z',
      },
      1000000,
      150000,
    );
    expect(queued).toHaveLength(1);
    expect(loadOfflinePosOutbox()).toHaveLength(1);

    (apiClient.post as any).mockResolvedValueOnce({
      totalSubmitted: 1,
      syncedCount: 1,
      deduplicatedCount: 0,
      overrunFreezeCount: 0,
      orders: [],
    });

    const synced = await syncOfflinePosOrders(1, queued);
    expect(synced.syncedCount).toBe(1);
    expect(loadOfflinePosOutbox()).toHaveLength(0);
  });

  it('authorizes flat tab orders and quotes dynamic pool guest pricing + turnstile scan', async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      outcome: 'CAPTURED',
      challenge: null,
      order: { orderId: 'ord-1', totalPaise: 33600 },
      account: { availableCreditPaise: 966400 },
    });

    const authRes = await authorizePosOrder({
      societyId: 1,
      flatId: 1204,
      unitCode: 'Tower A - 1204',
      terminalId: 'CAFE-POS-1',
      outletName: 'Club Café',
      clientTxUuid: 'tx-pin-1',
      itemsSummary: 'Flat White',
      subtotalPaise: 32000,
      gstPaise: 1600,
      settlementMode: 'FLAT_TAB',
      authMethod: 'PIN',
      pin: '4829',
    });
    expect(authRes.outcome).toBe('CAPTURED');

    (apiClient.post as any).mockResolvedValueOnce({
      dayCategory: 'WEEKEND',
      freeSlotsAllocated: 2,
      paidSlotsRequired: 1,
      paidUnitPricePaise: 30000,
      totalPayablePaise: 30000,
    });
    const quote = await quoteGuestPasses({
      societyId: 1,
      facilityCode: 'SWIMMING_POOL',
      flatId: 1204,
      visitDate: '2026-11-28',
      guestCount: 3,
    });
    expect(quote.totalPayablePaise).toBe(30000);

    (apiClient.post as any).mockResolvedValueOnce({
      accessGranted: true,
      reasonCode: 'ACCESS_GRANTED',
      poolOccupancy: 1,
    });
    const scan = await validateTurnstileScan({
      societyId: 1,
      facilityCode: 'SWIMMING_POOL',
      turnstileId: 'POOL-GATE-1',
      qrToken: 'v1.abc.sig',
    });
    expect(scan.accessGranted).toBe(true);
  });
});
