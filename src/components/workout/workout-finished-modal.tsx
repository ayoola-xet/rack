import { Trophy, Clock, Dumbbell, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, formatKg, sessionVolume, countTotalSets } from "@/lib/workout/stats";
import type { Session, ProgramDay } from "@/lib/workout/types";
import { sessionExercises } from "@/lib/workout/program";

export function WorkoutFinishedModal({
  isOpen,
  session,
  programs,
  onFinish,
  onDismiss,
}: {
  isOpen: boolean;
  session: Session | null;
  programs: ProgramDay[];
  onFinish: () => void;
  onDismiss: () => void;
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy className="size-4 text-accent" />
            <h2 className="font-display text-lg font-bold tracking-tight text-fg">
              {totalSets > 0 ? "Wrap up this workout?" : "No sets logged yet"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close and keep working"
            onClick={onDismiss}
            className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-1 text-xs text-muted">
          {totalSets > 0
            ? "Finish to save this session, or keep working — nothing is lost."
            : "Finishing now discards this empty session (you can undo it)."}
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

        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1 font-semibold"
            size="lg"
            onClick={onFinish}
          >
            <CheckCircle2 className="size-4" />
            Finish &amp; save session
          </Button>
          <Button
            className="flex-1 font-semibold"
            size="lg"
            variant="secondary"
            onClick={onDismiss}
          >
            Keep working
          </Button>
        </div>
      </div>
    </div>
  );
}
