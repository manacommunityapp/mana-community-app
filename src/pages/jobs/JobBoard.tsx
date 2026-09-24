import React, { useState, useEffect, useCallback } from 'react';
import { JobCard, JOB_CATEGORY_META, JOB_TYPE_LABEL } from '../../components/jobs/JobCard';
import { jobService } from '../../services/jobService';
import type { Job, JobCategory, JobType } from '../../types/jobs';

const CATEGORIES: { value: JobCategory | 'ALL'; label: string }[] = [
  { value: 'ALL',         label: 'All'          },
  { value: 'HOME_REPAIRS',label: '🔧 Repairs'   },
  { value: 'CLEANING',    label: '🧹 Cleaning'  },
  { value: 'CHILDCARE',   label: '👶 Childcare' },
  { value: 'TUTORING',    label: '🎓 Tutoring'  },
  { value: 'PET_CARE',    label: '🐾 Pets'      },
  { value: 'TRANSPORT',   label: '🚗 Transport' },
  { value: 'TECH_HELP',   label: '💻 Tech'      },
  { value: 'COOKING',     label: '🍳 Cooking'   },
  { value: 'ERRANDS',     label: '🛒 Errands'   },
  { value: 'OTHER',       label: '💼 Other'     },
];

const JOB_TYPES: { value: JobType | 'ALL'; label: string }[] = [
  { value: 'ALL',       label: 'All types'  },
  { value: 'ONE_TIME',  label: 'One-time'   },
  { value: 'RECURRING', label: 'Recurring'  },
  { value: 'PART_TIME', label: 'Part-time'  },
  { value: 'FULL_TIME', label: 'Full-time'  },
];

interface Props {
  onJobClick:   (id: number) => void;
  onCreateClick: ()          => void;
  onMyJobsClick: ()          => void;
}

export function JobBoard({ onJobClick, onCreateClick, onMyJobsClick }: Props) {
  const [jobs,     setJobs]     = useState<Job[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(0);
  const [hasMore,  setHasMore]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState<JobCategory | 'ALL'>('ALL');
  const [jobType,  setJobType]  = useState<JobType | 'ALL'>('ALL');

  const fetchJobs = useCallback(async (reset = true) => {
    setLoading(true);
    try {
      const res = await jobService.getJobs({
        category: category === 'ALL' ? undefined : category,
        jobType:  jobType  === 'ALL' ? undefined : jobType,
        search:   search.trim()   || undefined,
        page:     reset ? 0 : page,
      });
      if (reset) {
        setJobs(res.content);
        setPage(0);
      } else {
        setJobs((prev) => [...prev, ...res.content]);
      }
      setTotal(res.totalElements);
      setHasMore(res.page + 1 < res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, jobType, search, page]);

  useEffect(() => { fetchJobs(true); }, [category, jobType]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchJobs(true), 400);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">💼 Job Board</h1>
          <p className="text-sm text-gray-500">{total} open jobs in your community</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onMyJobsClick}
            className="border border-gray-300 text-gray-700 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50"
          >
            My Jobs
          </button>
          <button
            onClick={onCreateClick}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700"
          >
            + Post Job
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={[
              'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
              category === c.value
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300',
            ].join(' ')}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        {JOB_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setJobType(t.value)}
            className={[
              'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
              jobType === t.value
                ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Job list */}
      {loading && jobs.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">💼</p>
          <p className="text-xl font-bold text-gray-700">No jobs found</p>
          <p className="text-gray-500 text-sm mt-1">
            {search ? `No results for "${search}"` : 'Be the first to post a job.'}
          </p>
          <button
            onClick={onCreateClick}
            className="mt-4 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700"
          >
            Post a Job
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={onJobClick} />
          ))}

          {hasMore && (
            <button
              onClick={() => { setPage((p) => p + 1); fetchJobs(false); }}
              disabled={loading}
              className="w-full py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
