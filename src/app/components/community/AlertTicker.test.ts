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
      isNotificationDatePast("Christmas celebrations on December 25, 2026.")
    ).toBe(false);

    expect(
      isNotificationDatePast("Emergency water supply disruption in Block B.")
    ).toBe(false);
  });
});

import { getTournamentLifecycleStatus, mapTournamentToAlert } from "./AlertTicker";
import type { SportsTournament } from "../../../types/api";

describe("AlertTicker - Tournament Lifecycle & Prefix Mapping", () => {
  const mockTournament: SportsTournament = {
    id: 42,
    name: "LE Emperians Sports fest 2K26",
    registrationDateStart: "2026-10-15",
    registrationDateEnd: "2026-11-05",
    eventDateStart: "2026-11-14",
    eventDateEnd: "2027-01-24",
    startTime: "09:00",
    venueName: "Main Arena",
  };

  it("determines UPCOMING before registration opens", () => {
    const beforeRegNow = new Date("2026-10-10T10:00:00");
    const status = getTournamentLifecycleStatus(mockTournament, beforeRegNow);
    expect(status).toBe("UPCOMING");

    const alert = mapTournamentToAlert(mockTournament, 0, beforeRegNow);
    expect(alert).not.toBeNull();
    expect(alert?.message).toContain("🏆 [Upcoming Tournament]");
    expect(alert?.message).toContain("Reg opens");
    expect(alert?.actionUrl).toBe("/sports/tournaments");
  });

  it("determines REGISTRATION_OPEN while registration window is active", () => {
    const duringRegNow = new Date("2026-10-25T10:00:00");
    const status = getTournamentLifecycleStatus(mockTournament, duringRegNow);
    expect(status).toBe("REGISTRATION_OPEN");

    const alert = mapTournamentToAlert(mockTournament, 0, duringRegNow);
    expect(alert).not.toBeNull();
    expect(alert?.message).toContain("🏆 [Registration Open]");
    expect(alert?.message).toContain("Reg closes");
    expect(alert?.actionUrl).toBe("/sports/tournaments");
  });

  it("determines REGISTRATION_CLOSED after registration ends but before tournament starts", () => {
    // Current date: 11 Nov 2026 (Registration closed 05 Nov, Matches start 14 Nov)
    const afterRegNow = new Date("2026-11-11T10:00:00");
    const status = getTournamentLifecycleStatus(mockTournament, afterRegNow);
    expect(status).toBe("REGISTRATION_CLOSED");

    const alert = mapTournamentToAlert(mockTournament, 0, afterRegNow);
    expect(alert).not.toBeNull();
    expect(alert?.message).toContain("🏆 [Registration Closed]");
    expect(alert?.message).toContain("Matches start");
    expect(alert?.actionUrl).toBe("/sports/tournaments");
  });

  it("honors explicit REGISTRATION_CLOSED status from admin", () => {
    const explicitClosed: SportsTournament = {
      ...mockTournament,
      registrationStatus: "REGISTRATION_CLOSED",
    };
    const duringRegNow = new Date("2026-10-25T10:00:00");
    const status = getTournamentLifecycleStatus(explicitClosed, duringRegNow);
    expect(status).toBe("REGISTRATION_CLOSED");

    const alert = mapTournamentToAlert(explicitClosed, 0, duringRegNow);
    expect(alert?.message).toContain("🏆 [Registration Closed]");
  });

  it("determines MATCHES_RUNNING during tournament event dates", () => {
    const duringMatchesNow = new Date("2026-11-20T10:00:00");
    const status = getTournamentLifecycleStatus(mockTournament, duringMatchesNow);
    expect(status).toBe("MATCHES_RUNNING");

    const alert = mapTournamentToAlert(mockTournament, 0, duringMatchesNow);
    expect(alert).not.toBeNull();
    expect(alert?.message).toContain("🏆 [Matches Running]");
    expect(alert?.actionUrl).toBe("/sports/schedule");
  });

  it("excludes COMPLETED tournaments from ticker completely", () => {
    const explicitCompleted: SportsTournament = {
      ...mockTournament,
      registrationStatus: "COMPLETED",
    };
    const alert1 = mapTournamentToAlert(explicitCompleted, 0);
    expect(alert1).toBeNull();

    // After tournament event end date (24 Jan 2027)
    const afterTournamentNow = new Date("2027-01-25T10:00:00");
    const alert2 = mapTournamentToAlert(mockTournament, 0, afterTournamentNow);
    expect(alert2).toBeNull();
  });

  it("excludes CANCELLED and DRAFT tournaments from ticker completely", () => {
    const cancelled: SportsTournament = { ...mockTournament, registrationStatus: "CANCELLED" };
    expect(mapTournamentToAlert(cancelled, 0)).toBeNull();

    const draft: SportsTournament = { ...mockTournament, registrationStatus: "DRAFT" };
    expect(mapTournamentToAlert(draft, 0)).toBeNull();
  });
});
