import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { orderedPrograms } from "@/lib/workout/program";
import { useWorkoutStore } from "@/lib/workout/store";
import { AppHeaderTitle, AppShell } from "./shell";

export function ProgramsScreen() {
  const navigate = useNavigate();
  const programs = useWorkoutStore((s) => s.programs);
  const createDay = useWorkoutStore((s) => s.createDay);
  const ordered = useMemo(() => orderedPrograms(programs), [programs]);

  const handleAddDay = () => {
    const dayId = createDay();
    void navigate({ to: "/programs/$dayId", params: { dayId } });
  };

  return (
    <AppShell nav>
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <AppHeaderTitle />
        <span className="text-xs font-medium uppercase tracking-widest text-subtle">
          Program
        </span>
      </header>

      <main className="flex-1 px-5 pb-10">
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-fg">
          Your days
        </h1>
        <p className="mt-2 text-sm text-muted">
          You own the program. Monday is seeded. Tuesday is back and shoulders — add the lifts you actually do.
        </p>

        <ul className="mt-6 space-y-3">
          {ordered.map((day) => (
            <li key={day.id}>
              <Link
                to="/programs/$dayId"
                params={{ dayId: day.id }}
                className="flex items-center gap-3 rounded-xl bg-surface px-4 py-4 shadow-card hover:bg-surface/80 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl font-semibold tracking-tight text-fg">
                    {day.weekday}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {day.split || "No split name"} · {day.exercises.length} lift
                    {day.exercises.length === 1 ? "" : "s"}
                  </p>
                </div>
                <ChevronRight className="size-4 text-subtle" />
              </Link>
            </li>
          ))}
        </ul>

        <Button
          className="mt-6"
          size="xl"
          variant="secondary"
          onClick={handleAddDay}
        >
          <Plus className="size-4" />
          Add a day
        </Button>
      </main>
    </AppShell>
  );
}
