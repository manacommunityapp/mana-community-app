export interface HrOrganization {
  id: number;
  communityId: number;
  organizationName: string;
  organizationType: string;
  gstNumber?: string;
  registrationNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HrBranch {
  id: number;
  organizationId: number;
  branchName: string;
  branchCode?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive: boolean;
}

export interface HrDepartment {
  id: number;
  organizationId: number;
  departmentName: string;
  departmentCode?: string;
  isActive: boolean;
}

export interface HrDesignation {
  id: number;
  organizationId: number;
  designationName: string;
  level?: number;
  isActive: boolean;
}

export interface HrEmployee {
  id: number;
  organizationId: number;
  branchId?: number;
  departmentId?: number;
  designationId?: number;
  manaUserId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  personalEmail?: string;
  workEmail?: string;
  phone?: string;
  employmentType: string;
  employmentStatus: string;
  joiningDate?: string;
  confirmationDate?: string;
  exitDate?: string;
  reportingManagerId?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  departmentName?: string;
  designationName?: string;
  branchName?: string;
  reportingManagerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HrEmployeeListItem {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  departmentName?: string;
  designationName?: string;
  employmentStatus: string;
  joiningDate?: string;
  phone?: string;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  attendanceDate: string;
  firstCheckIn?: string;
  lastCheckOut?: string;
  totalWorkMinutes: number;
  attendanceStatus: string;
  remarks?: string;
  overtimeMinutes?: number;
  overtimeApproved?: boolean;
}

export interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalLeave: number;
  totalHalfDay: number;
  totalWorkingDays: number;
}

export type LeaveSession = 'FIRST_HALF' | 'SECOND_HALF' | 'FULL_DAY';

export type LeaveApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'L1_APPROVED'
  | 'L1_REJECTED';

export interface LeaveType {
  id: number;
  leaveTypeName: string;
  defaultBalance: number;
  isPaid: boolean;
  isCarryForward?: boolean;
  maxCarryForward?: number;
  isActive?: boolean;
  approvalLevels?: number;
  requiresHrApproval?: boolean;
  minNoticeDays?: number;
  maxConsecutiveDays?: number;
  maxPerYear?: number;
  allowNegativeBalance?: boolean;
}

export interface LeaveBalance {
  leaveTypeName: string;
  totalBalance: number;
  usedBalance: number;
  remainingBalance: number;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName?: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason?: string;
  approvalStatus: LeaveApprovalStatus;
  approverRemarks?: string;
  approvedAt?: string;
  createdAt: string;
  halfDay?: boolean;
  leaveSession?: LeaveSession;
  approvalLevel?: number;
  l1ApprovedBy?: number;
  l1ApprovedAt?: string;
  l1Remarks?: string;
}

export interface HrShift {
  id: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isActive: boolean;
}

export interface ShiftAssignment {
  id: number;
  employeeId: number;
  employeeName?: string;
  shiftId: number;
  shiftName?: string;
  shiftDate: string;
  startTime?: string;
  endTime?: string;
  status: string;
}

export interface HrHoliday {
  id: number;
  holidayName: string;
  holidayDate: string;
  isOptional: boolean;
}

export interface HrDashboardData {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveToday: number;
  presentToday: number;
  absentToday: number;
  pendingLeaveApprovals: number;
  newJoinersThisMonth: number;
  upcomingHolidays: number;
}

export interface HrEmployeeDocument {
  id: number;
  documentType: string;
  documentName: string;
  fileUrl: string;
  expiryDate?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface CreateOrganizationRequest {
  organizationName: string;
  organizationType: string;
  gstNumber?: string;
  registrationNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export interface CreateEmployeeRequest {
  branchId?: number;
  departmentId?: number;
  designationId?: number;
  manaUserId: number;
  employeeCode?: string;
  firstName: string;
  lastName: string;
  personalEmail?: string;
  workEmail?: string;
  phone?: string;
  employmentType: string;
  joiningDate?: string;
  reportingManagerId?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface ApplyLeaveRequest {
  leaveTypeId: number;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason?: string;
  halfDay?: boolean;
  leaveSession?: LeaveSession;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface EmploymentHistory {
  id: number;
  changeType: string; // PROMOTION, TRANSFER, DESIGNATION_CHANGE, DEPARTMENT_CHANGE, STATUS_CHANGE, JOINING
  effectiveDate: string;
  previousDesignation?: string;
  newDesignation?: string;
  previousDepartment?: string;
  newDepartment?: string;
  previousBranch?: string;
  newBranch?: string;
  reason?: string;
  remarks?: string;
  changedBy: number;
  createdAt: string;
}

export interface OnboardingTask {
  id: number;
  taskTitle: string;
  taskDescription?: string;
  category: string; // DOCUMENTATION, IT_SETUP, TRAINING, EQUIPMENT, ACCESS, INDUCTION
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  assignedTo?: number;
  employeeId?: number;
  employeeName?: string;
}

export interface OffboardingTask {
  id: number;
  taskTitle: string;
  taskDescription?: string;
  category: string; // KNOWLEDGE_TRANSFER, ACCESS_REVOCATION, ASSET_RETURN, EXIT_INTERVIEW, SETTLEMENT, DOCUMENTATION
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  employeeId?: number;
}

export interface SelfServiceUpdateRequest {
  personalEmail?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface OrgHierarchyNode {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName?: string;
  designation?: string;
  department?: string;
  directReports: OrgHierarchyNode[];
}

export interface AttendanceCorrection {
  id: number;
  correctedCheckIn?: string;
  correctedCheckOut?: string;
  correctedStatus?: string;
  reason: string;
  correctedBy: number;
  originalCheckIn?: string;
  originalCheckOut?: string;
  createdAt: string;
}

export interface AttendanceCorrectionRequest {
  correctedCheckIn?: string;
  correctedCheckOut?: string;
  correctedStatus?: string;
  reason: string;
}

export interface Timesheet {
  id: number;
  weekStartDate: string;
  weekEndDate: string;
  totalMinutes: number;
  totalOvertimeMinutes: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  submittedAt?: string;
  approvedBy?: number;
  approvedAt?: string;
  remarks?: string;
}

export interface ShiftSwapRequest {
  id: number;
  requesterEmployee: { id: number; firstName: string; lastName?: string; employeeCode: string };
  targetEmployee: { id: number; firstName: string; lastName?: string; employeeCode: string };
  requesterShiftDate: string;
  targetShiftDate: string;
  reason?: string;
  status: 'PENDING_COLLEAGUE' | 'PENDING_MANAGER' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

// ── Recruitment ──
export interface JobPosting {
  id: number;
  title: string;
  departmentId?: number;
  description?: string;
  requirements?: string;
  openings: number;
  location?: string;
  employmentType?: string;
  minSalary?: number;
  maxSalary?: number;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  postedDate?: string;
  closingDate?: string;
  createdAt: string;
}

export interface Applicant {
  id: number;
  jobPosting: { id: number; title: string };
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  currentEmployer?: string;
  experienceYears?: number;
  expectedSalary?: number;
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
  notes?: string;
  createdAt: string;
}

export interface Interview {
  id: number;
  applicant: { id: number; firstName: string; lastName?: string };
  interviewer?: { id: number; firstName: string };
  interviewType: string;
  scheduledAt?: string;
  durationMinutes: number;
  status: string;
  feedback?: string;
  rating?: number;
  outcome?: string;
}

export interface Offer {
  id: number;
  applicant: { id: number; firstName: string; lastName?: string };
  offeredSalary: number;
  proposedJoiningDate?: string;
  expiryDate?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  responseDate?: string;
}

// ── Performance ──
export interface AppraisalCycle {
  id: number;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  description?: string;
}

export interface Goal {
  id: number;
  title: string;
  description?: string;
  isKra: boolean;
  weightage: number;
  targetValue?: string;
  achievementPercent: number;
  dueDate?: string;
  status: string;
}

export interface AppraisalForm {
  id: number;
  employee: { id: number; firstName: string; lastName?: string };
  appraisalCycle: { id: number; name: string };
  selfRating?: number;
  selfComments?: string;
  managerRating?: number;
  managerComments?: string;
  finalRating?: number;
  status: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface Okr {
  id: number;
  objective: string;
  quarter?: string;
  year?: number;
  overallProgress: number;
  status: string;
  keyResults?: OkrKeyResult[];
}

export interface OkrKeyResult {
  id: number;
  title: string;
  targetValue?: string;
  currentValue?: string;
  progressPercent: number;
}

export interface FeedbackRequest {
  id: number;
  subjectEmployee: { id: number; firstName: string; lastName?: string };
  deadline?: string;
  status: string;
  isAnonymous: boolean;
}

export interface FeedbackResponse {
  id: number;
  overallRating?: number;
  communicationRating?: number;
  teamworkRating?: number;
  technicalRating?: number;
  leadershipRating?: number;
  strengths?: string;
  improvements?: string;
  generalComments?: string;
  submittedAt?: string;
}

// ── Learning & Development ──
export interface TrainingProgram {
  id: number;
  title: string;
  description?: string;
  trainingType?: string;
  provider?: string;
  durationHours?: number;
  isMandatory: boolean;
  status: string;
}

export interface TrainingEnrollment {
  id: number;
  trainingProgram: { id: number; title: string };
  status: 'ENROLLED' | 'COMPLETED' | 'FAILED';
  enrolledDate?: string;
  completionDate?: string;
  score?: number;
}

export interface Certification {
  id: number;
  name: string;
  issuingBody?: string;
  credentialId?: string;
  issuedDate?: string;
  expiryDate?: string;
  certificateUrl?: string;
  isVerified: boolean;
}

export interface CareerPath {
  id: number;
  currentRole?: string;
  targetRole?: string;
  targetDate?: string;
  developmentActivities?: string;
  skillsToDevelop?: string;
  status: string;
}

export interface Recognition {
  id: number;
  giverEmployee: { id: number; firstName: string; lastName?: string };
  receiverEmployee: { id: number; firstName: string; lastName?: string };
  recognitionType: 'KUDOS' | 'AWARD' | 'MILESTONE';
  message: string;
  points: number;
  isPublic: boolean;
  category?: string;
  createdAt: string;
}

// ── Payroll ──
export interface SalaryComponent {
  id: number;
  organizationId: number;
  name: string;
  code: string;
  componentType: 'EARNING' | 'DEDUCTION';
  calculationType: string;
  defaultValue?: number;
  isTaxable: boolean;
  isStatutory: boolean;
  statutoryCode?: string;
  isActive: boolean;
  sequenceOrder: number;
}

export interface SalaryStructure {
  id: number;
  organizationId: number;
  employee: { id: number; firstName: string; lastName?: string };
  ctcAnnual: number;
  basicMonthly: number;
  hraMonthly: number;
  daMonthly: number;
  specialAllowanceMonthly: number;
  otherAllowancesMonthly: number;
  pfEmployeeMonthly: number;
  pfEmployerMonthly: number;
  esiEmployeeMonthly: number;
  esiEmployerMonthly: number;
  professionalTaxMonthly: number;
  tdsMonthly: number;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
}

export interface PayrollRun {
  id: number;
  organizationId: number;
  payrollMonth: number;
  payrollYear: number;
  status: 'DRAFT' | 'PROCESSED' | 'APPROVED' | 'PAID';
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  processedAt?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface Payslip {
  id: number;
  organizationId: number;
  employee: { id: number; firstName: string; lastName?: string; employeeCode?: string };
  payrollRun: { id: number; payrollMonth: number; payrollYear: number };
  workingDays: number;
  paidDays: number;
  lossOfPayDays: number;
  basicSalary: number;
  hra: number;
  da: number;
  specialAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  professionalTax: number;
  tds: number;
  totalDeductions: number;
  netSalary: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

// ── Expenses ──
export interface ExpenseClaim {
  id: number;
  organizationId: number;
  employee: { id: number; firstName: string; lastName?: string };
  claimTitle: string;
  claimType: string;
  totalAmount: number;
  approvedAmount?: number;
  claimDate: string;
  description?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';
  rejectionReason?: string;
  createdAt: string;
}

export interface ExpenseItem {
  id: number;
  description: string;
  amount: number;
  expenseDate?: string;
  receiptUrl?: string;
  category?: string;
}

export interface TravelRequest {
  id: number;
  organizationId: number;
  employee: { id: number; firstName: string; lastName?: string };
  destination: string;
  purpose: string;
  travelFrom: string;
  travelTo: string;
  modeOfTravel?: string;
  estimatedCost?: number;
  advanceRequested: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

// ── Assets ──
export interface HrAsset {
  id: number;
  organizationId: number;
  assetName: string;
  assetType: string;
  assetCode?: string;
  serialNumber?: string;
  make?: string;
  model?: string;
  purchaseDate?: string;
  purchaseValue?: number;
  currentValue?: number;
  warrantyExpiry?: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'UNDER_REPAIR' | 'RETIRED';
  notes?: string;
}

export interface AssetAssignment {
  id: number;
  organizationId: number;
  asset: HrAsset;
  employee: { id: number; firstName: string; lastName?: string };
  assignedDate: string;
  returnDate?: string;
  conditionAtAssignment?: string;
  conditionAtReturn?: string;
  isActive: boolean;
}

// ── Tasks ──
export interface HrTask {
  id: number;
  organizationId: number;
  assignedTo: { id: number; firstName: string; lastName?: string };
  assignedBy?: { id: number; firstName: string; lastName?: string };
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

// ── Communications ──
export interface HrAnnouncement {
  id: number;
  organizationId: number;
  title: string;
  body: string;
  targetType: 'ALL' | 'DEPARTMENT' | 'INDIVIDUAL';
  isPinned: boolean;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface HelpDeskTicket {
  id: number;
  organizationId: number;
  employee: { id: number; firstName: string; lastName?: string };
  ticketNumber: string;
  category: 'PAYROLL' | 'LEAVE' | 'IT' | 'ATTENDANCE' | 'GENERAL';
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  assignedTo?: { id: number; firstName: string; lastName?: string };
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
}
