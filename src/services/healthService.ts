import type {
  DoctorDto,
  FamilyMemberDto,
  HealthAppointmentDto,
  MedicalRecordDto,
  LabPackageDto,
  HomecareProviderDto,
  HealthEmergencyContactDto,
  DoctorReview
} from "../types/health";

export const SEED_DOCTORS: DoctorDto[] = [
  {
    id: "doc-1",
    name: "Dr. Rajesh Kumar",
    specialty: "Cardiologist",
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
    hospitalAffiliations: ["Apollo Hospitals", "Manipal Heart Centre"],
    verifiedCommunityConsultations: 12,
    reviews: [
      {
        communication: 5,
        waitingTime: 4,
        professionalism: 5,
        clinicExperience: 5,
        wouldRecommend: true,
        comment: "Extremely attentive and explained ECG report with great clarity.",
        authorName: "Verified Resident",
        date: "2026-09-28"
      }
    ]
  },
  {
    id: "doc-2",
    name: "Dr. Ananya Sharma",
    specialty: "Pediatrician",
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
    hospitalAffiliations: ["Cloudnine Hospitals"],
    verifiedCommunityConsultations: 24,
    reviews: []
  },
  {
    id: "doc-3",
    name: "Dr. Vikram Sethi",
    specialty: "Orthopedic Surgeon",
    qualifications: ["MBBS", "MS (Ortho)", "FACS"],
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
    hospitalAffiliations: ["Fortis Hospital"],
    verifiedCommunityConsultations: 9,
    reviews: []
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

export const healthService = {
  async getDoctors(): Promise<DoctorDto[]> { return SEED_DOCTORS; },
  async getLabPackages(): Promise<LabPackageDto[]> { return SEED_LAB_PACKAGES; },
  async getEmergencyContacts(): Promise<HealthEmergencyContactDto[]> { return SEED_EMERGENCY_CONTACTS; }
};