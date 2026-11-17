import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChartNoAxesColumn,
  ChevronLeft,
  Dumbbell,
  House,
  Settings,
  Target,
  Undo2,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { soundAlarm } from "@/lib/workout/audio-alarm";
import { selectActiveSession, useWorkoutStore, type Toast } from "@/lib/workout/store";
import { PwaInstallBanner } from "./pwa-install-banner";

// Module-level guard so a rest alarm fires exactly once per countdown,
// no matter which screen the user is on.
const firedAlarms = new Set<number>();

export function RestAlarmManager() {
  const restUntil = useWorkoutStore((s) => s.restUntil);
  const settings = useWorkoutStore((s) => s.timerSettings);
  const session = useWorkoutStore(selectActiveSession);
  const lastBeepRef = useRef(0);

  useEffect(() => {
    if (!restUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= restUntil) {
        if (!firedAlarms.has(restUntil)) {
          firedAlarms.add(restUntil);
          if (settings.alarmSound) {
            soundAlarm.playAlarm(settings.alarmSoundType);
          }
          if (settings.alarmVibrate) {
            soundAlarm.vibrate([200, 100, 200, 100, 400]);
          }
          if (settings.alarmNotifications) {
            soundAlarm.sendNotification("Rest time finished!", {
              body: session
                ? `Time for your next set of ${session.title || "the workout"}.`
                : "Time for your next set.",
            });
          }
        }
      } else if (settings.countdownBeeps) {
        const sec = Math.ceil((restUntil - now) / 1000);
        if (sec <= 3 && sec > 0 && lastBeepRef.current !== sec) {
          lastBeepRef.current = sec;
          soundAlarm.playCountdownBeep(sec === 1);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [
    restUntil,
    settings.alarmSound,
    settings.alarmSoundType,
    settings.alarmVibrate,
    settings.alarmNotifications,
    settings.countdownBeeps,
    session,
  ]);

  return null;
}

export function Toasts({ hasNav = false }: { hasNav?: boolean }) {
  const toasts = useWorkoutStore((s) => s.toasts);
  const dismissToast = useWorkoutStore((s) => s.dismissToast);
  const restoreLastUndo = useWorkoutStore((s) => s.restoreLastUndo);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) => setTimeout(() => dismissToast(t.id), 6000));
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 flex-col gap-1.5",
        hasNav
          ? "bottom-[calc(3.75rem+env(safe-area-inset-bottom)+0.5rem)]"
          : "bottom-4",
      )}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-fg shadow-lg",
            toast.tone === "danger" && "border-miss/50",
          )}
        >
          <span>{toast.message}</span>
          <div className="flex items-center gap-1.5">
            {toast.canUndo && (
              <button
                type="button"
                onClick={() => {
                  restoreLastUndo();
                  dismissToast(toast.id);
                }}
                className="flex items-center gap-1 rounded bg-surface-2 px-2 py-1 text-[11px] font-bold text-accent hover:bg-surface-2/80"
              >
                <Undo2 className="size-3.5" />
                Undo
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(toast.id)}
              className="flex size-6 items-center justify-center rounded text-subtle hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppShell({
  children,
  className,
  nav = false,
}: {
  children: ReactNode;
  className?: string;
  nav?: boolean;
}) {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      {isOffline && (
        <div className="flex items-center justify-center gap-1.5 bg-surface-2 px-3 py-1 text-[11px] font-medium text-subtle border-b border-border/40">
          <WifiOff className="size-3 text-short" />
          <span>Offline mode — workout logs are safely saved locally</span>
        </div>
      )}
      <div className={cn("flex min-h-0 flex-1 flex-col", nav && "pb-20")}>{children}</div>
      <RestAlarmManager />
      <Toasts hasNav={nav} />
      <PwaInstallBanner hasNav={nav} />
      {nav && <BottomNav />}
    </div>
  );
}

export function AppHeaderTitle({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("font-display text-xl font-bold tracking-tight text-fg", className)}>
      RACK
    </Link>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: House, exact: true },
  { to: "/programs", label: "Program", icon: Dumbbell, exact: false },
  { to: "/progress", label: "Progress", icon: ChartNoAxesColumn, exact: false },
  { to: "/goals", label: "Goals", icon: Target, exact: false },
  { to: "/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function BottomNav() {
  const currentPath = useRouterState({
    select: (s) => s.location.pathname,
  });

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 border-t border-border/80 bg-bg/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? currentPath === item.to
          : currentPath === item.to || currentPath.startsWith(`${item.to}/`);

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex h-13 min-h-10 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              isActive ? "text-fg font-semibold" : "text-subtle hover:text-muted",
            )}
          >
            <Icon className="size-4" strokeWidth={isActive ? 2.4 : 1.9} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-md text-muted hover:text-fg hover:bg-surface"
    >
      <ChevronLeft className="size-4" />
    </Link>
  );
}
