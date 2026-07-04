# TaskCanvas — Frontend

Frontend for **TaskCanvas**, a 2-in-1 app combining a date-based Kanban task
board (`/tasks`) and a polygon image-annotation tool (`/annotate`), built for
the "404 Project Not Found" assignment. This repo is the Next.js client; it
talks to a separate Django REST backend over HTTP.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**, `src/` directory
- **Tailwind CSS v4** + **shadcn/ui** for styling and UI primitives
- **Zustand** for cross-component state (auth, selected date + tasks, annotation shapes)
- **@dnd-kit** for the Kanban drag-and-drop
- **react-konva** for the polygon annotation canvas
- **axios** as the API client, with an interceptor that attaches the auth token
- **react-hook-form + zod** for form validation

## Prerequisites

- Node.js **v24.11.0** (developed/tested on this version; Node 20 LTS+ should
  also work since Next.js 16 requires Node ≥ 20)
- npm 11+ (ships with the above Node version)
- A running instance of the [TaskCanvas backend](#) (Django), or just the
  frontend on its own for UI work — API calls will fail gracefully without it

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then edit NEXT_PUBLIC_API_BASE_URL if needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to
`/login`; once authenticated you land on `/tasks`.

### Environment variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the Django REST API | `http://localhost:8000/api` |

## Project structure

```
src/
  app/            # routes: /login, /(protected)/tasks, /(protected)/annotate
  components/
    ui/           # shadcn/ui primitives
    shared/       # DateSelector and other cross-feature components
    tasks/        # Board, Column, TaskCard, TaskModal
    annotate/     # ImageUploader, ImageStrip, AnnotationCanvas, ShapeList
  store/          # zustand stores: auth, tasks, annotation
  lib/api/        # axios client + per-resource request functions
  types/          # shared TypeScript types
```

## Challenges along the way

- **shadcn/ui's `form` registry component wouldn't install.** This project's
  shadcn style (`base-nova`) is built on Base UI rather than Radix, and the
  `add form` command silently no-op'd instead of erroring. Rather than fight
  an unofficial/experimental style variant, forms (login, task modal) use
  `react-hook-form` + `zod` directly against the plain `Input`/`Select`
  primitives, with manual error messages under each field — simpler than the
  wrapper abstraction anyway for a form set this small.

- **The auth guard got stuck on a permanent "Loading..." screen.** I first
  tracked hydration-from-localStorage as a field inside the persisted zustand
  state itself, set via `onRehydrateStorage`. That callback fires *after*
  zustand's own `set(mergedState, true)` call, which raced it and clobbered
  the flag back to `false`. Worse, reading zustand's `persist` API during
  render crashes during SSR (`window.localStorage` isn't available server
  side, which silently disables the persist middleware for that render pass).
  Fixed by switching to `useSyncExternalStore` subscribed to zustand's own
  `persist.hasHydrated()` / `onFinishHydration()`, with a server snapshot that
  never touches `.persist` at all.

- **The annotation canvas infinite-looped the moment an image had no shapes
  yet.** The store selector was `state.shapesByImage[image.id] ?? []` — that
  fallback is a *new* array literal every call, so zustand's snapshot
  equality check never matched and React kept re-rendering forever. Fixed
  with a module-level `EMPTY_SHAPES` constant so the fallback reference is
  stable across renders. Caught this by actually driving the page with
  Playwright rather than trusting the type-checker and build output alone.

- **A Playwright test made double-click-to-close-polygon look broken.**
  Scripted clicks fired back-to-back land close enough in time that Chromium
  coalesces them into a native double-click, prematurely closing the polygon
  after one point. Adding realistic delays between the test's individual
  clicks confirmed the feature itself was fine — real users don't click that
  fast.