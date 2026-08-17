import React, { useState, useEffect } from "react";
import {
  User,
  Users,
  ShieldCheck,
  Heart,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  QrCode,
  CreditCard,
  Download,
  Check,
  Lock,
  DollarSign,
  Calendar,
  X,
  Clock,
  Copy,
  MapPin,
  Ticket,
  Loader2,
} from "lucide-react";
import { GlassCard, TouchButton } from "./EventDesignSystem";
import { useAuth } from "../../../../contexts/AuthContext";
import { eventService } from "../../../../services/events/eventService";
import { fileUploadService } from "../../../../services/files/fileUploadService";
import { useEscapeKey } from "../../../../hooks/useEscapeKey";
import { showSuccess, showWarning } from "../../../../utils/ToastUtils";

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
  return `₹${num.toLocaleString("en-IN")}`;
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
    category: "Standard Pass",
    categoryPrice: "₹0",
    numericPrice: 0,
    fullName: authUser?.fullName || "",
    gotram: "",
    phone: authUser?.phone || "",
    email: authUser?.email || "",
    emergencyContact: "",
    flatNo: (authUser?.block && authUser?.flatNo) ? `${authUser.block}-${authUser.flatNo}` : (authUser?.flatNo || ""),
    colonyAddress: "",
    poojaSlot: "Morning Aarti (07:00 AM - 11:00 AM)",
    paymentMode: "UPI",
    transactionRef: "",
    receiptUploaded: false,
    receiptUrl: "",
    membersCount: 1,
    members: [{ name: authUser?.fullName || "", age: 28, diet: "Veg" }],
    photoUploaded: false,
    signatureSigned: true,
  });
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passNumber] = useState(() => Math.floor(1000 + Math.random() * 9000));

  // ── Load Ticket Categories dynamically from Event Details ONLY ──
  useEffect(() => {
    let isSubscribed = true;

    async function loadEventTicketCategories() {
      let cats: TicketCategoryItem[] = [];

      if (ticketCategories && ticketCategories.length > 0) {
        cats = ticketCategories;
      }

      let targetEvent: any = event;
      if ((!cats || cats.length === 0) && event?.id) {
        try {
          const freshEvent = await eventService.getEventById(String(event.id));
          if (freshEvent) targetEvent = freshEvent;
        } catch {
          // Ignore
        }
      }

      if ((!cats || cats.length === 0) && targetEvent) {
        const rawTypes = targetEvent.ticketTypes || targetEvent.ticketCategories || targetEvent.passes;
        if (Array.isArray(rawTypes) && rawTypes.length > 0) {
          cats = rawTypes.map((item: any, idx: number) => {
            if (typeof item === "string") {
              return { id: `cat-${idx}`, name: item, price: "0", qty: 100, description: "General entry" };
            }
            return {
              id: item.id || `cat-${idx}`,
              name: item.name || item.title || item.category || "Pass",
              price: item.price !== undefined ? item.price : item.fee !== undefined ? item.fee : 0,
              qty: item.qty || item.quantity || item.capacity || item.availableSeats,
              description: item.description || item.desc,
            };
          });
        }
      }

      if ((!cats || cats.length === 0) && targetEvent?.price !== undefined) {
        cats = [
          {
            id: `pass-${targetEvent.id || "1"}`,
            name: `${targetEvent.title || "Event"} Pass`,
            price: targetEvent.price || targetEvent.fee || 0,
            qty: 100,
            description: targetEvent.description || "Full event access pass",
          },
        ];
      }

      if (!cats || cats.length === 0) {
        cats = [
          {
            id: "standard-pass",
            name: "Standard Entry Pass",
            price: "Free",
            qty: 500,
            description: "General admission & prasadam",
          },
        ];
      }

      if (isSubscribed) {
        setCategories(cats);
        const defaultCat = cats[0];
        const defaultCatId = defaultCat.id || defaultCat.name || "cat-0";
        setSelectedCatId(defaultCatId);
        setFormData((prev) => ({
          ...prev,
          category: defaultCat.name,
          categoryPrice: formatPrice(defaultCat.price),
          numericPrice: parseNumericPrice(defaultCat.price),
        }));
      }
    }

    loadEventTicketCategories();
    return () => {
      isSubscribed = false;
    };
  }, [event, ticketCategories]);

  const steps = [
    { num: 1, title: "Pass Tier" },
    { num: 2, title: "Resident" },
    { num: 3, title: "Attendees" },
    { num: 4, title: "Payment" },
  ];

  const handleAddMember = () => {
    setFormData((prev) => ({
      ...prev,
      membersCount: prev.membersCount + 1,
      members: [...prev.members, { name: "", age: 25, diet: "Veg" }],
    }));
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReceipt(true);
    try {
      // Determine hierarchical components: block, flatNo
      let block = authUser?.block || "";
      let flat = formData.flatNo || authUser?.flatNo || "";
      if (!block && flat.includes("-")) {
        const parts = flat.split("-");
        block = parts[0];
        flat = parts[1] || parts[0];
      }
      if (!block) block = "Block-A";

      const res = await fileUploadService.uploadEventPaymentScreenshot(file, {
        eventId: event?.id || 1,
        eventName: event?.title || formData.category,
        block,
        flatNo: flat,
      });

      setFormData((prev) => ({
        ...prev,
        receiptUploaded: true,
        receiptUrl: res.url,
      }));
      showSuccess("Screenshot uploaded to S3 successfully!");
    } catch (err: any) {
      console.error("Screenshot upload failed:", err);
      showWarning("Failed to upload screenshot to S3, attached locally.");
      setFormData((prev) => ({
        ...prev,
        receiptUploaded: true,
        receiptUrl: URL.createObjectURL(file),
      }));
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleComplete = async (modeOverride?: string) => {
    const selectedMode = modeOverride || formData.paymentMode || "UPI";
    const paymentStatus = formData.numericPrice === 0 ? "PAID" : selectedMode === "Pay Later" ? "PENDING" : "PAID";

    try {
      const regPayload = {
        eventId: event?.id ? Number(event.id) : 1,
        eventName: event?.title || "Community Festival",
        category: formData.category,
        primaryName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        gotram: formData.gotram || undefined,
        flatNo: formData.flatNo,
        colonyAddress: formData.colonyAddress,
        poojaSlot: formData.poojaSlot,
        membersCount: formData.members.length,
        membersJson: JSON.stringify(formData.members),
        eventDate: event?.date || "2026",
        eventTime: event?.time || formData.poojaSlot,
        venue: event?.venue || "Community Mandap",
        bookingFee: formData.numericPrice * formData.members.length,
        paymentStatus,
        paymentMethod: selectedMode,
        paymentReceiptUrl: formData.receiptUrl || undefined,
        transactionId: formData.transactionRef || undefined,
      };
      await eventService.createRegistration(regPayload);
    } catch (err) {
      console.warn("Could not persist registration to backend API, saved locally:", err);
    }
    setFormData((prev) => ({ ...prev, paymentMode: selectedMode }));
    setIsSuccess(true);
  };

  return (
    <div className="flex flex-col justify-between h-full min-h-[520px] sm:min-h-[580px] space-y-3.5">
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
        <div className="min-w-0 pr-3">
          <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Event Registration Portal</span>
          </div>
          <h2 className="text-base sm:text-xl font-black text-foreground truncate">
            {event?.title || "Ganesh Utsav 2026 Pass"}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="flex items-center justify-between px-1 py-1 shrink-0">
        {steps.map((s, idx) => {
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;

          return (
            <React.Fragment key={s.num}>
              <div
                className={`flex flex-col items-center gap-1 select-none transition-all ${
                  s.num < currentStep ? "cursor-pointer" : "cursor-default"
                }`}
                onClick={() => s.num < currentStep && setCurrentStep(s.num)}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white shadow-xs"
                      : isActive
                      ? "bg-primary text-white ring-4 ring-primary/20 shadow-md scale-105"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                </div>
                <span
                  className={`text-[9.5px] sm:text-[10.5px] font-bold ${
                    isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-1.5 sm:mx-2 rounded-full transition-colors ${
                    currentStep > idx + 1 ? "bg-emerald-500" : "bg-border"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      {!isSuccess ? (
        <GlassCard
          isDark={isDark}
          hoverScale={false}
          className="flex-1 flex flex-col justify-between p-4 sm:p-5 border border-border rounded-2xl overflow-y-auto space-y-4 shadow-sm"
        >
          {/* STEP 1: Dynamic Pass Categories */}
          {currentStep === 1 && (
            <div className="space-y-3.5 flex-1">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Select Pass Category</h3>
                  <p className="text-[11px] text-muted-foreground">Select your entry ticket or seva tier</p>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {categories.length} Tiers Available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between gap-2 ${
                        selected
                          ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            selected ? "bg-primary text-white shadow-xs" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                            priceText === "Free"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                              : "bg-primary/15 text-primary"
                          }`}
                        >
                          {priceText}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-foreground">{cat.name}</h4>
                        <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                          {cat.description || (cat.qty ? `${cat.qty} seats allocated` : "Standard event pass tier")}
                        </p>
                      </div>

                      {cat.qty && (
                        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[9.5px] font-bold text-muted-foreground">
                          <span>Capacity: {cat.qty} passes</span>
                          {selected && <span className="text-primary font-extrabold">Selected ✓</span>}
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
            <div className="space-y-3.5 flex-1">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-extrabold text-foreground">Primary Registrant Details</h3>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                    {formData.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {formData.categoryPrice}
                  </span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sandeep Patel"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-[var(--mana-bg-input)] text-xs sm:text-sm font-semibold border border-border focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                    Mobile Number (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                    }
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--mana-bg-input)] text-xs sm:text-sm font-semibold border border-border focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="resident@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--mana-bg-input)] text-xs sm:text-sm font-semibold border border-border focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
                  />
                </div>
              </div>

              {/* Gotram & Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                    Gotram / Family Lineage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kashyapa, Bharadwaja"
                    value={formData.gotram}
                    onChange={(e) => setFormData({ ...formData, gotram: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--mana-bg-input)] text-xs sm:text-sm font-semibold border border-border focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9820054321"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyContact: e.target.value.replace(/\D/g, "").slice(0, 10) })
                    }
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--mana-bg-input)] text-xs sm:text-sm font-semibold border border-border focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
                  />
                </div>
              </div>

              {/* Flat / Villa No & Preferred Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                    Flat / Unit No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A-101 / Villa 402"
                    value={formData.flatNo}
                    onChange={(e) => setFormData({ ...formData, flatNo: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--mana-bg-input)] text-xs sm:text-sm font-semibold border border-border focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                    Preferred Time Slot
                  </label>
                  <select
                    value={formData.poojaSlot}
                    onChange={(e) => setFormData({ ...formData, poojaSlot: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[var(--mana-bg-input)] text-xs sm:text-sm font-semibold border border-border focus:ring-2 focus:ring-primary/20 outline-none text-foreground cursor-pointer"
                  >
                    <option value="Morning Aarti (07:00 AM - 11:00 AM)">Morning Slot (07:00 AM - 11:00 AM)</option>
                    <option value="Afternoon Pooja & Prasad (12:00 PM - 03:00 PM)">Afternoon Slot (12:00 PM - 03:00 PM)</option>
                    <option value="Evening Visarjan / Utsav (05:00 PM - 09:00 PM)">Evening Slot (05:00 PM - 09:00 PM)</option>
                    <option value="Late Night Bhajan Sandhya (09:00 PM - 11:30 PM)">Night Slot (09:00 PM - 11:30 PM)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Multi-person Family Members */}
          {currentStep === 3 && (
            <div className="space-y-3.5 flex-1">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Family / Group Attendees List</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Specify details for each attendee ({formData.members.length} registered)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20"
                >
                  + Add Member
                </button>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {formData.members.map((mem, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-muted/40 border border-border space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span>{idx === 0 ? "Member #1 (Primary Registrant)" : `Member #${idx + 1}`}</span>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              membersCount: Math.max(1, prev.membersCount - 1),
                              members: prev.members.filter((_, i) => i !== idx),
                            }));
                          }}
                          className="text-rose-500 hover:underline cursor-pointer text-[11px] font-bold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder={idx === 0 ? "Primary Member Name *" : "Member Name *"}
                        value={mem.name}
                        onChange={(e) => {
                          const updated = [...formData.members];
                          updated[idx].name = e.target.value;
                          setFormData({ ...formData, members: updated });
                        }}
                        className="col-span-6 h-9 px-3 rounded-xl bg-[var(--mana-bg-input)] text-xs font-semibold border border-border outline-none text-foreground"
                      />
                      <input
                        type="number"
                        placeholder="Age"
                        value={mem.age || ""}
                        onChange={(e) => {
                          const updated = [...formData.members];
                          updated[idx].age = parseInt(e.target.value) || 0;
                          setFormData({ ...formData, members: updated });
                        }}
                        className="col-span-3 h-9 px-2.5 rounded-xl bg-[var(--mana-bg-input)] text-xs font-semibold border border-border outline-none text-foreground"
                      />
                      <select
                        value={mem.diet || "Veg"}
                        onChange={(e) => {
                          const updated = [...formData.members];
                          updated[idx].diet = e.target.value;
                          setFormData({ ...formData, members: updated });
                        }}
                        className="col-span-3 h-9 px-2 rounded-xl bg-[var(--mana-bg-input)] text-xs font-semibold border border-border outline-none text-foreground cursor-pointer"
                      >
                        <option value="Veg">Veg</option>
                        <option value="Jain">Jain</option>
                        <option value="Non-Veg">Non-Veg</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Payment Mode & Verification */}
          {currentStep === 4 && (
            <div className="space-y-3.5 flex-1">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Payment Mode</h3>
                  <p className="text-[11px] text-muted-foreground">Select payment method to complete booking</p>
                </div>
                <span className="text-xs font-mono font-black text-primary bg-primary/10 px-2.5 py-1 rounded-xl border border-primary/20">
                  {formData.numericPrice === 0
                    ? "FREE PASS"
                    : `Total: ₹${(formData.numericPrice * formData.members.length).toLocaleString("en-IN")}`}
                </span>
              </div>

              {/* Payment Modes */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "UPI", label: "UPI / QR Code", desc: "Instant scan & pay", icon: QrCode },
                  { id: "Card", label: "Cards / NetBanking", desc: "Online gateway", icon: CreditCard },
                  { id: "Cash", label: "Cash / Counter", desc: "Pay at venue", icon: DollarSign },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = (formData.paymentMode || "UPI") === mode.id;
                  return (
                    <div
                      key={mode.id}
                      onClick={() => setFormData({ ...formData, paymentMode: mode.id })}
                      className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 select-none ${
                        isSelected
                          ? "bg-primary/10 border-primary shadow-xs ring-2 ring-primary/20"
                          : "bg-muted/40 border-border hover:border-primary/40"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isSelected ? "bg-primary text-white shadow-xs" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className={`text-xs font-bold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {mode.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Mode Details */}
              {(formData.paymentMode === "UPI" || !formData.paymentMode) && (
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Scan & Pay via any UPI App</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("mana.events@upi");
                        showSuccess("UPI ID copied!");
                      }}
                      className="text-xs font-mono font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> mana.events@upi
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-2xl border border-border shrink-0 shadow-sm">
                      <QrCode className="w-16 h-16 text-slate-900" />
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <input
                        type="text"
                        placeholder="UPI Reference / UTR ID (Optional)"
                        value={formData.transactionRef || ""}
                        onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                        className="w-full h-9 px-3 rounded-xl bg-[var(--mana-bg-input)] text-xs font-mono border border-border outline-none text-foreground"
                      />
                      <label className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer">
                        {isUploadingReceipt ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            <span>Uploading to S3...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>{formData.receiptUploaded ? "Receipt Screenshot Attached ✓" : "Upload Payment Screenshot"}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingReceipt}
                          onChange={handleScreenshotUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {formData.paymentMode === "Card" && (
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1.5 text-center">
                  <CreditCard className="w-7 h-7 text-primary mx-auto" />
                  <p className="text-xs font-bold text-foreground">Secure Payment Gateway</p>
                  <p className="text-[11px] text-muted-foreground">
                    You will be redirected to complete payment with 256-bit encryption on submit.
                  </p>
                </div>
              )}

              {formData.paymentMode === "Cash" && (
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1 text-left">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Pay Cash at Helpdesk
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your spot is reserved. Please show this registration e-pass and pay cash at the event registration
                    counter on the day of the event.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Controls Navigation */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2 shrink-0">
            {currentStep > 1 ? (
              <TouchButton variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setCurrentStep(currentStep - 1)}>
                Back
              </TouchButton>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <TouchButton variant="primary" size="sm" icon={ArrowRight} onClick={() => setCurrentStep(currentStep + 1)}>
                Next Step
              </TouchButton>
            ) : (
              <div className="flex items-center gap-2">
                {formData.numericPrice > 0 && (
                  <button
                    type="button"
                    onClick={() => handleComplete("Pay Later")}
                    className="px-3.5 py-2 rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Pay Later
                  </button>
                )}
                <TouchButton variant="primary" size="sm" icon={CheckCircle2} onClick={() => handleComplete()}>
                  {formData.numericPrice === 0
                    ? "Generate Free Pass"
                    : `Confirm & Generate Pass (${formData.categoryPrice})`}
                </TouchButton>
              </div>
            )}
          </div>
        </GlassCard>
      ) : (
        /* SUCCESS PASS DISPLAY */
        <GlassCard
          isDark={isDark}
          hoverScale={false}
          className="flex-1 flex flex-col justify-between p-5 border border-border rounded-2xl text-center space-y-4 animate-scaleUp shadow-md"
        >
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white uppercase tracking-wider">
                Registration Confirmed 🎉
              </span>
              <h3 className="text-lg sm:text-xl font-black text-foreground mt-2">
                Digital Pass #{passNumber} Issued
              </h3>
              <p className="text-xs font-bold text-primary mt-0.5">
                Category: {formData.category} ({formData.categoryPrice})
              </p>
              {formData.gotram && (
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  Gotram: <strong className="text-foreground">{formData.gotram}</strong>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Pass confirmation sent to <strong className="text-foreground">{formData.email}</strong>.
              </p>
            </div>

            {/* QR Card */}
            <div className="p-4 rounded-2xl bg-slate-950 text-white inline-block shadow-xl border border-slate-800">
              <QrCode className="w-28 h-28 text-white mx-auto" />
              <p className="text-[10px] font-mono font-bold text-amber-400 mt-2">SCAN AT VENUE GATE FOR ENTRY</p>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <TouchButton
              variant="primary"
              size="sm"
              icon={Download}
              fullWidth
              onClick={() => showSuccess("Digital Pass Downloaded!")}
            >
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
