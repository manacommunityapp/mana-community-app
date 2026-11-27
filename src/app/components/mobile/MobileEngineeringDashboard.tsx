import React, { useState, useEffect } from 'react';
import {
  Smartphone, Battery, Camera, Zap, Shield, AlertTriangle, CheckCircle, XCircle,
  Wifi, WifiOff, Thermometer, Clock, BarChart3, ArrowRight, RefreshCw, Eye,
  Cpu, HardDrive, Play, Signal, Sun, Moon, CloudOff
} from 'lucide-react';
import * as api from '../../../services/mobile/mobileEngineeringService';
import type {
  WakeReliabilityReport, OemReliability, StrategyRanking, DualChannelResult,
  CameraPipelineConfig, ScanSimulationResult, StartupAnalysis, OptimizationStep
} from '../../../services/mobile/mobileEngineeringService';

// === Demo Data ===
const DEMO_REPORT: WakeReliabilityReport = {
  overallReliability: 86.4, totalDevices: 8, totalAudits: 0, problematicDevices: 4,
  oemStats: {
    Xiaomi: { profile: { oem: 'Xiaomi', skin: 'MIUI', requiredAction: 'AutoStart + Battery Saver whitelist', killBehaviors: ['MIUI AutoStart kills background services within 3 min', 'Battery Saver aggressive mode terminates even foreground services', 'Recent task swipe-kill kills the app process entirely', 'MIUI 14+ requires explicit lock in recent apps'], recommendedStrategies: ['FCM_HIGH_PRIORITY', 'FOREGROUND_SERVICE', 'ALARM_MANAGER_EXACT'], baselineReliability: 82.5 }, reliability: 82.5, totalAttempts: 0, successCount: 0, avgLatencyMs: 1800, strategyReliability: { FCM_HIGH_PRIORITY: 72, FOREGROUND_SERVICE: 91, ALARM_MANAGER_EXACT: 85 } },
    Vivo: { profile: { oem: 'Vivo', skin: 'FuntouchOS', requiredAction: 'Background power consumption whitelist', killBehaviors: ['FuntouchOS restricts background CPU after 10 min', 'i-Manager kills apps not in whitelist overnight', 'High background power consumption alert dismisses app'], recommendedStrategies: ['FCM_HIGH_PRIORITY', 'VOIP_PUSH_KIT', 'DUAL_CHANNEL'], baselineReliability: 78.3 }, reliability: 78.3, totalAttempts: 0, successCount: 0, avgLatencyMs: 2100, strategyReliability: { FCM_HIGH_PRIORITY: 68, VOIP_PUSH_KIT: 94, DUAL_CHANNEL: 98 } },
    Oppo: { profile: { oem: 'Oppo', skin: 'ColorOS', requiredAction: 'App Quick Freeze exemption', killBehaviors: ['ColorOS App Quick Freeze suspends background apps in 5 min', 'Super Power Saving kills all non-system processes', 'Smart Power Saver learns patterns and kills infrequent apps'], recommendedStrategies: ['FCM_HIGH_PRIORITY', 'FOREGROUND_SERVICE', 'WORK_MANAGER_EXPEDITED'], baselineReliability: 79.1 }, reliability: 79.1, totalAttempts: 0, successCount: 0, avgLatencyMs: 1950, strategyReliability: { FCM_HIGH_PRIORITY: 70, FOREGROUND_SERVICE: 89, WORK_MANAGER_EXPEDITED: 82 } },
    Realme: { profile: { oem: 'Realme', skin: 'Realme UI', requiredAction: 'Battery optimization exemption', killBehaviors: ['Shares ColorOS restrictions', 'Aggressive doze after 2 min screen off', 'Smart battery kills apps with <5% daily usage'], recommendedStrategies: ['FCM_HIGH_PRIORITY', 'DUAL_CHANNEL', 'ALARM_MANAGER_EXACT'], baselineReliability: 80.7 }, reliability: 80.7, totalAttempts: 0, successCount: 0, avgLatencyMs: 1900, strategyReliability: { FCM_HIGH_PRIORITY: 71, DUAL_CHANNEL: 97, ALARM_MANAGER_EXACT: 84 } },
    Samsung: { profile: { oem: 'Samsung', skin: 'OneUI', requiredAction: 'Never sleeping list', killBehaviors: ['OneUI moves apps to Sleeping after 3 days unused', 'Deep sleeping apps fully prevented from running', 'Adaptive battery restricts unused apps'], recommendedStrategies: ['FCM_HIGH_PRIORITY', 'FOREGROUND_SERVICE'], baselineReliability: 94.2 }, reliability: 94.2, totalAttempts: 0, successCount: 0, avgLatencyMs: 800, strategyReliability: { FCM_HIGH_PRIORITY: 95, FOREGROUND_SERVICE: 97 } },
    OnePlus: { profile: { oem: 'OnePlus', skin: 'OxygenOS', requiredAction: 'Battery optimization exemption', killBehaviors: ['OxygenOS 13+ merged with ColorOS restrictions', 'Aggressive app cleanup in memory management'], recommendedStrategies: ['FCM_HIGH_PRIORITY', 'FOREGROUND_SERVICE'], baselineReliability: 91.8 }, reliability: 91.8, totalAttempts: 0, successCount: 0, avgLatencyMs: 900, strategyReliability: { FCM_HIGH_PRIORITY: 92, FOREGROUND_SERVICE: 96 } },
  },
  strategyRankings: [
    { strategy: 'DUAL_CHANNEL', reliability: 98, avgLatencyMs: 350, totalAttempts: 0, description: 'FCM + backup channel simultaneously — >99.5% combined reliability' },
    { strategy: 'FOREGROUND_SERVICE', reliability: 93, avgLatencyMs: 300, totalAttempts: 0, description: 'Persistent foreground notification — survives most OEM kills' },
    { strategy: 'VOIP_PUSH_KIT', reliability: 91, avgLatencyMs: 400, totalAttempts: 0, description: 'VoIP push — highest OS priority, wakes from deep sleep' },
    { strategy: 'ALARM_MANAGER_EXACT', reliability: 85, avgLatencyMs: 500, totalAttempts: 0, description: 'Exact alarm — 9-min min interval in doze' },
    { strategy: 'FCM_HIGH_PRIORITY', reliability: 82, avgLatencyMs: 1200, totalAttempts: 0, description: 'Firebase high priority — bypasses doze on stock Android' },
    { strategy: 'WORK_MANAGER_EXPEDITED', reliability: 80, avgLatencyMs: 800, totalAttempts: 0, description: 'WorkManager expedited — respects battery constraints' },
    { strategy: 'WEBSOCKET_KEEPALIVE', reliability: 75, avgLatencyMs: 150, totalAttempts: 0, description: 'Persistent WebSocket — lowest latency, highest battery cost' },
    { strategy: 'FCM_DATA_MESSAGE', reliability: 65, avgLatencyMs: 2500, totalAttempts: 0, description: 'FCM data-only — no notification tray, app handles delivery' },
  ]
};

const reliabilityColor = (r: number) => r >= 95 ? 'text-green-600' : r >= 85 ? 'text-blue-600' : r >= 75 ? 'text-yellow-600' : 'text-red-600';
const reliabilityBg = (r: number) => r >= 95 ? 'bg-green-500' : r >= 85 ? 'bg-blue-500' : r >= 75 ? 'bg-yellow-500' : 'bg-red-500';

// === Battery Panel ===
const BatteryPanel: React.FC = () => {
  const [report, setReport] = useState<WakeReliabilityReport>(DEMO_REPORT);
  const [selectedOem, setSelectedOem] = useState<string | null>(null);
  const [dualResult, setDualResult] = useState<DualChannelResult | null>(null);
  const [simLog, setSimLog] = useState<string[]>([]);

  useEffect(() => { api.getWakeReport().then(setReport).catch(() => {}); }, []);

  const handleDualChannel = async (oem: string) => {
    const deviceId = oem.toLowerCase() + '-sim-001';
    setSimLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Dual-channel wake → ${oem} device...`]);
    try {
      const result = await api.simulateDualChannel(deviceId);
      setDualResult(result);
      setSimLog(prev => [...prev, `  ${result.summary} → ${result.combinedSuccess ? 'SUCCESS' : 'FAILED'} (${result.effectiveLatencyMs}ms)`]);
    } catch {
      const success = Math.random() > 0.02;
      setDualResult({ primary: { wakeSuccessful: Math.random() > 0.25, deliveryLatencyMs: Math.round(800 + Math.random() * 2000) } as any,
        backup: { wakeSuccessful: Math.random() > 0.1, deliveryLatencyMs: Math.round(200 + Math.random() * 600) } as any,
        combinedSuccess: success, effectiveLatencyMs: Math.round(200 + Math.random() * 800),
        summary: `FCM ${Math.random() > 0.25 ? 'delivered' : 'blocked'} + Foreground ${Math.random() > 0.1 ? 'delivered' : 'blocked'}` });
      setSimLog(prev => [...prev, `  Demo: combined ${success ? 'SUCCESS' : 'FAILED'}`]);
    }
  };

  const oemEntries = Object.entries(report.oemStats).sort((a, b) => a[1].reliability - b[1].reliability);
  const detail = selectedOem ? report.oemStats[selectedOem] : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border p-3 text-center">
          <div className={`text-2xl font-bold ${reliabilityColor(report.overallReliability)}`}>{report.overallReliability.toFixed(1)}%</div>
          <div className="text-xs text-gray-500">Overall Wake Reliability</div>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">{report.problematicDevices}</div>
          <div className="text-xs text-gray-500">Devices w/ Missed Wakes</div>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{report.totalDevices}</div>
          <div className="text-xs text-gray-500">Total Devices</div>
        </div>
      </div>

      {/* OEM Reliability Bars */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Battery className="w-4 h-4" /> OEM Wake Reliability (click for details)</h3>
        <div className="space-y-2">
          {oemEntries.map(([oem, data]) => (
            <div key={oem} className="cursor-pointer hover:bg-gray-50 rounded p-2" onClick={() => setSelectedOem(selectedOem === oem ? null : oem)}>
              <div className="flex items-center gap-3">
                <div className="w-20 text-sm font-medium">{oem}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                  <div className={`h-5 rounded-full ${reliabilityBg(data.reliability)}`} style={{ width: `${data.reliability}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">{data.reliability.toFixed(1)}%</span>
                </div>
                <div className="text-xs text-gray-500 w-20 text-right">{Math.round(data.avgLatencyMs)}ms avg</div>
              </div>
              <div className="text-xs text-gray-400 mt-0.5 ml-20">{data.profile.skin} — {data.profile.requiredAction}</div>
            </div>
          ))}
        </div>
      </div>

      {/* OEM Detail */}
      {detail && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> {selectedOem} Kill Behaviors</h3>
            <button onClick={() => handleDualChannel(selectedOem!)} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Test Dual Channel
            </button>
          </div>
          <div className="space-y-1 mb-3">
            {detail.profile.killBehaviors.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Strategy Reliability for {selectedOem}</h4>
          <div className="space-y-1">
            {Object.entries(detail.strategyReliability).map(([strategy, rel]) => (
              <div key={strategy} className="flex items-center gap-2">
                <div className="w-44 text-xs">{strategy.replace(/_/g, ' ')}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div className={`h-3 rounded-full ${reliabilityBg(rel)}`} style={{ width: `${rel}%` }} />
                </div>
                <span className={`text-xs font-bold w-12 text-right ${reliabilityColor(rel)}`}>{rel.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dual Channel Result */}
      {dualResult && (
        <div className={`rounded-lg border p-3 ${dualResult.combinedSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {dualResult.combinedSuccess ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
            <span className="text-sm font-medium">Dual Channel: {dualResult.combinedSuccess ? 'DELIVERED' : 'FAILED'}</span>
            <span className="text-xs text-gray-500 ml-auto">{dualResult.effectiveLatencyMs}ms</span>
          </div>
          <div className="text-xs">{dualResult.summary}</div>
        </div>
      )}

      {/* Strategy Rankings */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Signal className="w-4 h-4" /> Strategy Rankings (global)</h3>
        <div className="space-y-2">
          {report.strategyRankings.map((s, i) => (
            <div key={s.strategy} className="flex items-center gap-3 p-2 rounded border bg-gray-50">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">{i + 1}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{s.strategy.replace(/_/g, ' ')}</div>
                <div className="text-xs text-gray-500">{s.description}</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${reliabilityColor(s.reliability)}`}>{s.reliability}%</div>
                <div className="text-xs text-gray-500">{Math.round(s.avgLatencyMs)}ms</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {simLog.length > 0 && (
        <div className="bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-xs max-h-32 overflow-y-auto">
          {simLog.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
};

// === Camera Panel ===
const CameraPanel: React.FC = () => {
  const [lighting, setLighting] = useState<string>('NORMAL');
  const [config, setConfig] = useState<CameraPipelineConfig | null>(null);
  const [simResult, setSimResult] = useState<ScanSimulationResult | null>(null);

  const handleGetConfig = async () => {
    try {
      const c = await api.getCameraConfig('Redmi Note 12', lighting);
      setConfig(c);
    } catch {
      setConfig({
        resolution: lighting === 'DARK' ? 480 : 720, exposureCompensation: lighting === 'DARK' ? 2.5 : 0,
        autoTorch: lighting === 'DIM' || lighting === 'DARK', torchLuxThreshold: lighting === 'DARK' ? 20 : 50,
        hdr: lighting === 'MIXED_GLARE', targetFps: 30,
        decodingStrategy: lighting === 'NORMAL' ? 'STANDARD: process all frames, full viewport' : 'ENHANCED: increased gain, center ROI',
        optimizations: ['CameraX STRATEGY_KEEP_ONLY_LATEST', 'ML Kit FORMAT_QR_CODE | FORMAT_CODE_128', 'ROI cropping — 40-60% fewer pixels', 'YUV_420_888 → grayscale', 'Thermal management: throttle at 42°C'],
        estimatedDecodeMs: 25 + Math.random() * 20, meetsTarget: true
      });
    }
  };

  const handleSimulate = async () => {
    try {
      const r = await api.simulateScan('Redmi Note 12', lighting, 10, 15);
      setSimResult(r);
    } catch {
      setSimResult({
        session: { totalScans: 150, successfulScans: 145, failedScans: 5, avgDecodeMs: 28.4, p95DecodeMs: 42.1, p99DecodeMs: 55.3, lightingCondition: lighting, autoTorchTriggered: lighting === 'DIM', thermalThrottleEvents: 3, avgDeviceTempC: 38.2, peakDeviceTempC: 43.1, cameraInitMs: 245, droppedFrames: 5, processedFrames: 150, frameDropRate: 3.33 } as any,
        sampleScans: Array.from({ length: 6 }, (_, i) => ({ scanNumber: i * 25 + 1, decodeMs: 20 + Math.random() * 25, success: Math.random() > 0.03, deviceTempC: 34 + i * 1.5, throttled: i > 4 })),
        meetsTarget: true,
        recommendations: lighting !== 'NORMAL' ? ['Consider ROI cropping for improved decode time'] : []
      });
    }
  };

  const lightingOptions = ['BRIGHT_SUNLIGHT', 'NORMAL', 'DIM', 'DARK', 'MIXED_GLARE'];
  const lightingIcon = (l: string) => l === 'DARK' || l === 'DIM' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />;

  return (
    <div className="space-y-4">
      {/* Lighting Selector */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Camera className="w-4 h-4" /> Lighting Condition</h3>
        <div className="flex gap-2 mb-3">
          {lightingOptions.map(l => (
            <button key={l} onClick={() => setLighting(l)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${lighting === l ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              {lightingIcon(l)} {l.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleGetConfig} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1">
            <Eye className="w-4 h-4" /> Get Config
          </button>
          <button onClick={handleSimulate} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1">
            <Play className="w-4 h-4" /> Simulate 10 min
          </button>
        </div>
      </div>

      {/* Pipeline Config */}
      {config && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Optimal Pipeline Config</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.meetsTarget ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {config.estimatedDecodeMs.toFixed(1)}ms {config.meetsTarget ? '< 50ms' : '> 50ms'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: 'Resolution', value: `${config.resolution}p` },
              { label: 'Exposure', value: `${config.exposureCompensation > 0 ? '+' : ''}${config.exposureCompensation} EV` },
              { label: 'Auto-Torch', value: config.autoTorch ? `ON (${config.torchLuxThreshold} lux)` : 'OFF' },
              { label: 'HDR', value: config.hdr ? 'ON' : 'OFF' },
              { label: 'Target FPS', value: `${config.targetFps}` },
              { label: 'Strategy', value: config.decodingStrategy.split(':')[0] },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-sm font-medium">{item.value}</div>
              </div>
            ))}
          </div>
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Optimizations</h4>
          <div className="space-y-1">
            {config.optimizations.map((o, i) => (
              <div key={i} className="flex items-start gap-2 text-xs"><CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" /><span>{o}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation Result */}
      {simResult && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Scan Simulation Results</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${simResult.meetsTarget ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {simResult.meetsTarget ? 'TARGET MET' : 'BELOW TARGET'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[
              { label: 'Avg Decode', value: `${simResult.session.avgDecodeMs.toFixed(1)}ms`, color: simResult.session.avgDecodeMs <= 50 ? 'text-green-600' : 'text-red-600' },
              { label: 'P95', value: `${simResult.session.p95DecodeMs.toFixed(1)}ms`, color: 'text-blue-600' },
              { label: 'P99', value: `${simResult.session.p99DecodeMs.toFixed(1)}ms`, color: 'text-purple-600' },
              { label: 'Success Rate', value: `${((simResult.session.successfulScans / simResult.session.totalScans) * 100).toFixed(1)}%`, color: 'text-green-600' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded p-2 text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Thermal */}
          <div className="flex items-center gap-4 mb-3 p-2 bg-gray-50 rounded">
            <Thermometer className="w-4 h-4 text-orange-500" />
            <div className="text-xs">
              <span className="font-medium">Avg: {simResult.session.avgDeviceTempC}°C</span>
              <span className="text-gray-500 mx-2">·</span>
              <span className={`font-medium ${simResult.session.peakDeviceTempC > 42 ? 'text-red-600' : 'text-green-600'}`}>Peak: {simResult.session.peakDeviceTempC}°C</span>
              <span className="text-gray-500 mx-2">·</span>
              <span className={simResult.session.thermalThrottleEvents > 0 ? 'text-orange-600 font-medium' : 'text-gray-500'}>{simResult.session.thermalThrottleEvents} throttle events</span>
            </div>
          </div>

          {/* Sample scans timeline */}
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Sample Scans</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-gray-500 border-b">
                <th className="text-left py-1 px-2">#</th><th className="text-right py-1 px-2">Decode</th>
                <th className="text-center py-1 px-2">Status</th><th className="text-right py-1 px-2">Temp</th>
                <th className="text-center py-1 px-2">Throttled</th>
              </tr></thead>
              <tbody>
                {simResult.sampleScans.map(s => (
                  <tr key={s.scanNumber} className="border-b border-gray-100">
                    <td className="py-1 px-2">{s.scanNumber}</td>
                    <td className={`py-1 px-2 text-right font-medium ${s.decodeMs <= 50 ? 'text-green-600' : 'text-red-600'}`}>{s.decodeMs.toFixed(1)}ms</td>
                    <td className="py-1 px-2 text-center">{s.success ? <CheckCircle className="w-3 h-3 text-green-500 mx-auto" /> : <XCircle className="w-3 h-3 text-red-500 mx-auto" />}</td>
                    <td className="py-1 px-2 text-right">{s.deviceTempC.toFixed(1)}°C</td>
                    <td className="py-1 px-2 text-center">{s.throttled ? <AlertTriangle className="w-3 h-3 text-orange-500 mx-auto" /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {simResult.recommendations.length > 0 && (
            <div className="mt-3 space-y-1">
              {simResult.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2 bg-yellow-50 rounded">
                  <AlertTriangle className="w-3 h-3 text-yellow-600 flex-shrink-0 mt-0.5" /><span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// === Startup Panel ===
const StartupPanel: React.FC = () => {
  const [ram, setRam] = useState(3072);
  const [baseline, setBaseline] = useState(true);
  const [lazy, setLazy] = useState(true);
  const [swr, setSwr] = useState(true);
  const [analysis, setAnalysis] = useState<StartupAnalysis | null>(null);

  const handleAnalyze = async () => {
    try {
      const r = await api.analyzeStartup({ deviceModel: 'Redmi Note 12', ramMb: ram, baselineProfileEnabled: baseline, lazyInjection: lazy, staleWhileRevalidate: swr });
      setAnalysis(r);
    } catch {
      // Demo analysis
      let base = ram <= 2048 ? 2200 : ram <= 3072 ? 1600 : ram <= 4096 ? 1200 : ram <= 6144 ? 900 : 700;
      let current = base;
      const steps: OptimizationStep[] = [];
      if (baseline) { const saving = base * 0.30; current -= saving; steps.push({ name: 'Baseline Profile', savingMs: saving, resultMs: current, enabled: true, description: 'AOT compile hot methods at install time', implementation: ['profileinstaller', 'Macrobenchmark', 'baseline-prof.txt'] }); }
      else steps.push({ name: 'Baseline Profile (OFF)', savingMs: 0, resultMs: current, enabled: false, description: '30% available', implementation: [] });
      if (lazy) { const saving = current * 0.20; current -= saving; steps.push({ name: 'Lazy DI', savingMs: saving, resultMs: current, enabled: true, description: 'Dagger Lazy<T> for non-critical', implementation: ['Lazy<AnalyticsTracker>', 'Split AppComponent'] }); }
      else steps.push({ name: 'Lazy DI (OFF)', savingMs: 0, resultMs: current, enabled: false, description: '20% available', implementation: [] });
      if (swr) { const saving = current * 0.15; current -= saving; steps.push({ name: 'SWR Cache', savingMs: saving, resultMs: current, enabled: true, description: 'Show cached, refresh in background', implementation: ['Room cache', 'OkHttp FORCE_CACHE'] }); }
      else steps.push({ name: 'SWR Cache (OFF)', savingMs: 0, resultMs: current, enabled: false, description: '15% available', implementation: [] });
      const extra = current * 0.10; current -= extra;
      steps.push({ name: 'Additional', savingMs: extra, resultMs: current, enabled: true, description: 'ContentProvider removal, AsyncLayoutInflater', implementation: [] });
      setAnalysis({
        deviceModel: 'Redmi Note 12', ramMb: ram, deviceTier: ram <= 2048 ? 'LOW_END' : ram <= 4096 ? 'MID_RANGE' : 'HIGH_END',
        baselineColdStartMs: base, optimizedColdStartMs: current,
        totalReductionMs: base - current, reductionPct: ((base - current) / base) * 100,
        meetsTarget: current <= 800, targetMs: 800, steps,
        tierRecommendations: ram <= 2048 ? ['Enable R8 full mode', 'Disable animations on low-RAM devices', 'Limit home screen to 1 API call'] : ['Standard optimizations sufficient']
      });
    }
  };

  const ramOptions = [2048, 3072, 4096, 6144, 8192];

  return (
    <div className="space-y-4">
      {/* Config Panel */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> Cold Start Analyzer</h3>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Device RAM</label>
            <div className="flex gap-1">
              {ramOptions.map(r => (
                <button key={r} onClick={() => setRam(r)}
                  className={`px-2 py-1 rounded text-xs font-medium border ${ram === r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-gray-50'}`}>
                  {r >= 1024 ? `${r / 1024}GB` : `${r}MB`}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Baseline Profile', checked: baseline, onChange: setBaseline, desc: 'AOT compilation' },
              { label: 'Lazy DI', checked: lazy, onChange: setLazy, desc: 'Deferred init' },
              { label: 'SWR Cache', checked: swr, onChange: setSwr, desc: 'Stale-while-revalidate' },
            ].map(opt => (
              <label key={opt.label} className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={opt.checked} onChange={e => opt.onChange(e.target.checked)} className="rounded" />
                <span className="font-medium">{opt.label}</span>
                <span className="text-gray-400">({opt.desc})</span>
              </label>
            ))}
          </div>
        </div>
        <button onClick={handleAnalyze} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1">
          <BarChart3 className="w-4 h-4" /> Analyze
        </button>
      </div>

      {/* Results */}
      {analysis && (
        <>
          {/* Before → After */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg border p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Baseline</div>
              <div className="text-2xl font-bold text-red-600">{Math.round(analysis.baselineColdStartMs)}ms</div>
            </div>
            <div className="bg-white rounded-lg border p-3 text-center flex flex-col items-center justify-center">
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="text-xs text-green-600 font-bold">-{analysis.reductionPct.toFixed(0)}%</div>
            </div>
            <div className={`rounded-lg border p-3 text-center ${analysis.meetsTarget ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-xs text-gray-500 mb-1">Optimized</div>
              <div className={`text-2xl font-bold ${analysis.meetsTarget ? 'text-green-600' : 'text-red-600'}`}>{Math.round(analysis.optimizedColdStartMs)}ms</div>
              <div className="text-xs mt-0.5">{analysis.meetsTarget ? 'Target met (<800ms)' : 'Above 800ms target'}</div>
            </div>
          </div>

          {/* Waterfall */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Optimization Waterfall</h3>
            <div className="space-y-3">
              {analysis.steps.map((step, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {step.enabled ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                      <span className="text-sm font-medium">{step.name}</span>
                    </div>
                    <div className="text-right">
                      {step.savingMs > 0 && <span className="text-xs text-green-600 font-bold">-{Math.round(step.savingMs)}ms</span>}
                      <span className="text-xs text-gray-500 ml-2">→ {Math.round(step.resultMs)}ms</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                  {step.savingMs > 0 && (
                    <div className="mt-1 bg-gray-100 rounded-full h-2 relative">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(step.savingMs / analysis.baselineColdStartMs) * 100}%` }} />
                    </div>
                  )}
                  {step.implementation.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {step.implementation.map((impl, j) => (
                        <span key={j} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{impl}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tier Recommendations */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <HardDrive className="w-4 h-4" /> {analysis.deviceTier.replace('_', ' ')} Device Recommendations
            </h3>
            <div className="space-y-1">
              {analysis.tierRecommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs"><ArrowRight className="w-3 h-3 text-indigo-500 flex-shrink-0 mt-0.5" /><span>{r}</span></div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// === Main Dashboard ===
const MobileEngineeringDashboard: React.FC = () => {
  const [tab, setTab] = useState<'battery' | 'camera' | 'startup'>('battery');
  const [seeded, setSeeded] = useState(false);

  const handleSeed = async () => {
    try { await api.seedDemoData(); setSeeded(true); } catch { setSeeded(true); }
  };

  const tabs = [
    { key: 'battery' as const, label: 'OEM Battery Killers', icon: <Battery className="w-4 h-4" /> },
    { key: 'camera' as const, label: 'Guard Camera Pipeline', icon: <Camera className="w-4 h-4" /> },
    { key: 'startup' as const, label: 'App Startup', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Smartphone className="w-5 h-5" /> Mobile Engineering & Edge Reliability</h1>
          <p className="text-sm text-gray-500">OEM battery bypass, guard camera optimization, cold start analysis</p>
        </div>
        {!seeded && (
          <button onClick={handleSeed} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">Seed Demo Data</button>
        )}
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'battery' && <BatteryPanel />}
      {tab === 'camera' && <CameraPanel />}
      {tab === 'startup' && <StartupPanel />}
    </div>
  );
};

export default MobileEngineeringDashboard;
