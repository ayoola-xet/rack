import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  Check,
  ChevronRight,
  Flame,
  Link2,
  Minus,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Undo2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  AlarmSoundType,
  soundAlarm,
} from "@/lib/workout/audio-alarm";
import {
  defaultWeightKg,
  getExerciseSupersetId,
  getSupersetExercises,
  prescribedWeightLabel,
  programById,
  sessionExercises,
  WEIGHT_STEP,
} from "@/lib/workout/program";
import {
  countTotalSets,
  exerciseProgress,
  findExercisePR,
  formatClock,
  formatKg,
  formatSet,
  sessionVolume,
  setMeetsTarget,
} from "@/lib/workout/stats";
import {
  selectActiveSession,
  useWorkoutStore,
} from "@/lib/workout/store";
import type { ExerciseDef, LoggedSet, ProgramDay, Session } from "@/lib/workout/types";
import { AppShell } from "./shell";
import { ExercisePickerModal } from "./exercise-picker-modal";
import { PlateCalculatorModal } from "./plate-calculator-modal";
import { WorkoutFinishedModal } from "./workout-finished-modal";
import { SupersetModal } from "./superset-modal";

export function SessionScreen() {
  const navigate = useNavigate();
  const session = useWorkoutStore(selectActiveSession);
  const allSessions = useWorkoutStore((s) => s.sessions);
  const programs = useWorkoutStore((s) => s.programs);
  const lastWeightKg = useWorkoutStore((s) => s.lastWeightKg);
  const restUntil = useWorkoutStore((s) => s.restUntil);
  const timerTotalMs = useWorkoutStore((s) => s.timerTotalMs);
  const timerSettings = useWorkoutStore((s) => s.timerSettings);
  const logSet = useWorkoutStore((s) => s.logSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const deleteSet = useWorkoutStore((s) => s.deleteSet);
  const undoLastSet = useWorkoutStore((s) => s.undoLastSet);
  const startRest = useWorkoutStore((s) => s.startRest);
  const addRestTime = useWorkoutStore((s) => s.addRestTime);
  const skipRest = useWorkoutStore((s) => s.skipRest);
  const setActiveExercise = useWorkoutStore((s) => s.setActiveExercise);
  const finishSession = useWorkoutStore((s) => s.finishSession);
  const updateTimerSettings = useWorkoutStore((s) => s.updateTimerSettings);
  const addExerciseToActiveSession = useWorkoutStore((s) => s.addExerciseToActiveSession);
  const removeExerciseFromActiveSession = useWorkoutStore((s) => s.removeExerciseFromActiveSession);
  const linkSupersetInSession = useWorkoutStore((s) => s.linkSupersetInSession);
  const unlinkSupersetInSession = useWorkoutStore((s) => s.unlinkSupersetInSession);

  const [showSettings, setShowSettings] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [editingSet, setEditingSet] = useState<{ exerciseId: string; set: LoggedSet } | null>(null);

  // If no session running
  if (!session) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="font-display text-2xl font-bold text-fg">
            No active session
          </p>
          <p className="mt-1 text-xs text-muted">
            Start a workout from the home screen.
          </p>
          <Button asChild className="mt-4" size="md">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const exercises = sessionExercises(session, programs);

  // If session has no exercises yet (e.g. fresh Quick Start workout)
  if (exercises.length === 0) {
    return (
      <AppShell className="h-dvh overflow-hidden flex flex-col justify-between">
        <header className="flex items-center justify-between px-3 pt-2 pb-1.5 shrink-0 border-b border-border/40">
          <button
            type="button"
            onClick={() => void navigate({ to: "/" })}
            className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-fg"
          >
            <X className="size-4" />
          </button>
          <p className="font-display text-base font-bold text-fg">
            {session.title || "Quick Workout"}
          </p>
          <SessionElapsedTimer startedAt={session.startedAt} />
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-2 text-accent">
            <Plus className="size-6" />
          </div>
          <h2 className="mt-3 font-display text-xl font-bold text-fg">
            Add Your First Exercise
          </h2>
          <p className="mt-1 text-xs text-muted max-w-xs">
            Start logging your sets by adding an exercise from the library.
          </p>
          <Button
            className="mt-4"
            size="lg"
            onClick={() => setShowAddExercise(true)}
          >
            <Plus className="size-4" />
            Add Exercise
          </Button>
        </div>

        <ExercisePickerModal
          isOpen={showAddExercise}
          onClose={() => setShowAddExercise(false)}
          onSelect={(ex) => addExerciseToActiveSession(ex)}
        />
      </AppShell>
    );
  }

  const activeIdx = Math.max(
    0,
    exercises.findIndex((e) => e.id === session.activeExerciseId),
  );
  const activeExercise = exercises[activeIdx] ?? exercises[0];

  const loggedSets = session.logs[activeExercise.id] ?? [];
  const owed = exerciseProgress(activeExercise, loggedSets);
  const prevSession = findPreviousExerciseSession(session, activeExercise.id);
  const prevSets = prevSession?.logs[activeExercise.id] ?? [];
  const exercisePR = findExercisePR(allSessions, activeExercise.id);

  // Superset calculations
  const activeSupersetId = getExerciseSupersetId(activeExercise, session);
  const supersetExercises = activeSupersetId
    ? getSupersetExercises(exercises, activeSupersetId, session)
    : [];
  const activeSupersetIdx = supersetExercises.findIndex((e) => e.id === activeExercise.id);
  const isLastInSuperset =
    supersetExercises.length > 0 && activeSupersetIdx === supersetExercises.length - 1;
  const nextInSuperset =
    supersetExercises.length > 0
      ? isLastInSuperset
        ? supersetExercises[0]
        : supersetExercises[activeSupersetIdx + 1]
      : null;

  const handleNextExercise = () => {
    const nextEx = exercises[activeIdx + 1];
    if (nextEx) {
      setActiveExercise(nextEx.id);
    } else {
      setShowFinishedModal(true);
    }
  };

  const handlePause = () => {
    void navigate({ to: "/" });
  };

  const handleEnd = () => {
    setShowFinishedModal(true);
  };

  const handleConfirmFinish = () => {
    finishSession();
    setShowFinishedModal(false);
    void navigate({ to: "/progress" });
  };

  const isLastLift = activeIdx === exercises.length - 1;

  return (
    <AppShell className="h-dvh overflow-hidden flex flex-col justify-between">
      {/* Session Header */}
      <header className="flex items-center gap-2 px-3 pt-2 pb-1.5 shrink-0 border-b border-border/40">
        <button
          type="button"
          onClick={handlePause}
          aria-label="Pause session"
          className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-fg"
        >
          <X className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold tracking-tight text-fg leading-none">
            {activeExercise.name}
          </p>
          <p className="text-[10px] text-muted truncate mt-0.5">
            {activeExercise.group || "Lifts"} · {activeIdx + 1}/{exercises.length}
            {activeSupersetId && (
              <span className="ml-1 text-purple-400 font-semibold">
                · Superset {activeSupersetId} ({activeSupersetIdx + 1}/{supersetExercises.length})
              </span>
            )}
          </p>
        </div>

        {/* Live session elapsed duration */}
        <SessionElapsedTimer startedAt={session.startedAt} />

        {/* Timer/Alarm Settings button */}
        <button
          type="button"
          aria-label="Timer and Alarm settings"
          onClick={() => {
            soundAlarm.unlockAudio();
            setShowSettings(true);
          }}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg transition-colors",
            timerSettings.alarmSound
              ? "text-muted hover:bg-surface hover:text-fg"
              : "text-miss hover:bg-surface",
          )}
        >
          {timerSettings.alarmSound ? (
            <Bell className="size-3.5" />
          ) : (
            <BellOff className="size-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={handleEnd}
          className="h-8 rounded-lg bg-surface-2 px-2.5 text-xs font-semibold text-fg hover:bg-surface hover:text-fg shadow-xs"
        >
          Finish
        </button>
      </header>

      {/* Exercise Switcher Navigation Strip with Superset Grouping */}
      <div className="pt-1.5 pb-1 shrink-0 border-b border-border/30 bg-bg/50">
        <div className="flex items-center gap-1 overflow-x-auto px-3 scrollbar-none">
          {exercises.map((ex, idx) => {
            const isDone = (session.logs[ex.id]?.length ?? 0) >= ex.minSets;
            const hasLogs = (session.logs[ex.id]?.length ?? 0) > 0;
            const isActive = ex.id === activeExercise.id;
            const sId = getExerciseSupersetId(ex, session);
            const sGroup = sId ? getSupersetExercises(exercises, sId, session) : [];
            const sIdx = sGroup.findIndex((e) => e.id === ex.id);
            const label = sId ? `${sId}${sIdx + 1}` : `${idx + 1}`;

            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setActiveExercise(ex.id)}
                className={cn(
                  "flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-[11px] font-bold tabular-nums transition-colors",
                  isActive
                    ? sId
                      ? "bg-purple-600 text-white shadow-xs border border-purple-400"
                      : "bg-primary text-primary-fg shadow-xs"
                    : sId
                      ? isDone
                        ? "bg-purple-950/60 text-hit border border-purple-500/50"
                        : "bg-purple-950/40 text-purple-200 border border-purple-500/30"
                      : isDone
                        ? "bg-surface text-hit shadow-card"
                        : hasLogs
                          ? "bg-surface text-fg shadow-card"
                          : "bg-surface text-subtle shadow-card hover:text-muted",
                )}
              >
                <span>{label}.</span>
                <span className="max-w-[75px] truncate">{ex.name.split(" ")[0]}</span>
                {isDone && <Check className="size-3 shrink-0" />}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowAddExercise(true)}
            className="flex h-7 shrink-0 items-center gap-1 rounded-lg border border-dashed border-border px-2 text-[11px] font-medium text-muted hover:text-fg hover:border-fg"
          >
            <Plus className="size-3" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-3.5 pt-2 pb-2">
        {/* Exercise Header Banner */}
        <div className="rounded-xl bg-surface p-3 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  {activeExercise.group || "Lift"}
                </span>

                {/* Superset Badge / Action Button */}
                {activeSupersetId ? (
                  <button
                    type="button"
                    onClick={() => setShowSupersetModal(true)}
                    className="flex items-center gap-1 rounded-md bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 text-[10px] font-bold text-purple-300 hover:bg-purple-900/60 transition-colors"
                  >
                    <Zap className="size-3 text-purple-400 fill-current" />
                    <span>Superset {activeSupersetId} ({activeSupersetIdx + 1}/{supersetExercises.length})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSupersetModal(true)}
                    className="flex items-center gap-1 rounded-md bg-surface-2 border border-border/80 px-2 py-0.5 text-[10px] font-semibold text-muted hover:text-fg hover:bg-surface-2/80 transition-colors"
                  >
                    <Link2 className="size-3" />
                    <span>+ Superset</span>
                  </button>
                )}
              </div>

              <h1 className="mt-1.5 font-display text-xl font-bold text-fg leading-none">
                {activeExercise.name}
              </h1>
              <p className="mt-1 text-xs text-muted">
                Target: {activeExercise.minSets}–{activeExercise.maxSets} sets × {activeExercise.minReps}+ reps
                {prescribedWeightLabel(activeExercise) ? ` @ ${prescribedWeightLabel(activeExercise)}` : ""}
              </p>
            </div>

            {exercisePR > 0 && (
              <div className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-accent text-xs font-bold tabular-nums">
                <Flame className="size-3.5 text-accent" />
                <span>PR: {formatKg(exercisePR)} kg</span>
              </div>
            )}
          </div>

          {/* Last time summary */}
          {prevSets.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-border/40 text-[11px] text-subtle">
              <span className="font-semibold text-muted">Last workout: </span>
              {prevSets.map((s) => `${formatKg(s.weightKg)}kg×${s.reps}`).join("  ·  ")}
            </div>
          )}
        </div>

        {/* Strong/Hevy Style Interactive Set Table */}
        <div className="mt-2.5 rounded-xl bg-surface p-2.5 shadow-card">
          <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem_2rem] gap-1 px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-subtle border-b border-border/40">
            <span>Set</span>
            <span>Previous</span>
            <span className="text-center">kg</span>
            <span className="text-center">Reps</span>
            <span className="text-right">✓</span>
          </div>

          {loggedSets.length > 0 ? (
            <div className="divide-y divide-border/30">
              {loggedSets.map((set, idx) => {
                const prev = prevSets[idx];
                const meets = setMeetsTarget(activeExercise, set);

                return (
                  <div
                    key={set.id}
                    onClick={() => setEditingSet({ exerciseId: activeExercise.id, set })}
                    className="grid grid-cols-[2.5rem_1fr_4rem_4rem_2rem] gap-1 items-center px-2 py-2 text-xs transition-colors hover:bg-surface-2/60 cursor-pointer rounded-lg -mx-0.5"
                  >
                    <span className="font-bold text-subtle text-[11px]">
                      {idx + 1}
                    </span>

                    <span className="text-[11px] text-muted truncate">
                      {prev ? `${formatKg(prev.weightKg)}kg × ${prev.reps}` : "—"}
                    </span>

                    <span className="font-display font-bold text-center text-sm tabular-nums text-fg">
                      {formatKg(set.weightKg)}
                    </span>

                    <span className="font-display font-bold text-center text-sm tabular-nums text-fg">
                      {set.reps}
                    </span>

                    <div className="flex justify-end">
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full text-white",
                          meets ? "bg-hit" : "bg-short",
                        )}
                      >
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-subtle">
              No sets completed yet. Enter your weight and reps below.
            </div>
          )}
        </div>
      </div>

      {/* Set Logger & Rest Timer Footer */}
      <SessionFooter
        exercise={activeExercise}
        sets={loggedSets}
        prevSets={prevSets}
        lastWeight={lastWeightKg[activeExercise.id]}
        restUntil={restUntil}
        timerTotalMs={timerTotalMs}
        timerSettings={timerSettings}
        isLastLift={isLastLift}
        activeSupersetId={activeSupersetId}
        supersetExercises={supersetExercises}
        isLastInSuperset={isLastInSuperset}
        nextInSuperset={nextInSuperset}
        onLog={logSet}
        onSkipRest={skipRest}
        onAddRestTime={addRestTime}
        onStartRest={startRest}
        onNext={handleNextExercise}
        onSwitchExercise={setActiveExercise}
        onOpenPlateCalc={() => setShowPlateCalc(true)}
      />

      {/* Plate Calculator Modal */}
      <PlateCalculatorModal
        isOpen={showPlateCalc}
        initialWeightKg={lastWeightKg[activeExercise.id] || defaultWeightKg(activeExercise)}
        onClose={() => setShowPlateCalc(false)}
      />

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        isOpen={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onSelect={(ex) => addExerciseToActiveSession(ex)}
      />

      {/* Superset Link Modal */}
      <SupersetModal
        isOpen={showSupersetModal}
        currentExercise={activeExercise}
        allExercises={exercises}
        currentSupersetId={activeSupersetId}
        onClose={() => setShowSupersetModal(false)}
        onLink={(ids) => linkSupersetInSession(ids)}
        onUnlink={(id) => unlinkSupersetInSession(id)}
      />

      {/* Edit Set Modal */}
      {editingSet && (
        <EditSetModal
          isOpen={true}
          set={editingSet.set}
          onClose={() => setEditingSet(null)}
          onUpdate={(patch) => {
            updateSet(editingSet.exerciseId, editingSet.set.id, patch);
            setEditingSet(null);
          }}
          onDelete={() => {
            deleteSet(editingSet.exerciseId, editingSet.set.id);
            setEditingSet(null);
          }}
        />
      )}

      {/* Timer Settings Modal */}
      {showSettings && (
        <TimerSettingsModal
          settings={timerSettings}
          onUpdate={updateTimerSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Workout Complete Modal */}
      <WorkoutFinishedModal
        isOpen={showFinishedModal}
        session={session}
        programs={programs}
        onClose={handleConfirmFinish}
      />
    </AppShell>
  );
}

function findPreviousExerciseSession(currentSession: Session, exerciseId: string): Session | undefined {
  return useWorkoutStore
    .getState()
    .sessions.find(
      (s) =>
        s.id !== currentSession.id &&
        s.finishedAt !== null &&
        (s.logs[exerciseId]?.length ?? 0) > 0,
    );
}

function SessionElapsedTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedMs = Math.max(0, now - startedAt);

  return (
    <div className="flex items-center gap-1 rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted shadow-card">
      <span className="text-[10px]">⏱️</span>
      <span>{formatClock(elapsedMs)}</span>
    </div>
  );
}

function SessionFooter({
  exercise,
  sets,
  prevSets,
  lastWeight,
  restUntil,
  timerTotalMs,
  timerSettings,
  isLastLift,
  activeSupersetId,
  supersetExercises,
  isLastInSuperset,
  nextInSuperset,
  onLog,
  onSkipRest,
  onAddRestTime,
  onStartRest,
  onNext,
  onSwitchExercise,
  onOpenPlateCalc,
}: {
  exercise: ExerciseDef;
  sets: LoggedSet[];
  prevSets: LoggedSet[];
  lastWeight?: number;
  restUntil: number | null;
  timerTotalMs: number;
  timerSettings: typeof useWorkoutStore.getState.prototype.timerSettings;
  isLastLift: boolean;
  activeSupersetId: string | null;
  supersetExercises: ExerciseDef[];
  isLastInSuperset: boolean;
  nextInSuperset: ExerciseDef | null;
  onLog: (reps: number, weightKg: number) => void;
  onSkipRest: () => void;
  onAddRestTime: (ms: number) => void;
  onStartRest: (ms?: number) => void;
  onNext: () => void;
  onSwitchExercise: (id: string) => void;
  onOpenPlateCalc: () => void;
}) {
  const defaultWt = lastWeight ?? sets[sets.length - 1]?.weightKg ?? prevSets[sets.length]?.weightKg ?? defaultWeightKg(exercise);
  const defaultRp = sets[sets.length - 1]?.reps ?? prevSets[sets.length]?.reps ?? exercise.minReps;

  const [weightInput, setWeightInput] = useState<string>(String(defaultWt));
  const [repsInput, setRepsInput] = useState<string>(String(defaultRp));

  useEffect(() => {
    const nextDefaultWt = lastWeight ?? sets[sets.length - 1]?.weightKg ?? prevSets[sets.length]?.weightKg ?? defaultWeightKg(exercise);
    const nextDefaultRp = sets[sets.length - 1]?.reps ?? prevSets[sets.length]?.reps ?? exercise.minReps;
    setWeightInput(String(nextDefaultWt));
    setRepsInput(String(nextDefaultRp));
  }, [exercise.id, sets.length]);

  const stepWeight = (delta: number) => {
    const current = Number(weightInput) || 0;
    const next = Math.max(0, Math.round((current + delta) * 2) / 2);
    setWeightInput(String(next));
  };

  const stepReps = (delta: number) => {
    const current = Number(repsInput) || 0;
    const next = Math.max(0, current + delta);
    setRepsInput(String(next));
  };

  const isSuperset = !!activeSupersetId && supersetExercises.length > 1;

  const handleLogSet = () => {
    const wt = Number(weightInput);
    const rp = Number(repsInput);
    if (!Number.isFinite(wt) || !Number.isFinite(rp)) return;

    soundAlarm.unlockAudio();
    onLog(rp, wt);
    soundAlarm.vibrate(25);

    // Superset flow
    if (isSuperset && nextInSuperset) {
      if (!isLastInSuperset) {
        // Switch to next lift immediately in superset (no rest)
        onSkipRest();
        onSwitchExercise(nextInSuperset.id);
      } else {
        // Last lift in superset round: start full rest timer and switch to first lift
        onStartRest();
        onSwitchExercise(supersetExercises[0].id);
      }
    }
  };

  const nextLabel = isLastLift ? "Finish workout" : "Next lift";

  const buttonLabel = isSuperset
    ? !isLastInSuperset && nextInSuperset
      ? `Log & Next: ${nextInSuperset.name.split(" ")[0]} ➔`
      : `Log Round & Rest ⏱️`
    : `Log Set ${sets.length + 1}`;

  return (
    <footer className="shrink-0 border-t border-border bg-surface px-3.5 pt-2 pb-3 shadow-lg">
      {/* Rest Countdown Timer & Alarm Widget */}
      <RestTimerWidget
        until={restUntil}
        total={timerTotalMs}
        settings={timerSettings}
        exerciseName={exercise.name}
        onSkip={onSkipRest}
        onAdd={onAddRestTime}
        onStart={onStartRest}
      />

      {/* Dual Direct Input + Quick Pills */}
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {/* Weight Control */}
        <div className="rounded-xl bg-surface-2 p-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
              Weight (kg)
            </span>
            <button
              type="button"
              onClick={onOpenPlateCalc}
              title="Open Plate Calculator"
              className="text-[11px] font-bold text-accent hover:underline flex items-center gap-0.5"
            >
              <span>🏋️</span> Plates
            </button>
          </div>

          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => stepWeight(-2.5)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-fg font-bold hover:bg-surface/80 active:scale-95"
            >
              -
            </button>
            <Input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="h-8 text-center font-display text-lg font-bold p-0"
            />
            <button
              type="button"
              onClick={() => stepWeight(2.5)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-fg font-bold hover:bg-surface/80 active:scale-95"
            >
              +
            </button>
          </div>

          {/* Quick weight adjust pills */}
          <div className="mt-1.5 flex justify-center gap-1">
            {[-5, -2.5, +2.5, +5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => stepWeight(d)}
                className="rounded bg-surface/80 px-1.5 py-0.5 text-[9px] font-semibold text-muted hover:text-fg"
              >
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
        </div>

        {/* Reps Control */}
        <div className="rounded-xl bg-surface-2 p-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
              Reps
            </span>
            <span className="text-[10px] text-muted">
              Target {exercise.minReps}+
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => stepReps(-1)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-fg font-bold hover:bg-surface/80 active:scale-95"
            >
              -
            </button>
            <Input
              type="number"
              inputMode="numeric"
              step="1"
              value={repsInput}
              onChange={(e) => setRepsInput(e.target.value)}
              className="h-8 text-center font-display text-lg font-bold p-0"
            />
            <button
              type="button"
              onClick={() => stepReps(1)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-fg font-bold hover:bg-surface/80 active:scale-95"
            >
              +
            </button>
          </div>

          {/* Quick reps adjust pills */}
          <div className="mt-1.5 flex justify-center gap-1">
            {[-2, -1, +1, +2].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => stepReps(d)}
                className="rounded bg-surface/80 px-1.5 py-0.5 text-[9px] font-semibold text-muted hover:text-fg"
              >
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-2.5 flex items-center gap-2">
        <Button
          size="lg"
          className={cn(
            "flex-1 font-bold text-sm shadow-md",
            isSuperset && "bg-purple-600 hover:bg-purple-500 text-white",
          )}
          onClick={handleLogSet}
        >
          {isSuperset ? (
            <Zap className="size-4 fill-current text-purple-200" />
          ) : (
            <Check className="size-4" strokeWidth={2.5} />
          )}
          {buttonLabel}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="shrink-0 px-3 font-semibold text-xs text-muted hover:text-fg"
          onClick={onNext}
        >
          {nextLabel}
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </footer>
  );
}

function EditSetModal({
  isOpen,
  set,
  onClose,
  onUpdate,
  onDelete,
}: {
  isOpen: boolean;
  set: LoggedSet;
  onClose: () => void;
  onUpdate: (patch: { weightKg: number; reps: number }) => void;
  onDelete: () => void;
}) {
  const [wt, setWt] = useState(String(set.weightKg));
  const [rp, setRp] = useState(String(set.reps));

  if (!isOpen) return null;

  const handleSave = () => {
    const weightKg = Number(wt);
    const reps = Number(rp);
    if (Number.isFinite(weightKg) && Number.isFinite(reps)) {
      onUpdate({ weightKg, reps });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-border bg-surface p-4 shadow-2xl pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between border-b border-border/80 pb-2">
          <div className="flex items-center gap-1.5">
            <Pencil className="size-4 text-accent" />
            <h2 className="font-display text-base font-bold text-fg">
              Edit Completed Set
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
              Weight (kg)
            </label>
            <Input
              type="number"
              step="0.5"
              value={wt}
              onChange={(e) => setWt(e.target.value)}
              className="mt-1 text-center font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
              Reps
            </label>
            <Input
              type="number"
              step="1"
              value={rp}
              onChange={(e) => setRp(e.target.value)}
              className="mt-1 text-center font-bold"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button className="flex-1" size="md" onClick={handleSave}>
            Save Changes
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onDelete}
            className="px-3"
            title="Delete this set"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function RestTimerWidget({
  until,
  total,
  settings,
  exerciseName,
  onSkip,
  onAdd,
  onStart,
}: {
  until: number | null;
  total: number;
  settings: typeof useWorkoutStore.getState.prototype.timerSettings;
  exerciseName: string;
  onSkip: () => void;
  onAdd: (ms: number) => void;
  onStart: (ms?: number) => void;
}) {
  const [now, setNow] = useState(Date.now());
  const [alarmFired, setAlarmFired] = useState(false);
  const lastSecRef = useRef<number>(-1);

  const remainingMs = until ? Math.max(0, until - now) : 0;
  const isRunning = remainingMs > 0;

  useEffect(() => {
    if (!isRunning) {
      if (until && !alarmFired && now >= until) {
        setAlarmFired(true);
        if (settings.alarmSound) {
          soundAlarm.playAlarm(settings.alarmSoundType);
        }
        if (settings.alarmVibrate) {
          soundAlarm.vibrate([200, 100, 200, 100, 400]);
        }
        if (settings.alarmNotifications && "Notification" in window) {
          if (Notification.permission === "granted") {
            try {
              new Notification("Rest Time Finished!", {
                body: `Time for your next set of ${exerciseName}!`,
                icon: "/favicon.svg",
              });
            } catch (e) {
              console.warn(e);
            }
          }
        }
      }
      return;
    }

    setAlarmFired(false);
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);

      if (settings.countdownBeeps && until) {
        const remaining = Math.max(0, until - current);
        const sec = Math.ceil(remaining / 1000);
        if (sec <= 3 && sec > 0 && sec !== lastSecRef.current) {
          lastSecRef.current = sec;
          soundAlarm.playCountdownBeep(sec === 1);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, until, alarmFired, settings, exerciseName, now]);

  if (!isRunning && !until) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-surface-2/60 px-2.5 py-1 text-[11px] text-muted">
        <span>Rest timer: inactive</span>
        <button
          type="button"
          onClick={() => onStart()}
          className="font-semibold text-accent hover:underline"
        >
          Start {Math.round((settings.defaultRestMs || 90000) / 1000)}s rest
        </button>
      </div>
    );
  }

  const isFinished = remainingMs === 0 && until !== null;
  const pct = total > 0 ? Math.min(100, Math.max(0, (remainingMs / total) * 100)) : 0;

  return (
    <div
      className={cn(
        "rounded-xl border p-2 transition-all shadow-xs",
        isFinished
          ? "border-hit bg-hit/10 animate-pulse"
          : "border-accent/40 bg-surface-2",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">⏱️</span>
          <span className="text-xs font-semibold text-fg">
            {isFinished ? "Rest Complete! Ready for next set" : "Resting..."}
          </span>
          <span className="font-display text-sm font-bold tabular-nums text-accent">
            {formatClock(remainingMs)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAdd(30_000)}
            className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:text-fg shadow-xs"
          >
            +30s
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:text-fg shadow-xs"
          >
            Skip
          </button>
        </div>
      </div>

      {isRunning && (
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full bg-accent transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function TimerSettingsModal({
  settings,
  onUpdate,
  onClose,
}: {
  settings: typeof useWorkoutStore.getState.prototype.timerSettings;
  onUpdate: (patch: Partial<typeof settings>) => void;
  onClose: () => void;
}) {
  const [notifGranted, setNotifGranted] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission === "granted"
      : false,
  );

  const handleRequestNotif = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const res = await Notification.requestPermission();
      if (res === "granted") {
        setNotifGranted(true);
        onUpdate({ alarmNotifications: true });
      }
    }
  };

  const handleTestSound = (type: AlarmSoundType) => {
    soundAlarm.unlockAudio();
    soundAlarm.playAlarm(type);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-t-2xl border-t border-border bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-between pb-2.5 border-b border-border">
          <div className="flex items-center gap-1.5">
            <Settings className="size-4 text-accent" />
            <h2 className="text-sm font-bold text-fg">Timer & Alarm Settings</h2>
          </div>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {/* Sound Alarm Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-fg">Sound Alarm</p>
              <p className="text-[10px] text-muted">Play alarm when rest finishes</p>
            </div>
            <button
              type="button"
              onClick={() => onUpdate({ alarmSound: !settings.alarmSound })}
              className={cn(
                "h-6 w-11 rounded-full p-0.5 transition-colors",
                settings.alarmSound ? "bg-accent" : "bg-surface-2",
              )}
            >
              <div
                className={cn(
                  "size-5 rounded-full bg-bg transition-transform",
                  settings.alarmSound ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {/* Sound Type Selection */}
          {settings.alarmSound && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
                Alarm Sound Effect
              </p>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {(["chime", "bell", "beep", "gong"] as const).map(
                  (soundType) => (
                    <button
                      key={soundType}
                      type="button"
                      onClick={() => {
                        onUpdate({ alarmSoundType: soundType });
                        handleTestSound(soundType);
                      }}
                      className={cn(
                        "rounded-lg p-1.5 text-[11px] font-medium capitalize transition-colors",
                        settings.alarmSoundType === soundType
                          ? "bg-primary text-primary-fg"
                          : "bg-surface-2 text-muted hover:text-fg",
                      )}
                    >
                      {soundType.replace("_", " ")}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Countdown Beeps Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-fg">3-2-1 Countdown Beeps</p>
              <p className="text-[10px] text-muted">Audio beeps on final 3 seconds</p>
            </div>
            <button
              type="button"
              onClick={() => onUpdate({ countdownBeeps: !settings.countdownBeeps })}
              className={cn(
                "h-6 w-11 rounded-full p-0.5 transition-colors",
                settings.countdownBeeps ? "bg-accent" : "bg-surface-2",
              )}
            >
              <div
                className={cn(
                  "size-5 rounded-full bg-bg transition-transform",
                  settings.countdownBeeps ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {/* Vibration Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-fg">Vibration Alarm</p>
              <p className="text-[10px] text-muted">Vibrate device on timer completion</p>
            </div>
            <button
              type="button"
              onClick={() => onUpdate({ alarmVibrate: !settings.alarmVibrate })}
              className={cn(
                "h-6 w-11 rounded-full p-0.5 transition-colors",
                settings.alarmVibrate ? "bg-accent" : "bg-surface-2",
              )}
            >
              <div
                className={cn(
                  "size-5 rounded-full bg-bg transition-transform",
                  settings.alarmVibrate ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {/* Browser Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-fg">Background Notifications</p>
              <p className="text-[10px] text-muted">Notify even if browser is in background</p>
            </div>
            {notifGranted ? (
              <button
                type="button"
                onClick={() => onUpdate({ alarmNotifications: !settings.alarmNotifications })}
                className={cn(
                  "h-6 w-11 rounded-full p-0.5 transition-colors",
                  settings.alarmNotifications ? "bg-accent" : "bg-surface-2",
                )}
              >
                <div
                  className={cn(
                    "size-5 rounded-full bg-bg transition-transform",
                    settings.alarmNotifications ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            ) : (
              <Button size="sm" variant="secondary" onClick={handleRequestNotif}>
                Enable
              </Button>
            )}
          </div>

          {/* Default Rest Timer Duration */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
              Default Rest Duration
            </p>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {[
                { label: "45s", ms: 45_000 },
                { label: "60s", ms: 60_000 },
                { label: "90s", ms: 90_000 },
                { label: "2m", ms: 120_000 },
              ].map((item) => (
                <button
                  key={item.ms}
                  type="button"
                  onClick={() => onUpdate({ defaultRestMs: item.ms })}
                  className={cn(
                    "rounded-lg p-1.5 text-xs font-medium transition-colors",
                    settings.defaultRestMs === item.ms
                      ? "bg-primary text-primary-fg"
                      : "bg-surface-2 text-muted hover:text-fg",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button size="md" className="mt-4 w-full font-semibold" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
