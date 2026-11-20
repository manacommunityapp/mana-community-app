import React, { useEffect, useState } from 'react';
import { healthcareOpsService, UtilizationSummary } from '@/services/healthcare/healthcareOpsService';
import { getStoredUser } from '@/services/common/apiClient';

function today() { return new Date().toISOString().split('T')[0]; }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }

export function SlotUtilizationReport() {
  const [summary, setSummary] = useState<UtilizationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const user = getStoredUser();
  const communityId = user?.communityId ?? 0;

  const load = async () => {
    if (!communityId) return;
    setLoading(true); setError('');
    try {
      const data = await healthcareOpsService.getUtilizationSummary(communityId, daysAgo(28), today());
      setSummary(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [communityId]);

  if (loading) return <p className="p-4 text-gray-500">Loading…</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!summary) return null;

  const kpis = [
    { label: 'Total Slots', value: summary.totalSlots, color: 'text-gray-800' },
    { label: 'Booked', value: summary.bookedSlots, color: 'text-blue-700' },
    { label: 'Attended', value: summary.attendedSlots, color: 'text-green-700' },
    { label: 'No-shows', value: summary.noShowSlots, color: 'text-red-600' },
    { label: 'Cancelled', value: summary.cancelledSlots, color: 'text-amber-600' },
    { label: 'Utilisation', value: `${summary.utilizationPct.toFixed(1)}%`, color: summary.utilizationPct >= 70 ? 'text-green-700' : 'text-amber-600' },
  ];

  const maxBooked = Math.max(...(summary.byWeek ?? []).map(w => w.bookedSlots), 1);

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-white border rounded-lg p-3 text-center shadow-sm">
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-gray-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {summary.byWeek && summary.byWeek.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3 text-gray-700">Weekly Breakdown (last 4 weeks)</h3>
          <svg viewBox={`0 0 ${summary.byWeek.length * 80} 160`} className="w-full max-w-2xl" aria-label="Weekly utilization chart">
            {summary.byWeek.map((w, i) => {
              const x = i * 80 + 10;
              const attended = Math.round((w.attendedSlots / maxBooked) * 120);
              const noshow = Math.round((w.noShowSlots / maxBooked) * 120);
              const cancelled = Math.round((w.cancelledSlots / maxBooked) * 120);
              const baseY = 140;
              return (
                <g key={w.id}>
                  <rect x={x} y={baseY - attended} width={20} height={attended} fill="#22c55e" rx={2} />
                  <rect x={x + 22} y={baseY - noshow} width={20} height={noshow} fill="#ef4444" rx={2} />
                  <rect x={x + 44} y={baseY - cancelled} width={20} height={cancelled} fill="#f59e0b" rx={2} />
                  <text x={x + 30} y={155} textAnchor="middle" fontSize={9} fill="#6b7280">
                    {w.slotDate.slice(5)}
                  </text>
                </g>
              );
            })}
            <line x1="0" y1="140" x2={summary.byWeek.length * 80} y2="140" stroke="#e5e7eb" strokeWidth={1} />
          </svg>
          <div className="flex gap-4 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" />Attended</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" />No-show</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" />Cancelled</span>
          </div>
        </div>
      )}
    </div>
  );
}
