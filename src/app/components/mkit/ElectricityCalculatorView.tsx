import { useState } from "react";
import { Zap, IndianRupee, Plus, Trash2, Lightbulb, AlertTriangle, ShieldCheck } from "lucide-react";
import { calculateElectricityCost, type ApplianceItem } from "../../../utils/mkitCalculators";

const DEFAULT_APPLIANCES: ApplianceItem[] = [
  { id: "1", name: "1.5 Ton Inverter AC", powerWatts: 1400, hoursPerDay: 8, quantity: 1 },
  { id: "2", name: "Double-Door Refrigerator", powerWatts: 220, hoursPerDay: 24, quantity: 1 },
  { id: "3", name: "BLDC Ceiling Fan", powerWatts: 35, hoursPerDay: 12, quantity: 3 },
  { id: "4", name: "55\" 4K Smart TV", powerWatts: 110, hoursPerDay: 5, quantity: 1 },
  { id: "5", name: "Front-Load Washing Machine", powerWatts: 500, hoursPerDay: 1, quantity: 1 },
  { id: "6", name: "Storage Water Geyser", powerWatts: 2000, hoursPerDay: 1, quantity: 1 },
  { id: "7", name: "LED Lighting Bulbs", powerWatts: 10, hoursPerDay: 6, quantity: 8 },
];

export function ElectricityCalculatorView() {
  const [tariff, setTariff] = useState<number>(7.5);
  const [appliances, setAppliances] = useState<ApplianceItem[]>(DEFAULT_APPLIANCES);

  const res = calculateElectricityCost(appliances, tariff);

  const updateAppliance = (id: string, field: keyof ApplianceItem, val: any) => {
    setAppliances(
      appliances.map((a) => {
        if (a.id !== id) return a;
        return { ...a, [field]: val };
      })
    );
  };

  const removeAppliance = (id: string) => {
    setAppliances(appliances.filter((a) => a.id !== id));
  };

  const addAppliance = () => {
    const newId = String(Date.now());
    setAppliances([
      ...appliances,
      { id: newId, name: "New Appliance", powerWatts: 100, hoursPerDay: 4, quantity: 1 },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Appliances List Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Home Appliances & Usage
              </h3>
              <p className="text-xs text-slate-500">Configure wattage and daily running hours</p>
            </div>

            {/* Tariff Selector */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-semibold text-amber-800">Tariff: ₹</span>
              <input
                type="number"
                step="0.5"
                min="1"
                max="25"
                value={tariff}
                onChange={(e) => setTariff(Math.max(0, Number(e.target.value)))}
                className="w-16 px-1.5 py-0.5 bg-white border border-amber-300 rounded text-xs font-bold text-amber-900 focus:outline-none"
              />
              <span className="text-xs text-amber-700">/unit (kWh)</span>
            </div>
          </div>

          {/* Appliances Table */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {appliances.map((app) => (
              <div
                key={app.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl hover:bg-slate-50/80 transition"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={app.name}
                    onChange={(e) => updateAppliance(app.id, "name", e.target.value)}
                    className="font-bold text-sm text-slate-800 bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full"
                  />
                  <span className="text-[11px] text-slate-400">
                    {app.powerWatts}W × {app.quantity} qty × {app.hoursPerDay}h/day
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                    <input
                      type="number"
                      min="1"
                      value={app.powerWatts}
                      onChange={(e) => updateAppliance(app.id, "powerWatts", Number(e.target.value))}
                      className="w-14 text-xs font-bold text-slate-800 focus:outline-none text-right"
                    />
                    <span className="text-[10px] text-slate-400">W</span>
                  </div>

                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                    <input
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={app.hoursPerDay}
                      onChange={(e) => updateAppliance(app.id, "hoursPerDay", Number(e.target.value))}
                      className="w-10 text-xs font-bold text-slate-800 focus:outline-none text-right"
                    />
                    <span className="text-[10px] text-slate-400">hrs</span>
                  </div>

                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={app.quantity}
                      onChange={(e) => updateAppliance(app.id, "quantity", Number(e.target.value))}
                      className="w-8 text-xs font-bold text-slate-800 focus:outline-none text-right"
                    />
                    <span className="text-[10px] text-slate-400">qty</span>
                  </div>

                  <button
                    onClick={() => removeAppliance(app.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addAppliance}
            className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 rounded-2xl text-xs font-bold text-slate-600 hover:text-amber-700 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Add Another Appliance
          </button>
        </div>

        {/* Right Cost Summary Column */}
        <div className="lg:col-span-5 bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-amber-300 font-semibold">Estimated Monthly Bill</p>
              <h2 className="text-5xl font-black text-amber-400 mt-1">
                ₹{res.monthlyBill.toLocaleString("en-IN")}
              </h2>
              <p className="text-xs text-amber-200 mt-1">
                Based on {res.monthlyUnitsKwh} units (kWh) consumed per month
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                <span className="text-xs text-slate-300 block">Daily Units</span>
                <span className="text-lg font-bold text-white">{res.dailyUnitsKwh} kWh</span>
                <span className="text-[10px] text-amber-300 block">₹{res.dailyCost}/day</span>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                <span className="text-xs text-slate-300 block">Annual Projected</span>
                <span className="text-lg font-bold text-white">{res.annualUnitsKwh} kWh</span>
                <span className="text-[10px] text-amber-300 block">₹{res.annualBill.toLocaleString("en-IN")}/yr</span>
              </div>
            </div>

            {/* Appliance Breakdown Bars */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-200">Appliance Consumption Share</p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {res.applianceBreakdown.slice(0, 5).map((d) => (
                  <div key={d.id} className="text-xs">
                    <div className="flex justify-between text-slate-300 mb-0.5">
                      <span className="truncate max-w-[180px]">{d.name}</span>
                      <span className="font-bold text-amber-300">₹{d.monthlyCost} ({d.percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div style={{ width: `${d.percentage}%` }} className="h-full bg-amber-400 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-amber-200 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Energy tip: Setting AC temperature to 24°C instead of 18°C saves up to 24% electricity.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
