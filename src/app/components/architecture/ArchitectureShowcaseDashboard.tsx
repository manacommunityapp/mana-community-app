import React, { useState } from 'react';
import {
  Layers, GitBranch, Phone, Users, Play, AlertTriangle, CheckCircle,
  ArrowRight, Gauge, DollarSign, Shield, Monitor, Smartphone, Table2,
  Zap, ChevronRight, Server, Database, Globe, Lock
} from 'lucide-react';
import type {
  ExtractionPlan, LatencySimulation, BuildVsBuyDecision, DesignSystemPlan, PersonaApiAnalysis
} from '../../../services/architecture/architectureShowcaseService';
import * as api from '../../../services/architecture/architectureShowcaseService';

type Tab = 'strangler' | 'buildvsbuy' | 'personas';

export function ArchitectureShowcaseDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('strangler');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'strangler', label: 'Monolith→Microservices', icon: <GitBranch size={18} /> },
    { key: 'buildvsbuy', label: 'Build vs Buy (VoIP)', icon: <Phone size={18} /> },
    { key: 'personas', label: 'Persona Design System', icon: <Users size={18} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="text-violet-600" size={28} />
          Engineering Leadership & Architectural Trade-Offs
        </h1>
        <p className="text-gray-500 mt-1">Strangler fig extraction, build-vs-buy analysis, multi-persona design system</p>
      </div>
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>{tab.icon} {tab.label}</button>
        ))}
      </div>
      {activeTab === 'strangler' && <StranglerPanel />}
      {activeTab === 'buildvsbuy' && <BuildVsBuyPanel />}
      {activeTab === 'personas' && <PersonaPanel />}
    </div>
  );
}

function StranglerPanel() {
  const [plan, setPlan] = useState<ExtractionPlan | null>(null);
  const [simBefore, setSimBefore] = useState<LatencySimulation | null>(null);
  const [simAfter, setSimAfter] = useState<LatencySimulation | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const p = await api.generateExtractionPlan('gate-billing-monolith', 'billing-service',
        ['community_flat', 'billing_cycle', 'payment_ledger', 'gate_entry_log'], 250000, 6, false);
      setPlan(p);
      const [before, after] = await Promise.all([
        api.simulateLatency(500, 200, 50, false),
        api.simulateLatency(500, 200, 50, true),
      ]);
      setSimBefore(before); setSimAfter(after);
    } catch {
      setPlan(demoPlan); setSimBefore(demoSimBefore); setSimAfter(demoSimAfter);
    }
    setLoading(false);
  };

  const riskColors: Record<string, string> = { LOW: 'bg-green-100 text-green-800', MEDIUM: 'bg-amber-100 text-amber-800', HIGH: 'bg-red-100 text-red-800' };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><GitBranch size={20} className="text-violet-600" /> Strangler Fig Extraction Plan</h3>
        <p className="text-sm text-gray-500 mb-4">Gate approvals and billing share a coupled DB. Billing cron spikes impact gate latency. Extract billing into an independent service without halting feature development.</p>
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600 grid grid-cols-4 gap-3">
          <div><span className="font-medium">Shared tables:</span> community_flat, billing_cycle, payment_ledger, gate_entry_log</div>
          <div><span className="font-medium">Daily txns:</span> 250,000</div>
          <div><span className="font-medium">Team:</span> 6 engineers</div>
          <div><span className="font-medium">Feature freeze:</span> Not allowed</div>
        </div>
        <button onClick={handleGenerate} disabled={loading}
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2">
          <Play size={16} /> Generate Extraction Plan
        </button>
      </div>

      {plan && (
        <>
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Phased Extraction ({plan.estimatedEffort})</h3>
              <span className="font-mono text-sm bg-violet-100 text-violet-700 px-3 py-1 rounded">{plan.totalWeeks} weeks total</span>
            </div>
            <div className="space-y-4">
              {plan.phases.map(phase => (
                <div key={phase.number} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center font-bold">{phase.number}</div>
                      <span className="font-medium text-sm">{phase.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{phase.duration}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${riskColors[phase.riskLevel]}`}>Risk: {phase.riskLevel}</span>
                    </div>
                  </div>
                  <ul className="space-y-1 ml-9">
                    {phase.steps.map((s, i) => <li key={i} className="text-xs text-gray-600 flex items-start gap-1"><ChevronRight size={12} className="mt-0.5 text-violet-400 shrink-0" />{s}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {simBefore && simAfter && (
            <div className="grid grid-cols-2 gap-4">
              <LatencyCard title="Before Extraction (Coupled)" sim={simBefore} />
              <LatencyCard title="After Extraction (Decoupled)" sim={simAfter} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1"><AlertTriangle size={14} /> Risk Register</h3>
              <div className="space-y-2">
                {plan.risks.map((r, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">{r.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${riskColors[r.severity]}`}>{r.severity}</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{r.description}</p>
                    <p className="text-xs text-green-700"><Shield size={10} className="inline" /> {r.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Architecture Decision Records</h3>
              <div className="space-y-2">
                {plan.adrs.map((adr, i) => (
                  <div key={i} className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2 flex items-start gap-2">
                    <CheckCircle size={14} className="text-violet-500 mt-0.5 shrink-0" />{adr}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LatencyCard({ title, sim }: { title: string; sim: LatencySimulation }) {
  const statusColors: Record<string, string> = { HEALTHY: 'bg-green-100 text-green-800', DEGRADED: 'bg-amber-100 text-amber-800', CRITICAL: 'bg-red-100 text-red-800' };
  return (
    <div className={`rounded-xl border shadow-sm p-4 ${sim.extracted ? 'bg-green-50' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold">{title}</span>
        <span className={`text-xs px-2 py-0.5 rounded font-bold ${statusColors[sim.healthStatus]}`}>{sim.healthStatus}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center"><div className="text-xl font-bold text-gray-900">{sim.gateP50Ms}ms</div><div className="text-[10px] text-gray-500">Gate p50</div></div>
        <div className="text-center"><div className={`text-xl font-bold ${sim.gateP99Ms > 100 ? 'text-red-600' : 'text-green-600'}`}>{sim.gateP99Ms}ms</div><div className="text-[10px] text-gray-500">Gate p99</div></div>
        <div className="text-center"><div className="text-xl font-bold">{sim.connectionUtilizationPct.toFixed(0)}%</div><div className="text-[10px] text-gray-500">DB Pool Usage</div></div>
        <div className="text-center"><div className="text-xl font-bold">{sim.gateRps + sim.billingRps}</div><div className="text-[10px] text-gray-500">Total RPS</div></div>
      </div>
      <div className="mt-2 text-[10px] text-gray-500">{sim.recommendation}</div>
    </div>
  );
}

function BuildVsBuyPanel() {
  const [decision, setDecision] = useState<BuildVsBuyDecision | null>(null);
  const [dailyCalls, setDailyCalls] = useState(2000000);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const r = await api.analyzeBuildVsBuy(dailyCalls, 45, 8, true, 150);
      setDecision(r);
    } catch {
      setDecision(demoDecision(dailyCalls));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Phone size={20} className="text-violet-600" /> WebRTC/VoIP: Build vs Buy Analysis</h3>
        <p className="text-sm text-gray-500 mb-4">Should Mygate build in-house WebRTC signaling or use CPaaS (Twilio/Exotel)? Analyzing unit economics, TRAI DLT compliance, and latency at scale.</p>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-gray-600">Daily calls:</label>
          <input type="range" min="100000" max="5000000" step="100000" value={dailyCalls}
            onChange={e => setDailyCalls(Number(e.target.value))} className="w-64" />
          <span className="font-mono text-sm bg-violet-100 text-violet-700 px-2 py-1 rounded">{(dailyCalls / 1000000).toFixed(1)}M/day</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600 grid grid-cols-4 gap-3">
          <div><span className="font-medium">Avg duration:</span> 45 sec</div>
          <div><span className="font-medium">Team:</span> 8 engineers</div>
          <div><span className="font-medium">TRAI DLT:</span> Required</div>
          <div><span className="font-medium">Target latency:</span> &lt;150ms</div>
        </div>
        <button onClick={handleAnalyze} disabled={loading}
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2">
          <Play size={16} /> Run Analysis
        </button>
      </div>

      {decision && (
        <>
          <div className={`rounded-xl border-2 shadow-sm p-6 ${decision.recommendation === 'BUILD' ? 'bg-blue-50 border-blue-300' : 'bg-green-50 border-green-300'}`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-2xl font-bold">{decision.recommendation === 'BUILD' ? 'BUILD In-House' : 'BUY CPaaS'}</div>
                <div className="text-sm text-gray-600">{decision.hybridStrategy}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">Build: <span className="font-bold text-blue-700">{decision.buildTotalScore}/10</span></div>
                <div className="text-sm">Buy: <span className="font-bold text-green-700">{decision.buyTotalScore}/10</span></div>
                <div className="text-xs text-gray-500 mt-1">Break-even: {decision.breakEvenPoint}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-4">Decision Matrix (Weighted Scoring)</h3>
            <div className="space-y-3">
              {decision.dimensions.map((d, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{d.name} <span className="text-gray-400">({d.weight}%)</span></span>
                    <div className="flex gap-3 text-xs">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Build: {d.buildScore}/10</span>
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Buy: {d.buyScore}/10</span>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-1">
                    <div className="h-2 bg-blue-400 rounded-l" style={{ width: `${d.buildScore * 10}%` }} />
                    <div className="h-2 bg-green-400 rounded-r" style={{ width: `${d.buyScore * 10}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-500">{d.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CostCard cost={decision.cpaasCost} color="green" icon={<Globe />} />
            <CostCard cost={decision.inhouseCost} color="blue" icon={<Server />} />
          </div>
        </>
      )}
    </div>
  );
}

function CostCard({ cost, color, icon }: { cost: CostBreakdown; color: string; icon: React.ReactNode }) {
  const c = color === 'green' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200';
  return (
    <div className={`rounded-xl border shadow-sm p-4 ${c}`}>
      <div className="flex items-center gap-2 mb-3 font-semibold text-sm">{icon} {cost.option}</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-gray-500">Monthly:</span> <span className="font-bold">₹{(cost.monthlyCost / 100000).toFixed(1)}L</span></div>
        <div><span className="text-gray-500">Annual:</span> <span className="font-bold">₹{(cost.annualCost / 10000000).toFixed(1)}Cr</span></div>
        <div><span className="text-gray-500">Setup:</span> <span className="font-bold">₹{(cost.setupCost / 100000).toFixed(1)}L</span></div>
        {cost.requiredEngineers > 0 && <div><span className="text-gray-500">Engineers:</span> <span className="font-bold">{cost.requiredEngineers}</span></div>}
      </div>
    </div>
  );
}

function PersonaPanel() {
  const [plan, setPlan] = useState<DesignSystemPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    try { setPlan(await api.getDesignSystemPlan()); }
    catch { setPlan(demoDSPlan); }
    setLoading(false);
  };

  const personaIcons: Record<string, React.ReactNode> = {
    GUARD: <Shield size={20} className="text-orange-600" />,
    RESIDENT: <Smartphone size={20} className="text-blue-600" />,
    MC_TREASURER: <Table2 size={20} className="text-green-700" />,
  };
  const personaColors: Record<string, string> = {
    GUARD: 'border-orange-300 bg-orange-50',
    RESIDENT: 'border-blue-300 bg-blue-50',
    MC_TREASURER: 'border-green-300 bg-green-50',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Users size={20} className="text-violet-600" /> Multi-Persona Design System</h3>
        <p className="text-sm text-gray-500 mb-4">Guards need 2-tap high-contrast; residents want consumer-grade UX; treasurers demand dense Tally-like tables. How to serve all without coupling.</p>
        <button onClick={handleLoad} disabled={loading}
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2">
          <Play size={16} /> Load Design System Plan
        </button>
      </div>

      {plan && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plan.personas.map(p => (
              <div key={p.id} className={`rounded-xl border-2 shadow-sm p-4 ${personaColors[p.id]}`}>
                <div className="flex items-center gap-2 mb-3">{personaIcons[p.id]}<span className="font-semibold">{p.name}</span></div>
                <div className="space-y-1 mb-3">
                  {p.requirements.map((r, i) => <div key={i} className="text-xs text-gray-700 flex items-start gap-1"><CheckCircle size={10} className="mt-0.5 shrink-0 text-green-500" />{r}</div>)}
                </div>
                <div className="bg-white/70 rounded-lg p-2 text-[10px] space-y-0.5">
                  <div><span className="font-medium">Touch target:</span> {p.constraints.minTouchTargetPx}px</div>
                  <div><span className="font-medium">Min font:</span> {p.constraints.minFontSizePx}px</div>
                  <div><span className="font-medium">Contrast:</span> {p.constraints.contrastMode}</div>
                  {p.constraints.maxTapsPerAction > 0 && <div><span className="font-medium">Max taps:</span> {p.constraints.maxTapsPerAction}</div>}
                  <div><span className="font-medium">Offline-first:</span> {p.constraints.offlineFirst ? 'Yes' : 'No'}</div>
                  <div className="font-mono text-violet-700">{p.constraints.shellDescription}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.keyScreens.map(s => <span key={s} className="text-[9px] bg-white/80 px-1.5 py-0.5 rounded">{s.replace(/_/g, ' ')}</span>)}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-4">Architecture Layers</h3>
            <div className="space-y-4">
              {plan.layers.map((layer, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center font-bold">{i + 1}</div>
                    <span className="font-medium text-sm">{layer.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-8 mb-2">{layer.description}</p>
                  <ul className="ml-8 space-y-1">
                    {layer.details.map((d, j) => <li key={j} className="text-xs text-gray-600 font-mono">{d}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-4">Key Trade-Offs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.tradeoffs.map((t, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="font-medium text-sm mb-2">{t.topic}</div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="text-xs bg-blue-50 rounded p-2 border border-blue-200"><span className="font-medium">Option A:</span> {t.optionA}</div>
                    <div className="text-xs bg-amber-50 rounded p-2 border border-amber-200"><span className="font-medium">Option B:</span> {t.optionB}</div>
                  </div>
                  <div className="text-xs text-green-800 bg-green-50 rounded p-2 border border-green-200 flex items-start gap-1">
                    <CheckCircle size={12} className="shrink-0 mt-0.5" /> <span className="font-medium">Decision:</span> {t.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type CostBreakdown = { option: string; monthlyCost: number; annualCost: number; setupCost: number; requiredEngineers: number };

// Demo fallback data
const demoPlan: ExtractionPlan = {
  sourceDomain: 'gate-billing-monolith', targetDomain: 'billing-service',
  phases: [
    { number: 1, name: 'Domain Analysis & Bounded Context Mapping', duration: '2 weeks', riskLevel: 'LOW', steps: ['Event-storm the billing domain', 'Identify aggregates: Invoice, BillingCycle, Payment, LedgerEntry', 'Map 4 shared tables and cross-domain JOINs', 'Classify coupling types'], metrics: {} },
    { number: 2, name: 'Anti-Corruption Layer Introduction', duration: '3 weeks', riskLevel: 'MEDIUM', steps: ['Create BillingFacade interface', 'Replace direct repository calls', 'Introduce domain events', 'Add CDC triggers on shared tables'], metrics: {} },
    { number: 3, name: 'Database Decomposition (CDC_WITH_OUTBOX)', duration: '4 weeks', riskLevel: 'HIGH', steps: ['Create billing-specific schema', 'Implement CDC with outbox pattern', 'Add reconciliation job (15-min interval)', 'Shadow-write for 2 weeks', 'Cut over with feature flag'], metrics: {} },
    { number: 4, name: 'Service Extraction & Traffic Migration', duration: '3 weeks', riskLevel: 'HIGH', steps: ['Deploy billing service with own DB', 'Strangler fig proxy at API gateway', 'Canary: 5% → 25% → 50% → 100%', 'Circuit breaker with monolith fallback', 'Kill switch for instant rollback'], metrics: {} },
    { number: 5, name: 'Verification & Decommission', duration: '2 weeks', riskLevel: 'LOW', steps: ['Verify gate p99 < 50ms during billing spike', 'Load test at 3x normal', 'Remove billing tables (keep 90-day archive)', 'Update runbooks and dashboards'], metrics: {} },
  ],
  risks: [
    { id: 'DATA_INCONSISTENCY', severity: 'HIGH', description: 'Dual-write period may produce divergent records', mitigation: 'Outbox pattern + reconciliation cron every 15 min' },
    { id: 'FEATURE_VELOCITY_IMPACT', severity: 'HIGH', description: 'Extraction competes with feature development', mitigation: 'Branch-by-abstraction: features continue on facade interface' },
    { id: 'CASCADING_FAILURE', severity: 'MEDIUM', description: 'New service down → gate operations impacted', mitigation: 'Circuit breaker with 5s timeout, cached billing fallback' },
    { id: 'TEAM_KNOWLEDGE_GAP', severity: 'LOW', description: 'Team may lack distributed systems experience', mitigation: 'Pair programming on Phase 3-4, weekly arch reviews' },
  ],
  adrs: [
    'ADR-001: Use CDC_WITH_OUTBOX over direct DB migration to avoid downtime',
    'ADR-002: Event-driven communication over synchronous REST for billing events',
    'ADR-003: Strangler fig proxy at API gateway level, not in-code routing',
    'ADR-004: Billing service owns its schema — no shared database antipattern',
    'ADR-005: 30-day bake period before monolith code removal',
  ],
  estimatedEffort: '14 weeks (parallel tracks possible)', totalWeeks: 14, teamSize: 6, context: {}
};

const demoSimBefore: LatencySimulation = { extracted: false, gateRps: 500, billingRps: 200, dbConnections: 50, gateP50Ms: 26.4, gateP99Ms: 162, connectionUtilizationPct: 100, healthStatus: 'DEGRADED', recommendation: 'Pool contention likely — queries will queue' };
const demoSimAfter: LatencySimulation = { extracted: true, gateRps: 500, billingRps: 200, dbConnections: 50, gateP50Ms: 12, gateP99Ms: 30, connectionUtilizationPct: 20, healthStatus: 'HEALTHY', recommendation: 'Within safe limits' };

function demoDecision(dailyCalls: number): BuildVsBuyDecision {
  const isHighScale = dailyCalls > 1000000;
  return {
    recommendation: isHighScale ? 'BUILD' : 'BUY', buildTotalScore: isHighScale ? 6 : 4, buyTotalScore: isHighScale ? 5 : 7,
    dimensions: [
      { name: 'Unit Economics', weight: 30, buildScore: isHighScale ? 8 : 4, buyScore: isHighScale ? 4 : 8, rationale: isHighScale ? 'At scale, in-house becomes cheaper' : 'CPaaS volume discounts win' },
      { name: 'Time to Market', weight: 20, buildScore: 3, buyScore: 9, rationale: 'CPaaS: 2-4 weeks. In-house: 6-9 months' },
      { name: 'TRAI DLT Compliance', weight: 15, buildScore: 7, buyScore: 6, rationale: 'Both need DLT; in-house gives header control' },
      { name: 'Latency Control', weight: 15, buildScore: 9, buyScore: 5, rationale: 'Sub-150ms needs India-specific PoP placement' },
      { name: 'Operational Complexity', weight: 10, buildScore: 3, buyScore: 9, rationale: 'In-house: own SRTP gateway, monitoring. CPaaS: managed' },
      { name: 'Vendor Lock-in Risk', weight: 10, buildScore: 9, buyScore: 3, rationale: 'In-house: full control. CPaaS: API lock-in' },
    ],
    cpaasCost: { option: 'CPaaS (Twilio/Exotel)', monthlyCost: dailyCalls * 30 * 0.75 * 0.8 / 60, annualCost: dailyCalls * 30 * 0.75 * 0.8 / 60 * 12, setupCost: 500000, requiredEngineers: 0 },
    inhouseCost: { option: 'In-House WebRTC', monthlyCost: isHighScale ? 650000 : 350000, annualCost: isHighScale ? 19800000 : 10200000, setupCost: 3000000, requiredEngineers: isHighScale ? 5 : 3 },
    breakEvenPoint: isHighScale ? '14 months' : 'Never', hybridStrategy: 'Use CPaaS for PSTN/IVR + in-house WebRTC for app-to-app video intercom',
    context: { dailyCalls }
  };
}

const demoDSPlan: DesignSystemPlan = {
  personas: [
    { id: 'GUARD', name: 'Security Guard', requirements: ['2-tap maximum', 'High-contrast (WCAG AAA)', '60px+ touch targets', 'Works on ₹8K phones (2GB RAM)', 'Offline-first', 'Voice feedback', 'Icon-driven UI'], keyScreens: ['gate_entry_verify', 'visitor_approve_deny', 'panic_button', 'shift_handover'], constraints: { minTouchTargetPx: 60, minFontSizePx: 24, contrastMode: 'HIGH_CONTRAST', maxTapsPerAction: 2, offlineFirst: true, shellDescription: 'guard-shell: stripped-down WebView' } },
    { id: 'RESIDENT', name: 'Resident / Flat Owner', requirements: ['Consumer-grade UX', 'Quick actions on home', 'Push + deep links', '60fps animations', 'Dark mode', 'Localization (4 languages)'], keyScreens: ['visitor_preapprove', 'maintenance_payment', 'amenity_booking', 'community_feed', 'helpdesk_raise', 'delivery_tracking'], constraints: { minTouchTargetPx: 44, minFontSizePx: 16, contrastMode: 'STANDARD', maxTapsPerAction: -1, offlineFirst: false, shellDescription: 'resident-app: React Native with shared tokens' } },
    { id: 'MC_TREASURER', name: 'MC Treasurer', requirements: ['Dense data tables (Tally-like)', 'Keyboard-navigable grids', 'Export Excel/PDF', 'Drill-down to transaction', 'Audit trail on every entry', 'Bulk operations', 'FY toggles'], keyScreens: ['billing_dashboard', 'collection_report', 'vendor_payment_approval', 'budget_vs_actual', 'audit_log', 'gst_reconciliation'], constraints: { minTouchTargetPx: 32, minFontSizePx: 12, contrastMode: 'DENSE', maxTapsPerAction: -1, offlineFirst: false, shellDescription: 'mc-portal: desktop-first with virtual-scroll' } },
  ],
  layers: [
    { name: 'Design Token Layer', description: 'Shared tokens consumed by all three shells', details: ['tokens/colors.json — semantic color tokens', 'tokens/spacing.json — 4px base grid, persona multipliers', 'tokens/typography.json — type ramp with persona-specific floors', 'Build: tokens → CSS vars + Tailwind + RN StyleSheet'] },
    { name: 'Component Library (3-tier)', description: 'Primitives → Composed → Persona-specific', details: ['@mana/primitives — Button, Input, Card (headless)', '@mana/composed — DataTable, ApprovalCard, StatusBadge', '@mana/guard-ui — GuardActionButton (60px, haptic)', '@mana/resident-ui — QuickActionTile, DeliveryCard', '@mana/mc-ui — LedgerGrid, BudgetChart (virtual-scroll)'] },
    { name: 'API Contract Layer (BFF Pattern)', description: 'Each persona gets a tailored API surface', details: ['/api/guard/* — minimal payload, binary allow/deny', '/api/resident/* — rich DTOs, pagination, real-time events', '/api/mc/* — bulk endpoints, aggregation, export streams', 'API versioning per persona independently'] },
    { name: 'Feature Flag & Capability Matrix', description: 'Decouple rollout per persona', details: ['Context: {persona, community, role, device_tier}', 'Guard gets features after 2-week resident bake', 'MC gated by committee_role', 'Device-tier gating: animations disabled on <3GB'] },
  ],
  tradeoffs: [
    { topic: 'Shared Monorepo vs Separate Repos', optionA: 'Monorepo: shared tokens, atomic commits', optionB: 'Coupling risk: guard CI breaks on resident changes', recommendation: 'Monorepo + per-persona CI with nx affected' },
    { topic: 'Single App vs Multiple Apps', optionA: 'Single APK with role-based shell switching', optionB: 'Guard app must be <15MB; resident can be 40MB', recommendation: 'Separate APKs with shared core module' },
    { topic: 'SSR vs SPA for MC Portal', optionA: 'SSR for fast TTFB on 10K-row ledgers', optionB: 'SPA gives better drill-down UX', recommendation: 'SPA with virtual-scroll + server-side aggregation' },
    { topic: 'Design System Governance', optionA: 'Committee approval slows velocity', optionB: 'No governance leads to divergence', recommendation: 'Tiered: primitives need 2 approvals, persona-specific needs 1' },
  ]
};

export default ArchitectureShowcaseDashboard;
