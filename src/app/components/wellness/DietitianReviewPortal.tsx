import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  Sparkles,
  RefreshCw,
  Clock,
  Building2,
  Play,
  HeartPulse,
  Info,
} from "lucide-react";
import { wellnessBasketService } from "../../../services/wellness-basket/wellnessBasketService";
import type { WellnessSwap, WellnessCluster } from "../../../types/wellnessBasket";

export function DietitianReviewPortal() {
  const [swaps, setSwaps] = useState<WellnessSwap[]>([]);
  const [clusters, setClusters] = useState<WellnessCluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [triggeringOrders, setTriggeringOrders] = useState<boolean>(false);
  const [orderResult, setOrderResult] = useState<string | null>(null);
  const [rejectModalSwap, setRejectModalSwap] = useState<WellnessSwap | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingSwaps, clusterList] = await Promise.all([
        wellnessBasketService.getPendingSwaps(),
        wellnessBasketService.getClusters(),
      ]);
      setSwaps(pendingSwaps);
      setClusters(clusterList);
    } catch (err) {
      console.error("Failed to load dietitian review data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (swapId: number) => {
    setActionLoading(swapId);
    try {
      await wellnessBasketService.approveSwap(swapId);
      setSwaps((prev) => prev.filter((s) => s.id !== swapId));
    } catch (err) {
      console.error("Error approving swap", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModalSwap) return;
    setActionLoading(rejectModalSwap.id);
    try {
      await wellnessBasketService.rejectSwap(rejectModalSwap.id, rejectReason || "Rejected by Dietitian");
      setSwaps((prev) => prev.filter((s) => s.id !== rejectModalSwap.id));
      setRejectModalSwap(null);
      setRejectReason("");
    } catch (err) {
      console.error("Error rejecting swap", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleCluster = async (cluster: WellnessCluster) => {
    const nextStatus = cluster.status === "ACTIVE" ? "PENDING" : "ACTIVE";
    try {
      await wellnessBasketService.updateClusterStatus(cluster.id, nextStatus);
      setClusters((prev) =>
        prev.map((c) =>
          c.id === cluster.id
            ? { ...c, status: nextStatus, isActivated: nextStatus === "ACTIVE" }
            : c
        )
      );
    } catch (err) {
      console.error("Error updating cluster status", err);
    }
  };

  const handleTriggerDailyOrders = async () => {
    setTriggeringOrders(true);
    setOrderResult(null);
    try {
      const res = await wellnessBasketService.triggerDailyOrders();
      setOrderResult(`Successfully generated ${res.ordersGenerated} authoritative delivery orders for ${res.targetDate}.`);
    } catch (err) {
      setOrderResult("Failed to generate delivery orders. Check server logs.");
    } finally {
      setTriggeringOrders(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5" /> DIETITIAN & OPERATIONS CONSOLE
            </span>
            <span className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded-full">
              Mana Fresh Wellness
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Nutrition & Cluster Review Portal
          </h1>
          <p className="mt-1 text-emerald-100/80 text-sm max-w-xl">
            Review resident allergy substitutions, manage 15-subscriber society clusters, and trigger the next-day 6:00 AM – 8:00 AM delivery dispatch orders.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/20 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={handleTriggerDailyOrders}
            disabled={triggeringOrders}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {triggeringOrders ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-950" />
            ) : (
              <Play className="w-4 h-4 fill-emerald-950" />
            )}
            Trigger Daily Orders
          </button>
        </div>
      </div>

      {orderResult && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{orderResult}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Swaps</p>
            <h3 className="text-2xl font-bold text-gray-900">{swaps.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Clusters</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {clusters.filter((c) => c.status === "ACTIVE").length} / {clusters.length}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Active Subscribers</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {clusters.reduce((acc, c) => acc + c.currentSubscriberCount, 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* Section 1: Pending Allergy & Item Swaps */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Pending Allergy & Menu Swap Requests
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review subscriber substitutions against clinical nutritional balance and ingredient stock.
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
            {swaps.length} Action Needed
          </span>
        </div>

        {swaps.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/50 mb-3" />
            <p className="text-sm font-medium">All menu swaps have been reviewed!</p>
            <p className="text-xs text-gray-400 mt-1">Pending substitutions will appear here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {swaps.map((swap) => (
              <div key={swap.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                      Resident #{swap.userId}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Target Delivery: <strong>{swap.deliveryDate}</strong>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="line-through text-gray-400 font-medium">{swap.originalProductName}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {swap.requestedProductName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-gray-400" /> Requested: {new Date(swap.requestedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <button
                    onClick={() => handleApprove(swap.id)}
                    disabled={actionLoading === swap.id}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => setRejectModalSwap(swap)}
                    disabled={actionLoading === swap.id}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Society Clusters & Threshold Monitor */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              Society Clusters & Threshold Monitor
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Delivery clusters unlock doorstep route fulfillment once they reach the 15-resident threshold.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Society & Block</th>
                <th className="px-6 py-3.5">City</th>
                <th className="px-6 py-3.5">Subscribers / Threshold</th>
                <th className="px-6 py-3.5">Fulfillment Window</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clusters.map((cluster) => {
                const percent = Math.min(100, Math.round((cluster.currentSubscriberCount / cluster.activationThreshold) * 100));
                return (
                  <tr key={cluster.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {cluster.societyName}
                      <span className="block text-xs font-normal text-gray-500">{cluster.block}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{cluster.city}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span className="font-semibold text-gray-800">{cluster.currentSubscriberCount}</span>
                          <span className="text-gray-400">Target: {cluster.activationThreshold}</span>
                        </div>
                        <div className="w-36 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent >= 100 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs font-medium">
                      {cluster.deliveryStartTime.slice(0, 5)} – {cluster.deliveryEndTime.slice(0, 5)} AM
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          cluster.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {cluster.status === "ACTIVE" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {cluster.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleCluster(cluster)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          cluster.status === "ACTIVE"
                            ? "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                        }`}
                      >
                        {cluster.status === "ACTIVE" ? "Pause Cluster" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalSwap && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900">Reject Menu Swap</h3>
            </div>
            <p className="text-xs text-gray-600">
              Provide a medical, nutritional, or ingredient-availability reason for rejecting the swap for{" "}
              <strong>{rejectModalSwap.requestedProductName}</strong>.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Nutritional conflict with subscriber's high-protein macro profile, or seasonal item out of stock."
              className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalSwap(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
