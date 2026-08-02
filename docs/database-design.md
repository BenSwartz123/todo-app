# Database Design

The schema lives in `db/schema.sql` and is applied on first connection by
`lib/db.ts`. Two tables.

## `topics`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `INTEGER` | Primary key, autoincrement. |
| `name` | `TEXT` | `NOT NULL`, `UNIQUE COLLATE NOCASE`. |

`COLLATE NOCASE` on the unique constraint means "Uni" and "uni" are the same
topic, so a difference in capitalisation cannot silently split one topic into
two.

## `tasks`

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

Dates and timestamps are stored as ISO 8601 text, which is SQLite's
recommended representation and sorts correctly as a string, so ordering by due
date needs no conversion.

Two indexes support the queries the list view actually makes:
`idx_tasks_archived` on `archived_at`, and `idx_tasks_due` on `due_date`.

## Relationship

**One topic has many tasks. Each task belongs to exactly one topic.**

`tasks.topic_id → topics.id`, a many-to-one relationship, enforced by a foreign
key with `PRAGMA foreign_keys = ON` set on every connection.

Topic is a separate table rather than a text column on `tasks` so that a topic
name is stored once. Renaming a topic is then a single-row update rather than a
rewrite of every task carrying that string, and sorting by topic sorts on a
value that is guaranteed consistent across tasks.

`ON DELETE RESTRICT` prevents deleting a topic that still has tasks attached,
which would otherwise leave rows pointing at a topic that no longer exists.
Topics are created on demand: naming a topic that does not yet exist inserts it.

## Three decisions worth stating

### Archive is a flag, not a second table

Archiving sets `archived_at` to a timestamp on the task row itself. Nothing is
copied or moved, and no row is ever deleted.

The active list is `WHERE archived_at IS NULL` and the archive is
`WHERE archived_at IS NOT NULL` — the same table, the same query, one condition
inverted. Copying rows to an archive table would duplicate the schema and create
two places where a task can live, with the attendant risk of them diverging.

Using a timestamp rather than a boolean costs nothing and records *when* a task
was archived.

### Overdue is derived, never stored

There is no overdue column and no overdue status. It is computed at read time,
in the `SELECT`:

```sql
CASE WHEN tasks.due_date < date('now') AND tasks.status <> 'complete'
     THEN 1 ELSE 0 END AS overdue
```

Stored, it would be wrong the moment a due date passed while the application was
not running — nothing writes to the database at midnight, so a stored flag would
only be correct until the next day turned over. Derived, it is correct whenever
it is read.

The `status <> 'complete'` condition also means completing a task clears its
overdue flag without touching the due date, and reopening it restores the flag.

This satisfies the brief's requirement that overdue be indicated but not be one
of the statuses: it is a computed property of a task, not a state a task can be
put into.

### The three statuses are enforced in the schema

The `CHECK` constraint on `status` means an invalid status is rejected by the
database, not merely by the form. The brief fixes these three and says they are
not user-customisable, so they are fixed at the lowest level rather than trusted
to the UI. The sort order (`todo`, `in_progress`, `complete`) is applied with a
`CASE` expression so status sorts by workflow order rather than alphabetically.

## Where the data lives

`data/todo.db`, ignored by git so a clone never arrives carrying someone else's
tasks. `lib/db.ts` reads the path from the `DB_PATH` environment variable and
falls back to that default, which is what lets the tests point at a throwaway
file instead.

The connection sets `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`,
the latter because SQLite does not enforce foreign keys by default.
