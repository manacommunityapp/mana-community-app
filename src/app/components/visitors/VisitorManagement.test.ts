import { describe, it, expect } from "vitest";
import { buildVisitorInvitationText } from "./VisitorManagement";

describe("VisitorManagement - Invitation & Gate Pass Helpers", () => {
  it("formats visitor invitation text with all fields populated", () => {
    const text = buildVisitorInvitationText({
      visitorName: "Sunil Gavaskar",
      flatNumber: "B-804",
      passCode: "VP-982142",
      otpOnCreation: "482910",
    });

    expect(text).toContain("*Mana Community Gate Pass*");
    expect(text).toContain("Guest: Sunil Gavaskar");
    expect(text).toContain("Flat: B-804");
    expect(text).toContain("Pass Code: *VP-982142*");
    expect(text).toContain("Entry OTP: *482910*");
    expect(text).toContain("Valid for 12 hours from generation.");
    expect(text).toContain("Show this QR Code or OTP to the security guard");
  });

  it("handles fallback defaults gracefully when flat, code or OTP are missing", () => {
    const text = buildVisitorInvitationText({
      visitorName: "Anil Kumble",
    });

    expect(text).toContain("Guest: Anil Kumble");
    expect(text).toContain("Flat: A-1004");
    expect(text).toContain("Pass Code: **");
    expect(text).toContain("Entry OTP: *—*");
  });

  it("uses pass.otp when otpOnCreation is not set", () => {
    const text = buildVisitorInvitationText({
      visitorName: "Rahul Dravid",
      flatNumber: "C-1201",
      passCode: "VP-112233",
      otp: "998877",
    });

    expect(text).toContain("Entry OTP: *998877*");
    expect(text).toContain("Guest: Rahul Dravid");
    expect(text).toContain("Flat: C-1201");
  });
});
