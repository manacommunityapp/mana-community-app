// loanService.ts — Personal Loan service for web app
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export interface LoanOffer {
  id: string; lender: string; lender_icon: string;
  type: "PERSONAL" | "HOME" | "VEHICLE" | "EDUCATION" | "GOLD";
  min_amount: number; max_amount: number;
  interest_rate_min: number; interest_rate_max: number;
  max_tenure_months: number; processing_fee_pct: number;
  disbursal_time: string; features: string[]; pre_approved: boolean;
}
export interface ActiveLoan {
  id: string; lender: string; loan_account: string;
  amount: number; emi: number; outstanding: number;
  interest_rate: number; emis_paid: number; emis_total: number;
  next_emi_date: string; status: string;
}
export interface LoanApplyResult {
  application_id: string; status: string; message: string; emi: number; total_payable: number;
}

const FALLBACK_OFFERS: LoanOffer[] = [
  { id: "PHONEPE_CREDIT", lender: "PhonePe Credit Line",          lender_icon: "💜", type: "PERSONAL", min_amount: 1000,   max_amount: 500000,  interest_rate_min: 10.99, interest_rate_max: 23.99, max_tenure_months: 36, processing_fee_pct: 0.0, disbursal_time: "Instant",   features: ["Zero processing fee", "Instant disbursal", "Flexible repayment"], pre_approved: true },
  { id: "BAJAJ_PERSONAL", lender: "Bajaj Finserv Personal Loan",  lender_icon: "💼", type: "PERSONAL", min_amount: 200000, max_amount: 5000000, interest_rate_min: 11.00, interest_rate_max: 26.00, max_tenure_months: 60, processing_fee_pct: 2.0, disbursal_time: "24 Hours",  features: ["No collateral", "Up to ₹50L", "60 month tenure"],            pre_approved: false },
  { id: "HDFC_PERSONAL",  lender: "HDFC Bank Personal Loan",      lender_icon: "🏦", type: "PERSONAL", min_amount: 50000,  max_amount: 4000000, interest_rate_min: 10.50, interest_rate_max: 24.00, max_tenure_months: 60, processing_fee_pct: 2.5, disbursal_time: "4 Hours",   features: ["Pre-approved offers", "10.50% onwards", "Quick disbursement"], pre_approved: false },
  { id: "ICICI_PERSONAL", lender: "ICICI Bank Instant Loan",      lender_icon: "🔷", type: "PERSONAL", min_amount: 50000,  max_amount: 5000000, interest_rate_min: 10.85, interest_rate_max: 19.00, max_tenure_months: 72, processing_fee_pct: 2.25,disbursal_time: "3 Seconds", features: ["3-second disbursal", "Minimal docs", "72 month tenure"],      pre_approved: false },
  { id: "KREDITBEE",      lender: "KreditBee Personal Loan",      lender_icon: "🐝", type: "PERSONAL", min_amount: 1000,   max_amount: 300000,  interest_rate_min: 15.00, interest_rate_max: 29.95, max_tenure_months: 24, processing_fee_pct: 3.0, disbursal_time: "10 Minutes",features: ["₹1K to ₹3L", "Low eligibility bar", "Paperless process"],    pre_approved: false },
  { id: "STASHFIN",       lender: "StashFin Credit Line",         lender_icon: "💳", type: "PERSONAL", min_amount: 5000,   max_amount: 500000,  interest_rate_min: 11.99, interest_rate_max: 59.99, max_tenure_months: 36, processing_fee_pct: 2.0, disbursal_time: "Instant",   features: ["Credit line model", "Pay only on use", "Revolving credit"],    pre_approved: false },
];

function mockActiveLoan(): ActiveLoan {
  const amount = 200000, rate = 13.50, months = 24;
  const r = rate / 1200;
  const emi = Math.round(amount * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1));
  const emisPaid = 7;
  const nextEmi = new Date(); nextEmi.setDate(5); nextEmi.setMonth(nextEmi.getMonth() + 1);
  return { id: "loan-mock-001", lender: "Bajaj Finserv Personal Loan", loan_account: "BFL-PL-" + (Date.now() % 1_000_000), amount, emi, outstanding: (months - emisPaid) * emi, interest_rate: rate, emis_paid: emisPaid, emis_total: months, next_emi_date: nextEmi.toISOString().split("T")[0], status: "ACTIVE" };
}

export const loanService = {
  calcEMI(principal: number, annualRate: number, months: number): number {
    const r = annualRate / 1200;
    if (r === 0) return Math.round(principal / months);
    return Math.round(principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1));
  },
  async getOffers(): Promise<LoanOffer[]> {
    try {
      const resp = await fetch(`${API_BASE}/v1/loans/offers`);
      if (resp.ok) { const d = await resp.json(); if (Array.isArray(d) && d.length > 0) return d.map((o: any) => ({ ...o, lender_icon: o.lenderIcon, min_amount: o.minAmount, max_amount: o.maxAmount, interest_rate_min: o.interestRateMin, interest_rate_max: o.interestRateMax, max_tenure_months: o.maxTenureMonths, processing_fee_pct: o.processingFeePct, disbursal_time: o.disbursalTime, pre_approved: o.preApproved })); }
    } catch { /* fallthrough */ }
    return FALLBACK_OFFERS;
  },
  async getMyLoans(): Promise<ActiveLoan[]> {
    try {
      const resp = await fetch(`${API_BASE}/v1/loans/my-loans`);
      if (resp.ok) { const d = await resp.json(); if (Array.isArray(d) && d.length > 0) return d.map((l: any) => ({ ...l, loan_account: l.loanAccount, interest_rate: l.interestRate, emis_paid: l.emisPaid, emis_total: l.emisTotal, next_emi_date: l.nextEmiDate })); }
    } catch { /* fallthrough */ }
    return [mockActiveLoan()];
  },
  async apply(payload: { offer_id: string; amount: number; tenure_months: number; rate: number }): Promise<LoanApplyResult> {
    try {
      const resp = await fetch(`${API_BASE}/v1/loans/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId: payload.offer_id, amount: payload.amount, tenureMonths: payload.tenure_months, rate: payload.rate }) });
      if (resp.ok) { const d = await resp.json(); return { application_id: d.applicationId, status: d.status, message: d.message, emi: d.emi, total_payable: d.totalPayable }; }
    } catch { /* fallthrough */ }
    const emi = loanService.calcEMI(payload.amount, payload.rate, payload.tenure_months);
    return { application_id: "APP-MOCK-" + (Date.now() % 1_000_000), status: "UNDER_REVIEW", message: "Application submitted. Decision within 24 hours.", emi, total_payable: emi * payload.tenure_months };
  },
};
