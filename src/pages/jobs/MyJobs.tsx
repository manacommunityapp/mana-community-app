import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { jobService } from '../../services/jobService';
import { JobCard } from '../../components/jobs/JobCard';
import type { Job, JobApplication } from '../../types/jobs';

const APP_STATUS_STYLE: Record<string, string> = {
  PENDING:  'bg-indigo-100 text-indigo-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-600',
};

interface Props {
  onJobClick:   (id: number) => void;
  onCreateClick: () => void;
  onBack:        () => void;
}

export function MyJobs({ onJobClick, onCreateClick, onBack }: Props) {
  const [tab,          setTab]          = useState<'posted' | 'applied'>('posted');
  const [postedJobs,   setPostedJobs]   = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === 'posted') {
      jobService.getMyPostedJobs()
        .then((r) => setPostedJobs(r.content))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      jobService.getMyApplications()
        .then((r) => setApplications(r.content))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [tab]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-indigo-600 text-sm font-semibold hover:text-indigo-800">← Back</button>
          <h1 className="text-xl font-black text-gray-900">My Jobs</h1>
        </div>
        <button
          onClick={onCreateClick}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700"
        >
          + Post
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([
          { key: 'posted' as const,  label: '📋 My Postings'   },
          { key: 'applied' as const, label: '📨 Applications'  },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex-1 py-3 text-sm font-semibold border-b-2 transition-colors',
              tab === t.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tab === 'posted' ? (
        postedJobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-bold text-gray-700 text-lg">No postings yet</p>
            <button onClick={onCreateClick} className="mt-4 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 text-sm">
              Post your first job
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {postedJobs.map((job) => <JobCard key={job.id} job={job} onClick={onJobClick} />)}
          </div>
        )
      ) : (
        applications.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📨</p>
            <p className="font-bold text-gray-700 text-lg">No applications yet</p>
            <button onClick={onBack} className="mt-4 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 text-sm">
              Browse open jobs
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => onJobClick(app.jobId)}
                className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-indigo-700 text-sm mb-1">Job #{app.jobId}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{app.coverMessage}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Applied {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${APP_STATUS_STYLE[app.status] ?? APP_STATUS_STYLE.PENDING}`}>
                    {app.status === 'ACCEPTED' ? '✅ Accepted' : app.status === 'REJECTED' ? '❌ Rejected' : '⏳ Pending'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}
