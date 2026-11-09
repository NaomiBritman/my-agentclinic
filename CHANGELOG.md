# Changelog

## 2026-11-09

- Merged by the project owner's decision before the Milestone 4 browser check, Milestone 5 and the wording sign-off were finished, so those remain incomplete.
- Added a daily view on `/today` showing each day of the plan, with ticks saved per day, read-only browsing of other days, and calories and portions labeled as Gemini estimates.
- Held weekly difficulty after a week with no exercise ticked, raised load by at most 5% only after a person marks it, and checked every worked-out week against the safety limits again.
- Added a test plans page where Gemini's free tier builds a four-week exercise plan and a seven-day menu from a chosen built-in made-up profile, with test mode and demonstration notices and a loading state.
- Required every week and menu day to pass the safety limits, or nothing is saved or shown, and made generation take only a test profile key, so it can't reach saved profiles.
- Added separate neutral messages for safety rule failures, a busy Gemini and other provider failures, and retried only 503 errors, at most twice per build.
- Redesigned every page with a teal and coral palette in light and dark, shared components, line icons, a locally served font and a test that checks color contrast.
- Changed the home page sentence, made its cards links, restyled tick boxes and radio buttons, and added a page-not-found page.
- Added the two eligibility questions to the profile, refused the weight loss goal when BMI is under 18.5, and added the approved messages.
- Added a standalone safety module holding every approved exercise, weekly progression, nutrition and eligibility limit, with boundary tests.
- Recorded that generated menus are not safe for real use, because the calorie, weight loss and allergy checks rely on Gemini's own figures or word matching, and that stronger checks are required before any real person's details are used.
- Recorded the approved test profiles, starting amounts, Beginner first week limit and words to avoid as owner decisions.
- Changed the AI test mode spec to a full demonstration, with plans on the daily view, ticks saved per day, and calories and portions labeled as Gemini estimates and never as targets.
- Recorded that a browser test run reached the owner's dev server and added test accounts to the real database, and stopped test scripts from using that port.
- Recorded the approved exercise, weekly progression, nutrition and goal eligibility limits in the specs, labeling each one's health source or owner decision, and marked Phases 9, 10 and 13 as unblocked. None of this is implemented yet.
- Chose the Gemini API free tier as the AI provider in the specs, for built-in made-up test profiles only, so no real person's details or saved profile are sent until a paid tier or local model is chosen.
- Specified that generated plans appear on a separate test plans page with a test mode notice, while `/today` keeps the sample lists.
- Specified that the test plans page is hidden from anyone who answers yes to either eligibility question, and that weight loss test plans are hidden when BMI is under 18.5.

## 2026-11-08

- Added a read-only history of past days, with no totals, scores or streaks.
- Added a today page with sample exercises and meal slots to tick, and a free-text daily note that isn't counted or scored.
- Added a test that scans site text for numbers, pressure and judgments, and the project owner approved the wording.
- Added a profile and goal form, and required a saved adult profile (18 or older) for tracking pages.
- Required height and weight to be positive numbers, with no invented health range.
- Stopped dev server logs printing form values, such as a person's age and goal.
- Added email and password accounts through Better Auth, with hashed passwords, log in and log out, and server-side login checks on personal pages.
- Added a SQLite database with Drizzle migrations, and kept the database file and `.env` out of Git.
- Added the feature spec for the MVP, covering Phases 2 to 8.
- Renamed the app and package to My Fit Plan, and changed the home page to say the site is being built.
- Limited the production server (`npm run start`) to `127.0.0.1`.
- Added the feature spec for Phase 1 rename and local-only.
- Added a `/changelog` skill that updates this file from the git history before merging.
- Required responsive design on every page, checked at phone and desktop widths.
- Renamed the project to My Fit Plan in the README and specs, and replanned it around accounts, profiles, an AI-built exercise plan and menu, and daily tracking.
- Required AI output to pass safety limits the project owner approves, with the limits, goal eligibility and AI provider left open as required decisions.
- Kept the site local only.
- Built the Next.js, TypeScript and Tailwind app with a home page and Vitest.
- Added a not-medical-advice notice to the footer of every page.
- Limited the dev server to `127.0.0.1`.
- Added the feature spec for Phase 0 project setup, and listed ESLint in the tech stack.
- Replaced the AgentClinic plan with a Fitness and Nutrition Tracker mission, tech stack and phased roadmap, with safety cap values left open until approved.
- Added the project scaffold and a README with stakeholder input, and stopped tracking `node_modules`.

## 2026-11-01

- Started the project with an initial commit.
