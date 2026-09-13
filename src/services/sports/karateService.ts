import { apiClient } from "../common/apiClient";

// ── Belts ────────────────────────────────────────────────────────────────────

export interface KarateBelt {
  id: number;
  name: string;
  colorHex: string;
  rank: number;
  minClassesRequired: number;
  minMonthsRequired: number;
  description: string | null;
  active: boolean;
}

export interface KarateBeltRequest {
  name: string;
  colorHex: string;
  rank: number;
  minClassesRequired: number;
  minMonthsRequired: number;
  description?: string;
  active?: boolean;
  sportId: number;
}

// ── Programs ─────────────────────────────────────────────────────────────────

export type ProgramLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "MIXED";

export interface KarateProgram {
  id: number;
  name: string;
  description: string | null;
  level: ProgramLevel;
  durationWeeks: number | null;
  active: boolean;
}

export interface KarateProgramRequest {
  name: string;
  description?: string;
  level: ProgramLevel;
  durationWeeks?: number;
  active?: boolean;
  sportId: number;
}

// ── Batches ──────────────────────────────────────────────────────────────────

export type BatchStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface KarateBatch {
  id: number;
  programId: number;
  programName: string;
  name: string;
  startDate: string;
  endDate: string;
  daysOfWeek: string;
  classStartTime: string;
  classEndTime: string;
  venueName: string | null;
  maxStudents: number | null;
  attendanceThreshold: number;
  status: BatchStatus;
  autoGenerateClasses: boolean;
  activeEnrollments: number;
}

export interface KarateBatchRequest {
  programId: number;
  name: string;
  startDate: string;
  endDate: string;
  daysOfWeek: string;
  classStartTime: string;
  classEndTime: string;
  venueId?: number;
  maxStudents?: number;
  attendanceThreshold?: number;
  autoGenerateClasses?: boolean;
}

// ── Enrollments ──────────────────────────────────────────────────────────────

export type EnrollmentStatus = "ACTIVE" | "WITHDRAWN" | "COMPLETED" | "SUSPENDED";

export interface KarateEnrollment {
  id: number;
  batchId: number;
  batchName: string;
  studentName: string;
  studentId: number;
  currentBeltName: string | null;
  currentBeltColorHex: string | null;
  enrolledAt: string;
  status: EnrollmentStatus;
  attendancePercentage: number;
  totalClassesAttended: number;
  gradingEligible: boolean;
}

export interface KarateEnrollRequest {
  batchId: number;
  studentUserId: number;
  currentBeltId?: number;
}

// ── Classes ──────────────────────────────────────────────────────────────────

export type ClassStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";

export interface KarateClass {
  id: number;
  batchId: number;
  batchName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: ClassStatus;
  notes: string | null;
  reminderSent: boolean;
}

export interface KarateClassGenerateRequest {
  batchId: number;
  fromDate: string;
  toDate: string;
}

// ── Attendance ────────────────────────────────────────────────────────────────

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface KarateAttendanceEntry {
  enrollmentId: number;
  status: AttendanceStatus;
  notes?: string;
}

export interface KarateAttendanceRecord {
  enrollmentId: number;
  studentName: string;
  status: AttendanceStatus;
  notes: string | null;
}

// ── Grading Exams ─────────────────────────────────────────────────────────────

export type ExamStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface KarateGradingExam {
  id: number;
  batchId: number;
  batchName: string;
  targetBeltId: number;
  targetBeltName: string;
  targetBeltColorHex: string;
  scheduledDate: string;
  venue: string | null;
  status: ExamStatus;
  notes: string | null;
}

export interface KarateGradingExamRequest {
  batchId: number;
  targetBeltId: number;
  scheduledDate: string;
  venue?: string;
  notes?: string;
}

export interface KarateExamResultEntry {
  enrollmentId: number;
  passed: boolean;
  score: number | null;
  notes?: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

const BASE = "/api/sports/karate";

export const karateService = {
  // Belts
  getBelts: () => apiClient.get<KarateBelt[]>(`${BASE}/belts`),
  createBelt: (data: KarateBeltRequest) => apiClient.post<KarateBelt>(`${BASE}/belts`, data),
  updateBelt: (id: number, data: KarateBeltRequest) => apiClient.put<KarateBelt>(`${BASE}/belts/${id}`, data),

  // Programs
  getPrograms: (page = 0, size = 20) => apiClient.get<{ content: KarateProgram[]; totalElements: number }>(`${BASE}/programs?page=${page}&size=${size}`),
  createProgram: (data: KarateProgramRequest) => apiClient.post<KarateProgram>(`${BASE}/programs`, data),
  updateProgram: (id: number, data: KarateProgramRequest) => apiClient.put<KarateProgram>(`${BASE}/programs/${id}`, data),

  // Batches
  getBatches: (page = 0, size = 20) => apiClient.get<{ content: KarateBatch[]; totalElements: number }>(`${BASE}/batches?page=${page}&size=${size}`),
  createBatch: (data: KarateBatchRequest) => apiClient.post<KarateBatch>(`${BASE}/batches`, data),
  updateBatchStatus: (id: number, status: BatchStatus) => apiClient.patch<KarateBatch>(`${BASE}/batches/${id}/status?status=${status}`, {}),
  generateClasses: (data: KarateClassGenerateRequest) => apiClient.post<{ generated: number }>(`${BASE}/classes/generate`, data),

  // Enrollments
  getEnrollments: (batchId: number) => apiClient.get<KarateEnrollment[]>(`${BASE}/batches/${batchId}/enrollments`),
  enroll: (data: KarateEnrollRequest) => apiClient.post<KarateEnrollment>(`${BASE}/enrollments`, data),
  updateEnrollmentStatus: (id: number, status: EnrollmentStatus) => apiClient.patch<KarateEnrollment>(`${BASE}/enrollments/${id}/status?status=${status}`, {}),

  // Classes
  getClasses: (batchId: number) => apiClient.get<KarateClass[]>(`${BASE}/batches/${batchId}/classes`),
  updateClassStatus: (id: number, status: ClassStatus) => apiClient.patch<KarateClass>(`${BASE}/classes/${id}/status?status=${status}`, {}),

  // Attendance
  getAttendance: (classId: number) => apiClient.get<KarateAttendanceRecord[]>(`${BASE}/classes/${classId}/attendance`),
  submitAttendance: (classId: number, entries: KarateAttendanceEntry[]) => apiClient.post(`${BASE}/classes/${classId}/attendance`, entries),

  // Grading
  getExams: (batchId: number) => apiClient.get<KarateGradingExam[]>(`${BASE}/batches/${batchId}/exams`),
  createExam: (data: KarateGradingExamRequest) => apiClient.post<KarateGradingExam>(`${BASE}/exams`, data),
  submitResults: (examId: number, entries: KarateExamResultEntry[]) => apiClient.post(`${BASE}/exams/${examId}/results`, entries),
};
