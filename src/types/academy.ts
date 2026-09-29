export type LearningType =
  | 'WORKSHOP'
  | 'COURSE'
  | 'WEBINAR'
  | 'SKILL_SESSION'
  | 'KIDS_CLASS'
  | 'FITNESS_SESSION'
  | 'PROFESSIONAL_SESSION'
  | 'COACHING'
  | 'TUTORING'
  | 'DEMO'
  | 'COMMUNITY_TALK';

export type ProgramLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';

export type ProgramMode = 'IN_PERSON' | 'ONLINE' | 'HYBRID';

export type ProgramStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PUBLISHED'
  | 'REGISTRATION_OPEN'
  | 'FULL'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type InstructorStatus = 'APPLIED' | 'COMMUNITY_VERIFIED' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';

export type EnrollmentStatus = 'CONFIRMED' | 'WAITLISTED' | 'ATTENDED' | 'CANCELLED';

export type AttendanceStatus = 'SCHEDULED' | 'PRESENT' | 'ABSENT' | 'EXCUSED';

export type PricingType = 'FREE' | 'PAID';

export interface AcademyCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  active: boolean;
}

export interface AcademyInstructor {
  id: string;
  communityId: string;
  residentUserId: string;
  fullName: string;
  profession?: string;
  bio?: string;
  profilePicUrl?: string;
  tower?: string;
  flatNumber?: string;
  skills?: string;
  experienceYears?: number;
  status: InstructorStatus;
  totalSessions: number;
  totalLearners: number;
  averageRating: number;
  reviewCount: number;
  approvedAt?: string;
  createdAt?: string;
}

export interface AcademyProgramSession {
  id?: string;
  programId?: string;
  sessionOrder: number;
  title: string;
  description?: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  meetingLink?: string;
  qrCheckInToken?: string;
  completed?: boolean;
}

export interface AcademyProgram {
  id: string;
  communityId: string;
  instructorId: string;
  instructorName: string;
  categoryId: string;
  categoryName?: string;
  title: string;
  summary?: string;
  description?: string;
  coverImageUrl?: string;
  learningType: LearningType;
  level: ProgramLevel;
  mode: ProgramMode;
  location?: string;
  onlineMeetingUrl?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  durationMinutes?: number;
  capacity: number;
  enrolledCount: number;
  waitlistCount: number;
  availableSeats: number;
  isFull: boolean;
  pricingType: PricingType;
  price: number;
  prerequisites?: string;
  targetAudience?: string;
  tags?: string;
  certificateEnabled?: boolean;
  status: ProgramStatus;
  averageRating: number;
  reviewCount: number;
  sessions: AcademyProgramSession[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademyEnrollment {
  id: string;
  programId: string;
  programTitle?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  tower?: string;
  flatNumber?: string;
  seatNumber?: number;
  status: EnrollmentStatus;
  amountPaid: number;
  paymentId?: string;
  qrPassCode?: string;
  enrolledAt?: string;
  cancelledAt?: string;
  createdAt?: string;
}

export interface AcademyAttendance {
  id: string;
  sessionId: string;
  programId: string;
  userId: string;
  userName: string;
  tower?: string;
  flatNumber?: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkInMethod?: string;
  markedBy?: string;
  createdAt?: string;
}

export interface AcademyReview {
  id: string;
  programId: string;
  instructorId: string;
  userId: string;
  userName: string;
  overallRating: number;
  instructorRating?: number;
  contentRating?: number;
  reviewComment?: string;
  wouldRecommend?: boolean;
  createdAt?: string;
}

export interface AcademyCertificate {
  id: string;
  certificateNumber: string;
  programId: string;
  programTitle: string;
  instructorName: string;
  userId: string;
  userName: string;
  issueDate: string;
  verificationHash?: string;
  certificateUrl?: string;
}
