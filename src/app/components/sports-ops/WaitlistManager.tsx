import React, { useEffect, useState } from 'react';
import { sportsOpsService, CourtSlotWaitlist } from '../../../services/sports/sportsOpsService';

export default function WaitlistManager() {
  const [entries, setEntries] = useState<CourtSlotWaitlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    sportsOpsService.myWaitlist()
      .then(r => setEntries((r as any)?.data ?? r))
      .catch(() => setError('Failed to load waitlist'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 32, color: '#64748b' }}>Loading waitlist…</div>;
  if (error) return <div style={{ padding: 32, color: '#dc2626' }}>{error}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>My Court Waitlist</h2>
      {entries.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 12 }}>
          You are not on any waitlist.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map(e => (
            <div key={e.id} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>Booking #{e.bookingId}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Position: #{e.position}</p>
                  {e.expiresAt && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#f59e0b' }}>
                      Expires: {new Date(e.expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: e.notified ? '#dcfce7' : '#f1f5f9',
                  color: e.notified ? '#16a34a' : '#64748b',
                }}>
                  {e.notified ? 'Notified' : 'Waiting'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
