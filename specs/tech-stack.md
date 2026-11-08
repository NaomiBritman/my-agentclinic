# Tech Stack

## Core

| Area | Choice | Why |
| --- | --- | --- |
| Language | TypeScript | Already used in this repo; types help keep plan and safety logic correct |
| Framework | Next.js (App Router) with React | One app for pages and server logic |
| Database | SQLite | Simple local setup with no separate database server |
| Data access | Drizzle ORM | Typed queries and schema migrations; supports moving to Postgres later |
| Styling | Tailwind CSS | Fast to build a responsive interface |
| Tests | Vitest | Fast TypeScript testing, mainly for plan and safety rules |

## Current scope

- **No authentication:** the site has a single local user, with no accounts or sign-in for now.
- **No food database:** nutrition logging is manual for now, so the site needs no food data service.

## Guidelines

- **Keep safety rules in one place.** Progression and nutrition limits live in plain TypeScript modules with no UI or database dependencies, so every feature uses the same rules and they are easy to test.
- **Don't invent cap values.** Code uses only values the project owner has approved, from reliable health sources (see the [roadmap](roadmap.md)).
- **Keep food logging separate from the caps.** Manual logging must not depend on the safety module, while nutrition targets must go through it.
- **Enforce limits on the server.** The browser never gets the final say on a plan or target.
- **Validate input on the server.** This covers all user details, such as age and weight.
- **Treat user data as sensitive.** Weight, health details and nutrition logs are personal, so collect only what the plan needs and never write them to logs.

## Hosting constraints

- **No public deployment without access control:** with no accounts, anyone who can reach the site can see and change the user's data. For now, the site runs locally.
- **Persistent disk:** SQLite stores its data in a file, so any later hosting needs a persistent disk, such as a VPS or a container with a mounted volume. Serverless platforms without persistent storage won't work unless the app moves to a hosted database first.

## Current repo state

The repo has only TypeScript, tsx, `@types/node` and a placeholder `src/index.ts`. Phase 0 of the [roadmap](roadmap.md) replaces this scaffold.
