import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  validateTeamImageFile,
  getCachedTeamLogo,
  setCachedTeamLogo,
  MAX_TEAM_IMAGE_BYTES,
} from "./teamImageUtils";

describe("teamImageUtils Test Suite", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
    };
    Object.defineProperty(global, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    store = {};
  });

  describe("1. validateTeamImageFile", () => {
    it("returns error if no file is provided", () => {
      const res = validateTeamImageFile(null as any);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("No file selected");
    });

    it("rejects files exceeding 5MB limit", () => {
      const largeFile = new File(["x".repeat(100)], "logo.png", { type: "image/png" });
      Object.defineProperty(largeFile, "size", { value: MAX_TEAM_IMAGE_BYTES + 1024 });

      const res = validateTeamImageFile(largeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("exceeds the 5MB limit");
    });

    it("rejects non-image mime types", () => {
      const pdfFile = new File(["test"], "doc.pdf", { type: "application/pdf" });
      const res = validateTeamImageFile(pdfFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("valid image file");
    });

    it("accepts valid PNG, JPG, and WEBP image files", () => {
      const pngFile = new File(["test"], "team-badge.png", { type: "image/png" });
      expect(validateTeamImageFile(pngFile).valid).toBe(true);

      const jpgFile = new File(["test"], "crest.jpg", { type: "image/jpeg" });
      expect(validateTeamImageFile(jpgFile).valid).toBe(true);

      const webpFile = new File(["test"], "logo.webp", { type: "image/webp" });
      expect(validateTeamImageFile(webpFile).valid).toBe(true);
    });
  });

  describe("2. Team logo caching in localStorage", () => {
    it("stores and retrieves team logo by team name case-insensitively", () => {
      expect(getCachedTeamLogo("Royal Strikers")).toBeNull();

      setCachedTeamLogo("Royal Strikers", "https://s3.aws.com/mana/logos/team1.png");
      expect(getCachedTeamLogo("royal strikers")).toBe("https://s3.aws.com/mana/logos/team1.png");
      expect(getCachedTeamLogo("Royal Strikers")).toBe("https://s3.aws.com/mana/logos/team1.png");
      expect(getCachedTeamLogo("ROYAL STRIKERS")).toBe("https://s3.aws.com/mana/logos/team1.png");
    });

    it("handles null or empty keys gracefully", () => {
      expect(getCachedTeamLogo(null)).toBeNull();
      expect(getCachedTeamLogo("")).toBeNull();

      setCachedTeamLogo("", "some-url");
      setCachedTeamLogo("team", null);
      expect(getCachedTeamLogo("team")).toBeNull();
    });
  });
});
