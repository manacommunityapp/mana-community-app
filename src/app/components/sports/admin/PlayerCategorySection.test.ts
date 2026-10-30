import { describe, it, expect } from "vitest";
import { PLAYER_CATEGORY_TYPES } from "./PlayerCategorySection";
import type { PlayerCategoryType } from "./PlayerCategorySection";

describe("PlayerCategorySection - Category Types", () => {
  it("includes MIXED in PLAYER_CATEGORY_TYPES", () => {
    expect(PLAYER_CATEGORY_TYPES).toContain("MIXED");
  });

  it("contains all standard category types in correct casing and without duplicates", () => {
    const expectedTypes: PlayerCategoryType[] = [
      "MENS",
      "WOMENS",
      "BOYS",
      "GIRLS",
      "KIDS",
      "SENIORS",
      "MIXED",
    ];

    expect([...PLAYER_CATEGORY_TYPES]).toEqual(expectedTypes);
    const uniqueTypes = new Set(PLAYER_CATEGORY_TYPES);
    expect(uniqueTypes.size).toBe(PLAYER_CATEGORY_TYPES.length);
  });
});
