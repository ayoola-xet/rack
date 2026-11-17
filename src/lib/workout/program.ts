import type { ExerciseDef, LoadTarget, ProgramDay, Session } from "./types";

export const APP_NAME = "RACK";
export const REST_MS = 90_000;
export const WEIGHT_STEP = 2.5;
export const BODY_WEIGHT_STEP = 0.1;

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const GROUP_SUGGESTIONS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core"];

export type LibraryExercise = {
  name: string;
  group: string;
  minSets: number;
  maxSets: number;
  minReps: number;
  load: LoadTarget;
};

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Chest
  { name: "Barbell Bench Press", group: "Chest", minSets: 3, maxSets: 5, minReps: 6, load: { kind: "bar", kg: 80 } },
  { name: "Incline Dumbbell Press", group: "Chest", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "open" } },
  { name: "Incline Barbell Bench", group: "Chest", minSets: 3, maxSets: 4, minReps: 6, load: { kind: "bar", kg: 70 } },
  { name: "Dumbbell Flat Bench", group: "Chest", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "open" } },
  { name: "Cable Chest Flyes", group: "Chest", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } },
  { name: "Dips (Chest / Triceps)", group: "Chest", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "open" } },
  { name: "Pec Deck Fly", group: "Chest", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } },
  { name: "Push-ups", group: "Chest", minSets: 3, maxSets: 4, minReps: 15, load: { kind: "open" } },

  // Back
  { name: "Barbell Deadlift", group: "Back", minSets: 3, maxSets: 4, minReps: 5, load: { kind: "bar", kg: 100 } },
  { name: "Lat Pulldown", group: "Back", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } },
  { name: "Pull-ups", group: "Back", minSets: 3, maxSets: 4, minReps: 6, load: { kind: "open" } },
  { name: "Barbell Bent-Over Row", group: "Back", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "bar", kg: 60 } },
  { name: "Seated Cable Row", group: "Back", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } },
  { name: "Dumbbell Single-Arm Row", group: "Back", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } },
  { name: "T-Bar Row", group: "Back", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "open" } },
  { name: "Face Pulls", group: "Back", minSets: 3, maxSets: 4, minReps: 15, load: { kind: "open" } },

  // Shoulders
  { name: "Overhead Barbell Press", group: "Shoulders", minSets: 3, maxSets: 4, minReps: 6, load: { kind: "bar", kg: 45 } },
  { name: "Dumbbell Shoulder Press", group: "Shoulders", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "open" } },
  { name: "Dumbbell Lateral Raise", group: "Shoulders", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } },
  { name: "Cable Lateral Raise", group: "Shoulders", minSets: 3, maxSets: 4, minReps: 15, load: { kind: "open" } },
  { name: "Reverse Pec Deck", group: "Shoulders", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } },
  { name: "Arnold Press", group: "Shoulders", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } },
  { name: "Dumbbell Shrugs", group: "Shoulders", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } },

  // Arms
  { name: "Barbell Bicep Curl", group: "Arms", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "bar", kg: 30 } },
  { name: "Dumbbell Hammer Curl", group: "Arms", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } },
  { name: "Incline Dumbbell Curl", group: "Arms", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } },
  { name: "Preacher Curl", group: "Arms", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "bar", kg: 25 } },
  { name: "Tricep Rope Pushdown", group: "Arms", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } },
  { name: "Skull Crushers (EZ Bar)", group: "Arms", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "bar", kg: 30 } },
  { name: "Overhead Tricep Extension", group: "Arms", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } },
  { name: "Close-Grip Bench Press", group: "Arms", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "bar", kg: 60 } },

  // Legs
  { name: "Barbell Back Squat", group: "Legs", minSets: 3, maxSets: 5, minReps: 6, load: { kind: "bar", kg: 90 } },
  { name: "Romanian Deadlift (RDL)", group: "Legs", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "bar", kg: 80 } },
  { name: "Leg Press", group: "Legs", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } },
  { name: "Leg Extension", group: "Legs", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } },
  { name: "Seated Leg Curl", group: "Legs", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } },
  { name: "Bulgarian Split Squat", group: "Legs", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "open" } },
  { name: "Standing Calf Raise", group: "Legs", minSets: 4, maxSets: 5, minReps: 12, load: { kind: "open" } },
  { name: "Seated Calf Raise", group: "Legs", minSets: 4, maxSets: 5, minReps: 15, load: { kind: "open" } },

  // Core
  { name: "Hanging Knee / Leg Raise", group: "Core", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } },
  { name: "Ab Wheel Rollout", group: "Core", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } },
  { name: "Cable Crunch", group: "Core", minSets: 3, maxSets: 4, minReps: 15, load: { kind: "open" } },
  { name: "Plank", group: "Core", minSets: 3, maxSets: 3, minReps: 60, load: { kind: "open" } },
];

export function createExerciseFromLibrary(lib: LibraryExercise): ExerciseDef {
  return withCue({
    id: crypto.randomUUID(),
    name: lib.name,
    group: lib.group,
    cue: "",
    minSets: lib.minSets,
    maxSets: lib.maxSets,
    minReps: lib.minReps,
    load: lib.load,
  });
}

export function buildTemplatePPL(): ProgramDay[] {
  return [
    {
      id: "monday",
      weekday: "Monday",
      split: "Push (Chest, Shoulders & Triceps)",
      blurb: "Heavy bench pressing first, overhead pressing, then tricep burnout.",
      exercises: [
        withCue({ id: "bench-press", name: "Barbell Bench Press", group: "Chest", cue: "", minSets: 3, maxSets: 5, minReps: 6, load: { kind: "bar", kg: 80 } }),
        withCue({ id: "incline-db", name: "Incline Dumbbell Press", group: "Chest", cue: "", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "open" } }),
        withCue({ id: "ohp", name: "Overhead Barbell Press", group: "Shoulders", cue: "", minSets: 3, maxSets: 4, minReps: 6, load: { kind: "bar", kg: 45 } }),
        withCue({ id: "lat-raise", name: "Dumbbell Lateral Raise", group: "Shoulders", cue: "", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } }),
        withCue({ id: "tricep-pushdown", name: "Tricep Rope Pushdown", group: "Arms", cue: "", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } }),
      ],
    },
    {
      id: "wednesday",
      weekday: "Wednesday",
      split: "Pull (Back, Biceps & Rear Delts)",
      blurb: "Deadlifts, heavy rows, vertical pulls, and arm work.",
      exercises: [
        withCue({ id: "deadlift", name: "Barbell Deadlift", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 5, load: { kind: "bar", kg: 100 } }),
        withCue({ id: "lat-pulldown", name: "Lat Pulldown", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } }),
        withCue({ id: "barbell-row", name: "Barbell Bent-Over Row", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "bar", kg: 60 } }),
        withCue({ id: "face-pull", name: "Face Pulls", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 15, load: { kind: "open" } }),
        withCue({ id: "barbell-curl", name: "Barbell Bicep Curl", group: "Arms", cue: "", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "bar", kg: 30 } }),
      ],
    },
    {
      id: "friday",
      weekday: "Friday",
      split: "Legs & Core",
      blurb: "Squat heavy, posterior chain with Romanian Deadlifts, finish with calves & core.",
      exercises: [
        withCue({ id: "squat", name: "Barbell Back Squat", group: "Legs", cue: "", minSets: 3, maxSets: 5, minReps: 6, load: { kind: "bar", kg: 90 } }),
        withCue({ id: "rdl", name: "Romanian Deadlift (RDL)", group: "Legs", cue: "", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "bar", kg: 80 } }),
        withCue({ id: "leg-press", name: "Leg Press", group: "Legs", cue: "", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } }),
        withCue({ id: "calf-raise", name: "Standing Calf Raise", group: "Legs", cue: "", minSets: 4, maxSets: 5, minReps: 12, load: { kind: "open" } }),
        withCue({ id: "knee-raise", name: "Hanging Knee / Leg Raise", group: "Core", cue: "", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } }),
      ],
    },
  ];
}

export function buildTemplateUpperLower(): ProgramDay[] {
  return [
    {
      id: "monday",
      weekday: "Monday",
      split: "Upper Body Power",
      blurb: "Heavy horizontal and vertical presses and pulls.",
      exercises: [
        withCue({ id: "bench-press", name: "Barbell Bench Press", group: "Chest", cue: "", minSets: 3, maxSets: 4, minReps: 6, load: { kind: "bar", kg: 80 } }),
        withCue({ id: "barbell-row", name: "Barbell Bent-Over Row", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 6, load: { kind: "bar", kg: 65 } }),
        withCue({ id: "ohp", name: "Overhead Barbell Press", group: "Shoulders", cue: "", minSets: 3, maxSets: 4, minReps: 6, load: { kind: "bar", kg: 45 } }),
        withCue({ id: "lat-pulldown", name: "Lat Pulldown", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "open" } }),
        withCue({ id: "tricep-pushdown", name: "Tricep Rope Pushdown", group: "Arms", cue: "", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } }),
      ],
    },
    {
      id: "tuesday",
      weekday: "Tuesday",
      split: "Lower Body Power",
      blurb: "Squat strength, hinges, and core stabilization.",
      exercises: [
        withCue({ id: "squat", name: "Barbell Back Squat", group: "Legs", cue: "", minSets: 3, maxSets: 5, minReps: 6, load: { kind: "bar", kg: 90 } }),
        withCue({ id: "rdl", name: "Romanian Deadlift (RDL)", group: "Legs", cue: "", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "bar", kg: 80 } }),
        withCue({ id: "leg-press", name: "Leg Press", group: "Legs", cue: "", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } }),
        withCue({ id: "calf-raise", name: "Standing Calf Raise", group: "Legs", cue: "", minSets: 4, maxSets: 5, minReps: 12, load: { kind: "open" } }),
      ],
    },
    {
      id: "thursday",
      weekday: "Thursday",
      split: "Upper Body Hypertrophy",
      blurb: "Higher rep volume for chest, back, shoulders, and arms.",
      exercises: [
        withCue({ id: "incline-db", name: "Incline Dumbbell Press", group: "Chest", cue: "", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } }),
        withCue({ id: "cable-row", name: "Seated Cable Row", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } }),
        withCue({ id: "lat-raise", name: "Dumbbell Lateral Raise", group: "Shoulders", cue: "", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } }),
        withCue({ id: "face-pull", name: "Face Pulls", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 15, load: { kind: "open" } }),
        withCue({ id: "barbell-curl", name: "Barbell Bicep Curl", group: "Arms", cue: "", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "bar", kg: 30 } }),
      ],
    },
    {
      id: "friday",
      weekday: "Friday",
      split: "Lower Body Hypertrophy",
      blurb: "Deadlifts, leg isolation, and high-volume calves & abs.",
      exercises: [
        withCue({ id: "deadlift", name: "Barbell Deadlift", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 5, load: { kind: "bar", kg: 100 } }),
        withCue({ id: "leg-ext", name: "Leg Extension", group: "Legs", cue: "", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } }),
        withCue({ id: "leg-curl", name: "Seated Leg Curl", group: "Legs", cue: "", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } }),
        withCue({ id: "knee-raise", name: "Hanging Knee / Leg Raise", group: "Core", cue: "", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } }),
      ],
    },
  ];
}

export function buildTemplateFullBody(): ProgramDay[] {
  return [
    {
      id: "monday",
      weekday: "Monday",
      split: "Full Body A",
      blurb: "Squat, bench, and row foundation.",
      exercises: [
        withCue({ id: "squat", name: "Barbell Back Squat", group: "Legs", cue: "", minSets: 3, maxSets: 5, minReps: 6, load: { kind: "bar", kg: 90 } }),
        withCue({ id: "bench-press", name: "Barbell Bench Press", group: "Chest", cue: "", minSets: 3, maxSets: 5, minReps: 6, load: { kind: "bar", kg: 80 } }),
        withCue({ id: "barbell-row", name: "Barbell Bent-Over Row", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "bar", kg: 60 } }),
        withCue({ id: "barbell-curl", name: "Barbell Bicep Curl", group: "Arms", cue: "", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "bar", kg: 30 } }),
      ],
    },
    {
      id: "wednesday",
      weekday: "Wednesday",
      split: "Full Body B",
      blurb: "Deadlift focus, overhead pressing, and vertical pull.",
      exercises: [
        withCue({ id: "deadlift", name: "Barbell Deadlift", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 5, load: { kind: "bar", kg: 100 } }),
        withCue({ id: "ohp", name: "Overhead Barbell Press", group: "Shoulders", cue: "", minSets: 3, maxSets: 4, minReps: 6, load: { kind: "bar", kg: 45 } }),
        withCue({ id: "lat-pulldown", name: "Lat Pulldown", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } }),
        withCue({ id: "tricep-pushdown", name: "Tricep Rope Pushdown", group: "Arms", cue: "", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } }),
      ],
    },
    {
      id: "friday",
      weekday: "Friday",
      split: "Full Body C",
      blurb: "Hinges, dumbbell presses, and lateral shoulder work.",
      exercises: [
        withCue({ id: "rdl", name: "Romanian Deadlift (RDL)", group: "Legs", cue: "", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "bar", kg: 80 } }),
        withCue({ id: "incline-db", name: "Incline Dumbbell Press", group: "Chest", cue: "", minSets: 3, maxSets: 4, minReps: 8, load: { kind: "open" } }),
        withCue({ id: "cable-row", name: "Seated Cable Row", group: "Back", cue: "", minSets: 3, maxSets: 4, minReps: 10, load: { kind: "open" } }),
        withCue({ id: "lat-raise", name: "Dumbbell Lateral Raise", group: "Shoulders", cue: "", minSets: 3, maxSets: 4, minReps: 12, load: { kind: "open" } }),
      ],
    },
  ];
}

export const SPLIT_TEMPLATES = [
  { key: "ppl", name: "Push / Pull / Legs (PPL)", description: "3 days/week (or 6-day cycle). The gold standard for muscle hypertrophy.", days: buildTemplatePPL() },
  { key: "upper_lower", name: "Upper / Lower (4-Day)", description: "4 days/week. Optimal balance of frequency and recovery.", days: buildTemplateUpperLower() },
  { key: "full_body", name: "Full Body (3-Day)", description: "3 days/week. Hit every muscle 3 times a week with compound lifts.", days: buildTemplateFullBody() },
] as const;

export const MONDAY: ProgramDay = buildTemplatePPL()[0];
export const TUESDAY: ProgramDay = {
  id: "tuesday",
  weekday: "Tuesday",
  split: "Rest or Custom",
  blurb: "Rest day or add custom lifts.",
  exercises: [],
};

export function cloneMonday(): ProgramDay {
  return structuredClone(MONDAY);
}

export function cloneTuesday(): ProgramDay {
  return structuredClone(TUESDAY);
}

export function seedPrograms(): ProgramDay[] {
  return buildTemplatePPL();
}

export function suggestedSplit(weekday: string): string {
  if (weekday === "Tuesday") return "Back & Shoulders";
  if (weekday === "Monday") return "Chest & Arms";
  return "";
}

export function weekdayIndex(name: string): number {
  const index = (WEEKDAYS as readonly string[]).indexOf(name);
  return index < 0 ? 99 : index;
}

export function orderedPrograms(programs: ProgramDay[]): ProgramDay[] {
  return programs.slice().sort((a, b) => weekdayIndex(a.weekday) - weekdayIndex(b.weekday));
}

export function ensureTuesday(programs: ProgramDay[]): ProgramDay[] {
  if (programs.some((day) => day.weekday === "Tuesday" || day.id === "tuesday")) {
    return orderedPrograms(programs);
  }
  const next = programs.slice();
  const mondayIdx = next.findIndex((day) => day.weekday === "Monday");
  next.splice(mondayIdx < 0 ? next.length : mondayIdx + 1, 0, cloneTuesday());
  return orderedPrograms(next);
}

export function nextWeekday(existing: ProgramDay[]): string {
  const used = new Set(existing.map((day) => day.weekday));
  return WEEKDAYS.find((day) => !used.has(day)) ?? "Custom";
}

export function programById(programs: ProgramDay[], dayId: string): ProgramDay | undefined {
  return programs.find((day) => day.id === dayId);
}

export function sessionExercises(session: Session, programs: ProgramDay[]): ExerciseDef[] {
  const program = programById(programs, session.dayId);
  const progExercises = program?.exercises ?? [];
  const custom = session.customExercises ?? [];
  return [...progExercises, ...custom];
}

export function allExercises(programs: ProgramDay[]): ExerciseDef[] {
  const seen = new Set<string>();
  const list: ExerciseDef[] = [];
  for (const day of programs) {
    for (const exercise of day.exercises) {
      if (seen.has(exercise.id)) continue;
      seen.add(exercise.id);
      list.push(exercise);
    }
  }
  return list;
}

export function buildCue(exercise: Pick<ExerciseDef, "load" | "minReps">): string {
  if (exercise.load.kind === "bar") {
    return `${exercise.load.kg} kg · at least ${exercise.minReps} reps`;
  }
  if (exercise.load.kind === "plates_each_side") {
    return `${exercise.load.plateKg} kg plates each side · ${exercise.minReps} reps`;
  }
  return `${exercise.minReps} reps · log the load you use`;
}

export function withCue(exercise: ExerciseDef): ExerciseDef {
  return { ...exercise, cue: buildCue(exercise) };
}

export function newExercise(): ExerciseDef {
  return withCue({
    id: crypto.randomUUID(),
    name: "",
    group: "",
    cue: "",
    minSets: 3,
    maxSets: 5,
    minReps: 8,
    load: { kind: "open" },
  });
}

export function defaultWeightKg(exercise: ExerciseDef, last?: number): number {
  if (typeof last === "number" && last > 0) return last;
  if (exercise.load.kind === "bar") return exercise.load.kg;
  if (exercise.load.kind === "plates_each_side") return exercise.load.plateKg * 2 + 20;
  return 40;
}

export function prescribedWeightLabel(exercise: ExerciseDef): string | null {
  if (exercise.load.kind === "bar") return `${exercise.load.kg} kg`;
  if (exercise.load.kind === "plates_each_side") {
    return `${exercise.load.plateKg} kg / side`;
  }
  return null;
}

export function loadMeetsTarget(exercise: ExerciseDef, weightKg: number): boolean {
  if (exercise.load.kind === "bar") return weightKg + 1e-6 >= exercise.load.kg;
  return true;
}
