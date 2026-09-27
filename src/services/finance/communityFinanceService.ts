// communityFinanceService.ts - Complete Maintenance Billing, Ledger & Accounting Client Service
export type BillStatus = "PAID" | "PARTIAL" | "OVERDUE" | "PENDING" | "ISSUED" | "CANCELLED";
export type CalculationType = "FIXED_PER_FLAT" | "PER_SQUARE_FEET" | "HYBRID" | "FLAT_TYPE" | "TOWER" | "PARKING";
export type PaymentMode = "UPI" | "CARD" | "NET_BANKING" | "BANK_TRANSFER" | "WALLET" | "CHEQUE" | "CASH";
export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
export type EntryType = "DEBIT" | "CREDIT";

export interface BillCharge {
  item: string;
  amount: number;
  componentType?: string;
}

export interface MaintenanceBill {
  id: string;
  billNumber: string;
  flatNumber: string;
  tower: string;
  month: number;
  year: number;
  charges: BillCharge[];
  subtotal: number;
  penaltyAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: BillStatus;
  generatedAt: string;
  paidAt?: string;
  receiptNumber?: string;
  pdfUrl?: string;
}

export interface MaintenancePlan {
  id: string;
  name: string;
  calculationType: CalculationType;
  fixedAmountPerFlat: number;
  ratePerSqFt: number;
  billingFrequency: string;
  isActive: boolean;
}

export interface ChargeRule {
  id: string;
  ruleName: string;
  componentType: string;
  calculationType: string;
  rate: number;
  tower?: string;
  flatType?: string;
  isActive: boolean;
}

export interface PenaltyConfig {
  gracePeriodDays: number;
  penaltyType: string;
  penaltyValue: number;
  maxPenaltyCap: number;
}

export interface AgingBucket {
  period: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface FinanceSummary {
  totalCollected: number;
  totalDue: number;
  totalOverdue: number;
  collectionPercent: number;
  activeFlats: number;
  paidFlats: number;
  overdueFlats: number;
  agingBuckets: AgingBucket[];
  towerPerformance: { tower: string; billed: number; collected: number; percent: number }[];
}

export interface GeneralLedgerEntry {
  id: string;
  accountCode: string;
  accountName: string;
  entryType: EntryType;
  amount: number;
  notes?: string;
}

export interface GeneralLedgerTransaction {
  id: string;
  transactionRef: string;
  transactionDate: string;
  referenceType: string;
  referenceId: string;
  narration: string;
  totalAmount: number;
  entries: GeneralLedgerEntry[];
}

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitAmount: number;
  creditAmount: number;
}

export interface AdvanceWallet {
  flatNumber: string;
  balanceAmount: number;
  totalDeposited: number;
  totalUtilized: number;
  lastUpdated: string;
}

export interface CommunityReceipt {
  receiptNumber: string;
  receiptDate: string;
  invoiceNumber: string;
  flatNumber: string;
  tower: string;
  amountPaid: number;
  paymentMode: PaymentMode;
  transactionRef: string;
  payerName: string;
  allocations: { item: string; amount: number }[];
}

// ── In-Memory Sample Foundation & Fallback ────────────────────────────────────
const now = new Date();
const cm = now.getMonth() + 1;
const cy = now.getFullYear();
const pm = cm === 1 ? 12 : cm - 1;
const py = cm === 1 ? cy - 1 : cy;

const DEFAULT_PLANS: MaintenancePlan[] = [
  { id: "plan-01", name: "Standard 2BHK Plan (Fixed)", calculationType: "FIXED_PER_FLAT", fixedAmountPerFlat: 3500, ratePerSqFt: 0, billingFrequency: "MONTHLY", isActive: true },
  { id: "plan-02", name: "Area Based Plan (₹3.80 / sq.ft)", calculationType: "PER_SQUARE_FEET", fixedAmountPerFlat: 0, ratePerSqFt: 3.80, billingFrequency: "MONTHLY", isActive: true },
  { id: "plan-03", name: "Penthouse & 4BHK Hybrid", calculationType: "HYBRID", fixedAmountPerFlat: 2000, ratePerSqFt: 3.00, billingFrequency: "MONTHLY", isActive: true },
];

const DEFAULT_RULES: ChargeRule[] = [
  { id: "rule-01", ruleName: "Base Maintenance", componentType: "MAINTENANCE", calculationType: "PER_SQUARE_FEET", rate: 3.50, isActive: true },
  { id: "rule-02", ruleName: "Sinking Fund Reserve", componentType: "SINKING_FUND", calculationType: "FIXED_PER_FLAT", rate: 1000, isActive: true },
  { id: "rule-03", ruleName: "Common Water Utility", componentType: "WATER", calculationType: "FIXED_PER_FLAT", rate: 450, isActive: true },
  { id: "rule-04", ruleName: "DG Power Backup", componentType: "POWER_BACKUP", calculationType: "FIXED_PER_FLAT", rate: 800, isActive: true },
  { id: "rule-05", ruleName: "Covered Parking Slot", componentType: "PARKING", calculationType: "FIXED_PER_FLAT", rate: 500, isActive: true },
];

const SAMPLE_BILLS: MaintenanceBill[] = [
  {
    id: "b-01",
    billNumber: `INV-${cy}${String(cm).padStart(2, "0")}-302A`,
    flatNumber: "302",
    tower: "A",
    month: cm,
    year: cy,
    charges: [
      { item: "Regular Maintenance (1200 sq.ft @ ₹3.50)", amount: 4200, componentType: "MAINTENANCE" },
      { item: "Sinking / Capital Asset Fund", amount: 1000, componentType: "SINKING_FUND" },
      { item: "Water Charges (Common Borewell)", amount: 450, componentType: "WATER" },
      { item: "Power Backup (1 kVA generator)", amount: 800, componentType: "POWER_BACKUP" },
      { item: "Basement Parking Slot B-12", amount: 500, componentType: "PARKING" },
    ],
    subtotal: 6950,
    penaltyAmount: 0,
    discountAmount: 0,
    totalAmount: 6950,
    paidAmount: 0,
    dueAmount: 6950,
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: "PENDING",
    generatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "b-02",
    billNumber: `INV-${py}${String(pm).padStart(2, "0")}-302A`,
    flatNumber: "302",
    tower: "A",
    month: pm,
    year: py,
    charges: [
      { item: "Regular Maintenance", amount: 4200 },
      { item: "Sinking Fund", amount: 1000 },
      { item: "Water & Backup", amount: 1250 },
      { item: "Parking", amount: 500 },
    ],
    subtotal: 6950,
    penaltyAmount: 0,
    discountAmount: 0,
    totalAmount: 6950,
    paidAmount: 6950,
    dueAmount: 0,
    dueDate: new Date(Date.now() - 25 * 86400000).toISOString(),
    status: "PAID",
    generatedAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 27 * 86400000).toISOString(),
    receiptNumber: `REC-${py}${String(pm).padStart(2, "0")}-9912`,
  },
  {
    id: "b-03",
    billNumber: `INV-${cy}${String(cm).padStart(2, "0")}-204B`,
    flatNumber: "204",
    tower: "B",
    month: cm,
    year: cy,
    charges: [
      { item: "Regular Maintenance (1450 sq.ft)", amount: 5075 },
      { item: "Sinking Fund", amount: 1000 },
      { item: "Water Charges", amount: 450 },
      { item: "Power Backup", amount: 800 },
      { item: "2 Parking Slots", amount: 1000 },
    ],
    subtotal: 8325,
    penaltyAmount: 250,
    discountAmount: 0,
    totalAmount: 8575,
    paidAmount: 0,
    dueAmount: 8575,
    dueDate: new Date(Date.now() - 8 * 86400000).toISOString(),
    status: "OVERDUE",
    generatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "b-04",
    billNumber: `INV-${cy}${String(cm).padStart(2, "0")}-501C`,
    flatNumber: "501",
    tower: "C",
    month: cm,
    year: cy,
    charges: [
      { item: "Regular Maintenance", amount: 4500 },
      { item: "Sinking Fund", amount: 1000 },
      { item: "Water & Utilities", amount: 1250 },
    ],
    subtotal: 6750,
    penaltyAmount: 0,
    discountAmount: 0,
    totalAmount: 6750,
    paidAmount: 3500,
    dueAmount: 3250,
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: "PARTIAL",
    generatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

const SAMPLE_LEDGER_TRANSACTIONS: GeneralLedgerTransaction[] = [
  {
    id: "tx-01",
    transactionRef: "TX-INV-202610-001",
    transactionDate: "2026-10-01",
    referenceType: "INVOICE_CYCLE",
    referenceId: "cycle-202610",
    narration: "October 2026 Monthly Maintenance Cycle Invoices Dispatched (120 Flats)",
    totalAmount: 840000,
    entries: [
      { id: "e-01", accountCode: "1100", accountName: "Resident Maintenance Receivable", entryType: "DEBIT", amount: 840000, notes: "Total receivable booked" },
      { id: "e-02", accountCode: "4000", accountName: "Maintenance Fee Revenue", entryType: "CREDIT", amount: 620000, notes: "Monthly service charges" },
      { id: "e-03", accountCode: "2100", accountName: "Sinking / Corpus Fund Reserve", entryType: "CREDIT", amount: 120000, notes: "Capital reserve fund" },
      { id: "e-04", accountCode: "4100", accountName: "Water & Utility Charges Revenue", entryType: "CREDIT", amount: 54000, notes: "Borewell & common utility" },
      { id: "e-05", accountCode: "4200", accountName: "Parking & Facility Fee Revenue", entryType: "CREDIT", amount: 46000, notes: "Basement parking allocation" },
    ],
  },
  {
    id: "tx-02",
    transactionRef: "TX-PAY-202610-089",
    transactionDate: "2026-10-04",
    referenceType: "PAYMENT",
    referenceId: "pay-891",
    narration: "Resident Payment - Flat 302 Tower A via UPI (Ref: HDFC9912048)",
    totalAmount: 6950,
    entries: [
      { id: "e-06", accountCode: "1000", accountName: "Bank & Cash Clearing", entryType: "DEBIT", amount: 6950, notes: "HDFC Payment Gateway settlement" },
      { id: "e-07", accountCode: "1100", accountName: "Resident Maintenance Receivable", entryType: "CREDIT", amount: 6950, notes: "Clear October dues for flat 302" },
    ],
  },
];

export const communityFinanceService = {
  // ── Resident Bills & Invoices ─────────────────────────────────────────────
  getMyBill(flatNumber?: string): MaintenanceBill {
    const flat = flatNumber || "302";
    const found = SAMPLE_BILLS.find(b => b.flatNumber === flat && b.month === cm && b.year === cy);
    if (found) return found;
    return SAMPLE_BILLS[0];
  },

  getAllBills(filter?: { tower?: string; status?: BillStatus; month?: number; year?: number }): MaintenanceBill[] {
    let bills = [...SAMPLE_BILLS];
    if (filter?.tower) bills = bills.filter(b => b.tower === filter.tower);
    if (filter?.status) bills = bills.filter(b => b.status === filter.status);
    if (filter?.month) bills = bills.filter(b => b.month === filter.month);
    if (filter?.year) bills = bills.filter(b => b.year === filter.year);
    return bills;
  },

  getMyBillHistory(flatNumber?: string): MaintenanceBill[] {
    const flat = flatNumber || "302";
    return SAMPLE_BILLS.filter(b => b.flatNumber === flat).sort((a, b) => b.year - a.year || b.month - a.month);
  },

  // ── Summary & Aging Analytics ─────────────────────────────────────────────
  getSummary(): FinanceSummary {
    const bills = SAMPLE_BILLS;
    const totalCollected = bills.reduce((s, b) => s + b.paidAmount, 0);
    const totalDue = bills.reduce((s, b) => s + b.dueAmount, 0);
    const totalOverdue = bills.filter(b => b.status === "OVERDUE").reduce((s, b) => s + b.dueAmount, 0);

    return {
      totalCollected,
      totalDue,
      totalOverdue,
      collectionPercent: Math.round((totalCollected / (totalCollected + totalDue || 1)) * 100) || 0,
      activeFlats: 120,
      paidFlats: bills.filter(b => b.status === "PAID").length,
      overdueFlats: bills.filter(b => b.status === "OVERDUE").length,
      agingBuckets: [
        { period: "0 - 30 Days (Current)", amount: totalDue - totalOverdue, count: 48, percentage: 65 },
        { period: "31 - 60 Days", amount: 110000, count: 12, percentage: 18 },
        { period: "61 - 90 Days", amount: 62000, count: 6, percentage: 10 },
        { period: "90+ Days (Defaulters)", amount: 45000, count: 3, percentage: 7 },
      ],
      towerPerformance: [
        { tower: "Tower A", billed: 320000, collected: 298000, percent: 93 },
        { tower: "Tower B", billed: 280000, collected: 235000, percent: 84 },
        { tower: "Tower C", billed: 240000, collected: 215000, percent: 90 },
      ],
    };
  },

  // ── Payment Processing & Receipts ─────────────────────────────────────────
  recordPayment(billId: string, amount: number, mode: PaymentMode = "UPI"): { bill: MaintenanceBill; receipt: CommunityReceipt } | null {
    const bill = SAMPLE_BILLS.find(b => b.id === billId);
    if (!bill) return null;

    const newPaid = bill.paidAmount + amount;
    const newDue = Math.max(0, bill.totalAmount - newPaid);
    bill.paidAmount = newPaid;
    bill.dueAmount = newDue;
    bill.status = newDue === 0 ? "PAID" : "PARTIAL";
    bill.paidAt = new Date().toISOString();
    const recNum = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    bill.receiptNumber = recNum;

    const receipt: CommunityReceipt = {
      receiptNumber: recNum,
      receiptDate: new Date().toISOString(),
      invoiceNumber: bill.billNumber,
      flatNumber: bill.flatNumber,
      tower: bill.tower,
      amountPaid: amount,
      paymentMode: mode,
      transactionRef: `TX-UPI-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      payerName: "Sandeep Kumar (Owner)",
      allocations: bill.charges.map(c => ({ item: c.item, amount: c.amount })),
    };

    return { bill, receipt };
  },

  getReceipt(receiptNumber: string): CommunityReceipt | null {
    return {
      receiptNumber,
      receiptDate: new Date().toISOString(),
      invoiceNumber: "INV-202609-302A",
      flatNumber: "302",
      tower: "A",
      amountPaid: 6950,
      paymentMode: "UPI",
      transactionRef: "UPI-ICICI-990812384",
      payerName: "Sandeep Kumar",
      allocations: [
        { item: "Regular Maintenance Fee", amount: 4200 },
        { item: "Sinking / Capital Fund", amount: 1000 },
        { item: "Water & DG Power Backup", amount: 1250 },
        { item: "Basement Parking Slot", amount: 500 },
      ],
    };
  },

  // ── Advance Wallet ────────────────────────────────────────────────────────
  getAdvanceWallet(flatNumber: string = "302"): AdvanceWallet {
    return {
      flatNumber,
      balanceAmount: 14500,
      totalDeposited: 35000,
      totalUtilized: 20500,
      lastUpdated: new Date().toISOString(),
    };
  },

  depositAdvance(flatNumber: string, amount: number): AdvanceWallet {
    return {
      flatNumber,
      balanceAmount: 14500 + amount,
      totalDeposited: 35000 + amount,
      totalUtilized: 20500,
      lastUpdated: new Date().toISOString(),
    };
  },

  // ── Rules & Plans ─────────────────────────────────────────────────────────
  getPlans(): MaintenancePlan[] {
    return DEFAULT_PLANS;
  },

  getRules(): ChargeRule[] {
    return DEFAULT_RULES;
  },

  getPenaltyConfig(): PenaltyConfig {
    return {
      gracePeriodDays: 10,
      penaltyType: "PERCENTAGE_PER_MONTH",
      penaltyValue: 2.0,
      maxPenaltyCap: 5000,
    };
  },

  generateMonthlyCycle(month: number, year: number): { generatedCount: number; totalBilled: number } {
    return {
      generatedCount: 120,
      totalBilled: 840000,
    };
  },

  // ── General Ledger & Double Entry ─────────────────────────────────────────
  getLedgerTransactions(): GeneralLedgerTransaction[] {
    return SAMPLE_LEDGER_TRANSACTIONS;
  },

  getTrialBalance(): TrialBalanceItem[] {
    return [
      { accountCode: "1000", accountName: "Bank & Cash Clearing", accountType: "ASSET", debitAmount: 765000, creditAmount: 0 },
      { accountCode: "1100", accountName: "Resident Maintenance Receivable", accountType: "ASSET", debitAmount: 185000, creditAmount: 0 },
      { accountCode: "2000", accountName: "Resident Advance Payments Wallet", accountType: "LIABILITY", debitAmount: 0, creditAmount: 110000 },
      { accountCode: "2100", accountName: "Sinking / Corpus Fund Reserve", accountType: "LIABILITY", debitAmount: 0, creditAmount: 220000 },
      { accountCode: "4000", accountName: "Maintenance Fee Revenue", accountType: "REVENUE", debitAmount: 0, creditAmount: 520000 },
      { accountCode: "4100", accountName: "Water & Utility Charges Revenue", accountType: "REVENUE", debitAmount: 0, creditAmount: 62000 },
      { accountCode: "4200", accountName: "Parking & Facility Fee Revenue", accountType: "REVENUE", debitAmount: 0, creditAmount: 38000 },
    ];
  },
};
