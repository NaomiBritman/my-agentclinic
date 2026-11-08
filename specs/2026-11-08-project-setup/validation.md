
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

- [x] The browser tab title is "Fitness and Nutrition Tracker".
- [x] The main heading is "Fitness and Nutrition Tracker".
- [x] The mission sentence appears as written in the requirements.
- [x] The footer shows the full not-medical-advice notice.
- [x] The text is readable and the page doesn't scroll sideways.
- [x] No default Next.js starter content appears.

## Repo checks

- [x] `src/index.ts` is gone, and `tsx` is not in `package.json`.
- [x] `package.json` is named `fitness-nutrition-tracker`.
- [x] While `npm run dev` is running, the server listens only on `127.0.0.1`, not on the local network address.
- [x] No file in `src/` or `package.json` mentions AgentClinic.
- [x] `README.md` and `specs/mission.md` are unchanged.
- [x] In `specs/tech-stack.md`, the only change is the added ESLint row.
- [x] In `specs/roadmap.md`, only the Phase 0 items changed, and they are ticked.
- [x] `node_modules/`, `.next/` and `.env` are not tracked by Git.

## Scope checks

- [x] The site has no exercise, food or profile features, and no navigation.
- [x] No safety cap values or numeric health targets appear anywhere in the code.
- [x] No database, accounts, deployment or CI setup was added.

## Results

Recorded on 2026-11-08.

- **Manual check:** the project owner checked the site in a browser at desktop width and at about 400px wide, and confirmed that both look correct.
- **Automated checks:** all passed. The clean install and production build last ran before the `dev` script was limited to `127.0.0.1`. Lint, type check and tests were rerun after that change.
- **Dev server address:** `http://127.0.0.1:3000` responded, and every other local IPv4 address refused the connection, tested from the same machine. Windows listener tools did not show the server while it was running, so this result relies on those connection tests and the Next.js log.

## Merge

Merge into `main` after all the checks above pass and the project owner has approved the result.
