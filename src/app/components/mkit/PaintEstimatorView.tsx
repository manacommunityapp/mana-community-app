import { useState } from "react";
import { Paintbrush, Home, Ruler, Layers, IndianRupee, Sparkles, CheckCircle2 } from "lucide-react";
import { calculatePaintEstimator } from "../../../utils/mkitCalculators";

export function PaintEstimatorView() {
  const [length, setLength] = useState<number>(14);
  const [width, setWidth] = useState<number>(12);
  const [height, setHeight] = useState<number>(10);
  const [doors, setDoors] = useState<number>(1);
  const [windows, setWindows] = useState<number>(2);
  const [includeCeiling, setIncludeCeiling] = useState<boolean>(true);
  const [coats, setCoats] = useState<number>(2);
  const [coverage, setCoverage] = useState<number>(120);
  const [costPerLiter, setCostPerLiter] = useState<number>(380);

  const res = calculatePaintEstimator({
    lengthFeet: length,
    widthFeet: width,
    heightFeet: height,
    doorsCount: doors,
    windowsCount: windows,
    includeCeiling,
    coatsCount: coats,
    coverageSqFtPerLiter: coverage,
    costPerLiter,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Ruler className="w-5 h-5 text-indigo-600" />
            Room Dimensions & Openings
          </h3>

          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Length (ft)</label>
              <input
                type="number"
                min="4"
                max="100"
                value={length}
                onChange={(e) => setLength(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Width (ft)</label>
              <input
                type="number"
                min="4"
                max="100"
                value={width}
                onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Height (ft)</label>
              <input
                type="number"
                min="6"
                max="25"
                value={height}
                onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Doors & Windows */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Doors (21 sq ft ea)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={doors}
                onChange={(e) => setDoors(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Windows (12 sq ft ea)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={windows}
                onChange={(e) => setWindows(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Ceiling Toggle */}
          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCeiling}
              onChange={(e) => setIncludeCeiling(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded"
            />
            <div>
              <span className="text-sm font-bold text-slate-800 block">Include Ceiling Area</span>
              <span className="text-xs text-slate-500">Adds {length * width} sq ft for roof / ceiling paint</span>
            </div>
          </label>

          {/* Coats & Price */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Number of Coats</label>
              <div className="flex gap-2">
                {[1, 2, 3].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCoats(c)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition border ${
                      coats === c
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {c} {c === 1 ? "Coat" : "Coats"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Paint Cost (₹/L)</label>
              <input
                type="number"
                min="100"
                max="1500"
                value={costPerLiter}
                onChange={(e) => setCostPerLiter(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right Output Results Column */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Total Paint Required</p>
              <h2 className="text-5xl font-black text-white mt-1">
                {res.litersRequired} <span className="text-2xl text-indigo-300 font-semibold">Liters</span>
              </h2>
              <p className="text-xs text-indigo-200 mt-1">
                Estimated Paint Budget: <b className="text-amber-300 text-sm">₹{res.estimatedCost.toLocaleString("en-IN")}</b>
              </p>
            </div>

            {/* Recommended Cans */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Recommended Can Sizes</p>
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="text-xs text-indigo-300 block">20L Drum</span>
                  <span className="text-lg font-bold text-white">{res.recommendedCans.can20L}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="text-xs text-indigo-300 block">10L Bucket</span>
                  <span className="text-lg font-bold text-white">{res.recommendedCans.can10L}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="text-xs text-indigo-300 block">4L Can</span>
                  <span className="text-lg font-bold text-white">{res.recommendedCans.can4L}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-xl">
                  <span className="text-xs text-indigo-300 block">1L Tin</span>
                  <span className="text-lg font-bold text-white">{res.recommendedCans.can1L}</span>
                </div>
              </div>
            </div>

            {/* Area Breakdown */}
            <div className="space-y-1.5 text-xs text-indigo-200">
              <div className="flex justify-between">
                <span>Gross Wall Surface:</span>
                <span className="font-semibold text-white">{res.grossWallAreaSqFt} sq ft</span>
              </div>
              {includeCeiling && (
                <div className="flex justify-between">
                  <span>Ceiling Surface:</span>
                  <span className="font-semibold text-white">{res.ceilingAreaSqFt} sq ft</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Deductions (Doors/Windows):</span>
                <span className="font-semibold text-amber-300">-{res.deductionsSqFt} sq ft</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/10 font-bold text-white">
                <span>Net Paintable Area ({coats} coats):</span>
                <span>{res.totalPaintAreaSqFt} sq ft</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-indigo-200 flex items-center gap-2">
            <Paintbrush className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Calculation based on standard premium interior emulsion coverage (~120 sq ft/L).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
