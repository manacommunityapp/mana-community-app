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
  sportId?: number;
}

// ── Programs ─────────────────────────────────────────────────────────────────

export type ProgramLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "MIXED";

export interface KarateProgram {
  id: number;
  name: string;
  description: string | null;
  level: ProgramLevel;
  durationWeeks: number | null;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
}

export interface KarateProgramRequest {
  name: string;
  description?: string;
  level: ProgramLevel;
  durationWeeks?: number;
  active?: boolean;
  sportId: number;
  startDate?: string;
  endDate?: string;
}

// ── Batches ──────────────────────────────────────────────────────────────────
// Field names match backend KarateBatchRequest DTO exactly.

export type BatchStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface KarateBatch {
  id: number;
  programId: number;
  programName: string;
  batchName: string;
  startTime: string;        // HH:mm
  endTime: string;          // HH:mm
  daysOfWeek: string;       // e.g. "MON,WED,FRI"
  venueName: string | null;
  maxStudents: number | null;
  attendanceThreshold: number;
  status: BatchStatus;
  autoGenerateClasses: boolean;
  activeEnrollments: number;
}

export interface KarateBatchRequest {
  batchName: string;        // matches backend @NotBlank private String batchName
  daysOfWeek: string;
  startTime: string;        // matches backend LocalTime startTime
  endTime: string;          // matches backend LocalTime endTime
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
  studentUserId: number;    // matches backend @NotNull private Long studentUserId
  initialBeltId?: number;   // matches backend private Long initialBeltId
  notes?: string;
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
  topic: string | null;
  classNotes: string | null;
  reminderSent: boolean;
}

export interface KarateClassGenerateRequest {
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
  id: number;
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
  examinerName: string | null;
  maxCandidates: number | null;
  status: ExamStatus;
  notes: string | null;
}

export interface KarateGradingExamRequest {
  targetBeltId: number;     // matches backend @NotNull private Long targetBeltId
  scheduledDate: string;    // matches backend @NotNull private LocalDate scheduledDate
  venueId?: number;         // matches backend private Long venueId (NOT a string)
  examinerName?: string;
  maxCandidates?: number;
  notes?: string;
}

export interface KarateExamResultEntry {
  enrollmentId: number;     // matches backend @NotNull private Long enrollmentId
  passed: boolean;          // matches backend @NotNull private Boolean passed
  newBeltId?: number;       // matches backend private Long newBeltId (triggers belt promotion)
  score?: number;           // matches backend private BigDecimal score
  remarks?: string;         // matches backend private String remarks (NOT notes)
}

// ── API calls ─────────────────────────────────────────────────────────────────
// URL patterns match SportsKarateController exactly.

const BASE = "/api/sports/karate";

export const karateService = {
  // Belts
  getBelts: () =>
    apiClient.get<KarateBelt[]>(`${BASE}/belts`),
  createBelt: (data: KarateBeltRequest) =>
    apiClient.post<KarateBelt>(`${BASE}/belts`, data),
  updateBelt: (id: number, data: KarateBeltRequest) =>
    apiClient.put<KarateBelt>(`${BASE}/belts/${id}`, data),
  deleteBelt: (id: number) =>
    apiClient.delete(`${BASE}/belts/${id}`),

  // Programs
  getPrograms: (page = 0, size = 20) =>
    apiClient.get<{ content: KarateProgram[]; totalElements: number }>(`${BASE}/programs?page=${page}&size=${size}`),
  getProgram: (id: number) =>
    apiClient.get<KarateProgram>(`${BASE}/programs/${id}`),
  createProgram: (data: KarateProgramRequest) =>
    apiClient.post<KarateProgram>(`${BASE}/programs`, data),
  updateProgram: (id: number, data: KarateProgramRequest) =>
    apiClient.put<KarateProgram>(`${BASE}/programs/${id}`, data),
  deleteProgram: (id: number) =>
    apiClient.delete(`${BASE}/programs/${id}`),

  // Batches — programId is a required path param (POST /programs/{id}/batches)
  getBatches: (programId: number) =>
    apiClient.get<KarateBatch[]>(`${BASE}/programs/${programId}/batches`),
  createBatch: (programId: number, data: KarateBatchRequest) =>
    apiClient.post<KarateBatch>(`${BASE}/programs/${programId}/batches`, data),
  updateBatch: (id: number, data: KarateBatchRequest) =>
    apiClient.put<KarateBatch>(`${BASE}/batches/${id}`, data),
  updateBatchStatus: (id: number, status: BatchStatus) =>
    apiClient.put<KarateBatch>(`${BASE}/batches/${id}/status?status=${status}`, {}),

  // Class generation — batchId is a required path param
  generateClasses: (batchId: number, data: KarateClassGenerateRequest) =>
    apiClient.post<KarateClass[]>(`${BASE}/batches/${batchId}/classes/generate`, data),

  // Enrollments — enroll is POST /batches/{batchId}/enroll
  getEnrollments: (batchId: number) =>
    apiClient.get<KarateEnrollment[]>(`${BASE}/batches/${batchId}/enrollments`),
  enroll: (batchId: number, data: KarateEnrollRequest) =>
    apiClient.post<KarateEnrollment>(`${BASE}/batches/${batchId}/enroll`, data),
  updateEnrollmentStatus: (id: number, status: EnrollmentStatus) =>
    apiClient.put<KarateEnrollment>(`${BASE}/enrollments/${id}/status?status=${status}`, {}),
  getGradingEligible: (batchId: number) =>
    apiClient.get<KarateEnrollment[]>(`${BASE}/batches/${batchId}/grading-eligible`),

  // Classes
  getClasses: (batchId: number) =>
    apiClient.get<KarateClass[]>(`${BASE}/batches/${batchId}/classes`),
  startClass: (id: number) =>
    apiClient.put<KarateClass>(`${BASE}/classes/${id}/start`, {}),
  completeClass: (id: number) =>
    apiClient.put<KarateClass>(`${BASE}/classes/${id}/complete`, {}),
  cancelClass: (id: number, reason?: string) =>
    apiClient.put<KarateClass>(`${BASE}/classes/${id}/cancel${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`, {}),

  // Attendance
  getAttendance: (classId: number) =>
    apiClient.get<KarateAttendanceRecord[]>(`${BASE}/classes/${classId}/attendance`),
  submitAttendance: (classId: number, entries: KarateAttendanceEntry[]) =>
    apiClient.post(`${BASE}/classes/${classId}/attendance`, entries),

  // Grading — createExam is POST /batches/{batchId}/exams
  getExams: (batchId: number) =>
    apiClient.get<KarateGradingExam[]>(`${BASE}/batches/${batchId}/exams`),
  createExam: (batchId: number, data: KarateGradingExamRequest) =>
    apiClient.post<KarateGradingExam>(`${BASE}/batches/${batchId}/exams`, data),
  cancelExam: (id: number) =>
    apiClient.put(`${BASE}/exams/${id}/cancel`, {}),
  getEligibleForExam: (examId: number) =>
    apiClient.get<KarateEnrollment[]>(`${BASE}/exams/${examId}/eligible`),
  submitResults: (examId: number, entries: KarateExamResultEntry[]) =>
    apiClient.post(`${BASE}/exams/${examId}/results`, entries),
  getExamResults: (examId: number) =>
    apiClient.get(`${BASE}/exams/${examId}/results`),
};
