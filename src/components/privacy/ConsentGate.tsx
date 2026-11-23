import { type ReactNode } from 'react';
import { ShieldCheck, Info, Loader2 } from 'lucide-react';
import { useConsent } from '../../hooks/useConsent';
import { type ConsentPurpose } from '../../services/privacy/privacyService';

const PURPOSE_LABELS: Record<ConsentPurpose, string> = {
  HEALTH_RECORDS: 'Health Records',
  CAREGIVER_ACCESS: 'Caregiver Access',
  ANALYTICS: 'Analytics',
  MARKETING: 'Marketing Communications',
  COMMUNITY_GRAPH: 'Community Graph',
  VENDOR_SHARING: 'Vendor Sharing',
};

const PURPOSE_DESCRIPTIONS: Partial<Record<ConsentPurpose, string>> = {
  HEALTH_RECORDS:
    'Mana will store and process your health records, prescriptions, lab results and medical appointments. Your data is never shared without explicit consent.',
  CAREGIVER_ACCESS:
    'You are granting a caregiver limited access to your health records. Only you can manage who has caregiver access.',
};

interface ConsentGateProps {
  purpose: ConsentPurpose;
  children: ReactNode;
  /** Override description shown in the consent prompt */
  description?: string;
}

export function ConsentGate({ purpose, children, description }: ConsentGateProps) {
  const { loading, hasConsent, grant } = useConsent();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasConsent(purpose)) return <>{children}</>;

  const label = PURPOSE_LABELS[purpose] ?? purpose;
  const desc =
    description ?? PURPOSE_DESCRIPTIONS[purpose] ?? `To use this feature, you must consent to the ${label} purpose.`;

  return (
    <div className="flex items-center justify-center min-h-[320px] p-6">
      <div className="max-w-sm w-full bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4 text-center">
        <div className="flex justify-center">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-2xl">
            <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Consent Required</h2>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3 text-left">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{desc}</p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Under the Digital Personal Data Protection Act, 2023, you have the right to withdraw this consent at any time
          from your Privacy Centre.
        </p>
        <button
          onClick={() => grant(purpose)}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer border-none"
        >
          I Consent & Continue
        </button>
      </div>
    </div>
  );
}
