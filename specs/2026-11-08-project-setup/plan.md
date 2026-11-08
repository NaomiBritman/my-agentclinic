# Plan: Project Setup (Phase 0)

See [requirements.md](requirements.md) for scope and decisions, and [validation.md](validation.md) for merge criteria.

## 1. Replace the scaffold

1. Generate a Next.js app with TypeScript, Tailwind CSS, ESLint, the App Router and a `src/` directory in a temporary folder outside the repo.
2. Remove `src/index.ts`, the `tsx` dependency and the old `tsconfig.json`.
3. Copy the generated app into the repo root, keeping the existing `README.md` and `specs/`.
4. Name the package `fitness-nutrition-tracker`, and regenerate `package-lock.json`.
5. Merge `.gitignore` so it keeps the current entries and adds the Next.js ones, such as `.next/` and `next-env.d.ts`.
6. Add a `typecheck` script that runs `tsc --noEmit`.
7. Limit the `dev` script to `127.0.0.1`.
8. Confirm that the app starts with `npm run dev`.

## 2. Add the layout and notice

1. Create `src/lib/site.ts` with the site name, mission sentence and not-medical-advice notice.
2. Set the page title in `src/app/layout.tsx` from the site name.
3. Add a footer to the shared layout that shows the notice.
4. Remove the starter styles, images and icons that the app no longer uses.

## 3. Build the home page

1. Replace the starter content in `src/app/page.tsx` with the site name as the main heading and the mission sentence below it.
2. Use Tailwind CSS to make the page readable on phone and desktop widths.

## 4. Add Vitest

1. Install Vitest and add a `test` script that runs once and exits.
2. Add `src/lib/site.test.ts` with one test checking that the notice includes "not medical advice".
3. Confirm that the test passes with `npm test`.

## 5. Validate and finish

1. Run every check in [validation.md](validation.md) and fix any failures.
2. Tick the Phase 0 items in [roadmap.md](../roadmap.md).
