import { useState, useEffect } from 'react';
import communityOpsService, { StaffAttendanceDto, LeaveRequestDto, AttendanceStatus } from '@/services/communityOps/communityOpsService';

type Tab = 'today' | 'report' | 'leaves';

const statusColors: Record<AttendanceStatus, { bg: string; color: string }> = {
  PRESENT: { bg: '#D1FAE5', color: '#065F46' },
  ABSENT: { bg: '#FEE2E2', color: '#991B1B' },
  HALF_DAY: { bg: '#FEF3C7', color: '#92400E' },
  ON_LEAVE: { bg: '#F3F4F6', color: '#374151' },
};

export function StaffAttendance() {
  const [tab, setTab] = useState<Tab>('today');
  const [attendance, setAttendance] = useState<StaffAttendanceDto[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequestDto[]>([]);
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportData, setReportData] = useState<StaffAttendanceDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'today') {
      setLoading(true);
      communityOpsService.getTodayAttendance().then(setAttendance).catch(console.error).finally(() => setLoading(false));
    } else if (tab === 'leaves') {
      communityOpsService.getPendingLeaves().then(setLeaves).catch(console.error);
    }
  }, [tab]);

  const loadReport = async () => {
    if (!reportFrom || !reportTo) return;
    setLoading(true);
    try {
      const data = await communityOpsService.getAttendanceReport(reportFrom, reportTo);
      setReportData(data);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  const downloadCsv = () => {
    const headers = 'Staff Name,Role,Shift,Date,Clock In,Clock Out,Status';
    const rows = reportData.map(r =>
      `"${r.staffName}","${r.role}","${r.shift}","${r.date}","${r.clockIn ?? ''}","${r.clockOut ?? ''}","${r.status}"`
    );
    const csv = [headers, ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `attendance-${reportFrom}-to-${reportTo}.csv`;
    a.click();
  };

  const handleReviewLeave = async (id: number, approved: boolean) => {
    await communityOpsService.reviewLeave(id, approved);
    setLeaves(prev => prev.filter(l => l.id !== id));
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'today', label: "Today's Attendance" },
    { id: 'report', label: 'Attendance Report' },
    { id: 'leaves', label: 'Leave Requests' },
  ];

  return (
    <div style={{ padding: '24px 32px' }}>
      <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#111827' }}>Staff Attendance</h1>
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #E5E7EB', marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? '#2563EB' : '#6B7280', borderBottom: tab === t.id ? '2px solid #2563EB' : '2px solid transparent', marginBottom: -2 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <div>
          {loading ? <p style={{ color: '#9CA3AF' }}>Loading…</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead style={{ background: '#F9FAFB' }}>
                <tr>{['Staff Name', 'Role', 'Shift', 'Clock In', 'Clock Out', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9CA3AF' }}>No attendance records for today</td></tr>
                ) : attendance.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111827' }}>{r.staffName}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.role}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.shift}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.clockIn ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.clockOut ?? '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, ...statusColors[r.status] }}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'report' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>From</label>
              <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>To</label>
              <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14 }} />
            </div>
            <button onClick={loadReport}
              style={{ padding: '9px 20px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              Load Report
            </button>
            {reportData.length > 0 && (
              <button onClick={downloadCsv}
                style={{ padding: '9px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                ⬇ Download CSV
              </button>
            )}
          </div>
          {loading ? <p style={{ color: '#9CA3AF' }}>Loading…</p> : reportData.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead style={{ background: '#F9FAFB' }}>
                <tr>{['Staff Name', 'Date', 'Shift', 'Clock In', 'Clock Out', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {reportData.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.staffName}</td>
                    <td style={{ padding: '10px 12px' }}>{r.date}</td>
                    <td style={{ padding: '10px 12px' }}>{r.shift}</td>
                    <td style={{ padding: '10px 12px' }}>{r.clockIn ?? '—'}</td>
                    <td style={{ padding: '10px 12px' }}>{r.clockOut ?? '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, ...statusColors[r.status] }}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ color: '#9CA3AF' }}>Select a date range and click Load Report</p>}
        </div>
      )}

      {tab === 'leaves' && (
        <div>
          {leaves.length === 0 ? (
            <p style={{ color: '#9CA3AF' }}>No pending leave requests</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead style={{ background: '#F9FAFB' }}>
                <tr>{['Staff', 'From', 'To', 'Reason', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6B7280', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{l.staffName}</td>
                    <td style={{ padding: '10px 12px' }}>{l.fromDate}</td>
                    <td style={{ padding: '10px 12px' }}>{l.toDate}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{l.reason}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button onClick={() => handleReviewLeave(l.id, true)}
                        style={{ padding: '5px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 8 }}>
                        Approve
                      </button>
                      <button onClick={() => handleReviewLeave(l.id, false)}
                        style={{ padding: '5px 12px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
