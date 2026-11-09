import React, { useEffect, useState } from "react";
import { kittyPartyService } from "../../../services/kittyPartyService";
import type { KittyPartyAuditLog } from "../../../types/kittyPartyTypes";

interface Props {
  cycleId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const KittyPartyAuditTrailModal: React.FC<Props> = ({ cycleId, isOpen, onClose }) => {
  const [logs, setLogs] = useState<KittyPartyAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && cycleId) {
      loadLogs();
    }
  }, [isOpen, cycleId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kittyPartyService.getAuditTrail(cycleId);
      setLogs(data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load audit history");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getEventBadgeClass = (eventType: string) => {
    switch (eventType) {
      case "CYCLE_CREATED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "CONTRIBUTION_RECORDED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CONTRIBUTION_VERIFIED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "PAYOUT_DISBURSED":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "ROTATION_SWAPPED":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "MEMBER_REPLACED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "PAYMENT_REMINDERS_SENT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DISPUTE_RAISED":
        return "bg-red-100 text-red-800 border-red-200";
      case "DISPUTE_RESOLVED":
        return "bg-teal-100 text-teal-800 border-teal-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔒</span>
              <h3 className="text-xl font-bold text-gray-900">
                Immutable Financial Audit Trail
              </h3>
              <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                Chained SHA-256
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Cryptographically verified, tamper-evident chronological ledger history (Chit Funds Act 1982 non-custodial record).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No financial audit records logged yet for this savings cycle.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, idx) => (
                <div
                  key={log.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all hover:bg-white hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-400">#{log.id}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getEventBadgeClass(
                          log.eventType
                        )}`}
                      >
                        {log.eventType}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">
                        by {log.actorName || `User #${log.actorId}`}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <p className="text-sm text-gray-800 font-medium mb-3">
                    {log.description}
                  </p>

                  {/* Hash verification box */}
                  <div className="bg-gray-900 rounded p-2 text-xs font-mono text-gray-300 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Current SHA-256:</span>
                      <span className="text-emerald-400 break-all">{log.currHash}</span>
                    </div>
                    {log.prevHash && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Prev Hash Link:</span>
                        <span className="text-gray-400 break-all">{log.prevHash}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span>Total Audit Records: {logs.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
