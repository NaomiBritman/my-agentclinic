# Roadmap

High-level implementation order, in very small phases. Each phase should leave the site working, and any page it adds or changes must follow responsive design and be checked at phone and desktop widths. See [mission.md](mission.md) for the safety principles and [tech-stack.md](tech-stack.md) for technology choices.

## Required decisions

The first four were approved by the project owner on 2026-11-09, the last two are still open, and the values are in [safety-limits.md](safety-limits.md). Each limit value must come from reliable health sources or a labeled owner decision, approved by the project owner, and no values may be invented.

- [x] **Exercise limits:** values and sources approved, including how much difficulty can rise each week. Unblocks Phase 9.
- [x] **Goal eligibility:** rules and sources approved for when a goal such as weight loss can't be offered based on a person's details. Unblocks Phase 9.
- [x] **AI provider:** chosen by the project owner, within the requirements in [tech-stack.md](tech-stack.md). Unblocks Phase 10.
- [x] **Nutrition limits:** values and sources approved for menus and targets. Unblocks Phase 13.
- [ ] **AI provider for real people:** a paid tier or a local model, chosen by the project owner. **No real person's details may be sent, and no real person gets a personal AI plan or menu, until this is done.**
- [ ] **Stronger menu checks:** the calorie, weight loss and allergy checks rely on Gemini's own figures or word matching, so generated menus are not safe for real use (see [safety-limits.md](safety-limits.md)). **Stronger checks are required before any real person's details are used.**

Phases 1–8 are complete, and Phases 9, 10 and 13 are unblocked. Phases 11, 12, 14 and 15 still depend on the phases before them, so no AI plan or menu can reach anyone until the limits covering it are implemented. Open items are listed in [safety-limits.md](safety-limits.md).

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

- [x] Show a sample exercise list with names only, no amounts, clearly labeled as a sample.
- [x] Let the person tick off exercises, and save this to their account.
- [x] Show whether everything on today's list is complete.

## Phase 7: Daily menu tracking

- [x] Show a sample menu with meal names only, no amounts, clearly labeled as a sample.
- [x] Let the person mark meals as eaten or not, and save this to their account.
- [x] Let the person note anything else they ate, without counting or scoring it.
- [x] Keep the wording neutral, with no judgments on intake.

## Phase 8: Tracking history

- [x] Show a simple history of past days.
- [x] Review the wording to make sure it doesn't reward eating less or training more.

## Phase 9: Exercise and goal limits

**Unblocked: the exercise limits and goal eligibility are approved (see [safety-limits.md](safety-limits.md)).**

- [x] Add the two approved eligibility questions, and show the approved neutral messages when a plan or goal can't be offered.
- [x] Implement the approved exercise limits and goal eligibility rules as a standalone module.
- [x] Add tests showing that plans can't exceed the limits, and that ineligible goals are refused.

## Site redesign

Done on the same branch as Phases 9–15, before Phase 10.

- [x] Add the teal and coral palette in light and dark, with contrast tests.
- [x] Build shared components, and use them on every page.
- [x] Use icons and color for character, with no photos or illustrations of people.

## Phase 10: AI agent connection

**Unblocked: the AI provider is chosen (see [tech-stack.md](tech-stack.md)).**

- [x] Connect the Gemini API free tier on the server for made-up test profiles only, with the key kept only in `.env`.
- [x] Add built-in made-up test profiles, and make sure generation never reads a saved profile.
- [x] Define the structured output format.
- [x] Add a check that shows nothing to the person when output is invalid.
- [x] Show the approved test mode and demonstration notices before generating, and a loading state while a plan is built.

## Phase 11: AI exercise plan

- [x] Add an exercise catalog with difficulty levels, and allow plans to use only those exercises.
- [x] Let a person choose a built-in test profile, then generate a four-week plan at moderate intensity from that profile and its goal, and check every week against the limits.
- [ ] Say neutrally when no plan can be produced within the limits.
- [ ] Show that day's exercises from the plan on `/today`, with minutes or sets and ticks saved per day, and keep the sample exercise list for when no plan can be shown.
- [x] Hide the test plans page and generated plans from anyone who answered yes to either eligibility question, and hide weight loss test plans when the person's BMI is under 18.5.

## Phase 12: Weekly progression

- [ ] Raise difficulty from week to week within the limits, with load rising only after the person marks it.
- [ ] Show the current week and how difficulty has changed on the daily view.
- [ ] Hold progression when no exercise was ticked in a week.

## Phase 13: Nutrition limits

**Unblocked: the nutrition limits are approved (see [safety-limits.md](safety-limits.md)).**

- [x] Add the approved nutrition limits to the safety module.
- [x] Add tests showing that menus and targets can't go past the limits.

## Phase 14: AI menu

- [ ] Give each built-in test profile made-up allergies and dietary restrictions, and use them when generating a menu.
- [ ] Generate a seven-day menu that repeats each week, from a built-in test profile and its goal, and check it against the limits and restrictions.
- [ ] Say that AI menus can contain mistakes, and that people with allergies should check ingredients.
- [ ] Say neutrally when no menu can be produced within the limits.
- [ ] Show that day's meals on `/today`, with portions and estimated calories labeled as Gemini estimates and ticks saved per day, and keep the sample menu for when no plan can be shown.

## Phase 15: Menu targets

- [ ] Enforce the approved limits in code, and show no daily target. Estimated calories are never shown as a target.
- [ ] Compare tracked meals with targets in neutral wording. This waits for the AI provider for real people, and no comparison is shown until then.

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
