# Software House CRM — Technology Stack & Decisions

> **Document:** 04 — Tech Stack
> **Project:** Software House CRM
> **Status:** Approved for Phase 1
> **Last Updated:** 2026-06-06

This document records every major technology choice, the version targeted, its purpose, and the reasoning — including what was rejected and why. Versions are the minimum targeted majors at project start; lockfiles are the source of truth at runtime.

---

## 1. Frontend Stack

| Technology | Version | Purpose | Why Chosen Over Alternatives |
|------------|---------|---------|------------------------------|
| **React.js** | 18.x | UI library; component model for the whole SPA | Largest ecosystem, mature hooks model, team familiarity. Chosen over Vue/Svelte for hiring pool and library depth. |
| **Vite** | 5.x | Build tool & dev server | Instant HMR via native ESM, near-zero config, fast production builds with Rollup. Chosen over CRA (deprecated, slow webpack) and Next.js (we need a pure SPA, not SSR). |
| **Tailwind CSS** | 3.x | Utility-first styling | Consistent design tokens, no CSS-file sprawl, fast iteration. Chosen over CSS Modules/styled-components for speed and consistency. |
| **shadcn/ui** | latest | Accessible component primitives (copy-in) | Unstyled-but-accessible components you own in-repo (Radix-based); no version lock-in of a heavy UI lib. Chosen over MUI/Ant (heavier, harder to theme to brand). |
| **Redux Toolkit** | 2.x | Global client state management | Opinionated, less boilerplate than classic Redux, predictable store, great devtools. Chosen over Zustand/Context for structured, scalable state and middleware (RTK Query). |
| **RTK Query** | (in RTK 2.x) | Server-state: data fetching, caching, invalidation | Auto-caching, request dedup, cache invalidation tags — removes hand-rolled fetch logic. Chosen over React Query to stay in one Redux ecosystem; over raw Axios thunks for caching. |
| **React Router** | 6.x | Client-side routing | De-facto SPA router; nested routes, loaders, data APIs. Chosen over TanStack Router for maturity/stability at project start. |
| **React Hook Form** | 7.x | Form state & performance | Uncontrolled inputs = minimal re-renders, simple API, great with resolvers. Chosen over Formik (more re-renders, heavier). |
| **Zod** | 3.x | Schema validation (shared FE/BE) | Type-inferred schemas, single source of truth reused on the server. Chosen over Yup for first-class TypeScript inference. |
| **Axios** | 1.x | HTTP client (under RTK Query base) | Interceptors for auth/refresh, request cancellation, consistent error shape. Chosen over fetch for interceptors and ergonomics. |
| **Socket.IO-client** | 4.x | Realtime transport | Matches server Socket.IO; auto-reconnect, rooms, fallbacks. Chosen over raw WebSocket for reconnection/room features. |
| **Recharts** | 2.x | Charts for analytics/dashboards | Declarative React charts, composable, good defaults. Chosen over Chart.js (imperative) and D3 (too low-level for app charts). |
| **@dnd-kit/core** | 6.x | Drag-and-drop (task boards) | Lightweight, accessible, performant DnD with keyboard support. Chosen over react-beautiful-dnd (unmaintained). |
| **react-window** | 1.x | List/grid virtualization | Renders only visible rows for large task/client lists. Chosen over react-virtualized (heavier) for a lean footprint. |

**Supporting FE libs:** `date-fns` (date utils), `clsx` + `tailwind-merge` (class composition), `lucide-react` (icons), `@reduxjs/toolkit` query hooks.

---

## 2. Backend Stack

| Technology | Version | Purpose | Why Chosen Over Alternatives |
|------------|---------|---------|------------------------------|
| **Node.js** | 20.x LTS | JavaScript runtime | LTS stability, same language as FE, huge ecosystem, great async I/O for an API. Chosen over Deno/Bun for ecosystem maturity at project start. |
| **Express.js** | 4.x | HTTP server & routing | Minimal, battle-tested, vast middleware ecosystem. Chosen over NestJS (more opinion/overhead than needed) and Fastify (smaller middleware ecosystem). |
| **Mongoose** | 8.x | MongoDB ODM | Schema modeling, validation, hooks, populate, indexes from code. Chosen over native driver for schema discipline and relationships. |
| **JWT (RS256)** | jsonwebtoken 9.x | Stateless auth tokens | Asymmetric signing: private key signs, public key verifies — services verify without the secret. Chosen over HS256 (shared secret) for key separation & rotation. |
| **bcrypt** | 5.x (rounds=12) | Password hashing | Adaptive cost, salted, industry standard. Rounds=12 balances security vs. login latency. Chosen over plain crypto/SHA (fast = unsafe for passwords); argon2 viable but bcrypt is simpler to deploy. |
| **Socket.IO** | 4.x | Realtime server (chat, presence) | Rooms, auto-reconnect, Redis adapter for horizontal scale. Chosen over ws for built-in rooms/scaling. |
| **BullMQ** | 5.x | Job/queue system (Redis-backed) | Reliable async jobs: emails, PDFs, AI calls, notifications, with retries/backoff. Chosen over Agenda (Mongo-based, less throughput) and bee-queue (fewer features). |
| **Redis** | 7.x | Cache, queues, OTP, socket adapter, rate-limit store | Fast in-memory store powering BullMQ, OTP TTLs, presence, and rate limiting. Chosen over Memcached for richer data types & pub/sub. |
| **Winston** | 3.x | Structured application logging | Levels, transports (console/file/HTTP), JSON logs for aggregation. Chosen over console (no levels/transports) and pino (Winston transport flexibility preferred here). |
| **Morgan** | 1.x | HTTP request logging | Concise access logs piped into Winston. Chosen as the standard Express request logger. |
| **Helmet** | 7.x | Secure HTTP headers | Sets CSP, HSTS, X-Frame-Options, etc. by default. Chosen as the standard hardening middleware. |
| **express-rate-limit** | 7.x | Rate limiting (Redis store) | Throttles auth and sensitive endpoints to stop brute-force/abuse. Chosen for simplicity + Redis store for multi-instance. |
| **Zod** | 3.x | Request validation (shared with FE) | Same schemas as the frontend → no drift. Chosen over Joi for shared TS inference. |
| **Multer** | 1.x | Multipart/form-data parsing | Handles file upload streams before Cloudinary. Chosen as the standard Express upload middleware. |
| **Nodemailer** | 6.x | Transactional email | Sends verification, reset, invoice, and notification emails via SMTP. Chosen for provider-agnostic SMTP support. |
| **node-cron** | 3.x | Scheduled jobs | Runs periodic tasks: overdue-invoice checks, reminders, digests. Chosen for simple in-process cron; heavier scheduling offloaded to BullMQ repeatable jobs. |
| **Puppeteer** | 22.x | HTML→PDF rendering (invoices/reports) | Pixel-accurate PDF from styled HTML templates. Chosen over pdfkit (manual layout) for fidelity and reuse of HTML/CSS. |
| **ExcelJS** | 4.x | Excel export (analytics/reports) | Rich .xlsx generation with styles/formulas. Chosen over csv-stringify for formatted, multi-sheet reports. |

**Supporting BE libs:** `cookie-parser` (httpOnly cookie auth), `cors`, `compression`, `dotenv`, `cloudinary` SDK, `ioredis`.

---

## 3. Database & Storage

### 3.1 MongoDB Atlas (M10+)
- **Tier:** M10 or higher (dedicated cluster) for production — provides dedicated RAM/CPU, automated backups, and performance advisor (the shared M0/M2/M5 tiers lack backups and are not production-grade).
- **Topology:** 3-node replica set (Atlas default) for high availability and automatic failover.
- **Configuration decisions:**
  - Separate clusters/databases per environment (dev / staging / production) — never share data.
  - Network access locked to backend egress IPs (Render) + Atlas private endpoints where available.
  - Database user per service with least-privilege roles; credentials in environment secrets.
  - Read/write concern: `majority` for critical writes (invoices, payments) to ensure durability.

### 3.2 Indexing Strategy
- Every foreign-key reference field is indexed (`clientId`, `projectId`, `assigneeId`, `userId`).
- Compound indexes for common queries, e.g. `{ projectId: 1, status: 1 }` on tasks, `{ clientId: 1, status: 1 }` on invoices.
- Text indexes on searchable fields (client name, project name, lead name).
- Unique indexes where required: `users.email`, `invoices.number`.
- TTL behavior for ephemeral data handled in **Redis** (OTP/refresh), not Mongo.
- Indexes are declared in Mongoose schemas and verified against Atlas Performance Advisor; no unused indexes in production.

### 3.3 Redis
- **Roles:** BullMQ backing store, OTP storage (TTL), refresh-token/session denylist, Socket.IO adapter (pub/sub), rate-limit counters, hot dashboard caches.
- **Persistence:** AOF enabled for queue durability; separate logical DBs (or instances) per environment.
- **Eviction:** `volatile-ttl` for cache keys; queue keys are not evicted.

### 3.4 Cloudinary (File Storage)
- **Roles:** Stores all uploaded files/media (client docs, project assets, task attachments, invoice PDFs).
- **Configuration decisions:**
  - **Signed uploads only** — the server issues a short-lived signature; the browser uploads directly, so files never bottleneck the API and unsigned uploads are rejected.
  - Folder convention by entity: `crm/<env>/clients/<id>/`, `.../projects/<id>/`, `.../tasks/<id>/`, `.../invoices/<id>/`.
  - Allowed formats and max size enforced both client-side and in the signature/upload preset.
  - Access type `authenticated` for sensitive docs; delivery via signed URLs with expiry.

### 3.5 Backup Plan
- **MongoDB Atlas:** Continuous/automated cloud backups enabled (M10+), with point-in-time recovery; retention ≥ 7 days for production. A quarterly **restore drill** validates recoverability.
- **Redis:** Treated as rebuildable except for in-flight queue jobs (AOF persistence covers crash recovery); no long-term data of record lives only in Redis.
- **Cloudinary:** Source files retained; an export/manifest job lists asset IDs per entity so files can be re-associated if Mongo is restored to a point in time.
- **Config/secrets:** Stored in the platform secret managers (Vercel/Render/Atlas), documented in a runbook, never in source control.

---

## 4. DevOps & Infrastructure

### 4.1 Source Control — GitHub (Git Flow)
- **Branching model (Git Flow):**
  - `main` — production, protected, deploy-only via release.
  - `dev` — integration branch, protected.
  - `feature/*` — new work, branched from `dev`.
  - `fix/*` — non-urgent bug fixes from `dev`.
  - `release/*` — stabilization before production.
  - `hotfix/*` — urgent production fixes branched from `main`, merged back to `main` + `dev`.
- Branch protection: no direct commits to `main`/`dev`; PR + review + green CI required (see Dev Standards doc).

### 4.2 Frontend Hosting — Vercel
- Auto-deploy previews per PR, production deploy on `main`.
- Environment variables per environment; edge CDN for static assets.

### 4.3 Backend Hosting — Render
- Web service for the Express API; background worker service for BullMQ consumers.
- Auto-deploy on `main` (production) and `dev` (staging); health checks gate rollout.
- Managed Redis (Render) or external managed Redis for queues/cache.

### 4.4 Database — MongoDB Atlas
- Separate cluster/database per environment; see §3.

### 4.5 DNS, SSL & Edge — Cloudflare
- DNS management, automatic SSL/TLS, proxy/CDN, and WAF/rate-rules in front of the apps.
- Enforces HTTPS, adds DDoS protection, and provides analytics at the edge.

### 4.6 Environment Strategy (dev / staging / production)

| Concern | Development | Staging | Production |
|---------|-------------|---------|------------|
| Purpose | Local feature work | Pre-release verification, QA sign-off | Live customer use |
| Branch | `feature/*` → `dev` | `dev` / `release/*` | `main` |
| Frontend | Local Vite / Vercel preview | Vercel staging URL | Vercel production domain |
| Backend | Local Node | Render staging service | Render production service |
| Database | Local Mongo or dev Atlas DB | Staging Atlas cluster | Production Atlas cluster (M10+) |
| Redis | Local/dev instance | Staging instance | Production instance |
| Secrets | `.env.local` (gitignored) | Render/Vercel staging secrets | Render/Vercel production secrets |
| Data | Synthetic/seed data | Anonymized/representative | Real data, backed up |

CI (GitHub Actions): lint + type-check + tests on every PR; build artifacts on merge; deploy hooks to Vercel/Render per environment.

---

## 5. Security Decisions

Each decision below is deliberate and enforced in code/config.

- **Why RS256 JWT (not HS256):** Asymmetric keys separate signing from verification. The private key signs tokens in one trusted place; any service (or future microservice) verifies with the public key, never holding the secret. This enables key rotation and limits blast radius if a verifier is compromised.
- **Why httpOnly cookies for tokens:** Storing access/refresh tokens in `httpOnly`, `Secure`, `SameSite` cookies keeps them out of reach of JavaScript, neutralizing XSS token theft. CSRF is mitigated with `SameSite=strict/lax` plus CSRF tokens on state-changing requests.
- **Why Redis for OTP (and refresh denylist):** OTPs are short-lived and high-churn; Redis gives native TTL expiry (auto-cleanup), atomic check-and-delete, and rate-limit counters — far better than writing/expiring rows in Mongo. The same store backs token revocation/denylists.
- **Why signed Cloudinary uploads:** A server-issued, short-lived signature authorizes each upload. The browser uploads directly to Cloudinary (no API bottleneck), and unsigned/over-limit/wrong-type uploads are rejected. Sensitive assets use `authenticated` delivery with expiring signed URLs.
- **Why Zod on both frontend and backend:** A single schema definition validates input in the browser (fast UX feedback) and is re-validated on the server (the real trust boundary). Sharing schemas eliminates FE/BE drift — the client can never "trust" its way past server validation because the server runs the same checks.
- **Defense in depth (supporting):** bcrypt(12) password hashing, Helmet security headers, `express-rate-limit` on auth/sensitive routes, account lockout on repeated failures, least-privilege DB users, audit logging of sensitive actions, and secrets only in environment managers.

---

## 6. Rejected Alternatives Log

| Decision Area | Chosen | Rejected | Reason |
|---------------|--------|----------|--------|
| FE build tool | **Vite** | Create React App (CRA) | CRA is deprecated and slow (webpack, no native ESM); Vite gives instant HMR and zero-config builds. |
| FE meta-framework | **Vite SPA** | Next.js | We need a pure client SPA behind an API, not SSR/edge rendering; Next adds complexity we don't use. |
| FE framework | **React** | Vue / Svelte | Larger hiring pool, deeper library ecosystem, team familiarity. |
| Styling | **Tailwind + shadcn/ui** | MUI / Ant Design | Heavy, opinionated theming hard to match brand; shadcn gives owned, accessible primitives. |
| State mgmt | **Redux Toolkit + RTK Query** | Zustand / React Query (alone) | One ecosystem for client + server state, middleware, and devtools; less glue code. |
| Forms | **React Hook Form** | Formik | RHF's uncontrolled model means fewer re-renders and better performance. |
| Validation | **Zod** | Yup / Joi | First-class TypeScript inference and shareable schemas across FE/BE. |
| DnD | **@dnd-kit** | react-beautiful-dnd | rbd is effectively unmaintained; dnd-kit is modern, accessible, performant. |
| Backend framework | **Express** | NestJS / Fastify | Nest adds DI/decorator overhead we don't need; Fastify's middleware ecosystem is smaller. Express is minimal and ubiquitous. |
| ODM | **Mongoose** | Native MongoDB driver / Prisma | Need schema validation, hooks, and populate; Prisma's Mongo support is less mature than its SQL story. |
| JWT signing | **RS256** | HS256 | Shared-secret HS256 can't separate sign/verify or rotate keys cleanly. |
| Password hashing | **bcrypt(12)** | SHA-256 / plain crypto / argon2 | Fast hashes are unsafe for passwords; bcrypt is adaptive and simpler to operate than argon2 here. |
| Queue | **BullMQ** | Agenda / bee-queue | Agenda (Mongo) has lower throughput; bee-queue has fewer features. BullMQ offers robust retries/backoff on Redis. |
| Cache/queue store | **Redis** | Memcached | Memcached lacks the data types, persistence, and pub/sub we rely on. |
| Realtime | **Socket.IO** | Raw ws / SSE | Need rooms, reconnection, and a Redis adapter for scale that ws/SSE don't provide out of the box. |
| Logging | **Winston (+ Morgan)** | console / pino | Need levels, transports, and structured JSON; console is unstructured. |
| PDF generation | **Puppeteer** | pdfkit | Reuse styled HTML/CSS for pixel-accurate invoices vs. manual coordinate layout. |
| Charts | **Recharts** | Chart.js / D3 | Declarative React composition; D3 is too low-level, Chart.js is imperative. |
| List perf | **react-window** | react-virtualized | Smaller, leaner API for the virtualization we need. |
| FE host | **Vercel** | Netlify | Comparable, but Vercel's preview deploys + React DX fit the team's workflow. |
| BE host | **Render** | Heroku / bare VPS | Heroku pricing/cold-starts and VPS ops overhead; Render gives managed services + workers simply. |
| DB host | **MongoDB Atlas (M10+)** | Self-hosted Mongo | Self-hosting adds backup/HA/ops burden; Atlas M10+ provides backups, failover, and advisors. |
| Edge/DNS | **Cloudflare** | Raw provider DNS | Cloudflare adds free SSL, CDN, DDoS/WAF, and analytics at the edge. |

---

*End of Technology Stack & Decisions.*
