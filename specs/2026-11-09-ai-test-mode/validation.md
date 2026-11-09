# Validation: AI Test Mode (Phases 9–15 and Redesign)

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
| Catalog | Unknown exercises, exercises from another level and week one amounts that differ from the catalog are refused |
| Aerobic increase | A rise of exactly 10% passes, a higher rise is refused, and no rise can pass 300 |
| No-load increase | 2 extra repetitions per set pass, and 3 are refused |
| Load increase | A marked rise of exactly 5% passes, a higher rise is refused, and any rise on an unmarked exercise is refused |
| Month checks | A failure in any of the four weeks or seven menu days refuses the whole month, and saves nothing |
| Generated loads | Any load rise in the generated plan is refused |
| Later weeks | Changed exercises, changed sets and lower amounts are refused |
| Calories | 1,500 kcal per day passes, a lower total is refused, and missing calories are refused |
| Weight loss | 0.9 kg per week passes, a higher number is refused, and a missing number is refused |
| Allergies and restrictions | A menu with a word to avoid in a meal or ingredient name is refused |
| Eligibility | A yes to either question refuses all goals, BMI just under 18.5 refuses weight loss only, BMI of exactly 18.5 is allowed, and unanswered questions leave plans unavailable |
| Test profiles | Every built-in test profile meets the eligibility rules, and every catalog amount passes the checks |
| Invalid output | Bad JSON, unknown fields, wrong types, overlong text, a failed limit, a timeout and a missing key all show nothing generated, save nothing and retry nothing |
| Building | A second build for the same account is refused while one is running, and Start over removes only that account's plan |
| Access | Each situation in the requirements gives the right result, through both pages and actions |
| Hidden plans | With a yes answer or a hidden goal, an active plan isn't shown and accepts no ticks, and it returns if the person becomes eligible again |
| Days and weeks | With a fake clock, all 28 days map to the right week and menu day, the menu repeats, and day 29 ends the plan |
| Holding | A week with no exercise ticked repeats the same step, a week with only meal ticked also holds, and each rise is at most one step |
| Load marks | A mark needs a tick, unticking clears it, more than one mark gives one rise per week, and rounding never passes 5% |
| Worked out weeks | Every week worked out from ticks and marks passes the next week checks, and a failure shows no plan |
| Ticks | Ticks save per day, only items on today's plan can be ticked, past and future days can't be ticked, and a date from the browser is ignored |
| History | Plan ticks appear in `/history` with their stored names, and remain after Start over |
| Estimates | Every calorie figure and portion on the page carries the Gemini estimate label |
| No comparisons | The 1,500 kcal figure, weekly loss and ticked calorie totals never appear on any page |
| Data separation | With two accounts, neither can read, tick, mark, build over or start over the other's plan, or read the other's answers |
| Sample tracking | Sample lists behave as before when no plan is shown, with no answers, a yes answer or no key |

### Saved profile proofs

All three must pass:

1. **Captured request:** the fake provider captures every outgoing request, for both generation types, and each one contains only the fields in the requirements, with values from the chosen built-in test profile.
2. **Marker values:** accounts are saved with unique marker values for age, height, weight and eligibility answers, then every generation type runs for those accounts. No marker value and no account email or ID appears in any request.
3. **Import boundary:** a test fails if generation or provider code imports, directly or indirectly, the profile, database, session or tracking modules.

Each proof must first show that it catches a planted failure.

### Contrast test

A test reads the named colors in `globals.css`, and fails if any text and background pair in light or dark mode is below 4.5:1, or if any large text, icon or control outline is below 3:1. It must first show that it catches a planted failure. The small accent color can't be used for text.

### Wording test

The existing test is extended to all new text, and must still catch planted examples:

- **Numbers:** no digits, other than the existing 18 in the under-18 message.
- **Health measures:** the existing list stays refused, other than the unit labels shown with plan amounts, which are kept in one named list.
- **Rewards, pressure and judgments:** the existing lists stay refused.
- **Targets:** target, budget, allowance and minimum are refused in all site text.
- **Approved text:** the six approved messages must match [safety-limits.md](../safety-limits.md) exactly.

## Accessibility scan

An automated accessibility scan runs from outside the repo against every page, at phone and desktop widths, in light and dark. It must report no serious or critical problems. The results are recorded below.

## Connection check

Run these from this computer, and stop each server afterward:

- [ ] While `npm run start` is running, `http://127.0.0.1:3000` responds.
- [ ] While `npm run start` is running, every other local IPv4 address doesn't accept the connection on port 3000.
- [ ] While `npm run dev` is running, `http://127.0.0.1:3000` responds.
- [ ] While `npm run dev` is running, every other local IPv4 address doesn't accept the connection on port 3000.
- [ ] While browsing the site, the browser makes no requests to any address other than `127.0.0.1`.

## Manual checks

The project owner uses a modern browser, with their own Gemini key from Milestone 3 onward. Each page is checked in responsive mode at a phone width of about 400px and at a desktop width. Use only made-up details for every account in these checks.

### Before code

- [x] The project owner approved the test profiles and starting amounts.
- [x] The approved values are recorded in [safety-limits.md](../safety-limits.md).
- [x] The project owner approved this updated spec, including the words to avoid.

### Milestone 1: eligibility and limits (Phases 9 and 13)

- [x] `/profile` shows both questions word for word, and both need an answer.
- [x] A yes to either question shows the exact message for all goals.
- [x] Weight loss with a BMI under 18.5 isn't saved, and shows the exact weight loss message.
- [x] Another goal with that same BMI saves.
- [x] A profile saved before this work still reaches `/today` and `/history`.
- [x] The automated results show every limit test passing.
- [x] The page doesn't scroll sideways at either width.

### Milestone 2: redesign

- [x] Every page has the teal and coral look, with the same band, cards, buttons and fields.
- [x] The look works in both light and dark, following the device setting.
- [x] All text is easy to read, including notices, muted text, and text on the band.
- [x] Wide screens use the space well, and phones feel designed for phones.
- [x] Buttons, ticks and radio buttons are easy to press on a phone.
- [x] Keyboard focus is clearly visible.
- [x] There are no photos or illustrations of people, and no person icons.
- [x] The wording is unchanged, and everything from Milestone 1 still works.
- [x] No page scrolls sideways at either width.

### Milestone 3: choosing and building (Phases 10 and 11)

- [ ] `/test-plans` shows both notices word for word, above the profiles.
- [ ] The three made-up profiles appear, labeled as made-up.
- [ ] Pressing build shows the loading state straight away, and the button can't be pressed twice.
- [ ] For each of the three profiles, a live build produces a complete valid month at least once, pressing the button again if needed. If one keeps failing, stop and ask.
- [ ] A refused build shows only the neutral message, and never invalid output.
- [ ] Removing the key shows the neutral message, and nothing else.
- [ ] Start over asks for confirmation, then removes the plan.
- [ ] With a yes answer, the navigation link is gone, and opening `/test-plans` directly shows only the exact message.
- [ ] With a BMI under 18.5, `test-a` is hidden, and the other two profiles are available.
- [ ] The dev server log shows no typed values, prompts, responses or key.
- [ ] The page doesn't scroll sideways at either width.

### Milestone 4: daily view and ticks (Phases 12, 14 and 15)

- [ ] `/today` shows that day's exercises with minutes or sets, and meals with portions.
- [ ] Both notices appear on every day.
- [ ] Every calorie figure and portion is labeled as a Gemini estimate, and nothing calls one a target.
- [ ] No page shows the 1,500 kcal figure, a weight loss rate, or a total of ticked calories.
- [ ] Ticks remain after reloading, and today's ticks appear in `/history` the next day.
- [ ] Browsing other days is read-only, and later weeks show amounts within the limits.
- [ ] `test-a` starts at 150 aerobic minutes.
- [ ] A loaded exercise can be marked only once it is ticked.
- [ ] The `test-a` menu has no peanuts, and the `test-b` menu has no meat or fish.
- [ ] The menu notice appears on every day.
- [ ] Rest days and change wording read neutrally, with no praise or pressure.
- [ ] With a yes answer, `/today` shows the exact message and the sample lists, with no plan.
- [ ] The page doesn't scroll sideways at either width.

### Milestone 5: full journey

Use two accounts, A and B, and create both from scratch.

- [ ] Sign up, save a profile, choose a made-up profile, build a month, and tick today's items, in one sitting.
- [ ] The scripted results show all 28 days, held weeks and load marks passing.
- [ ] Account B sees none of account A's plan, ticks or answers.
- [ ] Changing a yes answer back and forth hides and shows the plan correctly.
- [ ] The plan and ticks remain after the server restarts.
- [ ] `/history` works as before.
- [ ] The not-medical-advice notice appears on every page.
- [ ] Every page is readable, usable and free of sideways scrolling at both widths, in light and dark.

## Wording sign-off

The project owner reads the full list of new text and signs off that it is neutral, makes no judgments on intake, doesn't reward eating less or training more, and doesn't suggest that a demonstration plan is personal or should be followed.

- [ ] Full list of new user-facing text recorded here.
- [ ] The project owner approved the list.

## Repo checks

- [ ] `/data/`, the database file and `.env` aren't tracked by Git.
- [ ] `.env.example` is tracked, and has `GEMINI_API_KEY` and `GEMINI_MODEL` with no real values.
- [ ] A search of the repo and its history on this branch finds no API key.
- [ ] All migrations are committed, and `npm run db:migrate` creates a fresh database and upgrades an MVP database without losing data.
- [ ] `specs/tech-stack.md` and `specs/safety-limits.md` are current.
- [ ] In `specs/roadmap.md`, the meal comparison item stays unticked, waiting for the provider for real people.
- [ ] The earlier feature specs are unchanged.
- [ ] `dev` and `start` still use `-H 127.0.0.1`.

## Scope checks

- [ ] Generation never reads or sends a saved profile, and the three proofs pass.
- [ ] `specs/safety-limits.md` and `specs/roadmap.md` still say that generated menus are not safe for real use, and that stronger checks are required before any real person's details are used.
- [ ] The browser never calls Gemini, and the key never reaches it.
- [ ] Every health number in code traces to [safety-limits.md](../safety-limits.md).
- [ ] No paid tier, local model, personal AI plan, food database or calorie and weight formula was added.
- [ ] No target, streak, reward, score, percentage, progress bar or praise appears anywhere.
- [ ] Sample list tracking doesn't depend on the safety or AI modules.
- [ ] Code review finds no logging of personal data, eligibility answers, prompts, responses, keys or session tokens.
- [ ] `logging.serverFunctions` stays off in `next.config.ts`.
- [ ] Access rules are enforced on the server, in pages and actions.
- [ ] The not-medical-advice notice is unchanged, and the home page shows the approved sentence.

## Results

Recorded at each milestone.

- **Milestone 1 automated checks:** on 2026-11-09, in a separate copy of the tracked and new files with no `.env` or database, clean install, lint, type check, 338 tests and a production build all passed.
- **Milestone 1 browser run:** on 2026-11-09, a scripted journey in headless Edge at 400px and 1280px passed on `npm run start`, using a throwaway database and made-up details. The server log contained no emails, passwords or eligibility text.
- **Milestone 1 walkthrough:** on 2026-11-09, the project owner checked all eleven walkthrough items at phone and desktop widths, and it passed.
- **Milestone 2 automated checks:** on 2026-11-09, in a separate copy with no `.env` or database, clean install, lint, type check, 405 tests and a production build all passed. After three small design fixes, lint, type check and 405 tests passed again, and a production build with no `.env` passed.
- **Milestone 2 browser run:** on 2026-11-09, on the final code, a scripted run in headless Edge covered all seven pages at 400px and 1280px, in light and dark, using a throwaway database and made-up details. All 199 checks passed, covering sideways scrolling, the font, body text size, touch targets, images, keyboard focus, reduced motion and outside requests. The Milestone 1 flows passed all 56 checks on the new design. The server log contained no emails, passwords, notes or eligibility text.
- **Milestone 2 accessibility scan:** on the final code, axe found no problems of any severity on all seven pages in both widths and modes. It can't fully judge text on the gradient band, which the contrast test covers.

- **Milestone 2 walkthrough:** on 2026-11-09, the project owner checked all nine walkthrough items at phone and desktop widths, and it passed. The owner then asked for the new home page sentence, card links and restyled tick boxes, and approved the page-not-found wording.
- **After those changes:** a clean install, lint, type check and 408 tests passed in a separate copy. After one more small fix, lint, type check, 408 tests and a production build with no `.env` passed, and the browser run passed all 207 checks and the Milestone 1 flows all 56, on a throwaway server on port 3100. Axe found no problems.
- **Test accounts in the real database:** on 2026-11-09, a browser run reached the project owner's own dev server on port 3000, because port 3000 wasn't checked first. It added 5 `@example.com` test accounts with made-up details and 2 ticks to the real database, and changed nothing on the 2 existing accounts. Test scripts now refuse to use port 3000.

## Merge

Run `/changelog` and merge into `main` after all the checks above pass and the project owner has approved the result.
