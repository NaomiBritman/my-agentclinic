# Plan: MVP (Phases 2–8)

See [requirements.md](requirements.md) for scope and decisions, and [validation.md](validation.md) for merge criteria.

All work happens on the `mvp` branch. After every phase, run lint, type check and tests, and tick that phase's items in [roadmap.md](../roadmap.md). Stop at each milestone until the project owner has checked the site in a browser.

## 1. Database (Phase 2)

1. Install `better-sqlite3`, `drizzle-orm` and `drizzle-kit`, plus the driver's types. If the driver doesn't install or run on this Windows setup, stop and ask the project owner before choosing another one.
2. Add a Drizzle config, `src/db/schema.ts`, and a database module that opens a given file path, so tests can use a temporary database.
3. Add `db:generate` and `db:migrate` npm scripts.
4. Create the first migration with one small `app_meta` table that holds no personal data.
5. Add `/data/` to `.gitignore`, and confirm that Git doesn't see the database file.
6. Add a Vitest test that applies the migrations to a temporary database and reads the table.

## 2. Sign-up (Phase 3)

1. Install Better Auth and configure email and password login with its Drizzle adapter.
2. Add `.env.example` with empty setting names, a comment on how to create the secret, and a `.gitignore` exception for that file. Read the secret and the `127.0.0.1` base URL from `.env`.
3. Add the Better Auth tables to the schema in a new migration, and remove `app_meta` in a second one, because Drizzle would otherwise stop to ask whether a table was renamed.
4. Create the shared wording module with the text in [requirements.md](requirements.md).
5. Add a responsive `/sign-up` page with server-side validation, clear errors and the no-reset notice.
6. Send the person to `/profile` after sign-up. That page can be a login-protected placeholder until Phase 5.
7. Add tests for valid sign-up, invalid input, a duplicate email and a stored password that isn't plain text.
8. Update the Database and Accounts rows and the repo state in [tech-stack.md](../tech-stack.md), to name `better-sqlite3` and Better Auth.

## 3. Log in and log out (Phase 4)

1. Add a responsive `/log-in` page, and a log-out action.
2. Add one server helper that returns the logged-in account or sends the visitor to `/log-in`.
3. Use that helper on `/profile`, and add the logged-in navigation and home page links, showing only links to pages that exist.
4. Add tests for failed logins, ended sessions and logged-out access.
5. Add a two-account test helper, and use it to show that each session returns only its own account. Each later phase uses it to test its own data.

**Milestone 1:** run the automated checks and the Milestone 1 items in [validation.md](validation.md), then stop for the project owner's check.

## 4. Profile and goal (Phase 5)

1. Add a `profiles` table with one row per account, in a new migration.
2. Add a validation module with no UI or database dependencies, and test it for ages of 17 and 18, non-whole ages, non-positive and non-numeric height and weight, and invalid fitness levels and goals.
3. Add data functions that take the account ID from the session helper.
4. Build the responsive `/profile` form, including error messages, kept input, the goal note and the under-18 message.
5. Allow editing, with new values replacing old ones.
6. Add a server helper that sends a person without a saved profile to `/profile`.
7. Extend the two-account tests to profile data.

**Milestone 2:** run the automated checks and the Milestone 2 items in [validation.md](validation.md), then stop for the project owner's check.

## 5. Daily exercise tracking (Phase 6)

1. Add the fixed sample exercise list, using names only.
2. Add a `tracking_marks` table with the account, date, item type, item key and item name, unique per account, date, type and key, in a new migration.
3. Add a small date helper for this computer's local date, with a way to set the date in tests.
4. Add data functions and a server action that tick or untick an exercise for today, ignoring any date from the browser.
5. Build the responsive `/today` page with the sample label and completion messages, and require a saved profile.
6. Send logged-in people with a profile from `/` to `/today`.
7. Add tests for ticking, unticking, both completion messages, the next day starting clear and two separate accounts.

## 6. Daily menu tracking (Phase 7)

1. Add the fixed sample menu of meal slots to `/today`, using the same marks table.
2. Add a `day_notes` table with one row per account and date, in a new migration.
3. Add the note field, with server-side length validation, and save the text exactly as written.
4. Add tests for marking meals, saving and clearing a note, the length limit, no parsing of note contents and two separate accounts.

## 7. Tracking history (Phase 8)

1. Add data functions that return past days with marks or notes, newest first, not including today.
2. Build the responsive, read-only `/history` page with the empty message, and require a saved profile.
3. Add tests for ordering, leaving out today and empty days, showing stored item names and two separate accounts.
4. Add the wording test described in [validation.md](validation.md).
5. Write the full list of user-facing tracking text into the wording section of [validation.md](validation.md) for the project owner's review.

## 8. Validate and finish

1. Confirm that the profile and tracking code writes no personal data to logs.
2. Update the repo state in [tech-stack.md](../tech-stack.md).
3. Run every check in [validation.md](validation.md) and fix any failures.
4. Record the results in [validation.md](validation.md).

**Milestone 3:** stop for the project owner's final walkthrough and wording sign-off. After approval, the project owner runs `/changelog` and merges into `main`.
