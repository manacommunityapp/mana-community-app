import { apiClient } from '../common/apiClient';

// ── Types ────────────────────────────────────────────────────────────────────

export type RechargeType = 'PREPAID' | 'POSTPAID';

export interface MobileOperator {
  id: string;
  name: string;
  shortName: string;
  icon: string;        // emoji
  logoColor: string;
  circles: string[];   // telecom circles covered
}

export interface RechargePlan {
  id: string;
  operatorId: string;
  category: 'POPULAR' | 'DATA' | 'UNLIMITED' | 'VALIDITY' | 'TOPUP';
  price: number;
  validity: string;
  data: string;
  calls: string;
  sms: string;
  description: string;
  isBestSeller?: boolean;
  isRecommended?: boolean;
}

export interface RechargeRequest {
  mobileNumber: string;
  operatorId: string;
  circle: string;
  planId: string;
  amount: number;
  rechargeType: RechargeType;
}

export interface RechargeResponse {
  transactionId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  upiIntentUrl: string;
  phonePeUrl: string;
  amount: number;
  mobileNumber: string;
  operatorId: string;
  planDescription: string;
}

export interface SavedContact {
  id: string;
  name: string;
  relation: string;
  number: string;
  operatorId: string;
  circle: string;
  expiryDays: number; // e.g. 3 (days left), -1 (expired), 14 (safe)
  currentPlan: string;
  category: 'household' | 'staff' | 'community';
}

// ── Static operator catalogue ────────────────────────────────────────────────

export const OPERATORS: MobileOperator[] = [
  { id: 'JIO', name: 'Reliance Jio', shortName: 'Jio', icon: '🔵', logoColor: '#0066CC', circles: ['All India'] },
  { id: 'AIRTEL', name: 'Bharti Airtel', shortName: 'Airtel', icon: '🔴', logoColor: '#E40000', circles: ['All India'] },
  { id: 'VI', name: 'Vi (Vodafone Idea)', shortName: 'Vi', icon: '🟣', logoColor: '#EE0066', circles: ['All India'] },
  { id: 'BSNL', name: 'BSNL', shortName: 'BSNL', icon: '🟢', logoColor: '#1B6CA8', circles: ['All India'] },
  { id: 'MTNL', name: 'MTNL', shortName: 'MTNL', icon: '⚫', logoColor: '#333333', circles: ['Mumbai', 'Delhi'] },
];

export const CIRCLES = [
  'All India', 'Andhra Pradesh', 'Assam', 'Bihar & Jharkhand', 'Chennai', 'Delhi NCR',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Karnataka', 'Kerala',
  'Kolkata', 'Madhya Pradesh & CG', 'Maharashtra & Goa', 'Mumbai', 'North East',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'UP East', 'UP West',
  'West Bengal',
];

export const COMMUNITY_CONTACTS: SavedContact[] = [
  {
    id: '1',
    name: 'Self',
    relation: 'Flat B-402 (My SIM)',
    number: '9845012345',
    operatorId: 'AIRTEL',
    circle: 'Karnataka',
    expiryDays: 3,
    currentPlan: '1.5 GB/day · Unlimited Local/STD',
    category: 'household',
  },
  {
    id: '2',
    name: 'Priya (Spouse)',
    relation: 'Flat B-402',
    number: '9820054321',
    operatorId: 'JIO',
    circle: 'Mumbai',
    expiryDays: 14,
    currentPlan: '2 GB/day · 5G Unlimited',
    category: 'household',
  },
  {
    id: '3',
    name: 'Mom',
    relation: 'Family',
    number: '9845098765',
    operatorId: 'AIRTEL',
    circle: 'Karnataka',
    expiryDays: 1,
    currentPlan: '1.5 GB/day · 28 Days',
    category: 'household',
  },
  {
    id: '4',
    name: 'Home Wi-Fi Dongle',
    relation: 'Study Room',
    number: '6360098765',
    operatorId: 'JIO',
    circle: 'Karnataka',
    expiryDays: -1,
    currentPlan: '30 GB Data Booster',
    category: 'household',
  },
  {
    id: '5',
    name: 'Shanti Devi',
    relation: 'House Maid (Insta-Help #104)',
    number: '9123456780',
    operatorId: 'VI',
    circle: 'Karnataka',
    expiryDays: 2,
    currentPlan: '1.5 GB/day · Unlimited Calls',
    category: 'staff',
  },
  {
    id: '6',
    name: 'Ramesh Kumar',
    relation: 'Society Driver & Carpool Pilot',
    number: '9988776655',
    operatorId: 'JIO',
    circle: 'Karnataka',
    expiryDays: 5,
    currentPlan: '2 GB/day · Unlimited',
    category: 'staff',
  },
  {
    id: '7',
    name: 'Gate 2 Security Intercom',
    relation: 'Security Staff SIM (Guard Room)',
    number: '9876501234',
    operatorId: 'AIRTEL',
    circle: 'Karnataka',
    expiryDays: 0,
    currentPlan: 'Society Voice CUG Pack',
    category: 'community',
  },
];

// ── Static plans per operator ─────────────────────────────────────────────────

const JIO_PLANS: RechargePlan[] = [
  { id: 'JIO-239', operatorId: 'JIO', category: 'POPULAR', price: 239, validity: '28 days', data: '1.5 GB/day', calls: 'Unlimited', sms: '100/day', description: 'Standard daily data pack with unlimited calling', isBestSeller: true },
  { id: 'JIO-299', operatorId: 'JIO', category: 'UNLIMITED', price: 299, validity: '28 days', data: '2 GB/day', calls: 'Unlimited', sms: '100/day', description: 'Extra data for heavy users with 5G Unlimited', isRecommended: true },
  { id: 'JIO-479', operatorId: 'JIO', category: 'DATA', price: 479, validity: '56 days', data: '1.5 GB/day', calls: 'Unlimited', sms: '100/day', description: '2-month pack — great value for roaming' },
  { id: 'JIO-719', operatorId: 'JIO', category: 'VALIDITY', price: 719, validity: '84 days', data: '1.5 GB/day', calls: 'Unlimited', sms: '100/day', description: '3-month plan with steady data' },
  { id: 'JIO-2879', operatorId: 'JIO', category: 'VALIDITY', price: 2879, validity: '365 days', data: '2 GB/day', calls: 'Unlimited', sms: '100/day', description: 'Annual plan — best per-day value' },
  { id: 'JIO-19', operatorId: 'JIO', category: 'TOPUP', price: 19, validity: 'No expiry top-up', data: '1 GB', calls: 'Standard', sms: 'None', description: 'Emergency data top-up pack' },
];

const AIRTEL_PLANS: RechargePlan[] = [
  { id: 'AIRTEL-249', operatorId: 'AIRTEL', category: 'POPULAR', price: 249, validity: '28 days', data: '2 GB/day', calls: 'Unlimited', sms: '100/day', description: 'Airtel Wynk + HelloTunes included', isBestSeller: true },
  { id: 'AIRTEL-299', operatorId: 'AIRTEL', category: 'UNLIMITED', price: 299, validity: '28 days', data: '3 GB/day', calls: 'Unlimited', sms: '100/day', description: 'Max data with Airtel XStream Play', isRecommended: true },
  { id: 'AIRTEL-479', operatorId: 'AIRTEL', category: 'DATA', price: 479, validity: '56 days', data: '2 GB/day', calls: 'Unlimited', sms: '100/day', description: '2-month pack with OTT benefits' },
  { id: 'AIRTEL-839', operatorId: 'AIRTEL', category: 'VALIDITY', price: 839, validity: '84 days', data: '2 GB/day', calls: 'Unlimited', sms: '100/day', description: 'Quarterly power plan' },
  { id: 'AIRTEL-3599', operatorId: 'AIRTEL', category: 'VALIDITY', price: 3599, validity: '365 days', data: '2.5 GB/day', calls: 'Unlimited', sms: '100/day', description: 'Annual plan + Amazon Prime subscription' },
];

const VI_PLANS: RechargePlan[] = [
  { id: 'VI-239', operatorId: 'VI', category: 'POPULAR', price: 239, validity: '28 days', data: '1.5 GB/day', calls: 'Unlimited', sms: '100/day', description: 'Vi Movies & TV included', isBestSeller: true },
  { id: 'VI-299', operatorId: 'VI', category: 'UNLIMITED', price: 299, validity: '28 days', data: '2.5 GB/day', calls: 'Unlimited', sms: '100/day', description: 'Weekend Data Rollover benefit', isRecommended: true },
  { id: 'VI-479', operatorId: 'VI', category: 'DATA', price: 479, validity: '56 days', data: '1.5 GB/day', calls: 'Unlimited', sms: '100/day', description: '2-month pack with night unlimited' },
  { id: 'VI-719', operatorId: 'VI', category: 'VALIDITY', price: 719, validity: '84 days', data: '1.5 GB/day', calls: 'Unlimited', sms: '100/day', description: 'Quarterly plan' },
];

const BSNL_PLANS: RechargePlan[] = [
  { id: 'BSNL-197', operatorId: 'BSNL', category: 'POPULAR', price: 197, validity: '26 days', data: '2 GB/day', calls: 'Unlimited', sms: '100/day', description: 'BSNL STV 197 daily data pack', isBestSeller: true },
  { id: 'BSNL-247', operatorId: 'BSNL', category: 'UNLIMITED', price: 247, validity: '30 days', data: '2 GB/day', calls: 'Unlimited', sms: '100/day', description: 'Monthly all-in-one pack', isRecommended: true },
  { id: 'BSNL-666', operatorId: 'BSNL', category: 'VALIDITY', price: 666, validity: '90 days', data: '2 GB/day', calls: 'Unlimited', sms: '100/day', description: 'Quarterly plan' },
];

const MTNL_PLANS: RechargePlan[] = [
  { id: 'MTNL-199', operatorId: 'MTNL', category: 'POPULAR', price: 199, validity: '28 days', data: '1 GB/day', calls: 'Unlimited local + STD', sms: '100/day', description: 'Mumbai/Delhi pack', isBestSeller: true },
];

const PLANS_CATALOGUE: Record<string, RechargePlan[]> = {
  JIO: JIO_PLANS,
  AIRTEL: AIRTEL_PLANS,
  VI: VI_PLANS,
  BSNL: BSNL_PLANS,
  MTNL: MTNL_PLANS,
};

// ── Service API ──────────────────────────────────────────────────────────────

export const rechargeService = {
  async getOperators(): Promise<MobileOperator[]> {
    try {
      const data = await apiClient.get<MobileOperator[]>('/recharge/operators');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    return OPERATORS;
  },

  async getPlans(operatorId: string, _circle?: string): Promise<RechargePlan[]> {
    try {
      const data = await apiClient.get<RechargePlan[]>(`/recharge/plans?operator=${operatorId}`);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      // fallback
    }
    return PLANS_CATALOGUE[operatorId.toUpperCase()] || JIO_PLANS;
  },

  async detectOperator(mobileNumber: string): Promise<{ operatorId: string; circle: string }> {
    const cleaned = mobileNumber.replace(/\D/g, '');
    const prefix = cleaned.slice(0, 4);

    if (prefix.startsWith('9845') || prefix.startsWith('9880') || prefix.startsWith('9900')) {
      return { operatorId: 'AIRTEL', circle: 'Karnataka' };
    }
    if (prefix.startsWith('9820') || prefix.startsWith('9821')) {
      return { operatorId: 'JIO', circle: 'Mumbai' };
    }
    if (prefix.startsWith('9123') || prefix.startsWith('9008')) {
      return { operatorId: 'VI', circle: 'Karnataka' };
    }
    if (prefix.startsWith('9448') || prefix.startsWith('9449')) {
      return { operatorId: 'BSNL', circle: 'Karnataka' };
    }
    const ops = ['JIO', 'AIRTEL', 'VI', 'BSNL'];
    const idx = (cleaned.charCodeAt(cleaned.length - 1) || 0) % ops.length;
    return { operatorId: ops[idx], circle: 'Karnataka' };
  },

  async initiateRecharge(request: RechargeRequest): Promise<RechargeResponse> {
    try {
      const data = await apiClient.post<RechargeResponse>('/recharge/initiate', request);
      if (data && data.transactionId) return data;
    } catch {
      // fallback mock
    }
    const txnId = `TXN_REC_${Date.now()}`;
    const upiUrl = `upi://pay?pa=manacommunity@icici&pn=ManaCommunityRecharge&am=${request.amount}&tr=${txnId}&cu=INR`;
    return {
      transactionId: txnId,
      status: 'PENDING',
      upiIntentUrl: upiUrl,
      phonePeUrl: upiUrl,
      amount: request.amount,
      mobileNumber: request.mobileNumber,
      operatorId: request.operatorId,
      planDescription: `₹${request.amount} recharge for ${request.mobileNumber}`,
    };
  },
};
