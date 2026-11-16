import { Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSPrompt(true);
    }
  };

  if (!deferredPrompt && !isIOS) return null;

  return (
    <div className="mx-4 mb-2 rounded-xl border border-border bg-surface p-3.5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg">
            <Download className="size-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-fg">Install RACK App</p>
            <p className="text-xs text-muted">Use offline on gym floor with zero lag</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss banner"
          onClick={() => setDismissed(true)}
          className="text-subtle hover:text-muted"
        >
          <X className="size-4" />
        </button>
      </div>

      {showIOSPrompt ? (
        <div className="mt-3 rounded-lg bg-surface-2 p-2.5 text-xs text-fg">
          <p className="flex items-center gap-1.5 font-medium">
            <Share2 className="size-3.5 text-accent" /> Tap <span className="font-semibold">Share</span> in Safari
          </p>
          <p className="mt-1 text-muted">Then select <span className="text-fg font-medium">&quot;Add to Home Screen&quot;</span> to install.</p>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1" onClick={handleInstallClick}>
            Install App
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
            Not now
          </Button>
        </div>
      )}
    </div>
  );
}
