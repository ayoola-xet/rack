import { useState } from "react";
import { Link2, Unlink, X, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExerciseDef, Session } from "@/lib/workout/types";
import { getSupersetExercises } from "@/lib/workout/program";

export function SupersetModal({
  isOpen,
  currentExercise,
  allExercises,
  currentSupersetId,
  session,
  onClose,
  onLink,
  onUnlink,
}: {
  isOpen: boolean;
  currentExercise: ExerciseDef;
  allExercises: ExerciseDef[];
  currentSupersetId: string | null;
  session?: Session | null;
  onClose: () => void;
  onLink: (exerciseIds: string[]) => void;
  onUnlink: (exerciseId: string) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([currentExercise.id]);

  if (!isOpen) return null;

  const otherExercises = allExercises.filter((e) => e.id !== currentExercise.id);
  const groupExercises = currentSupersetId
    ? getSupersetExercises(allExercises, currentSupersetId, session)
    : [];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirmLink = () => {
    if (selectedIds.length >= 2) {
      onLink(selectedIds);
      onClose();
    }
  };

  const handleConfirmUnlink = () => {
    onUnlink(currentExercise.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-border bg-surface p-4 shadow-2xl pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Zap className="size-4 text-purple-400" />
            <h2 className="font-display text-lg font-bold text-fg leading-none">
              {currentSupersetId
                ? `Superset ${currentSupersetId}`
                : "Create Superset"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>

        {currentSupersetId ? (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted">
              <strong className="text-fg">{currentExercise.name}</strong> is currently part of{" "}
              <span className="font-semibold text-purple-300">Superset {currentSupersetId}</span>.
            </p>

            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Exercises in this Superset:
              </span>
              {groupExercises.map((ex, idx) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between text-xs font-medium text-fg py-0.5"
                >
                  <span>
                    {currentSupersetId}{idx + 1}. {ex.name}
                  </span>
                  <span className="text-[11px] text-muted">{ex.group}</span>
                </div>
              ))}
            </div>

            <Button
              variant="danger"
              size="md"
              className="w-full mt-2 font-semibold"
              onClick={handleConfirmUnlink}
            >
              <Unlink className="size-4" />
              Remove from Superset
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted">
              Combine <strong className="text-fg">{currentExercise.name}</strong> with one or more lifts to perform back-to-back with no rest between them:
            </p>

            <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-border/30 pr-1">
              {otherExercises.map((ex) => {
                const isChecked = selectedIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => toggleSelect(ex.id)}
                    className={cn(
                      "flex w-full items-center justify-between p-2 rounded-lg text-left transition-colors",
                      isChecked
                        ? "bg-purple-950/40 border border-purple-500/50 text-fg"
                        : "hover:bg-surface-2 text-muted hover:text-fg",
                    )}
                  >
                    <div>
                      <p className="text-xs font-semibold">{ex.name}</p>
                      <p className="text-[10px] text-subtle">{ex.group || "Lift"}</p>
                    </div>

                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-md border",
                        isChecked
                          ? "bg-purple-600 border-purple-400 text-white"
                          : "border-border bg-surface-2",
                      )}
                    >
                      {isChecked && <Check className="size-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1 font-semibold"
                size="md"
                disabled={selectedIds.length < 2}
                onClick={handleConfirmLink}
              >
                <Link2 className="size-4" />
                Link as Superset ({selectedIds.length} lifts)
              </Button>
              <Button variant="secondary" size="md" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
