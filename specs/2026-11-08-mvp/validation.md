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

- [x] While `npm run start` is running, `http://127.0.0.1:3000` responds.
- [x] While `npm run start` is running, every other local IPv4 address doesn't accept the connection on port 3000.
- [x] While `npm run dev` is running, `http://127.0.0.1:3000` responds.
- [x] While `npm run dev` is running, every other local IPv4 address doesn't accept the connection on port 3000.

## Manual checks

The project owner runs the site from a fresh database, using a modern browser. Each page is checked in responsive mode at a phone width of about 400px and at a desktop width, because a real phone can't reach the local-only site.

### Milestone 1: accounts (Phases 2–4)

- [x] Sign-up works with a new email, and shows the no-reset notice.
- [x] A duplicate email and invalid details show clear messages.
- [x] Log out works, and `/profile` then sends the visitor to the log-in page.
- [x] Log in works, and a wrong password shows a clear message that doesn't reveal which detail was wrong.
- [x] The accounts pages don't scroll sideways at either width.

### Milestone 2: profile and goal (Phase 5)

- [x] A new account goes to `/profile`, and `/today` sends it back there until a profile is saved.
- [x] Entering an age under 18 saves nothing, and shows the exact under-18 message.
- [x] Age 18 with valid details saves, and all details can be edited and still appear after reloading.
- [x] The form uses centimetres and kilograms, and it suggests no healthy range or target.
- [x] The goal note appears, and choosing a goal doesn't suggest that a plan exists.
- [x] The page doesn't scroll sideways at either width.

### Milestone 3: full journey (Phases 6–8)

Use two accounts, A and B, and create both from scratch.

- [x] A logged-in person with a profile goes from `/` straight to `/today`.
- [x] `/today` shows both sample labels, the four exercise names and the four meal slots, with no amounts or foods.
- [x] Ticking and unticking exercises and meals still shows correctly after reloading.
- [x] Both completion messages appear correctly, with no celebration, count or percentage.
- [x] A note for account A is saved exactly as typed, and nothing counts or comments on it.
- [x] Account B sees none of account A's profile, marks, notes or history.
- [x] After changing this computer's date, or adding a past day directly to the database, `/history` shows that day as read-only, and today isn't listed.
- [x] A new account's `/history` shows the empty message, and days with nothing recorded aren't mentioned.
- [x] Marks and notes remain after the server restarts.
- [x] The not-medical-advice notice appears on every page.
- [x] Every page is readable, usable and free of sideways scrolling at both widths.

## Wording sign-off

The project owner reads the full list of text below and signs off that it is neutral, makes no judgments on intake, doesn't reward eating less or training more, and doesn't suggest that an AI plan or menu exists.

This list is generated from `src/lib/site.ts`, `src/lib/wording.ts` and `src/lib/samples.ts`. Dates and what a person types are the only other text on the pages.

**Site text**

- My Fit Plan
- My Fit Plan is being built. It will help you follow a personal exercise plan and menu, day by day.
- This site is not medical advice. Talk to a qualified health professional before starting a new exercise or nutrition plan.

**Navigation**

- Today
- History
- Profile
- Sign up
- Log in
- Log out

**Sign up and log in**

- Email
- Password
- Use at least eight characters.
- Sign up
- This local site has no password reset, so keep your password somewhere safe.
- Log in
- Log out
- Enter your email and password.
- Enter a valid email address.
- Use a password with at least eight characters.
- Use a shorter password.
- This email already has an account.
- The account couldn't be created. Please try again.
- That email and password don't match an account.

**Profile and goal**

- Your profile
- Age
- Height (cm)
- Weight (kg)
- Fitness level
- Goal
- Choose one
- Beginner
- Intermediate
- Experienced
- Weight loss
- Toning
- Muscle building
- Save
- Your profile is saved.
- Enter your age as a whole number.
- Enter your height in centimetres, as a number above zero.
- Enter your weight in kilograms, as a number above zero.
- Choose a fitness level.
- Choose a goal.
- My Fit Plan is for adults 18 or older, so this profile can't be saved.
- Saving a goal doesn't create a plan. Personal plans aren't available yet.

**Today**

- Today
- Exercises
- Sample list, not a personal plan.
- Everything on today's list is ticked.
- Some items on today's list aren't ticked.
- Menu
- Sample menu, not a personal plan.
- Anything else you ate (optional)
- This is only a note for you.
- This note is too long, so it wasn't saved.
- Save note
- Your note is saved.

**Sample exercises**

- Walking
- Stretching
- Wall push-ups
- Chair squats

**Sample menu**

- Breakfast
- Lunch
- Dinner
- Snack

**History**

- History
- No past days to show yet.
- Exercises ticked
- Meals marked as eaten
- Note

- [x] Full list of user-facing tracking text recorded here.
- [x] The project owner approved the list.

## Repo checks

- [x] `/data/`, the database file and `.env` aren't tracked by Git.
- [x] `.env.example` is tracked, and contains no real secret.
- [x] All migrations are committed, and `npm run db:migrate` creates a fresh database.
- [x] `specs/tech-stack.md` names Better Auth and `better-sqlite3`, and its repo state is current.
- [x] In `specs/roadmap.md`, only the Phase 2–8 items changed, and they are ticked.
- [x] `specs/mission.md`, `README.md` and the earlier feature specs are unchanged.
- [x] `dev` and `start` still use `-H 127.0.0.1`.

## Scope checks

- [x] No AI provider, AI code, generated plan or menu, safety limit module, exercise catalog or allergy question was added.
- [x] No health number appears anywhere in the code, data or site text, other than the age of 18 from the mission.
- [x] Tests use only the ages of 17 and 18 for the adult rule, and clearly unrealistic height and weight values, such as 1.
- [x] Height and weight have no minimum or maximum other than being positive.
- [x] No streaks, rewards, scores, totals, percentages, weight history or charts were added.
- [x] No goal changes what the site shows, and no eligibility rule was invented.
- [x] Tracking code doesn't depend on a safety module.
- [x] Code review finds no logging of personal data, passwords or session tokens.
- [x] `logging.serverFunctions` stays off in `next.config.ts`, and the `npm run dev` terminal shows no form values during the walkthrough.
- [x] Personal data reads and writes all use the account from the server session.
- [x] The not-medical-advice notice is unchanged.

## Results

Recorded on 2026-11-08.

- **Automated checks:** clean install, lint, type check, 195 tests and a production build with no `.env` or database all passed.
- **Browser run:** a scripted two-account journey in headless Edge passed on `npm run start` and `npm run dev`, including a server restart, a session over a day old, an expired session and a long note at phone width. It didn't replace the owner's walkthrough.
- **Logs:** after that run, the `npm run dev` log contained no typed values, emails or passwords.
- **Connection check:** on both servers, `http://127.0.0.1:3000` responded. The one other local IPv4 address, `192.168.99.106`, timed out on port 3000 rather than refusing the connection. A control server bound to all addresses connected on that same address, so it is reachable and the site isn't served there. The project owner decided that this meets the check, and the two items were reworded from "refuses" to "doesn't accept".
- **Milestone 1:** on 2026-11-08, the project owner checked all nine walkthrough items at phone and desktop widths and approved the result. Clean install, lint, type check, tests and a production build with no `.env` or database all passed.
- **Milestone 2:** on 2026-11-08, the project owner checked all twelve walkthrough items at phone and desktop widths and approved the result. Clean install, lint, type check, tests and a production build with no `.env` or database all passed.
- **Milestone 3:** on 2026-11-08, the project owner checked all fifteen walkthrough items at phone and desktop widths and approved the result.
- **Wording sign-off:** on 2026-11-08, the project owner approved the wording list.

## Merge

Run `/changelog` and merge into `main` after all the checks above pass and the project owner has approved the result.
