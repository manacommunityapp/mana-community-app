import { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  Clock,
  LogIn,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import type { GatePassRecord } from '../../../types/homeServices';
import { homeServiceApi } from '../../../services/homeServices/homeServiceApi';

interface GatePassScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GatePassScannerModal({ isOpen, onClose }: GatePassScannerModalProps) {
  const [passes, setPasses] = useState<GatePassRecord[]>([]);
  const [selectedPass, setSelectedPass] = useState<GatePassRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) loadPasses();
  }, [isOpen]);

  const loadPasses = async () => {
    setLoading(true);
    const data = await homeServiceApi.getGatePassesForScanner();
    setPasses(data);
    if (data.length > 0 && !selectedPass) setSelectedPass(data[0]);
    setLoading(false);
  };

  if (!isOpen) return null;

  const handleScan = (pass: GatePassRecord) => {
    setSelectedPass(pass);
    toast.success(`Pass Scanned: ${pass.workerName}`);
  };

  const handleLogEntry = async () => {
    if (!selectedPass) return;
    await homeServiceApi.logGateEvent(selectedPass.workerId, "ENTRY");
    toast.success(`Entry Logged at Main Gate for ${selectedPass.workerName}`);
    loadPasses();
  };

  const handleLogExit = async () => {
    if (!selectedPass) return;
    await homeServiceApi.logGateEvent(selectedPass.workerId, "EXIT");
    toast.success(`Exit Logged at Main Gate for ${selectedPass.workerName}`);
    loadPasses();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">Gate Pass Scanner</h3>
                <p className="text-xs text-emerald-300/80 font-medium">Security Guard Gate Console</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 text-slate-900 dark:text-white">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 block">
              Simulate QR / RFID Card Scan
            </label>
            <div className="flex gap-2 flex-wrap">
              {loading ? (
                <p className="text-xs text-slate-400 animate-pulse">Loading passes...</p>
              ) : (
                passes.map((pass) => (
                  <button
                    key={pass.id}
                    type="button"
                    onClick={() => handleScan(pass)}
                    className={`flex-1 min-w-[120px] p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      selectedPass?.id === pass.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 inline mr-1" />
                    {pass.workerName}
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedPass && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-800/60 dark:to-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-primary text-white font-black text-xl flex items-center justify-center shadow-sm shrink-0">
                    {selectedPass.workerName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                        {selectedPass.workerName}
                      </h4>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${
                        selectedPass.status === 'ACTIVE'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                      }`}>
                        {selectedPass.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pass ID: {selectedPass.qrTokenHash}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Valid: {selectedPass.validFrom} to {selectedPass.validTo}
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                  {selectedPass.lastEntryAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                        Last Entry:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {new Date(selectedPass.lastEntryAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                      </span>
                    </div>
                  )}
                  {selectedPass.lastExitAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <LogOut className="w-3.5 h-3.5 text-slate-400" />
                        Last Exit:
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {new Date(selectedPass.lastExitAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                      </span>
                    </div>
                  )}
                </div>

                {selectedPass.history.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Recent Activity</span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {selectedPass.history.slice(0, 4).map((h, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span className={`font-bold ${h.type === 'ENTRY' ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {h.type === 'ENTRY' ? '→ Entry' : '← Exit'} ({h.gateNumber})
                          </span>
                          <span className="text-slate-400">
                            {new Date(h.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLogEntry}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  Log Gate Entry
                </button>
                <button
                  type="button"
                  onClick={handleLogExit}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white text-xs font-extrabold shadow flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  Log Gate Exit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
