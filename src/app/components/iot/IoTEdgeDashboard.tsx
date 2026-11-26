import React, { useState, useEffect, useCallback } from "react";
import {
  Activity, Wifi, WifiOff, Zap, Droplets, ShieldCheck, AlertTriangle,
  RefreshCw, Plus, DollarSign, Radio, Cpu, MemoryStick, Signal
} from "lucide-react";
import * as iotService from "../../../services/iot/iotEdgeService";

type Tab = "heartbeat" | "meters" | "barrier";

export function IoTEdgeDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("heartbeat");
  const communityId = 1; // from context in production

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "heartbeat", label: "Device Health", icon: <Activity className="w-4 h-4" /> },
    { key: "meters", label: "Prepaid Meters", icon: <Zap className="w-4 h-4" /> },
    { key: "barrier", label: "Barrier Access", icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">IoT Edge & Hardware Control</h1>
        <p className="text-gray-500 mt-1">
          Device monitoring, prepaid metering, and barrier access control
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "heartbeat" && <HeartbeatPanel communityId={communityId} />}
      {activeTab === "meters" && <MetersPanel communityId={communityId} />}
      {activeTab === "barrier" && <BarrierPanel communityId={communityId} />}
    </div>
  );
}

// ── Heartbeat Panel ──

function HeartbeatPanel({ communityId }: { communityId: number }) {
  const [health, setHealth] = useState<iotService.DeviceHealthSummary | null>(null);
  const [devices, setDevices] = useState<iotService.EdgeGatewayDevice[]>([]);
  const [sweepResult, setSweepResult] = useState<iotService.SweepResult | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, devicesRes] = await Promise.all([
        iotService.getDeviceHealth(communityId),
        iotService.getDevices(communityId),
      ]);
      setHealth(healthRes.data);
      setDevices(devicesRes.data);
    } catch (err) {
      console.error("Failed to load device data", err);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => { loadData(); }, [loadData]);

  const runSweep = async () => {
    try {
      const res = await iotService.runOfflineSweep();
      setSweepResult(res.data);
      await loadData();
    } catch (err) {
      console.error("Sweep failed", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<Radio className="w-5 h-5 text-blue-600" />} label="Total Devices" value={health.totalDevices} />
          <StatCard icon={<Wifi className="w-5 h-5 text-green-600" />} label="Online" value={health.onlineDevices} color="green" />
          <StatCard icon={<WifiOff className="w-5 h-5 text-red-600" />} label="Offline" value={health.offlineDevices} color="red" />
          <StatCard icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />} label="Suppressed Regions"
            value={health.suppressedRegions.length + health.suppressedIsps.length} color="yellow" />
        </div>
      )}

      {/* ISP/Region outage notices */}
      {health && (health.suppressedRegions.length > 0 || health.suppressedIsps.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Outage Suppression Active
          </h3>
          {health.suppressedRegions.length > 0 && (
            <p className="text-amber-700 text-sm mt-1">Regions: {health.suppressedRegions.join(", ")}</p>
          )}
          {health.suppressedIsps.length > 0 && (
            <p className="text-amber-700 text-sm mt-1">ISPs: {health.suppressedIsps.join(", ")}</p>
          )}
          <p className="text-amber-600 text-xs mt-2">Individual device alerts in these regions/ISPs are suppressed to avoid flooding ops.</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        <button onClick={runSweep} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
          <RefreshCw className="w-4 h-4" /> Run Offline Sweep
        </button>
        <button onClick={loadData} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Sweep result */}
      {sweepResult && (
        <div className="bg-gray-50 border rounded-lg p-4 text-sm">
          <h4 className="font-semibold mb-2">Last Sweep Result</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><span className="text-gray-500">Newly Offline:</span> <strong>{sweepResult.newlyOffline}</strong></div>
            <div><span className="text-gray-500">Warned:</span> <strong>{sweepResult.warned}</strong></div>
            <div><span className="text-gray-500">Alerted:</span> <strong>{sweepResult.alertableDevices.length}</strong></div>
            <div><span className="text-gray-500">Suppressed:</span> <strong>{sweepResult.suppressedDevices.length}</strong></div>
          </div>
        </div>
      )}

      {/* Device table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Heartbeat</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Misses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {devices.map((d) => (
              <tr key={d.id} className={d.isOnline ? "" : "bg-red-50"}>
                <td className="px-4 py-3 text-sm font-mono">{d.serialNumber}</td>
                <td className="px-4 py-3 text-sm">{d.deviceType}</td>
                <td className="px-4 py-3 text-sm">{d.location}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    d.isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {d.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {d.isOnline ? "Online" : "Offline"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {d.lastHeartbeatAt ? new Date(d.lastHeartbeatAt).toLocaleString() : "Never"}
                </td>
                <td className="px-4 py-3 text-sm">{d.consecutiveMisses}</td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No devices registered</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Meters Panel ──

function MetersPanel({ communityId }: { communityId: number }) {
  const [accounts, setAccounts] = useState<iotService.PrepaidMeterAccount[]>([]);
  const [alerts, setAlerts] = useState<iotService.LowBalanceAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, alertsRes] = await Promise.all([
        iotService.getMeterAccounts(communityId),
        iotService.getLowBalanceAlerts(),
      ]);
      setAccounts(accountsRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      console.error("Failed to load meter data", err);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Zap className="w-5 h-5 text-blue-600" />} label="Total Meters" value={accounts.length} />
        <StatCard icon={<DollarSign className="w-5 h-5 text-green-600" />} label="Active"
          value={accounts.filter((a) => a.active && !a.isDisconnected).length} color="green" />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />} label="Low Balance"
          value={accounts.filter((a) => a.lowBalanceAlertSent).length} color="yellow" />
        <StatCard icon={<WifiOff className="w-5 h-5 text-red-600" />} label="Disconnected"
          value={accounts.filter((a) => a.isDisconnected).length} color="red" />
      </div>

      {/* Low balance alerts */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" /> Low Balance Alerts ({alerts.length})
          </h3>
          <div className="space-y-1">
            {alerts.map((a) => (
              <p key={a.meterId} className="text-sm text-amber-700">
                Unit {a.unitNumber} (Meter #{a.meterId}): Balance ₹{a.balance.toFixed(2)} / Threshold ₹{a.threshold.toFixed(2)}
              </p>
            ))}
          </div>
        </div>
      )}

      <button onClick={loadData} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
      </button>

      {/* Meter accounts table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meter ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance (₹)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate/Unit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Consumed</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Deduction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {accounts.map((a) => (
              <tr key={a.id} className={a.isDisconnected ? "bg-red-50" : a.lowBalanceAlertSent ? "bg-amber-50" : ""}>
                <td className="px-4 py-3 text-sm font-mono">#{a.meterId}</td>
                <td className="px-4 py-3 text-sm">{a.unitNumber || "—"}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">₹{a.balance.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{a.ratePerUnit.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">{a.totalConsumed.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">
                  {a.isDisconnected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Disconnected</span>
                  ) : a.lowBalanceAlertSent ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Low Balance</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {a.lastDeductionAt ? new Date(a.lastDeductionAt).toLocaleString() : "Never"}
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No meter accounts</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Barrier Panel ──

function BarrierPanel({ communityId }: { communityId: number }) {
  const [cacheStats, setCacheStats] = useState<iotService.CacheStats | null>(null);
  const [testResult, setTestResult] = useState<iotService.BarrierDecision | null>(null);
  const [credType, setCredType] = useState("RFID");
  const [credValue, setCredValue] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    iotService.getBarrierCacheStats(communityId).then((r) => setCacheStats(r.data)).catch(() => {});
  }, [communityId]);

  const testValidation = async () => {
    if (!credValue.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await iotService.validateBarrierAccess(communityId, credType, credValue);
      setTestResult(res.data);
    } catch (err) {
      console.error("Validation test failed", err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cache stats */}
      {cacheStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={<ShieldCheck className="w-5 h-5 text-blue-600" />} label="DB Cache Entries" value={cacheStats.dbCacheEntries} />
          <StatCard icon={<Cpu className="w-5 h-5 text-green-600" />} label="Hot Cache Entries" value={cacheStats.hotCacheEntries} color="green" />
          <div className="bg-white border rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase font-medium">SLA Target</div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">&lt; 300ms</div>
            <div className="text-xs text-gray-400 mt-1">End-to-end barrier validation</div>
          </div>
        </div>
      )}

      {/* Architecture explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Barrier Validation Architecture</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Layer 1 — In-Memory Hot Cache:</strong> ConcurrentHashMap lookup in &lt;1ms. Populated on successful validations.</p>
          <p><strong>Layer 2 — Cloud Validation:</strong> Real-time resident/vehicle authorization with 200ms timeout.</p>
          <p><strong>Layer 3 — DB Cache Fallback:</strong> Pre-synced offline cache used when cloud is unreachable. 24h TTL.</p>
          <p><strong>Failsafe:</strong> Unknown credentials get HOLD action. No unverified access.</p>
        </div>
      </div>

      {/* Test validation */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Test Barrier Validation</h3>
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Credential Type</label>
            <select value={credType} onChange={(e) => setCredType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="RFID">RFID</option>
              <option value="ANPR">ANPR (License Plate)</option>
              <option value="BIOMETRIC">Biometric</option>
              <option value="PIN">PIN Code</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Credential Value</label>
            <input type="text" value={credValue} onChange={(e) => setCredValue(e.target.value)}
              placeholder="e.g. RFID tag ID or license plate"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={testValidation} disabled={testing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50">
            {testing ? "Validating..." : "Validate"}
          </button>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            testResult.action === "OPEN" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-lg font-bold ${testResult.action === "OPEN" ? "text-green-700" : "text-red-700"}`}>
                  {testResult.action === "OPEN" ? "✓ BARRIER OPEN" : "✕ BARRIER HOLD"}
                </span>
                {testResult.residentName && (
                  <p className="text-sm text-gray-600 mt-1">{testResult.residentName} — {testResult.flatNo}</p>
                )}
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${testResult.latencyMs < 300 ? "text-green-600" : "text-red-600"}`}>
                  {testResult.latencyMs}ms
                </div>
                <div className="text-xs text-gray-500">
                  {testResult.cloudVerified ? "Cloud verified" : "Cache fallback"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared Components ──

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number | string; color?: string;
}) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-medium">
        {icon} {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${
        color === "green" ? "text-green-600" : color === "red" ? "text-red-600" :
        color === "yellow" ? "text-amber-600" : "text-gray-900"
      }`}>
        {value}
      </div>
    </div>
  );
}
