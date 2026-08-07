# Running It

## Requirements

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
The minimum version is declared in `package.json` under `engines`, so `npm install`
warns if the installed version is too low. A `.nvmrc` file is also included — if
you use nvm, `nvm use` in the project root will switch to a suitable version.

npm install now fails outright, with the required version, if Node is too old.

## Install

From a clean clone:

```bash
git clone <repository-url>
cd todo-app
npm install
```

Nothing is compiled during install. The application uses Node's built-in SQLite
rather than a native driver, so there is no C++ toolchain requirement.

## Run

```bash
npm run dev
```

Then open <http://localhost:3000>.

The SQLite database is created automatically at `data/todo.db` on first run, and
the schema in `db/schema.sql` is applied to it at that point. There is no
migration step and no seed step — a clean clone needs nothing beyond the three
commands above.

## Test

```bash
npm test
```

This runs the full suite. The tests create their own throwaway database in the
system temporary directory and delete it afterwards; they never read or write
`data/todo.db`.

## Build and run in production mode (optional)

```bash
npm run build
npm start
```

## Resetting the data

Deleting the `data/` directory removes all tasks. The next run recreates an empty
database.

## Verification

These instructions were checked by cloning the repository into a fresh directory
in a new shell, then running only the commands above. The application installed,
tested and started with no additional steps.

---

AI Declaration: The preceding document was generated and edited with the assistance of the following: Claude-Web[Claude Opus 5]
