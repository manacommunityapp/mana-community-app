import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Moon,
  Ban,
  Clock,
  Send,
  MessageSquare
} from "lucide-react";
import {
  unifiedNotificationService,
  type NotificationAuditLog,
  type DeliveryStatus
} from "../../../services/notification/unifiedNotificationService";

interface Props {
  userId?: number;
}

export const NotificationAuditLogViewer: React.FC<Props> = ({ userId = 1 }) => {
  const [logs, setLogs] = useState<NotificationAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  useEffect(() => {
    loadLogs();
  }, [userId, page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await unifiedNotificationService.getAuditLogs(userId, page, 15);
      if (res && res.content) {
        setLogs(res.content);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Delivered
          </span>
        );
      case "SUPPRESSED_QUIET_HOURS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
            Quiet Hours Suppressed
          </span>
        );
      case "OPTED_OUT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Ban className="w-3.5 h-3.5 text-amber-500" />
            Opted Out
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {status}
          </span>
        );
    }
  };

  const filteredLogs = filterCategory === "ALL" ? logs : logs.filter((l) => l.category === filterCategory);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Send className="w-6 h-6 text-indigo-600" />
            Notification Delivery Audit Trail
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time delivery verification across Push, SMS, WhatsApp, and Email channels.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-sm">
        <Filter className="w-4 h-4 text-slate-400 ml-2" />
        <span className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Category Filter:</span>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Categories</option>
          <option value="EMERGENCY_SOS">🚨 Emergency & SOS</option>
          <option value="GATE_ACCESS">🛡️ Gate & Visitor Access</option>
          <option value="FINANCIAL_BILLING">💳 Billing & Payments</option>
          <option value="HELPDESK_TICKET">🛠️ Helpdesk</option>
          <option value="COMMUNITY_NOTICE">📢 Notices</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-6">Timestamp / ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-6">Message Content</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    No notification dispatch records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs">
                      <div className="text-slate-800 font-semibold">{log.notificationId}</div>
                      <div className="text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-700">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-semibold">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      <span className="text-xs uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                        {log.channel}
                      </span>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-semibold text-slate-800 text-sm truncate">{log.title}</div>
                      <div className="text-slate-500 text-xs truncate mt-0.5">{log.body}</div>
                      {log.providerMessageId && (
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          Msg ID: {log.providerMessageId}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(log.status)}
                      {log.errorReason && (
                        <div className="text-[11px] text-red-500 mt-1 max-w-[200px] truncate mx-auto" title={log.errorReason}>
                          {log.errorReason}
                        </div>
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
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-slate-500 text-xs">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
