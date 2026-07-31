import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight,
  Briefcase, Loader2, AlertCircle, IndianRupee, Clock, Star,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { vendorServiceCatalog, vendorCategoryService } from "../../../../services/vendorService";
import type { VendorServiceResponse, VendorServiceRequest, VendorCategoryResponse } from "../../../../types/api";

export function MyServices() {
  const [services, setServices] = useState<VendorServiceResponse[]>([]);
  const [categories, setCategories] = useState<VendorCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<VendorServiceResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const emptyForm: VendorServiceRequest = {
    name: "",
    description: "",
    shortDescription: "",
    categoryId: undefined,
    price: 0,
    priceUnit: "per_service",
    discountPrice: undefined,
    duration: undefined,
    durationUnit: "minutes",
    imageUrl: "",
    tags: [],
  };
  const [form, setForm] = useState<VendorServiceRequest>(emptyForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [svcRes, catRes] = await Promise.all([
        vendorServiceCatalog.getMyServices(0, 100),
        vendorCategoryService.getCategories(),
      ]);
      setServices(svcRes.content);
      setCategories(catRes);
    } catch (err) {
      console.error(err);
      setError("Failed to load services");
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (svc: VendorServiceResponse) => {
    setEditingService(svc);
    setForm({
      name: svc.name,
      description: svc.description || "",
      shortDescription: svc.shortDescription || "",
      categoryId: svc.categoryId,
      price: svc.price,
      priceUnit: svc.priceUnit || "per_service",
      discountPrice: svc.discountPrice,
      duration: svc.duration,
      durationUnit: svc.durationUnit || "minutes",
      imageUrl: svc.imageUrl || "",
      tags: svc.tags || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error("Please fill in name and price");
      return;
    }
    setSubmitting(true);
    try {
      if (editingService) {
        await vendorServiceCatalog.updateService(editingService.id, form);
        toast.success("Service updated successfully");
      } else {
        await vendorServiceCatalog.createService(form);
        toast.success("Service created successfully");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(editingService ? "Failed to update service" : "Failed to create service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await vendorServiceCatalog.toggleServiceActive(id);
      toast.success("Service status updated");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle service status");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await vendorServiceCatalog.deleteService(id);
      toast.success("Service deleted");
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete service");
    }
  };

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Vendor Portal</span>
          <h1 className="text-3xl font-black text-[#0d0d2b] flex items-center gap-2 mt-1">
            <Briefcase className="h-8 w-8 text-indigo-600" />
            My Services
          </h1>
          <p className="text-[#6b7094] text-sm mt-1">Manage your service catalog</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white px-5 py-3 rounded-full font-bold transition-all text-sm md:self-end"
        >
          <Plus className="h-5 w-5" />
          Add Service
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Services Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-[#6b7094] font-medium">No services found</p>
          <p className="text-xs text-slate-400 mt-1">Create your first service to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((svc) => (
            <div
              key={svc.id}
              className={`bg-white border rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)] overflow-hidden transition-all ${
                svc.active ? "border-slate-200" : "border-slate-200 opacity-60"
              }`}
            >
              {/* Image or placeholder */}
              {svc.imageUrl ? (
                <div className="h-36 bg-slate-100 overflow-hidden">
                  <img src={svc.imageUrl} alt={svc.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-36 bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                  <Briefcase className="w-10 h-10 text-indigo-300" />
                </div>
              )}

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-[#0d0d2b]">{svc.name}</h3>
                    {svc.categoryName && (
                      <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">{svc.categoryName}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${svc.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {svc.active ? "Active" : "Inactive"}
                  </span>
                </div>

                {svc.shortDescription && (
                  <p className="text-xs text-[#6b7094] line-clamp-2">{svc.shortDescription}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-[#6b7094]">
                  <span className="flex items-center gap-1 font-bold text-[#0d0d2b]">
                    <IndianRupee className="w-3 h-3" />
                    {svc.discountPrice ? (
                      <>
                        <span className="line-through text-slate-400 font-normal">₹{svc.price}</span>
                        <span>₹{svc.discountPrice}</span>
                      </>
                    ) : (
                      <span>₹{svc.price}</span>
                    )}
                    <span className="font-normal text-slate-400">/{svc.priceUnit}</span>
                  </span>
                  {svc.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {svc.duration} {svc.durationUnit || "min"}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500" />
                    {svc.avgRating.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleActive(svc.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#6b7094] hover:text-indigo-600 transition-colors"
                  >
                    {svc.active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                    {svc.active ? "Active" : "Inactive"}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(svc)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {deleteConfirm === svc.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(svc.id)}
                          className="text-[10px] font-bold text-red-600 px-2 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-[10px] font-bold text-slate-500 px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(svc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-black text-[#0d0d2b]">
                {editingService ? "Edit Service" : "Add New Service"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#6b7094] block mb-1">Service Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6b7094] block mb-1">Short Description</label>
                <input
                  type="text"
                  value={form.shortDescription || ""}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6b7094] block mb-1">Description</label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#6b7094] block mb-1">Category</label>
                <select
                  value={form.categoryId || ""}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#6b7094] block mb-1">Price *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    min={0}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6b7094] block mb-1">Price Unit</label>
                  <select
                    value={form.priceUnit || "per_service"}
                    onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="per_service">Per Service</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="per_day">Per Day</option>
                    <option value="per_visit">Per Visit</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#6b7094] block mb-1">Discount Price</label>
                  <input
                    type="number"
                    value={form.discountPrice || ""}
                    onChange={(e) => setForm({ ...form, discountPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#6b7094] block mb-1">Duration</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={form.duration || ""}
                      onChange={(e) => setForm({ ...form, duration: e.target.value ? Number(e.target.value) : undefined })}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                      min={0}
                    />
                    <select
                      value={form.durationUnit || "minutes"}
                      onChange={(e) => setForm({ ...form, durationUnit: e.target.value })}
                      className="w-20 px-2 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="minutes">min</option>
                      <option value="hours">hrs</option>
                      <option value="days">days</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#6b7094] block mb-1">Image URL</label>
                <input
                  type="text"
                  value={form.imageUrl || ""}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-bold text-[#6b7094] hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingService ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
