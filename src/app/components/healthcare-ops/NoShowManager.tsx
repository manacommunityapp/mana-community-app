import React, { useEffect, useState } from 'react';
import { healthcareOpsService, AppointmentNoShow, NoShowStatus } from '@/services/healthcare/healthcareOpsService';

const STATUS_COLORS: Record<NoShowStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED_NO_SHOW: 'bg-red-100 text-red-800',
  EXCUSED: 'bg-gray-100 text-gray-700',
  DISPUTED: 'bg-purple-100 text-purple-800',
};

export function NoShowManager() {
  const [records, setRecords] = useState<AppointmentNoShow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [fee, setFee] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<'confirm' | 'excuse' | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await healthcareOpsService.getNoShows({});
      setRecords(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const pending = records.filter(r => r.status === 'PENDING');
  const totalFees = records
    .filter(r => r.status === 'CONFIRMED_NO_SHOW' && !r.feeWaived)
    .reduce((s, r) => s + r.noShowFee, 0);

  const handleAction = async () => {
    if (!actionId) return;
    if (mode === 'confirm') await healthcareOpsService.confirmNoShow(actionId, Number(fee) || 0);
    else if (mode === 'excuse') await healthcareOpsService.excuseNoShow(actionId, reason);
    setActionId(null); setMode(null); setFee(''); setReason('');
    load();
  };

  return (
    <div className="p-4">
      <div className="flex gap-6 mb-4 text-sm">
        <span className="font-semibold">Pending: <span className="text-amber-600">{pending.length}</span></span>
        <span className="font-semibold">Forfeited fees this month: <span className="text-red-600">₹{totalFees.toLocaleString()}</span></span>
      </div>

      {loading ? <p className="text-gray-500">Loading…</p> : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 border-b">Appointment ID</th>
              <th className="p-3 border-b">Patient</th>
              <th className="p-3 border-b">Fee</th>
              <th className="p-3 border-b">Status</th>
              <th className="p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-3">#{r.appointmentId}</td>
                <td className="p-3">User #{r.patientUserId}</td>
                <td className="p-3">₹{r.noShowFee}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  {r.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => { setActionId(r.id); setMode('confirm'); }}
                        className="px-3 py-1 bg-red-500 text-white rounded text-xs"
                      >Confirm No-show</button>
                      <button
                        onClick={() => { setActionId(r.id); setMode('excuse'); }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                      >Excuse</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {actionId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-bold mb-4">{mode === 'confirm' ? 'Confirm No-show' : 'Excuse No-show'}</h3>
            {mode === 'confirm' ? (
              <input
                type="number"
                placeholder="No-show fee (₹)"
                value={fee}
                onChange={e => setFee(e.target.value)}
                className="w-full border rounded px-3 py-2 mb-4"
              />
            ) : (
              <textarea
                placeholder="Reason for excusing…"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full border rounded px-3 py-2 mb-4 h-24"
              />
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setActionId(null); setMode(null); }} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
              <button onClick={handleAction} className="px-4 py-2 bg-blue-600 text-white rounded">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
