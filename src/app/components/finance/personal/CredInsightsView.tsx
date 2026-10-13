import React, { useState } from "react";
import {
  Flame,
  Hourglass,
  AlertTriangle,
  Calendar,
  Repeat,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Info,
  ChevronRight,
  Stethoscope,
  Trophy,
  ShoppingBag,
  Home,
  Receipt,
  CreditCard,
  Building,
  Radio,
  Zap,
} from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import type {
  CredInsightsSummaryDto,
  DuplicateSpendAlert,
  LifestyleCategoryInsight,
  UpcomingBillItem,
  PersonalRecurringDto,
  TripExpenseReport,
} from "../../../../services/finance/personalFinanceService";

interface CredInsightsViewProps {
  insights: CredInsightsSummaryDto | null;
  hideBalances: boolean;
  onRefresh: () => void;
}

export const CredInsightsView: React.FC<CredInsightsViewProps> = ({
  insights,
  hideBalances,
  onRefresh,
}) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});
  const [selectedLifestyle, setSelectedLifestyle] = useState<string>("HEALTHCARE");

  if (!insights) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
        <Info className="w-8 h-8 mx-auto mb-2 text-slate-400" />
        <p className="font-medium text-sm">Gathering spending analytics...</p>
      </div>
    );
  }

  const activeDuplicates = insights.duplicateWarnings.filter(
    (alert) => !dismissedAlerts[alert.id]
  );

  const getLifestyleIcon = (cat: LifestyleCategoryInsight["category"]) => {
    switch (cat) {
      case "HEALTHCARE":
        return <Stethoscope className="w-5 h-5" />;
      case "SPORTS":
        return <Trophy className="w-5 h-5" />;
      case "TRAVEL":
        return <Compass className="w-5 h-5" />;
      case "SHOPPING":
        return <ShoppingBag className="w-5 h-5" />;
      case "HOUSING":
        return <Home className="w-5 h-5" />;
      default:
        return <Receipt className="w-5 h-5" />;
    }
  };

  const currentCategoryData = insights.lifestyleCategories.find(
    (c) => c.category === selectedLifestyle
  ) || insights.lifestyleCategories[0];

  return (
    <div className="space-y-6">
      {/* ── Duplicate Charge Alert Banner (if any detected) ── */}
      {activeDuplicates.length > 0 && (
        <div className="space-y-3">
          {activeDuplicates.map((dup) => (
            <div
              key={dup.id}
              className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-900 tracking-wide uppercase">
                      Possible Duplicate Charge Detected
                    </span>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold">
                      {dup.confidence} CONFIDENCE
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    Two transactions of{" "}
                    <span className="font-black text-amber-950">
                      ₹{dup.amount.toLocaleString("en-IN")}
                    </span>{" "}
                    for &ldquo;{dup.description}&rdquo; within {dup.timeGapHours}h
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Card/Account: {dup.transaction1.accountName} · Recorded {dup.transaction1.date} and {dup.transaction2.date}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDismissedAlerts((prev) => ({ ...prev, [dup.id]: true }))
                  }
                  className="border-amber-300 text-amber-900 hover:bg-amber-100 h-8 text-xs font-medium"
                >
                  Dismiss Warning
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    alert(`Flagged duplicate transaction ${dup.transaction2.id} for bank chargeback.`);
                    setDismissedAlerts((prev) => ({ ...prev, [dup.id]: true }));
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-xs font-semibold shadow-xs"
                >
                  Flag Chargeback
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Burn Rate Velocity & Cash Flow Runway ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Burn Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Daily Burn Velocity
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {hideBalances ? "••••••" : `₹${insights.cashFlowBurnRate.toLocaleString("en-IN")}/day`}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span>Aggregated across all expenses this month</span>
          </div>
        </div>

        {/* Liquid Cash Runway */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cash Flow Runway
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {hideBalances ? "••••" : `${insights.cashFlowRunwayMonths} Months`}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span>Liquid reserve coverage at current pace</span>
          </div>
        </div>

        {/* Detected Recurring Cadences */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Auto-Subscriptions
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {insights.detectedRecurring.length} Active
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span>Broadband, OTT & Society charges scanned</span>
          </div>
        </div>

        {/* Upcoming Bills Window */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Bills Due
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {insights.upcomingBills.filter((b) => b.status === "DUE_SOON").length} Urgent
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span>{insights.upcomingBills.length} total upcoming schedules</span>
          </div>
        </div>
      </div>

      {/* ── Lifestyle Spending Breakdown (Healthcare, Sports, Travel, Shopping, Housing) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Personal Lifestyle Category Intelligence
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated classification across Healthcare, Sports, Travel, Shopping and Society Living.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Client-Side Private · Inaccessible to Society Admins</span>
          </div>
        </div>

        {/* Category Pills & Progress Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {insights.lifestyleCategories.map((item) => {
            const isSelected = selectedLifestyle === item.category;
            return (
              <button
                key={item.category}
                onClick={() => setSelectedLifestyle(item.category)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white mb-2"
                  style={{ backgroundColor: item.color }}
                >
                  {getLifestyleIcon(item.category)}
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">{item.label}</div>
                <div className="text-sm font-black text-slate-900 mt-1">
                  {hideBalances ? "••••" : `₹${item.amount.toLocaleString("en-IN")}`}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>{item.percentage}% of spend</span>
                  <span>{item.transactionCount} txns</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${Math.min(100, item.percentage)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Category Drilled Transactions */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {currentCategoryData.label} Transactions ({currentCategoryData.transactions.length})
            </h4>
            <span className="text-xs font-bold text-slate-900">
              Subtotal: {hideBalances ? "••••" : `₹${currentCategoryData.amount.toLocaleString("en-IN")}`}
            </span>
          </div>
          {currentCategoryData.transactions.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No transactions recorded under this lifestyle category this month.</p>
          ) : (
            <div className="divide-y divide-slate-200/60">
              {currentCategoryData.transactions.map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{t.description}</span>
                    <span className="text-slate-500 ml-2">({t.accountName} · {t.date})</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {hideBalances ? "••••" : `₹${t.amount.toLocaleString("en-IN")}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming Bills Calendar & Detected Recurring Subscriptions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bills Calendar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Upcoming Bill Calendar</h3>
                <p className="text-xs text-slate-500">Upcoming deadlines, CC dues & utility payments</p>
              </div>
            </div>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
              {insights.upcomingBills.length} Scheduled
            </Badge>
          </div>

          <div className="divide-y divide-slate-100 mt-4">
            {insights.upcomingBills.map((bill) => (
              <div key={bill.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl text-white mt-0.5 ${
                      bill.source === "CREDIT_CARD"
                        ? "bg-rose-500"
                        : bill.source === "SOCIETY_INVOICE"
                        ? "bg-indigo-600"
                        : "bg-teal-600"
                    }`}
                  >
                    {bill.source === "CREDIT_CARD" ? (
                      <CreditCard className="w-4 h-4" />
                    ) : bill.source === "SOCIETY_INVOICE" ? (
                      <Building className="w-4 h-4" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{bill.title}</p>
                      {bill.hasAutoPay && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0">
                          Auto-Pay Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Biller: {bill.biller} · Due in {bill.daysRemaining} days ({bill.dueDate})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {hideBalances ? "••••" : `₹${bill.amount.toLocaleString("en-IN")}`}
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                      bill.status === "DUE_SOON"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {bill.status === "DUE_SOON" ? "Due Soon" : "Upcoming"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detected Recurring Subscriptions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Recurring Subscriptions</h3>
                <p className="text-xs text-slate-500">Auto-detected recurring mandates & cadence analysis</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">AI Pattern Scanned</span>
          </div>

          <div className="space-y-3 mt-4">
            {insights.detectedRecurring.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{rec.name}</p>
                    <Badge className="bg-indigo-100 text-indigo-800 border-none text-[10px]">
                      {rec.frequency}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Next debit: {rec.nextDueDate} · Cadence: {rec.detectedCadenceDays}d (Confidence {rec.confidenceScore}%)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {hideBalances ? "••••" : `₹${rec.amount.toLocaleString("en-IN")}`}
                  </p>
                  <span className="text-[10px] font-medium text-emerald-600">Active Mandate</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Trip-Wise Expense Reports & Budget Variance Table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip-Wise Expense Reports */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#008767]" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Trip & Community Travel Reports</h3>
                <p className="text-xs text-slate-500">Linked to Mana Trips & Split engine group expenses</p>
              </div>
            </div>
            <Badge className="bg-[#E6FAF5] text-[#008767] border-[#A7F3D0] text-xs">
              {insights.tripReports.length} Active Trip
            </Badge>
          </div>

          <div className="space-y-4 mt-4">
            {insights.tripReports.map((trip, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{trip.tripName}</h4>
                    <p className="text-xs text-slate-500">Destination: {trip.destination}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">
                      {hideBalances ? "••••" : `₹${trip.totalSpent.toLocaleString("en-IN")}`}
                    </span>
                    <p className="text-[10px] text-slate-400">Total out-of-pocket</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-600 mb-1.5">Trip Cost Breakdown:</div>
                  {trip.breakdown.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-center justify-between text-xs py-1 text-slate-600">
                      <span>• {b.category}</span>
                      <span className="font-semibold text-slate-900">
                        {hideBalances ? "••••" : `₹${b.amount.toLocaleString("en-IN")}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget vs Actual Spending Variance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Budget vs Actual Variance</h3>
                <p className="text-xs text-slate-500">Envelope deviations and pacing diagnostics</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">October Envelope</span>
          </div>

          <div className="space-y-3 mt-4">
            {insights.budgetVariance.map((b, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{b.category}</p>
                    <Badge
                      className={`text-[10px] font-bold ${
                        b.status === "OVER"
                          ? "bg-rose-100 text-rose-800"
                          : b.status === "ON_PACE"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Budgeted ₹{b.budgetAmount.toLocaleString("en-IN")} · Spent ₹{b.actualAmount.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      b.varianceAmount < 0 ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    {b.varianceAmount < 0 ? "-" : "+"}
                    {hideBalances ? "••••" : `₹${Math.abs(b.varianceAmount).toLocaleString("en-IN")}`}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {b.varianceAmount < 0 ? "Exceeded budget" : "Headroom remaining"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
