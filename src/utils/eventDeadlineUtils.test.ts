import { describe, it, expect } from "vitest";
import {
  extractTimeComponents,
  parseFlexibleDateTime,
  isRegistrationClosed,
  isPoojaSlotPassed,
} from "./eventDeadlineUtils";

describe("eventDeadlineUtils", () => {
  it("extracts time components from ranges and formats", () => {
    expect(extractTimeComponents("08:30 AM – 10:00 AM")).toEqual({ hours: 10, minutes: 0 });
    expect(extractTimeComponents("06:30 PM")).toEqual({ hours: 18, minutes: 30 });
    expect(extractTimeComponents("18:00")).toEqual({ hours: 18, minutes: 0 });
  });

  it("identifies past dates/deadlines as closed", () => {
    const pastEvent = {
      title: "Past Event",
      registrationEndDate: "2020-01-01",
      registrationEndTime: "18:00",
    };
    expect(isRegistrationClosed(pastEvent)).toBe(true);

    const pastStatusEvent = {
      title: "Closed Status Event",
      status: "CLOSED",
    };
    expect(isRegistrationClosed(pastStatusEvent)).toBe(true);
  });

  it("identifies future events as open", () => {
    const futureEvent = {
      title: "Future Event",
      registrationEndDate: "2099-12-31",
      registrationEndTime: "23:59",
    };
    expect(isRegistrationClosed(futureEvent)).toBe(false);
  });

  it("checks pooja slot passed correctly", () => {
    expect(isPoojaSlotPassed("2020-01-01", "08:30 AM")).toBe(true);
    expect(isPoojaSlotPassed("2099-01-01", "08:30 AM")).toBe(false);
  });
});
