# Requirements: Project Setup (Phase 0)

## Context

This work covers Phase 0 of the [roadmap](../roadmap.md). It replaces the placeholder AgentClinic scaffold with the foundation for the Fitness and Nutrition Tracker. Later phases build on this app, starting with the daily checklist in Phase 1.

Guidance:

- [Mission](../mission.md): the safety principles, including the not-medical-advice rule.
- [Tech stack](../tech-stack.md): Next.js, TypeScript, Tailwind CSS, Vitest and ESLint.

The repo currently has a `package.json` named `naomibritman`, a default `tsconfig.json`, and a `src/index.ts` that prints `Hello AgentClinic`.

## Scope

### In scope

- A Next.js app using the App Router and TypeScript, at the repo root.
- Removal of the placeholder scaffold: `src/index.ts`, the `tsx` dependency and the old `tsconfig.json`.
- A package renamed to `fitness-nutrition-tracker`.
- Tailwind CSS and a basic shared layout.
- A home page showing the site name and mission sentence.
- A not-medical-advice notice in the shared layout footer.
- Vitest with one passing test.
- Scripts for `dev`, `build`, `start`, `lint`, `typecheck` and `test`.
- Ticked Phase 0 items in `specs/roadmap.md`.

### Out of scope

- Exercise lists, food logging, profiles or any other product feature.
- Navigation or placeholder links to pages that don't exist yet.
- SQLite and Drizzle, which arrive in Phase 2.
- Safety cap values or any safety module, which arrive in Phase 5 and Phase 8.
- Accounts, hosting and deployment.
- CI, such as GitHub Actions.
- Renaming the GitHub repository.

## Functional requirements

1. The home page (`/`) shows the site name, "Fitness and Nutrition Tracker".
2. The home page shows the mission sentence: "A website that helps a person keep up with exercise and nutrition, day by day."
3. Every page shows this notice in the shared layout footer: "This site is not medical advice. Talk to a qualified health professional before starting a new exercise or nutrition plan."
4. The browser tab title is "Fitness and Nutrition Tracker".
5. The page contains no default Next.js starter content.
6. The page is readable on phone and desktop widths, without horizontal scrolling.

## Decisions

| Decision | Choice | Reason |
| --- | --- | --- |
| Existing scaffold | Replace in place at the repo root | Leaves no unused files and no extra folder level for commands |
| TypeScript settings | Next.js defaults with `strict` on | The current stricter options were not carried over, which reduces friction |
| Notice placement | Shared layout footer | Every future page gets the notice automatically |
| Home page content | Site name and mission sentence only | Keeps this phase minimal |
| Site text | One small module, `src/lib/site.ts` | The layout, page and test all use the same wording |
| First test | Plain unit test of the site text | Needs no browser test libraries, while still protecting the notice |
| Linting | ESLint, as set up by `create-next-app` | Comes with the Next.js scaffold and supports merge checks |

## Constraints

- `README.md` and the existing `specs/` files must survive the scaffold step. `create-next-app` won't run in a folder with conflicting files, so the plan generates the app in a temporary folder and copies it in.
- The site runs locally only, as set out in the tech stack.
- This phase collects no personal data.
