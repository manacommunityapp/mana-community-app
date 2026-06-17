/**
 * Exception-safe wrapper around localStorage.
 * Prevents application crashes in browsers (like Edge, Safari, or Chrome) where
 * localStorage might be blocked or restricted due to strict privacy, tracking
 * prevention, or cookie settings.
 */
export const safeStorage = {
  /**
   * Safely read a value from localStorage. Returns null if unavailable.
   */
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to read key "${key}" from localStorage:`, e);
      return null;
    }
  },

  /**
   * Safely write a value to localStorage. No-op if unavailable.
   */
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] Failed to write key "${key}" to localStorage:`, e);
    }
  },

  /**
   * Safely delete a key from localStorage. No-op if unavailable.
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to remove key "${key}" from localStorage:`, e);
    }
  }
};
