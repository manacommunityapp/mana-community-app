import type {
  WalletBalance,
  WalletTransaction,
  MatchFeeCollection,
  MatchFeeParticipant,
  ExpenseSplit,
  ExpenseSplitMember,
  TransactionCategory,
  TransactionType,
  SplitStatus,
} from "../../types/sportsWallet";

const STORAGE_KEY_BALANCE = "mana_sports_wallet_balance_v1";
const STORAGE_KEY_TRANSACTIONS = "mana_sports_wallet_txns_v1";
const STORAGE_KEY_FEE_COLLECTIONS = "mana_sports_fee_collections_v1";
const STORAGE_KEY_EXPENSE_SPLITS = "mana_sports_expense_splits_v1";

const DEFAULT_BALANCE: WalletBalance = {
  available: 2450,
  pending: 600,
  totalEarned: 18500,
  totalSpent: 15450,
  currency: "INR",
};

const DEFAULT_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "txn-1",
    type: "DEBIT",
    category: "MATCH_FEE",
    amount: 300,
    currency: "INR",
    description: "Weekend Box Cricket - Whitefield",
    counterpartyName: "Ravi's Team Fund",
    matchId: "m-101",
    status: "COMPLETED",
    createdAt: "2026-10-28T18:30:00.000Z",
    completedAt: "2026-10-28T18:30:00.000Z",
  },
  {
    id: "txn-2",
    type: "DEBIT",
    category: "TOURNAMENT_ENTRY",
    amount: 1500,
    currency: "INR",
    description: "Sarjapur Corporate Cup - Team Entry",
    counterpartyName: "Tournament Organizer",
    tournamentId: "t-201",
    status: "COMPLETED",
    createdAt: "2026-10-25T10:00:00.000Z",
    completedAt: "2026-10-25T10:05:00.000Z",
  },
  {
    id: "txn-3",
    type: "CREDIT",
    category: "TOP_UP",
    amount: 2000,
    currency: "INR",
    description: "Wallet Top-up via UPI",
    status: "COMPLETED",
    createdAt: "2026-10-24T09:15:00.000Z",
    completedAt: "2026-10-24T09:15:00.000Z",
  },
  {
    id: "txn-4",
    type: "DEBIT",
    category: "VENUE_BOOKING",
    amount: 800,
    currency: "INR",
    description: "SmashZone Badminton Court - 2hr slot",
    counterpartyName: "SmashZone Arena",
    status: "COMPLETED",
    createdAt: "2026-10-22T14:00:00.000Z",
    completedAt: "2026-10-22T14:00:00.000Z",
  },
  {
    id: "txn-5",
    type: "CREDIT",
    category: "REFUND",
    amount: 450,
    currency: "INR",
    description: "Refund - Cancelled tennis session",
    counterpartyName: "CoachConnect",
    status: "COMPLETED",
    createdAt: "2026-10-20T11:30:00.000Z",
    completedAt: "2026-10-21T09:00:00.000Z",
  },
  {
    id: "txn-6",
    type: "DEBIT",
    category: "EXPENSE_SPLIT",
    amount: 250,
    currency: "INR",
    description: "Team dinner split after match",
    counterpartyName: "Suresh K",
    status: "COMPLETED",
    createdAt: "2026-10-19T21:00:00.000Z",
    completedAt: "2026-10-19T21:00:00.000Z",
  },
  {
    id: "txn-7",
    type: "CREDIT",
    category: "REWARD",
    amount: 100,
    currency: "INR",
    description: "Man of the Match bonus - Whitefield league",
    matchId: "m-98",
    status: "COMPLETED",
    createdAt: "2026-10-18T20:00:00.000Z",
    completedAt: "2026-10-18T20:00:00.000Z",
  },
  {
    id: "txn-8",
    type: "DEBIT",
    category: "MATCH_FEE",
    amount: 300,
    currency: "INR",
    description: "Sunday Football 7-a-side - HSR Layout",
    counterpartyName: "Vikram's Team Fund",
    matchId: "m-95",
    status: "PENDING",
    createdAt: "2026-10-31T07:00:00.000Z",
  },
];

const DEFAULT_FEE_COLLECTIONS: MatchFeeCollection[] = [
  {
    id: "fee-1",
    matchId: "m-110",
    matchTitle: "Weekend Box Cricket - Whitefield",
    sport: "CRICKET",
    date: "2026-11-02",
    venue: "SmashZone Arena - Whitefield",
    totalAmount: 3600,
    perPlayerAmount: 300,
    collectedAmount: 2700,
    status: "COLLECTING",
    participants: [
      { playerId: "p-1", playerName: "Ravi Kumar", amount: 300, status: "PAID", paidAt: "2026-10-30T10:00:00Z" },
      { playerId: "p-2", playerName: "Suresh Babu", amount: 300, status: "PAID", paidAt: "2026-10-30T11:30:00Z" },
      { playerId: "p-3", playerName: "Anitha Reddy", amount: 300, status: "PAID", paidAt: "2026-10-30T12:00:00Z" },
      { playerId: "p-4", playerName: "Vikram Singh", amount: 300, status: "PAID", paidAt: "2026-10-30T14:00:00Z" },
      { playerId: "p-5", playerName: "Priya Sharma", amount: 300, status: "PAID", paidAt: "2026-10-30T15:00:00Z" },
      { playerId: "p-6", playerName: "Deepak Nair", amount: 300, status: "PAID", paidAt: "2026-10-31T09:00:00Z" },
      { playerId: "p-7", playerName: "Karthik M", amount: 300, status: "PAID", paidAt: "2026-10-31T10:30:00Z" },
      { playerId: "p-8", playerName: "Lakshmi Iyer", amount: 300, status: "PAID", paidAt: "2026-10-31T11:00:00Z" },
      { playerId: "p-9", playerName: "Mohammed Irfan", amount: 300, status: "PAID", paidAt: "2026-10-31T12:00:00Z" },
      { playerId: "p-10", playerName: "Sneha G", amount: 300, status: "PENDING" },
      { playerId: "p-11", playerName: "Arun Prasad", amount: 300, status: "PENDING" },
      { playerId: "p-12", playerName: "Meena J", amount: 300, status: "PENDING" },
    ],
    createdBy: "p-1",
    createdAt: "2026-10-29T08:00:00Z",
  },
  {
    id: "fee-2",
    matchId: "m-105",
    matchTitle: "Sunday Football 7-a-side",
    sport: "FOOTBALL",
    date: "2026-11-03",
    venue: "HSR Sports Ground",
    totalAmount: 2100,
    perPlayerAmount: 150,
    collectedAmount: 2100,
    status: "COMPLETE",
    participants: [
      { playerId: "p-1", playerName: "Ravi Kumar", amount: 150, status: "PAID", paidAt: "2026-10-31T09:00:00Z" },
      { playerId: "p-4", playerName: "Vikram Singh", amount: 150, status: "PAID", paidAt: "2026-10-31T09:30:00Z" },
      { playerId: "p-6", playerName: "Deepak Nair", amount: 150, status: "PAID", paidAt: "2026-10-31T10:00:00Z" },
      { playerId: "p-7", playerName: "Karthik M", amount: 150, status: "PAID", paidAt: "2026-10-31T10:30:00Z" },
      { playerId: "p-8", playerName: "Lakshmi Iyer", amount: 150, status: "PAID", paidAt: "2026-10-31T11:00:00Z" },
      { playerId: "p-9", playerName: "Mohammed Irfan", amount: 150, status: "PAID", paidAt: "2026-10-31T11:30:00Z" },
      { playerId: "p-11", playerName: "Arun Prasad", amount: 150, status: "PAID", paidAt: "2026-10-31T12:00:00Z" },
      { playerId: "p-13", playerName: "Ramesh T", amount: 150, status: "PAID", paidAt: "2026-10-31T12:30:00Z" },
      { playerId: "p-14", playerName: "Shreya V", amount: 150, status: "PAID", paidAt: "2026-10-31T13:00:00Z" },
      { playerId: "p-15", playerName: "Ganesh R", amount: 150, status: "PAID", paidAt: "2026-10-31T13:30:00Z" },
      { playerId: "p-16", playerName: "Kavitha S", amount: 150, status: "PAID", paidAt: "2026-10-31T14:00:00Z" },
      { playerId: "p-17", playerName: "Prashanth N", amount: 150, status: "PAID", paidAt: "2026-10-31T14:30:00Z" },
      { playerId: "p-18", playerName: "Nandini P", amount: 150, status: "PAID", paidAt: "2026-10-31T15:00:00Z" },
      { playerId: "p-19", playerName: "Harish D", amount: 150, status: "PAID", paidAt: "2026-10-31T15:30:00Z" },
    ],
    createdBy: "p-4",
    createdAt: "2026-10-30T07:00:00Z",
  },
];

const DEFAULT_EXPENSE_SPLITS: ExpenseSplit[] = [
  {
    id: "split-1",
    title: "Post-match team dinner",
    description: "Dinner at Meghana Foods after the Whitefield match",
    totalAmount: 2400,
    currency: "INR",
    category: "FOOD",
    splitType: "EQUAL",
    status: "ACTIVE",
    createdBy: "p-1",
    createdByName: "Ravi Kumar",
    members: [
      { playerId: "p-1", playerName: "Ravi Kumar", shareAmount: 400, status: "PAID", paidAt: "2026-10-28T22:00:00Z" },
      { playerId: "p-2", playerName: "Suresh Babu", shareAmount: 400, status: "PAID", paidAt: "2026-10-28T22:15:00Z" },
      { playerId: "p-4", playerName: "Vikram Singh", shareAmount: 400, status: "PENDING" },
      { playerId: "p-6", playerName: "Deepak Nair", shareAmount: 400, status: "PAID", paidAt: "2026-10-29T08:00:00Z" },
      { playerId: "p-7", playerName: "Karthik M", shareAmount: 400, status: "PENDING" },
      { playerId: "p-9", playerName: "Mohammed Irfan", shareAmount: 400, status: "DECLINED" },
    ],
    createdAt: "2026-10-28T21:30:00Z",
  },
  {
    id: "split-2",
    title: "Equipment purchase - Cricket kit",
    description: "New bat, 6 balls, stumps for team practice",
    totalAmount: 3500,
    currency: "INR",
    category: "EQUIPMENT",
    splitType: "EQUAL",
    status: "SETTLED",
    createdBy: "p-2",
    createdByName: "Suresh Babu",
    members: [
      { playerId: "p-1", playerName: "Ravi Kumar", shareAmount: 500, status: "PAID", paidAt: "2026-10-15T10:00:00Z" },
      { playerId: "p-2", playerName: "Suresh Babu", shareAmount: 500, status: "PAID", paidAt: "2026-10-15T10:00:00Z" },
      { playerId: "p-3", playerName: "Anitha Reddy", shareAmount: 500, status: "PAID", paidAt: "2026-10-16T08:00:00Z" },
      { playerId: "p-4", playerName: "Vikram Singh", shareAmount: 500, status: "PAID", paidAt: "2026-10-16T09:00:00Z" },
      { playerId: "p-5", playerName: "Priya Sharma", shareAmount: 500, status: "PAID", paidAt: "2026-10-17T11:00:00Z" },
      { playerId: "p-6", playerName: "Deepak Nair", shareAmount: 500, status: "PAID", paidAt: "2026-10-17T12:00:00Z" },
      { playerId: "p-7", playerName: "Karthik M", shareAmount: 500, status: "PAID", paidAt: "2026-10-18T10:00:00Z" },
    ],
    createdAt: "2026-10-14T18:00:00Z",
    settledAt: "2026-10-18T10:00:00Z",
  },
];

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const sportsWalletService = {
  getBalance(): WalletBalance {
    return loadJson(STORAGE_KEY_BALANCE, DEFAULT_BALANCE);
  },

  getTransactions(filter?: { category?: TransactionCategory; type?: TransactionType }): WalletTransaction[] {
    const txns = loadJson(STORAGE_KEY_TRANSACTIONS, DEFAULT_TRANSACTIONS);
    if (!filter) return txns;
    return txns.filter((t) => {
      if (filter.category && t.category !== filter.category) return false;
      if (filter.type && t.type !== filter.type) return false;
      return true;
    });
  },

  addTransaction(tx: Omit<WalletTransaction, "id" | "createdAt">): WalletTransaction {
    const txns = loadJson(STORAGE_KEY_TRANSACTIONS, DEFAULT_TRANSACTIONS);
    const newTx: WalletTransaction = {
      ...tx,
      id: genId("txn"),
      createdAt: new Date().toISOString(),
    };
    txns.unshift(newTx);
    saveJson(STORAGE_KEY_TRANSACTIONS, txns);

    const bal = this.getBalance();
    if (tx.type === "CREDIT" && tx.status === "COMPLETED") {
      bal.available += tx.amount;
      bal.totalEarned += tx.amount;
    } else if (tx.type === "DEBIT" && tx.status === "COMPLETED") {
      bal.available -= tx.amount;
      bal.totalSpent += tx.amount;
    } else if (tx.status === "PENDING") {
      bal.pending += tx.amount;
    }
    saveJson(STORAGE_KEY_BALANCE, bal);
    return newTx;
  },

  topUp(amount: number): WalletTransaction {
    return this.addTransaction({
      type: "CREDIT",
      category: "TOP_UP",
      amount,
      currency: "INR",
      description: "Wallet Top-up via UPI",
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
    });
  },

  getFeeCollections(): MatchFeeCollection[] {
    return loadJson(STORAGE_KEY_FEE_COLLECTIONS, DEFAULT_FEE_COLLECTIONS);
  },

  getFeeCollection(id: string): MatchFeeCollection | undefined {
    return this.getFeeCollections().find((f) => f.id === id);
  },

  createFeeCollection(data: Omit<MatchFeeCollection, "id" | "createdAt" | "collectedAmount" | "status">): MatchFeeCollection {
    const collections = this.getFeeCollections();
    const newFee: MatchFeeCollection = {
      ...data,
      id: genId("fee"),
      collectedAmount: 0,
      status: "COLLECTING",
      createdAt: new Date().toISOString(),
    };
    collections.unshift(newFee);
    saveJson(STORAGE_KEY_FEE_COLLECTIONS, collections);
    return newFee;
  },

  markParticipantPaid(feeId: string, playerId: string): MatchFeeCollection | undefined {
    const collections = this.getFeeCollections();
    const fee = collections.find((f) => f.id === feeId);
    if (!fee) return undefined;

    const participant = fee.participants.find((p) => p.playerId === playerId);
    if (!participant || participant.status === "PAID") return fee;

    participant.status = "PAID";
    participant.paidAt = new Date().toISOString();
    fee.collectedAmount += participant.amount;

    if (fee.participants.every((p) => p.status === "PAID")) {
      fee.status = "COMPLETE";
    }

    saveJson(STORAGE_KEY_FEE_COLLECTIONS, collections);
    return fee;
  },

  remindParticipant(feeId: string, playerId: string): MatchFeeCollection | undefined {
    const collections = this.getFeeCollections();
    const fee = collections.find((f) => f.id === feeId);
    if (!fee) return undefined;

    const participant = fee.participants.find((p) => p.playerId === playerId);
    if (participant && participant.status === "PENDING") {
      participant.status = "REMINDED";
    }

    saveJson(STORAGE_KEY_FEE_COLLECTIONS, collections);
    return fee;
  },

  getExpenseSplits(): ExpenseSplit[] {
    return loadJson(STORAGE_KEY_EXPENSE_SPLITS, DEFAULT_EXPENSE_SPLITS);
  },

  getExpenseSplit(id: string): ExpenseSplit | undefined {
    return this.getExpenseSplits().find((s) => s.id === id);
  },

  createExpenseSplit(data: Omit<ExpenseSplit, "id" | "createdAt" | "status">): ExpenseSplit {
    const splits = this.getExpenseSplits();
    const newSplit: ExpenseSplit = {
      ...data,
      id: genId("split"),
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
    splits.unshift(newSplit);
    saveJson(STORAGE_KEY_EXPENSE_SPLITS, splits);
    return newSplit;
  },

  markSplitMemberPaid(splitId: string, playerId: string): ExpenseSplit | undefined {
    const splits = this.getExpenseSplits();
    const split = splits.find((s) => s.id === splitId);
    if (!split) return undefined;

    const member = split.members.find((m) => m.playerId === playerId);
    if (member && member.status !== "PAID") {
      member.status = "PAID";
      member.paidAt = new Date().toISOString();
    }

    if (split.members.every((m) => m.status === "PAID" || m.status === "DECLINED")) {
      split.status = "SETTLED";
      split.settledAt = new Date().toISOString();
    }

    saveJson(STORAGE_KEY_EXPENSE_SPLITS, splits);
    return split;
  },

  remindSplitMember(splitId: string, playerId: string): ExpenseSplit | undefined {
    const splits = this.getExpenseSplits();
    const split = splits.find((s) => s.id === splitId);
    if (!split) return undefined;

    const member = split.members.find((m) => m.playerId === playerId);
    if (member && member.status === "PENDING") {
      member.status = "REMINDED";
    }

    saveJson(STORAGE_KEY_EXPENSE_SPLITS, splits);
    return split;
  },
};
