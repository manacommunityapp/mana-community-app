import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Store, Truck, MapPin, CreditCard, CheckCircle2,
  AlertCircle, Clock, XCircle, Send, Settings,
} from "lucide-react";
import {
  vendorCommerceProfileService,
  type VmsVendorCommerceProfileResponse,
  type VmsVendorCommerceProfileRequest,
} from "../../../../services/commerce/vendorCommerceProfileService";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:                { label: "Draft",              color: "bg-slate-100 text-slate-600",  icon: <Settings className="w-3.5 h-3.5" /> },
  PENDING_VERIFICATION: { label: "Under Review",       color: "bg-amber-100 text-amber-700",  icon: <Clock className="w-3.5 h-3.5" /> },
  VERIFIED:             { label: "Verified",           color: "bg-green-100 text-green-700",  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  SUSPENDED:            { label: "Suspended",          color: "bg-orange-100 text-orange-700",icon: <AlertCircle className="w-3.5 h-3.5" /> },
  REJECTED:             { label: "Rejected",           color: "bg-red-100 text-red-700",      icon: <XCircle className="w-3.5 h-3.5" /> },
  INACTIVE:             { label: "Inactive",           color: "bg-gray-100 text-gray-600",    icon: <XCircle className="w-3.5 h-3.5" /> },
};

interface Props {
  /** When provided, loads the profile for that specific vendor (admin use).
   *  When omitted, loads the logged-in user's own vendor commerce profile. */
  vendorId?: number;
}

export function VendorCommerceProfile({ vendorId }: Props) {
  const [profile, setProfile] = useState<VmsVendorCommerceProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm<VmsVendorCommerceProfileRequest>();
  const deliveryEnabled = watch("deliveryAvailable");

  useEffect(() => {
    loadProfile();
  }, [vendorId]);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = vendorId
        ? await vendorCommerceProfileService.getProfile(vendorId)
        : await vendorCommerceProfileService.getMyProfile();
      setProfile(data);
      reset({
        upiEnabled: data.upiEnabled,
        upiId: data.upiId ?? "",
        deliveryAvailable: data.deliveryAvailable,
        deliveryRadiusKm: data.deliveryRadiusKm,
        avgDeliveryTimeMinutes: data.avgDeliveryTimeMinutes,
        minOrderAmount: data.minOrderAmount,
        pickupAvailable: data.pickupAvailable,
        pickupAddress: data.pickupAddress ?? "",
        storefrontEnabled: data.storefrontEnabled,
        storefrontDescription: data.storefrontDescription ?? "",
        storefrontBannerUrl: data.storefrontBannerUrl ?? "",
        communityVisible: data.communityVisible,
      });
    } catch {
      toast.error("Failed to load commerce profile");
    } finally {
      setLoading(false);
    }
  }

  async function onSave(data: VmsVendorCommerceProfileRequest) {
    if (!profile?.vendorId) return;
    try {
      setSaving(true);
      const updated = await vendorCommerceProfileService.upsertProfile(profile.vendorId, data);
      setProfile(updated);
      toast.success("Commerce profile saved");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmitForVerification() {
    if (!profile?.vendorId) return;
    try {
      setSubmitting(true);
      const updated = await vendorCommerceProfileService.submitForVerification(profile.vendorId);
      setProfile(updated);
      toast.success("Profile submitted for verification");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to submit for verification");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const statusCfg = profile ? STATUS_CONFIG[profile.commerceStatus] ?? STATUS_CONFIG.DRAFT : STATUS_CONFIG.DRAFT;
  const canSubmit = profile?.commerceStatus === "DRAFT" || profile?.commerceStatus === "REJECTED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Commerce Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your storefront, delivery, and payment settings to start selling in the community marketplace.
          </p>
        </div>
        {profile && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}>
            {statusCfg.icon}
            {statusCfg.label}
          </span>
        )}
      </div>

      {/* Rejection reason */}
      {profile?.commerceStatus === "REJECTED" && profile.rejectionReason && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Verification Rejected</p>
            <p className="text-xs text-red-600 mt-1">{profile.rejectionReason}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        {/* Storefront */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Storefront</h3>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("storefrontEnabled")} className="rounded border-slate-300 text-indigo-600 w-4 h-4" />
            <span className="text-sm text-slate-700 font-medium">Enable storefront in community marketplace</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("communityVisible")} className="rounded border-slate-300 text-indigo-600 w-4 h-4" />
            <span className="text-sm text-slate-700 font-medium">Make visible to community members</span>
          </label>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Storefront Description</label>
            <textarea
              {...register("storefrontDescription")}
              rows={3}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Describe your store to community members..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Banner Image URL</label>
            <input
              type="url"
              {...register("storefrontBannerUrl")}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>
        </section>

        {/* Delivery */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Delivery</h3>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("deliveryAvailable")} className="rounded border-slate-300 text-indigo-600 w-4 h-4" />
            <span className="text-sm text-slate-700 font-medium">Offer home delivery</span>
          </label>
          {deliveryEnabled && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Delivery Radius (km)</label>
                <input type="number" min={1} max={100} {...register("deliveryRadiusKm", { valueAsNumber: true })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Avg Delivery Time (min)</label>
                <input type="number" min={0} max={1440} {...register("avgDeliveryTimeMinutes", { valueAsNumber: true })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Min Order Amount (₹)</label>
                <input type="number" min={0} step="0.01" {...register("minOrderAmount", { valueAsNumber: true })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
            </div>
          )}
        </section>

        {/* Pickup */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Pickup</h3>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("pickupAvailable")} className="rounded border-slate-300 text-indigo-600 w-4 h-4" />
            <span className="text-sm text-slate-700 font-medium">Allow customer pickup</span>
          </label>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Pickup Address</label>
            <input
              type="text"
              {...register("pickupAddress")}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Shop address for pickup..."
            />
          </div>
        </section>

        {/* Payment */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Payment</h3>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("upiEnabled")} className="rounded border-slate-300 text-indigo-600 w-4 h-4" />
            <span className="text-sm text-slate-700 font-medium">Accept UPI payments</span>
          </label>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">UPI ID</label>
            <input
              type="text"
              {...register("upiId")}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="yourname@upi"
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
          {canSubmit && (
            <button
              type="button"
              onClick={onSubmitForVerification}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit for Verification"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
