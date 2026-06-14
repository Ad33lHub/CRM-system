# 09 — Dependencies

Reference for every package in the monorepo. This is an npm **workspaces** repo:
there is a **single root `package-lock.json`**; dependencies are hoisted to the
root `node_modules`. Install once at the root (`npm install` / `npm ci`) — do not
create per-workspace lockfiles.

Versions below are the declared semver ranges. See `package-lock.json` for exact
resolved versions.

---

## Section 1 — Frontend Dependencies (`client`)

| Package            | Version    | Purpose                                            |
| ------------------ | ---------- | -------------------------------------------------- |
| react              | ^18.3.0    | UI library                                         |
| react-dom          | ^18.3.0    | React DOM renderer                                 |
| react-router-dom   | ^6.24.0    | Client-side routing                                |
| @reduxjs/toolkit   | ^2.2.0     | State management + RTK Query (server cache)        |
| react-redux        | ^9.1.0     | React bindings for Redux                           |
| axios              | ^1.7.0     | HTTP client (auth headers, refresh flow)           |
| socket.io-client   | ^4.7.0     | Realtime client (notifications, chat)              |
| react-hook-form    | ^7.52.0    | Form state and validation                          |
| zod                | ^3.23.0    | Schema validation (shared client/server shape)     |
| recharts           | ^2.12.0    | Charts for analytics dashboards                    |
| @dnd-kit/core      | ^6.1.0     | Drag-and-drop (task board)                         |
| react-window       | ^1.8.10    | List/board virtualization                          |
| date-fns           | ^3.6.0     | Date formatting and math                           |
| lucide-react       | ^0.400.0   | Icon set                                           |
| clsx               | ^2.1.0     | Conditional className composition                  |
| tailwind-merge     | ^2.4.0     | Merge/de-dupe Tailwind utility classes (`cn()`)    |

## Section 2 — Backend Dependencies (`server`)

| Package                   | Version       | Purpose                                          |
| ------------------------- | ------------- | ------------------------------------------------ |
| express                   | ^4.19.0       | HTTP web framework                               |
| mongoose                  | ^8.5.0        | MongoDB ODM (models, schemas, indexes)           |
| ioredis                   | ^5.4.0        | Redis client (cache, BullMQ connection)          |
| redis                     | ^4.7.0        | Redis client (secondary use; see note below)     |
| jsonwebtoken              | ^9.0.0        | JWT sign/verify (access + refresh tokens)        |
| bcryptjs                  | ^2.4.3        | Password hashing (cost 12)                       |
| zod                       | ^3.23.0       | Request input validation at the boundary         |
| socket.io                 | ^4.7.0        | Realtime server                                  |
| bullmq                    | ^5.8.0        | Background job queues (email, reports)            |
| winston                   | ^3.13.0       | Application logging                              |
| winston-daily-rotate-file | ^4.7.1        | Daily-rotated log files                          |
| morgan                    | ^1.10.0       | HTTP request logging (piped to Winston)          |
| helmet                    | ^7.1.0        | Security headers                                 |
| cors                      | ^2.8.5        | CORS handling                                    |
| compression               | ^1.7.4        | gzip response compression                        |
| cookie-parser             | ^1.4.6        | Parse cookies (refresh token cookie)             |
| express-rate-limit        | ^7.3.0        | Rate limiting (global + auth)                    |
| express-mongo-sanitize    | ^2.2.0        | Strip `$`/`.` to prevent NoSQL injection         |
| express-async-errors      | ^3.1.1        | Forward async errors to the error handler        |
| dotenv                    | ^16.4.0       | Load environment variables                       |
| multer                    | ^1.4.5-lts.1  | Multipart/file upload parsing                    |
| multer-storage-cloudinary | ^4.0.0        | Stream uploads to Cloudinary                     |
| cloudinary                | ^2.2.0        | Cloudinary SDK (media storage)                   |
| sharp                     | ^0.33.0       | Image processing/resizing                        |
| nodemailer                | ^8.0.10       | Transactional email (SMTP)                       |
| handlebars                | ^4.7.8        | Email template rendering                         |
| node-cron                 | ^4.2.1        | Scheduled jobs                                   |
| puppeteer                 | ^23.0.0       | Headless Chrome for PDF generation (invoices)    |
| exceljs                   | ^3.4.0        | Excel export generation                          |

> **Note — two Redis clients:** both `ioredis` and `redis` are present. `ioredis`
> is the primary client (used by `config/redis.js` and required by BullMQ).
> Consolidating onto a single client is a recommended future cleanup.

## Section 3 — Dev Dependencies

| Package                     | Location        | Purpose                                  |
| --------------------------- | --------------- | ---------------------------------------- |
| vite                        | client          | Build tool / dev server                  |
| @vitejs/plugin-react        | client          | React support for Vite                   |
| vitest                      | client          | Test runner                              |
| @vitest/coverage-v8         | client          | Test coverage (v8)                       |
| tailwindcss                 | client          | Utility-first CSS framework              |
| postcss                     | client          | CSS transform pipeline                   |
| autoprefixer                | client          | Vendor-prefix CSS                        |
| eslint                      | client + server | Linting                                  |
| eslint-config-prettier      | client + server | Disable ESLint rules that clash w/ Prettier |
| eslint-plugin-react         | client          | React lint rules                         |
| eslint-plugin-react-hooks   | client          | Hooks lint rules                         |
| eslint-plugin-jsx-a11y      | client          | Accessibility lint rules                 |
| eslint-plugin-prettier      | server          | Run Prettier as an ESLint rule           |
| @eslint/js                  | server          | ESLint JS recommended config             |
| prettier                    | client + server | Code formatting                          |
| commitlint                  | client          | Validate commit messages                 |
| @commitlint/config-conventional | client      | Conventional Commits ruleset             |
| husky                       | client          | Git hooks (commit-msg, pre-commit)       |
| nodemon                     | server          | Auto-restart server in dev               |
| concurrently                | root            | Run client + server dev servers together |
| rimraf                      | root            | Cross-platform `rm -rf` for `clean`      |

## Section 4 — Adding new packages (policy)

- **Discuss with the team first**, and check `docs/04_Tech_Stack.md` — the stack is
  fixed and must not be swapped without updating that doc (CLAUDE.md hard rule).
- Prefer packages with **>1M weekly downloads** and **active maintenance**
  (recent releases, healthy issue tracker).
- Run **`npm audit`** after every install; do not commit new HIGH/CRITICAL vulns.
- Install at the **root** so the single lockfile stays authoritative
  (`npm install <pkg> -w client` / `-w server` to target a workspace).
- **Update this document** whenever a dependency is added, removed, or its purpose changes.

---

## Known audit status (as of this task)

`npm audit` reports 8 vulnerabilities (2 critical, 6 moderate), all requiring
**major** version bumps to resolve. They are accepted and tracked rather than
force-upgraded mid Phase 1:

| Chain                                   | Severity | Notes                                                                 |
| --------------------------------------- | -------- | --------------------------------------------------------------------- |
| `vitest`, `@vitest/coverage-v8`         | critical | Dev-only test runner. Advisory GHSA-5xrq-8626-4rwp is exploitable only when the Vitest **UI server** is running, which this project never does. Fix = `vitest@4` (major). |
| `vite`, `vite-node`, `@vitest/mocker`, `esbuild` | moderate | Dev-only build/test tooling. Fix = `vite@8` (major), cascades to `@vitejs/plugin-react`. |
| `exceljs` → `uuid`                      | moderate | Server export lib. Fix = `exceljs@4` (major).                          |

`.npmrc` sets `audit-level=high`, so `npm install` does not fail on these
moderates. Revisit the major upgrades (vite 8 / vitest 4 / exceljs 4) as a
dedicated, tested change.
