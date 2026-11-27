import axios from 'axios';

const API_BASE = '/api/mobile-engineering';

// === Device Telemetry ===
export interface DeviceTelemetry {
  id: number; userId: number; deviceId: string; oem: string; model: string;
  osVersion: string; appVersion: string; role: string;
  batteryPct: number; batteryOptimizationExempt: boolean; autoStartEnabled: boolean;
  backgroundRestrictionLevel: string; fcmTokenValid: boolean; fcmDeliveryChannel: string;
  lastFcmLatencyMs: number; coldStartMs: number; warmStartMs: number;
  dexClassCount: number; baselineProfileCoverage: number; lazyInjectionEnabled: boolean;
  avgFrameProcessMs: number; qrScansPerMinute: number; autoTorchCalibrated: boolean;
  cameraInitMs: number; thermalThrottleEvents: number;
  lastHeartbeat: string; lastWakeUpSuccess: string;
  missedWakeUps: number; totalWakeAttempts: number;
}

// === Battery Types ===
export interface OemProfile {
  oem: string; skin: string; requiredAction: string;
  killBehaviors: string[]; recommendedStrategies: string[]; baselineReliability: number;
}
export interface OemReliability {
  profile: OemProfile; reliability: number; totalAttempts: number; successCount: number;
  avgLatencyMs: number; strategyReliability: Record<string, number>;
}
export interface StrategyRanking {
  strategy: string; reliability: number; avgLatencyMs: number;
  totalAttempts: number; description: string;
}
export interface WakeReliabilityReport {
  overallReliability: number; oemStats: Record<string, OemReliability>;
  strategyRankings: StrategyRanking[];
  totalDevices: number; totalAudits: number; problematicDevices: number;
}
export interface WakeUpAudit {
  id: number; deviceId: string; oem: string; model: string;
  strategy: string; deliveryLatencyMs: number; wakeSuccessful: boolean;
  failureReason: string; pushPriority: string;
  foregroundServiceActive: boolean; voipPushUsed: boolean; retryAttempts: number;
}
export interface DualChannelResult {
  primary: WakeUpAudit; backup: WakeUpAudit;
  combinedSuccess: boolean; effectiveLatencyMs: number; summary: string;
}

// === Camera Types ===
export interface CameraPipelineConfig {
  resolution: number; exposureCompensation: number; autoTorch: boolean;
  torchLuxThreshold: number; hdr: boolean; targetFps: number;
  decodingStrategy: string; optimizations: string[];
  estimatedDecodeMs: number; meetsTarget: boolean;
}
export interface ScanResult {
  scanNumber: number; decodeMs: number; success: boolean;
  deviceTempC: number; throttled: boolean;
}
export interface ScanSession {
  id: number; totalScans: number; successfulScans: number; failedScans: number;
  avgDecodeMs: number; p95DecodeMs: number; p99DecodeMs: number;
  lightingCondition: string; autoTorchTriggered: boolean;
  thermalThrottleEvents: number; avgDeviceTempC: number; peakDeviceTempC: number;
  cameraInitMs: number; droppedFrames: number; processedFrames: number; frameDropRate: number;
}
export interface ScanSimulationResult {
  session: ScanSession; sampleScans: ScanResult[];
  meetsTarget: boolean; recommendations: string[];
}
export interface ScanPerformanceSummary {
  overallAvgDecodeMs: number; overallP95DecodeMs: number; totalThermalThrottles: number;
  avgByLighting: Record<string, number>; totalSessions: number; targetMetPct: number; targetMs: number;
}

// === Startup Types ===
export interface OptimizationStep {
  name: string; savingMs: number; resultMs: number; enabled: boolean;
  description: string; implementation: string[];
}
export interface StartupAnalysis {
  deviceModel: string; ramMb: number; deviceTier: string;
  baselineColdStartMs: number; optimizedColdStartMs: number;
  totalReductionMs: number; reductionPct: number; meetsTarget: boolean;
  targetMs: number; steps: OptimizationStep[]; tierRecommendations: string[];
}
export interface StartupFleetSummary {
  avgColdStartMs: number; targetMetPct: number; targetMs: number;
  avgByOem: Record<string, number>; devicesByTier: Record<string, number>;
  totalDevices: number; baselineProfileEnabled: number; lazyInjectionEnabled: number; slowDevices: number;
}

// === API Calls ===
export const seedDemoData = () => axios.post<string>(`${API_BASE}/seed`).then(r => r.data);

export const getWakeReport = () => axios.get<WakeReliabilityReport>(`${API_BASE}/battery/report`).then(r => r.data);
export const simulateWakeUp = (deviceId: string, strategy: string) =>
  axios.post<WakeUpAudit>(`${API_BASE}/battery/simulate-wake`, null, { params: { deviceId, strategy } }).then(r => r.data);
export const simulateDualChannel = (deviceId: string) =>
  axios.post<DualChannelResult>(`${API_BASE}/battery/dual-channel`, null, { params: { deviceId } }).then(r => r.data);

export const getCameraConfig = (deviceModel?: string, lighting?: string) =>
  axios.get<CameraPipelineConfig>(`${API_BASE}/camera/config`, { params: { deviceModel, lighting } }).then(r => r.data);
export const simulateScan = (deviceModel: string, lighting: string, durationMinutes: number, scansPerMinute: number) =>
  axios.post<ScanSimulationResult>(`${API_BASE}/camera/simulate`, null, { params: { deviceModel, lighting, durationMinutes, scansPerMinute } }).then(r => r.data);
export const getCameraSummary = () => axios.get<ScanPerformanceSummary>(`${API_BASE}/camera/summary`).then(r => r.data);

export const analyzeStartup = (req: { deviceModel: string; ramMb: number; baselineProfileEnabled: boolean; lazyInjection: boolean; staleWhileRevalidate: boolean }) =>
  axios.post<StartupAnalysis>(`${API_BASE}/startup/analyze`, req).then(r => r.data);
export const getFleetSummary = () => axios.get<StartupFleetSummary>(`${API_BASE}/startup/fleet`).then(r => r.data);
