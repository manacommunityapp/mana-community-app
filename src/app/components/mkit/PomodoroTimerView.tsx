import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, SkipForward, Bell, Volume2, Sparkles, CheckCircle2, Flame } from "lucide-react";

type TimerMode = "work" | "shortBreak" | "longBreak";

export function PomodoroTimerView() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [workMinutes, setWorkMinutes] = useState<number>(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState<number>(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState<number>(15);

  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [taskName, setTaskName] = useState<string>("");

  const intervalRef = useRef<any>(null);

  const getDurationForMode = (m: TimerMode): number => {
    switch (m) {
      case "work":
        return workMinutes * 60;
      case "shortBreak":
        return shortBreakMinutes * 60;
      case "longBreak":
        return longBreakMinutes * 60;
    }
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // AudioContext unavailable
    }
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            playBeep();

            if (mode === "work") {
              const nextCount = completedSessions + 1;
              setCompletedSessions(nextCount);
              if (nextCount % 4 === 0) {
                setMode("longBreak");
                return longBreakMinutes * 60;
              } else {
                setMode("shortBreak");
                return shortBreakMinutes * 60;
              }
            } else {
              setMode("work");
              return workMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, completedSessions, workMinutes, shortBreakMinutes, longBreakMinutes]);

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDurationForMode(newMode));
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getDurationForMode(mode));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const totalTime = getDurationForMode(mode);
  const progressPercent = Math.min(100, Math.max(0, ((totalTime - timeLeft) / totalTime) * 100));

  const modeTheme = {
    work: {
      gradient: "from-rose-950 via-slate-900 to-slate-950",
      accent: "text-rose-400",
      buttonBg: "bg-rose-600 hover:bg-rose-500",
      ringColor: "text-rose-500",
      label: "Focus Work Time",
    },
    shortBreak: {
      gradient: "from-teal-950 via-slate-900 to-slate-950",
      accent: "text-teal-400",
      buttonBg: "bg-teal-600 hover:bg-teal-500",
      ringColor: "text-teal-500",
      label: "Short Break (Rest)",
    },
    longBreak: {
      gradient: "from-indigo-950 via-slate-900 to-slate-950",
      accent: "text-indigo-400",
      buttonBg: "bg-indigo-600 hover:bg-indigo-500",
      ringColor: "text-indigo-500",
      label: "Long Break (Refresh)",
    },
  }[mode];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Timer Panel */}
        <div className={`lg:col-span-7 bg-gradient-to-br ${modeTheme.gradient} text-white p-8 rounded-3xl shadow-xl flex flex-col items-center justify-between min-h-[420px]`}>
          {/* Mode Tabs */}
          <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-sm gap-1">
            <button
              onClick={() => switchMode("work")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                mode === "work" ? "bg-rose-600 text-white shadow-sm" : "text-slate-300 hover:text-white"
              }`}
            >
              Focus (25m)
            </button>
            <button
              onClick={() => switchMode("shortBreak")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                mode === "shortBreak" ? "bg-teal-600 text-white shadow-sm" : "text-slate-300 hover:text-white"
              }`}
            >
              Short Break (5m)
            </button>
            <button
              onClick={() => switchMode("longBreak")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                mode === "longBreak" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-300 hover:text-white"
              }`}
            >
              Long Break (15m)
            </button>
          </div>

          {/* Big Clock Display with Ring */}
          <div className="text-center my-6">
            <div className="text-7xl sm:text-8xl font-black font-mono tracking-tight text-white select-none">
              {formatTime(timeLeft)}
            </div>
            <p className={`text-xs font-semibold uppercase tracking-widest mt-2 ${modeTheme.accent}`}>
              {modeTheme.label}
            </p>

            {/* Linear Progress */}
            <div className="w-64 h-2 bg-white/10 rounded-full mt-4 mx-auto overflow-hidden">
              <div
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-white transition-all duration-500 rounded-full"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              title="Reset Timer"
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition backdrop-blur-sm"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-8 py-3.5 rounded-2xl text-white font-bold text-base flex items-center gap-2 shadow-lg transition-transform active:scale-95 ${modeTheme.buttonBg}`}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              {isRunning ? "Pause" : "Start Focus"}
            </button>

            <button
              onClick={() => {
                if (mode === "work") switchMode("shortBreak");
                else switchMode("work");
              }}
              title="Skip to Next Mode"
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition backdrop-blur-sm"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Settings & Stats Panel */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              Focus Goal & Stats
            </h3>

            {/* Task Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current Task / Objective
              </label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g. Study chapters, code sports bracket..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Session Stats Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                <p className="text-xs text-rose-600 font-semibold">Completed Focus Cycles</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-rose-700">{completedSessions}</span>
                  <span className="text-xs text-rose-500">sessions</span>
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                <p className="text-xs text-indigo-600 font-semibold">Focus Minutes</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-indigo-700">
                    {completedSessions * workMinutes}
                  </span>
                  <span className="text-xs text-indigo-500">mins logged</span>
                </div>
              </div>
            </div>

            {/* Interval Duration Sliders */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Focus Duration</span>
                  <span className="text-rose-600 font-bold">{workMinutes} mins</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={workMinutes}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setWorkMinutes(v);
                    if (mode === "work" && !isRunning) setTimeLeft(v * 60);
                  }}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Short Break</span>
                  <span className="text-teal-600 font-bold">{shortBreakMinutes} mins</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="1"
                  value={shortBreakMinutes}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setShortBreakMinutes(v);
                    if (mode === "shortBreak" && !isRunning) setTimeLeft(v * 60);
                  }}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Audio chime plays automatically upon cycle completion.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
