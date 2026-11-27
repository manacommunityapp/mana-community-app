import axios from 'axios';

const API_BASE = '/api/architecture';

export interface Phase {
  number: number;
  name: string;
  duration: string;
  riskLevel: string;
  steps: string[];
  metrics: Record<string, unknown>;
}

export interface Risk {
  id: string;
  severity: string;
  description: string;
  mitigation: string;
}

export interface ExtractionPlan {
  sourceDomain: string;
  targetDomain: string;
  phases: Phase[];
  risks: Risk[];
  adrs: string[];
  estimatedEffort: string;
  totalWeeks: number;
  teamSize: number;
  context: Record<string, unknown>;
}

export interface LatencySimulation {
  extracted: boolean;
  gateRps: number;
  billingRps: number;
  dbConnections: number;
  gateP50Ms: number;
  gateP99Ms: number;
  connectionUtilizationPct: number;
  healthStatus: string;
  recommendation: string;
}

export interface Dimension {
  name: string;
  weight: number;
  buildScore: number;
  buyScore: number;
  rationale: string;
}

export interface CostBreakdown {
  option: string;
  monthlyCost: number;
  annualCost: number;
  setupCost: number;
  requiredEngineers: number;
}

export interface BuildVsBuyDecision {
  recommendation: string;
  buildTotalScore: number;
  buyTotalScore: number;
  dimensions: Dimension[];
  cpaasCost: CostBreakdown;
  inhouseCost: CostBreakdown;
  breakEvenPoint: string;
  hybridStrategy: string;
  context: Record<string, unknown>;
}

export interface UiConstraints {
  minTouchTargetPx: number;
  minFontSizePx: number;
  contrastMode: string;
  maxTapsPerAction: number;
  offlineFirst: boolean;
  shellDescription: string;
}

export interface Persona {
  id: string;
  name: string;
  requirements: string[];
  keyScreens: string[];
  constraints: UiConstraints;
}

export interface ArchitectureLayer {
  name: string;
  description: string;
  details: string[];
}

export interface Tradeoff {
  topic: string;
  optionA: string;
  optionB: string;
  recommendation: string;
}

export interface DesignSystemPlan {
  personas: Persona[];
  layers: ArchitectureLayer[];
  tradeoffs: Tradeoff[];
}

export interface PersonaApiAnalysis {
  persona: string;
  totalEndpoints: number;
  sharedEndpoints: number;
  personaSpecific: number;
  couplingLevel: string;
  couplingRatio: number;
  independentDeployScore: number;
  recommendations: string[];
}

// Strangler Extraction
export const generateExtractionPlan = (sourceDomain: string, targetDomain: string, sharedTables: string[],
  dailyTransactions: number, teamSize: number, featureFreezeAllowed: boolean) =>
  axios.post<ExtractionPlan>(`${API_BASE}/strangler/plan`, { sourceDomain, targetDomain, sharedTables, dailyTransactions, teamSize, featureFreezeAllowed }).then(r => r.data);

export const simulateLatency = (gateRequestsPerSec: number, billingCronQueriesPerSec: number,
  sharedDbConnections: number, extracted: boolean) =>
  axios.post<LatencySimulation>(`${API_BASE}/strangler/simulate`, { gateRequestsPerSec, billingCronQueriesPerSec, sharedDbConnections, extracted }).then(r => r.data);

// Build vs Buy
export const analyzeBuildVsBuy = (dailyCalls: number, avgCallDurationSec: number, engineeringTeamSize: number,
  traiDltRequired: boolean, targetLatencyMs: number) =>
  axios.post<BuildVsBuyDecision>(`${API_BASE}/build-vs-buy/analyze`, { dailyCalls, avgCallDurationSec, engineeringTeamSize, traiDltRequired, targetLatencyMs }).then(r => r.data);

// Persona Design System
export const getDesignSystemPlan = () =>
  axios.get<DesignSystemPlan>(`${API_BASE}/personas/plan`).then(r => r.data);

export const analyzeApi = (persona: string, totalEndpoints: number, sharedEndpoints: number, personaSpecific: number) =>
  axios.post<PersonaApiAnalysis>(`${API_BASE}/personas/api-analysis`, { persona, totalEndpoints, sharedEndpoints, personaSpecific }).then(r => r.data);
