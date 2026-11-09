# Requirements: AI Test Mode (Phases 9–15)

## Context

This work covers Phases 9–15 of the [roadmap](../roadmap.md), on one branch named `ai-test-mode`. It adds the safety limits and eligibility rules, connects the Gemini API, and adds a separate test plans page that shows AI exercise plans and menus created from built-in made-up test profiles.

No real person gets a personal AI plan or menu from this work. Until the project owner chooses a paid tier or a local model, generation never reads or sends a saved profile, and `/today` keeps using the sample lists.

Guidance:

- [Mission](../mission.md): limits are firm, AI output is checked in code, goals don't override safety, and wording stays neutral.
- [Tech stack](../tech-stack.md): server-side AI, structured output, failing closed, responsive pages and no personal data in logs.
- [Safety limits](../safety-limits.md): every approved value, source, eligibility rule, approved message and AI data rule. If this spec and that file ever disagree, that file wins.

The repo currently has accounts, a profile and goal, sample tracking and read-only history. It has no safety module, eligibility questions, exercise catalog or AI code. The wording test refuses digits and words such as "minutes" and "sets" in site text.

## Approved test data

The project owner approved these values on 2026-11-09 as owner decisions, and they are recorded in [safety-limits.md](../safety-limits.md). They have no health source.

### Made-up test profiles

These describe no real person. Each one meets the eligibility rules, so its plans can be generated.

| Key | Age | Height | Weight | Level | Goal | Allergies | Dietary restrictions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `test-a` | 40 | 170 cm | 80 kg | Beginner | Weight loss | Peanuts | None |
| `test-b` | 30 | 165 cm | 62 kg | Intermediate | Toning | None | Vegetarian |
| `test-c` | 25 | 180 cm | 75 kg | Experienced | Muscle building | None | None |

### Exercise catalog and starting amounts

| Exercise | Level | Type | Starting amount |
| --- | --- | --- | --- |
| Brisk walking | All | Aerobic, moderate | Minutes chosen within the aerobic limits |
| Easy cycling | All | Aerobic, moderate | Minutes chosen within the aerobic limits |
| Wall push-ups | Beginner | No load | 2 sets of 8 repetitions |
| Chair squats | Beginner | No load | 2 sets of 8 repetitions |
| Glute bridges | Beginner | No load | 2 sets of 8 repetitions |
| Knee push-ups | Intermediate | No load | 3 sets of 8 repetitions |
| Goblet squats | Intermediate | Load | 3 sets of 8 repetitions at 6 kg |
| Dumbbell rows | Intermediate | Load | 3 sets of 8 repetitions at 6 kg |
| Push-ups | Experienced | No load | 3 sets of 10 repetitions |
| Goblet squats | Experienced | Load | 3 sets of 8 repetitions at 12 kg |
| Dumbbell rows | Experienced | Load | 3 sets of 8 repetitions at 12 kg |

## Scope

### In scope

| Phase | Work |
| --- | --- |
| 9 | Eligibility questions and messages, plus exercise limits and eligibility rules in a standalone module |
| 10 | Gemini connection, built-in test profiles, structured output, invalid output checks and the test mode notice |
| 11 | Exercise catalog, a first test week and the test plans page, hidden when the eligibility rules require it |
| 12 | Next test weeks within the limits, showing the current week and how difficulty changed |
| 13 | Nutrition limits in the safety module |
| 14 | Test menus checked against the limits, allergies and restrictions, shown on the test plans page |
| 15 | Enforcing the approved limits in code, with no daily target shown |

Supporting work:

- A login-protected `/test-plans` page and a navigation link.
- Updating `.env.example`, `specs/safety-limits.md`, `specs/tech-stack.md` and `specs/roadmap.md`.
- Extending the wording test to the new text.

### Out of scope

- Sending or reading a saved profile for generation, a paid tier, a local model and personal AI plans or menus.
- Replacing or changing the sample lists on `/today`, or tracking generated plans.
- Holding progression after missed days, and comparing tracked meals with targets. Both wait for the provider for real people.
- Showing any daily target, calorie figure or weight loss rate.
- Any health value that isn't in [safety-limits.md](../safety-limits.md) or approved through the pending section above.
- A food database, a calorie or weight formula, vigorous exercise and new goals or fitness levels.
- Phase 16, public deployment and changes to the `127.0.0.1` limit.
- Changing the not-medical-advice notice or the home page sentence.

## Functional requirements

### Eligibility (Phase 9)

1. `/profile` asks the two approved questions, word for word, each with a required Yes or No answer. Validation runs on the server.
2. Answers are saved with the person's profile, are never sent to the AI provider, and are never written to logs.
3. BMI is worked out on the server from the saved height and weight, as weight in kilograms divided by height in metres squared, with no rounding before the comparison.
4. A yes to either question saves the answer and shows the approved message for all goals on `/profile`.
5. Choosing Weight loss with a BMI under 18.5 isn't saved, and the form shows the approved weight loss message while keeping what the person typed. Other goals can still be saved unless another rule applies.
6. If a saved profile already has Weight loss and its BMI falls under 18.5 after an edit is attempted, that edit is refused in the same way. Older saved rows that break the rule show the approved weight loss message on `/profile`.
7. A person whose existing profile has no answers can keep using `/today` and `/history`, as tracking doesn't depend on the safety module. Test plans stay unavailable until both questions are answered.
8. The rules live in a plain TypeScript module with no UI, database or AI dependencies.

### Safety module (Phases 9, 13 and 15)

9. Every limit value lives in one module, matches [safety-limits.md](../safety-limits.md) and is used by every check.
10. An exercise week is refused unless all of these hold:
    - Aerobic minutes are from 150 to 300 per week, and every aerobic item is moderate intensity.
    - In a Beginner's first week, aerobic minutes are at most 150, which with the minimum means exactly 150.
    - Strength days fall within the range for the fitness level: Beginner 2 to 3, Intermediate 3 to 4, Experienced 4 to 5.
    - Every exercise is in the catalog at the profile's fitness level.
    - In a first week, sets, repetitions and load exactly match the approved catalog amounts.
11. A next week is also refused unless all of these hold:
    - Aerobic minutes rise by at most 10%, and stay at or under 300.
    - The exercises and sets are the same as the previous week, and so are the repetitions of loaded exercises, because no increase is approved for them.
    - No-load exercises gain at most 2 repetitions per set.
    - Load rises by at most 5%, and only for an exercise marked as done with one to two extra repetitions. Otherwise its load doesn't change.
    - No amount falls below the previous week.
12. A menu is refused unless its stated calories for each day add up to at least 1,500 kcal.
13. A weight loss menu must also state its expected weekly loss, and is refused if that number is missing or above 0.9 kg. This number is Gemini's own estimate and isn't independently verified.
14. Menu calories are also Gemini's own figures, because there is no food database. They are used for checks and are never shown.

**Generated menus are not safe for real use.** The calorie, weight loss and allergy checks rely on Gemini's own figures or word matching, and stronger checks are required before any real person's details are used.

### AI connection (Phase 10)

15. Gemini is called only on the server, with the key read only from `.env` as `GEMINI_API_KEY`. `.env.example` lists the name with an empty value.
16. The model is a Flash model available on the free tier, set by `GEMINI_MODEL` in `.env`.
17. Generation functions take a test profile key, not profile values, and look the profile up from the built-in list. Their code can't import profile, database or session modules.
18. A request contains only:
    - the test profile's age, height, weight, fitness level, goal, allergies and dietary restrictions
    - the catalog, the limits and the output format
    - for a next week, the previous test week and which loaded exercises may increase
19. The agent returns structured data in a defined format. All of its output is untrusted until it passes the safety module.
20. A missing key, network failure, timeout, unknown field, invalid format or failed limit shows nothing generated, only the neutral message in the wording table. Nothing retries automatically, which protects the free tier quota.
21. Prompts, responses, test plans and keys are never written to logs.

### Test plans page (Phases 10–12 and 14)

22. `/test-plans` requires login and a saved profile, following the same rule as `/today`.
23. The approved test mode notice appears, word for word, before any generate button.
24. The navigation link appears only when the page is available to that person.
25. All access rules are checked on the server, in both the page and its actions:

| Person's situation | What happens |
| --- | --- |
| Both questions not yet answered | Sent to `/profile` to answer them |
| Yes to either question | The approved message for all goals, with no test plan, button or link |
| BMI under 18.5 | Weight loss test profile and plans hidden, with the approved weight loss message; other test profiles stay available |
| Under 18 | Can't reach the page, because the profile can't be saved |
| Everyone else | All three test profiles are available |

26. Generation only happens when the person presses a button. Results are saved per account and test profile, so they remain after reloading, and one account can't read another's.
27. Saved test plans remain stored but aren't shown if the person later becomes ineligible.
28. Each test week shows the made-up profile, the exercises, days, sets, repetitions, load and minutes, and a label saying it was created by AI from a made-up profile and isn't a personal plan.
29. "Next week" is created when the person presses a button, without waiting for a calendar week. Before pressing, they can mark loaded exercises as done with one to two extra repetitions, for the made-up profile only.
30. The page shows the current week and how each amount changed from the previous week, in neutral wording. It shows no streaks, rewards or praise.
31. A person can start a test profile over, which replaces its saved weeks and menu.

### Test menu (Phase 14)

32. Each test menu uses the test profile's made-up allergies and dietary restrictions.
33. The test profile has a built-in list of words to avoid for its allergies and restrictions. A menu is refused if any listed ingredient contains one. This is a word match, not proof that a menu is safe.
34. The menu shows meals and ingredient names, with no portions, calories or weight loss rate.
35. The page says that the test menu isn't for real use, that AI menus can contain mistakes, and that people with allergies should check ingredients.

### Phase 15

36. The site shows no daily target and no 1,500 kcal figure. Code still enforces the approved limits on every menu.
37. The Phase 15 item in the roadmap is reworded to match, and the meal comparison stays waiting for the provider for real people.

### All pages

38. Every new or changed page works at phone and desktop widths without sideways scrolling.
39. Every page keeps the not-medical-advice footer.
40. `/today`, `/history`, the sample lists and tracking code are unchanged, other than the navigation link.

### Wording

These messages are approved, and are used as written:

| Where | Text |
| --- | --- |
| Eating disorder question | Have you been diagnosed with or treated for an eating disorder? |
| Medical question | Do you have a medical condition, injury or doctor's restriction that affects exercise or eating? |
| No plan for any goal | My Fit Plan can't create a plan for you. A health professional can help you find what suits you. |
| BMI under 18.5, weight loss | My Fit Plan can't create a weight loss plan for you. A health professional can help you find what suits you. |
| Test mode notice | Test mode: this plan is created from a made-up sample profile. Your saved details are not sent. |

These are drafts for the project owner's wording sign-off:

| Where | Draft text |
| --- | --- |
| Navigation and heading | Test plans |
| Test plan label | Created by AI from a made-up profile. This isn't a personal plan. |
| Create buttons | Create first week / Create next week / Create test menu / Start over |
| Load mark | Current load done with one to two extra repetitions |
| No plan produced | No test plan could be produced within the safety limits, so nothing is shown. A health professional can help you find what suits you. |
| No menu produced | No test menu could be produced within the safety limits, so nothing is shown. A health professional can help you find what suits you. |
| Menu notice | This test menu isn't for real use. AI menus can contain mistakes, and people with allergies should check ingredients. |
| Yes and no | Yes / No |
| Question not answered | Choose yes or no. |
| Amount changes | No change / Increased |

## Decisions

| Decision | Choice | Reason |
| --- | --- | --- |
| Delivery | One `ai-test-mode` branch, one spec | Requested by the project owner |
| Review stops | Four milestones: Phases 9 and 13, Phases 10–11, Phase 12, Phases 14–15 | Limits exist before anything is generated, and each stop has something to check |
| Test profiles | Approved by the owner before code | Gemini needs believable values, and they must not be invented without approval |
| Beginner first week | At most 150 aerobic minutes, then the approved weekly increase | Owner decision, so a Beginner doesn't start at the top of the range |
| Menu safety | Generated menus are recorded as not safe for real use | The checks rely on Gemini's own figures or word matching, so stronger checks are required before real details are used |
| Starting amounts | Approved catalog amounts | No unapproved sets, repetitions or load can appear in a first week |
| Gemini's role | Chooses exercises, days and aerobic minutes in a first week; proposes increases in later weeks | All of it is checked against the approved limits |
| 0.9 kg limit | Gemini states the expected weekly loss, and code refuses a missing or higher number | No formula is approved, and the check fails closed, though it relies on Gemini's estimate |
| 1,500 kcal figure | Enforced, not shown, with Phase 15 displaying nothing | A minimum shown as a target could read as a number to aim for |
| Menu numbers | No calories or portions shown | Follows the choice above, and Gemini's figures aren't verified |
| Allergy check | Word match against a built-in list | There is no food database, and the page warns that menus can contain mistakes |
| Saved results | Per account | Keeps each person's page separate, and lets weeks build on each other |
| Next week timing | Button press, not a calendar week | Lets test mode be reviewed without waiting |
| Load rule in test mode | The person marks it for the made-up profile | The rule needs this signal, and a made-up profile can't exercise |
| Sets in later weeks | Stay the same | No weekly increase for sets is approved |
| Eligibility answers | Stored with the profile | The page must apply the rules on every visit |
| Tracking with a yes answer | Stays available | The tech stack keeps tracking separate from the limits |
| Tests | Fake provider in `npm test`, with live runs by the owner | Tests need no key or quota, and the owner still sees real output |

## Constraints

- Health numbers appear only in the safety module, the approved catalog and the approved test profiles, and in tests of those values.
- No real person's details are used until a paid tier or local model is chosen and stronger menu checks exist.
- Generation code never receives a saved profile, through any path.
- A person's eligibility answers and saved details are read only for access rules on the server, and that code stays separate from generation.
- Tracking code doesn't depend on the safety or AI modules.
- `npm test` and `npm run build` need no key, network access or real database.
- Weight, profile details, eligibility answers, prompts, responses, API keys and session tokens must never be written to logs.
- `npm run dev` and `npm run start` stay limited to `127.0.0.1`.
