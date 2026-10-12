import { safeStorage } from '../../utils/storage';

export type RewardTier = 'SILVER' | 'GOLD' | 'PLATINUM';

export interface RewardAccountDto {
  userId: string;
  userName: string;
  currentPoints: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: RewardTier;
  tierMultiplier: number;
  updatedAt: string;
}

export type RewardEntryType = 'EARN' | 'REDEEM' | 'BONUS' | 'EXPIRY' | 'TIER_UPGRADE';

export interface RewardLedgerEntryDto {
  id: string;
  userId: string;
  entryType: RewardEntryType;
  points: number;
  narration: string;
  ruleTag: string; // e.g., 'MAINTENANCE_TIMELY_PAYMENT', 'ECO_DRIVE', 'COMMUNITY_SPLIT_SETTLE'
  referenceDomain?: 'MANA_PAY' | 'COMMUNITY_FINANCE' | 'MANA_SPLIT' | 'MANA_DEALS' | 'INTERNAL';
  referenceId?: string;
  createdAt: string;
}

export interface RewardRuleDto {
  id: string;
  ruleTag: string;
  name: string;
  description: string;
  pointsFormula: string; // e.g. "1 pt per ₹100", "50 bonus pts"
  basePoints: number;
  isActive: boolean;
}

export interface RewardCatalogItemDto {
  id: string;
  title: string;
  category: 'CLUBHOUSE_PASS' | 'EV_CHARGING' | 'COMMUNITY_DEAL' | 'MERCHANDISE';
  pointsCost: number;
  stockRemaining: number;
  partnerName: string;
  imageUrl: string;
}

const STORAGE_KEYS = {
  ACCOUNT: 'mana_rewards_account_v1',
  LEDGER: 'mana_rewards_ledger_v1',
};

const DEFAULT_RULES: RewardRuleDto[] = [
  {
    id: 'rule-1',
    ruleTag: 'TIMELY_MAINTENANCE_PAY',
    name: 'Early Maintenance Bill Payment',
    description: 'Pay society maintenance bill before due date via Mana Pay.',
    pointsFormula: '1 point per ₹100 + 50 early-bird bonus pts',
    basePoints: 50,
    isActive: true,
  },
  {
    id: 'rule-2',
    ruleTag: 'SPLIT_PROMPT_SETTLE',
    name: 'Mana Split Rapid Settlement',
    description: 'Settle shared expense within 24 hours of creation.',
    pointsFormula: '20 flat points',
    basePoints: 20,
    isActive: true,
  },
  {
    id: 'rule-3',
    ruleTag: 'GREEN_ECO_DRIVE',
    name: 'Community Composting & Waste Segregation',
    description: 'Verified eco-score check by estate management.',
    pointsFormula: '100 points per verified cycle',
    basePoints: 100,
    isActive: true,
  },
  {
    id: 'rule-4',
    ruleTag: 'COMMUNITY_MARKET_BUY',
    name: 'Group Buying & Catalog Order',
    description: 'Shop through Community Market vendors.',
    pointsFormula: '2 points per ₹100',
    basePoints: 2,
    isActive: true,
  },
];

const DEFAULT_CATALOG: RewardCatalogItemDto[] = [
  {
    id: 'cat-1',
    title: 'Clubhouse Banquet Hall 20% Discount Coupon',
    category: 'CLUBHOUSE_PASS',
    pointsCost: 500,
    stockRemaining: 15,
    partnerName: 'Mana Estate RWA',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=500',
  },
  {
    id: 'cat-2',
    title: '10 kWh Fast EV Charging Credit',
    category: 'EV_CHARGING',
    pointsCost: 250,
    stockRemaining: 50,
    partnerName: 'ChargeZone Mana Grid',
    imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=500',
  },
  {
    id: 'cat-3',
    title: '₹200 Off at GreenEarth Organic Kiosk',
    category: 'COMMUNITY_DEAL',
    pointsCost: 300,
    stockRemaining: 40,
    partnerName: 'GreenEarth Farms',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
  },
];

const INITIAL_ACCOUNT: RewardAccountDto = {
  userId: 'user-me',
  userName: 'Sandeep Sharma',
  currentPoints: 680,
  lifetimeEarned: 1240,
  lifetimeRedeemed: 560,
  tier: 'GOLD',
  tierMultiplier: 1.25,
  updatedAt: '2026-10-12T10:00:00Z',
};

const INITIAL_LEDGER: RewardLedgerEntryDto[] = [
  {
    id: 'rwl-101',
    userId: 'user-me',
    entryType: 'EARN',
    points: 125,
    narration: 'Timely maintenance payment bonus for Oct 2026',
    ruleTag: 'TIMELY_MAINTENANCE_PAY',
    referenceDomain: 'COMMUNITY_FINANCE',
    referenceId: 'BILL-OCT-2026-302',
    createdAt: '2026-10-02T11:20:00Z',
  },
  {
    id: 'rwl-102',
    userId: 'user-me',
    entryType: 'EARN',
    points: 40,
    narration: 'Wayanad weekend trip prompt split settlement',
    ruleTag: 'SPLIT_PROMPT_SETTLE',
    referenceDomain: 'MANA_SPLIT',
    referenceId: 'exp-02',
    createdAt: '2026-10-04T15:10:00Z',
  },
  {
    id: 'rwl-103',
    userId: 'user-me',
    entryType: 'REDEEM',
    points: -250,
    narration: 'Redeemed: 10 kWh EV Fast Charging Credit',
    ruleTag: 'EV_CHARGING',
    referenceDomain: 'INTERNAL',
    referenceId: 'cat-2',
    createdAt: '2026-10-08T09:30:00Z',
  },
];

export const manaRewardsService = {
  getAccount(userId: string = 'user-me'): RewardAccountDto {
    return safeStorage.getJSON(STORAGE_KEYS.ACCOUNT, INITIAL_ACCOUNT);
  },

  getLedger(userId: string = 'user-me'): RewardLedgerEntryDto[] {
    return safeStorage.getJSON(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);
  },

  getRules(): RewardRuleDto[] {
    return DEFAULT_RULES;
  },

  getCatalog(): RewardCatalogItemDto[] {
    return DEFAULT_CATALOG;
  },

  /**
   * Evaluates loyalty rules and awards points into the rewards ledger independently.
   */
  awardPoints(params: {
    userId?: string;
    points: number;
    narration: string;
    ruleTag: string;
    referenceDomain?: RewardLedgerEntryDto['referenceDomain'];
    referenceId?: string;
  }): { account: RewardAccountDto; entry: RewardLedgerEntryDto } {
    const userId = params.userId || 'user-me';
    const account = this.getAccount(userId);
    const ledger = this.getLedger(userId);

    // Apply tier multiplier
    const effectivePoints = Math.round(params.points * (account.tierMultiplier || 1.0));

    account.currentPoints += effectivePoints;
    account.lifetimeEarned += effectivePoints;
    account.updatedAt = new Date().toISOString();

    // Check tier progression
    if (account.lifetimeEarned >= 2500) {
      account.tier = 'PLATINUM';
      account.tierMultiplier = 1.5;
    } else if (account.lifetimeEarned >= 1000) {
      account.tier = 'GOLD';
      account.tierMultiplier = 1.25;
    } else {
      account.tier = 'SILVER';
      account.tierMultiplier = 1.0;
    }

    const entry: RewardLedgerEntryDto = {
      id: `rwl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      entryType: 'EARN',
      points: effectivePoints,
      narration: params.narration,
      ruleTag: params.ruleTag,
      referenceDomain: params.referenceDomain,
      referenceId: params.referenceId,
      createdAt: new Date().toISOString(),
    };

    safeStorage.setJSON(STORAGE_KEYS.ACCOUNT, account);
    safeStorage.setJSON(STORAGE_KEYS.LEDGER, [entry, ...ledger]);

    return { account, entry };
  },

  /**
   * Burns points against the rewards catalog under rewards rules.
   */
  redeemPoints(catalogItemId: string, userId: string = 'user-me'): { success: boolean; message: string; account?: RewardAccountDto } {
    const account = this.getAccount(userId);
    const ledger = this.getLedger(userId);
    const item = DEFAULT_CATALOG.find((c) => c.id === catalogItemId);

    if (!item) {
      return { success: false, message: 'Reward item not found in catalog.' };
    }
    if (account.currentPoints < item.pointsCost) {
      return {
        success: false,
        message: `Insufficient points. You need ${item.pointsCost} points (available: ${account.currentPoints}).`,
      };
    }

    account.currentPoints -= item.pointsCost;
    account.lifetimeRedeemed += item.pointsCost;
    account.updatedAt = new Date().toISOString();

    const entry: RewardLedgerEntryDto = {
      id: `rwl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      entryType: 'REDEEM',
      points: -item.pointsCost,
      narration: `Redeemed: ${item.title} from ${item.partnerName}`,
      ruleTag: item.category,
      referenceDomain: 'INTERNAL',
      referenceId: item.id,
      createdAt: new Date().toISOString(),
    };

    safeStorage.setJSON(STORAGE_KEYS.ACCOUNT, account);
    safeStorage.setJSON(STORAGE_KEYS.LEDGER, [entry, ...ledger]);

    return { success: true, message: `Successfully redeemed ${item.title}!`, account };
  },
};
