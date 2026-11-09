import type { TournamentRegistration } from "../../../../types/api";

export interface PlayerPartnerInfo {
  hasPartner: boolean;
  name: string;
  flat?: string;
  phone?: string;
  email?: string;
  relation?: string;
  age?: number;
  gender?: string;
  status: "CONFIRMED" | "DECLINED" | "INVITED" | "NONE";
  statusLabel: string;
  isConfirmed: boolean;
  isDeclined: boolean;
  isPending: boolean;
  declineReason?: string;
  isDoublesEvent: boolean;
  isOpenPool: boolean;
  isReciprocal: boolean;
  isFamilyMember: boolean;
}

/**
 * Extracts and resolves partner details for a player registration.
 * Supports:
 * - Direct partner fields (partnerName, partnerFlatNumber, partnerPhone, partnerStatus, etc.)
 * - Nested objects (partner: { fullName, flatNo, phone, email }, partnerFamilyMember: { name, relation, age, gender })
 * - Cross-referencing by partnerUserId / partnerFamilyMemberId against all event registrations
 * - Reciprocal pairing (when another player invited or nominated this player as partner)
 * - Roster contact enrichment (fills in partner flat/phone/email if the partner has a tournament registration)
 * - Doubles / Mixed Doubles detection and Open Pairing Pool identification
 */
export function getPartnerDetails(
  reg: TournamentRegistration,
  allRegistrations: TournamentRegistration[] = [],
  event?: any
): PlayerPartnerInfo {
  // 1. Direct partner name resolution
  let name = (
    reg.partnerFamilyMember?.name ||
    reg.partnerName ||
    reg.partner?.fullName ||
    reg.partner?.name ||
    (reg as any).partnerPlayerName ||
    (reg as any).partnerUser?.fullName ||
    ""
  ).trim();

  let flat = (
    reg.partnerFlatNumber ||
    reg.partner?.flatNo ||
    (reg.partner as any)?.flatNumber ||
    (reg.partnerFamilyMember?.user as any)?.flatNo ||
    ""
  ).trim();

  let phone = (
    reg.partnerPhone ||
    reg.partner?.phone ||
    (reg.partnerFamilyMember?.user as any)?.phone ||
    ""
  ).trim();

  let email = (
    reg.partner?.email ||
    (reg as any).partnerEmail ||
    ""
  ).trim();

  let relation = (
    reg.partnerFamilyMember?.relation ||
    (reg as any).partnerRelation ||
    ""
  ).trim();

  const age = reg.partnerFamilyMember?.age;
  const gender = reg.partnerFamilyMember?.gender;

  let rawStatus = (
    reg.partnerConfirmationStatus ||
    reg.partnerStatus ||
    ""
  ).toUpperCase();

  let declineReason = (
    reg.partnerDeclineReason ||
    (reg as any).partnerDeclineReason ||
    ""
  ).trim();

  let isReciprocal = false;

  // 2. Cross-reference by partnerUserId if present
  if (reg.partnerUserId != null && allRegistrations.length > 0) {
    const matched = allRegistrations.find(
      (r) =>
        (r.user?.id != null && r.user.id === reg.partnerUserId) ||
        r.id === reg.partnerUserId
    );
    if (matched) {
      if (!name) name = (matched.playerName || matched.user?.fullName || "").trim();
      if (!flat) flat = (matched.flatNumber || "").trim();
      if (!phone) phone = (matched.phone || "").trim();
      if (!email) email = (matched.email || matched.user?.email || "").trim();
    }
  }

  // 3. Reciprocal lookup: did another registered player name this player as their partner?
  if (!name && allRegistrations.length > 0) {
    const regUserId = reg.user?.id;
    const regFamId = reg.familyMember?.id != null ? reg.familyMember.id : (reg as any).familyMemberId != null ? Number((reg as any).familyMemberId) : null;
    const regPlayerName = (reg.playerName || reg.user?.fullName || "").trim().toLowerCase();
    const regPhone = (reg.phone || "").replace(/\D/g, "");

    const reciprocal = allRegistrations.find((other) => {
      if (other.id === reg.id) return false;
      const otherPartnerFamId = other.partnerFamilyMember?.id != null ? other.partnerFamilyMember.id : (other as any).partnerFamilyMemberId != null ? Number((other as any).partnerFamilyMemberId) : null;
      if (regFamId != null && otherPartnerFamId != null && regFamId === otherPartnerFamId) return true;
      if (regUserId != null && other.partnerUserId === regUserId && otherPartnerFamId == null) return true;
      if (
        regPlayerName &&
        other.partnerName &&
        other.partnerName.trim().toLowerCase() === regPlayerName
      ) {
        return true;
      }
      if (
        regPhone &&
        other.partnerPhone &&
        other.partnerPhone.replace(/\D/g, "") === regPhone
      ) {
        return true;
      }
      return false;
    });

    if (reciprocal) {
      name = (reciprocal.playerName || reciprocal.user?.fullName || "").trim();
      if (!flat) flat = (reciprocal.flatNumber || "").trim();
      if (!phone) phone = (reciprocal.phone || "").trim();
      if (!email) email = (reciprocal.email || reciprocal.user?.email || "").trim();
      if (!rawStatus) {
        rawStatus = (
          reciprocal.partnerConfirmationStatus ||
          reciprocal.partnerStatus ||
          ""
        ).toUpperCase();
      }
      if (!declineReason) {
        declineReason = (reciprocal.partnerDeclineReason || "").trim();
      }
      isReciprocal = true;
    }
  }

  // 4. Contact enrichment: if partner name exists but flat/phone/email are missing,
  // search allRegistrations for a player matching the partner's name or phone
  if (name && (!flat || !phone || !email) && allRegistrations.length > 0) {
    const partnerNameLower = name.toLowerCase();
    const partnerPhoneClean = phone.replace(/\D/g, "");
    const matched = allRegistrations.find((other) => {
      if (other.id === reg.id) return false;
      const otherName = (other.playerName || other.user?.fullName || "").trim().toLowerCase();
      if (otherName && otherName === partnerNameLower) return true;
      if (partnerPhoneClean && other.phone && other.phone.replace(/\D/g, "") === partnerPhoneClean) return true;
      return false;
    });
    if (matched) {
      if (!flat) flat = (matched.flatNumber || "").trim();
      if (!phone) phone = (matched.phone || "").trim();
      if (!email) email = (matched.email || matched.user?.email || "").trim();
    }
  }

  // 5. Detect if event is doubles / mixed doubles
  const isDoublesEvent = Boolean(
    (reg.matchType && reg.matchType.toUpperCase().includes("DOUBLES")) ||
    (reg.matchFormat && reg.matchFormat.toUpperCase().includes("DOUBLES")) ||
    (reg.category?.name && reg.category.name.toLowerCase().includes("doubles")) ||
    (event?.name && event.name.toLowerCase().includes("doubles")) ||
    (event?.category && String(event.category).toLowerCase().includes("doubles")) ||
    (event?.matchType && String(event.matchType).toLowerCase().includes("doubles")) ||
    (event?.format && String(event.format).toLowerCase().includes("doubles")) ||
    Boolean(name) ||
    reg.partnerUserId != null ||
    (reg as any).partnerFamilyMemberId != null ||
    Boolean((reg as any).openPool || (reg as any).isPoolPlayer || (reg as any).needsPartner)
  );

  const hasPartner = Boolean(name);

  // 6. Status determination
  const isConfirmed = rawStatus === "CONFIRMED" || rawStatus === "ACCEPTED";
  const isDeclined = rawStatus === "DECLINED" || rawStatus === "REJECTED";
  const isPending = hasPartner && !isConfirmed && !isDeclined;

  let status: "CONFIRMED" | "DECLINED" | "INVITED" | "NONE" = "NONE";
  let statusLabel = "";

  if (hasPartner) {
    if (isConfirmed) {
      status = "CONFIRMED";
      statusLabel = "Partner Confirmed";
    } else if (isDeclined) {
      status = "DECLINED";
      statusLabel = "Partner Declined";
    } else {
      status = "INVITED";
      statusLabel = "Partner Invited";
    }
  }

  const isOpenPool = !hasPartner && isDoublesEvent;
  const isFamilyMember = Boolean(
    relation ||
    reg.partnerFamilyMember != null ||
    (reg as any).partnerFamilyMemberId != null
  );

  return {
    hasPartner,
    name,
    flat: flat || undefined,
    phone: phone || undefined,
    email: email || undefined,
    relation: relation || undefined,
    age,
    gender,
    status,
    statusLabel,
    isConfirmed,
    isDeclined,
    isPending,
    declineReason: declineReason || undefined,
    isDoublesEvent,
    isOpenPool,
    isReciprocal,
    isFamilyMember,
  };
}
