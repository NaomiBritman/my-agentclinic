# Validation: MVP (Phases 2–8)

The branch can merge only when every check below passes and the project owner has approved the result. See [requirements.md](requirements.md) for the full requirements.

## Automated checks

Each command must exit successfully, starting from a clean install, with no dev or production server running:

| Check | Command |
| --- | --- |
| Clean install | `npm ci` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Tests | `npm test` |
| Production build | `npm run build` |

## Required tests

`npm test` must include passing tests for each of these, using a temporary SQLite database and never the real database file:

| Area | The tests show that |
| --- | --- |
| Database | All migrations apply to an empty database |
| Sign-up | Valid details create an account, invalid details and duplicate emails are refused, and the stored password isn't the plain text |
| Log in and log out | Wrong details are refused with one message, and an ended session no longer gives access |
| Logged-out access | Personal pages and actions don't return or change personal data |
| Data separation | With two accounts, neither can read or change the other's profile, marks, notes or history |
| Profile | Age 18 is accepted; age 17, non-whole ages and invalid values aren't saved; any positive height and weight is accepted; invalid fitness levels and goals are refused |
| Adult requirement | Without a saved profile, a person can't reach `/today` or `/history` or save tracking data |
| Exercises | Ticking and unticking persist, both completion messages appear correctly, and a new day starts clear |
| Meals and notes | Marks persist, notes are saved exactly as written, and text over the length limit is refused |
| Dates | The server decides today's date, and a date sent by the browser can't change which day is saved |
| History | Days are newest first, today and empty days are left out, and stored item names are shown |

### Wording test

An automated test scans all text in `src/lib/site.ts`, the wording module and the sample lists. It fails if the text contains:

- **Numbers:** any digit, other than the 18 in the under-18 message.
- **Health measures:** calorie, kcal, BMI, protein, carb, fat, reps, sets or minutes.
- **Rewards and pressure:** streak, score, reward, badge, points, goal reached, keep it up, don't break, or push harder.
- **Judgments:** well done, great job, good, bad, failed, missed, cheat, guilt, too much, too little, or only ate.

The test must first show that it catches a planted example of each group. The word "good" and similar terms are matched as whole words.

## Connection check

Run these from this computer, and stop each server afterward:

- [ ] While `npm run start` is running, `http://127.0.0.1:3000` responds.
- [ ] While `npm run start` is running, every other local IPv4 address refuses the connection on port 3000.
- [ ] While `npm run dev` is running, `http://127.0.0.1:3000` responds.
- [ ] While `npm run dev` is running, every other local IPv4 address refuses the connection on port 3000.

## Manual checks

The project owner runs the site from a fresh database, using a modern browser. Each page is checked in responsive mode at a phone width of about 400px and at a desktop width, because a real phone can't reach the local-only site.

### Milestone 1: accounts (Phases 2–4)

- [x] Sign-up works with a new email, and shows the no-reset notice.
- [x] A duplicate email and invalid details show clear messages.
- [x] Log out works, and `/profile` then sends the visitor to the log-in page.
- [x] Log in works, and a wrong password shows a clear message that doesn't reveal which detail was wrong.
- [x] The accounts pages don't scroll sideways at either width.

### Milestone 2: profile and goal (Phase 5)

- [ ] A new account goes to `/profile`, and `/today` sends it back there until a profile is saved.
- [ ] Entering an age under 18 saves nothing, and shows the exact under-18 message.
- [ ] Age 18 with valid details saves, and all details can be edited and still appear after reloading.
- [ ] The form uses centimetres and kilograms, and it suggests no healthy range or target.
- [ ] The goal note appears, and choosing a goal doesn't suggest that a plan exists.
- [ ] The page doesn't scroll sideways at either width.

### Milestone 3: full journey (Phases 6–8)

Use two accounts, A and B, and create both from scratch.

- [ ] A logged-in person with a profile goes from `/` straight to `/today`.
- [ ] `/today` shows both sample labels, the four exercise names and the four meal slots, with no amounts or foods.
- [ ] Ticking and unticking exercises and meals still shows correctly after reloading.
- [ ] Both completion messages appear correctly, with no celebration, count or percentage.
- [ ] A note for account A is saved exactly as typed, and nothing counts or comments on it.
- [ ] Account B sees none of account A's profile, marks, notes or history.
- [ ] After changing this computer's date, or adding a past day directly to the database, `/history` shows that day as read-only, and today isn't listed.
- [ ] A new account's `/history` shows the empty message, and days with nothing recorded aren't mentioned.
- [ ] Marks and notes remain after the server restarts.
- [ ] The not-medical-advice notice appears on every page.
- [ ] Every page is readable, usable and free of sideways scrolling at both widths.

## Wording sign-off

The project owner reads the full list of text below and signs off that it is neutral, makes no judgments on intake, doesn't reward eating less or training more, and doesn't suggest that an AI plan or menu exists.

The implementation fills in this list during Phase 8.

- [ ] Full list of user-facing tracking text recorded here.
- [ ] The project owner approved the list.

## Repo checks

- [ ] `/data/`, the database file and `.env` aren't tracked by Git.
- [ ] `.env.example` is tracked, and contains no real secret.
- [ ] All migrations are committed, and `npm run db:migrate` creates a fresh database.
- [ ] `specs/tech-stack.md` names Better Auth and `better-sqlite3`, and its repo state is current.
- [ ] In `specs/roadmap.md`, only the Phase 2–8 items changed, and they are ticked.
- [ ] `specs/mission.md`, `README.md` and the earlier feature specs are unchanged.
- [ ] `dev` and `start` still use `-H 127.0.0.1`.

## Scope checks

- [ ] No AI provider, AI code, generated plan or menu, safety limit module, exercise catalog or allergy question was added.
- [ ] No health number appears anywhere in the code, data or site text, other than the age of 18 from the mission.
- [ ] Tests use only the ages of 17 and 18 for the adult rule, and clearly unrealistic height and weight values, such as 1.
- [ ] Height and weight have no minimum or maximum other than being positive.
- [ ] No streaks, rewards, scores, totals, percentages, weight history or charts were added.
- [ ] No goal changes what the site shows, and no eligibility rule was invented.
- [ ] Tracking code doesn't depend on a safety module.
- [ ] Code review finds no logging of personal data, passwords or session tokens.
- [ ] Personal data reads and writes all use the account from the server session.
- [ ] The not-medical-advice notice is unchanged.

## Results

To be completed when the final checks are run, including the outcome of each automated and connection check.

- **Milestone 1:** on 2026-11-08, the project owner checked all nine walkthrough items at phone and desktop widths and approved the result. Clean install, lint, type check, tests and a production build with no `.env` or database all passed.

## Merge

Run `/changelog` and merge into `main` after all the checks above pass and the project owner has approved the result.
