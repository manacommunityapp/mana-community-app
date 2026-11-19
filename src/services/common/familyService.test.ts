import { describe, it, expect, vi, beforeEach } from "vitest";

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

describe("familyService - database-only fetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mapped members from API response", async () => {
    (apiClient.get as any).mockResolvedValueOnce([
      { id: 101, name: "Kid 1", relationship: "Son", gender: "Male", dob: "2015-08-25" },
    ]);

    const members = await familyService.getFamilyMembers(true);
    const kid = members.find(m => m.name === "Kid 1");
    expect(kid).toBeDefined();
    expect(kid?.dob).toBe("2015-08-25");
  });

  it("includes DOB returned from API", async () => {
    (apiClient.get as any).mockResolvedValueOnce([
      { id: 102, name: "Child", relation: "Daughter", gender: "Female", dob: "2018-03-15" },
    ]);

    const members = await familyService.getFamilyMembers(true);
    const child = members.find(m => m.name === "Child");
    expect(child?.dob).toBe("2018-03-15");
  });

  it("reads family members from a wrapped API list response", async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        content: [{ id: 202, name: "Server Member", relation: "Daughter", gender: "Female" }],
      },
    });

    const members = await familyService.getFamilyMembers(true);
    expect(members.find((member) => member.id === 202)?.name).toBe("Server Member");
  });
});

describe("familyService - server mutation failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when the server rejects an add", async () => {
    (apiClient.post as any).mockRejectedValueOnce(new Error("Server rejected add"));

    await expect(familyService.addFamilyMember({
      name: "New Member",
      relation: "Daughter",
    })).rejects.toThrow("Server rejected add");
  });

  it("throws when the server rejects an update", async () => {
    (apiClient.put as any).mockRejectedValueOnce(new Error("Server rejected update"));

    await expect(familyService.updateFamilyMember(101, {
      name: "Updated Member",
      relation: "Son",
    })).rejects.toThrow("Server rejected update");
  });
});
