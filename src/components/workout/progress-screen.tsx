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
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <AppHeaderTitle />
        <span className="text-xs font-medium uppercase tracking-widest text-subtle">
          Progress
        </span>
      </header>

      <main className="flex-1 px-5 pb-10">
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-fg">
          Improvement
        </h1>
        <p className="mt-2 text-sm text-muted">
          Weight on the bar, volume, and body weight over time. Dashed line is the goal.
        </p>

        {goals.note && (
          <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-fg shadow-card">
            {goals.note}
          </p>
        )}

        {/* Body Weight Chart */}
        <section className="mt-6 rounded-xl bg-surface px-2 pb-3 pt-4 shadow-card">
          <div className="flex items-baseline justify-between px-3">
            <p className="text-xs font-medium uppercase tracking-widest text-subtle">
              Body weight
            </p>
            {weightGoalProgress != null && (
              <p className="text-xs tabular-nums text-muted">
                {Math.round(weightGoalProgress)}% to goal
              </p>
            )}
          </div>
          <TrendLineChart data={weightData} unit="kg" goal={goals.bodyWeightKg} />
        </section>

        {/* Volume Chart */}
        <section className="mt-4 rounded-xl bg-surface px-2 pb-3 pt-4 shadow-card">
          <p className="px-3 text-xs font-medium uppercase tracking-widest text-subtle">
            Session volume
          </p>
          <TrendBarChart data={volData} />
        </section>

        {/* Lift Load Chart */}
        <section className="mt-4 rounded-xl bg-surface px-2 pb-3 pt-4 shadow-card">
          <div className="flex items-center justify-between gap-3 px-3">
            <p className="text-xs font-medium uppercase tracking-widest text-subtle">
              Lift load
            </p>
            {exercises.length > 0 && (
              <Select
                className="h-9 w-40 px-2 text-xs"
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
            <p className="px-3 pt-1 text-xs tabular-nums text-muted">
              {formatKg(lastLiftVal ?? 0)} kg now
              {liftGoal?.weightKg ? ` · goal ${formatKg(liftGoal.weightKg)} kg` : ""} ·{" "}
              {Math.round(liftGoalProgress)}%
            </p>
          ) : activeLift && liftGoal?.weightKg ? (
            <p className="px-3 pt-1 text-xs text-muted">
              Goal {formatKg(liftGoal.weightKg)} kg × {liftGoal.reps ?? "—"} reps
            </p>
          ) : null}

          <TrendLineChart data={liftData} unit="kg" goal={liftGoal?.weightKg} />
        </section>

        {/* Sessions History List */}
        {finishedSessions.length === 0 ? (
          <div className="mt-8 rounded-xl bg-surface px-5 py-8 text-center shadow-card">
            <p className="text-sm text-muted">No saved sessions yet.</p>
            <p className="mt-1 text-sm text-subtle">
              Finish a session to start the log.
            </p>
          </div>
        ) : (
          <ol className="mt-6 space-y-3">
            {finishedSessions.map((s) => (
              <HistorySessionItem
                key={s.id}
                session={s}
                program={programById(programs, s.dayId)}
              />
            ))}
          </ol>
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
    <li className="rounded-xl bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-fg">
            {program?.weekday ?? "Day"} · {formatDate(session.startedAt)}
          </p>
          <p className="mt-0.5 text-xs text-subtle">
            {session.finishedAt
              ? formatDuration(session.startedAt, session.finishedAt)
              : "Open"}{" "}
            · {Math.round(summary.volume).toLocaleString()} kg volume
          </p>
        </div>
        <span className={cn("font-display text-lg font-semibold tabular-nums", color)}>
          {summary.headline}
        </span>
      </div>

      <p className="mt-1 text-xs text-muted">{summary.detail}</p>

      <ul className="mt-3 space-y-2">
        {exercises.map((ex) => {
          const sets = session.logs[ex.id] ?? [];
          const prog = exerciseProgress(ex, sets);

          if (sets.length === 0) {
            return (
              <li key={ex.id} className="text-xs text-subtle">
                <span className="text-muted">{ex.name}</span> · skipped
              </li>
            );
          }

          return (
            <li key={ex.id}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-fg">{ex.name}</p>
                <p
                  className={cn(
                    "text-xs uppercase tracking-wider",
                    prog.minHit ? "text-hit" : "text-miss",
                  )}
                >
                  {prog.setsDone}/{ex.minSets}
                </p>
              </div>
              <p className="mt-0.5 text-xs tabular-nums text-muted">
                {sets.map((set, idx) => (
                  <span key={set.id}>
                    {idx > 0 ? " · " : ""}
                    <span
                      className={
                        setMeetsTarget(ex, set) ? "text-muted" : "text-short"
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
