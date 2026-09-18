/**
 * Sports Module Validation Utilities
 * Enforces Indian mobile number standards and strict email validation across sports components.
 */

/**
 * Validates an Indian phone number.
 * Accepts:
 * - 10-digit numbers starting with 6, 7, 8, or 9 (e.g. 9876543210)
 * - Prefixed with +91, 91, or 0 (e.g. +91 9876543210, 91-9876543210, 09876543210)
 */
export function isValidIndianPhone(phone?: string | null): boolean {
  if (!phone) return false;
  const clean = phone.trim().replace(/[\s\-\(\)]/g, "");
  // Matches optional +91, 91, or 0 followed by a 10-digit number starting with 6-9
  const indianPhoneRegex = /^(?:(?:\+|0{0,2})91)?[6-9]\d{9}$|^0[6-9]\d{9}$/;
  return indianPhoneRegex.test(clean);
}

/**
 * Validates Indian phone number or allows empty string/null/undefined.
 */
export function validateIndianPhoneOrEmpty(phone?: string | null): boolean {
  if (!phone || !phone.trim()) return true;
  return isValidIndianPhone(phone);
}

/**
 * Normalizes an Indian phone number to 10-digit standard.
 */
export function normalizeIndianPhone(phone?: string | null): string {
  if (!phone) return "";
  const clean = phone.trim().replace(/[\s\-\(\)]/g, "");
  const match = clean.match(/^(?:(?:\+|0{0,2})91|0)?([6-9]\d{9})$/);
  return match ? match[1] : clean;
}

/**
 * Validates standard email address format.
 */
export function isValidEmail(email?: string | null): boolean {
 if (!email) return false;
 const clean = email.trim();
 const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
 return emailRegex.test(clean);
}

/**
 * Validates email or allows empty string/null/undefined.
 */
export function validateEmailOrEmpty(email?: string | null): boolean {
 if (!email || !email.trim()) return true;
 return isValidEmail(email);
}
