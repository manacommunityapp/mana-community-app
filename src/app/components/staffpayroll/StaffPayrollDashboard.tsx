import React, { useState, useEffect } from 'react';
import {
  Users, Briefcase, IndianRupee, Calendar, Clock, AlertTriangle,
  CreditCard, FileText, TrendingUp, TrendingDown, ChevronRight,
  CheckCircle2, XCircle, Banknote, Receipt, ArrowUpDown
} from 'lucide-react';
import type {
  StaffPayrollDashboard as DashboardType, PayrollLedger, SalaryAdvance,
  AdvanceInstallment, StaffSummary, EmployerContract, AdvanceDashboard
} from '../../../services/staffpayroll/staffPayrollService';

// Demo data for when backend is unavailable
const demoDashboard: DashboardType = {
  totalStaff: 3, activeContracts: 8,
  totalMonthlyWages: 58500, totalPaid: 6000, totalPending: 19383,
  totalAdvancesOutstanding: 5000,
  staffByRole: { MAID: 1, COOK: 1, NANNY: 1 },
  contractsByCycle: { FIRST_TO_FIRST: 3, TENTH_TO_TENTH: 3, FIFTEENTH_TO_FIFTEENTH: 2 },
  staffSummaries: [
    { staffId: 1, name: 'Sunita Devi', staffCode: 'STF-001', role: 'MAID', employers: 3, totalMonthlySalary: 15500, advanceOutstanding: 5000 },
    { staffId: 2, name: 'Raju Kumar', staffCode: 'STF-002', role: 'COOK', employers: 2, totalMonthlySalary: 15500, advanceOutstanding: 0 },
    { staffId: 3, name: 'Meena Kumari', staffCode: 'STF-003', role: 'NANNY', employers: 3, totalMonthlySalary: 27500, advanceOutstanding: 0 },
  ],
  payrolls: [
    { id: 1, staffId: 1, staffName: 'Sunita Devi', contractId: 1, employerFlatNumber: 'A-101', employerName: 'Sharma Family', payrollMonth: '2026-11', cycleStartDate: '2026-11-01', cycleEndDate: '2026-11-30', totalDaysInCycle: 30, daysPresent: 20, daysAbsent: 1, halfDays: 2, paidLeaves: 2, weeklyOffs: 4, unpaidLeaves: 1, grossSalary: 5000, attendanceDeduction: 334, advanceDeduction: 2500, bonusAmount: 0, netPayable: 2166, status: 'CALCULATED' },
    { id: 2, staffId: 1, staffName: 'Sunita Devi', contractId: 2, employerFlatNumber: 'B-204', employerName: 'Gupta Family', payrollMonth: '2026-11', cycleStartDate: '2026-10-10', cycleEndDate: '2026-11-09', totalDaysInCycle: 31, daysPresent: 22, daysAbsent: 0, halfDays: 1, paidLeaves: 3, weeklyOffs: 4, unpaidLeaves: 0, grossSalary: 6000, attendanceDeduction: 0, advanceDeduction: 0, bonusAmount: 0, netPayable: 6000, status: 'PAID' },
    { id: 3, staffId: 1, staffName: 'Sunita Devi', contractId: 3, employerFlatNumber: 'C-302', employerName: 'Patel Family', payrollMonth: '2026-11', cycleStartDate: '2026-10-15', cycleEndDate: '2026-11-14', totalDaysInCycle: 31, daysPresent: 23, daysAbsent: 2, halfDays: 1, paidLeaves: 2, weeklyOffs: 0, unpaidLeaves: 2, grossSalary: 4500, attendanceDeduction: 450, advanceDeduction: 0, bonusAmount: 0, netPayable: 4050, status: 'CALCULATED' },
    { id: 4, staffId: 2, staffName: 'Raju Kumar', contractId: 4, employerFlatNumber: 'A-502', employerName: 'Mehta Family', payrollMonth: '2026-11', cycleStartDate: '2026-11-01', cycleEndDate: '2026-11-30', totalDaysInCycle: 30, daysPresent: 24, daysAbsent: 0, halfDays: 0, paidLeaves: 1, weeklyOffs: 4, unpaidLeaves: 0, grossSalary: 8000, attendanceDeduction: 0, advanceDeduction: 5000, bonusAmount: 0, netPayable: 3000, status: 'CALCULATED' },
    { id: 5, staffId: 3, staffName: 'Meena Kumari', contractId: 6, employerFlatNumber: 'A-101', employerName: 'Sharma Family', payrollMonth: '2026-11', cycleStartDate: '2026-11-01', cycleEndDate: '2026-11-30', totalDaysInCycle: 30, daysPresent: 21, daysAbsent: 1, halfDays: 2, paidLeaves: 2, weeklyOffs: 4, unpaidLeaves: 0, grossSalary: 10000, attendanceDeduction: 333, advanceDeduction: 0, bonusAmount: 500, netPayable: 10167, status: 'APPROVED' },
  ],
  advances: [
    { id: 1, staffId: 1, staffName: 'Sunita Devi', contractId: 1, employerFlatNumber: 'A-101', employerName: 'Sharma Family', principalAmount: 10000, totalInstallments: 4, emiAmount: 2500, installmentsPaid: 2, amountRepaid: 5000, outstandingBalance: 5000, status: 'ACTIVE', paymentMethod: 'UPI', upiTransactionId: 'UPI-2026-SEP-001', disbursedAt: '2026-09-01T10:00:00', firstEmiDate: '2026-10-01', lastEmiDate: '2027-01-01', terminatedEarly: false, purpose: 'Children school fees', receiptUrlEn: '/receipts/en/adv-001.pdf', receiptUrlHi: '/receipts/hi/adv-001.pdf' },
    { id: 2, staffId: 2, staffName: 'Raju Kumar', contractId: 4, employerFlatNumber: 'A-502', employerName: 'Mehta Family', principalAmount: 15000, totalInstallments: 3, emiAmount: 5000, installmentsPaid: 1, amountRepaid: 5000, outstandingBalance: 10000, status: 'TERMINATED_PENDING', paymentMethod: 'CASH', disbursedAt: '2026-10-01T10:00:00', firstEmiDate: '2026-11-01', lastEmiDate: '2027-01-01', terminatedEarly: true, terminationDate: '2026-11-15', settlementAmount: 10000, purpose: 'Medical emergency', receiptUrlEn: '/receipts/en/adv-002.pdf', receiptUrlHi: '/receipts/hi/adv-002.pdf' },
  ],
  contracts: [
    { id: 1, communityId: 'COMM-001', staffId: 1, employerFlatNumber: 'A-101', employerTowerName: 'Tower A', employerName: 'Sharma Family', monthlySalary: 5000, dailyRate: 167, salaryCycle: 'FIRST_TO_FIRST', halfDayRule: 'HALF_SALARY', paidLeavesPerMonth: 2, weeklyOffSunday: true, status: 'ACTIVE', startDate: '2023-04-01' },
    { id: 2, communityId: 'COMM-001', staffId: 1, employerFlatNumber: 'B-204', employerTowerName: 'Tower B', employerName: 'Gupta Family', monthlySalary: 6000, dailyRate: 200, salaryCycle: 'TENTH_TO_TENTH', halfDayRule: 'NO_DEDUCTION', paidLeavesPerMonth: 3, weeklyOffSunday: true, status: 'ACTIVE', startDate: '2023-05-10' },
    { id: 3, communityId: 'COMM-001', staffId: 1, employerFlatNumber: 'C-302', employerTowerName: 'Tower C', employerName: 'Patel Family', monthlySalary: 4500, dailyRate: 150, salaryCycle: 'FIFTEENTH_TO_FIFTEENTH', halfDayRule: 'FULL_DEDUCTION', paidLeavesPerMonth: 2, weeklyOffSunday: false, status: 'ACTIVE', startDate: '2023-07-15' },
    { id: 4, communityId: 'COMM-001', staffId: 2, employerFlatNumber: 'A-502', employerTowerName: 'Tower A', employerName: 'Mehta Family', monthlySalary: 8000, dailyRate: 267, salaryCycle: 'FIRST_TO_FIRST', halfDayRule: 'HALF_SALARY', paidLeavesPerMonth: 4, weeklyOffSunday: true, status: 'ACTIVE', startDate: '2023-07-01' },
    { id: 5, communityId: 'COMM-001', staffId: 2, employerFlatNumber: 'D-101', employerTowerName: 'Tower D', employerName: 'Singh Family', monthlySalary: 7500, dailyRate: 250, salaryCycle: 'TENTH_TO_TENTH', halfDayRule: 'NO_DEDUCTION', paidLeavesPerMonth: 3, weeklyOffSunday: true, status: 'ACTIVE', startDate: '2023-08-10' },
    { id: 6, communityId: 'COMM-001', staffId: 3, employerFlatNumber: 'A-101', employerTowerName: 'Tower A', employerName: 'Sharma Family', monthlySalary: 10000, dailyRate: 333, salaryCycle: 'FIRST_TO_FIRST', halfDayRule: 'HALF_SALARY', paidLeavesPerMonth: 4, weeklyOffSunday: true, status: 'ACTIVE', startDate: '2024-02-01' },
    { id: 7, communityId: 'COMM-001', staffId: 3, employerFlatNumber: 'B-204', employerTowerName: 'Tower B', employerName: 'Gupta Family', monthlySalary: 9000, dailyRate: 300, salaryCycle: 'FIFTEENTH_TO_FIFTEENTH', halfDayRule: 'NO_DEDUCTION', paidLeavesPerMonth: 3, weeklyOffSunday: true, status: 'ACTIVE', startDate: '2024-02-15' },
    { id: 8, communityId: 'COMM-001', staffId: 3, employerFlatNumber: 'E-401', employerTowerName: 'Tower E', employerName: 'Reddy Family', monthlySalary: 8500, dailyRate: 283, salaryCycle: 'TENTH_TO_TENTH', halfDayRule: 'FULL_DEDUCTION', paidLeavesPerMonth: 2, weeklyOffSunday: false, status: 'ACTIVE', startDate: '2024-03-10' },
  ],
};

const demoInstallments: AdvanceInstallment[] = [
  { id: 1, advanceId: 1, staffId: 1, contractId: 1, installmentNumber: 1, amount: 2500, dueDate: '2026-10-01', payrollMonth: '2026-10', status: 'DEDUCTED', deductedAt: '2026-10-01T12:00:00', balanceAfterDeduction: 7500 },
  { id: 2, advanceId: 1, staffId: 1, contractId: 1, installmentNumber: 2, amount: 2500, dueDate: '2026-11-01', payrollMonth: '2026-11', status: 'DEDUCTED', deductedAt: '2026-11-01T12:00:00', balanceAfterDeduction: 5000 },
  { id: 3, advanceId: 1, staffId: 1, contractId: 1, installmentNumber: 3, amount: 2500, dueDate: '2026-12-01', payrollMonth: '2026-12', status: 'SCHEDULED', balanceAfterDeduction: 2500 },
  { id: 4, advanceId: 1, staffId: 1, contractId: 1, installmentNumber: 4, amount: 2500, dueDate: '2027-01-01', payrollMonth: '2027-01', status: 'SCHEDULED', balanceAfterDeduction: 0 },
  { id: 5, advanceId: 2, staffId: 2, contractId: 4, installmentNumber: 1, amount: 5000, dueDate: '2026-11-01', payrollMonth: '2026-11', status: 'DEDUCTED', deductedAt: '2026-11-01T12:00:00', balanceAfterDeduction: 10000 },
  { id: 6, advanceId: 2, staffId: 2, contractId: 4, installmentNumber: 2, amount: 5000, dueDate: '2026-12-01', payrollMonth: '2026-12', status: 'SKIPPED', balanceAfterDeduction: 5000, remarks: 'Contract terminated — settlement pending' },
  { id: 7, advanceId: 2, staffId: 2, contractId: 4, installmentNumber: 3, amount: 5000, dueDate: '2027-01-01', payrollMonth: '2027-01', status: 'SKIPPED', balanceAfterDeduction: 0, remarks: 'Contract terminated — settlement pending' },
];

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const statusColor = (s: string) => {
  const map: Record<string, string> = {
    CALCULATED: 'bg-yellow-100 text-yellow-800', APPROVED: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800', DISPUTED: 'bg-red-100 text-red-800',
    DRAFT: 'bg-gray-100 text-gray-800', ACTIVE: 'bg-green-100 text-green-800',
    FULLY_REPAID: 'bg-blue-100 text-blue-800', TERMINATED_PENDING: 'bg-orange-100 text-orange-800',
    WRITTEN_OFF: 'bg-red-100 text-red-800', DEDUCTED: 'bg-green-100 text-green-800',
    SCHEDULED: 'bg-yellow-100 text-yellow-800', SKIPPED: 'bg-red-100 text-red-800',
    WAIVED: 'bg-purple-100 text-purple-800',
  };
  return map[s] || 'bg-gray-100 text-gray-800';
};

const roleIcon = (r: string) => {
  const map: Record<string, string> = { MAID: '🧹', COOK: '👨‍🍳', NANNY: '👶', DRIVER: '🚗', GARDENER: '🌿', WATCHMAN: '💂', TUTOR: '📚', PHYSIOTHERAPIST: '💪' };
  return map[r] || '👤';
};

const cycleLabel = (c: string) => {
  const map: Record<string, string> = { FIRST_TO_FIRST: '1st–1st', TENTH_TO_TENTH: '10th–10th', FIFTEENTH_TO_FIFTEENTH: '15th–15th', CUSTOM: 'Custom' };
  return map[c] || c;
};

export default function StaffPayrollDashboard() {
  const [activeTab, setActiveTab] = useState<'payroll' | 'advances'>('payroll');
  const [dashboard, setDashboard] = useState<DashboardType>(demoDashboard);
  const [installments] = useState<AdvanceInstallment[]>(demoInstallments);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [selectedAdvance, setSelectedAdvance] = useState<number | null>(null);

  const tabs = [
    { key: 'payroll' as const, label: 'Multi-Employer Payroll', icon: Briefcase },
    { key: 'advances' as const, label: 'Salary Advances & EMI', icon: CreditCard },
  ];

  const staffPayrolls = selectedStaff
    ? dashboard.payrolls.filter(p => p.staffId === selectedStaff)
    : dashboard.payrolls;

  const staffContracts = selectedStaff
    ? dashboard.contracts.filter(c => c.staffId === selectedStaff)
    : dashboard.contracts;

  const advanceInstallments = selectedAdvance
    ? installments.filter(i => i.advanceId === selectedAdvance)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg"><Users className="w-6 h-6 text-indigo-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Domestic Staff Payroll</h1>
            <p className="text-sm text-gray-500">Multi-employer wages, advances & split-household accounting</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSelectedStaff(null); setSelectedAdvance(null); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === 'payroll' ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Staff', value: dashboard.totalStaff, icon: Users, color: 'bg-indigo-500' },
                { label: 'Active Contracts', value: dashboard.activeContracts, icon: Briefcase, color: 'bg-blue-500' },
                { label: 'Monthly Wages', value: formatCurrency(dashboard.totalMonthlyWages), icon: IndianRupee, color: 'bg-green-500' },
                { label: 'Advance Outstanding', value: formatCurrency(dashboard.totalAdvancesOutstanding), icon: AlertTriangle, color: 'bg-orange-500' },
              ].map((c, i) => (
                <div key={i} className="bg-white rounded-xl border p-4 flex items-start gap-3">
                  <div className={`p-2 ${c.color} rounded-lg`}><c.icon className="w-5 h-5 text-white" /></div>
                  <div><p className="text-xs text-gray-500">{c.label}</p><p className="text-xl font-bold text-gray-900">{c.value}</p></div>
                </div>
              ))}
            </div>

            {/* Salary Cycle Distribution */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {Object.entries(dashboard.contractsByCycle).map(([cycle, count]) => (
                <div key={cycle} className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{cycleLabel(cycle)}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{count} contracts</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(count / dashboard.activeContracts) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Staff Summary Table */}
            <div className="bg-white rounded-xl border mb-6">
              <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-900">Staff Roster</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Staff', 'Role', 'Code', 'Employers', 'Monthly Salary', 'Advance Due', ''].map(h => (
                        <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dashboard.staffSummaries.map(s => (
                      <tr key={s.staffId} className={`hover:bg-gray-50 cursor-pointer ${selectedStaff === s.staffId ? 'bg-indigo-50' : ''}`}
                        onClick={() => setSelectedStaff(selectedStaff === s.staffId ? null : s.staffId)}>
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3"><span className="flex items-center gap-1">{roleIcon(s.role)} {s.role}</span></td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.staffCode}</td>
                        <td className="px-4 py-3">{s.employers} flats</td>
                        <td className="px-4 py-3 font-semibold text-green-700">{formatCurrency(s.totalMonthlySalary)}</td>
                        <td className="px-4 py-3">{s.advanceOutstanding > 0 ? <span className="text-orange-600 font-semibold">{formatCurrency(s.advanceOutstanding)}</span> : <span className="text-gray-400">—</span>}</td>
                        <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payroll Ledger */}
            <div className="bg-white rounded-xl border mb-6">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {selectedStaff ? `Payroll — ${dashboard.staffSummaries.find(s => s.staffId === selectedStaff)?.name}` : 'All Payroll Ledgers (Nov 2026)'}
                </h3>
                {selectedStaff && <button onClick={() => setSelectedStaff(null)} className="text-xs text-indigo-600 hover:underline">Show all</button>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Staff', 'Employer', 'Cycle', 'Present', 'Absent', 'Half', 'Leaves', 'Gross', 'Deductions', 'Net Pay', 'Status'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {staffPayrolls.map(p => {
                      const contract = dashboard.contracts.find(c => c.id === p.contractId);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 font-medium">{p.staffName}</td>
                          <td className="px-3 py-3">
                            <div>{p.employerName}</div>
                            <div className="text-xs text-gray-500">{p.employerFlatNumber}</div>
                          </td>
                          <td className="px-3 py-3 text-xs">{contract ? cycleLabel(contract.salaryCycle) : '—'}<br /><span className="text-gray-400">{p.cycleStartDate} → {p.cycleEndDate}</span></td>
                          <td className="px-3 py-3 text-green-700 font-medium">{p.daysPresent}d</td>
                          <td className="px-3 py-3 text-red-600">{p.daysAbsent}d</td>
                          <td className="px-3 py-3 text-yellow-600">{p.halfDays}d</td>
                          <td className="px-3 py-3">
                            <span className="text-blue-600">{p.paidLeaves}PL</span>
                            {p.weeklyOffs > 0 && <span className="text-gray-400 ml-1">{p.weeklyOffs}WO</span>}
                          </td>
                          <td className="px-3 py-3 font-medium">{formatCurrency(p.grossSalary)}</td>
                          <td className="px-3 py-3">
                            {p.attendanceDeduction > 0 && <div className="text-red-600 text-xs">-{formatCurrency(p.attendanceDeduction)} att</div>}
                            {p.advanceDeduction > 0 && <div className="text-orange-600 text-xs">-{formatCurrency(p.advanceDeduction)} adv</div>}
                            {p.attendanceDeduction === 0 && p.advanceDeduction === 0 && <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-3 py-3 font-bold text-gray-900">{formatCurrency(p.netPayable)}</td>
                          <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contracts Detail for selected staff */}
            {selectedStaff && (
              <div className="bg-white rounded-xl border">
                <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-900">Employer Contracts</h3></div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {staffContracts.map(c => (
                    <div key={c.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{c.employerName}</h4>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{c.status}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Flat</span><span>{c.employerFlatNumber}, {c.employerTowerName}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Salary</span><span className="font-semibold text-green-700">{formatCurrency(c.monthlySalary)}/mo</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Daily Rate</span><span>{formatCurrency(c.dailyRate)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Cycle</span><span className="font-medium">{cycleLabel(c.salaryCycle)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Half-Day Rule</span><span className="text-xs">{c.halfDayRule.replace(/_/g, ' ')}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Paid Leaves</span><span>{c.paidLeavesPerMonth}/mo</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Sunday Off</span><span>{c.weeklyOffSunday ? '✓' : '✗'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Advance Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Disbursed', value: formatCurrency(25000), icon: Banknote, color: 'bg-blue-500' },
                { label: 'Total Repaid', value: formatCurrency(10000), icon: TrendingUp, color: 'bg-green-500' },
                { label: 'Outstanding', value: formatCurrency(5000), icon: TrendingDown, color: 'bg-orange-500' },
                { label: 'Settlement Pending', value: formatCurrency(10000), icon: AlertTriangle, color: 'bg-red-500' },
              ].map((c, i) => (
                <div key={i} className="bg-white rounded-xl border p-4 flex items-start gap-3">
                  <div className={`p-2 ${c.color} rounded-lg`}><c.icon className="w-5 h-5 text-white" /></div>
                  <div><p className="text-xs text-gray-500">{c.label}</p><p className="text-xl font-bold text-gray-900">{c.value}</p></div>
                </div>
              ))}
            </div>

            {/* Advances Table */}
            <div className="bg-white rounded-xl border mb-6">
              <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-900">Salary Advances</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Staff', 'Employer', 'Amount', 'EMI', 'Progress', 'Outstanding', 'Method', 'Purpose', 'Status', ''].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dashboard.advances.map(a => (
                      <tr key={a.id} className={`hover:bg-gray-50 cursor-pointer ${selectedAdvance === a.id ? 'bg-indigo-50' : ''}`}
                        onClick={() => setSelectedAdvance(selectedAdvance === a.id ? null : a.id)}>
                        <td className="px-3 py-3 font-medium">{a.staffName}</td>
                        <td className="px-3 py-3"><div>{a.employerName}</div><div className="text-xs text-gray-500">{a.employerFlatNumber}</div></td>
                        <td className="px-3 py-3 font-semibold">{formatCurrency(a.principalAmount)}</td>
                        <td className="px-3 py-3">{formatCurrency(a.emiAmount)} × {a.totalInstallments}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(a.installmentsPaid / a.totalInstallments) * 100}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{a.installmentsPaid}/{a.totalInstallments}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-semibold text-orange-600">{formatCurrency(a.outstandingBalance)}</td>
                        <td className="px-3 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{a.paymentMethod}</span></td>
                        <td className="px-3 py-3 text-xs text-gray-600">{a.purpose || '—'}</td>
                        <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(a.status)}`}>{a.status.replace(/_/g, ' ')}</span></td>
                        <td className="px-3 py-3"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Termination Alert */}
            {dashboard.advances.filter(a => a.status === 'TERMINATED_PENDING').map(a => (
              <div key={a.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-800">Settlement Pending — {a.staffName}</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Contract terminated on {a.terminationDate}. Settlement amount: <strong>{formatCurrency(a.settlementAmount || 0)}</strong> outstanding.
                      Original advance of {formatCurrency(a.principalAmount)} for "{a.purpose}" — {a.installmentsPaid} of {a.totalInstallments} EMIs paid before termination.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                        📄 Receipt (EN): {a.receiptUrlEn}
                      </span>
                      <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                        📄 रसीद (HI): {a.receiptUrlHi}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Amortization Schedule */}
            {selectedAdvance && (
              <div className="bg-white rounded-xl border mb-6">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Amortization Schedule — {dashboard.advances.find(a => a.id === selectedAdvance)?.staffName}
                  </h3>
                  <button onClick={() => setSelectedAdvance(null)} className="text-xs text-indigo-600 hover:underline">Close</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['#', 'Due Date', 'Payroll Month', 'EMI Amount', 'Balance After', 'Status', 'Deducted At', 'Remarks'].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {advanceInstallments.map(inst => (
                        <tr key={inst.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs">{inst.installmentNumber}</td>
                          <td className="px-4 py-3">{inst.dueDate}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{inst.payrollMonth}</td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(inst.amount)}</td>
                          <td className="px-4 py-3">{formatCurrency(inst.balanceAfterDeduction)}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(inst.status)}`}>{inst.status}</span></td>
                          <td className="px-4 py-3 text-xs text-gray-500">{inst.deductedAt || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{inst.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bilingual Receipt Info */}
            <div className="bg-white rounded-xl border">
              <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-900">Bilingual Payment Receipts</h3></div>
              <div className="p-4 grid md:grid-cols-2 gap-4">
                {dashboard.advances.map(a => (
                  <div key={a.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{a.staffName}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(a.status)}`}>{a.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Receipt className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600">English Receipt:</span>
                        <span className="text-blue-600 text-xs">{a.receiptUrlEn || 'Not generated'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600">Hindi Receipt (रसीद):</span>
                        <span className="text-green-600 text-xs">{a.receiptUrlHi || 'Not generated'}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {a.paymentMethod === 'UPI' && `UPI Txn: ${a.upiTransactionId}`}
                        {a.paymentMethod === 'CASH' && 'Cash payment — manual receipt'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
