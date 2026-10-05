import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Package,
  Layers,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Truck,
  Building,
  Star,
  RefreshCw,
} from "lucide-react";
import { commerceCoreService } from "../../../services/commerceCoreService";
import type { CommerceOrder, CommerceChannel, CommerceSettlement } from "../../../types/commerceCore";

const CHANNEL_COLORS: Record<CommerceChannel, string> = {
  GROUP_BUYING: "bg-rose-50 text-rose-700 border-rose-200",
  FOOD: "bg-amber-50 text-amber-700 border-amber-200",
  MARKETPLACE: "bg-blue-50 text-blue-700 border-blue-200",
  DEALS: "bg-purple-50 text-purple-700 border-purple-200",
  VENDOR: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const ManaCommerceHub: React.FC = () => {
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [settlements, setSettlements] = useState<CommerceSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<CommerceChannel | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState<"orders" | "handover" | "settlements">("orders");

  // Handover Verification State
  const [verifyOrderNumber, setVerifyOrderNumber] = useState("");
  const [verifyPin, setVerifyPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [myOrders, mySettlements] = await Promise.all([
        commerceCoreService.getMyOrders().catch(() => []),
        commerceCoreService.getMySettlements().catch(() => []),
      ]);
      setOrders(myOrders || []);
      setSettlements(mySettlements || []);
    } catch (e) {
      console.warn("Commerce data load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyOrderNumber || !verifyPin) return;
    try {
      setVerifying(true);
      const res = await commerceCoreService.verifyHandover({
        orderNumber: verifyOrderNumber,
        enteredOtp: verifyPin,
      });
      setVerifyResult(res.message);
      if (res.success) {
        setVerifyOrderNumber("");
        setVerifyPin("");
        loadData();
      }
    } catch (e: any) {
      setVerifyResult(e?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const filteredOrders = orders.filter(
    (o) => selectedChannel === "ALL" || o.channel === selectedChannel
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-300 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Mana Commerce Core • Unified 15-Capability Transaction Model
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Mana Commerce Platform</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Unified lifecycle powering Group Buying, Home Food, Marketplace, Deals, and Vendor Commerce with single order, payment, escrow, and handover verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 rounded-xl p-1 border border-white/15">
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === "orders" ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:text-white"
                }`}
              >
                Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab("handover")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === "handover" ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:text-white"
                }`}
              >
                Verify Handover
              </button>
              <button
                onClick={() => setActiveTab("settlements")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === "settlements" ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:text-white"
                }`}
              >
                Settlements ({settlements.length})
              </button>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Channel Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["ALL", "GROUP_BUYING", "FOOD", "MARKETPLACE", "DEALS", "VENDOR"].map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                  selectedChannel === ch
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {ch.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Orders Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base">No Orders in Commerce Core</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Orders placed across Group Buying, Marketplace, Food, or Deals will be managed here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${CHANNEL_COLORS[ord.channel]}`}>
                        {ord.channel.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {ord.status}
                      </span>
                    </div>

                    <div>
                      <div className="font-mono text-xs font-bold text-slate-900">{ord.orderNumber}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        Seller: <span className="text-slate-800 font-semibold">{ord.sellerName || "Resident Seller"}</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {(ord.items || []).map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-700">
                          <span className="truncate pr-2">
                            {item.quantity}x {item.title}
                          </span>
                          <span className="font-semibold shrink-0">₹{item.totalPrice || item.unitPrice * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Handover PIN Badge */}
                    {ord.handoverOtp && ord.status !== "COMPLETED" && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-emerald-700" />
                          <span className="text-xs font-bold text-emerald-900">Handover PIN</span>
                        </div>
                        <span className="font-mono font-bold text-sm tracking-wider text-emerald-700">
                          {ord.handoverOtp}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Financial Total & Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Total:</span>
                      <span className="font-bold text-slate-900 text-sm ml-1">₹{ord.totalAmount}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      {ord.fulfillmentType === "DELIVERY" ? (
                        <>
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Doorstep</span>
                        </>
                      ) : (
                        <>
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>Lobby Pickup</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "handover" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Universal Handover Verification</h3>
              <p className="text-xs text-slate-500">Authenticate delivery or pickup with 6-digit OTP code.</p>
            </div>
          </div>

          <form onSubmit={handleVerifyHandover} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Order Number</label>
              <input
                type="text"
                placeholder="e.g. ORD-B2F891A0"
                value={verifyOrderNumber}
                onChange={(e) => setVerifyOrderNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer's 6-Digit PIN</label>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit OTP"
                value={verifyPin}
                onChange={(e) => setVerifyPin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 rounded-lg text-sm font-mono tracking-widest border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {verifyResult && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{verifyResult}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition shadow-sm"
            >
              {verifying ? "Verifying..." : "Verify & Complete Order"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "settlements" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" /> Seller Settlement Ledger
            </h3>
            <span className="text-xs text-slate-500">{settlements.length} settlement entries</span>
          </div>

          {settlements.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">No settlements recorded</p>
              <p className="text-xs text-slate-400 mt-1">Escrow payouts released upon order handover appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Settlement ID</th>
                    <th className="py-3 px-4">Gross Amount</th>
                    <th className="py-3 px-4">Platform Fee</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.settlementNumber}</td>
                      <td className="py-3 px-4 font-semibold">₹{s.grossAmount}</td>
                      <td className="py-3 px-4 text-slate-500">-₹{s.platformFee}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">₹{s.netPayoutAmount}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
