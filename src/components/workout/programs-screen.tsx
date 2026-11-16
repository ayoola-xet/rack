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
      <header className="flex items-center justify-between px-4 pt-2.5 pb-1">
        <AppHeaderTitle />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Program
        </span>
      </header>

      <main className="flex-1 px-4 pb-4">
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-fg">
          Your days
        </h1>
        <p className="mt-0.5 text-xs text-muted">
          Monday is chest & arms. Tuesday is back & shoulders. Customize to your split.
        </p>

        <ul className="mt-3 space-y-2">
          {ordered.map((day) => (
            <li key={day.id}>
              <Link
                to="/programs/$dayId"
                params={{ dayId: day.id }}
                className="flex items-center gap-2.5 rounded-xl bg-surface px-3.5 py-3 shadow-card hover:bg-surface/80 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-bold tracking-tight text-fg">
                    {day.weekday}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
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
          className="mt-4"
          size="lg"
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
