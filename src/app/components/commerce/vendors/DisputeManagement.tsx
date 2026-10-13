import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../../../services/common/apiClient";

interface DisputeDto {
  id: number;
  disputeCode: string;
  orderId: number;
  orderNumber: string;
  userId: number;
  userName: string;
  reason: string;
  description: string;
  requestedResolution: string;
  claimAmount: number;
  status: string;
  vendorResponse: string | null;
  resolvedAt: string | null;
  createdAt: string;
  resolution: string | null;
  adminNote: string | null;
  resolvedByName: string | null;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const RESOLUTION_OPTIONS = [
  { value: "REFUND", label: "Full Refund" },
  { value: "PARTIAL_REFUND", label: "Partial Refund" },
  { value: "REPLACEMENT", label: "Replacement" },
  { value: "ACKNOWLEDGED", label: "Acknowledged (No Action)" },
  { value: "REJECTED", label: "Reject Dispute" },
];

export default function DisputeManagement() {
  const [disputes, setDisputes] = useState<DisputeDto[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeDto | null>(null);
  const [resolution, setResolution] = useState("ACKNOWLEDGED");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "15" });
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      const res = await apiClient.get<Page<DisputeDto>>(`/commerce/disputes/admin?${params}`);
      setDisputes(res.content);
      setTotalPages(res.totalPages);
    } catch {
      showToast("Failed to load disputes", "error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const openResolveDialog = (dispute: DisputeDto) => {
    setSelectedDispute(dispute);
    setResolution("ACKNOWLEDGED");
    setAdminNote("");
    setResolveDialogOpen(true);
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/commerce/disputes/${selectedDispute.disputeCode}/resolve`, {
        resolution,
        adminNote,
      });
      showToast("Dispute resolved successfully");
      setResolveDialogOpen(false);
      fetchDisputes();
    } catch {
      showToast("Failed to resolve dispute", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispute Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and resolve buyer disputes for your community
          </p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-3 py-1.5 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <label className="text-sm font-medium">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-44"
        >
          <option value="all">All</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Dispute #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Order #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Buyer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Claim (₹)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Raised On</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">Loading…</td>
              </tr>
            ) : disputes.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">No disputes found</td>
              </tr>
            ) : (
              disputes.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{d.disputeCode}</td>
                  <td className="px-4 py-3 font-mono text-xs">{d.orderNumber}</td>
                  <td className="px-4 py-3">{d.userName}</td>
                  <td className="px-4 py-3 max-w-[160px] truncate" title={d.reason}>{d.reason}</td>
                  <td className="px-4 py-3 text-right">
                    {d.claimAmount > 0 ? `₹${Number(d.claimAmount).toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {d.status !== "RESOLVED" && d.status !== "CLOSED" ? (
                      <button
                        onClick={() => openResolveDialog(d)}
                        className="px-2 py-1 rounded border border-gray-300 text-xs font-medium hover:bg-gray-50"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">{d.resolution ?? "Resolved"}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm self-center text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Resolve Dialog */}
      {resolveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setResolveDialogOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Resolve Dispute</h2>
            {selectedDispute && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-md p-3 space-y-1 text-sm">
                  <div><span className="font-medium">Dispute:</span> {selectedDispute.disputeCode}</div>
                  <div><span className="font-medium">Order:</span> {selectedDispute.orderNumber}</div>
                  <div><span className="font-medium">Buyer:</span> {selectedDispute.userName}</div>
                  <div><span className="font-medium">Reason:</span> {selectedDispute.reason}</div>
                  {selectedDispute.description && (
                    <div><span className="font-medium">Details:</span> {selectedDispute.description}</div>
                  )}
                  {selectedDispute.claimAmount > 0 && (
                    <div><span className="font-medium">Claim:</span> ₹{Number(selectedDispute.claimAmount).toLocaleString("en-IN")}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="resolution" className="text-sm font-medium">Resolution Action</label>
                  <select
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-2 text-sm"
                  >
                    {RESOLUTION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {resolution === "REFUND" && (
                    <p className="text-xs text-amber-600 mt-1">
                      A full refund will be triggered automatically for this order.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="adminNote" className="text-sm font-medium">Admin Note (internal)</label>
                  <textarea
                    id="adminNote"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Notes for internal reference…"
                    rows={3}
                    className="w-full border border-gray-300 rounded px-2 py-2 text-sm resize-none"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResolveDialogOpen(false)}
                disabled={submitting}
                className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={submitting}
                className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Resolving…" : "Confirm Resolution"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
