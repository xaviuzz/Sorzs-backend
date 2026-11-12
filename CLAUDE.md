# Sorzs-backend

TypeScript API on Bun. Owns the contract, `openapi.yaml`. Part of the Sorzs umbrella; cross-repo rules and decisions live in the umbrella's `CLAUDE.md` and `.claude/decisions.md`.

## Commands

- `bun run test`: `bun test`
- `bun run lint`: Biome check (lint and format) and the language check (`lint:language`, no word "source" under `src/` and `test/` except files listed in `language-exceptions.txt`); `bunx biome check --write .` fixes
- `bun run typecheck`: `tsc --noEmit`
- `bun run build`: `bun build` into `dist/`

A change is done when test, lint, typecheck and build pass.

## Image

`Dockerfile` runs `bun run start` from source on port 3000 (`PORT`); `Sorzs-e2e` builds it. `docker build -t sorzs-backend .`. In this sandbox `docker run` fails on bridge networking; add `--network host`.

The list and the users live in `sorzs.db` inside `DATA_DIR`: `/data` in the image, a volume; `./data` in development, which git ignores. On start, `Migrations` brings the file up to the last numbered migration, in `src/infrastructure/sqlite/migrations/` (rules: `.claude/docs/migrations.md`); each row carries its owner, and rows saved before owners existed are given to `xaviuzz` by migration 2. A file that cannot be read, a migration that fails and a file newer than the application each stop the start. A schema change is a new migration at the end of the list with its own test; repositories assume the schema. On start `SEED_USERS` inserts only the usernames the database lacks. Tests that start a server pass a temporary folder; tests that build the registry or the users take their connection from `MigratedDatabaseFactory`, in a temporary folder or in memory.

The server refuses to start without `AUTH_SECRET` (signs tokens) and `SEED_USERS` (`username:password[:role]` pairs separated by commas; role is `admin` or `user`, default `user`). Development and e2e use `xaviuzz:p1casso:admin,ana:pueblos`; tests take them from `test/AuthEnvironment.ts`. Run it in development with `AUTH_SECRET=dev-secret SEED_USERS='xaviuzz:p1casso:admin,ana:pueblos' bun run start` (port 3000).

## Stack

`Bun.serve` and `bun test`, no framework, no validation library. Biome, TypeScript and `@types/he` are the only dev dependencies; `he` (decodes HTML character references in titles) is the only runtime one. Add nothing else without asking.

## Layout

`test/` mirrors `src/`. Tests assert on public behavior.

Imports point inward: `domain/` imports no other project layer except `call/CallError` and `ErrorCode`, which its errors extend, and may import a pure library with no I/O (`he`); `infrastructure/` imports `domain/`; `call/` and `operations/` import all of them, never the reverse. `domain/` appears with the first concept, one folder per functional concept; `infrastructure/` has one folder per technology or service (`http/`, `google/`, `memory/`, `sqlite/`, `transport/`). A new class goes in the folder its dependencies allow. Why: `.claude/decisions/domain-has-its-own-folder-one-per-concept.md` and `.claude/decisions/infrastructure-is-organized-by-technology.md`.

Every `expect(...).rejects` and `.resolves` is awaited. Bun waits for an unawaited one, but the `await` makes the check explicit instead of relying on the runner.

`language-exceptions.txt` lists `RenameOldIdentifierKey.ts` and the tests that build entries with the key `sourceId` that entries saved before the rename carry; the migration rewrites it to `sorzId`.
