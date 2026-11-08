# Plan: Rename and Local-Only (Phase 1)

See [requirements.md](requirements.md) for scope and decisions, and [validation.md](validation.md) for merge criteria.

## 1. Rename the package

1. Set the name in `package.json` to `my-fit-plan`.
2. Update `package-lock.json` without changing any dependency versions.

## 2. Update the site text

1. Change the site name in `src/lib/site.ts` to My Fit Plan.
2. Change the sentence in `src/lib/site.ts` to the wording in the requirements.
3. Confirm that the home page and metadata pick up both changes.

## 3. Limit the production server

1. Change the `start` script to `next start -H 127.0.0.1`.
2. Build the site, run `npm run start`, and confirm that it responds at `http://127.0.0.1:3000`.
3. Stop the server.

## 4. Update the constitution

1. Update the hosting constraints in [tech-stack.md](../tech-stack.md) to say that `npm run start` is now limited.
2. Update the current repo state in [tech-stack.md](../tech-stack.md) to say that the app and package use the new name.

## 5. Validate and finish

1. Run every check in [validation.md](validation.md) and fix any failures.
2. Tick the Phase 1 items in [roadmap.md](../roadmap.md).
