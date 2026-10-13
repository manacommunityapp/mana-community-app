import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search, CheckCircle2, XCircle, Clock, AlertCircle,
  Store, ChevronDown, MoreVertical,
} from "lucide-react";
import {
  vendorCommerceProfileService,
  type VmsVendorCommerceProfileResponse,
  type PagedResponse,
} from "../../../../services/commerce/vendorCommerceProfileService";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_VERIFICATION", label: "Under Review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "REJECTED", label: "Rejected" },
  { value: "INACTIVE", label: "Inactive" },
];

const STATUS_BADGE: Record<string, string> = {
  DRAFT:                "bg-slate-100 text-slate-600",
  PENDING_VERIFICATION: "bg-amber-100 text-amber-700",
  VERIFIED:             "bg-green-100 text-green-700",
  SUSPENDED:            "bg-orange-100 text-orange-700",
  REJECTED:             "bg-red-100 text-red-700",
  INACTIVE:             "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft", PENDING_VERIFICATION: "Under Review",
  VERIFIED: "Verified", SUSPENDED: "Suspended",
  REJECTED: "Rejected", INACTIVE: "Inactive",
};

export function CommerceVendorDirectory() {
  const [data, setData] = useState<PagedResponse<VmsVendorCommerceProfileResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);
  const [rejectVendorId, setRejectVendorId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadProfiles();
  }, [statusFilter, page]);

  async function loadProfiles() {
    try {
      setLoading(true);
      const result = await vendorCommerceProfileService.listProfiles({ status: statusFilter || undefined, page, size: 20 });
      setData(result);
    } catch {
      toast.error("Failed to load commerce vendors");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(vendorId: number) {
    try {
      await vendorCommerceProfileService.verifyProfile(vendorId);
      toast.success("Vendor verified for commerce");
      loadProfiles();
    } catch {
      toast.error("Failed to verify vendor");
    }
    setActionMenuId(null);
  }

  async function handleSuspend(vendorId: number) {
    try {
      await vendorCommerceProfileService.suspendProfile(vendorId);
      toast.success("Vendor commerce profile suspended");
      loadProfiles();
    } catch {
      toast.error("Failed to suspend vendor");
    }
    setActionMenuId(null);
  }

  async function handleReject() {
    if (!rejectVendorId) return;
    try {
      await vendorCommerceProfileService.rejectProfile(rejectVendorId, rejectReason);
      toast.success("Vendor commerce profile rejected");
      setRejectVendorId(null);
      setRejectReason("");
      loadProfiles();
    } catch {
      toast.error("Failed to reject vendor");
    }
  }

  const filtered = data?.content.filter(p =>
    !search || p.vendorName?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Commerce Vendors</h2>
          <p className="text-xs text-slate-500 mt-0.5">Review and approve vendors selling in the community marketplace</p>
        </div>
        <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
          {data?.totalElements ?? 0} total
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Store className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-600">No commerce vendors found</p>
          <p className="text-xs text-slate-400 mt-1">Vendors appear here once they set up a commerce profile</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Delivery</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">UPI</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(profile => (
                <tr key={profile.id ?? profile.vendorId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{profile.vendorName}</p>
                    <p className="text-xs text-slate-400">ID: {profile.vendorId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[profile.commerceStatus] ?? "bg-slate-100 text-slate-600"}`}>
                      {profile.commerceStatus === "VERIFIED" && <CheckCircle2 className="w-3 h-3" />}
                      {profile.commerceStatus === "PENDING_VERIFICATION" && <Clock className="w-3 h-3" />}
                      {profile.commerceStatus === "REJECTED" && <XCircle className="w-3 h-3" />}
                      {profile.commerceStatus === "SUSPENDED" && <AlertCircle className="w-3 h-3" />}
                      {STATUS_LABEL[profile.commerceStatus] ?? profile.commerceStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {profile.deliveryAvailable ? `Yes · ${profile.deliveryRadiusKm}km` : "No"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {profile.upiEnabled ? (profile.upiId || "Enabled") : "No"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {profile.submittedAt ? new Date(profile.submittedAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setActionMenuId(actionMenuId === profile.vendorId ? null : profile.vendorId)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-500" />
                    </button>
                    {actionMenuId === profile.vendorId && (
                      <div className="absolute right-4 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px]">
                        {profile.commerceStatus === "PENDING_VERIFICATION" && (
                          <button
                            onClick={() => handleVerify(profile.vendorId)}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-green-700 hover:bg-green-50 flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                          </button>
                        )}
                        {(profile.commerceStatus === "PENDING_VERIFICATION" || profile.commerceStatus === "VERIFIED") && (
                          <button
                            onClick={() => { setRejectVendorId(profile.vendorId); setActionMenuId(null); }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}
                        {profile.commerceStatus === "VERIFIED" && (
                          <button
                            onClick={() => handleSuspend(profile.vendorId)}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50 flex items-center gap-2"
                          >
                            <AlertCircle className="w-3.5 h-3.5" /> Suspend
                          </button>
                        )}
                        <button
                          onClick={() => setActionMenuId(null)}
                          className="w-full text-left px-4 py-2 text-xs text-slate-500 hover:bg-slate-50"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <span className="text-xs text-slate-500">
                Page {page + 1} of {data.totalPages}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
                  Previous
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages - 1}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectVendorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">Reject Commerce Profile</h3>
            <p className="text-xs text-slate-500 mb-4">Provide a reason that will be shown to the vendor.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
              placeholder="Reason for rejection..."
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectVendorId(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleReject} disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
