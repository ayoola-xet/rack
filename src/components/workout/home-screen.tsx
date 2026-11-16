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
      <header className="flex items-center justify-between px-4 pt-2.5 pb-1">
        <AppHeaderTitle />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Training log
        </span>
      </header>

      <main className="flex flex-1 flex-col px-4 pb-4">
        {/* Compact Body weight card */}
        <section className="mt-2 rounded-xl bg-surface p-3 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
                Body weight
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold tabular-nums text-fg leading-none">
                {latestWeight ? `${formatKg(latestWeight.kg)} kg` : "—"}
              </p>
              <p className="mt-1 text-[11px] text-muted">
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
              <span className="font-display text-lg font-bold tabular-nums text-accent">
                {Math.round(weightProgressPct)}%
              </span>
            )}
          </div>
          <div className="mt-2 flex gap-1.5">
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
              size="sm"
              onClick={handleLogWeight}
              disabled={!hydrated || !weightInput}
            >
              Log
            </Button>
          </div>
        </section>

        {goals.note && (
          <p className="mt-2 text-xs text-muted truncate">
            <span className="text-subtle font-medium">Chase · </span>
            {goals.note}
          </p>
        )}

        {/* Compact Weekday Selector */}
        {ordered.length > 1 && (
          <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {ordered.map((day) => {
              const isActive = (activeProgram?.id ?? "") === day.id;
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDayId(day.id)}
                  className={cn(
                    "h-8 shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors",
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

        {/* Selected Program Header - Compact */}
        {activeProgram ? (
          <div className="mt-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
                {activeProgram.exercises.length} lift
                {activeProgram.exercises.length === 1 ? "" : "s"}
              </span>
              <span className="text-xs text-muted font-medium">
                {activeProgram.split || "Split"}
              </span>
            </div>
            <h1 className="mt-0.5 font-display text-3xl font-bold leading-none tracking-tight text-fg">
              {activeProgram.weekday}
            </h1>
            {activeProgram.blurb && (
              <p className="mt-1 text-xs text-subtle line-clamp-2">
                {activeProgram.blurb}
              </p>
            )}
          </div>
        ) : (
          <h1 className="mt-3 font-display text-2xl font-bold text-fg">
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
            className="mt-3"
            size="lg"
            onClick={handleStart}
            disabled={!hydrated}
          >
            Start {activeProgram.weekday}
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            className="mt-3"
            size="lg"
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
          <section className="mt-3.5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle">
                At a glance
              </h2>
              <Link
                to="/progress"
                className="text-xs font-medium text-muted hover:text-fg"
              >
                Charts
              </Link>
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
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
                    className="rounded-lg bg-surface px-1.5 py-2 text-center shadow-card"
                  >
                    <p className="text-[10px] text-subtle">
                      {formatDate(session.startedAt)}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 font-display text-base font-bold tabular-nums",
                        color,
                      )}
                    >
                      {summary.liftsHit}/{summary.liftsTotal}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-muted">
                      {summary.status}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Lifts list - Compact */}
        {activeProgram && activeProgram.exercises.length > 0 && (
          <section className="mt-3.5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle">
                Lifts
              </h2>
              <Link
                to="/programs/$dayId"
                params={{ dayId: activeProgram.id }}
                className="text-xs font-medium text-muted hover:text-fg"
              >
                Edit
              </Link>
            </div>
            <ol className="mt-1.5 divide-y divide-border rounded-xl bg-surface shadow-card">
              {activeProgram.exercises.map((ex, idx) => (
                <li
                  key={ex.id}
                  className="flex items-center gap-2.5 px-3 py-2.5"
                >
                  <span className="w-4 font-display text-xs tabular-nums text-subtle font-semibold">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-fg truncate">
                      {ex.name || "Untitled lift"}
                    </p>
                    <p className="text-[11px] text-muted truncate">
                      {ex.group || "Lift"} · {ex.cue}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-subtle font-medium">
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
          className="mt-3 flex h-8 items-center justify-center gap-1.5 text-xs font-medium text-muted hover:text-fg"
        >
          <Plus className="size-3.5" />
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
    <section className="mt-3 rounded-xl bg-surface p-3 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-short">
          In progress
        </span>
        <span className="text-xs text-muted">
          {formatTime(session.startedAt)}
        </span>
      </div>
      <p className="mt-1 font-display text-xl font-bold tracking-tight text-fg">
        {program?.weekday ?? "Session"} · {summary.liftsHit}/{totalLifts} lifts at floor
      </p>
      <div className="mt-2.5 flex gap-2">
        <Button size="sm" className="flex-1" onClick={onResume}>
          Resume
        </Button>
        <Button size="sm" className="flex-1" variant="secondary" onClick={onFinish}>
          Save & end
        </Button>
      </div>

      {confirmDrop ? (
        <div className="mt-2 rounded-lg bg-surface-2 p-2">
          <p className="text-xs text-muted">
            Drop this session? Logged sets will be deleted.
          </p>
          <div className="mt-1.5 flex gap-2">
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
          className="mt-2 h-7 w-full text-xs text-subtle hover:text-miss"
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
    <section className="mt-3 rounded-xl bg-surface p-3 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
            Last session
          </p>
          <p className="text-xs text-muted mt-0.5">
            {program?.weekday ?? "Day"} · {formatDate(session.startedAt)}
            {session.finishedAt ? ` · ${formatTime(session.finishedAt)}` : ""}
          </p>
        </div>
        <span className={cn("font-display text-lg font-bold tabular-nums", color)}>
          {summary.headline}
        </span>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
        {summary.status === "hit" && <Check className="size-3 text-hit" />}
        {summary.detail}
      </p>
    </section>
  );
}
