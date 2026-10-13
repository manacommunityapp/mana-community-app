import { safeStorage } from "../../utils/storage";
import { personalFinanceService } from "../finance/personalFinanceService";

// ── Types & DTOs ─────────────────────────────────────────────────────────────

export type GroupType = "TRIP" | "COMMUNITY_COLLECTION" | "FLATMATES" | "EVENT" | "CUSTOM";
export type SplitMethod = "EQUAL" | "PERCENTAGE" | "EXACT" | "QUANTITY" | "SHARES";
export type ExpenseCategory =
  | "FOOD"
  | "STAY"
  | "FUEL"
  | "TRANSPORT"
  | "ACTIVITIES"
  | "TICKETS"
  | "COMMUNITY_DRIVE"
  | "UTILITIES"
  | "MAINTENANCE"
  | "MISCELLANEOUS";

export interface SplitMember {
  id: string;
  name: string;
  flat: string;
  phone?: string;
  upiId?: string;
  avatar?: string;
  isCurrentUser?: boolean;
}

export interface ParticipantShareInput {
  memberId: string;
  weight?: number;      // For shares/weights
  percentage?: number;  // For percentage split
  quantity?: number;    // For quantity split
  exactAmount?: number; // For exact split
}

export interface SplitExpenseItem {
  id: string;
  groupId: string;
  category: ExpenseCategory;
  description: string;
  totalAmount: number;
  paidByMemberId: string;
  paidByName: string;
  expenseDate: string;
  splitMethod: SplitMethod;
  receiptUrl?: string;
  shares: {
    memberId: string;
    memberName: string;
    amount: number;
    settled: boolean;
  }[];
  createdAt: string;
}

export interface OptimizedTransfer {
  fromMemberId: string;
  fromName: string;
  fromFlat: string;
  toMemberId: string;
  toName: string;
  toFlat: string;
  toUpiId?: string;
  amount: number;
}

export interface SplitPaymentRecord {
  id: string;
  groupId: string;
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
  paymentMethod: "UPI" | "CASH" | "BANK_TRANSFER" | "MANA_WALLET";
  referenceNote?: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  createdAt: string;
}

export interface VerifiedCommunityCollection {
  id: string;
  title: string;
  category: string;
  description: string;
  targetAmount: number;
  collectedAmount: number;
  beneficiaryTitle: string;
  verifiedBy: string; // e.g. "Mana Management Committee"
  verifiedBadge: boolean;
  deadline: string;
  organizerName: string;
  organizerFlat: string;
  transparencyLedgerUrl?: string;
  contributorsCount: number;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  suggestedContributionINR?: number;
}

export interface SplitGroup {
  id: string;
  title: string;
  type: GroupType;
  description: string;
  coverImage?: string;
  currency: string;
  members: SplitMember[];
  linkedTripId?: string;
  isVerifiedCommunityCollection?: boolean;
  collectionTargetAmount?: number;
  privacy: "PUBLIC_COMMUNITY" | "GROUP_ONLY" | "PRIVATE";
  createdAt: string;
}

// ── Initial Mock Dataset ─────────────────────────────────────────────────────

const CURRENT_USER: SplitMember = {
  id: "user-me",
  name: "You",
  flat: "Tower A1 - 302",
  phone: "+91 98450 11223",
  upiId: "resident.patil@okhdfcbank",
  isCurrentUser: true,
};

const SEED_MEMBERS: SplitMember[] = [
  CURRENT_USER,
  { id: "user-2", name: "Rahul Verma", flat: "Tower A1 - 404", phone: "+91 98765 43210", upiId: "rahul.v@okaxis" },
  { id: "user-3", name: "Pooja Iyer", flat: "Tower B2 - 102", phone: "+91 98440 22334", upiId: "pooja.iyer@icici" },
  { id: "user-4", name: "Sunil Rao", flat: "Tower A2 - 104", phone: "+91 97400 55667", upiId: "sunilrao@upi" },
  { id: "user-5", name: "Ananya Sharma", flat: "Tower B1 - 802", phone: "+91 98111 88990", upiId: "ananya.s@paytm" },
];

const SEED_GROUPS: SplitGroup[] = [
  {
    id: "grp-trip-01",
    title: "Wayanad Weekend Trek & Camp",
    type: "TRIP",
    description: "Chembra Peak hike, homestay dining, fuel and safari passes.",
    currency: "₹",
    members: [CURRENT_USER, SEED_MEMBERS[1], SEED_MEMBERS[2], SEED_MEMBERS[3]],
    linkedTripId: "TRP-1",
    privacy: "GROUP_ONLY",
    createdAt: "2026-10-01",
  },
  {
    id: "grp-comm-01",
    title: "Grand Community Diwali & Cultural Mela",
    type: "COMMUNITY_COLLECTION",
    description: "Open community lights, cultural stage sound, sweet distribution and safety security guards.",
    currency: "₹",
    members: SEED_MEMBERS,
    isVerifiedCommunityCollection: true,
    collectionTargetAmount: 85000,
    privacy: "PUBLIC_COMMUNITY",
    createdAt: "2026-10-05",
  },
  {
    id: "grp-flat-01",
    title: "Tower A 3rd Floor Flatmates & Power Backup",
    type: "FLATMATES",
    description: "Shared corridor high-speed fiber internet, milk delivery and water can refills.",
    currency: "₹",
    members: [CURRENT_USER, SEED_MEMBERS[1]],
    privacy: "PRIVATE",
    createdAt: "2026-09-15",
  },
];

const SEED_EXPENSES: SplitExpenseItem[] = [
  {
    id: "exp-01",
    groupId: "grp-trip-01",
    category: "STAY",
    description: "Wayanad Plantation Homestay (2 Nights)",
    totalAmount: 14000,
    paidByMemberId: "user-me",
    paidByName: "You",
    expenseDate: "2026-10-02",
    splitMethod: "EQUAL",
    shares: [
      { memberId: "user-me", memberName: "You", amount: 3500, settled: true },
      { memberId: "user-2", memberName: "Rahul Verma", amount: 3500, settled: false },
      { memberId: "user-3", memberName: "Pooja Iyer", amount: 3500, settled: false },
      { memberId: "user-4", memberName: "Sunil Rao", amount: 3500, settled: true },
    ],
    createdAt: "2026-10-02T10:00:00Z",
  },
  {
    id: "exp-02",
    groupId: "grp-trip-01",
    category: "FUEL",
    description: "Highway Innova Diesel & Mysore Expressway Toll",
    totalAmount: 4800,
    paidByMemberId: "user-2",
    paidByName: "Rahul Verma",
    expenseDate: "2026-10-03",
    splitMethod: "EQUAL",
    shares: [
      { memberId: "user-me", memberName: "You", amount: 1200, settled: false },
      { memberId: "user-2", memberName: "Rahul Verma", amount: 1200, settled: true },
      { memberId: "user-3", memberName: "Pooja Iyer", amount: 1200, settled: false },
      { memberId: "user-4", memberName: "Sunil Rao", amount: 1200, settled: false },
    ],
    createdAt: "2026-10-03T18:00:00Z",
  },
  {
    id: "exp-03",
    groupId: "grp-trip-01",
    category: "FOOD",
    description: "Traditional Malabar Feast Dinner",
    totalAmount: 3200,
    paidByMemberId: "user-3",
    paidByName: "Pooja Iyer",
    expenseDate: "2026-10-03",
    splitMethod: "EQUAL",
    shares: [
      { memberId: "user-me", memberName: "You", amount: 800, settled: false },
      { memberId: "user-2", memberName: "Rahul Verma", amount: 800, settled: false },
      { memberId: "user-3", memberName: "Pooja Iyer", amount: 800, settled: true },
      { memberId: "user-4", memberName: "Sunil Rao", amount: 800, settled: false },
    ],
    createdAt: "2026-10-03T21:30:00Z",
  },
];

const SEED_COLLECTIONS: VerifiedCommunityCollection[] = [
  {
    id: "col-diwali",
    title: "Mana Grand Diwali Celebration & Lightings",
    category: "Cultural Festival",
    description: "Diwali community lamps, LED building facades, cultural stage sound and prasad distribution.",
    targetAmount: 85000,
    collectedAmount: 64500,
    beneficiaryTitle: "Mana Resident Cultural Committee",
    verifiedBy: "Association Executive Committee",
    verifiedBadge: true,
    deadline: "2026-10-25",
    organizerName: "Cultural Secretary (Tower B)",
    organizerFlat: "Tower B1 - 402",
    contributorsCount: 142,
    status: "ACTIVE",
    suggestedContributionINR: 500,
  },
  {
    id: "col-generator",
    title: "Basement Lift Generator Backup Fuel Overhaul",
    category: "Infrastructure",
    description: "Emergency high-capacity diesel fuel reserve storage for Tower A & B lifts during monsoon outages.",
    targetAmount: 35000,
    collectedAmount: 31200,
    beneficiaryTitle: "Mana Facilities & Operations Fund",
    verifiedBy: "Mana Maintenance Manager",
    verifiedBadge: true,
    deadline: "2026-10-18",
    organizerName: "Facilities Wing",
    organizerFlat: "Estate Office",
    contributorsCount: 88,
    status: "ACTIVE",
    suggestedContributionINR: 400,
  },
  {
    id: "col-turf",
    title: "Children Play Area Green Safety Turf Re-laying",
    category: "Child Safety",
    description: "Replace worn-out rubber safety turf below swings and slides with shock-absorbing green turf.",
    targetAmount: 48000,
    collectedAmount: 48000,
    beneficiaryTitle: "Sports & Play Facilities",
    verifiedBy: "Mana Trust & Safety Committee",
    verifiedBadge: true,
    deadline: "2026-10-10",
    organizerName: "Parents Group",
    organizerFlat: "Tower C - 1004",
    contributorsCount: 96,
    status: "COMPLETED",
    suggestedContributionINR: 500,
  },
];

const SEED_PAYMENTS: SplitPaymentRecord[] = [
  {
    id: "pay-01",
    groupId: "grp-trip-01",
    fromMemberId: "user-4",
    fromName: "Sunil Rao",
    toMemberId: "user-me",
    toName: "You",
    amount: 3500,
    paymentMethod: "UPI",
    referenceNote: "Homestay share settled via PhonePe",
    status: "CONFIRMED",
    createdAt: "2026-10-04T12:00:00Z",
  },
];

const STORE_KEY = "mana_split_unified_store_v1";

interface SplitStore {
  groups: SplitGroup[];
  expenses: SplitExpenseItem[];
  payments: SplitPaymentRecord[];
  collections: VerifiedCommunityCollection[];
}

let inMemoryStore: SplitStore | null = null;

function loadStore(): SplitStore {
  try {
    const raw = safeStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  if (inMemoryStore) return inMemoryStore;
  return JSON.parse(
    JSON.stringify({
      groups: SEED_GROUPS,
      expenses: SEED_EXPENSES,
      payments: SEED_PAYMENTS,
      collections: SEED_COLLECTIONS,
    })
  );
}

function saveStore(store: SplitStore) {
  inMemoryStore = store;
  try {
    safeStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {}
}

// ── Service API ─────────────────────────────────────────────────────────────

export const manaSplitService = {
  // ── Group Operations ──
  getGroups(): SplitGroup[] {
    return loadStore().groups;
  },

  getGroupById(id: string): SplitGroup | null {
    return loadStore().groups.find((g) => g.id === id) || null;
  },

  createGroup(dto: {
    title: string;
    type: GroupType;
    description: string;
    memberIds?: string[];
    linkedTripId?: string;
  }): SplitGroup {
    const store = loadStore();
    const members: SplitMember[] = [CURRENT_USER];

    if (dto.memberIds) {
      dto.memberIds.forEach((id) => {
        const found = SEED_MEMBERS.find((m) => m.id === id);
        if (found && found.id !== CURRENT_USER.id) {
          members.push(found);
        }
      });
    }

    const newGroup: SplitGroup = {
      id: `grp-${Date.now()}`,
      title: dto.title,
      type: dto.type,
      description: dto.description,
      currency: "₹",
      members,
      linkedTripId: dto.linkedTripId,
      privacy: dto.type === "COMMUNITY_COLLECTION" ? "PUBLIC_COMMUNITY" : "GROUP_ONLY",
      createdAt: new Date().toISOString().split("T")[0],
    };

    store.groups.unshift(newGroup);
    saveStore(store);
    return newGroup;
  },

  // ── Expense Operations with Zero-Lost-Paise Arithmetic ──
  getExpenses(groupId?: string): SplitExpenseItem[] {
    const store = loadStore();
    if (!groupId) return store.expenses;
    return store.expenses.filter((e) => e.groupId === groupId);
  },

  createExpense(dto: {
    groupId: string;
    category: ExpenseCategory;
    description: string;
    totalAmount: number;
    paidByMemberId: string;
    splitMethod: SplitMethod;
    participants?: ParticipantShareInput[];
    receiptUrl?: string;
    recordInMyMoney?: boolean;
    accountId?: string;
  }): SplitExpenseItem {
    const store = loadStore();
    const group = store.groups.find((g) => g.id === dto.groupId);
    const members = group ? group.members : [CURRENT_USER];
    const payer = members.find((m) => m.id === dto.paidByMemberId) || CURRENT_USER;

    const totalPaise = Math.round(dto.totalAmount * 100);
    const shares: SplitExpenseItem["shares"] = [];

    if (dto.splitMethod === "EQUAL") {
      const activeMembers = dto.participants && dto.participants.length > 0
        ? members.filter((m) => dto.participants!.some((p) => p.memberId === m.id))
        : members;

      const n = activeMembers.length;
      const baseSharePaise = Math.floor(totalPaise / n);
      const remainderPaise = totalPaise % n;

      activeMembers.forEach((member, idx) => {
        const allocatedPaise = baseSharePaise + (idx < remainderPaise ? 1 : 0);
        shares.push({
          memberId: member.id,
          memberName: member.name,
          amount: allocatedPaise / 100,
          settled: member.id === payer.id,
        });
      });
    } else if (dto.splitMethod === "PERCENTAGE" && dto.participants) {
      let allocatedTotalPaise = 0;
      dto.participants.forEach((p) => {
        const member = members.find((m) => m.id === p.memberId);
        if (member) {
          const sharePaise = Math.round((totalPaise * (p.percentage || 0)) / 100);
          allocatedTotalPaise += sharePaise;
          shares.push({
            memberId: member.id,
            memberName: member.name,
            amount: sharePaise / 100,
            settled: member.id === payer.id,
          });
        }
      });
      // Adjust drift to first participant
      if (shares.length > 0 && allocatedTotalPaise !== totalPaise) {
        shares[0].amount += (totalPaise - allocatedTotalPaise) / 100;
      }
    } else if (dto.splitMethod === "QUANTITY" && dto.participants) {
      const totalUnits = dto.participants.reduce((sum, p) => sum + (p.quantity || 1), 0);
      let allocatedTotalPaise = 0;
      dto.participants.forEach((p) => {
        const member = members.find((m) => m.id === p.memberId);
        if (member && totalUnits > 0) {
          const sharePaise = Math.round((totalPaise * (p.quantity || 1)) / totalUnits);
          allocatedTotalPaise += sharePaise;
          shares.push({
            memberId: member.id,
            memberName: member.name,
            amount: sharePaise / 100,
            settled: member.id === payer.id,
          });
        }
      });
      if (shares.length > 0 && allocatedTotalPaise !== totalPaise) {
        shares[0].amount += (totalPaise - allocatedTotalPaise) / 100;
      }
    } else if (dto.splitMethod === "EXACT" && dto.participants) {
      dto.participants.forEach((p) => {
        const member = members.find((m) => m.id === p.memberId);
        if (member) {
          shares.push({
            memberId: member.id,
            memberName: member.name,
            amount: p.exactAmount || 0,
            settled: member.id === payer.id,
          });
        }
      });
    } else {
      // Default fallback
      const baseShare = Math.round((dto.totalAmount / members.length) * 100) / 100;
      members.forEach((member) => {
        shares.push({
          memberId: member.id,
          memberName: member.name,
          amount: baseShare,
          settled: member.id === payer.id,
        });
      });
    }

    const newExpense: SplitExpenseItem = {
      id: `exp-${Date.now()}`,
      groupId: dto.groupId,
      category: dto.category,
      description: dto.description,
      totalAmount: dto.totalAmount,
      paidByMemberId: payer.id,
      paidByName: payer.name,
      expenseDate: new Date().toISOString().split("T")[0],
      splitMethod: dto.splitMethod,
      receiptUrl: dto.receiptUrl,
      shares,
      createdAt: new Date().toISOString(),
    };

    store.expenses.unshift(newExpense);
    saveStore(store);

    // Explicit opt-in: Record in Personal Finance (My Money) only if explicitly enabled
    if (dto.recordInMyMoney) {
      try {
        const myShare = shares.find((s) => s.memberId === CURRENT_USER.id);
        const amountToRecord = payer.id === CURRENT_USER.id ? dto.totalAmount : (myShare?.amount || 0);
        if (amountToRecord > 0) {
          personalFinanceService.createTransaction({
            type: "EXPENSE",
            amount: amountToRecord,
            accountId: dto.accountId || "acc-1",
            categoryId: "cat-1", // Housing & Society bucket
            description: `Mana Split: ${dto.description}`,
            notes: `Split group: ${group?.title || "Community Split"}. Total bill: ₹${dto.totalAmount}`,
          });
        }
      } catch {}
    }

    return newExpense;
  },

  // ── Optimized Settlement Engine (Minimizing Multi-Way Debts) ──
  getOptimizedSettlements(groupId?: string): OptimizedTransfer[] {
    const store = loadStore();
    const group = groupId ? store.groups.find((g) => g.id === groupId) : null;
    const members = group ? group.members : SEED_MEMBERS;
    const expenses = groupId ? store.expenses.filter((e) => e.groupId === groupId) : store.expenses;
    const payments = groupId ? store.payments.filter((p) => p.groupId === groupId) : store.payments;

    // Net balance in paise for precision
    const netBalancePaise: Record<string, number> = {};
    members.forEach((m) => {
      netBalancePaise[m.id] = 0;
    });

    // Add what members paid and subtract their shares
    expenses.forEach((exp) => {
      if (netBalancePaise[exp.paidByMemberId] !== undefined) {
        netBalancePaise[exp.paidByMemberId] += Math.round(exp.totalAmount * 100);
      }
      exp.shares.forEach((share) => {
        if (netBalancePaise[share.memberId] !== undefined) {
          netBalancePaise[share.memberId] -= Math.round(share.amount * 100);
        }
      });
    });

    // Factor in confirmed payments
    payments.forEach((p) => {
      if (p.status === "CONFIRMED") {
        const amtPaise = Math.round(p.amount * 100);
        if (netBalancePaise[p.fromMemberId] !== undefined) {
          netBalancePaise[p.fromMemberId] += amtPaise;
        }
        if (netBalancePaise[p.toMemberId] !== undefined) {
          netBalancePaise[p.toMemberId] -= amtPaise;
        }
      }
    });

    // Separate into debtors (owe money) and creditors (receive money)
    interface BalanceEntry {
      memberId: string;
      balancePaise: number;
    }

    const debtors: BalanceEntry[] = [];
    const creditors: BalanceEntry[] = [];

    Object.entries(netBalancePaise).forEach(([id, bal]) => {
      if (bal < -10) debtors.push({ memberId: id, balancePaise: -bal }); // positive debt
      else if (bal > 10) creditors.push({ memberId: id, balancePaise: bal });
    });

    debtors.sort((a, b) => b.balancePaise - a.balancePaise);
    creditors.sort((a, b) => b.balancePaise - a.balancePaise);

    const transfers: OptimizedTransfer[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const transferPaise = Math.min(debtor.balancePaise, creditor.balancePaise);

      if (transferPaise > 0) {
        const fromM = members.find((m) => m.id === debtor.memberId);
        const toM = members.find((m) => m.id === creditor.memberId);

        transfers.push({
          fromMemberId: debtor.memberId,
          fromName: fromM?.name || "Participant",
          fromFlat: fromM?.flat || "",
          toMemberId: creditor.memberId,
          toName: toM?.name || "Participant",
          toFlat: toM?.flat || "",
          toUpiId: toM?.upiId || "mana.split@upi",
          amount: Math.round(transferPaise) / 100,
        });

        debtor.balancePaise -= transferPaise;
        creditor.balancePaise -= transferPaise;
      }

      if (debtor.balancePaise <= 10) dIdx++;
      if (creditor.balancePaise <= 10) cIdx++;
    }

    return transfers;
  },

  // ── Payment Settlement & Record ──
  recordPayment(dto: {
    groupId: string;
    toMemberId: string;
    amount: number;
    paymentMethod: "UPI" | "CASH" | "BANK_TRANSFER" | "MANA_WALLET";
    referenceNote?: string;
  }): SplitPaymentRecord {
    const store = loadStore();
    const group = store.groups.find((g) => g.id === dto.groupId);
    const members = group ? group.members : SEED_MEMBERS;
    const toMember = members.find((m) => m.id === dto.toMemberId);

    const payment: SplitPaymentRecord = {
      id: `pay-${Date.now()}`,
      groupId: dto.groupId,
      fromMemberId: CURRENT_USER.id,
      fromName: CURRENT_USER.name,
      toMemberId: dto.toMemberId,
      toName: toMember?.name || "Recipient",
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      referenceNote: dto.referenceNote,
      status: "CONFIRMED", // Instant confirmation for mock
      createdAt: new Date().toISOString(),
    };

    store.payments.unshift(payment);
    saveStore(store);
    return payment;
  },

  // ── Verified Community Collections ──
  getVerifiedCollections(): VerifiedCommunityCollection[] {
    return loadStore().collections;
  },

  contributeToCollection(
    collectionId: string,
    amount: number,
    recordInMyMoney: boolean = false,
    accountId: string = "acc-1"
  ): VerifiedCommunityCollection | null {
    const store = loadStore();
    const col = store.collections.find((c) => c.id === collectionId);
    if (!col) return null;

    col.collectedAmount += amount;
    col.contributorsCount += 1;
    if (col.collectedAmount >= col.targetAmount) {
      col.status = "COMPLETED";
    }

    saveStore(store);

    // Explicit opt-in: Record in Personal Finance only if requested
    if (recordInMyMoney) {
      try {
        personalFinanceService.createTransaction({
          type: "EXPENSE",
          amount,
          accountId,
          categoryId: "cat-1",
          description: `Verified Collection: ${col.title}`,
          notes: `Beneficiary: ${col.beneficiaryTitle}. Official certificate available.`,
        });
      } catch {}
    }

    return col;
  },

  // ── User Summary & Aggregates ──
  getUserOverview() {
    const store = loadStore();
    const allSettlements = this.getOptimizedSettlements();

    let youOwe = 0;
    let youReceive = 0;

    allSettlements.forEach((s) => {
      if (s.fromMemberId === CURRENT_USER.id) {
        youOwe += s.amount;
      }
      if (s.toMemberId === CURRENT_USER.id) {
        youReceive += s.amount;
      }
    });

    const netBalance = youReceive - youOwe;

    return {
      youOwe,
      youReceive,
      netBalance,
      totalGroups: store.groups.length,
      activeCollectionsCount: store.collections.filter((c) => c.status === "ACTIVE").length,
    };
  },
};
