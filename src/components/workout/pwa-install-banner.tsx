import { Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallBanner({ hasNav = false }: { hasNav?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default true until checked
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Check if dismissed before
    const isDismissed = localStorage.getItem("rack_pwa_dismissed") === "true";
    if (isDismissed) {
      setDismissed(true);
      return;
    }
    setDismissed(false);

    // Check if already in standalone / installed mode
    const inStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(inStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  if (isStandalone || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("rack_pwa_dismissed", "true");
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        handleDismiss();
      }
    } else if (isIOS) {
      setShowIOSPrompt(true);
    }
  };

  if (!deferredPrompt && !isIOS) return null;

  return (
    <aside
      aria-label="Install RACK"
      className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-sm z-30 transition-all ${
        hasNav
          ? "bottom-[calc(3.75rem+env(safe-area-inset-bottom)+0.5rem)]"
          : "bottom-3"
      }`}
    >
      <div className="rounded-xl border border-border/90 bg-surface/95 backdrop-blur-md p-2.5 shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-accent">
              <Download className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-fg leading-none truncate">Install RACK</p>
              <p className="text-[10px] text-muted truncate mt-0.5">Works offline on gym floor</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="sm" className="h-7 px-2.5 text-[11px]" onClick={handleInstallClick}>
              Install
            </Button>
            <button
              type="button"
              aria-label="Dismiss banner"
              onClick={handleDismiss}
              className="flex size-7 items-center justify-center rounded text-subtle hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {showIOSPrompt && (
          <div className="mt-2 rounded-lg bg-surface-2 p-2 text-[11px] text-fg border border-border/50">
            <p className="flex items-center gap-1 font-medium">
              <Share2 className="size-3 text-accent" /> Tap <span className="font-semibold">Share</span> in Safari
            </p>
            <p className="mt-0.5 text-[10px] text-muted">
              Select <span className="text-fg font-medium">&quot;Add to Home Screen&quot;</span>.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
