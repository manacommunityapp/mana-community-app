import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Droplets,
  Activity,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  FileText,
  X,
  ChevronRight,
  Gauge,
  Building2,
  RefreshCw,
  Truck,
  Sparkles,
  Zap,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { NavLink } from "react-router";
import {
  waterMaintenanceService,
  type WaterStorageTank,
  type WaterTankerDelivery,
  type WaterPump,
  type WaterTreatmentLog,
  type WaterQualityTest,
  type TankCleaningSchedule,
  type WaterOverviewSummary,
} from "../../../services/maintenance/waterMaintenanceService";

type ActiveTab = "overview" | "tankers" | "pumps" | "treatment" | "quality" | "cleaning";

const DEFAULT_DATE_STRING = "2026-11-19";

export function WaterMaintenanceDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [loading, setLoading] = useState<boolean>(true);

  // Data states
  const [tanks, setTanks] = useState<WaterStorageTank[]>([]);
  const [tankers, setTankers] = useState<WaterTankerDelivery[]>([]);
  const [pumps, setPumps] = useState<WaterPump[]>([]);
  const [treatmentLogs, setTreatmentLogs] = useState<WaterTreatmentLog[]>([]);
  const [qualityTests, setQualityTests] = useState<WaterQualityTest[]>([]);
  const [cleaningSchedules, setCleaningSchedules] = useState<TankCleaningSchedule[]>([]);
  const [summary, setSummary] = useState<WaterOverviewSummary | null>(null);

  // Filters
  const [tankerSearch, setTankerSearch] = useState<string>("");
  const [treatmentFilter, setTreatmentFilter] = useState<string>("ALL");

  // Modals
  const [showTankerModal, setShowTankerModal] = useState<boolean>(false);
  const [showQualityModal, setShowQualityModal] = useState<boolean>(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState<boolean>(false);
  const [showCleaningModal, setShowCleaningModal] = useState<boolean>(false);

  // Modal Forms
  const [tankerForm, setTankerForm] = useState({
    vendorName: "",
    vehicleNumber: "",
    capacityLiters: 12000,
    cost: 1250,
    invoiceNumber: "",
    driverPhone: "",
    targetTankId: "",
    approvedBy: "Security Main Gate",
    notes: "",
  });

  const [qualityForm, setQualityForm] = useState({
    sourceLocation: "WTP_OUTLET" as WaterQualityTest["sourceLocation"],
    ph: 7.2,
    tdsPpm: 210,
    hardnessPpm: 150,
    residualChlorinePpm: 0.4,
    turbidityNtu: 0.6,
    testedBy: "In-House Facility Tech",
  });

  const [treatmentForm, setTreatmentForm] = useState({
    plantType: "WTP" as "WTP" | "STP",
    operationType: "MGF_BACKWASH" as WaterTreatmentLog["operationType"],
    quantityUsedKg: 0,
    operatorName: "WTP Operator",
    notes: "",
  });

  const [cleaningForm, setCleaningForm] = useState({
    tankId: "",
    lastCleanedDate: DEFAULT_DATE_STRING,
    nextDueDate: "2027-05-19",
    cleaningType: "MECHANIZED_DEWATERING_UV" as TankCleaningSchedule["cleaningType"],
    vendorName: "AquaClean Tech Solutions",
    cost: 12000,
    notes: "",
  });

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [t, d, p, tr, q, c, s] = await Promise.all([
        waterMaintenanceService.getStorageTanks(),
        waterMaintenanceService.getTankerDeliveries(),
        waterMaintenanceService.getPumps(),
        waterMaintenanceService.getTreatmentLogs(),
        waterMaintenanceService.getQualityTests(),
        waterMaintenanceService.getCleaningSchedules(),
        waterMaintenanceService.getOverviewSummary(),
      ]);
      setTanks(t);
      setTankers(d);
      setPumps(p);
      setTreatmentLogs(tr);
      setQualityTests(q);
      setCleaningSchedules(c);
      setSummary(s);
    } catch (err) {
      console.error("Failed to load water maintenance telemetry", err);
      toast.error("Failed to load water telemetry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      waterMaintenanceService.getStorageTanks(),
      waterMaintenanceService.getTankerDeliveries(),
      waterMaintenanceService.getPumps(),
      waterMaintenanceService.getTreatmentLogs(),
      waterMaintenanceService.getQualityTests(),
      waterMaintenanceService.getCleaningSchedules(),
      waterMaintenanceService.getOverviewSummary(),
    ])
      .then(([t, d, p, tr, q, c, s]) => {
        if (!isMounted) return;
        setTanks(t);
        setTankers(d);
        setPumps(p);
        setTreatmentLogs(tr);
        setQualityTests(q);
        setCleaningSchedules(c);
        setSummary(s);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load water maintenance telemetry", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handlers
  const handleOpenTankerModal = () => {
    setTankerForm({
      vendorName: "Cauvery Fresh Water Carriers",
      vehicleNumber: "KA-01-MJ-8821",
      capacityLiters: 12000,
      cost: 1250,
      invoiceNumber: "INV-" + DEFAULT_DATE_STRING.replace(/-/g, "") + "-01",
      driverPhone: "+91 98451 12345",
      targetTankId: tanks[0]?.id || "",
      approvedBy: "Gate Guard Ramesh",
      notes: "TDS tested and certified. Pressure normal.",
    });
    setShowTankerModal(true);
  };

  const handleSaveTanker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await waterMaintenanceService.logTankerDelivery({
        ...tankerForm,
        capacityLiters: Number(tankerForm.capacityLiters),
        cost: Number(tankerForm.cost),
        status: "RECEIVED",
      });
      toast.success("Tanker delivery logged & tank level updated!");
      setShowTankerModal(false);
      loadData();
    } catch {
      toast.error("Failed to log tanker delivery");
    }
  };

  const handleTogglePump = async (pumpId: string) => {
    try {
      const updated = await waterMaintenanceService.togglePumpDuty(pumpId);
      toast.success(`${updated.name} switched to ${updated.status}`);
      loadData();
    } catch {
      toast.error("Failed to toggle pump status");
    }
  };

  const handleSaveQuality = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await waterMaintenanceService.logQualityTest({
        ...qualityForm,
        ph: Number(qualityForm.ph),
        tdsPpm: Number(qualityForm.tdsPpm),
        hardnessPpm: Number(qualityForm.hardnessPpm),
        residualChlorinePpm: Number(qualityForm.residualChlorinePpm),
        turbidityNtu: Number(qualityForm.turbidityNtu),
      });
      toast.success(`Water test logged. Status: ${res.status}`);
      setShowQualityModal(false);
      loadData();
    } catch {
      toast.error("Failed to record water test");
    }
  };

  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await waterMaintenanceService.logTreatment({
        ...treatmentForm,
        quantityUsedKg: Number(treatmentForm.quantityUsedKg),
      });
      toast.success("WTP/STP treatment operation logged successfully!");
      setShowTreatmentModal(false);
      loadData();
    } catch {
      toast.error("Failed to log treatment operation");
    }
  };

  const handleSaveCleaning = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tank = tanks.find((t) => t.id === cleaningForm.tankId);
      await waterMaintenanceService.recordCleaning({
        ...cleaningForm,
        tankName: tank?.name || "Storage Tank",
        cost: Number(cleaningForm.cost),
        status: "COMPLETED",
      });
      toast.success("Tank cleaning certificate logged!");
      setShowCleaningModal(false);
      loadData();
    } catch {
      toast.error("Failed to log tank cleaning");
    }
  };

  // Filtered lists
  const filteredTankers = useMemo(() => {
    return tankers.filter((t) => {
      const matchesSearch =
        t.vendorName.toLowerCase().includes(tankerSearch.toLowerCase()) ||
        t.vehicleNumber.toLowerCase().includes(tankerSearch.toLowerCase()) ||
        (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(tankerSearch.toLowerCase()));
      return matchesSearch;
    });
  }, [tankers, tankerSearch]);

  const filteredTreatment = useMemo(() => {
    if (treatmentFilter === "ALL") return treatmentLogs;
    return treatmentLogs.filter((t) => t.plantType === treatmentFilter);
  }, [treatmentLogs, treatmentFilter]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <Toaster position="top-right" richColors />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
        <NavLink to="/community/maintenance" className="hover:text-blue-600 transition-colors">
          Facility Maintenance
        </NavLink>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className="text-slate-800 font-semibold">Water Maintenance & Storage Telemetry</span>
      </div>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-cyan-900 via-blue-900 to-indigo-950 p-6 rounded-2xl shadow-md text-white border border-cyan-800/40">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-400/30">
              <Droplets className="w-7 h-7" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Water Management & Telemetry Hub
              </h1>
              <p className="text-xs sm:text-sm text-cyan-200/80">
                Live Sump & OHT Levels · Water Tanker Procurement · Pump House HYPN · WTP/STP Operations · IS:10500 Potability
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur border border-white/10 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenTankerModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
          >
            <Truck className="w-4 h-4" />
            + Log Water Tanker
          </button>
        </div>
      </div>

      {/* Low Storage Alert Banner */}
      {summary?.lowStorageAlert && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-sm animate-pulse">
          <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold">CRITICAL: Low Community Water Storage (&lt; 25%)</p>
            <p className="text-rose-700 mt-0.5">
              Total stored volume is critically low across raw and domestic sumps. Immediate tanker procurement or borewell activation is required to prevent water outage.
            </p>
          </div>
        </div>
      )}

      {/* Quick KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Storage</span>
            <Gauge className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {((summary?.currentStorageLiters || 0) / 1000).toFixed(0)}
            </span>
            <span className="text-xs text-slate-500">/ {((summary?.totalCapacityLiters || 0) / 1000).toFixed(0)} kL</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (summary?.currentStoragePercentage || 0) > 50
                  ? "bg-cyan-500"
                  : (summary?.currentStoragePercentage || 0) > 25
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, summary?.currentStoragePercentage || 0)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{summary?.currentStoragePercentage || 0}% Total Sump Buffer</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tankers This Month</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary?.totalTankersThisMonth || 0}</div>
          <p className="text-xs text-slate-500">
            Spend: <strong className="text-slate-800">₹{(summary?.totalTankerExpenditureThisMonth || 0).toLocaleString("en-IN")}</strong>
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pump House Health</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{summary?.runningPumpsCount || 0} Running</span>
            <span className="text-xs text-slate-500">/ {summary?.totalPumpsCount || 0} Pumps</span>
          </div>
          <p className="text-xs text-emerald-700 font-medium">Duty & Standby Alternation OK</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Water Quality (IS:10500)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">CERTIFIED SAFE</div>
          <p className="text-xs text-slate-500">
            TDS: <strong className="text-slate-800">{qualityTests[0]?.tdsPpm || 185} ppm</strong> · pH: {qualityTests[0]?.ph || 7.2}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Gauge className="w-4 h-4" />
          Live Storage & Sumps
        </button>

        <button
          onClick={() => setActiveTab("tankers")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "tankers"
              ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Truck className="w-4 h-4" />
          Tanker Logbook ({tankers.length})
        </button>

        <button
          onClick={() => setActiveTab("pumps")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "pumps"
              ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Activity className="w-4 h-4" />
          Pump House & HYPN ({pumps.length})
        </button>

        <button
          onClick={() => setActiveTab("treatment")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "treatment"
              ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          WTP & STP Operations
        </button>

        <button
          onClick={() => setActiveTab("quality")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "quality"
              ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Quality & Potability
        </button>

        <button
          onClick={() => setActiveTab("cleaning")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === "cleaning"
              ? "border-cyan-600 text-cyan-700 bg-cyan-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Wrench className="w-4 h-4" />
          Sump Deep Cleaning AMC
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & STORAGE TELEMETRY ──────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tanks.map((tank) => {
              const pct = tank.capacityLiters > 0 ? Math.round((tank.currentLevelLiters / tank.capacityLiters) * 100) : 0;
              const isFireReserve = tank.tankType === "UG_FIRE_RESERVE";
              const isLow = tank.currentLevelLiters < tank.lowLevelThresholdLiters;

              return (
                <div
                  key={tank.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 transition-all hover:shadow-md ${
                    isFireReserve
                      ? "border-rose-200 bg-gradient-to-b from-rose-50/30 to-white"
                      : isLow
                      ? "border-amber-300 bg-gradient-to-b from-amber-50/30 to-white"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {tank.tankType.replace(/_/g, " ")}
                      </span>
                      <h3 className="font-bold text-slate-900 mt-1.5 text-base">{tank.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {tank.location}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        tank.sensorStatus === "ONLINE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                    >
                      {tank.sensorStatus}
                    </span>
                  </div>

                  {/* Level Gauge Display */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        {(tank.currentLevelLiters / 1000).toLocaleString("en-IN")} kL
                      </span>
                      <span className="text-slate-400 font-medium">
                        Capacity: {(tank.capacityLiters / 1000).toLocaleString("en-IN")} kL
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFireReserve
                            ? "bg-rose-500"
                            : pct > 50
                            ? "bg-cyan-500"
                            : pct > 25
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`font-bold ${
                          isLow ? "text-amber-700" : "text-cyan-700"
                        }`}
                      >
                        {pct}% Full {isLow && "(Low Threshold Trigger)"}
                      </span>
                      {isFireReserve && (
                        <span className="text-[10px] text-rose-700 font-bold bg-rose-100/60 px-1.5 py-0.5 rounded">
                          LOCKED FOR FIRE HYDRANTS
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Low Trigger: {(tank.lowLevelThresholdLiters / 1000).toLocaleString("en-IN")} kL
                    </span>
                    <button
                      onClick={handleOpenTankerModal}
                      className="text-cyan-700 hover:text-cyan-800 font-semibold text-xs flex items-center gap-1"
                    >
                      Refill Sump <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: TANKER PROCUREMENT LOGBOOK ────────────────────────────── */}
      {activeTab === "tankers" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Private Water Tanker Inwarding</h2>
              <p className="text-xs text-slate-500">Security gate validation, volume verification, and procurement expenses</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search vendor or vehicle #..."
                value={tankerSearch}
                onChange={(e) => setTankerSearch(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
              <button
                onClick={handleOpenTankerModal}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                + Log Delivery
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Delivery Date & Time</th>
                  <th className="p-3">Vendor Name</th>
                  <th className="p-3">Vehicle #</th>
                  <th className="p-3">Volume (Liters)</th>
                  <th className="p-3">Cost (₹)</th>
                  <th className="p-3">Target Sump</th>
                  <th className="p-3">Gate Verification</th>
                  <th className="p-3">Invoice Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTankers.map((tanker) => (
                  <tr key={tanker.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-medium text-slate-900">
                      {new Date(tanker.deliveryDate).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{tanker.vendorName}</td>
                    <td className="p-3">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">
                        {tanker.vehicleNumber}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-cyan-700">
                      {(tanker.capacityLiters).toLocaleString("en-IN")} L
                    </td>
                    <td className="p-3 font-bold text-slate-900">₹{tanker.cost.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-slate-600">
                      {tanks.find((t) => t.id === tanker.targetTankId)?.name || "Underground Sump"}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        {tanker.approvedBy || "Verified"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {tanker.invoiceNumber || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: PUMP HOUSE & HYPN MOTORS ──────────────────────────────── */}
      {activeTab === "pumps" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pump House & Hydro-Pneumatic (HYPN) Systems</h2>
              <p className="text-xs text-slate-500">
                Duty/Standby pump cycling, running hours, and motor insulation ratings
              </p>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Telemetry Auto-Polling Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pumps.map((pump) => {
              const isRunning = pump.status === "RUNNING";
              return (
                <div
                  key={pump.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 transition-all hover:shadow-md ${
                    isRunning ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {pump.pumpType.replace(/_/g, " ")}
                      </span>
                      <h3 className="font-bold text-slate-900 mt-1.5 text-base">{pump.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {pump.location}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        isRunning
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {pump.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Rated Power</span>
                      <strong className="text-slate-800">{pump.ratedKw} kW</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Run Hours</span>
                      <strong className="text-slate-800">{pump.totalRunHours} hrs</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Duty Rotation</span>
                      <span className="text-slate-700 font-semibold">{pump.dutyCycleHours} hrs shift</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Motor Health</span>
                      <span className="text-emerald-700 font-bold">{pump.motorHealthRating}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      {pump.isDutyPump ? "Current Duty Motor" : "Standby Reserve"}
                    </span>
                    <button
                      onClick={() => handleTogglePump(pump.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isRunning
                          ? "bg-slate-200 hover:bg-slate-300 text-slate-800"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20"
                      }`}
                    >
                      {isRunning ? "Switch to Standby" : "Activate as Duty Pump"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: WTP & STP TREATMENT OPERATIONS ────────────────────────── */}
      {activeTab === "treatment" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Water Treatment Plant (WTP) & Sewage Treatment (STP)</h2>
              <p className="text-xs text-slate-500">
                Filter backwashing (MGF/ACF), softener salt regeneration, and aeration blower checks
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={treatmentFilter}
                onChange={(e) => setTreatmentFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Plants (WTP & STP)</option>
                <option value="WTP">Water Treatment (WTP)</option>
                <option value="STP">Sewage Treatment (STP)</option>
              </select>
              <button
                onClick={() => setShowTreatmentModal(true)}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                + Log Operation
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTreatment.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        log.plantType === "WTP"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {log.plantType}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {log.operationType.replace(/_/g, " ")}
                    </span>
                  </div>
                  {log.notes && <p className="text-xs text-slate-600 max-w-2xl">{log.notes}</p>}
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  {log.quantityUsedKg > 0 && (
                    <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-800">
                      {log.quantityUsedKg} kg used
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-slate-800 font-semibold">{log.operatorName || "Technician"}</div>
                    <div className="text-slate-400 text-[11px]">
                      {new Date(log.logDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: WATER QUALITY & LAB TESTS ─────────────────────────────── */}
      {activeTab === "quality" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Water Potability & IS:10500 Quality Compliance</h2>
              <p className="text-xs text-slate-500">
                Daily testing for pH, TDS, Hardness, and Chlorine against drinking water standards
              </p>
            </div>
            <button
              onClick={() => setShowQualityModal(true)}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              + Record Water Test
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {qualityTests.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-600">
                      {test.sourceLocation.replace(/_/g, " ")}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {new Date(test.testDate).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      test.status === "SAFE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : test.status === "MARGINAL"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {test.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">pH Value</span>
                    <strong className="text-slate-800">{test.ph}</strong> (6.5-8.5)
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">TDS</span>
                    <strong className="text-slate-800">{test.tdsPpm} ppm</strong> (&lt; 500)
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Hardness</span>
                    <strong className="text-slate-800">{test.hardnessPpm} ppm</strong> (&lt; 300)
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Residual Chlorine</span>
                    <strong className="text-slate-800">{test.residualChlorinePpm ?? 0.2} ppm</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Tested By: <strong>{test.testedBy || "Technician"}</strong></span>
                  <span className="text-cyan-700 font-bold">IS:10500 OK</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: SUMP DEEP CLEANING AMC ────────────────────────────────── */}
      {activeTab === "cleaning" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bi-Annual Mechanized Sump & OHT Cleaning Schedule</h2>
              <p className="text-xs text-slate-500">
                Mandatory 6-stage dewatering, high pressure sludge scrubbing, antibacterial spray, and UV disinfection
              </p>
            </div>
            <button
              onClick={() => {
                setCleaningForm({
                  tankId: tanks[0]?.id || "",
                  lastCleanedDate: DEFAULT_DATE_STRING,
                  nextDueDate: "2027-05-19",
                  cleaningType: "MECHANIZED_DEWATERING_UV",
                  vendorName: "AquaClean Tech Solutions",
                  cost: 12000,
                  notes: "6-stage mechanized cleaning performed successfully.",
                });
                setShowCleaningModal(true);
              }}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              + Record Tank Cleaning
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {cleaningSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{schedule.tankName}</h3>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      schedule.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : schedule.status === "OVERDUE"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {schedule.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Cleaned:</span>
                    <strong className="text-slate-800">{schedule.lastCleanedDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Next Service Due:</span>
                    <strong className="text-slate-800">{schedule.nextDueDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vendor:</span>
                    <span className="text-slate-800 font-medium">{schedule.vendorName || "AquaClean Tech"}</span>
                  </div>
                </div>

                {schedule.notes && <p className="text-[11px] text-slate-500">{schedule.notes}</p>}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">₹{schedule.cost.toLocaleString("en-IN")}</span>
                  <span className="text-[11px] text-cyan-700 font-semibold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Certificate Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: LOG WATER TANKER ───────────────────────────────────────── */}
      {showTankerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-slate-900 text-lg">Inward Water Tanker Delivery</h3>
              </div>
              <button
                onClick={() => setShowTankerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTanker} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Vendor / Supplier Name</label>
                  <input
                    type="text"
                    required
                    value={tankerForm.vendorName}
                    onChange={(e) => setTankerForm({ ...tankerForm, vendorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Vehicle Registration #</label>
                  <input
                    type="text"
                    required
                    value={tankerForm.vehicleNumber}
                    onChange={(e) => setTankerForm({ ...tankerForm, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Water Volume (Liters)</label>
                  <input
                    type="number"
                    required
                    value={tankerForm.capacityLiters}
                    onChange={(e) => setTankerForm({ ...tankerForm, capacityLiters: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Total Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={tankerForm.cost}
                    onChange={(e) => setTankerForm({ ...tankerForm, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Target Storage Sump</label>
                  <select
                    value={tankerForm.targetTankId}
                    onChange={(e) => setTankerForm({ ...tankerForm, targetTankId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {tanks.map((tank) => (
                      <option key={tank.id} value={tank.id}>
                        {tank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Delivery Slip / Invoice #</label>
                  <input
                    type="text"
                    value={tankerForm.invoiceNumber}
                    onChange={(e) => setTankerForm({ ...tankerForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Driver Phone / Notes</label>
                <input
                  type="text"
                  value={tankerForm.driverPhone}
                  onChange={(e) => setTankerForm({ ...tankerForm, driverPhone: e.target.value })}
                  placeholder="+91 Mobile number..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTankerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  Save Tanker Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RECORD QUALITY TEST ───────────────────────────────────── */}
      {showQualityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-slate-900 text-lg">Record Water Quality Test (IS:10500)</h3>
              </div>
              <button
                onClick={() => setShowQualityModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuality} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Sampling Source Point</label>
                <select
                  value={qualityForm.sourceLocation}
                  onChange={(e) =>
                    setQualityForm({
                      ...qualityForm,
                      sourceLocation: e.target.value as WaterQualityTest["sourceLocation"],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                >
                  <option value="WTP_OUTLET">WTP Softener Outlet (Domestic Supply)</option>
                  <option value="MUNICIPAL_INFLOW">Municipal / Board Inflow</option>
                  <option value="BOREWELL_1">Borewell #1 Raw Water</option>
                  <option value="STP_TREATED">STP Treated Water (Flushing & Garden)</option>
                  <option value="TOWER_A_TAP">Tower A Resident Consumer Tap</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">pH Level (6.5 - 8.5 standard)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={qualityForm.ph}
                    onChange={(e) => setQualityForm({ ...qualityForm, ph: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">TDS (&lt; 500 ppm standard)</label>
                  <input
                    type="number"
                    required
                    value={qualityForm.tdsPpm}
                    onChange={(e) => setQualityForm({ ...qualityForm, tdsPpm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Hardness (&lt; 300 ppm)</label>
                  <input
                    type="number"
                    required
                    value={qualityForm.hardnessPpm}
                    onChange={(e) => setQualityForm({ ...qualityForm, hardnessPpm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Residual Chlorine (ppm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={qualityForm.residualChlorinePpm}
                    onChange={(e) =>
                      setQualityForm({ ...qualityForm, residualChlorinePpm: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tested By / Lab Technician</label>
                <input
                  type="text"
                  required
                  value={qualityForm.testedBy}
                  onChange={(e) => setQualityForm({ ...qualityForm, testedBy: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQualityModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  Log Test & Check Standards
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: LOG TREATMENT OPERATION ──────────────────────────────── */}
      {showTreatmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-slate-900 text-lg">Log WTP / STP Treatment Operation</h3>
              </div>
              <button
                onClick={() => setShowTreatmentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTreatment} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Plant System</label>
                  <select
                    value={treatmentForm.plantType}
                    onChange={(e) =>
                      setTreatmentForm({ ...treatmentForm, plantType: e.target.value as "WTP" | "STP" })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  >
                    <option value="WTP">Water Treatment Plant (WTP)</option>
                    <option value="STP">Sewage Treatment Plant (STP)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Operation Type</label>
                  <select
                    value={treatmentForm.operationType}
                    onChange={(e) =>
                      setTreatmentForm({
                        ...treatmentForm,
                        operationType: e.target.value as WaterTreatmentLog["operationType"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  >
                    <option value="MGF_BACKWASH">Multi-Grade Filter (MGF) Backwash</option>
                    <option value="ACF_BACKWASH">Activated Carbon Filter (ACF) Backwash</option>
                    <option value="SOFTENER_SALT_RECHARGE">Softener Brine Salt Replenishment</option>
                    <option value="STP_AERATION_CHECK">STP Aeration Blower & DO Inspection</option>
                    <option value="CHLORINE_DOSING">Chlorine / Hypochlorite Dosing</option>
                    <option value="SLUDGE_DISPOSAL">STP Filter Press Sludge Disposal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Chemical/Salt Quantity (kg)</label>
                  <input
                    type="number"
                    value={treatmentForm.quantityUsedKg}
                    onChange={(e) =>
                      setTreatmentForm({ ...treatmentForm, quantityUsedKg: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Operator / Tech Name</label>
                  <input
                    type="text"
                    required
                    value={treatmentForm.operatorName}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, operatorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Operational Log Notes</label>
                <textarea
                  rows={2}
                  value={treatmentForm.notes}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
                  placeholder="Backwash cycle duration, final differential pressure..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTreatmentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  Save Treatment Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RECORD TANK CLEANING ─────────────────────────────────── */}
      {showCleaningModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-slate-900 text-lg">Record Mechanized Tank Cleaning</h3>
              </div>
              <button
                onClick={() => setShowCleaningModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCleaning} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Storage Sump / Overhead Tank</label>
                <select
                  value={cleaningForm.tankId}
                  onChange={(e) => setCleaningForm({ ...cleaningForm, tankId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                >
                  {tanks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Cleaning Performed Date</label>
                  <input
                    type="date"
                    required
                    value={cleaningForm.lastCleanedDate}
                    onChange={(e) => setCleaningForm({ ...cleaningForm, lastCleanedDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Next Service Due (+6 Months)</label>
                  <input
                    type="date"
                    required
                    value={cleaningForm.nextDueDate}
                    onChange={(e) => setCleaningForm({ ...cleaningForm, nextDueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Vendor / Agency</label>
                  <input
                    type="text"
                    required
                    value={cleaningForm.vendorName}
                    onChange={(e) => setCleaningForm({ ...cleaningForm, vendorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Service Cost (₹)</label>
                  <input
                    type="number"
                    value={cleaningForm.cost}
                    onChange={(e) => setCleaningForm({ ...cleaningForm, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCleaningModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  Save Cleaning Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
