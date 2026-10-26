import { useState, useEffect } from "react";
import {
  UserCircle, Save, Loader2, AlertCircle, Building2,
  Mail, Phone, Globe, MapPin, Camera,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { vendorService, vendorCategoryService } from "../../../../services/vendor/vendorService";
import type { VendorResponse, VendorRequest, VendorCategoryResponse } from "../../../../types/api";

export function VendorProfile() {
  const [vendor, setVendor] = useState<VendorResponse | null>(null);
  const [categories, setCategories] = useState<VendorCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<VendorRequest>({
    businessName: "",
    description: "",
    categoryId: 0,
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    logoUrl: "",
    bannerUrl: "",
    gstNumber: "",
    panNumber: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [vendorData, catData] = await Promise.all([
        vendorService.getMyVendorProfile(),
        vendorCategoryService.getCategories(),
      ]);
      setVendor(vendorData);
      setCategories(catData);
      setForm({
        businessName: vendorData.businessName,
        description: vendorData.description || "",
        categoryId: vendorData.category.id,
        email: vendorData.email,
        phone: vendorData.phone,
        website: vendorData.website || "",
        address: vendorData.address,
        city: vendorData.city || "",
        state: vendorData.state || "",
        pinCode: vendorData.pinCode || "",
        logoUrl: vendorData.logoUrl || "",
        bannerUrl: vendorData.bannerUrl || "",
        gstNumber: vendorData.gstNumber || "",
        panNumber: vendorData.panNumber || "",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load profile");
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.email || !form.phone || !form.address) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      await vendorService.updateMyVendorProfile(form);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-[#6b7094] font-medium">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div>
        <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Vendor Portal</span>
        <h1 className="text-3xl font-black text-[#0d0d2b] flex items-center gap-2 mt-1">
          <UserCircle className="h-8 w-8 text-indigo-600" />
          Business Profile
        </h1>
        <p className="text-[#6b7094] text-sm mt-1">Manage your business information and branding</p>
      </div>

      {/* Profile Banner & Logo */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="h-32 sm:h-48 bg-gradient-to-r from-indigo-500 to-violet-600 relative">
          {form.bannerUrl && (
            <img src={form.bannerUrl} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute -bottom-8 left-6">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-slate-300" />
              )}
            </div>
          </div>
        </div>
        <div className="pt-12 pb-4 px-6">
          <h2 className="text-lg font-black text-[#0d0d2b]">{vendor?.businessName}</h2>
          <p className="text-xs text-[#6b7094]">{vendor?.category.name} &middot; {vendor?.status}</p>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-black text-[#0d0d2b] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Business Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Business Name *</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Description</label>
              <textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Describe your business..."
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-black text-[#0d0d2b] mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-600" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Phone *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Website</label>
              <input
                type="url"
                value={form.website || ""}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-black text-[#0d0d2b] mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600" />
            Location
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Address *</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">City</label>
              <input
                type="text"
                value={form.city || ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">State</label>
              <input
                type="text"
                value={form.state || ""}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">PIN Code</label>
              <input
                type="text"
                value={form.pinCode || ""}
                onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-black text-[#0d0d2b] mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-600" />
            Branding
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Logo URL</label>
              <input
                type="url"
                value={form.logoUrl || ""}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">Banner URL</label>
              <input
                type="url"
                value={form.bannerUrl || ""}
                onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Tax Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-black text-[#0d0d2b] mb-4">Tax & Compliance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">GST Number</label>
              <input
                type="text"
                value={form.gstNumber || ""}
                onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6b7094] block mb-1">PAN Number</label>
              <input
                type="text"
                value={form.panNumber || ""}
                onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full hover:opacity-95 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
