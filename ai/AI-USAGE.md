# AI Usage Declaration

Tool: Claude (web interface), Claude Opus 5.

Full transcripts are in this folder (`ai/`), one file per working session:

| File | Session | Covers |
| --- | --- | --- |
| `session-1-setup.md` | 1 | Environment, schema, database connection layer |
| `session-2-ui.md` | 2 | Query layer, list UI, create/archive/sort, editing |
| `session-3-tests.md` | 3 | Test suite |
| `session-4-docs.md` | 4 | Documentation and clean-clone rehearsal |

This file summarises how the tool was used and points to the specific moments in
those transcripts where its output was rejected or corrected.

---

## Constraints given

The following constraints were stated to the assistant and restated at the start
of each session. They are real constraints of the development environment, not
framing:

- Windows, on a company laptop **with no administrator rights** — nothing
  requiring an installer or a compiler could be used.
- Node's built-in `node:sqlite` only; **no native modules.**
- Next.js App Router, TypeScript.
- Local-first, single user, no accounts.
- Must run from a clean clone following the README alone.
- Work in small slices that can be committed separately, one step at a time,
  waiting for terminal output before the next step.

The whole application was not generated from the brief. Each slice was requested
separately, run, and verified before the next was started.

---

## Corrections made to the tool's output

### 1. Rejected the suggested database dependency (session 1)

The assistant proposed `better-sqlite3`, the conventional SQLite driver for
Node. `npm install` failed: it is a native module, no prebuilt binary existed for
the installed Node version, and the fallback compile from C++ source required
Python and a C++ toolchain that could not be installed without administrator
rights.

Rather than pursuing the toolchain, the constraint was restated and the
dependency dropped. The application uses Node's built-in `node:sqlite` instead.

**Traceable to:** `package.json` contains no database dependency at all;
`lib/db.ts` imports `DatabaseSync` from `node:sqlite`; the reasoning is recorded
in the README under "Deliberately not used: a SQLite driver".

This also improved the result rather than merely working around the problem —
there is now no native build step in `npm install`, so the clean clone cannot
fail to compile on a marker's machine.

### 2. Redirected the assistant's working method (session 1)

The assistant was issuing multi-branch instructions — several commands at once
with conditional follow-ups — while a broken PATH was being diagnosed. This was
producing errors that could not be attributed to a specific step. It was
instructed to give one command at a time and wait for output before continuing.
It did so for the remainder of the project.

**Traceable to:** the numbered step-by-step structure of every session from that
point onwards.

### 3. Diagnosed a cascade of type errors as a single fault (session 2)

Pasting `app/page.tsx` into the editor silently dropped an opening `<a` tag,
producing twelve TypeScript errors across the file. Rather than acting on the
errors individually, `npx tsc --noEmit` was used to get the full list, and the
first error's line number identified the single missing tag as the cause of the
other eleven.

**Traceable to:** the `<a` element in the sort-links block of `app/page.tsx`.

### 4. Caught a route created in the wrong directory (session 2)

The edit route was created at the repository root as `tasks/[id]/page.tsx`
instead of `app/tasks/[id]/page.tsx`. The error reported only a failed module
import; the missing `app/` prefix in the reported file path identified the real
problem.

**Traceable to:** `app/tasks/[id]/page.tsx`.

### 5. Corrected an incorrect test command (session 3)

The assistant supplied `node --test tests/` as the test script. Node resolved
`tests/` as a module path rather than a directory and the run failed with
`MODULE_NOT_FOUND`. It was replaced with an explicit glob,
`node --test "tests/**/*.test.ts"`.

**Traceable to:** the `test` script in `package.json`.

### 6. Fixed a cleanup hook that failed on Windows (session 3)

The first version of the test suite deleted its throwaway database in an `after`
hook without closing the connection. All four tests passed but the run exited
non-zero with `EPERM`, because Windows will not delete an open file. The hook now
closes the database first.

**Traceable to:** the `after` hook in `tests/tasks.test.ts`, and the comment
explaining why.

### 7. Verified claims the assistant had made in the documentation (session 4)

The generated README stated that `npm run build` and `npm start` work. Neither
had been run at that point. `npm run build` was run before the README was
committed, and passed.

The README's run instructions were then tested by cloning the repository into a
fresh directory in a new shell, installing, testing and running from that clone
only, and walking all seven functional steps from the brief. This confirmed that
the database is created automatically on first run and that no undocumented step
is required.

**Traceable to:** the "Running It" section of the README.

---

## Design decisions that came from the transcripts

Two decisions in the shipped code were discussed before being implemented and are
visible in the transcripts:

- **Overdue derived rather than stored.** The reasoning — that a stored flag is
  wrong the moment a due date passes while the application is not running, since
  nothing writes to the database at midnight — is in session 1 and is implemented
  in the `CASE` expression in `listTasks` in `lib/tasks.ts`.
- **Topic as a separate table rather than a text column.** The assistant flagged
  this as arguable, noting a plain text column would be simpler and defensible
  for a single-user application. The two-table design was kept for the reasons
  given in the README's Database Design section.
