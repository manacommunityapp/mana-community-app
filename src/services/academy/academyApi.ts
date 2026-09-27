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
} from "../../types/academy";

const STORAGE_KEY_CATEGORIES = "mana_acad_categories_v1";
const STORAGE_KEY_PROGRAMS = "mana_acad_programs_v1";
const STORAGE_KEY_INSTRUCTORS = "mana_acad_instructors_v1";
const STORAGE_KEY_ENROLLMENTS = "mana_acad_enrollments_v1";
const STORAGE_KEY_ATTENDANCE = "mana_acad_attendance_v1";
const STORAGE_KEY_REVIEWS = "mana_acad_reviews_v1";

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

const DEFAULT_INSTRUCTORS: AcademyInstructor[] = [
  {
    id: "instr-sandeep",
    communityId: "comm-mana-1",
    residentUserId: "user-sandeep",
    fullName: "Sandeep Patil",
    profession: "Principal Software Engineer @ CloudTech",
    bio: "12+ years building distributed cloud microservices. Passionate about mentoring junior developers and teaching Java, Spring Boot, and AWS.",
    profilePicUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    tower: "Tower A",
    flatNumber: "A-204",
    skills: "Java, Spring Boot, AWS, Docker, Kubernetes, Microservices",
    experienceYears: 12,
    status: "APPROVED",
    totalSessions: 14,
    totalLearners: 112,
    averageRating: 4.9,
    reviewCount: 48,
    approvedAt: "2026-06-01",
    createdAt: "2026-06-01",
  },
  {
    id: "instr-priya",
    communityId: "comm-mana-1",
    residentUserId: "user-priya",
    fullName: "Priya Sharma",
    profession: "Certified Yoga & Mindfulness Instructor (RYS 500)",
    bio: "Daily morning Hatha & Vinyasa yoga practitioner helping community residents build flexibility, core strength, and mental wellness.",
    profilePicUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    tower: "Tower B",
    flatNumber: "B-501",
    skills: "Hatha Yoga, Vinyasa Flow, Pranayama, Meditation, Flexibility",
    experienceYears: 8,
    status: "APPROVED",
    totalSessions: 28,
    totalLearners: 240,
    averageRating: 5.0,
    reviewCount: 92,
    approvedAt: "2026-05-01",
    createdAt: "2026-05-01",
  },
  {
    id: "instr-arjun",
    communityId: "comm-mana-1",
    residentUserId: "user-arjun",
    fullName: "Arjun Mehta",
    profession: "FIDE Rated Chess Player & Youth Coach",
    bio: "Former state champion coaching kids and adults in opening theory, tactical motifs, and endgame calculation.",
    profilePicUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    tower: "Tower C",
    flatNumber: "C-302",
    skills: "Chess Tactics, Opening Theory, Endgame Mastery, Mind Sports",
    experienceYears: 6,
    status: "APPROVED",
    totalSessions: 18,
    totalLearners: 95,
    averageRating: 4.8,
    reviewCount: 34,
    approvedAt: "2026-07-01",
    createdAt: "2026-07-01",
  },
];

const DEFAULT_PROGRAMS: AcademyProgram[] = [
  {
    id: "prog-springboot-workshop",
    communityId: "comm-mana-1",
    instructorId: "instr-sandeep",
    instructorName: "Sandeep Patil",
    categoryId: "cat-tech",
    categoryName: "Technology & Coding",
    title: "Java & Spring Boot Microservices Workshop",
    summary: "Hands-on 2-hour crash workshop building production-ready REST APIs with Spring Data JPA and PostgreSQL.",
    description: "In this interactive community workshop, we will construct a microservice from scratch. Topics include Spring Initializr, RESTful architectural design, Spring Data JPA with entity auditing, database migrations, connection pooling, and Docker deployment. Bring your laptop with JDK 17 installed!",
    coverImageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
    learningType: "WORKSHOP",
    level: "INTERMEDIATE",
    mode: "IN_PERSON",
    location: "Clubhouse Hall 1 (Projector Area)",
    startDate: "2026-09-28",
    endDate: "2026-09-28",
    startTime: "17:00",
    durationMinutes: 120,
    capacity: 20,
    enrolledCount: 18,
    waitlistCount: 2,
    availableSeats: 2,
    isFull: false,
    pricingType: "FREE",
    price: 0,
    prerequisites: "Basic understanding of Java syntax and Object-Oriented Programming.",
    targetAudience: "Software engineers, college students, and tech enthusiasts in our community.",
    tags: "Java, Spring Boot, Microservices, Backend, SQL",
    certificateEnabled: true,
    status: "PUBLISHED",
    averageRating: 4.9,
    reviewCount: 14,
    sessions: [
      {
        id: "sess-sb-1",
        sessionOrder: 1,
        title: "Spring Boot Core, REST APIs & JPA Persistence",
        description: "Live coding session building REST endpoints with PostgreSQL integration.",
        sessionDate: "2026-09-28",
        startTime: "17:00",
        endTime: "19:00",
        location: "Clubhouse Hall 1",
        qrCheckInToken: "QR-SESS-SB-01",
        completed: false,
      },
    ],
  },
  {
    id: "prog-yoga-morning",
    communityId: "comm-mana-1",
    instructorId: "instr-priya",
    instructorName: "Priya Sharma",
    categoryId: "cat-fitness",
    categoryName: "Fitness & Yoga",
    title: "Weekend Morning Sunrise Yoga & Breathwork",
    summary: "Rejuvenate your body and mind with guided Surya Namaskars, deep stretching, and Pranayama breathing.",
    description: "Start your Sunday morning with peaceful mindfulness on the clubhouse lawn. Perfect for beginners and regular practitioners looking to relieve desk stiffness, improve flexibility, and practice guided meditation. Bring your own yoga mat and water bottle.",
    coverImageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&auto=format&fit=crop&q=80",
    learningType: "FITNESS_SESSION",
    level: "ALL_LEVELS",
    mode: "IN_PERSON",
    location: "Central Clubhouse Garden Lawn",
    startDate: "2026-09-29",
    endDate: "2026-09-29",
    startTime: "06:30",
    durationMinutes: 60,
    capacity: 25,
    enrolledCount: 12,
    waitlistCount: 0,
    availableSeats: 13,
    isFull: false,
    pricingType: "FREE",
    price: 0,
    prerequisites: "No prior experience needed. Open to all age groups.",
    targetAudience: "All residents seeking health, posture alignment, and stress relief.",
    tags: "Yoga, Pranayama, Fitness, Meditation, Wellness",
    certificateEnabled: false,
    status: "PUBLISHED",
    averageRating: 5.0,
    reviewCount: 22,
    sessions: [
      {
        id: "sess-yoga-1",
        sessionOrder: 1,
        title: "Sunrise Hatha Flow & Guided Pranayama",
        description: "60-minute revitalizing stretch and breathwork.",
        sessionDate: "2026-09-29",
        startTime: "06:30",
        endTime: "07:30",
        location: "Clubhouse Lawn",
        qrCheckInToken: "QR-SESS-YOGA-01",
        completed: false,
      },
    ],
  },
  {
    id: "prog-chess-mastery",
    communityId: "comm-mana-1",
    instructorId: "instr-arjun",
    instructorName: "Arjun Mehta",
    categoryId: "cat-sports",
    categoryName: "Sports Coaching",
    title: "Junior Chess Tactics & Endgame Mastery (4-Week Course)",
    summary: "A comprehensive 4-week course for young champions to master board vision, pins, forks, and checkmate patterns.",
    description: "Designed for children aged 7–16. Each weekly session combines 30 minutes of interactive lecture on tactical patterns followed by 45 minutes of mentored sparring games with live analysis.",
    coverImageUrl: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&auto=format&fit=crop&q=80",
    learningType: "COURSE",
    level: "BEGINNER",
    mode: "IN_PERSON",
    location: "Community Library / Activity Room",
    startDate: "2026-10-01",
    endDate: "2026-10-29",
    startTime: "16:00",
    durationMinutes: 75,
    capacity: 16,
    enrolledCount: 10,
    waitlistCount: 0,
    availableSeats: 6,
    isFull: false,
    pricingType: "FREE",
    price: 0,
    prerequisites: "Knowledge of how chess pieces move.",
    targetAudience: "Kids (Ages 7–16) and curious beginners.",
    tags: "Chess, Kids, Strategy, Mind Sports, Brain Development",
    certificateEnabled: true,
    status: "PUBLISHED",
    averageRating: 4.8,
    reviewCount: 11,
    sessions: [
      { id: "sess-ch-1", sessionOrder: 1, title: "Session 1: Opening Principles & Center Control", sessionDate: "2026-10-01", startTime: "16:00", endTime: "17:15", qrCheckInToken: "QR-CHESS-01" },
      { id: "sess-ch-2", sessionOrder: 2, title: "Session 2: Tactical Weapons (Forks, Pins, Skewers)", sessionDate: "2026-10-08", startTime: "16:00", endTime: "17:15", qrCheckInToken: "QR-CHESS-02" },
      { id: "sess-ch-3", sessionOrder: 3, title: "Session 3: King Safety & Attacking Patterns", sessionDate: "2026-10-15", startTime: "16:00", endTime: "17:15", qrCheckInToken: "QR-CHESS-03" },
      { id: "sess-ch-4", sessionOrder: 4, title: "Session 4: Essential Pawn Endgames & Tournaments", sessionDate: "2026-10-22", startTime: "16:00", endTime: "17:15", qrCheckInToken: "QR-CHESS-04" },
    ],
  },
];

const DEFAULT_ENROLLMENTS: AcademyEnrollment[] = [
  {
    id: "enroll-sample-1",
    programId: "prog-springboot-workshop",
    programTitle: "Java & Spring Boot Microservices Workshop",
    userId: "user-current",
    userName: "Sandesh Patil",
    tower: "Tower A",
    flatNumber: "A-204",
    seatNumber: 12,
    status: "CONFIRMED",
    amountPaid: 0,
    qrPassCode: "ACAD-PASS-SANDESH-SB12",
    enrolledAt: "2026-09-25T10:00:00Z",
  },
];

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
};
