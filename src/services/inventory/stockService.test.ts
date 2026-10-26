import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stockService } from './stockService';
import { apiClient } from '../common/apiClient';

vi.mock('../common/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('stockService — Authoritative Ledger & Operational Intelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authoritative Stock Ledger API', () => {
    it('fetches immutable stock ledger entries with query parameters', async () => {
      const mockLedger = [
        {
          id: 1,
          productId: 10,
          productName: 'Cement Bags (50kg)',
          sku: 'CEM-50',
          locationId: 5,
          locationName: 'Main Warehouse / Storage B',
          movementType: 'INCOMING',
          referenceType: 'PO',
          referenceId: 'PO-2026-001',
          quantityChange: 50,
          resultingBalance: 50,
          unitCost: 380,
          totalValue: 19000,
          createdAt: '2026-10-13T10:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockLedger);

      const result = await stockService.getStockLedger({ productId: 10, communityId: 1 });

      expect(apiClient.get).toHaveBeenCalledWith('/inventory/reporting/ledger?productId=10&communityId=1');
      expect(result).toHaveLength(1);
      expect(result[0].productName).toBe('Cement Bags (50kg)');
      expect(result[0].resultingBalance).toBe(50);
    });

    it('propagates server errors without substituting fake stock ledger fallbacks', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Internal Server Error 500'));

      await expect(stockService.getStockLedger()).rejects.toThrow('Internal Server Error 500');
    });
  });

  describe('Inventory Intelligence & Reporting APIs', () => {
    it('retrieves inventory valuation report', async () => {
      const mockValuation = [
        {
          productId: 10,
          productName: 'Cement Bags (50kg)',
          categoryName: 'Construction Materials',
          warehouseName: 'Central Depot',
          locationId: 5,
          locationName: 'Storage B',
          quantityOnHand: 100,
          unitCost: 380,
          totalValuation: 38000,
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockValuation);

      const res = await stockService.getValuationReport();

      expect(apiClient.get).toHaveBeenCalledWith('/inventory/reporting/valuation');
      expect(res[0].totalValuation).toBe(38000);
    });

    it('retrieves stock aging report with age buckets', async () => {
      const mockAging = [
        {
          productId: 10,
          productName: 'Cement Bags (50kg)',
          locationName: 'Storage B',
          quantityOnHand: 20,
          ageDays: 45,
          agingBucket: '31-60 days',
          unitCost: 380,
          totalValue: 7600,
          lastMovementDate: '2026-08-29T10:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockAging);

      const res = await stockService.getStockAgingReport();

      expect(apiClient.get).toHaveBeenCalledWith('/inventory/reporting/stock-aging');
      expect(res[0].agingBucket).toBe('31-60 days');
    });

    it('retrieves FEFO picking recommendations sorted by earliest lot expiration', async () => {
      const mockFefo = [
        {
          lotId: 101,
          lotName: 'LOT-2026-EXP-OCT',
          productId: 20,
          productName: 'Chemical Sanitizer (5L)',
          locationName: 'Chemical Vault',
          availableQuantity: 15,
          expirationDate: '2026-10-20',
          daysUntilExpiry: 7,
          urgency: 'CRITICAL',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockFefo);

      const res = await stockService.getFefoRecommendations();

      expect(apiClient.get).toHaveBeenCalledWith('/inventory/reporting/fefo-recommendations');
      expect(res[0].urgency).toBe('CRITICAL');
      expect(res[0].daysUntilExpiry).toBe(7);
    });

    it('retrieves reorder alerts for items below safety stock', async () => {
      const mockAlerts = [
        {
          productId: 30,
          productName: 'LED Tube Lights 20W',
          defaultCode: 'LED-20W',
          currentOnHand: 3,
          safetyStock: 10,
          reorderQuantity: 50,
          deficit: 7,
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockAlerts);

      const res = await stockService.getReorderAlerts();

      expect(apiClient.get).toHaveBeenCalledWith('/inventory/reporting/reorder-alerts');
      expect(res[0].deficit).toBe(7);
    });
  });
});
