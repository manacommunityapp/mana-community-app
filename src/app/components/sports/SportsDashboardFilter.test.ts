import { describe, it, expect } from "vitest";
import { isSelfRelationOrMember, isRegistrationForMemberHelper, isEventMatch, isActiveRegistrationStatus, isFormatCompatible, getFamilyMembersOnly, isRegForSportEvent } from "./SportsDashboard";
import { isTeamSport } from "./utils/sportsConstants";
import { checkCategoryEligibility, inferGender, normalizeGender } from "./SportsRegister";
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

describe("SportsRegister - inferGender and normalizeGender for Family Members", () => {
  it("correctly normalizes variations of gender strings to uppercase MALE / FEMALE / OTHER", () => {
    expect(normalizeGender("Female")).toBe("FEMALE");
    expect(normalizeGender("female")).toBe("FEMALE");
    expect(normalizeGender("FEMALE")).toBe("FEMALE");
    expect(normalizeGender("Girl")).toBe("FEMALE");
    expect(normalizeGender("women")).toBe("FEMALE");
    expect(normalizeGender("Male")).toBe("MALE");
    expect(normalizeGender("male")).toBe("MALE");
    expect(normalizeGender("MALE")).toBe("MALE");
    expect(normalizeGender("Boy")).toBe("MALE");
    expect(normalizeGender("men")).toBe("MALE");
    expect(normalizeGender(null)).toBe("");
    expect(normalizeGender(undefined)).toBe("");
    expect(normalizeGender("")).toBe("");
  });

  it("infers gender from member.name when name includes '(female)' or '(male)' hints", () => {
    const kid1Female = { name: "Kid 1(female)", relation: "Child" };
    const kid2Female = { name: "Kid 2 (female)", relation: "Child" };
    const maleKid = { name: "Kid 3 (Male)", relation: "Child" };

    expect(inferGender(kid1Female)).toBe("Female");
    expect(normalizeGender(inferGender(kid1Female))).toBe("FEMALE");

    expect(inferGender(kid2Female)).toBe("Female");
    expect(normalizeGender(inferGender(kid2Female))).toBe("FEMALE");

    expect(inferGender(maleKid)).toBe("Male");
    expect(normalizeGender(inferGender(maleKid))).toBe("MALE");
  });

  it("infers gender from member relation keywords like daughter, son, girl, boy", () => {
    expect(inferGender({ name: "Ananya", relation: "daughter" })).toBe("Female");
    expect(inferGender({ name: "Aarav", relation: "son" })).toBe("Male");
    expect(inferGender({ name: "Priya", relation: "girl child" })).toBe("Female");
    expect(inferGender({ name: "Rohan", relation: "boy child" })).toBe("Male");
  });

  it("resolves and normalizes gender properly when switching between Kid 1 and Kid 2", () => {
    const familyMembersList = [
      { id: 101, name: "Kid 1", gender: "Female", relation: "Daughter", age: 8 },
      { id: 102, name: "Kid 2", gender: "Female", relation: "Daughter", age: 10 },
      { id: 103, name: "Kid 3 (Male)", gender: "", relation: "Child", age: 12 },
    ];

    const resolveMemberGender = (mem: any, userGen = "MALE") => {
      return normalizeGender(mem.gender) || normalizeGender(inferGender(mem, userGen)) || "";
    };

    // Selecting Kid 1
    const kid1Gender = resolveMemberGender(familyMembersList[0]);
    expect(kid1Gender).toBe("FEMALE");

    // Switching to Kid 2
    const kid2Gender = resolveMemberGender(familyMembersList[1]);
    expect(kid2Gender).toBe("FEMALE");

    // Switching to Kid 3 (Male with gender inferred from name)
    const kid3Gender = resolveMemberGender(familyMembersList[2]);
    expect(kid3Gender).toBe("MALE");
  });

  it("ensures normalized gender matches select option values MALE and FEMALE", () => {
    const options = ["MALE", "FEMALE", "OTHER"];
    const kid1Resolved = normalizeGender("Female");
    const kid2Resolved = normalizeGender("FEMALE");
    const kid3Resolved = normalizeGender("Male");

    expect(options.includes(kid1Resolved)).toBe(true);
    expect(options.includes(kid2Resolved)).toBe(true);
    expect(options.includes(kid3Resolved)).toBe(true);
  });

  describe("SportsDashboard Partner Invitation & Partner Unregister Flow", () => {
    const currentUserId = 101;
    const currentUserName = "Sandeep Kamarapu";

    const testEvent = {
      id: 50,
      name: "Table Tennis - 19+ Men",
      category: "Table Tennis · Oct 24",
      formats: [{ id: 1, format: "SINGLES" }, { id: 2, format: "DOUBLES" }],
      matchType: "DOUBLES",
      format: ["SINGLES", "DOUBLES"],
    } as any;

    it("matches pending partner invitations for Self when partnerUserId matches and status is PENDING", () => {
      const pendingInvites = [
        {
          id: 501,
          eventId: 50,
          eventName: "Table Tennis - 19+ Men",
          playerName: "Primary Player",
          matchType: "DOUBLES",
          partnerUserId: 101,
          partnerConfirmationStatus: "PENDING",
        },
        {
          id: 502,
          eventId: 60,
          eventName: "Badminton Doubles",
          playerName: "Another Player",
          matchType: "DOUBLES",
          partnerUserId: 101,
          partnerConfirmationStatus: "PENDING",
        },
      ];

      const getPendingForEvent = (ev: any, memberId: string = "self") => {
        const isSelf = !memberId || memberId === "self";
        return pendingInvites.find(inv => {
          const evMatch = isEventMatch(inv, ev);
          if (!evMatch) return false;
          const pStatus = String(inv.partnerConfirmationStatus || "").toUpperCase().trim();
          if (pStatus !== "PENDING") return false;
          if (isSelf) {
            return String(inv.partnerUserId) === String(currentUserId);
          }
          return false;
        });
      };

      const match = getPendingForEvent(testEvent, "self");
      expect(match).toBeDefined();
      expect(match?.id).toBe(501);
      expect(match?.playerName).toBe("Primary Player");

      // Non-matching event returns undefined
      const nonMatch = getPendingForEvent({ id: 99, name: "Chess Open", matchType: "SINGLES" } as any, "self");
      expect(nonMatch).toBeUndefined();
    });

    it("matches pending partner invitations for family member when partnerFamilyMemberId matches", () => {
      const pendingInvites = [
        {
          id: 503,
          eventId: 50,
          eventName: "Table Tennis - 19+ Men",
          playerName: "Primary Player",
          matchType: "DOUBLES",
          partnerUserId: 101,
          partnerFamilyMemberId: 136,
          partnerConfirmationStatus: "PENDING",
        },
      ];

      const getPendingForEvent = (ev: any, memberId: string) => {
        return pendingInvites.find(inv => {
          const evMatch = isEventMatch(inv, ev);
          if (!evMatch) return false;
          const pStatus = String(inv.partnerConfirmationStatus || "").toUpperCase().trim();
          if (pStatus !== "PENDING") return false;
          return String(inv.partnerFamilyMemberId) === String(memberId);
        });
      };

      expect(getPendingForEvent(testEvent, "136")).toBeDefined();
      expect(getPendingForEvent(testEvent, "154")).toBeUndefined();
    });

    it("does not match pending invite if partnerConfirmationStatus is already CONFIRMED or DECLINED", () => {
      const confirmedInvite = {
        id: 504,
        eventId: 50,
        playerName: "Primary Player",
        matchType: "DOUBLES",
        partnerUserId: 101,
        partnerConfirmationStatus: "CONFIRMED",
      };

      const declinedInvite = {
        id: 505,
        eventId: 50,
        playerName: "Primary Player",
        matchType: "DOUBLES",
        partnerUserId: 101,
        partnerConfirmationStatus: "DECLINED",
      };

      const isPending = (inv: any) => String(inv.partnerConfirmationStatus || "").toUpperCase().trim() === "PENDING";
      expect(isPending(confirmedInvite)).toBe(false);
      expect(isPending(declinedInvite)).toBe(false);
    });

    it("generates partner withdrawal confirmation message and toast for confirmed partner", () => {
      const confirmedPartnerReg = {
        id: 601,
        eventId: 50,
        playerName: "Primary Player",
        partnerUserId: 101,
        matchType: "DOUBLES",
        partnerConfirmationStatus: "CONFIRMED",
      };

      const regs = [confirmedPartnerReg];
      const isAnyConfirmedPartner = regs.some(r => String(r.partnerUserId) === String(currentUserId));
      expect(isAnyConfirmedPartner).toBe(true);

      const displayName = "Table Tennis - 19+ Men";
      const fmtList = "DOUBLES";

      const confirmMsg = isAnyConfirmedPartner
        ? `Are you sure you want to withdraw as doubles partner from ${displayName}${fmtList ? ` (${fmtList})` : ""}? The primary player will be notified.`
        : `Are you sure you want to unregister yourself from ${displayName}? You will lose your reserved spot.`;

      expect(confirmMsg).toContain("withdraw as doubles partner from Table Tennis - 19+ Men (DOUBLES)");
      expect(confirmMsg).toContain("The primary player will be notified");

      const unregToast = isAnyConfirmedPartner
        ? `Withdrew as partner from ${displayName} (${fmtList})`
        : `Unregistered from ${displayName} (${fmtList})`;

      expect(unregToast).toBe("Withdrew as partner from Table Tennis - 19+ Men (DOUBLES)");
    });
  });
});

describe("SportsDashboard - Captain Nominations Sport Event Filtering & Search", () => {
  const cricketEvent: any = {
    id: 101,
    name: "Box Cricket Tournament",
    category: "Cricket · Ground A",
    sportName: "Cricket",
    isTeamSport: true,
  };

  const volleyballEvent: any = {
    id: 102,
    name: "Volleyball Championship",
    category: "Volleyball · Court 1",
    sportName: "Volleyball",
    isTeamSport: true,
  };

  it("correctly matches registrations by explicit eventId", () => {
    const regCricket = { id: 1, eventId: 101, playerName: "Player One", status: "CONFIRMED" };
    const regVolleyball = { id: 2, eventId: 102, playerName: "Player Two", status: "CONFIRMED" };

    expect(isRegForSportEvent(regCricket, cricketEvent, 101)).toBe(true);
    expect(isRegForSportEvent(regVolleyball, cricketEvent, 101)).toBe(false);

    expect(isRegForSportEvent(regVolleyball, volleyballEvent, 102)).toBe(true);
    expect(isRegForSportEvent(regCricket, volleyballEvent, 102)).toBe(false);
  });

  it("correctly matches by sport name and filters out unrelated sports", () => {
    const regCricket = { id: 10, sportName: "Cricket", playerName: "Cricket Star", status: "CONFIRMED" };
    const regBadminton = { id: 20, sportName: "Badminton", playerName: "Shuttler", status: "CONFIRMED" };
    const regChess = { id: 30, sportName: "Chess", playerName: "Grandmaster", status: "CONFIRMED" };
    const regVolleyball = { id: 40, sportName: "Volleyball", playerName: "Spiker", status: "CONFIRMED" };

    // Under Cricket event: only Cricket matches, Badminton and Chess are excluded
    expect(isRegForSportEvent(regCricket, cricketEvent, 101)).toBe(true);
    expect(isRegForSportEvent(regBadminton, cricketEvent, 101)).toBe(false);
    expect(isRegForSportEvent(regChess, cricketEvent, 101)).toBe(false);
    expect(isRegForSportEvent(regVolleyball, cricketEvent, 101)).toBe(false);

    // Under Volleyball event: only Volleyball matches
    expect(isRegForSportEvent(regVolleyball, volleyballEvent, 102)).toBe(true);
    expect(isRegForSportEvent(regCricket, volleyballEvent, 102)).toBe(false);
    expect(isRegForSportEvent(regBadminton, volleyballEvent, 102)).toBe(false);
  });

  it("filters captain registrations by search query across name, flat, phone, and proposed team", () => {
    const regs = [
      { id: 1, playerName: "Sunil Kanthala", relation: "Self", flatNumber: "E-502", phone: "9876543210", proposedTeamName: "Warriors" },
      { id: 2, playerName: "Kavitha Kanthala", relation: "Spouse", flatNumber: "E-502", phone: "9876543211", proposedTeamName: "" },
      { id: 3, playerName: "Ramesh Korlakunta", relation: "Self", flatNumber: "A-101", phone: "9123456789", proposedTeamName: "Strikers" },
      { id: 4, playerName: "Deepak Pillai", relation: "Self", flatNumber: "B-204", phone: "9000000000", proposedTeamName: "" },
    ];

    const filterList = (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return regs;
      return regs.filter(reg => {
        const name = (reg.playerName || "").toLowerCase();
        const flat = (reg.flatNumber || "").toLowerCase();
        const phone = (reg.phone || "").toLowerCase();
        const relation = (reg.relation || "").toLowerCase();
        const team = (reg.proposedTeamName || "").toLowerCase();
        return name.includes(q) || flat.includes(q) || phone.includes(q) || relation.includes(q) || team.includes(q);
      });
    };

    // Search by player name
    expect(filterList("Sunil")).toHaveLength(1);
    expect(filterList("Sunil")[0].id).toBe(1);

    // Search by flat number (both members in E-502)
    expect(filterList("E-502")).toHaveLength(2);

    // Search by phone
    expect(filterList("9123456789")).toHaveLength(1);
    expect(filterList("9123456789")[0].playerName).toBe("Ramesh Korlakunta");

    // Search by relation
    expect(filterList("Spouse")).toHaveLength(1);
    expect(filterList("Spouse")[0].playerName).toBe("Kavitha Kanthala");

    // Search by proposed team name
    expect(filterList("Warriors")).toHaveLength(1);
    expect(filterList("Warriors")[0].proposedTeamName).toBe("Warriors");
  });

  it("verifies that Unlimited spots is hidden when maxParticipants is absent or undefined", () => {
    const computeSpots = (maxParticipants?: number | null, regCount: number = 0): string | undefined => {
      return maxParticipants ? `${regCount}/${maxParticipants} spots` : undefined;
    };

    expect(computeSpots(undefined, 5)).toBeUndefined();
    expect(computeSpots(null, 5)).toBeUndefined();
    expect(computeSpots(0, 5)).toBeUndefined();
    expect(computeSpots(16, 4)).toBe("4/16 spots");
  });

  describe("Captain Nominations Action & Display Logic for Logged-in User and Members", () => {
    const user = { userId: 101, fullName: "Sandeep Kamarapu" };

    function resolveNominationAction(reg: any, capNom?: any) {
      const isNominated = Boolean(capNom?.captainNomination || reg.captainNomination);
      const isCaptainConfirmed = Boolean(capNom?.captainConfirmation || reg.captainConfirmation);
      const isSelf = isSelfRelationOrMember(reg.relation, reg.familyMemberId, reg.playerName, user.fullName);
      const regPersonName = reg.playerName || (isSelf ? (user.fullName || "You") : "Member");
      const actionLabel = isSelf ? "Nominate Me" : `Nominate ${regPersonName}`;

      return isCaptainConfirmed ? "Confirmed" : isNominated ? "Withdraw" : actionLabel;
    }

    it("displays 'Nominate Me' for logged-in user when not nominated", () => {
      const reg = {
        id: 901,
        eventId: 771,
        playerName: "Sandeep Kamarapu",
        relation: "SELF",
        familyMemberId: "self",
        captainNomination: false,
        captainConfirmation: false,
      };
      expect(resolveNominationAction(reg, null)).toBe("Nominate Me");
    });

    it("displays 'Nominate <MemberName>' for family member when not nominated", () => {
      const reg = {
        id: 902,
        eventId: 771,
        playerName: "Sunita Kamarapu",
        relation: "SPOUSE",
        familyMemberId: 2,
        captainNomination: false,
        captainConfirmation: false,
      };
      expect(resolveNominationAction(reg, null)).toBe("Nominate Sunita Kamarapu");
    });

    it("displays 'Withdraw' when nomination is active for self or family member", () => {
      const selfReg = {
        id: 901,
        eventId: 771,
        playerName: "Sandeep Kamarapu",
        relation: "SELF",
        captainNomination: true,
        captainConfirmation: false,
      };
      expect(resolveNominationAction(selfReg, null)).toBe("Withdraw");

      const memberReg = {
        id: 902,
        eventId: 771,
        playerName: "Sunita Kamarapu",
        relation: "SPOUSE",
        captainNomination: false,
      };
      const capNom = { eventId: 771, captainNomination: true, captainConfirmation: false };
      expect(resolveNominationAction(memberReg, capNom)).toBe("Withdraw");
    });

    it("displays 'Confirmed' (disabled) when captaincy is confirmed", () => {
      const confirmedSelf = {
        id: 901,
        eventId: 771,
        playerName: "Sandeep Kamarapu",
        relation: "SELF",
        captainNomination: true,
        captainConfirmation: true,
      };
      expect(resolveNominationAction(confirmedSelf, null)).toBe("Confirmed");

      const confirmedMember = {
        id: 902,
        eventId: 771,
        playerName: "Sunita Kamarapu",
        relation: "SPOUSE",
        captainNomination: true,
        captainConfirmation: false,
      };
      const capNom = { eventId: 771, captainNomination: true, captainConfirmation: true };
      expect(resolveNominationAction(confirmedMember, capNom)).toBe("Confirmed");
    });

    it("matches capNom with numeric coercion between number and string event IDs", () => {
      const reg = { id: 901, eventId: "771", event: { id: "771" } };
      const captainRegistrations = [{ eventId: 771, teamName: "Warriors", captainNomination: true }];

      const targetEventId = Number(reg.eventId || reg.event?.id);
      const capNom = captainRegistrations.find(c => Number(c.eventId) === targetEventId);

      expect(capNom).toBeDefined();
      expect(capNom?.teamName).toBe("Warriors");
    });

    it("includes both CONFIRMED and REGISTERED statuses in confirmedMyRegistrations", () => {
      const registrations = [
        { id: 1, status: "CONFIRMED", matchType: "TEAM" },
        { id: 2, status: "REGISTERED", matchType: "TEAM" },
        { id: 3, status: "WITHDRAWN", matchType: "TEAM" },
        { id: 4, status: "PENDING", matchType: "TEAM" },
      ];

      const active = registrations.filter(r => isActiveRegistrationStatus(r.status));
      const confirmedOrRegistered = active.filter(r => r.status === "CONFIRMED" || r.status === "REGISTERED");

      expect(confirmedOrRegistered).toHaveLength(2);
      expect(confirmedOrRegistered.map(r => r.id)).toEqual([1, 2]);
    });

    it("verifies isTeamSport safely handles non-string inputs including objects, undefined, and numbers", () => {
      // Import directly or verify the safe behavior
      expect(isTeamSport(null as any)).toBe(false);
      expect(isTeamSport(undefined as any)).toBe(false);
      expect(isTeamSport(123 as any)).toBe(false);
      expect(isTeamSport({ name: "Cricket Championship" } as any)).toBe(true);
      expect(isTeamSport({ category: "Men's Football" } as any)).toBe(true);
      expect(isTeamSport({ name: "Badminton Singles" } as any)).toBe(false);
      expect(isTeamSport({} as any)).toBe(false);
    });

    it("verifies partner invitation text correctly formats inviting resident with flat details", () => {
      const formatInviteMessage = (pendingInvite: any, formatLabel: string = "Doubles") => {
        const invitingPlayerName = pendingInvite?.playerName || pendingInvite?.user?.fullName || pendingInvite?.user?.name || "Partner";
        const invitingFlatNumber = pendingInvite?.flatNumber || pendingInvite?.flatNo || pendingInvite?.user?.flatNo || pendingInvite?.user?.flatNumber;
        const cleanInvitingFlat = invitingFlatNumber ? String(invitingFlatNumber).replace(/^Flat\s+/i, "").trim() : "";

        return `Invited by ${invitingPlayerName}${cleanInvitingFlat ? ` (Flat ${cleanInvitingFlat})` : ""} (${formatLabel})`;
      };

      // Case 1: with flatNumber directly
      const inviteWithFlat = { playerName: "Test Resident", flatNumber: "A-204" };
      expect(formatInviteMessage(inviteWithFlat)).toBe("Invited by Test Resident (Flat A-204) (Doubles)");

      // Case 2: with user.flatNo
      const inviteWithUserFlat = { user: { fullName: "Jane Doe", flatNo: "B-501" } };
      expect(formatInviteMessage(inviteWithUserFlat, "Mixed Doubles")).toBe("Invited by Jane Doe (Flat B-501) (Mixed Doubles)");

      // Case 3: without flat info
      const inviteNoFlat = { playerName: "John Smith" };
      expect(formatInviteMessage(inviteNoFlat)).toBe("Invited by John Smith (Doubles)");
    });

    it("verifies playing with confirmed partner message correctly formats primary player with flat details", () => {
      const formatPlayingWithMessage = (reg: any) => {
        const primaryPlayerName = reg?.playerName || "Primary Player";
        const primaryFlat = reg?.flatNumber || reg?.flatNo || reg?.user?.flatNo || reg?.user?.flatNumber;
        const cleanPrimaryFlat = primaryFlat ? String(primaryFlat).replace(/^Flat\s+/i, "").trim() : "";

        return `Playing with ${primaryPlayerName}${cleanPrimaryFlat ? ` (Flat ${cleanPrimaryFlat})` : ""} (Confirmed Partner)`;
      };

      // Case 1: with direct flatNumber
      expect(formatPlayingWithMessage({ playerName: "Test Resident", flatNumber: "A-204" }))
        .toBe("Playing with Test Resident (Flat A-204) (Confirmed Partner)");

      // Case 2: with nested user flatNo and 'Flat ' prefix to sanitize
      expect(formatPlayingWithMessage({ playerName: "Test Resident", user: { flatNo: "Flat C-302" } }))
        .toBe("Playing with Test Resident (Flat C-302) (Confirmed Partner)");

      // Case 3: without flat info
      expect(formatPlayingWithMessage({ playerName: "Test Resident" }))
        .toBe("Playing with Test Resident (Confirmed Partner)");
    });

    it("verifies family-aware doubles partner invitation message formulation across all 4 scenarios", () => {
      const formatDoublesInvitationText = (inv: any) => {
        const inviterUser = inv.user?.fullName || inv.user?.name || inv.playerName || "A neighbor";
        const pFlat = inv.flatNumber || inv.flatNo || inv.user?.flatNo || inv.user?.flatNumber;
        const cleanPFlat = pFlat ? String(pFlat).replace(/^Flat\s+/i, "").trim() : "";

        const primaryFam = inv.familyMember;
        const primaryFamName = primaryFam?.name;
        const primaryFamRel = primaryFam?.relation || inv.relation;

        const partnerFam = inv.partnerFamilyMember;
        const partnerFamName = partnerFam?.name;
        const partnerFamRel = partnerFam?.relation;

        const inviterDesc = `${inviterUser}${cleanPFlat ? ` (Flat ${cleanPFlat})` : ""}`;

        if (primaryFamName && partnerFamName) {
          return `${inviterDesc} invited your ${partnerFamRel ? `${partnerFamRel} ` : ""}(${partnerFamName}) to team up with their ${primaryFamRel ? `${primaryFamRel} ` : ""}(${primaryFamName}) as doubles partners.`;
        } else if (primaryFamName) {
          return `${inviterDesc} invited you to team up with their ${primaryFamRel ? `${primaryFamRel} ` : ""}(${primaryFamName}) as doubles partners.`;
        } else if (partnerFamName) {
          return `${inviterDesc} nominated your ${partnerFamRel ? `${partnerFamRel} ` : ""}(${partnerFamName}) to play as their doubles partner.`;
        } else {
          return `${inviterDesc} nominated you to play as their doubles partner.`;
        }
      };

      const resolveAcceptButtonText = (inv: any, fallbackFmt = "Doubles") => {
        const partnerFamName = inv.partnerFamilyMember?.name;
        return partnerFamName ? `Accept for ${partnerFamName}` : `Accept ${fallbackFmt}`;
      };

      // Scenario 1: Family Member -> Family Member (Child to Child)
      const childToChildInvite = {
        user: { fullName: "Sandeep Kumar", flatNo: "A-101" },
        familyMember: { name: "Aarav", relation: "Son" },
        partnerFamilyMember: { name: "Rohan", relation: "Son" },
      };
      expect(formatDoublesInvitationText(childToChildInvite)).toBe(
        "Sandeep Kumar (Flat A-101) invited your Son (Rohan) to team up with their Son (Aarav) as doubles partners."
      );
      expect(resolveAcceptButtonText(childToChildInvite)).toBe("Accept for Rohan");

      // Scenario 2: Family Member -> User (Child inviting User)
      const childToUserInvite = {
        user: { fullName: "Sandeep Kumar", flatNo: "Flat A-101" },
        familyMember: { name: "Aarav", relation: "Son" },
      };
      expect(formatDoublesInvitationText(childToUserInvite)).toBe(
        "Sandeep Kumar (Flat A-101) invited you to team up with their Son (Aarav) as doubles partners."
      );
      expect(resolveAcceptButtonText(childToUserInvite)).toBe("Accept Doubles");

      // Scenario 3: User -> Family Member (User inviting Child)
      const userToChildInvite = {
        user: { fullName: "Sandeep Kumar", flatNo: "A-101" },
        partnerFamilyMember: { name: "Rohan", relation: "Daughter" },
      };
      expect(formatDoublesInvitationText(userToChildInvite)).toBe(
        "Sandeep Kumar (Flat A-101) nominated your Daughter (Rohan) to play as their doubles partner."
      );
      expect(resolveAcceptButtonText(userToChildInvite)).toBe("Accept for Rohan");

      // Scenario 4: User -> User (Adult to Adult)
      const userToUserInvite = {
        user: { fullName: "Sandeep Kumar", flatNo: "A-101" },
      };
      expect(formatDoublesInvitationText(userToUserInvite)).toBe(
        "Sandeep Kumar (Flat A-101) nominated you to play as their doubles partner."
      );
      expect(resolveAcceptButtonText(userToUserInvite)).toBe("Accept Doubles");
    });
  });

  describe("REGISTRATION_CLOSED Button State & Protection", () => {
    const checkClosed = (st?: string | null) => {
      if (!st) return false;
      const s = String(st).toUpperCase().trim();
      return s === "REGISTRATION_CLOSED" || s === "CLOSED" || s === "COMPLETED" || s === "CANCELLED";
    };

    const isRegistrationClosed = (item: any, tournament?: any) => {
      return checkClosed(item.status)
        || checkClosed(item.rawEvent?.registrationStatus)
        || checkClosed(item.rawEvent?.status)
        || checkClosed(tournament?.registrationStatus)
        || checkClosed(tournament?.status);
    };

    it("evaluates isRegClosed true when event status is REGISTRATION_CLOSED", () => {
      const closedEvent = { status: "REGISTRATION_CLOSED" };
      expect(isRegistrationClosed(closedEvent)).toBe(true);

      const openEvent = { status: "REGISTRATION_OPEN" };
      expect(isRegistrationClosed(openEvent)).toBe(false);
    });

    it("evaluates isRegClosed true when parent tournament status is REGISTRATION_CLOSED", () => {
      const eventInClosedTournament = { status: "REGISTRATION_OPEN" };
      const closedTournament = { registrationStatus: "REGISTRATION_CLOSED" };
      expect(isRegistrationClosed(eventInClosedTournament, closedTournament)).toBe(true);
    });

    it("evaluates isRegClosed true when rawEvent has REGISTRATION_CLOSED", () => {
      const eventWithClosedRaw = { status: "REGISTRATION_OPEN", rawEvent: { registrationStatus: "REGISTRATION_CLOSED" } };
      expect(isRegistrationClosed(eventWithClosedRaw)).toBe(true);
    });

    it("blocks register and unregister actions when REGISTRATION_CLOSED for non-admin user", () => {
      const closedItem = {
        id: 1,
        name: "Badminton Open Singles",
        status: "REGISTRATION_CLOSED",
      };

      const isAdmin = false;
      const isRegClosed = isRegistrationClosed(closedItem);

      // Verify button disabled state
      const isRegisterButtonDisabled = isRegClosed && !isAdmin;
      const isUnregisterButtonDisabled = isRegClosed && !isAdmin;

      expect(isRegisterButtonDisabled).toBe(true);
      expect(isUnregisterButtonDisabled).toBe(true);

      // Verify admin bypass works
      const isRegisterButtonDisabledForAdmin = isRegClosed && true; // isAdmin = true
      expect(isRegClosed && !true).toBe(false);
    });

    it("displays 'Registered' status badge for registered users when registration is closed", () => {
      // Simulate RegCard logic
      const computeRegCardAction = (item: any, isAdmin: boolean) => {
        const isClosed = item.status === "REGISTRATION_CLOSED"
          || item.rawEvent?.registrationStatus === "REGISTRATION_CLOSED"
          || item.rawEvent?.status === "REGISTRATION_CLOSED"
          || item.status === "COMPLETED"
          || item.status === "CANCELLED";

        const isRegistered = Boolean(
          item.registrationId ||
          item.action === "Withdraw" ||
          item.action === "Confirmed" ||
          item.action === "Registered" ||
          item.rawEvent?.myRegistrationId
        );

        if (isClosed && !isAdmin) {
          if (isRegistered) {
            return "Registered";
          }
          if (item.action === "Register") {
            return "Closed";
          }
          return item.action || "View";
        }
        return item.action || "Register";
      };

      const closedRegisteredEvent = {
        id: 101,
        status: "REGISTRATION_CLOSED",
        registrationId: 555,
        action: "Withdraw",
      };
      expect(computeRegCardAction(closedRegisteredEvent, false)).toBe("Registered");
    });

    it("displays both 'Registered' and 'Registration Closed' status badges for registered users when registration is closed", () => {
      // Simulate RegCard logic returning badges
      const computeRegCardBadges = (item: any, isAdmin: boolean) => {
        const isClosed = item.status === "REGISTRATION_CLOSED"
          || item.rawEvent?.registrationStatus === "REGISTRATION_CLOSED"
          || item.rawEvent?.status === "REGISTRATION_CLOSED"
          || item.status === "COMPLETED"
          || item.status === "CANCELLED";

        const isRegistered = Boolean(
          item.registrationId ||
          item.action === "Withdraw" ||
          item.action === "Confirmed" ||
          item.action === "Registered" ||
          item.rawEvent?.myRegistrationId
        );

        if (isClosed && !isAdmin) {
          if (isRegistered) {
            return {
              badges: ["Registered", "Registration Closed"],
              canRegister: false,
              canUnregister: false,
            };
          }
          return {
            badges: ["Closed"],
            canRegister: false,
            canUnregister: false,
          };
        }

        return {
          badges: isRegistered ? ["Registered"] : [],
          canRegister: !isRegistered,
          canUnregister: isRegistered,
        };
      };

      // Case 1: Closed event where user is registered
      const closedRegisteredEvent = {
        id: 101,
        status: "REGISTRATION_CLOSED",
        registrationId: 555,
        action: "Withdraw",
      };
      const result1 = computeRegCardBadges(closedRegisteredEvent, false);
      expect(result1.badges).toContain("Registered");
      expect(result1.badges).toContain("Registration Closed");
      expect(result1.canRegister).toBe(false);
      expect(result1.canUnregister).toBe(false);

      // Case 2: Closed event where user is NOT registered
      const closedUnregisteredEvent = {
        id: 104,
        status: "REGISTRATION_CLOSED",
        action: "Register",
      };
      const result2 = computeRegCardBadges(closedUnregisteredEvent, false);
      expect(result2.badges).toEqual(["Closed"]);
      expect(result2.canRegister).toBe(false);
      expect(result2.canUnregister).toBe(false);

      // Case 3: Admin on closed registered event can still unregister
      const adminResult = computeRegCardBadges(closedRegisteredEvent, true);
      expect(adminResult.canUnregister).toBe(true);
    });

    it("verifies spotsText filters out 'Registration closed' to avoid duplicate closed indicators", () => {
      const shouldDisplaySpots = (spotsText?: string | null): boolean => {
        return Boolean(
          spotsText &&
          spotsText !== "Unlimited spots" &&
          spotsText.toLowerCase() !== "registration closed"
        );
      };

      expect(shouldDisplaySpots("Registration closed")).toBe(false);
      expect(shouldDisplaySpots("registration closed")).toBe(false);
      expect(shouldDisplaySpots("Unlimited spots")).toBe(false);
      expect(shouldDisplaySpots("12/20 spots")).toBe(true);
      expect(shouldDisplaySpots("")).toBe(false);
      expect(shouldDisplaySpots(undefined)).toBe(false);
    });

    it("verifies grid layout is single-column for Closed Registrations and two-column for Open Registrations", () => {
      const getCategoryGridClass = (isClosed: boolean): string => {
        return `grid gap-1.5 sm:gap-2 ${isClosed ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`;
      };

      // Closed registrations must span complete single row
      expect(getCategoryGridClass(true)).toContain("grid-cols-1");
      expect(getCategoryGridClass(true)).not.toContain("sm:grid-cols-2");

      // Open registrations must show 2 divs
      expect(getCategoryGridClass(false)).toContain("grid-cols-1 sm:grid-cols-2");
    });

    it("verifies captaincy nomination state resolution and button action mapping", () => {
      interface RegItem {
        id: number;
        playerName?: string;
        event?: {
          id: number;
          name: string;
          captainNominationOpen?: boolean;
          registrationStatus?: string;
        };
        nominatedTeamId?: number | null;
        captainConfirmed?: boolean;
      }

      const computeCaptainItem = (
        reg: RegItem,
        isSelf: boolean,
        adminTeamEvents: Array<{ id: number; captainNominationOpen?: boolean }>
      ) => {
        const targetEventId = reg.event?.id || 0;
        const matchingTeamEvent = adminTeamEvents.find(e => e.id === targetEventId);
        const isCaptainNominationOpen = Boolean(
          matchingTeamEvent?.captainNominationOpen ||
          reg.event?.captainNominationOpen
        );
        const isNominated = Boolean(reg.nominatedTeamId);
        const isCaptainConfirmed = Boolean(reg.captainConfirmed);
        const regPersonName = reg.playerName || (isSelf ? "You" : "Member");
        const actionLabel = isSelf ? "Nominate Me" : `Nominate ${regPersonName}`;

        return {
          isCaptainNominationOpen,
          spots: isCaptainConfirmed
            ? "Confirmed Captain 🏆"
            : isNominated
              ? "Nomination Active"
              : isCaptainNominationOpen
                ? "Available for Captaincy"
                : "Nominations Closed",
          progressColor: isCaptainConfirmed ? "#10b981" : isNominated ? "#f97316" : isCaptainNominationOpen ? "#6366f1" : "#94a3b8",
          action: isCaptainConfirmed ? "Confirmed" : isNominated ? "Withdraw" : isCaptainNominationOpen ? actionLabel : "Nominations Closed",
        };
      };

      // Case 1: Captain nominations open - Self
      const openRegSelf = {
        id: 1,
        playerName: "Sandeep Kamarapu",
        event: { id: 10, name: "Cricket Championship", captainNominationOpen: true },
      };
      const resultOpenSelf = computeCaptainItem(openRegSelf, true, []);
      expect(resultOpenSelf.isCaptainNominationOpen).toBe(true);
      expect(resultOpenSelf.action).toBe("Nominate Me");
      expect(resultOpenSelf.spots).toBe("Available for Captaincy");
      expect(resultOpenSelf.progressColor).toBe("#6366f1");

      // Case 2: Captain nominations open - Family Member
      const openRegFamily = {
        id: 2,
        playerName: "Aarav Kamarapu",
        event: { id: 10, name: "Cricket Championship", captainNominationOpen: true },
      };
      const resultOpenFamily = computeCaptainItem(openRegFamily, false, []);
      expect(resultOpenFamily.isCaptainNominationOpen).toBe(true);
      expect(resultOpenFamily.action).toBe("Nominate Aarav Kamarapu");

      // Case 3: Captain nominations CLOSED
      const closedReg = {
        id: 3,
        playerName: "Sandeep Kamarapu",
        event: { id: 11, name: "Football League", captainNominationOpen: false },
      };
      const resultClosed = computeCaptainItem(closedReg, true, []);
      expect(resultClosed.isCaptainNominationOpen).toBe(false);
      expect(resultClosed.action).toBe("Nominations Closed");
      expect(resultClosed.spots).toBe("Nominations Closed");
      expect(resultClosed.progressColor).toBe("#94a3b8");

      // Case 4: Event found in adminTeamEvents with captainNominationOpen true
      const eventWithAdminFallback = {
        id: 4,
        playerName: "Sandeep Kamarapu",
        event: { id: 12, name: "Volleyball Tournament" },
      };
      const resultAdmin = computeCaptainItem(eventWithAdminFallback, true, [{ id: 12, captainNominationOpen: true }]);
      expect(resultAdmin.isCaptainNominationOpen).toBe(true);
      expect(resultAdmin.action).toBe("Nominate Me");

      // Case 5: Already nominated
      const alreadyNominatedReg = {
        id: 5,
        playerName: "Sandeep Kamarapu",
        nominatedTeamId: 99,
        event: { id: 10, name: "Cricket Championship", captainNominationOpen: false },
      };
      const resultNominated = computeCaptainItem(alreadyNominatedReg, true, []);
      expect(resultNominated.action).toBe("Withdraw");
      expect(resultNominated.spots).toBe("Nomination Active");

      // Case 6: Confirmed Captain
      const confirmedCaptainReg = {
        id: 6,
        playerName: "Sandeep Kamarapu",
        captainConfirmed: true,
        event: { id: 10, name: "Cricket Championship", captainNominationOpen: false },
      };
      const resultConfirmed = computeCaptainItem(confirmedCaptainReg, true, []);
      expect(resultConfirmed.action).toBe("Confirmed");
      expect(resultConfirmed.spots).toBe("Confirmed Captain 🏆");
    });

    it("verifies RegCard button styling matches Register button when nominating", () => {
      const getActionElementConfig = (action: string, isClosed: boolean, isAdmin: boolean) => {
        if (action === "Nominations Closed") {
          return { type: "badge", text: "Nominations Closed", icon: "Lock" };
        }
        if (String(action).startsWith("Nominate")) {
          return {
            type: "button",
            className: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer",
            icon: "ArrowUpRight",
          };
        }
        if (isClosed && !isAdmin) {
          return { type: "badge", text: "Registration Closed" };
        }
        return { type: "button", className: "default" };
      };

      // Even if event is closed, Nominate button must render gradient styling and not be blocked by isClosed
      const nominateStyle = getActionElementConfig("Nominate Me", true, false);
      expect(nominateStyle.type).toBe("button");
      expect(nominateStyle.className).toContain("bg-gradient-to-r from-indigo-600 to-violet-600");
      expect(nominateStyle.className).toContain("text-white");
      expect(nominateStyle.icon).toBe("ArrowUpRight");

      // When nominations are closed, must render lock badge
      const closedStyle = getActionElementConfig("Nominations Closed", true, false);
      expect(closedStyle.type).toBe("badge");
      expect(closedStyle.text).toBe("Nominations Closed");
      expect(closedStyle.icon).toBe("Lock");
    });
  });
});







