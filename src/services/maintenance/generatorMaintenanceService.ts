import { safeStorage } from "../../utils/storage";
import { apiClient } from "../common/apiClient";

export interface GeneratorAsset {
  id: string;
  name: string;
  makeModel: string;
  serialNumber: string;
  capacityKva: number;
  location: string;
  fuelTankCapacityLiters: number;
  currentFuelLiters: number;
  totalRunHours: number;
  lastServiceHours: number;
  serviceIntervalHours: number; // default 250 hours for standard B-Check
  batteryVoltage: number; // e.g. 12.6V
  coolantTempCelsius: number; // e.g. 68°C
  oilPressureBar: number; // e.g. 4.2 bar
  status: "STANDBY" | "RUNNING" | "MAINTENANCE" | "FAULT";
  amcVendor: string;
  amcExpiryDate: string;
  meterSerialNumber?: string; // Links to SmartMeterDashboard IoT meter
}

export interface GeneratorRunLog {
  id: string;
  generatorId: string;
  startTime: string; // ISO
  endTime: string; // ISO
  durationHours: number;
  startFuelLiters: number;
  endFuelLiters: number;
  dieselConsumedLiters: number;
  unitsGeneratedKwh: number;
  fuelEfficiencyKwhPerLiter: number;
  reason: "GRID_OUTAGE" | "SCHEDULED_TEST_RUN" | "MAINTENANCE_RUN" | "PEAK_SHAVING";
  operatorName: string;
  notes?: string;
  createdAt: string;
}

export interface GeneratorServiceRecord {
  id: string;
  generatorId: string;
  serviceType: "A_CHECK_ROUTINE" | "B_CHECK_250H" | "C_CHECK_MAJOR" | "EMERGENCY_REPAIR" | "BATTERY_REPLACEMENT";
  serviceDate: string;
  runHoursAtService: number;
  vendorName: string;
  technicianName: string;
  cost: number;
  partsReplaced: string[];
  notes?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  ticketId?: string;
}

export interface GeneratorAmcContract {
  id: string;
  generatorId: string;
  vendorName: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  annualCost: number;
  visitsIncluded: number;
  visitsCompleted: number;
  emergencyHelpline: string;
  slaHours: number;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
}

export interface GeneratorFuelRefill {
  id: string;
  generatorId: string;
  refillDate: string;
  quantityLiters: number;
  pricePerLiter: number;
  totalCost: number;
  supplierName: string;
  billNumber: string;
  enteredBy: string;
}

export interface ServiceAlertInfo {
  generatorId: string;
  generatorName: string;
  hoursSinceLastService: number;
  intervalHours: number;
  hoursRemainingOrOverdue: number;
  isOverdue: boolean;
  alertSeverity: "NORMAL" | "UPCOMING" | "OVERDUE";
  recommendedService: string;
}

// ── Default Initial Mock Data ────────────────────────────────────────────────

const INITIAL_GENERATORS: GeneratorAsset[] = [
  {
    id: "gen-01",
    name: "Substation Main DG 1",
    makeModel: "Cummins QSL9-G5 (380 kVA)",
    serialNumber: "CUM-BLR-2024-8841",
    capacityKva: 380,
    location: "Basement 2, Substation Room A",
    fuelTankCapacityLiters: 800,
    currentFuelLiters: 640,
    totalRunHours: 1248.5,
    lastServiceHours: 1020.0,
    serviceIntervalHours: 250,
    batteryVoltage: 12.8,
    coolantTempCelsius: 65,
    oilPressureBar: 4.2,
    status: "STANDBY",
    amcVendor: "Cummins India Authorized - Powertech Services",
    amcExpiryDate: "2027-03-31",
    meterSerialNumber: "DG-BACKUP-01",
  },
  {
    id: "gen-02",
    name: "Clubhouse & Lift DG 2",
    makeModel: "Kirloskar Green KG125WS (160 kVA)",
    serialNumber: "KIR-2023-1192",
    capacityKva: 160,
    location: "Clubhouse Rear Utility Yard",
    fuelTankCapacityLiters: 350,
    currentFuelLiters: 290,
    totalRunHours: 642.0,
    lastServiceHours: 385.0,
    serviceIntervalHours: 250,
    batteryVoltage: 12.4,
    coolantTempCelsius: 70,
    oilPressureBar: 3.8,
    status: "STANDBY",
    amcVendor: "Kirloskar Care South Services",
    amcExpiryDate: "2026-12-15",
    meterSerialNumber: "DG-CLUB-02",
  },
];

const INITIAL_RUN_LOGS: GeneratorRunLog[] = [
  {
    id: "run-101",
    generatorId: "gen-01",
    startTime: new Date(Date.now() - 24 * 3600000 * 2).toISOString(),
    endTime: new Date(Date.now() - 24 * 3600000 * 2 + 3.5 * 3600000).toISOString(),
    durationHours: 3.5,
    startFuelLiters: 710,
    endFuelLiters: 640,
    dieselConsumedLiters: 70,
    unitsGeneratedKwh: 245,
    fuelEfficiencyKwhPerLiter: 3.5,
    reason: "GRID_OUTAGE",
    operatorName: "Ramesh Sharma (Duty Tech)",
    notes: "Main BESCOM feeder line 3 trip during heavy rain. Restored smoothly.",
    createdAt: new Date(Date.now() - 24 * 3600000 * 2).toISOString(),
  },
  {
    id: "run-102",
    generatorId: "gen-01",
    startTime: new Date(Date.now() - 24 * 3600000 * 7).toISOString(),
    endTime: new Date(Date.now() - 24 * 3600000 * 7 + 0.5 * 3600000).toISOString(),
    durationHours: 0.5,
    startFuelLiters: 720,
    endFuelLiters: 710,
    dieselConsumedLiters: 10,
    unitsGeneratedKwh: 35,
    fuelEfficiencyKwhPerLiter: 3.5,
    reason: "SCHEDULED_TEST_RUN",
    operatorName: "Sunil Kumar (Estate Engineer)",
    notes: "Weekly dry test run. Auto mains failure (AMF) panel sync verified.",
    createdAt: new Date(Date.now() - 24 * 3600000 * 7).toISOString(),
  },
  {
    id: "run-103",
    generatorId: "gen-02",
    startTime: new Date(Date.now() - 24 * 3600000 * 3).toISOString(),
    endTime: new Date(Date.now() - 24 * 3600000 * 3 + 2.0 * 3600000).toISOString(),
    durationHours: 2.0,
    startFuelLiters: 320,
    endFuelLiters: 290,
    dieselConsumedLiters: 30,
    unitsGeneratedKwh: 110,
    fuelEfficiencyKwhPerLiter: 3.67,
    reason: "GRID_OUTAGE",
    operatorName: "Ramesh Sharma (Duty Tech)",
    notes: "Clubhouse lift & corridor illumination backup.",
    createdAt: new Date(Date.now() - 24 * 3600000 * 3).toISOString(),
  },
];

const INITIAL_SERVICE_RECORDS: GeneratorServiceRecord[] = [
  {
    id: "srv-201",
    generatorId: "gen-01",
    serviceType: "B_CHECK_250H",
    serviceDate: "2026-04-10",
    runHoursAtService: 1020.0,
    vendorName: "Cummins India Authorized - Powertech",
    technicianName: "K. Mohan Rao (Senior Field Eng)",
    cost: 34500,
    partsReplaced: ["Lube Oil Valvoline 15W-40 (45L)", "Fleetguard Oil Filter", "Fuel Filter Separator Cartridge"],
    notes: "Complete oil drain, filter replacement, valve lash clearance inspected.",
    status: "COMPLETED",
    ticketId: "HD-8821",
  },
  {
    id: "srv-202",
    generatorId: "gen-01",
    serviceType: "A_CHECK_ROUTINE",
    serviceDate: "2026-05-12",
    runHoursAtService: 1180.0,
    vendorName: "In-House Estate Team",
    technicianName: "Sunil Kumar",
    cost: 1500,
    partsReplaced: ["Distilled Battery Water 5L", "Coolant Top-up (3L)"],
    notes: "Weekly routine A-check: specific gravity 1.250, belts tension adjusted.",
    status: "COMPLETED",
  },
  {
    id: "srv-203",
    generatorId: "gen-02",
    serviceType: "B_CHECK_250H",
    serviceDate: "2026-02-18",
    runHoursAtService: 385.0,
    vendorName: "Kirloskar Care South Services",
    technicianName: "P. Vignesh",
    cost: 21800,
    partsReplaced: ["Kirloskar Lube Oil (20L)", "Dual Spin-on Fuel Filters", "Air Filter Element"],
    notes: "250h scheduled B-check performed according to manufacturer SOP.",
    status: "COMPLETED",
  },
];

const INITIAL_AMC_CONTRACTS: GeneratorAmcContract[] = [
  {
    id: "amc-301",
    generatorId: "gen-01",
    vendorName: "Cummins India Authorized - Powertech Services",
    contractNumber: "CUM-AMC-2026-778",
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    annualCost: 95000,
    visitsIncluded: 4,
    visitsCompleted: 2,
    emergencyHelpline: "+91 80 4123 9900 / 1800-210-2525",
    slaHours: 2,
    status: "ACTIVE",
  },
  {
    id: "amc-302",
    generatorId: "gen-02",
    vendorName: "Kirloskar Care South Services",
    contractNumber: "KOEL-AMC-2025-412",
    startDate: "2025-12-16",
    endDate: "2026-12-15",
    annualCost: 52000,
    visitsIncluded: 4,
    visitsCompleted: 3,
    emergencyHelpline: "+91 80 2839 4400 / 1800-233-3344",
    slaHours: 4,
    status: "EXPIRING_SOON",
  },
];

const INITIAL_FUEL_REFILLS: GeneratorFuelRefill[] = [
  {
    id: "refill-401",
    generatorId: "gen-01",
    refillDate: "2026-05-20",
    quantityLiters: 400,
    pricePerLiter: 89.5,
    totalCost: 35800,
    supplierName: "Indian Oil Corp - Sri Balaji Petroleum",
    billNumber: "IOC-BLR-89210",
    enteredBy: "Sunil Kumar (Estate Engineer)",
  },
  {
    id: "refill-402",
    generatorId: "gen-02",
    refillDate: "2026-05-18",
    quantityLiters: 200,
    pricePerLiter: 89.5,
    totalCost: 17900,
    supplierName: "Bharat Petroleum - Outer Ring Road Hub",
    billNumber: "BP-55912",
    enteredBy: "Sunil Kumar (Estate Engineer)",
  },
];

// ── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  GENERATORS: "mana_generator_assets",
  RUN_LOGS: "mana_generator_run_logs",
  SERVICES: "mana_generator_service_records",
  AMC: "mana_generator_amc_contracts",
  REFILLS: "mana_generator_fuel_refills",
};

const inMemoryCache: Record<string, string> = {};

function getStoredOrInit<T>(key: string, initialData: T): T {
  try {
    const hasLocalStorage = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
    const raw = hasLocalStorage ? safeStorage.getItem(key) : inMemoryCache[key];
    if (!raw) {
      const serialized = JSON.stringify(initialData);
      if (hasLocalStorage) {
        safeStorage.setItem(key, serialized);
      } else {
        inMemoryCache[key] = serialized;
      }
      return initialData;
    }
    return JSON.parse(raw);
  } catch {
    return initialData;
  }
}

function saveToStore<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data);
    const hasLocalStorage = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
    if (hasLocalStorage) {
      safeStorage.setItem(key, serialized);
    } else {
      inMemoryCache[key] = serialized;
    }
  } catch (err) {
    console.error(`Failed to save ${key} to storage`, err);
  }
}

// ── Service Implementation ───────────────────────────────────────────────────

export const generatorMaintenanceService = {
  // Generators
  async getGenerators(): Promise<GeneratorAsset[]> {
    try {
      const data = await apiClient.get<GeneratorAsset[]>("/v1/generator-maintenance/generators");
      if (Array.isArray(data) && data.length > 0) {
        saveToStore(KEYS.GENERATORS, data);
        return data;
      }
    } catch {
      // Fallback to local store if backend service is unreachable
    }
    return getStoredOrInit<GeneratorAsset[]>(KEYS.GENERATORS, INITIAL_GENERATORS);
  },

  async getGeneratorById(id: string): Promise<GeneratorAsset | undefined> {
    const list = await this.getGenerators();
    return list.find((g) => g.id === id);
  },

  async updateGenerator(id: string, updates: Partial<GeneratorAsset>): Promise<GeneratorAsset> {
    const list = await this.getGenerators();
    const idx = list.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error("Generator not found");
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    saveToStore(KEYS.GENERATORS, list);
    return updated;
  },

  async setGeneratorStatus(id: string, status: GeneratorAsset["status"]): Promise<GeneratorAsset> {
    return this.updateGenerator(id, { status });
  },

  // Run Logs
  async getRunLogs(generatorId?: string): Promise<GeneratorRunLog[]> {
    const all = getStoredOrInit<GeneratorRunLog[]>(KEYS.RUN_LOGS, INITIAL_RUN_LOGS);
    if (generatorId) {
      return all.filter((l) => l.generatorId === generatorId);
    }
    return all;
  },

  async logRun(data: Omit<GeneratorRunLog, "id" | "createdAt" | "durationHours" | "dieselConsumedLiters" | "fuelEfficiencyKwhPerLiter">): Promise<GeneratorRunLog> {
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    const durationHours = Math.max(0.1, Number(((end - start) / 3600000).toFixed(2)));
    const dieselConsumedLiters = Math.max(0, Number((data.startFuelLiters - data.endFuelLiters).toFixed(1)));
    const fuelEfficiencyKwhPerLiter = dieselConsumedLiters > 0
      ? Number((data.unitsGeneratedKwh / dieselConsumedLiters).toFixed(2))
      : 0;

    const newLog: GeneratorRunLog = {
      ...data,
      id: `run-${Date.now()}`,
      durationHours,
      dieselConsumedLiters,
      fuelEfficiencyKwhPerLiter,
      createdAt: new Date().toISOString(),
    };

    const all = await this.getRunLogs();
    const updatedLogs = [newLog, ...all];
    saveToStore(KEYS.RUN_LOGS, updatedLogs);

    // Update the generator asset's total run hours and current fuel
    const gen = await this.getGeneratorById(data.generatorId);
    if (gen) {
      await this.updateGenerator(gen.id, {
        totalRunHours: Number((gen.totalRunHours + durationHours).toFixed(1)),
        currentFuelLiters: data.endFuelLiters,
        status: "STANDBY",
      });
    }

    return newLog;
  },

  // Service Records
  async getServiceRecords(generatorId?: string): Promise<GeneratorServiceRecord[]> {
    const all = getStoredOrInit<GeneratorServiceRecord[]>(KEYS.SERVICES, INITIAL_SERVICE_RECORDS);
    if (generatorId) {
      return all.filter((s) => s.generatorId === generatorId);
    }
    return all;
  },

  async recordService(data: Omit<GeneratorServiceRecord, "id">): Promise<GeneratorServiceRecord> {
    const newRecord: GeneratorServiceRecord = {
      ...data,
      id: `srv-${Date.now()}`,
    };

    const all = await this.getServiceRecords();
    const updated = [newRecord, ...all];
    saveToStore(KEYS.SERVICES, updated);

    // If completed a B-check or major check, update generator's lastServiceHours
    if (data.status === "COMPLETED" && (data.serviceType === "B_CHECK_250H" || data.serviceType === "C_CHECK_MAJOR")) {
      const gen = await this.getGeneratorById(data.generatorId);
      if (gen) {
        await this.updateGenerator(gen.id, {
          lastServiceHours: data.runHoursAtService,
        });
      }
    }

    return newRecord;
  },

  // Fuel Refills
  async getFuelRefills(generatorId?: string): Promise<GeneratorFuelRefill[]> {
    const all = getStoredOrInit<GeneratorFuelRefill[]>(KEYS.REFILLS, INITIAL_FUEL_REFILLS);
    if (generatorId) {
      return all.filter((r) => r.generatorId === generatorId);
    }
    return all;
  },

  async logFuelRefill(data: Omit<GeneratorFuelRefill, "id" | "totalCost">): Promise<GeneratorFuelRefill> {
    const totalCost = Number((data.quantityLiters * data.pricePerLiter).toFixed(2));
    const newRefill: GeneratorFuelRefill = {
      ...data,
      id: `refill-${Date.now()}`,
      totalCost,
    };

    const all = await this.getFuelRefills();
    saveToStore(KEYS.REFILLS, [newRefill, ...all]);

    // Update current fuel in tank
    const gen = await this.getGeneratorById(data.generatorId);
    if (gen) {
      const newFuel = Math.min(gen.fuelTankCapacityLiters, gen.currentFuelLiters + data.quantityLiters);
      await this.updateGenerator(gen.id, { currentFuelLiters: newFuel });
    }

    return newRefill;
  },

  // AMC Contracts
  async getAmcContracts(generatorId?: string): Promise<GeneratorAmcContract[]> {
    const all = getStoredOrInit<GeneratorAmcContract[]>(KEYS.AMC, INITIAL_AMC_CONTRACTS);
    if (generatorId) {
      return all.filter((a) => a.generatorId === generatorId);
    }
    return all;
  },

  async saveAmcContract(contract: Omit<GeneratorAmcContract, "id"> & { id?: string }): Promise<GeneratorAmcContract> {
    const all = await this.getAmcContracts();
    let saved: GeneratorAmcContract;
    if (contract.id) {
      saved = contract as GeneratorAmcContract;
      const idx = all.findIndex((a) => a.id === contract.id);
      if (idx !== -1) all[idx] = saved;
    } else {
      saved = { ...contract, id: `amc-${Date.now()}` };
      all.push(saved);
    }
    saveToStore(KEYS.AMC, all);
    return saved;
  },

  // Service Interval & Telemetry Anomaly Checks (250h B-check trigger)
  async checkServiceAlerts(generatorId?: string): Promise<ServiceAlertInfo[]> {
    const generators = await this.getGenerators();
    const targetGens = generatorId ? generators.filter((g) => g.id === generatorId) : generators;

    return targetGens.map((gen) => {
      const hoursSinceLastService = Number((gen.totalRunHours - gen.lastServiceHours).toFixed(1));
      const hoursRemainingOrOverdue = Number((gen.serviceIntervalHours - hoursSinceLastService).toFixed(1));
      const isOverdue = hoursSinceLastService >= gen.serviceIntervalHours;

      let alertSeverity: "NORMAL" | "UPCOMING" | "OVERDUE" = "NORMAL";
      if (isOverdue) {
        alertSeverity = "OVERDUE";
      } else if (hoursRemainingOrOverdue <= 30) {
        alertSeverity = "UPCOMING";
      }

      return {
        generatorId: gen.id,
        generatorName: gen.name,
        hoursSinceLastService,
        intervalHours: gen.serviceIntervalHours,
        hoursRemainingOrOverdue,
        isOverdue,
        alertSeverity,
        recommendedService: isOverdue
          ? "Urgent 250h B-Check Service Required (Oil & Filter Replacement)"
          : alertSeverity === "UPCOMING"
          ? "Upcoming 250h B-Check Service (within 30 operating hours)"
          : "Standard Routine A-Check & Periodic Inspection",
      };
    });
  },
};
