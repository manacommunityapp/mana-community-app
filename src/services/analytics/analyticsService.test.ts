import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../common/apiClient", () => ({
  apiClient: { post: vi.fn().mockResolvedValue({}) },
  getToken: () => "t",
}));

import { analyticsService, sanitizeProps } from "./analyticsService";
import { apiClient } from "../common/apiClient";
import { privacyService } from "../privacy/privacyService";
import { isModuleEnabled } from "../../config/featureFlags";

describe("sanitizeProps", () => {
  it("drops PII keys and nested objects", () => {
    expect(
      sanitizeProps({ module: "sports", email: "a@b.c", phoneNumber: "1", nested: { a: 1 }, amount: 10 }),
    ).toEqual({ module: "sports", amount: 10 });
  });
});

const store: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => { store[k] = v; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
});

describe("analyticsService", () => {
  beforeEach(() => {
    analyticsService._reset();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("queues events", () => {
    analyticsService.track("signup_started");
    expect(analyticsService._queueLength()).toBe(1);
  });

  it("emits first_key_action once per user on a key action", () => {
    analyticsService.setContext({ userId: "u1" });
    analyticsService.track("booking_created");
    analyticsService.track("payment_succeeded");
    // booking_created + first_key_action + payment_succeeded (no second first_key_action)
    expect(analyticsService._queueLength()).toBe(3);
  });

  it("triggers first_key_action on secondary flow key actions (food, sports, cultural)", () => {
    analyticsService.setContext({ userId: "u_secondary_1" });
    analyticsService.track("food_order_completed", { module: "food_kitchen", amount: 250 });
    // food_order_completed + first_key_action
    expect(analyticsService._queueLength()).toBe(2);

    // Another key action for same user should not trigger second first_key_action
    analyticsService.track("sports_team_registered", { eventId: 10 });
    expect(analyticsService._queueLength()).toBe(3);

    // Cultural event ticket for another user
    analyticsService.setContext({ userId: "u_secondary_2" });
    analyticsService.track("cultural_registration_completed", { culturalEventId: 5 });
    // previous 3 + cultural_registration_completed + first_key_action
    expect(analyticsService._queueLength()).toBe(5);
  });

  it("drops queued events and sends nothing when ANALYTICS consent is revoked", async () => {
    vi.spyOn(privacyService, "getConsents").mockResolvedValue([
      { id: 1, purpose: "ANALYTICS", status: "REVOKED", noticeVersion: "1" },
    ]);
    analyticsService.track("signup_started");
    await analyticsService.flush();
    expect(apiClient.post).not.toHaveBeenCalled();
    expect(analyticsService._queueLength()).toBe(0);
  });

  it("sends events when consent is not revoked", async () => {
    vi.spyOn(privacyService, "getConsents").mockResolvedValue([]);
    analyticsService.track("signup_started");
    await analyticsService.flush();
    expect(apiClient.post).toHaveBeenCalledTimes(1);
  });

  it("respects opt-out", () => {
    localStorage.setItem("analytics_opt_out", "1");
    analyticsService.track("signup_started");
    expect(analyticsService._queueLength()).toBe(0);
  });
});

describe("isModuleEnabled", () => {
  it("enables everything when server does not restrict modules", () => {
    expect(isModuleEnabled("SPORTS", { enabledModules: null })).toBe(true);
  });
  it("restricts to listed modules, case-insensitively", () => {
    expect(isModuleEnabled("sports", { enabledModules: ["SPORTS"] })).toBe(true);
    expect(isModuleEnabled("food", { enabledModules: ["SPORTS"] })).toBe(false);
  });
});
