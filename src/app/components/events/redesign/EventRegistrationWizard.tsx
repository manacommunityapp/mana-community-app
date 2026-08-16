import React, { useState, useEffect } from "react";
import {
  User, Users, ShieldCheck, Heart, Sparkles, CheckCircle2,
  ArrowRight, ArrowLeft, Upload, QrCode, CreditCard, Download,
  Check, Lock, DollarSign, Calendar, X
} from "lucide-react";
import { GlassCard, TouchButton, BottomSheet } from "./EventDesignSystem";
import { useAuth } from "../../../../contexts/AuthContext";
import { userService } from "../../../../services/common/userService";
import { eventService } from "../../../../services/events/eventService";
import { useEscapeKey } from "../../../../hooks/useEscapeKey";

export interface TicketCategoryItem {
  id?: string;
  name: string;
  price?: string | number;
  qty?: string | number;
  description?: string;
}

interface EventRegistrationWizardProps {
  isDark?: boolean;
  onClose: () => void;
  event?: any;
  ticketCategories?: TicketCategoryItem[];
}

const parseNumericPrice = (priceVal: string | number | undefined | null): number => {
  if (priceVal === undefined || priceVal === null || priceVal === "" || String(priceVal).toLowerCase() === "free") return 0;
  const num = typeof priceVal === "number" ? priceVal : parseFloat(String(priceVal).replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
};

const formatPrice = (priceVal: string | number | undefined | null): string => {
  const num = parseNumericPrice(priceVal);
  if (num === 0) return "Free";
  return `₹${num.toLocaleString()}`;
};

const getCategoryIcon = (name: string) => {
  const lower = (name || "").toLowerCase();
  if (lower.includes("family") || lower.includes("group")) return Users;
  if (lower.includes("volunteer") || lower.includes("staff") || lower.includes("crew") || lower.includes("duty")) return ShieldCheck;
  if (lower.includes("vip") || lower.includes("sponsor") || lower.includes("premium") || lower.includes("gold") || lower.includes("platinum")) return Sparkles;
  if (lower.includes("student") || lower.includes("child") || lower.includes("kid")) return Heart;
  if (lower.includes("individual") || lower.includes("single") || lower.includes("person") || lower.includes("general")) return User;
  return DollarSign;
};

export const EventRegistrationWizard: React.FC<EventRegistrationWizardProps> = ({
  isDark = false,
  onClose,
  event,
  ticketCategories,
}) => {
  useEscapeKey(onClose);
  const { user: authUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<TicketCategoryItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");

  const [formData, setFormData] = useState({
    category: "Family Pass",
    categoryPrice: "₹250",
    numericPrice: 250,
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

  // ── Load Ticket Categories dynamically from Database based on Event Details ONLY ──
  useEffect(() => {
    let isSubscribed = true;

    async function loadEventTicketCategories() {
      let cats: TicketCategoryItem[] = [];

      // 1. Explicit ticketCategories prop passed in
      if (ticketCategories && ticketCategories.length > 0) {
        cats = ticketCategories;
      }

      // 2. Fetch fresh event details from database API if event or event.id exists
      let targetEvent: any = event;
      if (event && event.id) {
        try {
          const dbEvent = await eventService.getById(Number(event.id));
          if (dbEvent) {
            targetEvent = dbEvent;
          }
        } catch (err) {
          console.warn("Failed to fetch event by id from database, using provided event details", err);
        }
      }

      // If no event object was provided, fetch the primary active event from the database
      if (!targetEvent) {
        try {
          const allEvents = await eventService.getAllEvents();
          if (allEvents && allEvents.length > 0) {
            targetEvent = allEvents[0];
          }
        } catch (err) {
          console.warn("Failed to load events from database", err);
        }
      }

      // 3. Extract ticket categories directly from the database event object details ONLY
      if (targetEvent) {
        if (targetEvent.ticketTypes && Array.isArray(targetEvent.ticketTypes) && targetEvent.ticketTypes.length > 0) {
          cats = targetEvent.ticketTypes;
        } else if (targetEvent.ticketCategories && Array.isArray(targetEvent.ticketCategories) && targetEvent.ticketCategories.length > 0) {
          cats = targetEvent.ticketCategories;
        } else {
          // Generate pass category BASED STRICTLY ON THIS EVENT'S DATABASE DETAILS ONLY
          const evTitle = targetEvent.title || "Event Pass";
          const evPrice = targetEvent.price != null && Number(targetEvent.price) > 0 ? String(targetEvent.price) : "0";
          const evQty = targetEvent.capacity || targetEvent.maxAttendees ? String(targetEvent.capacity || targetEvent.maxAttendees) : "1000";
          const evDesc = targetEvent.description || `All-access pass for ${evTitle}`;
          cats = [
            {
              id: `pass-${targetEvent.id || Date.now()}`,
              name: `${evTitle} - Standard Pass`,
              price: evPrice,
              qty: evQty,
              description: evDesc,
            },
          ];
        }
      }

      if (isSubscribed) {
        setCategories(cats);

        if (cats.length > 0) {
          const first = cats[0];
          const idStr = first.id || first.name;
          setSelectedCatId(idStr);
          const priceText = formatPrice(first.price);
          setFormData((prev) => ({
            ...prev,
            category: first.name,
            categoryPrice: priceText,
            numericPrice: parseNumericPrice(first.price),
          }));
        }
      }
    }

    loadEventTicketCategories();

    return () => {
      isSubscribed = false;
    };
  }, [event, ticketCategories]);

  // ── Dynamically auto-fill logged in user details from database ──
  useEffect(() => {
    if (authUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: authUser.fullName || prev.fullName,
        email: authUser.email || prev.email,
      }));
    }

    userService
      .getMe()
      .then((userProfile) => {
        if (userProfile) {
          const names = (userProfile.fullName || "").trim();
          const flat = userProfile.flatNo
            ? userProfile.block
              ? `${userProfile.block}-${userProfile.flatNo}`
              : userProfile.flatNo
            : "";

          setFormData((prev) => ({
            ...prev,
            fullName: names || prev.fullName,
            email: userProfile.email || prev.email,
            phone: userProfile.phone || prev.phone,
            flatNo: flat || prev.flatNo,
            colonyAddress: flat ? `${flat}, Mana Community, Miyapur, Hyderabad` : prev.colonyAddress,
            members: prev.members.map((m, idx) =>
              idx === 0 ? { ...m, name: names || m.name } : m
            ),
          }));
        }
      })
      .catch((err) => {
        console.warn("Could not fetch logged-in user profile:", err);
      });
  }, [authUser]);

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
    <div className="space-y-3">
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="min-w-0 pr-2">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#FF6B00] flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Event Registration Portal
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
            {event?.title || "Ganesh Utsav 2026 Pass"}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
          title="Close Modal (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="flex items-center justify-between px-1 py-1">
        {steps.map((s, idx) => {
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;

          return (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-0.5 cursor-pointer" onClick={() => s.num < currentStep && setCurrentStep(s.num)}>
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isActive
                      ? "bg-[#FF6B00] text-white shadow-md scale-105"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span
                  className={`text-[9px] font-extrabold ${
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
        <GlassCard isDark={isDark} hoverScale={false} className="p-3.5 sm:p-4 border space-y-3">
          {/* STEP 1: Dynamic Pass Categories */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    Select Pass Category
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Select from configured event ticket tiers
                  </p>
                </div>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-[#FF6B00] border border-orange-200 dark:border-orange-800">
                  {categories.length} Tiers
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categories.map((cat, idx) => {
                  const Icon = getCategoryIcon(cat.name);
                  const catId = cat.id || cat.name || `cat-${idx}`;
                  const selected = selectedCatId === catId;
                  const priceText = formatPrice(cat.price);

                  return (
                    <div
                      key={catId}
                      onClick={() => {
                        setSelectedCatId(catId);
                        setFormData((prev) => ({
                          ...prev,
                          category: cat.name,
                          categoryPrice: priceText,
                          numericPrice: parseNumericPrice(cat.price),
                        }));
                      }}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        selected
                          ? "border-[#FF6B00] bg-orange-50/50 dark:bg-slate-800/80 shadow-xs scale-[1.01]"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-1.5 rounded-lg ${selected ? "bg-[#FF6B00] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                          priceText === "Free"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                            : "bg-orange-100 dark:bg-orange-950/60 text-[#FF6B00]"
                        }`}>
                          {priceText}
                        </span>
                      </div>

                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-2">
                        {cat.name}
                      </h4>
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight line-clamp-1">
                        {cat.description || (cat.qty ? `${cat.qty} seats allocated` : "Standard pass tier")}
                      </p>

                      {cat.qty && (
                        <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[8.5px] font-semibold text-slate-400">
                          <span>Capacity: {cat.qty} seats</span>
                          {selected && <span className="text-[#FF6B00] font-extrabold">Selected ✓</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Primary Info */}
          {currentStep === 2 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">Primary Registrant Details</h3>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200">
                    {formData.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                    {formData.categoryPrice}
                  </span>
                </div>
              </div>

              {/* Full Name * */}
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sandeep Patel"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* Mobile Number (WhatsApp) * & Email Address * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                    Mobile Number (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="sandeep@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Emergency Contact Number & Flat / Villa No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                    Emergency Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98200 54321"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                    Flat / Villa No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Villa 402 / Flat B-12"
                    value={formData.flatNo}
                    onChange={(e) => setFormData({ ...formData, flatNo: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Residential Colony / Street Address */}
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                  Residential Colony / Street Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. LE Community, M.G. Road, Miyapur, Hyderabad"
                  value={formData.colonyAddress}
                  onChange={(e) => setFormData({ ...formData, colonyAddress: e.target.value })}
                  className="w-full h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* Preferred Time Slot */}
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
                  Preferred Time Slot
                </label>
                <select
                  value={formData.poojaSlot}
                  onChange={(e) => setFormData({ ...formData, poojaSlot: e.target.value })}
                  className="w-full h-8.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold border border-transparent focus:border-[#FF6B00] outline-none text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Morning Aarti (07:00 AM - 11:00 AM)">Morning Slot (07:00 AM - 11:00 AM)</option>
                  <option value="Afternoon Pooja & Prasad (12:00 PM - 03:00 PM)">Afternoon Slot (12:00 PM - 03:00 PM)</option>
                  <option value="Evening Visarjan / Utsav (05:00 PM - 09:00 PM)">Evening Slot (05:00 PM - 09:00 PM)</option>
                  <option value="Late Night Bhajan Sandhya (09:00 PM - 11:30 PM)">Night Slot (09:00 PM - 11:30 PM)</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: Multi-person Family Members */}
          {currentStep === 3 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">Family / Group Members List</h3>
                <button
                  onClick={handleAddMember}
                  className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
                >
                  + Add Member
                </button>
              </div>

              {formData.members.map((mem, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Member #{idx + 1}</span>
                    {idx > 0 && (
                      <button
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            membersCount: Math.max(1, prev.membersCount - 1),
                            members: prev.members.filter((_, i) => i !== idx),
                          }));
                        }}
                        className="text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
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
                      className="col-span-2 h-8.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 text-xs font-semibold border outline-none text-slate-900 dark:text-white"
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
                      className="h-8.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 text-xs font-semibold border outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4: Verification & Photo Upload */}
          {currentStep === 4 && (
            <div className="space-y-3">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">Photo & Verification</h3>

              <div className="p-3 rounded-xl border-2 border-dashed border-[#FF6B00] bg-orange-50/30 dark:bg-slate-800/40 text-center space-y-1 cursor-pointer">
                <Upload className="w-6 h-6 text-[#FF6B00] mx-auto" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Upload Member Photo ID</p>
                <p className="text-[9.5px] text-slate-400">PNG, JPG up to 5MB (Used for Gate QR Badge)</p>
              </div>

              {/* Digital Signature Pad Preview */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Digital Signature Touch Pad</span>
                <div className="h-14 border-b border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 italic text-xs">
                  [ Touch signature captured electronically ]
                </div>
              </div>
            </div>
          )}

          {/* Controls Navigation */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
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
                {formData.numericPrice === 0 ? "Generate Free Pass" : `Pay & Generate Pass (${formData.categoryPrice})`}
              </TouchButton>
            )}
          </div>
        </GlassCard>
      ) : (
        /* SUCCESS PASS DISPLAY */
        <GlassCard isDark={isDark} hoverScale={false} className="p-4 sm:p-5 border text-center space-y-3 animate-scaleUp">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-7 h-7 animate-bounce" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase">
              Registration Successful 🎉
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1.5">
              Pass #{Math.floor(1000 + Math.random() * 9000)} Issued
            </h3>
            <p className="text-xs font-semibold text-[#FF6B00] mt-0.5">
              Category: {formData.category} ({formData.categoryPrice})
            </p>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
              Pass confirmation sent to {formData.email}. Your QR badge is ready below.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 text-white inline-block shadow-lg">
            <QrCode className="w-24 h-24 text-white mx-auto" />
            <p className="text-[9px] font-mono text-orange-400 mt-1">SCAN AT GATE FOR ACCESS</p>
          </div>

          <div className="flex gap-2 pt-1">
            <TouchButton variant="primary" size="sm" icon={Download} fullWidth onClick={() => alert("Pass downloaded!")}>
              Download Pass PDF
            </TouchButton>
            <TouchButton variant="outline" size="sm" fullWidth onClick={onClose}>
              Done
            </TouchButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
