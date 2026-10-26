import { useState } from "react";
import {
  Users, TrendingUp, Sparkles, Plus, Clock, CheckCircle2,
  Calendar, MapPin, Tag, IndianRupee, ArrowRight
} from "lucide-react";

export function VendorGroupBuying() {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "CREATE" | "TEMPLATES" | "HISTORY">("ACTIVE");

  const deals = [
    {
      id: "d1",
      title: "Aashirvaad Atta 10 KG Bulk Drive",
      variant: "10 KG Bulk Bag",
      committedQty: 73,
      targetQty: 100,
      mrp: 680,
      tierPrice: 585,
      participants: 41,
      daysLeft: 3,
      status: "OPEN",
    },
    {
      id: "d2",
      title: "Alphonso Mango Export Box (5 KG)",
      variant: "Box of 1 Dozen",
      committedQty: 47,
      targetQty: 50,
      mrp: 1300,
      tierPrice: 1050,
      participants: 32,
      daysLeft: 1,
      status: "ALMOST_UNLOCKED",
    },
    {
      id: "d3",
      title: "Fortune Sunflower Oil 5L Community Pack",
      variant: "5 Litre Jar",
      committedQty: 58,
      targetQty: 80,
      mrp: 750,
      tierPrice: 649,
      participants: 38,
      daysLeft: 5,
      status: "OPEN",
    },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {deal.variant}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {deal.daysLeft}d left
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{deal.title}</h3>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-600">{deal.committedQty} ordered</span>
                    <span className="text-indigo-600">{deal.targetQty} MOQ target</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: Math.min((deal.committedQty / deal.targetQty) * 100, 100) + '%' }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Community Rate</div>
                    <div className="text-sm font-black text-slate-900">
                      ₹{deal.tierPrice}{' '}
                      <span className="text-[10px] font-normal text-slate-400 line-through">₹{deal.mrp}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-medium">Buyers</div>
                    <div className="text-xs font-bold text-slate-700">{deal.participants} residents</div>
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
          ))}
        </div>
      )}

      {activeTab === "CREATE" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs max-w-2xl">
          <h3 className="text-base font-black text-slate-900 mb-1">Launch a New Community Deal</h3>
          <p className="text-xs text-slate-500 mb-4">Set minimum order quantity (MOQ) and unlock tiers for societies.</p>

          <form className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Product Variant *</label>
              <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:border-indigo-600">
                <option>Aashirvaad Shudh Chakki Atta - 10 KG Bulk Bag</option>
                <option>Fortune Sunlite Refined Sunflower Oil - 5 Litre Jar</option>
                <option>Ratnagiri GI Alphonso Mangoes - Box of 1 Dozen</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target MOQ (Units) *</label>
                <input type="number" defaultValue={50} className="w-full p-2.5 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Duration (Days) *</label>
                <input type="number" defaultValue={5} className="w-full p-2.5 border border-slate-200 rounded-xl font-bold" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pickup Point</label>
              <input type="text" defaultValue="Clubhouse Entrance / Tower Lobby" className="w-full p-2.5 border border-slate-200 rounded-xl" />
            </div>

            <button type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer">
              Publish Community Deal
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
