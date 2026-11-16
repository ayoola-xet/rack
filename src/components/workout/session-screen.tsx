import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  Check,
  ChevronRight,
  Minus,
  Plus,
  Settings,
  Undo2,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlarmSoundType,
  soundAlarm,
} from "@/lib/workout/audio-alarm";
import {
  defaultWeightKg,
  prescribedWeightLabel,
  programById,
  WEIGHT_STEP,
} from "@/lib/workout/program";
import {
  exerciseProgress,
  formatClock,
  formatKg,
  formatSet,
  setMeetsTarget,
} from "@/lib/workout/stats";
import {
  selectActiveSession,
  useWorkoutStore,
} from "@/lib/workout/store";
import type { ExerciseDef, LoggedSet, ProgramDay, Session } from "@/lib/workout/types";
import { AppShell } from "./shell";

export function SessionScreen() {
  const navigate = useNavigate();
  const session = useWorkoutStore(selectActiveSession);
  const programs = useWorkoutStore((s) => s.programs);
  const lastWeightKg = useWorkoutStore((s) => s.lastWeightKg);
  const restUntil = useWorkoutStore((s) => s.restUntil);
  const timerTotalMs = useWorkoutStore((s) => s.timerTotalMs);
  const timerSettings = useWorkoutStore((s) => s.timerSettings);
  const logSet = useWorkoutStore((s) => s.logSet);
  const undoLastSet = useWorkoutStore((s) => s.undoLastSet);
  const startRest = useWorkoutStore((s) => s.startRest);
  const addRestTime = useWorkoutStore((s) => s.addRestTime);
  const skipRest = useWorkoutStore((s) => s.skipRest);
  const setActiveExercise = useWorkoutStore((s) => s.setActiveExercise);
  const finishSession = useWorkoutStore((s) => s.finishSession);
  const updateTimerSettings = useWorkoutStore((s) => s.updateTimerSettings);

  const [showSettings, setShowSettings] = useState(false);

  // If no session running
  if (!session) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="font-display text-xl font-bold text-fg">
            No session running
          </p>
          <p className="mt-1 text-xs text-muted">
            Start a day from the home screen.
          </p>
          <Button asChild className="mt-4" size="md">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const program = programById(programs, session.dayId);
  if (!program || program.exercises.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="font-display text-xl font-bold text-fg">
            This day has no lifts
          </p>
          <Button asChild className="mt-4" size="md">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const activeIdx = Math.max(
    0,
    program.exercises.findIndex((e) => e.id === session.activeExerciseId),
  );
  const activeExercise = program.exercises[activeIdx] ?? program.exercises[0];

  if (!activeExercise) {
    return <div className="min-h-dvh bg-bg" />;
  }

  const loggedSets = session.logs[activeExercise.id] ?? [];
  const owed = exerciseProgress(activeExercise, loggedSets);
  const prevSession = findPreviousExerciseSession(session, activeExercise.id);
  const prevSets = prevSession?.logs[activeExercise.id] ?? [];

  const handleNextExercise = () => {
    const nextEx = program.exercises[activeIdx + 1];
    if (nextEx) {
      setActiveExercise(nextEx.id);
    } else {
      finishSession();
      void navigate({ to: "/progress" });
    }
  };

  const handlePause = () => {
    void navigate({ to: "/" });
  };

  const handleEnd = () => {
    finishSession();
    void navigate({ to: "/progress" });
  };

  const isLastLift = activeIdx === program.exercises.length - 1;

  return (
    <AppShell className="h-dvh overflow-hidden flex flex-col justify-between">
      {/* Session Header - Compact */}
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
            {activeExercise.group || "Lifts"} · {activeIdx + 1}/{program.exercises.length}
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
          className="h-8 rounded-lg px-2 text-xs font-semibold text-muted hover:bg-surface hover:text-fg"
        >
          End
        </button>
      </header>

      {/* Exercise Switcher Navigation Tabs */}
      <div className="pt-1.5 shrink-0">
        <ExerciseSwitcher
          program={program}
          session={session}
          activeId={activeExercise.id}
          onSelect={setActiveExercise}
        />
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-2">
        <p className="text-xs text-muted leading-tight">{activeExercise.cue}</p>
        {prevSets.length > 0 ? (
          <p className="mt-0.5 text-[10px] text-subtle truncate">
            Last time: {prevSets.map(formatSet).join(" · ")}
          </p>
        ) : (
          <p className="mt-0.5 text-[10px] text-subtle">First time on this lift in log.</p>
        )}

        {/* Targets & Owed Status - Compact */}
        <OwedMetricsCard exercise={activeExercise} owed={owed} />

        {/* Logged Sets list */}
        {loggedSets.length > 0 ? (
          <ol className="mt-2.5 space-y-1.5 pb-1">
            {loggedSets.map((set, idx) => (
              <LoggedSetItem
                key={set.id}
                index={idx}
                set={set}
                exercise={activeExercise}
                canUndo={idx === loggedSets.length - 1}
                onUndo={undoLastSet}
              />
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-xs text-subtle text-center py-2">
            No sets logged yet.
          </p>
        )}
      </div>

      {/* Rest Timer, Alarm Alert, and Set Logger Footer - Compact */}
      <SessionFooter
        exercise={activeExercise}
        sets={loggedSets}
        owed={owed}
        lastWeight={lastWeightKg[activeExercise.id]}
        restUntil={restUntil}
        timerTotalMs={timerTotalMs}
        timerSettings={timerSettings}
        isLastLift={isLastLift}
        onLog={logSet}
        onSkipRest={skipRest}
        onAddRestTime={addRestTime}
        onStartRest={startRest}
        onNext={handleNextExercise}
      />

      {/* Timer and Alarms Settings Modal */}
      {showSettings && (
        <TimerSettingsModal
          settings={timerSettings}
          onUpdate={updateTimerSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </AppShell>
  );
}

function findPreviousExerciseSession(currentSession: Session, exerciseId: string): Session | undefined {
  return useWorkoutStore
    .getState()
    .sessions.find(
      (s) =>
        s.id !== currentSession.id &&
        s.dayId === currentSession.dayId &&
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

function ExerciseSwitcher({
  program,
  session,
  activeId,
  onSelect,
}: {
  program: ProgramDay;
  session: Session;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto px-4 pb-0.5 scrollbar-none">
      {program.exercises.map((ex, idx) => {
        const isFloorHit = (session.logs[ex.id]?.length ?? 0) >= ex.minSets;
        const isActive = ex.id === activeId;

        return (
          <button
            key={ex.id}
            type="button"
            aria-label={ex.name}
            aria-current={isActive}
            onClick={() => onSelect(ex.id)}
            className={cn(
              "flex h-7 min-w-7 flex-1 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums touch-manipulation transition-colors",
              isActive && "bg-primary text-primary-fg shadow-xs",
              !isActive && isFloorHit && "bg-surface text-hit shadow-card",
              !isActive && !isFloorHit && "bg-surface text-subtle shadow-card hover:text-muted",
            )}
          >
            {isFloorHit && !isActive ? (
              <Check className="size-3 text-hit" />
            ) : (
              idx + 1
            )}
          </button>
        );
      })}
    </div>
  );
}

function OwedMetricsCard({
  exercise,
  owed,
}: {
  exercise: ExerciseDef;
  owed: ReturnType<typeof exerciseProgress>;
}) {
  let owedTitle = "Owed";
  let owedMain = `${owed.setsOwed} set${owed.setsOwed === 1 ? "" : "s"}`;
  let owedSub = `${owed.repsOwed} reps to floor`;

  if (owed.maxed) {
    owedTitle = "Ceiling";
    owedMain = "All sets logged";
    owedSub = `${exercise.maxSets} / ${exercise.maxSets}`;
  } else if (owed.minHit) {
    owedTitle = "Floor hit";
    owedMain = `${owed.optionalLeft} bonus open`;
    owedSub = `Sets ${owed.setsDone} / ${exercise.maxSets}`;
  }

  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      <div className="rounded-lg bg-surface px-3 py-2 shadow-card">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
          {owedTitle}
        </p>
        <p className="mt-0.5 font-display text-xl font-bold tracking-tight text-fg leading-none">
          {owedMain}
        </p>
        <p className="mt-0.5 text-[10px] text-muted">{owedSub}</p>
      </div>

      <div className="rounded-lg bg-surface px-3 py-2 shadow-card">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
          Short
        </p>
        <p
          className={cn(
            "mt-0.5 font-display text-xl font-bold tracking-tight tabular-nums leading-none",
            owed.shortfallReps > 0 || owed.lightSets > 0 ? "text-short" : "text-fg",
          )}
        >
          {owed.shortfallReps} reps
        </p>
        <p className="mt-0.5 text-[10px] text-muted">
          {owed.lightSets > 0
            ? `${owed.lightSets} light set${owed.lightSets === 1 ? "" : "s"}`
            : "vs prescription"}
        </p>
      </div>
    </div>
  );
}

function LoggedSetItem({
  index,
  set,
  exercise,
  canUndo,
  onUndo,
}: {
  index: number;
  set: LoggedSet;
  exercise: ExerciseDef;
  canUndo: boolean;
  onUndo: () => void;
}) {
  const meets = setMeetsTarget(exercise, set);

  return (
    <li className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5 shadow-card">
      <span className="w-9 text-[10px] font-semibold uppercase tracking-wider text-subtle">
        Set {index + 1}
      </span>
      <span className="flex-1 font-display text-base font-bold tabular-nums text-fg">
        {formatKg(set.weightKg)}
        <span className="text-muted font-normal text-xs"> × </span>
        {set.reps}
      </span>
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
          meets ? "bg-hit/10 text-hit" : "bg-short/10 text-short",
        )}
      >
        {meets ? "Hit" : "Short"}
      </span>
      {canUndo ? (
        <button
          type="button"
          aria-label="Undo last set"
          onClick={onUndo}
          className="flex size-7 items-center justify-center rounded text-muted hover:text-fg hover:bg-surface-2"
        >
          <Undo2 className="size-3.5" />
        </button>
      ) : (
        <span className="size-7" />
      )}
    </li>
  );
}

function StepperControl({
  label,
  value,
  display,
  onDecrease,
  onIncrease,
  hint,
}: {
  label: string;
  value: string | number;
  display?: string;
  onDecrease: () => void;
  onIncrease: () => void;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={onDecrease}
        className="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-fg shadow-card touch-manipulation active:scale-[0.98]"
      >
        <Minus className="size-4" strokeWidth={2.5} />
      </button>

      <div className="flex flex-col items-center justify-center">
        <p className="font-display text-3xl font-bold leading-none tracking-tight tabular-nums text-fg">
          {display ?? value}
        </p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-subtle">
          {hint ?? label}
        </p>
      </div>

      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={onIncrease}
        className="flex size-10 items-center justify-center rounded-lg bg-surface-2 text-fg shadow-card touch-manipulation active:scale-[0.98]"
      >
        <Plus className="size-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function SessionFooter({
  exercise,
  sets,
  owed,
  lastWeight,
  restUntil,
  timerTotalMs,
  timerSettings,
  isLastLift,
  onLog,
  onSkipRest,
  onAddRestTime,
  onStartRest,
  onNext,
}: {
  exercise: ExerciseDef;
  sets: LoggedSet[];
  owed: ReturnType<typeof exerciseProgress>;
  lastWeight?: number;
  restUntil: number | null;
  timerTotalMs: number;
  timerSettings: typeof useWorkoutStore.getState.prototype.timerSettings;
  isLastLift: boolean;
  onLog: (reps: number, weightKg: number) => void;
  onSkipRest: () => void;
  onAddRestTime: (ms: number) => void;
  onStartRest: (ms?: number) => void;
  onNext: () => void;
}) {
  const [weight, setWeight] = useState<number>(() => defaultWeightKg(exercise, lastWeight));
  const [reps, setReps] = useState<number>(exercise.minReps);
  const lastSetId = sets[sets.length - 1]?.id ?? "";

  useEffect(() => {
    const prevWeight = lastWeight ?? sets[sets.length - 1]?.weightKg;
    setWeight(defaultWeightKg(exercise, prevWeight));
    setReps(sets[sets.length - 1]?.reps ?? exercise.minReps);
  }, [exercise, lastSetId, lastWeight]);

  const stepWeight = (delta: number) => {
    setWeight((curr) => Math.max(0, Math.round((curr + delta) * 2) / 2));
  };

  const handleLogSet = () => {
    soundAlarm.unlockAudio();
    onLog(reps, weight);
    soundAlarm.vibrate(25);
  };

  const nextLabel = isLastLift ? "Finish session" : "Next lift";

  return (
    <footer className="shrink-0 border-t border-border bg-bg px-4 pt-1.5 pb-3">
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

      {owed.maxed ? (
        <Button className="mt-1" size="lg" onClick={onNext}>
          {nextLabel}
        </Button>
      ) : (
        <>
          <div className="space-y-1">
            <StepperControl
              label="kg"
              value={formatKg(weight)}
              onDecrease={() => stepWeight(-WEIGHT_STEP)}
              onIncrease={() => stepWeight(WEIGHT_STEP)}
              hint={
                prescribedWeightLabel(exercise)
                  ? `kg · target ${prescribedWeightLabel(exercise)}`
                  : "kg"
              }
            />

            <StepperControl
              label="reps"
              value={String(reps)}
              onDecrease={() => setReps((r) => Math.max(0, r - 1))}
              onIncrease={() => setReps((r) => r + 1)}
              hint={`reps · floor ${exercise.minReps}`}
            />
          </div>

          <div className="mt-2.5 flex flex-col gap-1.5">
            <Button size="lg" className="w-full" onClick={handleLogSet}>
              Log set {sets.length + 1}
            </Button>
            {owed.minHit && (
              <Button variant="ghost" size="sm" className="h-8 w-full text-xs" onClick={onNext}>
                {nextLabel}
                <ChevronRight className="size-3.5" />
              </Button>
            )}
          </div>
        </>
      )}
    </footer>
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
          soundAlarm.vibrate([300, 150, 300, 150, 500]);
        }
        if (settings.alarmNotifications) {
          soundAlarm.sendNotification("Rest Completed! 🔔", {
            body: `Time for your next set on ${exerciseName}!`,
          });
        }
      }
      return;
    }

    setAlarmFired(false);
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);

      if (settings.countdownBeeps && until) {
        const remainingSeconds = Math.ceil((until - current) / 1000);
        if (remainingSeconds <= 3 && remainingSeconds >= 1 && remainingSeconds !== lastSecRef.current) {
          lastSecRef.current = remainingSeconds;
          soundAlarm.playTick();
          soundAlarm.vibrate(15);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, until, now, alarmFired, settings, exerciseName]);

  const progressFraction = useMemo(() => {
    if (!isRunning || total <= 0) return 0;
    return Math.min(1, Math.max(0, remainingMs / total));
  }, [isRunning, remainingMs, total]);

  if (alarmFired && until && now - until < 6000) {
    return (
      <div className="mb-1.5 flex items-center justify-between rounded-lg bg-surface-2 px-2.5 py-1.5 border border-hit/40 animate-pulse">
        <div className="flex items-center gap-1.5">
          <span className="flex size-2 rounded-full bg-hit" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-hit">
            Rest Done! Time to lift
          </p>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-semibold text-muted hover:text-fg"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="mb-1.5 rounded-lg bg-surface px-2.5 py-1.5 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="flex size-1.5 rounded-full bg-accent animate-ping" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
              Rest <span className="tabular-nums text-fg font-bold text-xs ml-1">{formatClock(remainingMs)}</span>
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onAdd(15_000)}
              className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:text-fg"
            >
              +15s
            </button>
            <button
              type="button"
              onClick={() => onAdd(30_000)}
              className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:text-fg"
            >
              +30s
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-subtle hover:text-fg"
            >
              Skip
            </button>
          </div>
        </div>

        <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200 ease-linear"
            style={{ width: `${Math.max(2, progressFraction * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-1 flex items-center justify-between rounded-lg bg-surface/40 px-2 py-1 text-[11px]">
      <span className="text-subtle font-semibold uppercase tracking-wider text-[10px]">
        Rest timer
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onStart(60_000)}
          className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted hover:text-fg"
        >
          1m
        </button>
        <button
          type="button"
          onClick={() => onStart(90_000)}
          className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted hover:text-fg"
        >
          90s
        </button>
        <button
          type="button"
          onClick={() => onStart(120_000)}
          className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted hover:text-fg"
        >
          2m
        </button>
        <button
          type="button"
          onClick={() => onStart(180_000)}
          className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted hover:text-fg"
        >
          3m
        </button>
      </div>
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
    typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted",
  );

  const testAlarm = (type: AlarmSoundType) => {
    soundAlarm.unlockAudio();
    soundAlarm.playAlarm(type);
    soundAlarm.vibrate([200, 100, 200]);
  };

  const handleRequestNotif = async () => {
    const granted = await soundAlarm.requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      onUpdate({ alarmNotifications: true });
    }
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
                Alarm Sound
              </p>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                {(["chime", "bell", "beep", "gong"] as AlarmSoundType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      onUpdate({ alarmSoundType: type });
                      testAlarm(type);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg p-1.5 text-[11px] font-medium capitalize transition-colors",
                      settings.alarmSoundType === type
                        ? "bg-primary text-primary-fg"
                        : "bg-surface-2 text-muted hover:text-fg",
                    )}
                  >
                    <span>{type}</span>
                    <Volume2 className="mt-0.5 size-3 opacity-70" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Countdown Beeps */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-fg">3-2-1 Countdown Beeps</p>
              <p className="text-[10px] text-muted">Audio tick warning before timer ends</p>
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

        <Button size="md" className="mt-4 w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
