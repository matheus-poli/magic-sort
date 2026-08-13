# Magic Sort

A liquid-sorting puzzle game built in React, themed as a medieval alchemist's
atelier: an apprentice pours mixed elixirs between glass flasks until each one
holds a single pure colour.

It is a portfolio project, so the code and the tests are the point as much as
the game is. No backend, no network calls, no CDN assets — it builds to static
files and runs entirely in the browser.

## Playing

Tap a flask to pick it up, then tap another to pour. A pour is legal when the
target is empty, or its top layer matches what you are pouring, and it has room
to take it. The whole unbroken run of the top elixir moves at once. Sort every
flask to finish the level.

Score is 100 per completed flask, plus a 500 bonus for solving the level that
loses 25 for every pour spent over par.

## Getting set up

The toolchain is pinned with [mise](https://mise.jdx.dev), so everyone builds
and tests against the same Node version. Install mise once — on macOS or Linux,
`curl https://mise.run | sh`, then follow its instructions to activate it in
your shell — and from the project root run:

```bash
mise trust     # approve this repository's mise.toml
mise install   # install the pinned Node version
mise run setup # install dependencies and the browser the e2e test uses
```

`mise install` reads `mise.toml` and puts the right Node on your `PATH` whenever
you are inside this directory, without touching the rest of your machine. To
change the pinned version, edit `mise.toml` rather than upgrading Node globally,
so the change is reviewed like any other.

Not using mise is fine too — install Node 25.5.0 yourself and run
`npm ci && npx playwright install chromium`.

## Running it

```bash
npm run dev
```

| Command                 | What it does                                     |
| ----------------------- | ------------------------------------------------ |
| `npm run dev`           | Dev server                                       |
| `npm run test`          | Vitest in watch mode                             |
| `npm run test -- --run` | Single test run                                  |
| `npm run test:coverage` | Coverage report                                  |
| `npm run test:e2e`      | Playwright smoke test against the real build     |
| `npm run typecheck`     | TypeScript, no emit                              |
| `npm run lint`          | ESLint                                           |
| `npm run format`        | Prettier                                         |
| `npm run verify`        | Everything above except e2e — run before pushing |
| `npm run sounds`        | Regenerate the sound effects                     |
| `npm run build`         | Production build                                 |

On Linux the e2e browser also needs a handful of system libraries, which are
outside what mise manages. Install them once with
`sudo npx playwright install-deps chromium`.

## How it is built

```
src/
  domain/       Pure TypeScript puzzle rules. No React, no DOM, no side effects.
  hooks/        React state orchestration over the domain.
  components/   Presentation, driven entirely by props.
  audio/        The one impure boundary, isolated so tests can stub it.
e2e/            A single Playwright smoke test.
scripts/        Sound synthesis.
```

Dependencies point one way: `components → hooks → domain`. The rules of the
puzzle are plain functions over immutable data, which is why they can be tested
by calling them, with no test environment at all.

### Testing

Test-first, always: the test is written and watched to fail before any
implementation exists, and a failing test has to say what broke without sending
anyone to the source.

The suite follows the pyramid — the bulk of the cost sits at the bottom:

- **Unit (Vitest)** — the puzzle rules, exhaustively.
- **Integration (React Testing Library)** — one per meaningful interaction,
  querying by role and label the way a player perceives the UI. No test ids.
- **E2E (Playwright)** — exactly one, solving the starter level in a real
  browser. Anything a lower layer can cover belongs in a lower layer.

Current coverage: 90% of statements, 87% of branches. The gap is deliberate —
it is the audio boundary, which only a real browser executes, and the animation
callbacks, which are visual rather than behavioural.

### Dependencies

Kept deliberately short. Beyond React and the toolchain:

- **`motion`** — spring animations for pouring, selection and the win card.
- **`howler`** — audio playback, guarded so a browser without the Web Audio API
  simply stays silent instead of crashing.
- **`canvas-confetti`** — the celebration when a flask is filled and when the
  level is solved. Physics-driven particles on a canvas are the kind of thing
  that is tedious to hand-roll and worse for it; it is dependency-free and
  degrades on its own when the player asks for reduced motion.

The sound effects are synthesised by `scripts/generate-sounds.mjs` rather than
downloaded, which keeps the repository self-contained and licence-free.

## Roadmap

The game ships in vertical slices — each one playable on its own.

- [x] **Slice 1** — one level, pouring, scoring, sound, animation, win state.
- [ ] **Slice 2** — undo, level progression, persistence.
- [ ] **Slice 3** — the alchemist character, ingredient collection, boosts.

## Conventions

Everything in this repository is written in English. Commits follow
[Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint through Lefthook, which also formats, lints and typechecks staged
files before a commit and runs the test suite before a push.

`CLAUDE.md` holds the full working agreement for this codebase.

## Licence

MIT — see [LICENSE](LICENSE).
