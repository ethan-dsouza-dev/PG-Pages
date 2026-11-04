# Daily Planner: Project Brief

## 1. Overview

A responsive, well-optimized web app that works as a **uniquely visualized daily planner**. Instead of a standard list or grid calendar, the day is rendered through a custom visualization (e.g. a radial 24-hour clock or other non-standard timeline) built with SVG.

This brief covers the **proof of concept (POC)**. Build it so it can grow into a fuller product without a rewrite.

## 2. Goals

- Fast, smooth, and usable from phone to wide desktop.
- A distinctive visualization of the day is the core of the product.
- Offline-capable and local-first, with cloud sync tied to the signed-in user.
- Clean separation between UI, domain logic, and data/auth providers.

## 3. Non-Goals (POC)

- Server-side rendering or SEO.
- Google Calendar read/write sync (planned later; see Roadmap).
- Teams, sharing, or multi-user collaboration.
- Native mobile apps.

## 4. Tech Stack

| Area | Choice | Notes |
|---|---|---|
| Build tool | **Vite** | Fast dev loop, lean bundle |
| Framework | **React + TypeScript** | Strong types for events, durations, recurrence |
| Styling | **Tailwind CSS** | Utility-first |
| UI primitives | **Radix UI / shadcn/ui** | Accessible dialogs, popovers, menus |
| Client state | **Zustand** | Minimal boilerplate |
| Server state | **TanStack Query** | For Supabase sync calls |
| Dates | **date-fns** | No hand-rolled time math (DST/time zones) |
| Local persistence | **Dexie (IndexedDB)** | Local-first, offline use |
| PWA | **vite-plugin-pwa** | Installable, offline shell |
| Auth + backend | **Supabase** (Auth + Postgres) | Google OAuth provider |
| Visualization | **SVG + d3-scale / d3-shape** | D3 for math, React renders the SVG |
| Animation | **Framer Motion** | View transitions, gestures |
| Drag and drop | **dnd-kit** | Rescheduling events |
| Testing | **Vitest + React Testing Library**, **Playwright** | Unit and E2E |

## 5. Authentication

- **Supabase Auth** with the **Google** provider.
- Sign-in scopes only: `openid email profile`. Do not request Calendar scopes in the POC.
- Use the PKCE flow via the Supabase client. No client secrets in the browser.
- Protect user data with **Row Level Security** policies keyed on `auth.uid()`.
- The app must remain usable signed-out (local-only data); signing in enables sync.

## 6. Data Model

Keep the event model **provider-agnostic** so external sources (e.g. Google Calendar) can be added later as adapters.

```ts
type Event = {
  id: string;               // uuid
  userId?: string;          // set when synced
  title: string;
  start: string;            // ISO 8601
  end: string;              // ISO 8601
  timeZone: string;         // IANA tz
  color?: string;
  notes?: string;
  recurrence?: string;      // RRULE string, optional
  source: 'local' | 'google';
  externalId?: string;      // for future provider sync
  updatedAt: string;        // for conflict resolution
  deletedAt?: string;       // soft delete for sync
};
```

## 7. Architecture

- **Local-first:** all reads and writes hit Dexie first. UI never waits on the network.
- **Sync (signed-in):** a background sync layer pushes and pulls changes to a Supabase `events` table, using `updatedAt` (last-write-wins) for the POC.
- **Layers:** `ui/` components, `features/` (planner, auth, sync), `domain/` (event logic, time math), `data/` (Dexie, Supabase adapters).
- **Visualization components** are pure: they take events plus a viewport size and render SVG. Time-to-angle/position mapping lives in `domain/`, not in components.

## 8. Visualization Requirements

- Render the day with SVG using `viewBox` scaling so it adapts to any container.
- Use container queries to switch layouts between phone, tablet, and desktop.
- Isolate high-frequency updates (a ticking "now" indicator) in their own small component so the rest of the view does not re-render.
- Memoize chart components; avoid re-rendering on unrelated state changes.
- Only move to Canvas or PixiJS if profiling shows SVG is a bottleneck. A single day's data should not need it.

## 9. Performance and Quality Targets

- Lighthouse performance score of **90+** on mobile.
- Lazy-load heavier views with `React.lazy`.
- Profile with React Profiler before adding optimizations.
- Accessible: keyboard navigation for all interactions, ARIA labels on visualization elements, sufficient color contrast, and respect for `prefers-reduced-motion`.
- Unit tests for date/time and domain logic; E2E tests for core flows (create, edit, drag, sign-in).

## 10. POC Scope (Milestones)

1. **Scaffold:** Vite + React + TS + Tailwind, linting, formatting, test setup.
2. **Domain + storage:** event types, Dexie persistence, date utilities with tests.
3. **Visualization:** day view rendered in SVG with responsive behavior.
4. **Interaction:** create, edit, delete, and drag-to-reschedule events.
5. **Auth:** Supabase Google sign-in and sign-out, with signed-out mode still working.
6. **Sync:** Supabase `events` table with RLS, plus background sync.
7. **PWA:** installable, offline shell.

## 11. Roadmap (After POC)

- Google Calendar read/write sync. This needs a small backend to hold refresh tokens (authorization code flow with PKCE, tokens stored server-side). Request Calendar scopes incrementally, only when the user opts in. Calendar scopes are classified as sensitive, so production use requires Google app verification.
- Recurrence editing, reminders and notifications, additional visualization modes.

## 12. Open Questions

- Which visualization concept for the day view (radial 24-hour clock, vertical timeline, or something more abstract)?
- Is Calendar sync a firm roadmap item? If so, decide between a small standalone API and moving to Next.js with route handlers.

## 13. Instructions for Claude

- Ask before making architectural decisions not covered here.
- Prefer small, reviewable changes, and work milestone by milestone.
- Keep components pure and typed; no `any`.
- Write tests alongside domain logic.
- Do not add new dependencies outside the stack above without flagging them first.
