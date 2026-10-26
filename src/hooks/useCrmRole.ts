import { useState, useEffect } from 'react';
import { crmService, type CrmMeDto } from '../services/cpos/crmService';

const cache: { data: CrmMeDto | null; loading: boolean } = { data: null, loading: false };

export function useCrmRole() {
  const [me, setMe] = useState<CrmMeDto | null>(cache.data);
  const [loading, setLoading] = useState(!cache.data);

  useEffect(() => {
    if (cache.data) { setMe(cache.data); setLoading(false); return; }
    if (cache.loading) return;
    cache.loading = true;
    crmService.getMe()
      .then(d => { cache.data = d; setMe(d); })
      .catch(() => { cache.data = { role: 'ADMIN', agentName: '' }; setMe(cache.data); })
      .finally(() => { cache.loading = false; setLoading(false); });
  }, []);

  return {
    role: me?.role ?? 'AGENT',
    agentName: me?.agentName ?? '',
    isAdmin: me?.role === 'ADMIN',
    loading,
  };
}
