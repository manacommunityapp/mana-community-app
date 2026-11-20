import { useState } from 'react';
import communityOpsService, { MonthlyReport } from '@/services/communityOps/communityOpsService';

export function RwaReports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true); setError(null);
    try {
      const data = await communityOpsService.getMonthlyReport(year, month);
      setReport(data);
    } catch {
      setError('Failed to load report. Please try again.');
    } finally { setLoading(false); }
  };

  const monthName = (m: number) => new Date(2000, m - 1).toLocaleString('default', { month: 'long' });

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>RWA Monthly Reports</h1>
        {report && (
          <button onClick={() => window.print()}
            style={{ padding: '9px 18px', background: '#374151', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            🖨 Print / Export PDF
          </button>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Month</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#fff' }}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{monthName(i + 1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Year</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#fff' }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={loadReport} disabled={loading}
          style={{ padding: '9px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          {loading ? 'Loading…' : 'Load Report'}
        </button>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#FEE2E2', color: '#DC2626', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {report && (
        <div id="report-content">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 24 }}>
            Report: {monthName(report.month)} {report.year}
          </h2>

          {/* Staff Attendance Summary */}
          <Section title="👷 Staff Attendance Summary">
            <KpiRow items={[
              { label: 'Total Staff', value: report.attendance.totalStaff },
              { label: 'Avg Daily Present', value: report.attendance.avgPresent.toFixed(1) },
              { label: 'Leave Days Taken', value: report.attendance.leaveDays },
              { label: 'Avg Attendance %', value: `${report.attendance.totalStaff > 0 ? Math.round((report.attendance.avgPresent / report.attendance.totalStaff) * 100) : 0}%` },
            ]} />
          </Section>

          {/* Parcel Activity */}
          <Section title="📦 Parcel Activity">
            <KpiRow items={[
              { label: 'Received', value: report.parcels.received },
              { label: 'Picked Up', value: report.parcels.pickedUp },
              { label: 'Returned', value: report.parcels.returned, highlight: report.parcels.returned > 0 },
              { label: 'Lost', value: report.parcels.lost, highlight: report.parcels.lost > 0 },
            ]} />
          </Section>

          {/* Move Requests Summary */}
          <Section title="🏠 Move Requests">
            <KpiRow items={[
              { label: 'Move-ins', value: report.moveRequests.moveIn },
              { label: 'Move-outs', value: report.moveRequests.moveOut },
              { label: 'Completed', value: report.moveRequests.completed },
              { label: 'Pending', value: report.moveRequests.pending, highlight: report.moveRequests.pending > 0 },
            ]} />
          </Section>

          {/* Asset Maintenance Summary */}
          <Section title="🔧 Asset Maintenance">
            <KpiRow items={[
              { label: 'Tasks Completed', value: report.assetMaintenance.tasksCompleted },
              { label: 'Overdue Tasks', value: report.assetMaintenance.overdueTasks, highlight: report.assetMaintenance.overdueTasks > 0 },
              { label: 'Total Cost', value: `₹${report.assetMaintenance.totalCost.toLocaleString()}` },
            ]} />
          </Section>
        </div>
      )}

      {!report && !loading && (
        <p style={{ color: '#9CA3AF', fontSize: 14 }}>Select a month and year, then click Load Report.</p>
      )}

      <style>{`
        @media print {
          body > *:not(#root) { display: none; }
          #report-content { display: block !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827' }}>{title}</h3>
      {children}
    </div>
  );
}

function KpiRow({ items }: { items: { label: string; value: string | number; highlight?: boolean }[] }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {items.map(({ label, value, highlight }) => (
        <div key={label} style={{ flex: '1 1 140px', background: highlight ? '#FFF5F5' : '#F9FAFB', borderRadius: 10, padding: '14px 16px', border: `1px solid ${highlight ? '#FCA5A5' : '#F3F4F6'}` }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: highlight ? '#DC2626' : '#111827' }}>{value}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
