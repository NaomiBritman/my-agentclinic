# Plan: AI Test Mode (Phases 9–15)

See [requirements.md](requirements.md) for scope and decisions, and [validation.md](validation.md) for merge criteria.

All work happens on the `ai-test-mode` branch. After every task group, run lint, type check and tests, and tick the finished items in [roadmap.md](../roadmap.md). Stop at each milestone until the project owner has checked the site in a browser. Commit only when the project owner asks.

## 1. Approvals before code

Done on 2026-11-09: the project owner approved the test profiles, starting amounts and Beginner first week limit, and they are recorded in [safety-limits.md](../safety-limits.md), along with the method for checking the 0.9 kg limit, the decision not to show the 1,500 kcal figure and the warning that generated menus are not safe for real use.

## 2. Eligibility (Phase 9)

1. Add the two eligibility answers to the `profile` table in a new migration, allowing empty values for existing profiles.
2. Add a plain eligibility module for BMI, both questions and the goal rules, using only the approved values.
3. Test the module for BMI just under and exactly at 18.5, each answer, each goal and unanswered questions.
4. Add the questions and approved messages to the wording module.
5. Update profile validation and the responsive `/profile` form, keeping what the person typed when something is refused.
6. Add a server helper that reports whether test plans are unavailable, available or missing answers, and which goals are hidden.
7. Extend the two-account tests to the answers.
8. Confirm that `/today` and `/history` still work for a profile with no answers.

## 3. Safety limits (Phases 9 and 13)

1. Add one plain limits module holding every approved value.
2. Define the types for an exercise week and a menu.
3. Add exercise checks for aerobic minutes, the Beginner first week limit, intensity, strength days, the catalog and first week amounts.
4. Add next week checks for aerobic increases, repetitions, load and marked exercises.
5. Add nutrition checks for the 1,500 kcal minimum and the expected weekly loss.
6. Test each limit at, just inside and just past its boundary, and test that missing values are refused.
7. Add a test showing that the safety module imports no UI, database or AI code.

**Milestone 1:** run the automated checks and the Milestone 1 items in [validation.md](validation.md), then stop for the project owner's check.

## 4. Test profiles and catalog (Phases 10, 11 and 14)

1. Add the approved test profiles as built-in data, with their words to avoid.
2. Add the approved exercise catalog with difficulty levels and starting amounts.
3. Test that every test profile meets the eligibility rules, and that every catalog amount passes the first week checks.

## 5. Gemini connection (Phase 10)

1. Check Gemini's current terms, available regions and free tier Flash models. If the terms have changed, or the project owner's region isn't available, stop and ask.
2. Install Google's Gemini SDK, and add `GEMINI_API_KEY` and `GEMINI_MODEL` to `.env.example` with empty values.
3. Add a server-only provider module with a fake version for tests.
4. Add generation functions that take only a test profile key, build the approved request and return checked data or a refusal.
5. Define the structured output format, and refuse anything that doesn't match it.
6. Add the three proofs in [validation.md](validation.md) that no saved profile can be sent.
7. Test every failure in the requirements, and confirm that none of them retries or logs anything.

## 6. Test plans page and first week (Phases 10 and 11)

1. Add a `test_plan` table in a new migration, with rows per account, test profile, type and week, deleted along with the account.
2. Add data functions that take the account ID from the session helper.
3. Add server actions that check access first, then generate, check and save a first week.
4. Build the responsive `/test-plans` page with the test mode notice, the made-up profile, the plan and its label.
5. Add the navigation link, shown only when the page is available.
6. Show the right result for each access situation in the requirements, on both the page and the actions.
7. Extend the two-account tests to test plans.
8. Extend the wording test to the new text, allowing only the named unit labels.

**Milestone 2:** run the automated checks and the Milestone 2 items in [validation.md](validation.md), then stop for the project owner's check. The project owner adds their own key to `.env` for this.

## 7. Weekly progression (Phase 12)

1. Add the load mark to the next week form.
2. Generate the next week from the previous test week and the marked exercises, and check it with the next week rules.
3. Show the current week and how each amount changed.
4. Add Start over.
5. Test a chain of weeks up to the aerobic cap, unmarked load staying the same, and a refused week leaving the saved weeks unchanged.
6. Reword the missed days item in [roadmap.md](../roadmap.md) only if needed, and leave it unticked.

**Milestone 3:** run the automated checks and the Milestone 3 items in [validation.md](validation.md), then stop for the project owner's check.

## 8. Test menu (Phase 14)

1. Define the structured menu format, including calories and the expected weekly loss for weight loss menus.
2. Generate a menu from a test profile key, and check it against the limits and words to avoid.
3. Show meals and ingredient names on the test plans page, with the menu notice and no numbers.
4. Show the neutral message when no menu can be produced.
5. Test menus at the calorie limit, at the weight loss limit, with missing numbers and with a word to avoid.
6. Confirm that the `/today` sample menu is unchanged.

## 9. Phase 15

1. Confirm that no page or message shows a daily target, calorie figure or weight loss rate.
2. Reword the Phase 15 display item in [roadmap.md](../roadmap.md) to say that limits are enforced and no target is shown, and tick it.
3. Leave the meal comparison unticked, waiting for the provider for real people.

## 10. Validate and finish

1. Confirm that nothing writes personal data, prompts, responses or keys to logs.
2. Update the repo state and AI row in [tech-stack.md](../tech-stack.md).
3. Update the open items in [safety-limits.md](../safety-limits.md).
4. Run every check in [validation.md](validation.md) and fix any failures.
5. Write the full list of new user-facing text into [validation.md](validation.md) for the project owner's review.
6. Record the results in [validation.md](validation.md).

**Milestone 4:** stop for the project owner's final walkthrough and wording sign-off. After approval, the project owner runs `/changelog` and merges into `main`.
