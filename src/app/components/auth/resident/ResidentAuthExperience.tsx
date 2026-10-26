import React, { useState } from 'react';
import { ResidentAuthProvider, useResidentAuth } from './ResidentAuthContext';
import type { AuthFlowStep, UserPersona } from './ResidentAuthTypes';

import { WelcomeLoginScreen } from './WelcomeLoginScreen';
import { OtpVerificationScreen } from './OtpVerificationScreen';
import { RegisterFlatScreen } from './RegisterFlatScreen';
import { ResidentProfileScreen } from './ResidentProfileScreen';
import { FlatVerificationScreen } from './FlatVerificationScreen';
import { AddFamilyLandingScreen } from './AddFamilyLandingScreen';
import { AddAdultMemberScreen } from './AddAdultMemberScreen';
import { AddChildScreen } from './AddChildScreen';
import { FamilyDashboardScreen } from './FamilyDashboardScreen';
import { ExistingUserWelcomeScreen } from './ExistingUserWelcomeScreen';
import { MultiplePropertySelectorScreen } from './MultiplePropertySelectorScreen';

import {
  Smartphone,
  Monitor,
  Users,
  Building2,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Database,
  ArrowRightLeft,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

const FlowScreenRenderer: React.FC = () => {
  const { currentStep } = useResidentAuth();

  switch (currentStep) {
    case 'WELCOME_LOGIN':
      return <WelcomeLoginScreen />;
    case 'OTP_VERIFICATION':
      return <OtpVerificationScreen />;
    case 'REGISTER_FLAT':
      return <RegisterFlatScreen />;
    case 'RESIDENT_PROFILE':
      return <ResidentProfileScreen />;
    case 'FLAT_VERIFICATION':
      return <FlatVerificationScreen />;
    case 'ADD_FAMILY_LANDING':
      return <AddFamilyLandingScreen />;
    case 'ADD_ADULT_MEMBER':
      return <AddAdultMemberScreen />;
    case 'ADD_CHILD':
      return <AddChildScreen />;
    case 'FAMILY_DASHBOARD':
      return <FamilyDashboardScreen />;
    case 'EXISTING_USER_WELCOME':
      return <ExistingUserWelcomeScreen />;
    case 'MULTIPLE_PROPERTY':
      return <MultiplePropertySelectorScreen />;
    default:
      return <WelcomeLoginScreen />;
  }
};

const ResidentAuthExperienceInner: React.FC = () => {
  const {
    currentStep,
    setCurrentStep,
    activePersona,
    setActivePersona,
    viewportMode,
    setViewportMode,
  } = useResidentAuth();

  const [showArchPanel, setShowArchPanel] = useState(false);

  const stepsList: { step: AuthFlowStep; label: string; num: number }[] = [
    { step: 'WELCOME_LOGIN', label: '1. Welcome / Login', num: 1 },
    { step: 'OTP_VERIFICATION', label: '2. OTP Verification', num: 2 },
    { step: 'REGISTER_FLAT', label: '3. Register Flat', num: 3 },
    { step: 'RESIDENT_PROFILE', label: '4. Resident Profile', num: 4 },
    { step: 'FLAT_VERIFICATION', label: '5. Flat Verification', num: 5 },
    { step: 'ADD_FAMILY_LANDING', label: '6. Add Family Hub', num: 6 },
    { step: 'ADD_ADULT_MEMBER', label: '7. Add Adult Member', num: 7 },
    { step: 'ADD_CHILD', label: '8. Add Child', num: 8 },
    { step: 'FAMILY_DASHBOARD', label: '9. My Family Dashboard', num: 9 },
    { step: 'EXISTING_USER_WELCOME', label: '10. Existing User Fast Login', num: 10 },
    { step: 'MULTIPLE_PROPERTY', label: '11. Multi-Property Switcher', num: 11 },
  ];

  const personas: { id: UserPersona; title: string; desc: string; icon: string }[] = [
    {
      id: 'NEW_RESIDENT',
      title: 'New Resident',
      desc: 'Registers Flat A-402, Profile & Adds Family',
      icon: '🏠',
    },
    {
      id: 'EXISTING_SINGLE_FLAT',
      title: 'Existing Resident',
      desc: 'Fast 1-tap OTP login to Flat A-1204',
      icon: '⚡',
    },
    {
      id: 'MULTI_PROPERTY_OWNER',
      title: 'Multi-Property Owner',
      desc: 'Owns Flat A-1204 & Flat B-2207',
      icon: '🏢',
    },
    {
      id: 'INVITED_FAMILY_MEMBER',
      title: 'Invited Spouse (Priya)',
      desc: 'Adult member logging in with own phone',
      icon: '👨‍👩‍👧',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F0F4FA] text-[#202124] flex flex-col font-sans">
      {/* Top Experience Navigation Bar */}
      <header className="bg-[#173B72] text-white border-b border-[#1F4B8F] px-4 sm:px-6 py-3.5 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white shadow-sm font-black">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Mana ID · Resident Onboarding Experience
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2F6FED] text-white uppercase tracking-wider">
                  Live Prototype
                </span>
              </div>
              <p className="text-[11px] text-blue-200">
                Single-Flat Multi-User Architecture (1 Phone = 1 Human Identity)
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Viewport Switcher */}
            <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/15 text-xs">
              <button
                onClick={() => setViewportMode('MOBILE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewportMode === 'MOBILE'
                    ? 'bg-white text-[#173B72] shadow-sm'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile Frame</span>
              </button>
              <button
                onClick={() => setViewportMode('DESKTOP')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewportMode === 'DESKTOP'
                    ? 'bg-white text-[#173B72] shadow-sm'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop Responsive</span>
              </button>
            </div>

            {/* Architecture Spec Toggle */}
            <button
              onClick={() => setShowArchPanel(!showArchPanel)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2F6FED] hover:bg-blue-600 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Mana ID Specs</span>
            </button>
          </div>
        </div>
      </header>

      {/* Persona & Flow Selector Bar */}
      <section className="bg-white border-b border-[#DCE3EE] px-4 sm:px-6 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Persona Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-[#667085] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Test Persona:
            </span>
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePersona(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activePersona === p.id
                    ? 'bg-[#173B72] text-white border-[#173B72] shadow-sm shadow-[#173B72]/20'
                    : 'bg-white text-[#667085] border-[#DCE3EE] hover:border-gray-300'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.title}</span>
              </button>
            ))}
          </div>

          {/* Current Step Tracker Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#667085] font-medium">Active Screen:</span>
            <span className="text-xs font-bold text-[#173B72] bg-[#EEF4FE] border border-blue-200 px-2.5 py-1 rounded-lg">
              {stepsList.find((s) => s.step === currentStep)?.label || currentStep}
            </span>
          </div>
        </div>
      </section>

      {/* Main Interactive Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Left Side: Step Navigation Rail */}
        <aside className="w-full lg:w-72 bg-white rounded-2xl border border-[#DCE3EE] p-4 shadow-sm shrink-0">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100">
            <Layers className="w-4 h-4 text-[#2F6FED]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#173B72]">
              All 11 Flow Screens
            </h2>
          </div>

          <div className="space-y-1">
            {stepsList.map((item) => {
              const isActive = currentStep === item.step;
              return (
                <button
                  key={item.step}
                  onClick={() => setCurrentStep(item.step)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#EEF4FE] text-[#173B72] font-bold border border-blue-200 shadow-xs'
                      : 'text-[#667085] hover:bg-gray-50 hover:text-[#202124]'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {isActive ? (
                    <span className="w-2 h-2 rounded-full bg-[#2F6FED]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Explainer Card */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="rounded-xl bg-gradient-to-br from-[#173B72]/5 to-[#2F6FED]/10 border border-blue-100 p-3 text-[11px] text-[#173B72] leading-relaxed">
              <strong className="font-bold block mb-1">Architecture Note:</strong>
              Adults login via individual OTP (+91 E.164); children are parent-managed for tournament age brackets.
            </div>
          </div>
        </aside>

        {/* Center: Device Viewport Container */}
        <section className="flex-1 flex justify-center w-full">
          {viewportMode === 'MOBILE' ? (
            /* iPhone 16 Pro Style Mobile Mockup Frame */
            <div className="relative w-full max-w-[400px] h-[780px] bg-black rounded-[48px] p-3.5 shadow-2xl shadow-[#173B72]/20 ring-1 ring-gray-900/10 border-4 border-gray-800 flex flex-col">
              {/* Dynamic Island / Speaker Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] mr-3" />
                <div className="w-3 h-3 rounded-full bg-[#111]" />
              </div>

              {/* Status Bar */}
              <div className="h-6 w-full pt-2 px-6 flex items-center justify-between text-[11px] font-semibold text-gray-700 select-none z-20">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">5G</span>
                  <div className="w-5 h-2.5 border border-gray-600 rounded-sm p-0.5 flex items-center">
                    <div className="w-full h-full bg-gray-800 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Mobile Screen Surface */}
              <div className="flex-1 bg-[#F6F8FC] rounded-[36px] overflow-y-auto overflow-x-hidden relative shadow-inner scrollbar-thin scrollbar-thumb-gray-200">
                <FlowScreenRenderer />
              </div>

              {/* Home Bar Indicator */}
              <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mt-2 shrink-0" />
            </div>
          ) : (
            /* Desktop / Tablet Responsive Card Container */
            <div className="w-full max-w-3xl bg-white rounded-3xl border border-[#DCE3EE] shadow-xl shadow-[#173B72]/5 overflow-hidden min-h-[700px] flex flex-col">
              <div className="bg-[#173B72] px-6 py-3 text-white flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  <span>Desktop Responsive Viewport</span>
                </span>
                <span className="text-blue-200">Prestige Palm Greens · Resident Portal</span>
              </div>
              <div className="flex-1 overflow-y-auto bg-[#F6F8FC]">
                <FlowScreenRenderer />
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Slide-Over Architecture & Mana ID Specification Inspector */}
      {showArchPanel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto border-l border-[#DCE3EE]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#173B72] text-white flex items-center justify-center font-bold">
                  <Database className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#173B72]">Mana ID Architecture Blueprint</h2>
                  <p className="text-xs text-[#667085]">Microservice & Relational Data Model</p>
                </div>
              </div>
              <button
                onClick={() => setShowArchPanel(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 text-xs text-[#202124]">
              {/* Pillar 1: Entity Tree */}
              <div className="rounded-2xl bg-[#EEF4FE] p-4 border border-blue-100">
                <h3 className="font-bold text-sm text-[#173B72] mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#2F6FED]" />
                  1. Multi-Tenant Relational Hierarchy
                </h3>
                <pre className="font-mono text-[11px] bg-white p-3 rounded-xl border border-blue-100 text-[#173B72] overflow-x-auto">
{`Mana ID (Global Auth)
└── User (Mobile Number + E.164)
    ├── Device & Biometrics
    ├── Session (Redis Cached)
    └── Memberships [Junction]
        ├── Community (Society ID)
        ├── HouseholdUnit (Flat ID: A-1204)
        │   ├── Adult Family (Own Login)
        │   └── Parent-Managed Children
        └── Role & RBAC Permissions`}
                </pre>
              </div>

              {/* Pillar 2: Backward Compatibility */}
              <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
                <h3 className="font-bold text-sm text-amber-900 mb-2 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                  2. Existing User Data Migration Strategy
                </h3>
                <ul className="space-y-1.5 text-amber-950 text-xs">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Existing Phone Users:</strong> Auto-matched upon OTP; direct 1-tap entry into their flat without re-registering.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Existing Email Users:</strong> 1-time email match link merges their tournament stats & CricHeroes profile into their new Mana ID phone.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Sports & CricHeroes Data:</strong> All player ranking history, batting/bowling statistics, and auction records are 100% preserved.</span>
                  </li>
                </ul>
              </div>

              {/* Pillar 3: Security & Session Rules */}
              <div className="rounded-2xl bg-green-50 p-4 border border-green-200">
                <h3 className="font-bold text-sm text-green-900 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                  3. Zero-Shared-Password Policy
                </h3>
                <p className="text-green-950 leading-relaxed mb-2">
                  Flats never share a generic login. Spouses, parents, and adult children each have their own mobile identity and OTP.
                </p>
                <div className="bg-white p-3 rounded-xl border border-green-100 flex items-center justify-between font-mono text-[11px] text-green-800">
                  <span>JWT Claims: sub=userId, flatId=A1204, role=RESIDENT</span>
                  <KeyRound className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ResidentAuthExperience: React.FC = () => {
  return (
    <ResidentAuthProvider>
      <ResidentAuthExperienceInner />
    </ResidentAuthProvider>
  );
};
