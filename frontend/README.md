# NewsLens Frontend

Next.js frontend for the NewsLens bias-aware Sinhala news aggregation platform. A read-only dashboard that displays events, articles, sources, analytics, and an admin panel for managing pipeline runs.

## Prerequisites

- Node.js 18+
- NewsLens backend running on `http://localhost:8000`

## Setup

```bash
npm install
```

## Running

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000). API requests are proxied to the backend via Next.js rewrites.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Events dashboard — filterable feed of news events with bias bars and source badges |
| `/events/:eventId` | Event detail — side-by-side article comparison with bias labels and distribution chart |
| `/articles/:articleId` | Article detail — full text, bias score breakdown, similar articles |
| `/sources` | All news sources with article counts and latest activity |
| `/analytics` | Dashboard charts — bias distribution, articles per source, daily counts |
| `/admin` | Admin panel — pipeline trigger, status monitoring, run history (requires API key) |

## Bias Color Scheme

| Label | Color | Hex |
|-------|-------|-----|
| Far Left | Deep Red | `#DC2626` |
| Left | Orange | `#EA580C` |
| Center | Gray | `#6B7280` |
| Right | Blue | `#2563EB` |
| Far Right | Deep Blue | `#1E3A8A` |

## Source Branding

| Source | Display Name | Color |
|--------|-------------|-------|
| `hirunews` | Hiru News | `#FF6B00` |
| `bbc_sinhala` | BBC Sinhala | `#BB1919` |
| `lankadeepa` | Lankadeepa | `#1B5E20` |
| `newsfirst` | NewsFirst | `#0D47A1` |
| `divaina` | Divaina | `#6A1B9A` |

## Project Structure

```
src/
  app/
    layout.tsx                    # Root layout with Masthead, DisclaimerBar, Footer
    page.tsx                      # Home — events feed with stats bar and filters
    events/[eventId]/page.tsx     # Event detail with article cards
    articles/[articleId]/page.tsx # Article detail with bias scores and similar articles
    sources/page.tsx              # Sources overview
    analytics/page.tsx            # Analytics dashboard with charts
    admin/page.tsx                # Admin panel (client component, API key auth)
    globals.css                   # CSS variables, Tailwind setup
  components/
    Masthead.tsx                  # Sticky header with logo and nav
    Nav.tsx                       # Primary navigation links
    Footer.tsx                    # Site footer
    DisclaimerBar.tsx             # Bias disclaimer banner
    EventCard.tsx                 # Event card for the feed
    BiasBar.tsx                   # 5-segment horizontal bias distribution bar
    BiasLabel.tsx                 # Colored bias label badge with confidence
    SourceBadge.tsx               # Colored source name badge
    FilterBar.tsx                 # Source and coverage filters
  lib/
    api.ts                        # API fetch functions
    types.ts                      # TypeScript types matching backend schemas
    constants.ts                  # Bias colors, source colors, display names
```

## Building for Production

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t newslens-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE=http://backend:8000/api newslens-frontend
```
