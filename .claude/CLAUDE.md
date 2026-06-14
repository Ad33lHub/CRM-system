# Software House CRM — Project Instructions for Claude

> These instructions are loaded into every Claude Code session for this repo.
> They are committed and shared by the whole team. Keep them short and high-signal.

## What this project is

An internal CRM for a software house: manage **clients, leads, projects, tasks,
invoices, employees, realtime communication, files, notifications, analytics**, plus
a read-only **client portal**. Authoritative planning lives in [`/docs`](../docs):

- `docs/01_CRM_Goals.md` — goals, KPIs, non-goals, phase/go-live criteria
- `docs/02_Module_Map.md` — 14 modules, dependencies, data-flow journeys
- `docs/03_User_Roles.md` — 7 roles + per-module CRUD permission matrices
- `docs/04_Tech_Stack.md` — stack decisions + rejected alternatives
- `docs/05_Development_Standards.md` — folder structure, naming, API envelope, Git rules

**Read the relevant doc before working in a module.** These docs are the source of truth;
if code and docs disagree, surface it rather than silently picking one.

## Stack (do not swap without updating `docs/04_Tech_Stack.md`)

- **Client:** React 18 + Vite, Tailwind + shadcn/ui, Redux Toolkit + RTK Query,
  React Router v6, React Hook Form + Zod, Axios, Socket.IO-client, Recharts, @dnd-kit, react-window
- **Server:** Node 20 + Express, Mongoose, JWT (RS256), bcrypt(12), Socket.IO,
  BullMQ + Redis, Winston/Morgan, Helmet, express-rate-limit, Zod, Multer, Nodemailer,
  node-cron, Puppeteer, ExcelJS
- **Data/infra:** MongoDB Atlas (M10+), Redis, Cloudinary, Vercel (FE), Render (BE), Cloudflare

## Repo layout

- `client/` — React + Vite SPA (`src/features/<module>/…`)
- `server/` — Express API (`src/modules/<module>/…`, `middleware/`, `jobs/`, `sockets/`)
- `docs/` — planning & architecture
- `.claude/` — this config (settings, rules, agents, skills, MCP)

## Hard rules (enforced in review/CI)

1. **Every API response uses the standard envelope** (`success`/`error`/paginated/validation) —
   never `res.json(rawData)`. See `docs/05_Development_Standards.md` §4.
2. **Validate input with Zod** at the boundary on the server; reuse the same schema shape on the client.
3. **No `console.log` in server code** — use the Winston logger.
4. **No secrets in source.** `.env*` files are gitignored and read-deny'd for Claude. Use `config/env.js`.
5. **Async controllers wrapped in `asyncHandler`**; services throw `AppError` with a status code.
6. **RBAC on every protected route** — enforce the permission matrix from `docs/03_User_Roles.md`.
7. **No hardcoded reused strings** — roles, statuses, messages, route paths live in `constants/`.
8. **No direct commits to `main`/`dev`** — branch `feature/*`, `fix/*`, `hotfix/*`, `release/*`; PR + 1 review + green CI.

## Conventions (quick reference)

- Component files **kebab-case** (`login-form.jsx`), components exported **PascalCase**.
- Variables/functions **camelCase**, constants **UPPER_SNAKE_CASE**, DB fields **camelCase**.
- API routes **kebab-case plural** (`/api/clients`, `/api/time-logs`).
- Commits follow **Conventional Commits** (`feat(leads): …`, `fix(invoices): …`).

## Working agreement

- Match the style of surrounding code. Don't introduce new libraries without checking `docs/04`.
- Prefer the project's existing helpers (`apiResponse`, `asyncHandler`, `AppError`, `validate`) over re-rolling.
- When a change spans modules, check the dependency map in `docs/02` first.
- Run `npm run lint` and the test suite before declaring work done.

## Modular rules (imported)

@rules/code-style.md
@rules/frontend/react.md
