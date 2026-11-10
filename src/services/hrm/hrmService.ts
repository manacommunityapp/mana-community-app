import { apiClient } from "../common/apiClient";
import type {
  HrOrganization,
  HrBranch,
  HrDepartment,
  HrDesignation,
  HrEmployee,
  HrEmployeeListItem,
  AttendanceRecord,
  AttendanceSummary,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  HrShift,
  ShiftAssignment,
  HrHoliday,
  HrDashboardData,
  HrEmployeeDocument,
  CreateOrganizationRequest,
  CreateEmployeeRequest,
  ApplyLeaveRequest,
  PageResponse,
  EmploymentHistory,
  OnboardingTask,
  OffboardingTask,
  SelfServiceUpdateRequest,
  OrgHierarchyNode,
  AttendanceCorrectionRequest,
  Timesheet,
  ShiftSwapRequest,
  JobPosting,
  Applicant,
  Interview,
  Offer,
  AppraisalCycle,
  Goal,
  AppraisalForm,
  Okr,
  OkrKeyResult,
  FeedbackRequest,
  FeedbackResponse,
  TrainingProgram,
  TrainingEnrollment,
  Certification,
  CareerPath,
  Recognition,
  SalaryComponent,
  SalaryStructure,
  PayrollRun,
  Payslip,
  ExpenseClaim,
  ExpenseItem,
  TravelRequest,
  HrAsset,
  AssetAssignment,
  HrTask,
  HrAnnouncement,
  HelpDeskTicket,
  HrmRole,
  HrAuditLog,
  HrComplianceAlert,
  HrAnalyticsDashboard,
  HrTrendPoint,
  HrWorkforceMetrics,
  HrReportConfig,
} from "../../types/hrm";
// LeaveApprovalStatus and LeaveSession are used via LeaveRequest above

const BASE = "/api/v1/hr";

export const hrmService = {
  // ── Organizations ──
  async createOrganization(data: CreateOrganizationRequest): Promise<HrOrganization> {
    return apiClient.post(`${BASE}/organizations`, data);
  },
  async getOrganization(id: number): Promise<HrOrganization> {
    return apiClient.get(`${BASE}/organizations/${id}`);
  },
  async updateOrganization(id: number, data: Partial<CreateOrganizationRequest>): Promise<HrOrganization> {
    return apiClient.put(`${BASE}/organizations/${id}`, data);
  },
  async getMyOrganizations(): Promise<HrOrganization[]> {
    return apiClient.get(`${BASE}/organizations`);
  },

  // ── Branches ──
  async createBranch(orgId: number, data: Partial<HrBranch>): Promise<HrBranch> {
    return apiClient.post(`${BASE}/organizations/${orgId}/branches`, data);
  },
  async getBranches(orgId: number): Promise<HrBranch[]> {
    return apiClient.get(`${BASE}/organizations/${orgId}/branches`);
  },

  // ── Departments ──
  async createDepartment(orgId: number, data: { departmentName: string; departmentCode?: string }): Promise<HrDepartment> {
    return apiClient.post(`${BASE}/organizations/${orgId}/departments`, data);
  },
  async getDepartments(orgId: number): Promise<HrDepartment[]> {
    return apiClient.get(`${BASE}/organizations/${orgId}/departments`);
  },

  // ── Designations ──
  async createDesignation(orgId: number, data: { designationName: string; level?: number }): Promise<HrDesignation> {
    return apiClient.post(`${BASE}/organizations/${orgId}/designations`, data);
  },
  async getDesignations(orgId: number): Promise<HrDesignation[]> {
    return apiClient.get(`${BASE}/organizations/${orgId}/designations`);
  },

  // ── Employees ──
  async createEmployee(orgId: number, data: CreateEmployeeRequest): Promise<HrEmployee> {
    return apiClient.post(`${BASE}/organizations/${orgId}/employees`, data);
  },
  async getEmployees(orgId: number, params?: { page?: number; size?: number; status?: string; search?: string }): Promise<PageResponse<HrEmployeeListItem>> {
    const sp = new URLSearchParams();
    if (params?.page !== undefined) sp.set("page", String(params.page));
    if (params?.size !== undefined) sp.set("size", String(params.size));
    if (params?.status) sp.set("status", params.status);
    if (params?.search) sp.set("search", params.search);
    return apiClient.get(`${BASE}/organizations/${orgId}/employees?${sp}`);
  },
  async getEmployee(orgId: number, employeeId: number): Promise<HrEmployee> {
    return apiClient.get(`${BASE}/organizations/${orgId}/employees/${employeeId}`);
  },
  async updateEmployee(orgId: number, employeeId: number, data: Partial<CreateEmployeeRequest>): Promise<HrEmployee> {
    return apiClient.put(`${BASE}/organizations/${orgId}/employees/${employeeId}`, data);
  },
  async getEmployeeDocuments(orgId: number, employeeId: number): Promise<HrEmployeeDocument[]> {
    return apiClient.get(`${BASE}/organizations/${orgId}/employees/${employeeId}/documents`);
  },

  // ── Attendance ──
  async checkIn(orgId: number, data: { latitude?: number; longitude?: number; deviceId?: string }): Promise<AttendanceRecord> {
    return apiClient.post(`${BASE}/attendance/check-in?orgId=${orgId}`, data);
  },
  async checkOut(orgId: number, data: { latitude?: number; longitude?: number; deviceId?: string }): Promise<AttendanceRecord> {
    return apiClient.post(`${BASE}/attendance/check-out?orgId=${orgId}`, data);
  },
  async getMyAttendance(orgId: number, from: string, to: string): Promise<AttendanceRecord[]> {
    return apiClient.get(`${BASE}/attendance/my?orgId=${orgId}&from=${from}&to=${to}`);
  },
  async getAttendanceReport(orgId: number, params: { date: string; page?: number; size?: number }): Promise<PageResponse<AttendanceRecord & { employeeName?: string; employeeCode?: string }>> {
    const sp = new URLSearchParams({ date: params.date });
    if (params.page !== undefined) sp.set("page", String(params.page));
    if (params.size !== undefined) sp.set("size", String(params.size));
    return apiClient.get(`${BASE}/attendance/organizations/${orgId}/report?${sp}`);
  },
  async getAttendanceSummary(orgId: number, date: string): Promise<AttendanceSummary> {
    return apiClient.get(`${BASE}/attendance/organizations/${orgId}/summary?date=${date}`);
  },

  // ── Leaves ──
  async applyLeave(orgId: number, data: ApplyLeaveRequest): Promise<LeaveRequest> {
    return apiClient.post(`${BASE}/leaves/apply?orgId=${orgId}`, data);
  },
  async getLeaveBalance(orgId: number, year?: number): Promise<LeaveBalance[]> {
    const sp = new URLSearchParams({ orgId: String(orgId) });
    if (year !== undefined) sp.set("year", String(year));
    return apiClient.get(`${BASE}/leaves/balance?${sp}`);
  },
  async getMyLeaveRequests(orgId: number, params?: { page?: number; size?: number }): Promise<PageResponse<LeaveRequest>> {
    const sp = new URLSearchParams({ orgId: String(orgId) });
    if (params?.page !== undefined) sp.set("page", String(params.page));
    if (params?.size !== undefined) sp.set("size", String(params.size));
    return apiClient.get(`${BASE}/leaves/my-requests?${sp}`);
  },
  async getOrgLeaveRequests(orgId: number, params?: { status?: string; page?: number; size?: number }): Promise<PageResponse<LeaveRequest>> {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.page !== undefined) sp.set("page", String(params.page));
    if (params?.size !== undefined) sp.set("size", String(params.size));
    return apiClient.get(`${BASE}/leaves/organizations/${orgId}/requests?${sp}`);
  },
  async approveLeave(id: number, orgId: number, remarks?: string): Promise<LeaveRequest> {
    return apiClient.post(`${BASE}/leaves/${id}/approve?orgId=${orgId}`, { approverRemarks: remarks });
  },
  async rejectLeave(id: number, orgId: number, remarks?: string): Promise<LeaveRequest> {
    return apiClient.post(`${BASE}/leaves/${id}/reject?orgId=${orgId}`, { approverRemarks: remarks });
  },
  async cancelLeave(id: number, orgId: number): Promise<void> {
    return apiClient.post(`${BASE}/leaves/${id}/cancel?orgId=${orgId}`);
  },

  // ── Leave Types ──
  async getLeaveTypes(orgId: number): Promise<LeaveType[]> {
    return apiClient.get(`${BASE}/organizations/${orgId}/leave-types`);
  },
  async createLeaveType(orgId: number, data: {
    leaveTypeName: string;
    defaultBalance: number;
    isPaid?: boolean;
    isCarryForward?: boolean;
    maxCarryForward?: number;
    approvalLevels?: number;
    requiresHrApproval?: boolean;
    minNoticeDays?: number;
    maxConsecutiveDays?: number;
    maxPerYear?: number;
    allowNegativeBalance?: boolean;
  }): Promise<LeaveType> {
    return apiClient.post(`${BASE}/organizations/${orgId}/leave-types`, data);
  },

  async l2ApproveLeave(id: number, orgId: number, remarks?: string): Promise<LeaveRequest> {
    return apiClient.post(`${BASE}/leaves/${id}/l2-approve?orgId=${orgId}`, { approverRemarks: remarks });
  },

  async grantCompOff(orgId: number, employeeId: number, workedDate: string, reason?: string): Promise<void> {
    const sp = new URLSearchParams({ employeeId: String(employeeId), workedDate });
    if (reason) sp.set("reason", reason);
    return apiClient.post(`${BASE}/leaves/organizations/${orgId}/comp-off?${sp}`);
  },

  // ── Shifts ──
  async createShift(orgId: number, data: { shiftName: string; startTime: string; endTime: string; breakMinutes?: number }): Promise<HrShift> {
    return apiClient.post(`${BASE}/organizations/${orgId}/shifts`, data);
  },
  async getShifts(orgId: number): Promise<HrShift[]> {
    return apiClient.get(`${BASE}/organizations/${orgId}/shifts`);
  },
  async assignShift(orgId: number, data: { employeeId: number; shiftId: number; shiftDate: string }): Promise<ShiftAssignment> {
    return apiClient.post(`${BASE}/organizations/${orgId}/shifts/assign`, data);
  },
  async getShiftSchedule(orgId: number, from: string, to: string): Promise<ShiftAssignment[]> {
    return apiClient.get(`${BASE}/organizations/${orgId}/shifts/schedule?from=${from}&to=${to}`);
  },

  // ── Holidays ──
  async getHolidays(orgId: number, year: number): Promise<HrHoliday[]> {
    return apiClient.get(`${BASE}/organizations/${orgId}/holidays?year=${year}`);
  },
  async createHoliday(orgId: number, data: { holidayName: string; holidayDate: string; isOptional?: boolean }): Promise<HrHoliday> {
    return apiClient.post(`${BASE}/organizations/${orgId}/holidays`, data);
  },

  // ── Dashboard ──
  async getDashboard(orgId: number): Promise<HrDashboardData> {
    return apiClient.get(`${BASE}/dashboard/organizations/${orgId}`);
  },

  // ── Employment History ──
  async getEmploymentHistory(orgId: number, employeeId: number): Promise<EmploymentHistory[]> {
    return apiClient.get(`${BASE}/organizations/${orgId}/employees/${employeeId}/history`);
  },

  // ── Self-service ──
  async updateMyProfile(orgId: number, data: SelfServiceUpdateRequest): Promise<HrEmployee> {
    return apiClient.patch(`${BASE}/employees/me?orgId=${orgId}`, data);
  },

  // ── Onboarding ──
  async getOnboardingTasks(orgId: number, employeeId: number): Promise<OnboardingTask[]> {
    return apiClient.get(`${BASE}/onboarding/employees/${employeeId}/tasks?orgId=${orgId}`);
  },
  async completeOnboardingTask(orgId: number, taskId: number): Promise<OnboardingTask> {
    return apiClient.post(`${BASE}/onboarding/tasks/${taskId}/complete?orgId=${orgId}`);
  },
  async getPendingOnboarding(orgId: number): Promise<OnboardingTask[]> {
    return apiClient.get(`${BASE}/onboarding/organizations/${orgId}/pending`);
  },

  // ── Offboarding ──
  async getOffboardingTasks(orgId: number, employeeId: number): Promise<OffboardingTask[]> {
    return apiClient.get(`${BASE}/offboarding/employees/${employeeId}/tasks?orgId=${orgId}`);
  },
  async completeOffboardingTask(orgId: number, taskId: number): Promise<OffboardingTask> {
    return apiClient.post(`${BASE}/offboarding/tasks/${taskId}/complete?orgId=${orgId}`);
  },

  // ── Org Hierarchy ──
  async getOrgHierarchy(orgId: number): Promise<OrgHierarchyNode[]> {
    return apiClient.get(`${BASE}/organizations/${orgId}/employees/hierarchy`);
  },

  // ── Attendance Correction ──
  async correctAttendance(orgId: number, attendanceId: number, data: AttendanceCorrectionRequest): Promise<AttendanceRecord> {
    return apiClient.post(`${BASE}/attendance/${attendanceId}/correct?orgId=${orgId}`, data);
  },

  // ── Overtime ──
  async approveOvertime(orgId: number, attendanceId: number): Promise<AttendanceRecord> {
    return apiClient.post(`${BASE}/attendance/${attendanceId}/approve-overtime?orgId=${orgId}`);
  },

  // ── Timesheets ──
  async generateTimesheet(orgId: number, weekDate?: string): Promise<Timesheet> {
    const sp = new URLSearchParams({ orgId: String(orgId) });
    if (weekDate) sp.set("weekDate", weekDate);
    return apiClient.post(`${BASE}/timesheets/generate?${sp}`);
  },
  async getMyTimesheets(orgId: number): Promise<Timesheet[]> {
    return apiClient.get(`${BASE}/timesheets/my?orgId=${orgId}`);
  },
  async submitTimesheet(orgId: number, timesheetId: number): Promise<Timesheet> {
    return apiClient.post(`${BASE}/timesheets/${timesheetId}/submit?orgId=${orgId}`);
  },
  async approveTimesheet(orgId: number, timesheetId: number, remarks?: string): Promise<Timesheet> {
    const sp = new URLSearchParams({ orgId: String(orgId) });
    if (remarks) sp.set("remarks", remarks);
    return apiClient.post(`${BASE}/timesheets/${timesheetId}/approve?${sp}`);
  },
  async getPendingTimesheets(orgId: number): Promise<PageResponse<Timesheet>> {
    return apiClient.get(`${BASE}/timesheets/organizations/${orgId}/pending`);
  },

  // ── Shift Swaps ──
  async requestShiftSwap(orgId: number, data: { targetEmployeeId: number; requesterShiftDate: string; targetShiftDate: string; reason?: string }): Promise<ShiftSwapRequest> {
    return apiClient.post(`${BASE}/shifts/swap/request?orgId=${orgId}`, data);
  },
  async respondToSwap(orgId: number, swapId: number, accepted: boolean, rejectionReason?: string): Promise<ShiftSwapRequest> {
    const sp = new URLSearchParams({ orgId: String(orgId), accepted: String(accepted) });
    if (rejectionReason) sp.set("rejectionReason", rejectionReason);
    return apiClient.post(`${BASE}/shifts/swap/${swapId}/colleague-respond?${sp}`);
  },
  async managerApproveSwap(orgId: number, swapId: number, approved: boolean, reason?: string): Promise<ShiftSwapRequest> {
    const sp = new URLSearchParams({ orgId: String(orgId), approved: String(approved) });
    if (reason) sp.set("reason", reason);
    return apiClient.post(`${BASE}/shifts/swap/${swapId}/manager-approve?${sp}`);
  },
  async getMySwapRequests(orgId: number): Promise<ShiftSwapRequest[]> {
    return apiClient.get(`${BASE}/shifts/swap/my?orgId=${orgId}`);
  },
  async getIncomingSwapRequests(orgId: number): Promise<ShiftSwapRequest[]> {
    return apiClient.get(`${BASE}/shifts/swap/incoming?orgId=${orgId}`);
  },
  async getPendingSwapApprovals(orgId: number): Promise<ShiftSwapRequest[]> {
    return apiClient.get(`${BASE}/shifts/swap/organizations/${orgId}/pending`);
  },

  // ── Recruitment ──
  async getJobPostings(orgId: number, status?: string): Promise<PageResponse<JobPosting>> {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    return apiClient.get(`${BASE}/recruitment/organizations/${orgId}/postings?${sp}`);
  },
  async createJobPosting(orgId: number, data: Partial<JobPosting>): Promise<JobPosting> {
    return apiClient.post(`${BASE}/recruitment/organizations/${orgId}/postings`, data);
  },
  async updatePostingStatus(orgId: number, postingId: number, status: string): Promise<JobPosting> {
    return apiClient.patch(`${BASE}/recruitment/organizations/${orgId}/postings/${postingId}/status?status=${encodeURIComponent(status)}`);
  },
  async getApplicants(orgId: number, postingId: number, status?: string): Promise<PageResponse<Applicant>> {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    return apiClient.get(`${BASE}/recruitment/organizations/${orgId}/postings/${postingId}/applicants?${sp}`);
  },
  async addApplicant(orgId: number, postingId: number, data: Partial<Applicant>): Promise<Applicant> {
    return apiClient.post(`${BASE}/recruitment/organizations/${orgId}/postings/${postingId}/applicants`, data);
  },
  async updateApplicantStatus(orgId: number, applicantId: number, status: string, notes?: string): Promise<Applicant> {
    const sp = new URLSearchParams({ status });
    if (notes) sp.set("notes", notes);
    return apiClient.patch(`${BASE}/recruitment/organizations/${orgId}/applicants/${applicantId}/status?${sp}`);
  },
  async scheduleInterview(orgId: number, applicantId: number, data: Partial<Interview>): Promise<Interview> {
    return apiClient.post(`${BASE}/recruitment/organizations/${orgId}/applicants/${applicantId}/interviews`, data);
  },
  async getInterviews(orgId: number, applicantId: number): Promise<Interview[]> {
    return apiClient.get(`${BASE}/recruitment/organizations/${orgId}/applicants/${applicantId}/interviews`);
  },
  async createOffer(orgId: number, applicantId: number, data: Partial<Offer>): Promise<Offer> {
    return apiClient.post(`${BASE}/recruitment/organizations/${orgId}/applicants/${applicantId}/offers`, data);
  },

  // ── Performance: Appraisal Cycles ──
  async getAppraisalCycles(orgId: number): Promise<AppraisalCycle[]> {
    return apiClient.get(`${BASE}/performance/organizations/${orgId}/cycles`);
  },
  async createAppraisalCycle(orgId: number, data: Partial<AppraisalCycle>): Promise<AppraisalCycle> {
    return apiClient.post(`${BASE}/performance/organizations/${orgId}/cycles`, data);
  },
  async activateCycle(orgId: number, cycleId: number): Promise<AppraisalCycle> {
    return apiClient.patch(`${BASE}/performance/organizations/${orgId}/cycles/${cycleId}/activate`);
  },

  // ── Performance: Goals ──
  async getGoals(employeeId: number, cycleId?: number): Promise<Goal[]> {
    const sp = new URLSearchParams();
    if (cycleId !== undefined) sp.set("cycleId", String(cycleId));
    return apiClient.get(`${BASE}/performance/employees/${employeeId}/goals?${sp}`);
  },
  async createGoal(orgId: number, employeeId: number, data: Partial<Goal>): Promise<Goal> {
    return apiClient.post(`${BASE}/performance/organizations/${orgId}/employees/${employeeId}/goals`, data);
  },
  async updateGoalProgress(goalId: number, achievementPercent: number): Promise<Goal> {
    return apiClient.patch(`${BASE}/performance/goals/${goalId}/progress?achievementPercent=${achievementPercent}`);
  },

  // ── Performance: Appraisal Forms ──
  async submitSelfAppraisal(employeeId: number, cycleId: number, rating: number, comments: string): Promise<AppraisalForm> {
    return apiClient.post(`${BASE}/performance/employees/${employeeId}/self-appraisal`, { cycleId, rating, comments });
  },
  async submitManagerReview(formId: number, rating: number, comments: string): Promise<AppraisalForm> {
    return apiClient.post(`${BASE}/performance/forms/${formId}/manager-review`, { rating, comments });
  },
  async getCycleForms(orgId: number, cycleId: number): Promise<AppraisalForm[]> {
    return apiClient.get(`${BASE}/performance/organizations/${orgId}/cycles/${cycleId}/forms`);
  },

  // ── Performance: OKRs ──
  async getOkrs(employeeId: number): Promise<Okr[]> {
    return apiClient.get(`${BASE}/performance/employees/${employeeId}/okrs`);
  },
  async createOkr(orgId: number, data: { objective: string; quarter?: string; year?: number; keyResults: Partial<OkrKeyResult>[] }): Promise<Okr> {
    return apiClient.post(`${BASE}/performance/organizations/${orgId}/okrs`, data);
  },
  async updateKeyResult(keyResultId: number, progressPercent: number, currentValue?: string): Promise<OkrKeyResult> {
    return apiClient.patch(`${BASE}/performance/key-results/${keyResultId}/progress`, { progressPercent, currentValue });
  },

  // ── Performance: 360 Feedback ──
  async createFeedbackRequest(orgId: number, data: { subjectEmployeeId: number; cycleId?: number; deadline?: string; isAnonymous?: boolean }): Promise<FeedbackRequest> {
    return apiClient.post(`${BASE}/performance/organizations/${orgId}/feedback-requests`, data);
  },
  async submitFeedback(requestId: number, data: Partial<FeedbackResponse>): Promise<FeedbackResponse> {
    return apiClient.post(`${BASE}/performance/feedback-requests/${requestId}/respond`, data);
  },

  // ── Learning: Training ──
  async getTrainingPrograms(orgId: number): Promise<PageResponse<TrainingProgram>> {
    return apiClient.get(`${BASE}/learning/organizations/${orgId}/programs`);
  },
  async createTrainingProgram(orgId: number, data: Partial<TrainingProgram>): Promise<TrainingProgram> {
    return apiClient.post(`${BASE}/learning/organizations/${orgId}/programs`, data);
  },
  async enrollInTraining(orgId: number, employeeId: number, programId: number): Promise<TrainingEnrollment> {
    return apiClient.post(`${BASE}/learning/organizations/${orgId}/programs/${programId}/enroll?employeeId=${employeeId}`);
  },
  async getMyEnrollments(employeeId: number): Promise<TrainingEnrollment[]> {
    return apiClient.get(`${BASE}/learning/employees/${employeeId}/enrollments`);
  },

  // ── Learning: Certifications ──
  async getMyCertifications(employeeId: number): Promise<Certification[]> {
    return apiClient.get(`${BASE}/learning/employees/${employeeId}/certifications`);
  },
  async addCertification(orgId: number, employeeId: number, data: Partial<Certification>): Promise<Certification> {
    return apiClient.post(`${BASE}/learning/organizations/${orgId}/employees/${employeeId}/certifications`, data);
  },

  // ── Learning: Career Path ──
  async getCareerPath(employeeId: number): Promise<CareerPath | null> {
    return apiClient.get(`${BASE}/learning/employees/${employeeId}/career-path`);
  },
  async saveCareerPath(orgId: number, employeeId: number, data: Partial<CareerPath>): Promise<CareerPath> {
    return apiClient.post(`${BASE}/learning/organizations/${orgId}/employees/${employeeId}/career-path`, data);
  },

  // ── Learning: Recognition ──
  async getPublicRecognitions(orgId: number): Promise<PageResponse<Recognition>> {
    return apiClient.get(`${BASE}/learning/organizations/${orgId}/recognitions`);
  },
  async giveRecognition(orgId: number, data: { receiverEmployeeId: number; recognitionType: string; message: string; points?: number; isPublic?: boolean; category?: string }): Promise<Recognition> {
    return apiClient.post(`${BASE}/learning/organizations/${orgId}/recognitions`, data);
  },

  // ── Payroll ──
  async getPayrollRuns(orgId: number): Promise<PayrollRun[]> {
    return apiClient.get(`${BASE}/payroll/organizations/${orgId}/runs`);
  },
  async createPayrollRun(orgId: number, month: number, year: number): Promise<PayrollRun> {
    return apiClient.post(`${BASE}/payroll/organizations/${orgId}/runs`, { month, year });
  },
  async processPayrollRun(orgId: number, runId: number): Promise<PayrollRun> {
    return apiClient.post(`${BASE}/payroll/organizations/${orgId}/runs/${runId}/process`, {});
  },
  async approvePayrollRun(orgId: number, runId: number): Promise<PayrollRun> {
    return apiClient.post(`${BASE}/payroll/organizations/${orgId}/runs/${runId}/approve`, {});
  },
  async publishPayslips(orgId: number, runId: number): Promise<void> {
    return apiClient.post(`${BASE}/payroll/organizations/${orgId}/runs/${runId}/publish`, {});
  },
  async getRunPayslips(orgId: number, runId: number): Promise<Payslip[]> {
    return apiClient.get(`${BASE}/payroll/organizations/${orgId}/runs/${runId}/payslips`);
  },
  async getMyPayslips(orgId: number): Promise<Payslip[]> {
    return apiClient.get(`${BASE}/payroll/my-payslips?orgId=${orgId}`);
  },
  async setSalaryStructure(orgId: number, employeeId: number, data: Partial<SalaryStructure>): Promise<SalaryStructure> {
    return apiClient.post(`${BASE}/payroll/organizations/${orgId}/employees/${employeeId}/salary-structure`, data);
  },
  async getSalaryHistory(orgId: number, employeeId: number): Promise<SalaryStructure[]> {
    return apiClient.get(`${BASE}/payroll/employees/${employeeId}/salary-history?orgId=${orgId}`);
  },
  async getSalaryComponents(orgId: number): Promise<SalaryComponent[]> {
    return apiClient.get(`${BASE}/payroll/organizations/${orgId}/components`);
  },

  // ── Expenses ──
  async createExpenseClaim(orgId: number, data: Partial<ExpenseClaim> & { items?: ExpenseItem[] }): Promise<ExpenseClaim> {
    return apiClient.post(`${BASE}/expenses/organizations/${orgId}/claims`, data);
  },
  async submitExpenseClaim(orgId: number, claimId: number): Promise<ExpenseClaim> {
    return apiClient.post(`${BASE}/expenses/organizations/${orgId}/claims/${claimId}/submit`, {});
  },
  async approveExpenseClaim(orgId: number, claimId: number, approvedAmount?: number): Promise<ExpenseClaim> {
    return apiClient.post(`${BASE}/expenses/organizations/${orgId}/claims/${claimId}/approve`, { approvedAmount });
  },
  async rejectExpenseClaim(orgId: number, claimId: number, reason: string): Promise<ExpenseClaim> {
    return apiClient.post(`${BASE}/expenses/organizations/${orgId}/claims/${claimId}/reject`, { reason });
  },
  async getMyClaims(orgId: number, page = 0, size = 20): Promise<PageResponse<ExpenseClaim>> {
    return apiClient.get(`${BASE}/expenses/my-claims?orgId=${orgId}&page=${page}&size=${size}`);
  },
  async getPendingClaims(orgId: number, page = 0, size = 20): Promise<PageResponse<ExpenseClaim>> {
    return apiClient.get(`${BASE}/expenses/organizations/${orgId}/pending?page=${page}&size=${size}`);
  },
  async createTravelRequest(orgId: number, data: Partial<TravelRequest>): Promise<TravelRequest> {
    return apiClient.post(`${BASE}/expenses/organizations/${orgId}/travel`, data);
  },
  async approveTravelRequest(orgId: number, requestId: number): Promise<TravelRequest> {
    return apiClient.post(`${BASE}/expenses/organizations/${orgId}/travel/${requestId}/approve`, {});
  },
  async getMyTravelRequests(orgId: number, page = 0, size = 20): Promise<PageResponse<TravelRequest>> {
    return apiClient.get(`${BASE}/expenses/my-travel?orgId=${orgId}&page=${page}&size=${size}`);
  },

  // ── Assets ──
  async getAssets(orgId: number, status?: string, page = 0, size = 20): Promise<PageResponse<HrAsset>> {
    const q = status ? `&status=${status}` : '';
    return apiClient.get(`${BASE}/operations/organizations/${orgId}/assets?page=${page}&size=${size}${q}`);
  },
  async createAsset(orgId: number, data: Partial<HrAsset>): Promise<HrAsset> {
    return apiClient.post(`${BASE}/operations/organizations/${orgId}/assets`, data);
  },
  async assignAsset(orgId: number, assetId: number, employeeId: number, condition?: string): Promise<AssetAssignment> {
    return apiClient.post(`${BASE}/operations/organizations/${orgId}/assets/${assetId}/assign`, { employeeId, condition });
  },
  async returnAsset(orgId: number, assignmentId: number, condition?: string): Promise<AssetAssignment> {
    return apiClient.post(`${BASE}/operations/organizations/${orgId}/assignments/${assignmentId}/return`, { condition });
  },
  async getEmployeeAssets(orgId: number, employeeId: number): Promise<AssetAssignment[]> {
    return apiClient.get(`${BASE}/operations/employees/${employeeId}/assets?orgId=${orgId}`);
  },

  // ── Tasks ──
  async createTask(orgId: number, data: { assignedToId: number; title: string; description?: string; priority?: string; dueDate?: string }): Promise<HrTask> {
    return apiClient.post(`${BASE}/operations/organizations/${orgId}/tasks`, data);
  },
  async updateTaskStatus(orgId: number, taskId: number, status: string): Promise<HrTask> {
    return apiClient.patch(`${BASE}/operations/tasks/${taskId}/status?orgId=${orgId}`, { status });
  },
  async getMyTasks(orgId: number): Promise<{ content: HrTask[] }> {
    return apiClient.get(`${BASE}/operations/my-tasks?orgId=${orgId}`).then((data: HrTask[]) => ({ content: data }));
  },
  async getAllTasks(orgId: number, page = 0, size = 50): Promise<{ content: HrTask[] }> {
    return apiClient.get(`${BASE}/operations/organizations/${orgId}/tasks?page=${page}&size=${size}`);
  },

  // ── Announcements ──
  async getAnnouncements(orgId: number): Promise<HrAnnouncement[]> {
    return apiClient.get(`${BASE}/operations/organizations/${orgId}/announcements`);
  },
  async createAnnouncement(orgId: number, data: Partial<HrAnnouncement>): Promise<HrAnnouncement> {
    return apiClient.post(`${BASE}/operations/organizations/${orgId}/announcements`, data);
  },

  // ── Help Desk ──
  async createTicket(orgId: number, data: Partial<HelpDeskTicket>): Promise<HelpDeskTicket> {
    return apiClient.post(`${BASE}/operations/organizations/${orgId}/tickets`, data);
  },
  async assignTicket(orgId: number, ticketId: number, assignedToEmployeeId: number): Promise<HelpDeskTicket> {
    return apiClient.post(`${BASE}/operations/organizations/${orgId}/tickets/${ticketId}/assign`, { assignedToEmployeeId });
  },
  async resolveTicket(orgId: number, ticketId: number, resolution: string): Promise<HelpDeskTicket> {
    return apiClient.post(`${BASE}/operations/organizations/${orgId}/tickets/${ticketId}/resolve`, { resolution });
  },
  async getMyTickets(orgId: number, page = 0, size = 20): Promise<PageResponse<HelpDeskTicket>> {
    return apiClient.get(`${BASE}/operations/my-tickets?orgId=${orgId}&page=${page}&size=${size}`);
  },
  async getOpenTickets(orgId: number, page = 0, size = 20): Promise<PageResponse<HelpDeskTicket>> {
    return apiClient.get(`${BASE}/operations/organizations/${orgId}/tickets/open?page=${page}&size=${size}`);
  },

  // ── RBAC ──
  async getRoleAssignments(orgId: number): Promise<HrmRole[]> {
    return apiClient.get(`${BASE}/rbac/${orgId}/roles`);
  },
  async grantRole(orgId: number, data: { employeeId: number; role: string }): Promise<HrmRole> {
    return apiClient.post(`${BASE}/rbac/${orgId}/roles`, data);
  },
  async revokeRole(orgId: number, roleId: number): Promise<void> {
    return apiClient.delete(`${BASE}/rbac/${orgId}/roles/${roleId}`);
  },

  // ── Audit ──
  async getAuditLogs(orgId: number, params?: { page?: number; size?: number; entityType?: string }): Promise<PageResponse<HrAuditLog>> {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));
    if (params?.entityType) query.set("entityType", params.entityType);
    return apiClient.get(`${BASE}/audit/${orgId}/logs?${query}`);
  },

  // ── Compliance ──
  async getComplianceAlerts(orgId: number): Promise<HrComplianceAlert[]> {
    return apiClient.get(`${BASE}/compliance/${orgId}/alerts`);
  },
  async generateComplianceAlerts(orgId: number): Promise<{ generated: number }> {
    return apiClient.post(`${BASE}/compliance/${orgId}/alerts/generate`);
  },
  async acknowledgeAlert(orgId: number, alertId: number): Promise<HrComplianceAlert> {
    return apiClient.put(`${BASE}/compliance/${orgId}/alerts/${alertId}/acknowledge`);
  },
  async resolveAlert(orgId: number, alertId: number): Promise<HrComplianceAlert> {
    return apiClient.put(`${BASE}/compliance/${orgId}/alerts/${alertId}/resolve`);
  },
  async dismissAlert(orgId: number, alertId: number): Promise<HrComplianceAlert> {
    return apiClient.put(`${BASE}/compliance/${orgId}/alerts/${alertId}/dismiss`);
  },

  // ── Analytics ──
  async getHrAnalyticsDashboard(orgId: number): Promise<HrAnalyticsDashboard> {
    return apiClient.get(`${BASE}/analytics/${orgId}/dashboard`);
  },
  async getAttritionTrend(orgId: number, months = 12): Promise<HrTrendPoint[]> {
    return apiClient.get(`${BASE}/analytics/${orgId}/attrition-trend?months=${months}`);
  },
  async getHeadcountTrend(orgId: number, months = 12): Promise<HrTrendPoint[]> {
    return apiClient.get(`${BASE}/analytics/${orgId}/headcount-trend?months=${months}`);
  },
  async getDepartmentBreakdown(orgId: number): Promise<{ department: string; count: number }[]> {
    return apiClient.get(`${BASE}/analytics/${orgId}/department-breakdown`);
  },
  async getWorkforceMetrics(orgId: number): Promise<HrWorkforceMetrics> {
    return apiClient.get(`${BASE}/analytics/${orgId}/workforce-metrics`);
  },

  // ── Reports ──
  async getReportConfigs(orgId: number): Promise<HrReportConfig[]> {
    return apiClient.get(`${BASE}/reports/${orgId}/configs`);
  },
  async saveReportConfig(orgId: number, data: Partial<HrReportConfig>): Promise<HrReportConfig> {
    return apiClient.post(`${BASE}/reports/${orgId}/configs`, data);
  },
  async deleteReportConfig(orgId: number, configId: number): Promise<void> {
    return apiClient.delete(`${BASE}/reports/${orgId}/configs/${configId}`);
  },
  async exportReport(orgId: number, reportType: string): Promise<Blob> {
    return apiClient.get(`${BASE}/reports/${orgId}/export?reportType=${reportType}`, { responseType: "blob" });
  },
};
