import { describe, it, expect } from "vitest";
import { getEventDateStatus, isNotificationDatePast } from "./AlertTicker";

describe("AlertTicker - Date Filtering & Status Determination", () => {
  const referenceNow = new Date("2026-10-27T12:00:00.000Z");

  it("marks past single-day events as PAST", () => {
    // September 14, 2026 (Vinayaka Chavithi) is past relative to October 27, 2026
    const res = getEventDateStatus("2026-09-14", null, null, null, referenceNow);
    expect(res.status).toBe("PAST");
  });

  it("marks past multi-day events as PAST", () => {
    const res = getEventDateStatus("2026-10-01", "2026-10-05", null, null, referenceNow);
    expect(res.status).toBe("PAST");
  });

  it("marks currently running multi-day events as RUNNING", () => {
    const res = getEventDateStatus("2026-10-25", "2026-10-30", null, null, referenceNow);
    expect(res.status).toBe("RUNNING");
    expect(res.label).toBe("Happening Now");
  });

  it("marks future events as UPCOMING", () => {
    const res = getEventDateStatus("2026-11-08", "2026-11-12", null, null, referenceNow);
    expect(res.status).toBe("UPCOMING");
    expect(res.label).toBe("Upcoming");
  });

  it("marks single-day events happening today as RUNNING", () => {
    const res = getEventDateStatus("2026-10-27", null, null, null, referenceNow);
    expect(res.status).toBe("RUNNING");
  });

  it("correctly identifies past dates mentioned in notification text", () => {
    expect(
      isNotificationDatePast("🕉️ Upcoming Grand Festival: Vinayaka Chavithi on September 14, 2026.")
    ).toBe(true);

    expect(
      isNotificationDatePast("Community Ganesh Utsav: Mandap setup commences for September 14, 2026.")
    ).toBe(true);
  });

  it("returns false for future dates or general notifications", () => {
    expect(
      isNotificationDatePast("Diwali Deepotsavam celebrations on November 8, 2026.")
    ).toBe(false);

    expect(
      isNotificationDatePast("Emergency water supply disruption in Block B.")
    ).toBe(false);
  });
});
