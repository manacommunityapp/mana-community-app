import { apiClient } from "../common/apiClient";

export interface MorningRushScenario {
  societies: number;
  avgFlatsPerSociety: number;
  dailyEntriesPerFlat: number;
  morningConcentrationPct: number;
  windowHours: number;
  burstMultiplier: number;
  callsPerEntry: number;
  realTimeAlertPct: number;
  avgDevicesPerFlat: number;
  ttlSeconds: number;
  bytesPerSession: number;
  photoCapturePct: number;
  avgPhotoKb: number;
}

export interface MorningRushEstimate {
  totalFlats: number;
  dailyEntries: number;
  morningEntries: number;
  sustainedEntryQps: number;
  burstEntryQps: number;
  peakApiQps: number;
  burstPushFanoutQps: number;
  redisActiveSessionsAtBurst: number;
  redisMemoryGb: number;
  dailyS3GrowthTb: number;
  monthlyS3GrowthTb: number;
}

export interface BillingBlastScenario {
  totalInvoices: number;
  windowHours: number;
  slackHours: number;
  cpuMsPerPdf: number;
  wallMsPerInvoice: number;
  targetCpuUtilizationPct: number;
  avgPdfKb: number;
  batchedWriteOpsPerInvoice: number;
}

export interface BillingBlastEstimate {
  effectiveHours: number;
  sustainedInvoicesPerSec: number;
  targetInvoicesPerSec: number;
  estimatedDbWriteIops: number;
  requiredVcpus: number;
  recommendedWorkerConcurrency: number;
  recommendedKafkaPartitions: number;
  monthlyPdfStorageTb: number;
  deferPspApiToClick: boolean;
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

export function estimateMorningRushCapacity(req: MorningRushScenario): MorningRushEstimate {
  const totalFlats = req.societies * req.avgFlatsPerSociety;
  const dailyEntries = totalFlats * req.dailyEntriesPerFlat;
  const morningEntries = dailyEntries * (req.morningConcentrationPct / 100);
  const windowSec = req.windowHours * 3600;

  const sustainedEntryQps = morningEntries / windowSec;
  const burstEntryQps = sustainedEntryQps * req.burstMultiplier;
  const peakApiQps = burstEntryQps * req.callsPerEntry;
  const burstPushFanoutQps = burstEntryQps * (req.realTimeAlertPct / 100) * req.avgDevicesPerFlat;
  const redisActiveSessionsAtBurst = Math.round(burstEntryQps * req.ttlSeconds);
  const redisMemoryGb = (redisActiveSessionsAtBurst * req.bytesPerSession) / (1024 ** 3);
  const dailyS3GrowthTb = ((dailyEntries * (req.photoCapturePct / 100)) * req.avgPhotoKb) / 1e9;

  return {
    totalFlats,
    dailyEntries,
    morningEntries,
    sustainedEntryQps: round2(sustainedEntryQps),
    burstEntryQps: round2(burstEntryQps),
    peakApiQps: round2(peakApiQps),
    burstPushFanoutQps: round2(burstPushFanoutQps),
    redisActiveSessionsAtBurst,
    redisMemoryGb: round2(redisMemoryGb),
    dailyS3GrowthTb: round2(dailyS3GrowthTb),
    monthlyS3GrowthTb: round2(dailyS3GrowthTb * 30),
  };
}

export function estimateBillingBlastCapacity(req: BillingBlastScenario): BillingBlastEstimate {
  const effectiveHours = Math.max(0.5, req.windowHours - Math.max(0, req.slackHours));
  const sustainedInvoicesPerSec = req.totalInvoices / (req.windowHours * 3600);
  const targetInvoicesPerSec = req.totalInvoices / (effectiveHours * 3600);
  const estimatedDbWriteIops = targetInvoicesPerSec * req.batchedWriteOpsPerInvoice;
  const rawCores = targetInvoicesPerSec * (req.cpuMsPerPdf / 1000);
  const utilFraction = Math.max(0.2, Math.min(0.95, req.targetCpuUtilizationPct / 100));
  const requiredVcpus = Math.ceil(rawCores / utilFraction);
  const recommendedWorkerConcurrency = Math.ceil(targetInvoicesPerSec * (req.wallMsPerInvoice / 1000) * 2.5);

  let partitions = 1;
  while (partitions < Math.max(16, recommendedWorkerConcurrency)) partitions *= 2;

  return {
    effectiveHours: round2(effectiveHours),
    sustainedInvoicesPerSec: round2(sustainedInvoicesPerSec),
    targetInvoicesPerSec: round2(targetInvoicesPerSec),
    estimatedDbWriteIops: round2(estimatedDbWriteIops),
    requiredVcpus,
    recommendedWorkerConcurrency,
    recommendedKafkaPartitions: partitions,
    monthlyPdfStorageTb: round2((req.totalInvoices * req.avgPdfKb) / 1e9),
    deferPspApiToClick: true,
  };
}

export const capacityPlanningService = {
  fetchMorningRushEstimate(scenario: MorningRushScenario): Promise<MorningRushEstimate> {
    return apiClient.post<MorningRushEstimate>("/v1/capacity/morning-rush", scenario);
  },
  fetchBillingBlastEstimate(scenario: BillingBlastScenario): Promise<BillingBlastEstimate> {
    return apiClient.post<BillingBlastEstimate>("/v1/capacity/billing-blast", scenario);
  },
};
