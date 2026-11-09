# Validation: AI Test Mode (Phases 9–15)

The branch can merge only when every check below passes and the project owner has approved the result. See [requirements.md](requirements.md) for the full requirements.

## Automated checks

Each command must exit successfully, starting from a clean install, with no dev or production server running, and with no `.env`, network access to Gemini or real database:

| Check | Command |
| --- | --- |
| Clean install | `npm ci` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Tests | `npm test` |
| Production build | `npm run build` |

## Required tests

`npm test` must include passing tests for each of these, using a fake provider and a temporary SQLite database, and never real Gemini or the real database file:

| Area | The tests show that |
| --- | --- |
| Limit values | Every value in the module matches [safety-limits.md](../safety-limits.md) |
| Aerobic | 150 and 300 minutes pass, 149 and 301 are refused, and anything other than moderate intensity is refused |
| Beginner first week | 150 aerobic minutes pass and 151 are refused, while a later Beginner week can rise by the approved increase |
| Strength days | Each level passes at both ends of its range, and is refused just outside it |
| Catalog | Unknown exercises, exercises from another level and first week amounts that differ from the catalog are refused |
| Aerobic increase | A rise of exactly 10% passes, a higher rise is refused, and no rise can pass 300 |
| No-load increase | 2 extra repetitions per set pass, and 3 are refused |
| Load increase | A marked rise of exactly 5% passes, a higher rise is refused, and any rise on an unmarked exercise is refused |
| Later weeks | Changed exercises, changed sets and lower amounts are refused |
| Calories | 1,500 kcal per day passes, a lower total is refused, and missing calories are refused |
| Weight loss | 0.9 kg per week passes, a higher number is refused, and a missing number is refused |
| Allergies and restrictions | A menu with a word to avoid is refused |
| Eligibility | A yes to either question refuses all goals, BMI just under 18.5 refuses weight loss only, BMI of exactly 18.5 is allowed, and unanswered questions leave test plans unavailable |
| Test profiles | Every built-in test profile meets the eligibility rules, and every catalog amount passes the checks |
| Invalid output | Bad JSON, unknown fields, wrong types, a failed limit, a timeout and a missing key all show nothing generated, save nothing and retry nothing |
| Access | Logged-out people, people with no profile, people with a yes answer and people with unanswered questions can't reach test plans through the page or its actions |
| BMI access | With a BMI under 18.5, weight loss test plans can't be viewed or generated, and other test profiles still work |
| Saved plans | A refused week leaves saved weeks unchanged, and saved plans aren't shown after a person becomes ineligible |
| Data separation | With two accounts, neither can read, generate over or start over the other's test plans, or read the other's answers |
| Tracking | `/today` and `/history` behave the same with no answers, a yes answer or no key |

### Saved profile proofs

All three must pass:

1. **Captured request:** the fake provider captures every outgoing request, for every generation type, and each one contains only the fields in the requirements, with values from the chosen built-in test profile.
2. **Marker values:** accounts are saved with unique marker values for age, height, weight and eligibility answers, then every generation type runs for those accounts. No marker value and no account email or ID appears in any request.
3. **Import boundary:** a test fails if generation or provider code imports, directly or indirectly, the profile, database, session or tracking modules.

Each proof must first show that it catches a planted failure.

### Wording test

The existing test is extended to all new text, and must still catch planted examples:

- **Numbers:** no digits, other than the existing 18 in the under-18 message.
- **Health measures:** the existing list stays refused, other than the unit labels shown with test plan amounts, which are kept in one named list.
- **Rewards, pressure and judgments:** the existing lists stay refused.
- **Approved text:** the five approved messages must match [safety-limits.md](../safety-limits.md) exactly.

## Connection check

Run these from this computer, and stop each server afterward:

- [ ] While `npm run start` is running, `http://127.0.0.1:3000` responds.
- [ ] While `npm run start` is running, every other local IPv4 address doesn't accept the connection on port 3000.
- [ ] While `npm run dev` is running, `http://127.0.0.1:3000` responds.
- [ ] While `npm run dev` is running, every other local IPv4 address doesn't accept the connection on port 3000.

## Manual checks

The project owner runs the site from a fresh database, using a modern browser, and with their own Gemini key from Milestone 2 onward. Each page is checked in responsive mode at a phone width of about 400px and at a desktop width. Use only made-up details for every account in these checks.

### Before code

- [x] The project owner approved the test profiles and starting amounts.
- [x] The approved values are recorded in [safety-limits.md](../safety-limits.md).

### Milestone 1: eligibility and limits (Phases 9 and 13)

- [ ] `/profile` shows both questions word for word, and both need an answer.
- [ ] A yes to either question shows the exact message for all goals.
- [ ] Weight loss with a BMI under 18.5 isn't saved, and shows the exact weight loss message.
- [ ] Another goal with that same BMI saves.
- [ ] A profile saved before this work still reaches `/today` and `/history`.
- [ ] The automated results show every limit test passing.
- [ ] The page doesn't scroll sideways at either width.

### Milestone 2: Gemini and first week (Phases 10 and 11)

- [ ] The test mode notice appears word for word, before any generate button.
- [ ] For each of the three test profiles, a live generation shows a valid first week or the neutral message, and never invalid output.
- [ ] At least one live first week appears, so that real Gemini output is proven to work.
- [ ] Every exercise shown is in the catalog, and first week amounts match it.
- [ ] Removing the key shows the neutral message, and nothing else.
- [ ] A plan remains after reloading, and is labeled as AI-created from a made-up profile.
- [ ] With a yes answer, the navigation link is gone, and opening `/test-plans` directly shows only the exact message.
- [ ] With a BMI under 18.5, weight loss test plans are hidden, and the other two test profiles are available.
- [ ] `/today` still shows the sample lists.
- [ ] The dev server log shows no typed values, prompts, responses or key.
- [ ] The page doesn't scroll sideways at either width.

### Milestone 3: weekly progression (Phase 12)

- [ ] For each test profile, a live next week shows a valid week or the neutral message, and never invalid output.
- [ ] The current week and each change are shown in neutral wording.
- [ ] A loaded exercise that isn't marked keeps its load.
- [ ] A marked loaded exercise rises by no more than the limit.
- [ ] Start over clears only that test profile's weeks.
- [ ] Nothing praises, rewards or pressures anyone.
- [ ] The page doesn't scroll sideways at either width.

### Milestone 4: menus and full journey (Phases 14 and 15)

Use two accounts, A and B, and create both from scratch.

- [ ] For each test profile, a live menu shows a valid result or the neutral message, and never invalid output.
- [ ] At least one live menu appears, so that real Gemini output is proven to work.
- [ ] The `test-a` menu has no peanuts in its ingredients, and the `test-b` menu has no meat or fish.
- [ ] The menu notice appears, and no page shows a daily target, calorie figure, portion or weight loss rate.
- [ ] Account B sees none of account A's test plans or answers.
- [ ] Changing a yes answer back and forth hides and shows test plans correctly.
- [ ] Test plans remain after the server restarts.
- [ ] `/today` and `/history` work as before.
- [ ] The not-medical-advice notice appears on every page.
- [ ] Every page is readable, usable and free of sideways scrolling at both widths.

## Wording sign-off

The project owner reads the full list of new text and signs off that it is neutral, makes no judgments on intake, doesn't reward eating less or training more, and doesn't suggest that a test plan is personal.

- [ ] Full list of new user-facing text recorded here.
- [ ] The project owner approved the list.

## Repo checks

- [ ] `/data/`, the database file and `.env` aren't tracked by Git.
- [ ] `.env.example` is tracked, and has `GEMINI_API_KEY` and `GEMINI_MODEL` with no real values.
- [ ] A search of the repo and its history on this branch finds no API key.
- [ ] All migrations are committed, and `npm run db:migrate` creates a fresh database and upgrades an MVP database without losing data.
- [ ] `specs/tech-stack.md` and `specs/safety-limits.md` are current.
- [ ] In `specs/roadmap.md`, only Phase 9–15 items changed, and the two items waiting for the provider for real people stay unticked.
- [ ] `specs/mission.md` and the earlier feature specs are unchanged.
- [ ] `dev` and `start` still use `-H 127.0.0.1`.

## Scope checks

- [ ] Generation never reads or sends a saved profile, and the three proofs pass.
- [ ] `specs/safety-limits.md` and `specs/roadmap.md` still say that generated menus are not safe for real use, and that stronger checks are required before any real person's details are used.
- [ ] The browser never calls Gemini, and the key never reaches it.
- [ ] Every health number in code traces to [safety-limits.md](../safety-limits.md).
- [ ] No paid tier, local model, personal AI plan, food database or calorie and weight formula was added.
- [ ] No daily target, calorie figure, weight loss rate, streak, reward, score or praise appears anywhere.
- [ ] The sample lists and tracking code are unchanged, and tracking doesn't depend on the safety or AI modules.
- [ ] Code review finds no logging of personal data, eligibility answers, prompts, responses, keys or session tokens.
- [ ] `logging.serverFunctions` stays off in `next.config.ts`.
- [ ] Access rules are enforced on the server, in pages and actions.
- [ ] The not-medical-advice notice and the home page sentence are unchanged.

## Results

Recorded at each milestone.

- **Milestone 1 automated checks:** on 2026-11-09, in a separate copy of the tracked and new files with no `.env` or database, clean install, lint, type check, 338 tests and a production build all passed.
- **Milestone 1 browser run:** on 2026-11-09, a scripted journey in headless Edge at 400px and 1280px passed on `npm run start`, using a throwaway database and made-up details. The server log contained no emails, passwords or eligibility text. It didn't replace the owner's walkthrough, and the Milestone 1 items stay unticked until the owner has checked them.

## Merge

Run `/changelog` and merge into `main` after all the checks above pass and the project owner has approved the result.
