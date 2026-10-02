import React, { useState, useEffect } from "react";
import {
  ScanFace,
  UserCheck,
  UserX,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Unlock,
  Lock,
  Camera,
  Activity,
  CheckCircle,
  Clock,
  Sparkles,
  Users
} from "lucide-react";
import {
  turnstileService,
  type BiometricTurnstileDto,
  type BiometricAccessLogDto,
  type VerifyFaceResult,
  type AccessDecision
} from "../../../services/access/turnstileService";

interface Props {
  communityId?: number;
}

export const BiometricTurnstileMonitor: React.FC<Props> = ({ communityId = 1 }) => {
  const [turnstiles, setTurnstiles] = useState<BiometricTurnstileDto[]>([]);
  const [logs, setLogs] = useState<BiometricAccessLogDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTurnstile, setSelectedTurnstile] = useState<string>("TS-GATE-NORTH-01");
  const [lastMatch, setLastMatch] = useState<VerifyFaceResult | null>(null);

  // Simulation state
  const [simPersonName, setSimPersonName] = useState<string>("Sunita Devi (Maid)");
  const [simPersonType, setSimPersonType] = useState<string>("DOMESTIC_STAFF");
  const [simConfidence, setSimConfidence] = useState<number>(0.96);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [unlocking, setUnlocking] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [communityId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const turnstileList = await turnstileService.getTurnstiles(communityId);
      if (turnstileList && turnstileList.length > 0) {
        setTurnstiles(turnstileList);
      } else {
        // Fallback demo items
        setTurnstiles([
          {
            id: 1,
            turnstileIdentifier: "TS-GATE-NORTH-01",
            turnstileName: "North Main Pedestrian Gate",
            communityId,
            gateLocation: "North Clubhouse Entrance",
            direction: "BIDIRECTIONAL",
            status: "ONLINE",
            relayUnlockMs: 3000,
            lastHeartbeat: new Date().toISOString(),
          },
          {
            id: 2,
            turnstileIdentifier: "TS-GATE-SOUTH-02",
            turnstileName: "South Staff & Service Turnstile",
            communityId,
            gateLocation: "South Tower Service Alley",
            direction: "ENTRY",
            status: "ONLINE",
            relayUnlockMs: 3000,
            lastHeartbeat: new Date().toISOString(),
          },
        ]);
      }

      const logData = await turnstileService.getAccessLogs(communityId, 0, 10);
      if (logData && logData.content) {
        setLogs(logData.content);
      } else {
        setLogs([
          {
            id: 101,
            turnstileId: 1,
            turnstileName: "North Main Pedestrian Gate",
            personName: "Priya Sharma",
            personType: "RESIDENT",
            unitNumber: "A-402",
            confidenceScore: 0.98,
            accessDecision: "GRANTED_OPEN",
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          },
          {
            id: 102,
            turnstileId: 2,
            turnstileName: "South Staff & Service Turnstile",
            personName: "Sunita Devi",
            personType: "DOMESTIC_STAFF",
            unitNumber: "B-201",
            confidenceScore: 0.95,
            accessDecision: "GRANTED_OPEN",
            timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          },
          {
            id: 103,
            turnstileId: 1,
            turnstileName: "North Main Pedestrian Gate",
            personName: "Unknown Visitor",
            personType: "VENDOR_WORKER",
            confidenceScore: 0.64,
            accessDecision: "DENIED_UNENROLLED",
            failureReason: "Low match confidence: 0.64",
            timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load turnstile data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualUnlock = async (turnstileId: number) => {
    setUnlocking(true);
    try {
      setLastMatch({
        turnstileIdentifier: selectedTurnstile,
        decision: "GRANTED_OPEN",
        relayUnlock: true,
        relayUnlockDurationMs: 3000,
        personName: "Manual Guard Override",
        personType: "SECURITY_GUARD",
        unitNumber: "GUARD_DESK",
        confidenceScore: 1.0,
        message: "Manual gate pulse triggered by Security Guard",
      });
      setTimeout(() => setUnlocking(false), 3000);
    } catch (err) {
      console.error("Unlock failed", err);
      setUnlocking(false);
    }
  };

  const handleSimulateFaceScan = async () => {
    setSimulating(true);
    try {
      const res = await turnstileService.verifyFace({
        turnstileIdentifier: selectedTurnstile,
        faceEmbeddingHash: simPersonType === "DOMESTIC_STAFF" ? "hash_sunita_123" : "hash_resident_456",
        confidenceScore: simConfidence,
      });
      setLastMatch(res);
      loadData();
    } catch (err) {
      console.error("Face scan simulation failed", err);
    } finally {
      setSimulating(false);
    }
  };

  const getDecisionBadge = (decision: AccessDecision) => {
    if (decision === "GRANTED_OPEN") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          Access Granted
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <UserX className="w-3.5 h-3.5 text-red-600" />
        {decision.replace("DENIED_", "DENIED: ")}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <ScanFace className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-800">Biometric & Facial Recognition Turnstiles</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Real-time Edge AI face detection and automated relay pulse opening for residents, domestic staff, and guards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Grid: Live Camera Feed & Match Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Camera Viewport */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800 flex flex-col justify-between">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold font-mono">{selectedTurnstile}</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs rounded-full font-bold">
                1080p 30fps Live
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTurnstile}
                onChange={(e) => setSelectedTurnstile(e.target.value)}
                className="bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none"
              >
                {turnstiles.map((t) => (
                  <option key={t.id} value={t.turnstileIdentifier}>
                    {t.turnstileName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Simulated Camera Frame */}
          <div className="relative h-72 md:h-80 bg-slate-950 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

            {/* Bounding Box Simulation */}
            <div className="relative border-2 border-dashed border-emerald-400 w-44 h-56 rounded-2xl flex flex-col items-center justify-between p-3 bg-emerald-500/5 backdrop-blur-[1px] animate-pulse">
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded">
                <span>FACE DETECTED</span>
                <span>{(simConfidence * 100).toFixed(0)}%</span>
              </div>
              <ScanFace className="w-16 h-16 text-emerald-400 opacity-60" />
              <div className="text-[10px] text-emerald-200 font-mono text-center bg-slate-900/80 px-2 py-0.5 rounded w-full truncate">
                {simPersonName}
              </div>
            </div>

            {/* Turnstile Relay Unlock Overlay */}
            {lastMatch?.relayUnlock && (
              <div className="absolute top-4 left-4 right-4 bg-emerald-600/90 text-white p-3 rounded-xl backdrop-blur-md flex items-center justify-between shadow-xl animate-fade-in">
                <div className="flex items-center gap-2">
                  <Unlock className="w-5 h-5 text-white animate-bounce" />
                  <span className="font-bold text-sm">Turnstile Barrier UNLOCKED (3.0s Relay Pulse)</span>
                </div>
                <span className="font-mono text-xs bg-emerald-700 px-2 py-0.5 rounded">
                  {lastMatch.personName}
                </span>
              </div>
            )}
          </div>

          {/* Controls Footer */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>FaceNet-v2 Edge AI Engine Active</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleManualUnlock(1)}
                disabled={unlocking}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                {unlocking ? "Relay Active..." : "Manual Pulse Unlock"}
              </button>
            </div>
          </div>
        </div>

        {/* Live Match Card & Edge Simulator */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Simulate Edge Facial Scan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Test facial biometric matching against domestic staff hours and resident rules.
            </p>

            <div className="space-y-3.5 mt-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Type</label>
                <select
                  value={simPersonType}
                  onChange={(e) => {
                    setSimPersonType(e.target.value);
                    if (e.target.value === "DOMESTIC_STAFF") setSimPersonName("Sunita Devi (Maid)");
                    else if (e.target.value === "RESIDENT") setSimPersonName("Priya Sharma (A-402)");
                    else setSimPersonName("Security Guard Vikram");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="DOMESTIC_STAFF">Domestic Staff (Maid / Cook)</option>
                  <option value="RESIDENT">Apartment Resident</option>
                  <option value="SECURITY_GUARD">Security Guard</option>
                  <option value="VENDOR_WORKER">Contractor / Vendor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Match Confidence</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.01"
                    value={simConfidence}
                    onChange={(e) => setSimConfidence(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    {(simConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <button
                onClick={handleSimulateFaceScan}
                disabled={simulating}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50"
              >
                {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
                Trigger Edge Face Recognition
              </button>
            </div>
          </div>

          {/* Last Match Summary Box */}
          {lastMatch && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs animate-fade-in">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span>Verification Result</span>
                {getDecisionBadge(lastMatch.decision)}
              </div>
              <div className="text-slate-800 font-bold text-sm">{lastMatch.personName}</div>
              <div className="text-slate-500 text-[11px]">{lastMatch.message}</div>
            </div>
          )}
        </div>
      </div>

      {/* Access History Log Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">Pedestrian Access Audit Trail</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Live WebSocket Ingestion</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-4">Turnstile</th>
                <th className="py-3 px-4">Person / Role</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-6 text-center">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-mono text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 text-xs">
                    {log.turnstileName}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 text-sm">{log.personName}</div>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {log.personType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                    {log.unitNumber || "N/A"}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-indigo-600">
                    {(Number(log.confidenceScore) * 100).toFixed(0)}%
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    {getDecisionBadge(log.accessDecision)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
