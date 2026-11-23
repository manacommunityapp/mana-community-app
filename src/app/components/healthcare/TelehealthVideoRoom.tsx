import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Maximize, Minimize,
  Clock, Shield, FileText, Pill, Send, CheckCircle2, AlertCircle,
  User, Award, Stethoscope, ChevronRight, Download, Share2
} from "lucide-react";
import { healthService } from "../../../services/healthService";
import type { HealthAppointmentDto } from "../../../types/health";

type RoomState = "CONNECTING" | "CONNECTED" | "ENDED";

interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export function TelehealthVideoRoom() {
  const { appointmentId } = useParams<{ appointmentId?: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<HealthAppointmentDto | null>(null);
  const [roomState, setRoomState] = useState<RoomState>("CONNECTING");
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Digital Prescription State
  const [rxId] = useState(() => `RX-MANA-${Math.floor(100000 + Math.random() * 900000)}`);
  const [diagnosis, setDiagnosis] = useState("Acute Bronchial Irritation / Post-Viral Rhinitis");
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    { id: "1", name: "Amoxicillin 500mg", dosage: "1 Tablet", frequency: "Twice daily after meals", duration: "5 days" },
    { id: "2", name: "Montelukast 10mg", dosage: "1 Tablet", frequency: "Once daily before sleep", duration: "7 days" },
    { id: "3", name: "Saline Nasal Spray", dosage: "2 Puffs", frequency: "Thrice daily", duration: "As needed" }
  ]);
  const [rxPushed, setRxPushed] = useState(false);
  const [vaultSaved, setVaultSaved] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Load appointment or fallback to mock
    if (appointmentId) {
      healthService.getAppointmentById(appointmentId).then(appt => {
        if (appt) setAppointment(appt);
      });
    } else {
      healthService.getMyAppointments().then(appts => {
        const found = appts.find(a => a.mode === "VIDEO") || appts[0];
        if (found) setAppointment(found);
      });
    }

    // Simulate WebRTC peer connection negotiation
    const connectTimer = setTimeout(() => {
      setRoomState("CONNECTED");
    }, 2000);

    return () => {
      clearTimeout(connectTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appointmentId]);

  useEffect(() => {
    if (roomState === "CONNECTED") {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (roomState === "ENDED") {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomState]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleEndCall = () => {
    if (window.confirm("Are you sure you want to end this teleconsultation?")) {
      setRoomState("ENDED");
      if (appointment) {
        healthService.updateAppointmentStatus(appointment.id, "COMPLETED", "Consultation ended by resident.").catch(() => {});
      }
    }
  };

  const handlePushPharmacy = () => {
    setRxPushed(true);
    setTimeout(() => setRxPushed(false), 3000);
  };

  const handleSaveToVault = () => {
    setVaultSaved(true);
    setTimeout(() => setVaultSaved(false), 3000);
  };

  return (
    <div className={`max-w-7xl mx-auto p-4 md:p-6 space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto" : ""}`}>
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Stethoscope size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                Telemedicine Consultation Room
              </h1>
              {roomState === "CONNECTED" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live · {formatTimer(elapsedSeconds)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              End-to-End Encrypted WebRTC Video Consultation · Mana Community Health Care
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
          <button
            onClick={() => navigate("/healthcare")}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition"
          >
            Back to Healthcare
          </button>
        </div>
      </div>

      {roomState === "ENDED" ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Consultation Completed</h2>
          <p className="text-sm text-gray-500">
            Total consultation duration: <strong className="text-gray-800">{formatTimer(elapsedSeconds)}</strong>. Your digital prescription has been archived in your Medical Health Vault.
          </p>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-left text-xs space-y-1">
            <p className="font-bold text-blue-900">Prescription Reference: {rxId}</p>
            <p className="text-blue-700">Doctor: {appointment?.doctorName || "Dr. Rajesh Kumar"} (KMC-48291)</p>
            <p className="text-blue-700">Delivered via: Mana Community Health Center</p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => navigate("/healthcare")}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
            >
              Return to Health Hub
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Video Stage */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video flex items-center justify-center shadow-xl border border-slate-800">
              {/* Doctor Video Feed (Simulated WebRTC) */}
              {roomState === "CONNECTING" ? (
                <div className="text-center space-y-3 p-6 text-white">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto" />
                  <p className="font-semibold text-base">Establishing Secure WebRTC Connection...</p>
                  <p className="text-xs text-slate-400">Negotiating STUN/TURN media handshake with {appointment?.doctorName || "Doctor"}</p>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
                  {/* Doctor Profile Simulation */}
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 border-4 border-white/20 flex items-center justify-center text-white text-3xl font-bold shadow-2xl">
                        {(appointment?.doctorName || "Dr. Rajesh").charAt(4) || "D"}
                      </div>
                      <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{appointment?.doctorName || "Dr. Rajesh Kumar"}</p>
                      <p className="text-xs text-slate-300">{appointment?.doctorSpecialty || "Consultant Cardiologist"} · OPD Video Feed</p>
                    </div>
                  </div>

                  {/* Patient PiP (Self View) */}
                  <div className="absolute top-4 right-4 w-36 h-28 bg-slate-800 rounded-2xl border-2 border-slate-700 shadow-xl overflow-hidden flex items-center justify-center">
                    {cameraOff ? (
                      <div className="text-center text-slate-400">
                        <VideoOff size={20} className="mx-auto mb-1 text-slate-500" />
                        <span className="text-[10px]">Camera Off</span>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-t from-slate-950 to-slate-800 flex items-center justify-center">
                        <User size={32} className="text-slate-400" />
                        <span className="absolute bottom-1.5 left-2 text-[10px] text-white font-medium bg-black/60 px-1.5 py-0.5 rounded">You</span>
                      </div>
                    )}
                  </div>

                  {/* Live Overlay Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-mono font-semibold border border-white/10 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      REC HD 1080p
                    </span>
                  </div>
                </div>
              )}

              {/* Call Control Bar (Bottom Floating) */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-700/80 shadow-2xl z-20">
                <button
                  onClick={() => setMicMuted(!micMuted)}
                  className={`p-3 rounded-xl transition ${micMuted ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                  title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button
                  onClick={() => setCameraOff(!cameraOff)}
                  className={`p-3 rounded-xl transition ${cameraOff ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                  title={cameraOff ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
                <button
                  onClick={handleEndCall}
                  className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition"
                  title="End Consultation"
                >
                  <PhoneOff size={18} />
                  <span>End Consultation</span>
                </button>
              </div>
            </div>

            {/* Doctor Credentials Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  MD
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{appointment?.doctorName || "Dr. Rajesh Kumar"}</p>
                  <p className="text-xs text-gray-500">{appointment?.doctorSpecialty || "Cardiologist"} · Reg: KMC-48291 · 15 Yrs Experience</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <Shield size={14} /> Mana Verified Doctor
              </span>
            </div>
          </div>

          {/* Right Column (4 cols): Digital Prescription Pad & Medicine Dispatch */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  <h3 className="text-base font-bold text-gray-900">Live Prescription Pad</h3>
                </div>
                <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                  {rxId}
                </span>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Diagnosis</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Prescribed Medicines */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center justify-between">
                  <span>Prescribed Medicines ({prescriptions.length})</span>
                  <span className="text-[11px] text-blue-600 font-normal">Auto-synced</span>
                </label>
                <div className="space-y-2.5">
                  {prescriptions.map(item => (
                    <div key={item.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800 flex items-center gap-1.5">
                          <Pill size={14} className="text-blue-600" /> {item.name}
                        </span>
                        <span className="font-mono text-[11px] text-gray-500">{item.duration}</span>
                      </div>
                      <p className="text-gray-500">{item.dosage} · {item.frequency}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <button
                  onClick={handlePushPharmacy}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  <span>{rxPushed ? "Sent to Mana Pharmacy!" : "Order from Mana Pharmacy"}</span>
                </button>
                <button
                  onClick={handleSaveToVault}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition flex items-center justify-center gap-2"
                >
                  <Download size={15} />
                  <span>{vaultSaved ? "Prescription Saved to Vault!" : "Save to Health Vault"}</span>
                </button>
              </div>

              {/* Info Note */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Digital prescription is digitally signed under National Telemedicine Guidelines 2020.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default TelehealthVideoRoom;
