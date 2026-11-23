import { describe, it, expect, vi } from "vitest";

vi.mock("../common/apiClient", () => ({ apiClient: { get: vi.fn() } }));

import {
  activationRate,
  paymentSuccessRate,
  bookingToPaymentCompletion,
  takeRate,
  churnRate,
  contributionMargin,
  ticketsPer100Residents,
  moduleRecommendation,
} from "./pilotKpiService";

describe("pilot KPI helpers", () => {
  it("returns null instead of dividing by zero", () => {
    expect(activationRate({ signups: 0, activatedResidents: 0 })).toBeNull();
    expect(takeRate({ gmv: 0, commission: 5 })).toBeNull();
    expect(contributionMargin({ revenue: 0, cost: 5 })).toBeNull();
  });

  it("computes rates", () => {
    expect(activationRate({ signups: 10, activatedResidents: 4 })).toBe(0.4);
    const t = { bookingsCreated: 20, paymentsStarted: 18, paymentsSucceeded: 15, paymentsFailed: 5 };
    expect(paymentSuccessRate(t)).toBe(0.75);
    expect(bookingToPaymentCompletion(t)).toBe(0.75);
    expect(takeRate({ gmv: 1000, commission: 80 })).toBe(0.08);
    expect(churnRate({ subscribers: 50, churnedSubscribers: 5 })).toBe(0.1);
    expect(
      ticketsPer100Residents({
        support: { tickets: 5, avgFirstResponseHours: null, avgResolutionHours: null },
        activeResidents: 100,
      }),
    ).toBe(5);
  });

  it("recommends per adoption and margin", () => {
    expect(moduleRecommendation({ module: "A", activeUsers: 30, revenue: 100, cost: 50 }, 100)).toBe("EXPAND");
    expect(moduleRecommendation({ module: "B", activeUsers: 5, revenue: 100, cost: 150 }, 100)).toBe("SUNSET");
    expect(moduleRecommendation({ module: "C", activeUsers: 15, revenue: 100, cost: 90 }, 100)).toBe("HOLD");
    expect(moduleRecommendation({ module: "D", activeUsers: 5, revenue: 0, cost: 0 }, 100)).toBe("INSUFFICIENT_DATA");
  });
});
