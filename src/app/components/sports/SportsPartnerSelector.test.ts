import { describe, it, expect } from "vitest";
import {
  deduplicatePartnerCandidates,
  normalizeCandidateName,
  normalizeCandidateFlat,
  isSelfFamilyMember,
} from "./SportsPartnerSelector";
import type { PartnerCandidateResponse } from "../../../services/common/userService";
import type { FamilyMember } from "../../../services/common/familyService";

describe("SportsPartnerSelector candidate normalization & deduplication", () => {
  it("normalizes names correctly (trimming, lowercasing, extra spaces)", () => {
    expect(normalizeCandidateName("  Sandeep   Kamarapu ")).toBe("sandeep kamarapu");
    expect(normalizeCandidateName("")).toBe("");
    expect(normalizeCandidateName(null)).toBe("");
  });

  it("normalizes flat identifiers correctly", () => {
    expect(normalizeCandidateFlat({ block: "B", flatNo: "201" })).toBe("b-201");
    expect(normalizeCandidateFlat({ block: "B", flatNo: "b-201" })).toBe("b-201");
    expect(normalizeCandidateFlat({ flatNo: "201" })).toBe("201");
    expect(normalizeCandidateFlat({ block: "A" })).toBe("a");
  });

  it("deduplicates identical entity records returned by SQL joins (same type and id)", () => {
    const raw: PartnerCandidateResponse[] = [
      {
        type: "USER",
        id: 10,
        name: "Rahul Verma",
        flatNo: "201",
        block: "B",
        occupancyLabel: "Owner · Flat B-201",
        eligible: true,
      },
      {
        type: "USER",
        id: 10,
        name: "Rahul Verma",
        flatNo: "201",
        block: "B",
        occupancyLabel: "Owner · Flat B-201",
        eligible: true,
      },
    ];

    const deduplicated = deduplicatePartnerCandidates(raw);
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].id).toBe(10);
  });

  it("deduplicates the same person appearing as both USER and FAMILY_MEMBER in the same flat", () => {
    const raw: PartnerCandidateResponse[] = [
      {
        type: "USER",
        id: 10,
        name: "Rahul Verma",
        flatNo: "201",
        block: "B",
        occupancyLabel: "Owner · Flat B-201",
        gender: "MALE",
        eligible: true,
      },
      {
        type: "FAMILY_MEMBER",
        id: 99,
        primaryUserId: 10,
        name: "Rahul Verma",
        relation: "Self",
        flatNo: "201",
        block: "B",
        occupancyLabel: "Family (Self) · Flat B-201",
        gender: "MALE",
        age: 32,
        eligible: true,
      },
    ];

    const deduplicated = deduplicatePartnerCandidates(raw);
    expect(deduplicated).toHaveLength(1);
    // Should prefer USER type
    expect(deduplicated[0].type).toBe("USER");
    expect(deduplicated[0].id).toBe(10);
    // Should inherit missing age from the family member record
    expect(deduplicated[0].age).toBe(32);
    expect(deduplicated[0].gender).toBe("MALE");
  });

  it("deduplicates multiple duplicate FAMILY_MEMBER records with the same name in the same flat", () => {
    const raw: PartnerCandidateResponse[] = [
      {
        type: "FAMILY_MEMBER",
        id: 101,
        primaryUserId: 10,
        name: "Rohan Verma",
        relation: "Son",
        flatNo: "201",
        block: "B",
        gender: "MALE",
        age: 16,
        eligible: true,
      },
      {
        type: "FAMILY_MEMBER",
        id: 102,
        primaryUserId: 10,
        name: "Rohan Verma",
        relation: "Son",
        flatNo: "201",
        block: "B",
        gender: "MALE",
        age: 16,
        eligible: true,
      },
    ];

    const deduplicated = deduplicatePartnerCandidates(raw);
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].name).toBe("Rohan Verma");
  });

  it("preserves distinct family members living in the same flat", () => {
    const raw: PartnerCandidateResponse[] = [
      {
        type: "USER",
        id: 10,
        name: "Rahul Verma",
        flatNo: "201",
        block: "B",
        occupancyLabel: "Owner · Flat B-201",
        eligible: true,
      },
      {
        type: "FAMILY_MEMBER",
        id: 101,
        primaryUserId: 10,
        name: "Rohan Verma",
        relation: "Son",
        flatNo: "201",
        block: "B",
        occupancyLabel: "Family (Son) · Flat B-201",
        eligible: true,
      },
      {
        type: "FAMILY_MEMBER",
        id: 102,
        primaryUserId: 10,
        name: "Pooja Verma",
        relation: "Spouse",
        flatNo: "201",
        block: "B",
        occupancyLabel: "Family (Spouse) · Flat B-201",
        eligible: true,
      },
    ];

    const deduplicated = deduplicatePartnerCandidates(raw);
    expect(deduplicated).toHaveLength(3);
    const names = deduplicated.map((c) => c.name);
    expect(names).toContain("Rahul Verma");
    expect(names).toContain("Rohan Verma");
    expect(names).toContain("Pooja Verma");
  });

  it("excludes current user and self-referencing family member record when registering as self", () => {
    const raw: PartnerCandidateResponse[] = [
      {
        type: "USER",
        id: 10,
        name: "Rahul Verma",
        flatNo: "201",
        block: "B",
        eligible: true,
      },
      {
        type: "FAMILY_MEMBER",
        id: 99,
        primaryUserId: 10,
        name: "Rahul Verma",
        relation: "Self",
        flatNo: "201",
        block: "B",
        eligible: true,
      },
      {
        type: "FAMILY_MEMBER",
        id: 101,
        primaryUserId: 10,
        name: "Rohan Verma",
        relation: "Son",
        flatNo: "201",
        block: "B",
        eligible: true,
      },
    ];

    // Current registering user is Rahul Verma (id: 10)
    const deduplicated = deduplicatePartnerCandidates(raw, 10, undefined, "Rahul Verma");
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].name).toBe("Rohan Verma");
  });

  it("excludes current user when currentUserId is passed as string '10' from AuthContext", () => {
    const raw: PartnerCandidateResponse[] = [
      {
        type: "USER",
        id: 10,
        name: "Rahul Verma",
        flatNo: "201",
        block: "B",
        eligible: true,
      },
      {
        type: "FAMILY_MEMBER",
        id: 99,
        primaryUserId: 10,
        name: "Rahul Verma",
        relation: "Self",
        flatNo: "201",
        block: "B",
        eligible: true,
      },
      {
        type: "USER",
        id: 25,
        name: "Anand Sharma",
        flatNo: "305",
        block: "A",
        eligible: true,
      },
    ];

    // AuthContext passes userId as string "10"
    const deduplicated = deduplicatePartnerCandidates(raw, "10", undefined, "Rahul Verma");
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].name).toBe("Anand Sharma");
  });

  it("excludes current user by name match even if currentUserId is undefined", () => {
    const raw: PartnerCandidateResponse[] = [
      {
        type: "USER",
        id: 10,
        name: "Rahul Verma",
        flatNo: "201",
        block: "B",
        eligible: true,
      },
      {
        type: "USER",
        id: 25,
        name: "Anand Sharma",
        flatNo: "305",
        block: "A",
        eligible: true,
      },
    ];

    // currentUserId is undefined, but currentUserName matches Rahul Verma
    const deduplicated = deduplicatePartnerCandidates(raw, undefined, undefined, "Rahul Verma");
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].name).toBe("Anand Sharma");
  });

  it("excludes current family member when registering for that family member", () => {
    const raw: PartnerCandidateResponse[] = [
      {
        type: "USER",
        id: 10,
        name: "Rahul Verma",
        flatNo: "201",
        block: "B",
        eligible: true,
      },
      {
        type: "FAMILY_MEMBER",
        id: 101,
        primaryUserId: 10,
        name: "Rohan Verma",
        relation: "Son",
        flatNo: "201",
        block: "B",
        eligible: true,
      },
    ];

    // Current registering player is family member Rohan Verma (id: 101)
    const deduplicated = deduplicatePartnerCandidates(raw, 10, 101, "Rohan Verma");
    expect(deduplicated).toHaveLength(1);
    // Primary user Rahul Verma remains as an eligible partner option for his son Rohan
    expect(deduplicated[0].name).toBe("Rahul Verma");
    expect(deduplicated[0].type).toBe("USER");
  });

  it("prefers eligible candidates over ineligible duplicate candidates from the same flat", () => {
    const raw: PartnerCandidateResponse[] = [
      {
        type: "FAMILY_MEMBER",
        id: 50,
        name: "Sneha Patel",
        flatNo: "102",
        block: "C",
        eligible: false,
        ineligibilityReason: "Gender mismatch",
      },
      {
        type: "USER",
        id: 11,
        name: "Sneha Patel",
        flatNo: "102",
        block: "C",
        eligible: true,
      },
    ];

    const deduplicated = deduplicatePartnerCandidates(raw);
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].id).toBe(11);
    expect(deduplicated[0].eligible).toBe(true);
  });

  describe("isSelfFamilyMember helper", () => {
    it("identifies Self (Head) synthetic family member as self", () => {
      const selfMember: FamilyMember = {
        id: "fam-self",
        name: "sandeep kamarapu",
        relation: "Self (Head)",
        gender: "Male",
        age: 37,
      };
      expect(isSelfFamilyMember(selfMember, 10, "sandeep kamarapu")).toBe(true);
    });

    it("identifies self when relation contains 'self' or 'head'", () => {
      const fm1: FamilyMember = { id: 1, name: "Rahul", relation: "Self", gender: "Male" };
      const fm2: FamilyMember = { id: 2, name: "Rahul", relation: "Head of Family", gender: "Male" };
      const fm3: FamilyMember = { id: 3, name: "Rahul", relation: "Self (Head)", gender: "Male" };
      expect(isSelfFamilyMember(fm1)).toBe(true);
      expect(isSelfFamilyMember(fm2)).toBe(true);
      expect(isSelfFamilyMember(fm3)).toBe(true);
    });

    it("identifies self when userId matches logged-in user id or name matches", () => {
      const fm: FamilyMember = { id: 5, userId: 10, name: "Rahul Verma", relation: "Other", gender: "Male" };
      expect(isSelfFamilyMember(fm, 10)).toBe(true);
      expect(isSelfFamilyMember(fm, 99, "Rahul Verma")).toBe(true);
    });

    it("returns false for other family members (Spouse, Son, Daughter)", () => {
      const spouse: FamilyMember = { id: 2, name: "Sindhuja Chinthala", relation: "Spouse", gender: "Female", age: 33 };
      const son: FamilyMember = { id: 3, name: "Udvith Sai", relation: "Son", gender: "Male", age: 5 };
      const daughter: FamilyMember = { id: 4, name: "Rithika", relation: "Daughter", gender: "Female", age: 3 };

      expect(isSelfFamilyMember(spouse, 10, "sandeep kamarapu")).toBe(false);
      expect(isSelfFamilyMember(son, 10, "sandeep kamarapu")).toBe(false);
      expect(isSelfFamilyMember(daughter, 10, "sandeep kamarapu")).toBe(false);
    });
  });
});
