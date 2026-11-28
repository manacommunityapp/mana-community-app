import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck, AlertTriangle, Shield, Building2, Users, TrendingDown,
  CheckCircle2, Clock, XCircle, Wrench, Eye, ArrowUpCircle, Package,
  FileText, Lock, DollarSign, Scale, Hammer, PaintBucket, Droplets,
  Zap, Layers, Activity
} from 'lucide-react';
import {
  builderHandoverApi, SnagDashboard, CutoverDashboard, SnagItem, FlatInspection,
  CorpusFundTransaction, CutoverSnapshot
} from '../../../services/handover/builderHandoverService';

// ─── Demo Data ───

const DEMO_SNAG: SnagDashboard = {
  totalSnags: 6, openBlockers: 3, totalReworks: 1, avgResolveHours: 168,
  byCategory: { WATERPROOFING: 1, ELECTRICAL: 1, FLOORING: 1, PAINTING: 1, PLUMBING: 1, GLASS_ALUMINUM: 1 },
  byStatus: { ASSIGNED: 1, WORK_IN_PROGRESS: 1, RE_INSPECTION_PASSED: 1, LOGGED: 1, RE_INSPECTION_PENDING: 1, DISPUTED: 1 },
  bySeverity: { CRITICAL: 2, MAJOR: 2, MINOR: 1, COSMETIC: 1 },
  byTower: { 'Tower A': 3, 'Tower B': 2, 'Tower C': 1 },
  subcontractorScores: {
    'Sharma Waterproofing': { name: 'Sharma Waterproofing', trade: 'Waterproofing', totalSnags: 1, closedSnags: 0, reworkRatePct: 100 },
    'Jain Electricals': { name: 'Jain Electricals', trade: 'Electrical', totalSnags: 1, closedSnags: 0, reworkRatePct: 0 },
    'Gupta Flooring': { name: 'Gupta Flooring', trade: 'Flooring', totalSnags: 1, closedSnags: 1, reworkRatePct: 0 },
    'Kumar Plumbing': { name: 'Kumar Plumbing', trade: 'Plumbing', totalSnags: 1, closedSnags: 0, reworkRatePct: 0 },
  },
  totalInspections: 2, completedHandovers: 0,
  allSnags: [
    { id: 1, flatNumber: 'A-1501', towerName: 'Tower A', floorNumber: 15, snagCode: 'SNAG-TA-1501-001', category: 'WATERPROOFING', severity: 'CRITICAL', status: 'ASSIGNED', roomLocation: 'BATHROOM_MASTER', exactCoordinates: '', description: 'Severe seepage from ceiling, water stains spreading to bedroom wall', photoBeforeUrl: '', annotatedPhotoUrl: '', photoAfterUrl: '', reportedByName: 'Ramesh Agarwal', reportedAt: '2026-11-16T10:00:00', assignedSubcontractorId: 'SUB-WP-01', assignedSubcontractorName: 'Sharma Waterproofing', subcontractorTrade: 'Waterproofing', assignedAt: '2026-11-18T10:00:00', targetResolutionDate: '2026-12-01', resolvedAt: '', reInspectionDate: '', reInspectedByName: '', reworkCount: 1, reInspectionCount: 1, resolutionNotes: '', disputeReason: '', possessionBlocker: true, buyerAcknowledged: false },
    { id: 2, flatNumber: 'A-1501', towerName: 'Tower A', floorNumber: 15, snagCode: 'SNAG-TA-1501-002', category: 'ELECTRICAL', severity: 'CRITICAL', status: 'WORK_IN_PROGRESS', roomLocation: 'KITCHEN', exactCoordinates: '', description: 'Faulty wiring in kitchen — MCB tripping on appliance load', photoBeforeUrl: '', annotatedPhotoUrl: '', photoAfterUrl: '', reportedByName: 'Ramesh Agarwal', reportedAt: '2026-11-18T10:00:00', assignedSubcontractorId: 'SUB-EL-01', assignedSubcontractorName: 'Jain Electricals', subcontractorTrade: 'Electrical', assignedAt: '2026-11-20T10:00:00', targetResolutionDate: '2026-11-30', resolvedAt: '', reInspectionDate: '', reInspectedByName: '', reworkCount: 0, reInspectionCount: 0, resolutionNotes: '', disputeReason: '', possessionBlocker: true, buyerAcknowledged: false },
    { id: 3, flatNumber: 'A-1501', towerName: 'Tower A', floorNumber: 15, snagCode: 'SNAG-TA-1501-003', category: 'FLOORING', severity: 'MINOR', status: 'RE_INSPECTION_PASSED', roomLocation: 'LIVING_ROOM', exactCoordinates: '', description: 'Cracked vitrified tile near entrance — 2x2 ft patch', photoBeforeUrl: '', annotatedPhotoUrl: '', photoAfterUrl: '/photos/fixed-tile.jpg', reportedByName: 'Ramesh Agarwal', reportedAt: '2026-11-13T10:00:00', assignedSubcontractorId: 'SUB-FL-01', assignedSubcontractorName: 'Gupta Flooring', subcontractorTrade: 'Flooring', assignedAt: '2026-11-15T10:00:00', targetResolutionDate: '2026-11-25', resolvedAt: '2026-11-23T10:00:00', reInspectionDate: '2026-11-24T10:00:00', reInspectedByName: 'QA Inspector Priya', reworkCount: 0, reInspectionCount: 1, resolutionNotes: '', disputeReason: '', possessionBlocker: false, buyerAcknowledged: false },
    { id: 4, flatNumber: 'B-802', towerName: 'Tower B', floorNumber: 8, snagCode: 'SNAG-TB-802-001', category: 'PAINTING', severity: 'COSMETIC', status: 'LOGGED', roomLocation: 'MASTER_BEDROOM', exactCoordinates: '', description: 'Uneven paint finish on accent wall, visible brush strokes', photoBeforeUrl: '', annotatedPhotoUrl: '', photoAfterUrl: '', reportedByName: 'Priya Sharma', reportedAt: '2026-11-25T10:00:00', assignedSubcontractorId: '', assignedSubcontractorName: '', subcontractorTrade: '', assignedAt: '', targetResolutionDate: '', resolvedAt: '', reInspectionDate: '', reInspectedByName: '', reworkCount: 0, reInspectionCount: 0, resolutionNotes: '', disputeReason: '', possessionBlocker: false, buyerAcknowledged: false },
    { id: 5, flatNumber: 'B-802', towerName: 'Tower B', floorNumber: 8, snagCode: 'SNAG-TB-802-002', category: 'PLUMBING', severity: 'MAJOR', status: 'RE_INSPECTION_PENDING', roomLocation: 'BATHROOM_COMMON', exactCoordinates: '', description: 'Hot water line not connected to geyser outlet', photoBeforeUrl: '', annotatedPhotoUrl: '', photoAfterUrl: '', reportedByName: 'Priya Sharma', reportedAt: '2026-11-20T10:00:00', assignedSubcontractorId: 'SUB-PL-01', assignedSubcontractorName: 'Kumar Plumbing', subcontractorTrade: 'Plumbing', assignedAt: '2026-11-22T10:00:00', targetResolutionDate: '2026-11-28', resolvedAt: '2026-11-27T10:00:00', reInspectionDate: '', reInspectedByName: '', reworkCount: 0, reInspectionCount: 0, resolutionNotes: 'Connected hot water line, tested flow', disputeReason: '', possessionBlocker: true, buyerAcknowledged: false },
    { id: 6, flatNumber: 'C-304', towerName: 'Tower C', floorNumber: 3, snagCode: 'SNAG-TC-304-001', category: 'GLASS_ALUMINUM', severity: 'MAJOR', status: 'DISPUTED', roomLocation: 'BALCONY', exactCoordinates: '', description: 'Sliding door track misaligned — door doesn\'t close flush', photoBeforeUrl: '', annotatedPhotoUrl: '', photoAfterUrl: '', reportedByName: 'Vikram Reddy', reportedAt: '2026-11-08T10:00:00', assignedSubcontractorId: '', assignedSubcontractorName: '', subcontractorTrade: '', assignedAt: '', targetResolutionDate: '', resolvedAt: '', reInspectionDate: '', reInspectedByName: '', reworkCount: 0, reInspectionCount: 0, resolutionNotes: '', disputeReason: 'Builder claims within tolerance, buyer disagrees', possessionBlocker: true, buyerAcknowledged: false },
  ],
  possessionBlockers: [],
  inspections: [
    { id: 1, flatNumber: 'A-1501', towerName: 'Tower A', floorNumber: 15, phase: 'PRE_POSSESSION', outcome: 'FAIL', inspectorName: 'QA Inspector Priya', buyerName: 'Ramesh Agarwal', scheduledAt: '2026-11-16T09:00:00', completedAt: '2026-11-16T11:00:00', durationMinutes: 120, totalSnagsFound: 3, criticalSnagsOpen: 2, majorSnagsOpen: 0, minorSnagsOpen: 1, possessionSignOffBlocked: true, buyerSignedOff: false },
    { id: 2, flatNumber: 'B-802', towerName: 'Tower B', floorNumber: 8, phase: 'PRE_POSSESSION', outcome: 'CONDITIONAL_PASS', inspectorName: 'QA Inspector Rahul', buyerName: 'Priya Sharma', scheduledAt: '2026-11-20T09:00:00', completedAt: '2026-11-20T10:30:00', durationMinutes: 90, totalSnagsFound: 2, criticalSnagsOpen: 0, majorSnagsOpen: 1, minorSnagsOpen: 1, possessionSignOffBlocked: false, buyerSignedOff: false },
  ],
};

const DEMO_CORPUS: CutoverDashboard = {
  totalTransactions: 15, totalInflows: 80420000, totalOutflows: 9150000, netBalance: 71270000,
  totalGst: 1647000, totalTds: 120000,
  amountByType: { BUILDER_DEPOSIT: 80000000, INTEREST_EARNED: 420000, MAINTENANCE_EXPENSE: -3950000, UTILITY_PAYMENT: -2550000, STAFF_SALARY: -1200000, REPAIR_FUND: -450000, INSURANCE_PREMIUM: -320000, LEGAL_EXPENSE: -180000, SINKING_FUND: -500000, ESCROW_HOLD: 2500000 },
  expenseBreakdown: { 'MAINTENANCE EXPENSE': 3950000, 'UTILITY PAYMENT': 2550000, 'STAFF SALARY': 1200000, 'REPAIR FUND': 450000, 'INSURANCE PREMIUM': 320000, 'LEGAL EXPENSE': 180000, 'SINKING FUND': 500000 },
  byStatus: { VERIFIED: 11, DISPUTED: 1, PENDING_VERIFICATION: 2, FROZEN: 1 },
  disputedCount: 1, escrowHoldCount: 1,
  latestSnapshot: { id: 1, snapshotCode: 'CUT-12345', status: 'DRAFT', cutoverDate: '2026-11-28', totalCorpusFund: 80000000, maintenanceReserve: 40000000, sinkingFund: 16000000, repairFund: 12000000, insuranceFund: 12000000, totalEscrowHeld: 2500000, totalExpenses18Months: 9150000, totalVouchers: 15, verifiedVouchers: 11, disputedVouchers: 1, pendingVouchers: 2, openingBalanceRwa: 71270000, openingBalanceFrozen: false, builderSignatoryName: 'Sunrise Builders Pvt Ltd', rwaPresidentName: '', rwaTreasurerName: '', totalFlats: 1500, possessionCompleted: 1200, possessionPending: 300, handoverCompletionPercent: 80 },
  transactions: [],
  disputedTransactions: [
    { id: 10, voucherNumber: 'VCH-010', type: 'LEGAL_EXPENSE', status: 'DISPUTED', cutoverPhase: 'PRE_CUTOVER', amount: 180000, gstAmount: 32400, tdsDeducted: 0, netAmount: -180000, description: 'RWA registration & legal fees', category: 'LEGAL EXPENSE', transactionDate: '2025-10-15', financialYear: '2025-26', monthNumber: 10, paidToOrReceivedFrom: 'Advocate K. Sharma & Associates', paymentMode: 'NEFT', disputeReason: 'RWA questions necessity of these legal fees — builder may have used for own litigation', disputeRaisedBy: 'RWA Treasurer', disputeResolution: '', frozen: false },
  ],
  escrowHolds: [
    { id: 14, voucherNumber: 'VCH-014', type: 'ESCROW_HOLD', status: 'VERIFIED', cutoverPhase: 'PRE_CUTOVER', amount: 2500000, gstAmount: 0, tdsDeducted: 0, netAmount: 2500000, description: 'Disputed charges held in escrow', category: 'Escrow', transactionDate: '2026-01-15', financialYear: '2026-27', monthNumber: 1, paidToOrReceivedFrom: 'Escrow Account', paymentMode: 'INTERNAL_TRANSFER', disputeReason: 'Pending resolution of maintenance overcharges', disputeRaisedBy: '', disputeResolution: '', frozen: false },
  ],
};

// ─── Helpers ───

const formatCurrency = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN');

const severityColor = (s: string) => {
  switch (s) { case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30'; case 'MAJOR': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'; case 'MINOR': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'; default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'; }
};

const statusColor = (s: string) => {
  switch (s) { case 'CLOSED': case 'RE_INSPECTION_PASSED': case 'VERIFIED': return 'bg-green-500/20 text-green-400'; case 'WORK_IN_PROGRESS': case 'IN_PROGRESS': return 'bg-blue-500/20 text-blue-400'; case 'ASSIGNED': return 'bg-purple-500/20 text-purple-400'; case 'RE_INSPECTION_PENDING': case 'PENDING_VERIFICATION': return 'bg-cyan-500/20 text-cyan-400'; case 'LOGGED': return 'bg-gray-500/20 text-gray-400'; case 'DISPUTED': return 'bg-red-500/20 text-red-400'; case 'REWORK_NEEDED': return 'bg-orange-500/20 text-orange-400'; default: return 'bg-gray-500/20 text-gray-400'; }
};

const outcomeColor = (o: string) => {
  switch (o) { case 'PASS': return 'text-green-400'; case 'CONDITIONAL_PASS': return 'text-yellow-400'; case 'FAIL': return 'text-red-400'; default: return 'text-gray-400'; }
};

const catIcon = (c: string) => {
  switch (c) { case 'WATERPROOFING': return <Droplets className="w-4 h-4 text-blue-400" />; case 'ELECTRICAL': return <Zap className="w-4 h-4 text-yellow-400" />; case 'PLUMBING': return <Droplets className="w-4 h-4 text-cyan-400" />; case 'PAINTING': return <PaintBucket className="w-4 h-4 text-purple-400" />; case 'FLOORING': return <Layers className="w-4 h-4 text-orange-400" />; case 'CARPENTRY': return <Hammer className="w-4 h-4 text-amber-400" />; default: return <Wrench className="w-4 h-4 text-gray-400" />; }
};

// ─── Snag Panel ───

const SnagPanel: React.FC<{ data: SnagDashboard }> = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Snags', value: data.totalSnags, icon: <ClipboardCheck className="w-5 h-5 text-blue-400" />, color: 'border-blue-500/30' },
        { label: 'Possession Blockers', value: data.openBlockers, icon: <XCircle className="w-5 h-5 text-red-400" />, color: 'border-red-500/30' },
        { label: 'Total Reworks', value: data.totalReworks, icon: <ArrowUpCircle className="w-5 h-5 text-orange-400" />, color: 'border-orange-500/30' },
        { label: 'Avg Resolve (hrs)', value: data.avgResolveHours.toFixed(0), icon: <Clock className="w-5 h-5 text-green-400" />, color: 'border-green-500/30' },
      ].map((kpi, i) => (
        <div key={i} className={`bg-gray-800/50 rounded-lg p-4 border ${kpi.color}`}>
          <div className="flex items-center gap-2 mb-1">{kpi.icon}<span className="text-xs text-gray-400">{kpi.label}</span></div>
          <div className="text-2xl font-bold text-white">{kpi.value}</div>
        </div>
      ))}
    </div>

    {/* Severity & Status Distribution */}
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">By Severity</h3>
        {Object.entries(data.bySeverity).map(([sev, count]) => (
          <div key={sev} className="flex items-center justify-between py-1.5">
            <span className={`text-xs px-2 py-0.5 rounded border ${severityColor(sev)}`}>{sev}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-700 rounded-full h-2"><div className={`h-2 rounded-full ${sev === 'CRITICAL' ? 'bg-red-500' : sev === 'MAJOR' ? 'bg-orange-500' : 'bg-yellow-500'}`} style={{ width: `${(count / data.totalSnags) * 100}%` }} /></div>
              <span className="text-sm text-white w-6 text-right">{count}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">By Tower</h3>
        {Object.entries(data.byTower).map(([tower, count]) => (
          <div key={tower} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-300 flex items-center gap-1"><Building2 className="w-3 h-3" /> {tower}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-700 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(count / data.totalSnags) * 100}%` }} /></div>
              <span className="text-sm text-white w-6 text-right">{count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Snag Pipeline */}
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Snag Resolution Pipeline</h3>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['LOGGED', 'ASSIGNED', 'WORK_IN_PROGRESS', 'RE_INSPECTION_PENDING', 'RE_INSPECTION_PASSED', 'DISPUTED'].map(s => (
          <div key={s} className="text-center min-w-[100px]">
            <div className={`text-lg font-bold ${statusColor(s).includes('green') ? 'text-green-400' : statusColor(s).includes('red') ? 'text-red-400' : statusColor(s).includes('blue') ? 'text-blue-400' : 'text-gray-400'}`}>{data.byStatus[s] || 0}</div>
            <div className="text-xs text-gray-500">{s.replace(/_/g, ' ')}</div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {data.allSnags.map(snag => (
          <div key={snag.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {catIcon(snag.category)}<span className="font-medium text-white">{snag.snagCode}</span>
                <span className="text-xs text-gray-400">{snag.flatNumber} • {snag.towerName} • {snag.roomLocation?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded border ${severityColor(snag.severity)}`}>{snag.severity}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${statusColor(snag.status)}`}>{snag.status.replace(/_/g, ' ')}</span>
                {snag.possessionBlocker && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded flex items-center gap-1"><Lock className="w-3 h-3" />BLOCKER</span>}
              </div>
            </div>
            <div className="text-sm text-gray-300 mb-2">{snag.description}</div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
              <div>Reported: {snag.reportedByName}</div>
              <div>Contractor: {snag.assignedSubcontractorName || 'Unassigned'}</div>
              <div>Target: {snag.targetResolutionDate || '—'}</div>
            </div>
            {snag.reworkCount > 0 && <div className="text-xs text-orange-400 mt-1">Reworks: {snag.reworkCount} | Re-inspections: {snag.reInspectionCount}</div>}
            {snag.disputeReason && <div className="text-xs text-red-400 mt-1 bg-red-500/10 rounded p-2 border border-red-500/20">{snag.disputeReason}</div>}
          </div>
        ))}
      </div>
    </div>

    {/* Subcontractor Leaderboard */}
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Subcontractor Leaderboard</h3>
      <div className="space-y-2">
        {Object.values(data.subcontractorScores).map(sub => (
          <div key={sub.name} className="bg-gray-900/50 rounded p-3 flex items-center justify-between">
            <div><div className="text-white font-medium">{sub.name}</div><div className="text-xs text-gray-400">{sub.trade}</div></div>
            <div className="flex items-center gap-4">
              <div className="text-center"><div className="text-sm text-green-400">{sub.closedSnags}/{sub.totalSnags}</div><div className="text-xs text-gray-500">Closed</div></div>
              <div className="text-center"><div className={`text-sm ${sub.reworkRatePct > 20 ? 'text-red-400' : 'text-green-400'}`}>{sub.reworkRatePct.toFixed(0)}%</div><div className="text-xs text-gray-500">Rework</div></div>
              <div className="w-16 bg-gray-700 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${sub.totalSnags > 0 ? (sub.closedSnags / sub.totalSnags * 100) : 0}%` }} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Inspections */}
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Eye className="w-4 h-4" /> Flat Inspections</h3>
      <div className="space-y-2">
        {data.inspections.map(insp => (
          <div key={insp.id} className="bg-gray-900/50 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <div><span className="text-white font-medium">{insp.flatNumber}</span><span className="text-gray-400 text-sm ml-2">{insp.towerName}</span></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{insp.phase.replace(/_/g, ' ')}</span>
                <span className={`text-sm font-semibold ${outcomeColor(insp.outcome)}`}>{insp.outcome.replace(/_/g, ' ')}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>Inspector: <span className="text-white">{insp.inspectorName}</span></div>
              <div>Buyer: <span className="text-white">{insp.buyerName}</span></div>
              <div>Snags: <span className="text-white">{insp.totalSnagsFound}</span> (<span className="text-red-400">{insp.criticalSnagsOpen}C</span> <span className="text-orange-400">{insp.majorSnagsOpen}M</span>)</div>
              <div>{insp.possessionSignOffBlocked ? <span className="text-red-400 flex items-center gap-1"><Lock className="w-3 h-3" />Sign-off blocked</span> : <span className="text-green-400">Can sign off</span>}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Corpus Panel ───

const CorpusPanel: React.FC<{ data: CutoverDashboard }> = ({ data }) => {
  const snap = data.latestSnapshot;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Corpus', value: formatCurrency(data.totalInflows), icon: <DollarSign className="w-5 h-5 text-green-400" />, color: 'border-green-500/30' },
          { label: 'Total Expenses', value: formatCurrency(data.totalOutflows), icon: <TrendingDown className="w-5 h-5 text-red-400" />, color: 'border-red-500/30' },
          { label: 'Net Balance', value: formatCurrency(data.netBalance), icon: <Scale className="w-5 h-5 text-blue-400" />, color: 'border-blue-500/30' },
          { label: 'Disputed', value: data.disputedCount, icon: <AlertTriangle className="w-5 h-5 text-orange-400" />, color: 'border-orange-500/30' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-gray-800/50 rounded-lg p-4 border ${kpi.color}`}>
            <div className="flex items-center gap-2 mb-1">{kpi.icon}<span className="text-xs text-gray-400">{kpi.label}</span></div>
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Cutover Snapshot */}
      {snap && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Cutover Snapshot — {snap.snapshotCode}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><div className="text-xs text-gray-400">Status</div><div className={`text-sm font-semibold ${snap.openingBalanceFrozen ? 'text-blue-400' : 'text-yellow-400'}`}>{snap.status.replace(/_/g, ' ')}</div></div>
            <div><div className="text-xs text-gray-400">Handover Progress</div><div className="text-sm text-white">{snap.possessionCompleted}/{snap.totalFlats} flats ({snap.handoverCompletionPercent.toFixed(0)}%)</div></div>
            <div><div className="text-xs text-gray-400">Opening Balance (RWA)</div><div className="text-lg font-bold text-green-400">{formatCurrency(snap.openingBalanceRwa)}</div></div>
            <div><div className="text-xs text-gray-400">Balance Frozen?</div><div className={`text-sm font-semibold flex items-center gap-1 ${snap.openingBalanceFrozen ? 'text-blue-400' : 'text-yellow-400'}`}><Lock className="w-4 h-4" />{snap.openingBalanceFrozen ? 'FROZEN' : 'NOT FROZEN'}</div></div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full" style={{ width: `${snap.handoverCompletionPercent}%` }} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-900/50 rounded p-3 text-center"><div className="text-lg font-bold text-green-400">{formatCurrency(snap.maintenanceReserve)}</div><div className="text-xs text-gray-400">Maintenance Reserve</div></div>
            <div className="bg-gray-900/50 rounded p-3 text-center"><div className="text-lg font-bold text-blue-400">{formatCurrency(snap.sinkingFund)}</div><div className="text-xs text-gray-400">Sinking Fund</div></div>
            <div className="bg-gray-900/50 rounded p-3 text-center"><div className="text-lg font-bold text-purple-400">{formatCurrency(snap.repairFund)}</div><div className="text-xs text-gray-400">Repair Fund</div></div>
            <div className="bg-gray-900/50 rounded p-3 text-center"><div className="text-lg font-bold text-cyan-400">{formatCurrency(snap.insuranceFund)}</div><div className="text-xs text-gray-400">Insurance Fund</div></div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-gray-900/50 rounded p-2 text-center"><div className="text-sm text-green-400">{snap.verifiedVouchers}</div><div className="text-xs text-gray-500">Verified</div></div>
            <div className="bg-gray-900/50 rounded p-2 text-center"><div className="text-sm text-red-400">{snap.disputedVouchers}</div><div className="text-xs text-gray-500">Disputed</div></div>
            <div className="bg-gray-900/50 rounded p-2 text-center"><div className="text-sm text-yellow-400">{snap.pendingVouchers}</div><div className="text-xs text-gray-500">Pending</div></div>
          </div>
        </div>
      )}

      {/* Expense Breakdown */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Expense Breakdown (18 Months)</h3>
        <div className="space-y-2">
          {Object.entries(data.expenseBreakdown).sort(([,a],[,b]) => b - a).map(([cat, amt]) => (
            <div key={cat} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-300">{cat}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-2"><div className="bg-red-500/60 h-2 rounded-full" style={{ width: `${(amt / data.totalOutflows) * 100}%` }} /></div>
                <span className="text-sm text-white w-24 text-right">{formatCurrency(amt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Escrow & Disputed */}
      <div className="grid grid-cols-2 gap-4">
        {data.disputedTransactions.length > 0 && (
          <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Disputed Charges</h3>
            {data.disputedTransactions.map(txn => (
              <div key={txn.id} className="bg-gray-900/50 rounded p-3 mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{txn.voucherNumber}</span>
                  <span className="text-red-400 font-semibold">{formatCurrency(txn.amount)}</span>
                </div>
                <div className="text-xs text-gray-300">{txn.description}</div>
                <div className="text-xs text-red-300 mt-1 bg-red-500/10 rounded p-2">{txn.disputeReason}</div>
                <div className="text-xs text-gray-500 mt-1">{txn.paidToOrReceivedFrom} • {txn.financialYear}</div>
              </div>
            ))}
          </div>
        )}
        {data.escrowHolds.length > 0 && (
          <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
            <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2"><Lock className="w-4 h-4" /> Escrow Holds</h3>
            {data.escrowHolds.map(txn => (
              <div key={txn.id} className="bg-gray-900/50 rounded p-3 mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{txn.voucherNumber}</span>
                  <span className="text-blue-400 font-semibold">{formatCurrency(txn.amount)}</span>
                </div>
                <div className="text-xs text-gray-300">{txn.description}</div>
                {txn.disputeReason && <div className="text-xs text-blue-300 mt-1">{txn.disputeReason}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voucher Status */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Voucher Verification Status</h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(data.byStatus).map(([status, count]) => (
            <div key={status} className="bg-gray-900/50 rounded p-3 text-center">
              <div className={`text-2xl font-bold ${statusColor(status).includes('green') ? 'text-green-400' : statusColor(status).includes('red') ? 'text-red-400' : statusColor(status).includes('cyan') ? 'text-cyan-400' : 'text-gray-400'}`}>{count}</div>
              <div className="text-xs text-gray-400 mt-1">{status.replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───

const BuilderHandoverDashboard: React.FC = () => {
  const [tab, setTab] = useState<'snags' | 'corpus'>('snags');
  const [snagData, setSnagData] = useState<SnagDashboard>(DEMO_SNAG);
  const [corpusData, setCorpusData] = useState<CutoverDashboard>(DEMO_CORPUS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [snags, corpus] = await Promise.all([
          builderHandoverApi.getSnagDashboard(),
          builderHandoverApi.getCorpusDashboard(),
        ]);
        setSnagData(snags);
        setCorpusData(corpus);
      } catch { /* use demo data */ }
      setLoading(false);
    };
    load();
  }, []);

  const tabs = [
    { key: 'snags' as const, label: 'Snag List & Inspections', icon: <ClipboardCheck className="w-4 h-4" /> },
    { key: 'corpus' as const, label: 'Corpus Fund & Cutover', icon: <DollarSign className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-orange-600/20 rounded-lg"><Building2 className="w-6 h-6 text-orange-400" /></div>
              Builder Handover & Pre-Possession
            </h1>
            <p className="text-gray-400 text-sm mt-1">Snag resolution engine • Flat inspections • Corpus fund cutover • Escrow tracking</p>
          </div>
          {loading && <div className="text-xs text-gray-500 animate-pulse">Loading live data...</div>}
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t text-sm transition-colors ${tab === t.key ? 'bg-gray-800 text-white border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {tab === 'snags' && <SnagPanel data={snagData} />}
        {tab === 'corpus' && <CorpusPanel data={corpusData} />}
      </div>
    </div>
  );
};

export default BuilderHandoverDashboard;
