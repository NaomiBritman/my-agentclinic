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

- [ ] While `npm run start` is running, `http://127.0.0.1:3000` responds.
- [ ] While `npm run start` is running, every other local IPv4 address refuses the connection on port 3000.
- [ ] While `npm run dev` is running, `http://127.0.0.1:3000` responds.
- [ ] While `npm run dev` is running, every other local IPv4 address refuses the connection on port 3000.

## Manual check

A person runs the site, opens it in a modern browser and confirms each item at a phone width of about 400px and at a desktop width:

- [ ] The browser tab title is "My Fit Plan".
- [ ] The main heading is "My Fit Plan".
- [ ] The sentence appears as written in the requirements.
- [ ] The footer notice is unchanged.
- [ ] The text is readable and the page doesn't scroll sideways.

## Repo checks

- [ ] `package.json` and `package-lock.json` are named `my-fit-plan`.
- [ ] No dependency versions changed in `package.json` or `package-lock.json`.
- [ ] `src/`, `package.json` and `package-lock.json` don't mention Fitness and Nutrition Tracker, `fitness-nutrition-tracker` or AgentClinic.
- [ ] `specs/tech-stack.md` no longer says the old name or the unlimited `start` script is current.
- [ ] In `specs/roadmap.md`, only the Phase 1 items changed, and they are ticked.
- [ ] `README.md`, `specs/mission.md` and the Phase 0 spec are unchanged.

## Scope checks

- [ ] No product features, database, accounts or AI were added.
- [ ] No safety limit values or numeric health targets appear in the code.
- [ ] The not-medical-advice notice is unchanged.

## Merge

Run `/changelog` and merge into `main` after all the checks above pass and the project owner has approved the result.
