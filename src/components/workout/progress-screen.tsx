import { useMemo, useState } from "react";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { allExercises, programById } from "@/lib/workout/program";
import {
  bodyWeightTrend,
  exerciseProgress,
  exerciseTrend,
  formatDate,
  formatDuration,
  formatKg,
  formatSet,
  goalProgress,
  latestBodyWeight,
  sessionSummary,
  setMeetsTarget,
  volumeTrend,
} from "@/lib/workout/stats";
import { useWorkoutStore } from "@/lib/workout/store";
import type { ProgramDay, Session } from "@/lib/workout/types";
import { DropLogControl } from "./drop-log";
import { AppHeaderTitle, AppShell } from "./shell";
import { TrendBarChart, TrendLineChart } from "./trend-chart";

export function ProgressScreen() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const programs = useWorkoutStore((s) => s.programs);
  const bodyWeight = useWorkoutStore((s) => s.bodyWeight);
  const goals = useWorkoutStore((s) => s.goals);

  const exercises = useMemo(() => allExercises(programs), [programs]);
  const finishedSessions = useMemo(
    () => sessions.filter((s) => s.finishedAt !== null),
    [sessions],
  );

  const volData = useMemo(() => volumeTrend(finishedSessions), [finishedSessions]);
  const weightData = useMemo(() => bodyWeightTrend(bodyWeight), [bodyWeight]);
  const latestWeight = latestBodyWeight(bodyWeight);

  const defaultExerciseId =
    exercises.find((e) => finishedSessions.some((s) => (s.logs[e.id]?.length ?? 0) > 0))?.id ??
    exercises[0]?.id ??
    "";

  const [selectedExerciseId, setSelectedExerciseId] = useState(defaultExerciseId);
  const activeExerciseId = exercises.some((e) => e.id === selectedExerciseId)
    ? selectedExerciseId
    : defaultExerciseId;

  const liftData = useMemo(
    () => (activeExerciseId ? exerciseTrend(finishedSessions, activeExerciseId) : []),
    [finishedSessions, activeExerciseId],
  );

  const activeLift = exercises.find((e) => e.id === activeExerciseId);
  const liftGoal = goals.lifts.find((g) => g.exerciseId === activeExerciseId);

  const firstWeight = weightData[0]?.value;
  const weightGoalProgress =
    latestWeight && goals.bodyWeightKg != null && firstWeight != null
      ? goalProgress(firstWeight, latestWeight.kg, goals.bodyWeightKg)
      : null;

  const firstLiftVal = liftData[0]?.value;
  const lastLiftVal = liftData[liftData.length - 1]?.value;
  const liftGoalProgress =
    firstLiftVal != null && lastLiftVal != null && liftGoal?.weightKg
      ? goalProgress(firstLiftVal, lastLiftVal, liftGoal.weightKg)
      : null;

  return (
    <AppShell nav>
      <header className="flex items-center justify-between px-4 pt-2.5 pb-1">
        <AppHeaderTitle />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Progress
        </span>
      </header>

      <main className="flex-1 px-4 pb-4">
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-fg">
          Improvement
        </h1>
        <p className="mt-0.5 text-xs text-muted">
          Weight on the bar, volume, and body weight over time.
        </p>

        {goals.note && (
          <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-xs text-fg shadow-card">
            {goals.note}
          </p>
        )}

        {/* Body Weight Chart */}
        <section className="mt-2.5 rounded-xl bg-surface px-2.5 pb-2.5 pt-3 shadow-card">
          <div className="flex items-baseline justify-between px-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
              Body weight
            </p>
            {weightGoalProgress != null && (
              <p className="text-[11px] tabular-nums text-muted font-medium">
                {Math.round(weightGoalProgress)}% to goal
              </p>
            )}
          </div>
          <div className="mt-1">
            <TrendLineChart data={weightData} unit="kg" goal={goals.bodyWeightKg} />
          </div>
        </section>

        {/* Volume Chart */}
        <section className="mt-2.5 rounded-xl bg-surface px-2.5 pb-2.5 pt-3 shadow-card">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-subtle">
            Session volume
          </p>
          <div className="mt-1">
            <TrendBarChart data={volData} />
          </div>
        </section>

        {/* Lift Load Chart */}
        <section className="mt-2.5 rounded-xl bg-surface px-2.5 pb-2.5 pt-3 shadow-card">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
              Lift load
            </p>
            {exercises.length > 0 && (
              <Select
                className="h-8 w-36 px-2 text-xs"
                value={activeExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                aria-label="Lift to chart"
              >
                {exercises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name || "Untitled"}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {liftGoalProgress != null ? (
            <p className="px-1 pt-0.5 text-[11px] tabular-nums text-muted">
              {formatKg(lastLiftVal ?? 0)} kg now
              {liftGoal?.weightKg ? ` · goal ${formatKg(liftGoal.weightKg)} kg` : ""} ·{" "}
              {Math.round(liftGoalProgress)}%
            </p>
          ) : activeLift && liftGoal?.weightKg ? (
            <p className="px-1 pt-0.5 text-[11px] text-muted">
              Goal {formatKg(liftGoal.weightKg)} kg × {liftGoal.reps ?? "—"} reps
            </p>
          ) : null}

          <div className="mt-1">
            <TrendLineChart data={liftData} unit="kg" goal={liftGoal?.weightKg} />
          </div>
        </section>

        {/* Sessions History List */}
        {finishedSessions.length === 0 ? (
          <div className="mt-4 rounded-xl bg-surface px-4 py-6 text-center shadow-card">
            <p className="text-xs text-muted">No saved sessions yet.</p>
            <p className="mt-0.5 text-[11px] text-subtle">
              Finish a session to start the log.
            </p>
          </div>
        ) : (
          <div className="mt-3.5 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle px-1">
              History
            </h2>
            <ol className="space-y-2">
              {finishedSessions.map((s) => (
                <HistorySessionItem
                  key={s.id}
                  session={s}
                  program={programById(programs, s.dayId)}
                />
              ))}
            </ol>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function HistorySessionItem({
  session,
  program,
}: {
  session: Session;
  program?: ProgramDay;
}) {
  const summary = sessionSummary(session, program);
  const color = summary.status === "hit" ? "text-hit" : "text-miss";
  const exercises = program?.exercises ?? [];

  return (
    <li className="rounded-xl bg-surface p-3 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-fg">
            {program?.weekday ?? "Day"} · {formatDate(session.startedAt)}
          </p>
          <p className="mt-0.5 text-[11px] text-subtle">
            {session.finishedAt
              ? formatDuration(session.startedAt, session.finishedAt)
              : "Open"}{" "}
            · {Math.round(summary.volume).toLocaleString()} kg volume
          </p>
        </div>
        <span className={cn("font-display text-base font-bold tabular-nums", color)}>
          {summary.headline}
        </span>
      </div>

      <p className="mt-0.5 text-[11px] text-muted">{summary.detail}</p>

      <ul className="mt-2 space-y-1">
        {exercises.map((ex) => {
          const sets = session.logs[ex.id] ?? [];
          const prog = exerciseProgress(ex, sets);

          if (sets.length === 0) {
            return (
              <li key={ex.id} className="text-[11px] text-subtle">
                <span className="text-muted">{ex.name}</span> · skipped
              </li>
            );
          }

          return (
            <li key={ex.id} className="text-xs">
              <div className="flex items-baseline justify-between gap-1">
                <p className="text-[11px] font-medium text-fg">{ex.name}</p>
                <p
                  className={cn(
                    "text-[10px] uppercase tracking-wider font-semibold",
                    prog.minHit ? "text-hit" : "text-miss",
                  )}
                >
                  {prog.setsDone}/{ex.minSets}
                </p>
              </div>
              <p className="text-[11px] tabular-nums text-muted">
                {sets.map((set, idx) => (
                  <span key={set.id}>
                    {idx > 0 ? " · " : ""}
                    <span
                      className={
                        setMeetsTarget(ex, set) ? "text-muted" : "text-short font-medium"
                      }
                    >
                      {formatSet(set)}
                    </span>
                  </span>
                ))}
              </p>
            </li>
          );
        })}
      </ul>

      {/* Drop Log Action Control */}
      <DropLogControl sessionId={session.id} startedAt={session.startedAt} />
    </li>
  );
}
