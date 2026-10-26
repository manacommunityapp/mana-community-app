import { apiClient } from "../common/apiClient";
import type {
  AcademyCategory,
  AcademyInstructor,
  AcademyProgram,
  AcademyEnrollment,
  AcademyAttendance,
  AcademyReview,
  AcademyCertificate,
  LearningType,
  ProgramStatus,
  TrainerSlot,
  TrainerSlotBooking,
} from "../../types/academy";

const STORAGE_KEY_CATEGORIES = "mana_acad_categories_v1";
const STORAGE_KEY_PROGRAMS = "mana_acad_programs_v1";
const STORAGE_KEY_INSTRUCTORS = "mana_acad_instructors_v1";
const STORAGE_KEY_ENROLLMENTS = "mana_acad_enrollments_v1";
const STORAGE_KEY_ATTENDANCE = "mana_acad_attendance_v1";
const STORAGE_KEY_REVIEWS = "mana_acad_reviews_v1";
const STORAGE_KEY_TRAINER_SLOTS = "mana_acad_trainer_slots_v1";
const STORAGE_KEY_SLOT_BOOKINGS = "mana_acad_slot_bookings_v1";

const DEFAULT_CATEGORIES: AcademyCategory[] = [
  { id: "cat-tech", name: "Technology & Coding", code: "TECH", description: "Software engineering, AI, cloud, web dev & coding workshops", icon: "💻", displayOrder: 1, active: true },
  { id: "cat-fitness", name: "Fitness & Yoga", code: "FITNESS", description: "Yoga, Zumba, HIIT, aerobics & strength sessions", icon: "🧘", displayOrder: 2, active: true },
  { id: "cat-kids", name: "Kids & Teens", code: "KIDS", description: "Coding for kids, Vedic math, storytelling, art & robotics", icon: "👶", displayOrder: 3, active: true },
  { id: "cat-arts", name: "Arts & Crafts", code: "ARTS", description: "Painting, pottery, sketching, DIY crafts & photography", icon: "🎨", displayOrder: 4, active: true },
  { id: "cat-prof", name: "Professional & Career", code: "PROFESSIONAL", description: "Interview prep, resume building, public speaking & leadership", icon: "💼", displayOrder: 5, active: true },
  { id: "cat-cooking", name: "Culinary & Baking", code: "COOKING", description: "Baking, gourmet cooking, healthy meal prep & culinary workshops", icon: "🍳", displayOrder: 6, active: true },
  { id: "cat-music", name: "Music & Dance", code: "MUSIC", description: "Guitar, classical singing, keyboard, salsa & contemporary dance", icon: "🎵", displayOrder: 7, active: true },
  { id: "cat-sports", name: "Sports Coaching", code: "SPORTS", description: "Chess mastery, cricket coaching, badminton drills & table tennis", icon: "🏏", displayOrder: 8, active: true },
  { id: "cat-finance", name: "Financial Literacy", code: "FINANCE", description: "Personal budgeting, stock markets, mutual funds & tax planning", icon: "📊", displayOrder: 9, active: true },
];

const DEFAULT_TRAINER_SLOTS: TrainerSlot[] = [];

const DEFAULT_INSTRUCTORS: AcademyInstructor[] = [];

const DEFAULT_PROGRAMS: AcademyProgram[] = [];

const DEFAULT_ENROLLMENTS: AcademyEnrollment[] = [];

function getStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export const academyApi = {
  // ── CATEGORIES ──
  async getCategories(): Promise<AcademyCategory[]> {
    try {
      const res = await apiClient.get<AcademyCategory[]>("/academy/categories");
      if (res && res.length > 0) return res;
    } catch {}
    return getStorage<AcademyCategory[]>(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
  },

  // ── PROGRAMS ──
  async getPrograms(categoryId?: string, type?: LearningType): Promise<AcademyProgram[]> {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append("categoryId", categoryId);
      if (type) params.append("learningType", type);
      const url = `/academy/programs?${params.toString()}`;
      const res = await apiClient.get<AcademyProgram[]>(url);
      if (res && res.length > 0) return res;
    } catch {}

    let programs = getStorage<AcademyProgram[]>(STORAGE_KEY_PROGRAMS, DEFAULT_PROGRAMS);
    if (categoryId) programs = programs.filter((p) => p.categoryId === categoryId);
    if (type) programs = programs.filter((p) => p.learningType === type);
    return programs;
  },

  async getProgramById(id: string): Promise<AcademyProgram> {
    try {
      const res = await apiClient.get<AcademyProgram>(`/academy/programs/${id}`);
      if (res) return res;
    } catch {}

    const programs = getStorage<AcademyProgram[]>(STORAGE_KEY_PROGRAMS, DEFAULT_PROGRAMS);
    const prog = programs.find((p) => p.id === id);
    if (!prog) throw new Error("Program not found");
    return prog;
  },

  async searchPrograms(query: string): Promise<AcademyProgram[]> {
    try {
      const res = await apiClient.get<AcademyProgram[]>(`/academy/programs/search?q=${encodeURIComponent(query)}`);
      if (res) return res;
    } catch {}

    const programs = getStorage<AcademyProgram[]>(STORAGE_KEY_PROGRAMS, DEFAULT_PROGRAMS);
    const q = query.toLowerCase();
    return programs.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.tags && p.tags.toLowerCase().includes(q)) ||
        (p.summary && p.summary.toLowerCase().includes(q))
    );
  },

  async createProgram(payload: Partial<AcademyProgram>): Promise<AcademyProgram> {
    try {
      const res = await apiClient.post<AcademyProgram>("/academy/programs", payload);
      if (res) return res;
    } catch {}

    const programs = getStorage<AcademyProgram[]>(STORAGE_KEY_PROGRAMS, DEFAULT_PROGRAMS);
    const newProg: AcademyProgram = {
      id: `prog-${Date.now()}`,
      communityId: "comm-mana-1",
      instructorId: payload.instructorId || "instr-sandeep",
      instructorName: payload.instructorName || "Sandeep Patil",
      categoryId: payload.categoryId || "cat-tech",
      categoryName: payload.categoryName || "Technology",
      title: payload.title || "Untitled Session",
      summary: payload.summary || "",
      description: payload.description || "",
      coverImageUrl: payload.coverImageUrl || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
      learningType: payload.learningType || "WORKSHOP",
      level: payload.level || "ALL_LEVELS",
      mode: payload.mode || "IN_PERSON",
      location: payload.location || "Clubhouse",
      onlineMeetingUrl: payload.onlineMeetingUrl,
      startDate: payload.startDate || new Date().toISOString().split("T")[0],
      startTime: payload.startTime || "17:00",
      durationMinutes: payload.durationMinutes || 60,
      capacity: payload.capacity || 20,
      enrolledCount: 0,
      waitlistCount: 0,
      availableSeats: payload.capacity || 20,
      isFull: false,
      pricingType: payload.pricingType || "FREE",
      price: payload.price || 0,
      prerequisites: payload.prerequisites,
      targetAudience: payload.targetAudience,
      tags: payload.tags,
      certificateEnabled: payload.certificateEnabled || false,
      status: "PUBLISHED",
      averageRating: 5.0,
      reviewCount: 0,
      sessions: payload.sessions || [
        {
          id: `sess-${Date.now()}`,
          sessionOrder: 1,
          title: `${payload.title || "Program"} - Session 1`,
          sessionDate: payload.startDate,
          startTime: payload.startTime,
          location: payload.location,
          qrCheckInToken: `QR-${Date.now()}`,
          completed: false,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    programs.unshift(newProg);
    setStorage(STORAGE_KEY_PROGRAMS, programs);
    return newProg;
  },

  // ── INSTRUCTORS ──
  async getInstructors(): Promise<AcademyInstructor[]> {
    try {
      const res = await apiClient.get<AcademyInstructor[]>("/academy/instructors");
      if (res && res.length > 0) return res;
    } catch {}
    return getStorage<AcademyInstructor[]>(STORAGE_KEY_INSTRUCTORS, DEFAULT_INSTRUCTORS);
  },

  async getInstructorByUserId(userId: string): Promise<AcademyInstructor | null> {
    try {
      const res = await apiClient.get<AcademyInstructor>(`/academy/instructors/user/${userId}`);
      if (res) return res;
    } catch {}

    const instructors = getStorage<AcademyInstructor[]>(STORAGE_KEY_INSTRUCTORS, DEFAULT_INSTRUCTORS);
    return instructors.find((i) => i.residentUserId === userId) || null;
  },

  async applyAsInstructor(payload: Partial<AcademyInstructor>): Promise<AcademyInstructor> {
    try {
      const res = await apiClient.post<AcademyInstructor>("/academy/instructors/apply", payload);
      if (res) return res;
    } catch {}

    const instructors = getStorage<AcademyInstructor[]>(STORAGE_KEY_INSTRUCTORS, DEFAULT_INSTRUCTORS);
    const newInstr: AcademyInstructor = {
      id: `instr-${Date.now()}`,
      communityId: "comm-mana-1",
      residentUserId: payload.residentUserId || "user-current",
      fullName: payload.fullName || "Resident Instructor",
      profession: payload.profession || "Community Expert",
      bio: payload.bio || "",
      profilePicUrl: payload.profilePicUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      tower: payload.tower || "Tower A",
      flatNumber: payload.flatNumber || "A-204",
      skills: payload.skills || "",
      experienceYears: payload.experienceYears || 5,
      status: "APPROVED",
      totalSessions: 0,
      totalLearners: 0,
      averageRating: 5.0,
      reviewCount: 0,
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    instructors.push(newInstr);
    setStorage(STORAGE_KEY_INSTRUCTORS, instructors);
    return newInstr;
  },

  // ── ENROLLMENTS ──
  async getMyEnrollments(userId: string = "user-current"): Promise<AcademyEnrollment[]> {
    try {
      const res = await apiClient.get<AcademyEnrollment[]>(`/academy/enrollments/user/${userId}`);
      if (res && res.length > 0) return res;
    } catch {}
    const enrollments = getStorage<AcademyEnrollment[]>(STORAGE_KEY_ENROLLMENTS, DEFAULT_ENROLLMENTS);
    return enrollments.filter((e) => e.userId === userId && e.status !== "CANCELLED");
  },

  async enrollInProgram(programId: string, payload: { userId: string; userName: string; tower?: string; flatNumber?: string }): Promise<AcademyEnrollment> {
    try {
      const res = await apiClient.post<AcademyEnrollment>(`/academy/enrollments/program/${programId}`, payload);
      if (res) return res;
    } catch {}

    const programs = getStorage<AcademyProgram[]>(STORAGE_KEY_PROGRAMS, DEFAULT_PROGRAMS);
    const prog = programs.find((p) => p.id === programId);
    if (!prog) throw new Error("Program not found");

    if (prog.enrolledCount >= prog.capacity) {
      throw new Error("Program is full! Please join the waitlist.");
    }

    const enrollments = getStorage<AcademyEnrollment[]>(STORAGE_KEY_ENROLLMENTS, DEFAULT_ENROLLMENTS);
    const existing = enrollments.find((e) => e.programId === programId && e.userId === payload.userId && e.status === "CONFIRMED");
    if (existing) return existing;

    const seat = prog.enrolledCount + 1;
    prog.enrolledCount = seat;
    prog.availableSeats = Math.max(0, prog.capacity - seat);
    if (prog.enrolledCount >= prog.capacity) prog.status = "FULL";
    setStorage(STORAGE_KEY_PROGRAMS, programs);

    const newEnroll: AcademyEnrollment = {
      id: `enroll-${Date.now()}`,
      programId,
      programTitle: prog.title,
      userId: payload.userId,
      userName: payload.userName,
      tower: payload.tower || "A",
      flatNumber: payload.flatNumber || "A-204",
      seatNumber: seat,
      status: "CONFIRMED",
      amountPaid: prog.price,
      qrPassCode: `ACAD-PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      enrolledAt: new Date().toISOString(),
    };

    enrollments.push(newEnroll);
    setStorage(STORAGE_KEY_ENROLLMENTS, enrollments);
    return newEnroll;
  },

  async cancelEnrollment(programId: string, userId: string = "user-current"): Promise<void> {
    try {
      await apiClient.delete(`/academy/enrollments/program/${programId}/user/${userId}`);
    } catch {}

    const enrollments = getStorage<AcademyEnrollment[]>(STORAGE_KEY_ENROLLMENTS, DEFAULT_ENROLLMENTS);
    const e = enrollments.find((en) => en.programId === programId && en.userId === userId);
    if (e) {
      e.status = "CANCELLED";
      setStorage(STORAGE_KEY_ENROLLMENTS, enrollments);
    }
  },

  // ── ATTENDANCE ──
  async markSessionAttendance(sessionId: string, payload: { userId: string; userName: string; checkInMethod?: string }): Promise<AcademyAttendance> {
    try {
      const res = await apiClient.post<AcademyAttendance>(`/academy/sessions/${sessionId}/attendance`, payload);
      if (res) return res;
    } catch {}

    const list = getStorage<AcademyAttendance[]>(STORAGE_KEY_ATTENDANCE, []);
    const newAtt: AcademyAttendance = {
      id: `att-${Date.now()}`,
      sessionId,
      programId: "prog-current",
      userId: payload.userId,
      userName: payload.userName,
      status: "PRESENT",
      checkInTime: new Date().toISOString(),
      checkInMethod: payload.checkInMethod || "QR_SCAN",
      createdAt: new Date().toISOString(),
    };
    list.push(newAtt);
    setStorage(STORAGE_KEY_ATTENDANCE, list);
    return newAtt;
  },

  // ── SPORTS TRAINER SLOTS ──
  async getSportsTrainers(): Promise<AcademyInstructor[]> {
    try {
      const res = await apiClient.get<AcademyInstructor[]>("/academy/instructors/sports");
      if (res && res.length > 0) return res;
    } catch {}
    const instructors = getStorage<AcademyInstructor[]>(STORAGE_KEY_INSTRUCTORS, DEFAULT_INSTRUCTORS);
    return instructors.filter((i) => i.isSportsTrainer && i.status === "APPROVED");
  },

  async getTrainerSlots(trainerId?: string, sport?: string, date?: string): Promise<TrainerSlot[]> {
    try {
      const params = new URLSearchParams();
      if (trainerId) params.append("trainerId", trainerId);
      if (sport) params.append("sport", sport);
      if (date) params.append("date", date);
      const res = await apiClient.get<TrainerSlot[]>(`/academy/trainer-slots?${params}`);
      if (res && res.length > 0) return res;
    } catch {}
    let slots = getStorage<TrainerSlot[]>(STORAGE_KEY_TRAINER_SLOTS, DEFAULT_TRAINER_SLOTS);
    if (trainerId) slots = slots.filter((s) => s.trainerId === trainerId);
    if (sport) slots = slots.filter((s) => s.sport.toLowerCase() === sport.toLowerCase());
    if (date) slots = slots.filter((s) => s.date === date);
    return slots;
  },

  async bookTrainerSlot(slotId: string, payload: { userId: string; userName: string; tower?: string; flatNumber?: string }): Promise<TrainerSlotBooking> {
    try {
      const res = await apiClient.post<TrainerSlotBooking>(`/academy/trainer-slots/${slotId}/book`, payload);
      if (res) return res;
    } catch {}
    const slots = getStorage<TrainerSlot[]>(STORAGE_KEY_TRAINER_SLOTS, DEFAULT_TRAINER_SLOTS);
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) throw new Error("Slot not found");
    if (slot.status !== "OPEN") throw new Error("This slot is no longer available");
    if (slot.bookedCount >= slot.maxCapacity) throw new Error("Slot is fully booked");

    const bookings = getStorage<TrainerSlotBooking[]>(STORAGE_KEY_SLOT_BOOKINGS, []);
    const existing = bookings.find((b) => b.slotId === slotId && b.userId === payload.userId && b.status === "CONFIRMED");
    if (existing) return existing;

    slot.bookedCount += 1;
    if (slot.bookedCount >= slot.maxCapacity) slot.status = "BOOKED";
    setStorage(STORAGE_KEY_TRAINER_SLOTS, slots);

    const booking: TrainerSlotBooking = {
      id: `sb-${Date.now()}`,
      slotId,
      trainerId: slot.trainerId,
      userId: payload.userId,
      userName: payload.userName,
      tower: payload.tower,
      flatNumber: payload.flatNumber,
      status: "CONFIRMED",
      amountPaid: slot.price,
      bookedAt: new Date().toISOString(),
    };
    bookings.push(booking);
    setStorage(STORAGE_KEY_SLOT_BOOKINGS, bookings);
    return booking;
  },

  async getMySlotBookings(userId: string): Promise<TrainerSlotBooking[]> {
    try {
      const res = await apiClient.get<TrainerSlotBooking[]>(`/academy/trainer-slots/my-bookings?userId=${userId}`);
      if (res) return res;
    } catch {}
    const bookings = getStorage<TrainerSlotBooking[]>(STORAGE_KEY_SLOT_BOOKINGS, []);
    return bookings.filter((b) => b.userId === userId && b.status === "CONFIRMED");
  },

  // ── REVIEWS ──
  async submitReview(programId: string, payload: { userId: string; userName: string; overallRating: number; reviewComment?: string }): Promise<AcademyReview> {
    try {
      const res = await apiClient.post<AcademyReview>(`/academy/reviews/program/${programId}`, payload);
      if (res) return res;
    } catch {}

    const reviews = getStorage<AcademyReview[]>(STORAGE_KEY_REVIEWS, []);
    const newRev: AcademyReview = {
      id: `rev-${Date.now()}`,
      programId,
      instructorId: "instr-sandeep",
      userId: payload.userId,
      userName: payload.userName,
      overallRating: payload.overallRating,
      reviewComment: payload.reviewComment,
      wouldRecommend: true,
      createdAt: new Date().toISOString(),
    };
    reviews.push(newRev);
    setStorage(STORAGE_KEY_REVIEWS, reviews);
    return newRev;
  },

  async updateInstructorStatus(id: string, status: "APPROVED" | "REJECTED"): Promise<void> {
    try {
      await apiClient.patch(`/academy/instructors/${id}/status`, { status });
      return;
    } catch {}
    const instructors = getStorage<AcademyInstructor[]>(STORAGE_KEY_INSTRUCTORS, DEFAULT_INSTRUCTORS);
    const idx = instructors.findIndex((i) => i.id === id);
    if (idx !== -1) {
      instructors[idx] = { ...instructors[idx], status };
      setStorage(STORAGE_KEY_INSTRUCTORS, instructors);
    }
  },
};
