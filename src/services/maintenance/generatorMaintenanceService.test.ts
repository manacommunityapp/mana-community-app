import { describe, it, expect, beforeEach } from "vitest";
import { generatorMaintenanceService } from "./generatorMaintenanceService";

describe("generatorMaintenanceService", () => {
  beforeEach(() => {
    // Clear storage keys if needed or rely on default test isolation
  });

  it("should return the list of community generators", async () => {
    const gens = await generatorMaintenanceService.getGenerators();
    expect(gens.length).toBeGreaterThanOrEqual(2);
    expect(gens[0].capacityKva).toBe(380);
    expect(gens[0].fuelTankCapacityLiters).toBe(800);
  });

  it("should calculate run duration and fuel efficiency when logging a generator run", async () => {
    const gens = await generatorMaintenanceService.getGenerators();
    const targetGen = gens[0];
    const initialHours = targetGen.totalRunHours;

    const startTime = "2026-05-20T10:00:00.000Z";
    const endTime = "2026-05-20T12:00:00.000Z"; // 2 hours

    const run = await generatorMaintenanceService.logRun({
      generatorId: targetGen.id,
      startTime,
      endTime,
      startFuelLiters: 600,
      endFuelLiters: 560, // 40 Liters consumed
      unitsGeneratedKwh: 140, // 140 / 40 = 3.5 kWh/L
      reason: "GRID_OUTAGE",
      operatorName: "Test Operator",
    });

    expect(run.durationHours).toBe(2.0);
    expect(run.dieselConsumedLiters).toBe(40.0);
    expect(run.fuelEfficiencyKwhPerLiter).toBe(3.5);

    // Verify generator totalRunHours was incremented
    const updatedGen = await generatorMaintenanceService.getGeneratorById(targetGen.id);
    expect(updatedGen?.totalRunHours).toBeCloseTo(initialHours + 2.0);
    expect(updatedGen?.currentFuelLiters).toBe(560);
  });

  it("should calculate totalCost and update fuel tank level when logging a refill", async () => {
    const gens = await generatorMaintenanceService.getGenerators();
    const targetGen = gens[0];
    const initialFuel = targetGen.currentFuelLiters;

    const refill = await generatorMaintenanceService.logFuelRefill({
      generatorId: targetGen.id,
      refillDate: "2026-05-21",
      quantityLiters: 100,
      pricePerLiter: 90.0,
      supplierName: "Test Oil",
      billNumber: "BILL-999",
      enteredBy: "Test Engineer",
    });

    expect(refill.totalCost).toBe(9000.0);

    const updatedGen = await generatorMaintenanceService.getGeneratorById(targetGen.id);
    expect(updatedGen?.currentFuelLiters).toBe(Math.min(targetGen.fuelTankCapacityLiters, initialFuel + 100));
  });

  it("should correctly evaluate 250h B-check service alerts", async () => {
    const alerts = await generatorMaintenanceService.checkServiceAlerts();
    expect(alerts.length).toBeGreaterThanOrEqual(2);

    // Generator 2 has 642 total hours and last service at 385 hours (257 hrs elapsed > 250h limit)
    const gen2Alert = alerts.find((a) => a.generatorId === "gen-02");
    expect(gen2Alert).toBeDefined();
    expect(gen2Alert?.isOverdue).toBe(true);
    expect(gen2Alert?.alertSeverity).toBe("OVERDUE");
  });
});
