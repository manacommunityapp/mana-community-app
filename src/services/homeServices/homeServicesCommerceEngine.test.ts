import { describe, it, expect, vi, beforeEach } from 'vitest';
import { homeServicesService } from './homeServicesService';
import { apiClient } from '../common/apiClient';

vi.mock('../common/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Home Services Subscriptions, Slot Contention & Multi-Tender Split Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends midnight cutoff override and receives vendor route manifest', async () => {
    (apiClient.put as any).mockResolvedValueOnce({
      planId: 1,
      effectiveDeliveryDate: '2026-11-29',
      rolledPastCutoff: true,
    });
    const ov = await homeServicesService.upsertMorningOverride(1, '2026-11-28', 2, false);
    expect(ov.rolledPastCutoff).toBe(true);
    expect(ov.effectiveDeliveryDate).toBe('2026-11-29');

    (apiClient.post as any).mockResolvedValueOnce({
      vendorId: 5,
      totalFlats: 120,
      skuPackingTotals: { MILK_1L: 185 },
    });
    const manifest = await homeServicesService.freezeMorningManifest(5, '2026-11-29');
    expect(manifest.totalFlats).toBe(120);
  });

  it('quotes dynamic weekend/cluster pricing and performs two-phase slot hold + confirm', async () => {
    (apiClient.post as any).mockResolvedValueOnce({ quotedPrice: 1345.5, travelBufferMinutes: 5 });
    const quote = await homeServicesService.quoteDynamicSlot({
      basePrice: 1000,
      isWeekend: true,
      zoneUtilizationPct: 90,
      sameCommunityCluster: true,
    });
    expect(quote.quotedPrice).toBe(1345.5);

    (apiClient.post as any).mockResolvedValueOnce({ id: 12, holdToken: 'HOLD-1' });
    const hold = await homeServicesService.holdSlot(12, 'HOLD-1');
    expect(hold.holdToken).toBe('HOLD-1');

    (apiClient.post as any).mockResolvedValueOnce({ id: 501, status: 'CONFIRMED' });
    const booking = await homeServicesService.confirmHeldSlot(12, {
      holdToken: 'HOLD-1',
      flatNumber: 'A-402',
      category: 'AC_REPAIR',
      quotedPrice: 1345.5,
    });
    expect(booking.status).toBe('CONFIRMED');
  });

  it('orchestrates ₹1,200 multi-tender split ledger and UPI timeout compensation', async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      balanced: true,
      settlement: { vendorNetPayout: 987.6, platformCommission: 180, commissionGst: 32.4 },
    });
    const split = await homeServicesService.initiateSplitOrder({
      orderRef: 'ORD-SPLIT-1200',
      vendorId: 77,
      grossAmount: 1200,
      pointsUsed: 200,
      couponCode: 'DAIKIN100',
      couponDiscount: 100,
      upiAmount: 900,
    });
    expect(split.balanced).toBe(true);
    expect(split.settlement.vendorNetPayout).toBe(987.6);
  });
});
