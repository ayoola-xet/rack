import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Plus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { orderedPrograms } from "@/lib/workout/program";
import { useWorkoutStore } from "@/lib/workout/store";
import { AppHeaderTitle, AppShell } from "./shell";
import { TemplatePickerModal } from "./template-picker-modal";

export function ProgramsScreen() {
  const navigate = useNavigate();
  const programs = useWorkoutStore((s) => s.programs);
  const createDay = useWorkoutStore((s) => s.createDay);
  const loadSplitTemplate = useWorkoutStore((s) => s.loadSplitTemplate);
  const ordered = useMemo(() => orderedPrograms(programs), [programs]);

  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const handleAddDay = () => {
    const dayId = createDay();
    void navigate({ to: "/programs/$dayId", params: { dayId } });
  };

  return (
    <AppShell nav>
      <header className="flex items-center justify-between px-4 pt-2.5 pb-1">
        <AppHeaderTitle />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Routines & Split
        </span>
      </header>

      <main className="flex-1 px-4 pb-4">
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
              Your Workout Split
            </h1>
            <p className="mt-0.5 text-xs text-muted">
              Customize your split days or choose a pre-built template.
            </p>
          </div>
        </div>

        {/* Template Quick Loader Button */}
        <div className="mt-3 rounded-xl border border-accent/40 bg-accent/10 p-3 shadow-card flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-accent font-semibold text-xs">
              <Sparkles className="size-3.5" />
              <span>Proven Templates</span>
            </div>
            <p className="text-[11px] text-muted mt-0.5">
              Load PPL (Push/Pull/Legs), Upper/Lower, or Full Body
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowTemplateModal(true)}
            className="font-semibold text-xs shrink-0"
          >
            Browse
          </Button>
        </div>

        {/* Days List */}
        <ul className="mt-3 space-y-2">
          {ordered.map((day) => (
            <li key={day.id}>
              <Link
                to="/programs/$dayId"
                params={{ dayId: day.id }}
                className="flex items-center gap-3 rounded-xl bg-surface p-3.5 shadow-card hover:bg-surface/80 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg font-bold tracking-tight text-fg leading-none">
                      {day.weekday}
                    </p>
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                      {day.split || "Routine"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted">
                    {day.exercises.length} lift{day.exercises.length === 1 ? "" : "s"}
                    {day.exercises.length > 0
                      ? `: ${day.exercises.map((e) => e.name).slice(0, 3).join(", ")}${
                          day.exercises.length > 3 ? "..." : ""
                        }`
                      : " · Tap to add exercises"}
                  </p>
                </div>
                <ChevronRight className="size-4 text-subtle shrink-0" />
              </Link>
            </li>
          ))}
        </ul>

        <Button
          className="mt-4 w-full"
          size="lg"
          variant="secondary"
          onClick={handleAddDay}
        >
          <Plus className="size-4" />
          Add a Custom Day
        </Button>
      </main>

      <TemplatePickerModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={(key) => loadSplitTemplate(key)}
      />
    </AppShell>
  );
}
