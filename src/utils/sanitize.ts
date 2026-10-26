/**
 * Security sanitization utilities for preventing Cross-Site Scripting (XSS),
 * dangerous protocol injection (e.g. javascript:), and unvalidated redirects.
 */

/**
 * Escapes characters with special meaning in HTML to prevent HTML injection and Stored/DOM XSS.
 * Use this whenever interpolating untrusted or dynamic strings into raw HTML templates
 * (e.g., inside document.write or innerHTML).
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sanitizes URLs intended for <a href={...}> attributes.
 * Allows safe protocols (http, https, mailto, tel) and safe relative paths (/path).
 * Blocks dangerous schemes such as javascript:, vbscript:, data:, and protocol-relative (//).
 * Defaults to "#" if invalid or unsafe.
 */
export function sanitizeHref(url?: string | null): string {
  if (!url || typeof url !== "string") return "#";
  const trimmed = url.trim();
  if (!trimmed) return "#";

  // Prevent protocol-relative URLs (e.g., //evil.com) and backslash bypasses (/\\evil.com)
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.startsWith("\\\\")) {
    return "#";
  }

  // Safe relative paths starting with /
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // Whitelisted schemes
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  return "#";
}

/**
 * Validates whether a URL is safe to assign to window.location.href or window.location.assign.
 * Ensures the target is either a safe relative path or an absolute http:/https: URL.
 * Strictly prevents javascript: protocol execution.
 */
export function isSafeRedirectUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Prevent protocol-relative URLs and backslash evasions
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.startsWith("\\\\")) {
    return false;
  }

  // Allow relative URLs starting with a single forward slash
  if (trimmed.startsWith("/")) {
    return true;
  }

  // Allow only http: and https: protocols
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
