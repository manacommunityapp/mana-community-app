import { useState } from "react";
import { Compass, Landmark, IndianRupee, ArrowRightLeft, Sparkles, MapPin } from "lucide-react";
import { convertArea, AREA_UNITS_META, type AreaUnit } from "../../../utils/mkitCalculators";

export function LandUnitConverterView() {
  const [sourceValue, setSourceValue] = useState<number>(1);
  const [sourceUnit, setSourceUnit] = useState<AreaUnit>("guntha");

  // Real estate price estimator
  const [ratePerUnit, setRatePerUnit] = useState<number>(6500);
  const [rateUnit, setRateUnit] = useState<AreaUnit>("sqft");

  const convertedResults = convertArea(sourceValue, sourceUnit);

  // Property value calculation
  const totalSqFt = convertedResults.sqft;
  const rateFactor = AREA_UNITS_META.find((u) => u.id === rateUnit)?.toSqFt || 1;
  const ratePerSqFt = ratePerUnit / rateFactor;
  const totalPropertyValue = Math.round(totalSqFt * ratePerSqFt);

  const formatPrice = (val: number): string => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    } else if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakhs`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs & Multi-unit Cards */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                Indian Land & Area Unit Converter
              </h3>
              <p className="text-xs text-slate-500">
                Instant conversion across national, regional, and state land measurements
              </p>
            </div>
          </div>

          {/* Primary Input */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                Enter Area Value
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={sourceValue || ""}
                onChange={(e) => setSourceValue(Math.max(0, Number(e.target.value)))}
                placeholder="1"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:w-56">
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                From Unit
              </label>
              <select
                value={sourceUnit}
                onChange={(e) => setSourceUnit(e.target.value as AreaUnit)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {AREA_UNITS_META.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversion Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {AREA_UNITS_META.map((u) => {
              const val = convertedResults[u.id];
              const isSelected = u.id === sourceUnit;
              return (
                <div
                  key={u.id}
                  onClick={() => {
                    setSourceUnit(u.id);
                    setSourceValue(val);
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20"
                      : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className="text-[10px] text-slate-400 uppercase font-bold block truncate">
                    {u.region}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-base font-extrabold text-slate-900">{val}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 truncate block mt-0.5">
                    {u.name.split("(")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Real Estate Cost Estimator Column */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                Estimated Property Value
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-amber-400 mt-1">
                {formatPrice(totalPropertyValue)}
              </h2>
              <p className="text-xs text-indigo-200 mt-1">
                Based on {sourceValue} {AREA_UNITS_META.find((u) => u.id === sourceUnit)?.name} ({convertedResults.sqft} sq ft)
              </p>
            </div>

            {/* Rate Inputs */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-3 backdrop-blur-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200 block">
                Plot / Apartment Rate
              </span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={ratePerUnit}
                    onChange={(e) => setRatePerUnit(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-7 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm font-bold text-white focus:outline-none"
                  />
                </div>
                <select
                  value={rateUnit}
                  onChange={(e) => setRateUnit(e.target.value as AreaUnit)}
                  className="bg-white/10 border border-white/20 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none"
                >
                  {AREA_UNITS_META.map((u) => (
                    <option key={u.id} value={u.id} className="text-slate-900">
                      / {u.name.split("(")[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-indigo-200 pt-1 flex justify-between">
                <span>Effective Rate:</span>
                <span className="font-bold text-white">₹{Math.round(ratePerSqFt).toLocaleString("en-IN")}/sq ft</span>
              </div>
            </div>

            {/* Regional Conversion Quick Reference */}
            <div className="space-y-1.5 text-xs text-indigo-200">
              <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">Quick Reference</span>
              <div className="flex justify-between">
                <span>1 Guntha (KA/TS/MH):</span>
                <span className="font-bold text-white">1,089 sq ft (1/40 Acre)</span>
              </div>
              <div className="flex justify-between">
                <span>1 Cent (TN/KL):</span>
                <span className="font-bold text-white">435.6 sq ft (1/100 Acre)</span>
              </div>
              <div className="flex justify-between">
                <span>1 Sq Yard (Gaj):</span>
                <span className="font-bold text-white">9 sq ft</span>
              </div>
              <div className="flex justify-between">
                <span>1 Ground (Chennai):</span>
                <span className="font-bold text-white">2,400 sq ft</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-indigo-200 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Essential for cross-state property investments, boundary surveys, and plot registrations.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
