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
