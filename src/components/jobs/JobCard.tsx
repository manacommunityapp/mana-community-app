import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Job } from '../../types/jobs';

export const JOB_CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  HOME_REPAIRS: { emoji: '🔧', label: 'Home Repairs' },
  CLEANING:     { emoji: '🧹', label: 'Cleaning'     },
  CHILDCARE:    { emoji: '👶', label: 'Childcare'    },
  TUTORING:     { emoji: '🎓', label: 'Tutoring'     },
  PET_CARE:     { emoji: '🐾', label: 'Pet Care'     },
  TRANSPORT:    { emoji: '🚗', label: 'Transport'    },
  TECH_HELP:    { emoji: '💻', label: 'Tech Help'    },
  COOKING:      { emoji: '🍳', label: 'Cooking'      },
  FITNESS:      { emoji: '💪', label: 'Fitness'      },
  MOVING:       { emoji: '📦', label: 'Moving Help'  },
  GARDEN:       { emoji: '🌿', label: 'Garden'       },
  CREATIVE:     { emoji: '🎨', label: 'Creative'     },
  ERRANDS:      { emoji: '🛒', label: 'Errands'      },
  OTHER:        { emoji: '💼', label: 'Other'        },
};

export const JOB_TYPE_LABEL: Record<string, string> = {
  ONE_TIME:  'One-time',
  RECURRING: 'Recurring',
  PART_TIME: 'Part-time',
  FULL_TIME: 'Full-time',
};

const STATUS_STYLE: Record<string, { label: string; classes: string }> = {
  OPEN:    { label: 'Hiring',  classes: 'bg-emerald-100 text-emerald-700' },
  FILLED:  { label: 'Filled',  classes: 'bg-amber-100 text-amber-700'    },
  CLOSED:  { label: 'Closed',  classes: 'bg-gray-100 text-gray-500'      },
  EXPIRED: { label: 'Expired', classes: 'bg-red-100 text-red-600'        },
};

function payLabel(job: Job): string {
  if (job.payType === 'VOLUNTEER')  return '🤝 Volunteer';
  if (job.payType === 'NEGOTIABLE') return '💬 Negotiable';
  if (!job.payAmount)               return job.payType === 'HOURLY' ? '₹/hr TBD' : 'Fixed TBD';
  return job.payType === 'HOURLY' ? `₹${job.payAmount}/hr` : `₹${job.payAmount.toLocaleString('en-IN')}`;
}

interface JobCardProps {
  job:     Job;
  onClick: (id: number) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const meta   = JOB_CATEGORY_META[job.category] ?? JOB_CATEGORY_META.OTHER;
  const status = STATUS_STYLE[job.status] ?? STATUS_STYLE.OPEN;

  return (
    <button
      onClick={() => onClick(job.id)}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-indigo-100">
          {meta.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-gray-900 text-sm leading-tight">{job.title}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${status.classes}`}>
              {status.label}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-0.5">
            {job.posterName}{job.posterFlat ? ` · ${job.posterFlat}` : ''}
          </p>

          <p className="text-sm text-gray-600 mt-1.5 line-clamp-2 leading-snug">
            {job.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {meta.label}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {JOB_TYPE_LABEL[job.jobType] ?? job.jobType}
            </span>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
              {payLabel(job)}
            </span>
            {job.location && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                📍 {job.location}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>👥 {job.applicationCount} applicant{job.applicationCount !== 1 ? 's' : ''}</span>
            <span>🕐 {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
            {job.hasApplied && (
              <span className={`font-semibold ${
                job.myApplicationStatus === 'ACCEPTED' ? 'text-emerald-600' :
                job.myApplicationStatus === 'REJECTED' ? 'text-red-500' : 'text-indigo-500'
              }`}>
                {job.myApplicationStatus === 'ACCEPTED' ? '✅ Accepted' :
                 job.myApplicationStatus === 'REJECTED' ? '❌ Rejected' : '⏳ Applied'}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
