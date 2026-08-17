/**
 * Frontend password-strength evaluator for 4–8 character passwords with alphabet & number combination.
 */

export const MIN_ACCEPTABLE_SCORE = 1;

export interface PasswordStrength {
  /** 0 (weakest) … 4 (strongest). */
  score: number;
  /** UI label for the score. */
  label: "Weak" | "Fair" | "Good" | "Strong" | "Very strong";
  /** Short warning about the biggest problem, if any. */
  warning: string | null;
  /** Actionable tips. */
  suggestions: string[];
  /** True when password is 4–8 characters with letters & numbers combination. */
  acceptable: boolean;
}

const LABELS = ["Weak", "Fair", "Good", "Strong", "Very strong"] as const;

// Character sets
const GEN_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const GEN_DIGITS = "23456789";

/** Cryptographically-strong random integer in [0, max). */
function secureRandInt(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

function pick(set: string): string {
  return set.charAt(secureRandInt(set.length));
}

/**
 * Generates a password between 4 and 8 characters containing a combination of letters and digits. Default length 8.
 */
export function generateStrongPassword(length = 8): string {
  const safeLength = Math.min(8, Math.max(4, length));
  const all = GEN_LETTERS + GEN_DIGITS;

  for (let attempt = 0; attempt < 50; attempt++) {
    // Guarantee at least 1 letter and 1 digit
    const chars = [pick(GEN_LETTERS), pick(GEN_DIGITS)];
    while (chars.length < safeLength) chars.push(pick(all));

    // Fisher–Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = secureRandInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    const candidate = chars.join("");
    if (evaluatePassword(candidate).acceptable) return candidate;
  }

  return "Abc12345".slice(0, safeLength);
}

export function evaluatePassword(password: string, userInputs: string[] = []): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: "Weak",
      warning: "Password is required.",
      suggestions: ["Enter a password between 4 and 8 characters with letters and numbers."],
      acceptable: false,
    };
  }

  const len = password.length;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (len < 4) {
    return {
      score: 0,
      label: "Weak",
      warning: "Password must be at least 4 characters.",
      suggestions: ["Use 4 to 8 characters with letters and numbers."],
      acceptable: false,
    };
  }

  if (len > 8) {
    return {
      score: 1,
      label: "Fair",
      warning: "Password cannot exceed 8 characters.",
      suggestions: ["Keep password between 4 and 8 characters."],
      acceptable: false,
    };
  }

  if (!hasLetter || !hasDigit) {
    return {
      score: 1,
      label: "Weak",
      warning: "Must contain both letters and numbers.",
      suggestions: [!hasLetter ? "Add at least one letter." : "Add at least one number."],
      acceptable: false,
    };
  }

  // Valid 4-8 chars with letters & numbers
  let score = 2; // Base score: Good
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (len >= 6 && len <= 8) score++;
  score = Math.min(score, 4);

  return {
    score,
    label: LABELS[score],
    warning: null,
    suggestions: ["Valid combination of letters and numbers."],
    acceptable: true,
  };
}
