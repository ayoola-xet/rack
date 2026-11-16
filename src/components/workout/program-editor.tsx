import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  GROUP_SUGGESTIONS,
  WEEKDAYS,
} from "@/lib/workout/program";
import { useWorkoutStore } from "@/lib/workout/store";
import type { ExerciseDef, ProgramDay } from "@/lib/workout/types";
import { AppShell, BackLink } from "./shell";

export function ProgramEditor({ dayId }: { dayId: string }) {
  const navigate = useNavigate();
  const programs = useWorkoutStore((s) => s.programs);
  const updateDay = useWorkoutStore((s) => s.updateDay);
  const deleteDay = useWorkoutStore((s) => s.deleteDay);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const updateExercise = useWorkoutStore((s) => s.updateExercise);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const moveExercise = useWorkoutStore((s) => s.moveExercise);

  const day = programs.find((p) => p.id === dayId);

  if (!day) {
    return (
      <AppShell nav>
        <header className="flex items-center px-3 pt-4">
          <BackLink to="/programs" label="Back" />
        </header>
        <p className="px-5 pt-8 text-sm text-muted">That day is gone.</p>
      </AppShell>
    );
  }

  const handleDelete = () => {
    deleteDay(dayId);
    void navigate({ to: "/programs" });
  };

  return (
    <AppShell nav>
      <header className="flex items-center justify-between px-3 pt-4 pb-2">
        <BackLink to="/programs" label="Back to program" />
        <p className="font-display text-lg font-semibold tracking-tight text-fg">
          {day.weekday}
        </p>
        <button
          type="button"
          aria-label="Delete day"
          onClick={handleDelete}
          className="flex size-11 items-center justify-center text-miss hover:text-miss/80"
        >
          <Trash2 className="size-4" />
        </button>
      </header>

      <main className="flex-1 px-5 pb-10">
        <div className="grid grid-cols-2 gap-3">
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

          <Field label="Split">
            <Input
              value={day.split}
              placeholder="Back & Shoulders"
              onChange={(e) => updateDay(dayId, { split: e.target.value })}
            />
          </Field>
        </div>

        <Field className="mt-3" label="Note">
          <Textarea
            value={day.blurb}
            placeholder="You write this day. Add the lifts you actually do."
            onChange={(e) => updateDay(dayId, { blurb: e.target.value })}
          />
        </Field>

        <h2 className="mt-8 text-sm font-medium text-fg">Lifts in order</h2>
        {day.exercises.length === 0 && (
          <p className="mt-2 text-sm text-muted">
            Nothing hardcoded. Add pull-ups, rows, laterals — whatever your {day.weekday} actually is.
          </p>
        )}

        <div className="mt-3 space-y-4">
          {day.exercises.map((ex, idx) => (
            <ExerciseEditorCard
              key={ex.id}
              exercise={ex}
              isFirst={idx === 0}
              isLast={idx === day.exercises.length - 1}
              onChange={(patch) => updateExercise(dayId, ex.id, patch)}
              onRemove={() => removeExercise(dayId, ex.id)}
              onMove={(delta) => moveExercise(dayId, ex.id, delta)}
            />
          ))}
        </div>

        <Button
          className="mt-4"
          size="xl"
          variant="secondary"
          onClick={() => addExercise(dayId)}
        >
          <Plus className="size-4" />
          Add a lift
        </Button>
      </main>

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
}: {
  exercise: ExerciseDef;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<ExerciseDef>) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
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
    <article className="rounded-xl bg-surface p-4 shadow-card">
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
          className="flex size-11 items-center justify-center text-muted disabled:opacity-30 hover:text-fg"
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Move down"
          disabled={isLast}
          onClick={() => onMove(1)}
          className="flex size-11 items-center justify-center text-muted disabled:opacity-30 hover:text-fg"
        >
          <ChevronDown className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Remove lift"
          onClick={onRemove}
          className="flex size-11 items-center justify-center text-miss hover:text-miss/80"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <Field className="mt-3" label="Muscle">
        <Input
          list="rack-groups"
          value={exercise.group}
          placeholder="Shoulders"
          onChange={(e) => onChange({ group: e.target.value })}
        />
      </Field>

      <div className="mt-3 grid grid-cols-3 gap-2">
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
        <Field label="Min reps">
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

      <Field className="mt-3" label="Target load">
        <Select value={loadKind} onChange={(e) => handleLoadKindChange(e.target.value)}>
          <option value="bar">Total kg</option>
          <option value="plates_each_side">Plates each side</option>
          <option value="open">Open — log as I go</option>
        </Select>
      </Field>

      {loadKind === "bar" && (
        <Field className="mt-3" label="Kilograms">
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
        <Field className="mt-3" label="Plate kg each side">
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
