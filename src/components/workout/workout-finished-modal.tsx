import { Trophy, Clock, Dumbbell, Flame, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, formatKg, sessionVolume, countTotalSets } from "@/lib/workout/stats";
import type { Session, ProgramDay } from "@/lib/workout/types";
import { sessionExercises } from "@/lib/workout/program";

export function WorkoutFinishedModal({
  isOpen,
  session,
  programs,
  onClose,
}: {
  isOpen: boolean;
  session: Session | null;
  programs: ProgramDay[];
  onClose: () => void;
}) {
  if (!isOpen || !session) return null;

  const duration = formatDuration(session.startedAt, session.finishedAt || Date.now());
  const volume = sessionVolume(session);
  const totalSets = countTotalSets(session);
  const exercises = sessionExercises(session, programs);
  const exercisesLoggedCount = exercises.filter(
    (e) => (session.logs[e.id]?.length ?? 0) > 0,
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {/* Trophy Badge */}
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-inner">
          <Trophy className="size-7" />
        </div>

        <h2 className="mt-3.5 font-display text-2xl font-bold tracking-tight text-fg">
          Workout Complete!
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          Great consistency. Another session in the books.
        </p>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-surface-2 p-2.5 shadow-card">
            <div className="flex items-center justify-center gap-1 text-muted">
              <Clock className="size-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Time</span>
            </div>
            <p className="mt-1 font-display text-lg font-bold text-fg tabular-nums leading-none">
              {duration}
            </p>
          </div>

          <div className="rounded-xl bg-surface-2 p-2.5 shadow-card">
            <div className="flex items-center justify-center gap-1 text-muted">
              <Dumbbell className="size-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Volume</span>
            </div>
            <p className="mt-1 font-display text-lg font-bold text-accent tabular-nums leading-none">
              {formatKg(volume)} kg
            </p>
          </div>

          <div className="rounded-xl bg-surface-2 p-2.5 shadow-card">
            <div className="flex items-center justify-center gap-1 text-muted">
              <CheckCircle2 className="size-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Sets</span>
            </div>
            <p className="mt-1 font-display text-lg font-bold text-hit tabular-nums leading-none">
              {totalSets}
            </p>
          </div>
        </div>

        {/* Exercises summary pills */}
        <div className="mt-3.5 rounded-xl border border-border/70 bg-bg/50 p-3 text-left">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-semibold text-subtle text-[11px] uppercase tracking-wider">
              Lifts Logged
            </span>
            <span className="font-bold text-fg">
              {exercisesLoggedCount} of {exercises.length}
            </span>
          </div>

          <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {exercises.map((ex) => {
              const sets = session.logs[ex.id] ?? [];
              if (sets.length === 0) return null;
              const maxWt = sets.reduce((max, s) => Math.max(max, s.weightKg), 0);
              return (
                <div
                  key={ex.id}
                  className="flex items-center justify-between text-xs py-0.5 border-b border-border/30 last:border-0"
                >
                  <span className="truncate font-medium text-fg">{ex.name}</span>
                  <span className="shrink-0 text-[11px] text-muted tabular-nums">
                    {sets.length} sets · top {formatKg(maxWt)} kg
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          className="mt-5 w-full font-semibold"
          size="lg"
          onClick={onClose}
        >
          View Progress & Charts
        </Button>
      </div>
    </div>
  );
}
