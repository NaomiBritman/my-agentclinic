# Roadmap

High-level implementation order, in very small phases. Each phase should leave the site working, and any page it adds or changes must follow responsive design and be checked at phone and desktop widths. See [mission.md](mission.md) for the safety principles and [tech-stack.md](tech-stack.md) for technology choices.

## Required decisions

These block the phases named below. Each limit value must come from reliable health sources that the project owner approves, and no values may be invented.

- [ ] **Exercise limits:** values and sources approved, including how much difficulty can rise each week. **Phase 9 cannot start until this is done.**
- [ ] **Goal eligibility:** rules and sources approved for when a goal such as weight loss can't be offered based on a person's details. **Phase 9 cannot start until this is done.**
- [ ] **AI provider:** chosen by the project owner, within the requirements in [tech-stack.md](tech-stack.md). **Phase 10 cannot start until this is done.**
- [ ] **Nutrition limits:** values and sources approved for menus and targets. **Phase 13 cannot start until this is done.**

Phases 1–8 can start now. Phases 10–15 also depend on the blocked phases before them, so no AI plan or menu can reach anyone until the limits covering it are approved.

## Phase 0: Project setup

Completed under the earlier project name.

- [x] Replace the placeholder scaffold with a Next.js and TypeScript app.
- [x] Add Tailwind CSS and a basic page layout.
- [x] Add a home page with the site name and a not-medical-advice notice.
- [x] Add Vitest with one passing test.

## Phase 1: Rename and local-only

- [x] Rename the package to `my-fit-plan`.
- [x] Change the site name to My Fit Plan and update the mission sentence.
- [x] Limit `npm run start` to `127.0.0.1`.

## Phase 2: Database

- [x] Add SQLite and Drizzle with a first migration.
- [x] Keep the database file out of Git.

## Phase 3: Sign-up

- [x] Choose an account library.
- [x] Add a sign-up form with server-side validation.
- [x] Store accounts with hashed passwords.

## Phase 4: Log in and log out

- [x] Add log in and log out.
- [x] Require login for personal pages.
- [x] Add tests showing that one person can't reach another person's data.

## Phase 5: Profile and goal

- [x] Add a profile form for age, height, weight and fitness level.
- [x] Validate profile input and require the person to be 18 or older.
- [x] Let the person choose a goal, such as weight loss, toning or muscle building.
- [x] Save the profile and goal, and allow edits.

## Phase 6: Daily exercise tracking

- [ ] Show a sample exercise list with names only, no amounts, clearly labeled as a sample.
- [ ] Let the person tick off exercises, and save this to their account.
- [ ] Show whether everything on today's list is complete.

## Phase 7: Daily menu tracking

- [ ] Show a sample menu with meal names only, no amounts, clearly labeled as a sample.
- [ ] Let the person mark meals as eaten or not, and save this to their account.
- [ ] Let the person note anything else they ate, without counting or scoring it.
- [ ] Keep the wording neutral, with no judgments on intake.

## Phase 8: Tracking history

- [ ] Show a simple history of past days.
- [ ] Review the wording to make sure it doesn't reward eating less or training more.

## Phase 9: Exercise and goal limits

**Blocked until the exercise limits and goal eligibility are approved (see required decisions).**

- [ ] Implement the approved exercise limits and goal eligibility rules as a standalone module.
- [ ] Add tests showing that plans can't exceed the limits, and that ineligible goals are refused.

## Phase 10: AI agent connection

**Blocked until the AI provider is chosen (see required decisions).**

- [ ] Connect the agent on the server, with any key kept in `.env`.
- [ ] Define the structured output format.
- [ ] Add a check that shows nothing to the person when output is invalid.
- [ ] Tell people what is sent to the provider if it runs outside this computer.

## Phase 11: AI exercise plan

- [ ] Add an exercise catalog with difficulty levels, and allow plans to use only those exercises.
- [ ] Generate a first week from the profile and goal, and check it against the limits.
- [ ] Say neutrally when no plan can be produced within the limits.
- [ ] Replace the sample exercise list with the generated plan.

## Phase 12: Weekly progression

- [ ] Generate the next week at a higher difficulty, within the limits.
- [ ] Show the person's current week and how difficulty has changed.
- [ ] Hold or adjust progression when the person has missed days.

## Phase 13: Nutrition limits

**Blocked until the nutrition limits are approved (see required decisions).**

- [ ] Add the approved nutrition limits to the safety module.
- [ ] Add tests showing that menus and targets can't go past the limits.

## Phase 14: AI menu

- [ ] Ask for food allergies and dietary restrictions before generating any menu.
- [ ] Generate a menu from the profile and goal, and check it against the limits and restrictions.
- [ ] Say that AI menus can contain mistakes, and that people with allergies should check ingredients.
- [ ] Say neutrally when no menu can be produced within the limits.
- [ ] Replace the sample menu with the generated menu.

## Phase 15: Menu targets

- [ ] Show personal daily targets, within the approved limits.
- [ ] Compare tracked meals with those targets in neutral wording.

## Phase 16: Polish

- [ ] Review all wording, plans and menus against the safety principles.
- [ ] Do a final check of all pages on phones and desktop browsers.
- [ ] Document how to run the site locally.

## Possible later work

Not planned for now:

- **Public deployment:** needs a security review, hosting and its own decision.
- **Password reset:** needs a way to reach people, such as email, which a local site doesn't have.
- **Food database:** look up off-menu foods instead of writing a note.
- **Renaming the GitHub repository and local folder:** both are still called `my-agentclinic`.
