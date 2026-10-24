const BASE = "/api/khata";

export type KhataType = "VENDOR" | "PERSONAL";
export type TransactionKind = "GAVE" | "GOT";
export type PartyType = "CUSTOMER" | "SUPPLIER" | "FRIEND" | "FAMILY";

export interface KhataParty {
  id: number;
  name: string;
  phone?: string;
  khataType: KhataType;
  partyType: PartyType;
  balance: number;
  totalGave: number;
  totalGot: number;
  notes?: string;
  lastActivity?: string;
}

export interface KhataEntry {
  id: number;
  partyId: number;
  kind: TransactionKind;
  amount: number;
  note?: string;
  entryDate: string;
  hasReceipt: boolean;
  reminderSent?: boolean;
}

export interface KhataStats {
  totalReceivable: number;
  totalPayable: number;
  netBalance: number;
  partiesWithBalance: number;
}

// ── sample data ──────────────────────────────────────────────────────────────

const VENDOR_PARTIES: KhataParty[] = [
  { id: 1, name: "Ramesh Plumbing", phone: "9876543210", khataType: "VENDOR", partyType: "SUPPLIER", balance: 4500, totalGave: 4500, totalGot: 0, lastActivity: new Date().toISOString() },
  { id: 2, name: "City Electric Store", phone: "9123456780", khataType: "VENDOR", partyType: "SUPPLIER", balance: -2000, totalGave: 5000, totalGot: 7000, lastActivity: new Date().toISOString() },
  { id: 3, name: "Sharma Paints", phone: "8988776655", khataType: "VENDOR", partyType: "CUSTOMER", balance: 12000, totalGave: 12000, totalGot: 0, lastActivity: new Date().toISOString() },
];

const PERSONAL_PARTIES: KhataParty[] = [
  { id: 10, name: "Rohit Sharma", phone: "9811223344", khataType: "PERSONAL", partyType: "FRIEND", balance: 3000, totalGave: 3000, totalGot: 0, lastActivity: new Date().toISOString() },
  { id: 11, name: "Priya Aunty", phone: "9765432109", khataType: "PERSONAL", partyType: "FAMILY", balance: -5000, totalGave: 0, totalGot: 5000, lastActivity: new Date().toISOString() },
];

const PARTY_ENTRIES: Record<number, KhataEntry[]> = {
  1: [
    { id: 101, partyId: 1, kind: "GAVE", amount: 4500, note: "Advance for bathroom repair", entryDate: "2026-10-10", hasReceipt: false },
  ],
  2: [
    { id: 201, partyId: 2, kind: "GOT", amount: 7000, note: "Full payment received", entryDate: "2026-10-15", hasReceipt: true },
    { id: 202, partyId: 2, kind: "GAVE", amount: 5000, note: "Wiring materials", entryDate: "2026-10-05", hasReceipt: false },
  ],
  3: [
    { id: 301, partyId: 3, kind: "GAVE", amount: 12000, note: "Paint + labour for flat 401", entryDate: "2026-10-18", hasReceipt: false },
  ],
  10: [
    { id: 1001, partyId: 10, kind: "GAVE", amount: 3000, note: "Lent for emergency", entryDate: "2026-10-12", hasReceipt: false },
  ],
  11: [
    { id: 1101, partyId: 11, kind: "GOT", amount: 5000, note: "Borrowed for AC repair", entryDate: "2026-10-01", hasReceipt: false },
  ],
};

// ── service ──────────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const khatabookService = {
  async getVendorParties(): Promise<KhataParty[]> {
    try {
      return await fetchJSON<KhataParty[]>(`${BASE}/vendor/parties`);
    } catch {
      return VENDOR_PARTIES;
    }
  },

  async getVendorStats(): Promise<KhataStats> {
    try {
      return await fetchJSON<KhataStats>(`${BASE}/vendor/stats`);
    } catch {
      const receivable = VENDOR_PARTIES.filter(p => p.balance > 0).reduce((s, p) => s + p.balance, 0);
      const payable = VENDOR_PARTIES.filter(p => p.balance < 0).reduce((s, p) => s + Math.abs(p.balance), 0);
      return { totalReceivable: receivable, totalPayable: payable, netBalance: receivable - payable, partiesWithBalance: VENDOR_PARTIES.filter(p => p.balance !== 0).length };
    }
  },

  async getPersonalParties(): Promise<KhataParty[]> {
    try {
      return await fetchJSON<KhataParty[]>(`${BASE}/personal/parties`);
    } catch {
      return PERSONAL_PARTIES;
    }
  },

  async getPersonalStats(): Promise<KhataStats> {
    try {
      return await fetchJSON<KhataStats>(`${BASE}/personal/stats`);
    } catch {
      const receivable = PERSONAL_PARTIES.filter(p => p.balance > 0).reduce((s, p) => s + p.balance, 0);
      const payable = PERSONAL_PARTIES.filter(p => p.balance < 0).reduce((s, p) => s + Math.abs(p.balance), 0);
      return { totalReceivable: receivable, totalPayable: payable, netBalance: receivable - payable, partiesWithBalance: PERSONAL_PARTIES.filter(p => p.balance !== 0).length };
    }
  },

  async getEntries(partyId: number): Promise<KhataEntry[]> {
    try {
      return await fetchJSON<KhataEntry[]>(`${BASE}/parties/${partyId}/entries`);
    } catch {
      return PARTY_ENTRIES[partyId] ?? [];
    }
  },

  async addEntry(partyId: number, dto: { kind: TransactionKind; amount: number; note?: string }): Promise<KhataEntry> {
    const res = await fetch(`${BASE}/parties/${partyId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...dto, date: new Date().toISOString().split("T")[0] }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async addVendorParty(dto: { name: string; phone?: string; partyType: string; notes?: string }): Promise<KhataParty> {
    const res = await fetch(`${BASE}/vendor/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async addPersonalParty(dto: { name: string; phone?: string; partyType: string; notes?: string }): Promise<KhataParty> {
    const res = await fetch(`${BASE}/personal/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};
