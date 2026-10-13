// manaBillsAutopayService.ts - Recurring Bills, CRED/PhonePe-inspired Reminders, e-Mandates & Community Autopay Engine
import { safeStorage } from "../../utils/storage";

export type BillCategory =
  | "MAINTENANCE"          // Society maintenance, sinking fund, water/backup
  | "EVENT_INSTALLMENT"     // Community festival passes, tournament fees
  | "TRIP_PAYMENT"          // Community trips, pilgrimage yatra instalments
  | "PERSONAL_RECURRING"    // Personal recurring expenses in My Money (Rent, Maid, Wifi, etc.)
  | "FACILITY_MEMBERSHIP";  // Clubhouse gym, EV charging bay subscription

export type MandateProvider = "UPI_AUTOPAY" | "ENACH" | "CARD_RECURRING" | "RAZORPAY_MANDATE";

export type MandateStatus = "ACTIVE" | "PENDING_AUTH" | "PAUSED" | "REVOKED" | "EXPIRED";

export type BillStatus = "DUE" | "UPCOMING" | "PAID" | "OVERDUE" | "PROCESSING";

export interface PaymentMandate {
  id: string;
  mandateRef: string; // e.g. UMN-MANA-2026-892147
  provider: MandateProvider;
  accountRef: string; // UPI ID (resident@okhdfcbank) or Card ••••4821 or Bank A/C
  bankName: string;
  maxAmountCap: number; // Regulatory upper bound e.g. ₹15,000
  frequency: "MONTHLY" | "QUARTERLY" | "AS_PRESENTED";
  status: MandateStatus;
  authorizedAt: string;
  expiresAt: string;
  billCategory: BillCategory;
  linkedBillTitle?: string;
  preDebitNotificationHours: number; // e.g. 48h regulatory notice
  lastDebitAt?: string;
  lastDebitAmount?: number;
  nextDebitScheduled?: string;
  authMethod: "NET_BANKING_OTP" | "DEBIT_CARD_PIN" | "UPI_PIN";
}

export interface ManaRecurringBill {
  id: string;
  category: BillCategory;
  title: string;
  subtitle: string;
  billerName: string;
  billerIcon?: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  referenceNumber: string; // INV-2026-302A, TRIP-881, etc.
  gracePeriodDays: number;
  gracePeriodEndsAt: string;
  lateFeeConfig?: {
    type: "FLAT" | "PERCENTAGE";
    rate: number;
    appliedAmount: number;
  };
  hasActiveMandate: boolean;
  mandateId?: string;
  preDebitNotified: boolean;
  preDebitNoticeDate?: string;
  breakdown?: { label: string; amount: number }[];
  sourceType: "COMMUNITY_SOCIETY" | "EVENT" | "TRIP" | "MY_MONEY_PERSONAL";
  sourceId?: string;
  paymentModesAllowed: ("UPI" | "CARD" | "NET_BANKING" | "WALLET" | "MANDATE")[];
  autoDebitScheduledDate?: string;
}

export interface AdminRecurringInvoiceSchedule {
  id: string;
  scheduleName: string;
  billCategory: BillCategory;
  billingCycleDay: number; // Day of the month to generate (e.g., 1st)
  dueDays: number; // Days after generation until due date (e.g., 10 days)
  gracePeriodDays: number; // Days after due date before late fees apply (e.g., 5 days)
  lateFeeType: "FLAT" | "PERCENTAGE_PER_MONTH";
  lateFeeValue: number; // e.g., 2% or ₹250
  lateFeeCap: number; // Maximum penalty cap e.g., ₹5000
  autoDebitLeadDays: number; // Days before due date to execute autopay (e.g., 2 days)
  preDebitNoticeLeadHours: number; // 48h
  isActive: boolean;
  totalSubscribers: number;
  mandatesActiveCount: number;
}

export interface PreDebitNotificationLog {
  id: string;
  billId: string;
  billTitle: string;
  amount: number;
  mandateRef: string;
  scheduledDebitDate: string;
  sentAt: string;
  channels: ("SMS" | "WHATSAPP" | "PUSH" | "EMAIL")[];
  status: "SENT" | "DELIVERED" | "ACKNOWLEDGED" | "OPTED_OUT";
  optOutUrlToken?: string;
}

// Initial Data Setup
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const INITIAL_MANDATES: PaymentMandate[] = [
  {
    id: "mandate-01",
    mandateRef: "UMN-MANA-2026-992147",
    provider: "UPI_AUTOPAY",
    accountRef: "resident.302@okhdfcbank",
    bankName: "HDFC Bank",
    maxAmountCap: 15000,
    frequency: "MONTHLY",
    status: "ACTIVE",
    authorizedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    billCategory: "MAINTENANCE",
    linkedBillTitle: "Monthly Society Maintenance (Flat 302)",
    preDebitNotificationHours: 48,
    lastDebitAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastDebitAmount: 6950,
    nextDebitScheduled: addDays(4),
    authMethod: "UPI_PIN",
  },
  {
    id: "mandate-02",
    mandateRef: "UMN-MANA-2026-440182",
    provider: "ENACH",
    accountRef: "••••••••4821 (ICICI Bank)",
    bankName: "ICICI Bank",
    maxAmountCap: 8000,
    frequency: "MONTHLY",
    status: "ACTIVE",
    authorizedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
    billCategory: "FACILITY_MEMBERSHIP",
    linkedBillTitle: "Clubhouse Gym & EV Basement Slot",
    preDebitNotificationHours: 48,
    lastDebitAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    lastDebitAmount: 2200,
    nextDebitScheduled: addDays(12),
    authMethod: "NET_BANKING_OTP",
  },
  {
    id: "mandate-03",
    mandateRef: "UMN-MANA-2026-118832",
    provider: "CARD_RECURRING",
    accountRef: "MasterCard ••••9012",
    bankName: "Axis Bank",
    maxAmountCap: 5000,
    frequency: "MONTHLY",
    status: "PAUSED",
    authorizedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 270 * 86400000).toISOString(),
    billCategory: "PERSONAL_RECURRING",
    linkedBillTitle: "Broadband & Fiber Mesh Subscription",
    preDebitNotificationHours: 48,
    authMethod: "DEBIT_CARD_PIN",
  },
];

const INITIAL_BILLS: ManaRecurringBill[] = [
  {
    id: "bill-01",
    category: "MAINTENANCE",
    title: "Flat 302 Monthly Maintenance",
    subtitle: "Regular maintenance, sinking fund & backup power",
    billerName: "Mana Serene Heights RWA",
    amount: 6950,
    dueDate: addDays(6),
    status: "DUE",
    referenceNumber: `INV-${currentYear}${String(currentMonth + 1).padStart(2, "0")}-302A`,
    gracePeriodDays: 5,
    gracePeriodEndsAt: addDays(11),
    lateFeeConfig: {
      type: "PERCENTAGE",
      rate: 2.0,
      appliedAmount: 0,
    },
    hasActiveMandate: true,
    mandateId: "mandate-01",
    preDebitNotified: true,
    preDebitNoticeDate: addDays(-1),
    autoDebitScheduledDate: addDays(4),
    breakdown: [
      { label: "Regular Maintenance (1,200 sq.ft)", amount: 4200 },
      { label: "Sinking / Corpus Fund", amount: 1000 },
      { label: "Water & DG Backup", amount: 1250 },
      { label: "Covered Parking Slot", amount: 500 },
    ],
    sourceType: "COMMUNITY_SOCIETY",
    sourceId: "flat-302",
    paymentModesAllowed: ["UPI", "CARD", "NET_BANKING", "WALLET", "MANDATE"],
  },
  {
    id: "bill-02",
    category: "TRIP_PAYMENT",
    title: "Kedarnath Pilgrimage Yatra (Instalment 2 of 3)",
    subtitle: "Community spiritual excursion · 2 Passengers confirmed",
    billerName: "Mana Community Trips Club",
    amount: 14000,
    dueDate: addDays(9),
    status: "DUE",
    referenceNumber: "TRIP-2026-KEDAR-INS2",
    gracePeriodDays: 3,
    gracePeriodEndsAt: addDays(12),
    lateFeeConfig: {
      type: "FLAT",
      rate: 350,
      appliedAmount: 0,
    },
    hasActiveMandate: false,
    preDebitNotified: false,
    breakdown: [
      { label: "Helicopter Booking & Hotel Accommodation (P1)", amount: 7000 },
      { label: "Helicopter Booking & Hotel Accommodation (P2)", amount: 7000 },
    ],
    sourceType: "TRIP",
    sourceId: "trip-001",
    paymentModesAllowed: ["UPI", "CARD", "NET_BANKING"],
  },
  {
    id: "bill-03",
    category: "EVENT_INSTALLMENT",
    title: "Diwali Grand Carnival Mega Pass (Final Payment)",
    subtitle: "Clubhouse Amphitheatre & Gala Dinner (Family 4-Pack)",
    billerName: "Mana Cultural Committee",
    amount: 3200,
    dueDate: addDays(3),
    status: "DUE",
    referenceNumber: "EVT-DIWALI-PASS-302",
    gracePeriodDays: 2,
    gracePeriodEndsAt: addDays(5),
    lateFeeConfig: {
      type: "FLAT",
      rate: 200,
      appliedAmount: 0,
    },
    hasActiveMandate: false,
    preDebitNotified: false,
    breakdown: [
      { label: "Gala Dinner Passes (2 Adults, 2 Kids)", amount: 2800 },
      { label: "Carnival Game Tokens & Rangoli Kit", amount: 400 },
    ],
    sourceType: "EVENT",
    sourceId: "evt-diwali-2026",
    paymentModesAllowed: ["UPI", "CARD", "NET_BANKING", "WALLET"],
  },
  {
    id: "bill-04",
    category: "FACILITY_MEMBERSHIP",
    title: "Clubhouse Gym & EV Basement Bay",
    subtitle: "Monthly wellness pass & reserved slow-charger slot #B-14",
    billerName: "Mana Sports & Facilities Wing",
    amount: 2200,
    dueDate: addDays(14),
    status: "UPCOMING",
    referenceNumber: "FAC-GYM-EV-2026-OCT",
    gracePeriodDays: 4,
    gracePeriodEndsAt: addDays(18),
    hasActiveMandate: true,
    mandateId: "mandate-02",
    preDebitNotified: false,
    autoDebitScheduledDate: addDays(12),
    breakdown: [
      { label: "Gym & Steam Room Membership", amount: 1500 },
      { label: "EV Bay Access & Line Rent", amount: 700 },
    ],
    sourceType: "COMMUNITY_SOCIETY",
    sourceId: "fac-gym-302",
    paymentModesAllowed: ["UPI", "CARD", "NET_BANKING", "WALLET", "MANDATE"],
  },
  {
    id: "bill-05",
    category: "PERSONAL_RECURRING",
    title: "Airtel Xstream Fiber Mesh WiFi",
    subtitle: "High-speed 300 Mbps broadband + OTT package (My Money)",
    billerName: "Airtel Telecommunications",
    amount: 1179,
    dueDate: addDays(5),
    status: "DUE",
    referenceNumber: "BILL-AIRTEL-98442",
    gracePeriodDays: 2,
    gracePeriodEndsAt: addDays(7),
    hasActiveMandate: false,
    preDebitNotified: false,
    breakdown: [
      { label: "300 Mbps Monthly Plan", amount: 999 },
      { label: "GST (18%)", amount: 180 },
    ],
    sourceType: "MY_MONEY_PERSONAL",
    sourceId: "rec-broadband",
    paymentModesAllowed: ["UPI", "CARD", "NET_BANKING"],
  },
  {
    id: "bill-06",
    category: "MAINTENANCE",
    title: "Flat 302 Monthly Maintenance (Previous Cycle)",
    subtitle: "Regular maintenance, sinking fund & backup power",
    billerName: "Mana Serene Heights RWA",
    amount: 6950,
    dueDate: addDays(-25),
    status: "PAID",
    referenceNumber: `INV-${currentYear}${String(currentMonth).padStart(2, "0")}-302A`,
    gracePeriodDays: 5,
    gracePeriodEndsAt: addDays(-20),
    hasActiveMandate: true,
    mandateId: "mandate-01",
    preDebitNotified: true,
    breakdown: [
      { label: "Regular Maintenance", amount: 4200 },
      { label: "Sinking Fund", amount: 1000 },
      { label: "Water & DG Backup", amount: 1250 },
      { label: "Covered Parking Slot", amount: 500 },
    ],
    sourceType: "COMMUNITY_SOCIETY",
    sourceId: "flat-302",
    paymentModesAllowed: ["UPI", "CARD", "NET_BANKING", "WALLET", "MANDATE"],
  },
];

const INITIAL_SCHEDULES: AdminRecurringInvoiceSchedule[] = [
  {
    id: "sched-01",
    scheduleName: "Monthly Society Maintenance Cycle",
    billCategory: "MAINTENANCE",
    billingCycleDay: 1,
    dueDays: 10,
    gracePeriodDays: 5,
    lateFeeType: "PERCENTAGE_PER_MONTH",
    lateFeeValue: 2.0,
    lateFeeCap: 5000,
    autoDebitLeadDays: 2,
    preDebitNoticeLeadHours: 48,
    isActive: true,
    totalSubscribers: 120,
    mandatesActiveCount: 78,
  },
  {
    id: "sched-02",
    scheduleName: "Basement EV Charging Infrastructure",
    billCategory: "FACILITY_MEMBERSHIP",
    billingCycleDay: 5,
    dueDays: 10,
    gracePeriodDays: 3,
    lateFeeType: "FLAT",
    lateFeeValue: 150,
    lateFeeCap: 1000,
    autoDebitLeadDays: 2,
    preDebitNoticeLeadHours: 48,
    isActive: true,
    totalSubscribers: 42,
    mandatesActiveCount: 36,
  },
  {
    id: "sched-03",
    scheduleName: "Clubhouse Gymnasium Membership",
    billCategory: "FACILITY_MEMBERSHIP",
    billingCycleDay: 1,
    dueDays: 7,
    gracePeriodDays: 2,
    lateFeeType: "FLAT",
    lateFeeValue: 100,
    lateFeeCap: 500,
    autoDebitLeadDays: 1,
    preDebitNoticeLeadHours: 48,
    isActive: true,
    totalSubscribers: 88,
    mandatesActiveCount: 54,
  },
];

const STORAGE_KEYS = {
  BILLS: "mana_bills_v2",
  MANDATES: "mana_mandates_v2",
  SCHEDULES: "mana_recurring_schedules_v2",
  NOTIFICATIONS: "mana_pre_debit_notifications_v2",
};

interface LocalBillsStore {
  bills: ManaRecurringBill[];
  mandates: PaymentMandate[];
  schedules: AdminRecurringInvoiceSchedule[];
  notifications: PreDebitNotificationLog[];
}

function loadStore(): LocalBillsStore {
  try {
    const rawBills = safeStorage.getItem(STORAGE_KEYS.BILLS);
    const rawMandates = safeStorage.getItem(STORAGE_KEYS.MANDATES);
    const rawSchedules = safeStorage.getItem(STORAGE_KEYS.SCHEDULES);
    const rawNotifs = safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);

    return {
      bills: rawBills ? JSON.parse(rawBills) : INITIAL_BILLS,
      mandates: rawMandates ? JSON.parse(rawMandates) : INITIAL_MANDATES,
      schedules: rawSchedules ? JSON.parse(rawSchedules) : INITIAL_SCHEDULES,
      notifications: rawNotifs ? JSON.parse(rawNotifs) : [],
    };
  } catch {
    return {
      bills: INITIAL_BILLS,
      mandates: INITIAL_MANDATES,
      schedules: INITIAL_SCHEDULES,
      notifications: [],
    };
  }
}

function saveStore(store: LocalBillsStore) {
  try {
    safeStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(store.bills));
    safeStorage.setItem(STORAGE_KEYS.MANDATES, JSON.stringify(store.mandates));
    safeStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(store.schedules));
    safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(store.notifications));
  } catch {}
}

export const manaBillsAutopayService = {
  getBills(category?: BillCategory): ManaRecurringBill[] {
    const store = loadStore();
    if (!category) return store.bills;
    return store.bills.filter((b) => b.category === category);
  },

  getMandates(): PaymentMandate[] {
    return loadStore().mandates;
  },

  getSchedules(): AdminRecurringInvoiceSchedule[] {
    return loadStore().schedules;
  },

  getPreDebitNotifications(): PreDebitNotificationLog[] {
    return loadStore().notifications;
  },

  authorizeNewMandate(req: {
    billId?: string;
    billCategory: BillCategory;
    linkedBillTitle: string;
    provider: MandateProvider;
    accountRef: string;
    bankName: string;
    maxAmountCap: number;
    frequency: "MONTHLY" | "QUARTERLY" | "AS_PRESENTED";
    authMethod: "NET_BANKING_OTP" | "DEBIT_CARD_PIN" | "UPI_PIN";
  }): PaymentMandate {
    const store = loadStore();
    const newMandate: PaymentMandate = {
      id: `mandate-${Date.now()}`,
      mandateRef: `UMN-MANA-${currentYear}-${Math.floor(100000 + Math.random() * 900000)}`,
      provider: req.provider,
      accountRef: req.accountRef,
      bankName: req.bankName,
      maxAmountCap: req.maxAmountCap,
      frequency: req.frequency,
      status: "ACTIVE",
      authorizedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      billCategory: req.billCategory,
      linkedBillTitle: req.linkedBillTitle,
      preDebitNotificationHours: 48,
      nextDebitScheduled: addDays(4),
      authMethod: req.authMethod,
    };

    store.mandates.unshift(newMandate);

    // Link mandate to bill if provided
    if (req.billId) {
      store.bills = store.bills.map((b) => {
        if (b.id === req.billId) {
          return {
            ...b,
            hasActiveMandate: true,
            mandateId: newMandate.id,
            autoDebitScheduledDate: addDays(4),
          };
        }
        return b;
      });
    }

    saveStore(store);
    return newMandate;
  },

  updateMandateStatus(mandateId: string, status: MandateStatus): PaymentMandate | null {
    const store = loadStore();
    let updated: PaymentMandate | null = null;
    store.mandates = store.mandates.map((m) => {
      if (m.id === mandateId) {
        updated = { ...m, status };
        return updated;
      }
      return m;
    });

    store.bills = store.bills.map((b) => {
      if (b.mandateId === mandateId) {
        const isActive = status === "ACTIVE";
        return {
          ...b,
          hasActiveMandate: isActive,
          autoDebitScheduledDate: isActive ? b.autoDebitScheduledDate : undefined,
        };
      }
      return b;
    });

    saveStore(store);
    return updated;
  },

  recordBillPayment(billId: string, paymentMode: string): ManaRecurringBill | null {
    const store = loadStore();
    let target: ManaRecurringBill | null = null;

    store.bills = store.bills.map((b) => {
      if (b.id === billId) {
        target = {
          ...b,
          status: "PAID",
          dueDate: new Date().toISOString(),
        };
        return target;
      }
      return b;
    });

    saveStore(store);
    return target;
  },

  sendPreDebitNotification(billId: string): PreDebitNotificationLog | null {
    const store = loadStore();
    const bill = store.bills.find((b) => b.id === billId);
    if (!bill) return null;

    const notif: PreDebitNotificationLog = {
      id: `notif-${Date.now()}`,
      billId: bill.id,
      billTitle: bill.title,
      amount: bill.amount,
      mandateRef: bill.mandateId ? "UMN-MANA-AUTH-CONFIRMED" : "MANUAL-DUE-ALERT",
      scheduledDebitDate: bill.autoDebitScheduledDate || bill.dueDate,
      sentAt: new Date().toISOString(),
      channels: ["PUSH", "SMS", "WHATSAPP"],
      status: "DELIVERED",
      optOutUrlToken: `optout_${Math.random().toString(36).substring(7)}`,
    };

    store.notifications.unshift(notif);
    store.bills = store.bills.map((b) => (b.id === billId ? { ...b, preDebitNotified: true, preDebitNoticeDate: new Date().toISOString() } : b));
    saveStore(store);
    return notif;
  },

  saveAdminSchedule(schedule: AdminRecurringInvoiceSchedule): AdminRecurringInvoiceSchedule {
    const store = loadStore();
    const idx = store.schedules.findIndex((s) => s.id === schedule.id);
    if (idx >= 0) {
      store.schedules[idx] = schedule;
    } else {
      store.schedules.push(schedule);
    }
    saveStore(store);
    return schedule;
  },

  getSummaryMetrics() {
    const store = loadStore();
    const dueBills = store.bills.filter((b) => b.status === "DUE" || b.status === "OVERDUE");
    const totalDue = dueBills.reduce((acc, curr) => acc + curr.amount, 0);
    const activeMandatesCount = store.mandates.filter((m) => m.status === "ACTIVE").length;
    const nextAutopayBill = store.bills.find((b) => b.hasActiveMandate && b.status === "DUE");

    return {
      totalDue,
      dueCount: dueBills.length,
      activeMandatesCount,
      nextAutopayAmount: nextAutopayBill ? nextAutopayBill.amount : 0,
      nextAutopayDate: nextAutopayBill ? nextAutopayBill.autoDebitScheduledDate : null,
      savedTimeHrs: activeMandatesCount * 1.5,
    };
  },
};

