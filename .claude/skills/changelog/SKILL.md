---
name: changelog
description: Create or update CHANGELOG.md in the project root, with a heading for each date and bullets built from the git commits. Run manually before merging a branch.
disable-model-invocation: true
---

# Update the changelog

Keep `CHANGELOG.md` in the project root up to date from the git history. The user runs this before merging, so the changelog ships in the same merge as the work it describes.

## Format

```markdown
# Changelog

## 2026-11-08

- Added sign-up and login with hashed passwords.
- Limited the dev server to `127.0.0.1`, so other devices can't reach it.

## 2026-11-07

- Started the project.
```

- Use `YYYY-MM-DD` headings, newest first.
- Add a date only if it has something to report, and never repeat a date heading.

## Steps

### 1. Check the starting point

Run `git status --short`. If there is uncommitted work other than `CHANGELOG.md`, leave it out of the changelog and mention it in your report, because the changelog describes commits and that work may still change.

### 2. Find the commits to cover

Check whether `CHANGELOG.md` exists, and find the last commit that changed it:

```bash
git log -1 --format=%H -- CHANGELOG.md
```

Then choose the range:

- **No `CHANGELOG.md`:** cover the full history, and create the file.
- **`CHANGELOG.md` has been committed:** cover `<that commit>..HEAD`. The changelog is committed along with the work, so anything up to that commit is already covered.
- **`CHANGELOG.md` exists but was never committed:** cover the full history, and rely on the duplicate check in step 4.

List the commits, using `..HEAD` with the range when there is one:

```bash
git log --no-merges --date=short --format='%h %ad %s%n%b' [<commit>..HEAD]
```

If nothing is new, say that the changelog is already up to date and stop, without changing the file.

### 3. Write the bullets

Group the commits by date, using the dates from the command above. Write for someone who wants to know what changed in the project, rather than copying commit messages:

- Describe the result, in past tense, in one line each.
- Combine commits that belong to the same change, including follow-up fixes to work from the same date.
- Leave out noise, such as typo fixes and commits that only change `CHANGELOG.md`.
- Keep security and safety changes visible, even small ones.
- If a subject doesn't explain the change, read it with `git show --stat <hash>` before writing about it.
- Include only what the commits show, because readers will trust the changelog as a record.

### 4. Update the file

- Add new bullets to an existing heading when the date is already there, and create a heading in date order when it isn't.
- Skip anything an existing bullet already covers, so running this twice doesn't add duplicates.
- Leave existing entries as they are, including the user's wording. If one looks wrong, mention it in your report instead of changing it.
- Match the file's existing line endings.

### 5. Report

Tell the user which commit range and dates you covered, what you added, and anything you left out or noticed. Leave the commit and merge to the user, so they can review the changelog first, and offer to commit `CHANGELOG.md`.
