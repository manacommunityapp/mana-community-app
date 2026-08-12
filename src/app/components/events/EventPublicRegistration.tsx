import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import {
  User, Users, Mail, Phone, MapPin, Calendar, Clock, CheckCircle2,
  ChevronRight, ChevronLeft, ArrowRight, Loader2, AlertCircle,
  Shield, UserPlus, Trash2, Heart, Baby, UserCheck, UserCog,
  Sparkles, QrCode, Download, Share2, Ticket, Star,
  Stethoscope, Accessibility, Megaphone, ShieldCheck,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { cn } from "../ui/utils";
import { eventService, type EventResponse } from "../../../services/events/eventService";
import { eventProgramService, type ActivityRegistrationResponse, type EventProgramResponse } from "../../../services/events/eventProgramService";
import { CollapsibleFormSection, type RegistrationFormConfig, type FormField } from "./EventRegistrationFormBuilder";
import { userService } from "../../../services/common/userService";

/* ─── Constants ─── */
const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"] as const;
const RELATIONSHIP_OPTIONS = ["Spouse", "Child", "Parent", "Sibling", "Other"] as const;
const DIETARY_OPTIONS = ["Vegetarian", "Non-Vegetarian", "Vegan", "Jain", "Eggetarian", "No Preference"] as const;
const ID_PROOF_TYPES = ["Aadhaar Card", "PAN Card", "Passport", "Driving License", "Voter ID"] as const;
const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const REFERRAL_SOURCES = [
  "WhatsApp / Social Media",
  "Community Notice Board",
  "Friend / Family",
  "Email / Newsletter",
  "Society App",
  "Poster / Banner",
  "Other",
] as const;

const AGE_CATEGORIES = [
  { label: "Child (0–12)", min: 0, max: 12 },
  { label: "Teen (13–17)", min: 13, max: 17 },
  { label: "Adult (18–59)", min: 18, max: 59 },
  { label: "Senior (60+)", min: 60, max: 120 },
] as const;

/* ─── Mock event for demo ─── */
const MOCK_EVENT = {
  id: 1,
  title: "Ganesh Chaturthi Grand Festival 2026",
  description: "Join us for 10 days of devotion, culture, and celebration! Featuring live performances, cultural programs, food courts, competitions, and the grand visarjan procession.",
  startDate: "2026-08-22",
  endDate: "2026-08-31",
  startTime: "08:00 AM",
  endTime: "10:00 PM",
  location: "Society Ground & Community Hall, Andheri East, Mumbai",
  organizerName: "Mana Community",
  organizerContact: "+91 98765 43210",
  capacity: 500,
  attendees: 187,
};

/* ─── Types ─── */
interface FamilyMember {
  id: string;
  name: string;
  age: string;
  gender: string;
  relationship: string;
}

interface RegistrationForm {
  registrationType: "individual" | "family" | "";
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  flatNo?: string;
  colonyAddress?: string;
  poojaSlot?: string;
  city: string;
  pincode: string;
  familyMembers: FamilyMember[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  idProofType: string;
  idProofNumber: string;
  dietaryPreference: string;
  medicalConditions: string;
  allergies: string;
  specialNeeds: string;
  tshirtSize: string;
  referralSource: string;
  agreeTerms: boolean;
  agreePhotography: boolean;
}

const STEPS = [
  { id: 1, label: "Type" },
  { id: 2, label: "Details" },
  { id: 3, label: "Family" },
  { id: 4, label: "Additional" },
  { id: 5, label: "Review" },
];

const INPUT_CLS = "w-full px-4 py-3 h-auto rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50";

const LABEL_CLS = "block text-xs font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function getAgeCategory(age: number): string {
  const cat = AGE_CATEGORIES.find(c => age >= c.min && age <= c.max);
  return cat?.label ?? "";
}

/* ─── Step 1: Registration Type ─── */
function Step1Type({ form, update }: { form: RegistrationForm; update: (k: keyof RegistrationForm, v: any) => void }) {
  const types = [
    {
      id: "individual" as const,
      icon: User,
      title: "Individual",
      subtitle: "Register yourself",
      description: "Single person registration with all personal details.",
      badge: null,
    },
    {
      id: "family" as const,
      icon: Users,
      title: "Family",
      subtitle: "Register with family members",
      description: "Register yourself along with your family members — spouse, children, parents, or siblings.",
      badge: "Recommended",
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">Choose how you'd like to register for this event.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {types.map(t => {
          const isSelected = form.registrationType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => update("registrationType", t.id)}
              className={cn(
                "p-5 sm:p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden hover:-translate-y-0.5 active:scale-[0.98]",
                isSelected
                  ? "border-indigo-400 bg-indigo-50 shadow-[0_4px_20px_rgba(99,102,241,0.2)]"
                  : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
              )}
            >
              {t.badge && (
                <Badge className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black text-white border-none bg-emerald-500">
                  {t.badge}
                </Badge>
              )}

              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  isSelected ? "bg-indigo-500" : "bg-slate-100"
                )}
              >
                <t.icon className={cn("w-6 h-6", isSelected ? "text-white" : "text-slate-500")} />
              </div>

              <p className={cn("font-black text-lg", isSelected ? "text-indigo-700" : "text-slate-900")}>
                {t.title}
              </p>
              <p className={cn("text-xs mt-0.5", isSelected ? "text-indigo-500" : "text-slate-400")}>
                {t.subtitle}
              </p>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">{t.description}</p>

              <div
                className={cn(
                  "mt-4 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  isSelected ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                )}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 2: Personal Details ─── */
function Step2Details({ form, update }: { form: RegistrationForm; update: (k: keyof RegistrationForm, v: any) => void }) {
  const ageNum = parseInt(form.age);
  const ageCat = !isNaN(ageNum) ? getAgeCategory(ageNum) : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <p className="text-sm font-bold text-slate-700">Primary Registrant Details</p>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">
          Category: Family Pass
        </span>
      </div>

      {/* Personal Information */}
      <CollapsibleFormSection title="Personal Information" icon={User} defaultOpen={true}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={LABEL_CLS}>First Name<span className="text-rose-500 ml-0.5">*</span></Label>
              <Input value={form.firstName} onChange={e => update("firstName", e.target.value)} placeholder="Arjun" className={INPUT_CLS} />
            </div>
            <div>
              <Label className={LABEL_CLS}>Last Name<span className="text-rose-500 ml-0.5">*</span></Label>
              <Input value={form.lastName} onChange={e => update("lastName", e.target.value)} placeholder="Sharma" className={INPUT_CLS} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={LABEL_CLS}>Age<span className="text-rose-500 ml-0.5">*</span></Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={form.age}
                  onChange={e => update("age", e.target.value)}
                  placeholder="e.g. 32"
                  className={INPUT_CLS}
                />
                {ageCat && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {ageCat}
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label className={LABEL_CLS}>Gender<span className="text-rose-500 ml-0.5">*</span></Label>
              <Select value={form.gender} onValueChange={v => update("gender", v)}>
                <SelectTrigger className={INPUT_CLS}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CollapsibleFormSection>

      {/* Contact & Address Details */}
      <CollapsibleFormSection title="Contact & Residential Details" icon={Phone} defaultOpen={true}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={LABEL_CLS}>Mobile Number (WhatsApp)<span className="text-rose-500 ml-0.5">*</span></Label>
              <Input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+91 98765 43210" className={INPUT_CLS} />
            </div>
            <div>
              <Label className={LABEL_CLS}>Email Address<span className="text-rose-500 ml-0.5">*</span></Label>
              <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="arjun@example.com" className={INPUT_CLS} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={LABEL_CLS}>Emergency Contact Number</Label>
              <Input type="tel" value={form.emergencyContactPhone} onChange={e => update("emergencyContactPhone", e.target.value)} placeholder="+91 98200 54321" className={INPUT_CLS} />
            </div>
            <div>
              <Label className={LABEL_CLS}>Flat / Villa No</Label>
              <Input value={form.flatNo || ""} onChange={e => update("flatNo", e.target.value)} placeholder="e.g. Villa 402 / Flat B-12" className={INPUT_CLS} />
            </div>
          </div>

          <div>
            <Label className={LABEL_CLS}>Residential Colony / Street Address</Label>
            <Input value={form.colonyAddress || form.address} onChange={e => { update("colonyAddress", e.target.value); update("address", e.target.value); }} placeholder="e.g. LE Community, M.G. Road, Miyapur, Hyderabad" className={INPUT_CLS} />
          </div>

          <div>
            <Label className={LABEL_CLS}>Preferred Pooja Time Slot</Label>
            <Select value={form.poojaSlot || "Evening Visarjan / Utsav (05:00 PM - 09:00 PM)"} onValueChange={v => update("poojaSlot", v)}>
              <SelectTrigger className={INPUT_CLS}>
                <SelectValue placeholder="Select Pooja Time Slot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Morning Aarti (07:00 AM - 11:00 AM)">Morning Aarti (07:00 AM - 11:00 AM)</SelectItem>
                <SelectItem value="Afternoon Pooja & Prasad (12:00 PM - 03:00 PM)">Afternoon Pooja & Prasad (12:00 PM - 03:00 PM)</SelectItem>
                <SelectItem value="Evening Visarjan / Utsav (05:00 PM - 09:00 PM)">Evening Visarjan / Utsav (05:00 PM - 09:00 PM)</SelectItem>
                <SelectItem value="Late Night Bhajan Sandhya (09:00 PM - 11:30 PM)">Late Night Bhajan Sandhya (09:00 PM - 11:30 PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={LABEL_CLS}>City</Label>
              <Input value={form.city} onChange={e => update("city", e.target.value)} placeholder="Hyderabad" className={INPUT_CLS} />
            </div>
            <div>
              <Label className={LABEL_CLS}>Pincode</Label>
              <Input value={form.pincode} onChange={e => update("pincode", e.target.value)} placeholder="500049" className={INPUT_CLS} />
            </div>
          </div>
        </div>
      </CollapsibleFormSection>
    </div>
  );
}

/* ─── Step 3: Family Members ─── */
function Step3Family({
  form,
  setForm,
}: {
  form: RegistrationForm;
  setForm: React.Dispatch<React.SetStateAction<RegistrationForm>>;
}) {
  const addMember = () => {
    setForm(prev => ({
      ...prev,
      familyMembers: [
        ...prev.familyMembers,
        { id: generateId(), name: "", age: "", gender: "", relationship: "" },
      ],
    }));
  };

  const removeMember = (id: string) => {
    setForm(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter(m => m.id !== id),
    }));
  };

  const updateMember = (id: string, field: keyof FamilyMember, value: string) => {
    setForm(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.map(m => (m.id === id ? { ...m, [field]: value } : m)),
    }));
  };

  const relationshipIcons: Record<string, any> = {
    Spouse: Heart,
    Child: Baby,
    Parent: UserCheck,
    Sibling: Users,
    Other: UserCog,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Add your family members who will be attending.</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {form.familyMembers.length} member{form.familyMembers.length !== 1 ? "s" : ""} added
            {" · "}Total {form.familyMembers.length + 1} attendees (including you)
          </p>
        </div>
      </div>

      {/* Family member cards */}
      <div className="space-y-4">
        {form.familyMembers.map((member, idx) => {
          const RelIcon = relationshipIcons[member.relationship] || UserPlus;
          const ageNum = parseInt(member.age);
          const ageCat = !isNaN(ageNum) ? getAgeCategory(ageNum) : "";

          return (
            <div
              key={member.id}
              className="p-4 rounded-2xl border border-slate-200 bg-white space-y-4 relative animate-fade-in-up"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <RelIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">
                    Member {idx + 1}
                    {member.relationship && <span className="text-indigo-500 ml-1">· {member.relationship}</span>}
                  </span>
                </div>
                <button
                  onClick={() => removeMember(member.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className={LABEL_CLS}>Full Name<span className="text-rose-500 ml-0.5">*</span></Label>
                  <Input
                    value={member.name}
                    onChange={e => updateMember(member.id, "name", e.target.value)}
                    placeholder="Full name"
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <Label className={LABEL_CLS}>Relationship<span className="text-rose-500 ml-0.5">*</span></Label>
                  <Select value={member.relationship} onValueChange={v => updateMember(member.id, "relationship", v)}>
                    <SelectTrigger className={INPUT_CLS}>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_OPTIONS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className={LABEL_CLS}>Age<span className="text-rose-500 ml-0.5">*</span></Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      value={member.age}
                      onChange={e => updateMember(member.id, "age", e.target.value)}
                      placeholder="Age"
                      className={INPUT_CLS}
                    />
                    {ageCat && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                        {ageCat}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className={LABEL_CLS}>Gender<span className="text-rose-500 ml-0.5">*</span></Label>
                  <Select value={member.gender} onValueChange={v => updateMember(member.id, "gender", v)}>
                    <SelectTrigger className={INPUT_CLS}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add member button */}
      <button
        onClick={addMember}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all"
      >
        <UserPlus className="w-4 h-4" /> Add Family Member
      </button>

      {form.familyMembers.length === 0 && (
        <div className="text-center py-6 space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-400">No family members added yet. Click above to add.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Step 4: Additional Information ─── */
function Step4Additional({ form, update }: { form: RegistrationForm; update: (k: keyof RegistrationForm, v: any) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">Help us make your experience better with a few more details.</p>

      {/* Emergency Contact */}
      <CollapsibleFormSection title="Emergency Contact" icon={ShieldCheck} defaultOpen={true}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className={LABEL_CLS}>Contact Name</Label>
            <Input value={form.emergencyContactName} onChange={e => update("emergencyContactName", e.target.value)} placeholder="Emergency contact name" className={INPUT_CLS} />
          </div>
          <div>
            <Label className={LABEL_CLS}>Contact Phone</Label>
            <Input type="tel" value={form.emergencyContactPhone} onChange={e => update("emergencyContactPhone", e.target.value)} placeholder="+91 98765 43210" className={INPUT_CLS} />
          </div>
        </div>
      </CollapsibleFormSection>

      {/* ID Verification */}
      <CollapsibleFormSection title="ID Verification" icon={Shield} description="Required for entry verification at the venue" defaultOpen={true}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className={LABEL_CLS}>ID Proof Type</Label>
            <Select value={form.idProofType} onValueChange={v => update("idProofType", v)}>
              <SelectTrigger className={INPUT_CLS}>
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                {ID_PROOF_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={LABEL_CLS}>ID Number</Label>
            <Input value={form.idProofNumber} onChange={e => update("idProofNumber", e.target.value)} placeholder="ID number" className={INPUT_CLS} />
          </div>
        </div>
      </CollapsibleFormSection>

      {/* Dietary & Medical */}
      <CollapsibleFormSection title="Dietary & Medical" icon={Stethoscope} defaultOpen={true}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={LABEL_CLS}>Dietary Preference</Label>
              <Select value={form.dietaryPreference} onValueChange={v => update("dietaryPreference", v)}>
                <SelectTrigger className={INPUT_CLS}>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  {DIETARY_OPTIONS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={LABEL_CLS}>Allergies</Label>
              <Input value={form.allergies} onChange={e => update("allergies", e.target.value)} placeholder="e.g. nuts, dairy, gluten" className={INPUT_CLS} />
            </div>
          </div>
          <div>
            <Label className={LABEL_CLS}>Medical Conditions</Label>
            <Textarea
              value={form.medicalConditions}
              onChange={e => update("medicalConditions", e.target.value)}
              placeholder="Any medical conditions we should be aware of (e.g. diabetes, asthma, heart condition)"
              className="w-full px-4 py-3 rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50 min-h-[60px]"
              rows={2}
            />
          </div>
        </div>
      </CollapsibleFormSection>

      {/* Accessibility & Preferences */}
      <CollapsibleFormSection title="Accessibility & Preferences" icon={Accessibility} defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label className={LABEL_CLS}>Special Needs / Accessibility Requirements</Label>
            <Textarea
              value={form.specialNeeds}
              onChange={e => update("specialNeeds", e.target.value)}
              placeholder="e.g. wheelchair access, hearing assistance, seating preference"
              className="w-full px-4 py-3 rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50 min-h-[60px]"
              rows={2}
            />
          </div>
          <div>
            <Label className={LABEL_CLS}>T-Shirt Size</Label>
            <div className="flex gap-2 flex-wrap">
              {TSHIRT_SIZES.map(sz => (
                <button
                  key={sz}
                  onClick={() => update("tshirtSize", form.tshirtSize === sz ? "" : sz)}
                  className={cn(
                    "w-12 h-10 rounded-xl border-2 text-sm font-bold transition-all",
                    form.tshirtSize === sz
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                  )}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleFormSection>

      {/* Referral */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <p className="text-sm font-bold text-indigo-600 flex items-center gap-2">
          <Megaphone className="w-4 h-4" /> How did you hear about us?
        </p>
        <div className="flex gap-2 flex-wrap">
          {REFERRAL_SOURCES.map(src => (
            <button
              key={src}
              onClick={() => update("referralSource", form.referralSource === src ? "" : src)}
              className={cn(
                "px-3 py-2 rounded-xl border text-xs font-semibold transition-all",
                form.referralSource === src
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30"
              )}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Terms */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <button
            onClick={() => update("agreeTerms", !form.agreeTerms)}
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
              form.agreeTerms
                ? "border-indigo-500 bg-indigo-500"
                : "border-slate-300 group-hover:border-indigo-300"
            )}
          >
            {form.agreeTerms && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <span className="text-xs text-slate-600 leading-relaxed">
            I agree to the <span className="text-indigo-600 font-semibold">Terms & Conditions</span> and{" "}
            <span className="text-indigo-600 font-semibold">Privacy Policy</span> of the event organizer.
            <span className="text-rose-500 ml-0.5">*</span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <button
            onClick={() => update("agreePhotography", !form.agreePhotography)}
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
              form.agreePhotography
                ? "border-indigo-500 bg-indigo-500"
                : "border-slate-300 group-hover:border-indigo-300"
            )}
          >
            {form.agreePhotography && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <span className="text-xs text-slate-600 leading-relaxed">
            I consent to being photographed/recorded during the event for community use.
          </span>
        </label>
      </div>
    </div>
  );
}

/* ─── Step 5: Review & Confirm ─── */
function Step5Review({ form, event }: { form: RegistrationForm; event: typeof MOCK_EVENT | EventResponse }) {
  const regId = `REG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const name = `${form.firstName} ${form.lastName}`.trim() || "Attendee";
  const totalAttendees = form.registrationType === "family" ? form.familyMembers.length + 1 : 1;

  const eventTitle = "title" in event ? event.title : "";
  const eventStart = "startDate" in event ? event.startDate : "";
  const eventEnd = ("endDate" in event ? event.endDate : "") || eventStart;
  const eventLocation = "location" in event ? event.location : "";
  const eventTime = ("startTime" in event ? event.startTime : "") || "";

  const formatDate = (d: string) => {
    if (!d) return "";
    try {
      return new Date(d + "T00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-5">
      {/* Digital Pass Card */}
      <div className="rounded-2xl overflow-hidden border border-indigo-200 shadow-[0_4px_24px_rgba(99,102,241,0.15)]">
        {/* Pass header */}
        <div
          className="px-6 py-5 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c4b5fd 100%)" }}
        >
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/30"
                style={{ width: 80 + i * 20, height: 80 + i * 20, top: `${i * 15 - 20}%`, right: `${i * 8 - 15}%` }}
              />
            ))}
          </div>
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/70 mb-1">Event Registration Pass</p>
            <h3 className="font-black text-lg leading-tight">{eventTitle}</h3>
            <div className="flex items-center gap-3 mt-3 text-xs text-white/80 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />{formatDate(eventStart)}{eventEnd && eventEnd !== eventStart ? ` – ${formatDate(eventEnd)}` : ""}
              </span>
              {eventTime && (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{eventTime}</span>
              )}
            </div>
          </div>
        </div>

        {/* Pass body */}
        <div className="bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered By</p>
                <p className="font-black text-slate-900 text-lg">{name}</p>
                <p className="text-xs text-slate-500">{form.email || "—"} · {form.phone || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                  <p className="font-bold text-slate-700 text-sm capitalize">{form.registrationType}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Attendees</p>
                  <p className="font-bold text-slate-700 text-sm">{totalAttendees}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Age</p>
                  <p className="font-bold text-slate-700 text-sm">{form.age || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gender</p>
                  <p className="font-bold text-slate-700 text-sm">{form.gender || "—"}</p>
                </div>
              </div>
            </div>

            {/* QR code area */}
            <div className="flex-shrink-0 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                <QrCode className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-[9px] font-bold text-slate-400 mt-1.5 font-mono">{regId}</p>
            </div>
          </div>

          {/* Family members */}
          {form.registrationType === "family" && form.familyMembers.length > 0 && (
            <>
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 border-t border-dashed border-slate-200" />
                <Ticket className="w-4 h-4 text-slate-300 rotate-90" />
                <div className="flex-1 border-t border-dashed border-slate-200" />
              </div>

              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Family Members</p>
                <div className="space-y-1.5">
                  {form.familyMembers.map((member, idx) => (
                    <div key={member.id} className="flex items-center gap-3 text-xs text-slate-600 py-1">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-700 flex-1 min-w-0 truncate">{member.name || "—"}</span>
                      <span className="text-slate-400">{member.age ? `${member.age} yrs` : "—"}</span>
                      <Badge className="px-1.5 py-0 text-[9px] bg-violet-100 text-violet-700 border-none">
                        {member.relationship || "—"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Additional details */}
          {(form.dietaryPreference || form.emergencyContactName || form.idProofType) && (
            <>
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 border-t border-dashed border-slate-200" />
                <Star className="w-4 h-4 text-slate-300" />
                <div className="flex-1 border-t border-dashed border-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {form.dietaryPreference && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dietary</p>
                    <p className="font-semibold text-slate-600">{form.dietaryPreference}</p>
                  </div>
                )}
                {form.tshirtSize && (
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">T-Shirt</p>
                    <p className="font-semibold text-slate-600">{form.tshirtSize}</p>
                  </div>
                )}
                {form.emergencyContactName && (
                  <div className="col-span-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Emergency Contact</p>
                    <p className="font-semibold text-slate-600">{form.emergencyContactName} · {form.emergencyContactPhone}</p>
                  </div>
                )}
                {form.idProofType && (
                  <div className="col-span-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID Proof</p>
                    <p className="font-semibold text-slate-600">{form.idProofType}: {form.idProofNumber}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Divider + Venue */}
          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 border-t border-dashed border-slate-200" />
            <Ticket className="w-4 h-4 text-slate-300 rotate-90" />
            <div className="flex-1 border-t border-dashed border-slate-200" />
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-500">{eventLocation}</p>
          </div>
        </div>

        {/* Action strip */}
        <div className="flex divide-x divide-slate-100 border-t border-slate-100">
          {[
            { icon: Download, label: "Download" },
            { icon: Share2, label: "Share" },
          ].map(a => (
            <button
              key={a.label}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
            >
              <a.icon className="w-4 h-4" /> {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Dynamic Form Renderer ─── */
function DynamicFormRenderer({
  fields,
  values,
  onChange,
}: {
  fields: FormField[];
  values: Record<string, any>;
  onChange: (id: string, value: any) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-x-4 gap-y-4">
        {fields.map(field => {
          const widthCls = field.width === "half" ? "w-full sm:w-[calc(50%-8px)]" : "w-full";

          if (field.type === "section") {
            return (
              <div key={field.id} className="w-full pt-3 first:pt-0">
                <p className="text-sm font-bold text-indigo-600">{field.label}</p>
                {field.description && <p className="text-[10px] text-slate-400 mt-0.5">{field.description}</p>}
              </div>
            );
          }

          if (field.type === "family_repeater") return null;

          if (field.type === "checkbox") {
            return (
              <div key={field.id} className={cn(widthCls)}>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <button
                    onClick={() => onChange(field.id, !values[field.id])}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                      values[field.id]
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-slate-300 group-hover:border-indigo-300"
                    )}
                  >
                    {values[field.id] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <span className="text-xs text-slate-600 leading-relaxed">
                    {field.label}
                    {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                  </span>
                </label>
              </div>
            );
          }

          if (field.type === "radio") {
            return (
              <div key={field.id} className={cn(widthCls)}>
                <Label className={LABEL_CLS}>
                  {field.label}{field.required && <span className="text-rose-500 ml-0.5">*</span>}
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {field.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => onChange(field.id, values[field.id] === opt ? "" : opt)}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-xs font-semibold transition-all",
                        values[field.id] === opt
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {field.description && <p className="text-[10px] text-slate-400 mt-1">{field.description}</p>}
              </div>
            );
          }

          return (
            <div key={field.id} className={cn(widthCls)}>
              <Label className={LABEL_CLS}>
                {field.label}{field.required && <span className="text-rose-500 ml-0.5">*</span>}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  value={values[field.id] ?? ""}
                  onChange={e => onChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 rounded-xl border-slate-200 bg-white text-sm text-slate-800 focus-visible:border-indigo-400 focus-visible:ring-indigo-50 min-h-[60px]"
                  rows={2}
                />
              ) : field.type === "select" || field.type === "multiselect" ? (
                <Select value={values[field.id] ?? ""} onValueChange={v => onChange(field.id, v)}>
                  <SelectTrigger className={INPUT_CLS}>
                    <SelectValue placeholder={field.placeholder || "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type === "number" ? "number" : field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "date" ? "date" : "text"}
                  value={values[field.id] ?? ""}
                  onChange={e => onChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  min={field.validation?.min}
                  max={field.validation?.max}
                  className={INPUT_CLS}
                />
              )}
              {field.description && <p className="text-[10px] text-slate-400 mt-1">{field.description}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function EventPublicRegistration() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState("");
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [programs, setPrograms] = useState<EventProgramResponse[]>([]);
  const [registrationResult, setRegistrationResult] = useState<ActivityRegistrationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [formConfig, setFormConfig] = useState<RegistrationFormConfig | null>(null);
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
  const [idempotencyKey] = useState(() => globalThis.crypto?.randomUUID?.() ?? generateId());

  const handleDynamicChange = (id: string, value: any) => {
    setDynamicValues(prev => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      const params = new URLSearchParams({ redirect: "/events" });
      if (eventId) params.set("event", eventId);
      navigate(`/login?${params.toString()}`, { replace: true });
    }
  }, [isAuthenticated, eventId, navigate]);

  useEffect(() => {
    if (eventId) {
      const id = parseInt(eventId);
      if (!isNaN(id)) {
        eventService
          .getById(id)
          .then(ev => {
            setEvent(ev);
            // TODO: fetch form config from API when available
            // eventService.getRegistrationFormConfig(id).then(setFormConfig);
            return eventProgramService.getByEvent(id).then(setPrograms).catch(() => setPrograms([]));
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [eventId]);

  const displayEvent = event ?? MOCK_EVENT;
  const hasDynamicForm = formConfig && formConfig.fields.length > 0;

  const [form, setForm] = useState<RegistrationForm>({
    registrationType: "",
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    flatNo: "",
    colonyAddress: "",
    poojaSlot: "Evening Visarjan / Utsav (05:00 PM - 09:00 PM)",
    city: "",
    pincode: "",
    familyMembers: [],
    emergencyContactName: "",
    emergencyContactPhone: "",
    idProofType: "",
    idProofNumber: "",
    dietaryPreference: "",
    medicalConditions: "",
    allergies: "",
    specialNeeds: "",
    tshirtSize: "",
    referralSource: "",
    agreeTerms: false,
    agreePhotography: false,
  });

  // ── Auto-fill logged in user details dynamically from database ──
  useEffect(() => {
    if (authUser) {
      const parts = (authUser.fullName || "").trim().split(" ");
      setForm(prev => ({
        ...prev,
        firstName: parts[0] || prev.firstName,
        lastName: parts.slice(1).join(" ") || prev.lastName,
        email: authUser.email || prev.email,
      }));
    }

    userService
      .getMe()
      .then(u => {
        if (u) {
          const parts = (u.fullName || "").trim().split(" ");
          const flat = u.flatNo ? (u.block ? `${u.block}-${u.flatNo}` : u.flatNo) : "";
          setForm(prev => ({
            ...prev,
            firstName: parts[0] || prev.firstName,
            lastName: parts.slice(1).join(" ") || prev.lastName,
            email: u.email || prev.email,
            phone: u.phone || prev.phone,
            gender: u.gender || prev.gender,
            flatNo: flat || prev.flatNo,
            colonyAddress: flat ? `${flat}, Mana Community, Miyapur, Hyderabad` : prev.colonyAddress,
            address: flat || prev.address,
          }));
        }
      })
      .catch(() => {});
  }, [authUser]);

  const update = (key: keyof RegistrationForm, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const activeSteps = form.registrationType === "family"
    ? STEPS
    : STEPS.filter(s => s.id !== 3);

  const activeStepIndex = activeSteps.findIndex(s => s.id === step);
  const isLastStep = activeStepIndex === activeSteps.length - 1;
  const isFirstStep = activeStepIndex === 0;

  const canNext = (): boolean => {
    if (step === 1) return !!form.registrationType;
    if (step === 2) return !!(form.firstName && form.age && form.phone && form.email && form.gender);
    if (step === 3) {
      if (form.registrationType !== "family") return true;
      return form.familyMembers.length > 0 && form.familyMembers.every(m => m.name && m.age && m.relationship && m.gender);
    }
    if (step === 4) return form.agreeTerms;
    return true;
  };

  const goNext = () => {
    const nextIdx = activeStepIndex + 1;
    if (nextIdx < activeSteps.length) {
      setStep(activeSteps[nextIdx].id);
    }
  };

  const goBack = () => {
    const prevIdx = activeStepIndex - 1;
    if (prevIdx >= 0) {
      setStep(activeSteps[prevIdx].id);
    }
  };

  const handleConfirm = async () => {
    if (event) {
      setRegistering(true);
      setRegError("");
      try {
        const registrationProgram = programs.find(p => p.requiresRegistration) ?? programs[0];
        if (registrationProgram) {
          const primaryName = `${form.firstName} ${form.lastName}`.trim();
          const participants = [
            {
              fullName: primaryName,
              age: Number(form.age),
              gender: form.gender,
              relationship: "Self",
              email: form.email,
              phone: form.phone,
            },
            ...form.familyMembers.map(member => ({
              fullName: member.name,
              age: Number(member.age),
              gender: member.gender,
              relationship: member.relationship,
            })),
          ];
          const result = await eventProgramService.registerActivity(registrationProgram.id, {
            registrationType: form.registrationType || "individual",
            primaryName,
            primaryEmail: form.email,
            primaryPhone: form.phone,
            headCount: participants.length,
            idempotencyKey,
            participants,
            customData: {
              address: form.address,
              city: form.city,
              pincode: form.pincode,
              emergencyContactName: form.emergencyContactName,
              emergencyContactPhone: form.emergencyContactPhone,
              idProofType: form.idProofType,
              idProofNumber: form.idProofNumber,
              dietaryPreference: form.dietaryPreference,
              medicalConditions: form.medicalConditions,
              allergies: form.allergies,
              specialNeeds: form.specialNeeds,
              tshirtSize: form.tshirtSize,
              referralSource: form.referralSource,
              agreeTerms: form.agreeTerms,
              agreePhotography: form.agreePhotography,
              dynamicValues,
            },
          });
          setRegistrationResult(result);
        } else {
          await eventService.register(event.id);
        }
        setIsRegistered(true);
      } catch (e: any) {
        setRegError(e.message ?? "Registration failed");
      } finally {
        setRegistering(false);
      }
    } else {
      setIsRegistered(true);
    }
  };

  const eventTitle = "title" in displayEvent ? displayEvent.title : "";
  const eventStart = "startDate" in displayEvent ? displayEvent.startDate : "";
  const eventEnd = ("endDate" in displayEvent ? displayEvent.endDate : "") || "";
  const eventLocation = "location" in displayEvent ? displayEvent.location : "";
  const eventTime = ("startTime" in displayEvent ? displayEvent.startTime : "") || "";
  const organizerName = ("organizerName" in displayEvent ? displayEvent.organizerName : "") || "";

  const formatDateRange = () => {
    if (!eventStart) return "";
    try {
      const start = new Date(eventStart + "T00:00").toLocaleDateString("en-IN", { month: "long", day: "numeric" });
      if (eventEnd && eventEnd !== eventStart) {
        const end = new Date(eventEnd + "T00:00").toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" });
        return `${start} – ${end}`;
      }
      return start + ", " + new Date(eventStart + "T00:00").getFullYear();
    } catch {
      return eventStart;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">

        {/* Organizer branding */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">{organizerName}</p>
        </div>

        {/* Event hero */}
        <div className="rounded-2xl overflow-hidden mb-5 sm:mb-7 shadow-[0_4px_20px_rgba(99,102,241,0.2)]">
          <div
            className="px-5 py-5 sm:px-8 sm:py-8 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c4b5fd 100%)" }}
          >
            <div className="absolute inset-0">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/10 animate-pulse"
                  style={{ width: 60 + i * 40, height: 60 + i * 40, top: `${i * 20}%`, right: `${i * 10}%` }}
                />
              ))}
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider text-white/90">
                  Registration Open
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black leading-tight mb-3">{eventTitle}</h1>
              <div className="flex flex-col sm:flex-row flex-wrap gap-x-5 gap-y-1.5 text-xs text-white/80">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />{formatDateRange()}
                </span>
                {eventTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />{eventTime}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{eventLocation}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-5 sm:mb-6 px-0 sm:px-1">
          {activeSteps.map((s, i) => {
            const done = isRegistered || activeSteps.findIndex(as => as.id === step) > i;
            const active = step === s.id && !isRegistered;
            return (
              <div key={s.id} className="flex items-center gap-1 sm:gap-2 flex-1">
                <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                  <div
                    className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black border-2 transition-all",
                      done
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : active
                          ? "bg-indigo-500 border-indigo-500 text-white"
                          : "bg-white border-slate-200 text-slate-400"
                    )}
                  >
                    {done ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-[8px] sm:text-[9px] font-bold whitespace-nowrap",
                      active ? "text-indigo-600" : done ? "text-emerald-600" : "text-slate-400"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < activeSteps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all",
                      done ? "bg-emerald-400" : "bg-slate-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-50">
            <h2 className="font-black text-slate-900">
              {isRegistered
                ? "Registration Confirmed!"
                : activeSteps[activeStepIndex]?.label}
            </h2>
            {!isRegistered && (
              <p className="text-xs text-slate-400 mt-0.5">
                Step {activeStepIndex + 1} of {activeSteps.length}
              </p>
            )}
          </div>

          <div className="px-5 sm:px-7 py-5 sm:py-6">
            <div key={isRegistered ? "done" : step} className="animate-fade-in-up">
              {isRegistered ? (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">
                        {registrationResult?.status === "PENDING"
                          ? "Registration Pending Approval"
                          : registrationResult?.status === "WAITLISTED"
                            ? "Added to Waitlist"
                            : "Registration Successful!"}
                      </p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Your registration has been received
                        {registrationResult?.programTitle ? ` for ${registrationResult.programTitle}` : ""}.
                        {registrationResult?.waitlistPosition ? ` Waitlist position: ${registrationResult.waitlistPosition}.` : ""}
                        {" "}A confirmation will be sent to {form.email || "your email"}.
                      </p>
                    </div>
                  </div>
                  <Step5Review form={form} event={displayEvent} />
                </div>
              ) : step === 1 ? (
                <Step1Type form={form} update={update} />
              ) : step === 2 ? (
                <Step2Details form={form} update={update} />
              ) : step === 3 ? (
                <Step3Family form={form} setForm={setForm} />
              ) : step === 4 ? (
                hasDynamicForm ? (
                  <DynamicFormRenderer fields={formConfig!.fields} values={dynamicValues} onChange={handleDynamicChange} />
                ) : (
                  <Step4Additional form={form} update={update} />
                )
              ) : step === 5 ? (
                <Step5Review form={form} event={displayEvent} />
              ) : null}
            </div>
          </div>

          {/* Navigation footer */}
          {!isRegistered && (
            <div className="px-5 sm:px-7 py-4 sm:py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
              <Button
                onClick={goBack}
                disabled={isFirstStep}
                variant="outline"
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 h-auto rounded-xl text-xs sm:text-sm font-semibold transition-all",
                  isFirstStep
                    ? "text-slate-300 cursor-not-allowed"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Back
              </Button>

              {!isLastStep ? (
                <Button
                  onClick={goNext}
                  disabled={!canNext()}
                  className={cn(
                    "flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 h-auto rounded-xl text-xs sm:text-sm font-bold transition-all",
                    canNext()
                      ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm hover:from-indigo-600 hover:to-violet-600"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  Next <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  {regError && (
                    <span className="flex items-center gap-1 text-[10px] sm:text-xs text-rose-600 font-medium">
                      <AlertCircle className="w-3 h-3" />{regError}
                    </span>
                  )}
                  <Button
                    onClick={handleConfirm}
                    disabled={registering}
                    className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 h-auto rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-60"
                  >
                    {registering ? (
                      <><Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> Registering...</>
                    ) : (
                      <>Confirm Registration <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-[10px] text-slate-400">
            Powered by <span className="font-bold text-indigo-500">Mana Community</span>
          </p>
          <p className="text-[10px] text-slate-400">
            Having issues? Contact {organizerName || "the organizer"}
          </p>
        </div>
      </div>
    </div>
  );
}
