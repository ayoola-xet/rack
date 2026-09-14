/** Hostname suitable for absolute share-card URLs. Mirrors the injector guard. */
export function publicShareHost(): string {
  const envHost = String(import.meta.env.VITE_PUBLIC_HOSTNAME ?? "").trim();
  const winHost = typeof window !== "undefined" ? window.location.hostname : "";
  for (const raw of [envHost, winHost]) {
    const host = raw.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
    if (!host || !/^[a-z0-9.-]+$/.test(host) || !host.includes(".")) continue;
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) continue;
    if (host === "vercel.app" || host.endsWith(".vercel.app")) continue;
    if (host === "vercel.com" || host.endsWith(".vercel.com")) continue;
    return host;
  }
  return "";
}

export function shareCardUrl(path: string): string {
  const host = publicShareHost();
  if (!host) return "";
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `https://${host}${suffix}`;
}
