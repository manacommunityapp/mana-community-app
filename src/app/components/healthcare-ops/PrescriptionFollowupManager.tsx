import React, { useEffect, useState } from 'react';
import { healthcareOpsService, PrescriptionFollowup, FollowupStatus } from '@/services/healthcare/healthcareOpsService';
import { getStoredUser } from '@/services/common/apiClient';

const STATUS_STYLES: Record<FollowupStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  MISSED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

function todayStr() { return new Date().toISOString().split('T')[0]; }

export function PrescriptionFollowupManager() {
  const [followups, setFollowups] = useState<PrescriptionFollowup[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [completeId, setCompleteId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const user = getStoredUser();
  const communityId = user?.communityId ?? 0;

  const load = async () => {
    if (!communityId) return;
    setLoading(true);
    try {
      const data = await healthcareOpsService.getFollowups(communityId, date);
      setFollowups(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [communityId, date]);

  const complete = async () => {
    if (!completeId) return;
    await healthcareOpsService.completeFollowup(completeId, notes);
    setCompleteId(null); setNotes('');
    load();
  };

  const scheduled = followups.filter(f => f.status === 'SCHEDULED');
  const missed = followups.filter(f => f.status === 'MISSED');

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-gray-600">Date:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm" />
        <span className="text-sm text-blue-600 font-semibold">{scheduled.length} scheduled</span>
        <span className="text-sm text-red-500 font-semibold">{missed.length} missed</span>
      </div>

      {loading ? <p className="text-gray-500 text-sm">Loading…</p> : (
        <div className="space-y-2">
          {followups.map(f => (
            <div key={f.id} className={`flex items-center gap-4 p-3 rounded-lg border ${f.status === 'MISSED' ? 'border-red-200 bg-red-50' : 'bg-white'}`}>
              <div className="flex-1">
                <div className="text-sm font-medium">Patient #{f.patientUserId} · Dr #{f.doctorId}</div>
                <div className="text-xs text-gray-500">Prescription #{f.prescriptionId} · {f.followupDate}</div>
                {f.followupNotes && <div className="text-xs text-gray-600 mt-1 italic">{f.followupNotes}</div>}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[f.status]}`}>
                {f.status}
              </span>
              {f.status === 'SCHEDULED' && (
                <button onClick={() => setCompleteId(f.id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs">
                  Mark Done
                </button>
              )}
            </div>
          ))}
          {followups.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No follow-ups for this date</p>}
        </div>
      )}

      {completeId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="font-bold mb-3">Complete Follow-up</h3>
            <textarea placeholder="Clinical notes (optional)…" value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2 h-24 text-sm mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCompleteId(null)} className="px-4 py-2 bg-gray-100 rounded text-sm">Cancel</button>
              <button onClick={complete} className="px-4 py-2 bg-green-600 text-white rounded text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
