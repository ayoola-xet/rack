import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ensureTuesday,
  getNextSupersetLabel,
  newExercise,
  nextWeekday,
  programById,
  REST_MS,
  seedPrograms,
  sessionExercises,
  SPLIT_TEMPLATES,
  suggestedSplit,
  withCue,
} from "./program";
import type {
  BodyWeightLog,
  ExerciseDef,
  Goals,
  LiftGoal,
  LoggedSet,
  ProgramDay,
  Session,
} from "./types";
import type { AlarmSoundType } from "./audio-alarm";

export type Toast = {
  id: string;
  message: string;
  tone?: "info" | "danger";
  canUndo?: boolean;
};

type UndoEntry =
  | { kind: "set"; sessionId: string; exerciseId: string; set: LoggedSet; index: number }
  | { kind: "session"; session: Session }
  | { kind: "finish"; sessionId: string };

export type TimerSettings = {
  alarmSound: boolean;
  alarmSoundType: AlarmSoundType;
  alarmVibrate: boolean;
  alarmNotifications: boolean;
  countdownBeeps: boolean;
  defaultRestMs: number;
  autoStartRest: boolean;
  plateBarbellKg: number;
  weightUnit: "kg" | "lbs";
};

export type WorkoutExportData = {
  version: number;
  app: string;
  exportedAt: string;
  programs: ProgramDay[];
  sessions: Session[];
  bodyWeight: BodyWeightLog[];
  goals: Goals;
  timerSettings: TimerSettings;
  lastWeightKg: Record<string, number>;
};

export type WorkoutState = {
  hydrated: boolean;
  programs: ProgramDay[];
  sessions: Session[];
  activeSessionId: string | null;
  restUntil: number | null;
  timerTotalMs: number;
  lastWeightKg: Record<string, number>;
  bodyWeight: BodyWeightLog[];
  goals: Goals;
  timerSettings: TimerSettings;
  toasts: Toast[];
  lastUndo: UndoEntry | null;

  pushToast: (message: string, opts?: { tone?: "info" | "danger"; canUndo?: boolean }) => void;
  dismissToast: (id: string) => void;
  restoreLastUndo: () => void;

  startDay: (dayId: string) => void;
  startQuickSession: (title?: string) => void;
  addExerciseToActiveSession: (exercise: ExerciseDef) => void;
  removeExerciseFromActiveSession: (exerciseId: string) => void;
  setActiveExercise: (exerciseId: string) => void;
  logSet: (reps: number, weightKg: number) => void;
  updateSet: (exerciseId: string, setId: string, patch: Partial<LoggedSet>) => void;
  deleteSet: (exerciseId: string, setId: string) => void;
  undoLastSet: () => void;
  linkSupersetInSession: (exerciseIds: string[], supersetLabel?: string) => void;
  unlinkSupersetInSession: (exerciseId: string) => void;
  linkProgramSuperset: (dayId: string, exerciseIds: string[], supersetLabel?: string) => void;
  unlinkProgramSuperset: (dayId: string, exerciseId: string) => void;
  loadSplitTemplate: (templateKey: "ppl" | "upper_lower" | "full_body") => void;
  startRest: (durationMs?: number) => void;
  addRestTime: (ms: number) => void;
  setRestTimer: (ms: number) => void;
  skipRest: () => void;
  finishSession: () => void;
  discardSession: () => void;
  removeSession: (sessionId: string) => void;
  createDay: () => string;
  updateDay: (dayId: string, patch: Partial<ProgramDay>) => void;
  deleteDay: (dayId: string) => void;
  addExercise: (dayId: string, exercise?: ExerciseDef) => void;
  updateExercise: (dayId: string, exerciseId: string, patch: Partial<ExerciseDef>) => void;
  removeExercise: (dayId: string, exerciseId: string) => void;
  moveExercise: (dayId: string, exerciseId: string, delta: number) => void;
  logBodyWeight: (kg: number) => void;
  removeBodyWeight: (id: string) => void;
  setGoalNote: (note: string) => void;
  setBodyWeightGoal: (kg: number | null) => void;
  upsertLiftGoal: (goal: LiftGoal) => void;
  removeLiftGoal: (exerciseId: string) => void;
  updateTimerSettings: (patch: Partial<TimerSettings>) => void;
  resetAllData: () => void;
  exportData: () => WorkoutExportData;
  importData: (
    jsonString: string,
    mode?: "replace" | "merge",
  ) => {
    success: boolean;
    message?: string;
    error?: string;
    sessionsCount?: number;
    programsCount?: number;
  };
};

const defaultGoals = (): Goals => ({
  note: "",
  bodyWeightKg: null,
  lifts: [],
});

const defaultTimerSettings = (): TimerSettings => ({
  alarmSound: true,
  alarmSoundType: "chime",
  alarmVibrate: true,
  alarmNotifications: false,
  countdownBeeps: true,
  defaultRestMs: REST_MS,
  autoStartRest: true,
  plateBarbellKg: 20,
  weightUnit: "kg",
});

export function selectActiveSession(state: {
  sessions: Session[];
  activeSessionId: string | null;
}): Session | null {
  return state.sessions.find((s) => s.id === state.activeSessionId) ?? null;
}

function updateSessionInList(
  sessions: Session[],
  sessionId: string,
  fn: (s: Session) => Session,
): Session[] {
  return sessions.map((s) => (s.id === sessionId ? fn(s) : s));
}

function initLogsForProgram(program: ProgramDay): Record<string, LoggedSet[]> {
  const logs: Record<string, LoggedSet[]> = {};
  for (const ex of program.exercises) {
    logs[ex.id] = [];
  }
  return logs;
}

function countTotalSets(session: Session): number {
  let count = 0;
  for (const sets of Object.values(session.logs)) {
    count += sets.length;
  }
  return count;
}

function updateProgramInList(
  programs: ProgramDay[],
  dayId: string,
  fn: (p: ProgramDay) => ProgramDay,
): ProgramDay[] {
  return programs.map((p) => (p.id === dayId ? fn(p) : p));
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      programs: seedPrograms(),
      sessions: [],
      activeSessionId: null,
      restUntil: null,
      timerTotalMs: REST_MS,
      lastWeightKg: {},
      bodyWeight: [],
      goals: defaultGoals(),
      timerSettings: defaultTimerSettings(),
      toasts: [],
      lastUndo: null,

      pushToast: (message, opts = {}) => {
        set((state) => ({
          toasts: [
            ...state.toasts,
            { id: crypto.randomUUID(), message, tone: opts.tone, canUndo: opts.canUndo },
          ],
        }));
      },

      dismissToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      },

      restoreLastUndo: () => {
        const undo = get().lastUndo;
        if (!undo) return;
        set((state) => {
          if (undo.kind === "set") {
            return {
              lastUndo: null,
              sessions: updateSessionInList(state.sessions, undo.sessionId, (s) => {
                const sets = s.logs[undo.exerciseId] ?? [];
                const next = [...sets];
                next.splice(Math.min(undo.index, next.length), 0, undo.set);
                return { ...s, logs: { ...s.logs, [undo.exerciseId]: next } };
              }),
            };
          }
          if (undo.kind === "finish") {
            // Re-open a just-finished session so the workout can continue.
            return {
              lastUndo: null,
              activeSessionId: undo.sessionId,
              sessions: updateSessionInList(state.sessions, undo.sessionId, (s) => ({
                ...s,
                finishedAt: null,
              })),
            };
          }
          return { lastUndo: null, sessions: [undo.session, ...state.sessions] };
        });
      },

      startDay: (dayId: string) => {
        if (selectActiveSession(get())) return;
        const program = programById(get().programs, dayId);
        if (!program) return;

        const session: Session = {
          id: crypto.randomUUID(),
          dayId,
          startedAt: Date.now(),
          finishedAt: null,
          activeExerciseId: program.exercises[0]?.id ?? "",
          logs: initLogsForProgram(program),
          customExercises: [],
          title: `${program.weekday} · ${program.split || "Workout"}`,
        };

        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: session.id,
          restUntil: null,
        }));
      },

      startQuickSession: (title?: string) => {
        if (selectActiveSession(get())) return;
        const session: Session = {
          id: crypto.randomUUID(),
          dayId: "quick",
          startedAt: Date.now(),
          finishedAt: null,
          activeExerciseId: "",
          logs: {},
          customExercises: [],
          title: title || "Quick Workout",
        };

        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: session.id,
          restUntil: null,
        }));
      },

      addExerciseToActiveSession: (exercise: ExerciseDef) => {
        const session = selectActiveSession(get());
        if (!session) return;

        const allCurrent = sessionExercises(session, get().programs);
        if (allCurrent.some((e) => e.id === exercise.id)) return;

        set((state) => ({
          sessions: updateSessionInList(state.sessions, session.id, (s) => ({
            ...s,
            customExercises: [...(s.customExercises ?? []), exercise],
            activeExerciseId: s.activeExerciseId || exercise.id,
            logs: {
              ...s.logs,
              [exercise.id]: s.logs[exercise.id] ?? [],
            },
          })),
        }));
      },

      removeExerciseFromActiveSession: (exerciseId: string) => {
        const session = selectActiveSession(get());
        if (!session) return;

        set((state) => {
          const updated = updateSessionInList(state.sessions, session.id, (s) => {
            const nextCustom = (s.customExercises ?? []).filter((e) => e.id !== exerciseId);
            const remaining = sessionExercises(s, state.programs).filter((e) => e.id !== exerciseId);
            const nextActive = s.activeExerciseId === exerciseId ? (remaining[0]?.id ?? "") : s.activeExerciseId;
            return {
              ...s,
              customExercises: nextCustom,
              activeExerciseId: nextActive,
            };
          });
          return { sessions: updated };
        });
      },

      setActiveExercise: (exerciseId: string) => {
        if (!selectActiveSession(get())) return;
        set((state) => ({
          sessions: state.activeSessionId
            ? updateSessionInList(state.sessions, state.activeSessionId, (s) => ({
                ...s,
                activeExerciseId: exerciseId,
              }))
            : state.sessions,
        }));
      },

      logSet: (reps: number, weightKg: number) => {
        const session = selectActiveSession(get());
        if (!session) return;
        const allEx = sessionExercises(session, get().programs);
        const exercise = allEx.find((e) => e.id === session.activeExerciseId);
        if (!exercise) return;

        const newSet: LoggedSet = {
          id: crypto.randomUUID(),
          reps: Math.max(0, Math.round(reps)),
          weightKg: Math.max(0, weightKg),
          at: Date.now(),
        };

        const settings = get().timerSettings;
        const restDuration = settings.defaultRestMs || REST_MS;
        const restUntil = settings.autoStartRest ? Date.now() + restDuration : null;

        set((state) => ({
          restUntil,
          timerTotalMs: restDuration,
          lastWeightKg: {
            ...state.lastWeightKg,
            [exercise.id]: newSet.weightKg,
          },
          sessions: state.activeSessionId
            ? updateSessionInList(state.sessions, state.activeSessionId, (s) => ({
                ...s,
                logs: {
                  ...s.logs,
                  [exercise.id]: [...(s.logs[exercise.id] ?? []), newSet],
                },
              }))
            : state.sessions,
        }));
      },

      updateSet: (exerciseId: string, setId: string, patch: Partial<LoggedSet>) => {
        const session = selectActiveSession(get());
        if (!session) return;

        set((state) => ({
          sessions: updateSessionInList(state.sessions, session.id, (s) => {
            const sets = s.logs[exerciseId] ?? [];
            return {
              ...s,
              logs: {
                ...s.logs,
                [exerciseId]: sets.map((set) =>
                  set.id === setId ? { ...set, ...patch } : set
                ),
              },
            };
          }),
        }));
      },

      deleteSet: (exerciseId: string, setId: string) => {
        const session = selectActiveSession(get());
        if (!session) return;
        const sets = session.logs[exerciseId] ?? [];
        const idx = sets.findIndex((set) => set.id === setId);
        if (idx < 0) return;
        const removed = sets[idx];

        set((state) => ({
          lastUndo: { kind: "set", sessionId: session.id, exerciseId, set: removed, index: idx },
          sessions: updateSessionInList(state.sessions, session.id, (s) => {
            const current = s.logs[exerciseId] ?? [];
            return {
              ...s,
              logs: {
                ...s.logs,
                [exerciseId]: current.filter((set) => set.id !== setId),
              },
            };
          }),
        }));
        get().pushToast("Set deleted", { tone: "danger", canUndo: true });
      },

      undoLastSet: () => {
        const session = selectActiveSession(get());
        if (!session) return;
        const currentSets = session.logs[session.activeExerciseId] ?? [];
        if (currentSets.length === 0) return;
        const removed = currentSets[currentSets.length - 1];

        set((state) => ({
          restUntil: null,
          lastUndo: {
            kind: "set",
            sessionId: session.id,
            exerciseId: session.activeExerciseId,
            set: removed,
            index: currentSets.length - 1,
          },
          sessions: state.activeSessionId
            ? updateSessionInList(state.sessions, state.activeSessionId, (s) => ({
                ...s,
                logs: {
                  ...s.logs,
                  [s.activeExerciseId]: (s.logs[s.activeExerciseId] ?? []).slice(0, -1),
                },
              }))
            : state.sessions,
        }));
        get().pushToast("Set removed", { canUndo: true });
      },

      loadSplitTemplate: (templateKey: "ppl" | "upper_lower" | "full_body") => {
        const found = SPLIT_TEMPLATES.find((t) => t.key === templateKey);
        if (!found) return;
        set({
          programs: structuredClone(found.days) as ProgramDay[],
        });
      },

      linkSupersetInSession: (exerciseIds: string[], supersetLabel?: string) => {
        const session = selectActiveSession(get());
        if (!session || exerciseIds.length < 2) return;

        const allEx = sessionExercises(session, get().programs);
        const label = supersetLabel || getNextSupersetLabel(allEx, session);

        set((state) => ({
          sessions: updateSessionInList(state.sessions, session.id, (s) => {
            const nextMap = { ...(s.supersets ?? {}) };
            for (const id of exerciseIds) {
              nextMap[id] = label;
            }
            return {
              ...s,
              supersets: nextMap,
            };
          }),
        }));
      },

      unlinkSupersetInSession: (exerciseId: string) => {
        const session = selectActiveSession(get());
        if (!session) return;

        set((state) => ({
          sessions: updateSessionInList(state.sessions, session.id, (s) => {
            const nextMap = { ...(s.supersets ?? {}) };
            const oldLabel = nextMap[exerciseId];
            delete nextMap[exerciseId];

            if (oldLabel) {
              const remaining = Object.entries(nextMap).filter(([, l]) => l === oldLabel);
              if (remaining.length === 1) {
                delete nextMap[remaining[0][0]];
              }
            }

            return {
              ...s,
              supersets: nextMap,
            };
          }),
        }));
      },

      linkProgramSuperset: (dayId: string, exerciseIds: string[], supersetLabel?: string) => {
        const day = programById(get().programs, dayId);
        if (!day) return;
        const label = supersetLabel || getNextSupersetLabel(day.exercises);

        set((state) => ({
          programs: updateProgramInList(state.programs, dayId, (p) => ({
            ...p,
            exercises: p.exercises.map((e) =>
              exerciseIds.includes(e.id) ? { ...e, supersetId: label } : e
            ),
          })),
        }));
      },

      unlinkProgramSuperset: (dayId: string, exerciseId: string) => {
        const day = programById(get().programs, dayId);
        if (!day) return;
        const currentExercise = day.exercises.find((e) => e.id === exerciseId);
        const oldLabel = currentExercise?.supersetId;

        set((state) => ({
          programs: updateProgramInList(state.programs, dayId, (p) => {
            const updated = p.exercises.map((e) =>
              e.id === exerciseId ? { ...e, supersetId: null } : e
            );
            if (oldLabel) {
              const remaining = updated.filter((e) => e.supersetId === oldLabel);
              if (remaining.length === 1) {
                return {
                  ...p,
                  exercises: updated.map((e) =>
                    e.supersetId === oldLabel ? { ...e, supersetId: null } : e
                  ),
                };
              }
            }
            return {
              ...p,
              exercises: updated,
            };
          }),
        }));
      },

      startRest: (durationMs?: number) => {
        const duration = durationMs ?? get().timerSettings.defaultRestMs ?? REST_MS;
        set({
          restUntil: Date.now() + duration,
          timerTotalMs: duration,
        });
      },

      addRestTime: (ms: number) => {
        const currentUntil = get().restUntil;
        const now = Date.now();
        const base = currentUntil && currentUntil > now ? currentUntil : now;
        const nextUntil = base + ms;
        const newTotal = (get().timerTotalMs || REST_MS) + ms;
        set({
          restUntil: nextUntil,
          timerTotalMs: Math.max(newTotal, nextUntil - now),
        });
      },

      setRestTimer: (ms: number) => {
        set({
          restUntil: Date.now() + ms,
          timerTotalMs: ms,
        });
      },

      skipRest: () => {
        set({ restUntil: null });
      },

      finishSession: () => {
        const session = selectActiveSession(get());
        if (!session) return;
        if (countTotalSets(session) === 0) {
          get().discardSession();
          return;
        }

        set((state) => ({
          activeSessionId: null,
          restUntil: null,
          lastUndo: { kind: "finish", sessionId: session.id },
          sessions: state.activeSessionId
            ? updateSessionInList(state.sessions, state.activeSessionId, (s) => ({
                ...s,
                finishedAt: Date.now(),
              }))
            : state.sessions,
        }));
        get().pushToast("Session saved", { canUndo: true });
      },

      discardSession: () => {
        const activeId = get().activeSessionId;
        if (!activeId) return;
        const session = selectActiveSession(get());
        set((state) => ({
          activeSessionId: null,
          restUntil: null,
          lastUndo: session ? { kind: "session", session } : state.lastUndo,
          sessions: state.sessions.filter((s) => s.id !== activeId),
        }));
        get().pushToast("Session discarded", { tone: "danger", canUndo: true });
      },

      removeSession: (sessionId: string) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          lastUndo: session ? { kind: "session", session } : state.lastUndo,
          ...(state.activeSessionId === sessionId
            ? { activeSessionId: null, restUntil: null }
            : {}),
        }));
        get().pushToast("Log dropped", { tone: "danger", canUndo: true });
      },

      createDay: () => {
        const nextDayName = nextWeekday(get().programs);
        const day: ProgramDay = {
          id: crypto.randomUUID(),
          weekday: nextDayName,
          split: suggestedSplit(nextDayName),
          blurb: "",
          exercises: [],
        };

        set((state) => ({
          programs: [...state.programs, day],
        }));

        return day.id;
      },

      updateDay: (dayId: string, patch: Partial<ProgramDay>) => {
        set((state) => ({
          programs: updateProgramInList(state.programs, dayId, (p) => ({
            ...p,
            ...patch,
          })),
        }));
      },

      deleteDay: (dayId: string) => {
        set((state) => ({
          programs: state.programs.filter((p) => p.id !== dayId),
          goals: {
            ...state.goals,
            lifts: state.goals.lifts.filter((lg) =>
              state.programs.some(
                (p) => p.id !== dayId && p.exercises.some((e) => e.id === lg.exerciseId),
              ),
            ),
          },
        }));
      },

      addExercise: (dayId: string, exercise?: ExerciseDef) => {
        set((state) => ({
          programs: updateProgramInList(state.programs, dayId, (p) => ({
            ...p,
            exercises: [...p.exercises, exercise ?? newExercise()],
          })),
        }));
      },

      updateExercise: (dayId: string, exerciseId: string, patch: Partial<ExerciseDef>) => {
        set((state) => ({
          programs: updateProgramInList(state.programs, dayId, (p) => ({
            ...p,
            exercises: p.exercises.map((e) => (e.id === exerciseId ? withCue({ ...e, ...patch }) : e)),
          })),
        }));
      },

      removeExercise: (dayId: string, exerciseId: string) => {
        set((state) => ({
          programs: updateProgramInList(state.programs, dayId, (p) => ({
            ...p,
            exercises: p.exercises.filter((e) => e.id !== exerciseId),
          })),
          goals: {
            ...state.goals,
            lifts: state.goals.lifts.filter((lg) => lg.exerciseId !== exerciseId),
          },
        }));
      },

      moveExercise: (dayId: string, exerciseId: string, delta: number) => {
        set((state) => ({
          programs: updateProgramInList(state.programs, dayId, (p) => {
            const idx = p.exercises.findIndex((e) => e.id === exerciseId);
            const targetIdx = idx + delta;
            if (idx < 0 || targetIdx < 0 || targetIdx >= p.exercises.length) return p;

            const exercises = [...p.exercises];
            const [item] = exercises.splice(idx, 1);
            if (!item) return p;
            exercises.splice(targetIdx, 0, item);
            return { ...p, exercises };
          }),
        }));
      },

      logBodyWeight: (kg: number) => {
        const rounded = Math.round(kg * 10) / 10;
        if (rounded <= 0) return;
        const entry: BodyWeightLog = {
          id: crypto.randomUUID(),
          kg: rounded,
          at: Date.now(),
        };
        set((state) => ({
          bodyWeight: [entry, ...state.bodyWeight],
        }));
      },

      removeBodyWeight: (id: string) => {
        set((state) => ({
          bodyWeight: state.bodyWeight.filter((b) => b.id !== id),
        }));
      },

      setGoalNote: (note: string) => {
        set((state) => ({
          goals: { ...state.goals, note },
        }));
      },

      setBodyWeightGoal: (kg: number | null) => {
        set((state) => ({
          goals: { ...state.goals, bodyWeightKg: kg },
        }));
      },

      upsertLiftGoal: (goal: LiftGoal) => {
        set((state) => {
          const filtered = state.goals.lifts.filter((g) => g.exerciseId !== goal.exerciseId);
          return {
            goals: {
              ...state.goals,
              lifts: [...filtered, goal],
            },
          };
        });
      },

      removeLiftGoal: (exerciseId: string) => {
        set((state) => ({
          goals: {
            ...state.goals,
            lifts: state.goals.lifts.filter((g) => g.exerciseId !== exerciseId),
          },
        }));
      },

      updateTimerSettings: (patch: Partial<TimerSettings>) => {
        set((state) => ({
          timerSettings: { ...state.timerSettings, ...patch },
        }));
      },

      resetAllData: () => {
        set({
          programs: seedPrograms(),
          sessions: [],
          activeSessionId: null,
          restUntil: null,
          timerTotalMs: REST_MS,
          lastWeightKg: {},
          bodyWeight: [],
          goals: defaultGoals(),
          timerSettings: defaultTimerSettings(),
        });
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("rack-workout-v1");
          } catch {
            // Ignore error
          }
        }
      },

      exportData: (): WorkoutExportData => {
        const state = get();
        return {
          version: 4,
          app: "rack",
          exportedAt: new Date().toISOString(),
          programs: state.programs,
          sessions: state.sessions,
          bodyWeight: state.bodyWeight,
          goals: state.goals,
          timerSettings: state.timerSettings,
          lastWeightKg: state.lastWeightKg,
        };
      },

      importData: (jsonString: string, mode: "replace" | "merge" = "replace") => {
        try {
          const data = JSON.parse(jsonString) as Partial<WorkoutExportData>;
          if (!data || typeof data !== "object") {
            return { success: false, error: "Invalid backup file: File is not valid JSON." };
          }
          if (!Array.isArray(data.sessions) && !Array.isArray(data.programs)) {
            return {
              success: false,
              error: "Invalid backup format: File contains neither workout sessions nor routines.",
            };
          }

          const rawPrograms = Array.isArray(data.programs) ? data.programs : [];
          const rawSessions = Array.isArray(data.sessions) ? data.sessions : [];
          const rawBodyWeight = Array.isArray(data.bodyWeight) ? data.bodyWeight : [];
          const rawLastWeight =
            data.lastWeightKg && typeof data.lastWeightKg === "object" ? data.lastWeightKg : {};
          const rawGoals =
            data.goals && typeof data.goals === "object" ? data.goals : defaultGoals();
          const rawTimer =
            data.timerSettings && typeof data.timerSettings === "object"
              ? { ...defaultTimerSettings(), ...data.timerSettings }
              : defaultTimerSettings();

          if (mode === "replace") {
            set({
              programs: rawPrograms.length > 0 ? rawPrograms : seedPrograms(),
              sessions: rawSessions,
              activeSessionId: null,
              restUntil: null,
              timerTotalMs: rawTimer.defaultRestMs ?? REST_MS,
              lastWeightKg: rawLastWeight,
              bodyWeight: rawBodyWeight,
              goals: rawGoals,
              timerSettings: rawTimer,
            });
            return {
              success: true,
              message: `Restored ${rawSessions.length} workouts and ${rawPrograms.length} routines.`,
              sessionsCount: rawSessions.length,
              programsCount: rawPrograms.length,
            };
          } else {
            const current = get();
            const existingSessionIds = new Set(current.sessions.map((s) => s.id));
            const newSessions = rawSessions.filter((s) => !existingSessionIds.has(s.id));
            const mergedSessions = [...newSessions, ...current.sessions];

            const existingDayIds = new Set(current.programs.map((p) => p.id));
            const newPrograms = rawPrograms.filter((p) => !existingDayIds.has(p.id));
            const mergedPrograms = [...current.programs, ...newPrograms];

            const existingBwIds = new Set(current.bodyWeight.map((b) => b.id));
            const newBw = rawBodyWeight.filter((b) => !existingBwIds.has(b.id));
            const mergedBw = [...newBw, ...current.bodyWeight].sort((a, b) => b.at - a.at);

            set({
              sessions: mergedSessions,
              programs: mergedPrograms.length > 0 ? mergedPrograms : current.programs,
              bodyWeight: mergedBw,
              lastWeightKg: { ...current.lastWeightKg, ...rawLastWeight },
            });

            return {
              success: true,
              message: `Merged ${newSessions.length} workouts and ${newPrograms.length} routines into your data.`,
              sessionsCount: newSessions.length,
              programsCount: newPrograms.length,
            };
          }
        } catch (err: unknown) {
          return {
            success: false,
            error: err instanceof Error ? err.message : "Failed to parse backup JSON file.",
          };
        }
      },
    }),
    {
      name: "rack-workout-v1",
      version: 5,
      skipHydration: true,
      partialize: (state) => ({
        programs: state.programs,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        // Never persist a live countdown — reopening the app must not
        // resurrect an expired rest timer (or fire a stale alarm).
        restUntil: null,
        timerTotalMs: REST_MS,
        lastWeightKg: state.lastWeightKg,
        bodyWeight: state.bodyWeight,
        goals: state.goals,
        timerSettings: state.timerSettings,
      }),
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as Partial<WorkoutState>;
        const programs =
          !Array.isArray(state.programs) || state.programs.length === 0
            ? seedPrograms()
            : ensureTuesday(state.programs);
        const bodyWeight = Array.isArray(state.bodyWeight) ? state.bodyWeight : [];
        const goals = state.goals && typeof state.goals === "object" ? state.goals : defaultGoals();
        const timerSettings =
          state.timerSettings && typeof state.timerSettings === "object"
            ? { ...defaultTimerSettings(), ...state.timerSettings }
            : defaultTimerSettings();

        const sessions = Array.isArray(state.sessions) ? state.sessions : [];
        const activeSessionId =
          state.activeSessionId && sessions.some((s) => s.id === state.activeSessionId)
            ? state.activeSessionId
            : null;

        return {
          ...state,
          programs,
          sessions,
          activeSessionId,
          // Rest timers are runtime-only; never resurrect an expired countdown.
          restUntil: null,
          timerTotalMs: REST_MS,
          bodyWeight,
          goals,
          timerSettings,
        };
      },
      onRehydrateStorage: () => () => {
        useWorkoutStore.setState({ hydrated: true });
      },
    },
  ),
);

export function rehydrateWorkoutStore() {
  return useWorkoutStore.persist.rehydrate();
}

export function downloadBackupFile(exportData: WorkoutExportData) {
  if (typeof window === "undefined") return;
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rack-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getStorageUsageBytes(): number {
  if (typeof window === "undefined" || !window.localStorage) return 0;
  try {
    const raw = localStorage.getItem("rack-workout-v1");
    return raw ? new Blob([raw]).size : 0;
  } catch {
    return 0;
  }
}
