// BillsAndAutopayDashboard.tsx - CRED & PhonePe Inspired Recurring Bill Management, Reminders, NPCI e-Mandates & Admin Billing Engine
import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarClock,
  ShieldCheck,
  CreditCard,
  BellRing,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  RefreshCw,
  Sliders,
  Calendar,
  Lock,
  Smartphone,
  ExternalLink,
  Info,
  X,
  FileText,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Building,
  Compass,
  Sparkles,
  Zap,
  Play,
  Pause,
  Trash2,
  ArrowRight,
  Wallet,
} from "lucide-react";
import {
  manaBillsAutopayService,
  type ManaRecurringBill,
  type PaymentMandate,
  type AdminRecurringInvoiceSchedule,
  type PreDebitNotificationLog,
  type BillCategory,
  type MandateProvider,
  type MandateStatus,
} from "../../../../services/finance/manaBillsAutopayService";
import { showSuccess, showError } from "../../../../utils/ToastUtils";
import { ManaPayUnifiedCheckoutModal } from "../../payments/ManaPayUnifiedCheckoutModal";
import type { PaymentDomainSource } from "../../../../types/payment";

export function BillsAndAutopayDashboard() {
  const [bills, setBills] = useState<ManaRecurringBill[]>([]);
  const [mandates, setMandates] = useState<PaymentMandate[]>([]);
  const [schedules, setSchedules] = useState<AdminRecurringInvoiceSchedule[]>([]);
  const [notifications, setNotifications] = useState<PreDebitNotificationLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState<"bills" | "mandates" | "calendar" | "admin">("bills");

  // Modals
  const [showSetupMandateModal, setShowSetupMandateModal] = useState(false);
  const [targetBillForMandate, setTargetBillForMandate] = useState<ManaRecurringBill | null>(null);

  const [showPayModal, setShowPayModal] = useState(false);
  const [targetBillToPay, setTargetBillToPay] = useState<ManaRecurringBill | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("UPI");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [showPreDebitPreviewModal, setShowPreDebitPreviewModal] = useState(false);
  const [targetNotifPreview, setTargetNotifPreview] = useState<PreDebitNotificationLog | null>(null);

  // Mandate Form State
  const [mandateProvider, setMandateProvider] = useState<MandateProvider>("UPI_AUTOPAY");
  const [mandateAccountRef, setMandateAccountRef] = useState("resident.302@okhdfcbank");
  const [mandateBankName, setMandateBankName] = useState("HDFC Bank");
  const [mandateMaxCap, setMandateMaxCap] = useState(15000);
  const [mandateAuthMethod, setMandateAuthMethod] = useState<"UPI_PIN" | "NET_BANKING_OTP" | "DEBIT_CARD_PIN">("UPI_PIN");
  const [mandateAgreementChecked, setMandateAgreementChecked] = useState(false);
  const [isAuthorizingMandate, setIsAuthorizingMandate] = useState(false);

  // Admin New Schedule Form
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<AdminRecurringInvoiceSchedule>>({
    scheduleName: "",
    billCategory: "MAINTENANCE",
    billingCycleDay: 1,
    dueDays: 10,
    gracePeriodDays: 5,
    lateFeeType: "PERCENTAGE_PER_MONTH",
    lateFeeValue: 2.0,
    lateFeeCap: 5000,
    autoDebitLeadDays: 2,
    preDebitNoticeLeadHours: 48,
    isActive: true,
  });

  const loadData = () => {
    setBills(manaBillsAutopayService.getBills());
    setMandates(manaBillsAutopayService.getMandates());
    setSchedules(manaBillsAutopayService.getSchedules());
    setNotifications(manaBillsAutopayService.getPreDebitNotifications());
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = useMemo(() => {
    return manaBillsAutopayService.getSummaryMetrics();
  }, [bills, mandates]);

  const filteredBills = useMemo(() => {
    if (selectedCategory === "ALL") return bills;
    return bills.filter((b) => b.category === selectedCategory);
  }, [bills, selectedCategory]);

  const urgentBills = useMemo(() => {
    return bills.filter((b) => b.status === "DUE" || b.status === "OVERDUE");
  }, [bills]);

  // Actions
  const handleOpenSetupMandate = (bill?: ManaRecurringBill) => {
    if (bill) {
      setTargetBillForMandate(bill);
      setMandateMaxCap(Math.max(10000, Math.ceil(bill.amount * 1.5)));
    } else {
      setTargetBillForMandate(null);
      setMandateMaxCap(15000);
    }
    setMandateAgreementChecked(false);
    setShowSetupMandateModal(true);
  };

  const handleAuthorizeMandate = () => {
    if (!mandateAgreementChecked) {
      showError("Please acknowledge that explicit authorization is required for autopay mandates.");
      return;
    }
    setIsAuthorizingMandate(true);
    setTimeout(() => {
      try {
        manaBillsAutopayService.authorizeNewMandate({
          billId: targetBillForMandate?.id,
          billCategory: targetBillForMandate ? targetBillForMandate.category : "MAINTENANCE",
          linkedBillTitle: targetBillForMandate ? targetBillForMandate.title : "Community Maintenance Mandate",
          provider: mandateProvider,
          accountRef: mandateAccountRef,
          bankName: mandateBankName,
          maxAmountCap: mandateMaxCap,
          frequency: "MONTHLY",
          authMethod: mandateAuthMethod,
        });
        showSuccess("Payment Mandate authorized & registered with NPCI e-Mandate registry!");
        setIsAuthorizingMandate(false);
        setShowSetupMandateModal(false);
        loadData();
      } catch (err: any) {
        showError(err.message || "Failed to authorize mandate");
        setIsAuthorizingMandate(false);
      }
    }, 1200);
  };

  const handleToggleMandate = (mandateId: string, currentStatus: MandateStatus) => {
    const nextStatus: MandateStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    manaBillsAutopayService.updateMandateStatus(mandateId, nextStatus);
    showSuccess(`Mandate status updated to ${nextStatus}`);
    loadData();
  };

  const handleRevokeMandate = (mandateId: string) => {
    manaBillsAutopayService.updateMandateStatus(mandateId, "REVOKED");
    showSuccess("Mandate successfully cancelled and revoked with your bank!");
    loadData();
  };

  const handleOpenPay = (bill: ManaRecurringBill) => {
    setTargetBillToPay(bill);
    setSelectedPaymentMode("UPI");
    setShowPayModal(true);
  };

  const handleExecutePayment = () => {
    if (!targetBillToPay) return;
    setIsProcessingPayment(true);
    setTimeout(() => {
      manaBillsAutopayService.recordBillPayment(targetBillToPay.id, selectedPaymentMode);
      showSuccess(`Payment of ₹${targetBillToPay.amount.toLocaleString("en-IN")} successful!`);
      setIsProcessingPayment(false);
      setShowPayModal(false);
      loadData();
    }, 1000);
  };

  const handleSendPreDebitNotice = (billId: string) => {
    const notif = manaBillsAutopayService.sendPreDebitNotification(billId);
    if (notif) {
      showSuccess("48-Hour Pre-Debit notification dispatched via Push, WhatsApp & SMS!");
      loadData();
      setTargetNotifPreview(notif);
      setShowPreDebitPreviewModal(true);
    }
  };

  const handleSaveSchedule = () => {
    if (!newSchedule.scheduleName) {
      showError("Please enter schedule name");
      return;
    }
    manaBillsAutopayService.saveAdminSchedule({
      id: `sched-${Date.now()}`,
      scheduleName: newSchedule.scheduleName,
      billCategory: newSchedule.billCategory || "MAINTENANCE",
      billingCycleDay: Number(newSchedule.billingCycleDay) || 1,
      dueDays: Number(newSchedule.dueDays) || 10,
      gracePeriodDays: Number(newSchedule.gracePeriodDays) || 5,
      lateFeeType: newSchedule.lateFeeType || "PERCENTAGE_PER_MONTH",
      lateFeeValue: Number(newSchedule.lateFeeValue) || 2.0,
      lateFeeCap: Number(newSchedule.lateFeeCap) || 5000,
      autoDebitLeadDays: Number(newSchedule.autoDebitLeadDays) || 2,
      preDebitNoticeLeadHours: 48,
      isActive: true,
      totalSubscribers: 120,
      mandatesActiveCount: 78,
    });
    showSuccess("Recurring billing schedule created successfully!");
    setShowAddScheduleModal(false);
    loadData();
  };

  const getCategoryBadge = (cat: BillCategory) => {
    switch (cat) {
      case "MAINTENANCE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Maintenance</span>;
      case "EVENT_INSTALLMENT":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Event Pass</span>;
      case "TRIP_PAYMENT":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Trip Yatra</span>;
      case "FACILITY_MEMBERSHIP":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Facility / EV</span>;
      case "PERSONAL_RECURRING":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Personal (My Money)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Hero ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#EBEFF2] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#E6FAF5] border border-[#A7F3D0] flex items-center justify-center text-[#008767] shadow-sm">
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h4 className="text-xl font-bold text-[#44475B] tracking-tight">Mana Bills & Autopay</h4>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D09C] animate-pulse" />
                  CRED & PhonePe Mode
                </span>
              </div>
              <p className="text-xs text-[#7C7E8C] mt-1">
                Centralized recurring bill manager, pre-debit notifications, grace periods & regulatory NPCI e-Mandates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenSetupMandate()}
              className="flex items-center gap-2 px-4 py-2 bg-[#00D09C] hover:bg-[#00b887] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Zap className="w-4 h-4" />
              Setup Autopay Mandate
            </button>
            <button
              onClick={loadData}
              className="p-2 border border-[#EBEFF2] hover:bg-[#F9FAFC] rounded-xl text-[#7C7E8C] hover:text-[#44475B] transition-all"
              title="Refresh bills"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Regulatory Mandate Guarantee Banner ── */}
        <div className="mt-5 p-3.5 rounded-xl bg-[#F9FAFC] border border-[#EBEFF2] flex items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#44475B]">
            <Lock className="w-4 h-4 text-[#008767] flex-shrink-0" />
            <span>
              <strong>Zero Hidden Debits Policy:</strong> Saved cards & UPI accounts are <em>never</em> automatically debited without an explicit, RBI-compliant authorization mandate with customizable amount caps.
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#008767] bg-[#E6FAF5] px-2 py-0.5 rounded font-semibold whitespace-nowrap">
            RBI & NPCI Compliant
          </span>
        </div>
      </div>

      {/* ── KPI Metrics Strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EBEFF2] rounded-xl p-4 shadow-sm hover:border-[#00D09C]/40 transition-all">
          <div className="flex items-center justify-between text-[#7C7E8C] text-xs">
            <span>Pending Bills</span>
            <div className="w-7 h-7 rounded-lg bg-[#FEEFEF] flex items-center justify-center text-[#EB5B5B]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#44475B] mt-2">₹{metrics.totalDue.toLocaleString("en-IN")}</p>
          <p className="text-[11px] text-[#EB5B5B] mt-1 font-semibold">{metrics.dueCount} active dues requiring action</p>
        </div>

        <div className="bg-white border border-[#EBEFF2] rounded-xl p-4 shadow-sm hover:border-[#00D09C]/40 transition-all">
          <div className="flex items-center justify-between text-[#7C7E8C] text-xs">
            <span>Active Mandates</span>
            <div className="w-7 h-7 rounded-lg bg-[#E6FAF5] flex items-center justify-center text-[#008767]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#44475B] mt-2">{metrics.activeMandatesCount}</p>
          <p className="text-[11px] text-[#008767] mt-1 font-medium">100% on-time guarantee</p>
        </div>

        <div className="bg-white border border-[#EBEFF2] rounded-xl p-4 shadow-sm hover:border-[#00D09C]/40 transition-all">
          <div className="flex items-center justify-between text-[#7C7E8C] text-xs">
            <span>Next Auto-Debit</span>
            <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#44475B] mt-2">
            {metrics.nextAutopayAmount > 0 ? `₹${metrics.nextAutopayAmount.toLocaleString("en-IN")}` : "₹0"}
          </p>
          <p className="text-[11px] text-[#7C7E8C] mt-1 font-medium">
            {metrics.nextAutopayDate ? `Scheduled for ${new Date(metrics.nextAutopayDate).toLocaleDateString()}` : "No upcoming debits"}
          </p>
        </div>

        <div className="bg-white border border-[#EBEFF2] rounded-xl p-4 shadow-sm hover:border-[#00D09C]/40 transition-all">
          <div className="flex items-center justify-between text-[#7C7E8C] text-xs">
            <span>Late Fees Prevented</span>
            <div className="w-7 h-7 rounded-lg bg-[#FFFBEB] flex items-center justify-center text-[#D97706]">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#44475B] mt-2">₹1,450</p>
          <p className="text-[11px] text-[#D97706] mt-1 font-medium">Saved via grace-period autopay</p>
        </div>
      </div>

      {/* ── CRED-Inspired Urgent Due Carousel ──────────────────────────────────── */}
      {urgentBills.length > 0 && (
        <div className="bg-gradient-to-r from-[#1E202C] to-[#2B2D42] text-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00D09C] animate-ping" />
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-300">Upcoming Bill Reminders</h2>
            </div>
            <span className="text-xs text-slate-400">Pre-debit notifications active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {urgentBills.slice(0, 3).map((bill) => (
              <div key={bill.id} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-300">{bill.referenceNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00D09C]/20 text-[#00D09C] border border-[#00D09C]/30">
                      Due in {Math.max(1, Math.ceil((new Date(bill.dueDate).getTime() - Date.now()) / 86400000))}d
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1.5">{bill.title}</h3>
                  <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{bill.subtitle}</p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-white">₹{bill.amount.toLocaleString("en-IN")}</span>
                    <span className="block text-[10px] text-slate-400">Grace till {new Date(bill.gracePeriodEndsAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {bill.hasActiveMandate ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00D09C]/20 text-[#00D09C] text-xs font-bold border border-[#00D09C]/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Autopay ON
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenSetupMandate(bill)}
                        className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all"
                      >
                        Enable Autopay
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenPay(bill)}
                      className="px-3 py-1 rounded-lg bg-[#00D09C] hover:bg-[#00b887] text-white text-xs font-bold transition-all shadow-sm"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Navigation Tabs ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[#EBEFF2] pb-2 overflow-x-auto text-xs">
        {[
          { id: "bills", label: "All Bills & Instalments", icon: CreditCard },
          { id: "mandates", label: "Active Payment Mandates", icon: ShieldCheck },
          { id: "calendar", label: "Pre-Debit Notice Schedule", icon: BellRing },
          { id: "admin", label: "Admin Recurring Billing Engine", icon: Sliders },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] shadow-sm"
                : "text-[#7C7E8C] hover:text-[#44475B] hover:bg-[#F9FAFC]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Bills & Instalments ────────────────────────────────────────── */}
      {activeTab === "bills" && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: "ALL", label: "All Categories" },
              { id: "MAINTENANCE", label: "Society Maintenance" },
              { id: "TRIP_PAYMENT", label: "Trip Instalments" },
              { id: "EVENT_INSTALLMENT", label: "Event Passes" },
              { id: "FACILITY_MEMBERSHIP", label: "Clubhouse & EV" },
              { id: "PERSONAL_RECURRING", label: "Personal (My Money)" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-[#44475B] text-white"
                    : "bg-white border border-[#EBEFF2] text-[#7C7E8C] hover:text-[#44475B]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="bg-white border border-[#EBEFF2] rounded-xl p-5 shadow-sm hover:border-[#00D09C]/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(bill.category)}
                      <span className="text-xs font-mono text-[#7C7E8C]">{bill.referenceNumber}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        bill.status === "PAID"
                          ? "bg-[#E6FAF5] text-[#008767] border-[#A7F3D0]"
                          : bill.status === "OVERDUE"
                          ? "bg-[#FEEFEF] text-[#EB5B5B] border-[#FCA5A5]"
                          : "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#44475B] mt-2">{bill.title}</h3>
                  <p className="text-xs text-[#7C7E8C] mt-0.5">{bill.subtitle}</p>

                  {/* Grace Period & Pre-debit Indicator */}
                  <div className="mt-3 p-2.5 rounded-lg bg-[#F9FAFC] border border-[#EBEFF2] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#7C7E8C] block text-[11px]">Due Date: <strong>{new Date(bill.dueDate).toLocaleDateString()}</strong></span>
                      <span className="text-[#008767] block text-[11px] font-medium">
                        Grace period: {bill.gracePeriodDays} days (until {new Date(bill.gracePeriodEndsAt).toLocaleDateString()})
                      </span>
                    </div>
                    {bill.hasActiveMandate ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#008767] bg-[#E6FAF5] px-2 py-0.5 rounded">
                        <Zap className="w-3 h-3" /> Autopay Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#7C7E8C]">
                        Manual payment
                      </span>
                    )}
                  </div>

                  {/* Charge breakdown if available */}
                  {bill.breakdown && (
                    <div className="mt-3 space-y-1 text-xs">
                      {bill.breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[#7C7E8C]">
                          <span>{item.label}</span>
                          <span className="font-mono text-[#44475B]">₹{item.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#EBEFF2] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#7C7E8C] block">Total Payable</span>
                    <span className="text-xl font-bold text-[#44475B]">₹{bill.amount.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {bill.status !== "PAID" && (
                      <>
                        {!bill.hasActiveMandate && (
                          <button
                            onClick={() => handleOpenSetupMandate(bill)}
                            className="px-3 py-1.5 border border-[#00D09C] hover:bg-[#E6FAF5] text-[#008767] text-xs font-bold rounded-lg transition-all"
                          >
                            Setup Mandate
                          </button>
                        )}
                        {bill.hasActiveMandate && !bill.preDebitNotified && (
                          <button
                            onClick={() => handleSendPreDebitNotice(bill.id)}
                            className="px-2.5 py-1.5 border border-[#EBEFF2] hover:bg-[#F9FAFC] text-[#7C7E8C] text-xs font-semibold rounded-lg transition-all"
                            title="Simulate 48h Pre-Debit notification"
                          >
                            Send Pre-Debit Notice
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenPay(bill)}
                          className="px-4 py-1.5 bg-[#00D09C] hover:bg-[#00b887] text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                        >
                          Pay Now
                        </button>
                      </>
                    )}
                    {bill.status === "PAID" && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-[#008767] bg-[#E6FAF5] px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" /> Paid Successfully
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: Active Mandates ────────────────────────────────────────────── */}
      {activeTab === "mandates" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-[#44475B]">Authorized NPCI e-Mandates Registry</h2>
              <p className="text-xs text-[#7C7E8C]">All mandates require explicit OTP/PIN signing. Revoke or pause anytime.</p>
            </div>
            <button
              onClick={() => handleOpenSetupMandate()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00D09C] hover:bg-[#00b887] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Mandate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mandates.map((m) => (
              <div key={m.id} className="bg-white border border-[#EBEFF2] rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#44475B]">{m.mandateRef}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          m.status === "ACTIVE"
                            ? "bg-[#E6FAF5] text-[#008767] border-[#A7F3D0]"
                            : m.status === "PAUSED"
                            ? "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                            : "bg-[#FEEFEF] text-[#EB5B5B] border-[#FCA5A5]"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#44475B] mt-1">{m.linkedBillTitle || "Recurring Community Dues"}</h3>
                    <p className="text-xs text-[#7C7E8C]">Provider: <strong>{m.provider}</strong> · {m.bankName}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#F9FAFC] border border-[#EBEFF2] text-center">
                    <span className="text-[10px] text-[#7C7E8C] block uppercase">Max Cap</span>
                    <span className="text-sm font-black text-[#44475B]">₹{m.maxAmountCap.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#F9FAFC] rounded-lg border border-[#EBEFF2] space-y-1.5 text-xs text-[#7C7E8C]">
                  <div className="flex justify-between">
                    <span>Account Ref:</span>
                    <strong className="text-[#44475B] font-mono">{m.accountRef}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Auth Method:</span>
                    <span className="text-[#44475B]">{m.authMethod.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Auto-Debit:</span>
                    <span className="text-[#008767] font-semibold">{m.nextDebitScheduled ? new Date(m.nextDebitScheduled).toLocaleDateString() : "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pre-Debit Notice:</span>
                    <span>{m.preDebitNotificationHours}h prior to execution</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EBEFF2] flex items-center justify-between">
                  <span className="text-[11px] text-[#7C7E8C]">Valid until {new Date(m.expiresAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    {m.status !== "REVOKED" && (
                      <button
                        onClick={() => handleToggleMandate(m.id, m.status)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#EBEFF2] hover:bg-[#F9FAFC] text-[#44475B] transition-all flex items-center gap-1"
                      >
                        {m.status === "ACTIVE" ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
                      </button>
                    )}
                    {m.status !== "REVOKED" && (
                      <button
                        onClick={() => handleRevokeMandate(m.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FEEFEF] hover:bg-[#FCDADA] text-[#EB5B5B] border border-[#FCA5A5] transition-all flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Cancel Mandate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: Pre-Debit Calendar & Alerts ────────────────────────────────── */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#EBEFF2] rounded-xl p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-[#44475B] flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#008767]" /> Regulatory 48-Hour Pre-Debit Notifications Log
            </h2>
            <p className="text-xs text-[#7C7E8C]">
              In accordance with recurring payment regulations, customers receive advance notifications 24–48 hours before any auto-debit, complete with an opt-out link.
            </p>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#7C7E8C] text-xs">
                  No pre-debit notifications dispatched yet. Try clicking "Send Pre-Debit Notice" on any due bill.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-4 rounded-xl border border-[#EBEFF2] bg-[#F9FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#44475B]">{n.mandateRef}</span>
                        <span className="text-[10px] bg-[#E6FAF5] text-[#008767] border border-[#A7F3D0] px-1.5 py-0.5 rounded-full font-semibold">
                          {n.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#44475B] mt-1">{n.billTitle}</p>
                      <p className="text-[11px] text-[#7C7E8C]">
                        Sent at {new Date(n.sentAt).toLocaleString()} via {n.channels.join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-[#44475B]">₹{n.amount.toLocaleString("en-IN")}</span>
                      <span className="block text-[11px] text-[#008767]">
                        Scheduled: {new Date(n.scheduledDebitDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Admin Recurring Invoices & Schedules ──────────────────────── */}
      {activeTab === "admin" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-[#44475B]">Admin Recurring Billing & Invoicing Engine</h2>
              <p className="text-xs text-[#7C7E8C]">Configure automated generation cycles, grace periods, and late fee caps.</p>
            </div>
            <button
              onClick={() => setShowAddScheduleModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00D09C] hover:bg-[#00b887] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> New Recurring Cycle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedules.map((s) => (
              <div key={s.id} className="bg-white border border-[#EBEFF2] rounded-xl p-5 space-y-3 shadow-sm hover:border-[#00D09C]/40 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#008767] bg-[#E6FAF5] px-2 py-0.5 rounded">
                      {s.billCategory}
                    </span>
                    <h3 className="text-sm font-bold text-[#44475B] mt-1.5">{s.scheduleName}</h3>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00D09C]" title="Active Schedule" />
                </div>

                <div className="p-3 rounded-lg bg-[#F9FAFC] border border-[#EBEFF2] space-y-1.5 text-xs text-[#7C7E8C]">
                  <div className="flex justify-between">
                    <span>Cycle Run:</span>
                    <strong className="text-[#44475B]">{s.billingCycleDay}st of month</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Window:</span>
                    <span className="text-[#44475B]">{s.dueDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grace Period:</span>
                    <strong className="text-[#008767]">{s.gracePeriodDays} days after due</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Late Fee:</span>
                    <span className="text-[#EB5B5B] font-semibold">
                      {s.lateFeeValue}{s.lateFeeType === "PERCENTAGE_PER_MONTH" ? "% / mo" : " flat"} (Cap: ₹{s.lateFeeCap})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pre-Debit Notice:</span>
                    <span>{s.preDebitNoticeLeadHours}h lead time</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EBEFF2] flex justify-between items-center text-xs">
                  <span className="text-[#7C7E8C]">Subscribers: <strong>{s.totalSubscribers}</strong></span>
                  <span className="text-[#008767] font-semibold">{s.mandatesActiveCount} Autopay Enabled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: Setup Autopay Mandate ─────────────────────────────────────── */}
      {showSetupMandateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EBEFF2] shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-[#EBEFF2]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E6FAF5] flex items-center justify-center text-[#008767]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#44475B]">Authorize Autopay Mandate</h3>
                  <p className="text-xs text-[#7C7E8C]">NPCI e-Mandate Regulatory Registration</p>
                </div>
              </div>
              <button onClick={() => setShowSetupMandateModal(false)} className="text-[#7C7E8C] hover:text-[#44475B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {targetBillForMandate && (
                <div className="p-3 rounded-xl bg-[#F9FAFC] border border-[#EBEFF2]">
                  <span className="text-[#7C7E8C] block">Linking Mandate to Bill:</span>
                  <strong className="text-sm text-[#44475B]">{targetBillForMandate.title}</strong>
                  <span className="text-[#008767] font-mono block mt-0.5">Approx. ₹{targetBillForMandate.amount.toLocaleString("en-IN")} / month</span>
                </div>
              )}

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#44475B] mb-1.5">Mandate Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "UPI_AUTOPAY", label: "UPI Autopay" },
                    { id: "ENACH", label: "eNACH Bank Debit" },
                    { id: "CARD_RECURRING", label: "Debit/Credit Card" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setMandateProvider(p.id as any)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        mandateProvider === p.id
                          ? "border-[#00D09C] bg-[#E6FAF5] text-[#008767]"
                          : "border-[#EBEFF2] bg-[#F9FAFC] text-[#7C7E8C]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Reference */}
              <div>
                <label className="block text-xs font-semibold text-[#44475B] mb-1">
                  {mandateProvider === "UPI_AUTOPAY" ? "Virtual Payment Address (VPA / UPI ID)" : "Bank Account / Card Reference"}
                </label>
                <input
                  type="text"
                  value={mandateAccountRef}
                  onChange={(e) => setMandateAccountRef(e.target.value)}
                  placeholder="e.g. resident@okhdfcbank"
                  className="w-full px-3 py-2 bg-[#F9FAFC] border border-[#EBEFF2] rounded-xl text-xs text-[#44475B] focus:outline-none focus:border-[#00D09C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#44475B] mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={mandateBankName}
                    onChange={(e) => setMandateBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F9FAFC] border border-[#EBEFF2] rounded-xl text-xs text-[#44475B] focus:outline-none focus:border-[#00D09C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#44475B] mb-1">Maximum Debit Cap (₹)</label>
                  <input
                    type="number"
                    value={mandateMaxCap}
                    onChange={(e) => setMandateMaxCap(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F9FAFC] border border-[#EBEFF2] rounded-xl text-xs text-[#44475B] focus:outline-none focus:border-[#00D09C]"
                  />
                </div>
              </div>

              {/* Authorization Method */}
              <div>
                <label className="block text-xs font-semibold text-[#44475B] mb-1">Sign Mandate Using</label>
                <select
                  value={mandateAuthMethod}
                  onChange={(e) => setMandateAuthMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#F9FAFC] border border-[#EBEFF2] rounded-xl text-xs text-[#44475B] focus:outline-none focus:border-[#00D09C]"
                >
                  <option value="UPI_PIN">UPI PIN on Authenticator App (GPay / PhonePe / CRED)</option>
                  <option value="NET_BANKING_OTP">Net Banking OTP Authorization</option>
                  <option value="DEBIT_CARD_PIN">Debit Card PIN + 3D Secure</option>
                </select>
              </div>

              {/* Regulatory Notice & Agreement Checkbox */}
              <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-2 text-[#D97706]">
                <input
                  type="checkbox"
                  id="agreeMandate"
                  checked={mandateAgreementChecked}
                  onChange={(e) => setMandateAgreementChecked(e.target.checked)}
                  className="mt-0.5 rounded text-[#00D09C] focus:ring-[#00D09C]"
                />
                <label htmlFor="agreeMandate" className="text-[11px] cursor-pointer">
                  I explicitly authorize Mana Community to register this mandate with my bank. I will receive a 48-hour pre-debit alert before each cycle with full authority to pause or skip.
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EBEFF2]">
              <button
                type="button"
                onClick={() => setShowSetupMandateModal(false)}
                className="px-4 py-2 border border-[#EBEFF2] text-xs font-semibold text-[#7C7E8C] hover:text-[#44475B] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAuthorizeMandate}
                disabled={isAuthorizingMandate}
                className="px-5 py-2 bg-[#00D09C] hover:bg-[#00b887] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                {isAuthorizingMandate ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying with NPCI...
                  </>
                ) : (
                  <>Authorize Mandate <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Mana Pay Shared Infrastructure Checkout ──────────────────── */}
      {showPayModal && targetBillToPay && (
        <ManaPayUnifiedCheckoutModal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          domainSource={(targetBillToPay.category === "PERSONAL_RECURRING" ? "MY_MONEY" : targetBillToPay.category === "TRIP_PAYMENT" ? "MANA_TRIPS" : "COMMUNITY_FINANCE") as PaymentDomainSource}
          referenceType={targetBillToPay.category === "MAINTENANCE" ? "MAINTENANCE_BILL" : targetBillToPay.category === "TRIP_PAYMENT" ? "TRIP_BOOKING" : "OTHER"}
          referenceId={targetBillToPay.id}
          title={targetBillToPay.title}
          subtitle={`Ref #${targetBillToPay.referenceNumber} · Due: ${new Date(targetBillToPay.dueDate).toLocaleDateString()}`}
          amount={targetBillToPay.amount}
          onPaymentSuccess={(confirmedOrder) => {
            manaBillsAutopayService.recordBillPayment(targetBillToPay.id, (confirmedOrder as any).paymentMethod || "UPI");
            showSuccess(`Payment of ₹${targetBillToPay.amount.toLocaleString("en-IN")} confirmed via Mana Pay!`);
            setShowPayModal(false);
            loadData();
          }}
        />
      )}

      {/* ── MODAL: Pre-Debit Notice Preview ─────────────────────────────────── */}
      {showPreDebitPreviewModal && targetNotifPreview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EBEFF2] shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-[#EBEFF2]">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-[#008767]" />
                <h3 className="text-base font-bold text-[#44475B]">Pre-Debit Notice Dispatched</h3>
              </div>
              <button onClick={() => setShowPreDebitPreviewModal(false)} className="text-[#7C7E8C] hover:text-[#44475B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#F9FAFC] border border-[#EBEFF2] space-y-2 text-xs">
              <span className="text-[10px] font-mono text-[#7C7E8C] uppercase tracking-wider">SMS / Push Alert Simulation</span>
              <p className="text-[#44475B] leading-relaxed">
                "Dear Resident, your account mandate <strong>{targetNotifPreview.mandateRef}</strong> will be debited for <strong>₹{targetNotifPreview.amount.toLocaleString("en-IN")}</strong> towards <strong>{targetNotifPreview.billTitle}</strong> on <strong>{new Date(targetNotifPreview.scheduledDebitDate).toLocaleDateString()}</strong>. If you wish to pause or skip this cycle, click here: <span className="text-[#008767] underline">mana.app/mandate/optout</span>"
              </p>
            </div>

            <p className="text-[11px] text-[#7C7E8C]">
              Dispatched through channels: <strong>{targetNotifPreview.channels.join(", ")}</strong>
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPreDebitPreviewModal(false)}
                className="px-4 py-2 bg-[#00D09C] text-white text-xs font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Admin Add Recurring Schedule ─────────────────────────────── */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#EBEFF2] shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-[#EBEFF2]">
              <h3 className="text-base font-bold text-[#44475B]">Create Recurring Invoice Schedule</h3>
              <button onClick={() => setShowAddScheduleModal(false)} className="text-[#7C7E8C] hover:text-[#44475B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#44475B] mb-1">Schedule Name</label>
                <input
                  type="text"
                  value={newSchedule.scheduleName}
                  onChange={(e) => setNewSchedule({ ...newSchedule, scheduleName: e.target.value })}
                  placeholder="e.g. Badminton Court Maintenance Fee"
                  className="w-full px-3 py-2 bg-[#F9FAFC] border border-[#EBEFF2] rounded-xl text-xs text-[#44475B] focus:outline-none focus:border-[#00D09C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#44475B] mb-1">Category</label>
                  <select
                    value={newSchedule.billCategory}
                    onChange={(e) => setNewSchedule({ ...newSchedule, billCategory: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#F9FAFC] border border-[#EBEFF2] rounded-xl text-xs text-[#44475B]"
                  >
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="FACILITY_MEMBERSHIP">Facility Membership</option>
                    <option value="EVENT_INSTALLMENT">Event Pass</option>
                    <option value="TRIP_PAYMENT">Trip Payment</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#44475B] mb-1">Cycle Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={newSchedule.billingCycleDay}
                    onChange={(e) => setNewSchedule({ ...newSchedule, billingCycleDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F9FAFC] border border-[#EBEFF2] rounded-xl text-xs text-[#44475B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#44475B] mb-1">Due Window (Days)</label>
                  <input
                    type="number"
                    value={newSchedule.dueDays}
                    onChange={(e) => setNewSchedule({ ...newSchedule, dueDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F9FAFC] border border-[#EBEFF2] rounded-xl text-xs text-[#44475B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#44475B] mb-1">Grace Period (Days)</label>
                  <input
                    type="number"
                    value={newSchedule.gracePeriodDays}
                    onChange={(e) => setNewSchedule({ ...newSchedule, gracePeriodDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F9FAFC] border border-[#EBEFF2] rounded-xl text-xs text-[#44475B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#44475B] mb-1">Late Fee Rate (% or Flat ₹)</label>
                  <input
                    type="number"
                    value={newSchedule.lateFeeValue}
                    onChange={(e) => setNewSchedule({ ...newSchedule, lateFeeValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F9FAFC] border border-[#EBEFF2] rounded-xl text-xs text-[#44475B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#44475B] mb-1">Late Fee Cap (₹)</label>
                  <input
                    type="number"
                    value={newSchedule.lateFeeCap}
                    onChange={(e) => setNewSchedule({ ...newSchedule, lateFeeCap: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F9FAFC] border border-[#EBEFF2] rounded-xl text-xs text-[#44475B]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EBEFF2]">
              <button
                type="button"
                onClick={() => setShowAddScheduleModal(false)}
                className="px-4 py-2 border border-[#EBEFF2] text-xs font-semibold text-[#7C7E8C] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-5 py-2 bg-[#00D09C] hover:bg-[#00b887] text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

