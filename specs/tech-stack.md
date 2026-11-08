# Tech Stack

## Core

| Area | Choice | Why |
| --- | --- | --- |
| Language | TypeScript | Types help keep plan and safety logic correct |
| Framework | Next.js (App Router) with React | One app for pages and server logic |
| Database | SQLite | Simple local setup with no separate database server |
| Data access | Drizzle ORM | Typed queries and schema migrations; supports moving to Postgres later |
| Accounts | Email and password, with hashed passwords and server-side session checks | Fits a local site with no outside services; the library is chosen when Phase 3 starts |
| AI agent | **Provider not decided** | Required decision before Phase 10 (see the [roadmap](roadmap.md)) |
| Styling | Tailwind CSS | Fast to build a responsive interface |
| Tests | Vitest | Fast TypeScript testing, mainly for plan and safety rules |
| Linting | ESLint | Comes with the Next.js scaffold and catches common code problems |

## AI agent requirements

These apply whichever provider is chosen:

- **Runs on the server.** The browser never calls the AI provider, and any API key stays in `.env`.
- **Structured output.** The agent returns data in a defined format, so code can check it.
- **Validated in code.** Prompts can guide the agent, but only code enforces the limits. Output is untrusted until it passes the safety module.
- **Fails closed.** If output is invalid, fails a limit, or the limits it needs aren't approved, nothing is shown to the person.
- **Minimal data.** The agent receives only the details the plan needs, and never names, emails or passwords.
- **Clear about data leaving the computer.** If the provider runs outside this computer, people are told before their details are sent, even though the site itself is local.

## Guidelines

- **Follow responsive design.** Every page must work on phone and desktop widths, without horizontal scrolling, using Tailwind CSS's responsive utilities with a mobile-first approach.
- **Keep safety rules in one place.** Exercise and nutrition limits live in plain TypeScript modules with no UI, database or AI dependencies, so every feature uses the same rules and they are easy to test.
- **Don't invent limit values.** Code uses only values the project owner has approved, from reliable health sources (see the [roadmap](roadmap.md)).
- **Keep tracking separate from the limits.** Checking off exercises and meals must not depend on the safety module, while AI output and targets must go through it.
- **Enforce limits on the server.** The browser never gets the final say on a plan, menu or target.
- **Validate input on the server.** This covers all account and profile details.
- **Keep each person's data separate.** Every read and write of personal data is tied to the logged-in account and checked on the server.
- **Treat user data as sensitive.** Passwords are only stored hashed. Weight, profile details, plans and tracking are personal, so collect only what the plan needs and never write them to logs.

## Hosting constraints

- **Local only:** both `npm run dev` and `npm run start` must be limited to `127.0.0.1`. The `dev` script already is, and Phase 1 of the [roadmap](roadmap.md) limits `start`.
- **No public deployment for now:** having accounts doesn't make the site ready to go public. That would first need a security review and its own decision.
- **Persistent disk:** SQLite stores its data in a file, so any later hosting needs a persistent disk, such as a VPS or a container with a mounted volume. Serverless platforms without persistent storage won't work unless the app moves to a hosted database first.

## Current repo state

Phase 0 is complete: the repo has a Next.js app with Tailwind CSS, ESLint and Vitest. The app and package still use the old name until Phase 1 of the [roadmap](roadmap.md).
