# RACK

Gym log for a split you actually own. Set the days, log set by set, see what you owe, and drop a session you logged by mistake.

Live: [rackbro.grok.me](https://rackbro.grok.me)

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

## What it keeps

Programs, sessions, body weight, and goals stay **in the browser** on that device. There is no server database and no account. Clearing site data for the host wipes the log.

## Stack

TanStack Start, React 19, Tailwind v4, Zustand (persist).
