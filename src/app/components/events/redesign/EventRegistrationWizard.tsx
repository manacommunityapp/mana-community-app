import React, { useState } from "react";
import {
  User, Users, ShieldCheck, Heart, Sparkles, CheckCircle2,
  ArrowRight, ArrowLeft, Upload, QrCode, CreditCard, Download,
  Check, Lock, DollarSign, Calendar
} from "lucide-react";
import { GlassCard, TouchButton, BottomSheet } from "./EventDesignSystem";

interface EventRegistrationWizardProps {
  isDark?: boolean;
  onClose: () => void;
}

export const EventRegistrationWizard: React.FC<EventRegistrationWizardProps> = ({
  isDark = false,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [regType, setRegType] = useState<"individual" | "family" | "volunteer" | "sponsor">("family");
  const [formData, setFormData] = useState({
    category: "Family Pass",
    fullName: "Sandeep Kumar",
    phone: "+91 98765 43210",
    email: "sandeep@example.com",
    emergencyContact: "+91 98200 54321",
    flatNo: "A-402, Green Towers",
    colonyAddress: "LE Community, M.G. Road, Miyapur, Hyderabad",
    poojaSlot: "Evening Visarjan / Utsav (05:00 PM - 09:00 PM)",
    membersCount: 3,
    members: [
      { name: "Sandeep Kumar", age: 34, diet: "Veg" },
      { name: "Priya Kumar", age: 31, diet: "Veg" },
      { name: "Aarav Kumar", age: 6, diet: "Veg" },
    ],
    photoUploaded: true,
    signatureSigned: true,
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const steps = [
    { num: 1, title: "Category" },
    { num: 2, title: "Primary Info" },
    { num: 3, title: "Members" },
    { num: 4, title: "Verification" },
    { num: 5, title: "Pass Issued" },
  ];

  const handleAddMember = () => {
    setFormData((prev) => ({
      ...prev,
      membersCount: prev.membersCount + 1,
      members: [...prev.members, { name: "", age: 18, diet: "Veg" }],
    }));
  };

  const handleComplete = () => {
    setIsSuccess(true);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-[#FF6B00] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Event Registration Portal
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Ganesh Utsav 2026 Pass</h2>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="flex items-center justify-between px-2">
        {steps.map((s, idx) => {
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;

          return (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => s.num < currentStep && setCurrentStep(s.num)}>
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isActive
                      ? "bg-[#FF6B00] text-white shadow-lg scale-110"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    isActive ? "text-[#FF6B00]" : "text-slate-400"
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-colors ${
                    currentStep > idx + 1 ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      {!isSuccess ? (
        <GlassCard isDark={isDark} hoverScale={false} className="p-5 border space-y-4">
          {/* STEP 1: Registration Type */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Select Pass Category
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "family", title: "Family Pass", desc: "Up to 6 family members", icon: Users, price: "₹250" },
                  { id: "individual", title: "Individual Pass", desc: "Single entry access", icon: User, price: "₹100" },
                  { id: "volunteer", title: "Volunteer Pass", desc: "Duty team registration", icon: ShieldCheck, price: "Free" },
                  { id: "sponsor", title: "Sponsor / VIP", desc: "Special guest lounge", icon: Sparkles, price: "₹1,000+" },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const selected = regType === cat.id;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setRegType(cat.id as any);
                        setFormData(prev => ({ ...prev, category: cat.title }));
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        selected
                          ? "border-[#FF6B00] bg-orange-50/50 dark:bg-slate-800/80 shadow-md"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-6 h-6 ${selected ? "text-[#FF6B00]" : "text-slate-400"}`} />
                        <span className="text-xs font-black text-[#FF6B00]">{cat.price}</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-2">
                        {cat.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {cat.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Primary Info */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Primary Registrant Details</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200">
                  Category: {formData.category || "Family Pass"}
                </span>
              </div>

              {/* Full Name * */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sandeep Patel"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* Mobile Number (WhatsApp) * & Email Address * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Mobile Number (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="sandeep@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Emergency Contact Number & Flat / Villa No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Emergency Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98200 54321"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Flat / Villa No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Villa 402 / Flat B-12"
                    value={formData.flatNo}
                    onChange={(e) => setFormData({ ...formData, flatNo: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Residential Colony / Street Address */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Residential Colony / Street Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. LE Community, M.G. Road, Miyapur, Hyderabad"
                  value={formData.colonyAddress}
                  onChange={(e) => setFormData({ ...formData, colonyAddress: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* Preferred Pooja Time Slot */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Preferred Pooja Time Slot
                </label>
                <select
                  value={formData.poojaSlot}
                  onChange={(e) => setFormData({ ...formData, poojaSlot: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Morning Aarti (07:00 AM - 11:00 AM)">Morning Aarti (07:00 AM - 11:00 AM)</option>
                  <option value="Afternoon Pooja & Prasad (12:00 PM - 03:00 PM)">Afternoon Pooja & Prasad (12:00 PM - 03:00 PM)</option>
                  <option value="Evening Visarjan / Utsav (05:00 PM - 09:00 PM)">Evening Visarjan / Utsav (05:00 PM - 09:00 PM)</option>
                  <option value="Late Night Bhajan Sandhya (09:00 PM - 11:30 PM)">Late Night Bhajan Sandhya (09:00 PM - 11:30 PM)</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: Multi-person Family Members */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Family Members List</h3>
                <button
                  onClick={handleAddMember}
                  className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
                >
                  + Add Member
                </button>
              </div>

              {formData.members.map((mem, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Member #{idx + 1}</span>
                    {idx > 0 && <span className="text-rose-500 cursor-pointer">Remove</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={mem.name}
                      onChange={(e) => {
                        const updated = [...formData.members];
                        updated[idx].name = e.target.value;
                        setFormData({ ...formData, members: updated });
                      }}
                      className="col-span-2 h-10 px-3 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold border outline-none text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      value={mem.age}
                      onChange={(e) => {
                        const updated = [...formData.members];
                        updated[idx].age = parseInt(e.target.value) || 0;
                        setFormData({ ...formData, members: updated });
                      }}
                      className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold border outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4: Verification & Photo Upload */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Photo & Verification</h3>

              <div className="p-4 rounded-2xl border-2 border-dashed border-[#FF6B00] bg-orange-50/30 dark:bg-slate-800/40 text-center space-y-2 cursor-pointer">
                <Upload className="w-8 h-8 text-[#FF6B00] mx-auto" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Upload Member Photo ID</p>
                <p className="text-[10px] text-slate-400">PNG, JPG up to 5MB (Used for Gate QR Badge)</p>
              </div>

              {/* Digital Signature Pad Preview */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Digital Signature Touch Pad</span>
                <div className="h-20 border-b border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 italic text-xs">
                  [ Touch signature captured electronically ]
                </div>
              </div>
            </div>
          )}

          {/* Controls Navigation */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {currentStep > 1 ? (
              <TouchButton variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setCurrentStep(currentStep - 1)}>
                Back
              </TouchButton>
            ) : <div />}

            {currentStep < 4 ? (
              <TouchButton variant="primary" size="sm" icon={ArrowRight} onClick={() => setCurrentStep(currentStep + 1)}>
                Next Step
              </TouchButton>
            ) : (
              <TouchButton variant="primary" size="sm" icon={CheckCircle2} onClick={handleComplete}>
                Pay & Generate Pass (₹250)
              </TouchButton>
            )}
          </div>
        </GlassCard>
      ) : (
        /* SUCCESS PASS DISPLAY */
        <GlassCard isDark={isDark} hoverScale={false} className="p-6 border text-center space-y-4 animate-scaleUp">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white uppercase">
              Registration Successful 🎉
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">Pass #GANESH-8849 Issued</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pass sent to your email and SMS. Your QR badge is ready below.
            </p>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900 text-white inline-block">
            <QrCode className="w-32 h-32 text-white mx-auto" />
            <p className="text-[10px] font-mono text-orange-400 mt-2">SCAN AT GATE FOR ACCESS</p>
          </div>

          <div className="flex gap-2">
            <TouchButton variant="primary" icon={Download} fullWidth onClick={() => alert("Pass downloaded!")}>
              Download Pass PDF
            </TouchButton>
            <TouchButton variant="outline" fullWidth onClick={onClose}>
              Done
            </TouchButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
