import { useState, useEffect } from "react";
import { Truck, Plus, Check, X, ShieldAlert, Award, FileText, IndianRupee, Calendar, User, Search, CheckCircle2, ChevronRight, AlertCircle, Sparkles } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { procurementService, type PurchaseRequest, type Vendor } from "../../../services/procurementService";

const CATEGORIES = [
  { value: "CapEx_Asset", label: "CapEx (Capital Asset Purchase)" },
  { value: "OpEx_Maintenance", label: "OpEx (Repairs & Maintenance)" },
  { value: "OpEx_Consumable", label: "OpEx (Supplies & Consumables)" },
  { value: "OpEx_Other", label: "OpEx (Other Operations)" },
  { value: "SPORTS", label: "Sports Activities" },
  { value: "FESTIVAL", label: "Festival Celebrations" },
  { value: "CLEANING", label: "Cleaning & Sanitation" },
  { value: "SECURITY", label: "Security Services" },
  { value: "EVENTS", label: "Social Events" }
];

const STATUS_CONFIG = {
  REQUESTED: { label: "Requested", bg: "bg-slate-100 border-slate-200 text-slate-500" },
  COMMITTEE_APPROVED: { label: "Committee Approved", bg: "bg-blue-50 border-blue-200 text-blue-600" },
  QUOTATIONS_COLLECTED: { label: "Quotations Collected", bg: "bg-indigo-50 border-indigo-200 text-indigo-600" },
  VENDOR_SELECTED: { label: "Vendor Selected", bg: "bg-teal-50 border-teal-200 text-teal-600" },
  PURCHASE_ORDERED: { label: "PO Issued", bg: "bg-purple-50 border-purple-200 text-purple-600" },
  GOODS_RECEIVED: { label: "Goods Received", bg: "bg-emerald-50 border-emerald-200 text-emerald-600" },
  INVOICED: { label: "Invoiced", bg: "bg-cyan-50 border-cyan-200 text-cyan-600" },
  INVENTORY_CREATED: { label: "Asset Provisioned", bg: "bg-green-50 border-green-200 text-green-600" },
  REJECTED: { label: "Rejected", bg: "bg-red-50 border-red-200 text-red-600" },
  CANCELLED: { label: "Cancelled", bg: "bg-slate-100 border-slate-200 text-slate-500" }
};

export function ProcurementDashboard() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"requests" | "vendors" | "add-vendor">("requests");

  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "PO" | "RECEIVE" | null>(null);

  // Forms
  const [requestForm, setRequestForm] = useState({
    title: "",
    description: "",
    category: "OpEx_Maintenance",
    estimatedAmount: "",
    neededBy: "",
    vendorId: ""
  });
  const [vendorForm, setVendorForm] = useState({
    name: "",
    gstNumber: "",
    pan: "",
    contactPerson: "",
    mobile: "",
    email: "",
    bankDetails: "",
    categories: "",
    rating: 5
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const data = await procurementService.getPurchaseRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load purchase requests");
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await procurementService.getVendors();
      setVendors(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load vendors");
    }
  };

  useEffect(() => {
    setLoading(true);
    if (activeSubTab === "requests") {
      fetchRequests().finally(() => setLoading(false));
    } else if (activeSubTab === "vendors") {
      fetchVendors().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeSubTab]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.title.trim() || !requestForm.estimatedAmount) {
      toast.error("Title and Estimated Amount are required");
      return;
    }
    setSubmitting(true);
    try {
      const selectedVendorObj = vendors.find((v) => v.id === parseInt(requestForm.vendorId)) || undefined;
      await procurementService.createPurchaseRequest({
        title: requestForm.title,
        description: requestForm.description,
        category: requestForm.category,
        estimatedAmount: parseFloat(requestForm.estimatedAmount),
        neededBy: requestForm.neededBy || undefined,
        selectedVendor: selectedVendorObj,
        requestedBy: user?.fullName || "Committee Member"
      });
      toast.success("Purchase Request created!");
      setShowRequestModal(false);
      setRequestForm({
        title: "",
        description: "",
        category: "OpEx_Maintenance",
        estimatedAmount: "",
        neededBy: "",
        vendorId: ""
      });
      fetchRequests();
    } catch {
      toast.error("Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) {
      toast.error("Vendor Name is required");
      return;
    }
    setSubmitting(true);
    try {
      await procurementService.createVendor(vendorForm);
      toast.success("Vendor registered successfully!");
      setVendorForm({
        name: "",
        gstNumber: "",
        pan: "",
        contactPerson: "",
        mobile: "",
        email: "",
        bankDetails: "",
        categories: "",
        rating: 5
      });
      setActiveSubTab("vendors");
    } catch {
      toast.error("Failed to register vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !actionType) return;
    setSubmitting(true);
    try {
      let targetStatus: PurchaseRequest["status"] = "REQUESTED";
      if (actionType === "APPROVE") targetStatus = "COMMITTEE_APPROVED";
      else if (actionType === "REJECT") targetStatus = "REJECTED";
      else if (actionType === "PO") targetStatus = "PURCHASE_ORDERED";
      else if (actionType === "RECEIVE") targetStatus = "GOODS_RECEIVED";

      await procurementService.updateRequestStatus(
        selectedRequest.id,
        targetStatus,
        actionNotes || undefined,
        poNumber || undefined
      );

      toast.success(`Request status updated successfully!`);
      setActionType(null);
      setSelectedRequest(null);
      setActionNotes("");
      setPoNumber("");
      fetchRequests();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt);

  return (
    <div className="min-h-screen text-[#0d0d2b] p-6 font-sans">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Facility Management</span>
          <h1 className="text-2xl font-black text-[#0d0d2b] flex items-center gap-2 mt-0.5">
            <Truck className="h-7 w-7 text-indigo-600" />
            Procurement Management
          </h1>
          <p className="text-[#6b7094] text-xs mt-1">Manage purchase requests, purchase orders, and vendor directories.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchVendors();
              setShowRequestModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Request
          </button>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto mb-6">
        <button
          onClick={() => setActiveSubTab("requests")}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "requests" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20" : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-100"
          }`}
        >
          Purchase Requests
        </button>
        <button
          onClick={() => setActiveSubTab("vendors")}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "vendors" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20" : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-100"
          }`}
        >
          Vendors Directory
        </button>
        <button
          onClick={() => setActiveSubTab("add-vendor")}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "add-vendor" ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20" : "text-[#6b7094] hover:text-[#0d0d2b] hover:bg-slate-100"
          }`}
        >
          Add Vendor
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="bg-white border border-[#6366f1]/12 py-20 text-center text-[#6b7094] rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
          Loading directory listings...
        </div>
      ) : activeSubTab === "requests" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Requests List */}
          <div className="lg:col-span-2 space-y-4">
            {requests.length === 0 ? (
              <div className="bg-white border border-[#6366f1]/12 rounded-2xl py-20 text-center text-[#6b7094] shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
                <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                No purchase requests logged yet.
              </div>
            ) : (
              requests.map((req) => {
                const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.REQUESTED;
                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      setSelectedRequest(req);
                      setActionType(null);
                    }}
                    className={`bg-white border rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] transition-all cursor-pointer hover:border-indigo-500/20 hover:shadow-md flex flex-col justify-between ${
                      selectedRequest?.id === req.id ? "border-indigo-600 bg-indigo-50/30" : "border-[#6366f1]/12"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono text-[#6b7094] font-semibold">PR ID: #{req.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusCfg.bg}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-[#0d0d2b] leading-tight">{req.title}</h4>
                      <p className="text-xs text-[#6b7094] mt-1 line-clamp-2">{req.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[#6b7094]">Estimated cost:</span>
                        <p className="font-bold text-indigo-600 mt-0.5">{formatCurrency(req.estimatedAmount)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[#6b7094]">Requested By:</span>
                        <p className="font-semibold text-[#374151] mt-0.5">{req.requestedBy}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Request Details Side panel */}
          <div className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] h-fit space-y-5">
            {selectedRequest ? (
              <>
                <div>
                  <span className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider block">Request Verification</span>
                  <h3 className="font-bold text-base text-[#0d0d2b] mt-1.5">{selectedRequest.title}</h3>
                  <p className="text-xs text-[#6b7094] mt-2 leading-relaxed">{selectedRequest.description}</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6b7094]">Category:</span>
                    <span className="font-semibold text-[#0d0d2b]">
                      {CATEGORIES.find((c) => c.value === selectedRequest.category)?.label || selectedRequest.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7094]">Estimated Cost:</span>
                    <span className="font-bold text-indigo-600">{formatCurrency(selectedRequest.estimatedAmount)}</span>
                  </div>
                  {selectedRequest.selectedVendor && (
                    <div className="flex justify-between">
                      <span className="text-[#6b7094]">Selected Vendor:</span>
                      <span className="font-semibold text-[#0d0d2b]">{selectedRequest.selectedVendor.name}</span>
                    </div>
                  )}
                  {selectedRequest.neededBy && (
                    <div className="flex justify-between">
                      <span className="text-[#6b7094]">Needed By:</span>
                      <span className="font-semibold text-[#0d0d2b]">{selectedRequest.neededBy}</span>
                    </div>
                  )}
                  {selectedRequest.purchaseOrderNumber && (
                    <div className="flex justify-between">
                      <span className="text-[#6b7094]">PO Number:</span>
                      <span className="font-mono font-semibold text-indigo-600">{selectedRequest.purchaseOrderNumber}</span>
                    </div>
                  )}
                  {selectedRequest.approvalNotes && (
                    <div>
                      <span className="text-[#6b7094] block mb-1">Approval Notes:</span>
                      <p className="text-[#374151] bg-white p-2 rounded border border-slate-200 leading-relaxed font-semibold">
                        {selectedRequest.approvalNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Workflow Actions */}
                {actionType ? (
                  <form onSubmit={handleActionConfirm} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-150">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      {actionType === "APPROVE" ? "Confirm Committee Approval" :
                       actionType === "REJECT" ? "Provide Rejection Reason" :
                       actionType === "PO" ? "Create Purchase Order" :
                       "Confirm Receipt of Goods"}
                    </span>
                    {actionType === "PO" && (
                      <div>
                        <label className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider block mb-1">Purchase Order Number</label>
                        <input
                          type="text"
                          value={poNumber}
                          onChange={(e) => setPoNumber(e.target.value)}
                          placeholder="e.g. PO-2026-9908"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none"
                          required
                        />
                      </div>
                    )}
                    {(actionType === "APPROVE" || actionType === "REJECT") && (
                      <div>
                        <label className="text-[10px] font-bold text-[#6b7094] uppercase tracking-wider block mb-1">Remarks / Feedback</label>
                        <input
                          type="text"
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          placeholder="e.g. Budget approved for this purchase"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0d0d2b] placeholder:text-slate-400 focus:outline-none"
                          required
                        />
                      </div>
                    )}
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setActionType(null)}
                        className="px-3 py-1.5 text-xs text-[#6b7094] hover:text-[#0d0d2b] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        {submitting ? "Processing..." : "Confirm"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.status === "REQUESTED" && (
                      <>
                        <button
                          onClick={() => setActionType("REJECT")}
                          className="flex-1 min-w-[80px] py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => setActionType("APPROVE")}
                          className="flex-1 min-w-[80px] py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                      </>
                    )}
                    {selectedRequest.status === "COMMITTEE_APPROVED" && (
                      <button
                        onClick={() => setActionType("PO")}
                        className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Issue Purchase Order
                      </button>
                    )}
                    {selectedRequest.status === "PURCHASE_ORDERED" && (
                      <button
                        onClick={() => setActionType("RECEIVE")}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Confirm Delivery of Goods
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-[#6b7094] text-xs">
                Select a request from the feed to view workflow actions and approval history.
              </div>
            )}
          </div>
        </div>
      ) : activeSubTab === "vendors" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
          {vendors.length === 0 ? (
            <div className="col-span-full bg-white border border-[#6366f1]/12 rounded-2xl py-20 text-center text-[#6b7094] shadow-[0_4px_20px_rgba(99,102,241,0.05)]">
              No vendors registered.
            </div>
          ) : (
            vendors.map((v) => (
              <div key={v.id} className="bg-white border border-[#6366f1]/12 rounded-2xl p-5 shadow-[0_4px_20px_rgba(99,102,241,0.05)] flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-[#6b7094] font-semibold">Vendor ID: #{v.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${v.active ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                      {v.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#0d0d2b] leading-tight">{v.name}</h4>
                    <p className="text-[10px] text-[#6b7094] mt-1">{v.categories || "General Services"}</p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 text-xs space-y-1.5 text-[#6b7094]">
                  {v.contactPerson && (
                    <div className="flex justify-between">
                      <span>Contact:</span>
                      <span className="text-[#0d0d2b]">{v.contactPerson}</span>
                    </div>
                  )}
                  {v.mobile && (
                    <div className="flex justify-between">
                      <span>Mobile:</span>
                      <span className="text-[#0d0d2b]">{v.mobile}</span>
                    </div>
                  )}
                  {v.gstNumber && (
                    <div className="flex justify-between">
                      <span>GSTIN:</span>
                      <span className="font-mono text-[#0d0d2b]">{v.gstNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <form onSubmit={handleVendorSubmit} className="bg-white border border-[#6366f1]/12 rounded-2xl p-6 shadow-[0_4px_20px_rgba(99,102,241,0.05)] max-w-lg mx-auto space-y-4">
          <h3 className="font-bold text-base text-[#0d0d2b] flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Register Supplier / Vendor
          </h3>

          <div className="space-y-4 text-sm">
            <div>
              <label className="text-xs font-semibold text-[#6b7094] block mb-1">Supplier / Vendor Name *</label>
              <input
                type="text"
                value={vendorForm.name}
                onChange={(e) => setVendorForm((v) => ({ ...v, name: e.target.value }))}
                placeholder="e.g. BuildMart Hardware Ltd"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#6b7094] block mb-1">GSTIN</label>
                <input
                  type="text"
                  value={vendorForm.gstNumber}
                  onChange={(e) => setVendorForm((v) => ({ ...v, gstNumber: e.target.value }))}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6b7094] block mb-1">PAN</label>
                <input
                  type="text"
                  value={vendorForm.pan}
                  onChange={(e) => setVendorForm((v) => ({ ...v, pan: e.target.value }))}
                  placeholder="ABCDE1234F"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#6b7094] block mb-1">Contact Person</label>
                <input
                  type="text"
                  value={vendorForm.contactPerson}
                  onChange={(e) => setVendorForm((v) => ({ ...v, contactPerson: e.target.value }))}
                  placeholder="e.g. Ramesh Shah"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#6b7094] block mb-1">Mobile</label>
                <input
                  type="text"
                  value={vendorForm.mobile}
                  onChange={(e) => setVendorForm((v) => ({ ...v, mobile: e.target.value }))}
                  placeholder="9876543210"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#6b7094] block mb-1">Categories (Comma separated)</label>
              <input
                type="text"
                value={vendorForm.categories}
                onChange={(e) => setVendorForm((v) => ({ ...v, categories: e.target.value }))}
                placeholder="e.g. Electrical, Hardware, Gardening"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#6b7094] block mb-1">Settlement Bank details</label>
              <input
                type="text"
                value={vendorForm.bankDetails}
                onChange={(e) => setVendorForm((v) => ({ ...v, bankDetails: e.target.value }))}
                placeholder="IFSC: ICIC0000011, A/C: 100200300400"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Registering..." : "Confirm Supplier Registration"}
            </button>
          </div>
        </form>
      )}

      {/* Create Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowRequestModal(false)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#0d0d2b] flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                New Purchase Request
              </h3>
              <button onClick={() => setShowRequestModal(false)} className="text-[#6b7094] hover:text-[#0d0d2b] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#6b7094] block mb-1">Request Title *</label>
                <input
                  type="text"
                  value={requestForm.title}
                  onChange={(e) => setRequestForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Honda Lawnmower for Central Park"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#6b7094] block mb-1">Description *</label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Provide specifications, justification, and quantity details..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0d0d2b] focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#6b7094] block mb-1">Category</label>
                  <select
                    value={requestForm.category}
                    onChange={(e) => setRequestForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-[#0d0d2b] focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6b7094] block mb-1">Estimated Cost (INR) *</label>
                  <input
                    type="number"
                    value={requestForm.estimatedAmount}
                    onChange={(e) => setRequestForm((f) => ({ ...f, estimatedAmount: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm text-[#0d0d2b] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#6b7094] block mb-1">Target Vendor</label>
                  <select
                    value={requestForm.vendorId}
                    onChange={(e) => setRequestForm((f) => ({ ...f, vendorId: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-xs text-[#0d0d2b] focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6b7094] block mb-1">Needed By Date</label>
                  <input
                    type="date"
                    value={requestForm.neededBy}
                    onChange={(e) => setRequestForm((f) => ({ ...f, neededBy: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0d0d2b] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 text-white font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Purchase Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
