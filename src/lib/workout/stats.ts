import { format } from "date-fns";
import { loadMeetsTarget } from "./program";
import type { BodyWeightLog, ExerciseDef, LoggedSet, ProgramDay, Session } from "./types";

export function formatKg(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatSet(set: LoggedSet): string {
  return `${formatKg(set.weightKg)}×${set.reps}`;
}

export function formatDate(at: number): string {
  return format(at, "EEE d MMM");
}

export function formatTime(at: number): string {
  return format(at, "h:mm a");
}

export function formatDuration(start: number, end: number): string {
  const minutes = Math.max(1, Math.round((end - start) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

export function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function setMeetsTarget(exercise: ExerciseDef, set: LoggedSet): boolean {
  return set.reps >= exercise.minReps && loadMeetsTarget(exercise, set.weightKg);
}

export function exerciseProgress(exercise: ExerciseDef, sets: LoggedSet[]) {
  const setsDone = sets.length;
  const qualifying = sets.filter((s) => setMeetsTarget(exercise, s)).length;
  const setsOwed = Math.max(0, exercise.minSets - setsDone);
  const repsOwed = setsOwed * exercise.minReps;
  const shortfallReps = sets.reduce(
    (acc, s) => (s.reps >= exercise.minReps ? acc : acc + (exercise.minReps - s.reps)),
    0,
  );
  const lightSets = sets.filter((s) => !loadMeetsTarget(exercise, s.weightKg)).length;
  const optionalLeft = Math.max(0, exercise.maxSets - setsDone);
  const minHit = setsDone >= exercise.minSets;
  const maxed = setsDone >= exercise.maxSets;

  return {
    setsDone,
    qualifying,
    setsOwed,
    repsOwed,
    shortfallReps,
    lightSets,
    optionalLeft,
    minHit,
    maxed,
  };
}

export function sessionVolume(session: Session): number {
  let total = 0;
  for (const sets of Object.values(session.logs)) {
    for (const set of sets) {
      total += set.weightKg * set.reps;
    }
  }
  return total;
}

export function maxWeight(sets: LoggedSet[]): number {
  return sets.reduce((max, s) => Math.max(max, s.weightKg), 0);
}

export function maxReps(sets: LoggedSet[]): number {
  return sets.reduce((max, s) => Math.max(max, s.reps), 0);
}

export function sessionSummary(session: Session, program?: ProgramDay) {
  const exercises = program?.exercises?.length
    ? program.exercises
    : Object.keys(session.logs).map((id) => ({
        id,
        name: id,
        group: "",
        cue: "",
        minSets: 1,
        maxSets: 10,
        minReps: 1,
        load: { kind: "open" as const },
      }));

  let liftsHit = 0;
  let shortSets = 0;
  let missingSets = 0;
  const missing: string[] = [];

  for (const ex of exercises) {
    const sets = session.logs[ex.id] ?? [];
    const prog = exerciseProgress(ex, sets);
    if (prog.minHit) {
      liftsHit += 1;
    } else {
      missingSets += prog.setsOwed;
      missing.push(`${ex.name} ${prog.setsDone}/${ex.minSets}`);
    }
    shortSets += sets.filter((s) => !setMeetsTarget(ex, s)).length;
  }

  const liftsTotal = exercises.length;
  const isLive = session.finishedAt === null;
  const status: "live" | "hit" | "lapse" = isLive
    ? "live"
    : liftsHit === liftsTotal
      ? "hit"
      : "lapse";

  let detail = "";
  if (missing.length > 0) {
    detail = missing[0] ?? "";
  } else if (shortSets > 0) {
    detail = `${shortSets} short set${shortSets === 1 ? "" : "s"}`;
  } else {
    detail = "All floors hit";
  }

  return {
    status,
    liftsHit,
    liftsTotal,
    shortSets,
    missingSets,
    headline: isLive
      ? `Live · ${liftsHit}/${liftsTotal}`
      : status === "hit"
        ? `Hit ${liftsHit}/${liftsTotal}`
        : `Lapse ${liftsHit}/${liftsTotal}`,
    detail,
    volume: sessionVolume(session),
  };
}

export function exercisesHit(session: Session, program?: ProgramDay): number {
  const exercises = program?.exercises ?? [];
  return exercises.length
    ? exercises.filter((ex) => (session.logs[ex.id]?.length ?? 0) >= ex.minSets).length
    : 0;
}

export function latestBodyWeight(logs: BodyWeightLog[]): BodyWeightLog | null {
  return logs[0] ?? null;
}

export function finishedSessions(sessions: Session[]): Session[] {
  return sessions
    .filter((s) => s.finishedAt !== null)
    .slice()
    .sort((a, b) => a.startedAt - b.startedAt);
}

export function volumeTrend(sessions: Session[]) {
  return finishedSessions(sessions).map((s) => ({
    at: s.startedAt,
    label: format(s.startedAt, "d MMM"),
    value: Math.round(sessionVolume(s)),
  }));
}

export function exerciseTrend(sessions: Session[], exerciseId: string) {
  return finishedSessions(sessions)
    .filter((s) => (s.logs[exerciseId]?.length ?? 0) > 0)
    .map((s) => ({
      at: s.startedAt,
      label: format(s.startedAt, "d MMM"),
      value: maxWeight(s.logs[exerciseId] ?? []),
    }));
}

export function bodyWeightTrend(logs: BodyWeightLog[]) {
  return logs
    .slice()
    .sort((a, b) => a.at - b.at)
    .map((l) => ({
      at: l.at,
      label: format(l.at, "d MMM"),
      value: l.kg,
    }));
}

export function goalProgress(initial: number, current: number, target: number): number {
  const delta = target - initial;
  if (Math.abs(delta) < 1e-6) return current === target ? 100 : 0;
  const pct = ((current - initial) / delta) * 100;
  return Math.max(0, Math.min(100, pct));
}

export function exerciseLastSession(sessions: Session[], exerciseId: string) {
  const valid = finishedSessions(sessions).filter((s) => (s.logs[exerciseId]?.length ?? 0) > 0);
  const last = valid[valid.length - 1];
  if (!last) return null;
  const sets = last.logs[exerciseId] ?? [];
  return {
    weightKg: maxWeight(sets),
    reps: maxReps(sets),
    sets: sets.length,
  };
}
