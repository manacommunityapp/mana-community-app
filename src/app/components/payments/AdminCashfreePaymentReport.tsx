"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, TrendingDown, CreditCard, AlertCircle,
  RefreshCw, RotateCcw, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import {
  cashfreePaymentService,
  type CashfreeOrderResponse,
  type CashfreeAdminSummaryResponse,
} from "../../../services/payments/cashfreePaymentService";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_BADGE: Record<string, string> = {
  PAID:           "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  CREATED:        "bg-indigo-100  text-indigo-700  dark:bg-indigo-950/60  dark:text-indigo-400",
  PENDING:        "bg-indigo-100  text-indigo-700  dark:bg-indigo-950/60  dark:text-indigo-400",
  FAILED:         "bg-red-100     text-red-700     dark:bg-red-950/60     dark:text-red-400",
  EXPIRED:        "bg-slate-100   text-slate-600   dark:bg-slate-800      dark:text-slate-400",
  REFUNDED:       "bg-orange-100  text-orange-700  dark:bg-orange-950/60  dark:text-orange-400",
  REFUND_PENDING: "bg-orange-100  text-orange-700  dark:bg-orange-950/60  dark:text-orange-400",
};

const ALL_STATUSES = ["PAID", "FAILED", "CREATED", "PENDING", "EXPIRED", "REFUNDED", "REFUND_PENDING"];
const ALL_REF_TYPES = ["SPORTS_REGISTRATION", "EXPERIENCES_BOOKING", "PROCUREMENT_ORDER"];

// ── Stat tile ─────────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  Icon: React.ElementType;
  accent: string;
}

function StatTile({ label, value, sub, Icon, accent }: StatTileProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

// ── Refund modal ──────────────────────────────────────────────────────────────

interface RefundModalProps {
  order: CashfreeOrderResponse;
  onClose: () => void;
  onConfirm: (amount: number, reason: string) => void;
  loading: boolean;
}

function RefundModal({ order, onClose, onConfirm, loading }: RefundModalProps) {
  const [amount, setAmount] = useState(String(order.amount));
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Initiate Refund</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Order</p>
            <p className="font-mono text-sm font-medium text-slate-900 dark:text-white">{order.manaOrderId}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Refund Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              max={order.amount}
              min={0.01}
              step={0.01}
              onChange={e => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Reason for refund…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(Number(amount), reason)}
            disabled={loading || !amount || Number(amount) <= 0}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
            Confirm Refund
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminCashfreePaymentReport() {
  // Filters
  const [status,  setStatus]  = useState("");
  const [refType, setRefType] = useState("");
  const [from,    setFrom]    = useState("");
  const [to,      setTo]      = useState("");
  const [page,    setPage]    = useState(0);
  const PAGE_SIZE = 20;

  // Refund modal
  const [refundTarget, setRefundTarget] = useState<CashfreeOrderResponse | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);

  // ── Summary ──
  const [summary, setSummary] = useState<CashfreeAdminSummaryResponse | null>(null);
  const [report, setReport] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchSummary = useCallback(() => {
    cashfreePaymentService.getAdminSummary({ from: from || undefined, to: to || undefined })
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [from, to]);

  const fetchReport = useCallback(() => {
    setIsFetching(true);
    cashfreePaymentService.getAdminReport({
      status:  status  || undefined,
      refType: refType || undefined,
      from:    from    || undefined,
      to:      to      || undefined,
      page,
      size: PAGE_SIZE,
    })
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setIsFetching(false));
  }, [status, refType, from, to, page]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleRefund = async (amount: number, reason: string) => {
    if (!refundTarget) return;
    setRefundLoading(true);
    try {
      await cashfreePaymentService.adminInitiateRefund(refundTarget.manaOrderId, amount, reason);
      setRefundTarget(null);
      fetchSummary();
      fetchReport();
    } catch (e) {
      console.error("Refund failed", e);
    } finally {
      setRefundLoading(false);
    }
  };

  const totalCollected = summary?.totalCollected ?? 0;
  const totalRefunded  = summary?.totalRefunded  ?? 0;
  const paidCount      = summary?.countByStatus?.["PAID"] ?? 0;
  const failedCount    = summary?.countByStatus?.["FAILED"] ?? 0;

  const orders   = (report as any)?.content as CashfreeOrderResponse[] | undefined;
  const totalEl  = (report as any)?.totalElements as number | undefined;
  const totalPg  = (report as any)?.totalPages   as number | undefined;

  function resetFilters() {
    setStatus(""); setRefType(""); setFrom(""); setTo(""); setPage(0);
  }

  const hasFilters = status || refType || from || to;

  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Payment Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Cashfree transaction history &amp; refunds</p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Collected"
          value={fmt(totalCollected)}
          Icon={TrendingUp}
          accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
        />
        <StatTile
          label="Refunded"
          value={fmt(totalRefunded)}
          Icon={TrendingDown}
          accent="bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400"
        />
        <StatTile
          label="Paid Orders"
          value={String(paidCount)}
          Icon={CreditCard}
          accent="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
        />
        <StatTile
          label="Failed"
          value={String(failedCount)}
          Icon={AlertCircle}
          accent="bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(0); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={refType}
            onChange={e => { setRefType(e.target.value); setPage(0); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All Types</option>
            {ALL_REF_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 dark:text-slate-400">From</label>
            <input
              type="date"
              value={from}
              onChange={e => { setFrom(e.target.value); setPage(0); }}
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 dark:text-slate-400">To</label>
            <input
              type="date"
              value={to}
              onChange={e => { setTo(e.target.value); setPage(0); }}
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
            />
          </div>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                {["Order ID", "Amount", "Status", "Type", "Reference", "Date", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {isFetching && !orders ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading…</td></tr>
              ) : !orders?.length ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">No transactions found</td></tr>
              ) : orders.map(order => (
                <tr key={order.id} className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{order.manaOrderId}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{fmt(order.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[order.status] ?? STATUS_BADGE["EXPIRED"]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {order.referenceType?.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{order.referenceId}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    {order.status === "PAID" && (
                      <button
                        onClick={() => setRefundTarget(order)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
                      >
                        <RotateCcw className="h-3 w-3" /> Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(totalPg ?? 0) > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalEl} transaction{totalEl !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {page + 1} / {totalPg}
              </span>
              <button
                onClick={() => setPage(p => Math.min((totalPg ?? 1) - 1, p + 1))}
                disabled={page >= (totalPg ?? 1) - 1}
                className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refund modal */}
      {refundTarget && (
        <RefundModal
          order={refundTarget}
          loading={refundLoading}
          onClose={() => setRefundTarget(null)}
          onConfirm={(amount, reason) => handleRefund(amount, reason)}
        />
      )}
    </div>
  );
}
