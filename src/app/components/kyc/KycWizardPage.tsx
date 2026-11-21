import { useState, useEffect } from "react";
import { ShieldCheck, Phone, Upload, CheckCircle2, XCircle, Loader2, Copy, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { kycService, type KycRequest, type KycStatus } from "../../../services/kycService";

type WizardStep = "status" | "choose" | "aadhaar_input" | "aadhaar_otp" | "document" | "result";

function sha256Hex(str: string): Promise<string> {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(str))
    .then((buf) =>
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
}

function StatusBadge({ status }: { status: KycStatus }) {
  const map: Record<KycStatus, { label: string; cls: string }> = {
    VERIFIED: { label: "Verified", cls: "bg-green-100 text-green-700" },
    PENDING: { label: "Pending Review", cls: "bg-yellow-100 text-yellow-700" },
    OTP_SENT: { label: "OTP Sent", cls: "bg-blue-100 text-blue-700" },
    REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700" },
    EXPIRED: { label: "Expired", cls: "bg-slate-100 text-slate-600" },
  };
  const { label, cls } = map[status];
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
}

export function KycWizardPage() {
  const [step, setStep] = useState<WizardStep>("status");
  const [current, setCurrent] = useState<KycRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [idType, setIdType] = useState("PASSPORT");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    kycService.getMyStatus().then((r) => { setCurrent(r); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function handleSendOtp() {
    if (aadhaar.replace(/\s/g, "").length !== 12) { toast.error("Enter a valid 12-digit Aadhaar number"); return; }
    setBusy(true);
    try {
      const hash = await sha256Hex(aadhaar.replace(/\s/g, ""));
      const r = await kycService.initiateAadhaarOtp(hash);
      setCurrent(r);
      setStep("aadhaar_otp");
      toast.success("OTP sent to your Aadhaar-linked mobile number");
    } catch { toast.error("Failed to send OTP"); }
    setBusy(false);
  }

  async function handleVerifyOtp() {
    if (!current) return;
    setBusy(true);
    try {
      const r = await kycService.verifyOtp(current.id, otp);
      setCurrent(r);
      setStep("result");
    } catch { toast.error("OTP verification failed — please check the code"); }
    setBusy(false);
  }

  async function handleDocumentUpload() {
    if (!file) { toast.error("Please select a file"); return; }
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("idType", idType);
    try {
      const r = await kycService.uploadDocument(fd);
      setCurrent(r);
      setStep("result");
    } catch { toast.error("Upload failed — please try again"); }
    setBusy(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-7 h-7 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-800">Identity Verification (KYC)</h1>
      </div>

      {/* Step: Status */}
      {step === "status" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          {current ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Current status</span>
                <StatusBadge status={current.status} />
              </div>
              {current.verifiedAt && (
                <p className="text-sm text-slate-500">Verified on {new Date(current.verifiedAt).toLocaleDateString("en-IN")}</p>
              )}
              {current.expiresAt && (
                <p className="text-sm text-slate-500">Expires on {new Date(current.expiresAt).toLocaleDateString("en-IN")}</p>
              )}
              {current.rejectionReason && (
                <div className="flex gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {current.rejectionReason}
                </div>
              )}
              {(current.status === "REJECTED" || current.status === "EXPIRED") && (
                <button onClick={() => setStep("choose")} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                  Reverify
                </button>
              )}
            </>
          ) : (
            <>
              <p className="text-slate-600 text-sm">Your identity has not been verified yet. Verifying helps the community trust you and unlocks features like service bookings and marketplace listings.</p>
              <button onClick={() => setStep("choose")} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                Verify My Identity
              </button>
            </>
          )}
        </div>
      )}

      {/* Step: Choose method */}
      {step === "choose" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 font-medium">Choose verification method</p>
          <button onClick={() => setStep("aadhaar_input")} className="w-full flex items-start gap-4 p-4 border-2 border-indigo-500 rounded-2xl bg-indigo-50 hover:bg-indigo-100 transition text-left">
            <Phone className="w-6 h-6 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-indigo-800 text-sm">Aadhaar OTP</p>
              <p className="text-xs text-indigo-600 mt-0.5">Instant — OTP to your Aadhaar-linked mobile number</p>
              <span className="inline-block mt-1 text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">Recommended</span>
            </div>
          </button>
          <button onClick={() => setStep("document")} className="w-full flex items-start gap-4 p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition text-left">
            <Upload className="w-6 h-6 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-700 text-sm">Upload Document</p>
              <p className="text-xs text-slate-500 mt-0.5">Passport, Driving Licence, or Voter ID — reviewed within 24 hours</p>
            </div>
          </button>
          <button onClick={() => setStep("status")} className="text-sm text-slate-400 underline underline-offset-2">Back</button>
        </div>
      )}

      {/* Step: Aadhaar input */}
      {step === "aadhaar_input" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-700">Enter Aadhaar Number</h2>
          <p className="text-xs text-slate-400">Your Aadhaar number is hashed locally before sending — it is never stored in plain text.</p>
          <input
            type="text"
            maxLength={14}
            placeholder="XXXX XXXX XXXX"
            value={aadhaar}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d]/g, "").slice(0, 12);
              setAadhaar(v.replace(/(\d{4})(?=\d)/g, "$1 ").trimEnd());
            }}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button onClick={handleSendOtp} disabled={busy} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send OTP
          </button>
          <button onClick={() => setStep("choose")} className="text-sm text-slate-400 underline">Back</button>
        </div>
      )}

      {/* Step: OTP verification */}
      {step === "aadhaar_otp" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-700">Enter OTP</h2>
          <p className="text-xs text-slate-500">Enter the 6-digit OTP sent to your Aadhaar-linked mobile number.</p>
          <input
            type="text"
            maxLength={6}
            placeholder="••••••"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-2xl tracking-widest font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button onClick={handleVerifyOtp} disabled={busy || otp.length < 6} className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Verify OTP
          </button>
          <button onClick={() => setStep("aadhaar_input")} className="text-sm text-slate-400 underline">Resend / Back</button>
        </div>
      )}

      {/* Step: Document upload */}
      {step === "document" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-700">Upload ID Document</h2>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">ID Type</label>
            <select value={idType} onChange={(e) => setIdType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="PASSPORT">Passport</option>
              <option value="DRIVING_LICENCE">Driving Licence</option>
              <option value="VOTER_ID">Voter ID</option>
              <option value="PAN_CARD">PAN Card</option>
              <option value="AADHAAR">Aadhaar (physical copy)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Document file (JPG/PNG/PDF, max 5MB)</label>
            <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm text-slate-600 file:mr-3 file:py-1 file:px-3 file:border file:border-slate-300 file:rounded-lg file:text-xs file:font-medium file:bg-slate-50 hover:file:bg-slate-100 cursor-pointer" />
          </div>
          <button onClick={handleDocumentUpload} disabled={busy || !file} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Submit for Review
          </button>
          <button onClick={() => setStep("choose")} className="text-sm text-slate-400 underline">Back</button>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && current && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          {current.status === "VERIFIED" ? (
            <>
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
              <h2 className="text-lg font-bold text-slate-800">Identity Verified!</h2>
              <p className="text-sm text-slate-500">Your Mana community identity is now verified.</p>
            </>
          ) : current.status === "REJECTED" ? (
            <>
              <XCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h2 className="text-lg font-bold text-slate-800">Verification Failed</h2>
              <p className="text-sm text-red-600">{current.rejectionReason ?? "Please try again with a clearer document."}</p>
              <button onClick={() => setStep("choose")} className="mt-2 px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200">Try Again</button>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                <Loader2 className="w-7 h-7 text-yellow-500 animate-spin" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Under Review</h2>
              <p className="text-sm text-slate-500">Your document is being reviewed by the community manager. Usually takes less than 24 hours.</p>
            </>
          )}
          <StatusBadge status={current.status} />
        </div>
      )}
    </div>
  );
}
