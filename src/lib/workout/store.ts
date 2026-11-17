import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ensureTuesday,
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

export type TimerSettings = {
  alarmSound: boolean;
  alarmSoundType: AlarmSoundType;
  alarmVibrate: boolean;
  alarmNotifications: boolean;
  countdownBeeps: boolean;
  defaultRestMs: number;
  autoStartRest: boolean;
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

  startDay: (dayId: string) => void;
  startQuickSession: (title?: string) => void;
  addExerciseToActiveSession: (exercise: ExerciseDef) => void;
  removeExerciseFromActiveSession: (exerciseId: string) => void;
  setActiveExercise: (exerciseId: string) => void;
  logSet: (reps: number, weightKg: number) => void;
  updateSet: (exerciseId: string, setId: string, patch: Partial<LoggedSet>) => void;
  deleteSet: (exerciseId: string, setId: string) => void;
  undoLastSet: () => void;
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
          restUntil: null,
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

        set((state) => ({
          sessions: updateSessionInList(state.sessions, session.id, (s) => {
            const sets = s.logs[exerciseId] ?? [];
            return {
              ...s,
              logs: {
                ...s.logs,
                [exerciseId]: sets.filter((set) => set.id !== setId),
              },
            };
          }),
        }));
      },

      undoLastSet: () => {
        const session = selectActiveSession(get());
        if (!session) return;
        const currentSets = session.logs[session.activeExerciseId] ?? [];
        if (currentSets.length === 0) return;

        set((state) => ({
          restUntil: null,
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
      },

      loadSplitTemplate: (templateKey: "ppl" | "upper_lower" | "full_body") => {
        const found = SPLIT_TEMPLATES.find((t) => t.key === templateKey);
        if (!found) return;
        set({
          programs: structuredClone(found.days) as ProgramDay[],
        });
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
          sessions: state.activeSessionId
            ? updateSessionInList(state.sessions, state.activeSessionId, (s) => ({
                ...s,
                finishedAt: Date.now(),
              }))
            : state.sessions,
        }));
      },

      discardSession: () => {
        const activeId = get().activeSessionId;
        if (!activeId) return;
        set((state) => ({
          activeSessionId: null,
          restUntil: null,
          sessions: state.sessions.filter((s) => s.id !== activeId),
        }));
      },

      removeSession: (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          ...(state.activeSessionId === sessionId
            ? { activeSessionId: null, restUntil: null }
            : {}),
        }));
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
    }),
    {
      name: "rack-workout-v1",
      version: 4,
      skipHydration: true,
      partialize: (state) => ({
        programs: state.programs,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        restUntil: state.restUntil,
        timerTotalMs: state.timerTotalMs,
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

        return {
          ...state,
          programs,
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
