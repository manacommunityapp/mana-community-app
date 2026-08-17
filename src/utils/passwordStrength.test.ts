import { describe, it, expect } from "vitest";
import { evaluatePassword, generateStrongPassword, MIN_ACCEPTABLE_SCORE } from "./passwordStrength";

const hasLetter = (s: string) => /[a-zA-Z]/.test(s);
const hasDigit = (s: string) => /[0-9]/.test(s);

describe("generateStrongPassword", () => {
  it("always produces a password between 4 and 8 characters with letters and numbers", () => {
    for (let i = 0; i < 200; i++) {
      const pw = generateStrongPassword(8);
      expect(pw.length).toBeGreaterThanOrEqual(4);
      expect(pw.length).toBeLessThanOrEqual(8);
      expect(hasLetter(pw), `letter in "${pw}"`).toBe(true);
      expect(hasDigit(pw), `digit in "${pw}"`).toBe(true);
      expect(evaluatePassword(pw).acceptable, `acceptable: "${pw}"`).toBe(true);
    }
  });

  it("honours a 4-8 character constraint", () => {
    expect(generateStrongPassword(4).length).toBe(4);
    expect(generateStrongPassword(6).length).toBe(6);
    expect(generateStrongPassword(8).length).toBe(8);
    expect(generateStrongPassword(16).length).toBe(8); // capped at 8
  });
});

describe("evaluatePassword — accepts 4 to 8 chars with alphabets & numbers", () => {
  it.each([
    ["a1b2", "4 chars alphanumeric"],
    ["Pass1", "5 chars alphanumeric"],
    ["User99", "6 chars alphanumeric"],
    ["Mana2026", "8 chars alphanumeric"],
    ["Xy9z4K2", "7 chars alphanumeric"],
  ])('accepts %s (%s)', (pw) => {
    const r = evaluatePassword(pw);
    expect(r.acceptable).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(MIN_ACCEPTABLE_SCORE);
  });
});

describe("evaluatePassword — rejects invalid length or missing alphabet/number", () => {
  it.each([
    ["a1", "too short (< 4 chars)"],
    ["123", "too short (< 4 chars)"],
    ["12345", "numbers only, no alphabet"],
    ["12345678", "numbers only, no alphabet"],
    ["abcd", "alphabets only, no number"],
    ["Password", "alphabets only, no number"],
    ["Password123", "too long (> 8 chars)"],
    ["ManaCommunity2026", "too long (> 8 chars)"],
    ["", "empty password"],
  ])('rejects %s (%s)', (pw) => {
    const r = evaluatePassword(pw);
    expect(r.acceptable).toBe(false);
  });
});
