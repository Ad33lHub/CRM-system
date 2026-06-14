# Rule: Code Style (all code)

Modular instruction file imported by `.claude/CLAUDE.md`. Applies to both `client/` and `server/`.
Authoritative source: `docs/05_Development_Standards.md`.

## Formatting & linting

- **Prettier** (2-space indent, single quotes, semicolons, trailing commas `es5`, width 100, LF) and
  **ESLint** must both pass. A PostToolUse hook auto-formats edited files; don't fight it.
- No ESLint warnings in committed code. An `// eslint-disable-*` line **must** carry an inline reason.

## Naming

| Element | Convention | Example |
|---------|------------|---------|
| Component file | kebab-case | `task-board.jsx` |
| Component export | PascalCase | `TaskBoard` |
| Variable / function | camelCase | `getOpenTasks()` |
| Constant value | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE` |
| Class | PascalCase | `AppError` |
| Mongoose model | PascalCase singular | `Invoice` |
| DB field | camelCase | `clientId`, `isActive` |
| API route | kebab-case plural | `/api/time-logs` |
| Env var | UPPER_SNAKE_CASE | `JWT_PRIVATE_KEY` |
| Branch | `<type>/<kebab-desc>` | `feature/lead-conversion` |

## Server rules

- Layering: **route → controller → service → model**. No business logic in routes; no DB queries in controllers.
- Wrap every async controller in `asyncHandler`; throw `AppError(message, statusCode, code)` from services.
- Every response goes through `apiResponse.success | error | paginated` — never raw `res.json(data)`.
- Validate request input with a **Zod** schema via the `validate` middleware before the controller runs.
- Log with **Winston** (`logger.info/warn/error`). `console.*` is lint-blocked outside tests.
- Enforce **RBAC** with the `authorize` middleware using the matrix in `docs/03_User_Roles.md`.

## Shared rules

- No hardcoded reused strings or magic numbers — put them in `constants/` (roles, statuses, messages, route paths, limits).
- No secrets in code. Read config only from validated env (`config/env.js`); `.env*` is gitignored.
- Keep functions small and single-purpose; prefer pure helpers in `utils/`.
- Conventional Commits for every commit (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, ...).

## Standard API response envelope (must match exactly)

```jsonc
// success
{ "success": true, "message": "…", "data": { } }

// error
{ "success": false, "message": "…", "error": { "code": "…", "statusCode": 404 } }

// paginated
{ "success": true, "message": "…", "data": [ ],
  "pagination": { "page": 1, "limit": 20, "totalItems": 0, "totalPages": 0,
                  "hasNextPage": false, "hasPrevPage": false } }

// validation error (HTTP 422)
{ "success": false, "message": "Validation failed",
  "error": { "code": "VALIDATION_ERROR", "statusCode": 422,
             "fields": { "email": ["Invalid email address"] } } }
```
