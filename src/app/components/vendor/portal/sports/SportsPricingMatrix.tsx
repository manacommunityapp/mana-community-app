import { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { sportsVendorService } from "../../../../../services/sports/sportsVendorService";
import type {
  SportsFacility,
  SportsCourtConfig,
  SportsPricingRule,
} from "../../../../../types/sportsVendor";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function SportsPricingMatrix() {
  const [facilities, setFacilities] = useState<SportsFacility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState("");
  const [courts, setCourts] = useState<SportsCourtConfig[]>([]);
  const [pricingRules, setPricingRules] = useState<SportsPricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // New Rule Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState<{
    courtId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    price: number;
    residentDiscountPercent: number;
    isPeakHour: boolean;
  }>({
    courtId: undefined,
    dayOfWeek: 6, // Saturday
    startTime: "06:00",
    endTime: "11:00",
    price: 650,
    residentDiscountPercent: 15,
    isPeakHour: true,
  });

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (selectedFacilityId) {
      loadFacilityDetails(selectedFacilityId);
    }
  }, [selectedFacilityId]);

  async function init() {
    setLoading(true);
    try {
      const facs = await sportsVendorService.getFacilities();
      setFacilities(facs);
      if (facs.length > 0) {
        setSelectedFacilityId(facs[0].id);
      }
    } catch (err) {
      toast.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  }

  async function loadFacilityDetails(facilityId: string) {
    try {
      const [crts, rules] = await Promise.all([
        sportsVendorService.getCourts(facilityId),
        sportsVendorService.getPricingRules(facilityId),
      ]);
      setCourts(crts);
      setPricingRules(rules);
    } catch (err) {
      toast.error("Failed to load pricing data");
    }
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFacilityId) return;

    try {
      const saved = await sportsVendorService.savePricingRule({
        facilityId: selectedFacilityId,
        courtId: newRule.courtId,
        dayOfWeek: Number(newRule.dayOfWeek),
        startTime: newRule.startTime,
        endTime: newRule.endTime,
        price: Number(newRule.price),
        residentDiscountPercent: Number(newRule.residentDiscountPercent),
        isPeakHour: newRule.isPeakHour,
      });
      setPricingRules((prev) => [...prev, saved]);
      setShowAddForm(false);
      toast.success("Pricing rule saved successfully!");
    } catch (err) {
      toast.error("Failed to add pricing rule");
    }
  }

  async function handleDeleteRule(ruleId: string) {
    try {
      await sportsVendorService.deletePricingRule(ruleId);
      setPricingRules((prev) => prev.filter((r) => r.id !== ruleId));
      toast.success("Pricing rule removed");
    } catch (err) {
      toast.error("Failed to delete pricing rule");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pricing & Peak Rate Rules</h1>
          <p className="text-xs text-slate-500">
            Define dynamic time-based rates for weekends, prime morning/evening hours, and community resident benefits.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Pricing Rule
        </button>
      </div>

      {/* Facility Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
        <span className="text-xs font-bold text-slate-500">Facility:</span>
        <select
          value={selectedFacilityId}
          onChange={(e) => setSelectedFacilityId(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
        >
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add Rule Form */}
      {showAddForm && (
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              New Rate Override Rule
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Court</label>
              <select
                value={newRule.courtId || ""}
                onChange={(e) => setNewRule({ ...newRule, courtId: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">All Courts in Venue</option>
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Day of Week</label>
              <select
                value={newRule.dayOfWeek}
                onChange={(e) => setNewRule({ ...newRule, dayOfWeek: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                {DAYS.map((d, idx) => (
                  <option key={d} value={idx}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Start Time</label>
              <input
                type="time"
                value={newRule.startTime}
                onChange={(e) => setNewRule({ ...newRule, startTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">End Time</label>
              <input
                type="time"
                value={newRule.endTime}
                onChange={(e) => setNewRule({ ...newRule, endTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Special Rate / Hour (₹)</label>
              <input
                type="number"
                min="100"
                step="50"
                value={newRule.price}
                onChange={(e) => setNewRule({ ...newRule, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Resident Partner Discount (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={newRule.residentDiscountPercent}
                onChange={(e) =>
                  setNewRule({ ...newRule, residentDiscountPercent: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={newRule.isPeakHour}
                  onChange={(e) => setNewRule({ ...newRule, isPeakHour: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                Mark as Peak Hours (Prime)
              </label>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                Save Rate Rule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Rate Rules ({pricingRules.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Rules automatically calculate slot totals during resident booking checkout
          </span>
        </div>

        {pricingRules.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No custom rate rules set. Standard base court pricing applies across all days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Court Scope</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Hourly Price</th>
                  <th className="py-3 px-4">Resident Price</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pricingRules.map((rule) => {
                  const court = courts.find((c) => c.id === rule.courtId);
                  const resPrice = Math.round(rule.price * (1 - rule.residentDiscountPercent / 100));

                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {court ? court.name : "All Courts in Venue"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {DAYS[rule.dayOfWeek]}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {rule.startTime} - {rule.endTime}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{rule.price} / hr
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        ₹{resPrice} / hr ({rule.residentDiscountPercent}% off)
                      </td>
                      <td className="py-3 px-4">
                        {rule.isPeakHour ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Peak Slot
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
