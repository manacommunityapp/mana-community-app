import { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  Building,
  RefreshCw,
  Search,
  Filter,
  PieChart,
  ArrowUpRight,
  Clock,
  Plus,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
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
  type FinanceSummary,
  type BillStatus,
} from "../../../services/finance/communityFinanceService";

const STATUS_BADGES: Record<BillStatus, { label: string; className: string }> = {
  PAID: { label: "PAID", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  PARTIAL: { label: "PARTIALLY PAID", className: "bg-blue-100 text-blue-800 border-blue-300" },
  OVERDUE: { label: "OVERDUE", className: "bg-red-100 text-red-800 border-red-300" },
  PENDING: { label: "PENDING", className: "bg-amber-100 text-amber-800 border-amber-300" },
};

export function AdminBillingDashboard() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [towerFilter, setTowerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Run Monthly Billing Dialog
  const [isRunBillingOpen, setIsRunBillingOpen] = useState(false);
  const [billingMonth, setBillingMonth] = useState("10");
  const [billingYear, setBillingYear] = useState("2026");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSummary(communityFinanceService.getSummary());
    setBills(communityFinanceService.getAllBills());
  };

  const handleGenerateMonthlyBills = () => {
    setIsGenerating(true);
    communityFinanceService.generateMonthlyBills(Number(billingMonth), Number(billingYear));
    setTimeout(() => {
      setIsGenerating(false);
      setGenerateSuccess(true);
      loadData();
      setTimeout(() => {
        setIsRunBillingOpen(false);
        setGenerateSuccess(false);
      }, 1200);
    }, 1000);
  };

  const filteredBills = bills.filter((b) => {
    if (towerFilter !== "ALL" && b.tower !== towerFilter) return false;
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.billNumber.toLowerCase().includes(q) || b.flatNumber.toLowerCase().includes(q);
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Society Finance & Billing Operations</h1>
          </div>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
            Automated monthly maintenance billing runs, overdue collection tracking, and tower-wise ledger analytics.
          </p>
        </div>
        <Button
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md text-base px-6 py-6 rounded-xl flex items-center gap-2"
          onClick={() => setIsRunBillingOpen(true)}
        >
          <RefreshCw className="w-5 h-5" />
          Run Monthly Billing Cycle
        </Button>
      </div>

      {/* Top Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold">Total Collected</CardDescription>
              <CardTitle className="text-2xl font-black text-emerald-600">
                ₹{(summary.totalCollected / 100000).toFixed(2)} L
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-slate-500">
              {summary.collectionPercent}% of total demand
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold">Total Outstanding</CardDescription>
              <CardTitle className="text-2xl font-black text-amber-600">
                ₹{(summary.totalDue / 100000).toFixed(2)} L
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-slate-500">
              Pending resident clearance
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold">Overdue Defaulters</CardDescription>
              <CardTitle className="text-2xl font-black text-red-600">{summary.overdueFlats} Flats</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-slate-500">
              Late fee interest active
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-semibold">Flats Cleared</CardDescription>
              <CardTitle className="text-2xl font-black text-blue-700">
                {summary.paidFlats} / {summary.activeFlats}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[11px] text-slate-500">
              Active billable accounts
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aging & Tower Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tower-wise Collection */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Tower-Wise Collection Progress</CardTitle>
            <CardDescription className="text-xs">Real-time payment clearance by building tower</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { tower: "Tower A", collected: 92, amount: "₹4.8L / ₹5.2L" },
              { tower: "Tower B", collected: 86, amount: "₹4.1L / ₹4.8L" },
              { tower: "Tower C", collected: 95, amount: "₹5.1L / ₹5.4L" },
              { tower: "Tower D", collected: 78, amount: "₹3.8L / ₹4.9L" },
            ].map((t, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>{t.tower} ({t.collected}%)</span>
                  <span className="text-slate-500 font-mono">{t.amount}</span>
                </div>
                <Progress value={t.collected} className="h-2 bg-slate-100" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Aging Buckets */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Outstanding Aging Buckets</CardTitle>
            <CardDescription className="text-xs">Delinquency distribution across overdue aging slabs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-slate-400 block text-[10px]">0 - 30 Days</span>
                <strong className="text-emerald-900 font-bold text-sm">₹1.85 L</strong>
                <span className="text-[10px] text-emerald-700 block">32 Flats</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-slate-400 block text-[10px]">31 - 60 Days</span>
                <strong className="text-amber-900 font-bold text-sm">₹92,000</strong>
                <span className="text-[10px] text-amber-700 block">14 Flats</span>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <span className="text-slate-400 block text-[10px]">61 - 90 Days</span>
                <strong className="text-orange-900 font-bold text-sm">₹45,000</strong>
                <span className="text-[10px] text-orange-700 block">6 Flats</span>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-slate-400 block text-[10px]">&gt; 90 Days</span>
                <strong className="text-red-900 font-bold text-sm">₹28,500</strong>
                <span className="text-[10px] text-red-700 block">3 Flats</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border rounded-lg text-slate-500 text-[11px] leading-relaxed">
              * Automated 1.5% monthly penal interest is calculated daily and added to invoices outstanding beyond 30 days.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Society Bills Table */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">All Maintenance Bills & Invoices</CardTitle>
            <CardDescription className="text-xs">Search, filter, and review society ledger billing status.</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search flat or bill..."
                className="pl-8 text-xs h-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={towerFilter} onValueChange={setTowerFilter}>
              <SelectTrigger className="w-28 text-xs h-8">
                <SelectValue placeholder="Tower" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Towers</SelectItem>
                <SelectItem value="A">Tower A</SelectItem>
                <SelectItem value="B">Tower B</SelectItem>
                <SelectItem value="C">Tower C</SelectItem>
                <SelectItem value="D">Tower D</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28 text-xs h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b">
                <tr>
                  <th className="p-3">Bill Number</th>
                  <th className="p-3">Tower / Flat</th>
                  <th className="p-3">Billed (₹)</th>
                  <th className="p-3">Paid (₹)</th>
                  <th className="p-3">Due (₹)</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{b.billNumber}</td>
                    <td className="p-3 font-medium">Tower {b.tower} &bull; {b.flatNumber}</td>
                    <td className="p-3 font-mono">₹{b.totalAmount.toLocaleString()}</td>
                    <td className="p-3 font-mono text-emerald-700 font-semibold">₹{b.paidAmount.toLocaleString()}</td>
                    <td className="p-3 font-mono text-amber-700 font-bold">₹{b.dueAmount.toLocaleString()}</td>
                    <td className="p-3">{new Date(b.dueDate).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-[10px] ${STATUS_BADGES[b.status]?.className}`}>
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Run Monthly Billing Modal */}
      <Dialog open={isRunBillingOpen} onOpenChange={setIsRunBillingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              <DialogTitle className="text-xl font-bold">Run Monthly Billing Cycle</DialogTitle>
            </div>
            <DialogDescription>
              Generates itemized maintenance statements for all active flats in Towers A, B, C, and D.
            </DialogDescription>
          </DialogHeader>

          {generateSuccess ? (
            <div className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-slate-900">Billing Cycle Generated!</h3>
              <p className="text-xs text-slate-500">Invoices dispatched via email & SMS notifications sent.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Billing Month</label>
                  <Select value={billingMonth} onValueChange={setBillingMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">October 2026</SelectItem>
                      <SelectItem value="11">November 2026</SelectItem>
                      <SelectItem value="12">December 2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Financial Year</label>
                  <Input value={billingYear} onChange={(e) => setBillingYear(e.target.value)} />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-indigo-900">
                  <span>Flats to Bill:</span>
                  <span>148 Active Flats</span>
                </div>
                <div className="flex justify-between text-indigo-800">
                  <span>Standard Rate per Unit:</span>
                  <span>₹5,550</span>
                </div>
                <div className="flex justify-between font-bold text-indigo-900 pt-1 border-t">
                  <span>Total Expected Demand:</span>
                  <span>₹8,21,400</span>
                </div>
              </div>
            </div>
          )}

          {!generateSuccess && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRunBillingOpen(false)}>Cancel</Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                onClick={handleGenerateMonthlyBills}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating Invoices..." : "Execute Billing Run"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
