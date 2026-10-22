import { apiClient, getStoredUser, storeUser } from "./apiClient";
import { safeStorage } from "../../utils/storage";

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

function getStorageKey(): string {
  const user = getStoredUser();
  const uid = user?.userId || user?.email || "anonymous";
  return `mana_family_members_v4_${uid}`;
}

function getSelfMetaKey(): string {
  const user = getStoredUser();
  const uid = user?.userId || user?.email || "anonymous";
  return `mana_family_self_meta_v1_${uid}`;
}

function getStoredSelfMeta(): Partial<FamilyMember> | null {
  return safeStorage.getJSON<Partial<FamilyMember> | null>(getSelfMetaKey(), null);
}

function saveSelfMeta(meta: Partial<FamilyMember>): void {
  const current = getStoredSelfMeta() || {};
  const updated = { ...current, ...meta };
  safeStorage.setJSON(getSelfMetaKey(), updated);
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
  const meta = getStoredSelfMeta();
  if (!user && !meta) return null;

  const userName = (
    meta?.name ||
    user?.fullName ||
    (user?.email ? user.email.split("@")[0] : "Primary Member")
  ).trim();
  if (!userName) return null;

  const userGender = meta?.gender || user?.gender || "Male";
  const userPhone = meta?.phone ?? (user?.phone || "");
  const userEmail = meta?.email ?? (user?.email || "");
  const userDob = meta?.dob || user?.dateOfBirth;

  let calculatedAge: number | undefined = meta?.age;
  if (userDob) {
    const birth = new Date(userDob);
    if (!isNaN(birth.getTime())) {
      calculatedAge = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
    }
  }

  return {
    id: "fam-self",
    userId: user?.userId ? Number(user.userId) : undefined,
    name: userName,
    relation: "Self (Head)",
    age: calculatedAge || 30,
    dob: userDob,
    gender: userGender,
    phone: userPhone,
    email: userEmail,
    bloodGroup: meta?.bloodGroup || (user as any)?.bloodGroup || "",
    gotram: meta?.gotram || (user as any)?.gotram || (user as any)?.gothram || "",
    avatar: meta?.avatar || (userGender === "Female" ? "👩" : "👨"),
    emergencyContact: meta?.emergencyContact !== undefined ? meta.emergencyContact : true,
    isDevotee: meta?.isDevotee !== undefined ? meta.isDevotee : true,
    notes: meta?.notes !== undefined ? meta.notes : "Primary resident and household head",
    createdAt: meta?.createdAt || new Date().toISOString(),
    updatedAt: meta?.updatedAt || new Date().toISOString(),
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
      // Ensure customized fields from self (which loads from getStoredSelfMeta) are preserved
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

function getStoredMembers(): FamilyMember[] {
  const parsed = safeStorage.getJSON<FamilyMember[] | null>(getStorageKey(), null);
  if (Array.isArray(parsed)) {
    return mergeWithSelf(parsed);
  }
  const self = getSelfMember();
  return self ? [self] : [];
}

function persistMembers(members: FamilyMember[], notify = true): void {
  safeStorage.setJSON(getStorageKey(), members);
  if (notify) {
    window.dispatchEvent(new CustomEvent("mana_family_updated", { detail: members }));
  }
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
   * Get all family members for the current user, ALWAYS including Self (Head) as the first entry.
   * Tries backend API first with fallback to synchronized local repository.
   * Deduplicates concurrent in-flight requests and caches for 3 seconds unless forced.
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
          res = await apiClient.get<any[]>("/users/family-members");
        } catch {
          try {
            res = await apiClient.get<any[]>("/events/family-members");
          } catch {
            // fallback
          }
        }

        if (Array.isArray(res)) {
          const mapped: FamilyMember[] = res.map((m) => ({
            id: m.id ?? `fam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: m.userId,
            name: m.name || m.fullName || "Family Member",
            relation: m.relation || m.relationship || "Family",
            age: Number(m.age) || undefined,
            dob: m.dob || m.dateOfBirth,
            gender: m.gender || "Male",
            phone: m.phone || m.mobile,
            email: m.email,
            bloodGroup: m.bloodGroup || m.blood,
            gotram: m.gothram || m.gotram,
            emergencyContact: Boolean(m.emergencyContact || m.isEmergency),
            isDevotee: m.isDevotee !== undefined ? Boolean(m.isDevotee) : true,
            photoUrl: m.photoUrl || m.avatar,
            avatar: m.avatar || m.photoUrl,
            notes: m.notes,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
          }));

          // Preserve any local-only non-self members not yet reflected on the server
          const currentlyStored = getStoredMembers();
          const localOnlyMembers = currentlyStored.filter(
            (sm) =>
              String(sm.id).startsWith("fam-") &&
              String(sm.id) !== "fam-self" &&
              !mapped.some((m) => m.name.trim().toLowerCase() === sm.name.trim().toLowerCase())
          );

          const fullList = mergeWithSelf([...mapped, ...localOnlyMembers]);
          // Do NOT emit mana_family_updated on GET to prevent infinite event loop
          persistMembers(fullList, false);
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

      const stored = getStoredMembers();
      lastFetchedData = stored;
      lastFetchTime = Date.now();
      return stored;
    })();

    return inFlightFamilyMembersPromise;
  },

  /**
   * Add a new family member to database and synchronized repository.
   */
  async addFamilyMember(data: Partial<FamilyMember>): Promise<FamilyMember> {
    const current = getStoredMembers();
    const newMember: FamilyMember = {
      id: `fam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: (data.name || "").trim() || "Family Member",
      relation: (data.relation || "Family").trim(),
      age: data.age ? Number(data.age) : undefined,
      dob: data.dob,
      gender: data.gender || "Male",
      phone: data.phone?.trim(),
      email: data.email?.trim(),
      bloodGroup: data.bloodGroup?.trim(),
      gotram: data.gotram?.trim() || (data as any).gothram?.trim(),
      emergencyContact: Boolean(data.emergencyContact),
      isDevotee: data.isDevotee !== undefined ? Boolean(data.isDevotee) : true,
      photoUrl: data.photoUrl,
      avatar: (data as any).avatar || (data.gender === "Female" ? (Number(data.age) < 18 ? "👧" : "👩") : (Number(data.age) < 18 ? "👦" : "👨")),
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

    try {
      let serverRes: any = null;
      try {
        serverRes = await apiClient.post<any>("/users/family-members", serverPayload);
      } catch {
        serverRes = await apiClient.post<any>("/events/family-members", serverPayload);
      }
      if (serverRes && serverRes.id) {
        newMember.id = serverRes.id;
      }
    } catch (err) {
      console.warn("Failed to persist family member on server, keeping locally:", err);
    }

    const updated = [newMember, ...current.filter((m) => m.name.toLowerCase() !== newMember.name.toLowerCase())];
    lastFetchedData = updated;
    lastFetchTime = Date.now();
    persistMembers(updated, true);
    return newMember;
  },

  /**
   * Update an existing family member.
   */
  async updateFamilyMember(id: string | number, data: Partial<FamilyMember>): Promise<FamilyMember> {
    const idStr = String(id);
    const isSelf =
      idStr === "fam-self" ||
      idStr === "self" ||
      (data.relation && (data.relation.toLowerCase().includes("self") || data.relation.toLowerCase().includes("head")));

    const current = getStoredMembers();
    const index = current.findIndex((m) =>
      String(m.id) === idStr ||
      (isSelf && (String(m.id) === "fam-self" || String(m.id) === "self" || m.relation?.toLowerCase().includes("self") || m.relation?.toLowerCase().includes("head")))
    );

    let updatedMember: FamilyMember;
    if (index !== -1) {
      updatedMember = {
        ...current[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      if (isSelf) {
        updatedMember.id = "fam-self";
        updatedMember.relation = "Self (Head)";
      }
      current[index] = updatedMember;
    } else {
      updatedMember = {
        id: isSelf ? "fam-self" : id,
        name: data.name || "Family Member",
        relation: isSelf ? "Self (Head)" : (data.relation || "Family"),
        ...data,
        updatedAt: new Date().toISOString(),
      };
      current.push(updatedMember);
    }

    if (isSelf) {
      saveSelfMeta(updatedMember);
      const user = getStoredUser();
      if (user) {
        if (updatedMember.name) user.fullName = updatedMember.name;
        if (updatedMember.phone) user.phone = updatedMember.phone;
        if (updatedMember.gender) user.gender = updatedMember.gender;
        if (updatedMember.dob) user.dateOfBirth = updatedMember.dob;
        storeUser(user);
      }
    }

    const isRealNumericId = !idStr.startsWith("fam-") && idStr !== "self" && !isNaN(Number(idStr)) && idStr.trim() !== "";

    if (isRealNumericId) {
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
      try {
        try {
          await apiClient.put<any>(`/users/family-members/${id}`, serverPayload);
        } catch {
          await apiClient.put<any>(`/events/family-members/${id}`, serverPayload);
        }
      } catch (err) {
        console.warn("Failed to update family member on server:", err);
      }
    }

    lastFetchedData = [...current];
    lastFetchTime = Date.now();
    persistMembers([...current], true);
    return updatedMember;
  },

  /**
   * Delete a family member by ID from database and repository.
   */
  async deleteFamilyMember(id: string | number): Promise<void> {
    const current = getStoredMembers();
    const filtered = current.filter((m) => String(m.id) !== String(id));

    const idStr = String(id);
    const isRealId = !idStr.startsWith("fam-") && idStr !== "self" && !isNaN(Number(idStr)) && idStr.trim() !== "";

    if (isRealId) {
      try {
        try {
          await apiClient.delete<void>(`/users/family-members/${id}`);
        } catch {
          await apiClient.delete<void>(`/events/family-members/${id}`);
        }
      } catch (err) {
        console.warn("Failed to delete family member on server:", err);
      }
    }

    lastFetchedData = filtered;
    lastFetchTime = Date.now();
    persistMembers(filtered, true);
  },

  /**
   * Synchronize the primary user's profile info into the family table as Self (Head).
   */
  syncUserProfile(fullName: string, dob?: string, gender?: string, phone?: string, email?: string): void {
    if (!fullName) return;
    const current = getStoredMembers();
    const selfIndex = current.findIndex((m) => String(m.id) === "fam-self" || m.relation?.toLowerCase().includes("self") || m.relation?.toLowerCase().includes("head"));

    let calculatedAge: number | undefined;
    if (dob) {
      const birth = new Date(dob);
      if (!isNaN(birth.getTime())) {
        calculatedAge = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
      }
    }

    const selfMeta = getStoredSelfMeta() || {};
    const updatedMeta = {
      ...selfMeta,
      name: fullName,
      dob: dob || selfMeta.dob,
      gender: gender || selfMeta.gender,
      phone: phone || selfMeta.phone,
      email: email || selfMeta.email,
    };
    saveSelfMeta(updatedMeta);

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
        bloodGroup: selfMeta.bloodGroup,
        gotram: selfMeta.gotram,
        avatar: selfMeta.avatar || (gender === "Female" ? "👩" : "👨"),
        emergencyContact: selfMeta.emergencyContact !== undefined ? selfMeta.emergencyContact : true,
        isDevotee: selfMeta.isDevotee !== undefined ? selfMeta.isDevotee : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    lastFetchedData = [...current];
    lastFetchTime = Date.now();
    persistMembers([...current], false);
  },
};
