# Software House CRM — Development Standards

> **Document:** 05 — Development Standards
> **Project:** Software House CRM
> **Status:** Approved for Phase 1
> **Last Updated:** 2026-06-06

These are the binding conventions every contributor follows. CI enforces what it can (lint, format, tests); reviewers enforce the rest. The goal is a codebase where any file looks like it was written by one person.

---

## 1. Folder Structure

The repository is a monorepo with two top-level apps: `/client` (React + Vite) and `/server` (Node + Express), plus shared docs and tooling.

### 1.1 Repository Root

```
crm-software-house/
├── client/                 # React + Vite frontend
├── server/                 # Node + Express backend
├── docs/                   # Planning & architecture docs (this folder)
├── .github/
│   └── workflows/          # CI: lint, test, build, deploy
├── .gitignore
├── .editorconfig
├── README.md
└── package.json            # workspace scripts (lint:all, test:all)
```

### 1.2 Client Tree (`/client`)

```
client/
├── public/                       # static assets served as-is
├── src/
│   ├── app/
│   │   ├── store.js              # Redux store config
│   │   └── router.jsx            # React Router routes
│   ├── assets/                   # images, fonts, svg
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives (button, dialog…)
│   │   └── common/               # shared app components (page-header, empty-state)
│   ├── features/                 # one folder per domain module
│   │   ├── auth/
│   │   │   ├── components/        # login-form.jsx, otp-input.jsx
│   │   │   ├── api/               # auth-api.js (RTK Query slice)
│   │   │   ├── hooks/             # use-auth.js
│   │   │   ├── auth-slice.js
│   │   │   └── auth.schema.js     # Zod schemas (shared shape with server)
│   │   ├── clients/
│   │   ├── leads/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── invoices/
│   │   ├── employees/
│   │   ├── chat/                 # realtime communication
│   │   ├── notifications/
│   │   ├── analytics/
│   │   └── dashboard/
│   ├── hooks/                    # global hooks (use-debounce.js, use-socket.js)
│   ├── lib/
│   │   ├── axios.js              # axios instance + interceptors
│   │   ├── socket.js             # socket.io-client setup
│   │   └── utils.js              # cn(), formatters
│   ├── constants/                # route-paths.js, query-keys.js, roles.js
│   ├── layouts/                  # app-layout.jsx, portal-layout.jsx
│   ├── pages/                    # route-level pages composing features
│   ├── styles/                   # tailwind.css, globals
│   ├── App.jsx
│   └── main.jsx
├── .env.local                    # gitignored
├── .eslintrc.cjs
├── .prettierrc
├── tailwind.config.js
├── vite.config.js
└── package.json
```

### 1.3 Server Tree (`/server`)

```
server/
├── src/
│   ├── config/
│   │   ├── env.js                # validated env (Zod)
│   │   ├── db.js                 # Mongoose connection
│   │   ├── redis.js              # ioredis client
│   │   ├── cloudinary.js
│   │   └── logger.js             # Winston instance
│   ├── modules/                  # one folder per domain module
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.validation.js   # Zod schemas
│   │   │   └── auth.model.js        # Mongoose schema (or in models/)
│   │   ├── clients/
│   │   ├── leads/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── invoices/
│   │   ├── employees/
│   │   ├── chat/
│   │   ├── notifications/
│   │   ├── analytics/
│   │   └── files/
│   ├── middleware/
│   │   ├── authenticate.js        # JWT verify
│   │   ├── authorize.js           # RBAC permission check
│   │   ├── validate.js            # Zod request validator
│   │   ├── error-handler.js       # central error → envelope
│   │   └── rate-limit.js
│   ├── models/                    # shared Mongoose models (if not per-module)
│   ├── jobs/                      # BullMQ processors (email, pdf, ai, notify)
│   ├── queues/                    # BullMQ queue definitions
│   ├── cron/                      # node-cron schedules
│   ├── sockets/                   # Socket.IO handlers & presence
│   ├── utils/
│   │   ├── api-response.js        # success/error/paginated helpers
│   │   ├── async-handler.js       # try/catch wrapper for controllers
│   │   └── app-error.js           # AppError class
│   ├── constants/                 # roles.js, permissions.js, messages.js
│   ├── app.js                     # express app (middleware, routes)
│   └── server.js                  # bootstrap (http + socket + queues)
├── tests/
│   ├── unit/
│   └── integration/
├── .env                           # gitignored
├── .eslintrc.cjs
├── .prettierrc
└── package.json
```

---

## 2. Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Component files | kebab-case | `login-form.jsx`, `task-board.jsx` |
| React component name (export) | PascalCase | `export function LoginForm()` |
| Utility / non-component files | camelCase or kebab-case (be consistent) | `formatCurrency.js`, `api-response.js` |
| Variables & functions | camelCase | `const activeClients`, `function getOpenTasks()` |
| Constants | UPPER_SNAKE_CASE | `const MAX_UPLOAD_SIZE`, `DEFAULT_PAGE_SIZE` |
| Constants files | kebab-case, plural concept | `roles.js`, `error-messages.js` |
| Classes (e.g. errors) | PascalCase | `class AppError` |
| React hooks | `use` + camelCase, kebab-case file | `useAuth()` in `use-auth.js` |
| Redux slices | `<domain>-slice.js`, `<domain>Slice` | `auth-slice.js`, `authSlice` |
| Database fields | camelCase | `clientId`, `createdAt`, `isActive` |
| Mongoose models | PascalCase singular | `Client`, `Invoice`, `TimeLog` |
| Mongo collections | lowercase plural (Mongoose default) | `clients`, `invoices`, `timelogs` |
| API routes | kebab-case, plural nouns | `/api/clients`, `/api/projects`, `/api/time-logs` |
| Route params | camelCase | `/api/clients/:clientId` |
| Env variables | UPPER_SNAKE_CASE | `JWT_PRIVATE_KEY`, `MONGO_URI` |
| Git branches | `<type>/<short-desc>` kebab | `feature/lead-conversion`, `fix/invoice-total` |

**Branch types:** `feature/*`, `fix/*`, `hotfix/*`, `release/*` (matching Git Flow in Tech Stack doc).

---

## 3. Code Style Rules

1. **ESLint + Prettier are mandatory.**
   - ESLint config: `eslint:recommended` + React/React-Hooks plugins (client) and Node plugin (server), with `import/order` enforced.
   - Prettier: 2-space indent, single quotes, semicolons, trailing commas (`es5`), print width 100, LF line endings.
   - Lint and format must pass in CI; a pre-commit hook (lint-staged + Husky) auto-formats staged files.
   - No ESLint warnings in committed code; `// eslint-disable` requires an inline justification comment.

2. **No `console.log` in production code.** Use the Winston logger (`logger.info/warn/error`) on the server. `console.*` is allowed only in tests and local debugging and is flagged by lint (`no-console`) in `/server/src`.

3. **All async functions must handle errors.** Controllers are wrapped in `asyncHandler` (a try/catch wrapper) so rejections flow to the central error handler. Service-level async code that can fail must use `try/catch` and throw an `AppError` with a status code — never swallow errors silently.

4. **All API responses must use the standard response envelope** (see §4). Controllers return via `apiResponse.success/error/paginated` helpers — never `res.json(rawData)`.

5. **No hardcoded strings for anything reused.** Roles, permissions, status enums, error messages, route paths, and query keys live in `constants/` files and are imported. Magic numbers (page sizes, limits, timeouts) are named constants.

6. **Validation at the boundary.** Every endpoint that accepts input runs a Zod schema via the `validate` middleware before reaching the controller. The same Zod shapes back the frontend forms.

7. **No secrets in source.** All secrets come from validated env (`config/env.js`); `.env*` files are gitignored. PRs introducing literal credentials are rejected.

8. **Keep functions small and single-purpose.** Prefer pure functions in `utils/`; controllers orchestrate, services hold business logic, models hold data shape — no business logic in routes.

---

## 4. Standard API Response Envelope

Every JSON response from the API uses one of these shapes. `success` is always present.

### 4.1 Success Response

```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c0d",
    "name": "Acme Corp",
    "createdAt": "2026-06-06T10:15:00.000Z"
  }
}
```

### 4.2 Error Response

```json
{
  "success": false,
  "message": "Client not found",
  "error": {
    "code": "CLIENT_NOT_FOUND",
    "statusCode": 404
  }
}
```

### 4.3 Paginated List Response

```json
{
  "success": true,
  "message": "Clients fetched successfully",
  "data": [
    { "id": "665f...", "name": "Acme Corp" },
    { "id": "665e...", "name": "Globex" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 137,
    "totalPages": 7,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 4.4 Validation Error Response

Returned with HTTP `422` when Zod validation fails. `error.fields` maps each invalid field to its messages.

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "statusCode": 422,
    "fields": {
      "email": ["Invalid email address"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

---

## 5. Git Commit Message Format

Follow the **Conventional Commits** specification:

```
<type>(<optional-scope>): <short imperative summary>

<optional body — what & why, wrapped at 72 cols>

<optional footer — BREAKING CHANGE:, Refs #123>
```

**Allowed types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`, `build`, `ci`.

**Examples:**

```
feat(leads): add lead-to-client conversion endpoint
```
```
fix(invoices): correct tax rounding on multi-line totals
```
```
docs(readme): document local environment setup
```
```
refactor(auth): extract token issuance into auth.service
```
```
test(tasks): add integration tests for status transitions
```
```
chore(deps): bump mongoose to 8.4 and lock transitive deps
```

Rules:
- Summary in **imperative mood**, ≤ 72 chars, no trailing period.
- One logical change per commit.
- Reference issues in the footer (`Refs #42`, `Closes #42`).
- Breaking changes declared with a `BREAKING CHANGE:` footer.

---

## 6. Pull Request (PR) Rules

1. **No direct commits to `main` or `dev`.** All changes land via PR; both branches are protected.
2. **Minimum 1 reviewer approval** required before merge (2 for changes to auth, security, or payments/invoices).
3. **All checks must pass before merge:** ESLint, Prettier check, type/build, and the full test suite are green in CI.
4. **PR scope is focused:** one feature/fix per PR; keep diffs reviewable (prefer < ~400 lines of change where practical).
5. **PR description template** must include: what changed, why, how to test, screenshots for UI, and linked issue.
6. **Branch naming** matches §2 (`feature/*`, `fix/*`, `hotfix/*`, `release/*`).
7. **Up to date with base:** rebase/merge `dev` before requesting review; resolve conflicts in your branch.
8. **No merge with unresolved review comments** or failing/skipped required tests.
9. **Squash-merge** feature PRs into `dev` with a Conventional Commit title; `release/*` and `hotfix/*` follow the Git Flow merge rules in the Tech Stack doc.
10. **Hotfixes** branch from `main`, and after merge to `main` must also be merged back into `dev` to avoid regressions.

---

*End of Development Standards.*
