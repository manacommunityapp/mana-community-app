import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Apple,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  HeartHandshake,
  ThermometerSnowflake,
  Award,
  Stethoscope,
} from "lucide-react";
import type {
  WellnessPlan,
  WellnessSubscriber,
  WellnessMenuWeek,
  WellnessCluster,
  WellnessSubscribeRequest,
  WellnessSwapRequest,
  WellnessPauseRequest,
} from "../../../types/wellnessBasket";
import {
  wellnessBasketService,
  MOCK_WELLNESS_PLANS,
  MOCK_CLUSTERS,
  MOCK_SUBSCRIBER,
  MOCK_WEEK_MENU,
} from "../../../services/wellness-basket/wellnessBasketService";
import { SubscriptionPlanBuilder } from "./SubscriptionPlanBuilder";
import { WeeklyMenuCalendar } from "./WeeklyMenuCalendar";

export const WellnessHub: React.FC = () => {
  const [plans, setPlans] = useState<WellnessPlan[]>(MOCK_WELLNESS_PLANS);
  const [subscriber, setSubscriber] = useState<WellnessSubscriber | null>(MOCK_SUBSCRIBER);
  const [menuWeek, setMenuWeek] = useState<WellnessMenuWeek>(MOCK_WEEK_MENU);
  const [clusters, setClusters] = useState<WellnessCluster[]>(MOCK_CLUSTERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showBuilder, setShowBuilder] = useState<boolean>(false);
  const [builderInitialPlan, setBuilderInitialPlan] = useState<"BASIC" | "PREMIUM">("PREMIUM");
  const [pauseModalOpen, setPauseModalOpen] = useState<boolean>(false);
  const [pauseFrom, setPauseFrom] = useState<string>("");
  const [pauseUntil, setPauseUntil] = useState<string>("");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedPlans, fetchedSub, fetchedMenu, fetchedClusters] = await Promise.all([
        wellnessBasketService.getPlans(),
        wellnessBasketService.getSubscription(),
        wellnessBasketService.getMenuForWeek(),
        wellnessBasketService.getClusters(),
      ]);
      setPlans(fetchedPlans);
      setSubscriber(fetchedSub);
      setMenuWeek(fetchedMenu);
      setClusters(fetchedClusters);
    } catch (err) {
      console.warn("Using resilient offline fallback for WellnessHub", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (request: WellnessSubscribeRequest) => {
    try {
      const updated = await wellnessBasketService.subscribe(request);
      setSubscriber(updated);
      setFeedbackMsg({
        type: "success",
        text: `Successfully subscribed to ${updated.planType} Wellness Plan! Doorstep delivery active.`,
      });
      loadData();
    } catch {
      setFeedbackMsg({ type: "error", text: "Subscription failed. Please verify connection and retry." });
    }
  };

  const handlePause = async () => {
    if (!pauseFrom || !pauseUntil) return;
    try {
      const updated = await wellnessBasketService.pauseSubscription({ pauseFrom, pauseUntil });
      setSubscriber(updated);
      setPauseModalOpen(false);
      setFeedbackMsg({
        type: "success",
        text: `Wellness subscription paused from ${pauseFrom} to ${pauseUntil}. No deliveries will be billed.`,
      });
    } catch {
      setFeedbackMsg({ type: "error", text: "Could not pause subscription. Please retry." });
    }
  };

  const handleResume = async () => {
    try {
      const updated = await wellnessBasketService.resumeSubscription();
      setSubscriber(updated);
      setFeedbackMsg({ type: "success", text: "Welcome back! Your daily wellness deliveries have resumed." });
    } catch {
      setFeedbackMsg({ type: "error", text: "Could not resume subscription." });
    }
  };

  const handleSwapItem = async (request: WellnessSwapRequest) => {
    try {
      await wellnessBasketService.requestSwap(request);
      setFeedbackMsg({
        type: "success",
        text: `Custom swap registered for ${request.deliveryDate}. Dietitian manifest updated.`,
      });
      const updatedMenu = await wellnessBasketService.getMenuForWeek();
      setMenuWeek(updatedMenu);
    } catch {
      setFeedbackMsg({ type: "error", text: "Swap request could not be processed." });
    }
  };

  const activeCluster = clusters.find((c) => c.isActivated) || clusters[0];
  const isSubscriber = Boolean(subscriber && subscriber.subscriptionStatus === "ACTIVE");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold shadow-md transition-all ${
            feedbackMsg.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-white/80 hover:text-white ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-8 md:p-10 shadow-xl relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <Apple className="w-3.5 h-3.5" />
                Mana Fresh Wellness
              </span>
              <span className="text-xs text-slate-300 font-medium">Dietitian-Curated Nutrition Subscription</span>
            </div>
            <Link
              to="/wellness-basket/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 transition-colors shadow-sm"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-300" />
              Dietitian Portal →
            </Link>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Fresh, Portioned Nutrition. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
              At Your Doorstep Every Morning.
            </span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Whole-food breakfast bowls, cold-cut fruits, ancient millets and steamed protein sprouts. Portion-controlled, allergy-safe, and consolidated for your society before 8:00 AM.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Mon–Sat Doorstep Delivery (6:00 – 8:00 AM)</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
              <Award className="w-4 h-4 text-teal-400" />
              <span>4-Week Dietitian Menu Rotation</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>FSSAI Certified Cold-Chain (2–4°C)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Society Delivery Cluster Status Pill */}
      {activeCluster && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{activeCluster.societyName} Cluster</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeCluster.isActivated
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {activeCluster.isActivated ? "ROUTE ACTIVE" : "PRE-ACTIVATION"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeCluster.isActivated ? (
                  <>Delivery vehicle assigned: <strong>6:00 AM – 8:00 AM</strong> consolidated doorstep drop.</>
                ) : (
                  <>Requires 15 subscribers to activate dedicated vehicle route.</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Subscribers in Society</span>
              <span className="text-sm font-extrabold text-slate-900">
                {activeCluster.currentSubscriberCount} / {activeCluster.activationThreshold}
              </span>
            </div>
            <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (activeCluster.currentSubscriberCount / activeCluster.activationThreshold) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE SUBSCRIBER CARD */}
      {subscriber && subscriber.subscriptionStatus !== "CANCELLED" && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/60 p-6 shadow-md space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {subscriber.subscriptionStatus}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Mandate: {subscriber.cashfreeSubscriptionId}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {subscriber.planType} Wellness Box Subscription
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Portion: <strong>{subscriber.portionSize}</strong> | Goal:{" "}
                <strong>{subscriber.goalType?.replace(/_/g, " ")}</strong> | Delivering to:{" "}
                <strong>{subscriber.clusterSocietyName}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {subscriber.subscriptionStatus === "ACTIVE" ? (
                <button
                  type="button"
                  onClick={() => setPauseModalOpen(true)}
                  className="px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                >
                  <PauseCircle className="w-4 h-4 text-amber-500" />
                  Vacation Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResume}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <PlayCircle className="w-4 h-4" />
                  Resume Deliveries
                </button>
              )}
            </div>
          </div>

          {subscriber.subscriptionStatus === "PAUSED" && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <span>
                Deliveries are paused from <strong>{subscriber.pauseFrom}</strong> to{" "}
                <strong>{subscriber.pauseUntil}</strong>. No boxes will be dispatched.
              </span>
              <button
                type="button"
                onClick={handleResume}
                className="font-bold underline text-amber-800 hover:text-amber-950 ml-2"
              >
                Resume Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* PLAN COMPARISON & CARDS (Show when user is not subscribed or wants to view plans) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Subscription Tiers
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Designed for Daily Wellness & Longevity
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isSubscribedToThis = subscriber?.planType === plan.planType && subscriber.subscriptionStatus === "ACTIVE";
            return (
              <div
                key={plan.planType}
                className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition-all ${
                  plan.planType === "PREMIUM"
                    ? "border-emerald-400 shadow-emerald-50 ring-1 ring-emerald-400/20"
                    : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                        26 Deliveries / Mo (Mon–Sat)
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-0.5">{plan.displayName}</h3>
                      <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                    </div>
                    {plan.planType === "PREMIUM" && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Premium Tier
                      </span>
                    )}
                  </div>

                  <div className="mt-5 pb-4 border-b border-slate-100 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">₹{plan.pricePerMonth}</span>
                    <span className="text-xs text-slate-500 font-medium">/ month</span>
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold ml-auto">
                      ₹{plan.pricePerDelivery} per morning
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Box Highlights:</span>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {plan.includedFeatures.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  {isSubscribedToThis ? (
                    <div className="w-full py-2.5 text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl">
                      ✓ Current Active Plan
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setBuilderInitialPlan(plan.planType);
                        setShowBuilder(true);
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      Subscribe to {plan.displayName}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WEEKLY MENU CALENDAR ROTATION */}
      <div className="space-y-4">
        <WeeklyMenuCalendar
          menuWeek={menuWeek}
          onSwapItem={handleSwapItem}
          isSubscriber={isSubscriber}
        />
      </div>

      {/* FOOD SAFETY & TRUST BADGES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="flex items-start gap-3">
          <ThermometerSnowflake className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">2°C – 4°C Cold Chain</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Temperature-monitored refrigerated holding blocks delivery dispatch if broken.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">FSSAI Compliance</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              100% verified vendors with NABL quarterly lab audits and full batch traceability.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Dietitian-Led Formulation</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              4-week rotating macro balances verified by registered clinical nutritionists.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <HeartHandshake className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Automated Allergy Shield</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Automatic substitution prevents conflicting allergens from ever entering your box.
            </p>
          </div>
        </div>
      </div>

      {/* PLAN BUILDER MODAL */}
      {showBuilder && (
        <SubscriptionPlanBuilder
          plans={plans}
          clusters={clusters}
          currentCluster={activeCluster}
          initialPlanType={builderInitialPlan}
          onSubscribe={handleSubscribe}
          onClose={() => setShowBuilder(false)}
        />
      )}

      {/* VACATION PAUSE MODAL */}
      {pauseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Vacation Delivery Pause</h3>
            <p className="text-xs text-slate-500">
              Select the dates you'll be away. No orders will be prepared and no daily deliveries will be billed.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pause From</label>
                <input
                  type="date"
                  value={pauseFrom}
                  onChange={(e) => setPauseFrom(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resume On</label>
                <input
                  type="date"
                  value={pauseUntil}
                  onChange={(e) => setPauseUntil(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPauseModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePause}
                disabled={!pauseFrom || !pauseUntil}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
