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
} from "../../types/hrm";

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
  async createLeaveType(orgId: number, data: { leaveTypeName: string; defaultBalance: number; isPaid?: boolean; isCarryForward?: boolean; maxCarryForward?: number }): Promise<LeaveType> {
    return apiClient.post(`${BASE}/organizations/${orgId}/leave-types`, data);
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
};
