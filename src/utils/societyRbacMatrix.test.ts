import { describe, it, expect } from "vitest";
import { canActorPerform, resolveSocietyPersona } from "./societyRbacMatrix";

describe("Society RBAC Matrix & Cross-Society Tenant Isolation (Web)", () => {
  it("resolves canonical society personas cleanly across backend/frontend aliases", () => {
    expect(resolveSocietyPersona("OWNER")).toBe("FLAT_OWNER");
    expect(resolveSocietyPersona("TENANT")).toBe("TENANT");
    expect(resolveSocietyPersona("FAMILY_MEMBER")).toBe("FAMILY_MEMBER");
    expect(resolveSocietyPersona("SECURITY_GUARD")).toBe("GUARD");
    expect(resolveSocietyPersona("COMMUNITY_MGMT_ADMIN")).toBe("ESTATE_MANAGER");
    expect(resolveSocietyPersona("COMMUNITY_ADMIN")).toBe("MC_ADMIN");
  });

  it("enforces persona boundaries and zero cross-society / cross-flat leaks", () => {
    const owner = { userId: 1, rawRole: "FLAT_OWNER", communityId: 101, flatId: 501 };
    const tenant = { userId: 2, rawRole: "TENANT", communityId: 101, flatId: 501 };
    const family = { userId: 3, rawRole: "FAMILY_MEMBER", communityId: 101, flatId: 501 };
    const guard = { userId: 4, rawRole: "GUARD", communityId: 101 };
    const manager = { userId: 5, rawRole: "ESTATE_MANAGER", communityId: 101 };
    const mcAdmin = { userId: 6, rawRole: "MC_ADMIN", communityId: 101 };

    expect(canActorPerform(owner, 101, 501, "VOTE_OWNER_AGM")).toBe(true);
    expect(canActorPerform(tenant, 101, 501, "VOTE_OWNER_AGM")).toBe(false);
    expect(canActorPerform(family, 101, 501, "VIEW_OWN_DUES")).toBe(false);
    expect(canActorPerform(guard, 101, null, "GATE_CHECKIN_SCAN")).toBe(true);
    expect(canActorPerform(guard, 101, null, "MANAGE_HELPDESK_SLA")).toBe(false);
    expect(canActorPerform(manager, 101, null, "MANAGE_HELPDESK_SLA")).toBe(true);
    expect(canActorPerform(mcAdmin, 101, null, "MANAGE_SOCIETY_GOVERNANCE")).toBe(true);

    // Zero cross-society leaks even for MC_ADMIN and ESTATE_MANAGER
    expect(canActorPerform(mcAdmin, 202, null, "MANAGE_SOCIETY_GOVERNANCE")).toBe(false);
    expect(canActorPerform(manager, 202, null, "MANAGE_HELPDESK_SLA")).toBe(false);

    // Zero cross-flat leaks inside the same society
    expect(canActorPerform(owner, 101, 502, "VIEW_OWN_DUES")).toBe(false);
  });
});
