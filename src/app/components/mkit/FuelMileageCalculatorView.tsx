import { useState } from "react";
import { Fuel, Users, Gauge, MapPin, IndianRupee, Sparkles, Car } from "lucide-react";
import { calculateFuelTrip, calculateMileage } from "../../../utils/mkitCalculators";

type FuelMode = "trip" | "mileage";

export function FuelMileageCalculatorView() {
  const [mode, setMode] = useState<FuelMode>("trip");

  // Trip State
  const [distance, setDistance] = useState<number>(180);
  const [mileage, setMileage] = useState<number>(16);
  const [fuelPrice, setFuelPrice] = useState<number>(104);
  const [passengers, setPassengers] = useState<number>(3);

  // Mileage Tracker State
  const [mileageDistance, setMileageDistance] = useState<number>(420);
  const [fuelFilled, setFuelFilled] = useState<number>(28);

  const tripResult = calculateFuelTrip(distance, mileage, fuelPrice, passengers);
  const calculatedMileage = calculateMileage(mileageDistance, fuelFilled);
  const realCostPerKm = fuelFilled > 0 ? (fuelFilled * fuelPrice) / mileageDistance : 0;

  const presets = [
    { label: "Motorcycle (45 km/l)", val: 45 },
    { label: "Sedan / Hatchback (16 km/l)", val: 16 },
    { label: "Compact SUV (13 km/l)", val: 13 },
    { label: "Full-size SUV (10 km/l)", val: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl max-w-sm">
        <button
          onClick={() => setMode("trip")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            mode === "trip" ? "bg-white text-amber-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Fuel className="w-4 h-4" />
          Trip Fuel Cost
        </button>
        <button
          onClick={() => setMode("mileage")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            mode === "mileage" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Gauge className="w-4 h-4" />
          Mileage Checker
        </button>
      </div>

      {mode === "trip" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Fuel className="w-5 h-5 text-amber-600" />
              Trip & Vehicle Details
            </h3>

            {/* Quick Vehicle Presets */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Vehicle Preset</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setMileage(p.val)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                      mileage === p.val
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Trip Distance (km)
                </span>
                <span className="text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-lg">
                  {distance} km
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="1500"
                step="5"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>5 km</span>
                <span>500 km</span>
                <span>1500 km</span>
              </div>
            </div>

            {/* Vehicle Mileage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-slate-400" />
                  Vehicle Mileage (km/L)
                </span>
                <span className="text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-lg">
                  {mileage} km/L
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="0.5"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>5 km/L</span>
                <span>25 km/L</span>
                <span>60 km/L</span>
              </div>
            </div>

            {/* Fuel Price & Passengers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-slate-400" />
                  Fuel Price (₹/Liter)
                </label>
                <input
                  type="number"
                  min="50"
                  max="200"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  Passengers / Carpool Seats
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={passengers}
                    onChange={(e) => setPassengers(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-xs text-slate-500 whitespace-nowrap">Riders</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-5 bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-amber-200 font-medium">Total Trip Fuel Cost</p>
                <h2 className="text-4xl font-extrabold text-white mt-1">
                  ₹{tripResult.totalCost}
                </h2>
                <p className="text-xs text-amber-300 mt-1">
                  For {distance} km trip ({tripResult.fuelNeededLiters} Liters needed)
                </p>
              </div>

              {/* Per Passenger Carpool Card */}
              <div className="bg-amber-500/20 border border-amber-500/30 p-4 rounded-xl backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-amber-200 font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Carpool Cost / Rider
                    </span>
                    <h3 className="text-2xl font-bold text-amber-300 mt-1">
                      ₹{tripResult.costPerPerson}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-300">Split among</span>
                    <p className="text-sm font-semibold text-white">{passengers} passengers</p>
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <p className="text-xs text-slate-300">Fuel Needed</p>
                  <p className="text-lg font-bold text-white mt-0.5">{tripResult.fuelNeededLiters} L</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <p className="text-xs text-slate-300">Running Cost / km</p>
                  <p className="text-lg font-bold text-white mt-0.5">₹{tripResult.costPerKm}/km</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-amber-200/90 flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Tip: Maintain steady speeds between 60-80 km/h to increase fuel efficiency by up to 15%.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Mileage Checker */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Gauge className="w-5 h-5 text-indigo-600" />
              Calculate Actual Vehicle Mileage
            </h3>

            <p className="text-sm text-slate-600">
              Enter your trip odometer reading (full tank to empty/refill) and the exact fuel liters filled.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Distance Travelled (Odometer km)
                </label>
                <input
                  type="number"
                  min="1"
                  value={mileageDistance}
                  onChange={(e) => setMileageDistance(Number(e.target.value))}
                  placeholder="e.g. 420"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Fuel Filled (Liters)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={fuelFilled}
                  onChange={(e) => setFuelFilled(Number(e.target.value))}
                  placeholder="e.g. 28"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-indigo-200 font-medium">Real-World Mileage</p>
              <h2 className="text-5xl font-extrabold text-indigo-300 mt-2">
                {calculatedMileage} <span className="text-xl text-white font-semibold">km/L</span>
              </h2>
              <p className="text-xs text-indigo-200 mt-2">
                Based on {mileageDistance} km driven with {fuelFilled} Liters
              </p>
            </div>

            <div className="mt-8 bg-white/10 p-4 rounded-xl border border-white/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-200">Fuel Consumption</span>
                <span className="font-semibold text-white">
                  {fuelFilled > 0 && mileageDistance > 0
                    ? ((fuelFilled / mileageDistance) * 100).toFixed(2)
                    : "0"} L / 100 km
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-200">Estimated Cost/km</span>
                <span className="font-semibold text-emerald-400">
                  ₹{Number(realCostPerKm.toFixed(2))}/km
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
