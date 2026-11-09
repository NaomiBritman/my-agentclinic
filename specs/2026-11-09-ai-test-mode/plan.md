# Plan: AI Test Mode (Phases 9–15 and Redesign)

See [requirements.md](requirements.md) for scope and decisions, and [validation.md](validation.md) for merge criteria.

All work happens on the `ai-test-mode` branch. After every task group, run lint, type check and tests, and tick the finished items in [roadmap.md](../roadmap.md). Stop at each milestone until the project owner has checked the site in a browser, then commit that work. Nothing is pushed or merged unless the project owner asks.

## Done

Task groups 1 to 3 and Milestone 1 are complete and committed (`24d7aad`): the approvals, eligibility and safety limits.

## 4. Design foundation (Redesign)

1. Install `lucide-react` and `@fontsource-variable/inter`, and confirm that the site makes no font requests to outside services.
2. Add the palette in [requirements.md](requirements.md) to `globals.css` as named colors for light and dark.
3. Add a contrast test that reads those colors, and checks every text and background pair in both modes.
4. Build the shared components: page band, card, button, form field, notice, tick item and navigation.

## 5. Redesign existing pages (Redesign)

1. Restyle the header, footer, home, sign-up and log-in pages.
2. Restyle `/profile`, including the questions and messages.
3. Restyle `/today` with its sample lists, note and completion messages.
4. Restyle `/history` and the not-found page.
5. Confirm that no text changed, and that all existing tests still pass.
6. Run the accessibility scan from outside the repo, and take phone and desktop screenshots, in light and dark, for the project owner.

**Milestone 2:** run the automated checks and the Milestone 2 items in [validation.md](validation.md), then stop for the project owner's check. No Gemini key is needed.

## 6. Test profiles and catalog (Phases 10, 11 and 14)

1. Add the approved test profiles as built-in data, with their approved words to avoid.
2. Add the approved exercise catalog with difficulty levels and starting amounts.
3. Test that every test profile meets the eligibility rules, and that every catalog amount passes the first week checks.

## 7. Gemini connection (Phase 10)

1. Check Gemini's current terms, available regions and free tier Flash models. If the terms have changed, or the project owner's region isn't available, stop and ask.
2. Install Google's Gemini SDK, and add `GEMINI_API_KEY` and `GEMINI_MODEL` to `.env.example` with empty values.
3. Add a server-only provider module with a fake version for tests.
4. Add generation functions that take only a test profile key, and return checked data or a refusal.
5. Define the structured formats for the four-week exercise plan and the seven-day menu.
6. Add the month checks: week one, weeks two to four, loads held, every menu day and words to avoid.
7. Add the three proofs in [validation.md](validation.md) that no saved profile can be sent.
8. Test every failure in the requirements, and confirm that only a 503 retries, and that none of them logs anything.

## 8. Choosing and building (Phases 10 and 11)

1. Add a table for one active plan per account in a new migration, deleted along with the account.
2. Add data functions that take the account ID from the session helper.
3. Add a server action that checks access, refuses a second build while one is running, then generates, checks and saves a month, or nothing.
4. Build the responsive `/test-plans` page with both notices, the profile cards and the loading state.
5. Add Start over with a confirmation.
6. Add the navigation link, shown only when the page is available.
7. Show the right result for each access situation, on both the page and the actions.
8. Extend the two-account tests and the wording test, allowing only the named unit labels.
9. Tell the project owner how to add their own key to `.env` themselves, without pasting it into a chat.

**Milestone 3:** run the automated checks and the Milestone 3 items in [validation.md](validation.md), then stop for the project owner's check.

## 9. Daily view and ticks (Phases 12, 14 and 15)

1. Add a function that works out the plan day, week, step and amounts from the saved plan, ticks, marks and date, using plain code with no database or UI.
2. Test it across all 28 days with a fake clock, including held weeks, load marks, the end of the month and a clock set before the start date.
3. Check each worked out week against the next week rules before showing it.
4. Add a table for load marks in a new migration.
5. Show the day's plan on `/today` with both notices, amounts, meals, portions and labeled estimates.
6. Extend the mark action so that only items on today's plan can be ticked, keeping sample lists working.
7. Add the load mark, the change wording and rest days.
8. Add read-only browsing of other days.
9. Show the access results for `/today`, and the end of month message.
10. Confirm that `/history` shows plan ticks.
11. Extend the two-account tests to ticks and marks.

**Milestone 4:** run the automated checks and the Milestone 4 items in [validation.md](validation.md), then stop for the project owner's check.

## 10. Validate and finish

1. Confirm that nothing writes personal data, prompts, responses or keys to logs.
2. Run a scripted browser journey through all 28 days on a fake clock, from outside the repo.
3. Update the repo state and AI row in [tech-stack.md](../tech-stack.md), and the open items in [safety-limits.md](../safety-limits.md).
4. Run every check in [validation.md](validation.md) and fix any failures.
5. Write the full list of new user-facing text into [validation.md](validation.md) for the project owner's review.
6. Record the results in [validation.md](validation.md).

**Milestone 5:** stop for the project owner's final walkthrough and wording sign-off. After approval, the project owner runs `/changelog` and merges into `main`.
