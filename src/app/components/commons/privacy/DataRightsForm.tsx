import React, { useState } from "react";
import { FileText, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { apiClient } from "../../../../services/common/apiClient";

const RIGHT_TYPES = [
  {
    value: "ACCESS",
    label: "Right to Information (Access)",
    description: "Request a copy of all personal data we hold about you.",
  },
  {
    value: "CORRECTION",
    label: "Right to Correction",
    description: "Request correction of inaccurate or outdated personal data.",
  },
  {
    value: "ERASURE",
    label: "Right to Erasure / Deletion",
    description: "Request deletion of your personal data (subject to lawful retention requirements).",
  },
  {
    value: "PORTABILITY",
    label: "Right to Data Portability",
    description: "Request your data in a machine-readable format for transfer to another service.",
  },
  {
    value: "NOMINATION",
    label: "Right to Nominate",
    description: "Nominate a person to exercise your data rights in the event of death or incapacity. [LEGAL REVIEW REQUIRED]",
  },
  {
    value: "GRIEVANCE",
    label: "Lodge a Grievance",
    description: "File a complaint about how your personal data has been handled.",
  },
];

/**
 * DPDP Act 2023, s.12–13 — data-rights request form.
 * Submit to POST /api/privacy/data-rights.
 */
export function DataRightsForm() {
  const [rightType, setRightType] = useState("");
  const [description, setDescription] = useState("");
  const [correctionDetails, setCorrectionDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: number; dueBy: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rightType) {
      setError("Please select a right type.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.post("/api/privacy/data-rights", {
        rightType,
        description,
        correctionDetails: rightType === "CORRECTION" ? correctionDetails : undefined,
      });
      setSubmitted({ id: res.data.id, dueBy: res.data.dueBy });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        <h3 className="text-base font-extrabold text-foreground">Request Submitted</h3>
        <p className="text-sm text-muted-foreground">
          Your data-rights request <strong>#{submitted.id}</strong> has been received.
          We will respond within <strong>30 days</strong> (by {new Date(submitted.dueBy).toLocaleDateString("en-IN")})
          as required by the DPDP Act 2023.
        </p>
        <button
          type="button"
          onClick={() => { setSubmitted(null); setRightType(""); setDescription(""); setCorrectionDetails(""); }}
          className="mt-1 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-foreground">Exercise Your Data Rights</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            DPDP Act 2023 (s.11–14) — We will respond within 30 days.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-foreground mb-2">
            Select a Right <span className="text-destructive">*</span>
          </label>
          <div className="space-y-2">
            {RIGHT_TYPES.map((rt) => (
              <label key={rt.value} className="flex items-start gap-3 p-3 rounded-xl border border-border cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all group">
                <input
                  type="radio"
                  name="rightType"
                  value={rt.value}
                  checked={rightType === rt.value}
                  onChange={() => setRightType(rt.value)}
                  className="mt-0.5 accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {rt.label}
                    {rt.description.includes("[LEGAL REVIEW]") && (
                      <span className="ml-1.5 text-[10px] font-normal text-amber-600 dark:text-amber-400">[LEGAL REVIEW REQUIRED]</span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {rt.description.replace(" [LEGAL REVIEW REQUIRED]", "")}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {rightType === "CORRECTION" && (
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              What needs to be corrected? <span className="text-destructive">*</span>
            </label>
            <textarea
              value={correctionDetails}
              onChange={(e) => setCorrectionDetails(e.target.value)}
              rows={3}
              placeholder="e.g. My phone number is incorrect. Current: 98765XXXXX. Correct: 91234XXXXX"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            Additional Details
            {rightType !== "CORRECTION" && <span className="font-normal text-muted-foreground"> (optional)</span>}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Provide any additional context or information to help us process your request..."
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={submitting || !rightType}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-muted-foreground">
            We will acknowledge your request within 72 hours and respond within 30 days per DPDP Act 2023 s.13.
          </p>
        </div>
      </form>
    </div>
  );
}
