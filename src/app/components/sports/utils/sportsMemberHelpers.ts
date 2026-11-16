/**
 * Centralized sports member resolution and isolation helpers.
 * Used across SportsDashboard, SportsRegister, and SportsMultiRegister to ensure
 * 100% consistent participant identification, duplicate prevention, and family scoping.
 */

/**
 * Robust helper to determine if a member, relation, ID, or name represents the logged-in user / Self / Head.
 */
export function isSelfRelationOrMember(
  rel?: string | null,
  id?: string | number | null,
  name?: string | null,
  currentUserName?: string | null
): boolean {
  // 1. Check explicit family or self relation strings
  if (rel) {
    const r = String(rel).toUpperCase().trim();
    if (
      r === "SPOUSE" || r === "WIFE" || r === "HUSBAND" ||
      r === "SON" || r === "DAUGHTER" || r === "CHILD" ||
      r === "FATHER" || r === "MOTHER" || r === "PARENT" ||
      r === "BROTHER" || r === "SISTER" || r === "SIBLING" ||
      r === "OTHER" || r.includes("SPOUSE") || r.includes("WIFE") || r.includes("HUSBAND")
    ) {
      return false;
    }
    if (
      r === "SELF" ||
      r === "HEAD" ||
      r === "SELF (HEAD)" ||
      r.includes("SELF") ||
      r.includes("HEAD") ||
      r === "PRIMARY" ||
      r === "OWNER"
    ) {
      return true;
    }
  }

  // 2. Check explicit Self ID aliases
  if (id != null) {
    const idStr = String(id).toLowerCase().trim();
    if (idStr === "self" || idStr === "fam-self" || idStr === "member-self" || idStr === "head" || idStr === "primary") {
      return true;
    }
  }

  // 3. Check exact full-name match against logged-in user
  if (name && currentUserName) {
    const n = name.toLowerCase().trim();
    const c = currentUserName.toLowerCase().trim();
    // Must be exact full-name match, not partial substring match which collides on shared surnames
    if (n && c && n === c) {
      return true;
    }
  }

  return false;
}

/**
 * Filters a raw list of family members down to genuine family members only,
 * strictly excluding any entries that represent the logged-in household head / Self.
 */
export function getFamilyMembersOnly<T extends { id?: string | number; name?: string; relation?: string }>(
  members: T[] = [],
  currentUserName?: string | null
): T[] {
  return (members || []).filter(m => {
    const rel = m.relation || (m as any).relationship || "";
    const isSelf = isSelfRelationOrMember(rel, m.id, m.name, currentUserName);
    return !isSelf;
  });
}

/**
 * Helper to safely extract string from matchType / format across primitives, arrays, and objects
 */
export function extractFormatStr(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val.trim().toUpperCase();
  if (Array.isArray(val)) {
    return val.map(v => (typeof v === "string" ? v : String(v || ""))).join(" ").trim().toUpperCase();
  }
  if (typeof val === "object") {
    return String(val.name || val.code || val.format || val.matchType || "").trim().toUpperCase();
  }
  return String(val).trim().toUpperCase();
}

/**
 * Robust helper to check if a registration status is active (not cancelled, withdrawn, or rejected).
 */
export function isActiveRegistrationStatus(status?: string | null): boolean {
  if (!status) return false;
  const s = String(status).toUpperCase().trim();
  return s !== "CANCELLED" && s !== "WITHDRAWN" && s !== "REJECTED";
}

/**
 * Robust helper to determine if a registration belongs to a specific family member or the logged-in user (Self).
 */
export function isRegistrationForMemberHelper(
  reg: any,
  selectedMemberId: string | number | undefined,
  familyMembersOnly: Array<{ id?: string | number; name?: string; relation?: string }> = [],
  currentUserName?: string | null,
  currentUserId?: string | number | null
): boolean {
  if (!reg) return false;
  const isSelfTarget =
    !selectedMemberId ||
    selectedMemberId === "self" ||
    selectedMemberId === "SELF" ||
    selectedMemberId === "member-self" ||
    selectedMemberId === "fam-self";

  const regPlayerName = (reg.playerName || "").trim();
  const regRelation = (reg.relation || "").trim();
  const regFamilyMemberId = reg.familyMemberId || reg.familyMember?.id;
  const targetFullName = (currentUserName || "").trim();

  let effectiveUserId = currentUserId;
  if (!effectiveUserId && typeof window !== "undefined") {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        effectiveUserId = parsed.id || parsed.userId;
      }
    } catch {}
  }

  const pStatus = String(reg.partnerStatus || reg.partnerConfirmationStatus || "").toUpperCase().trim();
  const isPartnerConfirmed = pStatus === "CONFIRMED" || pStatus === "ACCEPTED";

  const normId = (id: any) => String(id ?? "").replace(/^fam-/, "").trim();
  const targetId = normId(selectedMemberId);
  const targetMember = !isSelfTarget ? familyMembersOnly.find(m => normId(m.id) === targetId) : undefined;
  const targetMemberName = targetMember?.name ? targetMember.name.trim().toLowerCase() : "";

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CHECK IF TARGET IS THE CONFIRMED PARTNER (PLAYER 2)
  // ─────────────────────────────────────────────────────────────────────────────
  const regPartnerFamId = reg.partnerFamilyMemberId || reg.partnerFamilyMember?.id;
  const hasPartnerFam = regPartnerFamId != null && String(regPartnerFamId).trim() !== "";

  if (isPartnerConfirmed) {
    if (isSelfTarget) {
      const isSelfPartner = !hasPartnerFam && Boolean(
        (effectiveUserId != null && (
          String(reg.partnerUserId) === String(effectiveUserId) ||
          String(reg.partner?.id) === String(effectiveUserId)
        )) ||
        (reg.partnerName && targetFullName && reg.partnerName.trim().toLowerCase() === targetFullName.toLowerCase())
      );
      if (isSelfPartner) {
        return true;
      }
    } else {
      const isTargetFamPartner = Boolean(
        (hasPartnerFam && normId(regPartnerFamId) === targetId) ||
        (!hasPartnerFam && targetMemberName && reg.partnerName && reg.partnerName.trim().toLowerCase() === targetMemberName)
      );
      if (isTargetFamPartner) {
        return true;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CHECK IF TARGET IS THE PRIMARY REGISTRANT (PLAYER 1)
  // ─────────────────────────────────────────────────────────────────────────────
  const isExplicitFamily = Boolean(
    (regFamilyMemberId && !isSelfRelationOrMember(undefined, regFamilyMemberId)) ||
    (regRelation && !isSelfRelationOrMember(regRelation))
  );

  const matchesFamilyMemberName = Boolean(
    regPlayerName && familyMembersOnly.some(m => m.name && m.name.trim().toLowerCase() === regPlayerName.toLowerCase())
  );

  const isOtherUserReg = Boolean(
    effectiveUserId != null && reg.userId != null && String(reg.userId) !== String(effectiveUserId)
  );

  // A registration belongs to Self as Player 1 if it's explicitly Self, OR
  // (owned by this user AND not marked as an explicit family member AND not matching another family member's name)
  const isSelfPrimary =
    isSelfRelationOrMember(regRelation, regFamilyMemberId, regPlayerName, targetFullName) ||
    (!isOtherUserReg && !isExplicitFamily && !matchesFamilyMemberName);

  if (isSelfTarget) {
    return isSelfPrimary;
  }

  // When filtering by a genuine family member, exclude registrations where Player 1 is Self
  if (isSelfPrimary) {
    return false;
  }

  // 2a. Match by familyMemberId on Player 1
  if (regFamilyMemberId != null && String(regFamilyMemberId).trim() !== "") {
    return normId(regFamilyMemberId) === targetId;
  }

  // 2b. Match by player name if present
  if (regPlayerName && targetMemberName) {
    return regPlayerName.toLowerCase() === targetMemberName;
  }

  // 2c. Fallback by unique relation
  if (targetMember) {
    const targetMemberRelation = String(targetMember.relation || (targetMember as any).relationship || "").trim().toUpperCase();
    if (targetMemberRelation && String(regRelation || "").trim().toUpperCase() === targetMemberRelation) {
      const sameRelationMembers = familyMembersOnly.filter(m => {
        const r = String(m.relation || (m as any).relationship || "").trim().toUpperCase();
        return r && r === targetMemberRelation;
      });
      if (sameRelationMembers.length === 1) {
        return true;
      }
    }
  }

  return false;
}
