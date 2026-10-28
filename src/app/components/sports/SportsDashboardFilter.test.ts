import { describe, it, expect } from "vitest";
import { isSelfRelationOrMember } from "./SportsDashboard";

describe("SportsDashboard - isSelfRelationOrMember and Registrant Badge Logic", () => {
  const currentUserName = "Sandeep Kamarapu";

  it("identifies Self by various relation strings", () => {
    expect(isSelfRelationOrMember("Self (Head)", null, null, currentUserName)).toBe(true);
    expect(isSelfRelationOrMember("SELF", null, null, currentUserName)).toBe(true);
    expect(isSelfRelationOrMember("head", null, null, currentUserName)).toBe(true);
    expect(isSelfRelationOrMember("PRIMARY", null, null, currentUserName)).toBe(true);
    expect(isSelfRelationOrMember("Self", null, null, currentUserName)).toBe(true);
  });

  it("identifies Self by IDs", () => {
    expect(isSelfRelationOrMember(null, "fam-self", null, currentUserName)).toBe(true);
    expect(isSelfRelationOrMember(null, "self", null, currentUserName)).toBe(true);
    expect(isSelfRelationOrMember(null, "member-self", null, currentUserName)).toBe(true);
  });

  it("identifies Self by name matching the logged-in user", () => {
    expect(isSelfRelationOrMember(null, null, "Sandeep Kamarapu", currentUserName)).toBe(true);
    expect(isSelfRelationOrMember(null, null, "sandeep kamarapu", currentUserName)).toBe(true);
    expect(isSelfRelationOrMember(null, null, "  Sandeep Kamarapu  ", currentUserName)).toBe(true);
  });

  it("does NOT classify genuine family members as Self", () => {
    expect(isSelfRelationOrMember("Son", 2, "Aarav Kamarapu", currentUserName)).toBe(false);
    expect(isSelfRelationOrMember("Spouse", "fam-3", "Sunita", currentUserName)).toBe(false);
    expect(isSelfRelationOrMember("Daughter", 4, "Ananya", currentUserName)).toBe(false);
    expect(isSelfRelationOrMember("Father", 5, "Suresh", currentUserName)).toBe(false);
  });

  it("verifies badge resolution hides badges for Self and shows for family members", () => {
    function computeBadge(rel?: string | null, id?: string | number | null, name?: string | null) {
      const isSelf = isSelfRelationOrMember(rel, id, name, currentUserName);
      if (isSelf) return undefined;
      if (!name) return undefined;
      if (rel && !isSelfRelationOrMember(rel)) {
        return `👥 ${name} (${rel})`;
      }
      return `👤 ${name}`;
    }

    // Primary user / Self / Head: MUST BE UNDEFINED (Hidden)
    expect(computeBadge("Self (Head)", "fam-self", "Sandeep Kamarapu")).toBeUndefined();
    expect(computeBadge("SELF", "self", "Sandeep Kamarapu")).toBeUndefined();
    expect(computeBadge("HEAD", null, "Sandeep Kamarapu")).toBeUndefined();

    // Genuine family member: MUST show formatted badge
    expect(computeBadge("Son", 2, "Aarav Kamarapu")).toBe("👥 Aarav Kamarapu (Son)");
    expect(computeBadge("Spouse", 3, "Sunita Kamarapu")).toBe("👥 Sunita Kamarapu (Spouse)");
  });

  it("verifies filter matching correctly distinguishes Self from family members", () => {
    const matches = [
      { id: 1001, playerName: "Sandeep Kamarapu", relation: "SELF", familyMemberId: "self" },
      { id: 1002, playerName: "Sandeep Kamarapu", relation: "Self (Head)", familyMemberId: "fam-self" },
      { id: 1003, playerName: "Aarav Kamarapu", relation: "Son", familyMemberId: 2 },
    ];

    const filterByMember = (selectedMemberId: string) => {
      if (selectedMemberId === "ALL") return matches;
      const isSelfTarget = selectedMemberId === "SELF" || selectedMemberId === "self";
      return matches.filter((m) => {
        const isSelfMatch = isSelfRelationOrMember(m.relation, m.familyMemberId, m.playerName, currentUserName);
        if (isSelfTarget) return isSelfMatch;
        if (isSelfMatch) return false;
        return String(m.familyMemberId) === String(selectedMemberId);
      });
    };

    // Filter "ALL" -> all 3
    expect(filterByMember("ALL")).toHaveLength(3);

    // Filter "SELF" -> only Sandeep's 2 matches
    const selfMatches = filterByMember("SELF");
    expect(selfMatches).toHaveLength(2);
    expect(selfMatches.every((m) => m.playerName === "Sandeep Kamarapu")).toBe(true);

    // Filter "2" (Aarav - Son) -> only Aarav's 1 match
    const sonMatches = filterByMember("2");
    expect(sonMatches).toHaveLength(1);
    expect(sonMatches[0].playerName).toBe("Aarav Kamarapu");
  });
});
