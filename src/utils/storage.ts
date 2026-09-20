/**
 * Exception-safe wrapper around localStorage.
 * Prevents application crashes in browsers (like Edge, Safari, or Chrome) where
 * localStorage might be blocked or restricted due to strict privacy, tracking
 * prevention, or cookie settings.
 */

export const STORAGE_KEYS = {
  TOKEN: "mana_token",
  REFRESH_TOKEN: "mana_refresh_token",
  USER: "mana_user",
  USER_PROFILE: "mana_user_profile",
  LAST_ACTIVITY: "mana_last_activity",
  SIDEBAR_COLLAPSED: "mana_sidebar_collapsed",
  CART_ITEMS: "mana_cart_items",
  MARKETPLACE_CART: "mana_marketplace_cart",
  READ_NOTIFICATIONS: "mana_read_notification_ids",
  DISMISSED_NOTIFICATIONS: "mana_dismissed_notification_ids",
  NOTIFICATION_PREFS: "mana_notification_preferences",
  NOTIFICATIONS_MUTED: "mana_notifications_muted",
  SECURITY_SETTINGS: "mana_security_settings",
  APP_PREFERENCES: "mana_app_preferences",
  PRIVACY_FALLBACK: "mana_privacy_preferences_fallback",
  SPORTS_PASSPORT: "mana_player_sports_passport",
  LEADER_HISTORY: "mana_leader_history",
  EVENT_PANTRY_CUSTOM: "mana_event_pantry_custom",
  EVENT_MOCK_MODE: "mana_event_mock_mode",
  FAMILY_MEMBERS: (userId?: string) => (userId ? `mana_family_members_${userId}` : "mana_family_members"),
  DRAFT_STEP: (targetId: string | number) => `mana_draft_step_${targetId}`,
} as const;

export const safeStorage = {
  /**
   * Safely read a raw string value from localStorage. Returns null if unavailable.
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
   * Safely write a raw string value to localStorage. No-op if unavailable.
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
  },

  /**
   * Safely parse and retrieve a JSON object from localStorage.
   * Returns `fallback` if the key does not exist or JSON parsing fails.
   */
  getJSON<T>(key: string, fallback: T): T {
    const raw = this.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  /**
   * Safely serialize and store a JSON value in localStorage.
   */
  setJSON<T>(key: string, value: T): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[Storage] Failed to serialize JSON for key "${key}":`, e);
    }
  }
};

/**
 * Clears all user-scoped personal and session data upon logout.
 * Preserves general UI layout preferences (e.g. sidebar collapse state).
 */
export function clearUserStorage(): void {
  safeStorage.removeItem(STORAGE_KEYS.TOKEN);
  safeStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  safeStorage.removeItem(STORAGE_KEYS.USER);
  safeStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  safeStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
  safeStorage.removeItem(STORAGE_KEYS.CART_ITEMS);
  safeStorage.removeItem(STORAGE_KEYS.MARKETPLACE_CART);
  safeStorage.removeItem(STORAGE_KEYS.READ_NOTIFICATIONS);
  safeStorage.removeItem(STORAGE_KEYS.DISMISSED_NOTIFICATIONS);
  safeStorage.removeItem(STORAGE_KEYS.SPORTS_PASSPORT);
  safeStorage.removeItem(STORAGE_KEYS.LEADER_HISTORY);
  safeStorage.removeItem(STORAGE_KEYS.PRIVACY_FALLBACK);
  safeStorage.removeItem(STORAGE_KEYS.SECURITY_SETTINGS);
  safeStorage.removeItem(STORAGE_KEYS.EVENT_PANTRY_CUSTOM);

  // Scan and clean any user-specific dynamic keys (e.g. mana_family_members_*, mana_draft_step_*)
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("mana_family_members") ||
          key.startsWith("mana_draft_step_"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => safeStorage.removeItem(k));
  } catch (e) {
    console.warn("[Storage] Error while cleaning dynamic user storage keys:", e);
  }
}
