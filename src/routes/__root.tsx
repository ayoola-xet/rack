import { useLayoutEffect, type ReactNode } from "react";
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
        { title: APP_NAME },
        { name: "theme-color", content: "#0e0e0c" },
        {
          name: "description",
          content: "Build your split. Log each set. Track weight, goals, and improvement.",
        },
        ...(xBanner ? [{ property: "x:game:image", content: xBanner }] : []),
      ],
      links: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/__grok/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      ],
    };
  },
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg font-sans text-fg">
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

  return children;
}
