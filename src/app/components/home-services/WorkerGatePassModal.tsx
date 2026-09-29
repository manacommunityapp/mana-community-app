import { useState, useEffect } from "react";
import { X, QrCode, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import type { GatePassRecord } from "../../../types/homeServices";
import { homeServiceApi } from "../../../services/homeServices/homeServiceApi";

interface WorkerGatePassModalProps {
  workerId: string;
  onClose: () => void;
}

export function WorkerGatePassModal({ workerId, onClose }: WorkerGatePassModalProps) {
  const [pass, setPass] = useState<GatePassRecord | null>(null);

  useEffect(() => {
    homeServiceApi.getGatePass(workerId).then(setPass);
  }, [workerId]);

  if (!pass) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-w-md w-full">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Worker Security Gate Pass
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-44 h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700">
            <QrCode className="w-28 h-28 text-slate-800 dark:text-white" />
            <span className="text-[9px] font-mono text-slate-400 mt-1">
              {pass.qrTokenHash}
            </span>
          </div>

          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {pass.workerName}
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-extrabold uppercase border border-emerald-200">
              Active Community Pass
            </span>
          </div>

          {/* Entry/Exit Log History */}
          <div className="w-full text-left space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
              Recent Gate Activity
            </span>
            {pass.history.map((h, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {h.type === "ENTRY" ? "🟢 Gate Entry" : "🔴 Gate Exit"} • {h.gateNumber}
                  </span>
                  <span className="text-slate-400">{h.timestamp}</span>
                </div>
                <span className="text-slate-500 text-[10px]">
                  ✓ {h.verifiedBy}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
