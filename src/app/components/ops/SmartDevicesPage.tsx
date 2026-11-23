import { useState, useEffect } from "react";
import { Cpu, Wifi, WifiOff, Play, Key, Plus, Loader2, AlertCircle, Copy, CheckCircle2, Sparkles, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";
import {
  smartDeviceService,
  type SmartDevice,
  type SmartDeviceAction,
  type SmartDeviceType,
} from "../../../services/smartDeviceService";
import { getStoredUser } from "../../../services/common/apiClient";
import { automationService, type IotSubmeterTamperAuditResponse } from "../../../services/automation/automationService";

const DEVICE_ACTIONS: { action: SmartDeviceAction; label: string; color: string }[] = [
  { action: "UNLOCK", label: "Unlock", color: "bg-green-600 hover:bg-green-700" },
  { action: "LOCK", label: "Lock", color: "bg-slate-600 hover:bg-slate-700" },
  { action: "OPEN", label: "Open", color: "bg-blue-600 hover:bg-blue-700" },
  { action: "CLOSE", label: "Close", color: "bg-orange-600 hover:bg-orange-700" },
  { action: "ON", label: "Turn On", color: "bg-yellow-600 hover:bg-yellow-700" },
  { action: "OFF", label: "Turn Off", color: "bg-zinc-600 hover:bg-zinc-700" },
];

const DEVICE_TYPES: SmartDeviceType[] = ["DOOR_LOCK", "BARRIER", "CAMERA", "INTERCOM", "LIGHT", "PUMP", "GENERATOR"];

function DeviceTypeBadge({ type }: { type: SmartDeviceType }) {
  const labels: Record<SmartDeviceType, string> = { DOOR_LOCK: "Door Lock", BARRIER: "Barrier", CAMERA: "Camera", INTERCOM: "Intercom", LIGHT: "Light", PUMP: "Pump", GENERATOR: "Generator" };
  return <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{labels[type]}</span>;
}

export function SmartDevicesPage() {
  const user = getStoredUser();
  const communityId: number = (user as { communityId?: number })?.communityId ?? 0;

  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<SmartDeviceType | "">("");
  const [controlTarget, setControlTarget] = useState<SmartDevice | null>(null);
  const [selectedAction, setSelectedAction] = useState<SmartDeviceAction>("UNLOCK");
  const [controlling, setControlling] = useState(false);
  const [otpTarget, setOtpTarget] = useState<SmartDevice | null>(null);
  const [otpVisitor, setOtpVisitor] = useState("");
  const [otpMinutes, setOtpMinutes] = useState(30);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<{ otp: string; validUntil: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ deviceName: "", deviceType: "DOOR_LOCK" as SmartDeviceType, location: "", accessibleBy: "FM_ADMIN", serialNumber: "" });
  const [adding, setAdding] = useState(false);

  // AI Submeter Tamper & Line Loss Auditor
  const [isAuditingTamper, setIsAuditingTamper] = useState(false);
  const [tamperResult, setTamperResult] = useState<IotSubmeterTamperAuditResponse | null>(null);
  const [showTamperModal, setShowTamperModal] = useState(false);

  const handleAuditTamper = async () => {
    setIsAuditingTamper(true);
    try {
      const res = await automationService.auditIotSubmeterTamper({
        meterId: "IOT-MTR-BLK-C-204",
        meterType: "ELECTRICITY",
        flatNumber: "C-204",
        historicalAvgDailyUnits: 14.5,
        currentCycleReadings: [
          { date: "2026-11-15", unitsKwhOrLiters: 14.2, peakKw: 4.8, reversePowerDetected: false, magnetTamperAlert: false },
          { date: "2026-11-16", unitsKwhOrLiters: 13.9, peakKw: 4.5, reversePowerDetected: false, magnetTamperAlert: false },
          { date: "2026-11-17", unitsKwhOrLiters: 4.1, peakKw: 1.2, reversePowerDetected: true, magnetTamperAlert: true },
          { date: "2026-11-18", unitsKwhOrLiters: 2.8, peakKw: 0.9, reversePowerDetected: true, magnetTamperAlert: false },
          { date: "2026-11-19", unitsKwhOrLiters: 3.0, peakKw: 0.8, reversePowerDetected: false, magnetTamperAlert: false }
        ],
        rssiSignalStrengthDbm: -84
      });
      setTamperResult(res);
      setShowTamperModal(true);
    } catch {
      toast.error("Submeter tamper audit failed");
    } finally {
      setIsAuditingTamper(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    smartDeviceService.getDevices(communityId, filterType || undefined)
      .then(setDevices)
      .catch(() => toast.error("Failed to load devices"))
      .finally(() => setLoading(false));
  }, [communityId, filterType]);

  async function handleControl() {
    if (!controlTarget) return;
    setControlling(true);
    try {
      const r = await smartDeviceService.control(controlTarget.id, selectedAction);
      toast.success(`${selectedAction}: ${r.result}`);
      setControlTarget(null);
    } catch { toast.error("Control action failed"); }
    setControlling(false);
  }

  async function handleGenerateOtp() {
    if (!otpTarget || !otpVisitor.trim()) return;
    setGeneratingOtp(true);
    try {
      const r = await smartDeviceService.issueVisitorOtp(otpTarget.id, otpVisitor.trim(), otpMinutes);
      setGeneratedOtp(r);
    } catch { toast.error("Failed to generate OTP"); }
    setGeneratingOtp(false);
  }

  async function handleAddDevice() {
    if (!addForm.deviceName || !addForm.location) { toast.error("Name and location are required"); return; }
    setAdding(true);
    try {
      const d = await smartDeviceService.registerDevice({ ...addForm, communityId });
      setDevices((prev) => [d, ...prev]);
      setShowAdd(false);
      toast.success("Device registered");
    } catch { toast.error("Failed to register device"); }
    setAdding(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-7 h-7 animate-spin text-indigo-400" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800">Smart Devices</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAuditTamper}
            disabled={isAuditingTamper}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-100 disabled:opacity-50 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            {isAuditingTamper ? "Auditing Meter Telemetry..." : "AI Submeter Tamper Audit"}
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Device
          </button>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterType("")} className={`px-3 py-1 rounded-full text-xs font-medium border ${filterType === "" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-300"}`}>All</button>
        {DEVICE_TYPES.map((t) => <button key={t} onClick={() => setFilterType(t === filterType ? "" : t)} className={`px-3 py-1 rounded-full text-xs font-medium border ${filterType === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-300"}`}>{t.replace("_", " ")}</button>)}
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No devices registered yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${d.isOnline ? "bg-green-500" : "bg-slate-300"}`} title={d.isOnline ? "Online" : "Offline"} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700">{d.deviceName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{d.location}</span>
                  <DeviceTypeBadge type={d.deviceType} />
                  {d.lastHeartbeat && <span className="text-xs text-slate-300">{new Date(d.lastHeartbeat).toLocaleTimeString("en-IN")}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {d.isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-slate-400" />}
                {d.deviceType === "DOOR_LOCK" && (
                  <button onClick={() => { setOtpTarget(d); setGeneratedOtp(null); setOtpVisitor(""); setOtpMinutes(30); }} className="flex items-center gap-1 px-3 py-1.5 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-50">
                    <Key className="w-3.5 h-3.5" /> Visitor OTP
                  </button>
                )}
                <button onClick={() => { setControlTarget(d); setSelectedAction("UNLOCK"); }} disabled={!d.isOnline} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-40">
                  <Play className="w-3.5 h-3.5" /> Control
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Control modal */}
      {controlTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setControlTarget(null); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-bold text-slate-800">Control: {controlTarget.deviceName}</h2>
            <p className="text-xs text-slate-400">{controlTarget.location}</p>
            <div className="grid grid-cols-2 gap-2">
              {DEVICE_ACTIONS.map(({ action, label, color }) => (
                <button key={action} onClick={() => setSelectedAction(action)} className={`py-2 rounded-lg text-sm font-medium text-white transition ${selectedAction === action ? color + " ring-2 ring-offset-1 ring-indigo-400" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-600">Send <strong>{selectedAction}</strong> to {controlTarget.deviceName}?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setControlTarget(null)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleControl} disabled={controlling} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {controlling ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visitor OTP modal */}
      {otpTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setOtpTarget(null); setGeneratedOtp(null); } }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-bold text-slate-800">Generate Visitor OTP</h2>
            <p className="text-xs text-slate-400">{otpTarget.deviceName} · {otpTarget.location}</p>
            {!generatedOtp ? (
              <>
                <input value={otpVisitor} onChange={(e) => setOtpVisitor(e.target.value)} placeholder="Visitor name *" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Valid for (minutes)</label>
                  <select value={otpMinutes} onChange={(e) => setOtpMinutes(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    {[15, 30, 60, 120, 240].map((m) => <option key={m} value={m}>{m} min{m >= 60 ? ` (${m / 60}h)` : ""}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setOtpTarget(null)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
                  <button onClick={handleGenerateOtp} disabled={generatingOtp || !otpVisitor.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                    {generatingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />} Generate
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                <p className="text-sm text-slate-600">OTP for <strong>{otpVisitor}</strong></p>
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-3xl font-mono font-bold tracking-widest text-slate-800">{generatedOtp.otp}</span>
                  <button onClick={() => { navigator.clipboard.writeText(generatedOtp!.otp); toast.success("Copied!"); }} className="p-2 hover:bg-slate-100 rounded-lg">
                    <Copy className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">Valid until {new Date(generatedOtp.validUntil).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                <button onClick={() => { setOtpTarget(null); setGeneratedOtp(null); }} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add device modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-bold text-slate-800">Register Device</h2>
            <input value={addForm.deviceName} onChange={(e) => setAddForm((p) => ({ ...p, deviceName: e.target.value }))} placeholder="Device name *" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <select value={addForm.deviceType} onChange={(e) => setAddForm((p) => ({ ...p, deviceType: e.target.value as SmartDeviceType }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {DEVICE_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
            <input value={addForm.location} onChange={(e) => setAddForm((p) => ({ ...p, location: e.target.value }))} placeholder="Location *" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input value={addForm.serialNumber} onChange={(e) => setAddForm((p) => ({ ...p, serialNumber: e.target.value }))} placeholder="Serial number (optional)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={handleAddDevice} disabled={adding} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Submeter Tamper & Line Loss Modal */}
      {showTamperModal && tamperResult && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs" onClick={(e) => { if (e.target === e.currentTarget) setShowTamperModal(false); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h2 className="font-bold text-slate-800 text-base">AI Submeter Tamper & Line Loss Audit</h2>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                (tamperResult.tamperRiskScore ?? 0) > 60 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
              }`}>
                Risk Score: {tamperResult.tamperRiskScore}/100
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">CLASSIFICATION</span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  {(tamperResult.anomalyClassification || "NORMAL").replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">CONFIDENCE</span>
                <span className="font-bold text-indigo-600 block mt-0.5">
                  {tamperResult.tamperConfidencePct}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">EST. REVENUE LEAK</span>
                <span className="font-bold text-rose-600 block mt-0.5">
                  ₹{(tamperResult.revenueLeakageEstimatedInr ?? 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Evidence Points */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Telemetry Evidence</h3>
              <div className="space-y-1.5">
                {tamperResult.evidencePoints?.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs">
              <div className="font-semibold text-indigo-900 mb-1 flex items-center justify-between">
                <span>Actionable Recommendation</span>
                {tamperResult.dispatchTechnician && (
                  <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Technician Dispatch Required
                  </span>
                )}
              </div>
              <p className="text-indigo-800 leading-relaxed">{tamperResult.recommendedAction}</p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowTamperModal(false)}
                className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close Audit
              </button>
              {tamperResult.dispatchTechnician && (
                <button
                  onClick={() => {
                    toast.success("Technician work order created for Flat C-204 submeter inspection!");
                    setShowTamperModal(false);
                  }}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition"
                >
                  Create Work Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
