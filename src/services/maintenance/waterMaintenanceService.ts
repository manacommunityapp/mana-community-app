import { safeStorage } from "../../utils/storage";
import { apiClient } from "../common/apiClient";

// ── Types & Interfaces ────────────────────────────────────────────────────────

export type TankType =
  | "UG_RAW"
  | "UG_TREATED"
  | "UG_SOFT"
  | "UG_FIRE_RESERVE"
  | "OHT_TOWER_A"
  | "OHT_TOWER_B"
  | "OHT_TOWER_C";

export interface WaterStorageTank {
  id: string;
  name: string;
  tankType: TankType;
  location: string;
  capacityLiters: number;
  currentLevelLiters: number;
  lowLevelThresholdLiters: number;
  sensorStatus: "ONLINE" | "OFFLINE" | "CALIBRATING";
  lastTelemetryTime?: string;
}

export interface WaterTankerDelivery {
  id: string;
  deliveryDate: string;
  vendorName: string;
  vehicleNumber: string;
  capacityLiters: number;
  cost: number;
  invoiceNumber?: string;
  driverPhone?: string;
  targetTankId?: string;
  approvedBy?: string;
  status: "RECEIVED" | "PENDING_VERIFICATION" | "REJECTED";
  notes?: string;
}

export type PumpType =
  | "TRANSFER_PUMP"
  | "BOOSTER_PUMP"
  | "BOREWELL_PUMP"
  | "DRAINAGE_PUMP"
  | "FIRE_HYDRANT";

export interface WaterPump {
  id: string;
  name: string;
  pumpType: PumpType;
  location: string;
  ratedKw: number;
  dutyCycleHours: number;
  totalRunHours: number;
  status: "RUNNING" | "STANDBY" | "MAINTENANCE" | "FAULT";
  isDutyPump: boolean;
  motorHealthRating: "EXCELLENT" | "GOOD" | "ATTENTION_NEEDED" | "CRITICAL";
  lastServiceDate?: string;
}

export interface WaterPumpRunLog {
  id: string;
  pumpId: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  flowRateLpm?: number;
  energyKwh?: number;
  operatorName?: string;
  notes?: string;
}

export interface WaterTreatmentLog {
  id: string;
  plantType: "WTP" | "STP";
  operationType:
    | "MGF_BACKWASH"
    | "ACF_BACKWASH"
    | "SOFTENER_SALT_RECHARGE"
    | "STP_AERATION_CHECK"
    | "CHLORINE_DOSING"
    | "SLUDGE_DISPOSAL";
  logDate: string;
  quantityUsedKg: number;
  operatorName?: string;
  notes?: string;
}

export interface WaterQualityTest {
  id: string;
  testDate: string;
  sourceLocation:
    | "MUNICIPAL_INFLOW"
    | "BOREWELL_1"
    | "WTP_OUTLET"
    | "STP_TREATED"
    | "TOWER_A_TAP";
  ph: number;
  tdsPpm: number;
  hardnessPpm: number;
  residualChlorinePpm?: number;
  turbidityNtu?: number;
  status: "SAFE" | "MARGINAL" | "CONTAMINATED";
  testedBy?: string;
  labReportUrl?: string;
  notes?: string;
}

export interface TankCleaningSchedule {
  id: string;
  tankId: string;
  tankName: string;
  lastCleanedDate: string;
  nextDueDate: string;
  cleaningType: "MECHANIZED_DEWATERING_UV" | "CHEMICAL_DISINFECTION" | "MANUAL_SCRUB";
  vendorName?: string;
  cost: number;
  status: "SCHEDULED" | "COMPLETED" | "OVERDUE";
  certificateUrl?: string;
  notes?: string;
}

export interface WaterOverviewSummary {
  totalCapacityLiters: number;
  currentStorageLiters: number;
  currentStoragePercentage: number;
  totalTankersThisMonth: number;
  totalTankerExpenditureThisMonth: number;
  totalPumpsCount: number;
  runningPumpsCount: number;
  lowStorageAlert: boolean;
}

// ── Initial Mock / Seed Data ──────────────────────────────────────────────────

const INITIAL_TANKS: WaterStorageTank[] = [
  {
    id: "tank-1",
    name: "Underground Raw Water Sump",
    tankType: "UG_RAW",
    location: "Main Pump House B1",
    capacityLiters: 150000,
    currentLevelLiters: 112000,
    lowLevelThresholdLiters: 35000,
    sensorStatus: "ONLINE",
    lastTelemetryTime: "2026-11-19T10:30:00.000Z",
  },
  {
    id: "tank-2",
    name: "Domestic Treated Soft Water Sump",
    tankType: "UG_SOFT",
    location: "WTP Plant Yard",
    capacityLiters: 100000,
    currentLevelLiters: 78500,
    lowLevelThresholdLiters: 25000,
    sensorStatus: "ONLINE",
    lastTelemetryTime: "2026-11-19T10:30:00.000Z",
  },
  {
    id: "tank-3",
    name: "Dedicated Fire Safety Reserve Sump",
    tankType: "UG_FIRE_RESERVE",
    location: "Fire Pump Station B2",
    capacityLiters: 200000,
    currentLevelLiters: 195000,
    lowLevelThresholdLiters: 180000,
    sensorStatus: "ONLINE",
    lastTelemetryTime: "2026-11-19T10:30:00.000Z",
  },
  {
    id: "tank-4",
    name: "Tower A Overhead Tank (OHT)",
    tankType: "OHT_TOWER_A",
    location: "Tower A Terrace",
    capacityLiters: 50000,
    currentLevelLiters: 38200,
    lowLevelThresholdLiters: 15000,
    sensorStatus: "ONLINE",
    lastTelemetryTime: "2026-11-19T10:30:00.000Z",
  },
  {
    id: "tank-5",
    name: "Tower B Overhead Tank (OHT)",
    tankType: "OHT_TOWER_B",
    location: "Tower B Terrace",
    capacityLiters: 50000,
    currentLevelLiters: 34600,
    lowLevelThresholdLiters: 15000,
    sensorStatus: "ONLINE",
    lastTelemetryTime: "2026-11-19T10:30:00.000Z",
  },
];

const INITIAL_TANKERS: WaterTankerDelivery[] = [
  {
    id: "tanker-101",
    deliveryDate: "2026-11-19T08:15:00.000Z",
    vendorName: "Cauvery Fresh Water Carriers",
    vehicleNumber: "KA-01-MJ-8821",
    capacityLiters: 12000,
    cost: 1250,
    invoiceNumber: "CFW-2026-1104",
    driverPhone: "+91 98451 12345",
    targetTankId: "tank-1",
    approvedBy: "Gate Guard Ramesh",
    status: "RECEIVED",
    notes: "TDS checked at 220 ppm. Water clear.",
  },
  {
    id: "tanker-102",
    deliveryDate: "2026-11-18T16:30:00.000Z",
    vendorName: "Sri Balaji Water Suppliers",
    vehicleNumber: "KA-53-A-4192",
    capacityLiters: 20000,
    cost: 1950,
    invoiceNumber: "SBW-8491",
    driverPhone: "+91 94480 98765",
    targetTankId: "tank-1",
    approvedBy: "Facility Supv. Anand",
    status: "RECEIVED",
    notes: "Bulk tanker for evening peak buffer.",
  },
  {
    id: "tanker-103",
    deliveryDate: "2026-11-17T09:45:00.000Z",
    vendorName: "Cauvery Fresh Water Carriers",
    vehicleNumber: "KA-01-MJ-8821",
    capacityLiters: 12000,
    cost: 1250,
    invoiceNumber: "CFW-2026-1092",
    driverPhone: "+91 98451 12345",
    targetTankId: "tank-1",
    approvedBy: "Gate Guard Ramesh",
    status: "RECEIVED",
  },
];

const INITIAL_PUMPS: WaterPump[] = [
  {
    id: "pump-1",
    name: "Raw Water Transfer Pump #1",
    pumpType: "TRANSFER_PUMP",
    location: "Main Pump House B1",
    ratedKw: 7.5,
    dutyCycleHours: 4,
    totalRunHours: 1240.5,
    status: "RUNNING",
    isDutyPump: true,
    motorHealthRating: "EXCELLENT",
    lastServiceDate: "2026-10-30",
  },
  {
    id: "pump-2",
    name: "Raw Water Transfer Pump #2 (Standby)",
    pumpType: "TRANSFER_PUMP",
    location: "Main Pump House B1",
    ratedKw: 7.5,
    dutyCycleHours: 4,
    totalRunHours: 1185.0,
    status: "STANDBY",
    isDutyPump: false,
    motorHealthRating: "GOOD",
    lastServiceDate: "2026-10-30",
  },
  {
    id: "pump-3",
    name: "Hydro-Pneumatic (HYPN) Booster #1",
    pumpType: "BOOSTER_PUMP",
    location: "Clubhouse Utility Room",
    ratedKw: 11.0,
    dutyCycleHours: 6,
    totalRunHours: 2450.0,
    status: "RUNNING",
    isDutyPump: true,
    motorHealthRating: "GOOD",
    lastServiceDate: "2026-10-05",
  },
  {
    id: "pump-4",
    name: "Borewell Submersible Pump #1",
    pumpType: "BOREWELL_PUMP",
    location: "East Gate Borewell Point",
    ratedKw: 5.5,
    dutyCycleHours: 3,
    totalRunHours: 890.0,
    status: "STANDBY",
    isDutyPump: false,
    motorHealthRating: "GOOD",
    lastServiceDate: "2026-09-20",
  },
  {
    id: "pump-5",
    name: "Fire Hydrant Jockey Pump",
    pumpType: "FIRE_HYDRANT",
    location: "Fire Safety Room B2",
    ratedKw: 15.0,
    dutyCycleHours: 24,
    totalRunHours: 120.0,
    status: "STANDBY",
    isDutyPump: false,
    motorHealthRating: "EXCELLENT",
    lastServiceDate: "2026-11-04",
  },
];

const INITIAL_TREATMENT_LOGS: WaterTreatmentLog[] = [
  {
    id: "treat-1",
    plantType: "WTP",
    operationType: "MGF_BACKWASH",
    logDate: "2026-11-19T06:30:00.000Z",
    quantityUsedKg: 0,
    operatorName: "WTP Operator Suresh",
    notes: "Daily 15-minute multi-grade filter backwash completed. Turbidity returned to < 1.0 NTU.",
  },
  {
    id: "treat-2",
    plantType: "WTP",
    operationType: "SOFTENER_SALT_RECHARGE",
    logDate: "2026-11-18T10:00:00.000Z",
    quantityUsedKg: 50,
    operatorName: "WTP Operator Suresh",
    notes: "2 bags (50kg) industrial vacuum salt replenished in brine tank for ion-exchange regeneration.",
  },
  {
    id: "treat-3",
    plantType: "STP",
    operationType: "STP_AERATION_CHECK",
    logDate: "2026-11-18T15:00:00.000Z",
    quantityUsedKg: 0,
    operatorName: "STP Tech Imran",
    notes: "Dissolved oxygen verified at 2.4 mg/L. Aeration blower #1 running smoothly.",
  },
  {
    id: "treat-4",
    plantType: "STP",
    operationType: "CHLORINE_DOSING",
    logDate: "2026-11-17T17:00:00.000Z",
    quantityUsedKg: 5,
    operatorName: "STP Tech Imran",
    notes: "Sodium hypochlorite dosing for tertiary treated irrigation & toilet flushing water.",
  },
];

const INITIAL_QUALITY_TESTS: WaterQualityTest[] = [
  {
    id: "test-1",
    testDate: "2026-11-19T07:30:00.000Z",
    sourceLocation: "WTP_OUTLET",
    ph: 7.2,
    tdsPpm: 185,
    hardnessPpm: 120,
    residualChlorinePpm: 0.3,
    turbidityNtu: 0.6,
    status: "SAFE",
    testedBy: "Quality Inspector Mahesh",
  },
  {
    id: "test-2",
    testDate: "2026-11-18T09:00:00.000Z",
    sourceLocation: "MUNICIPAL_INFLOW",
    ph: 7.4,
    tdsPpm: 210,
    hardnessPpm: 140,
    residualChlorinePpm: 0.4,
    turbidityNtu: 0.8,
    status: "SAFE",
    testedBy: "Quality Inspector Mahesh",
  },
  {
    id: "test-3",
    testDate: "2026-11-17T11:00:00.000Z",
    sourceLocation: "STP_TREATED",
    ph: 7.6,
    tdsPpm: 460,
    hardnessPpm: 260,
    residualChlorinePpm: 1.0,
    turbidityNtu: 2.1,
    status: "SAFE",
    testedBy: "STP Tech Imran",
    notes: "Meets KSPCB recycled water reuse norms for landscape and flushing.",
  },
];

const INITIAL_CLEANING_SCHEDULES: TankCleaningSchedule[] = [
  {
    id: "clean-1",
    tankId: "tank-1",
    tankName: "Underground Raw Water Sump",
    lastCleanedDate: "2026-06-15",
    nextDueDate: "2026-12-15",
    cleaningType: "MECHANIZED_DEWATERING_UV",
    vendorName: "AquaClean Tech Solutions",
    cost: 14500,
    status: "SCHEDULED",
    notes: "Bi-annual 6-stage mechanized cleaning: sludge pumping, high pressure rotary jet, antibacterial spray & UV treatment.",
  },
  {
    id: "clean-2",
    tankId: "tank-2",
    tankName: "Domestic Treated Soft Water Sump",
    lastCleanedDate: "2026-06-16",
    nextDueDate: "2026-12-16",
    cleaningType: "MECHANIZED_DEWATERING_UV",
    vendorName: "AquaClean Tech Solutions",
    cost: 12000,
    status: "SCHEDULED",
  },
  {
    id: "clean-3",
    tankId: "tank-4",
    tankName: "Tower A Overhead Tank (OHT)",
    lastCleanedDate: "2026-05-10",
    nextDueDate: "2026-11-10",
    cleaningType: "MECHANIZED_DEWATERING_UV",
    vendorName: "AquaClean Tech Solutions",
    cost: 8500,
    status: "OVERDUE",
    notes: "Service due date passed. Vendor alerted for slot booking this weekend.",
  },
];

// ── Storage Keys ──────────────────────────────────────────────────────────────

const KEYS = {
  TANKS: "mana_water_storage_tanks",
  TANKERS: "mana_water_tanker_deliveries",
  PUMPS: "mana_water_pumps",
  TREATMENT: "mana_water_treatment_logs",
  QUALITY: "mana_water_quality_tests",
  CLEANING: "mana_water_cleaning_schedules",
};

const inMemoryCache: Record<string, string> = {};

function getStoredOrInit<T>(key: string, defaultValue: T): T {
  try {
    const hasLocalStorage = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
    const raw = hasLocalStorage ? safeStorage.getItem(key) : (inMemoryCache[key] ?? null);
    if (!raw) {
      if (hasLocalStorage) safeStorage.setItem(key, JSON.stringify(defaultValue));
      else inMemoryCache[key] = JSON.stringify(defaultValue);
      return defaultValue;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Failed to load ${key} from storage`, err);
    return defaultValue;
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

export const waterMaintenanceService = {
  // Storage Tanks
  async getStorageTanks(): Promise<WaterStorageTank[]> {
    try {
      const data = await apiClient.get<WaterStorageTank[]>("/v1/water-maintenance/tanks");
      if (Array.isArray(data) && data.length > 0) {
        saveToStore(KEYS.TANKS, data);
        return data;
      }
    } catch {
      // Offline fallback
    }
    return getStoredOrInit<WaterStorageTank[]>(KEYS.TANKS, INITIAL_TANKS);
  },

  async getStorageTankById(id: string): Promise<WaterStorageTank | undefined> {
    const tanks = await this.getStorageTanks();
    return tanks.find((t) => t.id === id);
  },

  async updateTankLevel(id: string, newLevelLiters: number): Promise<WaterStorageTank> {
    const tanks = await this.getStorageTanks();
    const idx = tanks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Tank not found");

    const clamped = Math.max(0, Math.min(tanks[idx].capacityLiters, newLevelLiters));
    const updated: WaterStorageTank = {
      ...tanks[idx],
      currentLevelLiters: clamped,
      lastTelemetryTime: new Date().toISOString(),
    };
    tanks[idx] = updated;
    saveToStore(KEYS.TANKS, tanks);

    try {
      await apiClient.put(`/v1/water-maintenance/tanks/${id}/level?levelLiters=${clamped}`, {});
    } catch {
      // Offline fallback
    }

    return updated;
  },

  // Tanker Deliveries
  async getTankerDeliveries(): Promise<WaterTankerDelivery[]> {
    try {
      const data = await apiClient.get<WaterTankerDelivery[]>("/v1/water-maintenance/tankers");
      if (Array.isArray(data) && data.length > 0) {
        saveToStore(KEYS.TANKERS, data);
        return data;
      }
    } catch {
      // Offline fallback
    }
    return getStoredOrInit<WaterTankerDelivery[]>(KEYS.TANKERS, INITIAL_TANKERS);
  },

  async logTankerDelivery(
    data: Omit<WaterTankerDelivery, "id" | "deliveryDate"> & { deliveryDate?: string }
  ): Promise<WaterTankerDelivery> {
    const newDelivery: WaterTankerDelivery = {
      ...data,
      id: `tanker-${Date.now()}`,
      deliveryDate: data.deliveryDate || new Date().toISOString(),
    };

    const all = await this.getTankerDeliveries();
    saveToStore(KEYS.TANKERS, [newDelivery, ...all]);

    // If target tank is specified, update tank level
    if (data.targetTankId) {
      const tank = await this.getStorageTankById(data.targetTankId);
      if (tank) {
        await this.updateTankLevel(tank.id, tank.currentLevelLiters + data.capacityLiters);
      }
    }

    try {
      await apiClient.post("/v1/water-maintenance/tankers", data);
    } catch {
      // Offline fallback
    }

    return newDelivery;
  },

  // Water Pumps
  async getPumps(): Promise<WaterPump[]> {
    try {
      const data = await apiClient.get<WaterPump[]>("/v1/water-maintenance/pumps");
      if (Array.isArray(data) && data.length > 0) {
        saveToStore(KEYS.PUMPS, data);
        return data;
      }
    } catch {
      // Offline fallback
    }
    return getStoredOrInit<WaterPump[]>(KEYS.PUMPS, INITIAL_PUMPS);
  },

  async togglePumpDuty(id: string): Promise<WaterPump> {
    const pumps = await this.getPumps();
    const idx = pumps.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Pump not found");

    const pump = pumps[idx];
    const isNowRunning = pump.status !== "RUNNING";
    const updated: WaterPump = {
      ...pump,
      status: isNowRunning ? "RUNNING" : "STANDBY",
      isDutyPump: isNowRunning,
    };
    pumps[idx] = updated;
    saveToStore(KEYS.PUMPS, pumps);

    try {
      await apiClient.post(`/v1/water-maintenance/pumps/${id}/toggle-duty`, {});
    } catch {
      // Offline fallback
    }

    return updated;
  },

  // WTP & STP Treatment Logs
  async getTreatmentLogs(plantType?: "WTP" | "STP"): Promise<WaterTreatmentLog[]> {
    try {
      const url = plantType ? `/v1/water-maintenance/treatment?plantType=${plantType}` : "/v1/water-maintenance/treatment";
      const data = await apiClient.get<WaterTreatmentLog[]>(url);
      if (Array.isArray(data) && data.length > 0) {
        saveToStore(KEYS.TREATMENT, data);
        return data;
      }
    } catch {
      // Offline fallback
    }
    const all = getStoredOrInit<WaterTreatmentLog[]>(KEYS.TREATMENT, INITIAL_TREATMENT_LOGS);
    if (plantType) {
      return all.filter((l) => l.plantType === plantType);
    }
    return all;
  },

  async logTreatment(data: Omit<WaterTreatmentLog, "id" | "logDate">): Promise<WaterTreatmentLog> {
    const newLog: WaterTreatmentLog = {
      ...data,
      id: `treat-${Date.now()}`,
      logDate: new Date().toISOString(),
    };
    const all = await this.getTreatmentLogs();
    saveToStore(KEYS.TREATMENT, [newLog, ...all]);

    try {
      await apiClient.post("/v1/water-maintenance/treatment", data);
    } catch {
      // Offline fallback
    }

    return newLog;
  },

  // Water Quality Tests
  async getQualityTests(): Promise<WaterQualityTest[]> {
    try {
      const data = await apiClient.get<WaterQualityTest[]>("/v1/water-maintenance/quality-tests");
      if (Array.isArray(data) && data.length > 0) {
        saveToStore(KEYS.QUALITY, data);
        return data;
      }
    } catch {
      // Offline fallback
    }
    return getStoredOrInit<WaterQualityTest[]>(KEYS.QUALITY, INITIAL_QUALITY_TESTS);
  },

  async logQualityTest(data: Omit<WaterQualityTest, "id" | "testDate" | "status">): Promise<WaterQualityTest> {
    // Evaluation according to IS:10500 specifications
    let status: WaterQualityTest["status"] = "SAFE";
    if (data.ph < 6.0 || data.ph > 9.0 || data.tdsPpm > 1200 || data.hardnessPpm > 500) {
      status = "CONTAMINATED";
    } else if (data.ph < 6.5 || data.ph > 8.5 || data.tdsPpm > 500 || data.hardnessPpm > 300) {
      status = "MARGINAL";
    }

    const newTest: WaterQualityTest = {
      ...data,
      id: `test-${Date.now()}`,
      testDate: new Date().toISOString(),
      status,
    };

    const all = await this.getQualityTests();
    saveToStore(KEYS.QUALITY, [newTest, ...all]);

    try {
      await apiClient.post("/v1/water-maintenance/quality-tests", { ...data, status });
    } catch {
      // Offline fallback
    }

    return newTest;
  },

  // Tank Cleaning Schedules
  async getCleaningSchedules(): Promise<TankCleaningSchedule[]> {
    return getStoredOrInit<TankCleaningSchedule[]>(KEYS.CLEANING, INITIAL_CLEANING_SCHEDULES);
  },

  async recordCleaning(data: Omit<TankCleaningSchedule, "id">): Promise<TankCleaningSchedule> {
    const newCleaning: TankCleaningSchedule = {
      ...data,
      id: `clean-${Date.now()}`,
    };
    const all = await this.getCleaningSchedules();
    saveToStore(KEYS.CLEANING, [newCleaning, ...all]);

    try {
      await apiClient.post(`/v1/water-maintenance/tanks/${data.tankId}/cleaning`, data);
    } catch {
      // Offline fallback
    }

    return newCleaning;
  },

  // Overview Summary Calculations
  async getOverviewSummary(): Promise<WaterOverviewSummary> {
    const tanks = await this.getStorageTanks();
    const tankers = await this.getTankerDeliveries();
    const pumps = await this.getPumps();

    const totalCapacity = tanks.reduce((acc, t) => acc + t.capacityLiters, 0);
    const currentStorage = tanks.reduce((acc, t) => acc + t.currentLevelLiters, 0);
    const storagePercentage = totalCapacity > 0 ? Number(((currentStorage / totalCapacity) * 100).toFixed(1)) : 0;

    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const thisMonthTankers = tankers.filter((t) => new Date(t.deliveryDate).getTime() >= firstOfMonth);
    const tankerSpend = thisMonthTankers.reduce((acc, t) => acc + t.cost, 0);

    const runningPumps = pumps.filter((p) => p.status === "RUNNING").length;
    const lowStorageAlert = storagePercentage < 25;

    return {
      totalCapacityLiters: totalCapacity,
      currentStorageLiters: currentStorage,
      currentStoragePercentage: storagePercentage,
      totalTankersThisMonth: thisMonthTankers.length,
      totalTankerExpenditureThisMonth: tankerSpend,
      totalPumpsCount: pumps.length,
      runningPumpsCount: runningPumps,
      lowStorageAlert,
    };
  },
};
