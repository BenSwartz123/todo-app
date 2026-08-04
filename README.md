# Todo

A local-first todo application built with Next.js and SQLite. It runs on your own
machine, serves a single user, and has no accounts and no network component.

Tasks carry a title, description, due date and topic. Each task has one of three
statuses — Todo, In-Progress, Complete — and tasks are never deleted, only
archived, so they remain viewable.

## Quickstart

Requires **Node.js 22.18.0 or later** (developed on v25.9.0).

```bash
npm install
npm run dev     # then open http://localhost:3000
npm test        # run the test suite
```

The database is created automatically on first run. There is no migration or
seed step.

## Documentation

| Document | Contents |
| --- | --- |
| [docs/running-it.md](docs/running-it.md) | Node version and every command needed to install, run and test from a clean clone |
| [docs/third-party-code.md](docs/third-party-code.md) | Every dependency and why it is there |
| [docs/database-design.md](docs/database-design.md) | Tables, relationships and the reasoning behind the schema |
| [docs/testing.md](docs/testing.md) | What the tests cover and how they are isolated |

AI usage transcripts and the usage declaration are in [`ai/`](ai/).

---

## AI Usage

This repository makes use of AI code generation using the following tools: Claude-Web[Claude Opus 5].

This repository does not use AI code review and does not use AI in-line editing tools

AI Declaration: The preceding document was generated and edited with the assistance of the following: Claude-Web[Claude Opus 5]