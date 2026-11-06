import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ChevronLeft, Dumbbell, Flame, Clock, Trophy, Filter,
  CheckCircle2, PlayCircle, PauseCircle, Plus, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { TrainerProgramDto, UserProgramEnrollmentDto, ProgramDifficulty } from '../../../types/wellness';

const DIFFICULTIES: { label: string; value: ProgramDifficulty | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
];

const GOAL_COLORS: Record<string, string> = {
  WEIGHT_LOSS: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  STRENGTH: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  ENDURANCE: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  FLEXIBILITY: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  GENERAL: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const DIFF_COLORS: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  INTERMEDIATE: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  ADVANCED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export default function TrainerPrograms() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<TrainerProgramDto[]>([]);
  const [enrollment, setEnrollment] = useState<UserProgramEnrollmentDto | null>(null);
  const [difficulty, setDifficulty] = useState<ProgramDifficulty | ''>('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<number | null>(null);

  useEffect(() => {
    loadAll();
  }, [difficulty]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [progs, today] = await Promise.all([
        wellnessService.listPrograms(difficulty || undefined),
        wellnessService.getTodaysProgram().catch(() => null),
      ]);
      setPrograms(progs);
      setEnrollment(today);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (programId: number) => {
    setEnrolling(programId);
    try {
      await wellnessService.enrollInProgram(programId);
      await loadAll();
    } catch (e) {
      console.error('Enroll failed', e);
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/wellness')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" /> Trainer Programs
          </h1>
          <p className="text-xs text-muted-foreground">Follow structured workout plans</p>
        </div>
        <Link to="/wellness/trainer-programs/my">
          <Button variant="outline" size="sm" className="gap-1">
            <Trophy className="h-3.5 w-3.5" /> My Programs
          </Button>
        </Link>
      </div>

      {/* Active enrollment banner */}
      {enrollment && enrollment.status === 'ACTIVE' && (
        <Card className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950 dark:to-indigo-950 border-violet-200 dark:border-violet-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-violet-600 dark:text-violet-400 font-medium uppercase tracking-wide">Currently enrolled</p>
                <p className="font-semibold text-sm mt-0.5">{enrollment.programTitle}</p>
                <p className="text-xs text-muted-foreground">
                  Week {enrollment.currentWeek} · Day {enrollment.currentDay}
                  {enrollment.todaysDay && !enrollment.todaysDay.isRestDay
                    ? ` · ${enrollment.todaysDay.focus}`
                    : ' · Rest day'}
                </p>
              </div>
              <Link to={`/wellness/trainer-programs/${enrollment.programId}`}>
                <Button size="sm" className="gap-1 bg-violet-600 hover:bg-violet-700 text-white">
                  <PlayCircle className="h-3.5 w-3.5" /> Continue
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Difficulty filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DIFFICULTIES.map(d => (
          <button
            key={d.value}
            onClick={() => setDifficulty(d.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              difficulty === d.value
                ? 'bg-violet-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Programs grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Dumbbell className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No programs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center shrink-0">
                    <Dumbbell className="h-6 w-6 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/wellness/trainer-programs/${p.id}`} className="font-semibold text-sm hover:text-violet-600 leading-snug">
                        {p.title}
                      </Link>
                      {p.enrolled && (
                        <Badge className={`text-[10px] shrink-0 ${
                          p.enrollmentStatus === 'ACTIVE' ? 'bg-violet-600' :
                          p.enrollmentStatus === 'COMPLETED' ? 'bg-emerald-600' : 'bg-slate-500'
                        }`}>
                          {p.enrollmentStatus === 'ACTIVE' ? 'Active' :
                           p.enrollmentStatus === 'COMPLETED' ? 'Done' : p.enrollmentStatus}
                        </Badge>
                      )}
                    </div>

                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DIFF_COLORS[p.difficulty] ?? ''}`}>
                        {p.difficulty}
                      </span>
                      {p.targetGoal && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${GOAL_COLORS[p.targetGoal] ?? ''}`}>
                          {p.targetGoal.replace('_', ' ')}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" /> {p.durationWeeks}w
                      </span>
                    </div>

                    {/* Progress bar if enrolled and active */}
                    {p.enrolled && p.enrollmentStatus === 'ACTIVE' && p.currentWeek && p.durationWeeks && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                          <span>Week {p.currentWeek} of {p.durationWeeks}</span>
                          <span>Day {p.currentDay}</span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all"
                            style={{ width: `${Math.round(((p.currentWeek - 1) * 7 + (p.currentDay ?? 1)) / (p.durationWeeks * 7) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Link to={`/wellness/trainer-programs/${p.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                      View Details
                    </Button>
                  </Link>
                  {!p.enrolled || p.enrollmentStatus === 'COMPLETED' || p.enrollmentStatus === 'ABANDONED' ? (
                    <Button
                      size="sm"
                      className="gap-1 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                      disabled={enrolling === p.id}
                      onClick={() => handleEnroll(p.id!)}
                    >
                      {enrolling === p.id ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <><Plus className="h-3 w-3" /> Enroll</>
                      )}
                    </Button>
                  ) : p.enrollmentStatus === 'ACTIVE' ? (
                    <Link to={`/wellness/trainer-programs/${p.id}`}>
                      <Button size="sm" className="gap-1 text-xs bg-violet-600 hover:bg-violet-700 text-white">
                        <PlayCircle className="h-3 w-3" /> Continue
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
