import { describe, it, expect } from "vitest";
import {
  formatIndianTime,
  formatIndianDate,
  formatIndianDateTime,
  isEndTimeBeforeOrEqualStartTime,
  validateTimeRangeIST,
  getNowInIST,
  isSlotPassedIST,
} from "./indianDateTimeUtils";

describe("indianDateTimeUtils", () => {
  describe("formatIndianTime", () => {
    it("formats 24-hour time to Indian 12-hour format with AM/PM", () => {
      expect(formatIndianTime("09:00")).toBe("09:00 AM");
      expect(formatIndianTime("18:30")).toBe("06:30 PM");
      expect(formatIndianTime("12:00")).toBe("12:00 PM");
      expect(formatIndianTime("00:00")).toBe("12:00 AM");
      expect(formatIndianTime("12:30")).toBe("12:30 PM");
      expect(formatIndianTime("23:59")).toBe("11:59 PM");
    });

    it("formats time ranges to Indian 12-hour AM/PM format", () => {
      expect(formatIndianTime("09:00 - 10:30")).toBe("09:00 AM – 10:30 AM");
      expect(formatIndianTime("08:30 – 11:00")).toBe("08:30 AM – 11:00 AM");
    });

    it("handles already formatted 12-hour strings cleanly", () => {
      expect(formatIndianTime("09:00 AM")).toBe("09:00 AM");
      expect(formatIndianTime("6:30 pm")).toBe("06:30 PM");
    });

    it("returns empty string for null or undefined", () => {
      expect(formatIndianTime(null)).toBe("");
      expect(formatIndianTime(undefined)).toBe("");
      expect(formatIndianTime("")).toBe("");
    });
  });

  describe("formatIndianDate", () => {
    it("formats date strings in Indian standard formats", () => {
      expect(formatIndianDate("2026-08-29", "short")).toBe("29 Aug 2026");
      expect(formatIndianDate("2026-08-29", "numeric")).toBe("29/08/2026");
    });
  });

  describe("formatIndianDateTime", () => {
    it("formats combined date and time in Indian format", () => {
      expect(formatIndianDateTime("2026-08-29", "18:30")).toBe("29 Aug 2026, 06:30 PM");
      expect(formatIndianDateTime("2026-08-29", "09:00")).toBe("29 Aug 2026, 09:00 AM");
    });
  });

  describe("time range validation in IST", () => {
    it("validates that end time must be strictly after start time", () => {
      expect(validateTimeRangeIST("09:00", "10:30").isValid).toBe(true);
      expect(validateTimeRangeIST("18:00", "17:00").isValid).toBe(false);
      expect(validateTimeRangeIST("09:00", "09:00").isValid).toBe(false);
    });

    it("evaluates isEndTimeBeforeOrEqualStartTime accurately", () => {
      expect(isEndTimeBeforeOrEqualStartTime("09:00", "08:30")).toBe(true);
      expect(isEndTimeBeforeOrEqualStartTime("09:00", "09:00")).toBe(true);
      expect(isEndTimeBeforeOrEqualStartTime("09:00", "10:00")).toBe(false);
    });
  });

  describe("getNowInIST & isSlotPassedIST", () => {
    it("returns valid IST date", () => {
      const istNow = getNowInIST();
      expect(istNow instanceof Date).toBe(true);
      expect(isNaN(istNow.getTime())).toBe(false);
    });

    it("evaluates passed slots correctly", () => {
      expect(isSlotPassedIST("2020-01-01", "10:00")).toBe(true);
      expect(isSlotPassedIST("2099-01-01", "10:00")).toBe(false);
    });
  });
});
