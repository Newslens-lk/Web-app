# NewsLens.lk — frontend (Next.js)

Bias-aware Sinhala news aggregation platform — the reader-facing web app.
Part of Group 17's CS3501 Data Science and Engineering Project, University of Moratuwa.

The project docs (SRS, Software Architecture Document, feasibility report,
Gantt chart, project idea/proposal) live in the sibling folder
`../lknews_frontend/documents/`. The HTML prototype the team approved lives at
`../lknews_frontend/` — this Next.js app is a port of that prototype's approved
design.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Node 22

Per SRS §3.6.1 (Frontend Development Constraints).

## Getting started

Node 20+ required (developed against Node 22).

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Other scripts:

```bash
npm run build   # production build + type-check
npm run start   # serve the production build
npm run lint    # ESLint
```

## What's in the first pass

Only the **app shell + Home feed** are wired up. The other four routes
(`/story`, `/sources`, `/check`, `/about`) render a "coming next" placeholder
so the top nav works without 404s. The full versions from the approved HTML
prototype get ported after review of this pass.

## Structure

```
src/
├── app/
│   ├── layout.tsx        Root layout — masthead, disclaimer bar, footer
│   ├── page.tsx          Home feed
│   ├── globals.css       Design tokens (light + dark) and base styles
│   ├── story/            "Coming next" stub
│   ├── sources/          "Coming next" stub
│   ├── check/            "Coming next" stub
│   └── about/            "Coming next" stub
├── components/
│   ├── Masthead.tsx      Sticky top bar with logo + nav
│   ├── Nav.tsx           Primary nav (client component — reads pathname)
│   ├── DisclaimerBar.tsx Model-prediction / demo-data disclaimer
│   ├── Footer.tsx        Site footer
│   ├── FilterBar.tsx     Home-feed search + selects
│   ├── EventCard.tsx     One event tile
│   ├── SpectrumBar.tsx   5-segment bias distribution bar
│   ├── OutletStack.tsx   Overlapping outlet avatars
│   └── ComingSoon.tsx    Stub content for unbuilt routes
└── lib/
    └── mock-events.ts    Typed placeholder events (Event, Outlet, BiasBucket)
```

## Design tokens

Colors, typography, and shadow tokens live in `src/app/globals.css` as CSS
custom properties, then re-exported to Tailwind via `tailwind.config.ts` so
they're usable as utility classes (`bg-surface`, `text-ink-dim`, `border-rule`,
`text-spec-fr`, etc.).

Theme resolution follows the three-state model the mockup used:

1. Bare `:root` defines the light palette (default when nothing is stamped).
2. `@media (prefers-color-scheme: dark)` gated by
   `:root:not([data-theme="light"])` applies the dark palette when the OS is
   dark and the user hasn't explicitly chosen light.
3. `:root[data-theme="dark"]` re-applies the dark palette so an explicit
   toggle wins in both directions.

To force a theme for testing, set `data-theme="light"` or `data-theme="dark"`
on the `<html>` element in your browser devtools.

## Placeholder data — important

Every value under `src/lib/mock-events.ts` is illustrative. Outlet names are
real Sri Lankan publishers cited in our own SRS references, but their bias
values, article counts, and coverage flags are demo data for building the UI
against — never present them as real assessments.

The disclaimer bar in the app shell surfaces this to any user viewing the
prototype.

## Next steps

- Port the Event detail / Compare Story view from the HTML prototype
- Port Sources, Check an Article, About
- Wire to a `NEXT_PUBLIC_API_BASE` env pointing at the FastAPI backend once it
  exists (per SAD §7 Deployment View)
- Replace `mock-events.ts` with real fetches
