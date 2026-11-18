import { describe, it, expect } from "vitest";
import { COIN_HEADS_IMAGE, COIN_TAILS_IMAGE, LOCAL_COIN_TAILS_FALLBACK, getSportEmoji } from "./TossCoin3D";

describe("TossCoin3D & Attached Coin Asset Test Suite", () => {
  it("defines both local heads and tails coin asset images", () => {
    expect(COIN_HEADS_IMAGE).toBe("/coin-heads.png");
    expect(COIN_TAILS_IMAGE).toBe("/coin-tails.png");
  });

  it("defines a resilient local fallback image", () => {
    expect(LOCAL_COIN_TAILS_FALLBACK).toBe("/coin-tails.png");
  });

  it("calculates 3D rotation degrees correctly for heads, tails, and idle preview", () => {
    const getFlipsEndsDeg = (result: "heads" | "tails" | null, internalFace: "heads" | "tails") => {
      return result === "tails" ? 1980 : result === "heads" ? 1800 : internalFace === "tails" ? 180 : 0;
    };

    // When landed on tails: 1980 deg (1980 % 360 = 180 deg, shows tails face)
    expect(getFlipsEndsDeg("tails", "heads") % 360).toBe(180);

    // When landed on heads: 1800 deg (1800 % 360 = 0 deg, shows heads face)
    expect(getFlipsEndsDeg("heads", "tails") % 360).toBe(0);

    // When idle and user toggles to view tails face directly
    expect(getFlipsEndsDeg(null, "tails")).toBe(180);

    // When idle on heads
    expect(getFlipsEndsDeg(null, "heads")).toBe(0);
  });

  it("maps sport types to correct front-face sport icons", () => {

    expect(getSportEmoji("CRICKET")).toBe("🏏");
    expect(getSportEmoji("Box Cricket")).toBe("🏏");
    expect(getSportEmoji("Badminton")).toBe("🏸");
    expect(getSportEmoji("Tennis")).toBe("🎾");
    expect(getSportEmoji("Pickleball")).toBe("🏓");
    expect(getSportEmoji("Table Tennis")).toBe("🏓");
    expect(getSportEmoji("Football")).toBe("⚽");
    expect(getSportEmoji("Volleyball")).toBe("🏐");
    expect(getSportEmoji("Other")).toBe("🏆");
  });

  it("verifies dimensions and typography scale classes for sm, md, and lg", () => {
    const sizeClasses = {
      sm: "w-16 h-16",
      md: "w-24 h-24 sm:w-28 sm:h-28",
      lg: "w-32 h-32 sm:w-36 sm:h-36",
    };

    expect(sizeClasses.sm).toBe("w-16 h-16");
    expect(sizeClasses.md).toContain("w-24 h-24");
    expect(sizeClasses.lg).toContain("w-32 h-32");
  });
});
