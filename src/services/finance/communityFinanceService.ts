export type BillStatus = "PAID" | "PARTIAL" | "OVERDUE" | "PENDING";

export interface BillCharge {
  item: string;
  amount: number;
}

export interface MaintenanceBill {
  id: string;
  billNumber: string;
  flatNumber: string;
  tower: string;
  month: number;
  year: number;
  charges: BillCharge[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: BillStatus;
  generatedAt: string;
  paidAt?: string;
}

export interface FinanceSummary {
  totalCollected: number;
  totalDue: number;
  totalOverdue: number;
  collectionPercent: number;
  activeFlats: number;
  paidFlats: number;
  overdueFlats: number;
}

const STANDARD_CHARGES: BillCharge[] = [
  { item: "Maintenance Fee", amount: 3500 },
  { item: "Water Charges", amount: 450 },
  { item: "Power Backup", amount: 800 },
  { item: "Parking Fee", amount: 500 },
  { item: "Gym Membership", amount: 300 },
];

const TOTAL_STANDARD = STANDARD_CHARGES.reduce((s, c) => s + c.amount, 0);

function makeBill(
  id: string, billNum: string, flat: string, tower: string,
  month: number, year: number, status: BillStatus, paidAmount: number,
  daysOld: number
): MaintenanceBill {
  const total = TOTAL_STANDARD;
  const due = total - paidAmount;
  const generatedDate = new Date(Date.now() - daysOld * 86400000);
  const dueDate = new Date(generatedDate.getTime() + 10 * 86400000);
  return {
    id, billNumber: billNum, flatNumber: flat, tower, month, year,
    charges: [...STANDARD_CHARGES],
    totalAmount: total, paidAmount, dueAmount: due, status,
    dueDate: dueDate.toISOString(),
    generatedAt: generatedDate.toISOString(),
    paidAt: status === "PAID" ? new Date(dueDate.getTime() - 2 * 86400000).toISOString() : undefined,
  };
}

const now = new Date();
const cm = now.getMonth() + 1;
const cy = now.getFullYear();
const pm = cm === 1 ? 12 : cm - 1;
const py = cm === 1 ? cy - 1 : cy;

const SAMPLE_BILLS: MaintenanceBill[] = [
  makeBill("b-01", `BILL-${cy}${String(cm).padStart(2,"0")}-302A`, "302", "A", cm, cy, "PENDING", 0, 5),
  makeBill("b-02", `BILL-${py}${String(pm).padStart(2,"0")}-302A`, "302", "A", pm, py, "PAID", TOTAL_STANDARD, 35),
  makeBill("b-03", `BILL-${py}${String(pm === 1 ? 12 : pm - 1).padStart(2,"0")}-302A`, "302", "A", pm === 1 ? 12 : pm - 1, pm === 1 ? py - 1 : py, "PAID", TOTAL_STANDARD, 65),
  makeBill("b-04", `BILL-${cy}${String(cm).padStart(2,"0")}-204B`, "204", "B", cm, cy, "OVERDUE", 0, 15),
  makeBill("b-05", `BILL-${cy}${String(cm).padStart(2,"0")}-501C`, "501", "C", cm, cy, "PARTIAL", 2500, 8),
  makeBill("b-06", `BILL-${py}${String(pm).padStart(2,"0")}-204B`, "204", "B", pm, py, "OVERDUE", 0, 45),
];

export const communityFinanceService = {
  getMyBill(flatNumber?: string): MaintenanceBill {
    const flat = flatNumber || "302";
    const tower = flat.length > 0 ? "A" : "A";
    const found = SAMPLE_BILLS.find(b => b.flatNumber === flat && b.month === cm && b.year === cy);
    return found || makeBill(`b-cur-${flat}`, `BILL-${cy}${String(cm).padStart(2,"0")}-${flat}${tower}`, flat, tower, cm, cy, "PENDING", 0, 3);
  },

  getAllBills(filter?: { tower?: string; status?: BillStatus; month?: number; year?: number }): MaintenanceBill[] {
    let bills = SAMPLE_BILLS;
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

  getSummary(): FinanceSummary {
    const bills = SAMPLE_BILLS.filter(b => b.month === cm && b.year === cy);
    const totalCollected = bills.reduce((s, b) => s + b.paidAmount, 0);
    const totalDue = bills.reduce((s, b) => s + b.dueAmount, 0);
    const totalOverdue = bills.filter(b => b.status === "OVERDUE").reduce((s, b) => s + b.dueAmount, 0);
    const activeFlats = 120;
    const paidFlats = bills.filter(b => b.status === "PAID").length;
    const overdueFlats = bills.filter(b => b.status === "OVERDUE").length;
    return {
      totalCollected,
      totalDue,
      totalOverdue,
      collectionPercent: Math.round((totalCollected / (totalCollected + totalDue)) * 100) || 0,
      activeFlats,
      paidFlats,
      overdueFlats,
    };
  },

  recordPayment(billId: string, amount: number): MaintenanceBill | null {
    const bill = SAMPLE_BILLS.find(b => b.id === billId);
    if (!bill) return null;
    const newPaid = bill.paidAmount + amount;
    const newDue = bill.totalAmount - newPaid;
    bill.paidAmount = newPaid;
    bill.dueAmount = newDue;
    bill.status = newDue <= 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : bill.status;
    if (bill.status === "PAID") bill.paidAt = new Date().toISOString();
    return bill;
  },

  generateMonthlyBills(_month: number, _year: number): number {
    // In production this would create bills for all flats
    return 120;
  },
};
