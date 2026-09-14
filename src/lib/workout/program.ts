import type { ExerciseDef, ProgramDay } from "./types";

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

export const MONDAY: ProgramDay = {
  id: "monday",
  weekday: "Monday",
  split: "Chest & Arms",
  blurb: "Pressing first, then curls and a row. Three sets is the floor. Five is the ceiling.",
  exercises: [
    {
      id: "bench-press",
      name: "Bench Press",
      group: "Chest",
      cue: "90 kg · at least 6 reps",
      minSets: 3,
      maxSets: 5,
      minReps: 6,
      load: { kind: "bar", kg: 90 },
    },
    {
      id: "incline-bench",
      name: "Incline Bench",
      group: "Chest",
      cue: "80 kg · at least 4 reps",
      minSets: 3,
      maxSets: 5,
      minReps: 4,
      load: { kind: "bar", kg: 80 },
    },
    {
      id: "decline-bench",
      name: "Decline Bench",
      group: "Chest",
      cue: "90 kg · at least 6 reps",
      minSets: 3,
      maxSets: 5,
      minReps: 6,
      load: { kind: "bar", kg: 90 },
    },
    {
      id: "barbell-curl",
      name: "Barbell Curl",
      group: "Arms",
      cue: "15 kg plates each side · 10 reps",
      minSets: 3,
      maxSets: 5,
      minReps: 10,
      load: { kind: "plates_each_side", plateKg: 15 },
    },
    {
      id: "cable-row",
      name: "Cable Row",
      group: "Back",
      cue: "10 reps · log the stack you use",
      minSets: 3,
      maxSets: 5,
      minReps: 10,
      load: { kind: "open" },
    },
    {
      id: "preacher-curl",
      name: "Preacher Curl",
      group: "Arms",
      cue: "30 kg · 10 reps",
      minSets: 3,
      maxSets: 5,
      minReps: 10,
      load: { kind: "bar", kg: 30 },
    },
  ],
};

export const TUESDAY: ProgramDay = {
  id: "tuesday",
  weekday: "Tuesday",
  split: "Back & Shoulders",
  blurb: "You write this day. Rows, pulldowns, laterals — whatever you actually do.",
  exercises: [],
};

export function cloneMonday(): ProgramDay {
  return structuredClone(MONDAY);
}

export function cloneTuesday(): ProgramDay {
  return structuredClone(TUESDAY);
}

export function seedPrograms(): ProgramDay[] {
  return [cloneMonday(), cloneTuesday()];
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
