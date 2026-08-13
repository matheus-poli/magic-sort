# CLAUDE.md

Guidance for working in this repository. These are rules, not suggestions — when a
request conflicts with them, say so before writing code.

## What this project is

Magic Sort is a liquid-sorting puzzle game (the "water sort" genre) with a medieval
alchemy theme: a potion-brewing apprentice sorts mixed elixirs into pure flasks.
It exists as a **React portfolio piece**, so the quality of the code and of the
tests is part of the deliverable, not overhead on top of it.

The game must stay **entirely client-side and self-contained**: no backend, no
network calls, no external asset CDNs. It has to run from a static build.

## Language rule

**Everything committed is written in English.** Code, identifiers, comments,
commit messages, docs, test names, UI copy. No exceptions. Conversation with the
user may happen in another language; the repository never does.

## Delivery model: vertical slices

Work ships in vertical slices. A slice is playable on its own — domain rules,
React wiring, UI and tests all the way through — rather than a horizontal layer
that does nothing by itself. Prefer the smallest slice that a person could
actually sit down and play. Do not build infrastructure for a slice that has not
been asked for yet.

## TDD is the workflow, not a phase

Every behaviour change follows red → green → refactor, in that order:

1. **Red.** Write the test first and run it. Watch it fail, and read the failure.
2. **Green.** Write the least code that makes it pass.
3. **Refactor.** Clean up with the test as a safety net.

Never write the implementation first and backfill a test. If you catch yourself
about to, stop and write the test.

### The failure message is a deliverable

A failing test must tell a human what broke without them opening the source. That
means:

- Assert on meaningful values, not booleans. `expect(pour(from, to)).toEqual(...)`
  beats `expect(isValid).toBe(true)`, because the first prints the actual value
  and the second prints `false`.
- Name tests as sentences describing behaviour: `it('rejects a pour onto a
different colour', ...)`. The name alone should explain what the system was
  supposed to do.
- Group with `describe` blocks named after the unit under test.
- When an assertion needs context to be readable, pass a custom message rather
  than leaving a bare diff.

### Tests describe behaviour, not structure

Tests must be free to outlive a refactor. Couple them to the public contract of
the unit, never to its internals.

- Never assert on private helpers, internal state shape, call counts of
  collaborators, or the order of internal operations.
- For components, query the way a user perceives the UI: role, label, visible
  text. `getByRole('button', { name: 'Restart' })` — not test ids, not class
  names, not component internals. `data-testid` is a last resort and needs a
  comment justifying it.
- Drive components with `@testing-library/user-event`, not raw `fireEvent`.
- Do not mock what you own. Mock only real boundaries (audio playback, timers,
  randomness).

## Test pyramid

Respect the proportions. Most cost belongs at the bottom.

| Layer           | Tool                           | Scope                                                   | Volume                   |
| --------------- | ------------------------------ | ------------------------------------------------------- | ------------------------ |
| **Unit**        | Vitest                         | Pure domain functions in `src/domain`, in isolation     | The bulk                 |
| **Integration** | Vitest + React Testing Library | A component tree plus its hooks, real domain underneath | Where it earns its place |
| **E2E**         | Playwright                     | Whole app in a real browser                             | Almost none              |

Rules of thumb:

- Puzzle rules are pure functions and get exhaustive unit coverage, including
  edge cases. They are cheap, fast, and where the real logic lives.
- Integration tests exist to prove the wiring — that a click reaches the domain
  and the result reaches the screen. One per meaningful user interaction, not one
  per component.
- E2E is a smoke test for the happy path only. Adding a second E2E test requires
  a reason that no lower layer could cover. Never reach for E2E to test a rule.

## Architecture

```
src/
  domain/       Pure TypeScript. No React, no DOM, no side effects, no imports from above.
  hooks/        React state orchestration over the domain.
  components/   Presentation. Receives data and callbacks via props.
  audio/        The one impure boundary; isolated so tests can stub it.
```

The dependency arrow points one way: `components → hooks → domain`. The domain
must remain testable with plain function calls and no test environment at all —
if a domain module needs jsdom, it is in the wrong folder.

Model state as immutable data and transform it with pure functions that return
new values. No mutation of shared state.

## Code style

The reference points are Uncle Bob, Fowler, Sandi Metz and Kent C. Dodds. In
practice:

- **Write for the next human.** Clarity beats cleverness every single time.
- **Comments are deodorant.** A comment explaining _what_ code does means the
  code needs a better name or a smaller function. Comments are for _why_ —
  a non-obvious trade-off, a rule from the game design, a workaround.
- **Rule of three.** Duplication is cheaper than the wrong abstraction. Do not
  extract on the second occurrence; wait for the third and for the shape to be
  clear. Prefer duplication over premature coupling.
- **Do the simple thing first.** No speculative generality, no configuration
  options nobody asked for, no plugin points for one implementation.
- **No metaprogramming.** No dynamic property access to be clever, no proxies,
  no runtime type gymnastics. Boring, explicit, readable code.
- **Small functions with honest names.** A name that needs `and` in it is two
  functions.
- **Types describe the domain.** Prefer precise unions and named types over
  `string`/`number` soup. `any` is not allowed; if a type is genuinely unknown,
  use `unknown` and narrow it.

## Tooling

| Concern   | Tool                                                              |
| --------- | ----------------------------------------------------------------- |
| Toolchain | mise, pinning the Node version in `mise.toml`                     |
| Build/dev | Vite                                                              |
| Language  | TypeScript, `strict` on                                           |
| Lint      | ESLint via `neostandard` (the maintained successor to StandardJS) |
| Format    | Prettier, configured to emit StandardJS style                     |
| Unit/int  | Vitest + React Testing Library + `user-event`                     |
| E2E       | Playwright                                                        |
| Git hooks | Lefthook                                                          |
| Commits   | commitlint + Conventional Commits                                 |
| Animation | `motion`                                                          |
| Audio     | `howler`                                                          |

`neostandard` runs with `noStyle`, so ESLint owns correctness and Prettier owns
formatting, and the two never fight.

### The toolchain is pinned

`mise.toml` pins the exact Node version this project is verified against, so a
clone reproduces the environment rather than inheriting whatever is on the
machine. Rules:

- Never work around a version mismatch by changing what is installed globally.
  Edit `mise.toml`, so the change is reviewed like any other.
- Bumping the pinned version is its own commit, and `npm run verify` plus the
  e2e test have to pass on the new version before it lands.
- **Commands stay in `package.json`.** Anyone with plain npm must be able to run
  the project, so mise does not become a requirement for day-to-day work. The
  one exception is `mise run setup`, the first-time bootstrap, because it
  reaches past npm to fetch the Playwright browser.

### Adding a dependency

Dependencies are a liability. Before adding one, state in the commit body what it
replaces and why hand-rolling it is worse. Prefer the platform (CSS, Web Audio,
Pointer Events) over a package. An unmaintained package is not an option.

## Commands

First time on a machine:

```bash
mise trust              # approve this repository's mise.toml
mise install            # install the pinned Node version
mise run setup          # npm ci + the Playwright browser
```

Day to day:

```bash
npm run dev             # dev server
npm run test            # Vitest in watch mode
npm run test -- --run   # single run
npm run test:coverage   # coverage report
npm run test:e2e        # Playwright, against the production build
npm run typecheck
npm run lint
npm run format
npm run verify          # typecheck + lint + format check + tests; run before pushing
```

## Commits

Conventional Commits, enforced by commitlint on `commit-msg`.

```
feat(domain): reject pours onto a mismatched colour
fix(board): keep flask selection after an invalid pour
test(scoring): cover the perfect-run bonus
chore(tooling): pin Playwright to the CI browser build
```

Rules:

- One logical change per commit. A commit that needs "and" in its subject is two
  commits.
- Subject in the imperative mood, lowercase, no trailing period.
- The body explains _why_, not _what_ — the diff already says what.
- Never commit with failing tests, lint errors or type errors. Lefthook enforces
  this on `pre-commit` and `pre-push`; do not bypass it with `--no-verify`.

## Definition of done

A slice is done when all of the following hold:

- [ ] Tests were written before the implementation
- [ ] `npm run verify` passes clean
- [ ] The new behaviour is reachable and playable in the running app
- [ ] No `any`, no skipped tests, no commented-out code, no TODOs left behind
- [ ] Test names read as behaviour, and a deliberate break produces a clear failure
