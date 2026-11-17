import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/workout/stats";
import { useWorkoutStore } from "@/lib/workout/store";

export function DropLogControl({ sessionId, startedAt }: { sessionId: string; startedAt: number }) {
  const removeSession = useWorkoutStore((s) => s.removeSession);
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="mt-3 rounded-md bg-surface-2 px-3 py-3">
        <p className="text-sm text-muted">
          Drop the log from {formatDate(startedAt)} ({formatTime(startedAt)})? It leaves the history and the charts.
        </p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="danger" onClick={() => removeSession(sessionId)}>
            Drop log
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
            Keep
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-subtle">A "Undo" notification will appear right after.</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="mt-2 flex h-11 w-full items-center justify-center rounded-lg text-sm text-miss hover:bg-surface-2/60"
      onClick={() => setConfirm(true)}
    >
      Drop this log
    </button>
  );
}
