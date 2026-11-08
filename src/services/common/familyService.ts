import { apiClient, getStoredUser, storeUser } from "./apiClient";

export interface FamilyMember {
  id: string | number;
  userId?: number;
  name: string;
  relation: string; // "Self" | "Spouse" | "Son" | "Daughter" | "Father" | "Mother" | "Brother" | "Sister" | "Grandfather" | "Grandmother" | "In-law" | "Other"
  age?: number;
  dob?: string;
  gender?: "Male" | "Female" | "Other" | string;
  phone?: string;
  email?: string;
  bloodGroup?: string;
  gotram?: string;
  emergencyContact?: boolean;
  isDevotee?: boolean;
  photoUrl?: string;
  avatar?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type FamilyMemberRequest = Omit<FamilyMember, "id" | "createdAt" | "updatedAt">;

function unwrapFamilyMemberResponse(response: any): any {
  let result = response;
  for (let depth = 0; depth < 3; depth += 1) {
    const nested = result?.familyMember ?? result?.member ?? result?.data;
    if (nested == null || nested === result) break;
    result = nested;
  }
  return result;
}

function unwrapFamilyMembersResponse(response: any): any[] | null {
  let result = response;
  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(result)) return result;
    const nested = result?.content ?? result?.familyMembers ?? result?.data;
    if (nested == null || nested === result) break;
    result = nested;
  }
  return Array.isArray(result) ? result : null;
}


const DUMMY_STATIC_NAMES = new Set([
  "sunita sharma",
  "aarav sharma",
  "ananya sharma",
  "suresh sharma",
  "ramesh verma",
  "priya verma",
  "rahul verma",
]);

function getSelfMember(): FamilyMember | null {
  const user = getStoredUser();
  if (!user) return null;

  const userName = (
    user.fullName ||
    (user.email ? user.email.split("@")[0] : "Primary Member")
  ).trim();
  if (!userName) return null;

  const userGender = user.gender || "Male";
  const userDob = user.dateOfBirth;

  let calculatedAge: number | undefined;
  if (userDob) {
    const birth = new Date(userDob);
    if (!isNaN(birth.getTime())) {
      calculatedAge = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
    }
  }

  return {
    id: "fam-self",
    userId: user.userId ? Number(user.userId) : undefined,
    name: userName,
    relation: "Self (Head)",
    age: calculatedAge || 30,
    dob: userDob,
    gender: userGender,
    phone: user.phone || "",
    email: user.email || "",
    bloodGroup: (user as any)?.bloodGroup || "",
    gotram: (user as any)?.gotram || (user as any)?.gothram || "",
    avatar: userGender === "Female" ? "👩" : "👨",
    emergencyContact: true,
    isDevotee: true,
    notes: "Primary resident and household head",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mergeWithSelf(members: FamilyMember[]): FamilyMember[] {
  const self = getSelfMember();
  if (!self) return members;

  const cleanSelfName = self.name.trim().toLowerCase();

  // Find if Self is already in the list
  const existingSelfIdx = members.findIndex(
    (m) =>
      String(m.id) === "fam-self" ||
      String(m.id) === "self" ||
      (m.name && m.name.trim().toLowerCase() === cleanSelfName) ||
      (m.relation && (m.relation.toLowerCase().includes("self") || m.relation.toLowerCase().includes("head")))
  );

  let selfEntry: FamilyMember;
  let otherMembers: FamilyMember[];

  if (existingSelfIdx !== -1) {
    const existing = members[existingSelfIdx];
    selfEntry = {
      ...self,
      ...existing,
      relation: "Self (Head)",
      // Prefer server values, but keep any custom fields the self entry already carries
      gotram: existing.gotram || self.gotram,
      bloodGroup: existing.bloodGroup || self.bloodGroup,
      avatar: existing.avatar || self.avatar,
      notes: existing.notes || self.notes,
      emergencyContact: existing.emergencyContact !== undefined ? existing.emergencyContact : self.emergencyContact,
      isDevotee: existing.isDevotee !== undefined ? existing.isDevotee : self.isDevotee,
    };
    otherMembers = members.filter((_, idx) => idx !== existingSelfIdx);
  } else {
    selfEntry = self;
    otherMembers = members;
  }

  // Filter out any stale dummy mock names
  const cleanOthers = otherMembers.filter(
    (m) => m && m.name && !DUMMY_STATIC_NAMES.has(m.name.trim().toLowerCase())
  );

  return [selfEntry, ...cleanOthers];
}

export function inferGenderFromRelation(relation?: string, userGender?: string): "Male" | "Female" | "Other" {
  if (!relation) return "Other";
  const rel = relation.toLowerCase().trim();
  const femaleRelations = [
    "wife", "mother", "daughter", "sister", "grandmother", "aunt", "niece", "mom",
    "sister-in-law", "daughter-in-law", "mother-in-law", "girl", "female", "lady", "woman", "women"
  ];
  if (femaleRelations.some(r => rel.includes(r))) return "Female";
  const maleRelations = [
    "husband", "father", "son", "brother", "grandfather", "uncle", "nephew", "dad",
    "brother-in-law", "son-in-law", "father-in-law", "boy", "male", "gentleman", "man", "men"
  ];
  if (maleRelations.some(r => rel.includes(r))) return "Male";
  if (rel.includes("spouse") || rel.includes("partner")) {
    return (userGender || "Male").toLowerCase().startsWith("m") ? "Female" : "Male";
  }
  return "Other";
}

function notifyFamilyUpdated(members: FamilyMember[]): void {
  window.dispatchEvent(new CustomEvent("mana_family_updated", { detail: members }));
}

function getInMemoryOrSelf(): FamilyMember[] {
  if (lastFetchedData) return [...lastFetchedData];
  const self = getSelfMember();
  return self ? [self] : [];
}

export interface FamilyMemberSlim {
  id: number;
  name: string;
  gothram?: string;
  relation?: string;
  phone?: string;
  gender?: string;
  age?: number;
  dob?: string;
  email?: string;
}


let inFlightFamilyMembersPromise: Promise<FamilyMember[]> | null = null;
let lastFetchTime = 0;
let lastFetchedData: FamilyMember[] | null = null;

export const familyService = {
  /**
   * Get slim family member data (name + gothram only) for use in Pooja registration.
   * Called lazily on step 2, not on modal open.
   */
  async getSlimFamilyMembers(userId?: number): Promise<FamilyMemberSlim[]> {
    const url = userId ? `/users/family-members/slim?userId=${userId}` : "/users/family-members/slim";
    try {
      const res = await apiClient.get<FamilyMemberSlim[]>(url);
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch {
      // Fallback to building slim members from getFamilyMembers
    }

    const full = await this.getFamilyMembers();
    return full.map((m, idx) => ({
      id: typeof m.id === "number" ? m.id : (10000 + idx),
      name: m.name,
      gothram: m.gotram,
      relation: m.relation,
      phone: m.phone,
      gender: m.gender,
      age: m.age,
      dob: m.dob,
      email: m.email,
    }));
  },

  /**
   * Get all family members for the current user from the database.
   * Always includes Self (Head) as the first entry.
   * Uses a 3-second in-memory cache; pass forceRefresh=true to skip it.
   */
  async getFamilyMembers(forceRefresh = false): Promise<FamilyMember[]> {
    const now = Date.now();
    if (!forceRefresh && lastFetchedData && (now - lastFetchTime < 3000)) {
      return lastFetchedData;
    }

    if (!forceRefresh && inFlightFamilyMembersPromise) {
      return inFlightFamilyMembersPromise;
    }

    inFlightFamilyMembersPromise = (async () => {
      try {
        let res: any[] | null = null;
        try {
          res = unwrapFamilyMembersResponse(await apiClient.get<any>("/users/family-members", { bypassCache: true }));
        } catch (err) {
          console.warn("Could not fetch family members from /users/family-members:", err);
        }

        if (Array.isArray(res)) {
          const currentUser = getStoredUser();
          const mapped: FamilyMember[] = res.map((m) => {
            const rel = m.relation || m.relationship || "Family";
            const inferredGender = inferGenderFromRelation(rel, currentUser?.gender);
            let finalGender = m.gender;
            if (!finalGender || (finalGender === "Male" && inferredGender === "Female")) {
              finalGender = inferredGender !== "Other" ? inferredGender : (m.gender || "Other");
            }

            const resolvedDob =
              m.dob ||
              m.dateOfBirth ||
              (m as any).date_of_birth ||
              (m as any).birthDate ||
              undefined;

            let resolvedAge = Number(m.age) || undefined;
            if (!resolvedAge && resolvedDob) {
              const birth = new Date(resolvedDob);
              if (!isNaN(birth.getTime())) {
                resolvedAge = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
              }
            }

            return {
              id: m.id ?? `fam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              userId: m.userId,
              name: m.name || m.fullName || "Family Member",
              relation: rel || "Family",
              age: resolvedAge,
              dob: resolvedDob,
              gender: finalGender || "Other",
              phone: m.phone || m.mobile,
              email: m.email,
              bloodGroup: m.bloodGroup || m.blood,
              gotram: m.gothram || m.gotram,
              emergencyContact: m.emergencyContact !== undefined ? Boolean(m.emergencyContact) : false,
              isDevotee: m.isDevotee !== undefined ? Boolean(m.isDevotee) : true,
              photoUrl: m.photoUrl || m.avatar,
              avatar: m.avatar || m.photoUrl,
              notes: m.notes,
              createdAt: m.createdAt,
              updatedAt: m.updatedAt,
            };
          });

          const fullList = mergeWithSelf(mapped);
          lastFetchedData = fullList;
          lastFetchTime = Date.now();
          return fullList;
        }
      } catch (err) {
        console.warn("Could not fetch family members from database API:", err);
      } finally {
        setTimeout(() => {
          inFlightFamilyMembersPromise = null;
        }, 500);
      }

      // Fallback: return in-memory cache or just the self member
      const fallback = getInMemoryOrSelf();
      lastFetchedData = fallback;
      lastFetchTime = Date.now();
      return fallback;
    })();

    return inFlightFamilyMembersPromise;
  },

  /**
   * Add a new family member to the database. Updates in-memory cache on success.
   */
  async addFamilyMember(data: Partial<FamilyMember>): Promise<FamilyMember> {
    const current = getInMemoryOrSelf();
    const currentUser = getStoredUser();
    const inferred = inferGenderFromRelation(data.relation, currentUser?.gender);
    const finalGender = data.gender || (inferred !== "Other" ? inferred : "Other");

    const resolvedDob = data.dob || (data as any).dateOfBirth || (data as any).birthDate || undefined;
    let computedAge = data.age !== undefined && data.age !== null ? Number(data.age) : undefined;
    if ((computedAge === undefined || isNaN(computedAge) || computedAge <= 0) && resolvedDob) {
      const birth = new Date(resolvedDob);
      if (!isNaN(birth.getTime())) {
        computedAge = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
      }
    }

    const newMember: FamilyMember = {
      id: `fam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: (data.name || "").trim() || "Family Member",
      relation: (data.relation || "Family").trim(),
      age: computedAge,
      dob: resolvedDob,
      gender: finalGender,
      phone: data.phone?.trim(),
      email: data.email?.trim(),
      bloodGroup: data.bloodGroup?.trim(),
      gotram: data.gotram?.trim() || (data as any).gothram?.trim(),
      emergencyContact: Boolean(data.emergencyContact),
      isDevotee: data.isDevotee !== undefined ? Boolean(data.isDevotee) : true,
      photoUrl: data.photoUrl,
      avatar: (data as any).avatar || (finalGender === "Female" ? ((computedAge || 30) < 18 ? "👧" : "👩") : ((computedAge || 30) < 18 ? "👦" : "👨")),
      notes: data.notes?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Clean payload matching backend entity: do NOT send string id or ISO dates that fail Jackson deserialization
    const serverPayload = {
      name: newMember.name,
      relation: newMember.relation,
      age: newMember.age,
      gender: newMember.gender,
      avatar: newMember.avatar,
      gothram: newMember.gotram || undefined,
      gotram: newMember.gotram || undefined,
      dob: newMember.dob || undefined,
      phone: newMember.phone || undefined,
      email: newMember.email || undefined,
      bloodGroup: newMember.bloodGroup || undefined,
      emergencyContact: newMember.emergencyContact,
      isDevotee: newMember.isDevotee,
      notes: newMember.notes || undefined,
      status: "ACTIVE",
    };

    const serverRes = unwrapFamilyMemberResponse(await apiClient.post<any>("/users/family-members", serverPayload));
    if (serverRes && serverRes.id != null) {
      newMember.id = serverRes.id;
      if (serverRes.dob) newMember.dob = serverRes.dob;
      if (serverRes.age) newMember.age = serverRes.age;
    }

    const updated = [newMember, ...current.filter((m) => m.name.toLowerCase() !== newMember.name.toLowerCase())];
    lastFetchedData = updated;
    lastFetchTime = Date.now();
    notifyFamilyUpdated(updated);
    return newMember;
  },

  /**
   * Update an existing family member. Updates in-memory cache on success.
   */
  async updateFamilyMember(id: string | number, data: Partial<FamilyMember>): Promise<FamilyMember> {
    const idStr = String(id);
    const currentUser = getStoredUser();
    const isSelf =
      idStr === "fam-self" ||
      idStr === "self" ||
      (currentUser?.userId != null && idStr === String(currentUser.userId)) ||
      (data.relation && (data.relation.toLowerCase().includes("self") || data.relation.toLowerCase().includes("head")));

    const current = getInMemoryOrSelf();
    let index = current.findIndex((m) =>
      String(m.id) === idStr ||
      (isSelf && (String(m.id) === "fam-self" || String(m.id) === "self" || (currentUser?.userId != null && String(m.userId) === String(currentUser.userId)) || m.relation?.toLowerCase().includes("self") || m.relation?.toLowerCase().includes("head")))
    );

    // Fallback: lookup by trimmed name if ID did not match
    if (index === -1 && data.name) {
      const cleanTargetName = data.name.trim().toLowerCase();
      index = current.findIndex(
        (m) => m.name && m.name.trim().toLowerCase() === cleanTargetName
      );
    }
    const resolvedDobVal = data.dob || (data as any).dateOfBirth || (data as any).birthDate || undefined;
    let computedAge = data.age !== undefined && data.age !== null ? Number(data.age) : undefined;
    if ((computedAge === undefined || isNaN(computedAge) || computedAge <= 0) && resolvedDobVal) {
      const birth = new Date(resolvedDobVal);
      if (!isNaN(birth.getTime())) {
        computedAge = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
      }
    }

    let updatedMember: FamilyMember;
    if (index !== -1) {
      updatedMember = {
        ...current[index],
        ...data,
        ...(resolvedDobVal !== undefined ? { dob: resolvedDobVal } : {}),
        ...(computedAge !== undefined ? { age: computedAge } : {}),
        updatedAt: new Date().toISOString(),
      };
      if (isSelf) {
        updatedMember.id = "fam-self";
        updatedMember.relation = "Self (Head)";
      }
    } else {
      updatedMember = {
        id: isSelf ? "fam-self" : id,
        name: data.name || "Family Member",
        relation: isSelf ? "Self (Head)" : (data.relation || "Family"),
        ...data,
        ...(resolvedDobVal !== undefined ? { dob: resolvedDobVal } : {}),
        ...(computedAge !== undefined ? { age: computedAge } : {}),
        updatedAt: new Date().toISOString(),
      };
    }

    const isRealNumericId = !isSelf && !idStr.startsWith("fam-") && idStr !== "self" && !isNaN(Number(idStr)) && idStr.trim() !== "";

    const serverPayload = {
      name: updatedMember.name,
      relation: updatedMember.relation,
      age: updatedMember.age,
      gender: updatedMember.gender,
      avatar: (data as any).avatar || updatedMember.avatar || (updatedMember.gender === "Female" ? "👩" : "👨"),
      gothram: updatedMember.gotram || (data as any).gothram,
      gotram: updatedMember.gotram || (data as any).gothram,
      dob: updatedMember.dob || undefined,
      phone: updatedMember.phone || undefined,
      email: updatedMember.email || undefined,
      bloodGroup: updatedMember.bloodGroup || undefined,
      emergencyContact: updatedMember.emergencyContact,
      isDevotee: updatedMember.isDevotee,
      notes: updatedMember.notes || undefined,
      status: (data as any).status || "ACTIVE",
    };

    if (isRealNumericId) {
      const serverRes = unwrapFamilyMemberResponse(await apiClient.put<any>(`/users/family-members/${id}`, serverPayload));
      if (serverRes?.dob) updatedMember.dob = serverRes.dob;
      if (serverRes?.age) updatedMember.age = serverRes.age;
    } else if (!isSelf) {
      // A temporary local ID means the original add did not return a server ID; retry creation before committing edits.
      const serverRes = unwrapFamilyMemberResponse(await apiClient.post<any>("/users/family-members", serverPayload));
      if (serverRes?.id != null) {
        updatedMember.id = serverRes.id;
      }
      if (serverRes?.dob) updatedMember.dob = serverRes.dob;
      if (serverRes?.age) updatedMember.age = serverRes.age;
    } else {
      await apiClient.put<any>("/profile", {
        fullName: updatedMember.name,
        phone: updatedMember.phone,
        dob: updatedMember.dob,
        gender: updatedMember.gender,
      });
      const user = getStoredUser();
      if (user) {
        if (updatedMember.name) user.fullName = updatedMember.name;
        if (updatedMember.phone) user.phone = updatedMember.phone;
        if (updatedMember.gender) user.gender = updatedMember.gender;
        if (updatedMember.dob) user.dateOfBirth = updatedMember.dob;
        storeUser(user);
      }
    }

    if (index !== -1) {
      current[index] = updatedMember;
    } else {
      current.push(updatedMember);
    }

    lastFetchedData = [...current];
    lastFetchTime = Date.now();
    notifyFamilyUpdated([...current]);
    return updatedMember;
  },

  /**
   * Delete a family member by ID from the database. Updates in-memory cache on success.
   */
  async deleteFamilyMember(id: string | number): Promise<void> {
    const current = getInMemoryOrSelf();
    const filtered = current.filter((m) => String(m.id) !== String(id));

    const idStr = String(id);
    const currentUser = getStoredUser();
    const isSelf =
      idStr === "fam-self" ||
      idStr === "self" ||
      (currentUser?.userId != null && idStr === String(currentUser.userId));

    const isRealId = !isSelf && !idStr.startsWith("fam-") && !isNaN(Number(idStr)) && idStr.trim() !== "";

    if (isRealId) {
      await apiClient.delete<void>(`/users/family-members/${id}`);
    }

    lastFetchedData = filtered;
    lastFetchTime = Date.now();
    notifyFamilyUpdated(filtered);
  },

  // ── Admin-only helpers ───────────────────────────────────────────────────────

  /**
   * Admin: fetch all family members for a specific user.
   * Tries three endpoints in order:
   *   1. GET /users/{userId}/family-members  (RESTful — preferred)
   *   2. GET /users/family-members?userId={userId}  (query-param variant)
   *   3. GET /users/family-members/slim?userId={userId}  (slim fallback)
   */
  async getAdminFamilyMembers(userId: number): Promise<FamilyMember[]> {
    // 1. RESTful path — bypasses cache so stale admin-own data never bleeds through
    try {
      const res = unwrapFamilyMembersResponse(
        await apiClient.get<any>(`/users/${userId}/family-members`, { bypassCache: true })
      );
      if (Array.isArray(res)) return res as FamilyMember[];
    } catch {}

    // 2. Query-param variant (requires backend to honour userId param)
    try {
      const res = unwrapFamilyMembersResponse(
        await apiClient.get<any>(`/users/family-members?userId=${userId}`, { bypassCache: true })
      );
      if (Array.isArray(res)) return res as FamilyMember[];
    } catch {}

    // 3. Slim fallback
    try {
      const slim = await this.getSlimFamilyMembers(userId);
      return slim.map((m) => ({
        id: m.id,
        name: m.name,
        relation: m.relation || "Family",
        dob: m.dob,
        age: m.age,
        gender: m.gender as FamilyMember["gender"],
        phone: m.phone,
        email: m.email,
        gotram: m.gothram,
      }));
    } catch {}
    return [];
  },

  /**
   * Admin: add a family member for a specific user (includes userId in payload).
   */
  async addFamilyMemberForUser(userId: number, data: Partial<FamilyMember>): Promise<FamilyMember> {
    const resolvedDob = data.dob || (data as any).dateOfBirth || undefined;
    let computedAge = data.age !== undefined ? Number(data.age) : undefined;
    if ((!computedAge || computedAge <= 0) && resolvedDob) {
      const birth = new Date(resolvedDob);
      if (!isNaN(birth.getTime())) {
        computedAge = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
      }
    }
    const inferred = inferGenderFromRelation(data.relation);
    const finalGender = data.gender || (inferred !== "Other" ? inferred : "Other");
    const payload = {
      userId,
      name: (data.name || "").trim() || "Family Member",
      relation: (data.relation || "Family").trim(),
      age: computedAge,
      dob: resolvedDob || undefined,
      gender: finalGender,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
      bloodGroup: data.bloodGroup?.trim() || undefined,
      gothram: data.gotram?.trim() || undefined,
      gotram: data.gotram?.trim() || undefined,
      emergencyContact: Boolean(data.emergencyContact),
      isDevotee: data.isDevotee !== undefined ? Boolean(data.isDevotee) : true,
      notes: data.notes?.trim() || undefined,
      avatar: (data as any).avatar || (finalGender === "Female" ? "👩" : "👨"),
      status: "ACTIVE",
    };
    const serverRes = unwrapFamilyMemberResponse(await apiClient.post<any>("/users/family-members", payload));
    return {
      id: serverRes?.id ?? `fam-${Date.now()}`,
      userId,
      name: payload.name,
      relation: payload.relation,
      age: computedAge,
      dob: resolvedDob,
      gender: finalGender,
      phone: payload.phone,
      email: payload.email,
      bloodGroup: payload.bloodGroup,
      gotram: payload.gotram,
      emergencyContact: payload.emergencyContact,
      isDevotee: payload.isDevotee,
      notes: payload.notes,
      avatar: payload.avatar,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Admin: update a family member by its numeric ID on behalf of any user.
   */
  async updateFamilyMemberForUser(memberId: string | number, data: Partial<FamilyMember>): Promise<FamilyMember> {
    const resolvedDob = data.dob || (data as any).dateOfBirth || undefined;
    let computedAge = data.age !== undefined ? Number(data.age) : undefined;
    if ((!computedAge || computedAge <= 0) && resolvedDob) {
      const birth = new Date(resolvedDob);
      if (!isNaN(birth.getTime())) {
        computedAge = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
      }
    }
    const inferred = inferGenderFromRelation(data.relation);
    const finalGender = data.gender || (inferred !== "Other" ? inferred : "Other");
    const payload = {
      name: (data.name || "").trim(),
      relation: (data.relation || "Family").trim(),
      age: computedAge,
      dob: resolvedDob || undefined,
      gender: finalGender,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
      bloodGroup: data.bloodGroup?.trim() || undefined,
      gothram: data.gotram?.trim() || undefined,
      gotram: data.gotram?.trim() || undefined,
      emergencyContact: Boolean(data.emergencyContact),
      isDevotee: data.isDevotee !== undefined ? Boolean(data.isDevotee) : true,
      notes: data.notes?.trim() || undefined,
      avatar: (data as any).avatar || (finalGender === "Female" ? "👩" : "👨"),
      status: "ACTIVE",
    };
    await apiClient.put<any>(`/users/family-members/${memberId}`, payload);
    return {
      id: memberId,
      name: payload.name,
      relation: payload.relation,
      age: computedAge,
      dob: resolvedDob,
      gender: finalGender,
      phone: payload.phone,
      email: payload.email,
      bloodGroup: payload.bloodGroup,
      gotram: payload.gotram,
      emergencyContact: payload.emergencyContact,
      isDevotee: payload.isDevotee,
      notes: payload.notes,
      avatar: payload.avatar,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Admin: hard-delete a family member by its numeric ID.
   */
  async adminDeleteFamilyMember(memberId: string | number): Promise<void> {
    await apiClient.delete<void>(`/users/family-members/${memberId}`);
  },

  /**
   * Synchronize the primary user's profile info into the in-memory Self (Head) entry.
   */
  syncUserProfile(fullName: string, dob?: string, gender?: string, phone?: string, email?: string): void {
    if (!fullName) return;
    const current = getInMemoryOrSelf();
    const selfIndex = current.findIndex((m) => String(m.id) === "fam-self" || m.relation?.toLowerCase().includes("self") || m.relation?.toLowerCase().includes("head"));

    let calculatedAge: number | undefined;
    if (dob) {
      const birth = new Date(dob);
      if (!isNaN(birth.getTime())) {
        calculatedAge = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
      }
    }

    if (selfIndex !== -1) {
      current[selfIndex] = {
        ...current[selfIndex],
        name: fullName,
        dob: dob || current[selfIndex].dob,
        age: calculatedAge || current[selfIndex].age,
        gender: gender || current[selfIndex].gender,
        phone: phone || current[selfIndex].phone,
        email: email || current[selfIndex].email,
        updatedAt: new Date().toISOString(),
      };
    } else {
      current.unshift({
        id: "fam-self",
        name: fullName,
        relation: "Self (Head)",
        dob,
        age: calculatedAge,
        gender: gender || "Male",
        phone,
        email,
        avatar: gender === "Female" ? "👩" : "👨",
        emergencyContact: true,
        isDevotee: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    lastFetchedData = [...current];
    lastFetchTime = Date.now();
  },
};
