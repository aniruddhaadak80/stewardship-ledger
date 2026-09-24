# Contributing to Stewardship Ledger

Thanks for helping make powerful systems more answerable.

## Before opening a pull request

1. Run `npm ci`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Add or update a focused test or a reproducible manual check for behavior changes.
5. Keep public data examples synthetic and never commit credentials or personal information.

## Contribution shape

- Prefer small, reviewable changes with a clear user or steward outcome.
- Preserve the shared contracts in `src/lib/types.ts`, `src/lib/engine.ts`, and `src/lib/seals.ts`.
- Add a feed fallback whenever a new external source is introduced.
- Treat MCP tools as public APIs: document arguments, failure modes, and mutation semantics.
- Use accessible labels, keyboard-operable controls, and non-color-only status cues.

## Development

The app runs without environment variables by using an in-memory adapter. Set `DATABASE_URL` to a Neon Postgres pooled connection to persist cases across processes and deployments. Apply `db/schema.sql` before using a new database.

## Safety boundary

This project is an educational governance instrument. It does not certify a model, authorize a deployment, or replace legal, clinical, security, or affected-person review.
