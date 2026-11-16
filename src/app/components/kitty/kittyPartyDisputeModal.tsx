import React, { useEffect, useState } from "react";
import { kittyPartyService } from "../../../services/kittyPartyService";
import type { KittyPartyDispute } from "../../../types/kittyPartyTypes";

interface Props {
  circleId: number;
  cycleId?: number;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export const KittyPartyDisputeModal: React.FC<Props> = ({
  circleId,
  cycleId,
  isOpen,
  onClose,
  isAdmin,
}) => {
  const [disputes, setDisputes] = useState<KittyPartyDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New dispute form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [disputeType, setDisputeType] = useState("PAYMENT_UNRECOGNIZED");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Resolve dialog state
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolveStatus, setResolveStatus] = useState("RESOLVED");
  const [resolveNotes, setResolveNotes] = useState("");

  useEffect(() => {
    if (isOpen && circleId) {
      loadDisputes();
    }
  }, [isOpen, circleId]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kittyPartyService.getDisputes(circleId);
      setDisputes(data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    try {
      setSubmitting(true);
      await kittyPartyService.createDispute(circleId, {
        cycleId,
        disputeType,
        title: title.trim(),
        description: description.trim(),
      });
      setTitle("");
      setDescription("");
      setShowCreateForm(false);
      loadDisputes();
    } catch (err: any) {
      setError(err?.message || "Failed to raise dispute");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveDispute = async (disputeId: number) => {
    if (!resolveNotes.trim()) return;
    try {
      setSubmitting(true);
      await kittyPartyService.resolveDispute(circleId, disputeId, {
        status: resolveStatus,
        resolutionNotes: resolveNotes.trim(),
      });
      setResolvingId(null);
      setResolveNotes("");
      loadDisputes();
    } catch (err: any) {
      setError(err?.message || "Failed to resolve dispute");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "UNDER_REVIEW":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "RESOLVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "DISMISSED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <h3 className="text-xl font-bold text-gray-900">
                Dispute & Complaint Management
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Transparent dispute resolution for contribution verifications, payout schedules, and member concerns.
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
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-800 text-sm">
              Circle Complaints ({disputes.length})
            </h4>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                + Raise Dispute
              </button>
            )}
          </div>

          {/* New Dispute Form */}
          {showCreateForm && (
            <form
              onSubmit={handleCreateDispute}
              className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-3"
            >
              <h5 className="font-semibold text-rose-900 text-sm">
                Log New Dispute / Issue
              </h5>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Dispute Type
                </label>
                <select
                  value={disputeType}
                  onChange={(e) => setDisputeType(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 bg-white"
                >
                  <option value="PAYMENT_UNRECOGNIZED">Payment Unrecognized / Missing</option>
                  <option value="PAYOUT_DELAY">Payout Disbursement Delay</option>
                  <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
                  <option value="RULE_VIOLATION">Rotation / Rule Violation</option>
                  <option value="OTHER">Other Query / Grievance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paid ₹2,000 via UPI but not marked verified"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Detailed Description & Reference
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide transaction UTR, period number, or specific concern..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded text-xs"
                >
                  {submitting ? "Submitting..." : "Submit Dispute"}
                </button>
              </div>
            </form>
          )}

          {/* Disputes List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
            </div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No disputes or complaints recorded for this circle.
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <div
                  key={d.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getStatusBadge(
                            d.status
                          )}`}
                        >
                          {d.status}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          {d.disputeType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mt-1">
                        {d.title}
                      </h4>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(d.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded">
                    {d.description}
                  </p>

                  <div className="text-[11px] text-gray-500 flex justify-between items-center pt-1">
                    <span>Raised by: <strong className="text-gray-700">{d.raisedByName}</strong></span>
                    {d.resolvedAt && (
                      <span className="text-emerald-700 font-medium">
                        Resolved by {d.resolvedByName} on {new Date(d.resolvedAt).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>

                  {d.resolutionNotes && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded p-2.5 text-xs text-emerald-900 mt-2">
                      <strong>Resolution Notes:</strong> {d.resolutionNotes}
                    </div>
                  )}

                  {/* Admin Resolve Action */}
                  {isAdmin && d.status === "OPEN" && (
                    <div className="pt-2 border-t border-gray-100">
                      {resolvingId === d.id ? (
                        <div className="space-y-2 bg-gray-50 p-3 rounded border border-gray-200 mt-2">
                          <label className="block text-xs font-semibold text-gray-700">
                            Resolution Status
                          </label>
                          <select
                            value={resolveStatus}
                            onChange={(e) => setResolveStatus(e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                          >
                            <option value="RESOLVED">RESOLVED (Action Taken)</option>
                            <option value="DISMISSED">DISMISSED (Invalid / Duplicate)</option>
                          </select>

                          <textarea
                            rows={2}
                            placeholder="State administrative action taken or reason for dismissal..."
                            value={resolveNotes}
                            onChange={(e) => setResolveNotes(e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded p-2 bg-white"
                          />

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setResolvingId(null)}
                              className="px-2.5 py-1 text-xs bg-gray-200 rounded text-gray-700"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={submitting || !resolveNotes.trim()}
                              onClick={() => handleResolveDispute(d.id)}
                              className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium disabled:opacity-50"
                            >
                              Confirm Resolution
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvingId(d.id)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded border border-indigo-200"
                        >
                          ⚖️ Admin: Resolve Dispute
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
