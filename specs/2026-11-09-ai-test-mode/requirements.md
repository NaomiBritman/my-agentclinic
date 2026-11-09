# Requirements: AI Test Mode (Phases 9–15 and Redesign)

## Context

This work covers Phases 9–15 of the [roadmap](../roadmap.md) and a redesign of the whole site, on one branch named `ai-test-mode`. A person chooses a built-in made-up profile, Gemini builds a one-month demonstration plan from that profile and its goal, and a daily view shows what to do that day, with ticks saved per day.

The project owner changed this scope on 2026-11-09, after Milestone 1 passed. The full experience runs on the free Gemini tier with built-in made-up profiles only, and the owner won't pay for now. These earlier decisions are replaced:

| Earlier decision | Now |
| --- | --- |
| Generated plans stay off the daily view | `/today` shows the generated plan for that day |
| No calories shown | Estimated calories are shown, each labeled as a Gemini estimate and never as a target |
| No portions shown | Portions are shown, labeled as Gemini estimates |
| A week is created by pressing a button | One month is built at once, and weeks follow the calendar |

Everything else still applies. Saved profiles are never sent, the eligibility rules and hiding stay, the 1,500 kcal minimum stays, and the test mode notice stays. A new notice says this is a demonstration and not a plan to follow.

Guidance:

- [Mission](../mission.md): limits are firm, AI output is checked in code, goals don't override safety, and wording stays neutral.
- [Tech stack](../tech-stack.md): server-side AI, structured output, failing closed, responsive pages and no personal data in logs.
- [Safety limits](../safety-limits.md): every approved value, source, eligibility rule, message and AI data rule. If this spec and that file ever disagree, that file wins.

Milestone 1 is complete and committed: the eligibility questions, approved messages and safety module exist. The site has plain styling, and has no exercise catalog, test profiles or AI code yet.

**Generated menus are not safe for real use.** The calorie, weight loss and allergy checks rely on Gemini's own figures or word matching, and stronger checks are required before any real person's details are used.

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

### Words to avoid

The project owner approved these lists on 2026-11-09. A word match can't prove that a menu is safe.

| Profile | Words |
| --- | --- |
| `test-a` | peanut, groundnut, arachis, satay, mixed nuts, nut butter |
| `test-b` | beef, pork, ham, bacon, lamb, mutton, veal, chicken, turkey, duck, fish, salmon, tuna, cod, anchovy, anchovies, sardine, shrimp, prawn, crab, lobster, gelatin, gelatine, meat, sausage, salami, pepperoni, prosciutto, squid, mussel, oyster, clam |

## Scope

### In scope

| Area | Work |
| --- | --- |
| Phases 9 and 13 | Eligibility and the safety module (done in Milestone 1) |
| Redesign | New look for every page, in light and dark, with a shared set of components |
| Phase 10 | Gemini connection, built-in test profiles, structured output, invalid output checks and both notices |
| Phase 11 | Exercise catalog, choosing a made-up profile, and a four-week exercise plan |
| Phase 12 | Weekly difficulty within the limits, holding after an empty week, and load rises after a mark |
| Phase 14 | A seven-day menu that repeats each week, checked against the limits, allergies and restrictions |
| Phase 15 | Estimated calories shown as labeled estimates, with no daily target |
| Daily view | `/today` shows that day's plan, with ticks saved per day and read-only browsing of other days |

Supporting work:

- A login-protected `/test-plans` page and a navigation link.
- Updating `.env.example`, `specs/safety-limits.md`, `specs/tech-stack.md` and `specs/roadmap.md`.
- Extending the wording test to the new text.

### Out of scope

- Sending or reading a saved profile for generation, a paid tier, a local model and personal AI plans or menus.
- Comparing tracked meals with any target, running totals of ticked calories, and progress bars or percentages.
- Showing the 1,500 kcal figure, any daily target or any weight loss rate.
- Any health value that isn't in [safety-limits.md](../safety-limits.md).
- A food database, a calorie or weight formula, vigorous exercise and new goals or fitness levels.
- Photos of people, illustrations of people and person icons.
- Editing past days, Phase 16, public deployment and changes to the `127.0.0.1` limit.
- Changing the not-medical-advice notice.

## Functional requirements

### Eligibility (Phase 9, done)

1. `/profile` asks the two approved questions, word for word, each with a required Yes or No answer. Validation runs on the server.
2. Answers are saved with the person's profile, are never sent to the AI provider, and are never written to logs.
3. BMI is worked out on the server from the saved height and weight, with no rounding before the comparison.
4. A yes to either question saves the answer and shows the approved message for all goals on `/profile`.
5. Choosing Weight loss with a BMI under 18.5 isn't saved, and the form shows the approved weight loss message while keeping what the person typed. Other goals can still be saved unless another rule applies.
6. Older saved rows that break the rule show the approved weight loss message on `/profile`.
7. The rules live in a plain TypeScript module with no UI, database or AI dependencies.

### Who can use plans

8. A saved profile is still required, because the eligibility rules need it. It is read only for those rules and is never used to build a plan.
9. All access rules are checked on the server, in pages and in actions:

| Person's situation | `/test-plans` | `/today` |
| --- | --- | --- |
| Questions not yet answered | Sent to `/profile` to answer them | Sample lists, with a prompt to answer the questions |
| Yes to either question | The approved message for all goals, with no plan, button or link | The approved message and the sample lists, with no plan or prompt |
| BMI under 18.5 | `test-a` hidden, with the approved weight loss message; other profiles available | The approved weight loss message if the active plan is `test-a`, with no plan shown |
| Under 18 | Can't reach the page, because the profile can't be saved | Same |
| Eligible, no active plan | All available profiles | A prompt to choose a made-up profile, with the sample lists below |
| Eligible, active plan | The active plan's summary and Start over | That day's plan |

10. The navigation link to `/test-plans` appears only when the page is available to that person.
11. A plan that becomes hidden stays stored, isn't shown, and accepts no ticks. It returns if the person becomes eligible again.

### Choosing and building (Phases 10 and 11)

12. `/test-plans` shows the test mode notice and the demonstration notice, word for word, above the profiles.
13. Each available profile appears as a card showing its made-up details, labeled as made-up, with a button to build a plan.
14. Pressing the button shows a loading state straight away, with a status message for screen readers, the button disabled and a second press ignored. The server also refuses a second build for the same account while one is running.
15. A build is two Gemini requests: a four-week exercise plan and a seven-day menu. Both must pass every check, or nothing is saved or shown. The person then sees one of the neutral messages in requirement 24, and can press the button again.
16. Each request stops after two minutes. Only an HTTP 503 from Gemini is retried, at most twice per build in total, with a 20-second wait before each retry, so a build sends at most four requests. Nothing else is retried, including timeouts and safety rule failures, which protects the free tier quota.
17. After a build, the person goes to `/today`, and today becomes day one of the plan. Until the daily view exists at Milestone 4, the person goes to the plan's summary on `/test-plans` instead.
18. An account has one active plan. Start over asks for confirmation, then removes the active plan. Past ticks stay in `/history`.

### AI connection (Phase 10)

19. Gemini is called only on the server, with the key read only from `.env` as `GEMINI_API_KEY`. `.env.example` lists the name with an empty value. The project owner adds the key to `.env` themselves, and it is never pasted into a chat.
20. The model is a Flash model available on the free tier, set by `GEMINI_MODEL` in `.env`. The project owner uses `gemini-3.6-flash` for now, because it answered their short test request while the other model names they tried didn't work.
21. Generation functions take a test profile key, not profile values, and look the profile up from the built-in list. Their code can't import profile, database or session modules.
22. A request contains only the test profile's age, height, weight, fitness level, goal, allergies and dietary restrictions, along with the catalog, the limits and the output format.
23. The agent returns structured data in a defined format. All of its output is untrusted until it passes the safety module. Text fields have length limits, and unknown fields are refused.
24. Any failure shows nothing generated, and saves nothing, with one of three neutral messages:
    - **A failed safety rule:** the no plan produced message. This message is used for nothing else.
    - **A 503 that remains after the retries, a timeout or a 504:** the Gemini busy message.
    - **Anything else:** the Gemini couldn't be reached message. This covers a missing key, an invalid key, permission, model not found, quota, other server errors, network failures and output in an unusable format.
25. Prompts, responses, plans and keys are never written to logs.

### Plan checks (Phases 9, 12–14)

26. Week one must pass the first week checks, including the Beginner limit of at most 150 aerobic minutes and the approved catalog amounts.
27. Weeks two to four must each pass the next week checks against the week before: aerobic minutes rise at most 10% and never pass 300, no-load exercises gain at most 2 repetitions per set, exercises and sets stay the same, and nothing falls.
28. Loads in the generated plan stay at the catalog amount in all four weeks. A generated load rise is refused.
29. Every menu day's estimated calories must add up to at least 1,500 kcal. Weight loss menus must state an expected weekly loss of at most 0.9 kg.
30. A menu is refused if any meal name or ingredient name contains one of the profile's words to avoid.

### Weekly difficulty (Phase 12)

31. Plan weeks follow the calendar from the start date: days 1–7 are week one, and so on to day 28.
32. Each plan has four difficulty steps, one for each generated week. Week one uses step one.
33. A new week moves up one step if at least one exercise was ticked in the week before. If none was ticked, the new week repeats the same step. Later steps shift, so each rise is still at most one step, and the plan may end before reaching step four. Meal ticks don't affect difficulty.
34. On a day with a loaded exercise, once it is ticked, the person can also mark it as done with one to two extra repetitions. Unticking clears the mark.
35. A marked exercise rises by at most 5% from the next plan week, rounded down to 0.1 kg, whatever the step. It rises only once per week, however many times it was marked. An unmarked load stays the same.
36. The server works out each week's amounts from the saved plan, ticks and marks, and checks them against the next week rules again before showing them. If that check fails, the plan isn't shown.
37. The daily view shows each exercise's change from the previous week in neutral wording.

### Daily view

38. `/today` shows the date, the plan day and week, the demonstration notice, the test mode notice, and the day's exercises and meals. A day with no exercises says it is a rest day.
39. Each exercise shows minutes, or sets and repetitions, and a load if it has one.
40. Each meal shows its name, its ingredients with portions, and its estimated calories. The day shows its estimated total.
41. Every calorie figure and portion is labeled as a Gemini estimate. None is ever called a target, goal, minimum, budget or allowance.
42. The page doesn't add up ticked calories, compare intake with anything, or comment on what was or wasn't ticked.
43. Ticks are saved per account and per day. Each tick stores the item's name, so `/history` stays correct, and the server checks that the item is on that day's plan.
44. Only today can be ticked. The date comes from this computer's clock on the server, never from the browser.
45. The person can browse any day of the plan, read-only, with previous and next links and a clear way back to today. Later days show amounts as they stand now, labeled as subject to change.
46. After day 28, the page says the demonstration month has ended, and offers to build another. No more ticks can be added to that plan.
47. The note for anything else eaten stays as it is, and is never counted or scored.
48. The existing exercise completion messages stay. Sample list ticks work as before when no plan is shown.

### Redesign

49. Every page uses the same shared components: page band, card, button, form field, notice, tick item and navigation. Pages don't restyle these individually.
50. The site uses the palette in the Design section, in light and dark, following the device setting.
51. Every page works at phone and desktop widths without sideways scrolling, and the layout makes use of wider screens rather than only stretching.
52. Buttons, links, ticks and radio buttons have a touch target of at least 44 by 44 pixels, and a visible keyboard focus.
53. Color is never the only way a meaning is shown.
54. Motion is limited to small transitions and the loading state, and respects the device's reduced motion setting.
55. Every page keeps the not-medical-advice footer, and its text is unchanged.
56. The home page says "Your month of movement and meals, one day at a time." Its four cards are links: Today goes to `/today`, Exercises and Menu go to those sections of `/today`, and History goes to `/history`. Logged-out visitors are sent to log in, as for any personal page.
57. Tick boxes and radio buttons use the shared style in light and dark, not the browser's own.

### Wording

These messages are approved, and are used as written:

| Where | Text |
| --- | --- |
| Eating disorder question | Have you been diagnosed with or treated for an eating disorder? |
| Medical question | Do you have a medical condition, injury or doctor's restriction that affects exercise or eating? |
| No plan for any goal | My Fit Plan can't create a plan for you. A health professional can help you find what suits you. |
| BMI under 18.5, weight loss | My Fit Plan can't create a weight loss plan for you. A health professional can help you find what suits you. |
| Test mode notice | Test mode: this plan is created from a made-up sample profile. Your saved details are not sent. |
| Demonstration notice | Demonstration only: this isn't a plan to follow. It was built for a made-up person, not for you. |
| Gemini busy | Gemini is busy right now, so no plan was built. Please try again later. |
| Gemini couldn't be reached | Gemini couldn't be reached, so no plan was built. Please try again later. |
| Home page sentence | Your month of movement and meals, one day at a time. |
| Page not found | This page doesn't exist / Back to the home page |

These are drafts for the project owner's wording sign-off:

| Where | Draft text |
| --- | --- |
| Navigation and heading | Test plans |
| Profile label | Made-up profile |
| Build button | Build a one-month plan |
| Loading | Building the demonstration month. This can take a minute or two. |
| No plan produced | No plan could be produced within the safety limits, so nothing is shown. A health professional can help you find what suits you. |
| Estimate label | Gemini estimate |
| Menu notice | This menu isn't for real use. AI menus can contain mistakes, and people with allergies should check ingredients. |
| Choose prompt | Choose a made-up profile to see a demonstration plan. |
| Answer prompt | Answer the two questions on your profile to see demonstration plans. |
| Rest day | Rest day |
| Load mark | Current load done with one to two extra repetitions |
| Changes | Same as last week / Increased from last week |
| Later days | Amounts for later days can change. |
| Month ended | This demonstration month has ended. |
| Navigation of days | Previous day / Next day / Back to today |
| Start over | Start over / Remove this plan and start over? |
| Yes and no | Yes / No |
| Question not answered | Choose yes or no. |

## Design

### Palette

Teal and coral, chosen by the project owner. A test checks every pair below, and any color that fails is darkened or lightened until it passes.

| Role | Light | Dark |
| --- | --- | --- |
| Page | `#F6FBF9` | `#0B1F1C` |
| Card | `#FFFFFF` | `#12302B` |
| Text | `#12302B` | `#E6F4F1` |
| Muted text | `#3F5F59` | `#B4CFC9` |
| Main action | `#0F766E`, with white text | `#2DD4BF`, with `#0B1F1C` text |
| Highlight | `#C2410C` | `#FB923C` |
| Small accent, never text | `#FACC15` | `#FACC15` |
| Page band gradient | `#0F766E` to `#065F46`, with white text | `#115E59` to `#064E3B`, with white text |
| Notice background | `#FFF4E5`, with `#7C2D12` text | `#3B2412`, with `#FFE4C7` text |
| Teal icon chip | `#D8F3EE`, with `#0F5F58` | `#134E4A`, with `#99F6E4` |
| Coral icon chip | `#FFE7DC`, with `#9A3412` | `#4A2413`, with `#FDBA74` |
| Control outline | `#5B7A74` | `#7FA39C` |
| Keyboard focus | `#C2410C` | `#FDE047` |

### Style

- **Character:** a colorful gradient band at the top of each page, rounded cards, simple line icons for exercises and meals, and color-coded sections.
- **Images:** no photos or illustrations of people, and no person icons. Icons come from `lucide-react`.
- **Type:** Inter, installed through `@fontsource-variable/inter` and served from this computer, so the site makes no font requests to outside services. Body text is at least 16px.
- **Notices:** demonstration and test mode notices are highly visible, with an icon, and sit above the plan on every day.

## Decisions

| Decision | Choice | Reason |
| --- | --- | --- |
| Delivery | One `ai-test-mode` branch, one spec | Requested by the project owner |
| Review stops | Milestone 1 (done), then redesign, build a month, daily view and full journey | Nothing is styled twice, and the look is approved before any key is needed |
| Commits | After each stop the owner approves | Each commit is work the owner has checked |
| Provider | Gemini free tier, with built-in made-up profiles only | The owner won't pay for now, and the terms say not to send personal information |
| Month shape | 4 weeks, 28 days, with a seven-day menu that repeats | Smaller, faster and more likely to pass every check |
| Load rule | Load rises only after the person marks it | A plan built in advance can't promise rises before the condition is met |
| Empty weeks | The next week repeats the same step | Needs no new health number, and the plan doesn't get harder after no exercise |
| Empty week meaning | No exercise ticked; meal ticks don't count | Eating shouldn't make exercise harder |
| No plan to show | Sample lists stay as a backup | Tracking keeps working for everyone |
| Starting amounts | Approved catalog amounts | No unapproved sets, repetitions or load can appear in week one |
| Beginner first week | At most 150 aerobic minutes | Owner decision, so a Beginner doesn't start at the top of the range |
| 0.9 kg limit | Gemini states the expected weekly loss, and code refuses a missing or higher number | No formula is approved, and the check fails closed, though it relies on Gemini's estimate |
| 1,500 kcal figure | Enforced, and the figure itself is not shown | A minimum shown could read as a number to aim for, even with calories now shown |
| Weekly loss figure | Checked, and not shown | Only calories and portions were approved for display |
| Calories and portions | Shown, each labeled as a Gemini estimate | Owner decision for the full experience |
| Allergy check | Word match against a built-in list | There is no food database, and the page warns that menus can contain mistakes |
| Sets and loaded repetitions | Stay the same | No weekly increase is approved for them |
| Ticks | Today only, using the existing marks table | Keeps the MVP rule, and `/history` keeps working |
| Day browsing | Read-only | Lets the owner see later weeks without changing the computer's date, with no test-only feature |
| Palette, style and dark mode | Teal and coral, bold cards and icons, light and dark | Chosen by the project owner |
| Tests | Fake provider in `npm test`, with live runs by the owner | Tests need no key or quota, and the owner still sees real output |

## Constraints

- Health numbers appear only in the safety module, the approved catalog and the approved test profiles, and in tests of those values. Everything else shown is Gemini's output, checked and labeled.
- Generation code never receives a saved profile, through any path.
- A person's eligibility answers and saved details are read only for access rules on the server, and that code stays separate from generation.
- Sample list tracking doesn't depend on the safety or AI modules. Plan items go through the access rules.
- `npm test` and `npm run build` need no key, network access or real database.
- Weight, profile details, eligibility answers, prompts, responses, API keys and session tokens must never be written to logs.
- `npm run dev` and `npm run start` stay limited to `127.0.0.1`.
- No real person's details are used until a paid tier or local model is chosen and stronger menu checks exist.
