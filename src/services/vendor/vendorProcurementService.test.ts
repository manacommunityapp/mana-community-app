import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vendorProcurementService } from './vendorProcurementService';
import { apiClient } from '../common/apiClient';

vi.mock('../common/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('vendorProcurementService — Purchase-to-Pay & Three-Way Match Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Purchase Order & Goods Receipt Note Lifecycle', () => {
    it('retrieves purchase orders list', async () => {
      const mockOrders = [
        {
          id: 1,
          poNumber: 'PO-2026-0001',
          vendorId: 5,
          vendorName: 'Apex Building Solutions',
          subtotal: 10000,
          taxAmount: 1800,
          totalAmount: 11800,
          status: 'APPROVED',
          items: [],
          createdAt: '2026-10-10T10:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockOrders);

      const orders = await vendorProcurementService.getOrders();

      expect(apiClient.get).toHaveBeenCalledWith('/vendor/procurement/orders');
      expect(orders).toHaveLength(1);
      expect(orders[0].poNumber).toBe('PO-2026-0001');
    });

    it('creates goods receipt note (GRN) with accepted and rejected quantities', async () => {
      const grnPayload = {
        purchaseOrderId: 1,
        vehicleNumber: 'KA-01-AB-1234',
        challanNumber: 'DC-8849',
        remarks: 'Delivered at Gate 2',
        items: [
          {
            poItemId: 10,
            itemName: 'Industrial Pumps',
            orderedQuantity: 5,
            receivedQuantity: 5,
            acceptedQuantity: 4,
            rejectedQuantity: 1,
            rejectionReason: 'Cracked casing on unit #5',
            unitPrice: 25000,
          },
        ],
      };

      const mockResponse = {
        id: 100,
        grnNumber: 'GRN-2026-0001',
        purchaseOrderId: 1,
        poNumber: 'PO-2026-0001',
        vendorId: 5,
        vendorName: 'Apex Building Solutions',
        receivedDate: '2026-10-13',
        receivedBy: 'Security Lead',
        status: 'ACCEPTED',
        items: [],
        createdAt: '2026-10-13T12:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const res = await vendorProcurementService.createGoodsReceipt(grnPayload);

      expect(apiClient.post).toHaveBeenCalledWith('/vendor/procurement/grn', grnPayload);
      expect(res.grnNumber).toBe('GRN-2026-0001');
    });
  });

  describe('Automated Three-Way Matching Verification', () => {
    it('submits invoice for 3-way match verification and parses results', async () => {
      const mockMatchResult = {
        invoiceId: 50,
        invoiceNumber: 'INV-2026-0050',
        purchaseOrderId: 1,
        poNumber: 'PO-2026-0001',
        matched: true,
        totalPoAmount: 100000,
        totalGrnAmount: 100000,
        totalInvoiceAmount: 100000,
        quantityDiscrepancy: false,
        priceDiscrepancy: false,
        notes: '3-Way Match Verified within ±2% tolerance.',
        lineMatches: [
          {
            poItemId: 10,
            itemName: 'Industrial Pumps',
            poQuantity: 4,
            grnAcceptedQuantity: 4,
            invoiceQuantity: 4,
            poUnitPrice: 25000,
            invoiceUnitPrice: 25000,
            status: 'MATCHED' as const,
            remarks: 'Exact match',
          },
        ],
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockMatchResult);

      const result = await vendorProcurementService.verifyThreeWayMatch(50);

      expect(apiClient.post).toHaveBeenCalledWith('/vendor/procurement/invoices/50/match-3way');
      expect(result.matched).toBe(true);
      expect(result.quantityDiscrepancy).toBe(false);
      expect(result.lineMatches[0].status).toBe('MATCHED');
    });

    it('propagates error when 3-way match verification encounters server failure without mock fallback', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Invoice not found: 999'));

      await expect(vendorProcurementService.verifyThreeWayMatch(999)).rejects.toThrow('Invoice not found: 999');
    });
  });
});
