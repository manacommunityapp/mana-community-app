import { describe, it, expect, beforeEach } from "vitest";
import { parkingService } from "./parkingService";

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: 0,
  } as unknown as Storage;
}

describe("parkingService - Web & Mobile Parity Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fetches parking slots and filters available ones", async () => {
    const slots = await parkingService.getSlots();
    expect(slots.length).toBeGreaterThan(0);
    const available = await parkingService.getAvailableSlots();
    expect(available.every((s) => s.status === "AVAILABLE")).toBe(true);
  });

  it("registers resident vehicles with plate normalization", async () => {
    const vehicle = await parkingService.registerVehicle({
      numberPlate: "ka-05-ev-9999",
      make: "Tata",
      model: "Nexon EV",
      color: "Blue",
      vehicleType: "EV",
      primary: true,
    });

    expect(vehicle.id).toBeDefined();
    expect(vehicle.numberPlate).toBe("KA-05-EV-9999");
    expect(vehicle.status).toBe("ACTIVE");
  });

  it("lists a spot in the marketplace and books it with auto-whitelisting", async () => {
    const listing = await parkingService.createMarketplaceListing({
      spotNumber: "B1-P20",
      level: "Basement 1",
      spotType: "CAR",
      startDate: "2026-10-20",
      endDate: "2026-10-25",
      pricingType: "DAILY_RATE",
      rateINR: 100,
      notes: "Covered spot near elevator",
    });

    expect(listing.id).toBeDefined();
    expect(listing.status).toBe("AVAILABLE");

    const booking = await parkingService.bookMarketplaceSlot({
      listingId: listing.id,
      vehicleNumber: "KA-01-MJ-5500",
      startDate: "2026-10-20",
      endDate: "2026-10-23",
    });

    expect(booking.id).toBeDefined();
    expect(booking.status).toBe("CONFIRMED");
    expect(booking.anprWhitelisted).toBe(true);
    expect(booking.totalAmountINR).toBe(300);
  });

  it("supports proposing slot swaps between residents", async () => {
    const swap = await parkingService.createSwapRequest({
      targetSpotNumber: "B1-P02",
      targetLevel: "Basement 1",
      targetOwnerFlat: "Tower A2 - 204",
      reason: "Closer to Tower A entrance",
    });

    expect(swap.id).toBeDefined();
    expect(swap.status).toBe("PENDING_NEIGHBOR");
  });

  it("adds residents to the society parking allotment waitlist", async () => {
    const entry = await parkingService.joinWaitlist("Basement 2");
    expect(entry.id).toBeDefined();
    expect(entry.preferredLevel).toBe("Basement 2");
    expect(entry.status).toBe("QUEUED");
  });

  it("reports parking violations to the guard desk", async () => {
    const viol = await parkingService.reportViolation({
      spotNumber: "B1-EV1",
      level: "Basement 1",
      offendingVehicleNumber: "DL-01-AB-9999",
      violationType: "NON_EV_ON_CHARGER",
      remarks: "Petrol car blocking EV fast charging bay",
    });

    expect(viol.id).toBeDefined();
    expect(viol.severity).toBe("MAJOR");
    expect(viol.status).toBe("REPORTED");
  });
});
