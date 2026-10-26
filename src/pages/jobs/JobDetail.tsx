import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { jobService } from '../../services/jobService';
import { JOB_CATEGORY_META, JOB_TYPE_LABEL } from '../../components/jobs/JobCard';
import type { Job, JobApplication } from '../../types/jobs';

function payDisplay(job: Job): string {
  if (job.payType === 'VOLUNTEER')  return '🤝 Volunteer / No pay';
  if (job.payType === 'NEGOTIABLE') return '💬 Negotiable';
  if (!job.payAmount)               return job.payType === 'HOURLY' ? 'Hourly rate TBD' : 'Fixed pay TBD';
  return job.payType === 'HOURLY' ? `₹${job.payAmount}/hour` : `₹${job.payAmount.toLocaleString('en-IN')} fixed`;
}

interface Props {
  jobId:         number;
  currentUserId: number;
  onBack:        () => void;
}

export function JobDetail({ jobId, currentUserId, onBack }: Props) {
  const [job,        setJob]        = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [applyOpen,  setApplyOpen]  = useState(false);
  const [message,    setMessage]    = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      jobService.getJob(jobId),
    ]).then(([j]) => {
      setJob(j);
      if (j.posterId === currentUserId) {
        jobService.getApplications(jobId).then(setApplications);
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [jobId]);

  async function handleApply() {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await jobService.applyForJob(jobId, message.trim());
      setApplyOpen(false);
      setMessage('');
      const updated = await jobService.getJob(jobId);
      setJob(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw() {
    if (!confirm('Withdraw your application?')) return;
    await jobService.withdrawApplication(jobId);
    const updated = await jobService.getJob(jobId);
    setJob(updated);
  }

  async function handleAccept(appId: number) {
    await jobService.acceptApplication(jobId, appId);
    const apps = await jobService.getApplications(jobId);
    setApplications(apps);
  }

  async function handleReject(appId: number) {
    await jobService.rejectApplication(jobId, appId);
    const apps = await jobService.getApplications(jobId);
    setApplications(apps);
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 animate-pulse">
      <div className="h-8 w-24 bg-gray-100 rounded-lg" />
      <div className="h-40 bg-gray-100 rounded-2xl" />
      <div className="h-32 bg-gray-100 rounded-xl" />
    </div>
  );

  if (!job) return <div className="p-8 text-center text-gray-500">Job not found.</div>;

  const isOwner  = job.posterId === currentUserId;
  const isOpen   = job.status === 'OPEN';
  const canApply = !isOwner && isOpen && !job.hasApplied;
  const meta     = JOB_CATEGORY_META[job.category] ?? JOB_CATEGORY_META.OTHER;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1 text-indigo-600 text-sm font-semibold hover:text-indigo-800">
        ← Back
      </button>

      {/* Hero */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl flex-shrink-0">
            {meta.emoji}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900 leading-tight">{job.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {job.posterName}{job.posterFlat ? ` · ${job.posterFlat}` : ''}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
            </p>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            job.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' :
            job.status === 'FILLED' ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-500'
          }`}>
            {job.status}
          </span>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 divide-x border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
          <div className="py-3 text-center">
            <p className="font-bold text-indigo-700 text-sm">{payDisplay(job)}</p>
            <p className="text-xs text-gray-500">Pay</p>
          </div>
          <div className="py-3 text-center">
            <p className="font-bold text-gray-800 text-sm">{JOB_TYPE_LABEL[job.jobType] ?? job.jobType}</p>
            <p className="text-xs text-gray-500">Type</p>
          </div>
          <div className="py-3 text-center">
            <p className="font-bold text-gray-800 text-sm">{job.applicationCount}</p>
            <p className="text-xs text-gray-500">Applicants</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{meta.label}</span>
          {job.location && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">📍 {job.location}</span>}
          {job.expiresAt && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              ⏰ Expires {formatDistanceToNow(new Date(job.expiresAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Description */}
        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">About this role</p>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
        </div>
      </div>

      {/* My application status */}
      {job.hasApplied && (
        <div className={`rounded-xl p-4 border ${
          job.myApplicationStatus === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-200' :
          job.myApplicationStatus === 'REJECTED' ? 'bg-red-50 border-red-200' :
          'bg-indigo-50 border-indigo-200'
        }`}>
          <p className={`font-semibold text-sm ${
            job.myApplicationStatus === 'ACCEPTED' ? 'text-emerald-700' :
            job.myApplicationStatus === 'REJECTED' ? 'text-red-700' : 'text-indigo-700'
          }`}>
            {job.myApplicationStatus === 'ACCEPTED'
              ? '🎉 Your application was accepted! The poster will reach out.'
              : job.myApplicationStatus === 'REJECTED'
              ? '❌ Your application was not selected for this role.'
              : '⏳ Application submitted — awaiting the poster\'s decision.'}
          </p>
          {job.myApplicationStatus === 'PENDING' && isOpen && (
            <button onClick={handleWithdraw} className="mt-2 text-xs text-indigo-600 underline">
              Withdraw application
            </button>
          )}
        </div>
      )}

      {/* Applications — poster view */}
      {isOwner && applications.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Applicants ({applications.length})</h2>
          {applications.map((app) => (
            <div key={app.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
              <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {app.applicantName[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">{app.applicantName}</p>
                {app.applicantFlat && <p className="text-xs text-gray-400">🏠 {app.applicantFlat}</p>}
                <p className="text-sm text-gray-700 mt-1 leading-snug">{app.coverMessage}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {app.status === 'PENDING' ? (
                  <>
                    <button onClick={() => handleAccept(app.id)} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200">✓ Accept</button>
                    <button onClick={() => handleReject(app.id)} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200">✕ Reject</button>
                  </>
                ) : (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${app.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {app.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply CTA */}
      {canApply && (
        <button
          onClick={() => setApplyOpen(true)}
          className="w-full bg-indigo-600 text-white rounded-xl py-4 font-bold text-base hover:bg-indigo-700 shadow-sm"
        >
          Apply Now
        </button>
      )}

      {/* Apply modal */}
      {applyOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Apply for Job</h3>
              <button onClick={() => setApplyOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 flex items-center gap-2">
              <span className="text-xl">{meta.emoji}</span>
              <div>
                <p className="font-bold text-indigo-900 text-sm">{job.title}</p>
                <p className="text-xs text-indigo-700">{job.posterName}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Cover message <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Introduce yourself and explain why you're a great fit.</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={500}
                placeholder="Hi, I'm interested in this role because…"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
              <p className="text-right text-xs text-gray-400">{message.length}/500</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setApplyOpen(false)} className="flex-1 border border-gray-300 rounded-xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!message.trim() || submitting}
                className="flex-2 bg-indigo-600 text-white rounded-xl py-3 px-6 text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
