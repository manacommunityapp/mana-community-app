import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  Clock,
  Car,
  Sparkles,
  ArrowRight,
  LogIn,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

interface GatePassScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GatePassScannerModal({ isOpen, onClose }: GatePassScannerModalProps) {
  const [passToken, setPassToken] = useState('GP-MANOJ-CARWASH-2026');
  const [verifiedPass, setVerifiedPass] = useState<{
    workerName: string;
    role: string;
    company: string;
    photoUrl: string;
    qrToken: string;
    allowedTowers: string[];
    allowedFlats: string[];
    kycStatus: 'VERIFIED' | 'PENDING';
    passStatus: 'ACTIVE' | 'EXPIRED';
    lastEntryTime?: string;
  } | null>({
    workerName: 'Manoj Rathod',
    role: 'Daily Doorstep Car Wash & Detailing Specialist',
    company: 'Mana Verified Services (GoPrezz Partner)',
    photoUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
    qrToken: 'GP-MANOJ-CARWASH-2026',
    allowedTowers: ['Tower A', 'Tower B', 'Tower C'],
    allowedFlats: ['A-101', 'A-204', 'A-305', 'B-102', 'B-404', 'C-201'],
    kycStatus: 'VERIFIED',
    passStatus: 'ACTIVE',
    lastEntryTime: '06:15 AM (Today)',
  });

  if (!isOpen) return null;

  const handleScan = (token: string) => {
    setPassToken(token);
    if (token.includes('LAKSHMI')) {
      setVerifiedPass({
        workerName: 'Lakshmi Devi',
        role: 'Steam Ironing & Housekeeping Specialist',
        company: 'Mana Verified Services',
        photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        qrToken: 'GP-LAKSHMI-IRON-2026',
        allowedTowers: ['Tower A', 'Tower D'],
        allowedFlats: ['A-204', 'A-502', 'D-101', 'D-302'],
        kycStatus: 'VERIFIED',
        passStatus: 'ACTIVE',
        lastEntryTime: '07:00 AM (Today)',
      });
      toast.success('Pass Scanned: Lakshmi Devi (Ironing & House Help)');
    } else {
      setVerifiedPass({
        workerName: 'Manoj Rathod',
        role: 'Daily Doorstep Car Wash & Detailing Specialist',
        company: 'Mana Verified Services (GoPrezz Partner)',
        photoUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
        qrToken: 'GP-MANOJ-CARWASH-2026',
        allowedTowers: ['Tower A', 'Tower B', 'Tower C'],
        allowedFlats: ['A-101', 'A-204', 'A-305', 'B-102', 'B-404', 'C-201'],
        kycStatus: 'VERIFIED',
        passStatus: 'ACTIVE',
        lastEntryTime: '06:15 AM (Today)',
      });
      toast.success('Pass Scanned: Manoj Rathod (Daily Car Wash)');
    }
  };

  const handleLogEntry = () => {
    toast.success(`Entry Logged at Main Gate 1 for ${verifiedPass?.workerName}`);
  };

  const handleLogExit = () => {
    toast.success(`Exit Logged at Main Gate 1 for ${verifiedPass?.workerName}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
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
          {/* Quick Mock Scanners */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 block">
              Simulate QR / RFID Card Scan
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleScan('GP-MANOJ-CARWASH-2026')}
                className={`flex-1 p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  passToken.includes('MANOJ')
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                🚗 Scan Manoj (Car Wash)
              </button>
              <button
                type="button"
                onClick={() => handleScan('GP-LAKSHMI-IRON-2026')}
                className={`flex-1 p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  passToken.includes('LAKSHMI')
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                👕 Scan Lakshmi (Ironing)
              </button>
            </div>
          </div>

          {verifiedPass && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Pass Card */}
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-800/60 dark:to-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={verifiedPass.photoUrl}
                    alt={verifiedPass.workerName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                        {verifiedPass.workerName}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        ✓ {verifiedPass.passStatus}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {verifiedPass.role}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {verifiedPass.company}
                    </p>
                  </div>
                </div>

                {/* Allowed Towers & Flats */}
                <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      Allowed Towers:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {verifiedPass.allowedTowers.join(', ')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">
                      Subscribed Flats for Service Today:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {verifiedPass.allowedFlats.map((flat) => (
                        <span
                          key={flat}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shadow-2xs"
                        >
                          {flat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
