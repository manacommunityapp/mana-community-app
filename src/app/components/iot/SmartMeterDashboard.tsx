import React, { useState, useEffect } from "react";
import {
  Droplets,
  Zap,
  Flame,
  Activity,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Database,
  Radio,
  Clock,
  ShieldCheck,
  Send,
  Battery,
  Layers
} from "lucide-react";
import {
  meteringService,
  type SmartMeterDto,
  type MeterType,
  type IngestTelemetryResult
} from "../../../services/iot/meteringService";

interface Props {
  communityId?: number;
}

export const SmartMeterDashboard: React.FC<Props> = ({ communityId = 1 }) => {
  const [meters, setMeters] = useState<SmartMeterDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [billingMonth, setBillingMonth] = useState<string>("2026-10");
  const [syncingCfbos, setSyncingCfbos] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Pulse simulation modal
  const [simModalOpen, setSimModalOpen] = useState<boolean>(false);
  const [simMeterSerial, setSimMeterSerial] = useState<string>("");
  const [simPulses, setSimPulses] = useState<number>(100);
  const [simInstantFlow, setSimInstantFlow] = useState<number>(2.5);
  const [simResult, setSimResult] = useState<IngestTelemetryResult | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  useEffect(() => {
    loadMeters();
  }, [communityId]);

  const loadMeters = async () => {
    setLoading(true);
    try {
      const data = await meteringService.getCommunityMeters(communityId);
      if (data && data.length > 0) {
        setMeters(data);
      } else {
        // Mock fallback for UI demo
        setMeters([
          {
            id: 1,
            meterSerialNumber: "WM-T1-102",
            meterType: "WATER_METER",
            communityId,
            unitNumber: "A-102",
            blockName: "Tower A",
            protocol: "MQTT",
            pulseMultiplier: 1.0,
            lastReading: 14250.0,
            lastTelemetryTime: new Date().toISOString(),
            status: "ACTIVE",
            batteryLevel: 94,
            leakDetected: false,
          },
          {
            id: 2,
            meterSerialNumber: "WM-T1-103",
            meterType: "WATER_METER",
            communityId,
            unitNumber: "A-103",
            blockName: "Tower A",
            protocol: "MODBUS_TCP",
            pulseMultiplier: 1.0,
            lastReading: 38400.0,
            lastTelemetryTime: new Date().toISOString(),
            status: "ACTIVE",
            batteryLevel: 88,
            leakDetected: true,
          },
          {
            id: 3,
            meterSerialNumber: "EM-T1-102",
            meterType: "ELECTRICITY_METER",
            communityId,
            unitNumber: "A-102",
            blockName: "Tower A",
            protocol: "MQTT",
            pulseMultiplier: 0.5,
            lastReading: 312.5,
            lastTelemetryTime: new Date().toISOString(),
            status: "ACTIVE",
            batteryLevel: 100,
            leakDetected: false,
          },
          {
            id: 4,
            meterSerialNumber: "DG-BACKUP-01",
            meterType: "DIESEL_GENERATOR",
            communityId,
            unitNumber: "COMMON",
            blockName: "Clubhouse",
            protocol: "MODBUS_TCP",
            pulseMultiplier: 1.0,
            lastReading: 1845.0,
            lastTelemetryTime: new Date().toISOString(),
            status: "ACTIVE",
            batteryLevel: 100,
            leakDetected: false,
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load meters", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToCfbos = async () => {
    setSyncingCfbos(true);
    setSyncSuccessMsg(null);
    try {
      const results = await meteringService.syncToCfbos(communityId, billingMonth);
      setSyncSuccessMsg(`Successfully synced ${results.length || meters.length} meter utility charges into CFBOS General Ledger for ${billingMonth}!`);
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } catch (err) {
      console.error("CFBOS sync failed", err);
    } finally {
      setSyncingCfbos(false);
    }
  };

  const handleSimulatePulse = async () => {
    if (!simMeterSerial) return;
    setSimulating(true);
    try {
      const res = await meteringService.ingestTelemetry({
        meterSerialNumber: simMeterSerial,
        pulseCount: simPulses,
        instantaneousFlow: simInstantFlow,
      });
      setSimResult(res);
      loadMeters();
    } catch (err) {
      console.error("Pulse simulation failed", err);
    } finally {
      setSimulating(false);
    }
  };

  const getMeterIcon = (type: MeterType) => {
    switch (type) {
      case "WATER_METER":
        return <Droplets className="w-5 h-5 text-blue-500" />;
      case "ELECTRICITY_METER":
        return <Zap className="w-5 h-5 text-amber-500" />;
      case "DIESEL_GENERATOR":
        return <Flame className="w-5 h-5 text-rose-500" />;
      default:
        return <Activity className="w-5 h-5 text-indigo-500" />;
    }
  };

  const filteredMeters = selectedType === "ALL" ? meters : meters.filter((m) => m.meterType === selectedType);

  const totalWaterConsumption = meters
    .filter((m) => m.meterType === "WATER_METER")
    .reduce((acc, m) => acc + m.lastReading, 0);

  const totalElectricityConsumption = meters
    .filter((m) => m.meterType === "ELECTRICITY_METER")
    .reduce((acc, m) => acc + m.lastReading, 0);

  const leakAlertsCount = meters.filter((m) => m.leakDetected).length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-800">IoT Smart Metering & CFBOS Utility Telemetry</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Real-time MQTT & Modbus telemetry ingestion for Water, Electricity, and DG Backup with automated CFBOS billing sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSimResult(null);
              setSimMeterSerial(meters[0]?.meterSerialNumber || "");
              setSimModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
          >
            <Radio className="w-4 h-4 text-indigo-600" />
            Simulate Pulse Telemetry
          </button>

          <button
            onClick={handleSyncToCfbos}
            disabled={syncingCfbos}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50"
          >
            {syncingCfbos ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Sync Monthly Utility to CFBOS
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Water Consumption</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">
              {(totalWaterConsumption / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-500">kL</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Power Consumption</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">
              {totalElectricityConsumption.toFixed(1)} <span className="text-xs font-normal text-slate-500">kWh</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Connected Meters</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">{meters.length} Active</div>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 ${
          leakAlertsCount > 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-slate-200"
        }`}>
          <div className={`p-3 rounded-xl ${leakAlertsCount > 0 ? "bg-red-100 text-red-600" : "bg-slate-50 text-slate-600"}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider">Leak / Tamper Alerts</div>
            <div className="text-xl font-bold mt-0.5">{leakAlertsCount} Detected</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedType("ALL")}
            className={`px-3.5 py-1.5 rounded-lg font-medium text-xs transition-colors ${
              selectedType === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Meters ({meters.length})
          </button>
          <button
            onClick={() => setSelectedType("WATER_METER")}
            className={`px-3.5 py-1.5 rounded-lg font-medium text-xs transition-colors ${
              selectedType === "WATER_METER" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            Water Meters
          </button>
          <button
            onClick={() => setSelectedType("ELECTRICITY_METER")}
            className={`px-3.5 py-1.5 rounded-lg font-medium text-xs transition-colors ${
              selectedType === "ELECTRICITY_METER" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Electricity Meters
          </button>
          <button
            onClick={() => setSelectedType("DIESEL_GENERATOR")}
            className={`px-3.5 py-1.5 rounded-lg font-medium text-xs transition-colors ${
              selectedType === "DIESEL_GENERATOR" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            DG Power
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-medium">Billing Cycle:</span>
          <input
            type="month"
            value={billingMonth}
            onChange={(e) => setBillingMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Smart Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMeters.map((meter) => (
          <div
            key={meter.id}
            className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 transition-all hover:shadow-md ${
              meter.leakDetected ? "border-red-300 ring-1 ring-red-300" : "border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  {getMeterIcon(meter.meterType)}
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{meter.unitNumber || "Common Area"}</h3>
                  <div className="text-xs text-slate-400 font-mono">{meter.meterSerialNumber}</div>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  meter.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {meter.status}
              </span>
            </div>

            {/* Reading Gauge */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Cumulative Reading</div>
                <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">
                  {meter.lastReading.toLocaleString()}
                  <span className="text-xs font-normal text-slate-500 ml-1">
                    {meter.meterType === "WATER_METER" ? "L" : "kWh"}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Protocol</div>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-xs rounded font-bold">
                  {meter.protocol}
                </span>
              </div>
            </div>

            {meter.leakDetected && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-semibold animate-pulse">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Continuous Water Leak Anomaly Detected!</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Battery className="w-3.5 h-3.5 text-emerald-500" />
                <span>{meter.batteryLevel ?? 100}% Battery</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{meter.lastTelemetryTime ? new Date(meter.lastTelemetryTime).toLocaleTimeString() : "Live"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pulse Simulator Modal */}
      {simModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-600" />
                Simulate Telemetry Pulse
              </h3>
              <button
                onClick={() => setSimModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Smart Meter</label>
                <select
                  value={simMeterSerial}
                  onChange={(e) => setSimMeterSerial(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-sm font-mono focus:outline-none focus:border-indigo-500"
                >
                  {meters.map((m) => (
                    <option key={m.id} value={m.meterSerialNumber}>
                      {m.meterSerialNumber} ({m.unitNumber || "Common"} - {m.meterType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Total Pulse Count</label>
                <input
                  type="number"
                  value={simPulses}
                  onChange={(e) => setSimPulses(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Instantaneous Flow / Power (kW or L/min)</label>
                <input
                  type="number"
                  step="0.1"
                  value={simInstantFlow}
                  onChange={(e) => setSimInstantFlow(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {simResult && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="font-semibold text-slate-700">Analysis Result:</div>
                <div className="text-slate-600">Delta Consumed: <strong className="font-mono">{simResult.deltaConsumed}</strong></div>
                <div className="text-slate-600">New Total: <strong className="font-mono">{simResult.cumulativeReading}</strong></div>
                {simResult.anomalyDetected && (
                  <div className="text-red-600 font-bold mt-1">⚠️ {simResult.alertMessage}</div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSimModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={handleSimulatePulse}
                disabled={simulating}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Transmit MQTT Pulse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
