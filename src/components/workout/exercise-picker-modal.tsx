import { Search, X, Plus, Dumbbell } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  EXERCISE_LIBRARY,
  GROUP_SUGGESTIONS,
  createExerciseFromLibrary,
  newExercise,
  withCue,
  type LibraryExercise,
} from "@/lib/workout/program";
import type { ExerciseDef } from "@/lib/workout/types";

export function ExercisePickerModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseDef) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((ex) => {
      const matchGroup = selectedGroup === "All" || ex.group === selectedGroup;
      const matchSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.group.toLowerCase().includes(q);
      return matchGroup && matchSearch;
    });
  }, [search, selectedGroup]);

  if (!isOpen) return null;

  const handleSelectLibrary = (lib: LibraryExercise) => {
    const exercise = createExerciseFromLibrary(lib);
    onSelect(exercise);
    onClose();
  };

  const handleCreateCustom = () => {
    const custom = newExercise();
    custom.name = search.trim() || "Custom Exercise";
    custom.group = selectedGroup === "All" ? "Chest" : selectedGroup;
    onSelect(withCue(custom));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4">
      <div className="flex h-[85vh] sm:h-[600px] w-full max-w-md flex-col rounded-t-2xl sm:rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <Dumbbell className="size-4 text-accent" />
            <h2 className="font-display text-lg font-bold text-fg">
              Add Exercise
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              type="text"
              placeholder="Search 40+ exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
              autoFocus
            />
          </div>

          {/* Muscle Group Pills */}
          <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {["All", ...GROUP_SUGGESTIONS].map((group) => {
              const isActive = selectedGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedGroup(group)}
                  className={cn(
                    "h-7 shrink-0 rounded-full px-2.5 text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-primary text-primary-fg"
                      : "bg-surface-2 text-muted hover:text-fg",
                  )}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto px-4 py-1 divide-y divide-border/40">
          {filtered.length > 0 ? (
            filtered.map((ex) => (
              <button
                key={ex.name}
                type="button"
                onClick={() => handleSelectLibrary(ex)}
                className="flex w-full items-center justify-between py-2.5 text-left transition-colors hover:bg-surface-2/60 rounded-lg px-2 -mx-2"
              >
                <div>
                  <p className="text-sm font-semibold text-fg leading-snug">
                    {ex.name}
                  </p>
                  <p className="text-[11px] text-muted">
                    {ex.group} · {ex.minSets} sets × {ex.minReps} reps
                  </p>
                </div>
                <span className="flex size-7 items-center justify-center rounded-md bg-surface-2 text-muted hover:text-fg">
                  <Plus className="size-3.5" />
                </span>
              </button>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-xs text-muted">No matching exercises found.</p>
              {search.trim() && (
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={handleCreateCustom}
                >
                  <Plus className="size-3.5" />
                  Add "{search.trim()}" as custom lift
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer with custom add option */}
        {filtered.length > 0 && search.trim() && (
          <div className="border-t border-border px-4 py-2 shrink-0 bg-surface-2/40">
            <button
              type="button"
              onClick={handleCreateCustom}
              className="flex w-full items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-accent hover:underline"
            >
              <Plus className="size-3.5" />
              Add custom lift: "{search.trim()}"
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
