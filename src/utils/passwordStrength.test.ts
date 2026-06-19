import { describe, it, expect } from "vitest";
import { evaluatePassword, generateStrongPassword, MIN_ACCEPTABLE_SCORE } from "./passwordStrength";

const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasLower = (s: string) => /[a-z]/.test(s);
const hasDigit = (s: string) => /[0-9]/.test(s);
const hasSpecial = (s: string) => /[^A-Za-z0-9]/.test(s);

describe("generateStrongPassword", () => {
  it("always produces a password that satisfies the policy and passes the gate", () => {
    for (let i = 0; i < 1000; i++) {
      const pw = generateStrongPassword(16);
      expect(pw, "length").toHaveLength(16);
      expect(hasUpper(pw), `uppercase in "${pw}"`).toBe(true);
      expect(hasLower(pw), `lowercase in "${pw}"`).toBe(true);
      expect(hasDigit(pw), `digit in "${pw}"`).toBe(true);
      expect(hasSpecial(pw), `special in "${pw}"`).toBe(true);
      expect(evaluatePassword(pw).acceptable, `acceptable: "${pw}"`).toBe(true);
    }
  });

  it("honours a minimum length floor of 12", () => {
    expect(generateStrongPassword(4).length).toBeGreaterThanOrEqual(12);
  });

  it("only uses special characters the backend PasswordPolicy also accepts", () => {
    // Backend SPECIALS set (PasswordPolicy.java)
    const backendSpecials = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`\"\\";
    for (let i = 0; i < 200; i++) {
      for (const ch of generateStrongPassword(16)) {
        if (hasSpecial(ch)) {
          expect(backendSpecials.includes(ch), `special "${ch}" must be backend-accepted`).toBe(true);
        }
      }
    }
  });
});

describe("evaluatePassword — rejects weak passwords", () => {
  it.each([
    ["Password123!", "common word with leet/affix"],
    ["P@ssw0rd", "leetspeak of 'password'"],
    ["qwerty123", "keyboard walk"],
    ["abcd1234", "sequence"],
    ["aaaaaaaa1!A", "repeated characters"],
    ["Welcome@1", "common word"],
    ["Admin@123", "common word"],
    ["12345678", "numeric sequence"],
  ])('rejects %s (%s)', (pw) => {
    const r = evaluatePassword(pw);
    expect(r.acceptable).toBe(false);
    expect(r.score).toBeLessThan(MIN_ACCEPTABLE_SCORE);
  });
});

describe("evaluatePassword — accepts strong passwords", () => {
  it.each([
    "Tz4@hNc8&rUm5pE",
    "Maple#River9Lantern!",
    "9xQ!mWr7$kVz2Lp",
  ])('accepts %s', (pw) => {
    const r = evaluatePassword(pw);
    expect(r.acceptable).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(MIN_ACCEPTABLE_SCORE);
  });
});

describe("evaluatePassword — penalises personal information", () => {
  it("rejects passwords containing the user's name or email tokens", () => {
    const r = evaluatePassword("Arjun2024!!", ["arjun.malhotra@email.com", "Arjun Malhotra"]);
    expect(r.acceptable).toBe(false);
    expect(r.warning).toMatch(/personal/i);
  });
});

describe("evaluatePassword — edge cases", () => {
  it("treats an empty password as weak and required", () => {
    const r = evaluatePassword("");
    expect(r.score).toBe(0);
    expect(r.acceptable).toBe(false);
  });
});
