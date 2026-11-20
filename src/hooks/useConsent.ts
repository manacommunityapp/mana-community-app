import { useState, useEffect, useCallback } from 'react';
import { privacyService, type ConsentPurpose, type ConsentRecord } from '../services/privacy/privacyService';

const NOTICE_VERSION = '2024-11-v1';

interface UseConsentReturn {
  consents: ConsentRecord[];
  loading: boolean;
  hasConsent: (purpose: ConsentPurpose) => boolean;
  grant: (purpose: ConsentPurpose) => Promise<void>;
  revoke: (purpose: ConsentPurpose) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useConsent(): UseConsentReturn {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const records = await privacyService.getConsents();
      setConsents(records);
    } catch {
      // fail silently — UI falls back to prompting consent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const hasConsent = useCallback(
    (purpose: ConsentPurpose) =>
      consents.some((c) => c.purpose === purpose && c.status === 'GRANTED'),
    [consents],
  );

  const grant = useCallback(async (purpose: ConsentPurpose) => {
    const record = await privacyService.grantConsent({ purpose, noticeVersion: NOTICE_VERSION });
    setConsents((prev) => {
      const without = prev.filter((c) => c.purpose !== purpose);
      return [...without, record];
    });
  }, []);

  const revoke = useCallback(async (purpose: ConsentPurpose) => {
    const record = await privacyService.revokeConsent(purpose);
    setConsents((prev) => {
      const without = prev.filter((c) => c.purpose !== purpose);
      return [...without, record];
    });
  }, []);

  return { consents, loading, hasConsent, grant, revoke, refresh };
}
