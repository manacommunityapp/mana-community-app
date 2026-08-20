import { describe, it, expect, vi, beforeEach } from "vitest";
import Papa from "papaparse";
import {
  validateUser,
  VALID_ROLES,
  TEMPLATE_DATA,
} from "./AdminBulkUpload";
import { userService } from "../../../services/common/userService";
import { apiClient } from "../../../services/common/apiClient";

vi.mock("../../../services/common/apiClient", () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("AdminBulkUpload - validateUser & CSV Parsing Test Suite", () => {
  let seenEmails: Map<string, number>;
  let seenPhones: Map<string, number>;

  beforeEach(() => {
    seenEmails = new Map();
    seenPhones = new Map();
    vi.clearAllMocks();
  });

  describe("1. Mandatory Field Validation", () => {
    it("should accept a complete and valid user row", () => {
      const rowData = {
        "First Name": "Priya",
        "Last Name": "Sharma",
        "Email": "priya.sharma@example.com",
        "Phone": "+91 98765 43210",
        "Role": "member",
        "Community Code": "APT-TOWER-A-2024",
        "Flat/Unit": "Apt 402",
        "ID Type": "Aadhaar Card",
        "ID Number": "XXXX-XXXX-1234",
      };

      const result = validateUser(2, rowData, seenEmails, seenPhones);

      expect(result.status).toBe("valid");
      expect(result.errors).toHaveLength(0);
      expect(result.firstName).toBe("Priya");
      expect(result.lastName).toBe("Sharma");
      expect(result.email).toBe("priya.sharma@example.com");
      expect(result.phone).toBe("+91 98765 43210");
      expect(result.role).toBe("member");
      expect(result.communityCode).toBe("APT-TOWER-A-2024");
      expect(result.remarks).toContain("Ready for insert");
      expect(result.remarks).toContain("Pass1234");
    });

    it("should flag error when first name or last name is missing", () => {
      const missingFirst = validateUser(
        2,
        { "Last Name": "Sharma", "Email": "a@b.com", "Phone": "9876543210", "Role": "member", "Community Code": "CODE" },
        seenEmails,
        seenPhones
      );
      expect(missingFirst.status).toBe("error");
      expect(missingFirst.errors).toContain("First name is required");

      const missingLast = validateUser(
        3,
        { "First Name": "Priya", "Email": "b@c.com", "Phone": "9876543211", "Role": "member", "Community Code": "CODE" },
        seenEmails,
        seenPhones
      );
      expect(missingLast.status).toBe("error");
      expect(missingLast.errors).toContain("Last name is required");
    });

    it("should flag error when community code is missing", () => {
      const noCode = validateUser(
        2,
        { "First Name": "Priya", "Last Name": "Sharma", "Email": "p@b.com", "Phone": "9876543210", "Role": "member" },
        seenEmails,
        seenPhones
      );
      expect(noCode.status).toBe("error");
      expect(noCode.errors).toContain("Community Code is required for community linking");
    });
  });

  describe("2. Email & Phone Validation", () => {
    it("should reject invalid email formats", () => {
      const invalidEmail = validateUser(
        2,
        { "First Name": "Priya", "Last Name": "Sharma", "Email": "invalid-email-address", "Phone": "9876543210", "Role": "member", "Community Code": "CODE" },
        seenEmails,
        seenPhones
      );
      expect(invalidEmail.status).toBe("error");
      expect(invalidEmail.errors).toContain("Invalid email format (e.g. name@domain.com)");
    });

    it("should reject phone numbers with less than 8 or more than 15 digits", () => {
      const shortPhone = validateUser(
        2,
        { "First Name": "Priya", "Last Name": "Sharma", "Email": "p@b.com", "Phone": "123", "Role": "member", "Community Code": "CODE" },
        seenEmails,
        seenPhones
      );
      expect(shortPhone.status).toBe("error");
      expect(shortPhone.errors).toContain("Phone must be between 8 and 15 digits");

      const longPhone = validateUser(
        3,
        { "First Name": "Priya", "Last Name": "Sharma", "Email": "p2@b.com", "Phone": "12345678901234567", "Role": "member", "Community Code": "CODE" },
        seenEmails,
        seenPhones
      );
      expect(longPhone.status).toBe("error");
      expect(longPhone.errors).toContain("Phone must be between 8 and 15 digits");
    });

    it("should detect in-file duplicate emails across rows", () => {
      const row1 = validateUser(
        2,
        { "First Name": "Priya", "Last Name": "Sharma", "Email": "duplicate@test.com", "Phone": "9876543210", "Role": "member", "Community Code": "CODE" },
        seenEmails,
        seenPhones
      );
      expect(row1.status).toBe("valid");

      const row2 = validateUser(
        3,
        { "First Name": "Anita", "Last Name": "Desai", "Email": "DUPLICATE@test.com", "Phone": "9876543211", "Role": "resident", "Community Code": "CODE" },
        seenEmails,
        seenPhones
      );
      expect(row2.status).toBe("error");
      expect(row2.errors).toContain("Duplicate email in CSV (same as row #2)");
    });

    it("should detect in-file duplicate phone numbers across rows", () => {
      const row1 = validateUser(
        2,
        { "First Name": "Priya", "Last Name": "Sharma", "Email": "user1@test.com", "Phone": "+91 98765 43210", "Role": "member", "Community Code": "CODE" },
        seenEmails,
        seenPhones
      );
      expect(row1.status).toBe("valid");

      const row2 = validateUser(
        3,
        { "First Name": "Anita", "Last Name": "Desai", "Email": "user2@test.com", "Phone": "9876543210", "Role": "resident", "Community Code": "CODE" },
        seenEmails,
        seenPhones
      );
      expect(row2.status).toBe("error");
      expect(row2.errors).toContain("Duplicate phone in CSV (same as row #2)");
    });
  });

  describe("3. Role Validation & Warnings", () => {
    it("should accept valid supported roles", () => {
      VALID_ROLES.forEach((r, idx) => {
        const res = validateUser(
          idx + 2,
          { "First Name": "Test", "Last Name": "User", "Email": `user${idx}@test.com`, "Phone": `98765432${idx}0`, "Role": r, "Community Code": "CODE" },
          seenEmails,
          seenPhones
        );
        expect(res.status).toBe("valid");
      });
    });

    it("should reject invalid / unsupported role", () => {
      const res = validateUser(
        2,
        { "First Name": "Test", "Last Name": "User", "Email": "test@test.com", "Phone": "9876543210", "Role": "superboss", "Community Code": "CODE" },
        seenEmails,
        seenPhones
      );
      expect(res.status).toBe("error");
      expect(res.errors[0]).toContain("Invalid role 'superboss'");
    });

    it("should generate warning when ID Type is present but ID Number is missing", () => {
      const res = validateUser(
        2,
        { "First Name": "Test", "Last Name": "User", "Email": "test@test.com", "Phone": "9876543210", "Role": "member", "Community Code": "CODE", "ID Type": "Aadhaar" },
        seenEmails,
        seenPhones
      );
      expect(res.status).toBe("warning");
      expect(res.warnings).toContain("ID Type is provided but ID Number is blank");
      expect(res.remarks).toContain("Ready with notice");
    });
  });

  describe("4. CSV PapaParse Integration & Template", () => {
    it("should unparse and parse the template correctly", () => {
      const csvString = Papa.unparse(TEMPLATE_DATA);
      const parsed = Papa.parse<Record<string, string>>(csvString, {
        header: true,
        skipEmptyLines: true,
      });

      expect(parsed.data.length).toBe(TEMPLATE_DATA.length - 1);
      expect(parsed.data[0]["First Name"]).toBe("Priya");
      expect(parsed.data[0]["Role"]).toBe("member");
    });
  });

  describe("5. Backend User Creation API Integration", () => {
    it("should invoke userService.createUser with mapped payload", async () => {
      const mockCreatedUser = {
        id: 101,
        fullName: "Priya Sharma",
        email: "priya.sharma@example.com",
        phone: "+91 98765 43210",
        role: "MEMBER",
        isActive: true,
      };

      (apiClient.post as any).mockResolvedValueOnce(mockCreatedUser);

      const payload = {
        firstName: "Priya",
        lastName: "Sharma",
        email: "priya.sharma@example.com",
        phone: "+91 98765 43210",
        role: "member",
        inviteCode: "APT-TOWER-A-2024",
        flatNo: "Apt 402",
        govtIdType: "Aadhaar Card",
        govtIdNumber: "XXXX-XXXX-1234",
        isActive: true,
      };

      const result = await userService.createUser(payload);

      expect(apiClient.post).toHaveBeenCalledWith("/users", payload);
      expect(result).toEqual(mockCreatedUser);
    });

    it("should propagate backend error when database rejects duplicate or invalid code", async () => {
      const errorResponse = new Error("User with email priya.sharma@example.com already exists");
      (apiClient.post as any).mockRejectedValueOnce(errorResponse);

      const payload = {
        firstName: "Priya",
        lastName: "Sharma",
        email: "priya.sharma@example.com",
        phone: "+91 98765 43210",
        role: "member",
        inviteCode: "INVALID_CODE",
      };

      await expect(userService.createUser(payload)).rejects.toThrow(
        "User with email priya.sharma@example.com already exists"
      );
    });
  });
});
