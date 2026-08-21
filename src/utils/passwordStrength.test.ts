import { describe, it, expect } from "vitest";
import { evaluatePassword, generateStrongPassword, MIN_ACCEPTABLE_SCORE } from "./passwordStrength";

const hasLetter = (s: string) => /[a-zA-Z]/.test(s);
const hasDigit = (s: string) => /[0-9]/.test(s);

describe("generateStrongPassword", () => {
  it("always produces a password between 6 and 20 characters with letters and numbers", () => {
    for (let i = 0; i < 200; i++) {
      const pw = generateStrongPassword(10);
      expect(pw.length).toBeGreaterThanOrEqual(6);
      expect(pw.length).toBeLessThanOrEqual(20);
      expect(hasLetter(pw), `letter in "${pw}"`).toBe(true);
      expect(hasDigit(pw), `digit in "${pw}"`).toBe(true);
      expect(evaluatePassword(pw).acceptable, `acceptable: "${pw}"`).toBe(true);
    }
  });

  it("honours a 6-20 character constraint", () => {
    expect(generateStrongPassword(6).length).toBe(6);
    expect(generateStrongPassword(10).length).toBe(10);
    expect(generateStrongPassword(20).length).toBe(20);
    expect(generateStrongPassword(30).length).toBe(20); // capped at 20
  });
});

describe("evaluatePassword — accepts 6 to 20 chars with alphabets & numbers", () => {
  it.each([
    ["User99", "6 chars alphanumeric"],
    ["Mana2026", "8 chars alphanumeric"],
    ["Xy9z4K2", "7 chars alphanumeric"],
    ["Password123", "11 chars alphanumeric"],
    ["ManaCommunity2026", "17 chars alphanumeric"],
  ])('accepts %s (%s)', (pw) => {
    const r = evaluatePassword(pw);
    expect(r.acceptable).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(MIN_ACCEPTABLE_SCORE);
  });
});

describe("evaluatePassword — rejects invalid length or missing alphabet/number", () => {
  it.each([
    ["a1", "too short (< 6 chars)"],
    ["Pass1", "too short (5 chars)"],
    ["12345", "numbers only, no alphabet"],
    ["12345678", "numbers only, no alphabet"],
    ["abcdefgh", "alphabets only, no number"],
    ["PasswordLongerThanTwentyChars12345", "too long (> 20 chars)"],
    ["", "empty password"],
  ])('rejects %s (%s)', (pw) => {
    const r = evaluatePassword(pw);
    expect(r.acceptable).toBe(false);
  });
});
