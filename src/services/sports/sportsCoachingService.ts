import { apiClient } from "../common/apiClient";
import type {
  SportsCoach,
  AcademyBatch,
  BatchEnrollment,
  AttendanceRecord,
  SportsMembershipPlan,
  EnrollmentStatus,
  AttendanceState,
} from "../../types/sportsCoaching";

const STORAGE_KEY_COACHES = "mana_sports_coaches_v1";
const STORAGE_KEY_BATCHES = "mana_sports_batches_v1";
const STORAGE_KEY_ENROLLMENTS = "mana_sports_enrollments_v1";
const STORAGE_KEY_ATTENDANCE = "mana_sports_attendance_v1";
const STORAGE_KEY_MEMBERSHIPS = "mana_sports_memberships_v1";

const INITIAL_COACHES: SportsCoach[] = [
  {
    id: "coach-1",
    vendorId: "vendor-sp-101",
    fullName: "Arunachalam Murugan",
    phone: "+91 98450 77112",
    email: "arun.coach@smashzone.com",
    sport: "BADMINTON",
    experienceYears: 12,
    bio: "Former Karnataka State Champion and BWF Level 2 certified coach specializing in stroke mastery, footwork agility, and match strategy for junior competitors.",
    profilePicUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    certifications: [
      { title: "BWF Level 2 High Performance Coach", issuingBody: "Badminton World Federation", year: 2019 },
      { title: "NIS Sports Agility Diploma", issuingBody: "National Institute of Sports", year: 2015 },
    ],
    hourlyRate: 800,
    rating: 4.9,
    reviewCount: 48,
    activeBatchesCount: 2,
    status: "ACTIVE",
    createdAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "coach-2",
    vendorId: "vendor-sp-102",
    fullName: "Kavita Ranganathan",
    phone: "+91 97411 99234",
    email: "kavita.r@apexturf.in",
    sport: "FOOTBALL",
    experienceYears: 8,
    bio: "AIFF 'C' License coach with 8 years grassroots youth development experience. Focused on tactical positional play, endurance, and game temperament.",
    profilePicUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    certifications: [
      { title: "AIFF 'C' License", issuingBody: "All India Football Federation", year: 2021 },
      { title: "First Aid & Sports Injury Prevention", issuingBody: "Red Cross", year: 2023 },
    ],
    hourlyRate: 700,
    rating: 4.8,
    reviewCount: 36,
    activeBatchesCount: 2,
    status: "ACTIVE",
    createdAt: "2026-01-20T11:00:00.000Z",
  },
];

const INITIAL_BATCHES: AcademyBatch[] = [
  {
    id: "batch-101",
    vendorId: "vendor-sp-101",
    coachId: "coach-1",
    coachName: "Arunachalam Murugan",
    title: "Junior Badminton Foundations (U-12)",
    sport: "BADMINTON",
    ageGroup: "UNDER_10",
    skillLevel: "BEGINNER",
    maxCapacity: 12,
    enrolledCount: 9,
    daysOfWeek: ["MON", "WED", "FRI"],
    startTime: "16:30",
    endTime: "17:30",
    startDate: "2026-03-01",
    monthlyFee: 2800,
    quarterlyFee: 7500,
    facilityId: "fac-1",
    facilityName: "SmashZone Arena - Whitefield",
    courtName: "Court 1 & 2",
    status: "ACTIVE",
    description: "Fundamental grip, footwork drills, service accuracy, and hand-eye coordination for aspiring young players.",
    createdAt: "2026-02-10T09:00:00.000Z",
  },
  {
    id: "batch-102",
    vendorId: "vendor-sp-101",
    coachId: "coach-1",
    coachName: "Arunachalam Murugan",
    title: "Elite Competitive Squad (U-16)",
    sport: "BADMINTON",
    ageGroup: "UNDER_14",
    skillLevel: "ADVANCED",
    maxCapacity: 8,
    enrolledCount: 7,
    daysOfWeek: ["TUE", "THU", "SAT"],
    startTime: "06:30",
    endTime: "08:00",
    startDate: "2026-03-01",
    monthlyFee: 4200,
    quarterlyFee: 11500,
    facilityId: "fac-1",
    facilityName: "SmashZone Arena - Whitefield",
    courtName: "Court 3",
    status: "ACTIVE",
    description: "High-intensity tournament preparation, tactical shot placement, smash velocity, and stamina conditioning.",
    createdAt: "2026-02-12T10:00:00.000Z",
  },
  {
    id: "batch-201",
    vendorId: "vendor-sp-102",
    coachId: "coach-2",
    coachName: "Kavita Ranganathan",
    title: "Grassroots Football Tigers (U-14)",
    sport: "FOOTBALL",
    ageGroup: "UNDER_14",
    skillLevel: "INTERMEDIATE",
    maxCapacity: 16,
    enrolledCount: 14,
    daysOfWeek: ["TUE", "THU", "SAT"],
    startTime: "17:00",
    endTime: "18:30",
    startDate: "2026-03-05",
    monthlyFee: 3200,
    quarterlyFee: 8800,
    facilityId: "fac-2",
    facilityName: "Apex Sports Arena - Sarjapur",
    courtName: "Pitch B (Turf)",
    status: "ACTIVE",
    description: "Ball control, passing under pressure, small-sided matches, and spatial awareness drills.",
    createdAt: "2026-02-15T12:00:00.000Z",
  },
];

const INITIAL_ENROLLMENTS: BatchEnrollment[] = [
  {
    id: "enr-501",
    batchId: "batch-101",
    batchTitle: "Junior Badminton Foundations (U-12)",
    sport: "BADMINTON",
    studentName: "Aarav Sharma",
    studentAge: 9,
    parentName: "Sandeep Sharma",
    parentPhone: "+91 98860 12345",
    parentEmail: "sandeep.sharma@gmail.com",
    communityUnit: "Tower 3 - 504 (Prestige Shantiniketan)",
    startDate: "2026-03-01",
    renewalDate: "2026-11-01",
    monthlyFee: 2800,
    feePaid: true,
    paymentReference: "PAY_RAZ_ACAD_501",
    attendancePercent: 92,
    status: "ACTIVE",
    createdAt: "2026-02-20T10:00:00.000Z",
  },
  {
    id: "enr-502",
    batchId: "batch-101",
    batchTitle: "Junior Badminton Foundations (U-12)",
    sport: "BADMINTON",
    studentName: "Diya Nair",
    studentAge: 10,
    parentName: "Lakshmi Nair",
    parentPhone: "+91 98451 98765",
    parentEmail: "lakshmi.nair@gmail.com",
    communityUnit: "Tower 1 - 1002 (Sobha Rose)",
    startDate: "2026-03-01",
    renewalDate: "2026-11-01",
    monthlyFee: 2800,
    feePaid: true,
    paymentReference: "PAY_RAZ_ACAD_502",
    attendancePercent: 88,
    status: "ACTIVE",
    createdAt: "2026-02-22T11:00:00.000Z",
  },
  {
    id: "enr-503",
    batchId: "batch-101",
    batchTitle: "Junior Badminton Foundations (U-12)",
    sport: "BADMINTON",
    studentName: "Kabir Sengupta",
    studentAge: 8,
    parentName: "Amit Sengupta",
    parentPhone: "+91 99002 33445",
    parentEmail: "amit.sen@gmail.com",
    communityUnit: "Tower 5 - 201 (Prestige Shantiniketan)",
    startDate: "2026-03-01",
    renewalDate: "2026-10-31",
    monthlyFee: 2800,
    feePaid: false, // Due for renewal!
    attendancePercent: 85,
    status: "PENDING_PAYMENT",
    createdAt: "2026-02-25T14:00:00.000Z",
  },
  {
    id: "enr-504",
    batchId: "batch-201",
    batchTitle: "Grassroots Football Tigers (U-14)",
    sport: "FOOTBALL",
    studentName: "Rohan Patel",
    studentAge: 13,
    parentName: "Kunal Patel",
    parentPhone: "+91 97412 11223",
    parentEmail: "kunal.patel@gmail.com",
    communityUnit: "Villa 12 (SJR Watermark)",
    startDate: "2026-03-05",
    renewalDate: "2026-11-05",
    monthlyFee: 3200,
    feePaid: true,
    paymentReference: "PAY_RAZ_ACAD_504",
    attendancePercent: 95,
    status: "ACTIVE",
    createdAt: "2026-03-01T15:00:00.000Z",
  },
];

const INITIAL_MEMBERSHIPS: SportsMembershipPlan[] = [
  {
    id: "mem-1",
    vendorId: "vendor-sp-101",
    name: "Quarterly Academy Pass (Badminton)",
    sport: "BADMINTON",
    durationMonths: 3,
    sessionsLimit: 36,
    price: 7500,
    residentDiscountPercent: 15,
    perks: ["36 Academy Sessions", "1 Complimentary Racquet Re-stringing", "10% off Court Bookings"],
    isActive: true,
  },
  {
    id: "mem-2",
    vendorId: "vendor-sp-101",
    name: "Annual Junior Excellence Pass",
    sport: "BADMINTON",
    durationMonths: 12,
    sessionsLimit: 144,
    price: 26000,
    residentDiscountPercent: 20,
    perks: ["144 Academy Sessions", "2 Personalized Coach Reviews", "Free Academy Jersey & Kit"],
    isActive: true,
  },
];

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export const sportsCoachingService = {
  // ── Coaches ──
  async getCoaches(vendorId?: string): Promise<SportsCoach[]> {
    try {
      const url = vendorId ? `/sports-vendor/coaches?vendorId=${vendorId}` : "/sports-vendor/coaches";
      const res = await apiClient.get<SportsCoach[]>(url);
      if (res && res.length > 0) return res;
    } catch {}

    let list = getStored<SportsCoach[]>(STORAGE_KEY_COACHES, INITIAL_COACHES);
    if (vendorId) list = list.filter((c) => c.vendorId === vendorId);
    return list;
  },

  async saveCoach(data: Partial<SportsCoach>): Promise<SportsCoach> {
    const newCoach: SportsCoach = {
      id: data.id || `coach-${Date.now()}`,
      vendorId: data.vendorId || "vendor-sp-101",
      fullName: data.fullName || "New Coach",
      phone: data.phone || "",
      email: data.email || "",
      sport: data.sport || "BADMINTON",
      experienceYears: data.experienceYears || 5,
      bio: data.bio || "",
      profilePicUrl: data.profilePicUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      certifications: data.certifications || [],
      hourlyRate: data.hourlyRate || 800,
      rating: 5.0,
      reviewCount: 0,
      activeBatchesCount: 0,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      ...data,
    };

    try {
      const res = await apiClient.post<SportsCoach>("/sports-vendor/coaches", newCoach);
      if (res) return res;
    } catch {}

    const list = getStored<SportsCoach[]>(STORAGE_KEY_COACHES, INITIAL_COACHES);
    const idx = list.findIndex((c) => c.id === newCoach.id);
    if (idx >= 0) {
      list[idx] = newCoach;
    } else {
      list.push(newCoach);
    }
    setStored(STORAGE_KEY_COACHES, list);
    return newCoach;
  },

  // ── Batches ──
  async getBatches(vendorId?: string, coachId?: string): Promise<AcademyBatch[]> {
    try {
      const params = new URLSearchParams();
      if (vendorId) params.append("vendorId", vendorId);
      if (coachId) params.append("coachId", coachId);
      const res = await apiClient.get<AcademyBatch[]>(`/sports-vendor/batches?${params.toString()}`);
      if (res && res.length > 0) return res;
    } catch {}

    let list = getStored<AcademyBatch[]>(STORAGE_KEY_BATCHES, INITIAL_BATCHES);
    if (vendorId) list = list.filter((b) => b.vendorId === vendorId);
    if (coachId) list = list.filter((b) => b.coachId === coachId);
    return list;
  },

  async saveBatch(data: Partial<AcademyBatch>): Promise<AcademyBatch> {
    const coaches = getStored<SportsCoach[]>(STORAGE_KEY_COACHES, INITIAL_COACHES);
    const coach = coaches.find((c) => c.id === data.coachId);

    const newBatch: AcademyBatch = {
      id: data.id || `batch-${Date.now()}`,
      vendorId: data.vendorId || "vendor-sp-101",
      coachId: data.coachId || "coach-1",
      coachName: coach?.fullName || "Head Coach",
      title: data.title || "New Training Batch",
      sport: data.sport || "BADMINTON",
      ageGroup: data.ageGroup || "UNDER_14",
      skillLevel: data.skillLevel || "INTERMEDIATE",
      maxCapacity: data.maxCapacity || 12,
      enrolledCount: data.enrolledCount || 0,
      daysOfWeek: data.daysOfWeek || ["MON", "WED", "FRI"],
      startTime: data.startTime || "16:30",
      endTime: data.endTime || "17:30",
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      monthlyFee: data.monthlyFee || 3000,
      quarterlyFee: data.quarterlyFee,
      facilityId: data.facilityId,
      facilityName: data.facilityName || "SmashZone Arena",
      courtName: data.courtName || "Court 1",
      status: data.status || "ACTIVE",
      description: data.description,
      createdAt: new Date().toISOString(),
      ...data,
    };

    try {
      const res = await apiClient.post<AcademyBatch>("/sports-vendor/batches", newBatch);
      if (res) return res;
    } catch {}

    const list = getStored<AcademyBatch[]>(STORAGE_KEY_BATCHES, INITIAL_BATCHES);
    const idx = list.findIndex((b) => b.id === newBatch.id);
    if (idx >= 0) {
      list[idx] = newBatch;
    } else {
      list.push(newBatch);
    }
    setStored(STORAGE_KEY_BATCHES, list);
    return newBatch;
  },

  // ── Enrollments ──
  async getEnrollments(batchId?: string): Promise<BatchEnrollment[]> {
    try {
      const url = batchId ? `/sports-vendor/enrollments?batchId=${batchId}` : "/sports-vendor/enrollments";
      const res = await apiClient.get<BatchEnrollment[]>(url);
      if (res && res.length > 0) return res;
    } catch {}

    let list = getStored<BatchEnrollment[]>(STORAGE_KEY_ENROLLMENTS, INITIAL_ENROLLMENTS);
    if (batchId) list = list.filter((e) => e.batchId === batchId);
    return list;
  },

  async enrollStudent(data: Partial<BatchEnrollment>): Promise<BatchEnrollment> {
    const batches = getStored<AcademyBatch[]>(STORAGE_KEY_BATCHES, INITIAL_BATCHES);
    const batch = batches.find((b) => b.id === data.batchId);

    const renewal = new Date();
    renewal.setDate(renewal.getDate() + 30);

    const newEnrollment: BatchEnrollment = {
      id: `enr-${Date.now()}`,
      batchId: data.batchId || "batch-101",
      batchTitle: batch?.title || "Training Batch",
      sport: batch?.sport || "BADMINTON",
      studentName: data.studentName || "New Student",
      studentAge: data.studentAge || 10,
      parentName: data.parentName || "Parent",
      parentPhone: data.parentPhone || "+91 98860 00000",
      parentEmail: data.parentEmail || "parent@manacommunity.in",
      communityUnit: data.communityUnit || "Resident Unit",
      startDate: new Date().toISOString().split("T")[0],
      renewalDate: renewal.toISOString().split("T")[0],
      monthlyFee: batch?.monthlyFee || 2800,
      feePaid: true,
      paymentReference: `PAY_ENR_${Date.now()}`,
      attendancePercent: 100,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      ...data,
    };

    try {
      const res = await apiClient.post<BatchEnrollment>("/sports-vendor/enrollments", newEnrollment);
      if (res) return res;
    } catch {}

    const list = getStored<BatchEnrollment[]>(STORAGE_KEY_ENROLLMENTS, INITIAL_ENROLLMENTS);
    list.unshift(newEnrollment);
    setStored(STORAGE_KEY_ENROLLMENTS, list);

    // Update enrolled count in batch
    if (batch) {
      batch.enrolledCount = list.filter((e) => e.batchId === batch.id && e.status === "ACTIVE").length;
      setStored(STORAGE_KEY_BATCHES, batches);
    }

    return newEnrollment;
  },

  async updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<BatchEnrollment> {
    try {
      const res = await apiClient.patch<BatchEnrollment>(`/sports-vendor/enrollments/${id}/status`, { status });
      if (res) return res;
    } catch {}

    const list = getStored<BatchEnrollment[]>(STORAGE_KEY_ENROLLMENTS, INITIAL_ENROLLMENTS);
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Enrollment not found");
    list[idx] = { ...list[idx], status };
    setStored(STORAGE_KEY_ENROLLMENTS, list);
    return list[idx];
  },

  async markFeePaid(id: string): Promise<BatchEnrollment> {
    const list = getStored<BatchEnrollment[]>(STORAGE_KEY_ENROLLMENTS, INITIAL_ENROLLMENTS);
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Enrollment not found");

    const renewal = new Date();
    renewal.setDate(renewal.getDate() + 30);

    list[idx] = {
      ...list[idx],
      feePaid: true,
      status: "ACTIVE",
      renewalDate: renewal.toISOString().split("T")[0],
      paymentReference: `PAY_REN_${Date.now()}`,
    };
    setStored(STORAGE_KEY_ENROLLMENTS, list);
    return list[idx];
  },

  // ── Attendance ──
  async getAttendance(batchId: string, date: string): Promise<AttendanceRecord[]> {
    try {
      const res = await apiClient.get<AttendanceRecord[]>(`/sports-vendor/batches/${batchId}/attendance?date=${date}`);
      if (res && res.length > 0) return res;
    } catch {}

    const all = getStored<AttendanceRecord[]>(STORAGE_KEY_ATTENDANCE, []);
    const matching = all.filter((a) => a.batchId === batchId && a.date === date);

    if (matching.length > 0) return matching;

    // Generate default roster for the batch
    const enrollments = getStored<BatchEnrollment[]>(STORAGE_KEY_ENROLLMENTS, INITIAL_ENROLLMENTS);
    const batchStudents = enrollments.filter((e) => e.batchId === batchId && e.status === "ACTIVE");

    return batchStudents.map((s) => ({
      id: `att-${s.id}-${date}`,
      batchId,
      date,
      enrollmentId: s.id,
      studentName: s.studentName,
      status: "PRESENT",
    }));
  },

  async saveAttendance(batchId: string, date: string, records: AttendanceRecord[]): Promise<void> {
    try {
      await apiClient.post(`/sports-vendor/batches/${batchId}/attendance`, { date, records });
      return;
    } catch {}

    let all = getStored<AttendanceRecord[]>(STORAGE_KEY_ATTENDANCE, []);
    all = all.filter((a) => !(a.batchId === batchId && a.date === date));
    all.push(...records);
    setStored(STORAGE_KEY_ATTENDANCE, all);
  },

  // ── Memberships ──
  async getMembershipPlans(vendorId?: string): Promise<SportsMembershipPlan[]> {
    try {
      const res = await apiClient.get<SportsMembershipPlan[]>("/sports-vendor/membership-plans");
      if (res && res.length > 0) return res;
    } catch {}

    let list = getStored<SportsMembershipPlan[]>(STORAGE_KEY_MEMBERSHIPS, INITIAL_MEMBERSHIPS);
    if (vendorId) list = list.filter((m) => m.vendorId === vendorId);
    return list;
  },

  async saveMembershipPlan(data: Partial<SportsMembershipPlan>): Promise<SportsMembershipPlan> {
    const newPlan: SportsMembershipPlan = {
      id: data.id || `mem-${Date.now()}`,
      vendorId: data.vendorId || "vendor-sp-101",
      name: data.name || "Academy Membership",
      sport: data.sport || "BADMINTON",
      durationMonths: data.durationMonths || 3,
      sessionsLimit: data.sessionsLimit || 36,
      price: data.price || 7500,
      residentDiscountPercent: data.residentDiscountPercent || 15,
      perks: data.perks || ["Structured coaching curriculum", "Attendance tracking"],
      terms: data.terms,
      isActive: true,
      ...data,
    };

    const list = getStored<SportsMembershipPlan[]>(STORAGE_KEY_MEMBERSHIPS, INITIAL_MEMBERSHIPS);
    const idx = list.findIndex((m) => m.id === newPlan.id);
    if (idx >= 0) {
      list[idx] = newPlan;
    } else {
      list.push(newPlan);
    }
    setStored(STORAGE_KEY_MEMBERSHIPS, list);
    return newPlan;
  },
};
