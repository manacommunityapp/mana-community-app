import { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2, Clock, Plus, X } from "lucide-react";
import type { HomeServiceReport } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

export function HomeServiceReports() {
  const [reports, setReports] = useState<HomeServiceReport[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("Unsafe Behaviour");
  const [reportedAgainstName, setReportedAgainstName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const data = await homeServiceApi.getReports();
    setReports(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await homeServiceApi.createReport({
      reportedAgainst: "worker-custom",
      reportedAgainstName,
      reason,
      description,
    });
    setShowModal(false);
    setDescription("");
    setReportedAgainstName("");
    loadReports();
  };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            Help, Grievances &amp; Issue Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            File confidential complaints regarding conduct, absence, or security violations for admin resolution
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <AlertTriangle className="w-4 h-4" />
          Report an Issue
        </button>
      </div>

      <div className="space-y-3">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                  {rep.reason}
                </span>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                  Report against: {rep.reportedAgainstName}
                </h4>
                <p className="text-[11px] text-slate-400">
                  Filed on {rep.createdAt} by {rep.reportedBy}
                </p>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  rep.status === "RESOLVED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {rep.status}
              </span>
            </div>

            <p className="text-slate-700 dark:text-slate-300">
              {rep.description}
            </p>

            {rep.resolution && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px]">
                <strong className="text-slate-900 dark:text-white">Admin Resolution:</strong> {rep.resolution}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-w-md w-full">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                File a Complaint / Report
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-500 block mb-1">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                >
                  <option value="Unsafe behaviour">Unsafe behaviour</option>
                  <option value="Repeated absence">Repeated absence</option>
                  <option value="Poor service">Poor service</option>
                  <option value="Incorrect pricing">Incorrect pricing</option>
                  <option value="Unprofessional conduct">Unprofessional conduct</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">Reported Worker / Person</label>
                <input
                  type="text"
                  required
                  value={reportedAgainstName}
                  onChange={(e) => setReportedAgainstName(e.target.value)}
                  placeholder="e.g. Worker Name or Vendor"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">Details &amp; Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what happened..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-destructive text-destructive-foreground font-bold shadow-xs hover:opacity-95 cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
