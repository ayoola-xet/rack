import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { calculatePlates, formatKg } from "@/lib/workout/stats";
import { cn } from "@/lib/utils";

const PLATE_COLORS: Record<number, string> = {
  25: "bg-red-700 text-white border-red-500",
  20: "bg-blue-700 text-white border-blue-500",
  15: "bg-yellow-600 text-white border-yellow-400",
  10: "bg-emerald-700 text-white border-emerald-500",
  5: "bg-neutral-600 text-white border-neutral-400",
  2.5: "bg-neutral-700 text-neutral-200 border-neutral-500",
  1.25: "bg-neutral-800 text-neutral-300 border-neutral-600",
};

export function PlateCalculatorModal({
  isOpen,
  initialWeightKg,
  onClose,
  onApplyWeight,
}: {
  isOpen: boolean;
  initialWeightKg: number;
  onClose: () => void;
  onApplyWeight?: (weightKg: number) => void;
}) {
  const [weightKg, setWeightKg] = useState<number>(initialWeightKg || 60);
  const [barKg, setBarKg] = useState<number>(20);

  if (!isOpen) return null;

  const result = calculatePlates(weightKg, barKg);

  const stepWeight = (delta: number) => {
    setWeightKg((prev) => Math.max(barKg, Math.round((prev + delta) * 2) / 2));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-border bg-surface p-4 shadow-2xl pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
          <div>
            <h2 className="font-display text-lg font-bold text-fg leading-none">
              Plate Calculator
            </h2>
            <p className="mt-0.5 text-[11px] text-muted">
              Barbell loading breakdown per side
            </p>
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

        {/* Total Weight Stepper / Input */}
        <div className="mt-3.5 rounded-xl bg-surface-2/60 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
              Total Target Weight
            </span>
            <span className="text-xs font-semibold text-accent">
              {formatKg(result.perSideKg)} kg per side
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => stepWeight(-2.5)}
              className="size-9 px-0 text-sm font-bold"
            >
              -2.5
            </Button>
            <Input
              type="number"
              step="0.5"
              min={barKg}
              value={weightKg}
              onChange={(e) => setWeightKg(Math.max(0, Number(e.target.value)))}
              className="text-center font-display text-2xl font-bold h-11"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => stepWeight(2.5)}
              className="size-9 px-0 text-sm font-bold"
            >
              +2.5
            </Button>
          </div>

          {/* Quick pills */}
          <div className="mt-2 flex justify-center gap-1.5">
            {[-10, -5, +5, +10].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => stepWeight(d)}
                className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted hover:text-fg hover:bg-surface-2"
              >
                {d > 0 ? `+${d}` : d} kg
              </button>
            ))}
          </div>
        </div>

        {/* Bar Selector */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted">Barbell weight:</span>
          <div className="flex gap-1">
            {[
              { label: "20kg (Olympic)", kg: 20 },
              { label: "15kg (Women)", kg: 15 },
              { label: "10kg (EZ)", kg: 10 },
            ].map((b) => (
              <button
                key={b.kg}
                type="button"
                onClick={() => setBarKg(b.kg)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  barKg === b.kg
                    ? "bg-primary text-primary-fg font-semibold"
                    : "bg-surface-2 text-muted hover:text-fg",
                )}
              >
                {b.kg}kg
              </button>
            ))}
          </div>
        </div>

        {/* Plates per side breakdown */}
        <div className="mt-3 rounded-xl border border-border/70 bg-bg/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
            Load each side with:
          </p>

          {result.platesPerSide.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {result.platesPerSide.map((p) => {
                const color = PLATE_COLORS[p.weight] ?? "bg-surface-2 text-fg border-border";
                return (
                  <div
                    key={p.weight}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-5 w-12 items-center justify-center rounded border text-[10px] font-bold shadow-xs",
                          color,
                        )}
                      >
                        {p.weight} kg
                      </span>
                      <span className="font-semibold text-fg">
                        {p.count} × {p.weight} kg plate{p.count > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted">
                      = {formatKg(p.count * p.weight)} kg
                    </span>
                  </div>
                );
              })}

              {result.remainderKg > 0.1 && (
                <p className="pt-1 text-[10px] text-short font-medium">
                  Note: {formatKg(result.remainderKg)} kg remaining (smallest plate is 1.25 kg)
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">
              {weightKg <= barKg ? "Empty bar only" : "No plates required"}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {onApplyWeight && (
            <Button
              className="flex-1"
              size="md"
              onClick={() => {
                onApplyWeight(weightKg);
                onClose();
              }}
            >
              Use {formatKg(weightKg)} kg
            </Button>
          )}
          <Button
            variant="secondary"
            className={onApplyWeight ? "" : "w-full"}
            size="md"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
