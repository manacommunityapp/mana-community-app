import { describe, it, expect } from "vitest";
import { isSchedulableEvent, isRegistrationOpenStatus } from "./SetupSchedule";

describe("SetupSchedule - Open & Closed Tournament Scheduling Eligibility", () => {
  it("allows scheduling for open registration statuses", () => {
    expect(isSchedulableEvent({ status: "OPEN" })).toBe(true);
    expect(isSchedulableEvent({ status: "REGISTRATION_OPEN" })).toBe(true);
    expect(isSchedulableEvent({ status: "registration_open" })).toBe(true);
  });

  it("allows scheduling for closed, active, live, upcoming, and completed statuses", () => {
    for (const status of [
      "REGISTRATION_CLOSED",
      "CLOSED",
      "ACTIVE",
      "LIVE",
      "IN_PROGRESS",
      "MATCHES_RUNNING",
      "UPCOMING",
      "COMPLETED",
      "",
      null,
      undefined,
    ]) {
      expect(isSchedulableEvent({ status })).toBe(true);
    }
  });

  it("excludes DRAFT and CANCELLED events from scheduling", () => {
    expect(isSchedulableEvent({ status: "DRAFT" })).toBe(false);
    expect(isSchedulableEvent({ status: "draft" })).toBe(false);
    expect(isSchedulableEvent({ status: "CANCELLED" })).toBe(false);
    expect(isSchedulableEvent({ status: " cancelled " })).toBe(false);
  });

  it("identifies open registration status accurately", () => {
    expect(isRegistrationOpenStatus("OPEN")).toBe(true);
    expect(isRegistrationOpenStatus("REGISTRATION_OPEN")).toBe(true);
    expect(isRegistrationOpenStatus("registration_open")).toBe(true);
    expect(isRegistrationOpenStatus("REGISTRATION_CLOSED")).toBe(false);
    expect(isRegistrationOpenStatus("CLOSED")).toBe(false);
    expect(isRegistrationOpenStatus("COMPLETED")).toBe(false);
  });
});
