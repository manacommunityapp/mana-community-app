import { useState, useMemo, useEffect } from "react";
import {
  Smartphone,
  Search,
  Users,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Filter,
  Sparkles,
  Phone,
  Flame,
  ArrowRight,
  UserCheck,
  X,
  CreditCard,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import {
  rechargeService,
  OPERATORS,
  CIRCLES,
  COMMUNITY_CONTACTS,
  type MobileOperator,
  type RechargePlan,
  type SavedContact,
  type RechargeType,
} from "../../../services/recharge/rechargeService";

export function MobileRechargeHub() {
  const [rechargeType, setRechargeType] = useState<RechargeType>("PREPAID");
  const [mobileNumber, setMobileNumber] = useState("");
  const [selectedOperator, setSelectedOperator] = useState<string>("AIRTEL");
  const [selectedCircle, setSelectedCircle] = useState<string>("Karnataka");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Contact book modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactFilter, setContactFilter] = useState<"all" | "household" | "staff" | "community">("all");
  const [contactSearch, setContactSearch] = useState("");

  // Checkout modal state
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);

  // Auto detect operator on 10 digits
  useEffect(() => {
    const cleaned = mobileNumber.replace(/\D/g, "");
    if (cleaned.length === 10) {
      rechargeService.detectOperator(cleaned).then((res) => {
        setSelectedOperator(res.operatorId);
        setSelectedCircle(res.circle);
        toast.info(`Operator detected: ${res.operatorId} (${res.circle})`);
      });
    }
  }, [mobileNumber]);

  // Load plans whenever operator or circle changes
  useEffect(() => {
    setLoadingPlans(true);
    rechargeService
      .getPlans(selectedOperator, selectedCircle)
      .then((data) => {
        setPlans(data);
      })
      .finally(() => setLoadingPlans(false));
  }, [selectedOperator, selectedCircle]);

  // Filter plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (activeCategory !== "ALL" && p.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.price.toString().includes(q) ||
          p.validity.toLowerCase().includes(q) ||
          p.data.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [plans, activeCategory, searchQuery]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return COMMUNITY_CONTACTS.filter((c) => {
      if (contactFilter !== "all" && c.category !== contactFilter) return false;
      if (contactSearch.trim()) {
        const q = contactSearch.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.relation.toLowerCase().includes(q) ||
          c.number.includes(q)
        );
      }
      return true;
    });
  }, [contactFilter, contactSearch]);

  const selectContact = (c: SavedContact) => {
    setMobileNumber(c.number);
    setSelectedOperator(c.operatorId);
    setSelectedCircle(c.circle);
    setIsContactModalOpen(false);
    toast.success(`Selected ${c.name} (${c.relation})`);
  };

  const handlePay = async () => {
    if (!selectedPlan) return;
    if (mobileNumber.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsProcessing(true);
    try {
      await rechargeService.initiateRecharge({
        mobileNumber,
        operatorId: selectedOperator,
        circle: selectedCircle,
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        rechargeType,
      });
      setIsProcessing(false);
      setRechargeSuccess(true);
      toast.success(`Recharge of ₹${selectedPlan.price} initiated successfully!`);
    } catch {
      setIsProcessing(false);
      toast.error("Recharge request failed. Please try again.");
    }
  };

  const currentOp = OPERATORS.find((o) => o.id === selectedOperator) || OPERATORS[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-md border border-blue-400/30">
              <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              Mana Pay · Instant Telecom Gateway
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Mobile Recharge &amp; Plans
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Zero surcharge prepaid and postpaid recharges. Top up your family, domestic help, or society guard SIM cards with instant cashback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition-all shadow-md cursor-pointer hover:scale-105"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              Community &amp; Staff Book
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {COMMUNITY_CONTACTS.length}
              </span>
            </button>
          </div>
        </div>

        {/* Decorative background blurbs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Expiry Alert Highlights ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {COMMUNITY_CONTACTS.filter((c) => c.expiryDays <= 3).map((c) => (
          <div
            key={c.id}
            onClick={() => selectContact(c)}
            className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
                {c.expiryDays <= 0 ? "⚠️" : "⏳"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 truncate">{c.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      c.expiryDays < 0
                        ? "bg-rose-100 text-rose-700"
                        : c.expiryDays === 0
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {c.expiryDays < 0
                      ? "Expired"
                      : c.expiryDays === 0
                      ? "Expires Today"
                      : `${c.expiryDays}d left`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">{c.relation} · {c.number}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        ))}
      </div>

      {/* ── Main Input Card & Operator Selector ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-1 space-y-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          {/* Prepaid vs Postpaid */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {(["PREPAID", "POSTPAID"] as RechargeType[]).map((type) => (
              <button
                key={type}
                onClick={() => setRechargeType(type)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  rechargeType === type
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {type === "PREPAID" ? "Prepaid SIM" : "Postpaid Bill"}
              </button>
            ))}
          </div>

          {/* Mobile Number Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Mobile Number</span>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="text-xs text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Users className="w-3 h-3" /> Select Contact
              </button>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                +91
              </div>
              <input
                type="tel"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 10-digit number"
                className="w-full pl-12 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-semibold text-slate-800 transition-all"
              />
              {mobileNumber.length === 10 && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Operator Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Select Operator</label>
            <div className="grid grid-cols-2 gap-2">
              {OPERATORS.map((op) => {
                const isSelected = selectedOperator === op.id;
                return (
                  <button
                    key={op.id}
                    onClick={() => setSelectedOperator(op.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-100"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base">{op.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-tight truncate">{op.shortName}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">4G / 5G</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Circle Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Telecom Circle</label>
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-medium text-slate-800 bg-white cursor-pointer"
            >
              {CIRCLES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Perks info */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-indigo-700 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Society Cashback Benefit</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Every recharge contributes 1.5% to your flat's maintenance wallet or community festival kitty.
            </p>
          </div>
        </div>

        {/* Right Column: Plans Catalogue */}
        <div className="lg:col-span-2 space-y-4">
          {/* Categories & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
              {[
                { id: "ALL", label: "All Plans" },
                { id: "POPULAR", label: "Popular" },
                { id: "UNLIMITED", label: "Unlimited 5G" },
                { id: "DATA", label: "Data Booster" },
                { id: "VALIDITY", label: "Validity" },
                { id: "TOPUP", label: "Top-Up" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Plan search input */}
            <div className="relative sm:w-56 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ₹, GB or days"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Plans Grid */}
          {loadingPlans ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Loading {currentOp.name} plans...
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
              <p className="font-bold text-sm">No plans found</p>
              <p className="text-xs text-slate-400">Try adjusting your category or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between gap-3 relative group"
                >
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {plan.isBestSeller && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-600" /> Best Seller
                        </span>
                      )}
                      {plan.isRecommended && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Recommended
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {plan.category}
                    </span>
                  </div>

                  {/* Pricing and Details */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900">₹{plan.price}</span>
                      <span className="text-xs text-slate-500 ml-1 font-medium">/ pack</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {plan.validity}
                    </span>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-[11px]">
                    <div>
                      <p className="text-slate-400 text-[10px]">Data</p>
                      <p className="font-bold text-slate-800">{plan.data}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">Calls</p>
                      <p className="font-bold text-slate-800">{plan.calls}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">SMS</p>
                      <p className="font-bold text-slate-800">{plan.sms}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">{plan.description}</p>

                  <button
                    onClick={() => {
                      if (!mobileNumber) {
                        toast.error("Please enter a mobile number first");
                        return;
                      }
                      setSelectedPlan(plan);
                    }}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Recharge ₹{plan.price}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Community & Staff Contacts Modal ── */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Community &amp; Staff Contacts</h3>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: "all", label: "All Contacts" },
                { id: "household", label: "Family" },
                { id: "staff", label: "Domestic Staff" },
                { id: "community", label: "Security & RWA" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setContactFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    contactFilter === tab.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search contacts */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search by name, relation or phone..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* Contacts List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredContacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => selectContact(c)}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 shrink-0">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{c.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                          {c.operatorId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{c.relation} · {c.number}</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.currentPlan}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      c.expiryDays < 0
                        ? "bg-rose-100 text-rose-700"
                        : c.expiryDays <= 3
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {c.expiryDays < 0
                      ? "Expired"
                      : c.expiryDays === 0
                      ? "Due Today"
                      : `${c.expiryDays}d left`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Checkout / Confirmation Modal ── */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {!rechargeSuccess ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-900">Recharge Summary</h3>
                  </div>
                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Mobile Number:</span>
                    <span className="font-bold text-slate-800">+91 {mobileNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Operator &amp; Circle:</span>
                    <span className="font-bold text-slate-800">{selectedOperator} · {selectedCircle}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Pack Validity:</span>
                    <span className="font-bold text-slate-800">{selectedPlan.validity}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Data Benefit:</span>
                    <span className="font-bold text-slate-800">{selectedPlan.data}</span>
                  </div>
                  <div className="pt-2 border-t border-indigo-100 flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">Payable Amount:</span>
                    <span className="text-xl font-black text-indigo-600">₹{selectedPlan.price}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">Payment Method</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-indigo-600 bg-indigo-50/50 font-bold text-indigo-700 cursor-pointer">
                      <QrCode className="w-4 h-4" /> UPI Instant
                    </button>
                    <button className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 cursor-pointer">
                      <CreditCard className="w-4 h-4" /> Debit / Netbank
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Confirm &amp; Pay ₹{selectedPlan.price}
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Recharge Successful!</h3>
                  <p className="text-xs text-slate-500">
                    ₹{selectedPlan.price} pack activated for +91 {mobileNumber}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction ID:</span>
                    <span className="font-mono font-bold text-slate-700">TXN{Date.now().toString().slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Society Cashback:</span>
                    <span className="font-bold text-emerald-600">+₹{Math.round(selectedPlan.price * 0.02)} added</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setRechargeSuccess(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
