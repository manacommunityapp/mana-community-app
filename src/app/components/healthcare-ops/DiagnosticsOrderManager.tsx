import React, { useEffect, useState } from 'react';
import { healthcareOpsService, DiagnosticsOrder, DiagnosticsStatus } from '@/services/healthcare/healthcareOpsService';
import { getStoredUser } from '@/services/common/apiClient';

const STATUS_STYLES: Record<DiagnosticsStatus, string> = {
  ORDERED: 'bg-blue-100 text-blue-800',
  SAMPLE_COLLECTED: 'bg-purple-100 text-purple-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  RESULTS_READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-gray-100 text-gray-700',
  DELAYED: 'bg-red-100 text-red-800',
};

const STATUS_FLOW: DiagnosticsStatus[] = ['ORDERED','SAMPLE_COLLECTED','IN_PROGRESS','RESULTS_READY','DELIVERED'];

export function DiagnosticsOrderManager() {
  const [breached, setBreached] = useState<DiagnosticsOrder[]>([]);
  const [patientOrders, setPatientOrders] = useState<DiagnosticsOrder[]>([]);
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [updateId, setUpdateId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<DiagnosticsStatus>('IN_PROGRESS');
  const [resultsUrl, setResultsUrl] = useState('');
  const user = getStoredUser();
  const communityId = user?.communityId ?? 0;

  const loadBreached = async () => {
    if (!communityId) return;
    setLoading(true);
    try { setBreached(await healthcareOpsService.getBreachedDiagnostics(communityId)); }
    finally { setLoading(false); }
  };

  const loadPatient = async () => {
    if (!patientId) return;
    setLoading(true);
    try { setPatientOrders(await healthcareOpsService.getDiagnosticsForPatient(Number(patientId))); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBreached(); }, [communityId]);

  const applyUpdate = async () => {
    if (!updateId) return;
    await healthcareOpsService.updateDiagnosticsStatus(updateId, newStatus, resultsUrl || undefined);
    setUpdateId(null); setResultsUrl('');
    loadBreached();
    if (patientId) loadPatient();
  };

  const renderRow = (o: DiagnosticsOrder) => (
    <tr key={o.id} className={`border-b hover:bg-gray-50 ${o.slaBreached ? 'bg-red-50' : ''}`}>
      <td className="p-3">#{o.id}</td>
      <td className="p-3">Patient #{o.patientUserId}</td>
      <td className="p-3 text-xs">{o.testNames}</td>
      <td className="p-3 text-xs">{o.partnerName}</td>
      <td className="p-3 text-xs">{o.expectedAt?.replace('T', ' ').slice(0,16)}</td>
      <td className="p-3">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[o.status]}`}>
          {o.status.replace('_', ' ')}
        </span>
        {o.slaBreached && <span className="ml-1 text-xs text-red-600 font-bold">SLA!</span>}
      </td>
      <td className="p-3">
        <button onClick={() => { setUpdateId(o.id); setNewStatus(o.status); }}
          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Update</button>
      </td>
    </tr>
  );

  const display = patientOrders.length > 0 ? patientOrders : breached;

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <input type="number" placeholder="Patient ID" value={patientId} onChange={e => setPatientId(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-32" />
        <button onClick={loadPatient} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Load Patient</button>
        <button onClick={() => { setPatientOrders([]); loadBreached(); }} className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm">SLA Breaches</button>
        {breached.length > 0 && <span className="text-xs text-red-600 font-semibold self-center">{breached.length} SLA breach{breached.length > 1 ? 'es' : ''}</span>}
      </div>

      {loading ? <p className="text-gray-500 text-sm">Loading…</p> : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 border-b">ID</th>
              <th className="p-3 border-b">Patient</th>
              <th className="p-3 border-b">Tests</th>
              <th className="p-3 border-b">Partner</th>
              <th className="p-3 border-b">Expected</th>
              <th className="p-3 border-b">Status</th>
              <th className="p-3 border-b"></th>
            </tr>
          </thead>
          <tbody>
            {display.map(renderRow)}
            {display.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-gray-400">No orders</td></tr>}
          </tbody>
        </table>
      )}

      {updateId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-bold mb-3">Update Diagnostics Order #{updateId}</h3>
            <label className="text-xs text-gray-500 block mb-1">New status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value as DiagnosticsStatus)}
              className="w-full border rounded px-3 py-2 text-sm mb-3">
              {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            {newStatus === 'RESULTS_READY' && (
              <input placeholder="Results URL (optional)" value={resultsUrl} onChange={e => setResultsUrl(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm mb-3" />
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setUpdateId(null)} className="px-4 py-2 bg-gray-100 rounded text-sm">Cancel</button>
              <button onClick={applyUpdate} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
