# Changelog

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
