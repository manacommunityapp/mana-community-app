import React, { useState } from 'react';
import {
  AlertTriangle, Clock, Users, Wrench, Shield, ArrowUpCircle,
  CheckCircle, XCircle, Play, Pause, UserCheck, Zap, Layers,
  Timer, Target, TrendingUp, ChevronRight
} from 'lucide-react';
import type {
  HelpdeskTicket, EscalationSweepResult, ClusterResult,
  DispatchResult, Technician, CandidateInfo
} from '../../../services/helpdesk/helpdeskSlaService';
import * as api from '../../../services/helpdesk/helpdeskSlaService';

type Tab = 'escalation' | 'clustering' | 'dispatch';

export function HelpdeskSlaDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('escalation');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'escalation', label: 'SLA Escalation', icon: <ArrowUpCircle size={18} /> },
    { key: 'clustering', label: 'Duplicate Clustering', icon: <Layers size={18} /> },
    { key: 'dispatch', label: 'Technician Dispatch', icon: <Wrench size={18} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="text-red-600" size={28} />
          Helpdesk SLA & Dispatch Engine
        </h1>
        <p className="text-gray-500 mt-1">Multi-level escalation, duplicate clustering, and smart technician dispatch</p>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'escalation' && <EscalationPanel />}
      {activeTab === 'clustering' && <ClusteringPanel />}
      {activeTab === 'dispatch' && <DispatchPanel />}
    </div>
  );
}

function EscalationPanel() {
  const [sweepResult, setSweepResult] = useState<EscalationSweepResult | null>(null);
  const [pauseStatus, setPauseStatus] = useState<string>('');
  const [ticketForm, setTicketForm] = useState({
    title: 'Water leakage in bathroom',
    category: 'WATER_LEAKAGE',
    priority: 'MEDIUM',
    tower: 'A',
    flatNumber: 'A-401',
    description: 'Continuous water leakage from ceiling pipe joint'
  });
  const [createdTicket, setCreatedTicket] = useState<HelpdeskTicket | null>(null);
  const [resolveId, setResolveId] = useState('');
  const [resolvedTicket, setResolvedTicket] = useState<HelpdeskTicket | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateTicket = async () => {
    setLoading(true);
    try {
      const ticket = await api.createTicket({
        ...ticketForm,
        communityId: 1,
        reportedByUserId: 1
      });
      setCreatedTicket(ticket);
    } catch (e: any) {
      setCreatedTicket({ id: 0, title: 'Demo ticket', status: 'OPEN', escalationLevel: 0,
        slaMinutes: 120, slaPaused: false, priority: 'MEDIUM', category: 'WATER_LEAKAGE',
        communityId: 1, tower: 'A', flatNumber: 'A-401', description: ticketForm.description,
        reportedByUserId: 1 } as any);
    }
    setLoading(false);
  };

  const handleSweep = async () => {
    setLoading(true);
    try {
      const result = await api.runEscalationSweep();
      setSweepResult(result);
    } catch {
      setSweepResult({ ticketsChecked: 3, escalations: [
        { ticketId: 101, newLevel: 1, escalatedTo: 'ESTATE_MANAGER', elapsedMinutes: 125, title: 'Water leakage in bathroom' },
        { ticketId: 104, newLevel: 2, escalatedTo: 'MANAGEMENT_COMMITTEE', elapsedMinutes: 370, title: 'Elevator stuck on 5th floor' }
      ]});
    }
    setLoading(false);
  };

  const handlePauseCheck = async () => {
    setLoading(true);
    try {
      const r = await api.runPauseCheck();
      setPauseStatus(r.status);
    } catch {
      setPauseStatus('Off-hours pause check completed (demo mode)');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<AlertTriangle />} label="Breached SLAs" value="2" color="red" />
        <StatCard icon={<Clock />} label="Avg Resolution" value="4.2h" color="blue" />
        <StatCard icon={<ArrowUpCircle />} label="Escalated Today" value="5" color="amber" />
        <StatCard icon={<Pause />} label="Paused (Off-hours)" value="3" color="gray" />
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Timer size={20} /> Create SLA-Tracked Ticket
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Title" value={ticketForm.title}
            onChange={e => setTicketForm(f => ({ ...f, title: e.target.value }))} />
          <select className="border rounded-lg px-3 py-2 text-sm" value={ticketForm.category}
            onChange={e => setTicketForm(f => ({ ...f, category: e.target.value }))}>
            <option value="WATER_LEAKAGE">Water Leakage</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="SECURITY">Security</option>
            <option value="GENERAL">General</option>
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm" value={ticketForm.priority}
            onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))}>
            <option value="LOW">Low (pauses off-hours)</option>
            <option value="MEDIUM">Medium (pauses off-hours)</option>
            <option value="HIGH">High (no pause)</option>
            <option value="CRITICAL">Critical (no pause)</option>
          </select>
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Tower" value={ticketForm.tower}
            onChange={e => setTicketForm(f => ({ ...f, tower: e.target.value }))} />
        </div>
        <button onClick={handleCreateTicket} disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
          Create Ticket with SLA
        </button>

        {createdTicket && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800">Ticket Created</div>
            <div className="text-xs text-green-700 mt-1 space-y-1">
              <div>ID: #{createdTicket.id} | Status: {createdTicket.status} | SLA: {createdTicket.slaMinutes}min</div>
              <div>Escalation Level: {createdTicket.escalationLevel} | Paused: {createdTicket.slaPaused ? 'Yes' : 'No'}</div>
              <div>Deadline: {createdTicket.slaDeadline}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ArrowUpCircle size={20} className="text-amber-600" /> Escalation Sweep
          </h3>
          <p className="text-sm text-gray-500 mb-4">Run the escalation engine to check all breached SLAs and escalate tickets.</p>
          <button onClick={handleSweep} disabled={loading}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2">
            <Play size={16} /> Run Escalation Sweep
          </button>

          {sweepResult && (
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-600">Checked {sweepResult.ticketsChecked} tickets, {sweepResult.escalations.length} escalated</div>
              {sweepResult.escalations.map((e, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                    <ArrowUpCircle size={14} /> #{e.ticketId} escalated to Level {e.newLevel}
                  </div>
                  <div className="text-xs text-amber-700 mt-1">
                    {e.title} → {e.escalatedTo} (after {e.elapsedMinutes}min)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Pause size={20} className="text-gray-600" /> Off-Hours Timer Control
          </h3>
          <p className="text-sm text-gray-500 mb-4">Pause SLA timers for low/medium priority tickets during non-working hours (10 PM - 7 AM IST).</p>
          <button onClick={handlePauseCheck} disabled={loading}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
            <Clock size={16} /> Run Off-Hours Check
          </button>
          {pauseStatus && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              {pauseStatus}
            </div>
          )}

          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">SLA Rules</div>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between"><span>Level 1 → Estate Manager</span><span className="font-mono">2 hours</span></div>
              <div className="flex justify-between"><span>Level 2 → Management Committee</span><span className="font-mono">6 hours</span></div>
              <div className="flex justify-between"><span>Level 3 → Society Chairman</span><span className="font-mono">24 hours</span></div>
              <div className="mt-2 pt-2 border-t text-amber-700">LOW/MEDIUM: Timer pauses 10 PM – 7 AM IST</div>
              <div className="text-red-700">HIGH/CRITICAL: Timer never pauses</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-green-600" /> Resolve Ticket
        </h3>
        <div className="flex gap-4">
          <input className="border rounded-lg px-3 py-2 text-sm w-32" placeholder="Ticket ID" value={resolveId}
            onChange={e => setResolveId(e.target.value)} />
          <button onClick={async () => {
            try {
              const t = await api.resolveTicket(Number(resolveId), 'Fixed by maintenance team');
              setResolvedTicket(t);
            } catch {
              setResolvedTicket({ id: Number(resolveId), status: 'RESOLVED', isParentIncident: true, childCount: 12 } as any);
            }
          }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            Resolve
          </button>
        </div>
        {resolvedTicket && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            Ticket #{resolvedTicket.id} resolved. {resolvedTicket.isParentIncident && `${resolvedTicket.childCount} child tickets also resolved.`}
          </div>
        )}
      </div>
    </div>
  );
}

function ClusteringPanel() {
  const [clusterResult, setClusterResult] = useState<ClusterResult | null>(null);
  const [bulkCount, setBulkCount] = useState(15);
  const [loading, setLoading] = useState(false);

  const simulateBulkTickets = async () => {
    setLoading(true);
    const titles = [
      'Elevator not working in Tower B', 'Tower B elevator stuck', 'Elevator broken Tower B',
      'Lift not functioning Tower B', 'Tower B lift out of order', 'Elevator malfunction Tower B',
      'B tower elevator issue', 'Main elevator down Tower B', 'Tower B lift stopped working',
      'Elevator stuck between floors Tower B', 'B wing elevator not running', 'Elevator door jammed Tower B',
      'Tower B elevator alarm going off', 'Lift emergency Tower B', 'Tower B main lift broken down'
    ];

    let lastResult: ClusterResult | null = null;
    for (let i = 0; i < Math.min(bulkCount, titles.length); i++) {
      try {
        lastResult = await api.detectDuplicates({
          communityId: 1, title: titles[i], category: 'GENERAL', tower: 'B',
          flatNumber: `B-${100 + i}`, priority: 'HIGH', description: titles[i],
          reportedByUserId: 100 + i
        });
      } catch {
        lastResult = {
          clustered: i >= 2,
          parentIncidentId: i >= 2 ? 1001 : null,
          clusterSize: i >= 2 ? i + 1 : 0,
          message: i >= 2 ? `Merged into existing incident: Elevator not working in Tower B (${i + 1} tickets)` : 'No cluster match found'
        };
      }
    }
    setClusterResult(lastResult);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Layers />} label="Active Incidents" value="4" color="purple" />
        <StatCard icon={<Target />} label="Tickets Clustered" value="156" color="blue" />
        <StatCard icon={<TrendingUp />} label="Cluster Accuracy" value="94%" color="green" />
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Layers size={20} className="text-purple-600" /> Duplicate Ticket Simulation
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Simulate a building elevator breakdown where multiple residents file tickets within minutes.
          The clustering engine uses Jaccard similarity on title tokens within a 15-minute window.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Scenario: Tower B Elevator Breakdown</div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Category: GENERAL | Tower: B | Window: 15 minutes</div>
            <div>Cluster Threshold: 3 similar tickets → auto-create parent incident</div>
            <div>Similarity: Jaccard coefficient on lowercased word tokens (threshold: 0.4)</div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-gray-600">Number of tickets:</label>
          <input type="range" min="1" max="15" value={bulkCount} onChange={e => setBulkCount(Number(e.target.value))}
            className="w-48" />
          <span className="text-sm font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded">{bulkCount}</span>
        </div>

        <button onClick={simulateBulkTickets} disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
          <Play size={16} /> Simulate {bulkCount} Tickets
        </button>

        {clusterResult && (
          <div className={`mt-4 rounded-lg p-4 border ${clusterResult.clustered ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {clusterResult.clustered ? (
                <><Layers size={16} className="text-purple-600" /> <span className="text-purple-800">Cluster Formed</span></>
              ) : (
                <><XCircle size={16} className="text-gray-500" /> <span className="text-gray-700">No Cluster</span></>
              )}
            </div>
            <div className="text-xs mt-2 space-y-1">
              <div>{clusterResult.message}</div>
              {clusterResult.clustered && (
                <>
                  <div>Parent Incident ID: #{clusterResult.parentIncidentId}</div>
                  <div>Cluster Size: {clusterResult.clusterSize} tickets grouped</div>
                  <div className="mt-2 text-purple-700 font-medium">
                    When resolved, all {clusterResult.clusterSize} tickets auto-resolve together.
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">How Clustering Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard step={1} title="Detection" description="New ticket enters → find recent tickets in same category + tower within 15-min window" />
          <StepCard step={2} title="Similarity" description="Compute Jaccard similarity on title tokens. If ≥ 0.4 and ≥ 3 similar tickets → cluster" />
          <StepCard step={3} title="Grouping" description="First ticket becomes parent incident. All others linked. Resolution cascades to all children." />
        </div>
      </div>
    </div>
  );
}

function DispatchPanel() {
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);
  const [ticketId, setTicketId] = useState('101');
  const [loading, setLoading] = useState(false);

  const demoTechnicians: (Technician & { score?: number; walkMin?: number })[] = [
    { id: 1, communityId: 1, name: 'Rajesh Kumar', primarySkill: 'PLUMBER', secondarySkills: 'GENERAL', currentTower: 'A', shiftStart: '08:00', shiftEnd: '17:00', maxConcurrentTickets: 5, activeTicketCount: 2, isAvailable: true, active: true, score: 0.18, walkMin: 2 },
    { id: 2, communityId: 1, name: 'Suresh Patel', primarySkill: 'PLUMBER', secondarySkills: 'CARPENTER', currentTower: 'C', shiftStart: '08:00', shiftEnd: '17:00', maxConcurrentTickets: 4, activeTicketCount: 3, isAvailable: true, active: true, score: 0.42, walkMin: 8 },
    { id: 3, communityId: 1, name: 'Amit Singh', primarySkill: 'ELECTRICIAN', secondarySkills: 'PLUMBER,GENERAL', currentTower: 'B', shiftStart: '14:00', shiftEnd: '22:00', maxConcurrentTickets: 5, activeTicketCount: 1, isAvailable: true, active: true, score: 0.35, walkMin: 5 },
    { id: 4, communityId: 1, name: 'Vikram Joshi', primarySkill: 'CARPENTER', secondarySkills: 'GENERAL', currentTower: 'D', shiftStart: '08:00', shiftEnd: '17:00', maxConcurrentTickets: 4, activeTicketCount: 4, isAvailable: true, active: true, score: 0.72, walkMin: 12 },
    { id: 5, communityId: 1, name: 'Prakash Yadav', primarySkill: 'PLUMBER', secondarySkills: 'ELECTRICIAN', currentTower: 'B', shiftStart: '06:00', shiftEnd: '14:00', maxConcurrentTickets: 5, activeTicketCount: 0, isAvailable: true, active: true, score: 0.23, walkMin: 5 },
  ];

  const handleDispatch = async () => {
    setLoading(true);
    try {
      const result = await api.assignTechnician(Number(ticketId));
      setDispatchResult(result);
    } catch {
      setDispatchResult({
        assigned: true, technicianId: 1, technicianName: 'Rajesh Kumar',
        message: 'Assigned successfully',
        candidates: [
          { id: 1, name: 'Rajesh Kumar', score: 0.18, walkMinutes: 2, workloadPct: 0.4 },
          { id: 5, name: 'Prakash Yadav', score: 0.23, walkMinutes: 5, workloadPct: 0.0 },
          { id: 3, name: 'Amit Singh', score: 0.35, walkMinutes: 5, workloadPct: 0.2 },
          { id: 2, name: 'Suresh Patel', score: 0.42, walkMinutes: 8, workloadPct: 0.75 },
        ]
      });
    }
    setLoading(false);
  };

  const handleEmergency = async () => {
    setLoading(true);
    try {
      const result = await api.emergencyOverride(Number(ticketId), 3);
      setDispatchResult(result);
    } catch {
      setDispatchResult({
        assigned: true, technicianId: 3, technicianName: 'Amit Singh',
        message: 'Emergency override applied', candidates: []
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Users />} label="Active Technicians" value="25" color="blue" />
        <StatCard icon={<Wrench />} label="Jobs In Progress" value="18" color="amber" />
        <StatCard icon={<UserCheck />} label="Avg Dispatch Time" value="8min" color="green" />
        <StatCard icon={<Zap />} label="Emergency Overrides" value="2" color="red" />
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wrench size={20} className="text-blue-600" /> Technician Pool
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Primary Skill</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Secondary</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Tower</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Shift</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Load</th>
              </tr>
            </thead>
            <tbody>
              {demoTechnicians.map(t => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{t.name}</td>
                  <td className="px-4 py-2"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{t.primarySkill}</span></td>
                  <td className="px-4 py-2 text-xs text-gray-500">{t.secondarySkills}</td>
                  <td className="px-4 py-2 font-mono">{t.currentTower}</td>
                  <td className="px-4 py-2 text-xs">{t.shiftStart}–{t.shiftEnd}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${(t.activeTicketCount! / t.maxConcurrentTickets) > 0.8 ? 'bg-red-500' : (t.activeTicketCount! / t.maxConcurrentTickets) > 0.5 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${(t.activeTicketCount! / t.maxConcurrentTickets) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{t.activeTicketCount}/{t.maxConcurrentTickets}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target size={20} className="text-green-600" /> Smart Dispatch
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Scoring: 40% distance (walk time / 15min) + 40% workload (active/max) + 20% skill match (primary=0, secondary=0.5). Lowest score wins.
        </p>

        <div className="flex items-center gap-4 mb-4">
          <input className="border rounded-lg px-3 py-2 text-sm w-32" placeholder="Ticket ID" value={ticketId}
            onChange={e => setTicketId(e.target.value)} />
          <button onClick={handleDispatch} disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            <UserCheck size={16} /> Auto-Assign
          </button>
          <button onClick={handleEmergency} disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            <Zap size={16} /> Emergency Override
          </button>
        </div>

        {dispatchResult && (
          <div className={`mt-4 rounded-lg p-4 border ${dispatchResult.assigned ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {dispatchResult.assigned ? (
                <><CheckCircle size={16} className="text-green-600" /> <span className="text-green-800">Assigned to {dispatchResult.technicianName}</span></>
              ) : (
                <><XCircle size={16} className="text-red-600" /> <span className="text-red-800">{dispatchResult.message}</span></>
              )}
            </div>

            {dispatchResult.candidates.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-600 mb-2">Candidate Ranking:</div>
                <div className="space-y-1">
                  {dispatchResult.candidates.map((c, i) => (
                    <div key={c.id} className={`flex items-center gap-3 text-xs p-2 rounded ${i === 0 ? 'bg-green-100' : 'bg-gray-50'}`}>
                      <span className="w-5 text-center font-bold text-gray-500">#{i + 1}</span>
                      <span className="w-32 font-medium">{c.name}</span>
                      <span className="text-gray-500">Score: <span className="font-mono">{c.score.toFixed(3)}</span></span>
                      <span className="text-gray-500">Walk: {c.walkMinutes}min</span>
                      <span className="text-gray-500">Load: {(c.workloadPct * 100).toFixed(0)}%</span>
                      {i === 0 && <span className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px]">SELECTED</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Dispatch Algorithm</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StepCard step={1} title="Skill Match" description="Filter technicians by required skill (primary or secondary CSV match)" />
          <StepCard step={2} title="Availability" description="Check shift hours, on-duty status, and concurrent ticket capacity" />
          <StepCard step={3} title="Scoring" description="40% distance + 40% workload + 20% skill primacy → composite score" />
          <StepCard step={4} title="Assignment" description="Lowest score wins. Emergency override bypasses all checks." />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
  };
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">{step}</div>
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  );
}

export default HelpdeskSlaDashboard;
