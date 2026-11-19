import { describe, it, expect } from "vitest";
import { resolveTargetVenueId } from "./SetupSchedule";

describe("SetupSchedule Venue Configuration Auto-Selection", () => {
  const mockVenuesList = [
    { id: 10, name: "Badminton Court Main Clubhouse" },
    { id: 20, name: "Tennis Court A" },
    { id: 30, name: "Squash Court 1" },
  ];

  it("prioritizes venue ID from full sports event object (fe.venue.id)", () => {
    const fullEvent = { venue: { id: 10 } };
    const existingConfig = { venueId: 20 };
    const eventInfo = { venueId: 30 };

    const resolved = resolveTargetVenueId(fullEvent, existingConfig, eventInfo, mockVenuesList);
    expect(resolved).toBe(10);
  });

  it("falls back to fullEvent.venueId if fullEvent.venue.id is not present", () => {
    const fullEvent = { venueId: 10 };
    const existingConfig = { venueId: 20 };
    const eventInfo = { venueId: 30 };

    const resolved = resolveTargetVenueId(fullEvent, existingConfig, eventInfo, mockVenuesList);
    expect(resolved).toBe(10);
  });

  it("falls back to existingConfig.venueId if fullEvent has no venue", () => {
    const fullEvent = null;
    const existingConfig = { venueId: 20 };
    const eventInfo = { venueId: 30 };

    const resolved = resolveTargetVenueId(fullEvent, existingConfig, eventInfo, mockVenuesList);
    expect(resolved).toBe(20);
  });

  it("falls back to eventInfo.venueId from dropdown list when no full event or existing config", () => {
    const fullEvent = null;
    const existingConfig = null;
    const eventInfo = { venueId: 30 };

    const resolved = resolveTargetVenueId(fullEvent, existingConfig, eventInfo, mockVenuesList);
    expect(resolved).toBe(30);
  });

  it("ignores invalid or 0 IDs and continues falling back", () => {
    const fullEvent = { venue: { id: 0 } };
    const existingConfig = { venueId: 0 };
    const eventInfo = { venueId: 30 };

    const resolved = resolveTargetVenueId(fullEvent as any, existingConfig, eventInfo, mockVenuesList);
    expect(resolved).toBe(30);
  });

  it("matches venue by exact name when venue ID is not linked", () => {
    const fullEvent = { venueName: "Tennis Court A" };
    const existingConfig = null;
    const eventInfo = null;

    const resolved = resolveTargetVenueId(fullEvent, existingConfig, eventInfo, mockVenuesList);
    expect(resolved).toBe(20);
  });

  it("matches venue by prefix name (e.g. name with address)", () => {
    const fullEvent = { venueName: "Badminton Court Main Clubhouse, Tower 3, Floor 1" };
    const existingConfig = null;
    const eventInfo = null;

    const resolved = resolveTargetVenueId(fullEvent, existingConfig, eventInfo, mockVenuesList);
    expect(resolved).toBe(10);
  });

  it("returns null when no venue information is present anywhere", () => {
    const fullEvent = null;
    const existingConfig = null;
    const eventInfo = null;

    const resolved = resolveTargetVenueId(fullEvent, existingConfig, eventInfo, mockVenuesList);
    expect(resolved).toBeNull();
  });
});
