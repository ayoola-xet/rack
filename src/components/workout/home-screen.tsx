import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Dumbbell,
  Flame,
  Plus,
  Play,
  RotateCcw,
  Scale,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatDuration,
  formatKg,
  goalProgress,
  latestBodyWeight,
  sessionSummary,
  sessionVolume,
  countTotalSets,
} from "@/lib/workout/stats";
import {
  selectActiveSession,
  useWorkoutStore,
} from "@/lib/workout/store";
import {
  orderedPrograms,
  prescribedWeightLabel,
  programById,
  sessionExercises,
} from "@/lib/workout/program";
import type { ProgramDay, Session } from "@/lib/workout/types";
import { AppHeaderTitle, AppShell } from "./shell";

export function HomeScreen() {
  const navigate = useNavigate();
  const sessions = useWorkoutStore((s) => s.sessions);
  const programs = useWorkoutStore((s) => s.programs);
  const hydrated = useWorkoutStore((s) => s.hydrated);
  const activeSession = useWorkoutStore(selectActiveSession);
  const startDay = useWorkoutStore((s) => s.startDay);
  const startQuickSession = useWorkoutStore((s) => s.startQuickSession);
  const finishSession = useWorkoutStore((s) => s.finishSession);
  const discardSession = useWorkoutStore((s) => s.discardSession);
  const bodyWeight = useWorkoutStore((s) => s.bodyWeight);
  const goals = useWorkoutStore((s) => s.goals);
  const logBodyWeight = useWorkoutStore((s) => s.logBodyWeight);
  const createDay = useWorkoutStore((s) => s.createDay);

  const ordered = useMemo(() => orderedPrograms(programs), [programs]);

  // Detect current day of week and match today's scheduled workout
  const todayWeekday = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  }, []);

  const todayScheduledProgram = useMemo(() => {
    return ordered.find((p) => p.weekday.toLowerCase() === todayWeekday.toLowerCase()) ?? null;
  }, [ordered, todayWeekday]);

  const [selectedDayId, setSelectedDayId] = useState<string>(() => {
    return todayScheduledProgram?.id ?? ordered[0]?.id ?? "";
  });

  useEffect(() => {
    if (todayScheduledProgram && !selectedDayId) {
      setSelectedDayId(todayScheduledProgram.id);
    } else if (!programById(ordered, selectedDayId) && ordered[0]) {
      setSelectedDayId(ordered[0].id);
    }
  }, [ordered, selectedDayId, todayScheduledProgram]);

  const activeProgram = programById(ordered, selectedDayId) ?? todayScheduledProgram ?? ordered[0] ?? null;
  const latestWeight = latestBodyWeight(bodyWeight);
  const [weightInput, setWeightInput] = useState<string>("");

  const finished = useMemo(() => sessions.filter((s) => s.finishedAt !== null), [sessions]);
  const lastFinished = finished[0] ?? null;
  const recentSessions = finished.slice(0, 3);

  // Weekly consistency tracker
  const weekStats = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    const letters = ["M", "T", "W", "T", "F", "S", "S"];
    let workoutsThisWeek = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000;

      const hasWorkout = finished.some(
        (s) => s.startedAt >= dayStart && s.startedAt < dayEnd,
      );
      if (hasWorkout) workoutsThisWeek++;
      const isToday = d.toDateString() === now.toDateString();

      days.push({
        date: d,
        dayLetter: letters[i],
        isToday,
        hasWorkout,
      });
    }
    return { days, count: workoutsThisWeek };
  }, [finished]);

  const handleStartWorkout = (dayId: string) => {
    startDay(dayId);
    void navigate({ to: "/session" });
  };

  const handleStartQuickWorkout = () => {
    startQuickSession();
    void navigate({ to: "/session" });
  };

  const handleLogWeight = () => {
    const val = Number(weightInput);
    if (!Number.isFinite(val) || val <= 0) return;
    logBodyWeight(val);
    setWeightInput("");
  };

  const goalWeight = goals.bodyWeightKg;
  const firstWeight = bodyWeight[bodyWeight.length - 1];
  const weightProgressPct =
    latestWeight && goalWeight != null && firstWeight
      ? goalProgress(firstWeight.kg, latestWeight.kg, goalWeight)
      : null;

  return (
    <AppShell nav>
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-2.5 pb-1">
        <AppHeaderTitle />
        <span className="text-[11px] font-semibold tracking-wider text-subtle">
          {todayWeekday}, {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date())}
        </span>
      </header>

      <main className="flex flex-1 flex-col px-4 pb-4">
        {/* Active Session in Progress Alert Banner */}
        {activeSession && (
          <ActiveSessionBanner
            session={activeSession}
            program={programById(programs, activeSession.dayId)}
            onResume={() => void navigate({ to: "/session" })}
            onDiscard={discardSession}
          />
        )}

        {/* Primary Workout Hero Card */}
        <section className="mt-2.5 rounded-2xl border border-border/80 bg-gradient-to-b from-surface to-surface/90 p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="flex size-2 rounded-full bg-hit animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  {todayScheduledProgram
                    ? "Today's Scheduled Split"
                    : "Recommended Routine"}
                </span>
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-fg leading-tight">
                {activeProgram ? activeProgram.weekday : "Workout Routine"}
              </h1>
              <p className="text-xs font-medium text-muted">
                {activeProgram?.split || "Full Gym Session"} · {activeProgram?.exercises.length ?? 0} exercises
              </p>
            </div>

            {activeProgram && (
              <Link
                to="/programs/$dayId"
                params={{ dayId: activeProgram.id }}
                className="rounded-lg bg-surface-2 px-2 py-1 text-[11px] font-semibold text-muted hover:text-fg hover:bg-surface-2/80 transition-colors shadow-xs"
              >
                Edit Day
              </Link>
            )}
          </div>

          {/* Exercise Preview Chips */}
          {activeProgram && activeProgram.exercises.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activeProgram.exercises.slice(0, 5).map((ex) => (
                <span
                  key={ex.id}
                  className="rounded-md bg-surface-2/80 px-2 py-1 text-[11px] font-medium text-fg shadow-xs"
                >
                  {ex.name}
                </span>
              ))}
              {activeProgram.exercises.length > 5 && (
                <span className="rounded-md bg-surface-2/50 px-2 py-1 text-[11px] font-medium text-muted">
                  +{activeProgram.exercises.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Action Buttons: Start Workout & Quick Start */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            {activeProgram && activeProgram.exercises.length > 0 ? (
              <Button
                className="flex-1 font-bold shadow-md"
                size="lg"
                onClick={() => handleStartWorkout(activeProgram.id)}
                disabled={!hydrated}
              >
                <Play className="size-4 fill-current" />
                Start {activeProgram.weekday}
              </Button>
            ) : (
              <Button
                className="flex-1 font-bold shadow-md"
                size="lg"
                onClick={handleStartQuickWorkout}
                disabled={!hydrated}
              >
                <Play className="size-4 fill-current" />
                Start Workout
              </Button>
            )}

            <Button
              variant="secondary"
              size="lg"
              onClick={handleStartQuickWorkout}
              disabled={!hydrated}
              className="gap-1.5 font-semibold text-xs"
            >
              <Zap className="size-3.5 text-accent" />
              Quick Start
            </Button>
          </div>
        </section>

        {/* Weekly Consistency & Streaks */}
        <section className="mt-3 rounded-xl bg-surface p-3 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className="size-4 text-accent" />
              <span className="text-xs font-bold text-fg">Weekly Consistency</span>
            </div>
            <span className="text-[11px] font-semibold text-accent">
              {weekStats.count} workout{weekStats.count === 1 ? "" : "s"} this week
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-7 gap-1">
            {weekStats.days.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg py-1.5 text-center transition-colors",
                  day.isToday ? "border border-accent/60 bg-surface-2" : "bg-surface-2/40",
                )}
              >
                <span className="text-[10px] font-semibold text-subtle">
                  {day.dayLetter}
                </span>
                <span
                  className={cn(
                    "mt-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                    day.hasWorkout
                      ? "bg-hit text-white"
                      : day.isToday
                        ? "bg-surface text-muted border border-border"
                        : "text-subtle",
                  )}
                >
                  {day.hasWorkout ? "✓" : "·"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Day Selector Strip */}
        {ordered.length > 1 && (
          <div className="mt-3">
            <div className="flex items-baseline justify-between px-1 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
                Choose Scheduled Day
              </span>
              <Link to="/programs" className="text-xs text-muted hover:text-fg font-medium">
                All routines
              </Link>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {ordered.map((day) => {
                const isActive = (activeProgram?.id ?? "") === day.id;
                const isToday = day.weekday.toLowerCase() === todayWeekday.toLowerCase();
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setSelectedDayId(day.id)}
                    className={cn(
                      "flex h-8 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition-colors shadow-xs",
                      isActive
                        ? "bg-primary text-primary-fg"
                        : "bg-surface text-muted hover:text-fg",
                    )}
                  >
                    <span>{day.weekday.slice(0, 3)}</span>
                    {isToday && <span className="size-1.5 rounded-full bg-accent" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Compact Body Weight Widget */}
        <section className="mt-3 rounded-xl bg-surface p-3 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-accent">
                <Scale className="size-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
                  Body Weight
                </span>
                <p className="font-display text-xl font-bold tabular-nums text-fg leading-none">
                  {latestWeight ? `${formatKg(latestWeight.kg)} kg` : "Not logged yet"}
                </p>
              </div>
            </div>

            <div className="text-right">
              {goalWeight != null && (
                <p className="text-[11px] text-muted font-medium">
                  Goal {formatKg(goalWeight)} kg
                  {latestWeight && (
                    <span className="text-accent font-semibold ml-1">
                      ({Math.round(weightProgressPct ?? 0)}%)
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="mt-2.5 flex gap-1.5">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="1"
              placeholder={latestWeight ? `Current: ${latestWeight.kg} kg` : "Enter kg"}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              aria-label="Log body weight"
              className="h-9"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleLogWeight}
              disabled={!hydrated || !weightInput}
              className="h-9 font-semibold"
            >
              Log
            </Button>
          </div>
        </section>

        {/* Recent Workouts History */}
        {recentSessions.length > 0 && (
          <section className="mt-3.5">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle">
                Recent Workouts
              </h2>
              <Link
                to="/progress"
                className="text-xs font-medium text-muted hover:text-fg"
              >
                View Charts
              </Link>
            </div>

            <div className="mt-1.5 space-y-2">
              {recentSessions.map((s) => {
                const prog = programById(programs, s.dayId);
                const title = s.title || (prog ? `${prog.weekday} · ${prog.split}` : "Workout");
                const duration = s.finishedAt ? formatDuration(s.startedAt, s.finishedAt) : "—";
                const volume = sessionVolume(s);
                const totalSets = countTotalSets(s);

                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl bg-surface p-3 shadow-card"
                  >
                    <div>
                      <p className="font-display text-sm font-bold text-fg leading-none">
                        {title}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        {formatDate(s.startedAt)} · {duration} · {totalSets} sets
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-display text-sm font-bold text-accent tabular-nums leading-none">
                        {formatKg(volume)} kg
                      </p>
                      <p className="mt-1 text-[10px] text-subtle uppercase tracking-wider">
                        Volume
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}

function ActiveSessionBanner({
  session,
  program,
  onResume,
  onDiscard,
}: {
  session: Session;
  program?: ProgramDay;
  onResume: () => void;
  onDiscard: () => void;
}) {
  const setsCount = countTotalSets(session);
  const title = session.title || (program ? `${program.weekday} · ${program.split}` : "Active Workout");

  return (
    <div className="mt-2 rounded-xl border border-accent/40 bg-accent/10 p-3 shadow-card animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-2.5 rounded-full bg-accent animate-ping" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
            Workout in progress
          </span>
        </div>
        <button
          type="button"
          onClick={onDiscard}
          className="text-[11px] text-miss hover:underline font-medium"
        >
          Discard
        </button>
      </div>

      <div className="mt-1.5 flex items-baseline justify-between">
        <div>
          <p className="font-display text-base font-bold text-fg leading-tight">
            {title}
          </p>
          <p className="text-xs text-muted">
            {setsCount} sets completed so far
          </p>
        </div>

        <Button size="sm" onClick={onResume} className="gap-1 font-semibold">
          Resume
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
