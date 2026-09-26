import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Car,
  Sparkles,
  Camera,
  KeyRound,
  ShieldCheck,
  Building,
  User,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { homeServiceApi } from '../../../services/homeServices/homeServiceApi';
import type { ServiceAttendance } from '../../../types/homeServices';

interface ProviderJobDeckProps {
  isOpen: boolean;
  onClose: () => void;
  workerId?: string;
  workerName?: string;
}

export function ProviderJobDeck({
  isOpen,
  onClose,
  workerId = 'worker-manoj',
  workerName = 'Manoj Rathod (Doorstep Car Wash & Detailing)',
}: ProviderJobDeckProps) {
  const [jobs, setJobs] = useState<ServiceAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  
  // OTP Verification state
  const [otpModalJob, setOtpModalJob] = useState<ServiceAttendance | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Completion Proof state
  const [proofModalJob, setProofModalJob] = useState<ServiceAttendance | null>(null);
  const [beforePhoto, setBeforePhoto] = useState('https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=500&auto=format&fit=crop&q=60');
  const [afterPhoto, setAfterPhoto] = useState('https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=500&auto=format&fit=crop&q=60');
  const [completing, setCompleting] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await homeServiceApi.getTodayJobsForWorker(workerId);
      setJobs(data);
    } catch (err: any) {
      toast.error('Failed to load today jobs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchJobs();
    }
  }, [isOpen, workerId]);

  if (!isOpen) return null;

  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length;
  const inProgressCount = jobs.filter((j) => j.status === 'IN_PROGRESS').length;
  const pendingCount = jobs.filter((j) => j.status === 'SCHEDULED' || j.status === 'GATE_CHECKED_IN').length;
  const totalEarnings = completedCount * 120 + inProgressCount * 60;

  const filteredJobs = jobs.filter((j) => {
    if (activeTab === 'PENDING') return j.status === 'SCHEDULED' || j.status === 'GATE_CHECKED_IN';
    if (activeTab === 'IN_PROGRESS') return j.status === 'IN_PROGRESS';
    if (activeTab === 'COMPLETED') return j.status === 'COMPLETED';
    return true;
  });

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModalJob) return;
    if (enteredPin.trim().length !== 4) {
      toast.error('Please enter the valid 4-digit resident PIN');
      return;
    }
    setVerifyingOtp(true);
    try {
      await homeServiceApi.startJobWithOtp(otpModalJob.id, enteredPin.trim());
      toast.success('PIN verified! Job marked IN_PROGRESS.');
      setOtpModalJob(null);
      setEnteredPin('');
      fetchJobs();
    } catch (err: any) {
      toast.error(err.message || 'Invalid PIN. Please ask resident for the correct PIN.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleCompleteWithProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofModalJob) return;
    setCompleting(true);
    try {
      await homeServiceApi.completeJobWithProof(proofModalJob.id, {
        beforePhotoUrl: beforePhoto,
        afterPhotoUrl: afterPhoto,
      });
      toast.success('Job completed successfully with service proof photos!');
      setProofModalJob(null);
      fetchJobs();
    } catch (err: any) {
      toast.error('Failed to complete job: ' + err.message);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Provider Route & Job Deck</h3>
                <p className="text-xs text-slate-300 font-medium">{workerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchJobs}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Refresh Jobs"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2.5 mt-5">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
              <span className="text-[10px] font-black uppercase text-slate-300 block">Total Jobs</span>
              <span className="text-xl font-black text-white">{jobs.length}</span>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-3 border border-amber-500/30 text-center">
              <span className="text-[10px] font-black uppercase text-amber-300 block">Pending</span>
              <span className="text-xl font-black text-amber-300">{pendingCount}</span>
            </div>
            <div className="bg-sky-500/20 backdrop-blur-md rounded-2xl p-3 border border-sky-500/30 text-center">
              <span className="text-[10px] font-black uppercase text-sky-300 block">In Progress</span>
              <span className="text-xl font-black text-sky-300">{inProgressCount}</span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-3 border border-emerald-500/30 text-center">
              <span className="text-[10px] font-black uppercase text-emerald-300 block">Earnings</span>
              <span className="text-xl font-black text-emerald-300">₹{totalEarnings}</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-2 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 px-3 text-xs font-black transition-all cursor-pointer border-b-2 ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Job List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-xs font-semibold">Loading today's route schedule...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Jobs in this View</h4>
              <p className="text-xs text-slate-400 mt-0.5">All scheduled tasks are up-to-date.</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase border border-indigo-200 dark:border-indigo-800">
                      {job.serviceCategoryName || 'Service'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      Tower {job.tower || 'A'} • Flat {job.flatNumber || 'A-204'}
                    </span>
                    {job.status === 'COMPLETED' ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase border border-emerald-200 dark:border-emerald-800">
                        ✓ Done
                      </span>
                    ) : job.status === 'IN_PROGRESS' ? (
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase border border-sky-200 dark:border-sky-800 animate-pulse">
                        ● In Progress
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase border border-amber-200 dark:border-amber-800">
                        Scheduled
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {job.residentName || 'Resident'}
                    </span>
                    {job.vehicleNumber && (
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] flex items-center gap-1">
                        <Car className="w-3 h-3 text-slate-500" />
                        {job.vehicleNumber}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {job.serviceDate}
                    </span>
                  </div>

                  {job.status === 'COMPLETED' && (job.beforePhotoUrl || job.afterPhotoUrl) && (
                    <div className="flex items-center gap-2 pt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Proof photos verified & uploaded</span>
                      {job.rating && (
                        <span className="ml-2 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded">
                          ★ {job.rating} / 5
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-2">
                  {(job.status === 'SCHEDULED' || job.status === 'GATE_CHECKED_IN') && (
                    <button
                      onClick={() => {
                        setOtpModalJob(job);
                        setEnteredPin('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Enter PIN & Start
                    </button>
                  )}

                  {job.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => setProofModalJob(job)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Upload Proof & Finish
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── OTP Verification Modal ── */}
      {otpModalJob && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-sm w-full shadow-2xl space-y-4 text-slate-900 dark:text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-base">Resident PIN Verification</h4>
              </div>
              <button onClick={() => setOtpModalJob(null)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Ask the resident at Flat <span className="font-bold text-slate-800 dark:text-white">{otpModalJob.flatNumber}</span> for their 4-digit service PIN to begin work.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={4}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className="w-40 text-center tracking-[0.5em] text-2xl font-black py-2.5 rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 dark:bg-slate-800 outline-none"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={enteredPin.length !== 4 || verifyingOtp}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify PIN & Start Job'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Proof of Service Modal ── */}
      {proofModalJob && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl space-y-4 text-slate-900 dark:text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <h4 className="font-extrabold text-base">Attach Proof Photos</h4>
              </div>
              <button onClick={() => setProofModalJob(null)} className="text-slate-400 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Provide before and after service images for Flat <span className="font-bold text-slate-800 dark:text-white">{proofModalJob.flatNumber}</span>.
            </p>

            <form onSubmit={handleCompleteWithProof} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Before Photo</label>
                  <img
                    src={beforePhoto}
                    alt="Before"
                    className="w-full h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="text"
                    value={beforePhoto}
                    onChange={(e) => setBeforePhoto(e.target.value)}
                    className="w-full text-[10px] p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">After Photo</label>
                  <img
                    src={afterPhoto}
                    alt="After"
                    className="w-full h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="text"
                    value={afterPhoto}
                    onChange={(e) => setAfterPhoto(e.target.value)}
                    className="w-full text-[10px] p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={completing}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shadow hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Complete Service'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
