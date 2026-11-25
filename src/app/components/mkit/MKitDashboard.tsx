import { useState } from "react";
import {
  Wrench,
  Calculator,
  Fuel,
  Receipt,
  KeyRound,
  Search,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Clock,
  QrCode,
  Paintbrush,
  ArrowRight,
  UserCheck,
  Compass,
} from "lucide-react";
import { EmiSipCalculatorView } from "./EmiSipCalculatorView";
import { FuelMileageCalculatorView } from "./FuelMileageCalculatorView";
import { BillSplitterView } from "./BillSplitterView";
import { PasswordGeneratorView } from "./PasswordGeneratorView";
import { PomodoroTimerView } from "./PomodoroTimerView";
import { QrCodeStudioView } from "./QrCodeStudioView";
import { PaintEstimatorView } from "./PaintEstimatorView";
import { ElectricityCalculatorView } from "./ElectricityCalculatorView";
import { StaffSalaryCalculatorView } from "./StaffSalaryCalculatorView";
import { LandUnitConverterView } from "./LandUnitConverterView";

export type ToolId =
  | "emi-sip"
  | "fuel-mileage"
  | "bill-split"
  | "staff-salary"
  | "land-converter"
  | "pomodoro"
  | "qr-studio"
  | "paint-estimator"
  | "electricity-calc"
  | "password-gen";

interface ToolItem {
  id: ToolId;
  name: string;
  tagline: string;
  category: "finance" | "travel" | "productivity" | "utility" | "security" | "home";
  icon: any;
  color: string;
  bgColor: string;
  popular?: boolean;
}

const TOOLS: ToolItem[] = [
  {
    id: "emi-sip",
    name: "EMI & SIP Calculators",
    tagline: "Calculate home/car loan EMIs, SIP maturity, and lumpsum compounding with yearly schedules.",
    category: "finance",
    icon: Calculator,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:border-indigo-200",
    popular: true,
  },
  {
    id: "staff-salary",
    name: "Staff & Maid Salary",
    tagline: "Calculate pro-rata daily wages, unpaid leaves, advances, and generate WhatsApp salary slips.",
    category: "home",
    icon: UserCheck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 hover:border-emerald-200",
    popular: true,
  },
  {
    id: "land-converter",
    name: "Indian Land & Area Converter",
    tagline: "Convert Sq Ft, Sq Yards (Gaj), Guntha, Cents, Ankanam, Acres & estimate property values.",
    category: "utility",
    icon: Compass,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:border-blue-200",
    popular: true,
  },
  {
    id: "fuel-mileage",
    name: "Fuel Cost & Mileage",
    tagline: "Estimate road trip fuel consumption, carpool seat cost, and real vehicle mileage.",
    category: "travel",
    icon: Fuel,
    color: "text-amber-600",
    bgColor: "bg-amber-50 hover:border-amber-200",
    popular: true,
  },
  {
    id: "bill-split",
    name: "Bill Splitter & Tip",
    tagline: "Split restaurant bills with custom tips, GST, equal/itemized shares, and WhatsApp sharing.",
    category: "utility",
    icon: Receipt,
    color: "text-teal-600",
    bgColor: "bg-teal-50 hover:border-teal-200",
    popular: true,
  },
  {
    id: "pomodoro",
    name: "Pomodoro Focus Timer",
    tagline: "25/5/15 min smart intervals, session tracking, and audio chime alerts for peak productivity.",
    category: "productivity",
    icon: Clock,
    color: "text-rose-600",
    bgColor: "bg-rose-50 hover:border-rose-200",
    popular: true,
  },
  {
    id: "qr-studio",
    name: "QR Code Studio",
    tagline: "Generate instant scannable QR codes for UPI payments, WiFi auto-connect, links & text.",
    category: "utility",
    icon: QrCode,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:border-indigo-200",
  },
  {
    id: "paint-estimator",
    name: "Paint & Wall Area Estimator",
    tagline: "Calculate room surface areas, door/window deductions, coats, and paint can requirements.",
    category: "home",
    icon: Paintbrush,
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:border-purple-200",
  },
  {
    id: "electricity-calc",
    name: "Electricity & Power Cost",
    tagline: "Appliance wattage consumption, kWh units tracking, and projected monthly electricity bills.",
    category: "home",
    icon: Zap,
    color: "text-amber-500",
    bgColor: "bg-amber-50 hover:border-amber-200",
  },
  {
    id: "password-gen",
    name: "Password Generator",
    tagline: "Generate cryptographically secure passwords and PINs with strength and entropy scoring.",
    category: "security",
    icon: KeyRound,
    color: "text-violet-600",
    bgColor: "bg-violet-50 hover:border-violet-200",
  },
];

export function MKitDashboard() {
  const [activeTool, setActiveTool] = useState<ToolId>("emi-sip");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredTools = TOOLS.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "all" || tool.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>ManaKit • Everyday Tools Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Why install multiple apps when <span className="text-amber-400">ONE app</span> does it all?
          </h1>
          <p className="text-indigo-200 text-sm sm:text-base leading-relaxed">
            Your all-in-one smart utility toolkit designed to make everyday tasks simpler, faster, and 100% offline.
          </p>
        </div>

        {/* Feature Badges in Header */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-700/50">
          <div className="flex items-center gap-2 text-xs text-indigo-200">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Instant Calculations</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-indigo-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Client-Side Privacy</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-indigo-200">
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Indian Land Converter</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-indigo-200">
            <UserCheck className="w-4 h-4 text-emerald-300" />
            <span>Maid & Staff Pay Slips</span>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {[
            { id: "all", label: "All 10 Tools" },
            { id: "finance", label: "Finance & Loans" },
            { id: "home", label: "Home & Domestic" },
            { id: "utility", label: "Utilities & Land" },
            { id: "productivity", label: "Focus" },
            { id: "travel", label: "Travel & Fuel" },
            { id: "security", label: "Security" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all 10 tools..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tool Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? "bg-white border-indigo-600 ring-2 ring-indigo-600/20 shadow-md"
                  : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`p-2 rounded-xl ${tool.bgColor}`}>
                    <Icon className={`w-4 h-4 ${tool.color}`} />
                  </div>
                  {tool.popular && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 leading-snug">{tool.name}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{tool.tagline}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                <span className={isSelected ? "text-indigo-600" : "text-slate-400"}>
                  {isSelected ? "Active" : "Open"}
                </span>
                <ArrowRight
                  className={`w-3 h-3 transition ${
                    isSelected ? "text-indigo-600 translate-x-0.5" : "text-slate-400"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tool View Workspace */}
      <div className="bg-slate-50/80 p-4 sm:p-6 rounded-3xl border border-slate-200/80">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {TOOLS.find((t) => t.id === activeTool)?.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {TOOLS.find((t) => t.id === activeTool)?.tagline}
            </p>
          </div>
        </div>

        {activeTool === "emi-sip" && <EmiSipCalculatorView />}
        {activeTool === "staff-salary" && <StaffSalaryCalculatorView />}
        {activeTool === "land-converter" && <LandUnitConverterView />}
        {activeTool === "fuel-mileage" && <FuelMileageCalculatorView />}
        {activeTool === "bill-split" && <BillSplitterView />}
        {activeTool === "pomodoro" && <PomodoroTimerView />}
        {activeTool === "qr-studio" && <QrCodeStudioView />}
        {activeTool === "paint-estimator" && <PaintEstimatorView />}
        {activeTool === "electricity-calc" && <ElectricityCalculatorView />}
        {activeTool === "password-gen" && <PasswordGeneratorView />}
      </div>
    </div>
  );
}
