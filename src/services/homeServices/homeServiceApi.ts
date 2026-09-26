import { apiClient } from "../common/apiClient";
import type {
  ServiceCategory,
  HomeServiceWorker,
  HomeServiceBooking,
  ServiceAttendance,
  HomeServiceReview,
  HomeServiceRequirement,
  RequirementResponse,
  HomeServiceReport,
  ServicePackage,
  ContextualChatMessage,
  GatePassRecord,
  BookingStatus,
  AttendanceStatus,
  PricingModel,
  DayOfWeek,
  ServiceCategoryCode,
  BookingFrequency,
} from "../../types/homeServices";

const STORAGE_KEY_CATEGORIES = "mana_hs_categories_v1";
const STORAGE_KEY_WORKERS = "mana_hs_workers_v1";
const STORAGE_KEY_BOOKINGS = "mana_hs_bookings_v1";
const STORAGE_KEY_ATTENDANCE = "mana_hs_attendance_v1";
const STORAGE_KEY_REVIEWS = "mana_hs_reviews_v1";
const STORAGE_KEY_REQUIREMENTS = "mana_hs_requirements_v1";
const STORAGE_KEY_RESPONSES = "mana_hs_responses_v1";
const STORAGE_KEY_REPORTS = "mana_hs_reports_v1";
const STORAGE_KEY_PACKAGES = "mana_hs_packages_v1";
const STORAGE_KEY_CHAT = "mana_hs_chat_v1";
const STORAGE_KEY_GATEPASS = "mana_hs_gatepass_v1";

// ── DEFAULT SEED DATA ────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES: ServiceCategory[] = [
  { id: "cat-maid", name: "Maid / House Help", code: "MAID", description: "Daily sweeping, mopping, dusting & household chores", icon: "👩", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: true, active: true, displayOrder: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-cook", name: "Cook / Chef", code: "COOK", description: "Vegetarian & non-vegetarian breakfast, lunch & dinner preparation", icon: "👨‍🍳", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: true, active: true, displayOrder: 2, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-cleaning", name: "House Cleaning", code: "HOUSE_CLEANING", description: "General and routine flat cleaning services", icon: "🧹", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: true, active: true, displayOrder: 3, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-utensils", name: "Utensil / Dish Cleaning", code: "UTENSIL_CLEANING", description: "Daily kitchen utensil washing and sink maintenance", icon: "🍽️", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: false, active: true, displayOrder: 4, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-laundry", name: "Clothes Washing / Laundry", code: "LAUNDRY", description: "Washing, drying and folding clothes", icon: "👕", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: false, active: true, displayOrder: 5, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-ironing", name: "Ironing", code: "IRONING", description: "Doorstep clothes steam and dry ironing service", icon: "🔥", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: false, active: true, displayOrder: 6, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-babycare", name: "Baby Care / Nanny", code: "BABY_CARE", description: "Experienced babysitting, infant feeding and supervision", icon: "👶", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: true, active: true, displayOrder: 7, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-eldercare", name: "Elder Care", code: "ELDER_CARE", description: "Compassionate geriatric assistance and senior mobility support", icon: "👴", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: true, active: true, displayOrder: 8, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-driver", name: "Driver", code: "DRIVER", description: "Personal and family chauffeur for city and outstation transit", icon: "🚗", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: true, active: true, displayOrder: 9, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-gardener", name: "Gardener", code: "GARDENER", description: "Balcony garden, lawn maintenance and plant pruning", icon: "🌱", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: false, active: true, displayOrder: 10, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-carwash", name: "Car / Bike Cleaning", code: "VEHICLE_CLEANING", description: "Daily car dusting, windshield cleaning & bike wash", icon: "🚙", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: false, active: true, displayOrder: 11, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-bathclean", name: "Bathroom Cleaning", code: "BATHROOM_CLEANING", description: "Tile scrubbing, anti-bacterial disinfection & scaling removal", icon: "🚿", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: false, active: true, displayOrder: 12, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-deepclean", name: "Deep Cleaning", code: "DEEP_CLEANING", description: "Thorough move-in / festive whole house deep scrubbing", icon: "✨", supportsRecurring: false, supportsMonthly: false, supportsDaily: false, supportsHourly: true, active: true, displayOrder: 13, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-helper", name: "General Helper", code: "GENERAL_HELPER", description: "Heavy lifting, shifting, errands and manual household assistance", icon: "🧰", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: true, active: true, displayOrder: 14, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-electrician", name: "Electrician", code: "ELECTRICIAN", description: "Wiring, switchboard, ceiling fan & light fixture repairs", icon: "⚡", supportsRecurring: false, supportsMonthly: false, supportsDaily: true, supportsHourly: true, active: true, displayOrder: 15, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-plumber", name: "Plumber", code: "PLUMBER", description: "Tap leakage, flush tank, pipeline blockage & pipe repairs", icon: "🔧", supportsRecurring: false, supportsMonthly: false, supportsDaily: true, supportsHourly: true, active: true, displayOrder: 16, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-carpenter", name: "Carpenter", code: "CARPENTER", description: "Furniture repair, door locks, hinges and woodwork", icon: "🪚", supportsRecurring: false, supportsMonthly: false, supportsDaily: true, supportsHourly: true, active: true, displayOrder: 17, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-ac", name: "AC / Appliance Service", code: "AC_SERVICE", description: "Air conditioner servicing, gas filling & refrigerator check", icon: "❄️", supportsRecurring: false, supportsMonthly: false, supportsDaily: true, supportsHourly: true, active: true, displayOrder: 18, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-pest", name: "Pest Control", code: "PEST_CONTROL", description: "Cockroach, termite, bed bug & mosquito disinfection", icon: "🦟", supportsRecurring: false, supportsMonthly: false, supportsDaily: true, supportsHourly: false, active: true, displayOrder: 19, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "cat-other", name: "Other Community Services", code: "OTHER", description: "Miscellaneous verified community handyman assistance", icon: "🛠️", supportsRecurring: true, supportsMonthly: true, supportsDaily: true, supportsHourly: true, active: true, displayOrder: 20, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
];

const DEFAULT_WORKERS: HomeServiceWorker[] = [
  {
    id: "worker-lakshmi",
    communityId: "comm-mana-1",
    workerType: "COMMUNITY_WORKER",
    displayName: "Lakshmi Devi",
    phoneMasked: "98******10",
    experienceYears: 6,
    languages: ["Telugu", "Hindi", "English"],
    verificationStatus: "VERIFIED",
    mobileVerified: true,
    communityVerified: true,
    securityVerified: true,
    rating: 4.8,
    reviewCount: 42,
    status: "ACTIVE",
    servingSince: "2024-03-01",
    bio: "Punctual, thorough, and trustworthy house maid serving towers A & B for over 2 years. Specializes in spotless floor cleaning, utensil hygiene, and fresh breakfast preparation.",
    skills: [
      { id: "sk-1", workerId: "worker-lakshmi", categoryId: "cat-maid", categoryName: "Maid / House Help", categoryCode: "MAID", experienceYears: 6, isPrimary: true, active: true },
      { id: "sk-2", workerId: "worker-lakshmi", categoryId: "cat-cleaning", categoryName: "House Cleaning", categoryCode: "HOUSE_CLEANING", experienceYears: 6, isPrimary: false, active: true },
      { id: "sk-3", workerId: "worker-lakshmi", categoryId: "cat-utensils", categoryName: "Utensil Cleaning", categoryCode: "UTENSIL_CLEANING", experienceYears: 5, isPrimary: false, active: true },
      { id: "sk-4", workerId: "worker-lakshmi", categoryId: "cat-laundry", categoryName: "Clothes Washing", categoryCode: "LAUNDRY", experienceYears: 4, isPrimary: false, active: true },
    ],
    availability: [
      { id: "av-1", workerId: "worker-lakshmi", dayOfWeek: "MONDAY", startTime: "07:00", endTime: "12:00", maxBookings: 3, active: true },
      { id: "av-2", workerId: "worker-lakshmi", dayOfWeek: "TUESDAY", startTime: "07:00", endTime: "12:00", maxBookings: 3, active: true },
      { id: "av-3", workerId: "worker-lakshmi", dayOfWeek: "WEDNESDAY", startTime: "07:00", endTime: "12:00", maxBookings: 3, active: true },
      { id: "av-4", workerId: "worker-lakshmi", dayOfWeek: "THURSDAY", startTime: "07:00", endTime: "12:00", maxBookings: 3, active: true },
      { id: "av-5", workerId: "worker-lakshmi", dayOfWeek: "FRIDAY", startTime: "07:00", endTime: "12:00", maxBookings: 3, active: true },
      { id: "av-6", workerId: "worker-lakshmi", dayOfWeek: "SATURDAY", startTime: "07:00", endTime: "12:00", maxBookings: 3, active: true },
    ],
    flatAssignments: [
      { id: "fa-1", workerId: "worker-lakshmi", flatId: "flat-a-101", tower: "A", flatNumber: "A-101", assignedFrom: "2024-03-01", status: "ACTIVE" },
      { id: "fa-2", workerId: "worker-lakshmi", flatId: "flat-a-102", tower: "A", flatNumber: "A-102", assignedFrom: "2024-04-10", status: "ACTIVE" },
      { id: "fa-3", workerId: "worker-lakshmi", flatId: "flat-b-201", tower: "B", flatNumber: "B-201", assignedFrom: "2024-06-01", status: "ACTIVE" },
      { id: "fa-4", workerId: "worker-lakshmi", flatId: "flat-b-204", tower: "B", flatNumber: "B-204", assignedFrom: "2024-08-15", status: "ACTIVE" },
    ],
    packages: [
      { id: "pkg-1", workerId: "worker-lakshmi", categoryId: "cat-maid", categoryName: "Maid / House Help", name: "Standard Daily Maid", description: "Sweeping, mopping, dusting and kitchen utensils", includedTasks: ["Sweeping", "Mopping", "Dusting", "Utensils"], pricingModel: "FIXED_MONTHLY", price: 3500, frequency: "MONTHLY", active: true, createdAt: "2024-03-01" },
      { id: "pkg-2", workerId: "worker-lakshmi", categoryId: "cat-maid", categoryName: "Maid / House Help", name: "Premium All-Inclusive Maid", description: "Complete house cleaning, utensils, laundry and bathroom wash twice weekly", includedTasks: ["Sweeping", "Mopping", "Dusting", "Utensils", "Laundry", "Bathroom Cleaning"], pricingModel: "FIXED_MONTHLY", price: 4800, frequency: "MONTHLY", active: true, createdAt: "2024-03-01" },
      { id: "pkg-3", workerId: "worker-lakshmi", categoryId: "cat-cleaning", categoryName: "House Cleaning", name: "Per Day Cleaning Visit", description: "Single-day thorough house sweeping and mopping", includedTasks: ["Sweeping", "Mopping", "Dusting"], pricingModel: "PER_DAY", price: 250, frequency: "DAILY", active: true, createdAt: "2024-03-01" },
    ],
    createdAt: "2024-03-01",
    updatedAt: "2026-09-01",
  },
  {
    id: "worker-suresh",
    communityId: "comm-mana-1",
    workerType: "COMMUNITY_WORKER",
    displayName: "Suresh Kumar",
    phoneMasked: "97******44",
    experienceYears: 8,
    languages: ["Hindi", "Telugu", "Tamil"],
    verificationStatus: "VERIFIED",
    mobileVerified: true,
    communityVerified: true,
    securityVerified: true,
    rating: 4.9,
    reviewCount: 56,
    status: "ACTIVE",
    servingSince: "2023-11-15",
    bio: "Professional home cook skilled in North Indian, South Indian, and Jain culinary delicacies. Strictly adheres to clean kitchen practices and personalized diet needs.",
    skills: [
      { id: "sk-5", workerId: "worker-suresh", categoryId: "cat-cook", categoryName: "Cook / Chef", categoryCode: "COOK", experienceYears: 8, isPrimary: true, active: true },
    ],
    availability: [
      { id: "av-7", workerId: "worker-suresh", dayOfWeek: "MONDAY", startTime: "06:30", endTime: "10:30", maxBookings: 2, active: true },
      { id: "av-8", workerId: "worker-suresh", dayOfWeek: "TUESDAY", startTime: "06:30", endTime: "10:30", maxBookings: 2, active: true },
      { id: "av-9", workerId: "worker-suresh", dayOfWeek: "WEDNESDAY", startTime: "06:30", endTime: "10:30", maxBookings: 2, active: true },
      { id: "av-10", workerId: "worker-suresh", dayOfWeek: "THURSDAY", startTime: "06:30", endTime: "10:30", maxBookings: 2, active: true },
      { id: "av-11", workerId: "worker-suresh", dayOfWeek: "FRIDAY", startTime: "06:30", endTime: "10:30", maxBookings: 2, active: true },
      { id: "av-12", workerId: "worker-suresh", dayOfWeek: "SATURDAY", startTime: "06:30", endTime: "10:30", maxBookings: 2, active: true },
    ],
    flatAssignments: [
      { id: "fa-5", workerId: "worker-suresh", flatId: "flat-a-204", tower: "A", flatNumber: "A-204", assignedFrom: "2024-01-10", status: "ACTIVE" },
      { id: "fa-6", workerId: "worker-suresh", flatId: "flat-c-401", tower: "C", flatNumber: "C-401", assignedFrom: "2024-05-20", status: "ACTIVE" },
    ],
    packages: [
      { id: "pkg-4", workerId: "worker-suresh", categoryId: "cat-cook", categoryName: "Cook / Chef", name: "Breakfast & Lunch Prep", description: "Fresh morning breakfast + lunch cooking Mon-Sat", includedTasks: ["Breakfast", "Lunch", "Kitchen Counter Cleanup"], pricingModel: "FIXED_MONTHLY", price: 6000, frequency: "MONTHLY", active: true, createdAt: "2024-01-01" },
      { id: "pkg-5", workerId: "worker-suresh", categoryId: "cat-cook", categoryName: "Cook / Chef", name: "Special Event / Guest Cooking", description: "One-time multi-dish cooking for family celebrations and dinner parties", includedTasks: ["4-Course Meal", "Appetizers", "Dessert"], pricingModel: "PER_VISIT", price: 1500, frequency: "ONE_TIME", active: true, createdAt: "2024-01-01" },
    ],
    createdAt: "2023-11-15",
    updatedAt: "2026-09-01",
  },
  {
    id: "worker-anitha",
    communityId: "comm-mana-1",
    workerType: "COMMUNITY_WORKER",
    displayName: "Anitha Reddy",
    phoneMasked: "94******88",
    experienceYears: 4,
    languages: ["Telugu", "Kannada"],
    verificationStatus: "VERIFIED",
    mobileVerified: true,
    communityVerified: true,
    securityVerified: true,
    rating: 4.7,
    reviewCount: 29,
    status: "ACTIVE",
    servingSince: "2024-07-01",
    bio: "Reliable helper for daily cleaning, laundry and utensil scrubbing. Available for morning & afternoon slots in Tower B and C.",
    skills: [
      { id: "sk-6", workerId: "worker-anitha", categoryId: "cat-cleaning", categoryName: "House Cleaning", categoryCode: "HOUSE_CLEANING", experienceYears: 4, isPrimary: true, active: true },
      { id: "sk-7", workerId: "worker-anitha", categoryId: "cat-utensils", categoryName: "Utensil Cleaning", categoryCode: "UTENSIL_CLEANING", experienceYears: 3, isPrimary: false, active: true },
      { id: "sk-8", workerId: "worker-anitha", categoryId: "cat-ironing", categoryName: "Ironing", categoryCode: "IRONING", experienceYears: 2, isPrimary: false, active: true },
    ],
    availability: [
      { id: "av-13", workerId: "worker-anitha", dayOfWeek: "MONDAY", startTime: "08:00", endTime: "14:00", maxBookings: 3, active: true },
      { id: "av-14", workerId: "worker-anitha", dayOfWeek: "TUESDAY", startTime: "08:00", endTime: "14:00", maxBookings: 3, active: true },
      { id: "av-15", workerId: "worker-anitha", dayOfWeek: "WEDNESDAY", startTime: "08:00", endTime: "14:00", maxBookings: 3, active: true },
      { id: "av-16", workerId: "worker-anitha", dayOfWeek: "THURSDAY", startTime: "08:00", endTime: "14:00", maxBookings: 3, active: true },
      { id: "av-17", workerId: "worker-anitha", dayOfWeek: "FRIDAY", startTime: "08:00", endTime: "14:00", maxBookings: 3, active: true },
      { id: "av-18", workerId: "worker-anitha", dayOfWeek: "SATURDAY", startTime: "08:00", endTime: "14:00", maxBookings: 3, active: true },
    ],
    flatAssignments: [
      { id: "fa-7", workerId: "worker-anitha", flatId: "flat-b-302", tower: "B", flatNumber: "B-302", assignedFrom: "2024-07-01", status: "ACTIVE" },
      { id: "fa-8", workerId: "worker-anitha", flatId: "flat-b-305", tower: "B", flatNumber: "B-305", assignedFrom: "2024-08-01", status: "ACTIVE" },
    ],
    packages: [
      { id: "pkg-6", workerId: "worker-anitha", categoryId: "cat-cleaning", categoryName: "House Cleaning", name: "Monthly Cleaning & Utensils", description: "Daily floor cleaning and washing dishes Mon-Sat", includedTasks: ["Sweeping", "Mopping", "Utensils"], pricingModel: "FIXED_MONTHLY", price: 3200, frequency: "MONTHLY", active: true, createdAt: "2024-07-01" },
      { id: "pkg-7", workerId: "worker-anitha", categoryId: "cat-cleaning", categoryName: "House Cleaning", name: "Day Relief / Replacement Cleaning", description: "Temporary 1-day cleaning service when your regular maid is on leave", includedTasks: ["Sweeping", "Mopping", "Utensils"], pricingModel: "PER_DAY", price: 250, frequency: "DAILY", active: true, createdAt: "2024-07-01" },
    ],
    createdAt: "2024-07-01",
    updatedAt: "2026-09-01",
  },
  {
    id: "worker-rajesh",
    communityId: "comm-mana-1",
    workerType: "EXTERNAL",
    displayName: "Rajesh Sharma",
    phoneMasked: "98******21",
    experienceYears: 10,
    languages: ["Hindi", "English", "Telugu"],
    verificationStatus: "VERIFIED",
    mobileVerified: true,
    communityVerified: true,
    securityVerified: true,
    rating: 4.9,
    reviewCount: 68,
    status: "ACTIVE",
    servingSince: "2023-01-10",
    bio: "Certified Electrician and AC Technician. Quick turnaround for power faults, MCB tripping, fan installations, and appliance repairs inside community apartments.",
    skills: [
      { id: "sk-9", workerId: "worker-rajesh", categoryId: "cat-electrician", categoryName: "Electrician", categoryCode: "ELECTRICIAN", experienceYears: 10, isPrimary: true, active: true },
      { id: "sk-10", workerId: "worker-rajesh", categoryId: "cat-ac", categoryName: "AC / Appliance Service", categoryCode: "AC_SERVICE", experienceYears: 7, isPrimary: false, active: true },
    ],
    availability: [
      { id: "av-19", workerId: "worker-rajesh", dayOfWeek: "MONDAY", startTime: "09:00", endTime: "19:00", maxBookings: 6, active: true },
      { id: "av-20", workerId: "worker-rajesh", dayOfWeek: "TUESDAY", startTime: "09:00", endTime: "19:00", maxBookings: 6, active: true },
      { id: "av-21", workerId: "worker-rajesh", dayOfWeek: "WEDNESDAY", startTime: "09:00", endTime: "19:00", maxBookings: 6, active: true },
      { id: "av-22", workerId: "worker-rajesh", dayOfWeek: "THURSDAY", startTime: "09:00", endTime: "19:00", maxBookings: 6, active: true },
      { id: "av-23", workerId: "worker-rajesh", dayOfWeek: "FRIDAY", startTime: "09:00", endTime: "19:00", maxBookings: 6, active: true },
      { id: "av-24", workerId: "worker-rajesh", dayOfWeek: "SATURDAY", startTime: "09:00", endTime: "19:00", maxBookings: 6, active: true },
      { id: "av-25", workerId: "worker-rajesh", dayOfWeek: "SUNDAY", startTime: "10:00", endTime: "16:00", maxBookings: 4, active: true },
    ],
    flatAssignments: [],
    packages: [
      { id: "pkg-8", workerId: "worker-rajesh", categoryId: "cat-electrician", categoryName: "Electrician", name: "Basic Electrical Inspection / Fix", description: "Inspection and repair of switches, sockets, fan regulators or light fittings", includedTasks: ["Fault Diagnosis", "Wiring Check", "Switch Replacement"], pricingModel: "PER_VISIT", price: 300, frequency: "ONE_TIME", active: true, createdAt: "2023-01-10" },
      { id: "pkg-9", workerId: "worker-rajesh", categoryId: "cat-ac", categoryName: "AC / Appliance Service", name: "Split AC Deep Jet Cleaning", description: "Indoor & outdoor unit high-pressure jet wash, filter sanitation and gas leak test", includedTasks: ["Jet Wash", "Filter Cleaning", "Gas Pressure Check"], pricingModel: "PER_TASK", price: 650, frequency: "ONE_TIME", active: true, createdAt: "2023-01-10" },
    ],
    createdAt: "2023-01-10",
    updatedAt: "2026-09-01",
  },
  {
    id: "worker-ramesh",
    communityId: "comm-mana-1",
    workerType: "COMMUNITY_WORKER",
    displayName: "Ramesh Babu",
    phoneMasked: "99******76",
    experienceYears: 12,
    languages: ["Telugu", "Hindi", "English"],
    verificationStatus: "VERIFIED",
    mobileVerified: true,
    communityVerified: true,
    securityVerified: true,
    rating: 4.8,
    reviewCount: 34,
    status: "ACTIVE",
    servingSince: "2023-05-10",
    bio: "Experienced, patient chauffeur with clean driving record and valid commercial/private license. Expert in manual and automatic cars across city traffic.",
    skills: [
      { id: "sk-11", workerId: "worker-ramesh", categoryId: "cat-driver", categoryName: "Driver", categoryCode: "DRIVER", experienceYears: 12, isPrimary: true, active: true },
    ],
    availability: [
      { id: "av-26", workerId: "worker-ramesh", dayOfWeek: "MONDAY", startTime: "08:00", endTime: "20:00", maxBookings: 1, active: true },
      { id: "av-27", workerId: "worker-ramesh", dayOfWeek: "TUESDAY", startTime: "08:00", endTime: "20:00", maxBookings: 1, active: true },
      { id: "av-28", workerId: "worker-ramesh", dayOfWeek: "WEDNESDAY", startTime: "08:00", endTime: "20:00", maxBookings: 1, active: true },
      { id: "av-29", workerId: "worker-ramesh", dayOfWeek: "THURSDAY", startTime: "08:00", endTime: "20:00", maxBookings: 1, active: true },
      { id: "av-30", workerId: "worker-ramesh", dayOfWeek: "FRIDAY", startTime: "08:00", endTime: "20:00", maxBookings: 1, active: true },
      { id: "av-31", workerId: "worker-ramesh", dayOfWeek: "SATURDAY", startTime: "08:00", endTime: "20:00", maxBookings: 1, active: true },
    ],
    flatAssignments: [
      { id: "fa-9", workerId: "worker-ramesh", flatId: "flat-a-402", tower: "A", flatNumber: "A-402", assignedFrom: "2023-05-10", status: "ACTIVE" },
    ],
    packages: [
      { id: "pkg-10", workerId: "worker-ramesh", categoryId: "cat-driver", categoryName: "Driver", name: "Monthly Chauffeur (8 Hours/Day)", description: "Dedicated driver for office commute, school drop and family transit Mon-Sat", includedTasks: ["City Driving", "Vehicle Maintenance Check", "Refueling assistance"], pricingModel: "FIXED_MONTHLY", price: 18000, frequency: "MONTHLY", active: true, createdAt: "2023-05-10" },
      { id: "pkg-11", workerId: "worker-ramesh", categoryId: "cat-driver", categoryName: "Driver", name: "Per Hour City Driver", description: "Hourly driver for shopping trips or evening outings", includedTasks: ["Safe Chauffeur Service"], pricingModel: "PER_HOUR", price: 150, frequency: "ONE_TIME", active: true, createdAt: "2023-05-10" },
    ],
    createdAt: "2023-05-10",
    updatedAt: "2026-09-01",
  },
  {
    id: "worker-sujatha",
    communityId: "comm-mana-1",
    workerType: "COMMUNITY_WORKER",
    displayName: "Sujatha Nair",
    phoneMasked: "93******55",
    experienceYears: 7,
    languages: ["Malayalam", "Tamil", "English", "Hindi"],
    verificationStatus: "VERIFIED",
    mobileVerified: true,
    communityVerified: true,
    securityVerified: true,
    rating: 4.95,
    reviewCount: 38,
    status: "ACTIVE",
    servingSince: "2024-02-01",
    bio: "Certified nanny and elderly caregiver with medical assistant background. Warm, attentive and trained in emergency first aid.",
    skills: [
      { id: "sk-12", workerId: "worker-sujatha", categoryId: "cat-babycare", categoryName: "Baby Care / Nanny", categoryCode: "BABY_CARE", experienceYears: 7, isPrimary: true, active: true },
      { id: "sk-13", workerId: "worker-sujatha", categoryId: "cat-eldercare", categoryName: "Elder Care", categoryCode: "ELDER_CARE", experienceYears: 5, isPrimary: false, active: true },
    ],
    availability: [
      { id: "av-32", workerId: "worker-sujatha", dayOfWeek: "MONDAY", startTime: "08:30", endTime: "17:30", maxBookings: 1, active: true },
      { id: "av-33", workerId: "worker-sujatha", dayOfWeek: "TUESDAY", startTime: "08:30", endTime: "17:30", maxBookings: 1, active: true },
      { id: "av-34", workerId: "worker-sujatha", dayOfWeek: "WEDNESDAY", startTime: "08:30", endTime: "17:30", maxBookings: 1, active: true },
      { id: "av-35", workerId: "worker-sujatha", dayOfWeek: "THURSDAY", startTime: "08:30", endTime: "17:30", maxBookings: 1, active: true },
      { id: "av-36", workerId: "worker-sujatha", dayOfWeek: "FRIDAY", startTime: "08:30", endTime: "17:30", maxBookings: 1, active: true },
    ],
    flatAssignments: [
      { id: "fa-10", workerId: "worker-sujatha", flatId: "flat-b-102", tower: "B", flatNumber: "B-102", assignedFrom: "2024-02-01", status: "ACTIVE" },
    ],
    packages: [
      { id: "pkg-12", workerId: "worker-sujatha", categoryId: "cat-babycare", categoryName: "Baby Care / Nanny", name: "Daycare Nanny (Mon-Fri)", description: "Toddler care, feeding, learning activities, diaper changing and nap schedule", includedTasks: ["Feeding", "Playtime", "Storytelling", "Hygiene"], pricingModel: "FIXED_MONTHLY", price: 14000, frequency: "MONTHLY", active: true, createdAt: "2024-02-01" },
    ],
    createdAt: "2024-02-01",
    updatedAt: "2026-09-01",
  },
  {
    id: "worker-manoj",
    communityId: "comm-mana-1",
    workerType: "COMMUNITY_WORKER",
    displayName: "Manoj Rathod",
    phoneMasked: "91******62",
    experienceYears: 2,
    languages: ["Hindi", "Marathi"],
    verificationStatus: "PENDING",
    mobileVerified: true,
    communityVerified: false,
    securityVerified: false,
    rating: 4.5,
    reviewCount: 3,
    status: "ACTIVE",
    servingSince: "2026-08-01",
    bio: "General helper for shifting heavy boxes, furniture assembly, balcony gardening and car wash.",
    skills: [
      { id: "sk-14", workerId: "worker-manoj", categoryId: "cat-helper", categoryName: "General Helper", categoryCode: "GENERAL_HELPER", experienceYears: 2, isPrimary: true, active: true },
      { id: "sk-15", workerId: "worker-manoj", categoryId: "cat-carwash", categoryName: "Car / Bike Cleaning", categoryCode: "VEHICLE_CLEANING", experienceYears: 2, isPrimary: false, active: true },
    ],
    availability: [
      { id: "av-37", workerId: "worker-manoj", dayOfWeek: "MONDAY", startTime: "07:00", endTime: "18:00", maxBookings: 4, active: true },
      { id: "av-38", workerId: "worker-manoj", dayOfWeek: "TUESDAY", startTime: "07:00", endTime: "18:00", maxBookings: 4, active: true },
      { id: "av-39", workerId: "worker-manoj", dayOfWeek: "WEDNESDAY", startTime: "07:00", endTime: "18:00", maxBookings: 4, active: true },
      { id: "av-40", workerId: "worker-manoj", dayOfWeek: "THURSDAY", startTime: "07:00", endTime: "18:00", maxBookings: 4, active: true },
      { id: "av-41", workerId: "worker-manoj", dayOfWeek: "FRIDAY", startTime: "07:00", endTime: "18:00", maxBookings: 4, active: true },
      { id: "av-42", workerId: "worker-manoj", dayOfWeek: "SATURDAY", startTime: "07:00", endTime: "18:00", maxBookings: 4, active: true },
      { id: "av-43", workerId: "worker-manoj", dayOfWeek: "SUNDAY", startTime: "07:00", endTime: "18:00", maxBookings: 4, active: true },
    ],
    flatAssignments: [],
    packages: [
      { id: "pkg-13", workerId: "worker-manoj", categoryId: "cat-carwash", categoryName: "Car / Bike Cleaning", name: "Monthly Car Exterior & Interior Wash", description: "Daily morning exterior dusting + weekly foam water wash & interior vacuum", includedTasks: ["Dusting", "Water Wash", "Interior Vacuum"], pricingModel: "FIXED_MONTHLY", price: 1200, frequency: "MONTHLY", active: true, createdAt: "2026-08-01" },
    ],
    createdAt: "2026-08-01",
    updatedAt: "2026-09-01",
  }
];

const DEFAULT_BOOKINGS: HomeServiceBooking[] = [
  {
    id: "booking-101",
    communityId: "comm-mana-1",
    flatId: "flat-a-204",
    tower: "A",
    flatNumber: "A-204",
    residentUserId: "user-current",
    residentName: "Sandesh Patil",
    residentPhoneMasked: "98******11",
    workerId: "worker-lakshmi",
    workerName: "Lakshmi Devi",
    categoryId: "cat-maid",
    categoryName: "Maid / House Help",
    categoryCode: "MAID",
    packageId: "pkg-1",
    packageName: "Standard Daily Maid",
    bookingType: "MONTHLY",
    pricingModel: "FIXED_MONTHLY",
    startDate: "2026-09-01",
    endDate: "2027-08-31",
    recurringDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
    startTime: "08:00",
    endTime: "09:30",
    price: 3500,
    status: "CONFIRMED",
    notes: "Please ring bell and wipe kitchen slab after finishing utensils.",
    createdAt: "2026-08-25",
    updatedAt: "2026-08-26",
  },
  {
    id: "booking-102",
    communityId: "comm-mana-1",
    flatId: "flat-a-204",
    tower: "A",
    flatNumber: "A-204",
    residentUserId: "user-current",
    residentName: "Sandesh Patil",
    residentPhoneMasked: "98******11",
    workerId: "worker-suresh",
    workerName: "Suresh Kumar",
    categoryId: "cat-cook",
    categoryName: "Cook / Chef",
    categoryCode: "COOK",
    packageId: "pkg-4",
    packageName: "Breakfast & Lunch Prep",
    bookingType: "MONTHLY",
    pricingModel: "FIXED_MONTHLY",
    startDate: "2026-09-01",
    endDate: "2027-03-31",
    recurringDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
    startTime: "07:00",
    endTime: "08:00",
    price: 6000,
    status: "CONFIRMED",
    notes: "Vegetarian breakfast and light lunch for 2 members.",
    createdAt: "2026-08-20",
    updatedAt: "2026-08-22",
  }
];

const DEFAULT_ATTENDANCE: ServiceAttendance[] = [
  { id: "att-1", bookingId: "booking-101", workerId: "worker-lakshmi", residentUserId: "user-current", serviceDate: "2026-09-15", status: "COMPLETED", checkInTime: "2026-09-15T08:02:00Z", checkOutTime: "2026-09-15T09:31:00Z", markedBy: "RESIDENT", notes: "Completed on time", createdAt: "2026-09-15", updatedAt: "2026-09-15" },
  { id: "att-2", bookingId: "booking-101", workerId: "worker-lakshmi", residentUserId: "user-current", serviceDate: "2026-09-16", status: "COMPLETED", checkInTime: "2026-09-16T08:00:00Z", checkOutTime: "2026-09-16T09:28:00Z", markedBy: "RESIDENT", notes: "Thorough cleaning", createdAt: "2026-09-16", updatedAt: "2026-09-16" },
  { id: "att-3", bookingId: "booking-101", workerId: "worker-lakshmi", residentUserId: "user-current", serviceDate: "2026-09-17", status: "COMPLETED", checkInTime: "2026-09-17T08:05:00Z", checkOutTime: "2026-09-17T09:35:00Z", markedBy: "WORKER", notes: "Marked by Lakshmi", createdAt: "2026-09-17", updatedAt: "2026-09-17" },
  { id: "att-4", bookingId: "booking-101", workerId: "worker-lakshmi", residentUserId: "user-current", serviceDate: "2026-09-18", status: "LEAVE", markedBy: "WORKER", notes: "Personal leave notified in advance", createdAt: "2026-09-18", updatedAt: "2026-09-18" },
  { id: "att-5", bookingId: "booking-101", workerId: "worker-lakshmi", residentUserId: "user-current", serviceDate: "2026-09-19", status: "COMPLETED", checkInTime: "2026-09-19T08:01:00Z", checkOutTime: "2026-09-19T09:30:00Z", markedBy: "RESIDENT", notes: "Good job", createdAt: "2026-09-19", updatedAt: "2026-09-19" },
  { id: "att-6", bookingId: "booking-101", workerId: "worker-lakshmi", residentUserId: "user-current", serviceDate: "2026-09-20", status: "HOLIDAY", markedBy: "SYSTEM", notes: "Sunday Off", createdAt: "2026-09-20", updatedAt: "2026-09-20" },
  { id: "att-7", bookingId: "booking-101", workerId: "worker-lakshmi", residentUserId: "user-current", serviceDate: "2026-09-21", status: "COMPLETED", checkInTime: "2026-09-21T08:03:00Z", checkOutTime: "2026-09-21T09:30:00Z", markedBy: "RESIDENT", notes: "Completed", createdAt: "2026-09-21", updatedAt: "2026-09-21" },
  { id: "att-8", bookingId: "booking-101", workerId: "worker-lakshmi", residentUserId: "user-current", serviceDate: "2026-09-22", status: "COMPLETED", checkInTime: "2026-09-22T08:00:00Z", checkOutTime: "2026-09-22T09:30:00Z", markedBy: "RESIDENT", notes: "Today session done", createdAt: "2026-09-22", updatedAt: "2026-09-22" },
];

const DEFAULT_REVIEWS: HomeServiceReview[] = [
  {
    id: "rev-1",
    bookingId: "booking-101",
    reviewerUserId: "user-current",
    reviewerName: "Verified Resident (Flat A-204)",
    reviewerRole: "RESIDENT",
    revieweeId: "worker-lakshmi",
    rating: 5.0,
    workQuality: 5,
    punctuality: 5,
    behaviour: 5,
    reliability: 5,
    comment: "Lakshmi is exceptionally sincere and punctual. She has been managing our house cleaning and utensils flawlessly for months. Very polite and honest.",
    isAnonymous: false,
    status: "PUBLISHED",
    createdAt: "2026-08-30",
  },
  {
    id: "rev-2",
    bookingId: "booking-102",
    reviewerUserId: "user-current",
    reviewerName: "Verified Resident (Flat A-204)",
    reviewerRole: "RESIDENT",
    revieweeId: "worker-suresh",
    rating: 4.8,
    workQuality: 5,
    punctuality: 5,
    behaviour: 5,
    reliability: 4,
    comment: "Suresh cooks wonderful home-style curries and rotis. Always asks for spice preference and leaves the gas stove sparkling clean.",
    isAnonymous: false,
    status: "PUBLISHED",
    createdAt: "2026-08-28",
  }
];

const DEFAULT_REQUIREMENTS: HomeServiceRequirement[] = [
  {
    id: "req-1",
    communityId: "comm-mana-1",
    flatId: "flat-b-402",
    tower: "B",
    createdBy: "user-rohit",
    creatorName: "Rohit Verma (B-402)",
    categoryId: "cat-maid",
    categoryName: "Maid / House Help",
    frequency: "MONTHLY",
    preferredDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
    startDate: "2026-10-01",
    preferredStartTime: "08:00",
    preferredEndTime: "10:00",
    budgetMin: 3000,
    budgetMax: 4000,
    description: "Looking for an experienced maid for sweeping, mopping & utensils in 3BHK flat in Tower B.",
    status: "OPEN",
    responsesCount: 2,
    createdAt: "2026-09-20",
    updatedAt: "2026-09-20",
  }
];

const DEFAULT_RESPONSES: RequirementResponse[] = [
  {
    id: "resp-1",
    requestId: "req-1",
    workerId: "worker-lakshmi",
    workerName: "Lakshmi Devi",
    workerRating: 4.8,
    workerReviewCount: 42,
    workerExperienceYears: 6,
    proposedPrice: 3500,
    message: "I am already serving 2 flats in Tower B and can easily take the 8:30 AM slot.",
    status: "SUBMITTED",
    createdAt: "2026-09-21",
  },
  {
    id: "resp-2",
    requestId: "req-1",
    workerId: "worker-anitha",
    workerName: "Anitha Reddy",
    workerRating: 4.7,
    workerReviewCount: 29,
    workerExperienceYears: 4,
    proposedPrice: 3200,
    message: "Available from 9:00 AM onwards every morning. Can start immediately from 1st Oct.",
    status: "SUBMITTED",
    createdAt: "2026-09-21",
  }
];

const DEFAULT_REPORTS: HomeServiceReport[] = [
  {
    id: "rep-1",
    reportedBy: "Resident (Tower C-102)",
    reportedAgainst: "worker-unknown",
    reportedAgainstName: "External Vendor Agent",
    reason: "Unscheduled Gate Entry Attempt",
    description: "Vendor entered tower without booking confirmation.",
    status: "RESOLVED",
    resolution: "Security issued strict warning and updated gate scanner token check.",
    resolvedBy: "Admin Security Office",
    createdAt: "2026-09-10",
    resolvedAt: "2026-09-11",
  }
];

// ── STORAGE HELPERS ─────────────────────────────────────────────────────────

const memoryStore: Record<string, string> = {};

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(key);
      if (!raw) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(raw);
    } else {
      const raw = memoryStore[key];
      if (!raw) {
        memoryStore[key] = JSON.stringify(defaultValue);
        return defaultValue;
      }
      return JSON.parse(raw);
    }
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      memoryStore[key] = JSON.stringify(value);
    }
  } catch (e) {
    console.error("Storage write error", e);
  }
}

// ── HOME SERVICES API SERVICE ───────────────────────────────────────────────

export const homeServiceApi = {
  resetStorage(): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.clear();
      }
    } catch {
      // ignore
    }
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
    }
  },

  // Categories
  async getCategories(): Promise<ServiceCategory[]> {
    return getStorage(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES).filter((c) => c.active);
  },

  async getAllCategoriesAdmin(): Promise<ServiceCategory[]> {
    return getStorage(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
  },

  async updateCategory(category: ServiceCategory): Promise<ServiceCategory> {
    const categories = getStorage(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
    const index = categories.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      categories[index] = { ...category, updatedAt: new Date().toISOString() };
    } else {
      categories.push({ ...category, id: `cat-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    setStorage(STORAGE_KEY_CATEGORIES, categories);
    return category;
  },

  // Workers
  async getWorkers(filters?: {
    categoryId?: string;
    tower?: string;
    minRating?: number;
    searchQuery?: string;
    frequency?: string;
    maxPrice?: number;
  }): Promise<HomeServiceWorker[]> {
    let workers = getStorage(STORAGE_KEY_WORKERS, DEFAULT_WORKERS);

    if (filters?.categoryId) {
      workers = workers.filter((w) => w.skills.some((s) => s.categoryId === filters.categoryId && s.active));
    }
    if (filters?.minRating) {
      workers = workers.filter((w) => w.rating >= filters.minRating!);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      workers = workers.filter(
        (w) =>
          w.displayName.toLowerCase().includes(q) ||
          w.skills.some((s) => s.categoryName?.toLowerCase().includes(q)) ||
          w.languages.some((l) => l.toLowerCase().includes(q))
      );
    }
    if (filters?.tower) {
      workers = workers.filter((w) => w.flatAssignments.some((f) => f.tower === filters.tower));
    }
    if (filters?.maxPrice) {
      workers = workers.filter((w) => w.packages?.some((p) => p.price <= filters.maxPrice!));
    }
    return workers;
  },

  async getWorkerById(workerId: string): Promise<HomeServiceWorker | null> {
    const workers = getStorage(STORAGE_KEY_WORKERS, DEFAULT_WORKERS);
    return workers.find((w) => w.id === workerId) || null;
  },

  async updateWorkerVerification(workerId: string, status: "VERIFIED" | "REJECTED" | "SUSPENDED" | "PENDING"): Promise<HomeServiceWorker> {
    const workers = getStorage(STORAGE_KEY_WORKERS, DEFAULT_WORKERS);
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) throw new Error("Worker not found");

    worker.verificationStatus = status;
    if (status === "VERIFIED") {
      worker.communityVerified = true;
      worker.securityVerified = true;
      worker.mobileVerified = true;
    }
    if (status === "SUSPENDED") {
      worker.status = "SUSPENDED";
    }
    worker.updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEY_WORKERS, workers);
    return worker;
  },

  // Packages
  async getPackagesByWorker(workerId: string): Promise<ServicePackage[]> {
    const worker = await this.getWorkerById(workerId);
    return worker?.packages || [];
  },

  async getAllPackages(): Promise<ServicePackage[]> {
    const workers = getStorage(STORAGE_KEY_WORKERS, DEFAULT_WORKERS);
    const pkgs: ServicePackage[] = [];
    workers.forEach((w) => {
      if (w.packages) pkgs.push(...w.packages);
    });
    return pkgs;
  },

  // Bookings
  async getBookings(userId?: string): Promise<HomeServiceBooking[]> {
    const bookings = getStorage(STORAGE_KEY_BOOKINGS, DEFAULT_BOOKINGS);
    if (userId) {
      return bookings.filter((b) => b.residentUserId === userId || b.residentUserId === "user-current");
    }
    return bookings;
  },

  async getBookingById(bookingId: string): Promise<HomeServiceBooking | null> {
    const bookings = getStorage(STORAGE_KEY_BOOKINGS, DEFAULT_BOOKINGS);
    return bookings.find((b) => b.id === bookingId) || null;
  },

  async createBooking(request: {
    workerId: string;
    categoryId: string;
    packageId?: string;
    bookingType: "ONE_TIME" | "DAILY" | "WEEKLY" | "MONTHLY";
    pricingModel: PricingModel;
    startDate: string;
    endDate?: string;
    recurringDays: DayOfWeek[];
    startTime: string;
    endTime: string;
    price: number;
    flatNumber: string;
    tower: string;
    notes?: string;
  }): Promise<HomeServiceBooking> {
    const workers = getStorage(STORAGE_KEY_WORKERS, DEFAULT_WORKERS);
    const worker = workers.find((w) => w.id === request.workerId);
    if (!worker) throw new Error("Worker not found");

    // Concurrency / Availability Conflict Check
    const bookings = getStorage(STORAGE_KEY_BOOKINGS, DEFAULT_BOOKINGS);
    const conflict = bookings.find(
      (b) =>
        b.workerId === request.workerId &&
        ["CONFIRMED", "REQUESTED", "SCHEDULED"].includes(b.status) &&
        b.startTime === request.startTime &&
        b.recurringDays.some((d) => request.recurringDays.includes(d))
    );

    if (conflict) {
      throw new Error("This worker is already booked or requested for this exact time slot. Please select another slot.");
    }

    const categories = getStorage(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
    const category = categories.find((c) => c.id === request.categoryId);

    const newBooking: HomeServiceBooking = {
      id: `booking-${Date.now()}`,
      communityId: "comm-mana-1",
      flatId: `flat-${request.tower.toLowerCase()}-${request.flatNumber}`,
      tower: request.tower,
      flatNumber: request.flatNumber,
      residentUserId: "user-current",
      residentName: "Sandesh Patil",
      residentPhoneMasked: "98******11",
      workerId: worker.id,
      workerName: worker.displayName,
      categoryId: request.categoryId,
      categoryName: category?.name || "Home Service",
      categoryCode: category?.code,
      packageId: request.packageId,
      bookingType: request.bookingType,
      pricingModel: request.pricingModel,
      startDate: request.startDate,
      endDate: request.endDate,
      recurringDays: request.recurringDays,
      startTime: request.startTime,
      endTime: request.endTime,
      price: request.price,
      status: "REQUESTED",
      notes: request.notes,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    bookings.unshift(newBooking);
    setStorage(STORAGE_KEY_BOOKINGS, bookings);

    // Also update worker flat assignment list if confirmed
    return newBooking;
  },

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    reason?: string
  ): Promise<HomeServiceBooking> {
    const bookings = getStorage(STORAGE_KEY_BOOKINGS, DEFAULT_BOOKINGS);
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");

    booking.status = status;
    booking.updatedAt = new Date().toISOString().split("T")[0];

    if (status === "REJECTED") {
      booking.rejectionReason = reason || "Worker is unavailable for this schedule.";
    } else if (status === "CANCELLED_BY_RESIDENT" || status === "CANCELLED_BY_WORKER") {
      booking.cancellationReason = reason || "Cancelled by user request.";
    }

    // When booking is accepted/confirmed, assign worker to flat
    if (status === "CONFIRMED" || status === "ACCEPTED") {
      const workers = getStorage(STORAGE_KEY_WORKERS, DEFAULT_WORKERS);
      const worker = workers.find((w) => w.id === booking.workerId);
      if (worker && !worker.flatAssignments.some((f) => f.flatNumber === booking.flatNumber)) {
        worker.flatAssignments.push({
          id: `fa-${Date.now()}`,
          workerId: worker.id,
          flatId: booking.flatId,
          tower: booking.tower,
          flatNumber: booking.flatNumber,
          assignedFrom: booking.startDate,
          status: "ACTIVE",
        });
        setStorage(STORAGE_KEY_WORKERS, workers);
      }
    }

    setStorage(STORAGE_KEY_BOOKINGS, bookings);
    return booking;
  },

  // Attendance
  async getAttendance(bookingId: string): Promise<ServiceAttendance[]> {
    const all = getStorage(STORAGE_KEY_ATTENDANCE, DEFAULT_ATTENDANCE);
    return all.filter((a) => a.bookingId === bookingId).sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
  },

  async markAttendance(data: {
    bookingId: string;
    workerId: string;
    serviceDate: string;
    status: AttendanceStatus;
    notes?: string;
  }): Promise<ServiceAttendance> {
    const all = getStorage(STORAGE_KEY_ATTENDANCE, DEFAULT_ATTENDANCE);
    let record = all.find((a) => a.bookingId === data.bookingId && a.serviceDate === data.serviceDate);

    if (record) {
      record.status = data.status;
      record.notes = data.notes;
      record.updatedAt = new Date().toISOString();
    } else {
      record = {
        id: `att-${Date.now()}`,
        bookingId: data.bookingId,
        workerId: data.workerId,
        residentUserId: "user-current",
        serviceDate: data.serviceDate,
        status: data.status,
        checkInTime: data.status === "COMPLETED" ? `${data.serviceDate}T08:00:00Z` : undefined,
        checkOutTime: data.status === "COMPLETED" ? `${data.serviceDate}T09:30:00Z` : undefined,
        markedBy: "RESIDENT",
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      all.push(record);
    }

    setStorage(STORAGE_KEY_ATTENDANCE, all);
    return record;
  },

  // ── Hyperlocal Job Execution Engine (GoPrezz & Resident OTP Workflow) ──
  async getTodayJobsForResident(residentUserId = "user-current"): Promise<ServiceAttendance[]> {
    const all = getStorage(STORAGE_KEY_ATTENDANCE, DEFAULT_ATTENDANCE);
    const today = new Date().toISOString().split("T")[0];
    let todayJobs = all.filter((a) => a.residentUserId === residentUserId && a.serviceDate === today);

    // If no jobs generated for today yet, auto-populate today's active tickets with 4-digit PINs
    if (todayJobs.length === 0) {
      const bookings = getStorage(STORAGE_KEY_BOOKINGS, DEFAULT_BOOKINGS);
      const activeBookings = bookings.filter((b) => b.residentUserId === residentUserId && (b.status === "CONFIRMED" || b.status === "SCHEDULED"));
      const generated: ServiceAttendance[] = activeBookings.map((b, idx) => ({
        id: `job-today-${b.id}-${idx}`,
        bookingId: b.id,
        workerId: b.workerId,
        workerName: b.workerName,
        residentUserId: b.residentUserId,
        residentName: b.residentName || "Resident",
        serviceDate: today,
        status: idx === 0 ? "IN_PROGRESS" : "SCHEDULED",
        inTime: idx === 0 ? "06:30" : undefined,
        verificationPin: String(4820 + idx),
        vehicleNumber: b.vehicleNumber || (b.categoryCode === "VEHICLE_CLEANING" ? "TS09AB1234" : undefined),
        tower: b.tower,
        flatNumber: b.flatNumber,
        serviceCategoryName: b.categoryName,
        markedBy: "SYSTEM",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      if (generated.length > 0) {
        const merged = [...all, ...generated];
        setStorage(STORAGE_KEY_ATTENDANCE, merged);
        return generated;
      }
    }
    return todayJobs;
  },

  async getTodayJobsForWorker(workerId: string): Promise<ServiceAttendance[]> {
    const all = getStorage(STORAGE_KEY_ATTENDANCE, DEFAULT_ATTENDANCE);
    const today = new Date().toISOString().split("T")[0];
    return all.filter((a) => a.workerId === workerId && a.serviceDate === today);
  },

  async startJobWithOtp(jobId: string, otp: string): Promise<ServiceAttendance> {
    const all = getStorage<ServiceAttendance[]>(STORAGE_KEY_ATTENDANCE, DEFAULT_ATTENDANCE);
    const job = all.find((a) => a.id === jobId);
    if (!job) throw new Error("Service job record not found");

    if (job.verificationPin && job.verificationPin.trim() !== otp.trim()) {
      throw new Error("Invalid 4-Digit Service PIN. Please request the correct PIN from resident.");
    }

    job.status = "IN_PROGRESS";
    job.inTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    job.updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEY_ATTENDANCE, all);
    return job;
  },

  async completeJobWithProof(
    jobId: string,
    proof: { beforePhotoUrl?: string; afterPhotoUrl?: string; notes?: string }
  ): Promise<ServiceAttendance> {
    const all = getStorage<ServiceAttendance[]>(STORAGE_KEY_ATTENDANCE, DEFAULT_ATTENDANCE);
    const job = all.find((a) => a.id === jobId);
    if (!job) throw new Error("Service job record not found");

    job.status = "COMPLETED";
    job.outTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (proof.beforePhotoUrl) job.beforePhotoUrl = proof.beforePhotoUrl;
    if (proof.afterPhotoUrl) job.afterPhotoUrl = proof.afterPhotoUrl;
    if (proof.notes) job.notes = proof.notes;
    job.updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEY_ATTENDANCE, all);
    return job;
  },

  async rateJob(jobId: string, rating: number, reviewText?: string): Promise<ServiceAttendance> {
    const all = getStorage<ServiceAttendance[]>(STORAGE_KEY_ATTENDANCE, DEFAULT_ATTENDANCE);
    const job = all.find((a) => a.id === jobId);
    if (!job) throw new Error("Service job record not found");

    job.rating = rating;
    job.reviewText = reviewText;
    job.updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEY_ATTENDANCE, all);
    return job;
  },

  async subscribeToRecurringPackage(params: {
    workerId: string;
    workerName: string;
    categoryId: string;
    categoryName: string;
    categoryCode?: ServiceCategoryCode;
    packageName: string;
    frequency: BookingFrequency;
    vehicleNumber?: string;
    tower: string;
    flatNumber: string;
    price: number;
    startTime: string;
    endTime?: string;
    notes?: string;
  }): Promise<HomeServiceBooking> {
    const bookings = getStorage(STORAGE_KEY_BOOKINGS, DEFAULT_BOOKINGS);
    const newBooking: HomeServiceBooking = {
      id: `booking-sub-${Date.now()}`,
      communityId: "comm-mana-1",
      flatId: `flat-${params.tower}-${params.flatNumber}`,
      tower: params.tower,
      flatNumber: params.flatNumber,
      vehicleNumber: params.vehicleNumber,
      residentUserId: "user-current",
      residentName: "Sandesh Patil",
      workerId: params.workerId,
      workerName: params.workerName,
      categoryId: params.categoryId,
      categoryName: params.categoryName,
      categoryCode: params.categoryCode,
      packageName: params.packageName,
      bookingType: params.frequency,
      pricingModel: "FIXED_MONTHLY",
      startDate: new Date().toISOString().split("T")[0],
      recurringDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
      startTime: params.startTime,
      endTime: params.endTime || "08:00",
      price: params.price,
      status: "CONFIRMED",
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    setStorage(STORAGE_KEY_BOOKINGS, bookings);

    // Also auto-generate today's service ticket if start date is today
    const today = new Date().toISOString().split("T")[0];
    const attendances = getStorage(STORAGE_KEY_ATTENDANCE, DEFAULT_ATTENDANCE);
    const newTicket: ServiceAttendance = {
      id: `job-today-${newBooking.id}`,
      bookingId: newBooking.id,
      workerId: newBooking.workerId,
      workerName: newBooking.workerName,
      residentUserId: newBooking.residentUserId,
      residentName: newBooking.residentName,
      serviceDate: today,
      status: "SCHEDULED",
      verificationPin: String(Math.floor(1000 + Math.random() * 9000)),
      vehicleNumber: newBooking.vehicleNumber,
      tower: newBooking.tower,
      flatNumber: newBooking.flatNumber,
      serviceCategoryName: newBooking.categoryName,
      markedBy: "SYSTEM",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    attendances.push(newTicket);
    setStorage(STORAGE_KEY_ATTENDANCE, attendances);

    return newBooking;
  },

  calculateMonthlyBill(booking: HomeServiceBooking, attendanceRecords: ServiceAttendance[]): {
    completedDays: number;
    absentDays: number;
    leaveDays: number;
    holidayDays: number;
    totalBill: number;
    calculationNote: string;
  } {
    const completedDays = attendanceRecords.filter((a) => a.status === "COMPLETED").length;
    const absentDays = attendanceRecords.filter((a) => a.status === "ABSENT").length;
    const leaveDays = attendanceRecords.filter((a) => a.status === "LEAVE").length;
    const holidayDays = attendanceRecords.filter((a) => a.status === "HOLIDAY").length;

    let totalBill = booking.price;
    let calculationNote = "Fixed monthly contract";

    if (booking.pricingModel === "PER_DAY") {
      totalBill = completedDays * booking.price;
      calculationNote = `₹${booking.price} × ${completedDays} completed days`;
    } else if (booking.pricingModel === "PER_VISIT") {
      totalBill = completedDays * booking.price;
      calculationNote = `₹${booking.price} × ${completedDays} visits`;
    } else if (booking.pricingModel === "PER_HOUR") {
      totalBill = completedDays * 1.5 * booking.price;
      calculationNote = `₹${booking.price}/hr × ${completedDays * 1.5} estimated hours`;
    }

    return {
      completedDays,
      absentDays,
      leaveDays,
      holidayDays,
      totalBill,
      calculationNote,
    };
  },

  // Requirements & Bids
  async getRequirements(): Promise<HomeServiceRequirement[]> {
    return getStorage(STORAGE_KEY_REQUIREMENTS, DEFAULT_REQUIREMENTS);
  },

  async createRequirement(req: {
    categoryId: string;
    frequency: "ONE_TIME" | "DAILY" | "WEEKLY" | "MONTHLY";
    preferredDays: DayOfWeek[];
    startDate: string;
    preferredStartTime?: string;
    preferredEndTime?: string;
    budgetMin?: number;
    budgetMax?: number;
    tower: string;
    description: string;
  }): Promise<HomeServiceRequirement> {
    const reqs = getStorage(STORAGE_KEY_REQUIREMENTS, DEFAULT_REQUIREMENTS);
    const categories = getStorage(STORAGE_KEY_CATEGORIES, DEFAULT_CATEGORIES);
    const cat = categories.find((c) => c.id === req.categoryId);

    const newReq: HomeServiceRequirement = {
      id: `req-${Date.now()}`,
      communityId: "comm-mana-1",
      flatId: `flat-${req.tower}-curr`,
      tower: req.tower,
      createdBy: "user-current",
      creatorName: "Sandesh Patil",
      categoryId: req.categoryId,
      categoryName: cat?.name || "Service",
      frequency: req.frequency,
      preferredDays: req.preferredDays,
      startDate: req.startDate,
      preferredStartTime: req.preferredStartTime,
      preferredEndTime: req.preferredEndTime,
      budgetMin: req.budgetMin,
      budgetMax: req.budgetMax,
      description: req.description,
      status: "OPEN",
      responsesCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    reqs.unshift(newReq);
    setStorage(STORAGE_KEY_REQUIREMENTS, reqs);
    return newReq;
  },

  async getResponsesForRequirement(requestId: string): Promise<RequirementResponse[]> {
    const responses = getStorage(STORAGE_KEY_RESPONSES, DEFAULT_RESPONSES);
    return responses.filter((r) => r.requestId === requestId);
  },

  async submitWorkerResponse(bid: {
    requestId: string;
    workerId: string;
    proposedPrice: number;
    message: string;
  }): Promise<RequirementResponse> {
    const worker = await this.getWorkerById(bid.workerId);
    if (!worker) throw new Error("Worker not found");

    const responses = getStorage(STORAGE_KEY_RESPONSES, DEFAULT_RESPONSES);
    const newResponse: RequirementResponse = {
      id: `resp-${Date.now()}`,
      requestId: bid.requestId,
      workerId: worker.id,
      workerName: worker.displayName,
      workerRating: worker.rating,
      workerReviewCount: worker.reviewCount,
      workerExperienceYears: worker.experienceYears,
      proposedPrice: bid.proposedPrice,
      message: bid.message,
      status: "SUBMITTED",
      createdAt: new Date().toISOString().split("T")[0],
    };

    responses.unshift(newResponse);
    setStorage(STORAGE_KEY_RESPONSES, responses);

    // Increment response counter on requirement
    const reqs = getStorage(STORAGE_KEY_REQUIREMENTS, DEFAULT_REQUIREMENTS);
    const req = reqs.find((r) => r.id === bid.requestId);
    if (req) {
      req.responsesCount = (req.responsesCount || 0) + 1;
      setStorage(STORAGE_KEY_REQUIREMENTS, reqs);
    }

    return newResponse;
  },

  // Reviews
  async getReviews(revieweeId?: string): Promise<HomeServiceReview[]> {
    const reviews = getStorage(STORAGE_KEY_REVIEWS, DEFAULT_REVIEWS);
    if (revieweeId) {
      return reviews.filter((r) => r.revieweeId === revieweeId && r.status === "PUBLISHED");
    }
    return reviews;
  },

  async createReview(data: {
    bookingId: string;
    revieweeId: string;
    rating: number;
    workQuality: number;
    punctuality: number;
    behaviour: number;
    reliability: number;
    comment: string;
    isAnonymous?: boolean;
  }): Promise<HomeServiceReview> {
    const reviews = getStorage(STORAGE_KEY_REVIEWS, DEFAULT_REVIEWS);
    const newReview: HomeServiceReview = {
      id: `rev-${Date.now()}`,
      bookingId: data.bookingId,
      reviewerUserId: "user-current",
      reviewerName: data.isAnonymous ? "Verified Community Resident" : "Sandesh Patil (A-204)",
      reviewerRole: "RESIDENT",
      revieweeId: data.revieweeId,
      rating: data.rating,
      workQuality: data.workQuality,
      punctuality: data.punctuality,
      behaviour: data.behaviour,
      reliability: data.reliability,
      comment: data.comment,
      isAnonymous: data.isAnonymous || false,
      status: "PUBLISHED",
      createdAt: new Date().toISOString().split("T")[0],
    };

    reviews.unshift(newReview);
    setStorage(STORAGE_KEY_REVIEWS, reviews);

    // Update worker rating average
    const workers = getStorage(STORAGE_KEY_WORKERS, DEFAULT_WORKERS);
    const worker = workers.find((w) => w.id === data.revieweeId);
    if (worker) {
      const workerReviews = reviews.filter((r) => r.revieweeId === data.revieweeId);
      const totalScore = workerReviews.reduce((sum, r) => sum + r.rating, 0);
      worker.rating = Number((totalScore / workerReviews.length).toFixed(1));
      worker.reviewCount = workerReviews.length;
      setStorage(STORAGE_KEY_WORKERS, workers);
    }

    return newReview;
  },

  // Reports
  async getReports(): Promise<HomeServiceReport[]> {
    return getStorage(STORAGE_KEY_REPORTS, DEFAULT_REPORTS);
  },

  async createReport(report: {
    bookingId?: string;
    reportedAgainst: string;
    reportedAgainstName: string;
    reason: string;
    description: string;
  }): Promise<HomeServiceReport> {
    const reports = getStorage(STORAGE_KEY_REPORTS, DEFAULT_REPORTS);
    const newReport: HomeServiceReport = {
      id: `rep-${Date.now()}`,
      bookingId: report.bookingId,
      reportedBy: "Sandesh Patil (A-204)",
      reportedAgainst: report.reportedAgainst,
      reportedAgainstName: report.reportedAgainstName,
      reason: report.reason,
      description: report.description,
      status: "PENDING",
      createdAt: new Date().toISOString().split("T")[0],
    };
    reports.unshift(newReport);
    setStorage(STORAGE_KEY_REPORTS, reports);
    return newReport;
  },

  // Contextual In-App Chat
  async getChatMessages(bookingId: string): Promise<ContextualChatMessage[]> {
    const messages = getStorage<ContextualChatMessage[]>(STORAGE_KEY_CHAT, [
      { id: "msg-1", bookingId: "booking-101", senderId: "worker-lakshmi", senderName: "Lakshmi Devi", senderRole: "WORKER", message: "Namaste sir, I will arrive at 8:05 AM tomorrow.", createdAt: "2026-09-22T07:30:00Z" },
      { id: "msg-2", bookingId: "booking-101", senderId: "user-current", senderName: "Sandesh Patil", senderRole: "RESIDENT", message: "Sure Lakshmi, please ring the main door bell.", createdAt: "2026-09-22T07:32:00Z" },
    ]);
    return messages.filter((m) => m.bookingId === bookingId);
  },

  async sendChatMessage(bookingId: string, message: string): Promise<ContextualChatMessage> {
    const messages = getStorage<ContextualChatMessage[]>(STORAGE_KEY_CHAT, []);
    const newMsg: ContextualChatMessage = {
      id: `msg-${Date.now()}`,
      bookingId,
      senderId: "user-current",
      senderName: "Sandesh Patil (Flat A-204)",
      senderRole: "RESIDENT",
      message,
      createdAt: new Date().toISOString(),
    };
    messages.push(newMsg);
    setStorage(STORAGE_KEY_CHAT, messages);
    return newMsg;
  },

  // Security Gate Pass Simulator
  async getGatePass(workerId: string): Promise<GatePassRecord> {
    const worker = await this.getWorkerById(workerId);
    return {
      id: `gp-${workerId}`,
      workerId: workerId,
      workerName: worker?.displayName || "Worker",
      qrTokenHash: `MANA-SEC-QR-${workerId.toUpperCase()}-2026`,
      validFrom: "2026-09-01T00:00:00Z",
      validTo: "2026-12-31T23:59:59Z",
      status: "ACTIVE",
      lastEntryAt: "2026-09-22T07:55:00Z",
      lastExitAt: "2026-09-22T10:15:00Z",
      history: [
        { type: "ENTRY", timestamp: "2026-09-22 07:55 AM", gateNumber: "Gate 1 (Main Entrance)", verifiedBy: "Security Guard Ramesh" },
        { type: "EXIT", timestamp: "2026-09-22 10:15 AM", gateNumber: "Gate 2 (North Exit)", verifiedBy: "Security Guard Suresh" },
      ]
    };
  },

  // Admin Analytics
  async getAdminAnalytics(): Promise<{
    totalWorkers: number;
    verifiedWorkers: number;
    activeBookings: number;
    monthlyServices: number;
    pendingRequests: number;
    openReports: number;
  }> {
    const workers = getStorage(STORAGE_KEY_WORKERS, DEFAULT_WORKERS);
    const bookings = getStorage(STORAGE_KEY_BOOKINGS, DEFAULT_BOOKINGS);
    const requirements = getStorage(STORAGE_KEY_REQUIREMENTS, DEFAULT_REQUIREMENTS);
    const reports = getStorage(STORAGE_KEY_REPORTS, DEFAULT_REPORTS);

    return {
      totalWorkers: workers.length,
      verifiedWorkers: workers.filter((w) => w.verificationStatus === "VERIFIED").length,
      activeBookings: bookings.filter((b) => b.status === "CONFIRMED" || b.status === "SCHEDULED").length,
      monthlyServices: bookings.filter((b) => b.bookingType === "MONTHLY").length,
      pendingRequests: requirements.filter((r) => r.status === "OPEN").length,
      openReports: reports.filter((r) => r.status === "PENDING" || r.status === "UNDER_REVIEW").length,
    };
  }
};
