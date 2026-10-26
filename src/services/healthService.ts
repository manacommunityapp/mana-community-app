import type {
  DoctorDto,
  FamilyMemberDto,
  HealthAppointmentDto,
  MedicalRecordDto,
  LabPackageDto,
  HomecareProviderDto,
  HealthEmergencyContactDto,
  DoctorReview,
  HealthCampDto,
  HealthCampRegistrationDto,
  CampTimeSlot,
  CampVitals,
  CampPartnerReport,
  CampAggregateStats,
  HealthBenefitWalletDto,
  BenefitCategoryKey,
  BenefitCategoryAllowance,
  BenefitProgramDto,
  HealthcareClaimDto,
  CashlessPreAuthDto,
  CareJourneyDto,
  PreventiveReminderDto,
  PreventiveReminderType,
  FitnessChallengeDto,
  WellnessWebinarDto,
  ClinicallySupervisedProgramDto,
  VoluntaryHealthGoalDto,
  ProviderProfileDto,
  ProviderStaffMemberDto,
  ProviderServiceItemDto,
  PatientQueryDto,
  ProviderFulfillmentOrderDto,
  PatientConsentDto,
  SecurityAuditLogDto,
  ComplianceDisclosureDto
} from "../types/health";

export const SEED_DOCTORS: DoctorDto[] = [
  // ── DOCTORS ──
  {
    id: "doc-1",
    name: "Dr. Rajesh Kumar",
    specialty: "Cardiologist",
    category: "DOCTOR",
    qualifications: ["MBBS", "MD (Medicine)", "DM (Cardiology)"],
    experienceYears: 15,
    rating: 4.8,
    reviewCount: 42,
    consultationFee: 700,
    consultationModes: ["IN_PERSON", "VIDEO"],
    nextAvailableSlot: "Today, 6:30 PM",
    verifiedBadge: true,
    registrationNumber: "KMC-48291",
    medicalCouncil: "Karnataka Medical Council",
    languages: ["English", "Hindi", "Kannada"],
    clinicName: "Mana Community Health & Wellness Center",
    clinicAddress: "Tower B, Ground Floor, Mana Residency",
    distanceKm: 0.1,
    phone: "+91-98801-44221",
    email: "dr.rajesh@manawellness.in",
    hospitalAffiliations: ["Apollo Hospitals", "Manipal Heart Centre"],
    verifiedCommunityConsultations: 28,
    openNow: true,
    emergencyServicesAvailable: true,
    homeVisitAvailable: false,
    communityOffer: {
      title: "Complimentary ECG with Consultation",
      badge: "Mana Resident Exclusive",
      discountPercent: 15,
      promoCode: "MANAHEART",
      description: "Free in-clinic ECG report review for all Mana society residents.",
      validUntil: "2026-11-30"
    },
    clinicHours: [
      { day: "Mon - Fri", morning: "09:00 AM - 01:00 PM", evening: "05:00 PM - 08:30 PM" },
      { day: "Saturday", morning: "10:00 AM - 02:00 PM" },
      { day: "Sunday", isClosed: true }
    ],
    appointmentSlots: [
      { id: "s-1", time: "10:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-2", time: "11:30 AM", period: "MORNING", available: false, mode: "IN_PERSON" },
      { id: "s-3", time: "05:30 PM", period: "EVENING", available: true, mode: "VIDEO" },
      { id: "s-4", time: "06:30 PM", period: "EVENING", available: true, mode: "IN_PERSON" },
      { id: "s-5", time: "07:30 PM", period: "EVENING", available: true, mode: "VIDEO" }
    ],
    reviews: [
      {
        communication: 5,
        waitingTime: 4,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "Extremely attentive and explained ECG report with great clarity.",
        authorName: "Tower C Resident",
        date: "2026-09-28"
      }
    ]
  },
  {
    id: "doc-2",
    name: "Dr. Ananya Sharma",
    specialty: "Pediatrician",
    category: "DOCTOR",
    qualifications: ["MBBS", "DCH", "DNB (Pediatrics)"],
    experienceYears: 11,
    rating: 4.9,
    reviewCount: 68,
    consultationFee: 600,
    consultationModes: ["IN_PERSON", "VIDEO", "PHONE"],
    nextAvailableSlot: "Tomorrow, 10:00 AM",
    verifiedBadge: true,
    registrationNumber: "KMC-59102",
    medicalCouncil: "Karnataka Medical Council",
    languages: ["English", "Hindi"],
    clinicName: "Little Stars Child Clinic",
    clinicAddress: "Opp. Mana Community Gate 2",
    distanceKm: 0.3,
    phone: "+91-99002-33112",
    email: "ananya@littlestarsclinic.org",
    hospitalAffiliations: ["Cloudnine Hospitals"],
    verifiedCommunityConsultations: 46,
    openNow: true,
    emergencyServicesAvailable: false,
    homeVisitAvailable: true,
    communityOffer: {
      title: "Free Vaccination Record Audit",
      badge: "Kids Wellness Partner",
      discountPercent: 10,
      description: "Complimentary childhood milestone check with any consultation.",
      validUntil: "2026-12-15"
    },
    clinicHours: [
      { day: "Mon - Sat", morning: "09:30 AM - 01:30 PM", evening: "04:30 PM - 08:00 PM" },
      { day: "Sunday", morning: "10:00 AM - 01:00 PM" }
    ],
    appointmentSlots: [
      { id: "s-6", time: "10:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-7", time: "11:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-8", time: "05:00 PM", period: "EVENING", available: true, mode: "VIDEO" },
      { id: "s-9", time: "06:30 PM", period: "EVENING", available: true, mode: "PHONE" }
    ],
    reviews: [
      {
        communication: 5,
        waitingTime: 5,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "Super gentle with our 3-year-old. Always available for urgent queries.",
        authorName: "Tower A Resident",
        date: "2026-10-02"
      }
    ]
  },
  {
    id: "doc-3",
    name: "Dr. Vikram Sethi",
    specialty: "Orthopedic Surgeon",
    category: "DOCTOR",
    qualifications: ["MBBS", "MS (Ortho)", "FACS (Joint Replacement)"],
    experienceYears: 18,
    rating: 4.7,
    reviewCount: 35,
    consultationFee: 800,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Today, 5:00 PM",
    verifiedBadge: true,
    registrationNumber: "MCI-31908",
    medicalCouncil: "Medical Council of India",
    languages: ["English", "Hindi", "Punjabi"],
    clinicName: "Sethi Bone & Joint Clinic",
    clinicAddress: "Sarjapur Main Road, 1.2 km away",
    distanceKm: 1.2,
    phone: "+91-98112-99881",
    hospitalAffiliations: ["Fortis Hospital", "Columbia Asia"],
    verifiedCommunityConsultations: 19,
    openNow: true,
    emergencyServicesAvailable: true,
    homeVisitAvailable: false,
    clinicHours: [
      { day: "Mon - Sat", morning: "10:00 AM - 01:00 PM", evening: "05:00 PM - 08:30 PM" },
      { day: "Sunday", isClosed: true }
    ],
    appointmentSlots: [
      { id: "s-10", time: "05:00 PM", period: "EVENING", available: true, mode: "IN_PERSON" },
      { id: "s-11", time: "06:00 PM", period: "EVENING", available: true, mode: "IN_PERSON" }
    ],
    reviews: []
  },
  {
    id: "doc-4",
    name: "Dr. Priya Swaminathan",
    specialty: "Dermatologist & Trichologist",
    category: "DOCTOR",
    qualifications: ["MBBS", "MD (Dermatology, Venereology & Leprosy)"],
    experienceYears: 12,
    rating: 4.85,
    reviewCount: 52,
    consultationFee: 650,
    consultationModes: ["IN_PERSON", "VIDEO"],
    nextAvailableSlot: "Tomorrow, 11:30 AM",
    verifiedBadge: true,
    registrationNumber: "KMC-62411",
    medicalCouncil: "Karnataka Medical Council",
    languages: ["English", "Tamil", "Hindi"],
    clinicName: "Aura Skin & Hair Aesthetics",
    clinicAddress: "Green Glen Layout, Bellandur (1.5 km)",
    distanceKm: 1.5,
    phone: "+91-97401-22334",
    hospitalAffiliations: ["Manipal Hospital Old Airport Rd"],
    verifiedCommunityConsultations: 31,
    openNow: false,
    emergencyServicesAvailable: false,
    homeVisitAvailable: false,
    communityOffer: {
      title: "20% Off Clinical Skin & Hair Consultation",
      badge: "Mana Privilege",
      discountPercent: 20,
      description: "Exclusive discount on first consultation and scalp analysis.",
      validUntil: "2026-11-25"
    },
    clinicHours: [
      { day: "Mon - Fri", morning: "10:30 AM - 02:00 PM", evening: "04:30 PM - 07:30 PM" },
      { day: "Saturday", morning: "10:00 AM - 02:00 PM" },
      { day: "Sunday", isClosed: true }
    ],
    appointmentSlots: [
      { id: "s-12", time: "11:30 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-13", time: "05:30 PM", period: "EVENING", available: true, mode: "VIDEO" }
    ],
    reviews: []
  },
  {
    id: "doc-5",
    name: "Dr. Sanjay Hegde",
    specialty: "General Physician & Diabetologist",
    category: "DOCTOR",
    qualifications: ["MBBS", "MD (General Medicine)", "PG Dip Diabetes"],
    experienceYears: 22,
    rating: 4.9,
    reviewCount: 94,
    consultationFee: 450,
    consultationModes: ["IN_PERSON", "VIDEO", "PHONE"],
    nextAvailableSlot: "Today, 4:00 PM",
    verifiedBadge: true,
    registrationNumber: "KMC-23109",
    medicalCouncil: "Karnataka Medical Council",
    languages: ["English", "Kannada", "Hindi", "Telugu"],
    clinicName: "Mana Resident Family Clinic",
    clinicAddress: "Tower A, Ground Floor, Mana Residency",
    distanceKm: 0.1,
    phone: "+91-98440-11223",
    hospitalAffiliations: ["Sakra World Hospital"],
    verifiedCommunityConsultations: 82,
    openNow: true,
    emergencyServicesAvailable: true,
    homeVisitAvailable: true,
    clinicHours: [
      { day: "Mon - Sun", morning: "08:30 AM - 12:30 PM", evening: "04:00 PM - 09:00 PM" }
    ],
    appointmentSlots: [
      { id: "s-14", time: "04:00 PM", period: "EVENING", available: true, mode: "IN_PERSON" },
      { id: "s-15", time: "05:00 PM", period: "EVENING", available: true, mode: "IN_PERSON" },
      { id: "s-16", time: "07:30 PM", period: "EVENING", available: true, mode: "VIDEO" }
    ],
    reviews: [
      {
        communication: 5,
        waitingTime: 5,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "The go-to family doctor for our entire society. Patient, warm, and highly experienced.",
        authorName: "Tower D Resident",
        date: "2026-10-06"
      }
    ]
  },

  // ── CLINICS ──
  {
    id: "clinic-1",
    name: "Mana Resident Wellness & Day Care Center",
    specialty: "Multi-Specialty Primary Healthcare Clinic",
    category: "CLINIC",
    qualifications: ["NABH Accredited Primary Care Center", "RWA Certified"],
    experienceYears: 6,
    rating: 4.88,
    reviewCount: 110,
    consultationFee: 350,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Walk-ins Welcome Today",
    verifiedBadge: true,
    registrationNumber: "KPME-2019-8420",
    medicalCouncil: "Karnataka Private Medical Establishments Authority",
    languages: ["English", "Kannada", "Hindi", "Telugu", "Tamil"],
    clinicName: "Mana Wellness Hub",
    clinicAddress: "Clubhouse Annex Level 1, Mana Residency",
    distanceKm: 0.0,
    phone: "+91-98440-01122",
    hospitalAffiliations: ["Manipal Hospitals", "Apollo Health City"],
    verifiedCommunityConsultations: 160,
    openNow: true,
    emergencyServicesAvailable: true,
    homeVisitAvailable: true,
    communityOffer: {
      title: "Subsidized Resident Health Consultations",
      badge: "Community Facility",
      discountPercent: 30,
      description: "Flat subsidized fee for all registered Mana apartment residents and domestic staff.",
      validUntil: "2027-01-01"
    },
    clinicHours: [
      { day: "Mon - Sat", morning: "08:00 AM - 02:00 PM", evening: "04:00 PM - 09:30 PM" },
      { day: "Sunday", morning: "09:00 AM - 01:00 PM" }
    ],
    appointmentSlots: [
      { id: "s-17", time: "09:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-18", time: "11:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-19", time: "05:00 PM", period: "EVENING", available: true, mode: "IN_PERSON" }
    ],
    reviews: []
  },
  {
    id: "clinic-2",
    name: "Cloudnine Neighborhood Family Clinic",
    specialty: "Maternity, Pediatric & Women's Health Clinic",
    category: "CLINIC",
    qualifications: ["NABH Accredited Clinic Chain"],
    experienceYears: 14,
    rating: 4.75,
    reviewCount: 88,
    consultationFee: 750,
    consultationModes: ["IN_PERSON", "VIDEO"],
    nextAvailableSlot: "Today, 3:30 PM",
    verifiedBadge: true,
    registrationNumber: "KPME-2016-5120",
    medicalCouncil: "KPME Karnataka",
    languages: ["English", "Hindi", "Kannada"],
    clinicName: "Cloudnine Clinic Sarjapur",
    clinicAddress: "Beside Wipro SEZ, Sarjapur Road (1.1 km)",
    distanceKm: 1.1,
    phone: "080-6799-9999",
    hospitalAffiliations: ["Cloudnine Hospital Bellandur"],
    verifiedCommunityConsultations: 39,
    openNow: true,
    emergencyServicesAvailable: false,
    homeVisitAvailable: false,
    clinicHours: [
      { day: "Mon - Sat", morning: "09:00 AM - 08:00 PM" },
      { day: "Sunday", morning: "10:00 AM - 02:00 PM" }
    ],
    appointmentSlots: [
      { id: "s-20", time: "03:30 PM", period: "AFTERNOON", available: true, mode: "IN_PERSON" },
      { id: "s-21", time: "06:00 PM", period: "EVENING", available: true, mode: "VIDEO" }
    ],
    reviews: []
  },

  // ── DENTISTS ──
  {
    id: "dentist-1",
    name: "Dr. Pooja Hegde (SmileCraft Dental)",
    specialty: "Dentist & Orthodontist",
    category: "DENTIST",
    qualifications: ["BDS", "MDS (Orthodontics & Dentofacial Orthopedics)"],
    experienceYears: 13,
    rating: 4.92,
    reviewCount: 76,
    consultationFee: 400,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Today, 5:30 PM",
    verifiedBadge: true,
    registrationNumber: "DCI-18492-A",
    medicalCouncil: "Dental Council of India / Karnataka State Dental Council",
    languages: ["English", "Hindi", "Kannada", "Konkani"],
    clinicName: "SmileCraft Advanced Dental & Implant Center",
    clinicAddress: "1st Floor, Above Star Market, Gate 1 Crossing (0.5 km)",
    distanceKm: 0.5,
    phone: "+91-98809-55667",
    hospitalAffiliations: ["Vydehi Institute of Dental Sciences"],
    verifiedCommunityConsultations: 43,
    openNow: true,
    emergencyServicesAvailable: true,
    homeVisitAvailable: false,
    communityOffer: {
      title: "Free Dental Checkup & Digital X-Ray",
      badge: "Mana Neighbor Perk",
      discountPercent: 100,
      description: "First comprehensive checkup and IOPA X-ray completely free for Mana residents.",
      validUntil: "2026-12-31"
    },
    clinicHours: [
      { day: "Mon - Sat", morning: "10:00 AM - 01:30 PM", evening: "04:30 PM - 09:00 PM" },
      { day: "Sunday", morning: "10:30 AM - 01:30 PM" }
    ],
    appointmentSlots: [
      { id: "s-22", time: "05:30 PM", period: "EVENING", available: true, mode: "IN_PERSON" },
      { id: "s-23", time: "06:45 PM", period: "EVENING", available: true, mode: "IN_PERSON" },
      { id: "s-24", time: "08:00 PM", period: "EVENING", available: true, mode: "IN_PERSON" }
    ],
    reviews: [
      {
        communication: 5,
        waitingTime: 5,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "Painless root canal treatment. Dr. Pooja is exceptionally skilled and transparent about costs.",
        authorName: "Tower B Resident",
        date: "2026-09-15"
      }
    ]
  },
  {
    id: "dentist-2",
    name: "Dr. Rahul Roy (32 Pearls Dental Care)",
    specialty: "Pediatric & Cosmetic Dentist",
    category: "DENTIST",
    qualifications: ["BDS", "FAGE (Manipal)", "Certified Invisalign Provider"],
    experienceYears: 10,
    rating: 4.78,
    reviewCount: 38,
    consultationFee: 500,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Tomorrow, 11:00 AM",
    verifiedBadge: true,
    registrationNumber: "DCI-20412-B",
    medicalCouncil: "Dental Council of India",
    languages: ["English", "Bengali", "Hindi"],
    clinicName: "32 Pearls Family Dental Studio",
    clinicAddress: "Kaikondrahalli Main Road (1.4 km)",
    distanceKm: 1.4,
    phone: "+91-97312-44556",
    hospitalAffiliations: ["Clove Dental Associate"],
    verifiedCommunityConsultations: 18,
    openNow: true,
    emergencyServicesAvailable: false,
    homeVisitAvailable: false,
    clinicHours: [
      { day: "Mon - Sat", morning: "10:00 AM - 02:00 PM", evening: "05:00 PM - 08:30 PM" },
      { day: "Sunday", isClosed: true }
    ],
    appointmentSlots: [
      { id: "s-25", time: "11:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-26", time: "05:30 PM", period: "EVENING", available: true, mode: "IN_PERSON" }
    ],
    reviews: []
  },

  // ── DIAGNOSTIC CENTERS ──
  {
    id: "diag-1",
    name: "Anand Diagnostic Laboratory & Scan Center",
    specialty: "Pathology, Biochemistry & Radiology Lab",
    category: "DIAGNOSTIC_CENTER",
    qualifications: ["NABL Accredited", "ICMR Approved", "ISO 15189 Certified"],
    experienceYears: 25,
    rating: 4.86,
    reviewCount: 135,
    consultationFee: 0,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Home Collection Available within 45 mins",
    verifiedBadge: true,
    registrationNumber: "NABL-MC-2011",
    medicalCouncil: "Quality Council of India / NABL",
    languages: ["English", "Kannada", "Hindi", "Telugu"],
    clinicName: "Anand Diagnostic Lab - Sarjapur Hub",
    clinicAddress: "Tower Plaza, Gate 1 (0.4 km)",
    distanceKm: 0.4,
    phone: "080-4567-8900",
    hospitalAffiliations: ["Neuberg Anand Reference Lab"],
    verifiedCommunityConsultations: 92,
    openNow: true,
    emergencyServicesAvailable: true,
    homeVisitAvailable: true,
    communityOffer: {
      title: "20% Discount + Free Home Collection",
      badge: "Partner Diagnostic Lab",
      discountPercent: 20,
      promoCode: "MANALAB20",
      description: "20% off all blood tests & scans. Zero home sample collection fee inside Mana Community.",
      validUntil: "2026-12-31"
    },
    clinicHours: [
      { day: "Mon - Sat", morning: "06:30 AM - 08:30 PM" },
      { day: "Sunday", morning: "07:00 AM - 02:00 PM" }
    ],
    appointmentSlots: [
      { id: "s-27", time: "07:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-28", time: "08:30 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-29", time: "11:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" }
    ],
    reviews: [
      {
        communication: 5,
        waitingTime: 5,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "Phlebotomist arrived right on time at 7 AM. Painless sample collection for our elderly parents.",
        authorName: "Tower A Resident",
        date: "2026-10-04"
      }
    ]
  },
  {
    id: "diag-2",
    name: "Metropolis Healthcare & Ultrasound Center",
    specialty: "Advanced Molecular Diagnostics & Imaging",
    category: "DIAGNOSTIC_CENTER",
    qualifications: ["CAP & NABL Accredited Center"],
    experienceYears: 30,
    rating: 4.79,
    reviewCount: 82,
    consultationFee: 0,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Open Today for Tests",
    verifiedBadge: true,
    registrationNumber: "CAP-7218401",
    medicalCouncil: "College of American Pathologists & NABL",
    languages: ["English", "Hindi", "Kannada"],
    clinicName: "Metropolis Healthcare Sarjapur",
    clinicAddress: "Opposite Wipro Gate 5 (1.6 km)",
    distanceKm: 1.6,
    phone: "080-6811-2233",
    hospitalAffiliations: ["Metropolis Central Lab Mumbai"],
    verifiedCommunityConsultations: 24,
    openNow: true,
    emergencyServicesAvailable: false,
    homeVisitAvailable: true,
    clinicHours: [
      { day: "Mon - Sat", morning: "07:00 AM - 08:00 PM" },
      { day: "Sunday", morning: "07:30 AM - 01:00 PM" }
    ],
    appointmentSlots: [
      { id: "s-30", time: "08:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-31", time: "10:30 AM", period: "MORNING", available: true, mode: "IN_PERSON" }
    ],
    reviews: []
  },

  // ── PHARMACIES ──
  {
    id: "pharm-1",
    name: "Apollo Pharmacy 24x7 Express Mana",
    specialty: "24-Hour Pharmacy & Urgent Medicine Supply",
    category: "PHARMACY",
    qualifications: ["Licensed Retail Pharmacy", "State Drug Control Accredited"],
    experienceYears: 20,
    rating: 4.88,
    reviewCount: 140,
    consultationFee: 0,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Open 24 Hours • 15 Min Tower Delivery",
    verifiedBadge: true,
    registrationNumber: "DL-KA-B-2018-9102",
    medicalCouncil: "Karnataka State Pharmacy Council (KSPC)",
    languages: ["English", "Kannada", "Hindi", "Tamil", "Telugu"],
    clinicName: "Apollo Pharmacy Mana Store",
    clinicAddress: "Shop 2, Mana Commercial Annex, Main Gate",
    distanceKm: 0.1,
    phone: "1860-500-0101 / +91-98450-22119",
    hospitalAffiliations: ["Apollo Hospitals Network"],
    verifiedCommunityConsultations: 210,
    openNow: true,
    emergencyServicesAvailable: true,
    homeVisitAvailable: true,
    communityOffer: {
      title: "Flat 15% Off Prescribed Medicines + Free Delivery",
      badge: "Resident RWA Partner",
      discountPercent: 15,
      promoCode: "MANARX15",
      description: "Show Mana resident ID card or order via app for flat 15% discount on all branded medicines.",
      validUntil: "2027-03-31"
    },
    clinicHours: [
      { day: "Monday - Sunday", is24x7: true }
    ],
    appointmentSlots: [],
    reviews: [
      {
        communication: 5,
        waitingTime: 5,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "Delivered emergency pediatric fever drops to Tower C at 2:30 AM in less than 15 minutes. Invaluable!",
        authorName: "Tower C Resident",
        date: "2026-09-22"
      }
    ]
  },
  {
    id: "pharm-2",
    name: "MedPlus Community Pharmacy & Surgical Hub",
    specialty: "Generics, Chronic Medicine & Surgical Care",
    category: "PHARMACY",
    qualifications: ["Licensed Retail Pharmacy"],
    experienceYears: 16,
    rating: 4.74,
    reviewCount: 65,
    consultationFee: 0,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Open Today 07:00 AM - 11:30 PM",
    verifiedBadge: true,
    registrationNumber: "DL-KA-B-2015-4421",
    medicalCouncil: "Karnataka State Pharmacy Council",
    languages: ["English", "Hindi", "Kannada"],
    clinicName: "MedPlus Gate 2 Corner",
    clinicAddress: "Opposite Mana Gate 2 Entrance (0.2 km)",
    distanceKm: 0.2,
    phone: "080-6122-3344",
    hospitalAffiliations: [],
    verifiedCommunityConsultations: 78,
    openNow: true,
    emergencyServicesAvailable: false,
    homeVisitAvailable: true,
    communityOffer: {
      title: "Up to 20% Savings on Monthly Chronic Medicines",
      badge: "Mana Senior Saver",
      discountPercent: 20,
      description: "Special medicine refill packages for BP, Diabetes, and Heart prescriptions.",
      validUntil: "2026-12-31"
    },
    clinicHours: [
      { day: "Monday - Sunday", morning: "07:00 AM - 11:30 PM" }
    ],
    appointmentSlots: [],
    reviews: []
  },

  // ── PHYSIOTHERAPISTS ──
  {
    id: "physio-1",
    name: "Dr. Varun Nair (ActiveLife Physio)",
    specialty: "Sports Physiotherapist & Post-Surgery Rehab",
    category: "PHYSIOTHERAPIST",
    qualifications: ["BPT", "MPT (Sports & Musculoskeletal Rehab)", "MIAP"],
    experienceYears: 12,
    rating: 4.9,
    reviewCount: 47,
    consultationFee: 600,
    consultationModes: ["IN_PERSON", "VIDEO"],
    nextAvailableSlot: "Today, 4:30 PM",
    verifiedBadge: true,
    registrationNumber: "MIAP-28491",
    medicalCouncil: "Indian Association of Physiotherapists (IAP)",
    languages: ["English", "Malayalam", "Hindi", "Kannada"],
    clinicName: "ActiveLife Sports & Spine Rehab Center",
    clinicAddress: "Clubhouse Sports Pavilion, Mana Residency",
    distanceKm: 0.1,
    phone: "+91-98441-77889",
    hospitalAffiliations: ["Karnataka State Cricket Academy Consultant"],
    verifiedCommunityConsultations: 34,
    openNow: true,
    emergencyServicesAvailable: false,
    homeVisitAvailable: true,
    communityOffer: {
      title: "Free Postural Assessment for Remote Workers",
      badge: "Clubhouse Partner",
      discountPercent: 15,
      description: "Ergonomics and neck-spine alignment screening for tech and WFH residents.",
      validUntil: "2026-11-20"
    },
    clinicHours: [
      { day: "Mon - Sat", morning: "08:00 AM - 01:00 PM", evening: "04:30 PM - 08:30 PM" },
      { day: "Sunday", morning: "09:00 AM - 12:00 PM" }
    ],
    appointmentSlots: [
      { id: "s-32", time: "09:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-33", time: "04:30 PM", period: "EVENING", available: true, mode: "IN_PERSON" },
      { id: "s-34", time: "06:00 PM", period: "EVENING", available: true, mode: "VIDEO" }
    ],
    reviews: [
      {
        communication: 5,
        waitingTime: 5,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "Helped me recover from severe lumbar disc strain without surgery. Exceptional exercises guidance.",
        authorName: "Tower D Resident",
        date: "2026-09-19"
      }
    ]
  },
  {
    id: "physio-2",
    name: "Dr. Kavitha Rao (Mobility Plus)",
    specialty: "Geriatric & Neuro-Physiotherapy Specialist",
    category: "PHYSIOTHERAPIST",
    qualifications: ["BPT", "Certified Stroke Rehab Practitioner", "MIAP"],
    experienceYears: 16,
    rating: 4.86,
    reviewCount: 31,
    consultationFee: 700,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Tomorrow, 10:00 AM",
    verifiedBadge: true,
    registrationNumber: "MIAP-31042",
    medicalCouncil: "Indian Association of Physiotherapists",
    languages: ["English", "Kannada", "Telugu", "Hindi"],
    clinicName: "Mobility Plus Elder Care & Rehab",
    clinicAddress: "Sarjapur Road, Near Bellandur Gate (0.8 km)",
    distanceKm: 0.8,
    phone: "+91-97400-33221",
    hospitalAffiliations: ["St. John's Medical College Alumnus"],
    verifiedCommunityConsultations: 22,
    openNow: true,
    emergencyServicesAvailable: false,
    homeVisitAvailable: true,
    clinicHours: [
      { day: "Mon - Fri", morning: "09:00 AM - 01:00 PM", evening: "03:30 PM - 07:00 PM" },
      { day: "Saturday", morning: "09:30 AM - 01:30 PM" },
      { day: "Sunday", isClosed: true }
    ],
    appointmentSlots: [
      { id: "s-35", time: "10:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-36", time: "04:00 PM", period: "EVENING", available: true, mode: "IN_PERSON" }
    ],
    reviews: []
  },
  {
    id: "physio-3",
    name: "Dr. Ananya Sen (ProMove Rehab)",
    specialty: "Orthopedic & Post-Operative Rehabilitation",
    category: "PHYSIOTHERAPIST",
    qualifications: ["BPT", "MPT (Orthopedics & Joint Mobilization)", "Dry Needling Certified"],
    experienceYears: 10,
    rating: 4.92,
    reviewCount: 39,
    consultationFee: 650,
    consultationModes: ["IN_PERSON", "VIDEO"],
    nextAvailableSlot: "Today, 5:30 PM",
    verifiedBadge: true,
    registrationNumber: "MIAP-34190",
    medicalCouncil: "Indian Association of Physiotherapists (IAP)",
    languages: ["English", "Hindi", "Bengali", "Kannada"],
    clinicName: "ProMove Ortho & Spine Care",
    clinicAddress: "Mana Wellness Hub & Doorstep Home Visits",
    distanceKm: 0.3,
    phone: "+91-98860-44552",
    hospitalAffiliations: ["Manipal Hospital Rehab Panel", "Apollo Spectra"],
    verifiedCommunityConsultations: 28,
    openNow: true,
    emergencyServicesAvailable: false,
    homeVisitAvailable: true,
    communityOffer: {
      title: "15% Off 5-Session Rehab Package",
      badge: "Mana Special",
      discountPercent: 15,
      description: "Post-surgery joint mobilization and dry needling therapy with free ergonomic home assessment.",
      validUntil: "2026-12-15"
    },
    clinicHours: [
      { day: "Mon - Sat", morning: "08:30 AM - 01:00 PM", evening: "04:00 PM - 08:00 PM" },
      { day: "Sunday", morning: "10:00 AM - 01:00 PM" }
    ],
    appointmentSlots: [
      { id: "s-37", time: "09:30 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-38", time: "05:30 PM", period: "EVENING", available: true, mode: "IN_PERSON" },
      { id: "s-39", time: "07:00 PM", period: "EVENING", available: true, mode: "VIDEO" }
    ],
    reviews: [
      {
        communication: 5,
        waitingTime: 5,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "Dr. Ananya helped my mother walk comfortably after her total knee replacement. Excellent home visit sessions.",
        authorName: "Tower A Resident",
        date: "2026-10-02"
      }
    ]
  },

  // ── HOME-CARE PROVIDERS ──
  {
    id: "home-1",
    name: "Portea Medical Certified Homecare",
    specialty: "ICU Nursing, Post-Surgery Dressings & Elder Attendants",
    category: "HOME_CARE",
    qualifications: ["ISO Certified Home Healthcare", "Police Verified Staff"],
    experienceYears: 11,
    rating: 4.82,
    reviewCount: 64,
    consultationFee: 500,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Attendants Available on 2-Hour Notice",
    verifiedBadge: true,
    registrationNumber: "QAI-HHC-2017-091",
    medicalCouncil: "Quality Access India / Home Healthcare Council",
    languages: ["English", "Hindi", "Kannada", "Tamil", "Telugu"],
    clinicName: "Portea Home Health Unit Sarjapur",
    clinicAddress: "Serving Mana Community On-Campus (0.2 km)",
    distanceKm: 0.2,
    phone: "1800-121-2323 / +91-99009-88112",
    hospitalAffiliations: ["Partnered with Manipal & Sakra Hospitals"],
    verifiedCommunityConsultations: 53,
    openNow: true,
    emergencyServicesAvailable: true,
    homeVisitAvailable: true,
    communityOffer: {
      title: "10% Discount on 12-Hour & 24-Hour Nursing Shifts",
      badge: "Mana Society Care Agreement",
      discountPercent: 10,
      description: "Dedicated nurse supervisor assigned for all Mana resident families.",
      validUntil: "2026-12-31"
    },
    clinicHours: [
      { day: "Monday - Sunday", is24x7: true }
    ],
    appointmentSlots: [
      { id: "s-37", time: "09:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-38", time: "02:00 PM", period: "AFTERNOON", available: true, mode: "IN_PERSON" },
      { id: "s-39", time: "06:00 PM", period: "EVENING", available: true, mode: "IN_PERSON" }
    ],
    reviews: [
      {
        communication: 5,
        waitingTime: 5,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "Nurse Sunita took outstanding care of my mother post hip-replacement surgery. Clean, compassionate, and punctual.",
        authorName: "Tower A Resident",
        date: "2026-09-30"
      }
    ]
  },
  {
    id: "home-2",
    name: "Care24 Geriatric & Palliative Care",
    specialty: "Elderly Assistance, Mobility Support & Bedside Nursing",
    category: "HOME_CARE",
    qualifications: ["Trained Caregiver Network", "Medical Background Verified"],
    experienceYears: 9,
    rating: 4.76,
    reviewCount: 41,
    consultationFee: 450,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Available Today for Assessment",
    verifiedBadge: true,
    registrationNumber: "KHC-2018-319",
    medicalCouncil: "Healthcare Sector Skill Council",
    languages: ["English", "Hindi", "Kannada"],
    clinicName: "Care24 Sarjapur Care Cell",
    clinicAddress: "Kaikondrahalli Main Road (1.2 km)",
    distanceKm: 1.2,
    phone: "080-6922-4455",
    hospitalAffiliations: [],
    verifiedCommunityConsultations: 26,
    openNow: true,
    emergencyServicesAvailable: false,
    homeVisitAvailable: true,
    clinicHours: [
      { day: "Monday - Sunday", is24x7: true }
    ],
    appointmentSlots: [
      { id: "s-40", time: "10:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-41", time: "03:30 PM", period: "AFTERNOON", available: true, mode: "IN_PERSON" }
    ],
    reviews: []
  },

  // ── GYM TRAINERS & FITNESS COACHES ──
  {
    id: "trainer-1",
    name: "Coach Rajesh Sharma",
    specialty: "Strength & Hypertrophy Coach",
    category: "FITNESS_TRAINER",
    qualifications: ["ACE Certified Personal Trainer", "CSCS (Strength & Conditioning)", "CPR/AED Certified"],
    experienceYears: 10,
    rating: 4.95,
    reviewCount: 52,
    consultationFee: 500,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Today, 6:30 AM",
    verifiedBadge: true,
    registrationNumber: "ACE-CPT-894102",
    medicalCouncil: "American Council on Exercise (ACE)",
    languages: ["English", "Hindi", "Kannada"],
    clinicName: "Mana Clubhouse Gymnasium",
    clinicAddress: "Clubhouse Level 1 (Tower A Ground Floor)",
    distanceKm: 0.1,
    phone: "+91-98801-77231",
    email: "rajesh.fit@managym.in",
    hospitalAffiliations: ["Mana Sports & Fitness Committee"],
    verifiedCommunityConsultations: 48,
    openNow: true,
    emergencyServicesAvailable: false,
    homeVisitAvailable: true,
    communityOffer: {
      title: "Free InBody Assessment & 1st PT Trial",
      badge: "Mana Fitness Partner",
      discountPercent: 20,
      promoCode: "MANAFIT20",
      description: "Complimentary body composition analysis and 1-on-1 form assessment for all Mana residents.",
      validUntil: "2026-12-31"
    },
    clinicHours: [
      { day: "Mon - Sat", morning: "06:00 AM - 11:30 AM", evening: "05:00 PM - 09:30 PM" },
      { day: "Sunday", morning: "07:00 AM - 12:00 PM" }
    ],
    appointmentSlots: [
      { id: "s-tr1", time: "06:30 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-tr2", time: "08:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-tr3", time: "06:00 PM", period: "EVENING", available: true, mode: "IN_PERSON" },
      { id: "s-tr4", time: "07:30 PM", period: "EVENING", available: true, mode: "IN_PERSON" }
    ],
    reviews: [
      {
        communication: 5,
        waitingTime: 5,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "Coach Rajesh helped me correct my barbell squat form and build consistent weekly strength routines. Best trainer on campus!",
        authorName: "Tower B Resident",
        date: "2026-10-12"
      }
    ]
  },
  {
    id: "trainer-2",
    name: "Coach Sneha Kapoor",
    specialty: "Functional HIIT & Postural Specialist",
    category: "FITNESS_TRAINER",
    qualifications: ["ACSM Certified Personal Trainer", "Pre & Post-Natal Fitness Certified", "TRX Master Instructor"],
    experienceYears: 7,
    rating: 4.91,
    reviewCount: 38,
    consultationFee: 450,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Tomorrow, 7:00 AM",
    verifiedBadge: true,
    registrationNumber: "ACSM-CPT-44120",
    medicalCouncil: "American College of Sports Medicine (ACSM)",
    languages: ["English", "Hindi"],
    clinicName: "Mana Clubhouse Gym & Doorstep Training",
    clinicAddress: "Clubhouse Gymnasium & Apartment Home Training",
    distanceKm: 0.1,
    phone: "+91-99450-88321",
    email: "sneha.coach@managym.in",
    hospitalAffiliations: ["Mana Women Wellness Circle"],
    verifiedCommunityConsultations: 35,
    openNow: true,
    emergencyServicesAvailable: false,
    homeVisitAvailable: true,
    communityOffer: {
      title: "15% Off 10-Session Women's Core Pass",
      badge: "Resident Exclusive",
      discountPercent: 15,
      description: "Customized pelvic floor and core strengthening program for postpartum and desk-workers.",
      validUntil: "2026-12-31"
    },
    clinicHours: [
      { day: "Mon - Sat", morning: "07:00 AM - 11:00 AM", evening: "04:30 PM - 08:30 PM" },
      { day: "Sunday", morning: "08:00 AM - 11:30 AM" }
    ],
    appointmentSlots: [
      { id: "s-tr5", time: "07:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-tr6", time: "09:30 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-tr7", time: "05:00 PM", period: "EVENING", available: true, mode: "IN_PERSON" }
    ],
    reviews: [
      {
        communication: 5,
        waitingTime: 5,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "Sneha's HIIT and mobility classes at the clubhouse deck completely revitalized my energy levels.",
        authorName: "Tower D Resident",
        date: "2026-10-18"
      }
    ]
  },
  {
    id: "trainer-3",
    name: "Coach Marcus D'Souza",
    specialty: "Athletic Conditioning & Senior Mobility",
    category: "FITNESS_TRAINER",
    qualifications: ["K11 Master Trainer Diploma", "Calisthenics Level 2", "Functional Aging Specialist"],
    experienceYears: 12,
    rating: 4.88,
    reviewCount: 44,
    consultationFee: 550,
    consultationModes: ["IN_PERSON"],
    nextAvailableSlot: "Today, 5:00 PM",
    verifiedBadge: true,
    registrationNumber: "K11-MT-10928",
    medicalCouncil: "K11 School of Fitness Sciences",
    languages: ["English", "Hindi", "Konkani", "Kannada"],
    clinicName: "Mana Clubhouse Gym & Sports Turf",
    clinicAddress: "Clubhouse Gymnasium & Outdoor Turf",
    distanceKm: 0.1,
    phone: "+91-97411-33290",
    email: "marcus.pt@managym.in",
    hospitalAffiliations: ["Mana Sports Association"],
    verifiedCommunityConsultations: 41,
    openNow: true,
    emergencyServicesAvailable: false,
    homeVisitAvailable: true,
    communityOffer: {
      title: "Complimentary Senior Mobility Screening",
      badge: "Mana Elders Fit",
      discountPercent: 10,
      description: "Balance, gait, and joint agility screening for residents aged 55+.",
      validUntil: "2026-12-15"
    },
    clinicHours: [
      { day: "Mon - Sat", morning: "06:30 AM - 12:00 PM", evening: "04:00 PM - 09:00 PM" },
      { day: "Sunday", morning: "07:30 AM - 12:30 PM" }
    ],
    appointmentSlots: [
      { id: "s-tr8", time: "06:30 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-tr9", time: "11:00 AM", period: "MORNING", available: true, mode: "IN_PERSON" },
      { id: "s-tr10", time: "05:00 PM", period: "EVENING", available: true, mode: "IN_PERSON" },
      { id: "s-tr11", time: "07:00 PM", period: "EVENING", available: true, mode: "IN_PERSON" }
    ],
    reviews: [
      {
        communication: 5,
        waitingTime: 4,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "Coach Marcus conducts senior functional mobility sessions with immense patience and expertise.",
        authorName: "Tower A Senior Resident",
        date: "2026-10-09"
      }
    ]
  }
];

export const SEED_LAB_PACKAGES: LabPackageDto[] = [
  {
    id: "pkg-1",
    name: "Full Body Checkup (Comprehensive)",
    price: 1999,
    originalPrice: 4500,
    testCount: 78,
    testsIncluded: ["CBC", "Lipid Profile", "Liver Function (LFT)", "Kidney Function (KFT)", "HbA1c", "Thyroid (TSH)", "Vitamin D & B12"],
    homeCollectionAvailable: true,
    fastingRequired: true,
    reportTurnaroundHours: 24
  },
  {
    id: "pkg-2",
    name: "Cardiac Health Profile",
    price: 1499,
    originalPrice: 3200,
    testCount: 42,
    testsIncluded: ["Lipid Profile Extended", "hs-CRP", "Homocysteine", "Apo-A1 & Apo-B", "ECG at home"],
    homeCollectionAvailable: true,
    fastingRequired: true,
    reportTurnaroundHours: 18
  }
];

export const SEED_EMERGENCY_CONTACTS: HealthEmergencyContactDto[] = [
  { id: "em-1", name: "Mana Community On-Call Ambulance", type: "AMBULANCE", phone: "+91-9876543210", distanceKm: 0.1, is24x7: true, address: "Gate 1 Security Room" },
  { id: "em-2", name: "Manipal Hospital Sarjapur (Emergency Trauma)", type: "HOSPITAL", phone: "080-22221111", distanceKm: 2.4, is24x7: true, address: "Sarjapur Road" },
  { id: "em-3", name: "Apollo 24x7 Pharmacy & First Aid", type: "PHARMACY", phone: "1860-500-0101", distanceKm: 0.8, is24x7: true, address: "Main Gate Plaza" },
  { id: "em-4", name: "Mana 24x7 Primary Health Clinic", type: "COMMUNITY_CLINIC", phone: "+91-9844001122", distanceKm: 0.0, is24x7: true, address: "Clubhouse Level 1" }
];

export const SEED_FAMILY_MEMBERS: FamilyMemberDto[] = [
  {
    id: "fam-1",
    residentUserId: "usr-me",
    fullName: "Rahul Varma",
    relationship: "SELF",
    age: 38,
    gender: "MALE",
    bloodGroup: "O+",
    allergies: ["Penicillin"],
    chronicConditions: ["Mild Hypertension"],
    consentToShareRecords: true,
    upcomingReminders: [
      { id: "rem-1", patientId: "fam-1", title: "Annual Lipid Profile Re-test", type: "CHECKUP", dueDate: "2026-11-10", completed: false }
    ]
  },
  {
    id: "fam-2",
    residentUserId: "usr-me",
    fullName: "Sunita Varma",
    relationship: "SPOUSE",
    age: 36,
    gender: "FEMALE",
    bloodGroup: "B+",
    allergies: [],
    consentToShareRecords: true,
    upcomingReminders: [
      { id: "rem-2", patientId: "fam-2", title: "Dental Scaling & Polish", type: "APPOINTMENT", dueDate: "2026-11-20", completed: false }
    ]
  },
  {
    id: "fam-3",
    residentUserId: "usr-me",
    fullName: "Aarav Varma",
    relationship: "CHILD",
    age: 8,
    gender: "MALE",
    bloodGroup: "O+",
    allergies: ["Peanuts"],
    consentToShareRecords: true,
    upcomingReminders: [
      { id: "rem-3", patientId: "fam-3", title: "Annual Flu Vaccine Shot (Quadrivalent)", type: "VACCINATION", dueDate: "2026-10-25", completed: false, notes: "Negotiated Community Camp Drive at Tower C" },
      { id: "rem-4", patientId: "fam-3", title: "Pediatric Eye Checkup (School Visual Acuity)", type: "CHECKUP", dueDate: "2026-11-01", completed: false }
    ]
  },
  {
    id: "fam-4",
    residentUserId: "usr-me",
    fullName: "M. K. Varma (Father)",
    relationship: "PARENT",
    age: 69,
    gender: "MALE",
    bloodGroup: "A+",
    allergies: ["Sulfa drugs"],
    chronicConditions: ["Type 2 Diabetes", "Ischemic Heart Disease", "Osteoarthritis"],
    consentToShareRecords: true,
    caregivers: [
      { caregiverName: "Rahul Varma (Son - Owner)", relationship: "Primary Family Caregiver", phone: "+91-9880011223", accessScope: "FULL_ACCESS", active: true },
      { caregiverName: "Nurse Kavitha (Mana Verified Homecare)", relationship: "On-Campus Attendant", phone: "+91-9744005511", accessScope: "EMERGENCY_ONLY", active: true }
    ],
    upcomingReminders: [
      { id: "rem-5", patientId: "fam-4", title: "Quarterly HbA1c & Fasting Sugar", type: "CHECKUP", dueDate: "2026-10-18", completed: false, notes: "Clubhouse Diabetes Camp Hall A" },
      { id: "rem-6", patientId: "fam-4", title: "Cardiology Review with Dr. Rajesh Kumar", type: "APPOINTMENT", dueDate: "Tomorrow 5:30 PM", completed: false },
      { id: "rem-7", patientId: "fam-4", title: "Pneumococcal Booster Vaccination", type: "VACCINATION", dueDate: "2026-11-15", completed: false }
    ]
  }
];

export const SEED_HEALTH_CAMPS: HealthCampDto[] = [
  {
    id: "camp-1",
    title: "Diabetes & Blood Pressure Early Detection Camp",
    campCategory: "DIABETES_BP",
    targetAudience: "ADULTS",
    partnerProviderName: "Manipal Hospital Cardiac & Diabetes Outreach",
    partnerHospital: {
      name: "Manipal Hospital Sarjapur",
      accreditation: "NABH & JCI Accredited",
      doctorsCount: 4,
      contactPhone: "+91 80 2222 1111",
      leadDoctor: "Dr. Rajesh Kumar (Cardiologist) & Dr. Suma Rao (Diabetologist)"
    },
    venue: "Clubhouse Multi-Purpose Hall A",
    date: "2026-10-18",
    startTime: "08:30 AM",
    endTime: "01:30 PM",
    availableSlots: 26,
    totalSlots: 60,
    isFree: true,
    feePerResident: 0,
    fastingInstructions: "10-12 hours overnight fasting required for accurate blood glucose & lipid evaluation. Sips of plain water are permitted.",
    preparationNotes: "Wear loose-fitting clothing for blood pressure cuff placement. Bring current prescription if taking anti-hypertensive or diabetes drugs.",
    servicesIncluded: [
      "Fasting Blood Glucose (Spot Glucometer)",
      "HbA1c Glycated Hemoglobin Test",
      "Digital BP & Mean Arterial Pressure",
      "Resting 12-Lead ECG Onsite",
      "Cardiologist & Diabetologist 1-on-1 Consultation",
      "Personalized Diet & Lifestyle Prescription"
    ],
    description: "Organized by Mana Community Health Committee & Manipal Hospital. Focuses on silent hypertension and diabetes risk stratification. All results are encrypted and dispatched directly to your private Mana Health Vault.",
    linkedManaEventId: 101,
    timeSlots: [
      { id: "ts-101", startTime: "08:30 AM", endTime: "09:00 AM", capacity: 6, bookedCount: 5, isAvailable: true },
      { id: "ts-102", startTime: "09:00 AM", endTime: "09:30 AM", capacity: 6, bookedCount: 6, isAvailable: false },
      { id: "ts-103", startTime: "09:30 AM", endTime: "10:00 AM", capacity: 6, bookedCount: 6, isAvailable: false },
      { id: "ts-104", startTime: "10:00 AM", endTime: "10:30 AM", capacity: 6, bookedCount: 4, isAvailable: true },
      { id: "ts-105", startTime: "10:30 AM", endTime: "11:00 AM", capacity: 6, bookedCount: 3, isAvailable: true },
      { id: "ts-106", startTime: "11:00 AM", endTime: "11:30 AM", capacity: 6, bookedCount: 2, isAvailable: true },
      { id: "ts-107", startTime: "11:30 AM", endTime: "12:00 PM", capacity: 6, bookedCount: 2, isAvailable: true },
      { id: "ts-108", startTime: "12:00 PM", endTime: "12:30 PM", capacity: 6, bookedCount: 2, isAvailable: true },
      { id: "ts-109", startTime: "12:30 PM", endTime: "01:00 PM", capacity: 6, bookedCount: 2, isAvailable: true },
      { id: "ts-110", startTime: "01:00 PM", endTime: "01:30 PM", capacity: 6, bookedCount: 2, isAvailable: true }
    ],
    aggregateStats: {
      totalRegistered: 54,
      totalAttended: 48,
      attendanceRatePercent: 88.9,
      satisfactionRate: 97.4,
      ageBreakdown: { kids: 0, adults: 32, seniors: 16 },
      bpSummary: { normal: 26, elevated: 14, stage1OrHigher: 8 },
      sugarSummary: { normal: 28, preDiabetic: 13, diabetic: 7 },
      referralsCount: 11
    },
    partnerReport: {
      partnerName: "Manipal Hospital Sarjapur",
      campTitle: "Community Diabetes & Hypertension Screening Drive",
      date: "2026-10-18",
      leadDoctorName: "Dr. Rajesh Kumar, DM (Cardiology)",
      totalScreeningsConducted: 48,
      keyFindingsSummary: "Identified 8 residents with newly discovered Stage 1/2 hypertension who were previously undiagnosed. 13 participants exhibited pre-diabetic HbA1c ranges (5.7% - 6.4%). Dietary awareness and sodium intake control recommended.",
      preventiveRecommendations: [
        "Annual community repeat lipid and HbA1c screening for residents 40+ years old.",
        "Clubhouse yoga / brisk walking initiative for sedentary desk-job residents.",
        "Monthly blood pressure spot-check kiosk at Tower A reception desk."
      ],
      followUpClinicDays: "Tuesdays & Thursdays, 05:00 PM - 08:00 PM at Manipal Clinic"
    }
  },
  {
    id: "camp-2",
    title: "Community Flu & Pneumococcal Vaccination Drive",
    campCategory: "VACCINATION",
    targetAudience: "ALL",
    partnerProviderName: "Apollo Clinics Sarjapur",
    partnerHospital: {
      name: "Apollo Clinics Sarjapur Road",
      accreditation: "ISO & NABH Certified Primary Care",
      doctorsCount: 3,
      contactPhone: "1860 500 0101",
      leadDoctor: "Dr. Arvind Swaminathan (Consultant Immunologist)"
    },
    venue: "Tower C Community Lounge & Observation Area",
    date: "2026-10-25",
    startTime: "10:00 AM",
    endTime: "04:00 PM",
    availableSlots: 36,
    totalSlots: 80,
    isFree: false,
    feePerResident: 850,
    preparationNotes: "Cold chain maintained at 2°C - 8°C onsite. Please carry ID. 15-minute post-vaccination observation room provided.",
    servicesIncluded: [
      "Influenza Quadrivalent 2026/27 Vaccine (Abbott / Sanofi)",
      "Pneumococcal Conjugate (PCV13 / PPSV23) for 60+",
      "Nurse Vitals Assessment prior to administration",
      "15-Minute Observation Monitoring",
      "Digital Vaccine Certificate issued directly to Vault"
    ],
    description: "Pre-winter seasonal immunization drive for children, adults, and vulnerable elders. RWA negotiated subsidized group pricing.",
    linkedManaEventId: 102,
    timeSlots: [
      { id: "ts-201", startTime: "10:00 AM", endTime: "11:00 AM", capacity: 16, bookedCount: 14, isAvailable: true },
      { id: "ts-202", startTime: "11:00 AM", endTime: "12:00 PM", capacity: 16, bookedCount: 12, isAvailable: true },
      { id: "ts-203", startTime: "12:00 PM", endTime: "01:00 PM", capacity: 16, bookedCount: 8, isAvailable: true },
      { id: "ts-204", startTime: "02:00 PM", endTime: "03:00 PM", capacity: 16, bookedCount: 6, isAvailable: true },
      { id: "ts-205", startTime: "03:00 PM", endTime: "04:00 PM", capacity: 16, bookedCount: 4, isAvailable: true }
    ],
    aggregateStats: {
      totalRegistered: 62,
      totalAttended: 58,
      attendanceRatePercent: 93.5,
      satisfactionRate: 99.1,
      ageBreakdown: { kids: 18, adults: 24, seniors: 16 },
      bpSummary: { normal: 48, elevated: 8, stage1OrHigher: 2 },
      sugarSummary: { normal: 50, preDiabetic: 6, diabetic: 2 },
      vaccinesAdministeredCount: 58,
      referralsCount: 0
    },
    partnerReport: {
      partnerName: "Apollo Clinics Sarjapur",
      campTitle: "Community Pre-Winter Influenza & Pneumococcal Protection Drive",
      date: "2026-10-25",
      leadDoctorName: "Dr. Arvind Swaminathan, MD",
      totalScreeningsConducted: 58,
      keyFindingsSummary: "Administered 58 total vaccine doses with zero acute adverse reactions during the mandatory 15-minute observation. Significant uptake among school-going kids and senior residents.",
      preventiveRecommendations: [
        "Encourage annual revaccination before the peak winter monsoon season.",
        "Boost elder pneumonia coverage with second dose after 12 months for eligible high-risk seniors."
      ],
      followUpClinicDays: "Mon - Sat 08:00 AM - 08:00 PM at Apollo Clinic"
    }
  },
  {
    id: "camp-3",
    title: "Senior Citizen Comprehensive Geriatric Screening",
    campCategory: "SENIOR_SCREENING",
    targetAudience: "SENIORS",
    partnerProviderName: "Fortis Geriatric & Preventive Health Center",
    partnerHospital: {
      name: "Fortis Hospital Bannerghatta Road",
      accreditation: "JCI & NABH Accredited Tertiary Center",
      doctorsCount: 5,
      contactPhone: "+91 80 6621 4444",
      leadDoctor: "Dr. Vikram Sethi & Dr. Meenakshi Sundaram"
    },
    venue: "Clubhouse Activity Room 1 & Physiotherapy Wing",
    date: "2026-11-08",
    startTime: "09:00 AM",
    endTime: "02:00 PM",
    availableSlots: 22,
    totalSlots: 50,
    isFree: true,
    feePerResident: 0,
    fastingInstructions: "Optional fasting if opting for simultaneous lipid test. Otherwise, light breakfast is encouraged for elderly guests.",
    preparationNotes: "Wheelchair ramp access at Clubhouse Gate B. Caregivers are welcome to accompany family members.",
    servicesIncluded: [
      "Geriatric Comprehensive Vitals & Orthostatic BP",
      "Resting ECG & Pulse Oximetry",
      "Bone Mineral Density (BMD Ultrasound Scan)",
      "Balance & Fall Risk Physical Assessment",
      "Polypharmacy & Prescription Audit by Geriatrician",
      "Private Clinical Report in Health Vault"
    ],
    description: "Dedicated to our elderly residents (60+). Evaluate joint mobility, bone density, cardiovascular stability, and drug interactions with top geriatric specialists.",
    linkedManaEventId: 103,
    timeSlots: [
      { id: "ts-301", startTime: "09:00 AM", endTime: "10:00 AM", capacity: 10, bookedCount: 9, isAvailable: true },
      { id: "ts-302", startTime: "10:00 AM", endTime: "11:00 AM", capacity: 10, bookedCount: 8, isAvailable: true },
      { id: "ts-303", startTime: "11:00 AM", endTime: "12:00 PM", capacity: 10, bookedCount: 6, isAvailable: true },
      { id: "ts-304", startTime: "12:00 PM", endTime: "01:00 PM", capacity: 10, bookedCount: 4, isAvailable: true },
      { id: "ts-305", startTime: "01:00 PM", endTime: "02:00 PM", capacity: 10, bookedCount: 1, isAvailable: true }
    ],
    aggregateStats: {
      totalRegistered: 44,
      totalAttended: 41,
      attendanceRatePercent: 93.2,
      satisfactionRate: 98.6,
      ageBreakdown: { kids: 0, adults: 0, seniors: 41 },
      bpSummary: { normal: 18, elevated: 15, stage1OrHigher: 8 },
      sugarSummary: { normal: 20, preDiabetic: 14, diabetic: 7 },
      referralsCount: 16
    },
    partnerReport: {
      partnerName: "Fortis Geriatric Center",
      campTitle: "Elderly Wellness & Bone Health Evaluation",
      date: "2026-11-08",
      leadDoctorName: "Dr. Meenakshi Sundaram, MD (Geriatrics)",
      totalScreeningsConducted: 41,
      keyFindingsSummary: "Identified osteopenia in 46% of female seniors screened. 7 residents showed postural instability indicating high fall risk. Calcium + Vitamin D supplementation and physiotherapy exercises prescribed.",
      preventiveRecommendations: [
        "Clubhouse gentle chair yoga and balance training for seniors twice weekly.",
        "Install grab bars in clubhouse wet areas and outdoor senior walking paths.",
        "Annual bone density evaluation for post-menopausal women."
      ],
      followUpClinicDays: "Wednesdays & Saturdays at Fortis Geriatric Clinic"
    }
  },
  {
    id: "camp-4",
    title: "Kids' Growth, Dental & Vision Wellness Camp",
    campCategory: "KIDS_NUTRITION",
    targetAudience: "KIDS",
    partnerProviderName: "Cloudnine Pediatrics & Clove Dental",
    partnerHospital: {
      name: "Cloudnine Hospital & Clove Dental Hub",
      accreditation: "Pediatric Quality Care Accredited",
      doctorsCount: 4,
      contactPhone: "+91 80 4000 8000",
      leadDoctor: "Dr. Ananya Sharma (Pediatrician) & Dr. Rohan Sen (Pediatric Dentist)"
    },
    venue: "Clubhouse Activity Room 2 & Indoor Sports Court",
    date: "2026-11-15",
    startTime: "10:00 AM",
    endTime: "03:00 PM",
    availableSlots: 28,
    totalSlots: 60,
    isFree: true,
    feePerResident: 0,
    preparationNotes: "Bring child immunization passport or past eye prescriptions. Fresh juice and healthy snack packs distributed post check-in.",
    servicesIncluded: [
      "Pediatric Anthropometry (Height, Weight & BMI Percentiles)",
      "Nutritional Deficiency & Dietary Counseling",
      "Visual Acuity & Color Vision (Snellen Chart)",
      "Pediatric Dental Screening & Fluoride Assessment",
      "Posture & Spinal Alignment Check (Heavy Backpack Screening)",
      "Child Growth Milestone Certificate in Vault"
    ],
    description: "Holistic health checkup for children aged 3 to 15 years. Fun, interactive environment with certified pediatric doctors and child dentists.",
    linkedManaEventId: 104,
    timeSlots: [
      { id: "ts-401", startTime: "10:00 AM", endTime: "11:00 AM", capacity: 12, bookedCount: 9, isAvailable: true },
      { id: "ts-402", startTime: "11:00 AM", endTime: "12:00 PM", capacity: 12, bookedCount: 8, isAvailable: true },
      { id: "ts-403", startTime: "12:00 PM", endTime: "01:00 PM", capacity: 12, bookedCount: 6, isAvailable: true },
      { id: "ts-404", startTime: "01:30 PM", endTime: "02:30 PM", capacity: 12, bookedCount: 5, isAvailable: true },
      { id: "ts-405", startTime: "02:30 PM", endTime: "03:30 PM", capacity: 12, bookedCount: 4, isAvailable: true }
    ],
    aggregateStats: {
      totalRegistered: 52,
      totalAttended: 48,
      attendanceRatePercent: 92.3,
      satisfactionRate: 98.9,
      ageBreakdown: { kids: 48, adults: 0, seniors: 0 },
      bpSummary: { normal: 48, elevated: 0, stage1OrHigher: 0 },
      sugarSummary: { normal: 48, preDiabetic: 0, diabetic: 0 },
      referralsCount: 14
    },
    partnerReport: {
      partnerName: "Cloudnine Pediatrics & Clove Dental",
      campTitle: "Pediatric Growth, Vision & Dental Screening",
      date: "2026-11-15",
      leadDoctorName: "Dr. Ananya Sharma, DNB (Pediatrics)",
      totalScreeningsConducted: 48,
      keyFindingsSummary: "Found early refractive error (myopia) in 9 school children previously unnoticed. 14 children had early dental plaque and caries requiring cleaning. General growth percentiles were robust (avg 62nd percentile).",
      preventiveRecommendations: [
        "Cap screen time to under 1.5 hours daily for school kids; encourage 2 hours outdoor sunlight play.",
        "Night brushing supervision by parents for children under 8 years.",
        "School bag weight should not exceed 10% of the child's body weight."
      ],
      followUpClinicDays: "Daily appointments at Cloudnine Children's Clinic"
    }
  }
];

export const SEED_MEDICAL_RECORDS: MedicalRecordDto[] = [
  {
    id: "rec-1",
    patientId: "fam-4",
    patientName: "M. K. Varma (Father)",
    title: "Echocardiogram & Cardiac Lipid Profile",
    type: "LAB_REPORT",
    date: "2026-09-15",
    doctorOrLabName: "Manipal Heart Centre",
    fileUrl: "#",
    notes: "Normal ejection fraction (62%), mild LDL elevation.",
    authorizedUserIds: ["usr-me"]
  },
  {
    id: "rec-2",
    patientId: "fam-3",
    patientName: "Aarav Varma",
    title: "MMR Booster & Vaccination Chart",
    type: "VACCINATION",
    date: "2026-07-10",
    doctorOrLabName: "Dr. Ananya Sharma",
    fileUrl: "#",
    notes: "Vaccination administered with no acute adverse reactions.",
    authorizedUserIds: ["usr-me"]
  },
  {
    id: "rec-3",
    patientId: "fam-1",
    patientName: "Rahul Varma",
    title: "Digital Prescription - Viral Pharyngitis",
    type: "PRESCRIPTION",
    date: "2026-09-29",
    doctorOrLabName: "Dr. Rajesh Kumar",
    fileUrl: "#",
    notes: "5-day course prescribed with warm water gargles and rest.",
    authorizedUserIds: ["usr-me"]
  }
];

export const SEED_APPOINTMENTS: HealthAppointmentDto[] = [
  {
    id: "apt-1",
    doctorId: "doc-1",
    doctorName: "Dr. Rajesh Kumar",
    doctorSpecialty: "Cardiologist",
    patientId: "fam-4",
    patientName: "M. K. Varma (Father)",
    patientRelationship: "PARENT",
    bookedByUserId: "usr-me",
    slotTime: "Tomorrow, 05:30 PM",
    mode: "IN_PERSON",
    status: "CONFIRMED",
    fee: 700,
    clinicAddress: "Tower B, Ground Floor, Mana Residency",
    statusHistory: ["Requested at 10:00 AM", "Confirmed by Doctor at 10:15 AM"]
  },
  {
    id: "apt-2",
    doctorId: "doc-2",
    doctorName: "Dr. Ananya Sharma",
    doctorSpecialty: "Pediatrician",
    patientId: "fam-3",
    patientName: "Aarav Varma",
    patientRelationship: "CHILD",
    bookedByUserId: "usr-me",
    slotTime: "2026-09-29, 04:00 PM",
    mode: "VIDEO",
    status: "COMPLETED",
    fee: 600,
    meetingLink: "https://meet.manacommunity.app/telehealth/apt-2",
    statusHistory: ["Completed. Prescription uploaded to Vault."],
    reviewSubmitted: true
  }
];

export const SEED_BENEFIT_WALLET: HealthBenefitWalletDto = {
  communityAllowance: 8000,
  usedAllowance: 2600,
  remainingAllowance: 5400,
  coveredServices: [
    "Mana Network Doctor OPD Consultations",
    "Partner Diagnostic & Lab Tests",
    "Community Health Camp Screenings & Vaccines",
    "Prescription Pharmacy Allowance",
    "Annual Preventive Dental & Vision Screening"
  ],
  reimbursementActive: true,
  program: {
    programId: "PRG-MANA-CORP-2026",
    sponsorName: "Mana Residency RWA & Corporate Wellness Partner",
    policyNumber: "POL-MANA-89410-X",
    planName: "Family Health & Preventive Care Pass (Tier-1)",
    validUntil: "2026-12-31",
    coveredMembers: [
      { id: "fam-1", name: "Sandeep Varma", relation: "Primary Member", age: 34, cashlessCardNumber: "MANA-HC-001" },
      { id: "fam-2", name: "Pooja Varma", relation: "Spouse", age: 32, cashlessCardNumber: "MANA-HC-002" },
      { id: "fam-3", name: "Aarav Varma", relation: "Child", age: 6, cashlessCardNumber: "MANA-HC-003" },
      { id: "fam-4", name: "M. K. Varma", relation: "Father (Senior Citizen)", age: 67, cashlessCardNumber: "MANA-HC-004" }
    ],
    tpaHelpdeskNumber: "+91-1800-419-MANA (24x7)",
    tpaEmail: "benefits-helpdesk@manawellness.in"
  },
  categories: [
    {
      category: "CONSULTATIONS",
      label: "Doctor Consultations",
      totalAllowance: 2500,
      usedAllowance: 600,
      remainingAllowance: 1900,
      cashlessSupported: true,
      coPayPercent: 0,
      description: "100% cashless at Mana Wellness Center & affiliated doctors; 20% co-pay on outside clinics."
    },
    {
      category: "DIAGNOSTICS",
      label: "Diagnostic & Lab Tests",
      totalAllowance: 2000,
      usedAllowance: 0,
      remainingAllowance: 2000,
      cashlessSupported: true,
      coPayPercent: 0,
      description: "100% cashless at Redcliffe, Apollo Clinics, and partner labs with home collection."
    },
    {
      category: "HEALTH_CAMPS",
      label: "Community Health Camps",
      totalAllowance: 1500,
      usedAllowance: 1000,
      remainingAllowance: 500,
      cashlessSupported: true,
      coPayPercent: 0,
      description: "100% subsidized participation fee for society seasonal vaccination & multi-specialty camps."
    },
    {
      category: "PHARMACY",
      label: "Pharmacy & Medicines",
      totalAllowance: 1000,
      usedAllowance: 500,
      remainingAllowance: 500,
      cashlessSupported: false,
      coPayPercent: 10,
      description: "Reimbursement for prescribed maintenance medications with valid doctor prescription & GST invoice."
    },
    {
      category: "DENTAL_VISION",
      label: "Dental & Vision Checks",
      totalAllowance: 1000,
      usedAllowance: 500,
      remainingAllowance: 500,
      cashlessSupported: true,
      coPayPercent: 0,
      description: "Annual preventive dental scaling or comprehensive refractive optometrist checkup."
    }
  ],
  activePreAuthorizations: [
    {
      preAuthId: "AUTH-8921",
      approvalCode: "MANA-CASHLESS-7731",
      beneficiaryName: "M. K. Varma (Father)",
      category: "CONSULTATIONS",
      networkProviderName: "Mana Community Health & Wellness Center (Dr. Rajesh Kumar)",
      providerAddress: "Tower B, Ground Floor, Mana Residency",
      eligibleCashlessCap: 700,
      coPayEstimated: 0,
      generatedAt: "2026-10-10, 11:30 AM",
      validUntil: "2026-10-15, 11:59 PM",
      qrPayload: "MANA-BENEFIT-AUTH:PRG-MANA-CORP-2026|BENEFICIARY:M.K.Varma|PROVIDER:DrRajeshKumar|CAP:700|HASH:8f7e2a",
      instructions: [
        "Show this digital cashless QR pass at the clinic front desk during check-in.",
        "No upfront consultation fee will be charged up to ₹700.",
        "Prescriptions and diagnostic advice will automatically sync to your Mana Health Vault."
      ]
    }
  ],
  recentClaims: [
    {
      id: "clm-1",
      claimNumber: "CLM-2026-0901",
      category: "CONSULTATIONS",
      serviceName: "Dr. Ananya Sharma Video Consultation",
      patientName: "Pooja Varma",
      patientRelationship: "Spouse",
      providerName: "Apollo Telehealth Network",
      billNumber: "APL-77401-A",
      treatmentDate: "2026-09-29",
      submittedAt: "2026-09-29, 04:15 PM",
      billAmount: 600,
      approvedAmount: 600,
      coPayAmount: 0,
      outOfPocketAmount: 0,
      status: "SETTLED",
      payoutReference: "UTR-SBIN-891024-HEALTH",
      documents: [
        { id: "doc-1", name: "Telehealth_Consultation_Invoice.pdf", documentType: "BILL_INVOICE", fileSize: "145 KB", uploadedAt: "2026-09-29" },
        { id: "doc-2", name: "Digital_Prescription.pdf", documentType: "PRESCRIPTION", fileSize: "210 KB", uploadedAt: "2026-09-29" }
      ],
      timeline: [
        { stage: "SUBMITTED", title: "Claim Filed", timestamp: "2026-09-29, 04:15 PM", notes: "Claim received via Resident App" },
        { stage: "DOCS_VERIFIED", title: "Documents Verified", timestamp: "2026-09-30, 10:00 AM", notes: "Invoice and e-prescription authenticated" },
        { stage: "APPROVED", title: "Claim Approved", timestamp: "2026-09-30, 02:30 PM", notes: "Approved for full ₹600 allowance cover" },
        { stage: "SETTLED", title: "Reimbursed to Bank Account", timestamp: "2026-10-01, 11:00 AM", notes: "Settled via NEFT / UPI" }
      ]
    },
    {
      id: "clm-2",
      claimNumber: "CLM-2026-1002",
      category: "HEALTH_CAMPS",
      serviceName: "Flu Shot Camp Family Coverage (2 Adults)",
      patientName: "Sandeep Varma & Pooja Varma",
      patientRelationship: "Self & Spouse",
      providerName: "Mana Clubhouse Health Camp (Fortis Drive)",
      billNumber: "CAMP-FLU-2026-44",
      treatmentDate: "2026-10-05",
      submittedAt: "2026-10-05, 09:30 AM",
      billAmount: 1000,
      approvedAmount: 1000,
      coPayAmount: 0,
      outOfPocketAmount: 0,
      status: "APPROVED",
      documents: [
        { id: "doc-3", name: "Camp_Vaccination_Receipt.pdf", documentType: "PAYMENT_RECEIPT", fileSize: "98 KB", uploadedAt: "2026-10-05" }
      ],
      timeline: [
        { stage: "SUBMITTED", title: "Instant Camp Subsidy Claim", timestamp: "2026-10-05, 09:30 AM" },
        { stage: "DOCS_VERIFIED", title: "Camp Attendance Validated", timestamp: "2026-10-05, 11:00 AM" },
        { stage: "APPROVED", title: "Reimbursement Processing", timestamp: "2026-10-06, 04:00 PM", notes: "Payout scheduled in next weekly cycle" }
      ]
    },
    {
      id: "clm-3",
      claimNumber: "CLM-2026-1008",
      category: "PHARMACY",
      serviceName: "Cardiac Maintenance Medications (1 Month Supply)",
      patientName: "M. K. Varma",
      patientRelationship: "Father",
      providerName: "MedPlus Pharmacy (Bellandur Branch)",
      billNumber: "MPL-98441",
      treatmentDate: "2026-10-07",
      submittedAt: "2026-10-08, 02:00 PM",
      billAmount: 1000,
      approvedAmount: 500,
      coPayAmount: 500,
      outOfPocketAmount: 500,
      status: "DOCS_VERIFIED",
      documents: [
        { id: "doc-4", name: "MedPlus_GST_Tax_Invoice.pdf", documentType: "BILL_INVOICE", fileSize: "320 KB", uploadedAt: "2026-10-08" },
        { id: "doc-5", name: "Dr_Rajesh_Prescription_Oct.pdf", documentType: "PRESCRIPTION", fileSize: "180 KB", uploadedAt: "2026-10-08" }
      ],
      timeline: [
        { stage: "SUBMITTED", title: "Pharmacy Claim Uploaded", timestamp: "2026-10-08, 02:00 PM" },
        { stage: "DOCS_VERIFIED", title: "In Scrutiny (50% Category Cap Applied)", timestamp: "2026-10-09, 10:30 AM", notes: "₹500 eligible under current pharmacy allowance balance" }
      ]
    }
  ]
};


export const SEED_CARE_JOURNEYS: CareJourneyDto[] = [
  {
    id: "journey-1",
    patientId: "fam-4",
    patientName: "M. K. Varma (Father)",
    patientRelationship: "PARENT",
    doctorId: "doc-1",
    doctorName: "Dr. Rajesh Kumar",
    doctorSpecialty: "Cardiologist",
    currentStage: "RESULTS_READY",
    appointmentId: "apt-1",
    appointmentTime: "2026-10-02, 05:30 PM",
    mode: "IN_PERSON",
    sharedReportIds: ["rec-1"],
    prescriptionId: "rx-9102",
    prescriptionDate: "2026-10-02",
    prescriptionSummary: "Ecosprin 75mg daily post dinner, Atorvastatin 20mg bedtime.",
    labPackageName: "Lipid Profile Extended & Serum Electrolytes",
    sampleCollected: true,
    resultsAvailable: true,
    resultReadyNotificationSent: true,
    resultDocumentId: "rec-1",
    clinicianRecommendedFollowUp: {
      isAppropriate: true,
      dueDate: "Tomorrow 5:30 PM",
      instructions: "Review post-statin lipid panel response and adjust dosage if target LDL < 70 mg/dL is attained.",
      status: "BOOKED"
    }
  },
  {
    id: "journey-2",
    patientId: "fam-3",
    patientName: "Aarav Varma",
    patientRelationship: "CHILD",
    doctorId: "doc-2",
    doctorName: "Dr. Ananya Sharma",
    doctorSpecialty: "Pediatrician",
    currentStage: "CONSULTATION_COMPLETED",
    appointmentId: "apt-2",
    appointmentTime: "2026-09-29, 04:00 PM",
    mode: "VIDEO",
    sharedReportIds: ["rec-2"],
    prescriptionId: "rx-8812",
    prescriptionDate: "2026-09-29",
    prescriptionSummary: "Saline nasal drops TID, Paracetamol 250mg syrup SOS for fever.",
    resultsAvailable: false,
    resultReadyNotificationSent: false,
    clinicianRecommendedFollowUp: {
      isAppropriate: true,
      dueDate: "2026-10-15",
      instructions: "Follow-up required only if nocturnal wheeze or high fever persists beyond day 5.",
      status: "PENDING"
    }
  }
];

export const SEED_CAMP_REGISTRATIONS: HealthCampRegistrationDto[] = [
  {
    id: "reg-1",
    campId: "camp-1",
    campTitle: "Diabetes & Blood Pressure Early Detection Camp",
    tokenNumber: "CAMP-DIA-001",
    slotId: "ts-101",
    slotTime: "08:30 AM - 09:00 AM",
    patientId: "fam-4",
    patientName: "M. K. Varma (Father)",
    patientAge: 69,
    patientGender: "MALE",
    patientRelationship: "PARENT",
    phone: "+91-9880011223",
    flatNo: "Tower B-402",
    attendanceStatus: "COMPLETED",
    registeredAt: "2026-10-12T09:30:00Z",
    checkedInAt: "2026-10-18T08:35:00Z",
    completedAt: "2026-10-18T08:55:00Z",
    vitals: {
      bloodPressureSystolic: 134,
      bloodPressureDiastolic: 86,
      bloodSugarMgDl: 118,
      bloodSugarType: "FASTING",
      pulseBpm: 76,
      spo2Percent: 98,
      weightKg: 72,
      heightCm: 168,
      bmi: 25.5,
      bmiCategory: "OVERWEIGHT"
    },
    clinicalNotes: "Fasting glucose mildly elevated (118 mg/dL). BP controlled on current anti-hypertensive regimen. Resting ECG showed normal sinus rhythm. Continue Telmisartan 40mg daily and monitor fasting sugar quarterly.",
    referralRecommended: false,
    vaultRecordId: "rec-camp-1"
  },
  {
    id: "reg-2",
    campId: "camp-1",
    campTitle: "Diabetes & Blood Pressure Early Detection Camp",
    tokenNumber: "CAMP-DIA-002",
    slotId: "ts-102",
    slotTime: "09:00 AM - 09:30 AM",
    patientId: "fam-1",
    patientName: "Rahul Varma",
    patientAge: 38,
    patientGender: "MALE",
    patientRelationship: "SELF",
    phone: "+91-9876543210",
    flatNo: "Tower B-402",
    attendanceStatus: "CHECKED_IN",
    registeredAt: "2026-10-14T11:15:00Z",
    checkedInAt: "2026-10-18T09:05:00Z",
    vitals: {
      bloodPressureSystolic: 122,
      bloodPressureDiastolic: 80,
      pulseBpm: 72,
      spo2Percent: 99
    },
    notes: "Awaiting Spot Blood Sugar and Doctor consultation station."
  },
  {
    id: "reg-3",
    campId: "camp-2",
    campTitle: "Community Flu & Pneumococcal Vaccination Drive",
    tokenNumber: "CAMP-VAC-015",
    slotId: "ts-201",
    slotTime: "10:00 AM - 11:00 AM",
    patientId: "fam-3",
    patientName: "Aarav Varma",
    patientAge: 8,
    patientGender: "MALE",
    patientRelationship: "CHILD",
    phone: "+91-9876543210",
    flatNo: "Tower B-402",
    attendanceStatus: "REGISTERED",
    registeredAt: "2026-10-15T14:20:00Z",
    notes: "Annual Pediatric Quadrivalent Flu dose reserved."
  },
  {
    id: "reg-4",
    campId: "camp-4",
    campTitle: "Kids' Growth, Dental & Vision Wellness Camp",
    tokenNumber: "CAMP-PED-008",
    slotId: "ts-401",
    slotTime: "10:00 AM - 11:00 AM",
    patientId: "fam-3",
    patientName: "Aarav Varma",
    patientAge: 8,
    patientGender: "MALE",
    patientRelationship: "CHILD",
    phone: "+91-9876543210",
    flatNo: "Tower B-402",
    attendanceStatus: "REGISTERED",
    registeredAt: "2026-10-16T16:00:00Z",
    notes: "School vision screening and pediatric dental checkup."
  }
];

// ─────────────────────────────────────────────────────────────
// PREVENTIVE WELLNESS SEED DATA
// ─────────────────────────────────────────────────────────────

export const SEED_PREVENTIVE_REMINDERS: PreventiveReminderDto[] = [
  {
    id: "rem-1",
    title: "Annual Influenza (Flu) Vaccine",
    targetMemberId: "fam-4",
    targetMemberName: "M. K. Varma",
    relationship: "Father (Senior Citizen)",
    reminderType: "VACCINATION",
    dueDate: "2026-10-25",
    recurrence: "ANNUAL",
    channels: { inApp: true, whatsapp: true, calendarSync: true },
    status: "PENDING",
    notes: "Recommended before winter season. Senior citizen booster protocol.",
    isUserControlled: true
  },
  {
    id: "rem-2",
    title: "Pediatric DTaP / MMR Booster",
    targetMemberId: "fam-3",
    targetMemberName: "Aarav Varma",
    relationship: "Child (Age 6)",
    reminderType: "VACCINATION",
    dueDate: "2026-11-10",
    recurrence: "ONCE",
    channels: { inApp: true, whatsapp: true, calendarSync: false },
    status: "PENDING",
    notes: "Check immunization card records in Mana Health Vault.",
    isUserControlled: true
  },
  {
    id: "rem-3",
    title: "Comprehensive Lipid Profile & HbA1c Lab Check",
    targetMemberId: "fam-1",
    targetMemberName: "Sandeep Varma",
    relationship: "Self",
    reminderType: "BLOOD_SUGAR_SCREENING",
    dueDate: "2026-11-05",
    recurrence: "EVERY_6_MONTHS",
    channels: { inApp: true, whatsapp: true, calendarSync: true },
    status: "PENDING",
    lastCompletedDate: "2026-05-02",
    notes: "12-hour overnight fasting required for accurate lipid parameters.",
    isUserControlled: true
  },
  {
    id: "rem-4",
    title: "Preventive Dental Cleaning & Scaling",
    targetMemberId: "fam-2",
    targetMemberName: "Pooja Varma",
    relationship: "Spouse",
    reminderType: "DENTAL_CHECKUP",
    dueDate: "2026-10-14",
    recurrence: "EVERY_6_MONTHS",
    channels: { inApp: true, whatsapp: false, calendarSync: true },
    status: "COMPLETED",
    lastCompletedDate: "2026-10-09",
    notes: "Covered under Healthcare Benefits Wallet dental allowance.",
    isUserControlled: true
  }
];

export const SEED_FITNESS_CHALLENGES: FitnessChallengeDto[] = [
  {
    id: "chal-1",
    title: "Mana 10,000 Steps Daily Society Quest",
    subtitle: "Walk and stay active around the clubhouse and community jogging track",
    description: "Build cardiac stamina and hit 10,000 steps every day. Step count syncs privately from your phone or fitness wearable. Compete using anonymous pseudonyms.",
    metricType: "STEPS",
    targetGoal: 10000,
    unit: "steps/day",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    durationDays: 31,
    participantsCount: 84,
    rewardBadge: "Society Master Walker 🏅",
    isEnrolled: true,
    userProgress: 8420,
    userRank: 12,
    userVisibility: "ANONYMOUS_ALIAS",
    topLeaderboard: [
      { id: "lead-1", displayName: "SwiftStrider • Tower C", currentValue: 14200, rank: 1, isCurrentUser: false, avatarIcon: "🏃" },
      { id: "lead-2", displayName: "MorningBreeze • Villa 18", currentValue: 12850, rank: 2, isCurrentUser: false, avatarIcon: "👟" },
      { id: "lead-3", displayName: "TrailBlazer • Tower A", currentValue: 11900, rank: 3, isCurrentUser: false, avatarIcon: "🚶" },
      { id: "lead-user", displayName: "You (Anonymous Alias)", currentValue: 8420, rank: 12, isCurrentUser: true, avatarIcon: "⭐" }
    ]
  },
  {
    id: "chal-2",
    title: "Autumn 100km Walking Challenge",
    subtitle: "Cumulative distance walk over 30 days for society residents",
    description: "Take walking meetings, evening strolls with family, or morning laps. Accumulate 100 km over October.",
    metricType: "DISTANCE_KM",
    targetGoal: 100,
    unit: "km",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    durationDays: 31,
    participantsCount: 52,
    rewardBadge: "Centurion Hiker 🎖️",
    isEnrolled: false,
    userProgress: 34.5,
    userVisibility: "ANONYMOUS_ALIAS",
    topLeaderboard: [
      { id: "lead-4", displayName: "Pacer • Tower B", currentValue: 68, rank: 1, isCurrentUser: false, avatarIcon: "🥾" },
      { id: "lead-5", displayName: "GreenWalker • Tower D", currentValue: 54, rank: 2, isCurrentUser: false, avatarIcon: "🍃" }
    ]
  }
];

export const SEED_WELLNESS_WEBINARS: WellnessWebinarDto[] = [
  {
    id: "web-1",
    title: "Demystifying HbA1c & Blood Glucose: Reversing Pre-Diabetes",
    topicCategory: "DIABETES_PREVENTION",
    academyModule: "Mana Academy • Preventive Health Series",
    speakerName: "Dr. Arvind Swaminathan",
    speakerDesignation: "Consultant Diabetologist & Endocrinologist",
    speakerCredentials: "MD, DNB (Endocrinology) • Apollo Hospitals",
    scheduledDate: "2026-10-18",
    scheduledTime: "11:00 AM - 12:00 PM IST",
    durationMinutes: 60,
    registeredCount: 96,
    isUserRegistered: true,
    description: "Interactive session on understanding insulin sensitivity, dietary glycemic index, and practical daily lifestyle changes to stop pre-diabetes in its tracks.",
    keyTakeaways: [
      "Interpreting your HbA1c and Fasting Insulin numbers correctly",
      "Meal sequencing: fiber-first strategy to prevent glucose spikes",
      "Actionable 15-minute post-meal walk science",
      "Live Q&A with Dr. Arvind"
    ],
    joinLink: "https://academy.manacommunity.app/webinar/live-diabetes-masterclass",
    recordedArchiveAvailable: true
  },
  {
    id: "web-2",
    title: "Desk Ergonomics, Spinal Health & Posture for Remote Workers",
    topicCategory: "ERGONOMICS",
    academyModule: "Mana Academy • Workplace Wellness",
    speakerName: "Dr. Shalini Mukhopadhyay",
    speakerDesignation: "Chief Ergonomics Specialist & Physiotherapist",
    speakerCredentials: "MPT (Musculoskeletal), COMT",
    scheduledDate: "2026-10-24",
    scheduledTime: "05:00 PM - 06:00 PM IST",
    durationMinutes: 60,
    registeredCount: 68,
    isUserRegistered: false,
    description: "Prevent chronic neck strain, sciatica, and lower back tension while working from home. Practical stretches and workstation setup advice.",
    keyTakeaways: [
      "Optimal chair, monitor and lumbar positioning",
      "The 30-minute micro-break stretch regimen",
      "Ergonomic accessories that actually help"
    ],
    joinLink: "https://academy.manacommunity.app/webinar/ergonomics-live",
    recordedArchiveAvailable: false
  },
  {
    id: "web-3",
    title: "Heart-Healthy Nutrition & Lipid Optimization for Families",
    topicCategory: "CARDIOLOGY",
    academyModule: "Mana Academy • Family Nutrition",
    speakerName: "Dr. Rajesh Kumar",
    speakerDesignation: "Lead Cardiologist",
    speakerCredentials: "MD, DM (Cardiology) • Mana Community Health & Apollo",
    scheduledDate: "2026-10-30",
    scheduledTime: "06:30 PM - 07:30 PM IST",
    durationMinutes: 60,
    registeredCount: 114,
    isUserRegistered: false,
    description: "Clear clinical facts on dietary fats, cholesterol ratios, omega-3 sources, and heart disease prevention for young adults and seniors.",
    keyTakeaways: [
      "Good vs bad cholesterol: ApoB and Triglyceride / HDL ratio",
      "Salt reduction tips without sacrificing taste",
      "Cardiac health screening milestones by age"
    ],
    joinLink: "https://academy.manacommunity.app/webinar/heart-health-masterclass",
    recordedArchiveAvailable: true
  }
];

export const SEED_CLINICAL_PROGRAMS: ClinicallySupervisedProgramDto[] = [
  {
    id: "prog-dia",
    title: "Clinically-Supervised Diabetes Care & Remission Protocol",
    conditionCategory: "DIABETES_REVERSAL",
    tagline: "Structured 12-week doctor-guided metabolic care with continuous glucose insights",
    description: "An evidence-based, medically supervised program designed for individuals with Pre-diabetes or Type-2 Diabetes. Includes dedicated endocrinologist reviews, custom low-GI nutritional protocols, and medication tapering supervision.",
    durationWeeks: 12,
    programLead: {
      doctorName: "Dr. Arvind Swaminathan",
      specialty: "Consultant Endocrinologist & Diabetologist",
      qualifications: "MBBS, MD, DNB (Endocrinology)",
      registrationNumber: "KMC-62914",
      hospitalAffiliation: "Apollo Clinics & Mana Health Partner"
    },
    isStrictlyConfidential: true,
    privacyGuaranteeNotice: "100% Private 1-on-1 Clinical Consultation. Your participation, diagnosis, blood sugar charts, and clinical records are never visible to the residents' group, HOA board, or community forum.",
    curriculumMilestones: [
      { week: 1, title: "Clinical Baseline & CGM Onboarding", deliverable: "Continuous Glucose Monitor sensor pairing & baseline blood panel review." },
      { week: 4, title: "Glycemic Stability & Insulin Sensitivity Optimization", deliverable: "Personalized macronutrient timing and spike elimination plan." },
      { week: 8, title: "Mid-Term Clinical Review & Safe Med Tapering", deliverable: "Physician assessment of HbA1c drop and supervised dosage adjustment." },
      { week: 12, title: "Long-Term Remission & Maintenance Plan", deliverable: "Sustainable dietary habits for lifelong euglycemia without strict deprivation." }
    ],
    inclusionHighlights: [
      "Direct 1-on-1 bi-weekly video consults with Dr. Arvind Swaminathan",
      "Dedicated clinical dietitian WhatsApp chat support (private)",
      "Syncs directly to your Private Mana Health Vault",
      "Emergency physician helpline for hypoglycemia or medication queries"
    ],
    enrollmentStatus: "ACTIVE",
    assignedDietitianOrCoach: "Pooja Hegde, Certified Clinical Nutritionist",
    nextClinicalReviewDate: "2026-10-15 (Week 3 Review)"
  },
  {
    id: "prog-wt",
    title: "Doctor-Guided Metabolic & Weight Management Journey",
    conditionCategory: "METABOLIC_WEIGHT",
    tagline: "Sustainable visceral fat reduction and hormone balancing overseen by specialists",
    description: "Say goodbye to crash diets. This clinical program focuses on hormonal balance, thyroid/insulin assessment, muscle-sparing nutrition, and progressive conditioning under qualified sports physicians.",
    durationWeeks: 16,
    programLead: {
      doctorName: "Dr. Ananya Sharma",
      specialty: "Preventive Medicine & Clinical Nutrition",
      qualifications: "MBBS, MD (Internal Medicine), Dip. Clinical Nutrition",
      registrationNumber: "KMC-73891",
      hospitalAffiliation: "Manipal Hospital"
    },
    isStrictlyConfidential: true,
    privacyGuaranteeNotice: "Private & Confidential by Design. Your weight, body composition scans, and target metrics are strictly restricted between you and your attending clinician.",
    curriculumMilestones: [
      { week: 1, title: "Metabolic Profiling & Body Composition Assessment", deliverable: "DEXA/BIA body composition and resting metabolic rate baseline." },
      { week: 4, title: "Thermic Feeding & High-Protein Satiety Plan", deliverable: "Energy balance calibration without feeling starved." },
      { week: 8, title: "Habit Stacking & Strength Progression Review", deliverable: "Lean muscle preservation checkup with clinical physiotherapist." },
      { week: 16, title: "Metabolic Setpoint Stabilization", deliverable: "Preventing rebound weight gain with individualized maintenance buffers." }
    ],
    inclusionHighlights: [
      "Supervised by accredited Internal Medicine specialist",
      "Personalized weekly meal plan calibrated to local foods",
      "Private habit journal and biometric trend logging",
      "No group meetings required; 100% individual confidentiality"
    ],
    enrollmentStatus: "NOT_ENROLLED"
  },
  {
    id: "prog-hyp",
    title: "Senior Citizen Cardiac & Blood Pressure Guardian Program",
    conditionCategory: "HYPERTENSION",
    tagline: "Dedicated vascular monitoring, sodium management and fall prevention for seniors",
    description: "Designed for seniors managing hypertension or early cardiovascular risks. Weekly tele-vitals check-in, medication adherence support, and gentle joint-friendly mobility routines.",
    durationWeeks: 8,
    programLead: {
      doctorName: "Dr. Rajesh Kumar",
      specialty: "Cardiologist",
      qualifications: "MBBS, MD, DM (Cardiology)",
      registrationNumber: "KMC-48291",
      hospitalAffiliation: "Apollo Hospitals & Mana Wellness Center"
    },
    isStrictlyConfidential: true,
    privacyGuaranteeNotice: "Protected Patient Health Information (PHI). Exclusively visible to family caregivers and treating cardiologists.",
    curriculumMilestones: [
      { week: 1, title: "Vascular Baseline & Home BP Monitor Calibration", deliverable: "Digital BP cuff sync and baseline review." },
      { week: 4, title: "DASH Diet Integration & Electrolyte Harmony", deliverable: "Sodium restriction without appetite loss." },
      { week: 8, title: "Functional Mobility & Cardiovascular Tolerance Re-test", deliverable: "ECG and 6-minute walk test evaluation." }
    ],
    inclusionHighlights: [
      "Regular home vitals reviews with Dr. Rajesh",
      "Caregiver alerts for anomalous BP spikes (>140/90 mmHg)",
      "Clubhouse emergency nurse visits on request"
    ],
    enrollmentStatus: "ACTIVE",
    assignedDietitianOrCoach: "Sister Mary, Resident Cardiac Nurse",
    nextClinicalReviewDate: "2026-10-14 (BP Check-in)"
  }
];

export const SEED_VOLUNTARY_GOALS: VoluntaryHealthGoalDto[] = [
  {
    id: "goal-1",
    goalType: "DAILY_STEPS",
    title: "Daily Active Steps",
    currentValue: 8420,
    targetValue: 10000,
    unit: "steps",
    lastLoggedDate: "Today",
    streakDays: 5,
    isPrivate: true
  },
  {
    id: "goal-2",
    goalType: "WATER_LITERS",
    title: "Hydration Intake",
    currentValue: 2.5,
    targetValue: 3.0,
    unit: "liters",
    lastLoggedDate: "Today",
    streakDays: 12,
    isPrivate: true
  },
  {
    id: "goal-3",
    goalType: "SLEEP_HOURS",
    title: "Restful Night Sleep",
    currentValue: 7.2,
    targetValue: 8.0,
    unit: "hours",
    lastLoggedDate: "Last Night",
    streakDays: 4,
    isPrivate: true
  },
  {
    id: "goal-4",
    goalType: "FASTING_BLOOD_SUGAR",
    title: "Fasting Blood Glucose",
    currentValue: 98,
    targetValue: 100,
    unit: "mg/dL (Target < 100)",
    lastLoggedDate: "Yesterday",
    streakDays: 7,
    isPrivate: true
  },
  {
    id: "goal-5",
    goalType: "TARGET_WEIGHT",
    title: "Body Weight Target",
    currentValue: 73.5,
    targetValue: 70.0,
    unit: "kg",
    lastLoggedDate: "2 days ago",
    streakDays: 14,
    isPrivate: true
  }
];

export const SEED_PATIENT_CONSENTS: PatientConsentDto[] = [
  {
    consentId: "CONSENT-8821",
    patientId: "fam-1",
    grantedToUserId: "doc-1",
    grantedToRole: "DOCTOR",
    grantedToName: "Dr. Rajesh Kumar (Cardiologist)",
    doctorSpecialty: "Cardiologist",
    doctorClinicName: "Mana Community Health & Wellness Center",
    purpose: "CONSULTATION_CARE",
    grantedAt: "2026-10-09, 10:00 AM",
    expiresAt: "2026-10-16, 11:59 PM (7-Day Active Care Window)",
    isActive: true
  },
  {
    consentId: "CONSENT-9104",
    patientId: "fam-1",
    grantedToUserId: "doc-2",
    grantedToRole: "DOCTOR",
    grantedToName: "Dr. Ananya Sharma (Pediatrician)",
    doctorSpecialty: "Pediatrician",
    doctorClinicName: "Apollo Telehealth Network",
    purpose: "CONSULTATION_CARE",
    grantedAt: "2026-09-29, 04:00 PM",
    expiresAt: "2026-10-06, 11:59 PM",
    isActive: false,
    revokedAt: "2026-10-06, 11:59 PM",
    revocationReason: "Automatically expired after 7-day care window"
  }
];

export const SEED_SECURITY_AUDIT_LOGS: SecurityAuditLogDto[] = [
  {
    auditId: "AUDIT-10921",
    accessorUserId: "doc-1",
    accessorName: "Dr. Rajesh Kumar",
    accessorRole: "DOCTOR",
    patientId: "fam-1",
    resourceId: "rec-1 (Lipid Profile)",
    action: "READ_RECORD",
    purpose: "CONSULTATION_CARE",
    timestamp: "2026-10-10, 11:32 AM",
    ipAddress: "10.14.2.112 (Mana Clinic Terminal)",
    authorized: true
  },
  {
    auditId: "AUDIT-10922",
    accessorUserId: "admin-hoa",
    accessorName: "HOA Society Administrator",
    accessorRole: "COMMUNITY_ADMIN",
    patientId: "fam-1",
    resourceId: "Vault Encrypted Archive",
    action: "READ_RECORD",
    purpose: "CONSULTATION_CARE",
    timestamp: "2026-10-10, 02:15 PM",
    ipAddress: "192.168.1.45 (Admin Desk)",
    authorized: false,
    failureReason: "Blocked by Health Security Policy: Community Admin role has 0 authorization to patient PHI."
  },
  {
    auditId: "AUDIT-10923",
    accessorUserId: "fam-1",
    accessorName: "Sandeep Varma",
    accessorRole: "PATIENT_OWNER",
    patientId: "fam-1",
    resourceId: "rec-camp-1002 (Camp Pass)",
    action: "DOWNLOAD_PDF",
    purpose: "CONSULTATION_CARE",
    timestamp: "2026-10-11, 09:15 AM",
    ipAddress: "172.16.8.21 (Mobile App)",
    authorized: true
  }
];

export const SEED_COMPLIANCE_DISCLOSURE: ComplianceDisclosureDto = {
  actName: "Digital Personal Data Protection (DPDP) Act 2023 & DISHA Guidelines",
  storageSeparationSummary: "Clinical binaries stored in private, KMS-encrypted object storage (AES-256). Consent tokens and metadata managed in PostgreSQL.",
  adminExclusionGuarantee: "Healthcare authorization is strictly independent from community membership. Society admins, HOA executives, and neighbors are cryptographically restricted from reading clinical files.",
  timeBoundAccessDurationDays: 7,
  auditTrailRetentionYears: 7,
  breachNotificationLeadTimeHours: 6
};

const STORAGE_KEYS = {
  CAMPS: "mana_health_camps_data",
  CAMP_REGISTRATIONS: "mana_health_camp_registrations",
  MEDICAL_RECORDS: "mana_health_medical_records",
  BENEFIT_WALLET: "mana_health_benefit_wallet_v2",
  PREVENTIVE_REMINDERS: "mana_health_preventive_reminders",
  FITNESS_CHALLENGES: "mana_health_fitness_challenges",
  WELLNESS_WEBINARS: "mana_health_wellness_webinars",
  CLINICAL_PROGRAMS: "mana_health_clinical_programs",
  VOLUNTARY_GOALS: "mana_health_voluntary_goals",
  PATIENT_CONSENTS: "mana_health_patient_consents",
  SECURITY_AUDIT_LOGS: "mana_health_security_audit_logs"
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export const healthService = {
  async getDoctors(): Promise<DoctorDto[]> { return SEED_DOCTORS; },
  async getLabPackages(): Promise<LabPackageDto[]> { return SEED_LAB_PACKAGES; },
  async getEmergencyContacts(): Promise<HealthEmergencyContactDto[]> { return SEED_EMERGENCY_CONTACTS; },
  async getFamilyMembers(): Promise<FamilyMemberDto[]> { return SEED_FAMILY_MEMBERS; },
  
  async getHealthCamps(): Promise<HealthCampDto[]> {
    return loadStored<HealthCampDto[]>(STORAGE_KEYS.CAMPS, SEED_HEALTH_CAMPS);
  },

  async getHealthCampById(id: string): Promise<HealthCampDto | undefined> {
    const camps = await this.getHealthCamps();
    return camps.find(c => c.id === id);
  },

  async getCampRegistrations(campId?: string): Promise<HealthCampRegistrationDto[]> {
    const all = loadStored<HealthCampRegistrationDto[]>(STORAGE_KEYS.CAMP_REGISTRATIONS, SEED_CAMP_REGISTRATIONS);
    return campId ? all.filter(r => r.campId === campId) : all;
  },

  async getMyCampRegistrations(): Promise<HealthCampRegistrationDto[]> {
    return loadStored<HealthCampRegistrationDto[]>(STORAGE_KEYS.CAMP_REGISTRATIONS, SEED_CAMP_REGISTRATIONS);
  },

  async bookCampSlot(params: {
    campId: string;
    slotId: string;
    patientId: string;
    phone?: string;
    flatNo?: string;
    notes?: string;
  }): Promise<HealthCampRegistrationDto> {
    const camps = await this.getHealthCamps();
    const camp = camps.find(c => c.id === params.campId);
    if (!camp) throw new Error("Health camp not found");

    const families = await this.getFamilyMembers();
    const patient = families.find(f => f.id === params.patientId);
    if (!patient) throw new Error("Patient profile not found");

    const slot = camp.timeSlots?.find(s => s.id === params.slotId);
    const slotTime = slot ? `${slot.startTime} - ${slot.endTime}` : `${camp.startTime} - ${camp.endTime}`;

    // Generate unique token number
    const prefix = camp.campCategory === "DIABETES_BP" ? "DIA"
      : camp.campCategory === "VACCINATION" ? "VAC"
      : camp.campCategory === "SENIOR_SCREENING" ? "SEN"
      : camp.campCategory === "KIDS_NUTRITION" ? "PED"
      : "HLT";
    const tokenNumber = `CAMP-${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newRegistration: HealthCampRegistrationDto = {
      id: `reg-${Date.now()}`,
      campId: camp.id,
      campTitle: camp.title,
      tokenNumber,
      slotId: params.slotId,
      slotTime,
      patientId: patient.id,
      patientName: patient.fullName,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientRelationship: patient.relationship,
      phone: params.phone || "+91-9876543210",
      flatNo: params.flatNo || "Tower B-402",
      attendanceStatus: "REGISTERED",
      registeredAt: new Date().toISOString(),
      notes: params.notes
    };

    // Update slot capacity
    if (slot) {
      slot.bookedCount = (slot.bookedCount || 0) + 1;
      if (slot.bookedCount >= slot.capacity) {
        slot.isAvailable = false;
      }
    }
    camp.availableSlots = Math.max(0, camp.availableSlots - 1);
    saveStored(STORAGE_KEYS.CAMPS, camps);

    const existingRegistrations = await this.getCampRegistrations();
    existingRegistrations.unshift(newRegistration);
    saveStored(STORAGE_KEYS.CAMP_REGISTRATIONS, existingRegistrations);

    return newRegistration;
  },

  async checkInParticipant(registrationId: string): Promise<HealthCampRegistrationDto> {
    const registrations = await this.getCampRegistrations();
    const reg = registrations.find(r => r.id === registrationId);
    if (!reg) throw new Error("Registration not found");

    reg.attendanceStatus = "CHECKED_IN";
    reg.checkedInAt = new Date().toISOString();
    saveStored(STORAGE_KEYS.CAMP_REGISTRATIONS, registrations);
    return reg;
  },

  async recordCampVitalsAndComplete(
    registrationId: string,
    vitals: CampVitals,
    clinicalNotes?: string,
    referralSpecialty?: string,
    specializedFindings?: {
      vaccine?: { vaccineName: string; batchNumber: string; dose: string; administeredBy: string };
      dental?: { cariesDetected: boolean; scalingNeeded: boolean; orthodonticAdvice?: string; notes?: string };
      vision?: { leftEyeAcuity: string; rightEyeAcuity: string; glassesAdvised: boolean; notes?: string };
    }
  ): Promise<{ registration: HealthCampRegistrationDto; vaultRecord: MedicalRecordDto }> {
    const registrations = await this.getCampRegistrations();
    const reg = registrations.find(r => r.id === registrationId);
    if (!reg) throw new Error("Registration not found");

    reg.vitals = vitals;
    reg.clinicalNotes = clinicalNotes;
    reg.referralRecommended = !!referralSpecialty;
    reg.referralSpecialty = referralSpecialty;
    reg.attendanceStatus = "COMPLETED";
    reg.completedAt = new Date().toISOString();

    if (specializedFindings?.vaccine) reg.vaccineAdministered = specializedFindings.vaccine;
    if (specializedFindings?.dental) reg.dentalFindings = specializedFindings.dental;
    if (specializedFindings?.vision) reg.visionFindings = specializedFindings.vision;

    // Create encrypted Clinical Record directly in Private Health Vault
    const vaultRecordId = `rec-camp-${Date.now()}`;
    reg.vaultRecordId = vaultRecordId;

    let summaryParts: string[] = [];
    if (vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic) {
      summaryParts.push(`BP: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg`);
    }
    if (vitals.bloodSugarMgDl) {
      summaryParts.push(`Blood Sugar (${vitals.bloodSugarType || "Spot"}): ${vitals.bloodSugarMgDl} mg/dL`);
    }
    if (vitals.pulseBpm) summaryParts.push(`Pulse: ${vitals.pulseBpm} bpm`);
    if (vitals.spo2Percent) summaryParts.push(`SpO2: ${vitals.spo2Percent}%`);
    if (vitals.bmi) summaryParts.push(`BMI: ${vitals.bmi.toFixed(1)} (${vitals.bmiCategory || "Normal"})`);
    if (specializedFindings?.vaccine) {
      summaryParts.push(`Vaccine: ${specializedFindings.vaccine.vaccineName} (Batch: ${specializedFindings.vaccine.batchNumber})`);
    }

    const clinicalSummary = summaryParts.join(" • ") + (clinicalNotes ? `\nDoctor Advice: ${clinicalNotes}` : "");

    const vaultRecord: MedicalRecordDto = {
      id: vaultRecordId,
      patientId: reg.patientId,
      patientName: reg.patientName,
      title: `${reg.campTitle} - Official Clinical Summary`,
      type: reg.vaccineAdministered ? "VACCINATION" : "LAB_REPORT",
      date: new Date().toISOString().split("T")[0],
      doctorOrLabName: "Mana Health Screening Team & Partner Hospital",
      fileUrl: "#",
      notes: clinicalSummary,
      authorizedUserIds: ["usr-me"]
    };

    saveStored(STORAGE_KEYS.CAMP_REGISTRATIONS, registrations);

    // Save to private vault records list
    const currentRecords = await this.getMedicalRecords();
    currentRecords.unshift(vaultRecord);
    saveStored(STORAGE_KEYS.MEDICAL_RECORDS, currentRecords);

    return { registration: reg, vaultRecord };
  },

  async cancelCampRegistration(registrationId: string): Promise<void> {
    const registrations = await this.getCampRegistrations();
    const reg = registrations.find(r => r.id === registrationId);
    if (!reg) return;

    reg.attendanceStatus = "CANCELLED";
    saveStored(STORAGE_KEYS.CAMP_REGISTRATIONS, registrations);

    // Free up slot count
    const camps = await this.getHealthCamps();
    const camp = camps.find(c => c.id === reg.campId);
    if (camp) {
      camp.availableSlots = Math.min(camp.totalSlots, camp.availableSlots + 1);
      const slot = camp.timeSlots?.find(s => s.id === reg.slotId);
      if (slot) {
        slot.bookedCount = Math.max(0, slot.bookedCount - 1);
        slot.isAvailable = true;
      }
      saveStored(STORAGE_KEYS.CAMPS, camps);
    }
  },

  async getMedicalRecords(): Promise<MedicalRecordDto[]> {
    return loadStored<MedicalRecordDto[]>(STORAGE_KEYS.MEDICAL_RECORDS, SEED_MEDICAL_RECORDS);
  },

  async getBenefitWallet(): Promise<HealthBenefitWalletDto> {
    return loadStored<HealthBenefitWalletDto>(STORAGE_KEYS.BENEFIT_WALLET, SEED_BENEFIT_WALLET);
  },

  async calculateCoPayEstimate(params: {
    category: BenefitCategoryKey;
    billAmount: number;
    isNetworkPartner: boolean;
  }): Promise<{
    billAmount: number;
    categoryAllowanceRemaining: number;
    coPayPercent: number;
    coPayAmount: number;
    approvedBenefitAmount: number;
    patientOutOfPocket: number;
  }> {
    const wallet = await this.getBenefitWallet();
    const cat = wallet.categories.find(c => c.category === params.category);
    const remaining = cat ? cat.remainingAllowance : 0;
    
    // Co-pay: network partners get 0% co-pay if category supports cashless; non-network has at least 20% co-pay
    const coPayPercent = params.isNetworkPartner
      ? (cat?.coPayPercent ?? 0)
      : Math.max(20, cat?.coPayPercent ?? 20);

    const coPayAmount = Math.round((params.billAmount * coPayPercent) / 100);
    const eligibleAmountAfterCoPay = params.billAmount - coPayAmount;
    const approvedBenefitAmount = Math.min(remaining, eligibleAmountAfterCoPay);
    const patientOutOfPocket = params.billAmount - approvedBenefitAmount;

    return {
      billAmount: params.billAmount,
      categoryAllowanceRemaining: remaining,
      coPayPercent,
      coPayAmount,
      approvedBenefitAmount,
      patientOutOfPocket
    };
  },

  async submitReimbursementClaim(params: {
    category: BenefitCategoryKey;
    serviceName: string;
    patientName: string;
    patientRelationship: string;
    providerName: string;
    billNumber: string;
    treatmentDate: string;
    billAmount: number;
    documents: {
      name: string;
      documentType: "PRESCRIPTION" | "BILL_INVOICE" | "DIAGNOSTIC_REPORT" | "DISCHARGE_SUMMARY" | "PAYMENT_RECEIPT";
      fileSize?: string;
    }[];
    notes?: string;
  }): Promise<HealthcareClaimDto> {
    const wallet = await this.getBenefitWallet();
    const cat = wallet.categories.find(c => c.category === params.category);
    const remainingCatAllowance = cat ? cat.remainingAllowance : 0;

    const coPayPercent = cat?.coPayPercent ?? 10;
    const coPayAmount = Math.round((params.billAmount * coPayPercent) / 100);
    const claimEligible = params.billAmount - coPayAmount;
    const approvedAmount = Math.min(remainingCatAllowance, claimEligible);
    const outOfPocketAmount = params.billAmount - approvedAmount;

    const now = new Date();
    const timestampStr = `${now.toISOString().split("T")[0]}, ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    const newClaim: HealthcareClaimDto = {
      id: `clm-${Date.now()}`,
      claimNumber: `CLM-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: params.category,
      serviceName: params.serviceName,
      patientName: params.patientName,
      patientRelationship: params.patientRelationship,
      providerName: params.providerName,
      billNumber: params.billNumber,
      treatmentDate: params.treatmentDate,
      submittedAt: timestampStr,
      billAmount: params.billAmount,
      approvedAmount,
      coPayAmount,
      outOfPocketAmount,
      status: "SUBMITTED",
      documents: params.documents.map((d, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        name: d.name,
        documentType: d.documentType,
        fileSize: d.fileSize || "180 KB",
        uploadedAt: now.toISOString().split("T")[0]
      })),
      timeline: [
        {
          stage: "SUBMITTED",
          title: "Claim Submitted Successfully",
          timestamp: timestampStr,
          notes: params.notes || "Bills and prescriptions received. Awaiting TPA scrutiny."
        }
      ]
    };

    // Update Category & Overall Wallet balance
    if (cat) {
      cat.usedAllowance += approvedAmount;
      cat.remainingAllowance = Math.max(0, cat.remainingAllowance - approvedAmount);
    }
    wallet.usedAllowance += approvedAmount;
    wallet.remainingAllowance = Math.max(0, wallet.remainingAllowance - approvedAmount);
    wallet.recentClaims = [newClaim, ...wallet.recentClaims];

    saveStored(STORAGE_KEYS.BENEFIT_WALLET, wallet);
    return newClaim;
  },

  async requestCashlessPreAuth(params: {
    beneficiaryName: string;
    category: BenefitCategoryKey;
    networkProviderName: string;
    providerAddress: string;
    requestedCap: number;
  }): Promise<CashlessPreAuthDto> {
    const wallet = await this.getBenefitWallet();
    const cat = wallet.categories.find(c => c.category === params.category);
    const cap = Math.min(cat ? cat.remainingAllowance : params.requestedCap, params.requestedCap);

    const now = new Date();
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 5);

    const preAuth: CashlessPreAuthDto = {
      preAuthId: `AUTH-${Math.floor(1000 + Math.random() * 9000)}`,
      approvalCode: `MANA-CASHLESS-${Math.floor(1000 + Math.random() * 9000)}`,
      beneficiaryName: params.beneficiaryName,
      category: params.category,
      networkProviderName: params.networkProviderName,
      providerAddress: params.providerAddress,
      eligibleCashlessCap: cap,
      coPayEstimated: 0,
      generatedAt: `${now.toISOString().split("T")[0]}, ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      validUntil: `${validUntilDate.toISOString().split("T")[0]}, 11:59 PM`,
      qrPayload: `MANA-CASHLESS-AUTH:${wallet.program.policyNumber}|NAME:${params.beneficiaryName}|HOSPITAL:${params.networkProviderName}|CAP:${cap}|HASH:${Math.random().toString(36).substring(2, 8)}`,
      instructions: [
        "Present this digital QR Pass at the network provider's admission / TPA insurance helpdesk.",
        "Carry a valid Government Photo ID matching the beneficiary name.",
        `Cashless settlement up to ₹${cap} is approved under ${wallet.program.planName}.`,
        "Any non-covered medical consumables will be payable directly by the patient."
      ]
    };

    wallet.activePreAuthorizations = [preAuth, ...(wallet.activePreAuthorizations || [])];
    saveStored(STORAGE_KEYS.BENEFIT_WALLET, wallet);
    return preAuth;
  },

  async getCareJourneys(): Promise<CareJourneyDto[]> { return SEED_CARE_JOURNEYS; },

  // ── PREVENTIVE WELLNESS & REMINDERS ──
  async getPreventiveReminders(): Promise<PreventiveReminderDto[]> {
    return loadStored<PreventiveReminderDto[]>(STORAGE_KEYS.PREVENTIVE_REMINDERS, SEED_PREVENTIVE_REMINDERS);
  },

  async addPreventiveReminder(reminder: Omit<PreventiveReminderDto, "id">): Promise<PreventiveReminderDto> {
    const list = await this.getPreventiveReminders();
    const created: PreventiveReminderDto = {
      ...reminder,
      id: `rem-${Date.now()}`
    };
    const updated = [created, ...list];
    saveStored(STORAGE_KEYS.PREVENTIVE_REMINDERS, updated);
    return created;
  },

  async toggleReminderStatus(id: string, newStatus: "PENDING" | "COMPLETED" | "SNOOZED"): Promise<void> {
    const list = await this.getPreventiveReminders();
    const item = list.find(r => r.id === id);
    if (item) {
      item.status = newStatus;
      if (newStatus === "COMPLETED") {
        item.lastCompletedDate = new Date().toISOString().split("T")[0];
      }
      saveStored(STORAGE_KEYS.PREVENTIVE_REMINDERS, list);
    }
  },

  async deletePreventiveReminder(id: string): Promise<void> {
    const list = await this.getPreventiveReminders();
    const filtered = list.filter(r => r.id !== id);
    saveStored(STORAGE_KEYS.PREVENTIVE_REMINDERS, filtered);
  },

  // ── FITNESS & WALKING CHALLENGES ──
  async getFitnessChallenges(): Promise<FitnessChallengeDto[]> {
    return loadStored<FitnessChallengeDto[]>(STORAGE_KEYS.FITNESS_CHALLENGES, SEED_FITNESS_CHALLENGES);
  },

  async toggleChallengeEnrollment(challengeId: string): Promise<FitnessChallengeDto> {
    const challenges = await this.getFitnessChallenges();
    const ch = challenges.find(c => c.id === challengeId);
    if (!ch) throw new Error("Challenge not found");
    ch.isEnrolled = !ch.isEnrolled;
    ch.participantsCount += ch.isEnrolled ? 1 : -1;
    saveStored(STORAGE_KEYS.FITNESS_CHALLENGES, challenges);
    return ch;
  },

  async updateChallengeVisibility(challengeId: string, visibility: "ANONYMOUS_ALIAS" | "PRIVATE" | "PUBLIC_NAME"): Promise<void> {
    const challenges = await this.getFitnessChallenges();
    const ch = challenges.find(c => c.id === challengeId);
    if (ch) {
      ch.userVisibility = visibility;
      saveStored(STORAGE_KEYS.FITNESS_CHALLENGES, challenges);
    }
  },

  // ── MANA ACADEMY WELLNESS WEBINARS ──
  async getWellnessWebinars(): Promise<WellnessWebinarDto[]> {
    return loadStored<WellnessWebinarDto[]>(STORAGE_KEYS.WELLNESS_WEBINARS, SEED_WELLNESS_WEBINARS);
  },

  async toggleWebinarRegistration(webinarId: string): Promise<WellnessWebinarDto> {
    const webinars = await this.getWellnessWebinars();
    const web = webinars.find(w => w.id === webinarId);
    if (!web) throw new Error("Webinar not found");
    web.isUserRegistered = !web.isUserRegistered;
    web.registeredCount += web.isUserRegistered ? 1 : -1;
    saveStored(STORAGE_KEYS.WELLNESS_WEBINARS, webinars);
    return web;
  },

  // ── CLINICALLY SUPERVISED PROGRAMS (STRICTLY CONFIDENTIAL) ──
  async getClinicalPrograms(): Promise<ClinicallySupervisedProgramDto[]> {
    return loadStored<ClinicallySupervisedProgramDto[]>(STORAGE_KEYS.CLINICAL_PROGRAMS, SEED_CLINICAL_PROGRAMS);
  },

  async enrollClinicalProgram(programId: string): Promise<ClinicallySupervisedProgramDto> {
    const programs = await this.getClinicalPrograms();
    const prog = programs.find(p => p.id === programId);
    if (!prog) throw new Error("Program not found");
    prog.enrollmentStatus = "ACTIVE";
    prog.nextClinicalReviewDate = "Dr. consultation scheduled within 48h";
    saveStored(STORAGE_KEYS.CLINICAL_PROGRAMS, programs);
    return prog;
  },

  // ── VOLUNTARY HEALTH GOALS ──
  async getVoluntaryGoals(): Promise<VoluntaryHealthGoalDto[]> {
    return loadStored<VoluntaryHealthGoalDto[]>(STORAGE_KEYS.VOLUNTARY_GOALS, SEED_VOLUNTARY_GOALS);
  },

  async updateVoluntaryGoalValue(goalId: string, newValue: number): Promise<VoluntaryHealthGoalDto> {
    const goals = await this.getVoluntaryGoals();
    const g = goals.find(item => item.id === goalId);
    if (!g) throw new Error("Goal not found");
    g.currentValue = newValue;
    g.lastLoggedDate = "Just now";
    saveStored(STORAGE_KEYS.VOLUNTARY_GOALS, goals);
    return g;
  },

  // ── HEALTHCARE PROVIDER OPERATIONS ──
  async getProviderProfile(providerId: string): Promise<ProviderProfileDto> {
    const profiles = loadStored<Record<string, ProviderProfileDto>>("mana_health_provider_profiles", SEED_PROVIDER_PROFILES);
    return profiles[providerId] || SEED_PROVIDER_PROFILES["doc-1"];
  },

  async updateProviderProfile(providerId: string, updates: Partial<ProviderProfileDto>): Promise<ProviderProfileDto> {
    const profiles = loadStored<Record<string, ProviderProfileDto>>("mana_health_provider_profiles", SEED_PROVIDER_PROFILES);
    const existing = profiles[providerId] || SEED_PROVIDER_PROFILES["doc-1"];
    const updated = { ...existing, ...updates };
    profiles[providerId] = updated;
    saveStored("mana_health_provider_profiles", profiles);
    return updated;
  },

  async getProviderAppointments(doctorId: string): Promise<HealthAppointmentDto[]> {
    const all = loadStored<HealthAppointmentDto[]>("mana_health_appointments_provider", SEED_APPOINTMENTS);
    return all.filter(a => a.doctorId === doctorId || !doctorId);
  },

  async updateAppointmentStatus(
    appointmentId: string,
    newStatus: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "RESCHEDULED",
    statusNote?: string
  ): Promise<HealthAppointmentDto> {
    const appointments = loadStored<HealthAppointmentDto[]>("mana_health_appointments_provider", SEED_APPOINTMENTS);
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt) throw new Error("Appointment not found");
    appt.status = newStatus;
    const note = statusNote || `Status changed to ${newStatus} by Provider`;
    appt.statusHistory = [...(appt.statusHistory || []), `${note} at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`];
    saveStored("mana_health_appointments_provider", appointments);
    return appt;
  },

  async getProviderServices(providerId: string): Promise<ProviderServiceItemDto[]> {
    const map = loadStored<Record<string, ProviderServiceItemDto[]>>("mana_health_provider_services", SEED_PROVIDER_SERVICES);
    return map[providerId] || SEED_PROVIDER_SERVICES["doc-1"] || [];
  },

  async saveProviderService(providerId: string, service: ProviderServiceItemDto): Promise<ProviderServiceItemDto[]> {
    const map = loadStored<Record<string, ProviderServiceItemDto[]>>("mana_health_provider_services", SEED_PROVIDER_SERVICES);
    const list = map[providerId] || [...(SEED_PROVIDER_SERVICES["doc-1"] || [])];
    const idx = list.findIndex(s => s.id === service.id);
    if (idx >= 0) {
      list[idx] = service;
    } else {
      list.push(service);
    }
    map[providerId] = list;
    saveStored("mana_health_provider_services", map);
    return list;
  },

  async getProviderStaff(providerId: string): Promise<ProviderStaffMemberDto[]> {
    const map = loadStored<Record<string, ProviderStaffMemberDto[]>>("mana_health_provider_staff", SEED_PROVIDER_STAFF);
    return map[providerId] || SEED_PROVIDER_STAFF["doc-1"] || [];
  },

  async addProviderStaffMember(providerId: string, staff: ProviderStaffMemberDto): Promise<ProviderStaffMemberDto[]> {
    const map = loadStored<Record<string, ProviderStaffMemberDto[]>>("mana_health_provider_staff", SEED_PROVIDER_STAFF);
    const list = map[providerId] || [...(SEED_PROVIDER_STAFF["doc-1"] || [])];
    list.push(staff);
    map[providerId] = list;
    saveStored("mana_health_provider_staff", map);
    return list;
  },

  async getPatientQueries(providerId: string): Promise<PatientQueryDto[]> {
    const map = loadStored<Record<string, PatientQueryDto[]>>("mana_health_patient_queries", SEED_PATIENT_QUERIES);
    return map[providerId] || SEED_PATIENT_QUERIES["doc-1"] || [];
  },

  async replyToPatientQuery(providerId: string, queryId: string, replyMessage: string, repliedBy: string): Promise<PatientQueryDto> {
    const map = loadStored<Record<string, PatientQueryDto[]>>("mana_health_patient_queries", SEED_PATIENT_QUERIES);
    const list = map[providerId] || SEED_PATIENT_QUERIES["doc-1"] || [];
    const q = list.find(item => item.id === queryId);
    if (!q) throw new Error("Query not found");
    q.replyMessage = replyMessage;
    q.status = "RESPONDED";
    q.repliedAt = new Date().toISOString();
    q.repliedBy = repliedBy;
    saveStored("mana_health_patient_queries", map);
    return q;
  },

  async getFulfillmentOrders(providerId: string): Promise<ProviderFulfillmentOrderDto[]> {
    const map = loadStored<Record<string, ProviderFulfillmentOrderDto[]>>("mana_health_fulfillment_orders", SEED_FULFILLMENT_ORDERS);
    return map[providerId] || SEED_FULFILLMENT_ORDERS["doc-1"] || [];
  },

  async updateFulfillmentStatus(
    providerId: string,
    orderId: string,
    status: ProviderFulfillmentOrderDto["status"],
    assignedStaffName?: string
  ): Promise<ProviderFulfillmentOrderDto> {
    const map = loadStored<Record<string, ProviderFulfillmentOrderDto[]>>("mana_health_fulfillment_orders", SEED_FULFILLMENT_ORDERS);
    const list = map[providerId] || SEED_FULFILLMENT_ORDERS["doc-1"] || [];
    const ord = list.find(o => o.id === orderId);
    if (!ord) throw new Error("Order not found");
    ord.status = status;
    if (assignedStaffName) ord.assignedStaffName = assignedStaffName;
    saveStored("mana_health_fulfillment_orders", map);
    return ord;
  },

  async issuePrescriptionOrReport(params: {
    appointmentId?: string;
    patientId: string;
    patientName: string;
    doctorOrLabName: string;
    title: string;
    type: "PRESCRIPTION" | "LAB_REPORT";
    notes: string;
  }): Promise<MedicalRecordDto> {
    const record: MedicalRecordDto = {
      id: `rec-issued-${Date.now()}`,
      patientId: params.patientId,
      patientName: params.patientName,
      title: params.title,
      type: params.type,
      date: new Date().toISOString().split("T")[0],
      doctorOrLabName: params.doctorOrLabName,
      fileUrl: `https://vault.manacommunity.app/records/${params.type.toLowerCase()}-${Date.now()}.pdf`,
      notes: params.notes,
      authorizedUserIds: ["usr-me", params.patientId]
    };

    const records = loadStored<MedicalRecordDto[]>(STORAGE_KEYS.MEDICAL_RECORDS, SEED_MEDICAL_RECORDS);
    records.unshift(record);
    saveStored(STORAGE_KEYS.MEDICAL_RECORDS, records);
    return record;
  },

  // ── HEALTHCARE SECURITY, CONSENT & AUDIT TRAIL ──
  async getPatientConsents(patientId: string): Promise<PatientConsentDto[]> {
    const all = loadStored<PatientConsentDto[]>(STORAGE_KEYS.PATIENT_CONSENTS, SEED_PATIENT_CONSENTS);
    return all.filter(c => c.patientId === patientId);
  },

  async revokePatientConsent(consentId: string, reason: string): Promise<void> {
    const all = loadStored<PatientConsentDto[]>(STORAGE_KEYS.PATIENT_CONSENTS, SEED_PATIENT_CONSENTS);
    const target = all.find(c => c.consentId === consentId);
    if (target) {
      target.isActive = false;
      target.revokedAt = new Date().toISOString();
      target.revocationReason = reason;
      saveStored(STORAGE_KEYS.PATIENT_CONSENTS, all);

      // Record in audit log
      const auditLogs = await this.getSecurityAuditLogs(target.patientId);
      const newAudit: SecurityAuditLogDto = {
        auditId: `AUDIT-${Date.now()}`,
        accessorUserId: target.patientId,
        accessorName: "Sandeep Varma (Patient)",
        accessorRole: "PATIENT_OWNER",
        patientId: target.patientId,
        resourceId: `Consent #${consentId}`,
        action: "REVOKE_CONSENT",
        purpose: target.purpose,
        timestamp: "Just now",
        ipAddress: "172.16.8.21 (Encrypted App Session)",
        authorized: true
      };
      saveStored(STORAGE_KEYS.SECURITY_AUDIT_LOGS, [newAudit, ...auditLogs]);
    }
  },

  async getSecurityAuditLogs(patientId: string): Promise<SecurityAuditLogDto[]> {
    const all = loadStored<SecurityAuditLogDto[]>(STORAGE_KEYS.SECURITY_AUDIT_LOGS, SEED_SECURITY_AUDIT_LOGS);
    return all.filter(l => l.patientId === patientId);
  },

  async getComplianceDisclosure(): Promise<ComplianceDisclosureDto> {
    return SEED_COMPLIANCE_DISCLOSURE;
  }
};

// ── SEED DATA FOR PROVIDER OPERATIONS ──

export const SEED_PROVIDER_PROFILES: Record<string, ProviderProfileDto> = {
  "doc-1": {
    id: "doc-1",
    name: "Dr. Rajesh Kumar",
    type: "DOCTOR",
    specialty: "Cardiologist & General Medicine",
    registrationNumber: "KMC-48291",
    medicalCouncil: "Karnataka Medical Council",
    clinicAddress: "Tower B, Ground Floor, Mana Residency",
    phone: "+91-98801-44221",
    email: "dr.rajesh@manawellness.in",
    acceptingNewPatients: true,
    emergencySlotAvailable: true,
    averageConsultTimeMins: 20
  },
  "clinic-1": {
    id: "clinic-1",
    name: "Apollo Clinic Express (Mana Annex)",
    type: "CLINIC",
    specialty: "Multi-Specialty & Family Medicine",
    registrationNumber: "KPME-2019-8810",
    medicalCouncil: "KPME Karnataka",
    clinicAddress: "Mana Commercial Arcade, Main Gate",
    phone: "+91-98440-22114",
    email: "mana.annex@apolloclinic.com",
    acceptingNewPatients: true,
    emergencySlotAvailable: true,
    averageConsultTimeMins: 15
  },
  "lab-1": {
    id: "lab-1",
    name: "Thyrocare Technologies Diagnostic Center",
    type: "DIAGNOSTIC_LAB",
    specialty: "Pathology, Blood Chemistry & Thyroid Panel",
    registrationNumber: "NABL-M-0192",
    medicalCouncil: "National Accreditation Board for Testing and Calibration Labs",
    clinicAddress: "Sarjapur Main Road, 0.9 km from Mana",
    phone: "080-4966-3300",
    email: "support@thyrocare.com",
    acceptingNewPatients: true,
    emergencySlotAvailable: false,
    averageConsultTimeMins: 10
  }
};

export const SEED_PROVIDER_SERVICES: Record<string, ProviderServiceItemDto[]> = {
  "doc-1": [
    {
      id: "srv-101",
      name: "In-Person Cardiology OPD Consultation",
      category: "CONSULTATION",
      price: 700,
      originalPrice: 850,
      communityDiscountPercent: 15,
      turnaroundTime: "Same Day Slot",
      homeAvailable: false,
      description: "Comprehensive physical cardiovascular examination, stethoscope auscultation & BP review.",
      enabled: true
    },
    {
      id: "srv-102",
      name: "Secure High-Definition Video Follow-up",
      category: "CONSULTATION",
      price: 500,
      originalPrice: 600,
      communityDiscountPercent: 15,
      turnaroundTime: "Instant Room",
      homeAvailable: false,
      description: "Encrypted 1-on-1 video consult with digital e-prescription directly to your Health Vault.",
      enabled: true
    },
    {
      id: "srv-103",
      name: "Home Visit Consultation (Elder & Post-Surgery)",
      category: "PROCEDURE",
      price: 1200,
      originalPrice: 1500,
      communityDiscountPercent: 20,
      turnaroundTime: "Within 2 Hours",
      homeAvailable: true,
      description: "Direct doorstep clinical evaluation for senior residents within Mana society towers.",
      enabled: true
    },
    {
      id: "srv-104",
      name: "12-Lead Rest ECG & Cardiologist Interpretation",
      category: "PROCEDURE",
      price: 350,
      originalPrice: 500,
      communityDiscountPercent: 30,
      turnaroundTime: "15 Minutes",
      homeAvailable: true,
      description: "Onsite resting electrocardiogram report generated and uploaded to patient vault.",
      enabled: true
    }
  ],
  "lab-1": [
    {
      id: "srv-201",
      name: "Comprehensive Lipid Profile & Cholesterols",
      category: "DIAGNOSTIC_TEST",
      price: 499,
      originalPrice: 900,
      communityDiscountPercent: 45,
      turnaroundTime: "12 Hours",
      fastingRequired: true,
      homeAvailable: true,
      description: "Total Cholesterol, HDL, LDL, VLDL, Triglycerides and Cardiac Risk Ratio.",
      enabled: true
    },
    {
      id: "srv-202",
      name: "HbA1c Glycated Hemoglobin (3-Month Sugar Average)",
      category: "DIAGNOSTIC_TEST",
      price: 399,
      originalPrice: 650,
      communityDiscountPercent: 38,
      turnaroundTime: "8 Hours",
      fastingRequired: false,
      homeAvailable: true,
      description: "Gold standard test for diabetes monitoring with automated trend analysis.",
      enabled: true
    },
    {
      id: "srv-203",
      name: "Home Phlebotomist Doorstep Collection Convenience Fee",
      category: "HOME_SAMPLE",
      price: 99,
      originalPrice: 200,
      communityDiscountPercent: 50,
      turnaroundTime: "Scheduled Slot",
      fastingRequired: false,
      homeAvailable: true,
      description: "Trained, vaccinated phlebotomist collects blood/urine samples right at your apartment door.",
      enabled: true
    }
  ]
};

export const SEED_PROVIDER_STAFF: Record<string, ProviderStaffMemberDto[]> = {
  "doc-1": [
    {
      id: "stf-1",
      name: "Dr. Rajesh Kumar",
      role: "CHIEF_DOCTOR",
      email: "dr.rajesh@manawellness.in",
      phone: "+91-98801-44221",
      registrationNumber: "KMC-48291",
      permissions: ["MANAGE_SLOTS", "ACCEPT_BOOKINGS", "EDIT_PRICING", "UPLOAD_RX_REPORTS", "ANSWER_QUERIES"],
      active: true
    },
    {
      id: "stf-2",
      name: "Sister Kavitha Nair",
      role: "CLINIC_ADMIN",
      email: "kavitha.admin@manawellness.in",
      phone: "+91-98450-88123",
      permissions: ["MANAGE_SLOTS", "ACCEPT_BOOKINGS", "ANSWER_QUERIES"],
      active: true
    },
    {
      id: "stf-3",
      name: "Ramesh Gowda",
      role: "RECEPTIONIST",
      email: "desk@manawellness.in",
      phone: "+91-98440-11990",
      permissions: ["ACCEPT_BOOKINGS", "ANSWER_QUERIES"],
      active: true
    }
  ],
  "lab-1": [
    {
      id: "stf-10",
      name: "Dr. Sunanda Rao (MD Path)",
      role: "CHIEF_DOCTOR",
      email: "dr.sunanda@thyrocare.com",
      phone: "+91-98110-33445",
      registrationNumber: "KMC-59201",
      permissions: ["EDIT_PRICING", "UPLOAD_RX_REPORTS", "DISPATCH_SAMPLES"],
      active: true
    },
    {
      id: "stf-11",
      name: "Vijay Kumar",
      role: "PHLEBOTOMIST",
      email: "vijay.collector@thyrocare.com",
      phone: "+91-97400-55661",
      permissions: ["DISPATCH_SAMPLES"],
      active: true
    }
  ]
};

export const SEED_PATIENT_QUERIES: Record<string, PatientQueryDto[]> = {
  "doc-1": [
    {
      id: "qry-1",
      patientId: "fam-4",
      patientName: "M. K. Varma (Father)",
      patientPhone: "+91-98800-11223",
      subject: "Fasting requirements before tomorrow's follow-up?",
      message: "Hello Doctor, should I fast 10 hours for the lipid panel blood draw prior to our 5:30 PM appointment?",
      receivedAt: "Today, 10:15 AM",
      status: "RESPONDED",
      replyMessage: "Yes, kindly keep a 10-12 hour water-only fast for accurate triglyceride measurements. We will review reports together during the slot.",
      repliedAt: "Today, 11:00 AM",
      repliedBy: "Dr. Rajesh Kumar"
    },
    {
      id: "qry-2",
      patientId: "fam-1",
      patientName: "Rahul Varma",
      patientPhone: "+91-98800-11223",
      subject: "Mild cough after ACE inhibitor dosage",
      message: "Started Ecosprin and statin as advised. Noticing occasional tickle in throat. Is this normal?",
      receivedAt: "Yesterday, 04:30 PM",
      status: "OPEN"
    }
  ]
};

export const SEED_FULFILLMENT_ORDERS: Record<string, ProviderFulfillmentOrderDto[]> = {
  "doc-1": [
    {
      id: "ord-1",
      orderNumber: "ORD-2026-OCT-101",
      patientName: "M. K. Varma",
      patientFlatNo: "Tower B-402",
      patientPhone: "+91-98800-11223",
      serviceName: "In-Person Cardiology OPD Consultation",
      type: "CLINIC_APPOINTMENT",
      scheduledTime: "Tomorrow, 05:30 PM",
      status: "SCHEDULED",
      assignedStaffName: "Dr. Rajesh Kumar",
      notes: "Post-statin response review. Routine vitals check."
    },
    {
      id: "ord-2",
      orderNumber: "ORD-2026-OCT-098",
      patientName: "Sunita Varma",
      patientFlatNo: "Tower B-402",
      patientPhone: "+91-98800-11223",
      serviceName: "Home Visit Consultation (Elder & Post-Surgery)",
      type: "HOME_SAMPLE_COLLECTION",
      scheduledTime: "Today, 04:00 PM",
      status: "PHLEBOTOMIST_ASSIGNED",
      assignedStaffName: "Vijay Kumar (Phlebotomist)",
      assignedStaffPhone: "+91-97400-55661",
      notes: "Doorstep fasting blood draw."
    }
  ]
};