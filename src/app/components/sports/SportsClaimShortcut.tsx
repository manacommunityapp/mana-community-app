import { useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle, ShieldCheck, ChevronRight, X, Loader2,
  CheckCircle, Phone, FileText, Activity,
} from "lucide-react";
import { insuranceService } from "../../../services/insuranceService";
import type { ClaimCaseView } from "../../../types/insurance";

type ClaimType = "SPORTS_INJURY" | "EVENT_LIABILITY" | "GROUP_CLAIM";

const CLAIM_TYPES: { key: ClaimType; label: string; desc: string; icon: typeof Activity }[] = [
  { key: "SPORTS_INJURY",    label: "Sports Injury",        desc: "Fracture, ligament, concussion, or other injury during play", icon: Activity     },
  { key: "EVENT_LIABILITY",  label: "Event Liability",      desc: "Spectator injury or property damage at a tournament",         icon: ShieldCheck  },
  { key: "GROUP_CLAIM",      label: "Team / Group Claim",   desc: "Claim on behalf of a team member under a group policy",       icon: FileText     },
];

interface Props {
  policyId?: number;
  contextLabel?: string;
  onClose?: () => void;
}

type Step = "pick" | "describe" | "submitting" | "done" | "error";

export function SportsClaimShortcut({ policyId, contextLabel, onClose }: Props) {
  const [step, setStep] = useState<Step>("pick");
  const [claimType, setClaimType] = useState<ClaimType | null>(null);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<ClaimCaseView | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!claimType) return;
    setStep("submitting");
    setErr(null);
    try {
      const res = await insuranceService.createClaimCase({
        policyId,
        claimType,
        description: description.trim() || undefined,
      });
      setResult(res);
      setStep("done");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to open claim. Please try again.");
      setStep("error");
    }
  }

  if (step === "done" && result) {
    return (
      <div className="text-center py-6 space-y-3 px-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="text-sm font-black text-slate-900 dark:text-white">Claim Case Opened</p>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-left space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Case Ref</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{result.caseRef}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Type</span>
            <span className="font-semibold">{result.claimType}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Status</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{result.assistanceStatus}</span>
          </div>
        </div>
        {result.notice && (
          <p className="text-[11px] text-slate-500 leading-relaxed">{result.notice}</p>
        )}
        <div className="flex flex-col gap-2 pt-1">
          <Link
            to="/insurance?tab=claims"
            className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            View Claim in Insurance Portal <ChevronRight className="w-3 h-3" />
          </Link>
          {onClose && (
            <button type="button" onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {contextLabel ? `Claim — ${contextLabel}` : "File a Sports Claim"}
          </p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Emergency note */}
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
        <Phone className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
        <p className="text-[10px] text-red-600 dark:text-red-400">
          <strong>Medical emergency?</strong> Call 108 (ambulance) first. File the claim after.
        </p>
      </div>

      {/* Step: pick claim type */}
      {step === "pick" && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">What happened?</p>
          {CLAIM_TYPES.map((ct) => {
            const Icon = ct.icon;
            return (
              <button
                key={ct.key}
                type="button"
                onClick={() => { setClaimType(ct.key); setStep("describe"); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{ct.label}</p>
                  <p className="text-[10px] text-slate-500 leading-snug">{ct.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-auto" />
              </button>
            );
          })}
          <p className="text-[9px] text-slate-400 text-center pt-1">
            Claims assistance is provided by our partner insurers.{" "}
            <Link to="/insurance" className="underline">View your policies</Link>
          </p>
        </div>
      )}

      {/* Step: describe */}
      {step === "describe" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setStep("pick")}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            ← Change claim type
          </button>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Briefly describe what happened (optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Injured knee during a match on 7 Nov, went to Manipal Hospital…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-black transition cursor-pointer"
          >
            Open Claim Case →
          </button>
          <p className="text-[9px] text-slate-400 leading-relaxed text-center">
            Our claims assistance team will follow up within 24h with next steps and document requirements.
          </p>
        </div>
      )}

      {/* Step: submitting */}
      {step === "submitting" && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Opening claim case…</p>
        </div>
      )}

      {/* Step: error */}
      {step === "error" && (
        <div className="text-center py-4 space-y-2">
          <p className="text-xs text-red-500">{err}</p>
          <button
            type="button"
            onClick={() => { setStep("describe"); setErr(null); }}
            className="text-xs font-bold text-indigo-600 cursor-pointer hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
