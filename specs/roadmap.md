# Roadmap

High-level implementation order, in very small phases. Each phase should leave the site working. See [mission.md](mission.md) for the safety principles and [tech-stack.md](tech-stack.md) for technology choices.

## Required decisions

These block the phases named below. Each cap value must come from reliable health sources that the project owner approves, and no values may be invented.

- [ ] **Exercise progression caps:** values and sources approved. **Phase 5 cannot start until this is done.**
- [ ] **Nutrition caps:** values and sources approved. **Phase 8 cannot start until this is done.** Manual food logging (Phase 4) does not depend on this.

## Phase 0: Project setup

- [x] Replace the placeholder scaffold with a Next.js and TypeScript app.
- [x] Add Tailwind CSS and a basic page layout.
- [x] Add a home page with the site name and a not-medical-advice notice.
- [x] Add Vitest with one passing test.

## Phase 1: Daily checklist

- [ ] Show a hard-coded list of today's exercises.
- [ ] Let the user tick off individual exercises (not saved yet).
- [ ] Show whether everything on today's list is complete.

## Phase 2: Saving progress

- [ ] Add SQLite and Drizzle with a first migration.
- [ ] Save each day's completion so it survives a page reload.
- [ ] Show a simple history of past days.

## Phase 3: User profile

- [ ] Add a profile form for the single local user's weight and individual details.
- [ ] Validate profile input and require the user to be 18 or older.
- [ ] Save the profile and allow edits.

## Phase 4: Manual food logging

This phase does not depend on the safety caps.

- [ ] Add manual logging for what the user ate today.
- [ ] Save entries and show daily totals.
- [ ] Keep the display neutral, with no targets, goals or judgments on intake.

## Phase 5: Safety rules

**Blocked until the exercise progression caps are approved (see required decisions).**

- [ ] Implement the approved exercise caps as a standalone module.
- [ ] Add tests showing that plans can't exceed the caps.

## Phase 6: Personal plan

- [ ] Add an exercise catalog with difficulty levels.
- [ ] Generate a first week from the user's profile and fitness level.
- [ ] Replace the hard-coded checklist with the generated plan.

## Phase 7: Weekly progression

- [ ] Generate the next week at a higher difficulty, within the caps.
- [ ] Show the user's current week and how difficulty has changed.
- [ ] Hold or adjust progression when the user has missed days.

## Phase 8: Nutrition targets

**Blocked until the nutrition caps are approved (see required decisions).**

- [ ] Add the approved nutrition caps to the safety module, with tests.
- [ ] Show personal daily targets, within those caps.

## Phase 9: Polish

- [ ] Review all wording against the safety principles.
- [ ] Check the layout on phones and desktop browsers.
- [ ] Document how to run the site locally.

## Possible later work

Not planned for now:

- **Accounts:** sign-in for more than one user. Needed before any public deployment.
- **Food database:** look up foods instead of entering them manually.
