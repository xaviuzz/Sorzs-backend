# Sorzs-backend

TypeScript API on Bun. Owns the contract, `openapi.yaml`. Part of the Sorzs umbrella; cross-repo rules and decisions live in the umbrella's `CLAUDE.md` and `.claude/decisions.md`.

## Commands

- `bun run test`: `bun test`
- `bun run lint`: Biome check (lint and format); `bunx biome check --write .` fixes
- `bun run typecheck`: `tsc --noEmit`
- `bun run build`: `bun build` into `dist/`

A change is done when test, lint, typecheck and build pass.

## Image

`Dockerfile` runs `bun run start` from source on port 3000 (`PORT`); `Sorzs-e2e` builds it. `docker build -t sorzs-backend .`. In this sandbox `docker run` fails on bridge networking; add `--network host`.

The list lives in `sorzs.db` inside `DATA_DIR`: `/data` in the image, a volume; `./data` in development, which git ignores. A file that cannot be read stops the start. Tests that start a server or the registry pass a temporary folder.

## Stack

`Bun.serve` and `bun test`, no framework, no validation library. Biome and TypeScript are the only dev dependencies. Add nothing else without asking.

## Layout

`test/` mirrors `src/`. Tests assert on public behavior.

Imports point inward: `domain/` imports nothing outside itself except `call/CallError` and `ErrorCode`, which its errors extend; `infrastructure/` imports `domain/`; `call/` and `operations/` import all of them, never the reverse. `domain/` appears with the first concept, one folder per functional concept; `infrastructure/` has one folder per technology or service (`http/`, `google/`, `memory/`, `sqlite/`, `transport/`). A new class goes in the folder its dependencies allow. Why: `.claude/decisions/domain-has-its-own-folder-one-per-concept.md` and `.claude/decisions/infrastructure-is-organized-by-technology.md`.

Every `expect(...).rejects` and `.resolves` is awaited. Bun waits for an unawaited one, but the `await` makes the check explicit instead of relying on the runner.
