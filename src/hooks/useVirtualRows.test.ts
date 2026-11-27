import { describe, it, expect } from "vitest";
import { computeVirtualWindow } from "./useVirtualRows";

describe("useVirtualRows / computeVirtualWindow", () => {
  it("skips virtualization below threshold so small lists have zero spacer overhead", () => {
    const res = computeVirtualWindow({
      totalCount: 25,
      scrollTop: 0,
      viewportHeight: 500,
      rowHeight: 50,
      virtualizeThreshold: 50,
    });

    expect(res.isVirtualized).toBe(false);
    expect(res.startIndex).toBe(0);
    expect(res.endIndex).toBe(25);
    expect(res.topSpacerHeight).toBe(0);
    expect(res.bottomSpacerHeight).toBe(0);
  });

  it("windows 5,000 rows down to viewport + overscan and computes exact spacers", () => {
    // At scrollTop = 5,000px with rowHeight = 50px -> visible starts at row 100
    // viewportHeight = 500px -> 10 visible rows (100..110), overscan = 5 -> (95..115)
    const res = computeVirtualWindow({
      totalCount: 5000,
      scrollTop: 5000,
      viewportHeight: 500,
      rowHeight: 50,
      overscan: 5,
      virtualizeThreshold: 50,
    });

    expect(res.isVirtualized).toBe(true);
    expect(res.startIndex).toBe(95);
    expect(res.endIndex).toBe(115);
    expect(res.topSpacerHeight).toBe(95 * 50);
    expect(res.bottomSpacerHeight).toBe((5000 - 115) * 50);
    // Total scrollable height stays strictly 5000 * 50px
    expect(
      res.topSpacerHeight + (res.endIndex - res.startIndex) * 50 + res.bottomSpacerHeight
    ).toBe(5000 * 50);
  });

  it("clamps cleanly at bottom of scroll range without negative spacer height", () => {
    const res = computeVirtualWindow({
      totalCount: 200,
      scrollTop: 99999,
      viewportHeight: 500,
      rowHeight: 50,
      overscan: 4,
      virtualizeThreshold: 50,
    });

    expect(res.endIndex).toBe(200);
    expect(res.bottomSpacerHeight).toBe(0);
  });
});
