import { useState, useEffect } from "react";
import { ChefHat, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Plus, Clock } from "lucide-react";
import { foodHomeChefService } from "../../../services/food/foodHomeChefService";
import type { HomeChef, HomeChefRequest } from "../../../types/food";

type Step = "profile" | "contact" | "listing" | "done";

const SPECIALITIES = [
  { value: "North Indian",  label: "North Indian",    desc: "Dal makhani, curries, rotis" },
  { value: "Bakes",         label: "Bakes & Desserts", desc: "Cakes, cookies, pastries" },
  { value: "South Indian",  label: "South Indian",    desc: "Idlis, dosas, sambhar" },
  { value: "Other",         label: "Other",           desc: "Any other cuisine or service" },
];

interface ListingForm {
  title: string;
  category: string;
  price: string;
  description: string;
}

export function HomeChefOnboarding() {
  const [step, setStep] = useState<Step>("profile");
  const [existingProfile, setExistingProfile] = useState<HomeChef | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState<HomeChefRequest>({
    kitchenName: "",
    description: "",
    speciality: "",
    cuisineTypes: "",
  });
  const [contact, setContact] = useState({ phone: "", whatsapp: "" });
  const [listing, setListing] = useState<ListingForm>({
    title: "", category: "", price: "", description: "",
  });

  useEffect(() => {
    foodHomeChefService.getMyProfile()
      .then((p) => setExistingProfile(p))
      .catch(() => {})
      .finally(() => setCheckingProfile(false));
  }, []);

  async function handleSubmitProfile() {
    setError(null);
    if (!profileForm.kitchenName.trim()) { setError("Kitchen name is required"); return; }
    setStep("contact");
  }

  async function handleSubmitContact() {
    setError(null);
    if (!contact.phone.trim()) { setError("Phone number is required"); return; }
    setStep("listing");
  }

  async function handleFinalSubmit(skipListing: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      const chef = await foodHomeChefService.registerHomeChef(profileForm);

      if (!skipListing && listing.title.trim()) {
        await foodHomeChefService.addMenuItem(chef.id, {
          name: listing.title,
          category: listing.category || "GENERAL",
          price: parseFloat(listing.price) || 0,
          description: listing.description,
        });
      }
      setExistingProfile(chef);
      setStep("done");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingProfile) {
    return (
      <div className="flex items-center justify-center min-h-64 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  // Already registered — show profile summary + add listing option
  if (existingProfile && step !== "done") {
    return (
      <div className="max-w-lg mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{existingProfile.kitchenName}</h1>
            <p className="text-xs text-emerald-600 font-medium">✓ Active seller</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-sm text-slate-700">
          <p>{existingProfile.description}</p>
          {existingProfile.speciality && (
            <p className="flex items-center gap-1 mt-2 text-slate-500">
              <Clock className="w-3.5 h-3.5" /> {existingProfile.speciality}
            </p>
          )}
        </div>

        <button
          onClick={() => setStep("listing")}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm"
        >
          <Plus className="w-4 h-4" /> Add New Listing
        </button>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">You're live!</h2>
        <p className="text-sm text-slate-500">
          Your seller profile is now visible to community members. You can manage your listings and orders from the marketplace.
        </p>
      </div>
    );
  }

  const stepLabels: Record<Step, string> = {
    profile: "Business Info",
    contact: "Contact",
    listing: "First Listing",
    done: "Done",
  };
  const stepOrder: Step[] = ["profile", "contact", "listing"];
  const currentIdx = stepOrder.indexOf(step);

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Become a Seller</h1>
          <p className="text-xs text-slate-500">Reach your community directly</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {stepOrder.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                i < currentIdx
                  ? "bg-emerald-500 text-white"
                  : i === currentIdx
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {i < currentIdx ? "✓" : i + 1}
            </div>
            <span className={`text-xs ${i === currentIdx ? "text-slate-700 font-semibold" : "text-slate-400"}`}>
              {stepLabels[s]}
            </span>
            {i < stepOrder.length - 1 && <div className="flex-1 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Step 1 — Business info */}
      {step === "profile" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kitchen / business name *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. Priya's Kitchen"
              value={profileForm.kitchenName}
              onChange={(e) => setProfileForm((f) => ({ ...f, kitchenName: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Speciality</label>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALITIES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setProfileForm((f) => ({ ...f, speciality: t.value }))}
                  className={`text-left p-3 rounded-xl border text-sm transition-all ${
                    profileForm.speciality === t.value
                      ? "border-amber-400 bg-amber-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="font-semibold text-slate-800">{t.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              rows={3}
              placeholder="Tell your community what you offer…"
              value={profileForm.description ?? ""}
              onChange={(e) => setProfileForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cuisine types</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. North Indian, Chinese, Bakes"
              value={profileForm.cuisineTypes ?? ""}
              onChange={(e) => setProfileForm((f) => ({ ...f, cuisineTypes: e.target.value }))}
            />
          </div>

          <button
            onClick={handleSubmitProfile}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2 — Contact */}
      {step === "contact" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone number *</label>
            <input
              type="tel"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="+91 98765 43210"
              value={contact.phone}
              onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp (optional)</label>
            <input
              type="tel"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Same as phone if same"
              value={contact.whatsapp}
              onChange={(e) => setContact((c) => ({ ...c, whatsapp: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep("profile")}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleSubmitContact}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — First listing (optional) */}
      {step === "listing" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Optional — you can add listings later too.</p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item / service name</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. Homemade Butter Chicken"
              value={listing.title}
              onChange={(e) => setListing((l) => ({ ...l, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. North Indian, Bakes, Tutoring"
              value={listing.category}
              onChange={(e) => setListing((l) => ({ ...l, category: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹)</label>
            <input
              type="number"
              min="0"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="0"
              value={listing.price}
              onChange={(e) => setListing((l) => ({ ...l, price: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              rows={2}
              placeholder="Ingredients, portions, delivery notes…"
              value={listing.description}
              onChange={(e) => setListing((l) => ({ ...l, description: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleFinalSubmit(true)}
              disabled={submitting}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Skip for now
            </button>
            <button
              onClick={() => handleFinalSubmit(false)}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? "Registering…" : "Go live"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
