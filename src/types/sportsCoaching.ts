import type { SportType } from "./sportsVendor";

export type AgeGroup = "UNDER_10" | "UNDER_14" | "UNDER_18" | "ADULTS" | "ALL_AGES";
export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
export type BatchStatus = "UPCOMING" | "REGISTRATION_OPEN" | "ACTIVE" | "FULL" | "COMPLETED";
export type EnrollmentStatus = "ACTIVE" | "PENDING_PAYMENT" | "PAUSED" | "CANCELLED" | "EXPIRED";
export type AttendanceState = "PRESENT" | "ABSENT" | "EXCUSED";

export interface CoachCertification {
  title: string;
  issuingBody: string; // e.g., "BWF Level 2", "NIS Certified", "BCCI Level 1"
  year: number;
  certificateUrl?: string;
}

export interface SportsCoach {
  id: string;
  vendorId: string;
  fullName: string;
  phone: string;
  email: string;
  sport: SportType;
  experienceYears: number;
  bio: string;
  profilePicUrl?: string;
  certifications: CoachCertification[];
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  activeBatchesCount: number;
  status: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
  createdAt: string;
}

export interface AcademyBatch {
  id: string;
  vendorId: string;
  coachId: string;
  coachName: string;
  title: string; // e.g., "Junior Badminton Elite Morning Batch"
  sport: SportType;
  ageGroup: AgeGroup;
  skillLevel: SkillLevel;
  maxCapacity: number;
  enrolledCount: number;
  daysOfWeek: string[]; // e.g., ["MON", "WED", "FRI"] or ["SAT", "SUN"]
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  monthlyFee: number;
  quarterlyFee?: number;
  facilityId?: string;
  facilityName?: string;
  courtName?: string;
  status: BatchStatus;
  description?: string;
  createdAt: string;
}

export interface BatchEnrollment {
  id: string;
  batchId: string;
  batchTitle: string;
  sport: SportType;
  studentName: string;
  studentAge: number;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  communityUnit: string; // e.g., "Tower 3 - 402, Prestige Shantiniketan"
  startDate: string;
  renewalDate: string; // Next fee renewal date
  monthlyFee: number;
  feePaid: boolean;
  paymentReference?: string;
  attendancePercent: number;
  status: EnrollmentStatus;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  batchId: string;
  date: string; // YYYY-MM-DD
  enrollmentId: string;
  studentName: string;
  status: AttendanceState;
  remarks?: string;
}

export interface SportsMembershipPlan {
  id: string;
  vendorId: string;
  name: string; // e.g., "Quarterly Unlimited Academy Pass"
  sport: SportType;
  durationMonths: number;
  sessionsLimit: number; // e.g., 24 sessions
  price: number;
  residentDiscountPercent: number;
  perks: string[];
  terms?: string;
  isActive: boolean;
}
