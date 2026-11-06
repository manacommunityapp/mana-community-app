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

  // Check if current user is the partner on this registration
  const isPartnerOnReg = Boolean(
    (effectiveUserId != null && (
      String(reg.partnerUserId) === String(effectiveUserId) ||
      String(reg.partner?.id) === String(effectiveUserId)
    )) ||
    (reg.partnerName && targetFullName && reg.partnerName.trim().toLowerCase() === targetFullName.toLowerCase())
  );

  const isPrimaryUser = Boolean(
    (effectiveUserId != null && (
      String(reg.userId) === String(effectiveUserId) ||
      String(reg.user?.id) === String(effectiveUserId)
    )) ||
    (regPlayerName && targetFullName && regPlayerName.toLowerCase() === targetFullName.toLowerCase()) ||
    isSelfRelationOrMember(regRelation, regFamilyMemberId, regPlayerName, targetFullName)
  );

  // If the user is on the registration as the partner (and not the primary registrant):
  if (isPartnerOnReg && !isPrimaryUser) {
    if (isSelfTarget) {
      // Confirmed partners are considered actively registered; pending/declined are NOT
      return isPartnerConfirmed;
    }
    return false;
  }

  // Check if a family member is the partner on this registration
  if (!isSelfTarget) {
    const regPartnerFamId = reg.partnerFamilyMemberId || reg.partnerFamilyMember?.id;
    if (regPartnerFamId && String(regPartnerFamId) === String(selectedMemberId) && isPartnerConfirmed) {
      return true;
    }
  }

  const isExplicitFamily = Boolean(
    (regFamilyMemberId && !isSelfRelationOrMember(undefined, regFamilyMemberId)) ||
    (regRelation && !isSelfRelationOrMember(regRelation))
  );

  const matchesFamilyMemberName = Boolean(
    regPlayerName && familyMembersOnly.some(m => m.name && m.name.trim().toLowerCase() === regPlayerName.toLowerCase())
  );

  const isOtherUserReg = Boolean(
    (effectiveUserId != null && reg.userId != null && String(reg.userId) !== String(effectiveUserId)) ||
    (reg.partnerFamilyMemberId && !isPartnerOnReg)
  );

  // A registration belongs to Self if it's explicitly Self, OR not an explicit family member and not matching any family member's name
  const isSelfReg =
    isSelfRelationOrMember(regRelation, regFamilyMemberId, regPlayerName, targetFullName) ||
    (!isOtherUserReg && !isExplicitFamily && !matchesFamilyMemberName);

  if (isSelfTarget) {
    return isSelfReg;
  }

  // When filtering by an actual family member, exclude Self registrations
  if (isSelfReg) {
    return false;
  }

  if (regFamilyMemberId && String(regFamilyMemberId) === String(selectedMemberId)) {
    return true;
  }

  const targetMember = familyMembersOnly.find(m => String(m.id) === String(selectedMemberId));
  if (targetMember) {
    const targetMemberName = (targetMember.name || "").trim().toLowerCase();
    const targetMemberRelation = String(targetMember.relation || (targetMember as any).relationship || "").trim().toUpperCase();
    if (targetMemberName && regPlayerName.toLowerCase() === targetMemberName) {
      return true;
    }
    if (targetMemberRelation && String(regRelation || "").trim().toUpperCase() === targetMemberRelation) {
      return true;
    }
  }

  return false;
}
