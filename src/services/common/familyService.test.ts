import { describe, it, expect, vi, beforeEach } from "vitest";

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: 0,
  } as unknown as Storage;
}

if (typeof globalThis.window === "undefined") {
  globalThis.window = {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as any;
}

if (typeof globalThis.CustomEvent === "undefined") {
  globalThis.CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params?: { detail?: any }) {
      this.type = type;
      this.detail = params?.detail;
    }
  } as any;
}

vi.mock("./apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  getStoredUser: vi.fn(() => ({ userId: "test-user-1", email: "test@example.com" })),
  storeUser: vi.fn(),
}));

import { formatToDateString } from "../../app/components/ui/date-picker";
import { familyService } from "./familyService";
import { apiClient } from "./apiClient";

describe("formatToDateString - Date Picker normalization", () => {
  it("normalizes ISO YYYY-MM-DD correctly", () => {
    expect(formatToDateString("2015-08-25")).toBe("2015-08-25");
  });

  it("normalizes slash format YYYY/MM/DD correctly", () => {
    expect(formatToDateString("2015/08/25")).toBe("2015-08-25");
  });

  it("normalizes Indian/UK format DD/MM/YYYY correctly", () => {
    expect(formatToDateString("25/08/2015")).toBe("2015-08-25");
  });

  it("normalizes dash format DD-MM-YYYY correctly", () => {
    expect(formatToDateString("25-08-2015")).toBe("2015-08-25");
  });

  it("normalizes Date objects correctly", () => {
    const d = new Date(2015, 7, 25); // Aug 25, 2015
    expect(formatToDateString(d)).toBe("2015-08-25");
  });

  it("returns empty string for null, undefined, or empty values", () => {
    expect(formatToDateString("")).toBe("");
    expect(formatToDateString(undefined as any)).toBe("");
    expect(formatToDateString(null as any)).toBe("");
  });
});

describe("familyService - Non-destructive DOB persistence", () => {
  const STORAGE_KEY = "mana_family_members_v4_test-user-1";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("preserves locally saved DOB when server sync returns member without dob column", async () => {
    // 1. Pre-seed local storage with a member containing DOB
    const initialLocalMember = {
      id: 101,
      name: "Kid 1",
      relation: "Son",
      gender: "Male",
      dob: "2015-08-25",
      phone: "9876543210",
      age: 10,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([initialLocalMember]));

    // 2. Mock backend returning server records without dob
    (apiClient.get as any).mockResolvedValueOnce([
      {
        id: 101,
        name: "Kid 1",
        relationship: "Son",
        gender: "Male",
        phone: "9876543210",
        // backend EventFamilyMember lacks dob column
      },
    ]);

    // 3. Call getFamilyMembers with forceRefresh = true
    const members = await familyService.getFamilyMembers(true);

    // 4. Verify member retains the DOB
    const kid = members.find(m => m.name === "Kid 1");
    expect(kid).toBeDefined();
    expect(kid?.dob).toBe("2015-08-25");
  });

  it("handles string member IDs and updates DOB correctly", async () => {
    const localMember = {
      id: "fam-1741234567",
      name: "Kid 1",
      relation: "Son",
      gender: "Male",
      dob: "",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([localMember]));

    // Update with new DOB
    const updated = await familyService.updateFamilyMember("fam-1741234567", {
      dob: "2016-04-12",
      age: 9,
    });

    expect(updated.dob).toBe("2016-04-12");

    // Check stored members (using find to handle prepended self member)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const kid = stored.find((m: any) => m.name === "Kid 1");
    expect(kid?.dob).toBe("2016-04-12");
  });

  it("falls back to matching member by name if ID lookup fails", async () => {
    const localMember = {
      id: "fam-abc",
      name: "Kid 1",
      relation: "Son",
      gender: "Male",
      dob: "",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([localMember]));

    // Update using different ID but exact name
    const updated = await familyService.updateFamilyMember("non-existent-id", {
      name: "Kid 1",
      dob: "2017-02-14",
    });

    expect(updated.dob).toBe("2017-02-14");
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const kid = stored.find((m: any) => m.name === "Kid 1");
    expect(kid?.dob).toBe("2017-02-14");
  });
});
