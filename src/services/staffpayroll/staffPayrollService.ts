import axios from 'axios';

const API_BASE = '/api/staff-payroll';

export interface DomesticStaffProfile {
  id: number;
  communityId: string;
  fullName: string;
  staffCode: string;
  phoneNumber: string;
  primaryRole: string;
  gatePassNumber: string;
  preferredLanguage: string;
  aadhaarLastFour: string;
  photoUrl: string;
  isActive: boolean;
  joinedDate: string;
}

export interface EmployerContract {
  id: number;
  communityId: string;
  staffId: number;
  employerFlatNumber: string;
  employerTowerName: string;
  employerName: string;
  monthlySalary: number;
  dailyRate: number;
  salaryCycle: string;
  halfDayRule: string;
  paidLeavesPerMonth: number;
  weeklyOffSunday: boolean;
  status: string;
  startDate: string;
}

export interface AttendancePunch {
  id: number;
  staffId: number;
  contractId: number;
  employerFlatNumber: string;
  punchDate: string;
  punchTime: string;
  punchType: string;
  attendanceStatus: string;
  autoMarked: boolean;
  durationMinutes: number;
}

export interface PayrollLedger {
  id: number;
  staffId: number;
  staffName: string;
  contractId: number;
  employerFlatNumber: string;
  employerName: string;
  payrollMonth: string;
  cycleStartDate: string;
  cycleEndDate: string;
  totalDaysInCycle: number;
  daysPresent: number;
  daysAbsent: number;
  halfDays: number;
  paidLeaves: number;
  weeklyOffs: number;
  unpaidLeaves: number;
  grossSalary: number;
  attendanceDeduction: number;
  advanceDeduction: number;
  bonusAmount: number;
  netPayable: number;
  status: string;
}

export interface SalaryAdvance {
  id: number;
  staffId: number;
  staffName: string;
  contractId: number;
  employerFlatNumber: string;
  employerName: string;
  principalAmount: number;
  totalInstallments: number;
  emiAmount: number;
  installmentsPaid: number;
  amountRepaid: number;
  outstandingBalance: number;
  status: string;
  paymentMethod: string;
  upiTransactionId?: string;
  disbursedAt: string;
  firstEmiDate: string;
  lastEmiDate: string;
  terminatedEarly: boolean;
  terminationDate?: string;
  settlementAmount?: number;
  purpose?: string;
  receiptUrlEn?: string;
  receiptUrlHi?: string;
}

export interface AdvanceInstallment {
  id: number;
  advanceId: number;
  staffId: number;
  contractId: number;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  payrollMonth: string;
  status: string;
  deductedAt?: string;
  balanceAfterDeduction: number;
  remarks?: string;
}

export interface StaffSummary {
  staffId: number;
  name: string;
  staffCode: string;
  role: string;
  employers: number;
  totalMonthlySalary: number;
  advanceOutstanding: number;
}

export interface StaffPayrollDashboard {
  totalStaff: number;
  activeContracts: number;
  totalMonthlyWages: number;
  totalPaid: number;
  totalPending: number;
  totalAdvancesOutstanding: number;
  staffByRole: Record<string, number>;
  contractsByCycle: Record<string, number>;
  staffSummaries: StaffSummary[];
  payrolls: PayrollLedger[];
  advances: SalaryAdvance[];
  contracts: EmployerContract[];
}

export interface AdvanceDashboard {
  totalAdvances: number;
  activeAdvances: number;
  terminatedPending: number;
  totalDisbursed: number;
  totalRepaid: number;
  totalOutstanding: number;
  advances: SalaryAdvance[];
  installments: AdvanceInstallment[];
}

export const staffPayrollService = {
  getDashboard: () => axios.get<StaffPayrollDashboard>(`${API_BASE}/dashboard`).then(r => r.data),
  getAdvanceDashboard: () => axios.get<AdvanceDashboard>(`${API_BASE}/advances/dashboard`).then(r => r.data),
  calculatePayroll: (staffId: number, month: string) =>
    axios.post<PayrollLedger[]>(`${API_BASE}/payroll/calculate?staffId=${staffId}&month=${month}`).then(r => r.data),
  disburseAdvance: (params: { staffId: number; staffName: string; contractId: number; amount: number; installments: number; method: string; upiTxnId?: string; purpose?: string }) =>
    axios.post<SalaryAdvance>(`${API_BASE}/advances/disburse`, null, { params }).then(r => r.data),
  deductInstallment: (advanceId: number, installmentNumber: number) =>
    axios.post<AdvanceInstallment>(`${API_BASE}/advances/${advanceId}/deduct/${installmentNumber}`).then(r => r.data),
  terminateAdvance: (advanceId: number) =>
    axios.post<SalaryAdvance>(`${API_BASE}/advances/${advanceId}/terminate`).then(r => r.data),
  getAmortizationSchedule: (advanceId: number) =>
    axios.get<AdvanceInstallment[]>(`${API_BASE}/advances/${advanceId}/schedule`).then(r => r.data),
  getAllStaff: () => axios.get<DomesticStaffProfile[]>(`${API_BASE}/staff`).then(r => r.data),
  getAttendance: (staffId: number, from: string, to: string) =>
    axios.get<AttendancePunch[]>(`${API_BASE}/attendance/${staffId}?from=${from}&to=${to}`).then(r => r.data),
  getPayroll: (staffId: number, month: string) =>
    axios.get<PayrollLedger[]>(`${API_BASE}/payroll/${staffId}?month=${month}`).then(r => r.data),
  seedDemo: () => axios.post(`${API_BASE}/seed-demo`).then(r => r.data),
};
