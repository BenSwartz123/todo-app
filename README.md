# Todo

A local-first todo application built with Next.js and SQLite. It runs on your own
machine, serves a single user, and has no accounts and no network component.

Tasks carry a title, description, due date and topic. Each task has one of three
statuses — Todo, In-Progress, Complete — and tasks are never deleted, only
archived, so they remain viewable.

---

## Running It

### Requirements

- **Node.js 22.18.0 or later.** Developed and tested on **v25.9.0**.
  Two features require this floor:
  - `node:sqlite`, the built-in SQLite module, runs without a flag from Node 22.13.
  - Running `.ts` files directly (used by the test command) works without a flag
    from Node 22.18.
  Node 24 LTS or any later release satisfies both.
- **npm.** Developed with npm 11.12.1; any version bundled with a supported Node
  release will do.

Check your version before starting:

```bash
node --version
```

### Install

From a clean clone:

```bash
git clone <repository-url>
cd todo-app
npm install
```

### Run

```bash
npm run dev
```

Then open <http://localhost:3000>.

The SQLite database is created automatically at `data/todo.db` on first run, and
the schema in `db/schema.sql` is applied to it at that point. There is no
migration step and no seed step — a clean clone needs nothing beyond the three
commands above.

### Test

```bash
npm test
```

This runs the full suite. The tests create their own throwaway database in the
system temporary directory and delete it afterwards; they never read or write
`data/todo.db`.

### Build and run in production mode (optional)

```bash
npm run build
npm start
```

### Resetting the data

Deleting the `data/` directory removes all tasks. The next run recreates an empty
database.

---

## Third-Party Code

### Runtime dependencies

| Package | Why it is here |
| --- | --- |
| `next` (16.2.12) | The application framework required by the brief. Server Actions are used for all writes, which keeps database access on the server where `node:sqlite` is available, and avoids hand-writing API routes for four operations. |
| `react` (19.2.4) | Required by Next.js; the component model the framework is built on. |
| `react-dom` (19.2.4) | Required by Next.js to render React components to the DOM in the browser. |

### Development dependencies

| Package | Why it is here |
| --- | --- |
| `typescript` | Static typing across the data layer and the UI. It also gives a pre-flight check on a clean clone: `npx tsc --noEmit` catches errors that would otherwise only appear at runtime. |
| `@types/node` | Type definitions for Node's built-in modules. Specifically needed for `node:sqlite`, which is recent enough that older versions of this package do not declare it. |
| `@types/react`, `@types/react-dom` | Type definitions for React, so component props and JSX are type-checked. |
| `tailwindcss`, `@tailwindcss/postcss` | Utility CSS, installed by `create-next-app` and kept because the interface needs only spacing, borders and one highlight colour, which does not justify a separate stylesheet. |
| `eslint`, `eslint-config-next` | Linting with the Next.js recommended rules, installed by `create-next-app`. |

### Deliberately not used: a SQLite driver

The obvious choice for SQLite in Node is `better-sqlite3`. It is **not** used here.

It is a native module: on a machine with no prebuilt binary for the installed
Node version, `npm install` falls back to compiling from C++ source, which
requires Python and a C++ toolchain. That failed on the development machine,
which has no administrator rights to install either.

The application uses **`node:sqlite`** instead — SQLite built into Node itself,
available since Node 22.5 and usable without a flag since 22.13. It provides the
same synchronous prepared-statement API and reads the same database file format.

This is a deliberate improvement rather than a workaround: it removes a native
build step from `npm install`, so a clean clone cannot fail to compile on
someone else's machine.

---

## Database Design

The schema lives in `db/schema.sql` and is applied on first connection by
`lib/db.ts`. Two tables.

### `topics`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `INTEGER` | Primary key, autoincrement. |
| `name` | `TEXT` | `NOT NULL`, `UNIQUE COLLATE NOCASE`. |

`COLLATE NOCASE` on the unique constraint means "Uni" and "uni" are the same
topic, so a typo in capitalisation cannot silently split one topic into two.

### `tasks`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `INTEGER` | Primary key, autoincrement. |
| `title` | `TEXT` | `NOT NULL`. |
| `description` | `TEXT` | `NOT NULL DEFAULT ''` — absent rather than null. |
| `due_date` | `TEXT` | `NOT NULL`. ISO 8601 `YYYY-MM-DD`. |
| `topic_id` | `INTEGER` | `NOT NULL`, foreign key to `topics(id)`, `ON DELETE RESTRICT`. |
| `status` | `TEXT` | `NOT NULL DEFAULT 'todo'`, constrained by `CHECK` to `todo`, `in_progress`, `complete`. |
| `archived_at` | `TEXT` | Nullable timestamp. `NULL` means the task is active. |
| `created_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now'))`. |
| `updated_at` | `TEXT` | `NOT NULL DEFAULT (datetime('now'))`, rewritten on every update. |

Two indexes support the queries the list view actually makes:
`idx_tasks_archived` on `archived_at`, and `idx_tasks_due` on `due_date`.

### Relationship

One topic has many tasks; each task belongs to exactly one topic
(`tasks.topic_id → topics.id`, many-to-one).

Topic is a separate table rather than a text column on `tasks` so that a topic
name is stored once. Renaming a topic is then a single-row update rather than a
rewrite of every task carrying that string, and sorting by topic sorts on a
value that is guaranteed consistent.

`ON DELETE RESTRICT` prevents deleting a topic that still has tasks attached,
which would otherwise leave rows pointing at a topic that no longer exists.
Topics are created on demand when a task names one that does not yet exist.

### Three decisions worth stating

**Archive is a flag, not a second table.** Archiving sets `archived_at` to a
timestamp on the task row itself. Nothing is copied or moved, and no row is ever
deleted. The active list is `WHERE archived_at IS NULL` and the archive is
`WHERE archived_at IS NOT NULL` — the same table, the same query, one condition
inverted. Copying rows to an archive table would duplicate the schema and create
two places where a task can live.

**Overdue is derived, never stored.** There is no overdue column and no overdue
status. It is computed at read time, in the `SELECT`:

```sql
CASE WHEN tasks.due_date < date('now') AND tasks.status <> 'complete'
     THEN 1 ELSE 0 END AS overdue
```

Stored, it would be wrong the moment a due date passed while the application was
not running — nothing writes to the database at midnight. Derived, it is correct
whenever it is read. The condition also means completing a task clears its
overdue flag without touching the due date.

**The three statuses are enforced in the schema.** The `CHECK` constraint on
`status` means an invalid status is rejected by the database, not just by the
form. The brief fixes these three, so they are fixed at the lowest level rather
than trusted to the UI.

### Where the data lives

`data/todo.db`, ignored by git so a clone never arrives carrying someone else's
tasks. `lib/db.ts` reads the path from the `DB_PATH` environment variable and
falls back to that default, which is what lets the tests point at a throwaway
file instead.

---

## Testing

`tests/tasks.test.ts`, run with `npm test`, using Node's built-in test runner —
no test framework dependency.

Four tests:

1. A created task is returned with all four fields intact.
2. Archiving removes a task from the active list but it remains readable in the
   archive.
3. Overdue is derived from the due date, and marking a task complete clears it.
4. The list sorts correctly by due date and by status.

The tests set `DB_PATH` to a uniquely named file in the system temp directory
*before* importing the data layer, then import it dynamically so the connection
opens against that file. The database is closed and deleted afterwards. They are
deterministic, depend on no pre-existing data, and were verified to pass with the
developer's own `data/` directory renamed out of the way.

---

## Notes on scope

- Archived tasks are viewable but not editable. The brief requires that an
  archived task remains viewable; editing one is not a requirement, and allowing
  it would let a task be changed after being put away.
- Archived tasks can be restored to the active list.
- Sort order is held in the URL (`/?sort=topic`), so a chosen order survives a
  page reload and can be linked to.