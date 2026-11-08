# Requirements: Rename and Local-Only (Phase 1)

## Context

This work covers Phase 1 of the [roadmap](../roadmap.md). The constitution now describes My Fit Plan, but the app and package still use the old name, Fitness and Nutrition Tracker. `npm run dev` is already limited to `127.0.0.1`, but `npm run start` isn't, so the production server may accept connections from the network.

Guidance:

- [Mission](../mission.md): the site is local only, and it must not suggest that AI plans or menus exist before the limits covering them are approved.
- [Tech stack](../tech-stack.md): both `npm run dev` and `npm run start` must be limited to `127.0.0.1`, and every changed page must follow responsive design.

## Scope

### In scope

- Renaming the package to `my-fit-plan`, including in `package-lock.json`.
- Changing the site name to My Fit Plan.
- Changing the home page sentence.
- Limiting `npm run start` to `127.0.0.1`.
- Updating `specs/tech-stack.md`, because its statements about the old name and the unlimited `start` script become outdated.
- Ticking the Phase 1 items in `specs/roadmap.md`.

### Out of scope

- Renaming the GitHub repository or the local `my-agentclinic` folder. Both stay under possible later work in the roadmap.
- Any product feature, including accounts, the database, tracking and AI.
- Safety limit values or any safety module.
- Changing the not-medical-advice notice.
- New tests.
- Rewriting earlier records, such as `CHANGELOG.md` and the Phase 0 spec, which correctly describe the old name.

## Functional requirements

1. The browser tab title and the home page main heading are "My Fit Plan".
2. The home page shows this sentence: "My Fit Plan is being built. It will help you follow a personal exercise plan and menu, day by day."
3. The page description in the site metadata uses the same sentence.
4. The footer notice stays exactly as it is.
5. `npm run start` serves the site on `127.0.0.1` and can't be reached through any other local address.
6. `npm run dev` stays limited to `127.0.0.1`.
7. The home page remains readable on phone and desktop widths, without horizontal scrolling.

## Decisions

| Decision | Choice | Reason |
| --- | --- | --- |
| Repository and folder names | Leave for later | Keeps this phase small, with nothing outside the code changing |
| Home page sentence | Says the site is being built | Describes the aim without suggesting that features already work; later phases update it as features arrive |
| Package lock file | Update the names only | The rename shouldn't change any dependency versions |
| Tests | No new tests | The existing test still applies, and the connection test in [validation.md](validation.md) checks the address limit |

## Constraints

- No dependency versions change.
- This phase collects no personal data.
