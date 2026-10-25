import { useCallback, useEffect, useState } from "react";
import { BadgeDollarSign, RefreshCw } from "lucide-react";
import { commerceSettlementService, type CommerceSettlementDto } from "../../../../services/commerce/commerceSettlementService";

function money(value: number) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function VendorSettlements() {
  const [settlements, setSettlements] = useState<CommerceSettlementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSettlements(await commerceSettlementService.getMySettlements());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your settlements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black text-slate-900"><BadgeDollarSign className="h-5 w-5 text-indigo-600" />My Settlements</h1>
          <p className="mt-1 text-sm text-slate-500">Review payout cycles and settlement status for your vendor account.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
        </button>
      </header>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading settlements…</div>
      ) : settlements.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No settlements are available yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>{["Settlement", "Period", "Orders", "Gross", "Fees", "Net payout", "Status", "Payout reference"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settlements.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-mono text-xs">{item.settlementNumber}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{item.cycleStartDate ?? "—"} – {item.cycleEndDate ?? "—"}</td>
                  <td className="px-4 py-3">{item.totalOrdersCount}</td>
                  <td className="px-4 py-3">{money(item.grossAmount)}</td>
                  <td className="px-4 py-3">{money(item.platformFee + item.deductions)}</td>
                  <td className="px-4 py-3 font-bold">{money(item.netPayout)}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">{item.status}</span></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.payoutUtr ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
