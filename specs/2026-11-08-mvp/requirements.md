# Requirements: MVP (Phases 2–8)

## Context

This work covers Phases 2–8 of the [roadmap](../roadmap.md), on one branch named `mvp`. It takes the site from a single home page to a local, multi-account site where an adult can sign up, save a profile and goal, track sample exercises and meals each day, and look back at past days.

The MVP has no AI plan or menu. Phases 9, 10 and 13 are blocked by required decisions on exercise limits, goal eligibility, the AI provider and nutrition limits, and Phases 11, 12, 14 and 15 depend on them. The mission's success measure that a person gets a personal plan and menu is therefore not part of this MVP.

Guidance:

- [Mission](../mission.md): adults only, neutral wording, no extreme dieting or overtraining, no AI output without approved limits, and no invented limit values.
- [Tech stack](../tech-stack.md): Next.js, SQLite, Drizzle, Tailwind CSS and Vitest; local only; server-side validation and data separation; sensitive data kept out of logs; mobile-first responsive pages.

The repo currently has a home page, a footer notice in the shared layout and one Vitest test. It has no database, accounts, navigation or Vitest config.

## Scope

### In scope

| Phase | Work |
| --- | --- |
| 2 | SQLite and Drizzle, a first migration, and a database file kept out of Git |
| 3 | Better Auth, a sign-up form with server-side validation, and hashed passwords |
| 4 | Log in and log out, login required for personal pages, and data separation tests |
| 5 | Profile and goal form, adult requirement, saving and editing |
| 6 | Sample exercise list, ticking, saving and a completion message |
| 7 | Sample menu, marking meals as eaten, and a free-text note for anything else eaten |
| 8 | Read-only history of past days and a wording review |

Supporting work:

- Minimal navigation for logged-in people, and sign-up and log-in links for everyone else.
- Updating `specs/tech-stack.md` with the account library, SQLite driver and repo state.
- Ticking the Phase 2–8 items in `specs/roadmap.md`.

### Out of scope

- Phases 9–16, including any safety limit module, exercise catalog, AI provider, AI output, generated plans or menus, weekly progression, nutrition targets, allergy questions and final polish.
- Any limit value, goal eligibility rule, calorie or nutrient figure, exercise amount, body measurement range, BMI or health target.
- Linking the goal or profile to what the sample lists show.
- Weight history, charts, trends, scores, percentages, streaks and rewards.
- Editing past days.
- Password reset and email sending, which stay under possible later work in the roadmap.
- Account deletion and data export. Neither is on the roadmap for these phases, so any request for them needs its own decision.
- Public deployment, changes to the `127.0.0.1` limit, CI, Playwright and renaming the repository or folder.
- Changing the not-medical-advice notice or `specs/mission.md`.

## Functional requirements

### Database (Phase 2)

1. The app uses SQLite through Drizzle, and all table changes go through committed migrations.
2. A fresh clone can create its database by running `npm run db:migrate`.
3. The database file is stored under `data/`, which Git ignores.

### Sign-up (Phase 3)

4. A person signs up with an email and password only.
5. The server validates all sign-up input and returns a clear message when it fails, including when the email is already in use.
6. Passwords are stored only as hashes, and password rules use the Better Auth defaults.
7. The sign-up page says there is no password reset on this local site.
8. After sign-up, the person is logged in and taken to the profile form.

### Log in and log out (Phase 4)

9. A person can log in and log out, and a failed login gives the same message whether the email or the password was wrong.
10. `/today`, `/history` and `/profile` require login. A logged-out visitor is sent to the log-in page, and no personal data is sent to them.
11. Login is checked on the server, on each personal page and each action that reads or changes personal data.
12. Every read and write of personal data uses the account ID from the server session, never one sent by the browser.

### Profile and goal (Phase 5)

13. `/profile` collects age, height in centimetres, weight in kilograms, fitness level and goal.
14. Age must be a whole number of 18 or older. This value comes from the mission's adults-only rule, and there is no upper limit.
15. Height and weight must be positive numbers. There is no other minimum or maximum, because any range would be an invented health number.
16. Fitness level is one of Beginner, Intermediate or Experienced.
17. Goal is one of Weight loss, Toning or Muscle building.
18. All profile validation runs on the server. Invalid input is not saved, and the form shows what needs changing while keeping what the person typed.
19. An age under 18 is not saved, and the page shows the wording in the table below.
20. Each account has one profile, which the person can edit. Saving replaces the old values and keeps no history.
21. The profile page shows the goal note in the table below. A saved goal doesn't change what the site shows, and no eligibility rule is applied until Phase 9.

### Today and tracking (Phases 6–7)

22. `/today` requires a saved profile, and a logged-in person without one is sent to `/profile`. `/history` follows the same rule.
23. A logged-in person with a saved profile who opens `/` is sent to `/today`. Everyone else sees the home page with sign-up and log-in links.
24. `/today` shows exercises and meals on one page. Both lists are the same for every person and every day, and each list has its sample label.
25. The exercise list is Walking, Stretching, Wall push-ups and Chair squats, with names only and no amounts.
26. The sample menu is Breakfast, Lunch, Dinner and Snack, with names only and no amounts or foods.
27. A person can tick and untick exercises for today, and marks are saved to their account.
28. The page shows one of the two completion messages in the table below, for exercises only. It has no celebration, count or percentage.
29. A person can tick and untick a meal as eaten. An unticked meal is simply unmarked, and no message comments on it.
30. Each day has one optional free-text note for anything else eaten. It is saved as written, up to 2,000 characters, and is never counted, scored or parsed.
31. "Today" means the current date on this computer, worked out on the server. A person can't save marks or notes for any other date.
32. Marks store the item's name as well as its key, so history stays correct if the lists change later.

### History (Phase 8)

33. `/history` lists days that have at least one mark or a note, newest first, not including today.
34. Each listed day shows the exercises ticked, the meals marked as eaten and the note, with no way to change them.
35. Days with nothing recorded aren't listed or described. The page shows no totals, scores, percentages or streaks.

### All pages

36. Logged-in pages have navigation for Today, History, Profile and Log out.
37. Every page keeps the not-medical-advice footer.
38. Every new or changed page works at phone and desktop widths without sideways scrolling.
39. The home page sentence stays as it is, because it still correctly describes personal plans and menus as future work.

### Wording

New text is kept in one module, so that the wording test and the owner's review cover the same list. These messages are used as written:

| Where | Text |
| --- | --- |
| Under-18 profile | My Fit Plan is for adults 18 or older, so this profile can't be saved. |
| Goal note | Saving a goal doesn't create a plan. Personal plans aren't available yet. |
| Exercise label | Sample list, not a personal plan. |
| Menu label | Sample menu, not a personal plan. |
| All exercises ticked | Everything on today's list is ticked. |
| Not all exercises ticked | Some items on today's list aren't ticked. |
| Note label | Anything else you ate (optional) |
| Note help | This is only a note for you. |
| Sign-up notice | This local site has no password reset, so keep your password somewhere safe. |
| Empty history | No past days to show yet. |

## Decisions

| Decision | Choice | Reason |
| --- | --- | --- |
| Delivery | One `mvp` branch, one spec | Requested by the project owner |
| Review stops | Three milestones: after Phases 2–4, Phase 5 and Phases 6–8 | Each milestone has something to check in a browser |
| Account library | Better Auth | Built-in email and password, hashed passwords, database sessions and a Drizzle adapter, with no outside service |
| SQLite driver | `better-sqlite3` | The usual synchronous SQLite driver for Drizzle; the first task confirms that it installs on this Windows setup |
| Adult requirement | A saved adult profile is required for tracking | Stops someone skipping the age check by not filling in the form |
| Age format | Whole-number age, as the roadmap says | Collects less than a date of birth; an age entered this way is self-reported and isn't verified |
| Units | Metric only | One stored format and no conversions |
| Height and weight checks | Positive numbers only | The project owner ruled out invented health numbers, and that includes range checks |
| Sample exercises | One fixed list of four gentle names | Names only, and not linked to the goal, so it can't look personalized |
| Sample menu | Meal slots, with no foods | Allergies aren't collected until Phase 14, so it must not suggest specific foods |
| Goal options | The three goals in the roadmap, stored only | Eligibility waits for Phase 9, and no plan depends on the goal yet |
| Page layout | One `/today` page for exercises and meals | The mission asks that a person can immediately see what to do and eat today |
| Completion message | Exercises only | The roadmap asks for it in Phase 6, and a meal message could read as a judgment on intake |
| Meal marking | One tick for eaten | Unmarked and not eaten both mean no record, which avoids recording or judging a skipped meal |
| History | Read-only | Keeps the phase small, and gives no reason to fill in or correct missed days |
| Tests | Vitest and a scripted owner walkthrough | Uses the existing test tool, with no new browser test dependency |
| Wording review | An automated scan and owner sign-off | The scan keeps protecting the wording after merge, and the owner judges tone |
| Phone check | Browser responsive mode at about 400px | The site is limited to `127.0.0.1`, so a real phone can't reach it |

## Constraints

- No health number may appear in code, data or text. The only exception is the age of 18, which comes from the mission.
- Tests may use the ages of 17 and 18 to check the adult rule. Where a test needs a height or weight, it uses a clearly unrealistic value, such as 1, so it can't be read as healthy or typical.
- Password, session and note length rules are technical limits, not health numbers, and must not be applied to profile values.
- Tracking code doesn't depend on any safety module, as the tech stack requires.
- Weight, profile details, tracking data, notes, emails, passwords and session tokens must never be written to logs.
- `.env` holds the Better Auth secret and stays out of Git. `.gitignore` currently ignores `.env*`, so it needs an exception for `.env.example`.
- `npm run dev` and `npm run start` stay limited to `127.0.0.1`, and the Better Auth base URL uses that address.
