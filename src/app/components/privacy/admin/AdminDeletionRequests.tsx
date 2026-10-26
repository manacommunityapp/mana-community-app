import React, { useState, useEffect } from "react";
import {
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  User,
  Calendar,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  privacyService,
  type DataDeletionRequest,
} from "../../../../services/privacy/privacyService";

export const AdminDeletionRequests: React.FC = () => {
  const [requests, setRequests] = useState<DataDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Action Modal State
  const [activeRequest, setActiveRequest] = useState<DataDeletionRequest | null>(null);
  const [actionType, setActionType] = useState<"PROCESS" | "REJECT" | null>(null);
  const [notes, setNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await privacyService.getAdminDeletionRequests();
      setRequests(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load deletion requests");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAction = (req: DataDeletionRequest, type: "PROCESS" | "REJECT") => {
    setActiveRequest(req);
    setActionType(type);
    setNotes("");
  };

  const handleExecuteAction = async () => {
    if (!activeRequest || !actionType) return;
    try {
      setSubmittingAction(true);
      if (actionType === "PROCESS") {
        await privacyService.processAdminDeletionRequest(activeRequest.id, notes.trim() || undefined);
        toast.success(`Account deletion request #${activeRequest.id} processed successfully`);
      } else {
        await privacyService.rejectAdminDeletionRequest(activeRequest.id, notes.trim() || undefined);
        toast.success(`Account deletion request #${activeRequest.id} rejected`);
      }
      setActiveRequest(null);
      setActionType(null);
      await fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete action");
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.id.toString().includes(search) ||
      r.userId.toString().includes(search) ||
      (r.reason && r.reason.toLowerCase().includes(search.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            User Data & Account Deletion Requests
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and process GDPR / DPDP right-to-be-forgotten deletion requests for your community.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Request ID, User ID, reason..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <p className="text-xs text-slate-500">Loading deletion requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No deletion requests found</p>
          <p className="text-xs text-slate-400">All member accounts are active or matching filters yielded 0 results.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Req #</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">#{r.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">User #{r.userId}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                      {r.reason || <span className="italic text-slate-400">No reason specified</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(r.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === "PENDING"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                            : r.status === "COMPLETED"
                            ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                            : r.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenAction(r, "PROCESS")}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[11px] transition-all cursor-pointer"
                          >
                            Process & Delete
                          </button>
                          <button
                            onClick={() => handleOpenAction(r, "REJECT")}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-[11px] transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {r.processedAt ? `Processed on ${new Date(r.processedAt).toLocaleDateString()}` : "Closed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {activeRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  actionType === "PROCESS"
                    ? "bg-rose-100 dark:bg-rose-950/50 text-rose-600"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                }`}
              >
                {actionType === "PROCESS" ? <Trash2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {actionType === "PROCESS"
                  ? `Execute Deletion for User #${activeRequest.userId}`
                  : `Reject Deletion Request #${activeRequest.id}`}
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {actionType === "PROCESS"
                ? "Executing this deletion will immediately anonymize all personal data (name, phone, email, DOB, govt ID), delete family members, revoke active login tokens, and cancel active marketplace listings."
                : "Rejecting this request will keep the user account and personal data active."}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Notes (optional):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason or verification remarks..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveRequest(null);
                  setActionType(null);
                }}
                disabled={submittingAction}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={submittingAction}
                className={`inline-flex items-center gap-2 px-4 py-1.5 text-white font-semibold text-xs rounded-lg shadow-sm ${
                  actionType === "PROCESS" ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-700 hover:bg-slate-800"
                }`}
              >
                {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {actionType === "PROCESS" ? "Confirm & Anonymize" : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
