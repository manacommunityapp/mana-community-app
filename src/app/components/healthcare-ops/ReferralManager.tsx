import React, { useEffect, useState } from 'react';
import { healthcareOpsService, DoctorReferral, ReferralStatus } from '@/services/healthcare/healthcareOpsService';

const STATUS_STYLES: Record<ReferralStatus, string> = {
  ISSUED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-gray-200 text-gray-600',
};

const STEPS: ReferralStatus[] = ['ISSUED', 'ACCEPTED', 'COMPLETED'];

function StepIndicator({ status }: { status: ReferralStatus }) {
  const idx = STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 text-xs">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <span className={`px-2 py-0.5 rounded-full font-semibold ${i <= idx ? STATUS_STYLES[s] : 'bg-gray-100 text-gray-400'}`}>{s}</span>
          {i < STEPS.length - 1 && <span className="text-gray-300">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

export function ReferralManager() {
  const [referrals, setReferrals] = useState<DoctorReferral[]>([]);
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!patientId) return;
    setLoading(true);
    try { setReferrals(await healthcareOpsService.getReferralsForPatient(Number(patientId))); }
    finally { setLoading(false); }
  };

  const accept = async (id: number) => {
    await healthcareOpsService.acceptReferral(id);
    load();
  };

  const complete = async (id: number) => {
    await healthcareOpsService.completeReferral(id);
    load();
  };

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <input type="number" placeholder="Patient ID" value={patientId} onChange={e => setPatientId(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-32" />
        <button onClick={load} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Load Referrals</button>
      </div>

      {loading ? <p className="text-gray-500 text-sm">Loading…</p> : (
        <div className="space-y-3">
          {referrals.map(r => (
            <div key={r.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-sm">Dr #{r.referringDoctorId} → {r.specialty}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.reason}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Issued {r.referredAt?.slice(0,10)} · Expires {r.expiresAt?.slice(0,10)}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {r.status === 'ISSUED' && (
                    <button onClick={() => accept(r.id)} className="px-3 py-1 bg-purple-600 text-white rounded text-xs">Accept</button>
                  )}
                  {r.status === 'ACCEPTED' && (
                    <button onClick={() => complete(r.id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs">Complete</button>
                  )}
                </div>
              </div>
              <StepIndicator status={r.status} />
            </div>
          ))}
          {!patientId && <p className="text-gray-400 text-sm text-center py-6">Enter a patient ID to view referrals</p>}
          {patientId && referrals.length === 0 && !loading && <p className="text-gray-400 text-sm text-center py-6">No referrals found</p>}
        </div>
      )}
    </div>
  );
}
