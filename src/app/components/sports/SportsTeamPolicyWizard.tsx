import { useState } from "react";
import { Link } from "react-router";
import {
  Users, ShieldCheck, ChevronRight, CheckCircle, AlertCircle,
  Loader2, Building2, Hash, Dumbbell, FileText, ExternalLink,
} from "lucide-react";
import { insuranceService } from "../../../services/insuranceService";
import { INSURANCE_NOTICE_VERSION } from "../../../constants/insurance";
import type { GroupEnquiryView } from "../../../types/insurance";

const SPORTS_LIST = [
  "Cricket", "Football", "Badminton", "Tennis", "Basketball",
  "Volleyball", "Kabaddi", "Hockey", "Athletics", "Swimming",
  "Table Tennis", "Squash", "Boxing", "Wrestling", "Cycling",
  "Other",
];

type Step = "form" | "consent" | "submitting" | "done" | "error";

interface FormState {
  teamName: string;
  sport: string;
  memberCount: string;
  coverType: "MONTHLY" | "ANNUAL";
  requirements: string;
}

const EMPTY_FORM: FormState = {
  teamName: "", sport: "", memberCount: "", coverType: "ANNUAL", requirements: "",
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{msg}</p>;
}

export function SportsTeamPolicyWizard() {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [result, setResult] = useState<GroupEnquiryView | null>(null);
  const [consentId, setConsentId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.teamName.trim()) e.teamName = "Team / club name is required";
    if (!form.sport) e.sport = "Select a sport";
    const n = parseInt(form.memberCount, 10);
    if (!form.memberCount || isNaN(n) || n < 2 || n > 500)
      e.memberCount = "Member count must be 2 to 500";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function grantConsent(): Promise<number | null> {
    try {
      const cv = await insuranceService.grantConsent("GROUP_ENQUIRY", INSURANCE_NOTICE_VERSION);
      return cv.id;
    } catch {
      return null;
    }
  }

  async function handleSubmit() {
    if (!validate()) return;
    setStep("consent");
  }

  async function confirmAndSubmit() {
    setStep("submitting");
    setErr(null);
    try {
      const cid = consentId ?? (await grantConsent());
      if (!cid) throw new Error("Could not record consent. Please try again.");
      setConsentId(cid);
      const res = await insuranceService.sportsGroupPolicyRequest({
        teamName: form.teamName.trim(),
        sport: form.sport,
        memberCount: parseInt(form.memberCount, 10),
        consentId: cid,
      });
      setResult(res);
      setStep("done");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setStep("error");
    }
  }

  if (step === "done" && result) {
    return (
      <div className="max-w-lg mx-auto text-center py-8 px-4 space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
          <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-base font-black text-slate-900 dark:text-white">Group Policy Enquiry Submitted!</h2>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Reference</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{result.enquiryRef}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Organisation</span>
            <span className="font-semibold">{result.organisationName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Status</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{result.status}</span>
          </div>
        </div>
        {result.notice && (
          <p className="text-[11px] text-slate-500 leading-relaxed bg-blue-50 dark:bg-blue-950/30 rounded-xl px-3 py-2">
            {result.notice}
          </p>
        )}
        <p className="text-xs text-slate-500">Our insurance partner will contact you within 2 business days to finalise the group policy.</p>
        <Link
          to="/insurance"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Go to Insurance Portal <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="max-w-lg mx-auto text-center py-8 px-4 space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-base font-black text-slate-900 dark:text-white">Submission Failed</h2>
        <p className="text-xs text-red-500">{err}</p>
        <button
          type="button"
          onClick={() => { setStep("form"); setErr(null); }}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 py-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">Team / Group Policy</h2>
          <p className="text-[11px] text-slate-500">One policy to cover your entire team or club</p>
        </div>
      </div>

      {/* Progress pills */}
      <div className="flex items-center gap-2">
        {(["Details", "Consent", "Done"] as const).map((label, i) => {
          const active = (step === "form" && i === 0) || (step === "consent" && i === 1) || (step === "submitting" && i === 1) || (step === "done" && i === 2);
          const done = (i === 0 && ["consent", "submitting", "done"].includes(step)) || (i === 1 && step === "done");
          return (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition ${done ? "bg-emerald-500 text-white" : active ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                {done ? <CheckCircle className="w-3 h-3" /> : i + 1}
              </div>
              <span className={`text-[10px] font-bold ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>{label}</span>
              {i < 2 && <ChevronRight className="w-3 h-3 text-slate-300" />}
            </div>
          );
        })}
      </div>

      {/* Step: Form */}
      {step === "form" && (
        <div className="space-y-4">
          {/* Team name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <Building2 className="w-3.5 h-3.5 inline mr-1" />Team / Club Name *
            </label>
            <input
              type="text"
              value={form.teamName}
              onChange={(e) => set("teamName", e.target.value)}
              placeholder="e.g. Mana Cricket Club"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <FieldError msg={errors.teamName} />
          </div>

          {/* Sport */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <Dumbbell className="w-3.5 h-3.5 inline mr-1" />Primary Sport *
            </label>
            <select
              value={form.sport}
              onChange={(e) => set("sport", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a sport…</option>
              {SPORTS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <FieldError msg={errors.sport} />
          </div>

          {/* Member count */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <Hash className="w-3.5 h-3.5 inline mr-1" />Number of Members (2 – 500) *
            </label>
            <input
              type="number"
              min={2}
              max={500}
              value={form.memberCount}
              onChange={(e) => set("memberCount", e.target.value)}
              placeholder="e.g. 15"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <FieldError msg={errors.memberCount} />
          </div>

          {/* Cover type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />Preferred Cover Duration
            </label>
            <div className="flex gap-2">
              {(["MONTHLY", "ANNUAL"] as const).map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => set("coverType", ct)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${form.coverType === ct ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300"}`}
                >
                  {ct === "MONTHLY" ? "Monthly" : "Annual (Best value)"}
                </button>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <FileText className="w-3.5 h-3.5 inline mr-1" />Additional Requirements (optional)
            </label>
            <textarea
              rows={3}
              value={form.requirements}
              onChange={(e) => set("requirements", e.target.value)}
              placeholder="e.g. Need to cover away tournaments, coaching staff, academy students…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Estimated cost */}
          {form.memberCount && !isNaN(parseInt(form.memberCount, 10)) && parseInt(form.memberCount, 10) >= 2 && (
            <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl px-4 py-3">
              <p className="text-[11px] text-violet-700 dark:text-violet-300 font-bold">Estimated indicative cost</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {form.coverType === "ANNUAL"
                  ? `₹${(parseInt(form.memberCount, 10) * 199).toLocaleString("en-IN")} /year (₹199/player/year)`
                  : `₹${(parseInt(form.memberCount, 10) * 60).toLocaleString("en-IN")} /month (₹60/player/month)`
                }
              </p>
              <p className="text-[9px] text-slate-400 mt-1">Final premium depends on insurer underwriting. This is an indicative estimate.</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black transition cursor-pointer"
          >
            Continue to Consent →
          </button>
        </div>
      )}

      {/* Step: Consent */}
      {step === "consent" && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-black text-amber-800 dark:text-amber-200">Before we proceed</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
              To process your group policy enquiry, we'll share your team details (name, sport, size) with our insurance partner. You'll be contacted within 2 business days to finalise the policy.
            </p>
            <ul className="text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" />Your data is used only for this insurance enquiry</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" />No automatic policy activation — you decide after the quote</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" />IRDAI-registered partners only</li>
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2 text-xs">
            <p className="font-bold text-slate-700 dark:text-slate-300">Summary</p>
            <div className="flex justify-between"><span className="text-slate-500">Team</span><span className="font-semibold">{form.teamName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Sport</span><span className="font-semibold">{form.sport}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Members</span><span className="font-semibold">{form.memberCount}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Cover</span><span className="font-semibold">{form.coverType}</span></div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={confirmAndSubmit}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition cursor-pointer"
            >
              I Agree & Submit
            </button>
          </div>
          <p className="text-[9px] text-slate-400 leading-relaxed text-center">
            Mana Community acts as a referral platform. Insurance products are offered by IRDAI-registered insurers. Premiums and cover depend on the insurer's underwriting and policy wording.
          </p>
        </div>
      )}

      {/* Step: Submitting */}
      {step === "submitting" && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Submitting your enquiry…</p>
          <p className="text-xs text-slate-400">This takes just a moment</p>
        </div>
      )}
    </div>
  );
}
