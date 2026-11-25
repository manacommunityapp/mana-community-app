import { describe, it, expect, vi } from "vitest";
import { hexToRgba, truncateText, wrapText, buildStoryCardShareText, type StoryCardData } from "./StoryCardModal";

describe("StoryCardModal Helpers", () => {
  describe("hexToRgba", () => {
    it("converts 6-digit hex color with alpha", () => {
      expect(hexToRgba("#10B981", 0.5)).toBe("rgba(16, 185, 129, 0.5)");
      expect(hexToRgba("#000000", 1)).toBe("rgba(0, 0, 0, 1)");
      expect(hexToRgba("#FFFFFF", 0.2)).toBe("rgba(255, 255, 255, 0.2)");
    });

    it("converts 3-digit hex color with alpha", () => {
      expect(hexToRgba("#FFF", 0.8)).toBe("rgba(255, 255, 255, 0.8)");
    });
  });

  describe("buildStoryCardShareText", () => {
    it("formats story card share text with title, subtitle, stats and community", () => {
      const data: StoryCardData = {
        type: "MATCH",
        title: "Titans vs Strikers",
        subtitle: "Final Match • Ground 1",
        statusBadge: "TITANS WON BY 14 RUNS",
        communityName: "Green Meadows",
        stats: [
          { label: "TITANS", value: "142/6" },
          { label: "STRIKERS", value: "128/9" },
        ],
      };

      const shareText = buildStoryCardShareText(data);
      expect(shareText).toContain("*Titans vs Strikers*");
      expect(shareText).toContain("Final Match • Ground 1");
      expect(shareText).toContain("🏆 TITANS WON BY 14 RUNS");
      expect(shareText).toContain("TITANS: 142/6 | STRIKERS: 128/9");
      expect(shareText).toContain("📍 Green Meadows");
      expect(shareText).toContain("Shared via Mana Community App");
    });
  });

  describe("truncateText", () => {
    it("returns original text if width fits", () => {
      const ctx = {
        measureText: vi.fn().mockReturnValue({ width: 50 }),
      } as unknown as CanvasRenderingContext2D;

      expect(truncateText(ctx, "Short Text", 100)).toBe("Short Text");
    });

    it("truncates text and appends ellipsis if width exceeds maxWidth", () => {
      const ctx = {
        measureText: vi.fn().mockImplementation((str: string) => ({ width: str.length * 10 })),
      } as unknown as CanvasRenderingContext2D;

      const result = truncateText(ctx, "A Very Long Heading That Needs Truncation", 100);
      expect(result.endsWith("...")).toBe(true);
      expect(result.length).toBeLessThan("A Very Long Heading That Needs Truncation".length);
    });
  });

  describe("wrapText", () => {
    it("wraps words within maxWidth", () => {
      const ctx = {
        measureText: vi.fn().mockImplementation((str: string) => ({ width: str.length * 5 })),
      } as unknown as CanvasRenderingContext2D;

      const wrapped = wrapText(ctx, "Hello World from Mana Community", 60, 3);
      expect(wrapped.length).toBeGreaterThan(1);
      expect(wrapped.join(" ")).toContain("Hello");
    });
  });
});
