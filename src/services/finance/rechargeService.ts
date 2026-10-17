// rechargeService.ts — Mobile Recharge (Prepaid/Postpaid) for web app
// Hybrid fallback: tries backend /v1/recharge/* first, falls back to static data.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export type RechargeType = "PREPAID" | "POSTPAID";
export type PlanCategory = "POPULAR" | "DATA" | "UNLIMITED" | "VALIDITY" | "TOPUP";

export interface MobileOperator {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  logoColor: string;
}

export interface RechargePlan {
  id: string;
  operatorId: string;
  category: PlanCategory;
  price: number;
  validity: string;
  data: string;
  calls: string;
  sms: string;
  description: string;
  isBestSeller?: boolean;
  isRecommended?: boolean;
}

export interface RechargeResult {
  transactionId: string;
  status: string;
  upiIntentUrl: string;
  phonePeUrl: string;
  amount: number;
}

// ── Static data ───────────────────────────────────────────────────────────────

export const OPERATORS: MobileOperator[] = [
  { id: "JIO", name: "Reliance Jio", shortName: "Jio", icon: "🔵", logoColor: "#0066CC" },
  { id: "AIRTEL", name: "Bharti Airtel", shortName: "Airtel", icon: "🔴", logoColor: "#E40000" },
  { id: "VI", name: "Vi (Vodafone Idea)", shortName: "Vi", icon: "🟣", logoColor: "#EE0066" },
  { id: "BSNL", name: "BSNL", shortName: "BSNL", icon: "🟢", logoColor: "#1B6CA8" },
  { id: "MTNL", name: "MTNL", shortName: "MTNL", icon: "⚫", logoColor: "#333333" },
];

const PLANS: Record<string, RechargePlan[]> = {
  JIO: [
    { id: "JIO-239", operatorId: "JIO", category: "POPULAR", price: 239, validity: "28 days", data: "1.5 GB/day", calls: "Unlimited", sms: "100/day", description: "Standard daily data pack with unlimited calling", isBestSeller: true },
    { id: "JIO-299", operatorId: "JIO", category: "UNLIMITED", price: 299, validity: "28 days", data: "2 GB/day", calls: "Unlimited", sms: "100/day", description: "Extra data for heavy users", isRecommended: true },
    { id: "JIO-479", operatorId: "JIO", category: "DATA", price: 479, validity: "56 days", data: "1.5 GB/day", calls: "Unlimited", sms: "100/day", description: "2-month pack — great value" },
    { id: "JIO-719", operatorId: "JIO", category: "VALIDITY", price: 719, validity: "84 days", data: "1.5 GB/day", calls: "Unlimited", sms: "100/day", description: "3-month plan" },
    { id: "JIO-2879", operatorId: "JIO", category: "VALIDITY", price: 2879, validity: "365 days", data: "2 GB/day", calls: "Unlimited", sms: "100/day", description: "Annual plan — best per-day value" },
  ],
  AIRTEL: [
    { id: "AIRTEL-249", operatorId: "AIRTEL", category: "POPULAR", price: 249, validity: "28 days", data: "2 GB/day", calls: "Unlimited", sms: "100/day", description: "Airtel Wynk + HelloTunes included", isBestSeller: true },
    { id: "AIRTEL-299", operatorId: "AIRTEL", category: "UNLIMITED", price: 299, validity: "28 days", data: "3 GB/day", calls: "Unlimited", sms: "100/day", description: "Max data with Airtel XStream", isRecommended: true },
    { id: "AIRTEL-479", operatorId: "AIRTEL", category: "DATA", price: 479, validity: "56 days", data: "2 GB/day", calls: "Unlimited", sms: "100/day", description: "2-month pack with OTT benefits" },
    { id: "AIRTEL-3599", operatorId: "AIRTEL", category: "VALIDITY", price: 3599, validity: "365 days", data: "2.5 GB/day", calls: "Unlimited", sms: "100/day", description: "Annual plan + Amazon Prime" },
  ],
  VI: [
    { id: "VI-239", operatorId: "VI", category: "POPULAR", price: 239, validity: "28 days", data: "1.5 GB/day", calls: "Unlimited", sms: "100/day", description: "Vi Movies & TV included", isBestSeller: true },
    { id: "VI-299", operatorId: "VI", category: "UNLIMITED", price: 299, validity: "28 days", data: "2.5 GB/day", calls: "Unlimited", sms: "100/day", description: "Weekend Data Rollover benefit", isRecommended: true },
    { id: "VI-719", operatorId: "VI", category: "VALIDITY", price: 719, validity: "84 days", data: "1.5 GB/day", calls: "Unlimited", sms: "100/day", description: "Quarterly plan" },
  ],
  BSNL: [
    { id: "BSNL-197", operatorId: "BSNL", category: "POPULAR", price: 197, validity: "26 days", data: "2 GB/day", calls: "Unlimited", sms: "100/day", description: "BSNL STV 197 daily data pack", isBestSeller: true },
    { id: "BSNL-247", operatorId: "BSNL", category: "UNLIMITED", price: 247, validity: "30 days", data: "2 GB/day", calls: "Unlimited", sms: "100/day", description: "Monthly all-in-one pack", isRecommended: true },
  ],
  MTNL: [
    { id: "MTNL-199", operatorId: "MTNL", category: "POPULAR", price: 199, validity: "28 days", data: "1 GB/day", calls: "Unlimited local + STD", sms: "100/day", description: "Mumbai/Delhi pack", isBestSeller: true },
  ],
};

function detectOperatorId(mobile: string): string | null {
  const d = mobile.replace(/\D/g, "");
  if (d.length < 2) return null;
  const map: Record<string, string> = {
    "63": "JIO", "64": "JIO", "65": "JIO", "66": "JIO", "67": "JIO", "68": "JIO", "69": "JIO",
    "70": "BSNL", "71": "BSNL", "72": "VI", "73": "VI", "74": "VI",
    "75": "AIRTEL", "76": "AIRTEL", "77": "VI", "78": "AIRTEL", "79": "AIRTEL",
    "80": "VI", "81": "AIRTEL", "82": "AIRTEL", "83": "VI", "84": "VI",
    "85": "AIRTEL", "86": "AIRTEL", "87": "BSNL", "88": "AIRTEL", "89": "VI",
    "90": "AIRTEL", "91": "AIRTEL", "92": "AIRTEL", "93": "AIRTEL", "94": "AIRTEL",
    "95": "AIRTEL", "96": "JIO", "97": "AIRTEL", "98": "AIRTEL", "99": "AIRTEL",
  };
  return map[d.slice(0, 2)] ?? null;
}

export const rechargeService = {
  detectOperator(mobile: string): MobileOperator | null {
    const id = detectOperatorId(mobile);
    return id ? (OPERATORS.find(o => o.id === id) ?? null) : null;
  },

  async getPlans(operatorId: string): Promise<RechargePlan[]> {
    try {
      const resp = await fetch(`${API_BASE}/v1/recharge/plans?operatorId=${operatorId}`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch { /* fallthrough */ }
    return PLANS[operatorId] ?? [];
  },

  async initiateRecharge(mobileNumber: string, operatorId: string, plan: RechargePlan): Promise<RechargeResult> {
    try {
      const resp = await fetch(`${API_BASE}/v1/recharge/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber, operatorId, planId: plan.id, amount: plan.price }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.transactionId) return data;
      }
    } catch { /* fallthrough */ }
    const tr = `MANA-RCH-${Date.now()}`;
    const pa = "recharge@manapay";
    const pn = encodeURIComponent(`${operatorId} Recharge`);
    return {
      transactionId: tr,
      status: "PENDING",
      upiIntentUrl: `upi://pay?pa=${pa}&pn=${pn}&am=${plan.price.toFixed(2)}&cu=INR&tr=${tr}&tn=Mobile+Recharge`,
      phonePeUrl: `phonepe://pay?pa=${pa}&pn=${pn}&am=${plan.price.toFixed(2)}&cu=INR&tr=${tr}`,
      amount: plan.price,
    };
  },
};
