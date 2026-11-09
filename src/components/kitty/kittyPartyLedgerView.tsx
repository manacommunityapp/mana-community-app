import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { kittyPartyService } from "../../services/kittyPartyService";
import type {
  KittyPartyCycle,
  KittyPartyContribution,
  KittyPartyCircleSummary,
  KittyPartyMember,
} from "../../types/kittyPartyTypes";
import { KittyPartyAuditTrailModal } from "./kittyPartyAuditTrailModal";
import { KittyPartyDisputeModal } from "./kittyPartyDisputeModal";
import { KittyPartyUpiModal } from "./kittyPartyUpiModal";

export const KittyPartyLedgerView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const circleId = Number(id);

  const [circle, setCircle] = useState<KittyPartyCircleSummary | null>(null);
  const [cycle, setCycle] = useState<KittyPartyCycle | null>(null);
  const [contributions, setContributions] = useState<KittyPartyContribution[]>([]);
  const [members, setMembers] = useState<KittyPartyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state for recording payment
  const [showPayModal, setShowPayModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payUtr, setPayUtr] = useState("");
  const [payReceiptUrl, setPayReceiptUrl] = useState("");
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [payNotes, setPayNotes] = useState("");
  const [payPeriod, setPayPeriod] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New Cycle form state
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [cycleName, setCycleName] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState(2000);
  const [memberCount, setMemberCount] = useState(12);

  // Advanced features modals state
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // Swap rotation modal state
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapFromPeriod, setSwapFromPeriod] = useState<number>(1);
  const [swapToPeriod, setSwapToPeriod] = useState<number>(2);
  const [swapReason, setSwapReason] = useState("");

  // Replace member modal state
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceOldUserId, setReplaceOldUserId] = useState<number>(0);
  const [replaceNewUserId, setReplaceNewUserId] = useState<number>(0);
  const [replaceReason, setReplaceReason] = useState("");

  // Action states
  const [isReminding, setIsReminding] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isAdmin = circle?.currentUserRole === "OWNER" || circle?.currentUserRole === "ADMIN";
  const isTreasurer = isAdmin || circle?.currentUserRole === "TREASURER";

  useEffect(() => {
    if (circleId) {
      loadData();
    }
  }, [circleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [circleData, circleMembers] = await Promise.all([
        kittyPartyService.getCircleDetails(circleId),
        kittyPartyService.getCircleMembers(circleId).catch(() => []),
      ]);
      setCircle(circleData);
      setMembers(circleMembers || []);

      // Try loading cycle (active cycle for circle or fallback)
      try {
        let summary: KittyPartyCycle | null = null;
        try {
          summary = await kittyPartyService.getCircleActiveCycle(circleId);
        } catch {
          // fallback
        }
        if (!summary?.id) {
          summary = await kittyPartyService.getCycleSummary(circleId);
        }
        if (summary?.id) {
          setCycle(summary);
          setPayPeriod(summary.currentPeriod || 1);
          setPayAmount(summary.contributionAmount || 2000);
          setSwapFromPeriod(summary.currentPeriod || 1);
          setSwapToPeriod(Math.min((summary.currentPeriod || 1) + 1, summary.memberCount));

          const contribs = await kittyPartyService.getContributions(summary.id);
          setContributions(contribs || []);
        }
      } catch {
        // No active cycle yet
      }
    } catch (e) {
      console.error("Failed to load ledger data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await kittyPartyService.createCycle(circleId, {
        cycleName: cycleName.trim() || `${circle?.circleName || "Kitty"} 2026 Cycle`,
        contributionAmount: monthlyAmount,
        memberCount,
        startDate: new Date().toISOString().split("T")[0],
      });
      setShowCreateCycle(false);
      setFeedback("Kitty Savings cycle initialized successfully with fixed rotation order!");
      loadData();
    } catch (err: any) {
      setFeedback(err?.message || "Failed to create cycle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycle?.id || !payUtr.trim()) return;
    try {
      setIsSubmitting(true);
      await kittyPartyService.recordContribution(cycle.id, {
        periodNumber: payPeriod,
        recordedAmount: payAmount,
        externalRef: payUtr.trim(),
        receiptUrl: payReceiptUrl.trim() || undefined,
        notes: payNotes.trim() || undefined,
      });
      setShowPayModal(false);
      setPayReceiptUrl("");
      setFeedback("Contribution recorded! Status is updated to PAID.");
      loadData();
    } catch (err: any) {
      setFeedback(err?.message || "Failed to record contribution");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReminders = async () => {
    if (!cycle?.id) return;
    try {
      setIsReminding(true);
      const res = await kittyPartyService.sendReminders(cycle.id, cycle.currentPeriod);
      setFeedback(`📢 Reminders dispatched to ${res.remindedCount} pending members: ${res.remindedMembers.join(", ") || "None pending"}`);
    } catch (err: any) {
      setFeedback(err?.message || "Failed to send reminders");
    } finally {
      setIsReminding(false);
    }
  };

  const handleDownloadStatement = async () => {
    if (!cycle?.id) return;
    try {
      setIsDownloading(true);
      await kittyPartyService.downloadStatementCsv(cycle.id, cycle.currentPeriod);
      setFeedback("Monthly ledger statement CSV downloaded successfully!");
    } catch (err: any) {
      setFeedback(err?.message || "Failed to download statement CSV");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSwapRotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycle?.id || !swapReason.trim()) return;
    try {
      setIsSubmitting(true);
      await kittyPartyService.swapRotation(cycle.id, {
        fromPeriod: swapFromPeriod,
        toPeriod: swapToPeriod,
        reason: swapReason.trim(),
      });
      setShowSwapModal(false);
      setSwapReason("");
      setFeedback(`Successfully swapped rotation between Month ${swapFromPeriod} and Month ${swapToPeriod}!`);
      loadData();
    } catch (err: any) {
      setFeedback(err?.message || "Failed to swap rotation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplaceMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycle?.id || !replaceOldUserId || !replaceNewUserId || !replaceReason.trim()) return;
    try {
      setIsSubmitting(true);
      await kittyPartyService.replaceMember(cycle.id, {
        oldUserId: replaceOldUserId,
        newUserId: replaceNewUserId,
        reason: replaceReason.trim(),
      });
      setShowReplaceModal(false);
      setReplaceReason("");
      setFeedback("Member successfully replaced in rotation and future contributions!");
      loadData();
    } catch (err: any) {
      setFeedback(err?.message || "Failed to replace member");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading Kitty Ledger...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/kitty-party/${circleId}`} className="text-xs font-semibold text-pink-600 hover:text-pink-700">
              ← Back to {circle?.circleName || "Circle"}
            </Link>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Record-Only Ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Kitty Savings & Rotation Ledger</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Compliant financial tracking under Chit Funds Act 1982. Direct member-to-member payments with immutable audit history.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {cycle && (
            <>
              {/* Feature 7: Downloadable Statement */}
              <button
                onClick={handleDownloadStatement}
                disabled={isDownloading}
                className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                title="Download monthly ledger statement CSV"
              >
                <span>📥</span>
                {isDownloading ? "Downloading..." : "Download Statement"}
              </button>

              {/* Feature 8: Immutable Financial Audit Trail */}
              <button
                onClick={() => setShowAuditModal(true)}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                title="View cryptographic SHA-256 audit history"
              >
                <span>🔒</span>
                Audit Trail
              </button>

              {/* Feature 6: Dispute & Complaint Management */}
              <button
                onClick={() => setShowDisputeModal(true)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                title="View or raise disputes"
              >
                <span>⚖️</span>
                Disputes
              </button>

              {/* Feature 3: Payment Reminders */}
              {isTreasurer && (
                <button
                  onClick={handleSendReminders}
                  disabled={isReminding}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  title="Send reminders to members with pending contributions"
                >
                  <span>🔔</span>
                  {isReminding ? "Sending..." : `Remind (${cycle.pendingContributionsCount ?? 0})`}
                </button>
              )}

              {/* Feature 5: Member Replacement */}
              {isAdmin && (
                <button
                  onClick={() => setShowReplaceModal(true)}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  title="Replace a member who is leaving the cycle"
                >
                  <span>👥</span>
                  Replace Member
                </button>
              )}

              {/* Direct UPI Payment Shortcut */}
              <button
                onClick={() => setShowUpiModal(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-xs shadow hover:from-emerald-700 hover:to-teal-700 transition flex items-center gap-1.5"
                title="Settle directly with current beneficiary via any UPI App"
              >
                <span>⚡</span> Pay via UPI
              </button>

              {/* Record Contribution Action */}
              <button
                onClick={() => setShowPayModal(true)}
                className="px-4 py-2 bg-pink-600 text-white font-bold rounded-xl text-xs shadow hover:bg-pink-700 transition"
              >
                + Record Payment
              </button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-pink-50 border border-pink-200 text-pink-900 text-xs rounded-xl font-medium flex justify-between items-center shadow-sm">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-pink-700 font-bold ml-2">✕</button>
        </div>
      )}

      {!cycle ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="text-5xl mb-3">👛</div>
          <h3 className="text-lg font-bold text-gray-800">No Kitty Cycle Configured</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
            Organize a 12-month or custom rotating savings pool for this circle. Members contribute periodically and take turns as the monthly beneficiary.
          </p>
          <button
            onClick={() => setShowCreateCycle(true)}
            className="mt-5 px-6 py-2.5 bg-pink-600 text-white text-sm font-bold rounded-xl shadow hover:bg-pink-700"
          >
            Initialize Kitty Cycle
          </button>
        </div>
      ) : (
        <>
          {/* ============================================================== */}
          {/* DASHBOARD INDICATORS (ALL 8 REQUIRED INDICATORS FULLY RENDERED) */}
          {/* ============================================================== */}
          <div className="space-y-4">
            {/* Indicator 7: Full Cycle Progress Banner */}
            <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 rounded-2xl p-5 text-white shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-100">Indicator 7 • Cycle Progression</span>
                  <h3 className="text-lg font-bold">Full Cycle Progress: {cycle.cycleProgressPercent || Math.round((cycle.currentPeriod / cycle.memberCount) * 100)}%</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-pink-100">Month #{cycle.currentPeriod} of {cycle.memberCount}</div>
                  <div className="text-[11px] text-pink-200">
                    {Math.max(0, cycle.memberCount - cycle.currentPeriod)} months remaining
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(5, cycle.cycleProgressPercent || (cycle.currentPeriod / cycle.memberCount) * 100))}%` }}
                />
              </div>
            </div>

            {/* 6 Key Financial & Beneficiary KPI Metric Cards + Feature 4 Late Overdue Indicator */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Indicator 1: Total Expected Collection */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">1. Total Expected</span>
                  <span className="text-base">🎯</span>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold text-gray-900">
                    ₹{cycle.totalExpectedPerPeriod?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Cycle Target: ₹{(cycle.totalExpectedFullCycle || (cycle.totalExpectedPerPeriod * cycle.memberCount))?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Indicator 2: Total Collected */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-green-600 uppercase">2. Total Collected</span>
                  <span className="text-base">💰</span>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold text-green-700">
                    ₹{(cycle.totalCollectedCurrentPeriod || 0)?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Cumulative: ₹{(cycle.totalCollectedFullCycle || 0)?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Indicator 3: Pending Contributions */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-600 uppercase">3. Pending Contrib.</span>
                  <span className="text-base">⏳</span>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold text-amber-700">
                    ₹{(cycle.pendingContributionsAmount != null ? cycle.pendingContributionsAmount : Math.max(0, cycle.totalExpectedPerPeriod - (cycle.totalCollectedCurrentPeriod || 0)))?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {cycle.pendingContributionsCount ?? (cycle.memberCount - (cycle.paidContributionsCount || 0))} pending / {cycle.paidContributionsCount || 0} paid
                  </div>
                </div>
              </div>

              {/* Indicator 4: Current Month's Beneficiary */}
              <div className="bg-white p-4 rounded-xl border border-pink-100 shadow-sm flex flex-col justify-between ring-1 ring-pink-400">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-pink-600 uppercase">4. Current Beneficiary</span>
                  <span className="text-base">👑</span>
                </div>
                <div className="mt-2">
                  <div className="text-base font-bold text-pink-600 truncate" title={cycle.currentBeneficiaryName || "Unassigned"}>
                    {cycle.currentBeneficiaryName || "Unassigned"}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Month #{cycle.currentPeriod} Payout Recipient
                  </div>
                </div>
              </div>

              {/* Indicator 5: Previous Payouts */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">5. Previous Payouts</span>
                  <span className="text-base">📜</span>
                </div>
                <div className="mt-2">
                  <div className="text-lg font-bold text-indigo-700">
                    {cycle.previousPayoutsCount ?? (cycle.currentPeriod > 1 ? cycle.currentPeriod - 1 : 0)} Disbursed
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Total: ₹{(cycle.previousPayoutsTotalAmount || ((cycle.currentPeriod > 1 ? cycle.currentPeriod - 1 : 0) * cycle.totalExpectedPerPeriod))?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Indicator 6 / Feature 4: Next Beneficiary or Overdue Alert */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-600 uppercase">6. Next Beneficiary</span>
                  <span className="text-base">⏭️</span>
                </div>
                <div className="mt-2">
                  <div className="text-base font-bold text-purple-700 truncate" title={cycle.nextBeneficiaryName || "Cycle Complete"}>
                    {cycle.nextBeneficiaryName || (cycle.rotations?.find(r => r.periodNumber === cycle.currentPeriod + 1)?.beneficiaryName) || "Cycle End"}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Scheduled for Month #{cycle.currentPeriod + 1}
                  </div>
                </div>
              </div>
            </div>

            {/* Overdue alert banner if late payments exist */}
            {(cycle.overdueContributionsCount ?? 0) > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between text-xs text-rose-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <span>
                    <strong>Late Payment Warning:</strong> {cycle.overdueContributionsCount} contribution(s) amounting to ₹{cycle.overdueContributionsAmount?.toLocaleString()} have exceeded the period grace deadline.
                  </span>
                </div>
                {isTreasurer && (
                  <button
                    onClick={handleSendReminders}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[11px]"
                  >
                    Send Urgent Reminder
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Feature 1 & 2: Fixed Rotation Schedule with Admin Swap */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">Rotation Beneficiary Calendar</h3>
                  <span className="text-[10px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded border border-gray-200">
                    🔒 Fixed Order
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sequential rotation order for all cycle months. Admins can swap planned turns upon mutual member consent.
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowSwapModal(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 self-start"
                >
                  ⇄ Admin Swap Turn
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {cycle.rotations.map((rot) => (
                <div
                  key={rot.periodNumber}
                  className={`p-3 rounded-xl border text-center transition ${
                    rot.periodNumber === cycle.currentPeriod
                      ? "border-pink-500 bg-pink-50/50 ring-2 ring-pink-500"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Month #{rot.periodNumber}</div>
                  <div className="text-xs font-bold text-gray-800 mt-1 truncate">{rot.beneficiaryName}</div>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                        rot.rotationStatus === "DISBURSED"
                          ? "bg-green-100 text-green-800"
                          : rot.rotationStatus === "SWAPPED"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {rot.rotationStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contributions Table with Indicator 8: Payment Receipts & Feature 4: Late Tracking */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Monthly Contribution Ledger</h3>
                <span className="text-[11px] text-gray-400 font-medium">Indicator 8 • Verified Receipts & Late-Payment Tracking</span>
              </div>
              <span className="text-xs text-gray-400">Total Entries: {contributions.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase font-bold text-[10px]">
                    <th className="py-2.5">Member</th>
                    <th className="py-2.5">Period</th>
                    <th className="py-2.5">Expected</th>
                    <th className="py-2.5">Recorded</th>
                    <th className="py-2.5">Payment UTR</th>
                    <th className="py-2.5">Receipt Proof</th>
                    <th className="py-2.5">Status & Timeliness</th>
                    <th className="py-2.5">Verified By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contributions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        No payments recorded for this period yet.
                      </td>
                    </tr>
                  ) : (
                    contributions.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="py-2.5 font-bold text-gray-800">{c.memberName}</td>
                        <td className="py-2.5 text-gray-600">Month #{c.periodNumber}</td>
                        <td className="py-2.5 text-gray-600">₹{c.expectedAmount}</td>
                        <td className="py-2.5 font-bold text-gray-900">₹{c.recordedAmount}</td>
                        <td className="py-2.5 font-mono text-gray-500 text-[11px]">{c.externalRef || "—"}</td>
                        <td className="py-2.5">
                          {c.receiptUrl ? (
                            <button
                              onClick={() => setPreviewReceiptUrl(c.receiptUrl || null)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 text-pink-700 hover:bg-pink-100 rounded-lg text-[11px] font-semibold border border-pink-200"
                            >
                              📄 View Receipt
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[11px]">No receipt</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.paymentStatus === "VERIFIED"
                                  ? "bg-green-100 text-green-800"
                                  : c.paymentStatus === "PAID"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {c.paymentStatus}
                            </span>
                            {c.isOverdue && (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[9px] font-bold border border-rose-200">
                                Overdue ({c.daysOverdue}d)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 text-gray-500">{c.verifiedByName || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Record Contribution Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Record Kitty Contribution</h3>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Period / Month</label>
                <input
                  type="number"
                  min="1"
                  max={cycle?.memberCount || 12}
                  value={payPeriod}
                  onChange={(e) => setPayPeriod(Number(e.target.value))}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Amount Contributed (INR)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">UPI UTR / Bank Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 402918239012"
                  value={payUtr}
                  onChange={(e) => setPayUtr(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Receipt Proof URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://.../receipt.jpg"
                  value={payReceiptUrl}
                  onChange={(e) => setPayReceiptUrl(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  {isSubmitting ? "Submitting..." : "Submit Payment Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature 2: Swap Rotation Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Admin: Swap Rotation Order</h3>
                <p className="text-xs text-gray-500">Exchange payout periods between two members.</p>
              </div>
              <button onClick={() => setShowSwapModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSwapRotation} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">From Period</label>
                  <select
                    value={swapFromPeriod}
                    onChange={(e) => setSwapFromPeriod(Number(e.target.value))}
                    className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 bg-white"
                  >
                    {cycle?.rotations?.map((r) => (
                      <option key={r.periodNumber} value={r.periodNumber} disabled={r.rotationStatus === "DISBURSED"}>
                        Month #{r.periodNumber} ({r.beneficiaryName}) {r.rotationStatus === "DISBURSED" ? "[Paid]" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">To Period</label>
                  <select
                    value={swapToPeriod}
                    onChange={(e) => setSwapToPeriod(Number(e.target.value))}
                    className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 bg-white"
                  >
                    {cycle?.rotations?.map((r) => (
                      <option key={r.periodNumber} value={r.periodNumber} disabled={r.rotationStatus === "DISBURSED"}>
                        Month #{r.periodNumber} ({r.beneficiaryName}) {r.rotationStatus === "DISBURSED" ? "[Paid]" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Administrative Reason</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Mutual consent due to medical emergency / family travel..."
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl p-3"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || swapFromPeriod === swapToPeriod || !swapReason.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Confirm Turn Swap"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature 5: Replace Member Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Member Replacement Workflow</h3>
                <p className="text-xs text-gray-500">Withdraw an inactive member and substitute them for future rotations.</p>
              </div>
              <button onClick={() => setShowReplaceModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleReplaceMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Withdrawing Member</label>
                <select
                  value={replaceOldUserId}
                  onChange={(e) => setReplaceOldUserId(Number(e.target.value))}
                  className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 bg-white"
                >
                  <option value={0}>Select member to replace...</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.fullName} ({m.roleCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Substitute Member User ID</label>
                <input
                  type="number"
                  required
                  placeholder="Enter user ID of new member..."
                  value={replaceNewUserId || ""}
                  onChange={(e) => setReplaceNewUserId(Number(e.target.value))}
                  className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Withdrawal & Replacement</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Relocated to another city, transfer approved by committee..."
                  value={replaceReason}
                  onChange={(e) => setReplaceReason(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl p-3"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplaceModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !replaceOldUserId || !replaceNewUserId || !replaceReason.trim()}
                  className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Execute Replacement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature 7 & 8: Modals */}
      {cycle && (
        <>
          <KittyPartyAuditTrailModal
            cycleId={cycle.id}
            isOpen={showAuditModal}
            onClose={() => setShowAuditModal(false)}
          />
          <KittyPartyDisputeModal
            circleId={circleId}
            cycleId={cycle.id}
            isOpen={showDisputeModal}
            onClose={() => setShowDisputeModal(false)}
            isAdmin={isAdmin}
          />
        </>
      )}

      {/* Initialize Cycle Modal */}
      {showCreateCycle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Initialize Savings Pool</h3>
              <button onClick={() => setShowCreateCycle(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleCreateCycle} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Cycle Name</label>
                <input
                  type="text"
                  placeholder="e.g. 2026 Monthly Diamond Kitty"
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Monthly Contribution (₹)</label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Total Members (Months)</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={memberCount}
                  onChange={(e) => setMemberCount(Number(e.target.value))}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCycle(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  {isSubmitting ? "Creating..." : "Start Savings Cycle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Preview Lightbox */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full space-y-3 shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-800">Payment Receipt Proof</span>
              <button onClick={() => setPreviewReceiptUrl(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[60vh] flex items-center justify-center bg-gray-50">
              <img src={previewReceiptUrl} alt="Payment proof" className="object-contain max-h-[60vh] w-auto" />
            </div>
          </div>
        </div>
      )}

      {/* Feature: Direct UPI Payment Modal */}
      {showUpiModal && cycle && (
        <KittyPartyUpiModal
          isOpen={showUpiModal}
          onClose={() => setShowUpiModal(false)}
          beneficiaryName={cycle.currentBeneficiaryName || "Cycle Beneficiary"}
          beneficiaryUpiId={cycle.beneficiaryUpiId || "beneficiary@upi"}
          amount={cycle.contributionAmount}
          periodNumber={cycle.currentPeriod}
          cycleName={cycle.cycleName}
          onProceedToRecord={() => setShowPayModal(true)}
        />
      )}
    </div>
  );
};
