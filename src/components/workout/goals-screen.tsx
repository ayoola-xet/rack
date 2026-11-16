import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { allExercises } from "@/lib/workout/program";
import {
  bodyWeightTrend,
  exerciseLastSession,
  formatDate,
  formatKg,
  goalProgress,
  latestBodyWeight,
} from "@/lib/workout/stats";
import { useWorkoutStore } from "@/lib/workout/store";
import { AppHeaderTitle, AppShell } from "./shell";
import { TrendLineChart } from "./trend-chart";

export function GoalsScreen() {
  const programs = useWorkoutStore((s) => s.programs);
  const sessions = useWorkoutStore((s) => s.sessions);
  const bodyWeight = useWorkoutStore((s) => s.bodyWeight);
  const goals = useWorkoutStore((s) => s.goals);
  const hydrated = useWorkoutStore((s) => s.hydrated);
  const logBodyWeight = useWorkoutStore((s) => s.logBodyWeight);
  const removeBodyWeight = useWorkoutStore((s) => s.removeBodyWeight);
  const setGoalNote = useWorkoutStore((s) => s.setGoalNote);
  const setBodyWeightGoal = useWorkoutStore((s) => s.setBodyWeightGoal);
  const upsertLiftGoal = useWorkoutStore((s) => s.upsertLiftGoal);
  const removeLiftGoal = useWorkoutStore((s) => s.removeLiftGoal);

  const exercises = allExercises(programs);
  const latestWeight = latestBodyWeight(bodyWeight);
  const weightTrend = bodyWeightTrend(bodyWeight);
  const initialWeight = weightTrend[0]?.value;

  const weightGoalProgress =
    latestWeight && goals.bodyWeightKg != null && initialWeight != null
      ? goalProgress(initialWeight, latestWeight.kg, goals.bodyWeightKg)
      : null;

  const [weightInput, setWeightInput] = useState("");
  const [goalWeightInput, setGoalWeightInput] = useState("");
  const [noteInput, setNoteInput] = useState("");

  const availableLifts = exercises.filter(
    (e) => !goals.lifts.some((g) => g.exerciseId === e.id),
  );
  const [selectedLiftToAdd, setSelectedLiftToAdd] = useState("");
  const liftToAdd = availableLifts.some((e) => e.id === selectedLiftToAdd)
    ? selectedLiftToAdd
    : availableLifts[0]?.id ?? "";

  useEffect(() => {
    if (hydrated) {
      setGoalWeightInput(
        goals.bodyWeightKg == null ? "" : String(goals.bodyWeightKg),
      );
      setNoteInput(goals.note);
    }
  }, [hydrated, goals.bodyWeightKg, goals.note]);

  const handleLogWeight = () => {
    const val = Number(weightInput);
    if (!Number.isFinite(val) || val <= 0) return;
    logBodyWeight(val);
    setWeightInput("");
  };

  const handleSaveGoalWeight = () => {
    if (!goalWeightInput.trim()) {
      setBodyWeightGoal(null);
      return;
    }
    const val = Number(goalWeightInput);
    if (!Number.isFinite(val) || val <= 0) return;
    setBodyWeightGoal(Math.round(val * 10) / 10);
  };

  const handleSaveNote = () => {
    setGoalNote(noteInput.trim());
  };

  const handleAddLiftGoal = () => {
    if (!liftToAdd) return;
    upsertLiftGoal({
      exerciseId: liftToAdd,
      weightKg: null,
      reps: null,
      sets: null,
    });
    const nextAvail = availableLifts.find((l) => l.id !== liftToAdd);
    setSelectedLiftToAdd(nextAvail?.id ?? "");
  };

  return (
    <AppShell nav>
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <AppHeaderTitle />
        <span className="text-xs font-medium uppercase tracking-widest text-subtle">
          Goals
        </span>
      </header>

      <main className="flex-1 px-5 pb-10">
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-fg">
          The chase
        </h1>
        <p className="mt-2 text-sm text-muted">
          One overall aim, a body-weight target, and numbers for the lifts you care about.
        </p>

        {/* Overall Goal Card */}
        <section className="mt-6 rounded-xl bg-surface p-4 shadow-card">
          <Field label="Overall goal">
            <Textarea
              value={noteInput}
              placeholder="Cut to 82 kg. Bench 100 × 6. Own Tuesday back work."
              onChange={(e) => setNoteInput(e.target.value)}
              onBlur={handleSaveNote}
            />
          </Field>
        </section>

        {/* Body Weight Goal Card */}
        <section className="mt-4 rounded-xl bg-surface p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-widest text-subtle">
            Body weight
          </p>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-fg">
            {latestWeight ? `${formatKg(latestWeight.kg)} kg` : "Log your weight"}
          </p>
          {weightGoalProgress != null && (
            <p className="mt-1 text-sm text-muted">
              {Math.round(weightGoalProgress)}% of the way to{" "}
              {formatKg(goals.bodyWeightKg ?? 0)} kg
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Field label="Log now">
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="1"
                placeholder="kg"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
              />
            </Field>

            <Field label="Goal kg">
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="1"
                placeholder="80"
                value={goalWeightInput}
                onChange={(e) => setGoalWeightInput(e.target.value)}
                onBlur={handleSaveGoalWeight}
              />
            </Field>
          </div>

          <Button
            className="mt-3 w-full"
            onClick={handleLogWeight}
            disabled={!weightInput}
          >
            Log weight
          </Button>

          <div className="-mx-2 mt-3">
            <TrendLineChart
              data={weightTrend}
              unit="kg"
              goal={goals.bodyWeightKg}
            />
          </div>

          {bodyWeight.length > 0 && (
            <ul className="mt-2 divide-y divide-border">
              {bodyWeight.slice(0, 6).map((entry) => (
                <li
                  key={entry.id}
                  className="flex h-11 items-center justify-between text-sm"
                >
                  <span className="text-muted">{formatDate(entry.at)}</span>
                  <span className="tabular-nums text-fg">
                    {formatKg(entry.kg)} kg
                  </span>
                  <button
                    type="button"
                    className="text-xs text-subtle hover:text-miss"
                    onClick={() => removeBodyWeight(entry.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Lift Targets Section */}
        <section className="mt-4">
          <h2 className="text-sm font-medium text-fg">Lift targets</h2>
          <p className="mt-1 text-xs text-muted">
            Weight, reps, and sets you are chasing on a lift.
          </p>

          <div className="mt-3 space-y-3">
            {goals.lifts.map((goal) => {
              const ex = exercises.find((e) => e.id === goal.exerciseId);
              const last = exerciseLastSession(sessions, goal.exerciseId);
              const prog =
                last && goal.weightKg
                  ? goalProgress(
                      Math.min(last.weightKg, goal.weightKg * 0.8),
                      last.weightKg,
                      goal.weightKg,
                    )
                  : null;

              return (
                <article
                  key={goal.exerciseId}
                  className="rounded-xl bg-surface p-4 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-fg">
                      {ex?.name ?? "Removed lift"}
                    </p>
                    <button
                      type="button"
                      className="h-11 text-xs text-miss hover:text-miss/80"
                      onClick={() => removeLiftGoal(goal.exerciseId)}
                    >
                      Remove
                    </button>
                  </div>

                  {last ? (
                    <p className="mt-1 text-xs text-muted">
                      Last {formatKg(last.weightKg)}×{last.reps} · {last.sets} sets
                      {prog == null ? "" : ` · ${Math.round(prog)}% to goal kg`}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-subtle">
                      No logged sets yet
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Field label="kg">
                      <Input
                        type="number"
                        min="0"
                        step="2.5"
                        value={goal.weightKg ?? ""}
                        placeholder="100"
                        onChange={(e) =>
                          upsertLiftGoal({
                            ...goal,
                            weightKg:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label="Reps">
                      <Input
                        type="number"
                        min="0"
                        value={goal.reps ?? ""}
                        placeholder="6"
                        onChange={(e) =>
                          upsertLiftGoal({
                            ...goal,
                            reps:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label="Sets">
                      <Input
                        type="number"
                        min="0"
                        value={goal.sets ?? ""}
                        placeholder="3"
                        onChange={(e) =>
                          upsertLiftGoal({
                            ...goal,
                            sets:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                  </div>
                </article>
              );
            })}
          </div>

          {availableLifts.length > 0 ? (
            <div className="mt-3 flex gap-2">
              <Select
                value={liftToAdd}
                onChange={(e) => setSelectedLiftToAdd(e.target.value)}
              >
                {availableLifts.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name || "Untitled"}
                  </option>
                ))}
              </Select>
              <Button variant="secondary" onClick={handleAddLiftGoal}>
                Add
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-subtle">
              Add lifts in Program first, then target them here.
            </p>
          )}
        </section>
      </main>
    </AppShell>
  );
}
