import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { kittyPartyService } from "../../../services/kittyPartyService";
import type { KittyPartyExpenseShare } from "../../../types/kittyPartyTypes";

export const KittyPartyExpenseSplitView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const circleId = Number(id);

  const [shares, setShares] = useState<KittyPartyExpenseShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [settleModalShare, setSettleModalShare] = useState<KittyPartyExpenseShare | null>(null);
  const [settleUtr, setSettleUtr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, [circleId]);

  const loadShares = async () => {
    try {
      setLoading(true);
      const res = await kittyPartyService.getMyPendingShares();
      setShares(res || []);
    } catch (e) {
      console.error("Failed to load expense shares", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModalShare || !settleUtr.trim()) return;

    try {
      setIsSubmitting(true);
      await kittyPartyService.settleShare(settleModalShare.id, settleUtr.trim());
      setFeedback("Expense share settled successfully!");
      setSettleModalShare(null);
      setSettleUtr("");
      loadShares();
    } catch (err: any) {
      setFeedback(err?.message || "Failed to settle share");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to={`/kitty-party/${circleId}`} className="text-xs font-semibold text-pink-600 hover:text-pink-700">
            ← Back to Circle
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-1">Party Expenses & Bill Split</h1>
          <p className="text-xs text-gray-500">
            Split catering, decoration, venue and cake bills equally or with custom amounts among gathering attendees.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-pink-50 border border-pink-200 text-pink-800 text-xs rounded-xl font-medium">
          {feedback}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-base">My Pending Expense Shares</h3>

        {loading ? (
          <div className="py-8 text-center text-gray-400 text-xs">Loading shares...</div>
        ) : shares.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-medium text-gray-700">All caught up!</p>
            <p className="text-xs text-gray-400 mt-0.5">You have no pending party expense settlements.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {shares.map((s) => (
              <div key={s.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{s.expenseDescription || "Party Expense"}</h4>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Total Expense: ₹{s.totalExpenseAmount} • Your Share:{" "}
                    <span className="font-bold text-gray-900">₹{s.shareAmount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">
                    {s.settlementStatus}
                  </span>
                  <button
                    onClick={() => setSettleModalShare(s)}
                    className="px-4 py-1.5 bg-pink-600 text-white font-bold rounded-xl text-xs shadow hover:bg-pink-700"
                  >
                    Mark Paid
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settle Modal */}
      {settleModalShare && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Settle Expense Share</h3>
              <button onClick={() => setSettleModalShare(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSettle} className="space-y-3">
              <div>
                <span className="text-xs text-gray-500">Amount Due:</span>
                <div className="text-2xl font-bold text-gray-900">₹{settleModalShare.shareAmount}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  UPI UTR / Payment Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 431099238102"
                  value={settleUtr}
                  onChange={(e) => setSettleUtr(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleModalShare(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-pink-600 text-white font-bold rounded-xl text-xs shadow hover:bg-pink-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Settling..." : "Confirm Settlement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default KittyPartyExpenseSplitView;
