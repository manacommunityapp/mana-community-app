// billerService.ts — BBPS (Bharat Bill Payment System) service for web app
// Mirrors the mobile billerService.ts interface; hybrid fallback: tries backend first,
// falls back to in-memory mock data when the backend is not yet wired.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export type BillerCategory = "ELECTRICITY" | "GAS" | "WATER" | "BROADBAND" | "DTH";

export interface Biller {
  id: string;
  name: string;
  shortName: string;
  category: BillerCategory;
  icon: string;
  state: string;
  consumerIdLabel: string;
  consumerIdHint: string;
  consumerIdLength?: number;
}

export interface FetchedBill {
  billerId: string;
  billerName: string;
  consumerId: string;
  customerName: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  amount: number;
  overdueAmount?: number;
  units?: number;
  periodFrom: string;
  periodTo: string;
  status: "DUE" | "OVERDUE" | "PAID";
}

export interface BillPayResult {
  upiIntentUrl: string;
  phonePeUrl: string;
  transactionRef: string;
  amount: number;
}

// ── Static fallback catalogue ────────────────────────────────────────────────

const ELECTRICITY_BILLERS: Biller[] = [
  { id: "BESCOM", name: "BESCOM – Bangalore Electricity Supply Company", shortName: "BESCOM", category: "ELECTRICITY", icon: "⚡", state: "Karnataka", consumerIdLabel: "RR Number (Consumer Account No.)", consumerIdHint: "e.g. 9123456789", consumerIdLength: 10 },
  { id: "TSSPDCL", name: "TSSPDCL – Telangana Southern Power Distribution", shortName: "TSSPDCL", category: "ELECTRICITY", icon: "⚡", state: "Telangana", consumerIdLabel: "Service Number (CA Number)", consumerIdHint: "e.g. 0012345678", consumerIdLength: 10 },
  { id: "TATA_POWER_MUMBAI", name: "Tata Power – Mumbai Distribution", shortName: "Tata Power", category: "ELECTRICITY", icon: "⚡", state: "Maharashtra", consumerIdLabel: "Consumer Number", consumerIdHint: "e.g. 4001234567", consumerIdLength: 10 },
  { id: "ADANI_ELECTRICITY", name: "Adani Electricity – Mumbai", shortName: "Adani", category: "ELECTRICITY", icon: "⚡", state: "Maharashtra", consumerIdLabel: "Consumer Account Number", consumerIdHint: "e.g. 100023456" },
  { id: "MSEDCL", name: "MSEDCL – Maharashtra State Electricity", shortName: "MSEDCL", category: "ELECTRICITY", icon: "⚡", state: "Maharashtra", consumerIdLabel: "Consumer Number", consumerIdHint: "e.g. 020012345678" },
  { id: "TNEB", name: "TNEB – Tamil Nadu Electricity Board", shortName: "TNEB", category: "ELECTRICITY", icon: "⚡", state: "Tamil Nadu", consumerIdLabel: "Consumer Number (EB No.)", consumerIdHint: "e.g. 001234567890" },
  { id: "BSES_RAJDHANI", name: "BSES Rajdhani – South & West Delhi", shortName: "BSES Rajdhani", category: "ELECTRICITY", icon: "⚡", state: "Delhi", consumerIdLabel: "Consumer Account Number (CA)", consumerIdHint: "e.g. 50012345678" },
  { id: "BSES_YAMUNA", name: "BSES Yamuna – East & Central Delhi", shortName: "BSES Yamuna", category: "ELECTRICITY", icon: "⚡", state: "Delhi", consumerIdLabel: "Consumer Account Number (CA)", consumerIdHint: "e.g. 30012345678" },
];

const GAS_BILLERS: Biller[] = [
  { id: "MGL", name: "MGL – Mahanagar Gas Limited", shortName: "MGL", category: "GAS", icon: "🔥", state: "Maharashtra", consumerIdLabel: "Business Partner (BP) Number", consumerIdHint: "e.g. 200012345" },
  { id: "IGL", name: "IGL – Indraprastha Gas Limited", shortName: "IGL", category: "GAS", icon: "🔥", state: "Delhi", consumerIdLabel: "BP Number", consumerIdHint: "e.g. 100009876" },
];

const STATIC_CATALOGUE: Record<BillerCategory, Biller[]> = {
  ELECTRICITY: ELECTRICITY_BILLERS,
  GAS: GAS_BILLERS,
  WATER: [],
  BROADBAND: [],
  DTH: [],
};

function generateFallbackBill(billerId: string, billerName: string, consumerId: string): FetchedBill {
  const now = new Date();
  const periodFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodTo = new Date(now.getFullYear(), now.getMonth(), 0);
  const dueDate = new Date(now.getFullYear(), now.getMonth(), 20);
  if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);

  const units = 150 + Math.floor(Math.random() * 80);
  const amount = Math.round((units * 6.5 + 180) * 100) / 100;
  const ts = Date.now() % 1_000_000;
  const prefix = billerId.substring(0, 4).toUpperCase();

  return {
    billerId,
    billerName,
    consumerId,
    customerName: "Resident Account",
    billNumber: `BBPS-${prefix}-${ts}`,
    billDate: periodFrom.toISOString().split("T")[0],
    dueDate: dueDate.toISOString().split("T")[0],
    amount,
    units,
    periodFrom: periodFrom.toISOString().split("T")[0],
    periodTo: periodTo.toISOString().split("T")[0],
    status: "DUE",
  };
}

// ── Service ──────────────────────────────────────────────────────────────────

export const billerService = {
  async getBillersByCategory(category: BillerCategory): Promise<Biller[]> {
    try {
      const resp = await fetch(`${API_BASE}/v1/bbps/billers?category=${category}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // fallthrough to static data
    }
    return STATIC_CATALOGUE[category] ?? [];
  },

  async fetchBill(billerId: string, billerName: string, consumerId: string): Promise<FetchedBill> {
    try {
      const resp = await fetch(`${API_BASE}/v1/bbps/bill/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billerId, consumerId }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.billNumber) return data;
      }
    } catch {
      // fallthrough
    }
    return generateFallbackBill(billerId, billerName, consumerId);
  },

  async payBill(bill: FetchedBill): Promise<BillPayResult> {
    try {
      const resp = await fetch(`${API_BASE}/v1/bbps/bill/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billNumber: bill.billNumber, billerId: bill.billerId, amount: bill.amount, method: "UPI" }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.upiIntentUrl) return data;
      }
    } catch {
      // fallthrough
    }
    const tr = `MANA${Date.now()}`;
    const pa = "bbps@setu";
    const pn = "Mana+Pay+BBPS";
    return {
      upiIntentUrl: `upi://pay?pa=${pa}&pn=${pn}&am=${bill.amount.toFixed(2)}&cu=INR&tr=${tr}&tn=Electricity+Bill`,
      phonePeUrl: `phonepe://pay?pa=${pa}&pn=${pn}&am=${bill.amount.toFixed(2)}&cu=INR&tr=${tr}`,
      transactionRef: tr,
      amount: bill.amount,
    };
  },
};
