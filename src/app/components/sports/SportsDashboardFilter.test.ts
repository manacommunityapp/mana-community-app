import { describe, it, expect } from "vitest";
import { isSelfRelationOrMember, isRegistrationForMemberHelper, isEventMatch } from "./SportsDashboard";
import { checkCategoryEligibility } from "./SportsRegister";

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

describe("SportsDashboard - isRegistrationForMemberHelper and isEventMatch", () => {
  const currentUserName = "Sandeep Kamarapu";
  const familyMembersOnly = [
    { id: 2, name: "Aarav Kamarapu", relation: "Son" },
    { id: 3, name: "Sunita Kamarapu", relation: "Spouse" },
  ];

  it("recognizes Self registration when familyMemberId, relation, and playerName are null/empty", () => {
    const rawSelfReg = {
      id: 501,
      eventId: 10,
      familyMemberId: null,
      relation: null,
      playerName: null,
    };

    expect(isRegistrationForMemberHelper(rawSelfReg, "self", familyMembersOnly, currentUserName)).toBe(true);
    expect(isRegistrationForMemberHelper(rawSelfReg, undefined, familyMembersOnly, currentUserName)).toBe(true);
    expect(isRegistrationForMemberHelper(rawSelfReg, 2, familyMembersOnly, currentUserName)).toBe(false);
  });

  it("recognizes explicit Self registrations with relation 'SELF' or familyMemberId 'self'", () => {
    const selfRegWithId = { id: 502, eventId: 10, familyMemberId: "self", relation: "SELF" };
    expect(isRegistrationForMemberHelper(selfRegWithId, "self", familyMembersOnly, currentUserName)).toBe(true);
    expect(isRegistrationForMemberHelper(selfRegWithId, 2, familyMembersOnly, currentUserName)).toBe(false);
  });

  it("recognizes family member registrations and excludes them from Self target", () => {
    const sonReg = { id: 503, eventId: 10, familyMemberId: 2, relation: "Son", playerName: "Aarav Kamarapu" };
    expect(isRegistrationForMemberHelper(sonReg, "self", familyMembersOnly, currentUserName)).toBe(false);
    expect(isRegistrationForMemberHelper(sonReg, 2, familyMembersOnly, currentUserName)).toBe(true);
    expect(isRegistrationForMemberHelper(sonReg, 3, familyMembersOnly, currentUserName)).toBe(false);
  });

  it("isEventMatch correctly matches events across string, number, UUID, and category names", () => {
    const mockReg = {
      id: 101,
      eventId: 42,
      eventName: "Monsoon Badminton Premier Cup 2026",
      categoryName: "Badminton Men's Doubles Championship",
    };

    // Number vs string ID match
    expect(isEventMatch(mockReg, { id: "42", name: "Any" } as any)).toBe(true);
    expect(isEventMatch(mockReg, { id: 42, name: "Any" } as any)).toBe(true);
    expect(isEventMatch(mockReg, { id: 99, name: "Monsoon Badminton Premier Cup 2026", categoryName: "Badminton Men's Doubles Championship" } as any)).toBe(true);

    // UUID match
    const uuidReg = { id: 102, eventUuid: "uuid-1234", eventName: "Tourney" };
    expect(isEventMatch(uuidReg, { id: 99, uuid: "uuid-1234", name: "Tourney" } as any)).toBe(true);

    // MUST NOT match different categories under the same tournament
    expect(isEventMatch(mockReg, { id: 99, name: "Monsoon Badminton Premier Cup 2026", categoryName: "Women's Singles" } as any)).toBe(false);
    expect(isEventMatch(mockReg, { id: 99, name: "Monsoon Badminton Premier Cup 2026", categoryName: "Under-14 Boys Singles" } as any)).toBe(false);
    expect(isEventMatch(mockReg, { id: 99, name: "Monsoon Badminton Premier Cup 2026", categoryName: "Men's Singles" } as any)).toBe(false);

    // Non-match
    expect(isEventMatch(mockReg, { id: 99, name: "Cricket Trophy", categoryName: "Under-16" } as any)).toBe(false);
  });

  it("ensures an already registered event resolves to Registered state, while other categories remain Unregistered", () => {
    const registeredCard = {
      id: 42,
      name: "Monsoon Badminton Premier Cup 2026",
      categoryName: "Men's Doubles",
      isTeamSport: true,
    } as any;

    const unregisteredCard = {
      id: 43,
      name: "Monsoon Badminton Premier Cup 2026",
      categoryName: "Men's Singles",
      isTeamSport: false,
    } as any;

    const myRegistrations = [
      {
        id: 777,
        eventId: 42,
        eventName: "Monsoon Badminton Premier Cup 2026",
        categoryName: "Men's Doubles",
        familyMemberId: null,
        relation: null,
        playerName: null,
        status: "CONFIRMED",
        matchType: "TEAM",
      },
    ];

    const selectedMemberId = "self";

    // Check registered category
    const registeredRegs = myRegistrations.filter(r =>
      isEventMatch(r, registeredCard) &&
      isRegistrationForMemberHelper(r, selectedMemberId, familyMembersOnly, currentUserName) &&
      r.status !== "CANCELLED" &&
      r.status !== "WITHDRAWN"
    );
    expect(registeredRegs.length > 0).toBe(true);

    // Check unregistered category
    const unregisteredRegs = myRegistrations.filter(r =>
      isEventMatch(r, unregisteredCard) &&
      isRegistrationForMemberHelper(r, selectedMemberId, familyMembersOnly, currentUserName) &&
      r.status !== "CANCELLED" &&
      r.status !== "WITHDRAWN"
    );
    expect(unregisteredRegs.length > 0).toBe(false);
  });

  it("checkCategoryEligibility correctly identifies gender and age ineligibility", () => {
    const womenCategory = {
      name: "Monsoon Badminton Premier Cup 2026",
      categoryName: "Women's Singles",
    };

    const under14Category = {
      name: "Monsoon Badminton Premier Cup 2026",
      categoryName: "Under-14 Boys Singles",
    };

    const menCategory = {
      name: "Monsoon Badminton Premier Cup 2026",
      categoryName: "Men's Singles",
    };

    // Male user (age 28) checking Women's Singles -> Ineligible (Gender Mismatch)
    const womenCheck = checkCategoryEligibility(womenCategory as any, 28, "Male");
    expect(womenCheck.eligible).toBe(false);
    expect(womenCheck.isGenderMismatch).toBe(true);

    // Male user (age 28) checking Under-14 -> Ineligible (Over Age)
    const u14Check = checkCategoryEligibility(under14Category as any, 28, "Male");
    expect(u14Check.eligible).toBe(false);
    expect(u14Check.isOverAge).toBe(true);

    // Male user (age 28) checking Men's Singles -> Eligible!
    const menCheck = checkCategoryEligibility(menCategory as any, 28, "Male");
    expect(menCheck.eligible).toBe(true);
    expect(menCheck.isGenderMismatch).toBe(false);
    expect(menCheck.isOverAge).toBe(false);

    // User without gender set checking gender-restricted category -> Ineligible
    const unknownGenderCheck = checkCategoryEligibility(womenCategory as any, 28, "");
    expect(unknownGenderCheck.eligible).toBe(false);
    expect(unknownGenderCheck.isGenderMismatch).toBe(true);
  });
});
