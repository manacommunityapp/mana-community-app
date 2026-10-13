import React, { useState, useEffect } from "react";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Plus,
  QrCode,
  Building,
  User,
  Users,
  ChevronRight,
  Calculator,
  Search,
  ExternalLink,
  HelpCircle,
  FileUp,
  Stethoscope,
  Activity,
  HeartPulse,
  Pill,
  Eye,
  Calendar
} from "lucide-react";
import type {
  HealthBenefitWalletDto,
  HealthcareClaimDto,
  BenefitCategoryKey,
  CashlessPreAuthDto
} from "../../../types/health";
import { healthService } from "../../../services/healthService";
import { SubmitBenefitClaimModal } from "./SubmitBenefitClaimModal";
import { CashlessHealthPassModal } from "./CashlessHealthPassModal";

const CATEGORY_ICONS: Record<BenefitCategoryKey, React.ReactNode> = {
  CONSULTATIONS: <Stethoscope className="w-5 h-5 text-blue-600" />,
  DIAGNOSTICS: <Activity className="w-5 h-5 text-indigo-600" />,
  HEALTH_CAMPS: <HeartPulse className="w-5 h-5 text-emerald-600" />,
  PHARMACY: <Pill className="w-5 h-5 text-amber-600" />,
  DENTAL_VISION: <Eye className="w-5 h-5 text-teal-600" />
};

export const HealthcareBenefitsWalletView: React.FC = () => {
  const [wallet, setWallet] = useState<HealthBenefitWalletDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [preselectedCategory, setPreselectedCategory] = useState<BenefitCategoryKey>("CONSULTATIONS");
  const [activePreAuthModal, setActivePreAuthModal] = useState<CashlessPreAuthDto | null>(null);

  // Quick Pre-auth request generator modal
  const [showPreAuthRequestModal, setShowPreAuthRequestModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [selectedPreAuthCategory, setSelectedPreAuthCategory] = useState<BenefitCategoryKey>("CONSULTATIONS");
  const [selectedNetworkProvider, setSelectedNetworkProvider] = useState("Mana Community Health & Wellness Center");

  // Co-Pay Estimator interactive widget state
  const [calcCategory, setCalcCategory] = useState<BenefitCategoryKey>("CONSULTATIONS");
  const [calcBillAmount, setCalcBillAmount] = useState<number>(1200);
  const [calcIsNetwork, setCalcIsNetwork] = useState<boolean>(true);
  const [calcResult, setCalcResult] = useState<{
    billAmount: number;
    categoryAllowanceRemaining: number;
    coPayPercent: number;
    coPayAmount: number;
    approvedBenefitAmount: number;
    patientOutOfPocket: number;
  } | null>(null);

  // Claim timeline drawer state
  const [selectedClaimForDetail, setSelectedClaimForDetail] = useState<HealthcareClaimDto | null>(null);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const data = await healthService.getBenefitWallet();
      setWallet(data);
      if (data.program.coveredMembers.length > 0) {
        setSelectedBeneficiary(data.program.coveredMembers[0].name);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  // Update calculator preview when inputs change
  useEffect(() => {
    if (!wallet) return;
    healthService
      .calculateCoPayEstimate({
        category: calcCategory,
        billAmount: calcBillAmount || 0,
        isNetworkPartner: calcIsNetwork
      })
      .then(res => setCalcResult(res));
  }, [wallet, calcCategory, calcBillAmount, calcIsNetwork]);

  const handleClaimSubmitted = (newClaim: HealthcareClaimDto) => {
    loadWallet();
    setSelectedClaimForDetail(newClaim);
  };

  const handleGeneratePreAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;

    const catObj = wallet.categories.find(c => c.category === selectedPreAuthCategory);
    const cap = catObj ? catObj.remainingAllowance : 1000;

    const preAuth = await healthService.requestCashlessPreAuth({
      beneficiaryName: selectedBeneficiary || wallet.program.coveredMembers[0]?.name || "Resident",
      category: selectedPreAuthCategory,
      networkProviderName: selectedNetworkProvider,
      providerAddress: "Bangalore Network Cluster (Verified Provider)",
      requestedCap: Math.max(500, cap)
    });

    setShowPreAuthRequestModal(false);
    await loadWallet();
    setActivePreAuthModal(preAuth);
  };

  if (loading || !wallet) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading Healthcare Benefits & Entitlements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. MediBuddy-style Top Digital Benefits Card & Program Sponsor */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-400/20 text-blue-300 border border-blue-400/40 text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Healthcare Benefits Wallet
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                Active Tier-1 Entitlement
              </span>
              <span className="text-white/60 text-xs">
                (Non-Stored Fiat • Healthcare Allowance Ledger)
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {wallet.program.planName}
            </h2>

            <p className="text-xs sm:text-sm text-blue-200/90 max-w-2xl font-medium">
              Sponsored by <strong className="text-white">{wallet.program.sponsorName}</strong>. Enjoy cashless consultations, subsidized diagnostic packages, and direct reimbursement claims.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-blue-200/70 font-mono">
              <div>
                <span className="text-white/50 block text-[10px] uppercase font-sans">Policy ID</span>
                <span className="font-bold text-white">{wallet.program.policyNumber}</span>
              </div>
              <div className="h-6 w-px bg-white/20 hidden sm:block" />
              <div>
                <span className="text-white/50 block text-[10px] uppercase font-sans">Valid Through</span>
                <span className="font-bold text-white">{wallet.program.validUntil}</span>
              </div>
              <div className="h-6 w-px bg-white/20 hidden sm:block" />
              <div>
                <span className="text-white/50 block text-[10px] uppercase font-sans">Covered Dependents</span>
                <span className="font-bold text-white">{wallet.program.coveredMembers.length} Family Members</span>
              </div>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowPreAuthRequestModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              Generate Cashless Pass
            </button>
            <button
              onClick={() => {
                setPreselectedCategory("CONSULTATIONS");
                setShowClaimModal(true);
              }}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2"
            >
              <FileUp className="w-4 h-4 text-blue-300" />
              File Reimbursement Claim
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Annual Allowance</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900">₹{wallet.communityAllowance}</div>
          <p className="text-[11px] text-teal-700 font-medium mt-1">
            Community + Sponsor pool quota
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Utilized Allowance</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">₹{wallet.usedAllowance}</div>
          <p className="text-[11px] text-gray-500 font-medium mt-1">
            {wallet.recentClaims.length} claims & camp passes utilized
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Remaining Balance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">₹{wallet.remainingAllowance}</div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            Ready for instant pre-auth or claims
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Covered Family</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-900">{wallet.program.coveredMembers.length} Members</div>
          <p className="text-[11px] text-purple-700 font-medium mt-1">
            Primary member + 3 dependents
          </p>
        </div>
      </div>

      {/* 3. Category Allowances & Co-Pay Matrix */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-gray-900">
              Categorized Benefit Allowances & Co-Pay Structure
            </h3>
            <p className="text-xs text-gray-500">
              Dedicated caps for consultations, diagnostics, society health drives, and medications.
            </p>
          </div>
          <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full border border-blue-200">
            Auto-reset on 31 Dec
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {wallet.categories.map(cat => {
            const pctUsed = Math.min(100, Math.round((cat.usedAllowance / cat.totalAllowance) * 100));
            return (
              <div
                key={cat.category}
                className="bg-gray-50/60 rounded-2xl border border-gray-200/80 p-5 flex flex-col justify-between hover:border-blue-300 transition group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-gray-100 flex items-center justify-center">
                        {CATEGORY_ICONS[cat.category]}
                      </div>
                      <span className="font-extrabold text-sm text-gray-900">{cat.label}</span>
                    </div>
                    {cat.cashlessSupported ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        Cashless
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        Reimburse
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed min-h-[36px]">
                    {cat.description}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Used: ₹{cat.usedAllowance}</span>
                      <span className="font-extrabold text-emerald-700">Rem: ₹{cat.remainingAllowance}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pctUsed > 80 ? "bg-amber-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${pctUsed}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>Total Cap: ₹{cat.totalAllowance}</span>
                      <span>Co-Pay: {cat.coPayPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-4 mt-3 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setPreselectedCategory(cat.category);
                      setShowClaimModal(true);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
                  >
                    + Claim Reimbursement
                  </button>
                  {cat.cashlessSupported && (
                    <button
                      onClick={() => {
                        setSelectedPreAuthCategory(cat.category);
                        setShowPreAuthRequestModal(true);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition flex items-center gap-1"
                    >
                      Cashless Pass <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Co-Pay & Out-of-Pocket Estimator Calculator */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white p-6 sm:p-8 rounded-3xl border border-indigo-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">
              Co-Pay & Out-of-Pocket Estimator
            </h3>
            <p className="text-xs text-gray-600">
              Simulate any doctor consultation, lab checkup, or medicine bill to preview your wallet coverage.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Controls */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Category
              </label>
              <select
                value={calcCategory}
                onChange={e => setCalcCategory(e.target.value as BenefitCategoryKey)}
                className="w-full bg-white border border-gray-200 text-gray-900 text-xs rounded-xl px-3 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {wallet.categories.map(c => (
                  <option key={c.category} value={c.category}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Estimated Bill (₹)
              </label>
              <input
                type="number"
                min="100"
                step="50"
                value={calcBillAmount}
                onChange={e => setCalcBillAmount(Number(e.target.value))}
                className="w-full bg-white border border-gray-200 text-gray-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Provider Type
              </label>
              <div className="flex bg-white rounded-xl border border-gray-200 p-1">
                <button
                  type="button"
                  onClick={() => setCalcIsNetwork(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    calcIsNetwork ? "bg-indigo-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Network Clinic
                </button>
                <button
                  type="button"
                  onClick={() => setCalcIsNetwork(false)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    !calcIsNetwork ? "bg-indigo-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Non-Network
                </button>
              </div>
            </div>
          </div>

          {/* Result Card */}
          {calcResult && (
            <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-3">
              <span className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider block">
                Estimated Breakdown
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Gross Bill:</span>
                  <span className="font-bold text-gray-900">₹{calcResult.billAmount}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Co-Pay ({calcResult.coPayPercent}%):</span>
                  <span className="font-bold text-amber-700">₹{calcResult.coPayAmount}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-1.5 text-emerald-700 font-extrabold">
                  <span>Covered by Wallet:</span>
                  <span className="text-sm">₹{calcResult.approvedBenefitAmount}</span>
                </div>
                <div className="flex justify-between text-purple-800 font-bold">
                  <span>Your Out-of-Pocket:</span>
                  <span>₹{calcResult.patientOutOfPocket}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400">
                Category allowance remaining: ₹{calcResult.categoryAllowanceRemaining}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Active Cashless Pre-Authorizations */}
      {wallet.activePreAuthorizations && wallet.activePreAuthorizations.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                Active Cashless Pre-Authorization Passes
              </h3>
              <p className="text-xs text-gray-500">
                Show these passes at reception desks for instant cashless check-in without paying up front.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wallet.activePreAuthorizations.map(auth => (
              <div
                key={auth.preAuthId}
                className="bg-gradient-to-r from-emerald-50/70 to-teal-50/50 rounded-2xl border border-emerald-200 p-5 flex justify-between items-center"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-900 font-mono">
                      {auth.approvalCode}
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded">
                      ₹{auth.eligibleCashlessCap} Cap
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">{auth.beneficiaryName}</h4>
                  <p className="text-xs text-gray-600">{auth.networkProviderName}</p>
                  <p className="text-[11px] text-gray-400">Valid until {auth.validUntil}</p>
                </div>
                <button
                  onClick={() => setActivePreAuthModal(auth)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
                >
                  <QrCode className="w-3.5 h-3.5" /> View Pass
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Recent Claims & Live Status Timeline Tracker */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-gray-900">
              Recent Benefit Claims & Direct Reimbursements
            </h3>
            <p className="text-xs text-gray-500">
              Audited lifecycle from submission through document verification, approval, and settlement.
            </p>
          </div>
          <button
            onClick={() => {
              setPreselectedCategory("CONSULTATIONS");
              setShowClaimModal(true);
            }}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> File New Claim
          </button>
        </div>

        <div className="space-y-4">
          {wallet.recentClaims.map(claim => {
            const isSelected = selectedClaimForDetail?.id === claim.id;
            return (
              <div
                key={claim.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-blue-50/40 border-blue-300 shadow-sm"
                    : "bg-gray-50/50 border-gray-200/80 hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 font-mono">
                        {claim.claimNumber}
                      </span>
                      <span className="text-[10px] bg-white border border-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded">
                        {claim.category}
                      </span>
                      <span className="text-xs text-gray-500">• {claim.submittedAt}</span>
                    </div>

                    <h4 className="font-extrabold text-base text-gray-900">
                      {claim.serviceName}
                    </h4>

                    <p className="text-xs text-gray-600">
                      Patient: <strong className="text-gray-900">{claim.patientName}</strong> ({claim.patientRelationship}) • Provider: {claim.providerName}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-lg font-black text-gray-900">₹{claim.billAmount}</div>
                    <div className="flex items-center gap-1.5 sm:justify-end mt-1">
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          claim.status === "SETTLED"
                            ? "bg-emerald-100 text-emerald-800"
                            : claim.status === "APPROVED"
                            ? "bg-blue-100 text-blue-800"
                            : claim.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>
                    {claim.approvedAmount > 0 && (
                      <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold">
                        Approved: ₹{claim.approvedAmount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Timeline Bar */}
                <div className="mt-4 pt-4 border-t border-gray-200/60">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-gray-700 text-[11px]">Audit & Settlement Pipeline</span>
                    <button
                      onClick={() =>
                        setSelectedClaimForDetail(isSelected ? null : claim)
                      }
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                    >
                      {isSelected ? "Hide Details" : "View Attachments & Timeline"}
                    </button>
                  </div>

                  {/* Multi-stage Progress Stepper */}
                  <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                    {[
                      { key: "SUBMITTED", label: "Submitted" },
                      { key: "DOCS_VERIFIED", label: "Docs Verified" },
                      { key: "APPROVED", label: "Approved" },
                      { key: "SETTLED", label: "Settled" }
                    ].map((step, idx) => {
                      const stages = ["SUBMITTED", "DOCS_VERIFIED", "APPROVED", "SETTLED"];
                      const currentIdx = stages.indexOf(claim.status);
                      const isComplete = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;

                      return (
                        <div key={step.key} className="space-y-1">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isComplete ? "bg-emerald-500" : "bg-gray-200"
                            }`}
                          />
                          <span
                            className={`text-[10px] block truncate font-bold ${
                              isCurrent
                                ? "text-emerald-700"
                                : isComplete
                                ? "text-gray-700"
                                : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expanded Timeline & Documents Drawer */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-dashed border-gray-200 space-y-4 animate-in fade-in duration-150">
                    {/* Supporting Documents */}
                    <div>
                      <h5 className="text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" /> Attached Claim Receipts & Prescriptions
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {claim.documents.map(doc => (
                          <div
                            key={doc.id}
                            className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs flex items-center gap-2 shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-gray-500" />
                            <span className="font-semibold text-gray-800">{doc.name}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                              {doc.documentType}
                            </span>
                            <span className="text-gray-400 text-[10px]">({doc.fileSize})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline History */}
                    <div>
                      <h5 className="text-xs font-bold text-gray-700 uppercase mb-2">Audit Trail Log</h5>
                      <div className="space-y-2 bg-white p-3 rounded-xl border border-gray-200 text-xs">
                        {claim.timeline.map((evt, eIdx) => (
                          <div key={eIdx} className="flex items-start gap-2 text-gray-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-gray-900">{evt.title}</strong>
                              <span className="text-gray-400 text-[11px] ml-2 font-mono">
                                {evt.timestamp}
                              </span>
                              {evt.notes && (
                                <p className="text-[11px] text-gray-500 mt-0.5">{evt.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {claim.payoutReference && (
                          <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-emerald-800 font-mono">
                            Bank Settlement UTR: {claim.payoutReference}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Pre-Auth Generator Modal */}
      {showPreAuthRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-5 text-white">
              <h3 className="font-black text-lg text-white">Request Cashless Pre-Auth Pass</h3>
              <p className="text-emerald-100 text-xs mt-0.5">
                Instant digital credit pass for network hospitals and diagnostic partners.
              </p>
            </div>
            <form onSubmit={handleGeneratePreAuth} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Beneficiary Member
                </label>
                <select
                  value={selectedBeneficiary}
                  onChange={e => setSelectedBeneficiary(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl p-2.5 focus:bg-white"
                >
                  {wallet.program.coveredMembers.map(m => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.relation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Service Category
                </label>
                <select
                  value={selectedPreAuthCategory}
                  onChange={e => setSelectedPreAuthCategory(e.target.value as BenefitCategoryKey)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl p-2.5 focus:bg-white"
                >
                  {wallet.categories
                    .filter(c => c.cashlessSupported)
                    .map(c => (
                      <option key={c.category} value={c.category}>
                        {c.label} (Remaining: ₹{c.remainingAllowance})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Network Healthcare Provider
                </label>
                <select
                  value={selectedNetworkProvider}
                  onChange={e => setSelectedNetworkProvider(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs rounded-xl p-2.5 focus:bg-white"
                >
                  <option value="Mana Community Health & Wellness Center (Dr. Rajesh Kumar)">
                    Mana Community Health & Wellness Center (Dr. Rajesh Kumar)
                  </option>
                  <option value="Apollo Clinic & Diagnostics (Bellandur Network)">
                    Apollo Clinic & Diagnostics (Bellandur Network)
                  </option>
                  <option value="Redcliffe Labs & Pathology Center">
                    Redcliffe Labs & Pathology Center
                  </option>
                  <option value="Manipal Hospital OPD TPA Desk">
                    Manipal Hospital OPD TPA Desk
                  </option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                Guaranteed cashless allowance will be deducted from your category balance upon admission.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPreAuthRequestModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs"
                >
                  Issue Digital Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reimbursement Claim Modal */}
      {showClaimModal && (
        <SubmitBenefitClaimModal
          wallet={wallet}
          onClose={() => setShowClaimModal(false)}
          onClaimSubmitted={handleClaimSubmitted}
          preselectedCategory={preselectedCategory}
        />
      )}

      {/* Cashless Pass Modal */}
      {activePreAuthModal && (
        <CashlessHealthPassModal
          preAuth={activePreAuthModal}
          program={wallet.program}
          onClose={() => setActivePreAuthModal(null)}
        />
      )}
    </div>
  );
};
