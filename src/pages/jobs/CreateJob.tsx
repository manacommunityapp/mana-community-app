import React, { useState } from 'react';
import { jobService } from '../../services/jobService';
import { JOB_CATEGORY_META } from '../../components/jobs/JobCard';
import type { JobCategory, JobType, PayType } from '../../types/jobs';

const CATEGORIES = Object.entries(JOB_CATEGORY_META) as [JobCategory, { emoji: string; label: string }][];

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'ONE_TIME',  label: 'One-time'  },
  { value: 'RECURRING', label: 'Recurring' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'FULL_TIME', label: 'Full-time' },
];

const PAY_TYPES: { value: PayType; label: string; desc: string }[] = [
  { value: 'HOURLY',     label: '₹/hr',      desc: 'Hourly rate'  },
  { value: 'FIXED',      label: '₹ Fixed',   desc: 'Fixed amount' },
  { value: 'NEGOTIABLE', label: 'Negotiate', desc: 'Discuss later'},
  { value: 'VOLUNTEER',  label: 'Volunteer', desc: 'No pay'       },
];

interface Props {
  onCreated: (jobId: number) => void;
  onCancel:  () => void;
}

export function CreateJob({ onCreated, onCancel }: Props) {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState<JobCategory>('HOME_REPAIRS');
  const [jobType,     setJobType]     = useState<JobType>('ONE_TIME');
  const [payType,     setPayType]     = useState<PayType>('NEGOTIABLE');
  const [payAmount,   setPayAmount]   = useState('');
  const [location,    setLocation]    = useState('Within community');
  const [showFlat,    setShowFlat]    = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim())       e.title       = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const job = await jobService.createJob({
        title:       title.trim(),
        description: description.trim(),
        category,
        jobType,
        payType,
        payAmount:   payAmount ? Number(payAmount) : undefined,
        location:    location.trim() || undefined,
        showFlat,
      });
      onCreated(job.id);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-indigo-600 text-sm font-semibold hover:text-indigo-800">
          ← Back
        </button>
        <h1 className="text-xl font-black text-gray-900">Post a Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Job title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Need a plumber for bathroom repair"
              maxLength={80}
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={800}
              placeholder="Describe the work, requirements, timing…"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
            />
            <div className="flex justify-between">
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              <p className="text-xs text-gray-400 ml-auto">{description.length}/800</p>
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-bold text-gray-700">Category *</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {CATEGORIES.map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={[
                  'flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-center transition-all',
                  category === key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200',
                ].join(' ')}
              >
                <span className="text-xl">{meta.emoji}</span>
                <span className={`text-[10px] font-semibold leading-tight ${category === key ? 'text-indigo-700' : 'text-gray-500'}`}>
                  {meta.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Job Type + Pay */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">Job type</p>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setJobType(t.value)}
                  className={[
                    'px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all',
                    jobType === t.value ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:border-indigo-300',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">Compensation</p>
            <div className="flex flex-wrap gap-2">
              {PAY_TYPES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPayType(p.value)}
                  className={[
                    'px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all',
                    payType === p.value ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:border-indigo-300',
                  ].join(' ')}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {(payType === 'HOURLY' || payType === 'FIXED') && (
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder={payType === 'HOURLY' ? 'Hourly rate (₹)' : 'Fixed amount (₹)'}
                className="mt-3 w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Within community, Remote, Block A"
              maxLength={60}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showFlat}
              onChange={(e) => setShowFlat(e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            <div>
              <p className="text-sm font-semibold text-gray-700">Show my flat number</p>
              <p className="text-xs text-gray-500">Applicants will see your unit in the listing</p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 border border-gray-300 rounded-xl py-3 font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-2 bg-indigo-600 text-white rounded-xl py-3 px-8 font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
}
