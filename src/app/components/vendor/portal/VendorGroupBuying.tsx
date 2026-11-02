import { useState, useEffect } from "react";
import {
  Users, TrendingUp, Sparkles, Plus, Clock, CheckCircle2,
  Calendar, MapPin, Tag, IndianRupee, ArrowRight, Loader2
} from "lucide-react";
import { groupBuyingService, type GroupDeal } from "../../../../services/group-buying/groupBuyingService";

export function VendorGroupBuying() {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "CREATE" | "TEMPLATES" | "HISTORY">("ACTIVE");
  const [deals, setDeals] = useState<GroupDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [description, setDescription] = useState("");
  const [mrp, setMrp] = useState(680);
  const [standardPrice, setStandardPrice] = useState(640);
  const [currentPrice, setCurrentPrice] = useState(585);
  const [targetQty, setTargetQty] = useState(50);
  const [durationDays, setDurationDays] = useState(5);
  const [pickupPoint, setPickupPoint] = useState("Clubhouse Entrance / Tower Lobby");

  const loadDeals = async () => {
    try {
      setLoading(true);
      const data = await groupBuyingService.fetchVendorDeals();
      setDeals(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setCreateSubmitting(true);
      await groupBuyingService.createVendorDeal({
        title,
        category,
        description: description || `${title} - Community bulk deal`,
        mrp: Number(mrp),
        standardPrice: Number(standardPrice),
        currentPrice: Number(currentPrice),
        targetQty: Number(targetQty),
        dealEndsAt: new Date(Date.now() + durationDays * 86400000).toISOString(),
        pickupPoint,
      });
      setCreateSuccess(true);
      setTitle("");
      setDescription("");
      await loadDeals();
      setTimeout(() => {
        setCreateSuccess(false);
        setActiveTab("ACTIVE");
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Group Buying Deals & Dynamic Tiers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create high-velocity bulk purchasing campaigns with volume discount steps.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(["ACTIVE", "CREATE", "TEMPLATES", "HISTORY"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={"px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer " +
                (activeTab === tab
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900")}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "ACTIVE" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading vendor deals...
            </div>
          ) : deals.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center">
              <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Active Group Deals Yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
                Launch your first community bulk purchasing campaign to unlock society demand.
              </p>
              <button
                onClick={() => setActiveTab("CREATE")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                + Launch New Deal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deals.map((deal) => {
                const committed = deal.committedQty ?? deal.currentParticipants ?? 0;
                const target = deal.targetQty ?? deal.targetParticipants ?? 10;
                const pct = Math.min((committed / Math.max(1, target)) * 100, 100);
                const price = deal.currentTierPrice ?? deal.tiers?.[0]?.pricePerUnit ?? 0;
                return (
                  <div
                    key={deal.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {deal.category}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {deal.daysLeft ?? 3}d left
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{deal.title}</h3>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span className="text-slate-600">{committed} ordered</span>
                          <span className="text-indigo-600">{target} MOQ target</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Community Rate</div>
                          <div className="text-sm font-black text-slate-900">
                            ₹{price}{" "}
                            {deal.mrp && <span className="text-[10px] font-normal text-slate-400 line-through">₹{deal.mrp}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-medium">Buyers</div>
                          <div className="text-xs font-bold text-slate-700">{deal.currentParticipants} residents</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Live Deal
                      </span>
                      <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
                        Manage Tiers <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "CREATE" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs max-w-2xl">
          <h3 className="text-base font-black text-slate-900 mb-1">Launch a New Community Deal</h3>
          <p className="text-xs text-slate-500 mb-4">Set minimum order quantity (MOQ) and unlock tiers for societies.</p>

          {createSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Deal created successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Aashirvaad Shudh Chakki Atta 10 KG"
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:border-indigo-600 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:border-indigo-600 text-xs"
                >
                  <option value="Groceries">Groceries</option>
                  <option value="Dairy & Farm">Dairy & Farm</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Festive Specials">Festive Specials</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target MOQ (Units) *</label>
                <input
                  type="number"
                  min={1}
                  value={targetQty}
                  onChange={(e) => setTargetQty(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">MRP (₹) *</label>
                <input
                  type="number"
                  min={1}
                  value={mrp}
                  onChange={(e) => setMrp(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Standard Price (₹) *</label>
                <input
                  type="number"
                  min={1}
                  value={standardPrice}
                  onChange={(e) => setStandardPrice(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Group Tier Price (₹) *</label>
                <input
                  type="number"
                  min={1}
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-xs text-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Duration (Days) *</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pickup Point</label>
                <input
                  type="text"
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bulk sourcing notes, dispatch timeline, delivery schedule..."
                rows={2}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={createSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2"
            >
              {createSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {createSubmitting ? "Publishing Deal..." : "Publish Community Deal"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "TEMPLATES" && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center">
          <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Deal Templates Library</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Quick-start templates for Monthly Grocery Baskets, Festive Sweets Pre-orders, and Monsoon Farm Fresh Veggie Drives.
          </p>
        </div>
      )}

      {activeTab === "HISTORY" && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Completed Deal History</h3>
          <p className="text-xs text-slate-500 mt-1">
            Review past fulfillment batches, settlement statements, and resident satisfaction ratings.
          </p>
        </div>
      )}
    </div>
  );
}
