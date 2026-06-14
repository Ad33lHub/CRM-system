# Personal Project Notes (local — gitignored)

> This file is yours alone. It is gitignored and never shared. Use it for scratch
> context, local URLs, in-progress reminders, and machine-specific notes. Claude
> reads it alongside `.claude/CLAUDE.md`, but teammates never see it.

## My local environment

- Client dev server: http://localhost:5173
- API dev server:    http://localhost:5000
- Local Mongo:       mongodb://127.0.0.1:27017/crm_dev   (or my dev Atlas DB)
- Local Redis:       redis://127.0.0.1:6379

## Scratchpad / current focus

- (Phase 1 complete: planning docs in /docs are approved.)
- Next: Phase 2 scaffolding — bootstrap client/ and server/.

## Personal reminders

- Use `feature/<short-desc>` branches off `dev`.
- Keep secrets in `server/.env` and `client/.env.local` (both gitignored — Claude is read-denied on them).
