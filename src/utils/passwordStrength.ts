/**
 * Frontend password-strength evaluator — mirrors the backend
 * PasswordStrengthEvaluator so the meter and the server agree on what's weak.
 *
 * This drives UX only (a live meter + suggestions). The backend remains the
 * authority and re-validates on register/reset; never trust this alone.
 */

export const MIN_ACCEPTABLE_SCORE = 3;

export interface PasswordStrength {
  /** 0 (weakest) … 4 (strongest). */
  score: number;
  /** UI label for the score. */
  label: "Weak" | "Fair" | "Good" | "Strong" | "Very strong";
  /** Short warning about the biggest problem, if any. */
  warning: string | null;
  /** Actionable tips. */
  suggestions: string[];
  /** True when score >= MIN_ACCEPTABLE_SCORE (matches the backend gate). */
  acceptable: boolean;
}

const COMMON = new Set([
  "password", "passw", "pass", "admin", "administrator", "root", "user",
  "welcome", "login", "letmein", "secret", "changeme", "default", "guest",
  "qwerty", "qwertyuiop", "asdf", "asdfgh", "zxcvbn", "qazwsx", "qweasd",
  "iloveyou", "monkey", "dragon", "master", "sunshine", "princess", "football",
  "baseball", "superman", "batman", "trustno", "starwars", "whatever",
  "abc", "abcd", "abcde", "abcdef", "test", "testing", "demo", "sample",
  "manacommunity", "mana", "community", "india", "cricket",
]);

const KEYBOARD_WALKS = [
  "qwerty", "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbn", "zxcvbnm",
  "qazwsx", "qweasd", "1qaz", "2wsx", "1q2w3e", "1234qwer", "poiuy", "lkjh",
];

const LEET: Record<string, string> = {
  "0": "o", "1": "i", "!": "i", "|": "i", "3": "e", "4": "a", "@": "a",
  "5": "s", "$": "s", "7": "t", "8": "b", "9": "g",
};

const LABELS = ["Weak", "Fair", "Good", "Strong", "Very strong"] as const;

function deLeet(s: string): string {
  let out = "";
  for (const ch of s) out += LEET[ch] ?? ch;
  return out;
}

function characterClassCount(pw: string): number {
  let upper = false, lower = false, digit = false, special = false;
  for (const c of pw) {
    if (/[A-Z]/.test(c)) upper = true;
    else if (/[a-z]/.test(c)) lower = true;
    else if (/[0-9]/.test(c)) digit = true;
    else special = true;
  }
  return Number(upper) + Number(lower) + Number(digit) + Number(special);
}

function isCommon(lower: string): boolean {
  if (COMMON.has(lower)) return true;
  const alphaCore = lower.replace(/[^a-z]/g, "");
  const leetCore = deLeet(lower).replace(/[^a-z]/g, "");
  return (alphaCore.length > 0 && COMMON.has(alphaCore)) || (leetCore.length > 0 && COMMON.has(leetCore));
}

function containsKeyboardWalk(lower: string): boolean {
  return KEYBOARD_WALKS.some((w) => lower.includes(w));
}

function hasSequentialRun(lower: string, minRun: number): boolean {
  let asc = 1, desc = 1;
  for (let i = 1; i < lower.length; i++) {
    const diff = lower.charCodeAt(i) - lower.charCodeAt(i - 1);
    asc = diff === 1 ? asc + 1 : 1;
    desc = diff === -1 ? desc + 1 : 1;
    if (asc >= minRun || desc >= minRun) return true;
  }
  return false;
}

function hasRepeats(lower: string): boolean {
  if (/(.)\1\1/.test(lower)) return true; // aaa
  const n = lower.length;
  for (let seg = 1; seg <= n / 2; seg++) {
    if (n % seg === 0) {
      const unit = lower.slice(0, seg);
      if (unit.repeat(n / seg) === lower) return true; // abcabc
    }
  }
  return false;
}

function matchesUserInput(lower: string, userInputs: string[]): boolean {
  for (const raw of userInputs) {
    if (!raw) continue;
    for (const token of raw.toLowerCase().split(/[^a-z0-9]+/)) {
      if (token.length >= 3 && lower.includes(token)) return true;
    }
  }
  return false;
}

// ── Strong-password generator ────────────────────────────────────────────────

// Character sets exclude visually ambiguous glyphs (0/O, 1/l/I) for readability.
const GEN_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const GEN_LOWER = "abcdefghijkmnpqrstuvwxyz";
const GEN_DIGITS = "23456789";
const GEN_SPECIALS = "!@#$%^&*?-_=+";

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
 * Generates a strong password that always contains at least one uppercase,
 * one lowercase, one digit and one special character, and is verified to pass
 * {@link evaluatePassword} (score >= MIN_ACCEPTABLE_SCORE). Default length 16.
 */
export function generateStrongPassword(length = 16): string {
  const safeLength = Math.max(12, length);
  const all = GEN_UPPER + GEN_LOWER + GEN_DIGITS + GEN_SPECIALS;

  for (let attempt = 0; attempt < 50; attempt++) {
    // Guarantee one of each required class, then fill the rest from the full set.
    const chars = [pick(GEN_UPPER), pick(GEN_LOWER), pick(GEN_DIGITS), pick(GEN_SPECIALS)];
    while (chars.length < safeLength) chars.push(pick(all));

    // Fisher–Yates shuffle so the guaranteed chars aren't always up front.
    for (let i = chars.length - 1; i > 0; i--) {
      const j = secureRandInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    const candidate = chars.join("");
    if (evaluatePassword(candidate).acceptable) return candidate;
  }

  // Extremely unlikely fallback: a guaranteed-valid composed password.
  return `${pick(GEN_UPPER)}${pick(GEN_LOWER)}${pick(GEN_LOWER)}${pick(GEN_DIGITS)}${pick(GEN_SPECIALS)}${pick(GEN_LOWER)}${pick(GEN_DIGITS)}${pick(GEN_UPPER)}${pick(GEN_SPECIALS)}${pick(GEN_LOWER)}${pick(GEN_DIGITS)}${pick(GEN_LOWER)}`;
}

export function evaluatePassword(password: string, userInputs: string[] = []): PasswordStrength {
  if (!password) {
    return { score: 0, label: "Weak", warning: "Password is required.", suggestions: ["Enter a password."], acceptable: false };
  }

  const lower = password.toLowerCase();
  const suggestions: string[] = [];

  const len = password.length;
  let score = 0;
  if (len >= 8) score++;
  if (len >= 12) score++;
  if (len >= 16) score++;

  const classes = characterClassCount(password);
  if (classes >= 3) score++;
  score = Math.min(score, 4);

  if (len < 12) suggestions.push("Use 12 or more characters — length matters most.");
  if (classes < 3) suggestions.push("Mix uppercase, lowercase, numbers and symbols.");

  let warning: string | null = null;

  if (isCommon(lower)) {
    score = 0;
    warning = "This is a commonly used password and is easy to guess.";
    suggestions.push("Avoid dictionary words and well-known passwords.");
  }
  if (matchesUserInput(lower, userInputs)) {
    score = Math.min(score, 1);
    warning = warning ?? "Avoid using your name, email or other personal details.";
    suggestions.push("Don't base your password on personal information.");
  }
  if (containsKeyboardWalk(lower)) {
    score = Math.min(score, 1);
    warning = warning ?? 'Keyboard patterns like "qwerty" are easy to guess.';
    suggestions.push("Avoid keyboard patterns.");
  }
  if (hasSequentialRun(lower, 4)) {
    score = Math.min(score, 1);
    warning = warning ?? 'Sequences like "abcd" or "1234" are easy to guess.';
    suggestions.push("Avoid straight sequences of letters or numbers.");
  }
  if (hasRepeats(lower)) {
    score = Math.min(score, 2);
    warning = warning ?? "Repeated characters or patterns weaken a password.";
    suggestions.push("Avoid repeating characters or patterns.");
  }
  if (/(19|20)\d{2}/.test(password)) {
    score = Math.max(score - 1, 0);
    suggestions.push("Avoid years and dates.");
  }

  score = Math.max(0, Math.min(score, 4));

  if (warning === null && score < MIN_ACCEPTABLE_SCORE) {
    warning = "This password is too easy to guess.";
  }
  if (suggestions.length === 0) {
    suggestions.push("Consider a passphrase of 4+ unrelated words.");
  }

  return {
    score,
    label: LABELS[score],
    warning,
    suggestions: [...new Set(suggestions)],
    acceptable: score >= MIN_ACCEPTABLE_SCORE,
  };
}
