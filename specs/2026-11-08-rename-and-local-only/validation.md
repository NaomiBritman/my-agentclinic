# Validation: Rename and Local-Only (Phase 1)

The branch can merge only when every check below passes. See [requirements.md](requirements.md) for the full requirements.

## Automated checks

Each command must exit successfully, starting from a clean install, with no dev or production server running:

| Check | Command |
| --- | --- |
| Clean install | `npm ci` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Tests | `npm test` |
| Production build | `npm run build` |

## Connection check

Run these from this computer, and stop each server afterward:

- [x] While `npm run start` is running, `http://127.0.0.1:3000` responds.
- [x] While `npm run start` is running, every other local IPv4 address refuses the connection on port 3000.
- [x] While `npm run dev` is running, `http://127.0.0.1:3000` responds.
- [x] While `npm run dev` is running, every other local IPv4 address refuses the connection on port 3000.

## Manual check

A person runs the site, opens it in a modern browser and confirms each item at a phone width of about 400px and at a desktop width:

- [x] The browser tab title is "My Fit Plan".
- [x] The main heading is "My Fit Plan".
- [x] The sentence appears as written in the requirements.
- [x] The footer notice is unchanged.
- [x] The text is readable and the page doesn't scroll sideways.

## Repo checks

- [x] `package.json` and `package-lock.json` are named `my-fit-plan`.
- [x] No dependency versions changed in `package.json` or `package-lock.json`.
- [x] `src/`, `package.json` and `package-lock.json` don't mention Fitness and Nutrition Tracker, `fitness-nutrition-tracker` or AgentClinic.
- [x] `specs/tech-stack.md` no longer says the old name or the unlimited `start` script is current.
- [x] In `specs/roadmap.md`, only the Phase 1 items changed, and they are ticked.
- [x] `README.md`, `specs/mission.md` and the Phase 0 spec are unchanged.

## Scope checks

- [x] No product features, database, accounts or AI were added.
- [x] No safety limit values or numeric health targets appear in the code.
- [x] The not-medical-advice notice is unchanged.

## Results

Recorded on 2026-11-08.

- **Manual check:** the project owner checked the site in a browser at desktop width and at about 400px wide. They confirmed that the tab title, heading, sentence and footer notice are correct, the text is readable, and there is no sideways scrolling.
- **Automated checks:** clean install, lint, type check, tests and production build all passed.
- **Connection check:** for both `npm run start` and `npm run dev`, `http://127.0.0.1:3000` responded and all 5 other local IPv4 addresses refused the connection, tested from the same machine. The result relies on those connection tests and the Next.js log.

## Merge

Run `/changelog` and merge into `main` after all the checks above pass and the project owner has approved the result.
