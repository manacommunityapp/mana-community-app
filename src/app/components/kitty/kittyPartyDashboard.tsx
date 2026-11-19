import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { kittyPartyService } from "../../../services/kittyPartyService";
import type { KittyPartyCircleSummary, KittyPartyExpenseShare, KittyPartyCycle } from "../../../types/kittyPartyTypes";

export const KittyPartyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [circles, setCircles] = useState<KittyPartyCircleSummary[]>([]);
  const [pendingShares, setPendingShares] = useState<KittyPartyExpenseShare[]>([]);
  const [activeCycle, setActiveCycle] = useState<KittyPartyCycle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [circlesRes, sharesRes] = await Promise.allSettled([
        kittyPartyService.getMyCircles(),
        kittyPartyService.getMyPendingShares(),
      ]);

      let userCircles: KittyPartyCircleSummary[] = [];
      if (circlesRes.status === "fulfilled" && circlesRes.value?.content) {
        userCircles = circlesRes.value.content;
        setCircles(userCircles);
      }
      if (sharesRes.status === "fulfilled" && Array.isArray(sharesRes.value)) {
        setPendingShares(sharesRes.value);
      }

      // Try fetching active cycle for user's primary circle
      if (userCircles.length > 0) {
        for (const c of userCircles) {
          try {
            const cycle = await kittyPartyService.getCircleActiveCycle(c.id);
            if (cycle?.id) {
              setActiveCycle(cycle);
              break;
            }
          } catch {
            // continue checking next circle
          }
        }
      }
    } catch (e) {
      console.error("Failed to load Kitty Party dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              Mana Social Circles
            </span>
            <h1 className="text-3xl font-extrabold">Mana Kitty & Circles</h1>
            <p className="mt-2 text-pink-100 max-w-xl text-sm">
              Connect with your trusted friends, organize monthly kitty gatherings, manage contribution ledgers, and play live Housie together!
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/kitty-party/create"
              className="px-5 py-2.5 bg-white text-pink-600 font-semibold rounded-xl shadow hover:bg-pink-50 transition"
            >
              + Create Circle
            </Link>
            <Link
              to="/kitty-party/discover"
              className="px-5 py-2.5 bg-pink-700/60 text-white font-semibold rounded-xl border border-white/20 hover:bg-pink-700 transition"
            >
              Discover Circles
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center text-2xl font-bold">
            🎉
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{circles.length}</div>
            <div className="text-sm text-gray-500 font-medium">My Active Circles</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl font-bold">
            💰
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              ₹{pendingShares.reduce((acc, curr) => acc + (curr.shareAmount || 0), 0).toFixed(0)}
            </div>
            <div className="text-sm text-gray-500 font-medium">Pending Expense Settlements</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold">
            🎲
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">Mana Play</div>
            <div className="text-sm text-gray-500 font-medium">90-Ball Free Tambola Live</div>
          </div>
        </div>
      </div>

      {/* Active Kitty Savings & Rotation Dashboard Indicators Section */}
      {activeCycle && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-600">Savings & Rotation Ledger</span>
              <h2 className="text-lg font-bold text-gray-900">{activeCycle.cycleName}</h2>
            </div>
            <Link
              to={`/kitty-party/${activeCycle.circleId}/ledger`}
              className="text-xs font-bold text-pink-600 hover:text-pink-700 bg-pink-50 px-3 py-1.5 rounded-lg border border-pink-200"
            >
              Open Full Ledger & Receipts →
            </Link>
          </div>

          {/* Indicator 7: Full Cycle Progress Bar */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/70">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
              <span>Full Cycle Progress: {activeCycle.cycleProgressPercent || Math.round((activeCycle.currentPeriod / activeCycle.memberCount) * 100)}%</span>
              <span className="text-gray-500 font-medium">Month #{activeCycle.currentPeriod} of {activeCycle.memberCount} ({Math.max(0, activeCycle.memberCount - activeCycle.currentPeriod)} remaining)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-500 to-rose-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, activeCycle.cycleProgressPercent || (activeCycle.currentPeriod / activeCycle.memberCount) * 100))}%` }}
              />
            </div>
          </div>

          {/* 6 Key Indicators Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Total Expected Collection */}
            <div className="p-3 bg-pink-50/40 rounded-xl border border-pink-100">
              <div className="text-[10px] font-bold text-gray-500 uppercase">1. Total Expected</div>
              <div className="text-base font-extrabold text-gray-900 mt-1">₹{activeCycle.totalExpectedPerPeriod?.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400">Target: ₹{(activeCycle.totalExpectedFullCycle || (activeCycle.totalExpectedPerPeriod * activeCycle.memberCount))?.toLocaleString()}</div>
            </div>

            {/* 2. Total Collected */}
            <div className="p-3 bg-green-50/40 rounded-xl border border-green-100">
              <div className="text-[10px] font-bold text-green-700 uppercase">2. Total Collected</div>
              <div className="text-base font-extrabold text-green-800 mt-1">₹{(activeCycle.totalCollectedCurrentPeriod || 0)?.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400">Cumulative: ₹{(activeCycle.totalCollectedFullCycle || 0)?.toLocaleString()}</div>
            </div>

            {/* 3. Pending Contributions */}
            <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100">
              <div className="text-[10px] font-bold text-amber-700 uppercase">3. Pending Contrib.</div>
              <div className="text-base font-extrabold text-amber-800 mt-1">
                ₹{(activeCycle.pendingContributionsAmount != null ? activeCycle.pendingContributionsAmount : Math.max(0, activeCycle.totalExpectedPerPeriod - (activeCycle.totalCollectedCurrentPeriod || 0)))?.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400">
                {activeCycle.pendingContributionsCount ?? (activeCycle.memberCount - (activeCycle.paidContributionsCount || 0))} pending
              </div>
            </div>

            {/* 4. Current Month Beneficiary */}
            <div className="p-3 bg-pink-50/70 rounded-xl border border-pink-200">
              <div className="text-[10px] font-bold text-pink-700 uppercase">4. Current Beneficiary</div>
              <div className="text-sm font-extrabold text-pink-800 mt-1 truncate" title={activeCycle.currentBeneficiaryName || "Unassigned"}>
                {activeCycle.currentBeneficiaryName || "Unassigned"}
              </div>
              <div className="text-[10px] text-pink-600">Month #{activeCycle.currentPeriod} Payout</div>
            </div>

            {/* 5. Previous Payouts */}
            <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100">
              <div className="text-[10px] font-bold text-indigo-700 uppercase">5. Previous Payouts</div>
              <div className="text-base font-extrabold text-indigo-800 mt-1">
                {activeCycle.previousPayoutsCount ?? (activeCycle.currentPeriod > 1 ? activeCycle.currentPeriod - 1 : 0)} Disbursed
              </div>
              <div className="text-[10px] text-gray-400">
                ₹{(activeCycle.previousPayoutsTotalAmount || ((activeCycle.currentPeriod > 1 ? activeCycle.currentPeriod - 1 : 0) * activeCycle.totalExpectedPerPeriod))?.toLocaleString()} rotated
              </div>
            </div>

            {/* 6. Next Beneficiary */}
            <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
              <div className="text-[10px] font-bold text-purple-700 uppercase">6. Next Beneficiary</div>
              <div className="text-sm font-extrabold text-purple-800 mt-1 truncate" title={activeCycle.nextBeneficiaryName || "End of Cycle"}>
                {activeCycle.nextBeneficiaryName || (activeCycle.rotations?.find(r => r.periodNumber === activeCycle.currentPeriod + 1)?.beneficiaryName) || "Cycle End"}
              </div>
              <div className="text-[10px] text-purple-600">Month #{activeCycle.currentPeriod + 1}</div>
            </div>
          </div>
        </div>
      )}

      {/* My Circles Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">My Circles</h2>
          <Link to="/kitty-party/discover" className="text-sm font-semibold text-pink-600 hover:text-pink-700">
            View All Circles →
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading your social circles...</div>
        ) : circles.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-4xl mb-3">👭</div>
            <h3 className="text-base font-semibold text-gray-800">No circles joined yet</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Start by creating your own private kitty group or join an existing neighborhood circle.
            </p>
            <div className="mt-4">
              <Link
                to="/kitty-party/create"
                className="inline-block px-4 py-2 bg-pink-600 text-white font-medium rounded-lg text-sm shadow hover:bg-pink-700"
              >
                Create Your First Circle
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {circles.map((circle) => (
              <div
                key={circle.id}
                onClick={() => navigate(`/kitty-party/${circle.id}`)}
                className="cursor-pointer border border-gray-200 rounded-xl p-5 hover:border-pink-500 hover:shadow-md transition bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800">
                      {circle.categoryCode}
                    </span>
                    <span className="text-xs text-gray-400 uppercase font-medium">
                      {circle.privacyType.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 line-clamp-1">{circle.circleName}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {circle.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>👥 {circle.currentMembersCount} members</span>
                  <span className="font-semibold text-pink-600">Open Circle →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default KittyPartyDashboard;
