import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChartNoAxesColumn,
  ChevronLeft,
  Dumbbell,
  House,
  Target,
  WifiOff,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PwaInstallBanner } from "./pwa-install-banner";

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
        "mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      {isOffline && (
        <div className="flex items-center justify-center gap-1.5 bg-surface-2 px-3 py-1.5 text-xs font-medium text-subtle">
          <WifiOff className="size-3.5 text-short" />
          <span>Offline mode — your logs stay safely saved on this device</span>
        </div>
      )}
      <div className={cn("flex min-h-0 flex-1 flex-col", nav && "pb-16")}>{children}</div>
      <PwaInstallBanner />
      {nav && <BottomNav />}
    </div>
  );
}

export function AppHeaderTitle({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("font-display text-2xl font-semibold tracking-tight text-fg", className)}>
      RACK
    </Link>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: House, exact: true },
  { to: "/progress", label: "Progress", icon: ChartNoAxesColumn, exact: false },
  { to: "/programs", label: "Program", icon: Dumbbell, exact: false },
  { to: "/goals", label: "Goals", icon: Target, exact: false },
] as const;

export function BottomNav() {
  const currentPath = useRouterState({
    select: (s) => s.location.pathname,
  });

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)]">
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
              "flex h-14 min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
              isActive ? "text-fg font-semibold" : "text-subtle hover:text-muted",
            )}
          >
            <Icon className="size-4" strokeWidth={isActive ? 2.4 : 2} />
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
      className="flex size-11 items-center justify-center text-muted hover:text-fg"
    >
      <ChevronLeft className="size-5" />
    </Link>
  );
}
