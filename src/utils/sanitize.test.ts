import { describe, it, expect } from "vitest";
import { escapeHtml, sanitizeHref, isSafeRedirectUrl } from "./sanitize";

describe("Sanitization Utilities", () => {
  describe("escapeHtml", () => {
    it("should escape basic HTML entities", () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it("should escape single quotes and ampersands", () => {
      const input = "Tom & Jerry's";
      const expected = "Tom &amp; Jerry&#39;s";
      expect(escapeHtml(input)).toBe(expected);
    });

    it("should handle null and undefined safely", () => {
      expect(escapeHtml(null)).toBe("");
      expect(escapeHtml(undefined)).toBe("");
    });

    it("should handle numbers and booleans safely", () => {
      expect(escapeHtml(42)).toBe("42");
      expect(escapeHtml(false)).toBe("false");
    });
  });

  describe("sanitizeHref", () => {
    it("should allow safe http/https URLs", () => {
      expect(sanitizeHref("https://example.com/page?a=1&b=2")).toBe("https://example.com/page?a=1&b=2");
      expect(sanitizeHref("http://example.com")).toBe("http://example.com");
    });

    it("should allow safe relative paths", () => {
      expect(sanitizeHref("/dashboard/events")).toBe("/dashboard/events");
      expect(sanitizeHref("/events?id=123")).toBe("/events?id=123");
    });

    it("should allow safe mailto and tel schemes", () => {
      expect(sanitizeHref("mailto:admin@example.com")).toBe("mailto:admin@example.com");
      expect(sanitizeHref("tel:+1234567890")).toBe("tel:+1234567890");
    });

    it("should block javascript: URLs", () => {
      expect(sanitizeHref("javascript:alert(1)")).toBe("#");
      expect(sanitizeHref("javascript:/*evil*/alert(1)")).toBe("#");
      expect(sanitizeHref("  javascript:alert(1)  ")).toBe("#");
      expect(sanitizeHref("JAVASCRIPT:alert(1)")).toBe("#");
    });

    it("should block data: and vbscript: URLs", () => {
      expect(sanitizeHref("data:text/html,<script>alert(1)</script>")).toBe("#");
      expect(sanitizeHref("vbscript:msgbox(1)")).toBe("#");
    });

    it("should block protocol-relative URLs", () => {
      expect(sanitizeHref("//evil.com")).toBe("#");
      expect(sanitizeHref("/\\evil.com")).toBe("#");
    });

    it("should return # for null, undefined, and empty string", () => {
      expect(sanitizeHref(null)).toBe("#");
      expect(sanitizeHref(undefined)).toBe("#");
      expect(sanitizeHref("")).toBe("#");
      expect(sanitizeHref("   ")).toBe("#");
    });
  });

  describe("isSafeRedirectUrl", () => {
    it("should allow safe relative paths", () => {
      expect(isSafeRedirectUrl("/events")).toBe(true);
      expect(isSafeRedirectUrl("/sports/tournament/1")).toBe(true);
    });

    it("should allow safe absolute URLs", () => {
      expect(isSafeRedirectUrl("https://example.com/checkout")).toBe(true);
      expect(isSafeRedirectUrl("http://localhost:8080")).toBe(true);
    });

    it("should reject javascript: URLs", () => {
      expect(isSafeRedirectUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeRedirectUrl("javascript://example.com/%0Aalert(1)")).toBe(false);
    });

    it("should reject protocol-relative URLs", () => {
      expect(isSafeRedirectUrl("//evil.com")).toBe(false);
      expect(isSafeRedirectUrl("/\\evil.com")).toBe(false);
    });

    it("should reject empty or null inputs", () => {
      expect(isSafeRedirectUrl(null)).toBe(false);
      expect(isSafeRedirectUrl(undefined)).toBe(false);
      expect(isSafeRedirectUrl("")).toBe(false);
    });
  });
});
