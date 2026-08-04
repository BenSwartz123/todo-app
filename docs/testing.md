# Testing

## Running the tests

```bash
npm test
```

That is the only command. It maps to `node --test "tests/**/*.test.ts"` and uses
Node's built-in test runner — there is no test framework dependency to install.

## What is covered

`tests/tasks.test.ts`, four tests:

1. **A created task is returned with all four fields.** Title, description, due
   date and topic are stored and read back intact, and a new task defaults to
   `todo`.
2. **Archiving removes a task from the active list but keeps it viewable.** The
   task leaves the active list, is still present and readable in the archived
   list, and its data is unchanged.
3. **Overdue is derived from the due date and cleared by completion.** A past due
   date is flagged overdue; a future one is not; marking the task complete clears
   the flag while its status remains one of the three permitted values.
4. **Tasks sort by due date and by status.** Due dates come back ascending, and
   statuses come back in workflow order rather than alphabetical order.

Tests 2 and 3 cover the two behaviours the brief singles out — archiving, and the
rule that overdue is indicated without being a status.

## Isolation

The tests never touch the developer's database.

`lib/db.ts` reads its path from the `DB_PATH` environment variable. The test file
sets that variable to a uniquely named file in the system temporary directory
(`todo-test-<pid>-<timestamp>.db`) **before** importing the data layer, then
imports it with a dynamic `import()` so the module is not hoisted above the
assignment. A static import would run first and open the default database.

An `after` hook closes the connection and deletes the file, along with its `-wal`
and `-shm` companions. The connection must be closed before the delete because
Windows will not remove a file that is still open.

Because the database is created fresh from `db/schema.sql` on each run and torn
down afterwards, the tests are deterministic and depend on no pre-existing data.

## Verification

Isolation was checked rather than assumed, in two ways:

- The suite was run with the developer's `data/` directory renamed out of the
  way. All four tests passed, confirming they do not read it.
- The suite was run from a fresh clone of the repository, in a new shell, with no
  `data/` directory present at all. All four tests passed.

  ---

AI Declaration: The preceding document was generated and edited with the assistance of the following: Claude-Web[Claude Opus 5]
