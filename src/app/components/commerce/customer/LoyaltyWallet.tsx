import React, { useEffect, useState } from "react";
import {
  commerceLoyaltyService,
  CommerceLoyaltyDto,
} from "@/services/commerce/commerceLoyaltyService";

const TIER_COLOR: Record<string, string> = {
  BRONZE: "text-orange-600 bg-orange-50 border-orange-200",
  SILVER: "text-gray-500 bg-gray-100 border-gray-300",
  GOLD: "text-yellow-600 bg-yellow-50 border-yellow-200",
  PLATINUM: "text-purple-700 bg-purple-50 border-purple-200",
};

const TIER_ICON: Record<string, string> = {
  BRONZE: "🥉",
  SILVER: "🥈",
  GOLD: "🥇",
  PLATINUM: "💎",
};

function TxnRow({ txn }: { txn: CommerceLoyaltyDto["recentTransactions"][0] }) {
  const isEarn = txn.points > 0;
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-2.5 text-xs text-gray-500">
        {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString("en-IN") : "—"}
      </td>
      <td className="px-4 py-2.5 text-xs">
        <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold ${
          isEarn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
        }`}>{txn.type}</span>
      </td>
      <td className="px-4 py-2.5 text-xs text-gray-600">{txn.description ?? "—"}</td>
      <td className={`px-4 py-2.5 text-sm font-semibold text-right ${isEarn ? "text-green-600" : "text-red-500"}`}>
        {isEarn ? "+" : ""}{txn.points} pts
      </td>
    </tr>
  );
}

export default function LoyaltyWallet() {
  const [data, setData] = useState<CommerceLoyaltyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemPts, setRedeemPts] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    commerceLoyaltyService.getMyLoyalty().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleRedeem = async () => {
    const pts = parseInt(redeemPts, 10);
    if (!pts || pts <= 0) { setRedeemError("Enter a valid number of points"); return; }
    setRedeeming(true); setRedeemError(null); setRedeemSuccess(null);
    try {
      const updated = await commerceLoyaltyService.redeemPoints(pts);
      setData(updated);
      const discount = (pts * 0.5).toFixed(2);
      setRedeemSuccess(`Redeemed ${pts} pts — ₹${discount} discount applied!`);
      setRedeemPts("");
    } catch (e) {
      setRedeemError(e instanceof Error ? e.message : "Redemption failed");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-sm text-gray-400">Loading loyalty wallet…</div>;
  if (!data) return <div className="py-16 text-center text-sm text-gray-400">Unable to load loyalty data.</div>;

  const tierClass = TIER_COLOR[data.tier] ?? TIER_COLOR.BRONZE;
  const tierIcon = TIER_ICON[data.tier] ?? "🥉";

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      {/* Header card */}
      <div className={`rounded-2xl border-2 p-5 ${tierClass}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Mana Loyalty</p>
            <p className="text-4xl font-bold mt-1">{data.availablePoints.toLocaleString("en-IN")}</p>
            <p className="text-sm opacity-80 mt-0.5">available points</p>
          </div>
          <div className="text-4xl">{tierIcon}</div>
        </div>
        <div className="mt-4 flex gap-4 text-xs opacity-80">
          <span>Earned: <strong>{data.totalPointsEarned.toLocaleString("en-IN")}</strong></span>
          <span>Spent: <strong>{data.totalPointsSpent.toLocaleString("en-IN")}</strong></span>
          <span>Tier: <strong>{data.tier}</strong></span>
        </div>
        <p className="mt-2 text-xs opacity-60">1 pt = ₹0.50 at checkout · Earn 1 pt per ₹10 spent</p>
      </div>

      {/* Redeem */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Redeem Points</p>
        {redeemSuccess && <p className="text-xs text-green-600 font-medium">{redeemSuccess}</p>}
        {redeemError && <p className="text-xs text-red-500">{redeemError}</p>}
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={data.availablePoints}
            value={redeemPts}
            onChange={(e) => setRedeemPts(e.target.value)}
            placeholder={`Up to ${data.availablePoints} pts`}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming || data.availablePoints === 0}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {redeeming ? "Redeeming…" : "Redeem"}
          </button>
        </div>
        {redeemPts && parseInt(redeemPts) > 0 && (
          <p className="text-xs text-gray-500">
            = ₹{(parseInt(redeemPts) * 0.5).toFixed(2)} discount
          </p>
        )}
      </div>

      {/* Transactions */}
      {data.recentTransactions.length > 0 && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <p className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100">Recent Activity</p>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Date", "Type", "Description", "Points"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.map((t) => <TxnRow key={t.id} txn={t} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
