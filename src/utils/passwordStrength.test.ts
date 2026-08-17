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

describe("evaluatePassword — simplified creation policy accepts basic passwords", () => {
  it.each([
    ["1234", "simple 4-digit numeric password"],
    ["pass", "simple 4-letter word"],
    ["Password123!", "standard password"],
    ["qwerty123", "common pattern"],
    ["Admin@123", "standard user password"],
  ])('accepts %s (%s)', (pw) => {
    const r = evaluatePassword(pw);
    expect(r.acceptable).toBe(true);
  });
});

describe("evaluatePassword — accepts strong passwords with high scores", () => {
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

describe("evaluatePassword — edge cases", () => {
  it("rejects empty password and passwords with less than 4 characters", () => {
    const empty = evaluatePassword("");
    expect(empty.score).toBe(0);
    expect(empty.acceptable).toBe(false);

    const short = evaluatePassword("abc");
    expect(short.score).toBe(0);
    expect(short.acceptable).toBe(false);
  });
});
