import { useState, useEffect } from "react";
import {
  CreditCard,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Calendar,
  Building,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Clock,
  QrCode,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  communityFinanceService,
  type MaintenanceBill,
  type BillStatus,
} from "../../../services/finance/communityFinanceService";
import { useAuth } from "../../../contexts/AuthContext";

const STATUS_BADGES: Record<BillStatus, { label: string; className: string }> = {
  PAID: { label: "PAID", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  PARTIAL: { label: "PARTIALLY PAID", className: "bg-blue-100 text-blue-800 border-blue-300" },
  OVERDUE: { label: "OVERDUE", className: "bg-red-100 text-red-800 border-red-300" },
  PENDING: { label: "PENDING", className: "bg-amber-100 text-amber-800 border-amber-300" },
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function MaintenanceDues() {
  const { user } = useAuth();
  const [currentBill, setCurrentBill] = useState<MaintenanceBill | null>(null);
  const [allBills, setAllBills] = useState<MaintenanceBill[]>([]);
  const [walletBalance, setWalletBalance] = useState(2500);

  // Pay Modal State
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>("UPI");
  const [paySuccess, setPaySuccess] = useState(false);

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<MaintenanceBill | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const flatNo = user?.flatNumber || "A-101";
    const bill = communityFinanceService.getMyBill(flatNo);
    const bills = communityFinanceService.getAllBills();
    setCurrentBill(bill);
    setAllBills(bills);
    if (bill) {
      setPayAmount(bill.dueAmount);
    }
  };

  const handleOpenPay = () => {
    if (currentBill) {
      setPayAmount(currentBill.dueAmount);
    }
    setPaySuccess(false);
    setIsPayOpen(true);
  };

  const handleConfirmPay = () => {
    if (!currentBill || payAmount <= 0) return;
    communityFinanceService.recordPayment(currentBill.id, payAmount);

    if (payMethod === "WALLET") {
      setWalletBalance((prev) => Math.max(0, prev - payAmount));
    }

    setPaySuccess(true);
    loadData();
    setTimeout(() => {
      setIsPayOpen(false);
      setPaySuccess(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-emerald-300" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Society Maintenance & Dues</h1>
          </div>
          <p className="text-emerald-100 text-sm sm:text-base max-w-2xl">
            View monthly itemized maintenance invoices, check advance wallet balance, and download immutable GST receipts.
          </p>
        </div>

        {/* Advance Wallet Balance Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500 rounded-full text-white">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-emerald-200 uppercase font-semibold">Advance Wallet Balance</p>
            <p className="text-2xl font-black text-white">₹{walletBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Current Month Bill Card */}
      {currentBill ? (
        <Card className="border-2 border-emerald-500/30 shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{currentBill.billNumber}</Badge>
                <Badge variant="outline" className={`font-bold text-xs ${STATUS_BADGES[currentBill.status]?.className}`}>
                  {STATUS_BADGES[currentBill.status]?.label}
                </Badge>
              </div>
              <CardTitle className="text-xl text-slate-900 pt-1">
                Maintenance Statement &mdash; {MONTH_NAMES[currentBill.month - 1]} {currentBill.year}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                Tower {currentBill.tower} &bull; Flat {currentBill.flatNumber}
              </CardDescription>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Due by:</span>
              <p className="text-sm font-bold text-slate-800">
                {new Date(currentBill.dueDate).toLocaleDateString()}
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Itemized Table */}
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="p-3">Charge Description</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {currentBill.charges.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-medium">{c.item}</td>
                      <td className="p-3 text-right font-mono">₹{c.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t-2">
                    <td className="p-3">Total Billed</td>
                    <td className="p-3 text-right font-mono text-sm">₹{currentBill.totalAmount.toLocaleString()}</td>
                  </tr>
                  {currentBill.paidAmount > 0 && (
                    <tr className="text-emerald-700 font-medium">
                      <td className="p-3">Less: Paid Amount</td>
                      <td className="p-3 text-right font-mono">-₹{currentBill.paidAmount.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Due & Pay CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl gap-4">
              <div>
                <span className="text-xs text-emerald-800 font-semibold block uppercase">Total Payable Outstanding</span>
                <span className="text-3xl font-black text-emerald-900 font-mono">
                  ₹{currentBill.dueAmount.toLocaleString()}
                </span>
              </div>

              {currentBill.dueAmount > 0 ? (
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-md"
                  onClick={handleOpenPay}
                >
                  Pay Outstanding Due &rarr;
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  Bill is fully cleared. Thank you!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-12 text-center text-slate-400">
          <p>No active bill found for your flat.</p>
        </Card>
      )}

      {/* Bill History & Receipts Table */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent Invoices & Receipts History</CardTitle>
          <CardDescription className="text-xs">Download printable GST receipts for society maintenance payments.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b">
                <tr>
                  <th className="p-3.5">Bill Number</th>
                  <th className="p-3.5">Month/Year</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Paid Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {allBills.slice(0, 6).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono font-bold">{b.billNumber}</td>
                    <td className="p-3.5">{MONTH_NAMES[b.month - 1]} {b.year}</td>
                    <td className="p-3.5 font-mono">₹{b.totalAmount.toLocaleString()}</td>
                    <td className="p-3.5 font-mono text-emerald-700 font-semibold">₹{b.paidAmount.toLocaleString()}</td>
                    <td className="p-3.5">
                      <Badge variant="outline" className={`text-[10px] ${STATUS_BADGES[b.status]?.className}`}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs font-semibold text-emerald-700 hover:bg-emerald-50 gap-1"
                        onClick={() => setSelectedReceipt(b)}
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        View Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Pay Maintenance Dues</DialogTitle>
            <DialogDescription>
              {currentBill && `${MONTH_NAMES[currentBill.month - 1]} ${currentBill.year} Bill`}
            </DialogDescription>
          </DialogHeader>

          {paySuccess ? (
            <div className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-slate-900">Payment Successful!</h3>
              <p className="text-xs text-slate-500">Your ledger balance has been credited immediately.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Payment Amount (₹)</label>
                <Input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Payment Method</label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI (Google Pay / PhonePe / Paytm)</SelectItem>
                    <SelectItem value="CARD">Debit / Credit Card</SelectItem>
                    <SelectItem value="NETBANKING">Net Banking (HDFC / ICICI / SBI)</SelectItem>
                    <SelectItem value="WALLET">Advance Wallet (Balance: ₹{walletBalance})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Convenience Fee:</span>
                  <strong>₹0 (Free)</strong>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t text-sm">
                  <span>Total Debit:</span>
                  <span className="text-emerald-700">₹{payAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {!paySuccess && (
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPayOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={handleConfirmPay}>
                Confirm & Pay ₹{payAmount.toLocaleString()}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Printable Receipt Modal */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Official Society Maintenance Receipt
            </DialogTitle>
            <DialogDescription>Tax invoice & payment verification</DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="p-4 bg-slate-50 border rounded-xl space-y-4 text-xs">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Mana Community Owners Association</h4>
                  <p className="text-slate-500">Reg. No: BLR/SOC/2024/09842</p>
                  <p className="text-slate-500">GSTIN: 29AAAAA0000A1Z5</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-slate-400 block text-[10px]">Receipt No</span>
                  <strong>{selectedReceipt.billNumber}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Resident Flat</span>
                  <strong>Tower {selectedReceipt.tower} &bull; {selectedReceipt.flatNumber}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Billing Period</span>
                  <strong>{MONTH_NAMES[selectedReceipt.month - 1]} {selectedReceipt.year}</strong>
                </div>
              </div>

              <div className="border-t pt-2 space-y-1">
                {selectedReceipt.charges.map((c, i) => (
                  <div key={i} className="flex justify-between text-slate-600">
                    <span>{c.item}</span>
                    <span className="font-mono">₹{c.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t text-sm">
                  <span>Total Paid:</span>
                  <span className="text-emerald-700">₹{selectedReceipt.paidAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Verified Digital Ledger Entry
                </span>
                <span>Stamp: {new Date(selectedReceipt.generatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReceipt(null)}>Close</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-1" onClick={() => setSelectedReceipt(null)}>
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
