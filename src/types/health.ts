export type ConsultationMode = "IN_PERSON" | "VIDEO" | "PHONE";
export type AppointmentStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW";
export type DoctorVerificationStatus = "SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
export type FamilyRelationship = "SELF" | "SPOUSE" | "CHILD" | "PARENT" | "DEPENDENT";
export type RecordType = "PRESCRIPTION" | "LAB_REPORT" | "VACCINATION" | "ALLERGY" | "CONDITION" | "DISCHARGE_SUMMARY";

export type ProviderCategory =
  | "DOCTOR"
  | "CLINIC"
  | "DENTIST"
  | "DIAGNOSTIC_CENTER"
  | "PHARMACY"
  | "PHYSIOTHERAPIST"
  | "HOME_CARE";

export interface ClinicHourSlot {
  day: string;
  morning?: string;
  evening?: string;
  isClosed?: boolean;
  is24x7?: boolean;
}

export interface AppointmentSlot {
  id: string;
  time: string;
  period: "MORNING" | "AFTERNOON" | "EVENING";
  available: boolean;
  mode: ConsultationMode;
}

export interface CommunityOffer {
  title: string;
  badge: string;
  discountPercent?: number;
  promoCode?: string;
  description: string;
  validUntil: string;
}

export interface DoctorReview {
  communication: number; // 1-5
  waitingTime: number;   // 1-5
  professionalism: number;// 1-5
  clinicExperience: number;// 1-5
  wouldRecommend: boolean;
  comment?: string;
  authorName: string;
  date: string;
}

export interface DoctorDto {
  id: string;
  name: string;
  specialty: string;
  category?: ProviderCategory;
  qualifications: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  consultationModes: ConsultationMode[];
  nextAvailableSlot: string;
  verifiedBadge: boolean;
  registrationNumber: string;
  medicalCouncil: string;
  languages: string[];
  clinicName: string;
  clinicAddress: string;
  distanceKm?: number;
  phone?: string;
  email?: string;
  hospitalAffiliations: string[];
  verifiedCommunityConsultations: number;
  reviews: DoctorReview[];
  clinicHours?: ClinicHourSlot[];
  appointmentSlots?: AppointmentSlot[];
  communityOffer?: CommunityOffer;
  emergencyServicesAvailable?: boolean;
  homeVisitAvailable?: boolean;
  openNow?: boolean;
  about?: string;
}

export interface HealthReminderDto {
  id: string;
  patientId: string;
  title: string;
  type: "VACCINATION" | "APPOINTMENT" | "MEDICATION" | "CHECKUP";
  dueDate: string;
  completed: boolean;
  notes?: string;
}

export interface CaregiverDelegationDto {
  caregiverName: string;
  relationship: string;
  phone: string;
  accessScope: "FULL_ACCESS" | "VIEW_ONLY" | "EMERGENCY_ONLY";
  active: boolean;
}

export interface FamilyMemberDto {
  id: string;
  residentUserId: string;
  fullName: string;
  relationship: FamilyRelationship;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  consentToShareRecords: boolean;
  caregivers?: CaregiverDelegationDto[];
  upcomingReminders?: HealthReminderDto[];
}

export type CareJourneyStage = 
  | "APPOINTMENT_BOOKED" 
  | "CONSULTATION_COMPLETED" 
  | "PRESCRIPTION_ISSUED" 
  | "LAB_TEST_ORDERED" 
  | "RESULTS_READY" 
  | "FOLLOW_UP_SCHEDULED";

export interface CareJourneyDto {
  id: string;
  patientId: string;
  patientName: string;
  patientRelationship: FamilyRelationship;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  currentStage: CareJourneyStage;
  // Step 1: Appointment
  appointmentId: string;
  appointmentTime: string;
  mode: ConsultationMode;
  // Step 2: Shared Reports with Doctor
  sharedReportIds: string[];
  // Step 3: Prescription
  prescriptionId?: string;
  prescriptionDate?: string;
  prescriptionSummary?: string;
  // Step 4: Lab Orders
  labPackageName?: string;
  sampleCollected?: boolean;
  // Step 5: Results
  resultsAvailable: boolean;
  resultReadyNotificationSent: boolean;
  resultDocumentId?: string;
  // Step 6: Follow-up decided by Clinician
  clinicianRecommendedFollowUp?: {
    isAppropriate: boolean;
    dueDate: string;
    instructions: string;
    status: "PENDING" | "BOOKED" | "DISMISSED";
  };
}

export interface HealthAppointmentDto {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  patientId: string;
  patientName: string;
  patientRelationship: FamilyRelationship;
  bookedByUserId: string;
  slotTime: string;
  mode: ConsultationMode;
  status: AppointmentStatus;
  fee: number;
  meetingLink?: string;
  clinicAddress?: string;
  statusHistory: string[];
  reviewSubmitted?: boolean;
  careJourneyId?: string;
}

export interface MedicalRecordDto {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  type: RecordType;
  date: string;
  doctorOrLabName: string;
  fileUrl: string;
  notes?: string;
  authorizedUserIds: string[];
}

export interface LabPackageDto {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  testCount: number;
  testsIncluded: string[];
  homeCollectionAvailable: boolean;
  fastingRequired: boolean;
  reportTurnaroundHours: number;
}

export interface HomecareProviderDto {
  id: string;
  name: string;
  role: "Nurse" | "Physiotherapist" | "Attendant" | "Elder Care" | "Post-Surgery Care";
  experienceYears: number;
  rating: number;
  verifiedHealthcareBadge: boolean;
  licenseNumber: string;
  dailyRate: number;
  hourlyRate: number;
  available: boolean;
}

export interface HealthEmergencyContactDto {
  id: string;
  name: string;
  type: "HOSPITAL" | "AMBULANCE" | "COMMUNITY_CLINIC" | "PHARMACY" | "BLOOD_BANK";
  phone: string;
  distanceKm: number;
  is24x7: boolean;
  address: string;
}

export type CampCategory =
  | "DIABETES_BP"
  | "DIABETES_CARDIAC"
  | "DENTAL_EYE"
  | "VACCINATION"
  | "SENIOR_SCREENING"
  | "KIDS_NUTRITION"
  | "GENERAL_HEALTH";

export type CampTargetAudience = "ALL" | "SENIORS" | "KIDS" | "WOMEN" | "ADULTS";

export type CampAttendanceStatus =
  | "REGISTERED"
  | "CHECKED_IN"
  | "VITALS_RECORDED"
  | "DOCTOR_CONSULTED"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";

export interface CampTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  isAvailable: boolean;
}

export interface CampVitals {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodSugarMgDl?: number;
  bloodSugarType?: "FASTING" | "RANDOM" | "POST_PRANDIAL" | "HBA1C";
  pulseBpm?: number;
  spo2Percent?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  bmiCategory?: "UNDERWEIGHT" | "NORMAL" | "OVERWEIGHT" | "OBESE";
}

export interface CampPartnerHospital {
  name: string;
  accreditation: string;
  doctorsCount: number;
  contactPhone: string;
  logoUrl?: string;
  leadDoctor?: string;
}

export interface CampPartnerReport {
  partnerName: string;
  campTitle: string;
  date: string;
  leadDoctorName: string;
  totalScreeningsConducted: number;
  keyFindingsSummary: string;
  preventiveRecommendations: string[];
  followUpClinicDays: string;
}

export interface CampAggregateStats {
  totalRegistered: number;
  totalAttended: number;
  attendanceRatePercent: number;
  satisfactionRate: number;
  ageBreakdown: { kids: number; adults: number; seniors: number };
  bpSummary: { normal: number; elevated: number; stage1OrHigher: number };
  sugarSummary: { normal: number; preDiabetic: number; diabetic: number };
  vaccinesAdministeredCount?: number;
  referralsCount: number;
}

export interface HealthCampDto {
  id: string;
  title: string;
  campCategory: CampCategory;
  targetAudience?: CampTargetAudience;
  partnerProviderName: string;
  partnerHospital?: CampPartnerHospital;
  partnerLogo?: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  availableSlots: number;
  totalSlots: number;
  isFree: boolean;
  feePerResident: number;
  servicesIncluded: string[];
  description: string;
  fastingInstructions?: string;
  preparationNotes?: string;
  timeSlots?: CampTimeSlot[];
  linkedManaEventId?: number | string;
  aggregateStats?: CampAggregateStats;
  partnerReport?: CampPartnerReport;
}

export interface HealthCampRegistrationDto {
  id: string;
  campId: string;
  campTitle: string;
  tokenNumber: string;
  slotId?: string;
  slotTime: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientRelationship?: string;
  phone?: string;
  flatNo?: string;
  attendanceStatus: CampAttendanceStatus;
  registeredAt?: string;
  checkedInAt?: string;
  completedAt?: string;
  vitals?: CampVitals;
  clinicalNotes?: string;
  referralRecommended?: boolean;
  referralSpecialty?: string;
  vaccineAdministered?: {
    vaccineName: string;
    batchNumber: string;
    dose: string;
    administeredBy: string;
  };
  dentalFindings?: {
    cariesDetected: boolean;
    scalingNeeded: boolean;
    orthodonticAdvice?: string;
    notes?: string;
  };
  visionFindings?: {
    leftEyeAcuity: string;
    rightEyeAcuity: string;
    glassesAdvised: boolean;
    notes?: string;
  };
  vaultRecordId?: string;
  notes?: string;
}

export type BenefitCategoryKey =
  | "CONSULTATIONS"
  | "DIAGNOSTICS"
  | "HEALTH_CAMPS"
  | "PHARMACY"
  | "DENTAL_VISION";

export interface BenefitCategoryAllowance {
  category: BenefitCategoryKey;
  label: string;
  totalAllowance: number;
  usedAllowance: number;
  remainingAllowance: number;
  cashlessSupported: boolean;
  coPayPercent: number; // e.g. 0 for 100% cashless, 20 for 20% co-pay on non-network
  description: string;
}

export interface BenefitProgramDto {
  programId: string;
  sponsorName: string; // e.g. "Mana Residency RWA Wellness Fund & TechCorp Perks"
  policyNumber: string;
  planName: string;
  validUntil: string;
  coveredMembers: {
    id: string;
    name: string;
    relation: string;
    age: number;
    cashlessCardNumber: string;
  }[];
  tpaHelpdeskNumber: string;
  tpaEmail: string;
}

export interface ClaimDocumentAttachment {
  id: string;
  name: string;
  documentType: "PRESCRIPTION" | "BILL_INVOICE" | "DIAGNOSTIC_REPORT" | "DISCHARGE_SUMMARY" | "PAYMENT_RECEIPT";
  fileSize?: string;
  uploadedAt: string;
  fileUrl?: string;
}

export interface ClaimStatusTimelineEvent {
  stage: "SUBMITTED" | "DOCS_VERIFIED" | "MEDICAL_SCRUTINY" | "APPROVED" | "SETTLED" | "REJECTED";
  title: string;
  timestamp: string;
  notes?: string;
}

export interface HealthcareClaimDto {
  id: string;
  claimNumber: string;
  category: BenefitCategoryKey;
  serviceName: string;
  patientName: string;
  patientRelationship: string;
  providerName: string;
  billNumber: string;
  treatmentDate: string;
  submittedAt: string;
  billAmount: number;
  approvedAmount: number;
  coPayAmount: number;
  outOfPocketAmount: number;
  status: "SUBMITTED" | "DOCS_VERIFIED" | "MEDICAL_SCRUTINY" | "APPROVED" | "SETTLED" | "REJECTED";
  payoutReference?: string;
  rejectionReason?: string;
  documents: ClaimDocumentAttachment[];
  timeline: ClaimStatusTimelineEvent[];
}

export interface CashlessPreAuthDto {
  preAuthId: string;
  approvalCode: string;
  beneficiaryName: string;
  category: BenefitCategoryKey;
  networkProviderName: string;
  providerAddress: string;
  eligibleCashlessCap: number;
  coPayEstimated: number;
  generatedAt: string;
  validUntil: string;
  qrPayload: string;
  instructions: string[];
}

export interface HealthBenefitWalletDto {
  communityAllowance: number;
  usedAllowance: number;
  remainingAllowance: number;
  coveredServices: string[];
  reimbursementActive: boolean;
  program: BenefitProgramDto;
  categories: BenefitCategoryAllowance[];
  activePreAuthorizations: CashlessPreAuthDto[];
  recentClaims: HealthcareClaimDto[];
}

// ─────────────────────────────────────────────────────────────
// PREVENTIVE HEALTH & WELLNESS (CONFIDENTIAL BY DEFAULT)
// ─────────────────────────────────────────────────────────────

export type PreventiveReminderType =
  | "VACCINATION"
  | "ANNUAL_CHECKUP"
  | "DENTAL_CHECKUP"
  | "EYE_CHECKUP"
  | "BLOOD_SUGAR_SCREENING"
  | "MAMMOGRAM_SCREENING"
  | "CARDIAC_EVALUATION"
  | "MEDICATION_REFILL";

export interface PreventiveReminderDto {
  id: string;
  title: string;
  targetMemberId: string;
  targetMemberName: string;
  relationship: string;
  reminderType: PreventiveReminderType;
  dueDate: string;
  recurrence: "ONCE" | "EVERY_3_MONTHS" | "EVERY_6_MONTHS" | "ANNUAL";
  channels: {
    inApp: boolean;
    whatsapp: boolean;
    calendarSync: boolean;
  };
  status: "PENDING" | "COMPLETED" | "SNOOZED";
  lastCompletedDate?: string;
  notes?: string;
  isUserControlled: true;
}

export type ChallengeMetricType = "STEPS" | "ACTIVE_MINUTES" | "DISTANCE_KM";

export interface FitnessChallengeParticipant {
  id: string;
  displayName: string; // e.g. "Anonymous Runner" or "Resident • Tower B" to avoid exposing identity
  currentValue: number;
  rank: number;
  isCurrentUser: boolean;
  avatarIcon?: string;
}

export interface FitnessChallengeDto {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  metricType: ChallengeMetricType;
  targetGoal: number;
  unit: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  participantsCount: number;
  rewardBadge: string;
  isEnrolled: boolean;
  userProgress: number;
  userRank?: number;
  userVisibility: "ANONYMOUS_ALIAS" | "PRIVATE" | "PUBLIC_NAME";
  topLeaderboard: FitnessChallengeParticipant[];
}

export interface WellnessWebinarDto {
  id: string;
  title: string;
  topicCategory: "NUTRITION" | "DIABETES_PREVENTION" | "CARDIOLOGY" | "MENTAL_WELLNESS" | "SLEEP_SCIENCE" | "ERGONOMICS";
  academyModule: string; // e.g. "Mana Academy • Health Track"
  speakerName: string;
  speakerDesignation: string;
  speakerCredentials: string; // e.g. "MD, Endocrinologist • Manipal Hospitals"
  speakerAvatarUrl?: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  registeredCount: number;
  isUserRegistered: boolean;
  description: string;
  keyTakeaways: string[];
  joinLink?: string;
  recordedArchiveAvailable?: boolean;
}

export interface ClinicallySupervisedProgramDto {
  id: string;
  title: string;
  conditionCategory: "DIABETES_REVERSAL" | "METABOLIC_WEIGHT" | "HYPERTENSION" | "SENIOR_MOBILITY" | "PEDIATRIC_NUTRITION";
  tagline: string;
  description: string;
  durationWeeks: number;
  programLead: {
    doctorName: string;
    specialty: string;
    qualifications: string;
    registrationNumber: string;
    hospitalAffiliation: string;
  };
  // Confidentiality Guarantee: Strictly 1-on-1, invisible to community feed or neighbors
  isStrictlyConfidential: true;
  privacyGuaranteeNotice: string;
  curriculumMilestones: {
    week: number;
    title: string;
    deliverable: string;
  }[];
  inclusionHighlights: string[];
  enrollmentStatus: "NOT_ENROLLED" | "ACTIVE" | "COMPLETED";
  assignedDietitianOrCoach?: string;
  nextClinicalReviewDate?: string;
}

export interface VoluntaryHealthGoalDto {
  id: string;
  goalType: "DAILY_STEPS" | "WATER_LITERS" | "SLEEP_HOURS" | "FASTING_BLOOD_SUGAR" | "TARGET_WEIGHT";
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  lastLoggedDate: string;
  streakDays: number;
  isPrivate: true; // Always strictly private to the user
}

// ─────────────────────────────────────────────────────────────
// HEALTHCARE PROVIDER OPERATIONS & DASHBOARD
// ─────────────────────────────────────────────────────────────

export type ProviderStaffRole = "CHIEF_DOCTOR" | "CONSULTANT" | "CLINIC_ADMIN" | "RECEPTIONIST" | "LAB_TECHNICIAN" | "PHLEBOTOMIST";

export interface ProviderStaffMemberDto {
  id: string;
  name: string;
  role: ProviderStaffRole;
  email: string;
  phone: string;
  registrationNumber?: string;
  permissions: ("MANAGE_SLOTS" | "ACCEPT_BOOKINGS" | "EDIT_PRICING" | "UPLOAD_RX_REPORTS" | "ANSWER_QUERIES" | "DISPATCH_SAMPLES")[];
  active: boolean;
}

export interface ProviderServiceItemDto {
  id: string;
  name: string;
  category: "CONSULTATION" | "PROCEDURE" | "DIAGNOSTIC_TEST" | "HOME_SAMPLE" | "VACCINATION";
  price: number;
  originalPrice?: number;
  communityDiscountPercent: number;
  turnaroundTime?: string;
  fastingRequired?: boolean;
  homeAvailable: boolean;
  description: string;
  enabled: boolean;
}

export interface PatientQueryDto {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  subject: string;
  message: string;
  receivedAt: string;
  status: "OPEN" | "RESPONDED" | "RESOLVED";
  replyMessage?: string;
  repliedAt?: string;
  repliedBy?: string;
}

export interface ProviderFulfillmentOrderDto {
  id: string;
  orderNumber: string;
  patientName: string;
  patientFlatNo: string;
  patientPhone: string;
  serviceName: string;
  type: "HOME_SAMPLE_COLLECTION" | "CLINIC_APPOINTMENT" | "MEDICINE_DELIVERY" | "TELE_CONSULT";
  scheduledTime: string;
  status: "SCHEDULED" | "PHLEBOTOMIST_ASSIGNED" | "SAMPLE_COLLECTED" | "PROCESSING" | "REPORT_DISPATCHED" | "CANCELLED";
  assignedStaffName?: string;
  assignedStaffPhone?: string;
  notes?: string;
}

export interface ProviderProfileDto {
  id: string;
  name: string;
  type: "DOCTOR" | "CLINIC" | "DIAGNOSTIC_LAB";
  specialty: string;
  registrationNumber: string;
  medicalCouncil: string;
  clinicAddress: string;
  phone: string;
  email: string;
  acceptingNewPatients: boolean;
  emergencySlotAvailable: boolean;
  averageConsultTimeMins: number;
}

// ─────────────────────────────────────────────────────────────
// HEALTHCARE DATA SECURITY, CONSENT & AUDIT (DISHA & DPDP ACT)
// ─────────────────────────────────────────────────────────────

export type ConsentPurposeKey =
  | "CONSULTATION_CARE"
  | "LAB_DIAGNOSTICS"
  | "PHARMACY_DISPATCH"
  | "SECOND_OPINION"
  | "EMERGENCY_SOS_OVERRIDE";

export interface PatientConsentDto {
  consentId: string;
  patientId: string;
  grantedToUserId: string;
  grantedToRole: string; // e.g. "DOCTOR", "LAB_PATHOLOGIST"
  grantedToName: string;
  doctorSpecialty?: string;
  doctorClinicName?: string;
  purpose: ConsentPurposeKey;
  grantedAt: string;
  expiresAt: string;
  isActive: boolean;
  revokedAt?: string;
  revocationReason?: string;
}

export interface SecurityAuditLogDto {
  auditId: string;
  accessorUserId: string;
  accessorName: string;
  accessorRole: string;
  patientId: string;
  resourceId?: string;
  action: "READ_RECORD" | "DOWNLOAD_PDF" | "UPDATE_PRESCRIPTION" | "GRANT_CONSENT" | "REVOKE_CONSENT" | "SHARE_VAULT_ITEM";
  purpose: ConsentPurposeKey;
  timestamp: string;
  ipAddress: string;
  authorized: boolean;
  failureReason?: string;
}

export interface ComplianceDisclosureDto {
  actName: string; // "Digital Personal Data Protection (DPDP) Act 2023 & DISHA Guidelines"
  storageSeparationSummary: string;
  adminExclusionGuarantee: string;
  timeBoundAccessDurationDays: number;
  auditTrailRetentionYears: number;
  breachNotificationLeadTimeHours: number;
}