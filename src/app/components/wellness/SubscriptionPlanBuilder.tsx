import React, { useState } from "react";
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Heart,
  Scale,
  Activity,
  AlertTriangle,
  Building2,
  ArrowRight,
} from "lucide-react";
import type {
  WellnessPlan,
  WellnessPlanType,
  WellnessGoalType,
  PortionSize,
  WellnessCluster,
  WellnessSubscribeRequest,
} from "../../../types/wellnessBasket";

interface SubscriptionPlanBuilderProps {
  plans: WellnessPlan[];
  clusters: WellnessCluster[];
  currentCluster?: WellnessCluster;
  onSubscribe: (request: WellnessSubscribeRequest) => Promise<void>;
  onClose: () => void;
  initialPlanType?: WellnessPlanType;
}

const GOAL_OPTIONS: { id: WellnessGoalType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: "WEIGHT_LOSS",
    label: "Weight Management & Fat Loss",
    desc: "Low-calorie, high-satiety produce, high dietary fibre, zero added sugars",
    icon: <Scale className="w-5 h-5 text-emerald-500" />,
  },
  {
    id: "MUSCLE_GAIN",
    label: "Lean Muscle & High Protein",
    desc: "18g-22g bioavailable plant & dairy protein, steamed legumes, paneer",
    icon: <Zap className="w-5 h-5 text-amber-500" />,
  },
  {
    id: "DIABETIC_FRIENDLY",
    label: "Low-GI & Sugar Control",
    desc: "Slow-release ancient millets, non-starchy greens, glycemic index < 45",
    icon: <Activity className="w-5 h-5 text-blue-500" />,
  },
  {
    id: "HEART_HEALTH",
    label: "Cardiovascular & Anti-Inflammatory",
    desc: "Omega-3 superfoods, potassium-rich fruits, sodium-controlled ingredients",
    icon: <Heart className="w-5 h-5 text-rose-500" />,
  },
  {
    id: "GENERAL_WELLNESS",
    label: "Daily Energy & Vitality",
    desc: "Seasonal whole-food diversity, antioxidant berries, prebiotic gut fibres",
    icon: <Sparkles className="w-5 h-5 text-indigo-500" />,
  },
];

const DISLIKE_PRESETS = [
  "Papaya",
  "Bitter Gourd",
  "Cucumber",
  "Walnuts",
  "Paneer / Dairy",
  "Raw Sprouts",
  "Mint",
  "Chili / Pepper",
];

export const SubscriptionPlanBuilder: React.FC<SubscriptionPlanBuilderProps> = ({
  plans,
  clusters,
  currentCluster,
  onSubscribe,
  onClose,
  initialPlanType = "PREMIUM",
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedPlan, setSelectedPlan] = useState<WellnessPlanType>(initialPlanType);
  const [selectedGoal, setSelectedGoal] = useState<WellnessGoalType>("WEIGHT_LOSS");
  const [portionSize, setPortionSize] = useState<PortionSize>("STANDARD");
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [customDislike, setCustomDislike] = useState<string>("");
  const [selectedSociety, setSelectedSociety] = useState<string>(
    currentCluster ? currentCluster.societyName : clusters[0]?.societyName || "Mana Premiere Residences"
  );
  const [block, setBlock] = useState<string>("");
  const [flatNo, setFlatNo] = useState<string>("");
  const [extraNotes, setExtraNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeCluster = clusters.find((c) => c.societyName === selectedSociety) || clusters[0];
  const chosenPlan = plans.find((p) => p.planType === selectedPlan) || plans[0];

  const toggleDislike = (item: string) => {
    setDislikes((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const addCustomDislike = () => {
    if (customDislike.trim() && !dislikes.includes(customDislike.trim())) {
      setDislikes([...dislikes, customDislike.trim()]);
      setCustomDislike("");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubscribe({
        planType: selectedPlan,
        portionSize,
        goalType: selectedGoal,
        dislikedIngredients: dislikes,
        extraNotes,
        societyName: selectedSociety,
        block,
        flatNo,
      });
      onClose();
    } catch (e) {
      console.error("Subscription error", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Step {step} of 4
              </span>
              <span className="text-xs text-slate-500 font-medium">Dietitian Nutrition Onboarding</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {step === 1 && "Choose Your Nutrition Plan"}
              {step === 2 && "Personalise Your Health Goals"}
              {step === 3 && "Ingredient & Allergy Exclusions"}
              {step === 4 && "Society Delivery & Confirmation"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-emerald-500 h-1 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: Plan Choice */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                All plans include 26 Mon–Sat doorstep deliveries per month before 8:00 AM, with 4-week dietitian menu rotations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => {
                  const isSelected = selectedPlan === plan.planType;
                  return (
                    <div
                      key={plan.planType}
                      onClick={() => setSelectedPlan(plan.planType)}
                      className={`cursor-pointer rounded-xl p-5 border-2 transition-all relative ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/30 shadow-md"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      {plan.planType === "PREMIUM" && (
                        <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                          MOST POPULAR
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{plan.displayName}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-extrabold text-slate-900">
                            ₹{plan.pricePerMonth}
                          </span>
                          <span className="text-xs text-slate-500">/month</span>
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ml-auto font-medium">
                            ₹{plan.pricePerDelivery}/day
                          </span>
                        </div>
                      </div>

                      <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                        {plan.includedFeatures.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Goal and Portion */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Select Your Primary Wellness Goal
                </label>
                <div className="space-y-2">
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = selectedGoal === goal.id;
                    return (
                      <div
                        key={goal.id}
                        onClick={() => setSelectedGoal(goal.id)}
                        className={`cursor-pointer rounded-xl p-3.5 border transition-all flex items-center gap-3.5 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/40 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                          {goal.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-900">{goal.label}</h4>
                          <p className="text-xs text-slate-500">{goal.desc}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Portion Sizing
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "SMALL", label: "Light", desc: "250g-300g (Desk/Snack)" },
                    { id: "STANDARD", label: "Standard", desc: "380g-450g (Full Breakfast)" },
                    { id: "LARGE", label: "Hearty", desc: "500g+ (Athlete/Active)" },
                  ].map((p) => {
                    const isSelected = portionSize === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setPortionSize(p.id as PortionSize)}
                        className={`cursor-pointer rounded-xl p-3 text-center border transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50 font-bold"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <span className="text-sm block text-slate-900">{p.label}</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{p.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Dislikes and Allergies */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <strong>Automated Allergy Safeguard:</strong> Any ingredients matching your medical allergy records in Mana Community profile will be automatically swapped by our engine before delivery.
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Exclude Specific Disliked Ingredients
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Tap any item to exclude it from your daily rotation:
                </p>
                <div className="flex flex-wrap gap-2">
                  {DISLIKE_PRESETS.map((item) => {
                    const isExcluded = dislikes.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleDislike(item)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          isExcluded
                            ? "bg-rose-50 border-rose-300 text-rose-700 font-semibold"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {isExcluded ? `✕ ${item}` : `+ ${item}`}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={customDislike}
                    onChange={(e) => setCustomDislike(e.target.value)}
                    placeholder="Add other ingredient (e.g. Ginger, Peanuts)..."
                    className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    onKeyDown={(e) => e.key === "Enter" && addCustomDislike()}
                  />
                  <button
                    type="button"
                    onClick={addCustomDislike}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">
                  Delivery or Dietary Notes (Optional)
                </label>
                <textarea
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  placeholder="e.g. Leave package on door hook; Please ring bell softly..."
                  rows={2}
                  className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Delivery Society and Confirmation */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Select Society Cluster
                </label>
                <select
                  value={selectedSociety}
                  onChange={(e) => setSelectedSociety(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {clusters.map((c) => (
                    <option key={c.id} value={c.societyName}>
                      {c.societyName} ({c.currentSubscriberCount} subscribers – {c.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cluster Status Widget */}
              {activeCluster && (
                <div
                  className={`p-4 rounded-xl border ${
                    activeCluster.isActivated
                      ? "bg-emerald-50/70 border-emerald-200"
                      : "bg-amber-50/70 border-amber-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      {activeCluster.societyName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        activeCluster.isActivated
                          ? "bg-emerald-200 text-emerald-800"
                          : "bg-amber-200 text-amber-800"
                      }`}
                    >
                      {activeCluster.isActivated ? "ROUTE ACTIVE" : "ACTIVATION IN PROGRESS"}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-600">
                    {activeCluster.isActivated ? (
                      <p>
                        Dedicated society delivery route is <strong>ACTIVE</strong>. Doorstep delivery scheduled daily between 6:00 AM – 8:00 AM.
                      </p>
                    ) : (
                      <p>
                        Current subscribers: <strong>{activeCluster.currentSubscriberCount} / {activeCluster.activationThreshold}</strong>. Just {activeCluster.subscribersNeededForActivation} more to activate morning delivery for your tower!
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tower / Block
                  </label>
                  <input
                    type="text"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="e.g. Tower B"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Flat / Door No
                  </label>
                  <input
                    type="text"
                    value={flatNo}
                    onChange={(e) => setFlatNo(e.target.value)}
                    placeholder="e.g. 504"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-900 pb-2 border-b border-slate-200">
                  <span>{chosenPlan.displayName} ({portionSize.toLowerCase()} portion)</span>
                  <span>₹{chosenPlan.pricePerMonth} / month</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Deliveries</span>
                  <span>26 Days (Mon–Sat, before 8 AM)</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Payment Gateway</span>
                  <span>Cashfree Auto-Debit Mandate (Cancel anytime)</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Vacation Pauses</span>
                  <span>Unlimited (Pause in app anytime)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? (
                "Setting Up Subscription..."
              ) : (
                <>
                  Confirm & Activate Subscription
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
