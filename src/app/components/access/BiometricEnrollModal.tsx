import React, { useState } from "react";
import { X, ScanFace, ShieldAlert, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { apiClient } from "../../../services/common/apiClient";
import { turnstileService, type BiometricPersonType, type EnrollBiometricRequest } from "../../../services/access/turnstileService";

interface Props {
  communityId: number;
  currentUserId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const PERSON_TYPE_LABELS: Record<BiometricPersonType, string> = {
  RESIDENT: "Apartment Resident",
  DOMESTIC_STAFF: "Domestic Staff (Maid / Cook / Driver)",
  VENDOR_WORKER: "Contractor / Vendor Worker",
  SECURITY_GUARD: "Security Guard",
};

/**
 * DPDP Act 2023 s.6 — biometric enrolment modal.
 *
 * Flow:
 *  1. User fills enrolment form.
 *  2. User explicitly ticks the BIOMETRIC consent checkbox (unticked by default).
 *  3. On submit: POST /api/privacy/consents {purpose:"BIOMETRIC", granted:true}
 *     then POST /api/v1/access/turnstiles/enroll.
 *  4. Backend also enforces consent via ConsentGuard (defence in depth).
 *
 * [LEGAL REVIEW REQUIRED] Consent text and retention notice below.
 */
export const BiometricEnrollModal: React.FC<Props> = ({ communityId, currentUserId, onClose, onSuccess }) => {
  const [personName, setPersonName] = useState("");
  const [personType, setPersonType] = useState<BiometricPersonType>("RESIDENT");
  const [unitNumber, setUnitNumber] = useState("");
  const [faceEmbeddingHash, setFaceEmbeddingHash] = useState("");
  const [biometricConsent, setBiometricConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!biometricConsent) {
      setError("You must grant explicit consent for biometric data processing before enrolment.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save BIOMETRIC consent record (DPDP s.6)
      await apiClient.post("/api/privacy/consents", {
        purpose: "BIOMETRIC",
        granted: true,
        collectionPoint: "BIOMETRIC_ENROLMENT",
      });

      // 2. Enrol the person — backend ConsentGuard also verifies consent (defence in depth)
      const req: EnrollBiometricRequest = {
        userId: currentUserId,
        communityId,
        personType,
        personName: personName.trim(),
        unitNumber: unitNumber.trim() || undefined,
        faceEmbeddingHash: faceEmbeddingHash.trim(),
      };
      await turnstileService.enrollUser(req);
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1800);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Enrolment failed. Please try again.";
      if (msg.includes("CONSENT_REQUIRED") || err?.response?.status === 403) {
        setError("Consent not recorded. Please tick the consent checkbox and try again.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50">
          <div className="flex items-center gap-2">
            <ScanFace className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-base">Enrol Person for Biometric Access</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 px-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="font-bold text-slate-800 text-lg">Enrolment Successful</p>
            <p className="text-slate-500 text-sm">Biometric consent recorded and person enrolled.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* DPDP consent notice */}
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Biometric Data Notice</strong> — Under the DPDP Act 2023, biometric data (facial recognition
                templates) is sensitive personal data. Enrolment requires the subject's explicit, separate consent.
                Ensure the person is present and has agreed before proceeding.{" "}
                <span className="font-semibold text-amber-700">[LEGAL REVIEW REQUIRED]</span>
              </span>
            </div>

            {/* Person type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Person Type</label>
              <select
                value={personType}
                onChange={(e) => setPersonType(e.target.value as BiometricPersonType)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-500"
                required
              >
                {(Object.keys(PERSON_TYPE_LABELS) as BiometricPersonType[]).map((k) => (
                  <option key={k} value={k}>{PERSON_TYPE_LABELS[k]}</option>
                ))}
              </select>
            </div>

            {/* Person name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="e.g. Sunita Devi"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Unit number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit / Flat Number <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="e.g. B-201"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Face embedding hash */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Face Embedding Hash</label>
              <input
                type="text"
                value={faceEmbeddingHash}
                onChange={(e) => setFaceEmbeddingHash(e.target.value)}
                placeholder="Captured by edge device — paste hash here"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">In production this is captured automatically by the turnstile edge device.</p>
            </div>

            {/* DPDP s.6 explicit biometric consent checkbox */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={biometricConsent}
                  onChange={(e) => setBiometricConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-800">I confirm that the above person has given explicit, informed, and freely-given consent</strong>{" "}
                  for their biometric (facial recognition) data to be collected, stored, and processed by Mana Community
                  for the purpose of <strong>automated gate access control only</strong>.
                  This consent is recorded in accordance with the{" "}
                  <strong>Digital Personal Data Protection (DPDP) Act 2023, s.6</strong>.
                  Biometric data will be retained until enrolment is revoked or the person leaves the community.
                  {" "}<span className="text-amber-700 font-semibold">[LEGAL REVIEW REQUIRED]</span>
                </span>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !biometricConsent}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
                {submitting ? "Enrolling…" : "Enrol Person"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
