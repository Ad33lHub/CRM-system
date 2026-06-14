# Software House CRM — Goals & Vision

> **Document:** 01 — CRM Goals
> **Project:** Software House CRM
> **Status:** Approved for Phase 1
> **Last Updated:** 2026-06-06

---

## 1. Business Goals

The Software House CRM is an internal operating system for a software services company. It replaces scattered spreadsheets, email threads, WhatsApp groups, and disconnected tools with a single source of truth covering the full client lifecycle: from first lead contact through delivery, invoicing, and payment.

### 1.1 Problems This CRM Solves

| # | Problem (Current Pain) | How the CRM Solves It |
|---|------------------------|------------------------|
| 1 | Leads tracked in spreadsheets; follow-ups missed; no pipeline visibility | Structured lead pipeline with stages, owners, reminders, and conversion tracking |
| 2 | Client data fragmented across email/Drive/chat | Central client records with contacts, projects, files, and history in one place |
| 3 | No clear link between sold work and delivered work | Projects tied to clients and contracts, with milestones and task boards |
| 4 | Task assignment is informal; accountability is unclear | Role-based task assignment with status, priority, estimates, and time tracking |
| 5 | Invoicing is manual and error-prone; payments not reconciled | Generated invoices from project data, with status tracking and PDF export |
| 6 | No real-time team communication tied to work context | In-app realtime chat, mentions, and notifications scoped to projects/tasks |
| 7 | Management has no live view of company health | Dashboards and analytics for revenue, pipeline, utilization, and delivery |
| 8 | Client communication is reactive and opaque | Read-only client portal showing project status, invoices, and shared files |
| 9 | Access control is all-or-nothing | Granular role-based permissions across every module |
| 10 | Files are scattered and unversioned | Centralized file management via Cloudinary with per-entity attachment |

### 1.2 Success Metrics (Measurable KPIs)

| Business Goal | KPI | Target (12 months post-launch) |
|---------------|-----|--------------------------------|
| Improve lead conversion | Lead → Client conversion rate | +20% vs. pre-CRM baseline |
| Reduce follow-up leakage | % of leads with an on-time next action | ≥ 90% |
| Faster invoicing | Avg. days from project completion → invoice sent | ≤ 2 business days |
| Improve cash collection | Avg. days sales outstanding (DSO) | ≤ 30 days |
| Increase delivery predictability | % of tasks completed by due date | ≥ 85% |
| Improve resource utilization | Avg. billable utilization per developer | 70–80% (healthy band) |
| Reduce tool sprawl | # of external tools replaced | ≥ 5 (spreadsheets, chat, file links, manual invoices, time logs) |
| Management visibility | Time to produce a monthly business report | From days → < 5 minutes (auto dashboard) |
| Client satisfaction | Portal monthly active client logins | ≥ 60% of active clients |
| System adoption | Weekly active internal users | ≥ 95% of staff |

---

## 2. Module Goals

Each module below has a single, well-bounded purpose. The CRM is built as a set of cooperating modules so each can evolve independently.

### Authentication
Provides secure identity and session management for all users. It handles registration (admin-invited), login, JWT issuance with refresh tokens, password reset via OTP, email verification, and session revocation. Its goal is to guarantee that every request is authenticated, every token is verifiable, and every account is protected by modern credential hygiene (bcrypt hashing, rate limiting, lockout). It is the gate every other module trusts.

### Dashboard
Delivers a personalized, role-aware landing surface that summarizes what each user needs to act on right now. Its goal is to reduce "where do I start" friction: a Manager sees pipeline and delivery health, a Developer sees today's tasks, a Client sees project status. It aggregates read-only widgets from every other module and is optimized for fast, glanceable insight rather than data entry.

### Clients
Maintains the authoritative record of every client organization: company profile, contacts, billing details, associated projects, invoices, files, and interaction history. Its goal is to make any client fully understandable from one screen, eliminating the need to assemble context from email and chat. It is the anchor that Projects, Invoices, and the Client Portal all reference.

### Leads
Manages the pre-client sales pipeline: prospects, their stage, estimated value, source, owner, and follow-up cadence. Its goal is to ensure no opportunity is dropped and that the team can forecast revenue. When a lead is won, it converts into a Client (and optionally an initial Project) with full traceability, closing the loop between sales and delivery.

### Projects
Represents engagements the software house delivers: scope, timeline, milestones, team, budget, and status. Its goal is to connect what was sold (Leads/Clients) to what is being built (Tasks) and what gets billed (Invoices). It provides the structure — milestones and phases — against which work and money are measured.

### Tasks
Breaks projects into assignable, trackable units of work with status, priority, assignee, estimates, due dates, dependencies, and time logs. Its goal is operational accountability: everyone knows what they own, managers see progress, and delivery risk surfaces early. It supports board (Kanban) and list views and feeds utilization analytics.

### Invoices
Generates, tracks, and exports invoices derived from projects and agreed pricing. Its goal is accurate, fast, auditable billing: line items, taxes, due dates, payment status, and PDF generation. It is the financial bridge between delivery and revenue, and it surfaces overdue items for collection.

### Employees
Manages the internal team: profiles, roles, skills, availability, and assignment load. Its goal is to give managers a clear picture of who is on the team, what they can do, and how loaded they are — enabling smart task allocation and utilization tracking. It underpins permissions (via roles) and resourcing decisions.

### Realtime Communication
Provides in-app, context-aware messaging and presence using Socket.IO. Its goal is to keep work conversations attached to the work itself — project channels, task threads, direct messages, mentions, and typing/online indicators — reducing reliance on external chat tools and keeping a searchable record.

### AI Features
Adds intelligent assistance powered by OpenAI: draft client emails, summarize long threads, suggest task breakdowns from a project brief, auto-categorize leads, and generate report narratives. Its goal is to remove repetitive cognitive work and accelerate high-value actions, while keeping a human in the loop for anything client-facing or financial. (Delivered in a later phase.)

### File Management
Centralizes upload, storage, and retrieval of documents and media via Cloudinary, attached to the right entity (client, project, task, invoice). Its goal is that every relevant file lives next to the record it belongs to, with signed uploads, type/size validation, and access control — eliminating lost links and unmanaged drives.

### Notifications
Delivers timely, relevant alerts across in-app, realtime, and email channels (task assigned, mention, invoice overdue, lead reminder). Its goal is to keep users informed without overwhelming them: batched, deduplicated, preference-aware notifications backed by a durable store and a BullMQ-powered delivery queue.

### Analytics
Transforms operational data into decision-ready insight: revenue trends, pipeline forecasts, utilization, delivery performance, and client health. Its goal is to give leadership and managers self-serve, always-current metrics and charts, replacing manual monthly reporting with live dashboards and exportable reports.

### Security
A cross-cutting concern (not a single screen) ensuring the platform is safe: RBAC enforcement, input validation, rate limiting, secure headers, audit logging, secrets management, and data protection. Its goal is to make security the default — every endpoint authorized, every input validated, every sensitive action logged.

---

## 3. Non-Goals (Explicit Out-of-Scope for v1)

The following are deliberately **not** part of version 1. Naming them prevents scope creep and sets expectations.

1. **Public-facing marketing website / lead capture forms** — leads are entered or imported by staff, not captured from a public site.
2. **Native mobile apps (iOS/Android)** — v1 is responsive web only.
3. **Full double-entry accounting / general ledger** — invoices and payment status only; no bookkeeping, journals, or tax filing.
4. **Online payment gateway / card processing** — invoices are generated and tracked; actual payment collection is recorded manually.
5. **HR/Payroll** — Employees module is for resourcing and permissions, not salaries, leave management, or payroll runs.
6. **Multi-tenancy / white-label SaaS** — v1 is a single-organization internal tool, not a product sold to other companies.
7. **Advanced project management (Gantt critical-path scheduling, resource leveling)** — v1 offers tasks, milestones, and boards, not full PM scheduling.
8. **Offline mode / PWA sync** — the app assumes connectivity.
9. **Customer support ticketing / helpdesk** — not a support desk; the client portal is read-only status, not a ticket system.
10. **Internationalization (multi-language UI) and multi-currency accounting** — v1 ships in English with a single base currency.
11. **Third-party CRM integrations (Salesforce/HubSpot sync, Zapier)** — no external integration surface in v1.
12. **Time-tracking timers as a billing system of record** — time logs inform utilization; they are not a legal billing ledger in v1.

---

## 4. Success Criteria

### 4.1 Phase Completion Criteria (Phases 1–18)

The project is delivered in 18 phases. Each phase is "done" only when its acceptance criteria below are met, tests pass, and the build deploys cleanly.

| Phase | Theme | Done When |
|-------|-------|-----------|
| 1 | Planning & Architecture | All 5 planning docs complete; tech stack and standards approved |
| 2 | Project Scaffolding | Client + server bootstrapped; lint/format/CI configured; "hello" deploy works on Vercel + Render |
| 3 | Database Design | All Mongoose schemas, indexes, and relationships defined and seeded |
| 4 | Authentication | Register/login/refresh/logout/reset all working with JWT (RS256) + httpOnly cookies; rate limiting active |
| 5 | RBAC & Authorization | Role/permission middleware enforced on every protected route; verified by tests |
| 6 | Clients Module | Full CRUD, contacts, files, history; list with search/filter/pagination |
| 7 | Leads Module | Pipeline stages, conversion to client, reminders; pipeline view |
| 8 | Projects Module | CRUD, milestones, team assignment, client linkage, status tracking |
| 9 | Tasks Module | Board + list views, assignment, status, priority, dependencies, time logs |
| 10 | Invoices Module | Generation from project data, line items, PDF export, status tracking |
| 11 | Employees Module | Profiles, roles, skills, load/utilization view |
| 12 | File Management | Signed Cloudinary uploads, per-entity attachment, validation, access control |
| 13 | Realtime Communication | Socket.IO channels, DMs, presence, typing, mentions |
| 14 | Notifications | In-app + email + realtime; BullMQ queue; preferences; durable store |
| 15 | Analytics & Dashboards | Role-aware dashboards; revenue/pipeline/utilization/delivery charts; report export |
| 16 | AI Features | OpenAI-backed drafting, summarization, task suggestions with human-in-loop |
| 17 | Hardening & QA | Security review passed; load tested; >80% critical-path test coverage; a11y pass |
| 18 | Production Go-Live | Staging sign-off; runbooks, backups, monitoring; DNS/SSL via Cloudflare live |

### 4.2 Acceptance Criteria for Production Go-Live

Go-live is approved only when **all** of the following are true:

**Functional**
- [ ] All 14 modules pass their acceptance tests in staging.
- [ ] Every user role can complete its primary journey end-to-end (see Module Map, §3 journeys).
- [ ] Critical journeys (Lead→Client→Project→Invoice, Task lifecycle, User onboarding) pass automated E2E tests.

**Quality**
- [ ] Automated test coverage ≥ 80% on critical paths; CI green on `main`.
- [ ] No open `critical` or `high` severity bugs.
- [ ] Lighthouse: Performance ≥ 85, Accessibility ≥ 90 on key pages.

**Security**
- [ ] Security review (see `/security-review`) passed with no unresolved high/critical findings.
- [ ] RBAC verified: no role can access a route outside its permission matrix.
- [ ] Secrets are in environment config, never in source; httpOnly cookies and secure headers confirmed.
- [ ] Rate limiting and account lockout verified on auth endpoints.

**Operational**
- [ ] MongoDB Atlas automated backups enabled and a restore test performed.
- [ ] Error monitoring and structured logging (Winston) shipping to a sink.
- [ ] Health-check endpoints green; uptime monitoring configured.
- [ ] Rollback procedure documented and tested.
- [ ] Environment matrix (dev / staging / production) fully separated with distinct credentials.

**Sign-off**
- [ ] Product owner sign-off on staging.
- [ ] Engineering lead sign-off on quality gates.
- [ ] At least one full pilot week with internal users and no blocking issues.

When every box is checked, Phase 18 is complete and the system is cleared for production.
