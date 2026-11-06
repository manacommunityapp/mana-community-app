import { describe, it, expect } from "vitest";
import { isSelfRelationOrMember, isRegistrationForMemberHelper, isEventMatch, isActiveRegistrationStatus, isFormatCompatible, getFamilyMembersOnly } from "./SportsDashboard";
import { checkCategoryEligibility } from "./SportsRegister";
import { extractPartnerExportDetails } from "../../../utils/sportsExportUtils";

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

  it("does not match Singles registration to Doubles card when sharing the exact same category", () => {
    // Two cards for the exact same tournament and category: one Singles, one Doubles
    const singlesCard = {
      id: 45,
      name: "Carrom — Mens",
      categoryName: "Men's Above 19",
      format: "SINGLES",
      formats: ["SINGLES"],
      isTeamSport: false,
    } as any;

    const doublesCard = {
      id: 46,
      name: "Carrom — Mens",
      categoryName: "Men's Above 19",
      format: "DOUBLES",
      formats: ["DOUBLES"],
      isTeamSport: false,
    } as any;

    // User only registered for Singles
    const singlesReg = {
      id: 801,
      eventId: 45,
      eventName: "Carrom — Mens",
      categoryName: "Men's Above 19",
      matchType: "SINGLES",
      status: "CONFIRMED",
    };

    // User only registered for Doubles
    const doublesReg = {
      id: 802,
      eventId: 46,
      eventName: "Carrom — Mens",
      categoryName: "Men's Above 19",
      matchType: "DOUBLES",
      status: "CONFIRMED",
    };

    // Singles registration must match Singles card, but NOT Doubles card
    expect(isEventMatch(singlesReg, singlesCard)).toBe(true);
    expect(isEventMatch(singlesReg, doublesCard)).toBe(false);

    // Doubles registration must match Doubles card, but NOT Singles card
    expect(isEventMatch(doublesReg, doublesCard)).toBe(true);
    expect(isEventMatch(doublesReg, singlesCard)).toBe(false);
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

  it("isActiveRegistrationStatus accurately recognizes active vs inactive registration statuses", () => {
    expect(isActiveRegistrationStatus("CONFIRMED")).toBe(true);
    expect(isActiveRegistrationStatus("REGISTERED")).toBe(true);
    expect(isActiveRegistrationStatus("PENDING")).toBe(true);
    expect(isActiveRegistrationStatus("confirmed")).toBe(true);

    expect(isActiveRegistrationStatus("WITHDRAWN")).toBe(false);
    expect(isActiveRegistrationStatus("CANCELLED")).toBe(false);
    expect(isActiveRegistrationStatus("REJECTED")).toBe(false);
    expect(isActiveRegistrationStatus("withdrawn")).toBe(false);
    expect(isActiveRegistrationStatus("")).toBe(false);
    expect(isActiveRegistrationStatus(null)).toBe(false);
    expect(isActiveRegistrationStatus(undefined)).toBe(false);
  });

  it("when user unregisters (status: WITHDRAWN), event is no longer considered registered", () => {
    const eventCard = {
      id: 99,
      name: "Monsoon Badminton Premier Cup 2026",
      categoryName: "Men's Doubles",
    } as any;

    const myRegistrations = [
      {
        id: 501,
        eventId: 99,
        eventName: "Monsoon Badminton Premier Cup 2026",
        categoryName: "Men's Doubles",
        status: "WITHDRAWN",
      },
    ];

    const activeRegs = myRegistrations.filter(r =>
      isEventMatch(r, eventCard) &&
      isActiveRegistrationStatus(r.status)
    );

    expect(activeRegs.length).toBe(0);
  });

  it("isFormatCompatible and isEventMatch safely handle non-string format or matchType (array, object, number, null)", () => {
    const eventCard = {
      id: 101,
      name: "Monsoon Badminton Premier Cup 2026",
      categoryName: "Men's Singles",
      formats: ["SINGLES"],
    } as any;

    // OpenRegistration object where format is an array (reproducing the reported TypeError)
    const openRegWithArrayFormat = {
      id: 101,
      name: "Monsoon Badminton Premier Cup 2026",
      categoryName: "Men's Singles",
      format: ["SINGLES", "DOUBLES"],
      formats: ["SINGLES", "DOUBLES"],
    } as any;

    // OpenRegistration where matchType is null and format is an array
    expect(() => isFormatCompatible(openRegWithArrayFormat, eventCard)).not.toThrow();
    expect(isFormatCompatible(openRegWithArrayFormat, eventCard)).toBe(true);
    expect(() => isEventMatch(openRegWithArrayFormat, eventCard)).not.toThrow();
    expect(isEventMatch(openRegWithArrayFormat, eventCard)).toBe(true);

    // Object where format is an object or number
    const objWithComplexFormat = {
      id: 101,
      eventId: 101,
      name: "Monsoon Badminton Premier Cup 2026",
      categoryName: "Men's Singles",
      matchType: { code: "SINGLES" },
      format: 1,
    } as any;
    expect(() => isFormatCompatible(objWithComplexFormat, eventCard)).not.toThrow();
    expect(() => isEventMatch(objWithComplexFormat, eventCard)).not.toThrow();

    // Incompatible format (strictly DOUBLES array against strictly Singles event card)
    const doublesArrayReg = {
      id: 101,
      eventId: 101,
      name: "Monsoon Badminton Premier Cup 2026",
      categoryName: "Men's Singles",
      format: ["DOUBLES"],
    } as any;
    expect(isFormatCompatible(doublesArrayReg, eventCard)).toBe(false);
  });

  it("isActiveRegistrationStatus safely normalizes casing and rejects cancelled, withdrawn, rejected, or null statuses", () => {
    // Active statuses
    expect(isActiveRegistrationStatus("CONFIRMED")).toBe(true);
    expect(isActiveRegistrationStatus("confirmed")).toBe(true);
    expect(isActiveRegistrationStatus("PENDING")).toBe(true);
    expect(isActiveRegistrationStatus("pending")).toBe(true);
    expect(isActiveRegistrationStatus("REGISTERED")).toBe(true);
    expect(isActiveRegistrationStatus("registered")).toBe(true);

    // Inactive statuses
    expect(isActiveRegistrationStatus("WITHDRAWN")).toBe(false);
    expect(isActiveRegistrationStatus("withdrawn")).toBe(false);
    expect(isActiveRegistrationStatus("CANCELLED")).toBe(false);
    expect(isActiveRegistrationStatus("cancelled")).toBe(false);
    expect(isActiveRegistrationStatus("REJECTED")).toBe(false);
    expect(isActiveRegistrationStatus("rejected")).toBe(false);

    // Edge cases
    expect(isActiveRegistrationStatus(null)).toBe(false);
    expect(isActiveRegistrationStatus(undefined)).toBe(false);
    expect(isActiveRegistrationStatus("")).toBe(false);
  });

  it("filters out invalid/non-numeric registration IDs during withdrawal process", () => {
    const rawRegs = [
      { id: 12, playerName: "Player A" },
      { id: "34", playerName: "Player B" },
      { id: undefined, playerName: "Player C" },
      { id: "not-a-number", playerName: "Player D" },
      { id: -5, playerName: "Player E" },
      { id: 0, playerName: "Player F" },
    ];

    const validIds = rawRegs
      .map(r => Number(r.id))
      .filter(id => !isNaN(id) && id > 0);

    expect(validIds).toEqual([12, 34]);
  });

  it("verifies format-specific withdrawal isolates target registration without withdrawing all formats", () => {
    const registrations = [
      { id: 101, eventId: 20, matchType: "SINGLES", familyMemberId: 2, status: "CONFIRMED" },
      { id: 102, eventId: 20, matchType: "DOUBLES", familyMemberId: 2, status: "CONFIRMED" },
    ];

    const targetRegIdToWithdraw = 102; // Withdraw Doubles only
    const targetRegs = targetRegIdToWithdraw
      ? registrations.filter(r => Number(r.id) === targetRegIdToWithdraw)
      : registrations;

    expect(targetRegs).toHaveLength(1);
    expect(targetRegs[0].matchType).toBe("DOUBLES");

    const withdrawnIds = targetRegs.map(r => Number(r.id));
    const updatedRegistrations = registrations.map(r =>
      withdrawnIds.includes(Number(r.id)) ? { ...r, status: "WITHDRAWN" } : r
    );

    // Doubles is now WITHDRAWN, Singles remains CONFIRMED
    const activeRemaining = updatedRegistrations.filter(r => isActiveRegistrationStatus(r.status));
    expect(activeRemaining).toHaveLength(1);
    expect(activeRemaining[0].id).toBe(101);
    expect(activeRemaining[0].matchType).toBe("SINGLES");
  });

  it("strictly isolates Spouse registration from Self even with identical surnames", () => {
    const headName = "Sandeep Kamarapu";
    const spouseMember = { id: 201, name: "Sunita Kamarapu", relation: "Spouse" };
    const familyMembersList = [spouseMember];

    // 1. isSelfRelationOrMember checks
    expect(isSelfRelationOrMember("Spouse", 201, "Sunita Kamarapu", headName)).toBe(false);
    expect(isSelfRelationOrMember("Wife", 201, "Sunita Kamarapu", headName)).toBe(false);
    expect(isSelfRelationOrMember(null, 201, "Sunita Kamarapu", headName)).toBe(false);
    expect(isSelfRelationOrMember(null, null, "Sunita Kamarapu", headName)).toBe(false);

    // 2. Spouse registration with full backend DTO fields
    const spouseReg = {
      id: 701,
      eventId: 50,
      eventName: "Table Tennis Open",
      status: "CONFIRMED",
      playerName: "Sunita Kamarapu",
      relation: "Spouse",
      familyMemberId: 201,
    };

    // When viewing as Self: MUST be false
    expect(isRegistrationForMemberHelper(spouseReg, "self", familyMembersList, headName)).toBe(false);
    expect(isRegistrationForMemberHelper(spouseReg, "fam-self", familyMembersList, headName)).toBe(false);

    // When viewing as Spouse: MUST be true
    expect(isRegistrationForMemberHelper(spouseReg, 201, familyMembersList, headName)).toBe(true);
    expect(isRegistrationForMemberHelper(spouseReg, "201", familyMembersList, headName)).toBe(true);

    // 3. Spouse registration with nested familyMember object fallback
    const spouseRegNested = {
      id: 702,
      eventId: 50,
      eventName: "Table Tennis Open",
      status: "CONFIRMED",
      playerName: "Sunita Kamarapu",
      relation: "Spouse",
      familyMember: { id: 201 },
    };
    expect(isRegistrationForMemberHelper(spouseRegNested, "self", familyMembersList, headName)).toBe(false);
    expect(isRegistrationForMemberHelper(spouseRegNested, 201, familyMembersList, headName)).toBe(true);

    // 4. Simulate getMemberRegsForEvent behavior
    const allRegistrations = [spouseReg];
    const eventCard = { id: 50, name: "Table Tennis Open" };

    const getMemberRegs = (selectedMember: string | number) => {
      return allRegistrations.filter(r =>
        r.eventId === eventCard.id &&
        isRegistrationForMemberHelper(r, selectedMember, familyMembersList, headName) &&
        isActiveRegistrationStatus(r.status)
      );
    };

    // Self has no registrations for this event
    const selfRegs = getMemberRegs("self");
    expect(selfRegs).toHaveLength(0);

    // Spouse has 1 registration for this event
    const spouseRegs = getMemberRegs(201);
    expect(spouseRegs).toHaveLength(1);
    expect(spouseRegs[0].playerName).toBe("Sunita Kamarapu");
  });

  it("filters out Self (Head) with positive numeric database ID from familyMembersOnly to prevent duplicate dropdown entries", () => {
    const currentUserName = "sandeep kamarapu";
    const rawFamilyMembers = [
      { id: 18, name: "sandeep kamarapu", relation: "Self (Head)" },
      { id: 136, name: "Sindhuja Chinthala", relation: "Spouse" },
      { id: 154, name: "Udvith Sai", relation: "Son" },
      { id: 155, name: "Rithika", relation: "Daughter" },
    ];

    // 1. isSelfRelationOrMember checks
    expect(isSelfRelationOrMember("Self (Head)", 18, "sandeep kamarapu", currentUserName)).toBe(true);
    expect(isSelfRelationOrMember(null, 18, "sandeep kamarapu", currentUserName)).toBe(true);
    expect(isSelfRelationOrMember("Spouse", 136, "Sindhuja Chinthala", currentUserName)).toBe(false);
    expect(isSelfRelationOrMember("Son", 154, "Udvith Sai", currentUserName)).toBe(false);
    expect(isSelfRelationOrMember("Daughter", 155, "Rithika", currentUserName)).toBe(false);

    // 2. Filter familyMembersOnly
    const familyMembersOnly = rawFamilyMembers.filter(m => {
      const rel = m.relation || (m as any).relationship || "";
      const isSelf = isSelfRelationOrMember(rel, m.id, m.name, currentUserName);
      return !isSelf;
    });

    // Self (Head) with ID 18 MUST be excluded
    expect(familyMembersOnly).toHaveLength(3);
    expect(familyMembersOnly.map(m => m.id)).toEqual([136, 154, 155]);
    expect(familyMembersOnly.some(m => m.name === "sandeep kamarapu")).toBe(false);

    // 3. Dropdown options simulation
    const dropdownOptions = [
      { value: "self", label: `👤 ${currentUserName}` },
      ...familyMembersOnly.map(m => ({ value: String(m.id), label: `👥 ${m.name} (${m.relation})` })),
    ];

    expect(dropdownOptions).toHaveLength(4);
    expect(dropdownOptions[0]).toEqual({ value: "self", label: "👤 sandeep kamarapu" });
    expect(dropdownOptions.filter(opt => opt.label.includes("sandeep kamarapu"))).toHaveLength(1);
  });

  it("getFamilyMembersOnly helper function strictly filters out Self regardless of case, relation, or ID format", () => {
    const rawList = [
      { id: "fam-1", name: "Sandeep Kamarapu", relation: "Self (Head)" },
      { id: "fam-2", name: "Sindhuja Chinthala", relation: "Spouse" },
      { id: "fam-3", name: "Udvith Sai", relation: "Son" },
      { id: "fam-4", name: "Sandeep Kamarapu", relation: "Head" },
      { id: "self", name: "Sandeep Kamarapu", relation: "Self" },
    ];

    const result = getFamilyMembersOnly(rawList, "Sandeep Kamarapu");
    expect(result).toHaveLength(2);
    expect(result.map(m => m.name)).toEqual(["Sindhuja Chinthala", "Udvith Sai"]);

    // Test with empty or undefined
    expect(getFamilyMembersOnly(undefined as any, "Sandeep Kamarapu")).toEqual([]);
    expect(getFamilyMembersOnly([], "Sandeep Kamarapu")).toEqual([]);
  });

  describe("Doubles Partner Confirmation and Dashboard / Export Alignment", () => {
    const currentUserId = 101;
    const currentUserName = "Sandeep Kamarapu";

    it("matches Self when the logged-in user is a CONFIRMED doubles partner on another player's registration", () => {
      const regAsConfirmedPartner = {
        id: 999,
        eventId: 20,
        playerName: "Rahul Sharma",
        userId: 202,
        relation: "SELF",
        familyMemberId: null,
        matchType: "DOUBLES",
        partnerUserId: currentUserId,
        partnerName: currentUserName,
        partnerStatus: "CONFIRMED",
      };

      // When checking for "self", it should recognize that the current user is a confirmed partner on this reg!
      expect(isRegistrationForMemberHelper(regAsConfirmedPartner, "self", [], currentUserName, currentUserId)).toBe(true);
      expect(isRegistrationForMemberHelper(regAsConfirmedPartner, undefined, [], currentUserName, currentUserId)).toBe(true);
      // But checking for another family member ID should return false
      expect(isRegistrationForMemberHelper(regAsConfirmedPartner, 303, [], currentUserName, currentUserId)).toBe(false);
    });

    it("does NOT match Self when partner invitation is PENDING, INVITED, or DECLINED", () => {
      const regPending = {
        id: 998,
        eventId: 20,
        playerName: "Rahul Sharma",
        userId: 202,
        partnerUserId: currentUserId,
        partnerName: currentUserName,
        partnerStatus: "PENDING",
      };
      expect(isRegistrationForMemberHelper(regPending, "self", [], currentUserName, currentUserId)).toBe(false);

      const regInvited = {
        ...regPending,
        partnerStatus: "INVITED",
      };
      expect(isRegistrationForMemberHelper(regInvited, "self", [], currentUserName, currentUserId)).toBe(false);

      const regDeclined = {
        ...regPending,
        partnerStatus: "DECLINED",
      };
      expect(isRegistrationForMemberHelper(regDeclined, "self", [], currentUserName, currentUserId)).toBe(false);
    });

    it("matches family member when partner family member ID matches and status is CONFIRMED", () => {
      const regWithFamilyPartner = {
        id: 997,
        eventId: 20,
        playerName: "Rahul Sharma",
        userId: 202,
        partnerFamilyMemberId: 505,
        partnerName: "Sindhuja Chinthala",
        partnerConfirmationStatus: "CONFIRMED",
      };

      // Checking for family member 505 should match
      expect(isRegistrationForMemberHelper(regWithFamilyPartner, 505, [], currentUserName, currentUserId)).toBe(true);
      expect(isRegistrationForMemberHelper(regWithFamilyPartner, "505", [], currentUserName, currentUserId)).toBe(true);
      // Checking for Self should NOT match because the partner is family member 505
      expect(isRegistrationForMemberHelper(regWithFamilyPartner, "self", [], currentUserName, currentUserId)).toBe(false);
    });

    it("extractPartnerExportDetails correctly formats partner information for exports", () => {
      // 1. Primary player with confirmed partner
      const primaryPlayer = {
        id: 1,
        playerName: "Rahul Sharma",
        partnerName: "Sandeep Kamarapu",
        partnerFlatNumber: "Tower 2-401",
        partnerPhone: "9876543210",
        partnerStatus: "CONFIRMED",
      };
      const details1 = extractPartnerExportDetails(primaryPlayer as any);
      expect(details1.partnerName).toBe("Sandeep Kamarapu");
      expect(details1.partnerContact).toBe("Flat Tower 2-401 · 9876543210");
      expect(details1.partnerStatus).toBe("Confirmed");

      // 2. Open pool participant
      const openPoolPlayer = {
        id: 2,
        playerName: "Sneha Patel",
        openPool: true,
      };
      const details2 = extractPartnerExportDetails(openPoolPlayer as any);
      expect(details2.partnerName).toBe("Open Pairing Pool");
      expect(details2.partnerStatus).toBe("Looking for Partner");

      // 3. Singles player (no partner)
      const singlesPlayer = {
        id: 3,
        playerName: "Vijay Kumar",
      };
      const details3 = extractPartnerExportDetails(singlesPlayer as any);
      expect(details3.partnerName).toBe("—");
      expect(details3.partnerContact).toBe("—");
      expect(details3.partnerStatus).toBe("—");
    });
  });

  describe("Child and Family Member Registration Isolation", () => {
    const headName = "Sandeep Kamarapu";
    const headId = 1;

    // Household with:
    // Kid 1: Female, 8 yrs (Daughter)
    // Kid 2: Female, 10 yrs (Daughter)
    // Kid 3: Male, 9 yrs (Son)
    const householdMembers = [
      { id: 101, name: "Aanya Kamarapu", relation: "Daughter" },
      { id: 102, name: "Diya Kamarapu", relation: "Daughter" },
      { id: 103, name: "Aarav Kamarapu", relation: "Son" },
    ];

    it("does NOT leak Kid 1's registration to Kid 2 when both are daughters and user switches dropdown", () => {
      // Kid 1 registers for an event
      const kid1Reg = {
        id: 901,
        eventId: 55,
        playerName: "Aanya Kamarapu",
        relation: "Daughter",
        familyMemberId: 101,
        status: "CONFIRMED",
        matchType: "SINGLES",
      };

      // When dropdown is set to Kid 1: matches
      expect(isRegistrationForMemberHelper(kid1Reg, 101, householdMembers, headName, headId)).toBe(true);
      expect(isRegistrationForMemberHelper(kid1Reg, "101", householdMembers, headName, headId)).toBe(true);

      // When dropdown is switched to Kid 2: MUST NOT MATCH!
      expect(isRegistrationForMemberHelper(kid1Reg, 102, householdMembers, headName, headId)).toBe(false);
      expect(isRegistrationForMemberHelper(kid1Reg, "102", householdMembers, headName, headId)).toBe(false);

      // When dropdown is switched to Male Kid (Kid 3): MUST NOT MATCH!
      expect(isRegistrationForMemberHelper(kid1Reg, 103, householdMembers, headName, headId)).toBe(false);
      expect(isRegistrationForMemberHelper(kid1Reg, "103", householdMembers, headName, headId)).toBe(false);

      // When dropdown is set to Self: MUST NOT MATCH!
      expect(isRegistrationForMemberHelper(kid1Reg, "self", householdMembers, headName, headId)).toBe(false);
    });

    it("does NOT leak registration between multiple male kids (sons)", () => {
      const brothers = [
        { id: 201, name: "Aarav Kamarapu", relation: "Son" },
        { id: 202, name: "Vihaan Kamarapu", relation: "Son" },
      ];

      const son1Reg = {
        id: 902,
        eventId: 60,
        playerName: "Aarav Kamarapu",
        relation: "Son",
        familyMemberId: 201,
        status: "CONFIRMED",
      };

      // Son 1 matches Son 1
      expect(isRegistrationForMemberHelper(son1Reg, 201, brothers, headName, headId)).toBe(true);
      // Son 1 registration does NOT match Son 2
      expect(isRegistrationForMemberHelper(son1Reg, 202, brothers, headName, headId)).toBe(false);
    });

    it("does NOT leak registration when children all share generic relation 'Child'", () => {
      const genericChildren = [
        { id: 301, name: "Aanya Kamarapu", relation: "Child" },
        { id: 302, name: "Diya Kamarapu", relation: "Child" },
        { id: 303, name: "Aarav Kamarapu", relation: "Child" },
      ];

      const kid1Reg = {
        id: 903,
        eventId: 70,
        playerName: "Aanya Kamarapu",
        relation: "Child",
        familyMemberId: 301,
        status: "CONFIRMED",
      };

      // Matches Kid 1
      expect(isRegistrationForMemberHelper(kid1Reg, 301, genericChildren, headName, headId)).toBe(true);
      // Does NOT match Kid 2
      expect(isRegistrationForMemberHelper(kid1Reg, 302, genericChildren, headName, headId)).toBe(false);
      // Does NOT match Male Kid (Kid 3)
      expect(isRegistrationForMemberHelper(kid1Reg, 303, genericChildren, headName, headId)).toBe(false);
    });

    it("isolates registrations correctly even when familyMemberId is missing, using exact player name", () => {
      const kid1RegNoId = {
        id: 904,
        eventId: 80,
        playerName: "Aanya Kamarapu",
        relation: "Daughter",
        familyMemberId: null,
        status: "CONFIRMED",
      };

      // Matches Kid 1 by exact player name
      expect(isRegistrationForMemberHelper(kid1RegNoId, 101, householdMembers, headName, headId)).toBe(true);
      // Does NOT match Kid 2 even though relation is "Daughter"
      expect(isRegistrationForMemberHelper(kid1RegNoId, 102, householdMembers, headName, headId)).toBe(false);
      // Does NOT match Male Kid
      expect(isRegistrationForMemberHelper(kid1RegNoId, 103, householdMembers, headName, headId)).toBe(false);
    });

    it("does not match by relation when multiple members share that relation and name/id are absent", () => {
      const ambiguousReg = {
        id: 905,
        eventId: 90,
        playerName: null,
        relation: "Daughter",
        familyMemberId: null,
        status: "CONFIRMED",
      };

      // Ambiguous: 2 daughters exist, so neither should automatically claim this registration
      expect(isRegistrationForMemberHelper(ambiguousReg, 101, householdMembers, headName, headId)).toBe(false);
      expect(isRegistrationForMemberHelper(ambiguousReg, 102, householdMembers, headName, headId)).toBe(false);
    });
  });
});


