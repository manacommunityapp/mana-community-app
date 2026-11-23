import { describe, it, expect } from "vitest";
import { waterMaintenanceService } from "./waterMaintenanceService";

describe("waterMaintenanceService", () => {
  it("should return the list of community water storage tanks and sumps", async () => {
    const tanks = await waterMaintenanceService.getStorageTanks();
    expect(tanks.length).toBeGreaterThanOrEqual(4);

    const rawSump = tanks.find((t) => t.tankType === "UG_RAW");
    expect(rawSump).toBeDefined();
    expect(rawSump?.capacityLiters).toBe(150000);
    expect(rawSump?.currentLevelLiters).toBeGreaterThan(0);
  });

  it("should log tanker delivery and increment target tank water level", async () => {
    const tanks = await waterMaintenanceService.getStorageTanks();
    const rawSump = tanks.find((t) => t.tankType === "UG_RAW")!;
    const initialLevel = rawSump.currentLevelLiters;

    const delivery = await waterMaintenanceService.logTankerDelivery({
      vendorName: "Sri Sai Water Services",
      vehicleNumber: "KA-04-E-1234",
      capacityLiters: 12000,
      cost: 1300,
      targetTankId: rawSump.id,
      approvedBy: "Security Test Guard",
      status: "RECEIVED",
    });

    expect(delivery.id).toBeDefined();
    expect(delivery.capacityLiters).toBe(12000);

    const updatedTank = await waterMaintenanceService.getStorageTankById(rawSump.id);
    expect(updatedTank?.currentLevelLiters).toBe(Math.min(rawSump.capacityLiters, initialLevel + 12000));
  });

  it("should toggle pump status between RUNNING and STANDBY", async () => {
    const pumps = await waterMaintenanceService.getPumps();
    const targetPump = pumps[0];
    const initialStatus = targetPump.status;

    const toggled = await waterMaintenanceService.togglePumpDuty(targetPump.id);
    expect(toggled.status).toBe(initialStatus === "RUNNING" ? "STANDBY" : "RUNNING");
    expect(toggled.isDutyPump).toBe(initialStatus !== "RUNNING");
  });

  it("should evaluate water quality test compliance against IS:10500 standards", async () => {
    const safeTest = await waterMaintenanceService.logQualityTest({
      sourceLocation: "WTP_OUTLET",
      ph: 7.2,
      tdsPpm: 250,
      hardnessPpm: 150,
      residualChlorinePpm: 0.4,
      turbidityNtu: 0.5,
      testedBy: "Lab Tech",
    });
    expect(safeTest.status).toBe("SAFE");

    const marginalTest = await waterMaintenanceService.logQualityTest({
      sourceLocation: "BOREWELL_1",
      ph: 8.7, // > 8.5
      tdsPpm: 650, // > 500
      hardnessPpm: 350, // > 300
      testedBy: "Lab Tech",
    });
    expect(marginalTest.status).toBe("MARGINAL");

    const contaminatedTest = await waterMaintenanceService.logQualityTest({
      sourceLocation: "TOWER_A_TAP",
      ph: 5.5, // < 6.0
      tdsPpm: 1400, // > 1200
      hardnessPpm: 600,
      testedBy: "Lab Tech",
    });
    expect(contaminatedTest.status).toBe("CONTAMINATED");
  });

  it("should calculate correct overview summary metrics", async () => {
    const summary = await waterMaintenanceService.getOverviewSummary();
    expect(summary.totalCapacityLiters).toBeGreaterThan(0);
    expect(summary.currentStorageLiters).toBeGreaterThan(0);
    expect(summary.currentStoragePercentage).toBeGreaterThanOrEqual(0);
    expect(summary.currentStoragePercentage).toBeLessThanOrEqual(100);
    expect(summary.totalTankersThisMonth).toBeGreaterThanOrEqual(0);
    expect(summary.totalPumpsCount).toBeGreaterThan(0);
  });
});
