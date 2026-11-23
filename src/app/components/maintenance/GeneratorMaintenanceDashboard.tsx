import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Flame,
  Activity,
  Wrench,
  Clock,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Plus,
  X,
  ChevronRight,
  Gauge,
  Battery,
  Droplets,
  Phone,
  Building2,
  RefreshCw,
  Check,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { NavLink } from "react-router";
import {
  generatorMaintenanceService,
  type GeneratorAsset,
  type GeneratorRunLog,
  type GeneratorServiceRecord,
  type GeneratorAmcContract,
  type GeneratorFuelRefill,
  type ServiceAlertInfo,
} from "../../../services/maintenance/generatorMaintenanceService";
import {
  automationService,
  type GeneratorFuelAnomalyResponse,
} from "../../../services/automation/automationService";

type ActiveTab = "overview" | "runlogs" | "service" | "fuel" | "amc";

const DEFAULT_START_TIME = "2026-05-20T10:00";
const DEFAULT_END_TIME = "2026-05-20T12:00";
const DEFAULT_DATE = "2026-05-20";

export function GeneratorMaintenanceDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [generators, setGenerators] = useState<GeneratorAsset[]>([]);
  const [selectedGenId, setSelectedGenId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Data states
  const [runLogs, setRunLogs] = useState<GeneratorRunLog[]>([]);
  const [serviceRecords, setServiceRecords] = useState<GeneratorServiceRecord[]>([]);
  const [amcContracts, setAmcContracts] = useState<GeneratorAmcContract[]>([]);
  const [fuelRefills, setFuelRefills] = useState<GeneratorFuelRefill[]>([]);
  const [serviceAlerts, setServiceAlerts] = useState<ServiceAlertInfo[]>([]);

  // Modals
  const [showRunModal, setShowRunModal] = useState<boolean>(false);
  const [showRefillModal, setShowRefillModal] = useState<boolean>(false);
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);

  // AI Generator Fuel Anomaly & B-Check State
  const [isAuditingFuel, setIsAuditingFuel] = useState<boolean>(false);
  const [fuelAuditResult, setFuelAuditResult] = useState<GeneratorFuelAnomalyResponse | null>(null);
  const [showFuelAuditModal, setShowFuelAuditModal] = useState<boolean>(false);

  const handleAuditFuel = async () => {
    setIsAuditingFuel(true);
    try {
      const res = await automationService.auditGeneratorFuelAnomaly({
        generatorId: currentGen?.id || 'DG-500KVA-01',
        generatorName: currentGen?.name || 'Main DG 1 (Cummins 500kVA)',
        fuelCapacityLiters: (currentGen as any)?.fuelCapacityLiters || currentGen?.fuelTankCapacityLiters || 1000,
        currentFuelLevelLiters: currentGen?.currentFuelLiters || 680,
        previousFuelLevelLiters: 740,
        runHoursSinceLastRefill: 2.4,
        totalRunHours: currentGen?.totalRunHours || 218,
        lastServiceHours: currentGen?.lastServiceHours || 0,
        loadPercentage: 72,
      });
      setFuelAuditResult(res);
      setShowFuelAuditModal(true);
    } catch (err) {
      console.error('DG fuel audit failed:', err);
      toast.error('Could not complete DG fuel audit.');
    } finally {
      setIsAuditingFuel(false);
    }
  };

  // Forms
  const [runForm, setRunForm] = useState({
    startTime: DEFAULT_START_TIME,
    endTime: DEFAULT_END_TIME,
    startFuelLiters: 650,
    endFuelLiters: 610,
    unitsGeneratedKwh: 140,
    reason: "GRID_OUTAGE" as GeneratorRunLog["reason"],
    operatorName: "Sunil Kumar (Estate Engineer)",
    notes: "",
  });

  const [refillForm, setRefillForm] = useState({
    refillDate: DEFAULT_DATE,
    quantityLiters: 300,
    pricePerLiter: 89.5,
    supplierName: "Indian Oil Corp - Sri Balaji Petroleum",
    billNumber: "IOC-BLR-89210",
    enteredBy: "Sunil Kumar (Estate Engineer)",
  });

  const [serviceForm, setServiceForm] = useState({
    serviceType: "B_CHECK_250H" as GeneratorServiceRecord["serviceType"],
    serviceDate: DEFAULT_DATE,
    runHoursAtService: 0,
    vendorName: "Cummins India Authorized - Powertech Services",
    technicianName: "K. Mohan Rao",
    cost: 32000,
    partsReplacedText: "Lube Oil Valvoline 15W-40 (45L), Fuel Filter, Oil Filter",
    notes: "250h periodic maintenance and oil filter overhaul",
    status: "COMPLETED" as GeneratorServiceRecord["status"],
  });

  // Daily A-Check local checklist state
  const [aCheckItems, setACheckItems] = useState([
    { id: 1, label: "Engine Lube Oil Level (Dipstick check)", done: true },
    { id: 2, label: "Coolant Level in Radiator & Expansion Tank", done: true },
    { id: 3, label: "Battery Terminals, Specific Gravity & Voltage (>12.4V)", done: true },
    { id: 4, label: "V-Belt Tension & Visual Condition", done: true },
    { id: 5, label: "Fuel Sedimenter / Water Trap Drain", done: false },
    { id: 6, label: "Exhaust Piping & Silencer Clear of Obstructions", done: true },
    { id: 7, label: "AMF (Auto Mains Failure) Panel in AUTO Mode", done: true },
  ]);

  const loadData = useCallback(async () => {
    try {
      const gens = await generatorMaintenanceService.getGenerators();
      setGenerators(gens);
      const activeId = selectedGenId || (gens[0]?.id ?? "");
      if (!selectedGenId && gens[0]?.id) {
        setSelectedGenId(gens[0].id);
      }

      const [logs, services, amcs, refills, alerts] = await Promise.all([
        generatorMaintenanceService.getRunLogs(activeId),
        generatorMaintenanceService.getServiceRecords(activeId),
        generatorMaintenanceService.getAmcContracts(activeId),
        generatorMaintenanceService.getFuelRefills(activeId),
        generatorMaintenanceService.checkServiceAlerts(activeId),
      ]);

      setRunLogs(logs);
      setServiceRecords(services);
      setAmcContracts(amcs);
      setFuelRefills(refills);
      setServiceAlerts(alerts);
    } catch (err) {
      console.error("Failed to load generator data", err);
      toast.error("Could not load generator maintenance data.");
    } finally {
      setLoading(false);
    }
  }, [selectedGenId]);

  useEffect(() => {
    let isMounted = true;
    generatorMaintenanceService.getGenerators().then(async (gens) => {
      if (!isMounted) return;
      setGenerators(gens);
      const activeId = selectedGenId || (gens[0]?.id ?? "");
      if (!selectedGenId && gens[0]?.id) {
        setSelectedGenId(gens[0].id);
      }

      const [logs, services, amcs, refills, alerts] = await Promise.all([
        generatorMaintenanceService.getRunLogs(activeId),
        generatorMaintenanceService.getServiceRecords(activeId),
        generatorMaintenanceService.getAmcContracts(activeId),
        generatorMaintenanceService.getFuelRefills(activeId),
        generatorMaintenanceService.checkServiceAlerts(activeId),
      ]);

      if (!isMounted) return;
      setRunLogs(logs);
      setServiceRecords(services);
      setAmcContracts(amcs);
      setFuelRefills(refills);
      setServiceAlerts(alerts);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedGenId]);

  const currentGen = useMemo(() => {
    return generators.find((g) => g.id === selectedGenId) || generators[0];
  }, [generators, selectedGenId]);

  const currentAlert = useMemo(() => {
    return serviceAlerts.find((a) => a.generatorId === currentGen?.id);
  }, [serviceAlerts, currentGen]);

  const handleOpenRunModal = () => {
    if (currentGen) {
      setRunForm({
        startTime: DEFAULT_START_TIME,
        endTime: DEFAULT_END_TIME,
        startFuelLiters: currentGen.currentFuelLiters,
        endFuelLiters: Math.max(0, currentGen.currentFuelLiters - 40),
        unitsGeneratedKwh: 140,
        reason: "GRID_OUTAGE",
        operatorName: "Sunil Kumar (Estate Engineer)",
        notes: "",
      });
    }
    setShowRunModal(true);
  };

  const handleOpenRefillModal = () => {
    setRefillForm({
      refillDate: DEFAULT_DATE,
      quantityLiters: 300,
      pricePerLiter: 89.5,
      supplierName: "Indian Oil Corp - Sri Balaji Petroleum",
      billNumber: "IOC-BLR-89210",
      enteredBy: "Sunil Kumar (Estate Engineer)",
    });
    setShowRefillModal(true);
  };

  const handleOpenServiceModal = () => {
    if (currentGen) {
      setServiceForm({
        serviceType: "B_CHECK_250H",
        serviceDate: DEFAULT_DATE,
        runHoursAtService: currentGen.totalRunHours,
        vendorName: currentGen.amcVendor,
        technicianName: "K. Mohan Rao",
        cost: 32000,
        partsReplacedText: "Lube Oil Valvoline 15W-40 (45L), Fuel Filter, Oil Filter",
        notes: "250h periodic maintenance and oil filter overhaul",
        status: "COMPLETED",
      });
    }
    setShowServiceModal(true);
  };

  // Calculations
  const fuelPercent = currentGen
    ? Math.round((currentGen.currentFuelLiters / currentGen.fuelTankCapacityLiters) * 100)
    : 0;

  const hoursSinceService = currentGen
    ? Number((currentGen.totalRunHours - currentGen.lastServiceHours).toFixed(1))
    : 0;

  const hoursToNextService = currentGen
    ? Math.max(0, Number((currentGen.serviceIntervalHours - hoursSinceService).toFixed(1)))
    : 0;

  const serviceProgressBarWidth = currentGen
    ? Math.min(100, Math.round((hoursSinceService / currentGen.serviceIntervalHours) * 100))
    : 0;

  // Handlers
  const handleLogRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGen) return;

    if (runForm.endFuelLiters > runForm.startFuelLiters) {
      toast.error("End fuel level cannot exceed start fuel level during run.");
      return;
    }

    try {
      await generatorMaintenanceService.logRun({
        generatorId: currentGen.id,
        startTime: runForm.startTime,
        endTime: runForm.endTime,
        startFuelLiters: Number(runForm.startFuelLiters),
        endFuelLiters: Number(runForm.endFuelLiters),
        unitsGeneratedKwh: Number(runForm.unitsGeneratedKwh),
        reason: runForm.reason,
        operatorName: runForm.operatorName,
        notes: runForm.notes,
      });

      toast.success("Generator run logged successfully! Run hours and fuel updated.");
      setShowRunModal(false);
      loadData();
    } catch {
      toast.error("Failed to log generator run.");
    }
  };

  const handleLogRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGen) return;

    try {
      await generatorMaintenanceService.logFuelRefill({
        generatorId: currentGen.id,
        refillDate: refillForm.refillDate,
        quantityLiters: Number(refillForm.quantityLiters),
        pricePerLiter: Number(refillForm.pricePerLiter),
        supplierName: refillForm.supplierName,
        billNumber: refillForm.billNumber,
        enteredBy: refillForm.enteredBy,
      });

      toast.success(`Logged ${refillForm.quantityLiters}L diesel refill! Fuel level updated.`);
      setShowRefillModal(false);
      loadData();
    } catch {
      toast.error("Failed to record fuel refill.");
    }
  };

  const handleRecordService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGen) return;

    try {
      const parts = serviceForm.partsReplacedText
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      await generatorMaintenanceService.recordService({
        generatorId: currentGen.id,
        serviceType: serviceForm.serviceType,
        serviceDate: serviceForm.serviceDate,
        runHoursAtService: Number(serviceForm.runHoursAtService),
        vendorName: serviceForm.vendorName,
        technicianName: serviceForm.technicianName,
        cost: Number(serviceForm.cost),
        partsReplaced: parts,
        notes: serviceForm.notes,
        status: serviceForm.status,
      });

      toast.success("Service record saved successfully! 250h countdown reset.");
      setShowServiceModal(false);
      loadData();
    } catch {
      toast.error("Failed to save service record.");
    }
  };

  const handleToggleACheck = (id: number) => {
    setACheckItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleCreateHelpdeskTicket = () => {
    toast.success("Helpdesk Ticket Generated: HD-DG-SERVICE (Assigned to Electrical Department)");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-500 font-medium">Loading Generator Maintenance telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <Toaster position="top-right" richColors />

      {/* Breadcrumb & Navigation Link */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <NavLink to="/community/maintenance" className="hover:text-blue-600 font-medium">
            Facility Maintenance
          </NavLink>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Diesel Generator Management</span>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            to="/iot/meters"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
          >
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            IoT Modbus Telemetry
          </NavLink>
          <NavLink
            to="/maintenance/schedules"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Recurring Schedules
          </NavLink>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-sm">
              <Flame className="w-7 h-7" />
            </span>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">Diesel Generator Operations & Maintenance</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  AMF Panel: AUTO
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">
                Real-time run hours, fuel stock, 250h B-check triggers, digital log sheets, and vendor AMC contracts.
              </p>
            </div>
          </div>
        </div>

        {/* Generator Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-medium px-2">Unit:</span>
            {generators.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenId(g.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedGenId === g.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleOpenRunModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Log Run
          </button>
          <button
            onClick={handleOpenRefillModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Droplets className="w-4 h-4" /> Add Fuel
          </button>
          <button
            onClick={handleAuditFuel}
            disabled={isAuditingFuel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isAuditingFuel ? "Auditing DG..." : "AI Fuel & B-Check"}
          </button>
          <button
            onClick={handleOpenServiceModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Wrench className="w-4 h-4" /> Record Service
          </button>
        </div>
      </div>

      {/* Critical Alert Banner if 250h service is overdue or upcoming */}
      {currentAlert && currentAlert.alertSeverity !== "NORMAL" && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
            currentAlert.isOverdue
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                currentAlert.isOverdue ? "text-rose-600" : "text-amber-600"
              }`}
            />
            <div>
              <h4 className="font-bold text-sm">
                {currentAlert.isOverdue
                  ? `OVERDUE: 250-Hour B-Check Service Required for ${currentAlert.generatorName}`
                  : `UPCOMING: 250-Hour B-Check Service Due Soon for ${currentAlert.generatorName}`}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                Current run hours since last service: <strong>{currentAlert.hoursSinceLastService} hrs</strong> /{" "}
                {currentAlert.intervalHours} hrs limit (
                {currentAlert.isOverdue
                  ? `${Math.abs(currentAlert.hoursRemainingOrOverdue)} hrs overdue`
                  : `${currentAlert.hoursRemainingOrOverdue} hrs remaining`}
                ). Overdue engine lube oil and filter replacement will void warranty.
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateHelpdeskTicket}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shrink-0 transition shadow-sm"
          >
            Create Helpdesk Ticket
          </button>
        </div>
      )}

      {/* Live Telemetry & KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Operational Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" /> Engine Status
            </span>
            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
              {currentGen?.meterSerialNumber || "DG-01"}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span
              className={`text-xl font-bold tracking-tight ${
                currentGen?.status === "RUNNING"
                  ? "text-rose-600 animate-pulse"
                  : currentGen?.status === "STANDBY"
                  ? "text-emerald-600"
                  : "text-amber-600"
              }`}
            >
              {currentGen?.status}
            </span>
            <span className="text-xs text-slate-500 font-medium">AMF Grid Standby</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Make: {currentGen?.makeModel}</span>
            <span className="font-semibold text-slate-700">{currentGen?.capacityKva} kVA</span>
          </div>
        </div>

        {/* Card 2: Fuel Level Gauge */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-500" /> Diesel Fuel Tank
            </span>
            <span
              className={`font-semibold ${
                fuelPercent < 25 ? "text-rose-600" : fuelPercent < 50 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {fuelPercent}%
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {currentGen?.currentFuelLiters} <span className="text-sm font-normal text-slate-500">Liters</span>
            </span>
            <span className="text-xs text-slate-400">/ {currentGen?.fuelTankCapacityLiters}L</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                fuelPercent < 25 ? "bg-rose-500" : fuelPercent < 50 ? "bg-amber-500" : "bg-blue-600"
              }`}
              style={{ width: `${fuelPercent}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Estimated Backup:</span>
            <strong className="text-slate-700 font-mono">
              ~{Math.round((currentGen?.currentFuelLiters || 0) / 20)} Hours Run
            </strong>
          </div>
        </div>

        {/* Card 3: Total Run Hours & 250h Countdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-purple-500" /> Total Run Hours
            </span>
            <span className="font-mono text-[10px] text-slate-400">Hour Meter</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {currentGen?.totalRunHours}{" "}
              <span className="text-sm font-normal font-sans text-slate-500">hrs</span>
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                hoursSinceService >= 250
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {hoursSinceService >= 250 ? "B-Check Due!" : `${hoursToNextService}h to B-Check`}
            </span>
          </div>
          {/* Progress towards 250h */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                serviceProgressBarWidth >= 100
                  ? "bg-rose-600"
                  : serviceProgressBarWidth > 80
                  ? "bg-amber-500"
                  : "bg-purple-600"
              }`}
              style={{ width: `${serviceProgressBarWidth}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Last Service at:</span>
            <span className="font-semibold text-slate-700 font-mono">{currentGen?.lastServiceHours} hrs</span>
          </div>
        </div>

        {/* Card 4: Battery & Sensor Telemetry */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-emerald-500" /> Cranking Battery & Health
            </span>
            <span className="text-xs font-semibold text-emerald-600">Optimal</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {currentGen?.batteryVoltage}{" "}
              <span className="text-sm font-normal font-sans text-slate-500">V DC</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">24V Dual Bank</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
            <div>
              <span className="text-slate-400 block">Coolant Temp:</span>
              <strong className="text-slate-700">{currentGen?.coolantTempCelsius}°C</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Oil Pressure:</span>
              <strong className="text-slate-700">{currentGen?.oilPressureBar} bar</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 pt-2 gap-1 overflow-x-auto">
        {[
          { key: "overview", label: "Overview & Diagnostics", icon: Activity },
          { key: "runlogs", label: "Digital Run Sheets", icon: FileText, count: runLogs.length },
          { key: "service", label: "Service History & 250h B-Check", icon: Wrench, count: serviceRecords.length },
          { key: "fuel", label: "Fuel Stock & Refills", icon: Droplets, count: fuelRefills.length },
          { key: "amc", label: "Vendor AMC & Warranty", icon: ShieldCheck, count: amcContracts.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ActiveTab)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold rounded-t-lg transition border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Diagnostics */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Recent Activity & Asset Specification */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generator Technical Profile */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Asset Technical Specifications
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Make & Engine Model</span>
                  <span className="font-semibold text-slate-800">{currentGen?.makeModel}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Serial Number</span>
                  <span className="font-mono font-semibold text-slate-800">{currentGen?.serialNumber}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Rated Power</span>
                  <span className="font-semibold text-slate-800">{currentGen?.capacityKva} kVA / 415V 3-Phase</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Location & Room</span>
                  <span className="font-semibold text-slate-800">{currentGen?.location}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">B-Check Service Frequency</span>
                  <span className="font-semibold text-slate-800">Every 250 Operating Hours</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Authorized AMC Vendor</span>
                  <span className="font-semibold text-slate-800 truncate block">{currentGen?.amcVendor}</span>
                </div>
              </div>
            </div>

            {/* Recent Generator Runs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Recent Outage & Test Runs
                </h3>
                <button
                  onClick={() => setActiveTab("runlogs")}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  View All Runs <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {runLogs.slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {new Date(log.startTime).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            log.reason === "GRID_OUTAGE"
                              ? "bg-rose-100 text-rose-700"
                              : log.reason === "SCHEDULED_TEST_RUN"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {log.reason.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">{log.notes || "No notes entered."}</p>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Duration</span>
                        <strong className="text-slate-800 font-mono">{log.durationHours} hrs</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Fuel Consumed</span>
                        <strong className="text-rose-600 font-mono">{log.dieselConsumedLiters} L</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Units Generated</span>
                        <strong className="text-emerald-600 font-mono">{log.unitsGeneratedKwh} kWh</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Daily A-Check Checklist */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Daily / Weekly A-Check
                  </h3>
                  <p className="text-[11px] text-slate-500">Routine physical inspection SOP</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {aCheckItems.filter((i) => i.done).length} / {aCheckItems.length} Checked
                </span>
              </div>

              <div className="space-y-2">
                {aCheckItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleToggleACheck(item.id)}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-start gap-2.5 text-xs transition ${
                      item.done
                        ? "bg-emerald-50/40 border-emerald-200 text-slate-700"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                        item.done ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white"
                      }`}
                    >
                      {item.done && <Check className="w-3 h-3" />}
                    </div>
                    <span className={item.done ? "font-medium text-slate-800" : ""}>{item.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => toast.success("A-Check Inspection signed and logged by Duty Engineer.")}
                className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition"
              >
                Sign Off Today's A-Check
              </button>
            </div>

            {/* Quick Vendor Contact Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Emergency Support
                </span>
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded text-[10px] font-bold">
                  24/7 Breakdown SLA
                </span>
              </div>
              <h4 className="font-bold text-sm">{currentGen?.amcVendor}</h4>
              <p className="text-xs text-slate-300">
                For major engine fault, radiator rupture, or governor failure, initiate immediate vendor dispatch.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <a
                  href="tel:+918041239900"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  <Phone className="w-3.5 h-3.5" /> Call AMC Helpline
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Digital Run Log Sheet */}
      {activeTab === "runlogs" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Digital Generator Run Logbook
              </h3>
              <p className="text-slate-500 text-xs">
                Log start/stop timestamps, diesel consumed, kWh units generated, and fuel efficiency.
              </p>
            </div>
            <button
              onClick={handleOpenRunModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl self-start"
            >
              <Plus className="w-4 h-4" /> New Run Entry
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Fuel Levels (Start → End)</th>
                  <th className="py-2.5 px-3">Diesel Burned</th>
                  <th className="py-2.5 px-3">kWh Generated</th>
                  <th className="py-2.5 px-3">Efficiency</th>
                  <th className="py-2.5 px-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {new Date(log.startTime).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}{" "}
                        →{" "}
                        {new Date(log.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.reason === "GRID_OUTAGE"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : log.reason === "SCHEDULED_TEST_RUN"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {log.reason.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold font-mono text-slate-800">{log.durationHours} hrs</td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {log.startFuelLiters}L → {log.endFuelLiters}L
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-600 font-mono">
                      {log.dieselConsumedLiters} Liters
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-600 font-mono">
                      {log.unitsGeneratedKwh} kWh
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      <span className="font-semibold">{log.fuelEfficiencyKwhPerLiter}</span>{" "}
                      <span className="text-[10px] text-slate-400">kWh/L</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{log.operatorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Service History & 250h B-Check */}
      {activeTab === "service" && (
        <div className="space-y-6">
          {/* Service Interval Progress Tracker */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-600" />
                  B-Check (250 Operating Hours) Maintenance Schedule
                </h3>
                <p className="text-xs text-indigo-800/80">
                  Every 250 running hours requires complete lube oil drain, oil filter replacement, fuel filter renewal, and valve lash check.
                </p>
              </div>
              <button
                onClick={handleOpenServiceModal}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
              >
                + Record Completed Service
              </button>
            </div>

            <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">
                  Hours since last service: <strong>{hoursSinceService} hrs</strong>
                </span>
                <span className="font-semibold text-indigo-600">
                  Threshold: <strong>{currentGen?.serviceIntervalHours} hrs</strong>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    hoursSinceService >= 250 ? "bg-rose-600" : "bg-indigo-600"
                  }`}
                  style={{ width: `${serviceProgressBarWidth}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Last B-Check: {currentGen?.lastServiceHours} hrs</span>
                <span className="font-semibold text-slate-800">
                  {hoursSinceService >= 250 ? (
                    <span className="text-rose-600 font-bold">Overdue by {hoursSinceService - 250} hrs!</span>
                  ) : (
                    <span>Next Due at: {(currentGen?.lastServiceHours || 0) + 250} hrs</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Maintenance Records Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-600" />
              Service & Preventive Maintenance History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Service Type</th>
                    <th className="py-2.5 px-3">Hour Meter</th>
                    <th className="py-2.5 px-3">Vendor / Tech</th>
                    <th className="py-2.5 px-3">Parts Replaced</th>
                    <th className="py-2.5 px-3">Cost (₹)</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serviceRecords.map((srv) => (
                    <tr key={srv.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-semibold text-slate-800">{srv.serviceDate}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            srv.serviceType === "B_CHECK_250H"
                              ? "bg-purple-100 text-purple-700"
                              : srv.serviceType === "A_CHECK_ROUTINE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {srv.serviceType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                        {srv.runHoursAtService} hrs
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{srv.vendorName}</div>
                        <div className="text-[10px] text-slate-400">{srv.technicianName}</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {srv.partsReplaced.map((part, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                              {part}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 font-mono">
                        ₹{srv.cost.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                          {srv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Fuel Stock & Refills */}
      {activeTab === "fuel" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-slate-400 text-xs">Total Fuel Purchased</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {fuelRefills.reduce((acc, r) => acc + r.quantityLiters, 0)} <span className="text-sm font-normal text-slate-500">Liters</span>
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-slate-400 text-xs">Total Diesel Expense</span>
              <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                ₹{fuelRefills.reduce((acc, r) => acc + r.totalCost, 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <span className="text-slate-400 text-xs">Average Price / Liter</span>
              <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                ₹89.50 <span className="text-sm font-normal text-slate-500">/ L</span>
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-600" />
                Diesel Refill & Procurement Invoices
              </h3>
              <button
                onClick={handleOpenRefillModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
              >
                <Plus className="w-4 h-4" /> Add Refill
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Rate / Liter</th>
                    <th className="py-2.5 px-3">Total Cost</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Invoice Number</th>
                    <th className="py-2.5 px-3">Entered By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fuelRefills.map((refill) => (
                    <tr key={refill.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-semibold text-slate-800">{refill.refillDate}</td>
                      <td className="py-3 px-3 font-bold text-blue-600 font-mono">
                        +{refill.quantityLiters} Liters
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">₹{refill.pricePerLiter.toFixed(2)}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 font-mono">
                        ₹{refill.totalCost.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-slate-800">{refill.supplierName}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{refill.billNumber}</td>
                      <td className="py-3 px-3 text-slate-500">{refill.enteredBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Vendor AMC & Warranty */}
      {activeTab === "amc" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {amcContracts.map((amc) => (
              <div
                key={amc.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-blue-200 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{amc.contractNumber}</span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">{amc.vendorName}</h4>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      amc.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {amc.status.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Annual AMC Dues</span>
                    <strong className="text-slate-800 font-mono">₹{amc.annualCost.toLocaleString("en-IN")} / yr</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Emergency SLA</span>
                    <strong className="text-emerald-600 font-mono">{amc.slaHours} Hours Onsite</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Validity Period</span>
                    <span className="text-slate-700">{amc.startDate} to {amc.endDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Quarterly Visits</span>
                    <strong className="text-blue-600">{amc.visitsCompleted} of {amc.visitsIncluded} Completed</strong>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Helpline Contacts</span>
                      <span className="font-semibold text-slate-800">{amc.emergencyHelpline}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Modal 1: Log Generator Run */}
      {showRunModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-600" /> Log Generator Run
              </h3>
              <button onClick={() => setShowRunModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleLogRun} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={runForm.startTime}
                    onChange={(e) => setRunForm({ ...runForm, startTime: e.target.value })}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    value={runForm.endTime}
                    onChange={(e) => setRunForm({ ...runForm, endTime: e.target.value })}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Initial Fuel (Liters) *</label>
                  <input
                    type="number"
                    value={runForm.startFuelLiters}
                    onChange={(e) => setRunForm({ ...runForm, startFuelLiters: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Ending Fuel (Liters) *</label>
                  <input
                    type="number"
                    value={runForm.endFuelLiters}
                    onChange={(e) => setRunForm({ ...runForm, endFuelLiters: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">kWh Units Generated *</label>
                  <input
                    type="number"
                    value={runForm.unitsGeneratedKwh}
                    onChange={(e) => setRunForm({ ...runForm, unitsGeneratedKwh: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Run Trigger Reason</label>
                  <select
                    value={runForm.reason}
                    onChange={(e) => setRunForm({ ...runForm, reason: e.target.value as GeneratorRunLog["reason"] })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="GRID_OUTAGE">BESCOM Grid Outage</option>
                    <option value="SCHEDULED_TEST_RUN">Weekly Routine Test Run</option>
                    <option value="MAINTENANCE_RUN">Post-Service Test Run</option>
                    <option value="PEAK_SHAVING">Peak Shaving</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Operator Name</label>
                <input
                  type="text"
                  value={runForm.operatorName}
                  onChange={(e) => setRunForm({ ...runForm, operatorName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Observations / Notes</label>
                <textarea
                  rows={2}
                  value={runForm.notes}
                  onChange={(e) => setRunForm({ ...runForm, notes: e.target.value })}
                  placeholder="e.g. Phase 2 tripped, smooth AMF auto start"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRunModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                >
                  Save Run Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Fuel Refill */}
      {showRefillModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Droplets className="w-5 h-5 text-emerald-600" /> Log Diesel Fuel Refill
              </h3>
              <button onClick={() => setShowRefillModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleLogRefill} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Refill Date *</label>
                  <input
                    type="date"
                    value={refillForm.refillDate}
                    onChange={(e) => setRefillForm({ ...refillForm, refillDate: e.target.value })}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Quantity (Liters) *</label>
                  <input
                    type="number"
                    value={refillForm.quantityLiters}
                    onChange={(e) => setRefillForm({ ...refillForm, quantityLiters: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Price per Liter (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={refillForm.pricePerLiter}
                    onChange={(e) => setRefillForm({ ...refillForm, pricePerLiter: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Total Amount (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${(refillForm.quantityLiters * refillForm.pricePerLiter).toLocaleString("en-IN")}`}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Supplier / Petrol Pump</label>
                <input
                  type="text"
                  value={refillForm.supplierName}
                  onChange={(e) => setRefillForm({ ...refillForm, supplierName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Invoice / Bill Number</label>
                  <input
                    type="text"
                    value={refillForm.billNumber}
                    onChange={(e) => setRefillForm({ ...refillForm, billNumber: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Entered By</label>
                  <input
                    type="text"
                    value={refillForm.enteredBy}
                    onChange={(e) => setRefillForm({ ...refillForm, enteredBy: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRefillModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
                >
                  Save Refill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Record Service / Maintenance */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600" /> Record Generator Servicing
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleRecordService} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Service Type *</label>
                  <select
                    value={serviceForm.serviceType}
                    onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value as GeneratorServiceRecord["serviceType"] })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="B_CHECK_250H">B-Check (250 Hour Service)</option>
                    <option value="A_CHECK_ROUTINE">A-Check Routine Inspection</option>
                    <option value="C_CHECK_MAJOR">C-Check Major Overhaul</option>
                    <option value="BATTERY_REPLACEMENT">Battery Replacement</option>
                    <option value="EMERGENCY_REPAIR">Emergency Breakdown Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Service Date *</label>
                  <input
                    type="date"
                    value={serviceForm.serviceDate}
                    onChange={(e) => setServiceForm({ ...serviceForm, serviceDate: e.target.value })}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Hour Meter Reading *</label>
                  <input
                    type="number"
                    value={serviceForm.runHoursAtService}
                    onChange={(e) => setServiceForm({ ...serviceForm, runHoursAtService: Number(e.target.value) })}
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Total Cost (₹)</label>
                  <input
                    type="number"
                    value={serviceForm.cost}
                    onChange={(e) => setServiceForm({ ...serviceForm, cost: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Vendor Name</label>
                  <input
                    type="text"
                    value={serviceForm.vendorName}
                    onChange={(e) => setServiceForm({ ...serviceForm, vendorName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Technician Name</label>
                  <input
                    type="text"
                    value={serviceForm.technicianName}
                    onChange={(e) => setServiceForm({ ...serviceForm, technicianName: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Parts Replaced (comma separated)</label>
                <input
                  type="text"
                  value={serviceForm.partsReplacedText}
                  onChange={(e) => setServiceForm({ ...serviceForm, partsReplacedText: e.target.value })}
                  placeholder="e.g. Lube Oil 15W-40, Fleetguard Oil Filter, Fuel Filter Cartridge"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Engineer Notes / Findings</label>
                <textarea
                  rows={2}
                  value={serviceForm.notes}
                  onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })}
                  placeholder="Observations during inspection..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
                >
                  Save Service Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: AI DG Fuel & B-Check Anomaly Sentinel */}
      {showFuelAuditModal && fuelAuditResult && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    AI DG Fuel & B-Check Sentinel
                  </h3>
                  <p className="text-xs text-slate-500">{currentGen?.name || "Cummins 500kVA DG"}</p>
                </div>
              </div>
              <button onClick={() => setShowFuelAuditModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 py-1 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-slate-500 font-medium">Anomaly Status</div>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      fuelAuditResult.anomalySeverity === "NORMAL"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {fuelAuditResult.anomalySeverity.replace("_", " ")}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 font-medium">Pilferage Risk</div>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      fuelAuditResult.theftOrLeakageRisk === "LOW"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {fuelAuditResult.theftOrLeakageRisk} RISK
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                  <div className="text-slate-500">Fuel Burn Rate</div>
                  <div className="text-base font-extrabold text-amber-700 mt-0.5">
                    {fuelAuditResult.fuelConsumptionLitersPerHour} L/hr
                  </div>
                  <div className="text-[11px] text-amber-600/80 mt-0.5">Target: {fuelAuditResult.expectedBurnRateRange}</div>
                </div>

                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <div className="text-slate-500">250h B-Check Countdown</div>
                  <div className="text-base font-extrabold text-blue-700 mt-0.5">
                    {fuelAuditResult.hoursRemainingToBCheck} hrs remaining
                  </div>
                  <div className="text-[11px] text-blue-600/80 mt-0.5">ETA: {fuelAuditResult.projectedBCheckDate}</div>
                </div>
              </div>

              {fuelAuditResult.alerts && fuelAuditResult.alerts.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Telemetry Warnings
                  </div>
                  {fuelAuditResult.alerts.map((alt, idx) => (
                    <p key={idx} className="text-rose-700 text-xs">{alt}</p>
                  ))}
                </div>
              )}

              {fuelAuditResult.maintenanceDirectives && fuelAuditResult.maintenanceDirectives.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-1.5">Actionable Maintenance Directives</h4>
                  <ul className="space-y-1 text-slate-600 list-disc list-inside bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {fuelAuditResult.maintenanceDirectives.map((dir, idx) => (
                      <li key={idx}>{dir}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFuelAuditModal(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs transition"
              >
                Acknowledge Directives
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
