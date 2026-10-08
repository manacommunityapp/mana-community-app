import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  AuthFlowStep,
  UserPersona,
  Society,
  HouseholdFlat,
  AdultFamilyMember,
  DependentChild,
  UserPropertyMembership,
  ResidentType,
  RelationshipToFlat,
  ChildRelationship,
} from './ResidentAuthTypes';

export const MOCK_SOCIETIES: Society[] = [
  {
    id: 'soc-1',
    name: 'Prestige Palm Greens',
    code: 'PPG-BLR',
    city: 'Bengaluru',
    towers: ['Tower A (Orchid)', 'Tower B (Carnation)', 'Tower C (Tulip)', 'Villa Block V1-V20'],
  },
  {
    id: 'soc-2',
    name: 'Sobha Dream Acres',
    code: 'SDA-BLR',
    city: 'Bengaluru',
    towers: ['Tower 1', 'Tower 2', 'Tower 3', 'Tower 4'],
  },
  {
    id: 'soc-3',
    name: 'Godrej Woodsman Estate',
    code: 'GWE-BLR',
    city: 'Bengaluru',
    towers: ['Acacia', 'Banyan', 'Cedar', 'Deodar'],
  },
];

export const INITIAL_ADULT_MEMBERS: AdultFamilyMember[] = [
  {
    id: 'mem-1',
    fullName: 'Raj Kumar',
    mobile: '+91 98765 43210',
    email: 'raj.kumar@example.com',
    relationship: 'OWNER',
    dob: '1988-05-14',
    gender: 'MALE',
    isPrimaryResident: true,
    appAccess: true,
    accessStatus: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'mem-2',
    fullName: 'Priya Sharma',
    mobile: '+91 98765 88990',
    email: 'priya.sharma@example.com',
    relationship: 'SPOUSE',
    dob: '1990-09-22',
    gender: 'FEMALE',
    isPrimaryResident: false,
    appAccess: true,
    accessStatus: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    invitedAt: '2 days ago',
  },
];

export const INITIAL_CHILDREN: DependentChild[] = [
  {
    id: 'child-1',
    fullName: 'Arjun Kumar',
    dob: '2016-03-10',
    gender: 'MALE',
    relationship: 'SON',
    isParentManaged: true,
    guardianId: 'mem-1',
    guardianName: 'Raj Kumar',
    avatarUrl: 'https://images.unsplash.com/photo-1595454223600-91fbdd77e776?auto=format&fit=crop&w=200&q=80',
    eligibleSportsCategories: ['U-10 Cricket', 'Junior Swimming', 'Chess Novice'],
  },
  {
    id: 'child-2',
    fullName: 'Ananya Kumar',
    dob: '2019-11-04',
    gender: 'FEMALE',
    relationship: 'DAUGHTER',
    isParentManaged: true,
    guardianId: 'mem-1',
    guardianName: 'Raj Kumar',
    avatarUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=200&q=80',
    eligibleSportsCategories: ['Toddler Fun Run', 'Little Artists'],
  },
];

export const MOCK_PROPERTIES: UserPropertyMembership[] = [
  {
    id: 'prop-1',
    flatId: 'flat-101',
    societyName: 'Prestige Palm Greens',
    tower: 'Tower A',
    flatNumber: 'Flat A-1204',
    residentType: 'OWNER',
    isPrimary: true,
    unreadNoticesCount: 3,
    upcomingEventsCount: 2,
  },
  {
    id: 'prop-2',
    flatId: 'flat-202',
    societyName: 'Prestige Palm Greens',
    tower: 'Tower B',
    flatNumber: 'Flat B-2207',
    residentType: 'OWNER',
    isPrimary: false,
    unreadNoticesCount: 1,
    upcomingEventsCount: 1,
  },
];

interface ResidentAuthContextType {
  // Navigation & Flow
  currentStep: AuthFlowStep;
  setCurrentStep: (step: AuthFlowStep) => void;
  activePersona: UserPersona;
  setActivePersona: (persona: UserPersona) => void;
  viewportMode: 'MOBILE' | 'DESKTOP';
  setViewportMode: (mode: 'MOBILE' | 'DESKTOP') => void;

  // Screen 1 & 2 Auth inputs
  mobileNumber: string;
  setMobileNumber: (val: string) => void;
  otpCode: string[];
  setOtpCode: (val: string[]) => void;
  resendCountdown: number;
  handleSendOtp: () => void;
  handleVerifyOtp: () => void;
  handleResendOtp: () => void;

  // Screen 3: Register Flat Form
  selectedSocietyId: string;
  setSelectedSocietyId: (id: string) => void;
  selectedTower: string;
  setSelectedTower: (tower: string) => void;
  flatNumberInput: string;
  setFlatNumberInput: (val: string) => void;
  residentType: ResidentType;
  setResidentType: (type: ResidentType) => void;
  handleContinueFlatRegistration: () => void;

  // Screen 4: Resident Profile Form
  fullName: string;
  setFullName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  dob: string;
  setDob: (dob: string) => void;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  setGender: (g: 'MALE' | 'FEMALE' | 'OTHER') => void;
  relationshipToFlat: RelationshipToFlat;
  setRelationshipToFlat: (rel: RelationshipToFlat) => void;
  isPrimaryResident: boolean;
  setIsPrimaryResident: (val: boolean) => void;
  handleContinueProfile: () => void;

  // Screen 5: Verification
  household: HouseholdFlat;
  handleSubmitVerification: () => void;

  // Family Management (Screens 6, 7, 8, 9)
  adultMembers: AdultFamilyMember[];
  children: DependentChild[];
  handleAddAdultMember: (member: {
    fullName: string;
    mobile: string;
    relationship: RelationshipToFlat;
    dob?: string;
    appAccess: boolean;
  }) => void;
  handleAddChild: (child: {
    fullName: string;
    dob: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    relationship: ChildRelationship;
  }) => void;

  // Screen 11: Multi-Property
  properties: UserPropertyMembership[];
  selectedProperty: UserPropertyMembership | null;
  handleSelectProperty: (prop: UserPropertyMembership) => void;

  // Utility resets
  resetToStep: (step: AuthFlowStep) => void;
}

const ResidentAuthContext = createContext<ResidentAuthContextType | undefined>(undefined);

export const ResidentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<AuthFlowStep>('WELCOME_LOGIN');
  const [activePersona, setActivePersonaState] = useState<UserPersona>('NEW_RESIDENT');
  const [viewportMode, setViewportMode] = useState<'MOBILE' | 'DESKTOP'>('MOBILE');

  // Phone and OTP
  const [mobileNumber, setMobileNumber] = useState('98765 43210');
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(45);

  // Flat Registration
  const [selectedSocietyId, setSelectedSocietyId] = useState('soc-1');
  const [selectedTower, setSelectedTower] = useState('Tower A (Orchid)');
  const [flatNumberInput, setFlatNumberInput] = useState('1204');
  const [residentType, setResidentType] = useState<ResidentType>('OWNER');

  // Profile Form
  const [fullName, setFullName] = useState('Raj Kumar');
  const [email, setEmail] = useState('raj.kumar@example.com');
  const [dob, setDob] = useState('1988-05-14');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [relationshipToFlat, setRelationshipToFlat] = useState<RelationshipToFlat>('OWNER');
  const [isPrimaryResident, setIsPrimaryResident] = useState(true);

  // Household data
  const [household, setHousehold] = useState<HouseholdFlat>({
    id: 'flat-101',
    societyId: 'soc-1',
    societyName: 'Prestige Palm Greens',
    tower: 'Tower A',
    flatNumber: 'Flat A-1204',
    verificationStatus: 'PENDING',
    primaryResidentName: 'Raj Kumar',
  });

  // Family Members
  const [adultMembers, setAdultMembers] = useState<AdultFamilyMember[]>(INITIAL_ADULT_MEMBERS);
  const [childrenList, setChildrenList] = useState<DependentChild[]>(INITIAL_CHILDREN);

  // Properties
  const [properties] = useState<UserPropertyMembership[]>(MOCK_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<UserPropertyMembership | null>(MOCK_PROPERTIES[0]);

  // Timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (currentStep === 'OTP_VERIFICATION' && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, resendCountdown]);

  // Persona switch handler
  const setActivePersona = (persona: UserPersona) => {
    setActivePersonaState(persona);
    if (persona === 'NEW_RESIDENT') {
      setMobileNumber('98111 22233');
      setFullName('Aditi Roy');
      setFlatNumberInput('402');
      setCurrentStep('WELCOME_LOGIN');
    } else if (persona === 'EXISTING_SINGLE_FLAT') {
      setMobileNumber('98765 43210');
      setFullName('Raj Kumar');
      setFlatNumberInput('1204');
      setCurrentStep('WELCOME_LOGIN');
    } else if (persona === 'MULTI_PROPERTY_OWNER') {
      setMobileNumber('98765 00001');
      setFullName('Vikramaditya Rao');
      setCurrentStep('WELCOME_LOGIN');
    } else if (persona === 'INVITED_FAMILY_MEMBER') {
      setMobileNumber('98765 88990');
      setFullName('Priya Sharma');
      setCurrentStep('WELCOME_LOGIN');
    }
  };

  const handleSendOtp = () => {
    setResendCountdown(45);
    setOtpCode(['5', '8', '2', '9', '1', '4']); // Auto-fill mock OTP for fast trial
    setCurrentStep('OTP_VERIFICATION');
  };

  const handleVerifyOtp = () => {
    if (activePersona === 'EXISTING_SINGLE_FLAT') {
      setCurrentStep('EXISTING_USER_WELCOME');
    } else if (activePersona === 'MULTI_PROPERTY_OWNER') {
      setCurrentStep('MULTIPLE_PROPERTY');
    } else if (activePersona === 'INVITED_FAMILY_MEMBER') {
      setCurrentStep('FAMILY_DASHBOARD');
    } else {
      // NEW_RESIDENT
      setCurrentStep('REGISTER_FLAT');
    }
  };

  const handleResendOtp = () => {
    setResendCountdown(45);
  };

  const handleContinueFlatRegistration = () => {
    const soc = MOCK_SOCIETIES.find((s) => s.id === selectedSocietyId);
    setHousehold((prev) => ({
      ...prev,
      societyName: soc ? soc.name : 'Prestige Palm Greens',
      tower: selectedTower.split(' ')[0] || 'Tower A',
      flatNumber: `Flat ${selectedTower.charAt(0)}-${flatNumberInput}`,
    }));
    setCurrentStep('RESIDENT_PROFILE');
  };

  const handleContinueProfile = () => {
    setHousehold((prev) => ({
      ...prev,
      primaryResidentName: fullName,
    }));
    setCurrentStep('FLAT_VERIFICATION');
  };

  const handleSubmitVerification = () => {
    setHousehold((prev) => ({
      ...prev,
      verificationStatus: 'PENDING',
      submittedAt: 'Just now',
    }));
    // After a brief pause or on submit, proceed to family onboarding
    setCurrentStep('ADD_FAMILY_LANDING');
  };

  const handleAddAdultMember = (member: {
    fullName: string;
    mobile: string;
    relationship: RelationshipToFlat;
    dob?: string;
    appAccess: boolean;
  }) => {
    const newMember: AdultFamilyMember = {
      id: `mem-${Date.now()}`,
      fullName: member.fullName,
      mobile: member.mobile,
      relationship: member.relationship,
      dob: member.dob,
      isPrimaryResident: false,
      appAccess: member.appAccess,
      accessStatus: member.appAccess ? 'INVITED' : 'ACTIVE',
      invitedAt: 'Just now',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    };
    setAdultMembers((prev) => [...prev, newMember]);
    setCurrentStep('FAMILY_DASHBOARD');
  };

  const handleAddChild = (child: {
    fullName: string;
    dob: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    relationship: ChildRelationship;
  }) => {
    const newChild: DependentChild = {
      id: `child-${Date.now()}`,
      fullName: child.fullName,
      dob: child.dob,
      gender: child.gender,
      relationship: child.relationship,
      isParentManaged: true,
      guardianId: 'mem-1',
      guardianName: fullName || 'Raj Kumar',
      avatarUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=200&q=80',
      eligibleSportsCategories: ['Junior Athletics', 'Kids Swimming'],
    };
    setChildrenList((prev) => [...prev, newChild]);
    setCurrentStep('FAMILY_DASHBOARD');
  };

  const handleSelectProperty = (prop: UserPropertyMembership) => {
    setSelectedProperty(prop);
    setCurrentStep('EXISTING_USER_WELCOME');
  };

  const resetToStep = (step: AuthFlowStep) => {
    setCurrentStep(step);
  };

  return (
    <ResidentAuthContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        activePersona,
        setActivePersona,
        viewportMode,
        setViewportMode,
        mobileNumber,
        setMobileNumber,
        otpCode,
        setOtpCode,
        resendCountdown,
        handleSendOtp,
        handleVerifyOtp,
        handleResendOtp,
        selectedSocietyId,
        setSelectedSocietyId,
        selectedTower,
        setSelectedTower,
        flatNumberInput,
        setFlatNumberInput,
        residentType,
        setResidentType,
        handleContinueFlatRegistration,
        fullName,
        setFullName,
        email,
        setEmail,
        dob,
        setDob,
        gender,
        setGender,
        relationshipToFlat,
        setRelationshipToFlat,
        isPrimaryResident,
        setIsPrimaryResident,
        handleContinueProfile,
        household,
        handleSubmitVerification,
        adultMembers,
        children: childrenList,
        handleAddAdultMember,
        handleAddChild,
        properties,
        selectedProperty,
        handleSelectProperty,
        resetToStep,
      }}
    >
      {children}
    </ResidentAuthContext.Provider>
  );
};

export const useResidentAuth = () => {
  const context = useContext(ResidentAuthContext);
  if (!context) {
    throw new Error('useResidentAuth must be used within a ResidentAuthProvider');
  }
  return context;
};
