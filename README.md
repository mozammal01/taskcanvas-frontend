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
  lib/annotation-colors.ts  # deterministic class -> color mapping
  types/          # shared TypeScript types
```

The annotation tool also supports: per-shape **class labels** (pick from a
list or add a new one, each class gets a consistent color), **zoom in/out**
on the canvas, a **hide/show annotations** toggle, and **auto-save** — shape
edits are debounced (800ms) and PUT to the backend automatically per image,
with a small status indicator ("Saving...", "Saved", "Save failed") plus a
manual "Save now" fallback.

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

- **Auto-save needed to key off the image being edited, not "whatever is
  currently active."** A naive single debounce timer shared across all
  images would drop a pending save if the user switched images before it
  fired (the timer would get cleared and rescheduled for the *new* image).
  Fixed with a per-image timer map (`Record<imageId, Timeout>`) and by
  capturing the target image id at schedule time instead of reading
  `activeImageId` when the timer fires. Verified with Playwright by
  capturing network requests and confirming a `PUT .../shapes/` fires
  ~800ms after drawing, with no Save button ever clicked.

- **Undo/redo, copy-to-next-image, mark-reviewed, and a real backend arriving
  mid-session all collided in testing.** While adding history and a
  draft/reviewed status per shape, a Playwright test against the newly-live
  Express backend (running on :8000) started failing with `shapes.filter is
  not a function`. Root cause: the store's `saveShapes`/`setActiveImage`
  trusted the API response was always an array with no validation, and a
  malformed response (or, in testing, an oversimplified mock) silently
  replaced local shapes with something that crashed the render. Fixed by
  guarding every place a shape list comes back from the network with
  `Array.isArray(...)`, falling back to the shapes already in the store
  instead of wiping them out. Also revealed a subtler bug in that same test:
  a mock that unconditionally returned `[]` for the autosave `PUT` was
  silently discarding whatever was just drawn a moment later — a reminder
  that a test double has to honor the real contract (echo back what was
  sent), not just return "something 200".

- **The canvas hint text ("Delete to remove, Esc to cancel, Ctrl+Z to
  undo") wasn't actually reliable, and testing it surfaced a bug in my own
  fix.** The keydown listener was attached to `window` with no check of
  focus — so typing a class name that happened to contain the word "Delete"
  deleted the selected shape mid-keystroke, and Ctrl+Z while naming a class
  hijacked the browser's native text-undo. Fixed with an `isEditableTarget`
  guard (checks `INPUT`/`TEXTAREA`/`contentEditable`) at the top of the
  handler. Separately, "double-click to close" left 2 stray vertices at the
  closing point — I assumed (based on the DOM spec) that a native dblclick
  always fires `click, click, dblclick`, and wrote the fix to drop the last
  2 points. That broke shape creation entirely. Debug logging showed Konva's
  own click/dblclick disambiguation only forwards **one** extra `click`
  before `dblclick`, not two — the DOM spec describes raw browser behavior,
  not what a canvas library chooses to re-dispatch. Lesson: verify the
  actual event sequence a library produces instead of reasoning from
  general web platform knowledge, even when the reasoning sounds airtight.