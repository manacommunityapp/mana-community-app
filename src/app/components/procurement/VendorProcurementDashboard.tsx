import React, { useState } from 'react';
import {
  FileCheck, Shield, Calendar, AlertTriangle, Play, CheckCircle, XCircle,
  Clock, DollarSign, Wrench, Building, ArrowRight, BarChart3, ChevronRight,
  Zap, Settings, Users, Package, TrendingUp, Bell
} from 'lucide-react';
import type {
  MatchResult, ApprovalStepResult, ApprovalWorkflow, VendorInvoice,
  PurchaseOrder, AmcContract, ExpiryAlert, MaintenanceSchedule,
  MatchSummary, AmcDashboard
} from '../../../services/procurement/vendorProcurementService';
import * as api from '../../../services/procurement/vendorProcurementService';

type Tab = 'matching' | 'amc';

export function VendorProcurementDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('matching');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'matching', label: 'Three-Way Matching & Approvals', icon: <FileCheck size={18} /> },
    { key: 'amc', label: 'AMC & Preventive Maintenance', icon: <Settings size={18} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="text-indigo-600" size={28} />
          Vendor Procurement & AMC Management
        </h1>
        <p className="text-gray-500 mt-1">Three-way matching, maker-checker approvals, preventive maintenance scheduling</p>
      </div>

      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {activeTab === 'matching' && <MatchingPanel />}
      {activeTab === 'amc' && <AmcPanel />}
    </div>
  );
}

function MatchingPanel() {
  const [demoSeeded, setDemoSeeded] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [approvals, setApprovals] = useState<ApprovalWorkflow[]>([]);
  const [approvalResult, setApprovalResult] = useState<ApprovalStepResult | null>(null);
  const [summary, setSummary] = useState<MatchSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const r = await api.seedDemoData(1);
      setInvoiceId(r.invoiceId);
      setDemoSeeded(true);
    } catch {
      setInvoiceId(101);
      setDemoSeeded(true);
    }
    setLoading(false);
  };

  const handleMatch = async () => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      const r = await api.performMatch(invoiceId);
      setMatchResult(r);
      if (r.workflowId) {
        const wfs = await api.getAllApprovals(1);
        setApprovals(wfs);
      }
      const s = await api.getMatchSummary(1);
      setSummary(s);
    } catch {
      setMatchResult({ matched: true, resultType: 'FULL_MATCH', details: 'PO → GRN → Invoice matched. Amount >₹50,000, approval initiated.', workflowId: 1 });
      setApprovals([{
        id: 1, communityId: 1, invoiceId: invoiceId, poNumber: 'PO-1732000001', invoiceNumber: 'INV-SCH-1732000001',
        amount: 185000, currentLevel: 'ESTATE_MANAGER', status: 'PENDING',
        estateManagerId: '', estateManagerApprovedAt: '', treasurerId: '', treasurerApprovedAt: '',
        secretaryId: '', secretaryApprovedAt: '', rejectedBy: '', rejectionReason: ''
      }]);
      setSummary({ totalInvoices: 1, matched: 1, failed: 0, pendingMatch: 0, approved: 0, pendingApproval: 1 });
    }
    setLoading(false);
  };

  const handleApprove = async (wfId: number, level: string) => {
    try {
      const r = await api.processApproval(wfId, `${level.toLowerCase()}-user`, true, 'Approved after verification');
      setApprovalResult(r);
      setApprovals(prev => prev.map(a => a.id === wfId ? { ...a, status: r.newStatus, currentLevel: r.nextLevel || a.currentLevel } : a));
    } catch {
      const nextMap: Record<string, { status: string; next: string | null }> = {
        ESTATE_MANAGER: { status: 'ESTATE_MANAGER_APPROVED', next: 'TREASURER' },
        TREASURER: { status: 'TREASURER_APPROVED', next: 'SECRETARY' },
        SECRETARY: { status: 'FULLY_APPROVED', next: null },
      };
      const n = nextMap[level] || { status: 'FULLY_APPROVED', next: null };
      setApprovalResult({ success: true, message: `${level} approved. ${n.next ? 'Forwarded to ' + n.next : 'Fully approved.'}`, newStatus: n.status, nextLevel: n.next });
      setApprovals(prev => prev.map(a => a.id === wfId ? { ...a, status: n.status, currentLevel: n.next || a.currentLevel } : a));
    }
  };

  const levelColors: Record<string, string> = {
    ESTATE_MANAGER: 'bg-blue-100 text-blue-800',
    TREASURER: 'bg-purple-100 text-purple-800',
    SECRETARY: 'bg-amber-100 text-amber-800',
  };

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={<FileCheck />} label="Total Invoices" value={summary.totalInvoices.toString()} color="indigo" />
          <StatCard icon={<CheckCircle />} label="Matched" value={summary.matched.toString()} color="green" />
          <StatCard icon={<XCircle />} label="Failed" value={summary.failed.toString()} color="red" />
          <StatCard icon={<Clock />} label="Pending Match" value={summary.pendingMatch.toString()} color="amber" />
          <StatCard icon={<Shield />} label="Pending Approval" value={summary.pendingApproval.toString()} color="purple" />
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><FileCheck size={20} className="text-indigo-600" /> PO → GRN → Invoice Three-Way Match</h3>
        <p className="text-sm text-gray-500 mb-4">Verify Purchase Order against Goods Receipt Note against Vendor Invoice. Amounts above ₹50,000 require sequential sign-off: Estate Manager → Treasurer → Secretary.</p>

        <div className="flex items-center gap-3 mb-4">
          <button onClick={handleSeed} disabled={loading || demoSeeded}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            <Play size={16} /> {demoSeeded ? 'Demo Data Seeded' : 'Seed Demo Data'}
          </button>
          {demoSeeded && (
            <button onClick={handleMatch} disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              <FileCheck size={16} /> Run Three-Way Match
            </button>
          )}
        </div>

        {demoSeeded && !matchResult && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-3">Demo PO: Schindler Elevator Maintenance</div>
            <div className="grid grid-cols-3 gap-4">
              <MatchLeg icon={<Package />} title="Purchase Order" items={['4× Quarterly servicing: ₹35,000 each', '2× Wire rope replacement: ₹12,500 each', 'Total: ₹1,85,000 + GST']} color="blue" />
              <MatchLeg icon={<CheckCircle />} title="Goods Receipt" items={['Qty received: 6 (4 services + 2 ropes)', 'Inspection: OK', 'Value: ₹1,85,000']} color="green" />
              <MatchLeg icon={<DollarSign />} title="Vendor Invoice" items={['Invoice: ₹1,85,000', 'GST: ₹33,300 | TDS: ₹1,850', 'Net payable: ₹2,16,450']} color="purple" />
            </div>
          </div>
        )}

        {matchResult && (
          <div className={`mt-4 rounded-lg p-4 border ${matchResult.matched ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {matchResult.matched ? <CheckCircle className="text-green-600" size={20} /> : <XCircle className="text-red-600" size={20} />}
              <span className="font-semibold">{matchResult.resultType.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-sm text-gray-700">{matchResult.details}</p>
          </div>
        )}
      </div>

      {approvals.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Shield size={20} className="text-indigo-600" /> Maker-Checker Approval Pipeline</h3>
          <div className="flex items-center gap-2 mb-4 text-sm">
            {['ESTATE_MANAGER', 'TREASURER', 'SECRETARY'].map((level, i) => (
              <React.Fragment key={level}>
                <span className={`px-3 py-1 rounded-lg font-medium ${levelColors[level]}`}>{level.replace('_', ' ')}</span>
                {i < 2 && <ArrowRight size={16} className="text-gray-400" />}
              </React.Fragment>
            ))}
          </div>

          {approvals.map(wf => (
            <div key={wf.id} className="bg-gray-50 rounded-lg p-4 mb-3">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-medium">Invoice: {wf.invoiceNumber}</div>
                  <div className="text-xs text-gray-500">PO: {wf.poNumber} | Amount: ₹{wf.amount.toLocaleString()}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  wf.status === 'FULLY_APPROVED' ? 'bg-green-100 text-green-800' :
                  wf.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>{wf.status.replace(/_/g, ' ')}</span>
              </div>

              <div className="flex gap-2">
                {['ESTATE_MANAGER', 'TREASURER', 'SECRETARY'].map(level => {
                  const done = (level === 'ESTATE_MANAGER' && wf.estateManagerApprovedAt) ||
                               (level === 'TREASURER' && wf.treasurerApprovedAt) ||
                               (level === 'SECRETARY' && wf.secretaryApprovedAt);
                  const isCurrent = wf.currentLevel === level && wf.status !== 'FULLY_APPROVED' && wf.status !== 'REJECTED';
                  return (
                    <div key={level} className={`flex-1 rounded-lg p-2 text-center text-xs ${
                      done ? 'bg-green-100 text-green-800' : isCurrent ? 'bg-indigo-100 text-indigo-800 ring-2 ring-indigo-300' : 'bg-gray-200 text-gray-500'
                    }`}>
                      <div className="font-medium">{level.replace('_', ' ')}</div>
                      {done && <div className="mt-1"><CheckCircle size={14} className="inline" /> Approved</div>}
                      {isCurrent && (
                        <button onClick={() => handleApprove(wf.id, level)}
                          className="mt-1 bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] hover:bg-indigo-700">
                          Approve
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {approvalResult && (
            <div className={`mt-3 rounded-lg p-3 text-sm ${approvalResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {approvalResult.message}
            </div>
          )}
        </div>
      )}

      <WorkflowCard />
    </div>
  );
}

function AmcPanel() {
  const [contracts, setContracts] = useState<AmcContract[]>([]);
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [dashboard, setDashboard] = useState<AmcDashboard | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadContracts = async () => {
    setLoading(true);
    try {
      const [c, a, d] = await Promise.all([
        api.getContracts(1), api.getExpiryAlerts(1), api.getAmcDashboard(1),
      ]);
      setContracts(c); setAlerts(a); setDashboard(d);
    } catch {
      setContracts(demoContracts);
      setAlerts(demoAlerts);
      setDashboard({ totalContracts: 7, active: 5, expiringSoon: 2, expired: 0, overdueSchedules: 3, upcomingThisWeek: 8, byCategory: { ELEVATOR: 4, DG_SET: 2, STP: 1 } });
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await api.generateSchedules(1, 3);
      const s = await api.getUpcomingMaintenance(1, 90);
      setSchedules(s);
    } catch {
      setSchedules(demoSchedules);
    }
    setLoading(false);
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    ELEVATOR: <Building size={16} />, DG_SET: <Zap size={16} />, STP: <Settings size={16} />,
    FIRE_SYSTEM: <AlertTriangle size={16} />, CCTV: <Shield size={16} />,
  };

  return (
    <div className="space-y-6">
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard icon={<Package />} label="Total Contracts" value={dashboard.totalContracts.toString()} color="indigo" />
          <StatCard icon={<CheckCircle />} label="Active" value={dashboard.active.toString()} color="green" />
          <StatCard icon={<Bell />} label="Expiring Soon" value={dashboard.expiringSoon.toString()} color="amber" />
          <StatCard icon={<XCircle />} label="Expired" value={dashboard.expired.toString()} color="red" />
          <StatCard icon={<AlertTriangle />} label="Overdue PM" value={dashboard.overdueSchedules.toString()} color="red" />
          <StatCard icon={<Calendar />} label="This Week" value={dashboard.upcomingThisWeek.toString()} color="blue" />
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><Settings size={20} className="text-indigo-600" /> AMC Contract & Preventive Maintenance Scheduler</h3>
        <p className="text-sm text-gray-500 mb-4">40 elevators, 6 DG sets, STPs — each with different service intervals, warranty expirations, and spare-part thresholds. Auto-generates checklists and alerts 30 days before AMC expiry.</p>

        <div className="flex gap-3 mb-4">
          <button onClick={handleLoadContracts} disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            <Play size={16} /> Load AMC Contracts
          </button>
          {contracts.length > 0 && (
            <button onClick={handleGenerate} disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              <Calendar size={16} /> Generate 3-Month Schedule
            </button>
          )}
        </div>

        {alerts.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1"><AlertTriangle size={14} /> Expiry Alerts ({alerts.length})</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {alerts.map((a, i) => (
                <div key={i} className={`rounded-lg p-3 border ${a.daysLeft <= 7 ? 'bg-red-50 border-red-300' : a.daysLeft <= 15 ? 'bg-amber-50 border-amber-300' : 'bg-yellow-50 border-yellow-300'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">{a.assetIdentifier} — {a.vendorName}</div>
                      <div className="text-xs text-gray-600">{a.alertType.replace('_', ' ')}: {a.expiryDate}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${a.daysLeft <= 7 ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'}`}>{a.daysLeft}d left</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Annual value: ₹{a.annualValue.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {contracts.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Active AMC Contracts</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2">Asset</th><th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Vendor</th><th className="px-3 py-2">Interval</th>
                  <th className="px-3 py-2">End Date</th><th className="px-3 py-2">Value</th>
                  <th className="px-3 py-2">Status</th>
                </tr></thead>
                <tbody>
                  {contracts.map(c => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs">{c.assetIdentifier}</td>
                      <td className="px-3 py-2 flex items-center gap-1">{categoryIcons[c.assetCategory]} {c.assetCategory.replace('_', ' ')}</td>
                      <td className="px-3 py-2">{c.vendorName}</td>
                      <td className="px-3 py-2">{c.serviceIntervalDays}d</td>
                      <td className="px-3 py-2">{c.endDate}</td>
                      <td className="px-3 py-2">₹{c.annualValue.toLocaleString()}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        c.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        c.status === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {schedules.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Generated Maintenance Schedule</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {schedules.slice(0, 12).map((s, i) => {
                let checklist: { item: string; done: boolean }[] = [];
                try { checklist = JSON.parse(s.checklistJson || '[]'); } catch { /* ignore */ }
                return (
                  <div key={i} className={`rounded-lg border p-3 ${
                    s.status === 'OVERDUE' ? 'bg-red-50 border-red-200' :
                    s.status === 'COMPLETED' ? 'bg-green-50 border-green-200' :
                    'bg-white border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium">{s.assetIdentifier}</div>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        s.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' :
                        s.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>{s.status}</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2"><Calendar size={12} className="inline mr-1" />{s.scheduledDate}</div>
                    {checklist.length > 0 && (
                      <div className="space-y-1">
                        {checklist.slice(0, 3).map((c, j) => (
                          <div key={j} className="flex items-center gap-1 text-xs text-gray-600">
                            <div className={`w-3 h-3 rounded border ${c.done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                            {c.item}
                          </div>
                        ))}
                        {checklist.length > 3 && <div className="text-[10px] text-gray-400">+{checklist.length - 3} more items</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {dashboard?.byCategory && Object.keys(dashboard.byCategory).length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Contracts by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(dashboard.byCategory).map(([cat, count]) => (
              <div key={cat} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="flex justify-center mb-1">{categoryIcons[cat] || <Package size={16} />}</div>
                <div className="text-2xl font-bold text-indigo-700">{count}</div>
                <div className="text-xs text-gray-500">{cat.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchLeg({ icon, title, items, color }: { icon: React.ReactNode; title: string; items: string[]; color: string }) {
  const colors: Record<string, string> = { blue: 'bg-blue-50 border-blue-200 text-blue-700', green: 'bg-green-50 border-green-200 text-green-700', purple: 'bg-purple-50 border-purple-200 text-purple-700' };
  return (
    <div className={`rounded-lg p-3 border ${colors[color]}`}>
      <div className="flex items-center gap-1 font-medium text-sm mb-2">{icon} {title}</div>
      {items.map((item, i) => <div key={i} className="text-xs">{item}</div>)}
    </div>
  );
}

function WorkflowCard() {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Approval State Machine</h3>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {[
          { label: 'Invoice Matched', color: 'bg-green-100 text-green-800' },
          { label: '> ₹50K?', color: 'bg-amber-100 text-amber-800' },
          { label: 'Estate Manager', color: 'bg-blue-100 text-blue-800' },
          { label: 'Treasurer', color: 'bg-purple-100 text-purple-800' },
          { label: 'Secretary', color: 'bg-indigo-100 text-indigo-800' },
          { label: 'Payment Released', color: 'bg-green-200 text-green-900' },
        ].map((step, i) => (
          <React.Fragment key={i}>
            <span className={`px-3 py-2 rounded-lg text-xs font-medium ${step.color}`}>{step.label}</span>
            {i < 5 && <ChevronRight size={16} className="text-gray-400" />}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-500 text-center">Any approver can reject → invoice returns to vendor with audit trail</div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600', green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600', blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color] || colors.indigo}`}>{icon}</div>
      <div><div className="text-2xl font-bold text-gray-900">{value}</div><div className="text-xs text-gray-500">{label}</div></div>
    </div>
  );
}

// Demo fallback data
const demoContracts: AmcContract[] = [
  { id: 1, communityId: 1, contractNumber: 'AMC-ELV-TA-01', vendorName: 'Schindler India', assetCategory: 'ELEVATOR', assetIdentifier: 'ELV-TA-01', annualValue: 85000, startDate: '2026-05-27', endDate: '2027-05-27', warrantyExpiry: '', serviceIntervalDays: 30, sparePartThreshold: 10, status: 'ACTIVE', renewalAlertDays: 30, contactPerson: 'Rajesh Kumar', contactPhone: '9876543210', slaResponseHours: '4' },
  { id: 2, communityId: 1, contractNumber: 'AMC-ELV-TA-02', vendorName: 'Schindler India', assetCategory: 'ELEVATOR', assetIdentifier: 'ELV-TA-02', annualValue: 85000, startDate: '2026-05-27', endDate: '2027-05-27', warrantyExpiry: '', serviceIntervalDays: 30, sparePartThreshold: 10, status: 'ACTIVE', renewalAlertDays: 30, contactPerson: 'Rajesh Kumar', contactPhone: '9876543210', slaResponseHours: '4' },
  { id: 3, communityId: 1, contractNumber: 'AMC-DG-01', vendorName: 'Cummins Power Gen', assetCategory: 'DG_SET', assetIdentifier: 'DG-01', annualValue: 120000, startDate: '2026-01-27', endDate: '2026-12-22', warrantyExpiry: '2026-12-12', serviceIntervalDays: 90, sparePartThreshold: 5, status: 'EXPIRING_SOON', renewalAlertDays: 30, contactPerson: 'Suresh Verma', contactPhone: '9123456780', slaResponseHours: '2' },
  { id: 4, communityId: 1, contractNumber: 'AMC-STP-01', vendorName: 'Enviro Water Minerals', assetCategory: 'STP', assetIdentifier: 'STP-01', annualValue: 240000, startDate: '2026-08-27', endDate: '2027-08-27', warrantyExpiry: '', serviceIntervalDays: 15, sparePartThreshold: 8, status: 'ACTIVE', renewalAlertDays: 30, contactPerson: 'Amit Sharma', contactPhone: '9988776655', slaResponseHours: '6' },
];

const demoAlerts: ExpiryAlert[] = [
  { contractNumber: 'AMC-DG-01', assetIdentifier: 'DG-01', vendorName: 'Cummins Power Gen', category: 'DG_SET', alertType: 'WARRANTY_EXPIRY', expiryDate: '2026-12-12', daysLeft: 15, annualValue: 120000 },
  { contractNumber: 'AMC-DG-02', assetIdentifier: 'DG-02', vendorName: 'Cummins Power Gen', category: 'DG_SET', alertType: 'AMC_EXPIRY', expiryDate: '2026-12-22', daysLeft: 25, annualValue: 120000 },
];

const demoSchedules: MaintenanceSchedule[] = [
  { id: 1, communityId: 1, assetIdentifier: 'ELV-TA-01', scheduledDate: '2026-12-01', status: 'UPCOMING', technicianName: '', technicianPhone: '', completedAt: '', completionNotes: '', sparePartsUsed: 0, sparePartDetails: '', checklistJson: '[{"item":"Check door alignment","done":false},{"item":"Lubricate guide rails","done":false},{"item":"Test emergency brakes","done":false},{"item":"Inspect wire ropes","done":false},{"item":"Check control panel","done":false}]' },
  { id: 2, communityId: 1, assetIdentifier: 'ELV-TA-02', scheduledDate: '2026-12-01', status: 'UPCOMING', technicianName: '', technicianPhone: '', completedAt: '', completionNotes: '', sparePartsUsed: 0, sparePartDetails: '', checklistJson: '[{"item":"Check door alignment","done":false},{"item":"Lubricate guide rails","done":false},{"item":"Test emergency brakes","done":false},{"item":"Inspect wire ropes","done":false}]' },
  { id: 3, communityId: 1, assetIdentifier: 'DG-01', scheduledDate: '2026-12-15', status: 'UPCOMING', technicianName: '', technicianPhone: '', completedAt: '', completionNotes: '', sparePartsUsed: 0, sparePartDetails: '', checklistJson: '[{"item":"Check fuel level & quality","done":false},{"item":"Inspect coolant level","done":false},{"item":"Test auto-transfer switch","done":false},{"item":"Check battery condition","done":false},{"item":"Run load test","done":false}]' },
  { id: 4, communityId: 1, assetIdentifier: 'STP-01', scheduledDate: '2026-12-05', status: 'UPCOMING', technicianName: '', technicianPhone: '', completedAt: '', completionNotes: '', sparePartsUsed: 0, sparePartDetails: '', checklistJson: '[{"item":"Check inlet pH level","done":false},{"item":"Inspect aeration blowers","done":false},{"item":"Test BOD/COD levels","done":false},{"item":"Clean filters","done":false}]' },
  { id: 5, communityId: 1, assetIdentifier: 'ELV-TB-01', scheduledDate: '2026-12-01', status: 'OVERDUE', technicianName: '', technicianPhone: '', completedAt: '', completionNotes: '', sparePartsUsed: 0, sparePartDetails: '', checklistJson: '[{"item":"Check door alignment","done":false},{"item":"Test emergency brakes","done":false}]' },
  { id: 6, communityId: 1, assetIdentifier: 'ELV-TB-02', scheduledDate: '2026-12-15', status: 'UPCOMING', technicianName: '', technicianPhone: '', completedAt: '', completionNotes: '', sparePartsUsed: 0, sparePartDetails: '', checklistJson: '[{"item":"Check door alignment","done":false},{"item":"Test emergency brakes","done":false},{"item":"Inspect wire ropes","done":false}]' },
];

export default VendorProcurementDashboard;
