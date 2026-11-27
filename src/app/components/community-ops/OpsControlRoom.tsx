import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import communityOpsService, { OpsControlRoomSummary } from '@/services/communityOps/communityOpsService';

const tiles = [
  { key: 'staffOnDuty', label: 'Staff on Duty', icon: '👷', color: '#059669', bg: '#D1FAE5', link: '/ops/attendance' },
  { key: 'pendingParcels', label: 'Pending Parcels', icon: '📦', color: '#D97706', bg: '#FEF3C7', link: '/ops/parcels' },
  { key: 'todayVisitors', label: "Today's Visitors", icon: '👤', color: '#2563EB', bg: '#DBEAFE', link: '/ops/passes' },
  { key: 'overdueMaintenanceTasks', label: 'Overdue Maintenance', icon: '⚠️', color: '#DC2626', bg: '#FEE2E2', link: '/ops/assets' },
  { key: 'upcomingMaintenance', label: 'Upcoming (7 days)', icon: '🔧', color: '#7C3AED', bg: '#EDE9FE', link: '/ops/assets' },
  { key: 'pendingMoveRequests', label: 'Pending Moves', icon: '🏠', color: '#0891B2', bg: '#CFFAFE', link: '/ops/move-requests' },
] as const;

export function OpsControlRoom() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<OpsControlRoomSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await communityOpsService.getControlRoomSummary();
      setSummary(data);
      setError(null);
    } catch {
      setError('Failed to load control room data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Loading control room…</div>;
  if (error) return <div style={{ padding: 32, color: '#DC2626' }}>{error}</div>;
  if (!summary) return null;

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Operations Control Room</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Auto-refreshes every 60 seconds</p>
        </div>
        <button
          onClick={load}
          style={{ padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {tiles.map(({ key, label, icon, color, bg, link }) => (
          <div
            key={key}
            onClick={() => navigate(link)}
            style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22, background: bg, borderRadius: 8, padding: '4px 8px' }}>{icon}</span>
              <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color }}>{(summary as any)[key] ?? 0}</div>
            <div style={{ fontSize: 12, color, marginTop: 4, fontWeight: 600 }}>View →</div>
          </div>
        ))}
      </div>

      {/* Live feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent parcels */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#111827' }}>📦 Recent Parcels</h3>
          {!summary.recentParcels?.length ? (
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No recent parcels</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#6B7280' }}>
                  <th style={{ textAlign: 'left', paddingBottom: 6 }}>Flat</th>
                  <th style={{ textAlign: 'left', paddingBottom: 6 }}>Sender</th>
                  <th style={{ textAlign: 'left', paddingBottom: 6 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentParcels.slice(0, 5).map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '6px 0', fontWeight: 600 }}>{p.flatNumber}</td>
                    <td style={{ padding: '6px 0', color: '#374151' }}>{p.senderName}</td>
                    <td style={{ padding: '6px 0' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: p.status === 'RECEIVED' ? '#FEF3C7' : '#D1FAE5', color: p.status === 'RECEIVED' ? '#92400E' : '#065F46' }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent passes */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#111827' }}>🎫 Recent Passes</h3>
          {!summary.recentPasses?.length ? (
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No recent passes</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#6B7280' }}>
                  <th style={{ textAlign: 'left', paddingBottom: 6 }}>Flat</th>
                  <th style={{ textAlign: 'left', paddingBottom: 6 }}>Visitor</th>
                  <th style={{ textAlign: 'left', paddingBottom: 6 }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentPasses.slice(0, 5).map(p => (
                  <tr key={p.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '6px 0', fontWeight: 600 }}>{p.flatNumber}</td>
                    <td style={{ padding: '6px 0', color: '#374151' }}>{p.visitorName}</td>
                    <td style={{ padding: '6px 0' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: '#DBEAFE', color: '#1E40AF' }}>
                        {p.passType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick links to full dashboards */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/ops/community-manager')}
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #6366F1', background: '#EEF2FF', color: '#4338CA', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          📊 Community Manager Dashboard
        </button>
        <button
          onClick={() => navigate('/ops/insights')}
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          💡 AI Insights
        </button>
        <button
          onClick={() => navigate('/ops/iot')}
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
        >
          🌡 IoT Sensors
        </button>
      </div>
    </div>
  );
}
