import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { useConsent } from '../../../hooks/useConsent';
import { type ConsentPurpose } from '../../../services/privacy/privacyService';

const PURPOSES: { id: ConsentPurpose; label: string; description: string; sensitive?: boolean }[] = [
  {
    id: 'HEALTH_RECORDS',
    label: 'Health Records',
    description: 'Store and process prescriptions, lab results, appointments and medical history.',
    sensitive: true,
  },
  {
    id: 'CAREGIVER_ACCESS',
    label: 'Caregiver Access',
    description: 'Allow a designated caregiver to view your health records. Only you can add or remove caregivers.',
    sensitive: true,
  },
  {
    id: 'ANALYTICS',
    label: 'Analytics & Product Improvement',
    description: 'Help improve Mana by sharing anonymised usage patterns.',
  },
  {
    id: 'MARKETING',
    label: 'Marketing Communications',
    description: 'Receive personalised offers and event announcements from the community.',
  },
  {
    id: 'COMMUNITY_GRAPH',
    label: 'Community Graph',
    description: 'Allow your connections and activity to improve community discovery and recommendations.',
  },
  {
    id: 'VENDOR_SHARING',
    label: 'Vendor Data Sharing',
    description: 'Share relevant profile data with verified service vendors for booking and fulfilment.',
  },
];

export function ConsentManager() {
  const { consents, loading, hasConsent, grant, revoke, refresh } = useConsent();
  const [busy, setBusy] = useState<ConsentPurpose | null>(null);

  const toggle = async (purpose: ConsentPurpose) => {
    setBusy(purpose);
    try {
      if (hasConsent(purpose)) {
        await revoke(purpose);
      } else {
        await grant(purpose);
      }
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">Purpose-Specific Consent</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Under the Digital Personal Data Protection Act, 2023 — each purpose is independently managed.
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground cursor-pointer bg-transparent border-none"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
        {PURPOSES.map(({ id, label, description, sensitive }) => {
          const granted = hasConsent(id);
          const isBusy = busy === id;
          const record = consents.find((c) => c.purpose === id);

          return (
            <div key={id} className="flex items-start gap-3 p-4 bg-card hover:bg-accent/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  {sensitive && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold rounded-full">
                      Sensitive
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                {record?.grantedAt && granted && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                    Consented {new Date(record.grantedAt).toLocaleDateString()}
                    {record.noticeVersion && ` · Notice v${record.noticeVersion}`}
                  </p>
                )}
                {record?.revokedAt && !granted && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Revoked {new Date(record.revokedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <button
                onClick={() => toggle(id)}
                disabled={isBusy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border shrink-0 ${
                  granted
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-950/50'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
                } disabled:opacity-60`}
              >
                {isBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : granted ? (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    Revoke
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Consent
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl">
        <ChevronRight className="w-4 h-4 text-blue-500 shrink-0" />
        <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
          Withdrawing consent does not affect the lawfulness of data processing that occurred before withdrawal.
          Health data processed under your consent is retained as required by applicable medical records law.
        </p>
      </div>
    </div>
  );
}
