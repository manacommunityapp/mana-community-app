import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  commerceCustomerService,
  type CommerceCustomerProfileResponse,
  type CommerceCustomerAddressRequest,
  type CommerceCustomerProfileUpdateRequest,
  type AddressLabel,
} from "../../../../services/commerce/commerceCustomerService";

const LABEL_ICONS: Record<AddressLabel, string> = {
  HOME: "🏠",
  WORK: "🏢",
  OTHER: "📍",
};

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Puducherry","Dadra & Nagar Haveli",
];

function LoyaltyBadge({ points }: { points: number }) {
  const tier =
    points >= 5000 ? { label: "Gold", color: "bg-yellow-100 text-yellow-700" } :
    points >= 1000 ? { label: "Silver", color: "bg-gray-200 text-gray-700" } :
                    { label: "Bronze", color: "bg-orange-100 text-orange-700" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${tier.color}`}>
      ★ {tier.label} — {points.toFixed(0)} pts
    </span>
  );
}

export default function MyCommerceProfile() {
  const [profile, setProfile] = useState<CommerceCustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const profileForm = useForm<CommerceCustomerProfileUpdateRequest>();
  const addressForm = useForm<CommerceCustomerAddressRequest>({
    defaultValues: { label: "HOME", isDefault: false },
  });

  const load = () => {
    setLoading(true);
    commerceCustomerService
      .getMyProfile()
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const saveProfile = async (data: CommerceCustomerProfileUpdateRequest) => {
    setSaving(true);
    try {
      const updated = await commerceCustomerService.updateMyProfile(data);
      setProfile(updated);
      setEditingProfile(false);
    } finally {
      setSaving(false);
    }
  };

  const openEditAddress = (id: number) => {
    const addr = profile?.addresses.find((a) => a.id === id);
    if (!addr) return;
    addressForm.reset({
      label: addr.label,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      landmark: addr.landmark,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      latitude: addr.latitude,
      longitude: addr.longitude,
      isDefault: addr.isDefault,
    });
    setEditingAddressId(id);
    setShowAddressForm(true);
  };

  const openNewAddress = () => {
    addressForm.reset({ label: "HOME", isDefault: false });
    setEditingAddressId(null);
    setShowAddressForm(true);
  };

  const saveAddress = async (data: CommerceCustomerAddressRequest) => {
    setSaving(true);
    try {
      if (editingAddressId) {
        await commerceCustomerService.updateAddress(editingAddressId, data);
      } else {
        await commerceCustomerService.addAddress(data);
      }
      setShowAddressForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id: number) => {
    if (!confirm("Delete this address?")) return;
    await commerceCustomerService.deleteAddress(id);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        Loading your commerce profile…
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* ── Profile card ────────────────────────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Commerce Profile</h2>
          {!editingProfile && (
            <button
              onClick={() => {
                profileForm.reset({
                  displayName: profile.displayName,
                  phoneNumber: profile.phoneNumber,
                  preferredCategories: profile.preferredCategories,
                });
                setEditingProfile(true);
              }}
              className="text-xs font-medium text-violet-600 hover:text-violet-800"
            >
              Edit
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Orders", value: profile.totalOrders },
            { label: "Total Spent", value: `₹${Number(profile.totalSpend).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
            { label: "Loyalty", value: <LoyaltyBadge points={Number(profile.loyaltyPoints)} /> },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-gray-50 px-3 py-3">
              <div className="text-xs text-gray-500 mb-1">{label}</div>
              <div className="text-sm font-semibold text-gray-800">{value}</div>
            </div>
          ))}
        </div>

        {editingProfile ? (
          <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
              <input
                {...profileForm.register("displayName")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
              <input
                {...profileForm.register("phoneNumber")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="+91 …"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Preferred Categories (comma-separated)
              </label>
              <input
                {...profileForm.register("preferredCategories")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Staples, Dairy, Fresh Produce"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-1 text-sm text-gray-700">
            <p><span className="text-gray-500">Name:</span> {profile.displayName || "—"}</p>
            <p><span className="text-gray-500">Email:</span> {profile.email || "—"}</p>
            <p><span className="text-gray-500">Phone:</span> {profile.phoneNumber || "—"}</p>
            {profile.preferredCategories && (
              <p><span className="text-gray-500">Preferred:</span> {profile.preferredCategories}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {profile.isMember && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                  ✓ Community Member
                </span>
              )}
              {profile.kycVerified && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  ✓ KYC Verified
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Delivery Addresses ──────────────────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Delivery Addresses</h2>
          {!showAddressForm && (
            <button
              onClick={openNewAddress}
              className="text-xs font-medium text-violet-600 hover:text-violet-800"
            >
              + Add Address
            </button>
          )}
        </div>

        {showAddressForm ? (
          <form onSubmit={addressForm.handleSubmit(saveAddress)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                <select
                  {...addressForm.register("label")}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="HOME">🏠 Home</option>
                  <option value="WORK">🏢 Work</option>
                  <option value="OTHER">📍 Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pincode *</label>
                <input
                  {...addressForm.register("pincode", {
                    required: true,
                    pattern: /^\d{6}$/,
                  })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="6-digit PIN"
                  maxLength={6}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 1 *</label>
              <input
                {...addressForm.register("addressLine1", { required: true })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Flat / House No., Street"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 2</label>
              <input
                {...addressForm.register("addressLine2")}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Locality, Area"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Landmark</label>
              <input
                {...addressForm.register("landmark")}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Near …"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
                <input
                  {...addressForm.register("city", { required: true })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">State *</label>
                <select
                  {...addressForm.register("state", { required: true })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="">— Select —</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                {...addressForm.register("isDefault")}
                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              Set as default delivery address
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : editingAddressId ? "Update Address" : "Add Address"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddressForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : profile.addresses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No addresses saved yet.
          </p>
        ) : (
          <div className="space-y-3">
            {profile.addresses.map((addr) => (
              <div
                key={addr.id}
                className={`rounded-lg border p-3 relative ${
                  addr.isDefault
                    ? "border-violet-200 bg-violet-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{LABEL_ICONS[addr.label]}</span>
                    <span className="text-xs font-semibold text-gray-600 uppercase">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="text-xs font-medium text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => openEditAddress(addr.id)}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                  {addr.landmark ? ` (near ${addr.landmark})` : ""}
                </p>
                <p className="text-sm text-gray-600">
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
