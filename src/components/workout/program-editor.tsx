import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Link2, Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  GROUP_SUGGESTIONS,
  WEEKDAYS,
} from "@/lib/workout/program";
import { useWorkoutStore } from "@/lib/workout/store";
import type { ExerciseDef } from "@/lib/workout/types";
import { AppShell, BackLink } from "./shell";
import { ExercisePickerModal } from "./exercise-picker-modal";
import { SupersetModal } from "./superset-modal";

export function ProgramEditor({ dayId }: { dayId: string }) {
  const navigate = useNavigate();
  const programs = useWorkoutStore((s) => s.programs);
  const updateDay = useWorkoutStore((s) => s.updateDay);
  const deleteDay = useWorkoutStore((s) => s.deleteDay);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const updateExercise = useWorkoutStore((s) => s.updateExercise);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const moveExercise = useWorkoutStore((s) => s.moveExercise);
  const linkProgramSuperset = useWorkoutStore((s) => s.linkProgramSuperset);
  const unlinkProgramSuperset = useWorkoutStore((s) => s.unlinkProgramSuperset);

  const [showPicker, setShowPicker] = useState(false);
  const [selectedForSuperset, setSelectedForSuperset] = useState<ExerciseDef | null>(null);

  const day = programs.find((p) => p.id === dayId);

  if (!day) {
    return (
      <AppShell nav>
        <header className="flex items-center px-3 pt-2.5">
          <BackLink to="/programs" label="Back" />
        </header>
        <p className="px-4 pt-4 text-xs text-muted">That day does not exist.</p>
      </AppShell>
    );
  }

  const handleDelete = () => {
    deleteDay(dayId);
    void navigate({ to: "/programs" });
  };

  return (
    <AppShell nav>
      <header className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-border/40">
        <BackLink to="/programs" label="Back to program" />
        <p className="font-display text-base font-bold tracking-tight text-fg">
          {day.weekday}
        </p>
        <button
          type="button"
          aria-label="Delete day"
          onClick={handleDelete}
          className="flex size-8 items-center justify-center rounded-lg text-miss hover:text-miss/80 hover:bg-surface"
        >
          <Trash2 className="size-4" />
        </button>
      </header>

      <main className="flex-1 px-4 pb-4">
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <Field label="Day">
            <Select
              value={(WEEKDAYS as readonly string[]).includes(day.weekday) ? day.weekday : "Custom"}
              onChange={(e) => {
                const val = e.target.value === "Custom" ? day.weekday : e.target.value;
                updateDay(dayId, { weekday: val });
              }}
            >
              {WEEKDAYS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
              <option value="Custom">Custom</option>
            </Select>
          </Field>

          <Field label="Split Name">
            <Input
              value={day.split}
              placeholder="e.g. Chest & Triceps"
              onChange={(e) => updateDay(dayId, { split: e.target.value })}
            />
          </Field>
        </div>

        <Field className="mt-2" label="Focus / Note">
          <Textarea
            value={day.blurb}
            placeholder="Focus cue or notes for the day..."
            onChange={(e) => updateDay(dayId, { blurb: e.target.value })}
          />
        </Field>

        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Lifts in Routine ({day.exercises.length})
          </h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowPicker(true)}
            className="text-xs font-semibold"
          >
            <Plus className="size-3.5" />
            Add Lift
          </Button>
        </div>

        {day.exercises.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-xs text-muted">No lifts in this routine yet.</p>
            <Button
              className="mt-3 font-semibold"
              size="md"
              onClick={() => setShowPicker(true)}
            >
              <Plus className="size-4" />
              Add Exercise from Library
            </Button>
          </div>
        ) : (
          <div className="mt-2.5 space-y-2">
            {day.exercises.map((ex, idx) => (
              <ExerciseEditorCard
                key={ex.id}
                exercise={ex}
                isFirst={idx === 0}
                isLast={idx === day.exercises.length - 1}
                onChange={(patch) => updateExercise(dayId, ex.id, patch)}
                onRemove={() => removeExercise(dayId, ex.id)}
                onMove={(delta) => moveExercise(dayId, ex.id, delta)}
                onManageSuperset={() => setSelectedForSuperset(ex)}
              />
            ))}
          </div>
        )}

        {day.exercises.length > 0 && (
          <Button
            className="mt-3.5 w-full"
            size="lg"
            variant="secondary"
            onClick={() => setShowPicker(true)}
          >
            <Plus className="size-4" />
            Add Another Lift
          </Button>
        )}
      </main>

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(exercise) => addExercise(dayId, exercise)}
      />

      {/* Superset Modal */}
      {selectedForSuperset && (
        <SupersetModal
          isOpen={true}
          currentExercise={selectedForSuperset}
          allExercises={day.exercises}
          currentSupersetId={selectedForSuperset.supersetId ?? null}
          onClose={() => setSelectedForSuperset(null)}
          onLink={(ids) => {
            linkProgramSuperset(dayId, ids);
            setSelectedForSuperset(null);
          }}
          onUnlink={(id) => {
            unlinkProgramSuperset(dayId, id);
            setSelectedForSuperset(null);
          }}
        />
      )}

      <datalist id="rack-groups">
        {GROUP_SUGGESTIONS.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
    </AppShell>
  );
}

function ExerciseEditorCard({
  exercise,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMove,
  onManageSuperset,
}: {
  exercise: ExerciseDef;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<ExerciseDef>) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
  onManageSuperset: () => void;
}) {
  const loadKind = exercise.load.kind;

  const handleLoadKindChange = (newKind: string) => {
    if (newKind === "open") {
      onChange({ load: { kind: "open" } });
    } else if (newKind === "bar") {
      onChange({
        load: {
          kind: "bar",
          kg: exercise.load.kind === "bar" ? exercise.load.kg : 60,
        },
      });
    } else {
      onChange({
        load: {
          kind: "plates_each_side",
          plateKg: exercise.load.kind === "plates_each_side" ? exercise.load.plateKg : 15,
        },
      });
    }
  };

  return (
    <article className="rounded-xl bg-surface p-3 shadow-card">
      <div className="flex items-center gap-1">
        <Input
          value={exercise.name}
          placeholder="Lift name"
          onChange={(e) => onChange({ name: e.target.value })}
          className="font-medium"
        />
        <button
          type="button"
          aria-label="Move up"
          disabled={isFirst}
          onClick={() => onMove(-1)}
          className="flex size-8 items-center justify-center rounded text-muted disabled:opacity-30 hover:text-fg hover:bg-surface-2"
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Move down"
          disabled={isLast}
          onClick={() => onMove(1)}
          className="flex size-8 items-center justify-center rounded text-muted disabled:opacity-30 hover:text-fg hover:bg-surface-2"
        >
          <ChevronDown className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Remove lift"
          onClick={onRemove}
          className="flex size-8 items-center justify-center rounded text-miss hover:text-miss/80 hover:bg-surface-2"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex-1">
          <Input
            list="rack-groups"
            value={exercise.group}
            placeholder="Muscle (e.g. Chest, Back)"
            onChange={(e) => onChange({ group: e.target.value })}
            className="h-8 text-xs"
          />
        </div>

        {/* Superset Button */}
        {exercise.supersetId ? (
          <button
            type="button"
            onClick={onManageSuperset}
            className="flex items-center gap-1 rounded-md bg-purple-950/60 border border-purple-500/40 px-2 py-1 text-[11px] font-bold text-purple-300 hover:bg-purple-900/60"
          >
            <Zap className="size-3 text-purple-400 fill-current" />
            <span>Superset {exercise.supersetId}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onManageSuperset}
            className="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-[11px] font-semibold text-muted hover:text-fg"
          >
            <Link2 className="size-3" />
            <span>+ Superset</span>
          </button>
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <Field label="Min sets">
          <Input
            type="number"
            min={1}
            max={20}
            value={exercise.minSets}
            onChange={(e) =>
              onChange({ minSets: Math.max(1, Number(e.target.value) || 1) })
            }
          />
        </Field>
        <Field label="Max sets">
          <Input
            type="number"
            min={1}
            max={20}
            value={exercise.maxSets}
            onChange={(e) =>
              onChange({
                maxSets: Math.max(exercise.minSets, Number(e.target.value) || exercise.minSets),
              })
            }
          />
        </Field>
        <Field label="Target reps">
          <Input
            type="number"
            min={1}
            max={50}
            value={exercise.minReps}
            onChange={(e) =>
              onChange({ minReps: Math.max(1, Number(e.target.value) || 1) })
            }
          />
        </Field>
      </div>

      <Field className="mt-2" label="Target load">
        <Select value={loadKind} onChange={(e) => handleLoadKindChange(e.target.value)}>
          <option value="bar">Target kg (Barbell / Dumbbell total)</option>
          <option value="plates_each_side">Plates each side</option>
          <option value="open">Open — log weight as I go</option>
        </Select>
      </Field>

      {loadKind === "bar" && (
        <Field className="mt-2" label="Target kg">
          <Input
            type="number"
            min={0}
            step="2.5"
            value={exercise.load.kind === "bar" ? exercise.load.kg : 0}
            onChange={(e) =>
              onChange({
                load: { kind: "bar", kg: Math.max(0, Number(e.target.value) || 0) },
              })
            }
          />
        </Field>
      )}

      {loadKind === "plates_each_side" && (
        <Field className="mt-2" label="Plate kg each side">
          <Input
            type="number"
            min={0}
            step="1.25"
            value={
              exercise.load.kind === "plates_each_side"
                ? exercise.load.plateKg
                : 0
            }
            onChange={(e) =>
              onChange({
                load: {
                  kind: "plates_each_side",
                  plateKg: Math.max(0, Number(e.target.value) || 0),
                },
              })
            }
          />
        </Field>
      )}
    </article>
  );
}
