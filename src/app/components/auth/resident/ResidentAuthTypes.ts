/**
 * Resident Onboarding & Mana ID Authentication Domain Types
 * Single-Flat Multi-User Architecture (E.164 Mobile Identity)
 */

export type ResidentType = 'OWNER' | 'TENANT' | 'FAMILY_MEMBER';

export type RelationshipToFlat =
  | 'OWNER'
  | 'SPOUSE'
  | 'PARENT'
  | 'ADULT_CHILD'
  | 'SIBLING'
  | 'OTHER_FAMILY';

export type ChildRelationship = 'SON' | 'DAUGHTER' | 'DEPENDENT_OTHER';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type AppAccessStatus = 'ACTIVE' | 'INVITED' | 'PARENT_MANAGED' | 'SUSPENDED';

export interface Society {
  id: string;
  name: string;
  code: string;
  city: string;
  towers: string[];
}

export interface HouseholdFlat {
  id: string;
  societyId: string;
  societyName: string;
  tower: string;
  flatNumber: string;
  verificationStatus: VerificationStatus;
  primaryResidentName?: string;
  submittedAt?: string;
}

export interface AdultFamilyMember {
  id: string;
  userId?: string;
  fullName: string;
  mobile: string;
  email?: string;
  relationship: RelationshipToFlat;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  isPrimaryResident: boolean;
  appAccess: boolean;
  accessStatus: AppAccessStatus;
  avatarUrl?: string;
  invitedAt?: string;
}

export interface DependentChild {
  id: string;
  fullName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  relationship: ChildRelationship;
  isParentManaged: boolean;
  guardianId: string;
  guardianName: string;
  avatarUrl?: string;
  eligibleSportsCategories?: string[];
}

export interface UserPropertyMembership {
  id: string;
  flatId: string;
  societyName: string;
  tower: string;
  flatNumber: string;
  residentType: ResidentType;
  isPrimary: boolean;
  unreadNoticesCount: number;
  upcomingEventsCount: number;
}

export type AuthFlowStep =
  | 'WELCOME_LOGIN'          // 1. Welcome / Login
  | 'OTP_VERIFICATION'        // 2. OTP Verification
  | 'REGISTER_FLAT'          // 3. New User / Register Flat
  | 'RESIDENT_PROFILE'       // 4. Resident Profile
  | 'FLAT_VERIFICATION'      // 5. Flat Verification (Admin SLA)
  | 'ADD_FAMILY_LANDING'     // 6. Add Family Members Overview
  | 'ADD_ADULT_MEMBER'       // 7. Add Adult Family Member (Own Login)
  | 'ADD_CHILD'              // 8. Add Child (Parent Managed)
  | 'FAMILY_DASHBOARD'       // 9. My Family Dashboard
  | 'EXISTING_USER_WELCOME'  // 10. Existing User Fast Login
  | 'MULTIPLE_PROPERTY';     // 11. Multiple Property Switcher

export type UserPersona =
  | 'NEW_RESIDENT'
  | 'EXISTING_SINGLE_FLAT'
  | 'MULTI_PROPERTY_OWNER'
  | 'INVITED_FAMILY_MEMBER';
