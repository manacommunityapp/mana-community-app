import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../apiClient';
import {
  formatRupees,
  reconstructAtPointInTime,
  recordSensitiveAudit,
  simulateRogueDbaTamper,
  validateDualControlRequirement,
} from './forensicsService';

vi.mock('../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('forensicsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enforces maker-checker dual control for ₹25,000 penalty waivers', async () => {
    expect(() => validateDualControlRequirement('PENALTY_WAIVER', 2_500_000, 101)).toThrow(
      /Dual-control checker approval/i,
    );
    expect(() => validateDualControlRequirement('PENALTY_WAIVER', 2_500_000, 101, 101)).toThrow(
      /different administrators/i,
    );

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      auditId: 'aud-1',
      seqNo: 1,
      riskTier: 'CRITICAL',
      tombstoned: false,
    });

    const res = await recordSensitiveAudit({
      societyId: 1,
      actionType: 'PENALTY_WAIVER',
      resourceType: 'FLAT_LEDGER',
      resourceId: 'B-902',
      actorId: 101,
      actorName: 'President Anil',
      checkerId: 102,
      checkerName: 'Treasurer Rao',
      monetaryImpactPaise: 2_500_000,
      reason: 'AGM waiver',
      oldValueJson: '{"penalty":25000}',
      newValueJson: '{"penalty":0}',
    });
    expect(res.riskTier).toBe('CRITICAL');
  });

  it('calls bitemporal time-travel and rogue-DBA tamper simulation endpoints', async () => {
    expect(formatRupees(-200_000)).toBe('-₹2000.00');

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      flatId: 902,
      asKnownBalancePaise: 200_000,
      restatedBalancePaise: 650_000,
      retroactiveVariancePaise: 450_000,
    });

    const recon = await reconstructAtPointInTime({
      societyId: 1,
      flatId: 902,
      asOfEffectiveDate: '2026-03-31',
      asOfRecordedAt: '2026-03-31T18:29:59Z',
    });
    expect(recon.asKnownBalancePaise).toBe(200_000);
    expect(recon.retroactiveVariancePaise).toBe(450_000);

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      chainValid: false,
      tailTruncationDetected: true,
      firstBrokenSeqNo: 4,
    });
    const report = await simulateRogueDbaTamper({ societyId: 1, mode: 'TRUNCATE_TAIL', targetSeqNo: 4 });
    expect(report.tailTruncationDetected).toBe(true);
    expect(report.firstBrokenSeqNo).toBe(4);
  });
});
