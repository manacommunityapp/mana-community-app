import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  PauseCircle,
  PlayCircle,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Palmtree,
  Settings,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Edit2,
  Check,
  X,
  Home,
  ShieldAlert,
  ArrowRight,
  QrCode,
  KeyRound,
  Copy,
  ShieldCheck,
} from "lucide-react";
import { freshKitchenService } from "../../../services/fresh-kitchen/freshKitchenService";
import type {
  DailyBasket,
  DailyBasketItem,
  DayOfWeek,
  BasketExecutionMode,
  DeliveryPassDto,
} from "../../../types/freshKitchen";

interface Props {
  onExploreKitchen?: () => void;
}

const ALL_DAYS: { code: DayOfWeek; label: string; full: string }[] = [
  { code: "MON", label: "M", full: "Monday" },
  { code: "TUE", label: "T", full: "Tuesday" },
  { code: "WED", label: "W", full: "Wednesday" },
  { code: "THU", label: "Th", full: "Thursday" },
  { code: "FRI", label: "F", full: "Friday" },
  { code: "SAT", label: "Sa", full: "Saturday" },
  { code: "SUN", label: "Su", full: "Sunday" },
];

const DELIVERY_SLOTS = [
  "06:00 AM - 06:45 AM (Early Bird Morning Drop)",
  "06:45 AM - 07:30 AM (Standard Breakfast Drop)",
  "07:30 AM - 08:15 AM (Late Morning Drop)",
];

export function DailyBasketManager({ onExploreKitchen }: Props) {
  const [basket, setBasket] = useState<DailyBasket | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vacation Pause Modal / State
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [vacationStartDate, setVacationStartDate] = useState("2026-03-10");
  const [vacationEndDate, setVacationEndDate] = useState("2026-03-15");
  const [isUpdatingVacation, setIsUpdatingVacation] = useState(false);

  // Edit Delivery Address Modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [flatNumber, setFlatNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [preferredSlot, setPreferredSlot] = useState(DELIVERY_SLOTS[0]);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);

  // Edit Item Days Modal
  const [editingItem, setEditingItem] = useState<DailyBasketItem | null>(null);
  const [itemDaysDraft, setItemDaysDraft] = useState<DayOfWeek[]>([]);
  const [isSavingItemDays, setIsSavingItemDays] = useState(false);

  // Today's Delivery Pass state
  const [deliveryPass, setDeliveryPass] = useState<DeliveryPassDto | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  useEffect(() => {
    loadBasket();
    loadDeliveryPass();
  }, []);

  const loadBasket = async () => {
    setLoading(true);
    try {
      const data = await freshKitchenService.getDailyBasket();
      setBasket(data);
      setFlatNumber(data.flatNumber);
      setDeliveryAddress(data.deliveryAddress);
      setDeliveryInstructions(data.deliveryInstructions || "");
      if (data.preferredDeliveryTime) setPreferredSlot(data.preferredDeliveryTime);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryPass = async () => {
    try {
      const pass = await freshKitchenService.getTodayDeliveryPass();
      setDeliveryPass(pass);
    } catch {
      // Normal when no order has been scheduled or generated for today
      setDeliveryPass(null);
    }
  };

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(true);
    showToast("Handover PIN copied to clipboard!");
    setTimeout(() => setCopiedOtp(false), 2500);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleExecutionMode = async (mode: BasketExecutionMode) => {
    if (!basket) return;
    try {
      const updated = await freshKitchenService.updateExecutionMode({ executionMode: mode });
      setBasket(updated);
      showToast(
        mode === "AUTO_ORDER"
          ? "Switched to Auto-Order. Batters will be dispatched automatically every scheduled morning!"
          : "Switched to Daily Approval. You'll receive a notification at 8:00 PM the night before to confirm."
      );
    } catch {
      showToast("Failed to change execution mode.");
    }
  };

  const handleSaveVacationPause = async (pause: boolean) => {
    setIsUpdatingVacation(true);
    try {
      const updated = await freshKitchenService.setVacationPause({
        isVacationPaused: pause,
        vacationStartDate: pause ? vacationStartDate : undefined,
        vacationEndDate: pause ? vacationEndDate : undefined,
      });
      setBasket(updated);
      setShowVacationModal(false);
      showToast(
        pause
          ? `Vacation pause activated from ${vacationStartDate} to ${vacationEndDate}. No orders will trigger.`
          : "Vacation pause lifted! Daily Basket resumed."
      );
    } finally {
      setIsUpdatingVacation(false);
    }
  };

  const handleSaveAddress = async () => {
    setIsUpdatingAddress(true);
    try {
      const updated = await freshKitchenService.updateDeliveryDetails({
        flatNumber,
        deliveryAddress,
        deliveryInstructions,
        preferredDeliveryTime: preferredSlot,
      });
      setBasket(updated);
      setShowAddressModal(false);
      showToast("Delivery address and preferences updated successfully!");
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const handleToggleItemPause = async (item: DailyBasketItem) => {
    try {
      const updated = await freshKitchenService.updateDailyBasketItem(item.id, {
        isPaused: !item.isPaused,
      });
      setBasket(updated);
      showToast(item.isPaused ? `Resumed ${item.itemName}` : `Paused ${item.itemName}`);
    } catch {
      showToast("Failed to update item status.");
    }
  };

  const handleItemQuantityChange = async (item: DailyBasketItem, delta: number) => {
    const newQty = Math.max(1, item.quantity + delta);
    if (newQty === item.quantity) return;
    try {
      const updated = await freshKitchenService.updateDailyBasketItem(item.id, {
        quantity: newQty,
      });
      setBasket(updated);
    } catch {
      showToast("Failed to update quantity.");
    }
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from your Daily Basket?`)) {
      return;
    }
    try {
      const updated = await freshKitchenService.deleteDailyBasketItem(itemId);
      setBasket(updated);
      showToast(`Removed ${name} from Daily Basket.`);
    } catch {
      showToast("Failed to delete item.");
    }
  };

  const handleOpenEditItemDays = (item: DailyBasketItem) => {
    setEditingItem(item);
    setItemDaysDraft([...item.scheduledDays]);
  };

  const toggleDraftDay = (day: DayOfWeek) => {
    setItemDaysDraft((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveItemDays = async () => {
    if (!editingItem) return;
    if (itemDaysDraft.length === 0) {
      alert("Item must be scheduled for at least 1 day. You can pause the item instead.");
      return;
    }
    setIsSavingItemDays(true);
    try {
      const updated = await freshKitchenService.updateDailyBasketItem(editingItem.id, {
        scheduledDays: itemDaysDraft,
      });
      setBasket(updated);
      setEditingItem(null);
      showToast(`Updated schedule for ${editingItem.itemName}!`);
    } finally {
      setIsSavingItemDays(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-600">Loading your Daily Basket...</p>
      </div>
    );
  }

  if (!basket) return null;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-600">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Today's Delivery Pass (Handover Verification Loop) */}
      {deliveryPass && (
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-emerald-500/30 space-y-6 relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800/60 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black tracking-wider uppercase text-emerald-400">
                    Live Morning Handover Pass
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                    deliveryPass.status === 'DELIVERED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : deliveryPass.status === 'OUT_FOR_DELIVERY'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 animate-pulse'
                      : 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                  }`}>
                    {deliveryPass.status === 'DELIVERED'
                      ? '✓ Delivered'
                      : deliveryPass.status === 'OUT_FOR_DELIVERY'
                      ? '🚚 Out for Delivery'
                      : '📦 Confirmed for Delivery'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Order #{deliveryPass.orderNumber}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-500/20">
              <Clock className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Delivery Slot</div>
                <div className="font-bold text-slate-200">
                  {deliveryPass.deliverySlot || "06:00 AM - 07:30 AM"}
                </div>
              </div>
            </div>
          </div>

          {/* Main Handover Content: OTP + QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 6-Digit OTP Box */}
            <div className="bg-slate-950/60 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    Doorstep Handover PIN / OTP
                  </div>
                  {deliveryPass.handoverOtp && (
                    <button
                      onClick={() => handleCopyOtp(deliveryPass.handoverOtp!)}
                      className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white bg-emerald-800/40 hover:bg-emerald-700/60 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all font-semibold"
                    >
                      {copiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedOtp ? "Copied" : "Copy PIN"}
                    </button>
                  )}
                </div>

                {deliveryPass.handoverOtp ? (
                  <div className="flex items-center justify-center gap-2 my-2 py-3 bg-black/40 rounded-xl border border-emerald-500/20">
                    {deliveryPass.handoverOtp.split("").map((digit, idx) => (
                      <span
                        key={idx}
                        className="w-10 h-12 flex items-center justify-center text-2xl font-black text-emerald-300 bg-slate-900/90 rounded-xl border border-emerald-400/40 shadow-inner tracking-widest"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">
                    PIN will be generated upon morning dispatch.
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                Provide this 6-digit PIN to the delivery runner at your door to verify handover and release items.
              </p>
            </div>

            {/* QR Token Box */}
            <div className="bg-slate-950/60 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    Runner QR Token
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Doorstep Scan</span>
                </div>

                <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-3 text-center my-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                    Digital Verification Token
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-black text-emerald-200 tracking-wider break-all select-all">
                    {deliveryPass.qrToken || "MANA-PASS-PENDING"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-300/80 mt-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  {deliveryPass.isEscrowLocked
                    ? "Vendor payment locked in escrow until handover is verified."
                    : "Escrow unlocked & settled to vendor."}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Items Summary */}
          <div className="bg-black/30 rounded-2xl p-4 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Items in Basket:
              </span>
              {deliveryPass.items && deliveryPass.items.length > 0 ? (
                deliveryPass.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 px-2.5 py-1 rounded-lg font-semibold text-xs"
                  >
                    {item.quantity}x {item.productName}
                  </span>
                ))
              ) : (
                <span className="text-slate-300 font-medium">Daily morning fresh selection</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Paid</div>
                <div className="text-sm font-black text-white">₹{deliveryPass.totalAmount}</div>
              </div>
              {deliveryPass.status === 'DELIVERED' && deliveryPass.actualDeliveryAt && (
                <div className="text-right pl-3 border-l border-emerald-700/50">
                  <div className="text-[10px] text-emerald-400 uppercase font-semibold">Delivered At</div>
                  <div className="text-xs font-bold text-slate-200">
                    {new Date(deliveryPass.actualDeliveryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Banner & Status */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                My Daily Basket
              </span>
              {basket.isVacationPaused ? (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                  <Palmtree className="w-3 h-3 text-amber-600" />
                  Vacation Paused
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Active Morning Deliveries
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Morning Fresh Food Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fresh stone-ground batters, chutneys, and breakfast kits delivered straight to your door between 6:00 AM - 7:30 AM.
            </p>
          </div>

          {/* Vacation Mode Toggle Button */}
          <div className="flex items-center gap-3">
            {basket.isVacationPaused ? (
              <button
                onClick={() => handleSaveVacationPause(false)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-2xl shadow-sm transition-all"
              >
                <PlayCircle className="w-4 h-4" />
                Resume Daily Basket
              </button>
            ) : (
              <button
                onClick={() => setShowVacationModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-extrabold rounded-2xl transition-all"
              >
                <Palmtree className="w-4 h-4 text-amber-600" />
                Set Vacation Pause
              </button>
            )}

            <button
              onClick={() => setShowAddressModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Delivery Settings
            </button>
          </div>
        </div>

        {/* Vacation Alert Banner if Paused */}
        {basket.isVacationPaused && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Palmtree className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-xs text-amber-900">
                <b>Vacation Pause is ON:</b> All recurring breakfast drops are paused from{" "}
                <b>{basket.vacationStartDate || "March 10"}</b> to{" "}
                <b>{basket.vacationEndDate || "March 15"}</b>. Your basket will resume automatically afterwards.
              </div>
            </div>
            <button
              onClick={() => handleSaveVacationPause(false)}
              className="text-xs font-bold text-amber-950 underline hover:no-underline whitespace-nowrap"
            >
              Resume Now
            </button>
          </div>
        )}

        {/* Delivery Address & Execution Mode Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Address & Slot */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Home className="w-4 h-4 text-emerald-600" />
                Delivery Flat & Address
              </span>
              <button
                onClick={() => setShowAddressModal(true)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
              >
                Edit
              </button>
            </div>
            <div className="text-xs font-bold text-slate-900">{basket.flatNumber}</div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              {basket.deliveryAddress}
            </div>
            {basket.deliveryInstructions && (
              <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                📝 <i>"{basket.deliveryInstructions}"</i>
              </div>
            )}
            <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5 pt-1">
              <Clock className="w-3.5 h-3.5" />
              Preferred Drop Slot: {basket.preferredDeliveryTime}
            </div>
          </div>

          {/* Execution Mode Toggle: Auto-Order vs Daily Approval */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-slate-600" />
                Execution Mode
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                Current: {basket.executionMode === "AUTO_ORDER" ? "Auto-Order" : "Daily Approval"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleToggleExecutionMode("AUTO_ORDER")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  basket.executionMode === "AUTO_ORDER"
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="text-xs font-black flex items-center justify-between">
                  <span>Auto-Order</span>
                  {basket.executionMode === "AUTO_ORDER" && (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </div>
                <div
                  className={`text-[10px] mt-1 leading-snug ${
                    basket.executionMode === "AUTO_ORDER" ? "text-emerald-100" : "text-slate-400"
                  }`}
                >
                  Dispatches automatically without friction on scheduled mornings.
                </div>
              </button>

              <button
                onClick={() => handleToggleExecutionMode("DAILY_APPROVAL")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  basket.executionMode === "DAILY_APPROVAL"
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="text-xs font-black flex items-center justify-between">
                  <span>Daily Approval</span>
                  {basket.executionMode === "DAILY_APPROVAL" && (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  )}
                </div>
                <div
                  className={`text-[10px] mt-1 leading-snug ${
                    basket.executionMode === "DAILY_APPROVAL" ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  Sends push notification at 8:00 PM previous evening to confirm or skip.
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Basket Items List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Recurring Scheduled Items ({basket.items.length})
            </h3>
            <p className="text-xs text-slate-500">
              Items are ground fresh and delivered on the days highlighted in green.
            </p>
          </div>
          {onExploreKitchen && (
            <button
              onClick={onExploreKitchen}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900"
            >
              <Plus className="w-3.5 h-3.5" />
              Add More Products
            </button>
          )}
        </div>

        {basket.items.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Your Daily Basket is Empty</h4>
            <p className="text-xs text-slate-500 mt-1">
              Add fresh batters and morning kits to set your weekly morning breakfast on autopilot.
            </p>
            {onExploreKitchen && (
              <button
                onClick={onExploreKitchen}
                className="mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Browse Fresh Kitchen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {basket.items.map((item) => {
              const itemDailyTotal = item.unitPrice * item.quantity;
              const daysCount = item.scheduledDays.length;
              const itemWeeklyTotal = itemDailyTotal * daysCount;

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    item.isPaused
                      ? "bg-slate-50/70 border-slate-200 opacity-60"
                      : "bg-white border-slate-200/90 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Item Details */}
                    <div className="flex items-start gap-4">
                      {item.product?.imageUrl && (
                        <img
                          src={item.product.imageUrl}
                          alt={item.itemName}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">{item.itemName}</h4>
                          {item.isPaused && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              Paused
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          ₹{item.unitPrice} per pack • {daysCount} days/week = <b>₹{itemWeeklyTotal}/week</b>
                        </div>
                        {item.specialInstructions && (
                          <div className="text-[11px] text-slate-500 mt-1 italic">
                            "{item.specialInstructions}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity Stepper & Actions */}
                    <div className="flex items-center gap-4 self-end md:self-center">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                        <button
                          onClick={() => handleItemQuantityChange(item, -1)}
                          disabled={item.isPaused}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded transition-all disabled:opacity-40"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleItemQuantityChange(item, 1)}
                          disabled={item.isPaused}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded transition-all disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleItemPause(item)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          item.isPaused
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                        }`}
                        title={item.isPaused ? "Resume Item" : "Pause Item"}
                      >
                        {item.isPaused ? (
                          <PlayCircle className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <PauseCircle className="w-4 h-4 text-amber-700" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id, item.itemName)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="Delete from Basket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day-of-Week Pills */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">Scheduled:</span>
                      {ALL_DAYS.map((d) => {
                        const isScheduled = item.scheduledDays.includes(d.code);
                        return (
                          <span
                            key={d.code}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                              isScheduled
                                ? "bg-emerald-700 text-white shadow-sm"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {d.label}
                          </span>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleOpenEditItemDays(item)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Change Scheduled Days
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Total Estimates Financial Breakdown */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/80">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live Total Projection
            </span>
            <h3 className="text-xl font-black mt-0.5">Automated Breakfast Budget</h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Weekly Total:</span>
            <div className="text-3xl font-black text-white">
              ₹{basket.totalWeeklyEstimate}
              <span className="text-xs font-normal text-slate-400"> / week</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-center">
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
            <div className="text-xs text-slate-400">Average Daily Cost</div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              ₹{basket.totalDailyEstimate}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Across active delivery days</div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
            <div className="text-xs text-slate-400">Weekly Total</div>
            <div className="text-xl font-black text-white mt-1">
              ₹{basket.totalWeeklyEstimate}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">7-day cycle recurring billing</div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
            <div className="text-xs text-slate-400">Monthly Projection (est.)</div>
            <div className="text-xl font-black text-amber-400 mt-1">
              ₹{basket.monthlyProjection}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">~30 days automated supply</div>
          </div>
        </div>
      </div>

      {/* ── Vacation Pause Modal ── */}
      {showVacationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Vacation Pause
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Pause My Daily Basket
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Going out of town? Set dates to pause all breakfast deliveries without losing your item preferences.
                </p>
              </div>
              <button
                onClick={() => setShowVacationModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Vacation Start Date:
                </label>
                <input
                  type="date"
                  value={vacationStartDate}
                  onChange={(e) => setVacationStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Vacation End Date (Resumes Next Day):
                </label>
                <input
                  type="date"
                  value={vacationEndDate}
                  onChange={(e) => setVacationEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVacationModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveVacationPause(true)}
                disabled={isUpdatingVacation}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                {isUpdatingVacation ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Palmtree className="w-3.5 h-3.5" />
                )}
                Activate Vacation Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delivery Settings Modal ── */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Delivery Details
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Update Drop Preferences
                </h3>
              </div>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Flat / Unit Number:
                </label>
                <input
                  type="text"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  placeholder="e.g. Tower 4, Flat 1204"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Community Address:
                </label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Morning Delivery Slot:
                </label>
                <select
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {DELIVERY_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Special Delivery Instructions:
                </label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g. Place inside milk bag or ring doorbell once"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddressModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAddress}
                disabled={isUpdatingAddress}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                {isUpdatingAddress ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Item Days Modal ── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Schedule Adjuster
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {editingItem.itemName}
                </h3>
                <p className="text-xs text-slate-500">
                  Select which days you want this item delivered.
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 my-5">
              <div className="grid grid-cols-7 gap-1.5">
                {ALL_DAYS.map((d) => {
                  const isChecked = itemDaysDraft.includes(d.code);
                  return (
                    <button
                      key={d.code}
                      onClick={() => toggleDraftDay(d.code)}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center text-xs font-black transition-all ${
                        isChecked
                          ? "bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/20"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>{d.label}</span>
                      <span className="text-[9px] font-normal opacity-80">{d.code}</span>
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-500 text-center pt-1">
                {itemDaysDraft.length} days selected:{" "}
                <b>{itemDaysDraft.length > 0 ? itemDaysDraft.join(", ") : "None"}</b>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItemDays}
                disabled={isSavingItemDays || itemDaysDraft.length === 0}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                {isSavingItemDays ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Update Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default DailyBasketManager;
