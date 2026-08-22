import { apiClient, getStoredUser } from "./apiClient";

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
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type FamilyMemberRequest = Omit<FamilyMember, "id" | "createdAt" | "updatedAt">;

const STORAGE_KEY = "mana_family_members_v3";

const DUMMY_STATIC_NAMES = new Set([
  "sunita sharma",
  "aarav sharma",
  "ananya sharma",
  "suresh sharma",
  "ramesh verma",
  "priya verma",
  "rahul verma",
]);

function getDefaultInitialMembers(): FamilyMember[] {
  const user = getStoredUser();
  if (!user || !user.fullName) {
    return [];
  }

  const userName = user.fullName;
  const userGender = user.gender || "Male";
  const userPhone = user.phone || "";
  const userEmail = user.email || "";
  const userDob = user.dateOfBirth;

  let calculatedAge: number | undefined;
  if (userDob) {
    const birth = new Date(userDob);
    if (!isNaN(birth.getTime())) {
      calculatedAge = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
    }
  }

  return [
    {
      id: "fam-self",
      userId: user.userId ? Number(user.userId) : undefined,
      name: userName,
      relation: "Self (Head)",
      age: calculatedAge,
      dob: userDob,
      gender: userGender,
      phone: userPhone,
      email: userEmail,
      emergencyContact: true,
      isDevotee: true,
      notes: "Primary resident and household head",
      createdAt: new Date().toISOString(),
    },
  ];
}

function getStoredMembers(): FamilyMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out any stale dummy mock names from previous sessions
        const clean = parsed.filter(
          (m) => m && m.name && !DUMMY_STATIC_NAMES.has(m.name.trim().toLowerCase())
        );
        if (clean.length > 0) {
          return clean;
        }
      }
    }
  } catch (err) {
    console.warn("Could not read family members from localStorage:", err);
  }
  return getDefaultInitialMembers();
}

function persistMembers(members: FamilyMember[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch (err) {
    console.warn("Could not save family members to localStorage:", err);
  }
  window.dispatchEvent(new CustomEvent("mana_family_updated", { detail: members }));
}

export const familyService = {
  /**
   * Get all family members for the current user.
   * Tries backend API first with fallback to synchronized local repository.
   */
  async getFamilyMembers(_forceRefresh = false): Promise<FamilyMember[]> {
    try {
      let res: any[] | null = null;
      try {
        res = await apiClient.get<any[]>("/events/family-members");
      } catch {
        try {
          res = await apiClient.get<any[]>("/users/family-members");
        } catch {
          // fallback
        }
      }

      if (Array.isArray(res) && res.length > 0) {
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
          gotram: m.gotram,
          emergencyContact: Boolean(m.emergencyContact || m.isEmergency),
          isDevotee: m.isDevotee !== undefined ? Boolean(m.isDevotee) : true,
          photoUrl: m.photoUrl,
          notes: m.notes,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        }));
        persistMembers(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("Could not fetch family members from database API:", err);
    }

    return getStoredMembers();
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
      gotram: data.gotram?.trim(),
      emergencyContact: Boolean(data.emergencyContact),
      isDevotee: data.isDevotee !== undefined ? Boolean(data.isDevotee) : true,
      photoUrl: data.photoUrl,
      notes: data.notes?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      try {
        const serverRes = await apiClient.post<any>("/events/family-members", newMember);
        if (serverRes && serverRes.id) {
          newMember.id = serverRes.id;
        }
      } catch {
        const userRes = await apiClient.post<any>("/users/family-members", newMember);
        if (userRes && userRes.id) {
          newMember.id = userRes.id;
        }
      }
    } catch {
      // Local fallback continues smoothly
    }

    const updated = [newMember, ...current.filter((m) => m.name.toLowerCase() !== newMember.name.toLowerCase())];
    persistMembers(updated);
    return newMember;
  },

  /**
   * Update an existing family member.
   */
  async updateFamilyMember(id: string | number, data: Partial<FamilyMember>): Promise<FamilyMember> {
    const current = getStoredMembers();
    const index = current.findIndex((m) => String(m.id) === String(id));

    let updatedMember: FamilyMember;
    if (index !== -1) {
      updatedMember = {
        ...current[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      current[index] = updatedMember;
    } else {
      updatedMember = {
        id,
        name: data.name || "Family Member",
        relation: data.relation || "Family",
        ...data,
        updatedAt: new Date().toISOString(),
      };
      current.push(updatedMember);
    }

    try {
      try {
        await apiClient.put<any>(`/events/family-members/${id}`, updatedMember);
      } catch {
        await apiClient.put<any>(`/users/family-members/${id}`, updatedMember);
      }
    } catch {
      // Local fallback continues smoothly
    }

    persistMembers([...current]);
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
          await apiClient.delete<void>(`/events/family-members/${id}`);
        } catch {
          await apiClient.delete<void>(`/users/family-members/${id}`);
        }
      } catch {
        // Local fallback continues smoothly
      }
    }

    persistMembers(filtered);
  },

  /**
   * Synchronize the primary user's profile info into the family table as Self (Head).
   */
  syncUserProfile(fullName: string, dob?: string, gender?: string, phone?: string, email?: string): void {
    if (!fullName) return;
    const current = getStoredMembers();
    const selfIndex = current.findIndex((m) => m.relation?.toLowerCase().includes("self") || m.relation?.toLowerCase().includes("head"));

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
        emergencyContact: true,
        isDevotee: true,
        createdAt: new Date().toISOString(),
      });
    }

    persistMembers([...current]);
  },
};
