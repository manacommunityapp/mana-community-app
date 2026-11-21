import { describe, it, expect, vi, beforeEach } from 'vitest';
import { automationService } from './automationService';

describe('automationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isAvailable', () => {
    it('returns false when n8n webhook server is unreachable', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Connection refused'));
      const available = await automationService.isAvailable();
      expect(available).toBe(false);
    });

    it('returns true when n8n webhook server responds ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('OK', { status: 200 }));
      const available = await automationService.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe('Fallback behavior for offline operations', () => {
    it('handles triageTicket with resilient fallback when offline', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));
      const res = await automationService.triageTicket({
        ticketId: 101,
        title: 'Elevator power failure Block B',
        description: 'Elevator stopped between 3rd and 4th floor with passengers',
        category: 'ELEVATOR',
        location: 'Block B Lift 2'
      });

      expect(res.status).toBe('success');
      expect(res.analysis.urgency).toBe('MEDIUM');
      expect(res.analysis.safetyHazard).toBe(false);
      expect(res.analysis.assignedDepartment).toBe('ELEVATOR');
    });

    it('handles screenCommercialTenantKyc with GSTIN validation fallback', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));
      const res = await automationService.screenCommercialTenantKyc({
        tenantName: 'Blue Dart Retail Express',
        gstin: '29AABCS1429B1Z1',
        tradeCategory: 'LOGISTICS'
      });

      expect(res.status).toBe('fallback');
      expect(res.kycVerdict).toBe('CLEARED');
      expect(res.riskRating).toBe('LOW_RISK');
    });

    it('handles calculateLeaseRentEscalation and GST computation in fallback', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));
      const res = await automationService.calculateLeaseRentEscalation({
        currentMonthlyRent: 100000,
        escalationPercentage: 10
      });

      expect(res.status).toBe('fallback');
      expect(res.escalatedMonthlyRent).toBe(110000);
      expect(res.taxBreakdown.gstAmount).toBe(19800); // 18% of 110,000
      expect(res.taxBreakdown.tdsDeduction).toBe(11000); // 10% TDS
      expect(res.taxBreakdown.netPayableByTenant).toBe(118800); // 110,000 + 19,800 - 11,000
    });

    it('handles extended workflow cateringPlatform fallback cleanly', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));
      const res = await automationService.cateringPlatform({
        communityId: '1',
        residentId: 'RES-CATER-404',
        partySize: 50,
        cuisine: 'North Indian Buffet'
      });

      expect(res.status).toBe('fallback');
      expect(res.workflowId).toBe('catering-platform');
      expect(res.data.communityId).toBe('1');
      expect(res.data.partySize).toBe(50);
    });

    it('handles extended workflow healthAiSymptomGuide fallback cleanly', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));
      const res = await automationService.healthAiSymptomGuide({
        residentId: 'RES-MED-99',
        symptoms: ['Mild fever', 'Headache'],
        durationDays: 2
      });

      expect(res.status).toBe('fallback');
      expect(res.workflowId).toBe('health-ai-symptom-guide');
      expect(res.data.symptoms).toEqual(['Mild fever', 'Headache']);
    });
  });
});
