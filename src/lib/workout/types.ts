export type LoadTarget =
  | { kind: "bar"; kg: number }
  | { kind: "plates_each_side"; plateKg: number }
  | { kind: "open" };

export type ExerciseDef = {
  id: string;
  name: string;
  group: string;
  cue: string;
  minSets: number;
  maxSets: number;
  minReps: number;
  load: LoadTarget;
};

export type ProgramDay = {
  id: string;
  weekday: string;
  split: string;
  blurb: string;
  exercises: ExerciseDef[];
};

export type LoggedSet = {
  id: string;
  reps: number;
  weightKg: number;
  at: number;
};

export type Session = {
  id: string;
  dayId: string;
  startedAt: number;
  finishedAt: number | null;
  activeExerciseId: string;
  logs: Record<string, LoggedSet[]>;
};

export type BodyWeightLog = {
  id: string;
  kg: number;
  at: number;
};

export type LiftGoal = {
  exerciseId: string;
  weightKg: number | null;
  reps: number | null;
  sets: number | null;
};

export type Goals = {
  note: string;
  bodyWeightKg: number | null;
  lifts: LiftGoal[];
};
