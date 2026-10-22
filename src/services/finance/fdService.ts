// fdService.ts — Fixed Deposit service for web app
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export interface FDTenure { label: string; months: number; rate: number; }
export interface FDProduct {
  id: string; bank: string; bank_icon: string;
  category: "BANK" | "NBFC" | "POST_OFFICE";
  interest_rate: number; senior_rate: number;
  min_amount: number; max_amount: number;
  tenures: FDTenure[];
  is_tax_saver: boolean; rating: string;
}
export interface ActiveFD {
  id: string; bank: string; fd_number: string;
  principal: number; interest_rate: number;
  maturity_amount: number; interest_earned: number;
  tenure_label: string; open_date: string; maturity_date: string;
  status: string;
}
export interface BookFDResult {
  fd_number: string; upi_intent_url: string; phone_pe_url: string;
  transaction_ref: string; principal: number; maturity_amount: number; maturity_date: string;
}

const FALLBACK_PRODUCTS: FDProduct[] = [
  { id: "SBI_FD",         bank: "State Bank of India",       bank_icon: "🏛", category: "BANK",        interest_rate: 6.80, senior_rate: 7.30, min_amount: 1000,  max_amount: 10000000, is_tax_saver: true,  rating: "AAA",
    tenures: [{ label: "7 Days", months: 1, rate: 4.50 }, { label: "3 Months", months: 3, rate: 6.00 }, { label: "6 Months", months: 6, rate: 6.50 }, { label: "1 Year", months: 12, rate: 6.80 }, { label: "2 Years", months: 24, rate: 7.00 }, { label: "5 Years", months: 60, rate: 6.50 }] },
  { id: "HDFC_FD",        bank: "HDFC Bank",                 bank_icon: "🏦", category: "BANK",        interest_rate: 7.10, senior_rate: 7.60, min_amount: 5000,  max_amount: 10000000, is_tax_saver: true,  rating: "AAA",
    tenures: [{ label: "3 Months", months: 3, rate: 6.25 }, { label: "6 Months", months: 6, rate: 6.60 }, { label: "1 Year", months: 12, rate: 7.10 }, { label: "2 Years", months: 24, rate: 7.15 }, { label: "3 Years", months: 36, rate: 7.00 }, { label: "5 Years", months: 60, rate: 7.00 }] },
  { id: "BAJAJ_FD",       bank: "Bajaj Finance",             bank_icon: "💼", category: "NBFC",        interest_rate: 8.10, senior_rate: 8.35, min_amount: 15000, max_amount: 10000000, is_tax_saver: false, rating: "AAA",
    tenures: [{ label: "12 Months", months: 12, rate: 7.40 }, { label: "24 Months", months: 24, rate: 8.10 }, { label: "36 Months", months: 36, rate: 8.10 }, { label: "44 Months", months: 44, rate: 8.10 }, { label: "60 Months", months: 60, rate: 7.90 }] },
  { id: "ICICI_FD",       bank: "ICICI Bank",                bank_icon: "🔷", category: "BANK",        interest_rate: 7.10, senior_rate: 7.60, min_amount: 10000, max_amount: 10000000, is_tax_saver: true,  rating: "AAA",
    tenures: [{ label: "3 Months", months: 3, rate: 6.00 }, { label: "6 Months", months: 6, rate: 6.50 }, { label: "1 Year", months: 12, rate: 7.10 }, { label: "15 Months", months: 15, rate: 7.25 }, { label: "2 Years", months: 24, rate: 7.10 }, { label: "5 Years", months: 60, rate: 7.00 }] },
  { id: "POST_OFFICE_FD", bank: "India Post (Post Office)", bank_icon: "📮", category: "POST_OFFICE", interest_rate: 7.50, senior_rate: 7.50, min_amount: 1000,  max_amount: 10000000, is_tax_saver: true,  rating: "Sovereign",
    tenures: [{ label: "1 Year", months: 12, rate: 6.90 }, { label: "2 Years", months: 24, rate: 7.00 }, { label: "3 Years", months: 36, rate: 7.10 }, { label: "5 Years", months: 60, rate: 7.50 }] },
  { id: "SHRIRAM_FD",     bank: "Shriram Finance",           bank_icon: "🏢", category: "NBFC",        interest_rate: 8.35, senior_rate: 8.85, min_amount: 5000,  max_amount: 10000000, is_tax_saver: false, rating: "AA+",
    tenures: [{ label: "12 Months", months: 12, rate: 7.85 }, { label: "24 Months", months: 24, rate: 8.25 }, { label: "36 Months", months: 36, rate: 8.35 }, { label: "60 Months", months: 60, rate: 8.10 }] },
];

function mockActiveFD(): ActiveFD {
  const principal = 50000, rate = 8.10, months = 24;
  const maturity = Math.round(principal * Math.pow(1 + rate / 400, months / 3));
  const open = new Date(); open.setMonth(open.getMonth() - 6);
  const matureDate = new Date(open); matureDate.setMonth(matureDate.getMonth() + months);
  return { id: "fd-mock-001", bank: "Bajaj Finance", fd_number: "BFL-FD-" + (Date.now() % 1_000_000), principal, interest_rate: rate, maturity_amount: maturity, interest_earned: maturity - principal, tenure_label: "24 Months", open_date: open.toISOString().split("T")[0], maturity_date: matureDate.toISOString().split("T")[0], status: "ACTIVE" };
}

export const fdService = {
  calcMaturity(principal: number, ratePercent: number, months: number): number {
    return Math.round(principal * Math.pow(1 + ratePercent / 400, months / 3));
  },
  async getProducts(): Promise<FDProduct[]> {
    try {
      const resp = await fetch(`${API_BASE}/v1/fd/products`);
      if (resp.ok) { const d = await resp.json(); if (Array.isArray(d) && d.length > 0) return d.map((p: any) => ({ ...p, bank_icon: p.bankIcon, interest_rate: p.interestRate, senior_rate: p.seniorRate, min_amount: p.minAmount, max_amount: p.maxAmount, is_tax_saver: p.isTaxSaver, tenures: p.tenures.map((t: any) => ({ label: t.label, months: t.months, rate: t.rate })) })); }
    } catch { /* fallthrough */ }
    return FALLBACK_PRODUCTS;
  },
  async getMyFDs(): Promise<ActiveFD[]> {
    try {
      const resp = await fetch(`${API_BASE}/v1/fd/my-fds`);
      if (resp.ok) { const d = await resp.json(); if (Array.isArray(d) && d.length > 0) return d.map((f: any) => ({ ...f, bank_icon: f.bankIcon, fd_number: f.fdNumber, interest_rate: f.interestRate, maturity_amount: f.maturityAmount, interest_earned: f.interestEarned, tenure_label: f.tenureLabel, open_date: f.openDate, maturity_date: f.maturityDate })); }
    } catch { /* fallthrough */ }
    return [mockActiveFD()];
  },
  async book(payload: { product_id: string; principal: number; tenure_months: number; rate: number }): Promise<BookFDResult> {
    try {
      const resp = await fetch(`${API_BASE}/v1/fd/book`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: payload.product_id, principal: payload.principal, tenureMonths: payload.tenure_months, rate: payload.rate }) });
      if (resp.ok) { const d = await resp.json(); return { fd_number: d.fdNumber, upi_intent_url: d.upiIntentUrl, phone_pe_url: d.phonePeUrl, transaction_ref: d.transactionRef, principal: d.principal, maturity_amount: d.maturityAmount, maturity_date: d.maturityDate }; }
    } catch { /* fallthrough */ }
    const maturity = fdService.calcMaturity(payload.principal, payload.rate, payload.tenure_months);
    const matureDate = new Date(); matureDate.setMonth(matureDate.getMonth() + payload.tenure_months);
    const tr = "MANAFD" + Date.now();
    return { fd_number: "FD-MOCK-" + (Date.now() % 1_000_000), upi_intent_url: `upi://pay?pa=fd@setu&pn=Mana+FD&am=${payload.principal}&cu=INR&tr=${tr}`, phone_pe_url: `phonepe://pay?pa=fd@setu&pn=Mana+FD&am=${payload.principal}&cu=INR&tr=${tr}`, transaction_ref: tr, principal: payload.principal, maturity_amount: maturity, maturity_date: matureDate.toISOString().split("T")[0] };
  },
};
