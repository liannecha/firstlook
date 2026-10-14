# FirstLook

A mobile-friendly React web app built with Next.js App Router, TypeScript, Tailwind CSS, and ESLint.

## Local development

```sh
cd /Users/lianne/Documents/FirstLook
npm run dev
```

Open http://localhost:3000 in your browser. On another machine, install dependencies first with `npm ci`.

## Checks

```sh
npm run lint
npm run build
```

Run `npm start` to serve the production build after building.

## Current scope

Includes a responsive YouTube founder video feed, collapsible discovery sidebar, and a watchlist stored locally in this browser. Founder stories live in `src/app/founders.ts`; add entries there to extend the feed. The initial story is Spencer Matonis of Edulis Therapeutics, starting at 37 seconds. There are no accounts or backend. See `BACKLOG.md` for deferred comments/discussions.
