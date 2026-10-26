import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, CreditCard, FileText, Wallet, QrCode, AlertCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import { ManaPayQrCode } from "../..//payments/unified/ManaPayQrCode";
import { vendorMerchantPaymentService, type VendorMerchantProfileDto, type SettlementBatchDto } from "../../../../services/vendor/vendorMerchantPaymentService";
import type { VendorInvoiceResponse, VendorPaymentResponse } from "../../../../types/api";

type Tab = "overview" | "invoices" | "payments" | "settlements" | "upi";
const money = (amount: number) => `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const date = (value?: string) => value ? new Date(value).toLocaleDateString("en-IN") : "—";

export const VendorMerchantPayments: React.FC = () => {
  const [tab, setTab] = useState<Tab>("overview");
  const [profile, setProfile] = useState<VendorMerchantProfileDto | null>(null);
  const [invoices, setInvoices] = useState<VendorInvoiceResponse[]>([]);
  const [payments, setPayments] = useState<VendorPaymentResponse[]>([]);
  const [settlements, setSettlements] = useState<SettlementBatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [merchant, invoiceRows, paymentRows, settlementRows] = await Promise.all([
        vendorMerchantPaymentService.getMerchantProfile(),
        vendorMerchantPaymentService.getInvoices(),
        vendorMerchantPaymentService.getPayments(),
        vendorMerchantPaymentService.getSettlements(),
      ]);
      setProfile(merchant);
      setInvoices(invoiceRows);
      setPayments(paymentRows);
      setSettlements(settlementRows);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to load vendor payment data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const totals = useMemo(() => ({
    invoiced: invoices.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0),
    paid: payments.filter((row) => String(row.status).toUpperCase() === "COMPLETED" || String(row.status).toUpperCase() === "SUCCESS").reduce((sum, row) => sum + Number(row.amount || 0), 0),
    outstanding: invoices.reduce((sum, row) => sum + Number(row.balanceAmount || 0), 0),
    settled: settlements.filter((row) => String(row.status).toUpperCase() === "PAID" || String(row.status).toUpperCase() === "SETTLED").reduce((sum, row) => sum + Number(row.netSettledAmount || 0), 0),
  }), [invoices, payments, settlements]);

  const copyUpi = async () => {
    if (!profile?.vpa) return;
    try { await navigator.clipboard.writeText(profile.vpa); toast.success("UPI ID copied"); }
    catch { toast.error("Could not access clipboard"); }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" }, { id: "invoices", label: "Invoices" },
    { id: "payments", label: "Payments" }, { id: "settlements", label: "Settlements" }, { id: "upi", label: "UPI" },
  ];

  return <div className="space-y-6">
    <Toaster position="top-right" richColors />
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border bg-white p-5">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-700 text-white"><CreditCard className="h-5 w-5" /></span>
        <div><h1 className="text-xl font-bold text-slate-900">Vendor Payments</h1><p className="text-sm text-slate-500">Live invoices, recorded payments, settlements, and UPI configuration.</p></div>
      </div>
      <button onClick={() => void loadData()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
    </header>

    <nav className="flex flex-wrap gap-2">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === item.id ? "bg-purple-700 text-white" : "border bg-white text-slate-600"}`}>{item.label}</button>)}</nav>

    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">Payment data could not be loaded</p><p>{error}</p></div></div>}
    {loading && <p className="rounded-xl border bg-white p-5 text-sm text-slate-500">Loading current payment records…</p>}

    {!loading && !error && tab === "overview" && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Invoiced", totals.invoiced, FileText], ["Recorded payments", totals.paid, CreditCard], ["Outstanding invoices", totals.outstanding, AlertCircle], ["Settled payouts", totals.settled, Wallet]].map(([label, value, Icon]: any) => <div key={label} className="rounded-2xl border bg-white p-5"><div className="flex items-center justify-between text-sm text-slate-500"><span>{label}</span><Icon className="h-4 w-4" /></div><p className="mt-2 text-2xl font-bold text-slate-900">{money(value)}</p></div>)}
      </div>
      <section className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Recent invoices</h2><InvoiceTable rows={invoices.slice(0, 5)} /></section>
    </>}

    {!loading && !error && tab === "invoices" && <section className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Invoices</h2><p className="mb-3 text-sm text-slate-500">Invoice status and balances returned by the vendor service.</p><InvoiceTable rows={invoices} /></section>}

    {!loading && !error && tab === "payments" && <section className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Recorded payments</h2><p className="mb-3 text-sm text-slate-500">Only payment transactions stored by the backend are shown.</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="p-3">Reference</th><th className="p-3">Invoice</th><th className="p-3">Method</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead><tbody>{payments.map((p) => <tr key={p.id} className="border-b last:border-0"><td className="p-3 font-mono">{p.paymentNumber}</td><td className="p-3">{p.invoiceNumber || `#${p.invoiceId}`}</td><td className="p-3">{p.method}</td><td className="p-3 font-semibold">{money(p.amount)}</td><td className="p-3">{p.status}</td><td className="p-3">{date(p.paidAt || p.createdAt)}</td></tr>)}</tbody></table>{payments.length === 0 && <Empty>There are no recorded payment transactions.</Empty>}</div></section>}

    {!loading && !error && tab === "settlements" && <section className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Settlement records</h2><p className="mb-3 text-sm text-slate-500">Payout status and references come from the commerce settlement service.</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="p-3">Settlement</th><th className="p-3">Period</th><th className="p-3">Orders</th><th className="p-3">Gross</th><th className="p-3">Deductions</th><th className="p-3">Payout</th><th className="p-3">UTR</th><th className="p-3">Status</th></tr></thead><tbody>{settlements.map((s) => <tr key={s.batchId} className="border-b last:border-0"><td className="p-3 font-mono">{s.batchId}</td><td className="p-3">{date(s.periodStart)} – {date(s.periodEnd)}</td><td className="p-3">{s.transactionCount}</td><td className="p-3">{money(s.grossAmount)}</td><td className="p-3">{money(s.deductions)}</td><td className="p-3 font-semibold">{money(s.netSettledAmount)}</td><td className="p-3 font-mono">{s.bankUtr || "—"}</td><td className="p-3">{s.status}</td></tr>)}</tbody></table>{settlements.length === 0 && <Empty>No settlement records have been returned.</Empty>}</div></section>}

    {!loading && !error && tab === "upi" && <section className="max-w-xl rounded-2xl border bg-white p-6"><div className="flex items-center gap-2"><QrCode className="h-5 w-5 text-purple-700" /><h2 className="font-bold">Merchant UPI</h2></div>{profile?.upiEnabled && profile.vpa ? <div className="mt-5 flex flex-col items-center gap-4"><p className="font-mono text-lg font-semibold">{profile.vpa}</p><div className="rounded-xl bg-white p-3 shadow-sm"><ManaPayQrCode value={vendorMerchantPaymentService.getUpiPayload(profile)!} size={220} /></div><button onClick={() => void copyUpi()} className="rounded-lg border px-4 py-2 text-sm font-semibold">Copy UPI ID</button></div> : <Empty>UPI collection is not enabled or no UPI ID is configured. Update the merchant commerce profile before using UPI.</Empty>}</section>}
  </div>;
};

function InvoiceTable({ rows }: { rows: VendorInvoiceResponse[] }) {
  return <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="p-3">Invoice</th><th className="p-3">Issued</th><th className="p-3">Due</th><th className="p-3">Total</th><th className="p-3">Paid</th><th className="p-3">Balance</th><th className="p-3">Status</th></tr></thead><tbody>{rows.map((invoice) => <tr key={invoice.id} className="border-b last:border-0"><td className="p-3 font-mono">{invoice.invoiceNumber}</td><td className="p-3">{date(invoice.issueDate)}</td><td className="p-3">{date(invoice.dueDate)}</td><td className="p-3">{money(invoice.totalAmount)}</td><td className="p-3">{money(invoice.paidAmount)}</td><td className="p-3">{money(invoice.balanceAmount)}</td><td className="p-3">{invoice.status}</td></tr>)}</tbody></table>{rows.length === 0 && <Empty>No invoices have been returned.</Empty>}</div>;
}
function Empty({ children }: { children: React.ReactNode }) { return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">{children}</p>; }
