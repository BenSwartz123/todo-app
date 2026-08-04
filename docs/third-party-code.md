# Third-Party Code

## Runtime dependencies

| Package | Why it is here |
| --- | --- |
| `next` (16.2.12) | The application framework required by the brief. Server Actions are used for all writes, which keeps database access on the server where `node:sqlite` is available, and avoids hand-writing API routes for four operations. |
| `react` (19.2.4) | Required by Next.js; the component model the framework is built on. |
| `react-dom` (19.2.4) | Required by Next.js to render React components to the DOM in the browser. |

## Development dependencies

| Package | Why it is here |
| --- | --- |
| `typescript` | Static typing across the data layer and the UI. It also gives a pre-flight check on a clean clone: `npx tsc --noEmit` catches errors that would otherwise only appear at runtime. |
| `@types/node` | Type definitions for Node's built-in modules. Specifically needed for `node:sqlite`, which is recent enough that older versions of this package do not declare it — an out-of-date version causes a type error on `lib/db.ts` even though the code runs correctly. |
| `@types/react`, `@types/react-dom` | Type definitions for React, so component props and JSX are type-checked. |
| `tailwindcss`, `@tailwindcss/postcss` | Utility CSS, installed by `create-next-app` and kept because the interface needs only spacing, borders and one highlight colour, which does not justify a separate stylesheet. |
| `eslint`, `eslint-config-next` | Linting with the Next.js recommended rules, installed by `create-next-app`. |

## Deliberately not used: a SQLite driver

The obvious choice for SQLite in Node is `better-sqlite3`. It is **not** used
here, and the absence is deliberate.

It is a native module. On a machine with no prebuilt binary for the installed
Node version, `npm install` falls back to compiling from C++ source, which
requires Python and a C++ toolchain. That is what happened during development,
on a machine with no administrator rights to install either.

The application uses **`node:sqlite`** instead — SQLite built into Node itself,
available since Node 22.5 and usable without a flag since 22.13. It provides the
same synchronous prepared-statement API and reads the same database file format.

This is an improvement rather than a workaround: it removes a native build step
from `npm install` entirely, so a clean clone cannot fail to compile on someone
else's machine. It also means the project has no database dependency to declare.

## Test tooling

No test framework is installed. The suite uses Node's built-in test runner
(`node --test`) and `node:assert`, for the same reason — one fewer dependency
that a clean clone has to resolve.

---

AI Declaration: The preceding document was generated and edited with the assistance of the following: Claude-Web[Claude Opus 5]