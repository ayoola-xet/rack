import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatKg,
  formatTime,
  goalProgress,
  latestBodyWeight,
  sessionSummary,
} from "@/lib/workout/stats";
import {
  selectActiveSession,
  useWorkoutStore,
} from "@/lib/workout/store";
import {
  orderedPrograms,
  prescribedWeightLabel,
  programById,
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
  const finishSession = useWorkoutStore((s) => s.finishSession);
  const discardSession = useWorkoutStore((s) => s.discardSession);
  const bodyWeight = useWorkoutStore((s) => s.bodyWeight);
  const goals = useWorkoutStore((s) => s.goals);
  const logBodyWeight = useWorkoutStore((s) => s.logBodyWeight);
  const createDay = useWorkoutStore((s) => s.createDay);

  const ordered = useMemo(() => orderedPrograms(programs), [programs]);
  const [selectedDayId, setSelectedDayId] = useState<string>(ordered[0]?.id ?? "");
  const activeProgram = programById(ordered, selectedDayId) ?? ordered[0] ?? null;
  const latestWeight = latestBodyWeight(bodyWeight);
  const [weightInput, setWeightInput] = useState<string>("");

  useEffect(() => {
    if (!programById(ordered, selectedDayId) && ordered[0]) {
      setSelectedDayId(ordered[0].id);
    }
  }, [ordered, selectedDayId]);

  const finished = useMemo(() => sessions.filter((s) => s.finishedAt !== null), [sessions]);
  const lastFinished = finished[0] ?? null;
  const recentSessions = finished.slice(0, 4);

  const handleStart = () => {
    if (!activeProgram) return;
    startDay(activeProgram.id);
    void navigate({ to: "/session" });
  };

  const handleCreateDay = () => {
    const newId = createDay();
    void navigate({ to: "/programs/$dayId", params: { dayId: newId } });
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
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <AppHeaderTitle />
        <span className="text-xs font-medium uppercase tracking-widest text-subtle">
          Training log
        </span>
      </header>

      <main className="flex flex-1 flex-col px-5 pb-8">
        {/* Body weight card */}
        <section className="mt-5 rounded-xl bg-surface p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-subtle">
                Body weight
              </p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-fg">
                {latestWeight ? `${formatKg(latestWeight.kg)} kg` : "—"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {goalWeight == null
                  ? "Set a goal in Goals"
                  : `Goal ${formatKg(goalWeight)} kg${
                      latestWeight
                        ? ` · ${formatKg(Math.abs(latestWeight.kg - goalWeight))} kg ${
                            latestWeight.kg > goalWeight
                              ? "to lose"
                              : latestWeight.kg < goalWeight
                                ? "to gain"
                                : "hit"
                          }`
                        : ""
                    }`}
              </p>
            </div>
            {weightProgressPct != null && (
              <p className="font-display text-xl font-semibold tabular-nums text-accent">
                {Math.round(weightProgressPct)}%
              </p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="1"
              placeholder={latestWeight ? String(latestWeight.kg) : "kg"}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              aria-label="Log body weight"
            />
            <Button
              type="button"
              onClick={handleLogWeight}
              disabled={!hydrated || !weightInput}
            >
              Log
            </Button>
          </div>
        </section>

        {goals.note && (
          <p className="mt-4 text-sm text-muted">
            <span className="text-subtle">Chase · </span>
            {goals.note}
          </p>
        )}

        {/* Weekday Selector */}
        {ordered.length > 1 && (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {ordered.map((day) => {
              const isActive = (activeProgram?.id ?? "") === day.id;
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDayId(day.id)}
                  className={cn(
                    "h-11 shrink-0 rounded-md px-4 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-fg"
                      : "bg-surface text-muted shadow-card hover:text-fg",
                  )}
                >
                  {day.weekday.slice(0, 3)}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Program Header */}
        {activeProgram ? (
          <>
            <p className="mt-6 text-xs font-medium uppercase tracking-widest text-subtle">
              {activeProgram.exercises.length} lift
              {activeProgram.exercises.length === 1 ? "" : "s"}
            </p>
            <h1 className="mt-2 font-display text-5xl font-semibold leading-none tracking-tight text-fg">
              {activeProgram.weekday}
            </h1>
            <p className="mt-3 text-lg text-muted">
              {activeProgram.split || "Add a split name"}
            </p>
            {activeProgram.blurb && (
              <p className="mt-2 text-sm text-subtle">{activeProgram.blurb}</p>
            )}
          </>
        ) : (
          <h1 className="mt-6 font-display text-4xl font-semibold text-fg">
            Add a training day
          </h1>
        )}

        {/* In-progress banner or Start Day Button */}
        {activeSession ? (
          <ActiveSessionBanner
            session={activeSession}
            program={programById(programs, activeSession.dayId)}
            onResume={() => void navigate({ to: "/session" })}
            onFinish={finishSession}
            onDiscard={discardSession}
          />
        ) : activeProgram && activeProgram.exercises.length > 0 ? (
          <Button
            className="mt-8"
            size="xl"
            onClick={handleStart}
            disabled={!hydrated}
          >
            Start {activeProgram.weekday}
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            className="mt-8"
            size="xl"
            variant="secondary"
            onClick={() => {
              if (activeProgram) {
                void navigate({
                  to: "/programs/$dayId",
                  params: { dayId: activeProgram.id },
                });
              } else {
                handleCreateDay();
              }
            }}
          >
            {activeProgram ? "Add lifts" : "New day"}
            <Plus className="size-4" />
          </Button>
        )}

        {/* Last session summary */}
        {lastFinished && !activeSession && (
          <LastSessionCard
            session={lastFinished}
            program={programById(programs, lastFinished.dayId)}
          />
        )}

        {/* At a glance (recent 4 sessions) */}
        {recentSessions.length > 0 && (
          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium text-fg">At a glance</h2>
              <Link
                to="/progress"
                className="text-xs font-medium text-muted hover:text-fg"
              >
                Charts
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {recentSessions.map((session) => {
                const summary = sessionSummary(
                  session,
                  programById(programs, session.dayId),
                );
                const color =
                  summary.status === "hit"
                    ? "text-hit"
                    : summary.status === "lapse"
                      ? "text-miss"
                      : "text-short";
                return (
                  <div
                    key={session.id}
                    className="rounded-lg bg-surface px-2 py-3 text-center shadow-card"
                  >
                    <p className="text-xs text-subtle">
                      {formatDate(session.startedAt)}
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-display text-lg font-semibold tabular-nums",
                        color,
                      )}
                    >
                      {summary.liftsHit}/{summary.liftsTotal}
                    </p>
                    <p className="mt-0.5 text-xs uppercase tracking-wider text-muted">
                      {summary.status}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Lifts list */}
        {activeProgram && activeProgram.exercises.length > 0 && (
          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium text-fg">Lifts</h2>
              <Link
                to="/programs/$dayId"
                params={{ dayId: activeProgram.id }}
                className="text-xs font-medium text-muted hover:text-fg"
              >
                Edit
              </Link>
            </div>
            <ol className="mt-3 divide-y divide-border rounded-xl bg-surface shadow-card">
              {activeProgram.exercises.map((ex, idx) => (
                <li
                  key={ex.id}
                  className="flex items-start gap-3 px-4 py-3.5"
                >
                  <span className="mt-0.5 w-5 font-display text-sm tabular-nums text-subtle">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">
                      {ex.name || "Untitled lift"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {ex.group || "Ungrouped"} · {ex.cue}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-subtle">
                    {prescribedWeightLabel(ex) ?? "log kg"}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <button
          type="button"
          onClick={handleCreateDay}
          className="mt-6 flex h-11 items-center justify-center gap-2 text-sm font-medium text-muted hover:text-fg"
        >
          <Plus className="size-4" />
          Add a training day
        </button>
      </main>
    </AppShell>
  );
}

function ActiveSessionBanner({
  session,
  program,
  onResume,
  onFinish,
  onDiscard,
}: {
  session: Session;
  program?: ProgramDay;
  onResume: () => void;
  onFinish: () => void;
  onDiscard: () => void;
}) {
  const [confirmDrop, setConfirmDrop] = useState(false);
  const summary = sessionSummary(session, program);
  const totalLifts = program?.exercises.length ?? 0;

  return (
    <section className="mt-8 rounded-xl bg-surface p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-widest text-short">
        In progress
      </p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-fg">
        {program?.weekday ?? "Session"} · {summary.liftsHit}/{totalLifts} lifts at floor
      </p>
      <p className="mt-1 text-sm text-muted">
        Started {formatTime(session.startedAt)} · {formatDate(session.startedAt)}
      </p>
      <div className="mt-4 flex gap-2">
        <Button className="flex-1" onClick={onResume}>
          Resume
        </Button>
        <Button className="flex-1" variant="secondary" onClick={onFinish}>
          Save & end
        </Button>
      </div>

      {confirmDrop ? (
        <div className="mt-3 rounded-md bg-surface-2 px-3 py-3">
          <p className="text-sm text-muted">
            Drop this session? Logged sets will be gone.
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="danger" onClick={onDiscard}>
              Drop
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDrop(false)}>
              Keep
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="mt-3 h-11 w-full text-sm text-subtle hover:text-muted"
          onClick={() => setConfirmDrop(true)}
        >
          Drop session
        </button>
      )}
    </section>
  );
}

function LastSessionCard({
  session,
  program,
}: {
  session: Session;
  program?: ProgramDay;
}) {
  const summary = sessionSummary(session, program);
  const color = summary.status === "hit" ? "text-hit" : "text-miss";

  return (
    <section className="mt-6 rounded-xl bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-subtle">
            Last session
          </p>
          <p className="mt-1 text-sm text-muted">
            {program?.weekday ?? "Day"} · {formatDate(session.startedAt)}
            {session.finishedAt ? ` · ${formatTime(session.finishedAt)}` : ""}
          </p>
        </div>
        <span className={cn("font-display text-xl font-semibold tabular-nums", color)}>
          {summary.headline}
        </span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
        {summary.status === "hit" && <Check className="size-3.5 text-hit" />}
        {summary.detail}
      </p>
    </section>
  );
}
