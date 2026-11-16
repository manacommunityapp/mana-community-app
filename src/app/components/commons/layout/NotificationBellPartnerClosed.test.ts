import { describe, it, expect } from "vitest";
import {
  getPartnerRegistrationId,
  isPartnerInviteActionable,
} from "./NotificationBell";

describe("NotificationBell - Partner Invitation Closed / Reopening Lifecycle", () => {
  describe("getPartnerRegistrationId", () => {
    it("extracts registrationId from JSON metadata", () => {
      const notif: any = {
        id: 1,
        title: "Doubles Partner Invitation — Table Tennis",
        metadata: JSON.stringify({ registrationId: 555, eventId: 10 }),
      };
      expect(getPartnerRegistrationId(notif)).toBe(555);
    });

    it("falls back to parsing confirmPartner= from actionUrl", () => {
      const notif: any = {
        id: 2,
        title: "Doubles Partner Invitation",
        actionUrl: "/sports?tab=my-sports&confirmPartner=777",
      };
      expect(getPartnerRegistrationId(notif)).toBe(777);
    });

    it("returns null when no registrationId is present", () => {
      const notif: any = {
        id: 3,
        title: "General Notification",
        actionUrl: "/sports",
      };
      expect(getPartnerRegistrationId(notif)).toBeNull();
    });
  });

  describe("isPartnerInviteActionable (Lifecycle: Open -> Closed -> Reopened -> Closed)", () => {
    it("is actionable when event is open (isRegistrationOpen: true)", () => {
      const meta = { isRegistrationOpen: true, status: "REGISTRATION_OPEN" };
      expect(isPartnerInviteActionable(meta)).toBe(true);
    });

    it("is NOT actionable when event is closed (isRegistrationOpen: false)", () => {
      const meta = { isRegistrationOpen: false, status: "REGISTRATION_CLOSED" };
      expect(isPartnerInviteActionable(meta)).toBe(false);
    });

    it("is NOT actionable when event status is COMPLETED or CANCELLED", () => {
      expect(isPartnerInviteActionable({ status: "COMPLETED" })).toBe(false);
      expect(isPartnerInviteActionable({ status: "CANCELLED" })).toBe(false);
    });

    it("is NOT actionable when tournament registrationStatus is REGISTRATION_CLOSED", () => {
      const meta = { registrationStatus: "REGISTRATION_CLOSED" };
      expect(isPartnerInviteActionable(meta)).toBe(false);
    });

    it("dynamically returns true when event is reopened by organizer", () => {
      // Step 1: Open
      const metaState: { isRegistrationOpen: boolean; status: string } = {
        isRegistrationOpen: true,
        status: "REGISTRATION_OPEN",
      };
      expect(isPartnerInviteActionable(metaState)).toBe(true);

      // Step 2: Closed by admin
      metaState.isRegistrationOpen = false;
      metaState.status = "REGISTRATION_CLOSED";
      expect(isPartnerInviteActionable(metaState)).toBe(false);

      // Step 3: Reopened by admin (e.g. deadline extended)
      metaState.isRegistrationOpen = true;
      metaState.status = "REGISTRATION_OPEN";
      expect(isPartnerInviteActionable(metaState)).toBe(true);

      // Step 4: Closed again
      metaState.isRegistrationOpen = false;
      metaState.status = "REGISTRATION_CLOSED";
      expect(isPartnerInviteActionable(metaState)).toBe(false);
    });

    it("defaults to true if metadata is not yet loaded (optimistic)", () => {
      expect(isPartnerInviteActionable(undefined)).toBe(true);
    });
  });
});
