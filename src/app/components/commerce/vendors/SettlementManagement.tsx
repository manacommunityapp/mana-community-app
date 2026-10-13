import React, { useEffect, useState } from "react";
import {
  commerceSettlementService,
  type CommerceSettlementDto,
} from "../../../../services/commerce/commerceSettlementService";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
};

function fmtAmount(v: number) {
  return `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

interface RunFormState {
  cycleStart: string;
  cycleEnd: string;
  sellerId: string;
  vendorId: string;
  platformFeePercent: string;
  adminNote: string;
}

export default function SettlementManagement() {
  const [settlements, setSettlements] = useState<CommerceSettlementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showRunForm, setShowRunForm] = useState(false);
  const [runForm, setRunForm] = useState<RunFormState>({
    cycleStart: "",
    cycleEnd: "",
    sellerId: "",
    vendorId: "",
    platformFeePercent: "2.5",
    adminNote: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    commerceSettlementService
      .getAdminSettlements(statusFilter || undefined)
      .then((r) => setSettlements(r.content ?? r as any))
      .catch(() => setSettlements([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const handleRunCycle = async () => {
    if (!runForm.cycleStart || !runForm.cycleEnd) {
      setError("Cycle start and end dates are required.");
      return;
    }
    if (!runForm.sellerId && !runForm.vendorId) {
      setError("Either Seller ID or Vendor ID is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await commerceSettlementService.runCycle({
        cycleStart: runForm.cycleStart,
        cycleEnd: runForm.cycleEnd,
        sellerId: runForm.sellerId ? Number(runForm.sellerId) : undefined,
        vendorId: runForm.vendorId || undefined,
        platformFeePercent: runForm.platformFeePercent ? Number(runForm.platformFeePercent) : 2.5,
        adminNote: runForm.adminNote || undefined,
      });
      setShowRunForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run settlement cycle.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (settlementNumber: string) => {
    const utr = window.prompt("Enter payout UTR / reference number:");
    if (!utr) return;
    try {
      await commerceSettlementService.markPaid(settlementNumber, { payoutUtr: utr });
      load();
    } catch (e) {
      alert("Failed to mark settlement as paid.");
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Settlement Management</h2>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
          </select>
          <button
            onClick={() => setShowRunForm((v) => !v)}
            className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium"
          >
            + Run Settlement Cycle
          </button>
        </div>
      </div>

      {/* Run cycle form */}
      {showRunForm && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-5 space-y-3">
          <p className="text-sm font-semibold text-violet-800">New Settlement Cycle</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Cycle Start (YYYY-MM-DD)", key: "cycleStart", type: "date" },
              { label: "Cycle End (YYYY-MM-DD)", key: "cycleEnd", type: "date" },
              { label: "Seller User ID", key: "sellerId", type: "text" },
              { label: "Vendor ID (string)", key: "vendorId", type: "text" },
              { label: "Platform Fee %", key: "platformFeePercent", type: "number" },
              { label: "Admin Note", key: "adminNote", type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="text-xs text-gray-600 font-medium">{label}</label>
                <input
                  type={type}
                  value={(runForm as any)[key]}
                  onChange={(e) => setRunForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRunCycle}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Running…" : "Run Cycle"}
            </button>
            <button
              onClick={() => setShowRunForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Settlements table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading settlements…</div>
      ) : settlements.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">No settlements found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Settlement #", "Cycle", "Orders", "Gross", "Fee", "Net Payout", "Status", "UTR / Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-mono text-gray-700">{s.settlementNumber}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {fmtDate(s.cycleStartDate)} – {fmtDate(s.cycleEndDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700">{s.totalOrdersCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{fmtAmount(s.grossAmount)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtAmount(s.platformFee)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">{fmtAmount(s.netPayout)}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3">
                    {s.status === "PENDING" ? (
                      <button
                        onClick={() => handleMarkPaid(s.settlementNumber)}
                        className="text-xs font-medium text-violet-700 border border-violet-200 rounded px-2 py-1 hover:bg-violet-50"
                      >
                        Mark Paid
                      </button>
                    ) : s.payoutUtr ? (
                      <span className="text-xs text-gray-500 font-mono">{s.payoutUtr}</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
