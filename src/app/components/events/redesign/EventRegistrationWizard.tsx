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
  IndianRupee,
  Calendar,
  X,
  Clock,
  Copy,
  MapPin,
  Ticket,
  Loader2,
  RefreshCw,
  Edit3,
  AlertCircle,
} from "lucide-react";
import { GlassCard, TouchButton } from "./EventDesignSystem";
import { useAuth } from "../../../../contexts/AuthContext";
import { eventService } from "../../../../services/events/eventService";
import { userService } from "../../../../services/common/userService";
import { isRegistrationClosed } from "../../../../utils/eventDeadlineUtils";
import { fileUploadService } from "../../../../services/files/fileUploadService";
import { useEscapeKey } from "../../../../hooks/useEscapeKey";
import { showSuccess, showWarning } from "../../../../utils/ToastUtils";

export interface TicketCategoryItem {
  id?: string;
  name: string;
  price?: string | number;
  qty?: string | number;
  seats?: string | number;
  capacity?: string | number;
  availableSeats?: string | number;
  slots?: string | number;
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
  return IndianRupee;
};

const calculateAge = (dob?: string | null): number => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 && age <= 130 ? age : 0;
};

export const EventRegistrationWizard: React.FC<EventRegistrationWizardProps> = ({
  isDark = false,
  onClose,
  event,
  ticketCategories,
}) => {
  useEscapeKey(onClose);
  const { user: authUser } = useAuth();
  const isAnyAdmin = Boolean(
    authUser?.role?.toLowerCase().includes("admin") ||
    authUser?.role?.toLowerCase().includes("event_admin") ||
    authUser?.role?.toLowerCase().includes("super_admin") ||
    authUser?.role?.toLowerCase().includes("community_admin")
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<TicketCategoryItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [eventDetails, setEventDetails] = useState<any>(event || null);

  // Admin on-behalf registration states
  const [registerOnBehalf, setRegisterOnBehalf] = useState<boolean>(false);
  const [communityUsers, setCommunityUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<number | null>(null);
  const [adminPaymentStatus, setAdminPaymentStatus] = useState<string>("PAID");

  // Load community users for Admin on-behalf registration
  useEffect(() => {
    if (isAnyAdmin) {
      userService
        .getAllUsers()
        .then((users) => {
          if (Array.isArray(users)) setCommunityUsers(users);
        })
        .catch((err) => {
          console.warn("Could not load community users for admin registration:", err);
        });
    }
  }, [isAnyAdmin]);

  // Existing registration / Update mode detection
  const [existingReg, setExistingReg] = useState<any>(() => event?.existingRegistration || null);
  const isUpdateMode = Boolean(event?.isUpdateMode || existingReg);
  const existingRegId = event?.registrationId || existingReg?.id || (event as any)?.regId;
  const activeEvent = eventDetails || event;
  const deadlineStr = activeEvent?.registrationDeadline || activeEvent?.regDeadline || event?.registrationDeadline;
  const isDeadlinePassed = Boolean(
    deadlineStr &&
    (() => {
      const d = new Date(deadlineStr);
      d.setHours(23, 59, 59, 999);
      return new Date() > d;
    })() &&
    !isAnyAdmin
  );
  const isRegistrationEnded = (isRegistrationClosed(activeEvent) || isDeadlinePassed) && !isUpdateMode && !isAnyAdmin;

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
    members: [{
      name: authUser?.fullName || "",
      age: calculateAge(authUser?.dateOfBirth || (authUser as any)?.dob),
      gender: authUser?.gender || "Male",
      relationship: "Self (Head)"
    }],
    photoUploaded: false,
    signatureSigned: true,
  });
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passNumber] = useState(() => Math.floor(1000 + Math.random() * 9000));
  const [savedFamilyMembers, setSavedFamilyMembers] = useState<any[]>([]);
  const [saveNewMembersToProfile, setSaveNewMembersToProfile] = useState<boolean>(true);

  // ── Load Saved Family Members from Unified Family Service ──
  const loadSavedFamily = async () => {
    try {
      const dbMembers = await eventService.getFamilyMembers();
      if (Array.isArray(dbMembers) && dbMembers.length > 0) {
        const validMembers = dbMembers.filter((m: any) => m && m.name && m.name.trim().length > 0);
        setSavedFamilyMembers(validMembers);

        // If fresh registration and user hasn't modified members list yet, auto-populate from saved family members!
        if (!isUpdateMode) {
          setFormData((prev) => {
            if (prev.members.length <= 1) {
              const primaryName = prev.fullName || authUser?.fullName || "Primary Devotee";
              const userDob = authUser?.dateOfBirth || (authUser as any)?.dob;
              const calculatedAge = calculateAge(userDob);
              const primaryMember = {
                name: primaryName,
                age: calculatedAge || (prev.members[0]?.age && prev.members[0].age > 0 ? prev.members[0].age : 30),
                gender: authUser?.gender || prev.members[0]?.gender || "Male",
                relationship: "Self (Head)",
              };
              const additional = validMembers
                .filter((m) => m.name.trim().toLowerCase() !== primaryName.trim().toLowerCase() && !m.relation?.toLowerCase().includes("myself") && !m.relation?.toLowerCase().includes("head"))
                .map((m) => ({
                  name: m.name,
                  age: Number(m.age) || 25,
                  gender: m.gender || (m.relation?.toLowerCase().includes("wife") || m.relation?.toLowerCase().includes("mother") || m.relation?.toLowerCase().includes("daughter") || m.relation?.toLowerCase().includes("sister") ? "Female" : "Male"),
                  relationship: m.relation || "Family",
                }));
              const allMembers = [primaryMember, ...additional];
              return {
                ...prev,
                membersCount: allMembers.length,
                members: allMembers,
              };
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.warn("Could not load family members:", err);
    }
  };

  useEffect(() => {
    loadSavedFamily();
    window.addEventListener("mana_family_updated", loadSavedFamily);
    return () => window.removeEventListener("mana_family_updated", loadSavedFamily);
  }, [authUser?.userId, authUser?.email]);

  const applyExistingRegToForm = (reg: any) => {
    let parsedMembers = [];
    if (reg.membersJson) {
      try {
        parsedMembers = JSON.parse(reg.membersJson);
      } catch {}
    }
    if (!parsedMembers || parsedMembers.length === 0) {
      if (reg.attendingDevotees) {
        try {
          const parsed = JSON.parse(reg.attendingDevotees);
          if (Array.isArray(parsed) && parsed.length > 0) parsedMembers = parsed;
        } catch {
          const names = String(reg.attendingDevotees).split(",").map((s) => s.trim()).filter(Boolean);
          if (names.length > 0) {
            parsedMembers = names.map((name, idx) => ({
              name,
              age: idx === 0 ? 30 : 25,
              gender: "Male",
              relationship: idx === 0 ? "Self (Head)" : "Family",
            }));
          }
        }
      }
    }
    if (!parsedMembers || parsedMembers.length === 0) {
      parsedMembers = [{
        name: reg.participantName || reg.primaryName || authUser?.fullName || "",
        age: 28,
        gender: authUser?.gender || "Male",
        relationship: "Self (Head)",
      }];
    }
    setFormData((prev) => ({
      ...prev,
      fullName: reg.primaryName || reg.participantName || prev.fullName,
      gotram: reg.gotram || prev.gotram,
      phone: reg.phone || prev.phone,
      email: reg.email || prev.email,
      flatNo: reg.flatNo || prev.flatNo,
      membersCount: parsedMembers.length,
      members: parsedMembers,
      poojaSlot: reg.poojaSlot || reg.eventTime || prev.poojaSlot,
      paymentMode: reg.paymentMethod || prev.paymentMode,
      category: reg.category || prev.category,
      numericPrice: typeof reg.bookingFee === "number" ? reg.bookingFee : (parseFloat(String(reg.bookingFee || "0").replace(/[^0-9.]/g, "")) || 0),
    }));
  };

  // Sync existing registration if user is already registered for this cultural/competition/event
  useEffect(() => {
    let isCancelled = false;
    if (!existingReg && event?.id) {
      eventService
        .getMyRegistrations()
        .then((regs) => {
          if (isCancelled) return;
          if (Array.isArray(regs) && regs.length > 0) {
            const found = regs.find((r: any) => {
              if (r.status === "CANCELLED") return false;
              if (r.activityId && (r.activityId === event?.id || String(r.activityId) === String(event?.id))) return true;
              if (event?.id && String(event.id).includes("-")) {
                const rawId = String(event.id).split("-")[1];
                if (r.activityId && (r.activityId === rawId || r.activityId === event.id)) return true;
                if (r.eventId && String(r.eventId) === rawId) return true;
              }
              const cleanEventTitle = (event?.title || event?.name || "").trim().toLowerCase();
              const cleanRegTitle = (r.activityTitle || r.eventName || "").trim().toLowerCase();
              if (
                cleanEventTitle &&
                cleanRegTitle &&
                (cleanEventTitle === cleanRegTitle ||
                  cleanEventTitle.includes(cleanRegTitle) ||
                  cleanRegTitle.includes(cleanEventTitle))
              ) {
                return true;
              }
              return false;
            });
            if (found) {
              setExistingReg(found);
              applyExistingRegToForm(found);
            } else {
              const regWithGotram = regs.find((r: any) => r.gotram && String(r.gotram).trim() && r.status !== "CANCELLED");
              if (regWithGotram?.gotram) {
                setFormData((prev) => ({
                  ...prev,
                  gotram: prev.gotram || regWithGotram.gotram,
                }));
              }
            }
          }
        })
        .catch(() => {});
    } else if (existingReg) {
      applyExistingRegToForm(existingReg);
    }
    return () => {
      isCancelled = true;
    };
  }, [event?.id, event?.title, (event as any)?.registrationId]);

  // ── Auto-fill & synchronize logged in user details including Flat / Unit & Block & Age from DOB ──
  useEffect(() => {
    if (authUser) {
      const flat = (authUser.block && authUser.flatNo) ? `${authUser.block}-${authUser.flatNo}` : (authUser.flatNo || "");
      const userDob = authUser.dateOfBirth || (authUser as any)?.dob;
      const userAge = calculateAge(userDob);

      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || authUser.fullName || "",
        phone: prev.phone || authUser.phone || "",
        email: prev.email || authUser.email || "",
        flatNo: prev.flatNo || flat,
        gotram: prev.gotram || (authUser as any)?.gotram || "",
        members: prev.members.length > 0
          ? [
              {
                ...prev.members[0],
                name: prev.members[0].name || authUser.fullName || "",
                age: (!prev.members[0].age || prev.members[0].age === 0) && userAge > 0 ? userAge : (prev.members[0].age || userAge || 0),
                gender: prev.members[0].gender || authUser.gender || "Male",
              },
              ...prev.members.slice(1),
            ]
          : [{ name: authUser.fullName || "", age: userAge || 0, gender: authUser.gender || "Male", relationship: "Self (Head)" }],
      }));
    }

    userService
      .getMe()
      .then((u: any) => {
        if (u) {
          const flat = u.flatNo ? (u.block ? `${u.block}-${u.flatNo}` : u.flatNo) : "";
          const userDob = u.dateOfBirth || u.dob || authUser?.dateOfBirth || (authUser as any)?.dob;
          const userAge = calculateAge(userDob);

          setFormData((prev) => ({
            ...prev,
            fullName: prev.fullName || u.fullName || "",
            phone: prev.phone || u.phone || "",
            email: prev.email || u.email || "",
            flatNo: prev.flatNo || flat,
            gotram: prev.gotram || u.gotram || (authUser as any)?.gotram || "",
            members: prev.members.length > 0
              ? [
                  {
                    ...prev.members[0],
                    name: prev.members[0].name || u.fullName || "",
                    age: (!prev.members[0].age || prev.members[0].age === 0) && userAge > 0 ? userAge : (prev.members[0].age || userAge || 0),
                    gender: prev.members[0].gender || u.gender || authUser?.gender || "Male",
                  },
                  ...prev.members.slice(1),
                ]
              : [{ name: u.fullName || "", age: userAge || 0, gender: u.gender || "Male", relationship: "Self (Head)" }],
          }));
        }
      })
      .catch(() => {});
  }, [authUser?.userId, authUser?.email, authUser?.dateOfBirth]);

  // ── Load Ticket Categories dynamically from Event Details ONLY ──
  useEffect(() => {
    let isSubscribed = true;

    async function loadEventTicketCategories() {
      let cats: TicketCategoryItem[] = [];

      let targetEvent: any = event;
      if (event?.id) {
        const rawDigits = String(event.id).replace(/\D/g, "");
        if (rawDigits && !isNaN(Number(rawDigits)) && Number(rawDigits) > 0) {
          try {
            const freshEvent = await eventService.getEventById(Number(rawDigits));
            if (freshEvent && isSubscribed) {
              targetEvent = { ...event, ...freshEvent };
              setEventDetails((prev: any) => ({ ...prev, ...freshEvent }));
            }
          } catch {
            // Ignore
          }
        }
      }

      if (ticketCategories && ticketCategories.length > 0) {
        cats = ticketCategories.map((cat, idx) => {
          const categorySeats =
            cat.seats ??
            cat.qty ??
            (cat as any).quantity ??
            cat.capacity ??
            cat.availableSeats ??
            cat.slots ??
            (targetEvent?.availableSeats ?? targetEvent?.capacity ?? targetEvent?.seats ?? targetEvent?.slots);
          return {
            ...cat,
            id: cat.id || `cat-${idx}`,
            qty: categorySeats,
            seats: categorySeats,
          };
        });
      }

      if ((!cats || cats.length === 0) && targetEvent) {
        const rawTypes = targetEvent.ticketTypes || targetEvent.ticketCategories || targetEvent.passes;
        if (Array.isArray(rawTypes) && rawTypes.length > 0) {
          cats = rawTypes.map((item: any, idx: number) => {
            const dynamicSeats =
              item.seats ??
              item.qty ??
              item.quantity ??
              item.capacity ??
              item.availableSeats ??
              item.slots ??
              item.maxSeats ??
              item.totalSeats ??
              targetEvent.availableSeats ??
              targetEvent.capacity ??
              targetEvent.seats ??
              targetEvent.slots ??
              targetEvent.maxAttendees;

            if (typeof item === "string") {
              return {
                id: `cat-${idx}`,
                name: item,
                price: "0",
                qty: dynamicSeats || 100,
                seats: dynamicSeats || 100,
                description: "General entry",
              };
            }
            return {
              id: item.id || `cat-${idx}`,
              name: item.name || item.title || item.category || "Pass",
              price: item.price !== undefined ? item.price : item.fee !== undefined ? item.fee : 0,
              qty: dynamicSeats,
              seats: dynamicSeats,
              description: item.description || item.desc,
            };
          });
        }
      }

      if ((!cats || cats.length === 0) && (targetEvent?.price !== undefined || targetEvent?.title || targetEvent?.name)) {
        const dynamicSeats =
          targetEvent?.seats ??
          targetEvent?.availableSeats ??
          targetEvent?.capacity ??
          targetEvent?.slots ??
          targetEvent?.totalSeats ??
          targetEvent?.maxParticipants ??
          targetEvent?.targetPlates;

        cats = [
          {
            id: `pass-${targetEvent.id || "1"}`,
            name: `${targetEvent.title || targetEvent.name || "Event"} Pass`,
            price: targetEvent.price || targetEvent.fee || 0,
            qty: dynamicSeats || 100,
            seats: dynamicSeats || 100,
            description: targetEvent.description || "Full event access pass",
          },
        ];
      }

      if (!cats || cats.length === 0) {
        const fallbackSeats =
          targetEvent?.seats ??
          targetEvent?.availableSeats ??
          targetEvent?.capacity ??
          targetEvent?.slots ??
          500;

        cats = [
          {
            id: "standard-pass",
            name: "Standard Entry Pass",
            price: "Free",
            qty: fallbackSeats,
            seats: fallbackSeats,
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
  }, [event?.id]);

  const dynamicUpiId =
    eventDetails?.upiId ||
    eventDetails?.paymentUpiId ||
    eventDetails?.scannerUpiId ||
    eventDetails?.bankConfig?.upiId ||
    eventDetails?.registrationFormConfig?.upiId ||
    event?.upiId ||
    event?.paymentUpiId ||
    event?.scannerUpiId ||
    event?.bankConfig?.upiId;

  const dynamicScannerUrl =
    eventDetails?.scannerUrl ||
    eventDetails?.qrCodeUrl ||
    eventDetails?.paymentQrUrl ||
    eventDetails?.scannerImage ||
    eventDetails?.scannerQr ||
    event?.scannerUrl ||
    event?.qrCodeUrl ||
    event?.paymentQrUrl ||
    event?.scannerImage;

  const isFreeEvent =
    event?.isFree === true ||
    formData.numericPrice === 0 ||
    formData.categoryPrice === "Free" ||
    formData.categoryPrice === "₹0";

  const steps = [
    { num: 1, title: "Pass Tier" },
    { num: 2, title: "Resident" },
    { num: 3, title: "Attendees" },
    { num: 4, title: isUpdateMode ? "Update" : isFreeEvent ? "Confirm" : "Payment" },
  ];

  const handleAddMember = () => {
    setFormData((prev) => ({
      ...prev,
      membersCount: prev.membersCount + 1,
      members: [...prev.members, { name: "", age: 0, gender: "Male", relationship: "Spouse" }],
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

  const maxEventCapacity = (activeEvent as any)?.maxAttendees ?? activeEvent?.capacity;
  const currentEventCount = (activeEvent as any)?.attendees ?? (activeEvent as any)?.registrationCount ?? (activeEvent?.registrations ? activeEvent.registrations.length : 0);
  const isEventFull = !isUpdateMode && maxEventCapacity != null && Number(maxEventCapacity) > 0 && currentEventCount >= Number(maxEventCapacity) && !isAnyAdmin;

  const handleNextStep = () => {
    if (isEventFull) {
      showWarning(`This event has reached its maximum capacity of ${maxEventCapacity} attendees.`);
      return;
    }
    if (currentStep === 1) {
      if (!selectedCatId || !formData.category) {
        showWarning("Please select a pass category to proceed.");
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.fullName?.trim()) {
        showWarning("Please enter your Full Name.");
        return;
      }
      if (!formData.phone?.trim()) {
        showWarning("Please enter your Phone / Mobile Number.");
        return;
      }
      if (!formData.email?.trim()) {
        showWarning("Please enter your Email Address.");
        return;
      }
      if (!formData.gotram?.trim()) {
        showWarning("Gotram / Family Lineage is mandatory for event registration.");
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.members || formData.members.length === 0) {
        showWarning("Please add at least 1 attendee.");
        return;
      }
      for (let i = 0; i < formData.members.length; i++) {
        const mem = formData.members[i];
        if (!mem.name?.trim()) {
          showWarning(`Please enter the name for attendee #${i + 1}.`);
          return;
        }
        if (!mem.age || Number(mem.age) <= 0) {
          showWarning(`Please enter a valid age (> 0) for attendee #${i + 1} (${mem.name || "Member"}).`);
          return;
        }
        if (!mem.gender?.trim()) {
          showWarning(`Please select a gender for attendee #${i + 1} (${mem.name || "Member"}).`);
          return;
        }
        if (i > 0 && !(mem as any).relationship?.trim()) {
          showWarning(`Please select a relationship for attendee #${i + 1} (${mem.name || "Member"}).`);
          return;
        }
      }
    }
    if (isRegistrationEnded) {
      showWarning("Registration deadline has passed. Contact admin for manual registration.");
      return;
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleComplete = async (modeOverride?: string) => {
    if (isEventFull) {
      showWarning(`This event has reached its maximum capacity of ${maxEventCapacity} attendees.`);
      return;
    }
    if (isRegistrationEnded) {
      showWarning("Registration deadline has passed. Contact admin for manual registration.");
      return;
    }
    if (!formData.gotram?.trim()) {
      showWarning("Gotram / Family Lineage is mandatory for event registration.");
      setCurrentStep(2);
      return;
    }
    const selectedMode = modeOverride || formData.paymentMode || "UPI";
    const paymentStatus = isAnyAdmin && adminPaymentStatus
      ? adminPaymentStatus
      : formData.numericPrice === 0
      ? "PAID"
      : selectedMode === "Pay Later"
      ? "PENDING"
      : "PAID";

    try {
      const regPayload = {
        eventId: event?.id ? (typeof event.id === "number" ? event.id : Number(String(event.id).replace(/\D/g, "")) || 1) : 1,
        activityId: event?.id ? String(event.id) : undefined,
        eventName: event?.title || "Community Festival",
        activityTitle: event?.title || "Community Festival",
        category: formData.category || event?.category || "Event",
        primaryName: formData.fullName,
        participantName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        gotram: formData.gotram || undefined,
        flatNo: formData.flatNo,
        membersCount: formData.members.length || 1,
        devoteeCount: formData.members.length || 1,
        attendingDevotees: formData.members.map((m) => m.name).filter(Boolean).join(", "),
        membersJson: JSON.stringify(formData.members),
        eventDate: event?.date || "2026",
        eventTime: event?.time || formData.poojaSlot,
        venue: event?.venue || "Community Mandap",
        bookingFee: (isAnyAdmin && adminPaymentStatus === "FREE") ? 0 : formData.numericPrice,
        paymentStatus,
        paymentMethod: selectedMode,
        paymentReceiptUrl: formData.receiptUrl || undefined,
        transactionId: formData.transactionRef || undefined,
        userId: selectedTargetUserId || undefined,
        user: selectedTargetUserId ? { id: selectedTargetUserId } : undefined,
      };

      if (isUpdateMode && existingRegId) {
        const numericId = typeof existingRegId === "number" ? existingRegId : Number(String(existingRegId).replace(/\D/g, ""));
        if (!isNaN(numericId) && numericId > 0) {
          try {
            await eventService.updateRegistration(numericId, regPayload);
            showSuccess("Registration updated successfully!");
          } catch (apiErr: any) {
            const errMsg = apiErr?.response?.data?.message || apiErr?.message || "Failed to update registration.";
            showWarning(errMsg);
            return;
          }
        }
      } else {
        try {
          await eventService.createRegistration(regPayload);
          showSuccess("Registration completed successfully!");
        } catch (apiErr: any) {
          const errMsg = apiErr?.response?.data?.message || apiErr?.message || "";
          console.warn("Backend createRegistration API error:", apiErr);
          if (errMsg && (errMsg.toLowerCase().includes("deadline") || errMsg.toLowerCase().includes("passed") || errMsg.toLowerCase().includes("cancelled") || errMsg.toLowerCase().includes("ended") || errMsg.toLowerCase().includes("full"))) {
            showWarning(errMsg);
            return;
          }
          if (event?.id) {
            const numericEventId = typeof event.id === "number" ? event.id : Number(String(event.id).replace(/\D/g, ""));
            if (!isNaN(numericEventId) && numericEventId > 0) {
              try {
                await eventService.register(numericEventId);
                showSuccess("Registration completed successfully!");
              } catch (regErr: any) {
                const regErrMsg = regErr?.response?.data?.message || regErr?.message || "Registration deadline has passed. Contact admin for manual registration.";
                showWarning(regErrMsg);
                return;
              }
            }
          } else {
            if (errMsg) {
              showWarning(errMsg);
              return;
            }
          }
        }
      }

      // ── Two-way sync: Save new attendees to Family Members profile in Dashboard ──
      if (saveNewMembersToProfile && Array.isArray(formData.members)) {
        try {
          const existingNames = new Set(savedFamilyMembers.map((m) => (m.name || "").trim().toLowerCase()));
          if (authUser?.fullName) existingNames.add(authUser.fullName.trim().toLowerCase());
          if (formData.fullName) existingNames.add(formData.fullName.trim().toLowerCase());

          for (let i = 1; i < formData.members.length; i++) {
            const mem = formData.members[i];
            if (mem.name && mem.name.trim() && !existingNames.has(mem.name.trim().toLowerCase())) {
              const avatar = mem.gender === "Female" ? (mem.age < 18 ? "👧" : "👩") : (mem.age < 18 ? "👦" : "👨");
              await eventService.addFamilyMember({
                name: mem.name.trim(),
                relation: (mem as any).relationship || "Family",
                age: Number(mem.age) || 20,
                gender: mem.gender || "Male",
                avatar,
                status: "ACTIVE",
              }).catch(() => {});
              existingNames.add(mem.name.trim().toLowerCase());
            }
          }
          window.dispatchEvent(new Event("mana_family_updated"));
        } catch (famErr) {
          console.warn("Family member auto-sync note:", famErr);
        }
      }

      window.dispatchEvent(new Event("mana_activities_updated"));
      window.dispatchEvent(new Event("mana_registrations_updated"));
      setFormData((prev) => ({ ...prev, paymentMode: selectedMode }));
      setIsSuccess(true);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Registration deadline has passed. Contact admin for manual registration.";
      console.warn("Registration API error:", err);
      showWarning(errMsg);
    }
  };

  return (
    <div className="flex flex-col justify-between h-full min-h-[520px] sm:min-h-[580px] space-y-3.5">
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
        <div className="min-w-0 pr-3">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider mb-0.5">
            {isUpdateMode ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Edit3 className="w-3 h-3" />
                <span>Update Registration</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Event Registration Portal</span>
              </span>
            )}
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
          {isEventFull && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="block text-xs font-extrabold text-rose-900 dark:text-rose-200">Event Capacity Reached (Housefull)</strong>
                <span className="text-[11.5px] font-semibold leading-relaxed">
                  This event has reached its maximum capacity limit of {maxEventCapacity} attendees. Registration is no longer accepted.
                </span>
              </div>
            </div>
          )}
          {isRegistrationEnded && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong className="block text-xs font-extrabold text-amber-900 dark:text-amber-200">Registration Closed</strong>
                <span className="text-[11.5px] font-semibold leading-relaxed">
                  Registration deadline has passed. Contact admin for manual registration.
                </span>
              </div>
            </div>
          )}
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

                  const categorySeats = cat.seats ?? cat.qty ?? (cat as any).capacity ?? (cat as any).availableSeats ?? (cat as any).slots;

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
                          {cat.description || (categorySeats ? `${categorySeats} seats allocated` : "Standard event pass tier")}
                        </p>
                      </div>

                      {categorySeats != null && categorySeats !== "" && (
                        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[9.5px] font-bold text-muted-foreground">
                          <span>Capacity: {categorySeats} {Number(categorySeats) === 1 ? "seat" : "seats"}</span>
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
                {isAnyAdmin && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Admin Desk Mode
                  </span>
                )}
              </div>

              {/* ── Admin / Event Admin Mode Switch ── */}
              {isAnyAdmin && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary/10 to-indigo-500/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Admin Registration Desk</p>
                      <p className="text-[10.5px] text-muted-foreground">Register for yourself or on behalf of any resident / devotee</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-background/90 p-1 rounded-xl border border-border shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setRegisterOnBehalf(false);
                        setSelectedTargetUserId(null);
                        const userDob = authUser?.dateOfBirth || (authUser as any)?.dob;
                        const userAge = calculateAge(userDob);
                        setFormData((prev) => ({
                          ...prev,
                          fullName: authUser?.fullName || "",
                          email: authUser?.email || "",
                          phone: authUser?.phone || "",
                          flatNo: (authUser?.block && authUser?.flatNo) ? `${authUser.block}-${authUser.flatNo}` : (authUser?.flatNo || ""),
                          members: prev.members.map((m, i) => i === 0 ? {
                            ...m,
                            name: authUser?.fullName || m.name,
                            age: userAge || m.age || 0,
                            gender: authUser?.gender || m.gender || "Male",
                          } : m),
                        }));
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        !registerOnBehalf
                          ? "bg-primary text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      For Myself
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegisterOnBehalf(true);
                        setFormData((prev) => ({
                          ...prev,
                          fullName: "",
                          email: "",
                          phone: "",
                          flatNo: "",
                          gotram: "",
                          members: prev.members.map((m, i) => i === 0 ? { ...m, name: "", age: 0 } : m),
                        }));
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        registerOnBehalf
                          ? "bg-amber-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      On Behalf of Resident
                    </button>
                  </div>
                </div>
              )}

              {/* ── Resident Auto-Select for On-Behalf Mode ── */}
              {isAnyAdmin && registerOnBehalf && (
                <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2 relative">
                  <label className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block flex items-center justify-between">
                    <span>Search & Select Community Resident:</span>
                    <span className="text-[10px] font-normal text-muted-foreground lowercase">or type attendee details manually below</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by resident name, flat no, or email..."
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        setIsUserDropdownOpen(true);
                      }}
                      onFocus={() => setIsUserDropdownOpen(true)}
                      className="w-full h-9 pl-3 pr-8 rounded-xl bg-background text-xs font-semibold border border-border focus:ring-2 focus:ring-amber-500/30 outline-none text-foreground"
                    />
                    {userSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserSearchQuery("");
                          setIsUserDropdownOpen(false);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown Suggestions */}
                  {isUserDropdownOpen && communityUsers.length > 0 && (
                    <div className="max-h-48 overflow-y-auto rounded-xl bg-card border border-border shadow-xl absolute left-3 right-3 z-30 divide-y divide-border/60">
                      {communityUsers
                        .filter((u: any) => {
                          if (!userSearchQuery.trim()) return true;
                          const q = userSearchQuery.toLowerCase();
                          return (
                            (u.fullName && u.fullName.toLowerCase().includes(q)) ||
                            (u.email && u.email.toLowerCase().includes(q)) ||
                            (u.phone && u.phone.includes(q)) ||
                            (u.flatNo && u.flatNo.toLowerCase().includes(q))
                          );
                        })
                        .slice(0, 8)
                        .map((u: any) => {
                          const flat = u.block && u.flatNo ? `${u.block}-${u.flatNo}` : u.flatNo || "";
                          return (
                            <div
                              key={u.id || u.email}
                              onClick={() => {
                                setSelectedTargetUserId(u.id || null);
                                setUserSearchQuery(u.fullName || u.email || "");
                                setIsUserDropdownOpen(false);
                                const userAge = calculateAge(u.dateOfBirth || u.dob);
                                setFormData((prev) => ({
                                  ...prev,
                                  fullName: u.fullName || "",
                                  email: u.email || "",
                                  phone: u.phone || "",
                                  flatNo: flat,
                                  members: prev.members.map((m, i) => i === 0 ? {
                                    ...m,
                                    name: u.fullName || m.name,
                                    age: userAge || m.age || 0,
                                    gender: u.gender || m.gender || "Male",
                                  } : m),
                                }));
                              }}
                              className="p-2.5 hover:bg-primary/10 cursor-pointer flex items-center justify-between text-xs transition-colors"
                            >
                              <div>
                                <strong className="text-foreground font-bold block">{u.fullName || "Unnamed Resident"}</strong>
                                <span className="text-[10px] text-muted-foreground block">{u.email} {u.phone ? `· ${u.phone}` : ""}</span>
                              </div>
                              {flat && (
                                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                                  {flat}
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

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
                    Gotram / Family Lineage <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
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

              {/* Flat / Villa No */}
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

              {/* ── Quick Add from Saved Family Profile ── */}
              {savedFamilyMembers.length > 0 && (() => {
                const currentNames = new Set(formData.members.map((m) => (m.name || "").trim().toLowerCase()));
                const availableSaved = savedFamilyMembers.filter((m) => m.name && !currentNames.has(m.name.trim().toLowerCase()));
                if (availableSaved.length === 0) return null;
                return (
                  <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-primary flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Quick Add from Saved Family Profile:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newToAdd = availableSaved.map((sm) => ({
                            name: sm.name,
                            age: Number(sm.age) || 25,
                            gender: sm.gender || (sm.relation?.toLowerCase().includes("wife") || sm.relation?.toLowerCase().includes("mother") || sm.relation?.toLowerCase().includes("daughter") || sm.relation?.toLowerCase().includes("sister") ? "Female" : "Male"),
                            relationship: sm.relation || "Family",
                          }));
                          setFormData((prev) => ({
                            ...prev,
                            membersCount: prev.members.length + newToAdd.length,
                            members: [...prev.members, ...newToAdd],
                          }));
                        }}
                        className="text-[10px] font-bold text-primary underline hover:opacity-80 cursor-pointer"
                      >
                        + Add All ({availableSaved.length})
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableSaved.map((sm, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            const newMember = {
                              name: sm.name,
                              age: Number(sm.age) || 25,
                              gender: sm.gender || (sm.relation?.toLowerCase().includes("wife") || sm.relation?.toLowerCase().includes("mother") || sm.relation?.toLowerCase().includes("daughter") || sm.relation?.toLowerCase().includes("sister") ? "Female" : "Male"),
                              relationship: sm.relation || "Family",
                            };
                            setFormData((prev) => ({
                              ...prev,
                              membersCount: prev.members.length + 1,
                              members: [...prev.members, newMember],
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-background border border-border hover:border-primary text-foreground text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <span>{sm.avatar || "👤"}</span>
                          <span>{sm.name}</span>
                          <span className="text-[9.5px] text-muted-foreground">({sm.relation})</span>
                          <span className="text-primary font-bold ml-0.5">+</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

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
                      <div className="col-span-12 sm:col-span-4">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                          {idx === 0 ? "Full Name *" : "Name *"}
                        </label>
                        <input
                          type="text"
                          placeholder={idx === 0 ? "Primary Member Name" : "Member Name"}
                          value={mem.name}
                          onChange={(e) => {
                            const updated = [...formData.members];
                            updated[idx].name = e.target.value;
                            setFormData({ ...formData, members: updated });
                          }}
                          className="w-full h-9 px-3 rounded-xl bg-[var(--mana-bg-input)] text-xs font-semibold border border-border outline-none text-foreground"
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-3">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                          Relationship *
                        </label>
                        {idx === 0 ? (
                          <input
                            type="text"
                            readOnly
                            value={(mem as any).relationship || "Self (Head)"}
                            className="w-full h-9 px-2.5 rounded-xl bg-muted/60 text-xs font-semibold border border-border outline-none text-muted-foreground cursor-not-allowed"
                          />
                        ) : (
                          <select
                            value={(mem as any).relationship || "Spouse"}
                            onChange={(e) => {
                              const updated = [...formData.members];
                              (updated[idx] as any).relationship = e.target.value;
                              setFormData({ ...formData, members: updated });
                            }}
                            className="w-full h-9 px-2 rounded-xl bg-[var(--mana-bg-input)] text-xs font-semibold border border-border outline-none text-foreground cursor-pointer"
                          >
                            <option value="Spouse">Spouse</option>
                            <option value="Child">Child</option>
                            <option value="Son">Son</option>
                            <option value="Daughter">Daughter</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Parent">Parent</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Relative">Relative</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                          </select>
                        )}
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-between">
                          <span>Age *</span>
                          {idx === 0 && mem.age > 0 && (
                            <span className="text-[9px] text-primary font-semibold lowercase">from profile</span>
                          )}
                        </label>
                        <input
                          type="number"
                          placeholder="Age"
                          min={1}
                          max={120}
                          value={mem.age || ""}
                          onChange={(e) => {
                            const updated = [...formData.members];
                            updated[idx].age = parseInt(e.target.value) || 0;
                            setFormData({ ...formData, members: updated });
                          }}
                          className="w-full h-9 px-2.5 rounded-xl bg-[var(--mana-bg-input)] text-xs font-semibold border border-border outline-none text-foreground"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                          Gender *
                        </label>
                        <select
                          value={mem.gender || "Male"}
                          onChange={(e) => {
                            const updated = [...formData.members];
                            updated[idx].gender = e.target.value;
                            setFormData({ ...formData, members: updated });
                          }}
                          className="w-full h-9 px-2 rounded-xl bg-[var(--mana-bg-input)] text-xs font-semibold border border-border outline-none text-foreground cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto-sync to User Dashboard Family Profile */}
              <div className="pt-2 border-t border-border flex items-center gap-2">
                <input
                  type="checkbox"
                  id="syncFamily"
                  checked={saveNewMembersToProfile}
                  onChange={(e) => setSaveNewMembersToProfile(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <label htmlFor="syncFamily" className="text-[11px] font-semibold text-muted-foreground cursor-pointer select-none">
                  Automatically save new attendee(s) to my Family Members profile in User Dashboard
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Confirmation for Free Events OR Payment for Paid Events */}
          {currentStep === 4 && (
            <div className="space-y-3.5 flex-1">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">
                    {isUpdateMode
                      ? "Review & Confirm Updates"
                      : isFreeEvent
                      ? "Review & Confirmation"
                      : "Payment Mode"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isUpdateMode
                      ? "Verify your attendee details and pass configuration before saving"
                      : isFreeEvent
                      ? "Verify your registration details before completing free booking"
                      : "Select payment method to complete booking"}
                  </p>
                </div>
                <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl border ${
                  isFreeEvent
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "text-primary bg-primary/10 border-primary/20"
                }`}>
                  {isFreeEvent
                    ? "FREE ADMISSION"
                    : `Total: ₹${formData.numericPrice.toLocaleString("en-IN")}`}
                </span>
              </div>

              {isFreeEvent ? (
                /* FREE EVENT: Clean Details Review Summary (NO PAYMENT DETAILS) */
                <div className="p-4 rounded-2xl bg-card border border-border space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Event / Festival</span>
                      <strong className="text-foreground font-bold text-xs truncate block">{event?.title || "Community Event"}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Pass Category</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-xs block truncate">
                        {formData.category} (Free Entry)
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Primary Registrant</span>
                      <strong className="text-foreground font-bold text-xs block truncate">
                        {formData.fullName} ({formData.flatNo || "Resident"})
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Gotram / Lineage</span>
                      <strong className="text-foreground font-bold text-xs block truncate">
                        {formData.gotram || "N/A"}
                      </strong>
                    </div>
                  </div>

                  {/* Registered Attendees Summary */}
                  <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-muted-foreground uppercase">
                        Registered Attendees ({formData.members.length}):
                      </span>
                      <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">Complimentary Entry</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {formData.members.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-background border border-border text-[11px] font-medium text-foreground flex items-center gap-1"
                        >
                          <span className="text-muted-foreground">{idx + 1}.</span>
                          <strong className="font-bold">{m.name || `Attendee ${idx + 1}`}</strong>
                          {(m as any).relationship && <span className="text-muted-foreground text-[10px]">({(m as any).relationship})</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">Total Payable Amount</span>
                      <span className="text-[10.5px] text-muted-foreground">Community-sponsored complimentary entry</span>
                    </div>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase">₹0 (Free)</span>
                  </div>
                </div>
              ) : (
                /* PAID EVENT: Payment Modes Selection & Verification */
                <>
                  {/* Payment Modes */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "UPI", label: "UPI / QR Code", desc: "Instant scan & pay", icon: QrCode },
                      { id: "Card", label: "Cards / NetBanking", desc: "Online gateway", icon: CreditCard },
                      { id: "Cash", label: "Cash / Counter", desc: "Pay at venue", icon: IndianRupee },
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
                        {dynamicUpiId ? (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(dynamicUpiId);
                              showSuccess("UPI ID copied!");
                            }}
                            className="text-xs font-mono font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> {dynamicUpiId}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="font-mono blur-[3px] select-none opacity-40">organizer.upi@bank</span>
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              UPI ID Pending
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {dynamicScannerUrl ? (
                          <div className="p-2 bg-white dark:bg-slate-800 rounded-2xl border border-border shrink-0 shadow-sm w-20 h-20 flex items-center justify-center">
                            <img src={dynamicScannerUrl} alt="Payment Scanner" className="w-full h-full object-contain rounded-xl" />
                          </div>
                        ) : dynamicUpiId ? (
                          <div className="p-2 bg-white rounded-2xl border border-border shrink-0 shadow-sm w-20 h-20 flex items-center justify-center">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${encodeURIComponent(dynamicUpiId)}&pn=${encodeURIComponent(eventDetails?.title || "Event Registration")}&cu=INR`}
                              alt="Payment QR Code"
                              className="w-full h-full object-contain rounded-xl"
                            />
                          </div>
                        ) : (
                          /* Admin did not upload any scanner / UPI: Show Blurred Scanner Placeholder */
                          <div className="relative p-2 bg-muted/60 rounded-2xl border border-border shrink-0 shadow-sm w-20 h-20 flex flex-col items-center justify-center overflow-hidden">
                            <QrCode className="w-14 h-14 text-muted-foreground blur-[4px] opacity-25 select-none" />
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1.5px] flex flex-col items-center justify-center p-1 text-center">
                              <Lock className="w-4 h-4 text-amber-500 mb-0.5" />
                              <span className="text-[8px] font-black text-foreground uppercase leading-tight">No Scanner</span>
                            </div>
                          </div>
                        )}

                        <div className="flex-1 space-y-2 min-w-0">
                          {!dynamicUpiId && !dynamicScannerUrl && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-tight">
                              ⚠️ Organizer has not configured a payment scanner for this event yet. Enter transaction ref or pay cash at helpdesk.
                            </p>
                          )}
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
                        <IndianRupee className="w-4 h-4 text-emerald-500" /> Pay Cash at Helpdesk
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Your spot is reserved. Please show this registration e-pass and pay cash at the event registration
                        counter on the day of the event.
                      </p>
                    </div>
                  )}
                </>
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

            {isEventFull ? (
              <span className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-500/20 flex items-center gap-1.5 select-none">
                <AlertCircle className="w-3.5 h-3.5" /> Event Full ({currentEventCount}/{maxEventCapacity})
              </span>
            ) : isRegistrationEnded ? (
              <span className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/20 flex items-center gap-1.5 select-none">
                <AlertCircle className="w-3.5 h-3.5" /> Registration Deadline Passed
              </span>
            ) : currentStep < 4 ? (
              <TouchButton variant="primary" size="sm" icon={ArrowRight} onClick={handleNextStep}>
                Next Step
              </TouchButton>
            ) : (
              <div className="flex items-center gap-2">
                {formData.numericPrice > 0 && !isUpdateMode && (
                  <button
                    type="button"
                    onClick={() => handleComplete("Pay Later")}
                    className="px-3.5 py-2 rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Pay Later
                  </button>
                )}
                <TouchButton variant="primary" size="sm" icon={isUpdateMode ? RefreshCw : CheckCircle2} onClick={() => handleComplete()}>
                  {isUpdateMode
                    ? "Update Registration"
                    : formData.numericPrice === 0
                    ? "Complete Free Registration"
                    : `Confirm Registration (${formData.categoryPrice})`}
                </TouchButton>
              </div>
            )}
          </div>
        </GlassCard>
      ) : (
        /* REGISTRATION CONFIRMED SUMMARY (WITHOUT DIGITAL PASS / QR) */
        <GlassCard
          isDark={isDark}
          hoverScale={false}
          className="flex-1 flex flex-col justify-between p-5 sm:p-6 border border-border rounded-2xl text-center space-y-4 animate-scaleUp shadow-md"
        >
          <div className="space-y-3.5 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white uppercase tracking-wider">
                {isUpdateMode ? "Registration Updated 🎉" : "Registration Confirmed 🎉"}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-foreground mt-2.5">
                Thank you, {formData.fullName}!
              </h3>
              <p className="text-xs font-bold text-primary mt-1">
                {event?.title || "Community Event"} • {formData.category} ({formData.categoryPrice})
              </p>
              {formData.gotram && (
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  Gotram: <strong className="text-foreground">{formData.gotram}</strong>
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs text-left space-y-2 max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Registered Attendees</span>
                <span className="font-bold text-foreground">{formData.members.length} Member(s)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formData.numericPrice === 0 ? "Free / Complimentary" : formData.paymentMode === "Pay Later" ? "Pay Later at Venue" : "Payment Recorded"}
                </span>
              </div>
              <div className="pt-2 border-t border-border text-center">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Confirmation details have been sent to <strong className="text-foreground">{formData.email}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <TouchButton variant="primary" size="sm" fullWidth onClick={onClose}>
              Done / Close
            </TouchButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
