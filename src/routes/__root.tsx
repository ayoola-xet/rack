import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { rehydrateWorkoutStore, useWorkoutStore } from "@/lib/workout/store";
import { APP_NAME } from "@/lib/workout/program";
import { shareCardUrl } from "@/lib/og/share-host";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => {
    const xBanner = shareCardUrl("/x-banner.jpg");
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { title: `${APP_NAME} — Gym Split & Workout Log` },
        { name: "theme-color", content: "#0e0e0c" },
        {
          name: "description",
          content: "Build your split. Log each set. Session timer, audio alarms, body weight, and progress charts.",
        },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: APP_NAME },
        { name: "mobile-web-app-capable", content: "yes" },
        ...(xBanner ? [{ property: "x:game:image", content: xBanner }] : []),
      ],
      links: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      ],
    };
  },
  component: RootDocument,
});

function RootDocument() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[RACK] Service Worker active:", reg.scope);
          })
          .catch((err) => {
            console.warn("[RACK] Service Worker registration:", err);
          });
      });
    }
  }, []);

  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg font-sans text-fg selection:bg-accent/20">
        <PreviewHostBridge />
        <AuthProvider>
          <StoreHydrate>
            <Outlet />
          </StoreHydrate>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function StoreHydrate({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    void Promise.resolve(rehydrateWorkoutStore()).finally(() => {
      useWorkoutStore.setState({ hydrated: true });
    });
  }, []);

  return <>{children}</>;
}
