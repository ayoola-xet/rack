import { useState } from "react";
import { Check, Dumbbell, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPLIT_TEMPLATES } from "@/lib/workout/program";
import { cn } from "@/lib/utils";

export function TemplatePickerModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateKey: "ppl" | "upper_lower" | "full_body") => void;
}) {
  const [selectedKey, setSelectedKey] = useState<"ppl" | "upper_lower" | "full_body">("ppl");

  if (!isOpen) return null;

  const current = SPLIT_TEMPLATES.find((t) => t.key === selectedKey) ?? SPLIT_TEMPLATES[0];

  const handleApply = () => {
    onSelectTemplate(selectedKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4">
      <div className="flex h-[88vh] sm:h-[620px] w-full max-w-md flex-col rounded-t-2xl sm:rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            <h2 className="font-display text-lg font-bold text-fg">
              Load Workout Template
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

        {/* Template Selector Tabs */}
        <div className="p-4 pb-2 shrink-0 space-y-2">
          <p className="text-xs text-muted">
            Choose a proven workout program to replace your current days:
          </p>

          <div className="grid grid-cols-3 gap-1.5">
            {SPLIT_TEMPLATES.map((tmpl) => {
              const isSelected = selectedKey === tmpl.key;
              return (
                <button
                  key={tmpl.key}
                  type="button"
                  onClick={() => setSelectedKey(tmpl.key as any)}
                  className={cn(
                    "rounded-xl p-2.5 text-center transition-all border",
                    isSelected
                      ? "border-accent bg-accent/10 text-fg shadow-card"
                      : "border-border/60 bg-surface-2 text-muted hover:text-fg",
                  )}
                >
                  <p className="font-display text-sm font-bold truncate">
                    {tmpl.key === "ppl"
                      ? "PPL Split"
                      : tmpl.key === "upper_lower"
                        ? "Upper / Lower"
                        : "Full Body"}
                  </p>
                  <p className="text-[10px] text-subtle mt-0.5">
                    {tmpl.days.length} days/week
                  </p>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-muted italic px-1">
            {current.description}
          </p>
        </div>

        {/* Days & Exercises Preview */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {current.days.map((day) => (
            <div
              key={day.weekday}
              className="rounded-xl border border-border/60 bg-surface-2/60 p-3 shadow-xs"
            >
              <div className="flex items-baseline justify-between border-b border-border/40 pb-1.5">
                <span className="font-display text-base font-bold text-fg">
                  {day.weekday} · {day.split}
                </span>
                <span className="text-[11px] text-muted font-medium">
                  {day.exercises.length} lifts
                </span>
              </div>

              <div className="mt-2 space-y-1">
                {day.exercises.map((ex, idx) => (
                  <div
                    key={ex.name + idx}
                    className="flex items-center justify-between text-xs py-0.5 text-muted"
                  >
                    <span className="truncate text-fg font-medium">{ex.name}</span>
                    <span className="shrink-0 text-[11px] text-subtle">
                      {ex.minSets} sets · {ex.minReps}+ reps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="border-t border-border px-4 pt-3 shrink-0 bg-surface flex gap-2">
          <Button
            className="flex-1 font-semibold"
            size="lg"
            onClick={handleApply}
          >
            <Check className="size-4" />
            Load {current.name}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
