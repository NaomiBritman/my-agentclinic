# Validation: Project Setup (Phase 0)

The branch can merge only when every check below passes. See [requirements.md](requirements.md) for the full requirements.

## Automated checks

Each command must exit successfully, starting from a clean install:

| Check | Command |
| --- | --- |
| Clean install | `npm ci` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Tests | `npm test` |
| Production build | `npm run build` |

`npm test` must run the test in `src/lib/site.test.ts`, and it must pass.

## Manual check

A person runs `npm run dev`, opens the site in a modern browser and confirms each item at a phone width of about 400px and at a desktop width:

- [ ] The browser tab title is "Fitness and Nutrition Tracker".
- [ ] The main heading is "Fitness and Nutrition Tracker".
- [ ] The mission sentence appears as written in the requirements.
- [ ] The footer shows the full not-medical-advice notice.
- [ ] The text is readable and the page doesn't scroll sideways.
- [ ] No default Next.js starter content appears.

## Repo checks

- [ ] `src/index.ts` is gone, and `tsx` is not in `package.json`.
- [ ] `package.json` is named `fitness-nutrition-tracker`.
- [ ] No file in `src/` or `package.json` mentions AgentClinic.
- [ ] `README.md` and `specs/mission.md` are unchanged.
- [ ] In `specs/tech-stack.md`, the only change is the added ESLint row.
- [ ] In `specs/roadmap.md`, only the Phase 0 items changed, and they are ticked.
- [ ] `node_modules/`, `.next/` and `.env` are not tracked by Git.

## Scope checks

- [ ] The site has no exercise, food or profile features, and no navigation.
- [ ] No safety cap values or numeric health targets appear anywhere in the code.
- [ ] No database, accounts, deployment or CI setup was added.

## Merge

Merge into `main` after all the checks above pass and the project owner has approved the result.
