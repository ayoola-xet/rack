# RACK

Gym log for a split you actually own. Set the days, log set by set, see what you owe, and drop a session you logged by mistake.

Live: [rackbro.vercel.app](https://rackbro.vercel.app)

## Features

- **Progressive Web App (PWA)**: Installable on iOS, Android, and Desktop with full offline caching via Service Worker.
- **Session Rest Timer & Alarms**:
  - Live session elapsed stopwatch.
  - Auto-starting rest countdown timer between sets.
  - Web Audio API alarms: Melodic Chime, Boxing Bell, Digital Beep, and Gong.
  - 3-2-1 countdown audio ticks and haptic vibration alarms.
  - Web notifications when rest finishes (while the tab is open).
  - Quick-adjust timer buttons (+15s, +30s) and rest presets in Settings.
- **Undo for Mistakes**: deleting a set, discarding a session, or finishing a workout shows a toast with an Undo button.
- **Split & Program Customization**: Full control over your training split and lifts. Load targets only count when you set them — the logger never judges your weights by default.
- **Settings Page**: timer presets, alarm sounds, notifications, and plate-calculator bar weight live on a dedicated `/settings` screen.
- **Progress & Charts**: Track body weight, session volume, and max weight on lifts over time.
- **Offline & Private**: All data stays securely stored in the browser on your device via Zustand persist (`localStorage`). No server database, no account needed.

## Run it

```bash
npm install
npm run dev
```

App: http://localhost:8080

```bash
npm run build
npm run typecheck
```

## Stack

TanStack Start / React 19, Tailwind v4, Zustand (persist), Recharts, Web Audio API, Service Worker PWA.
