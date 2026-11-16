import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ChevronLeft, Dumbbell, Clock, Flame, CheckCircle2,
  PlayCircle, PauseCircle, Coffee, ChevronDown, ChevronUp, Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { wellnessService } from '../../../services/wellness/wellnessService';
import type { TrainerProgramDto, TrainerProgramDayDto, ProgramExercise } from '../../../types/wellness';

const DIFF_COLORS: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  INTERMEDIATE: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  ADVANCED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

function parseExercises(json: string | undefined): ProgramExercise[] {
  if (!json) return [];
  try { return JSON.parse(json) as ProgramExercise[]; } catch { return []; }
}

function DayCard({ day, isCurrent, isCompleted }: {
  day: TrainerProgramDayDto;
  isCurrent: boolean;
  isCompleted: boolean;
}) {
  const [expanded, setExpanded] = useState(isCurrent);
  const exercises = parseExercises(day.exercises);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      isCurrent ? 'border-violet-400 shadow-sm' : isCompleted ? 'border-emerald-200 dark:border-emerald-800' : 'border-border'
    }`}>
      <button
        className={`w-full flex items-center justify-between p-3 text-left ${
          isCurrent ? 'bg-violet-50 dark:bg-violet-950/40' :
          isCompleted ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''
        }`}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            isCompleted ? 'bg-emerald-500 text-white' :
            isCurrent ? 'bg-violet-600 text-white' :
            day.isRestDay ? 'bg-muted text-muted-foreground' : 'bg-slate-200 dark:bg-slate-700 text-foreground'
          }`}>
            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : day.dayNumber}
          </div>
          <div>
            <p className="text-sm font-medium leading-none">
              {day.dayName ?? `Day ${day.dayNumber}`}
              {isCurrent && <span className="ml-2 text-[10px] text-violet-600 dark:text-violet-400 font-semibold">TODAY</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {day.isRestDay ? 'Rest Day' : day.focus ?? `${exercises.length} exercises`}
              {day.totalDurationMin ? ` · ${day.totalDurationMin} min` : ''}
            </p>
          </div>
        </div>
        {!day.isRestDay && exercises.length > 0 && (
          expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
        {day.isRestDay && <Coffee className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && !day.isRestDay && exercises.length > 0 && (
        <div className="px-3 pb-3 space-y-1.5 border-t">
          {exercises.map((ex, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <Dumbbell className="h-3.5 w-3.5 text-violet-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{ex.exerciseName}</span>
                {ex.notes && <span className="text-xs text-muted-foreground ml-2">{ex.notes}</span>}
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ''}
                {ex.durationMin ? `${ex.durationMin} min` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrainerProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<TrainerProgramDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    wellnessService.getProgram(Number(id))
      .then(p => {
        setProgram(p);
        // If enrolled, fetch enrollment id
        if (p.enrolled) {
          wellnessService.getMyEnrollments()
            .then(enrollments => {
              const e = enrollments.find(en => en.programId === p.id && en.status === 'ACTIVE');
              if (e) setEnrollmentId(e.id);
            }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (!program?.id) return;
    setEnrolling(true);
    try {
      const e = await wellnessService.enrollInProgram(program.id);
      setEnrollmentId(e.id);
      const updated = await wellnessService.getProgram(program.id);
      setProgram(updated);
    } catch (err) {
      console.error('Enroll failed', err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleCompleteDay = async () => {
    if (!enrollmentId) return;
    setCompleting(true);
    try {
      await wellnessService.completeDay(enrollmentId);
      const updated = await wellnessService.getProgram(Number(id));
      setProgram(updated);
    } finally {
      setCompleting(false);
    }
  };

  const handlePause = async () => {
    if (!enrollmentId) return;
    await wellnessService.pauseEnrollment(enrollmentId);
    const updated = await wellnessService.getProgram(Number(id));
    setProgram(updated);
  };

  const handleResume = async () => {
    if (!enrollmentId) return;
    await wellnessService.resumeEnrollment(enrollmentId);
    const updated = await wellnessService.getProgram(Number(id));
    setProgram(updated);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }
  if (!program) return null;

  const days = program.days ?? [];
  // Group by week
  const weeks: Record<number, TrainerProgramDayDto[]> = {};
  days.forEach(d => {
    if (!weeks[d.weekNumber]) weeks[d.weekNumber] = [];
    weeks[d.weekNumber].push(d);
  });

  const totalDays = program.durationWeeks * 7;
  const doneDays = program.enrolled && program.enrollmentStatus === 'ACTIVE' && program.currentWeek && program.currentDay
    ? (program.currentWeek - 1) * 7 + (program.currentDay - 1)
    : program.enrollmentStatus === 'COMPLETED' ? totalDays : 0;
  const progressPct = totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/wellness/trainer-programs')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold flex-1 leading-tight">{program.title}</h1>
      </div>

      {/* Hero card */}
      <Card className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-0">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${DIFF_COLORS[program.difficulty]} opacity-90`}>
                  {program.difficulty}
                </span>
                {program.targetGoal && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-medium">
                    {program.targetGoal.replace('_', ' ')}
                  </span>
                )}
              </div>
              {program.description && (
                <p className="text-sm text-white/80 leading-snug">{program.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {program.durationWeeks} weeks</span>
                <span className="flex items-center gap-1"><Dumbbell className="h-3.5 w-3.5" /> {days.filter(d => !d.isRestDay).length} workouts</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          {program.enrolled && program.enrollmentStatus === 'ACTIVE' && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>Progress — Week {program.currentWeek} · Day {program.currentDay}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/80 rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}
          {program.enrollmentStatus === 'COMPLETED' && (
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <Trophy className="h-4 w-4" /> Program completed!
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      {!program.enrolled || program.enrollmentStatus === 'COMPLETED' || program.enrollmentStatus === 'ABANDONED' ? (
        <Button
          className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
          disabled={enrolling}
          onClick={handleEnroll}
        >
          {enrolling ? 'Enrolling…' : program.enrollmentStatus === 'COMPLETED' ? 'Start Again' : 'Enroll & Start Program'}
        </Button>
      ) : program.enrollmentStatus === 'ACTIVE' ? (
        <div className="flex gap-2">
          <Button
            className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            disabled={completing}
            onClick={handleCompleteDay}
          >
            <CheckCircle2 className="h-4 w-4" />
            {completing ? 'Saving…' : "Complete Today's Workout"}
          </Button>
          <Button variant="outline" size="icon" onClick={handlePause} title="Pause program">
            <PauseCircle className="h-4 w-4" />
          </Button>
        </div>
      ) : program.enrollmentStatus === 'PAUSED' ? (
        <Button className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleResume}>
          <PlayCircle className="h-4 w-4" /> Resume Program
        </Button>
      ) : null}

      {/* Week-by-week schedule */}
      {Object.keys(weeks).length > 0 && (
        <div className="space-y-4">
          {Object.entries(weeks).map(([week, wDays]) => (
            <div key={week}>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                Week {week}
                {program.enrolled && program.currentWeek === Number(week) && (
                  <Badge className="text-[10px] bg-violet-600">Current</Badge>
                )}
              </h3>
              <div className="space-y-1.5">
                {wDays.map(d => (
                  <DayCard
                    key={d.id}
                    day={d}
                    isCurrent={
                      !!program.enrolled &&
                      program.enrollmentStatus === 'ACTIVE' &&
                      program.currentWeek === d.weekNumber &&
                      program.currentDay === d.dayNumber
                    }
                    isCompleted={
                      !!program.enrolled &&
                      (
                        program.enrollmentStatus === 'COMPLETED' ||
                        (!!program.currentWeek && !!program.currentDay && (
                          d.weekNumber < program.currentWeek ||
                          (d.weekNumber === program.currentWeek && d.dayNumber < program.currentDay)
                        ))
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
