# Software House CRM — Module Map

> **Document:** 02 — Module Map
> **Project:** Software House CRM
> **Status:** Approved for Phase 1
> **Last Updated:** 2026-06-06

This document breaks the system into its modules, the data each touches, the APIs each depends on, how the modules relate, and how data flows through the most critical user journeys.

---

## 1. Module List

> **Role legend:** SA = Super Admin · AD = Admin · MG = Manager · DEV = Developer · DES = Designer · QA = QA Engineer · CL = Client (read-only portal)

---

### 1.1 Authentication & Authorization

- **Owner role:** Super Admin / Admin
- **Access:** All roles (everyone authenticates; SA/AD manage accounts)
- **Core features:**
  - Admin-invited registration with email verification
  - Login with JWT (RS256) access + refresh tokens, httpOnly cookies
  - OTP-based password reset (Redis-backed, TTL)
  - Session management & revocation (logout, "log out all devices")
  - Rate limiting, brute-force lockout, bcrypt(12) password hashing
  - Role-based access control (RBAC) middleware for every protected route
- **Key collections:** `users`, `sessions`, `roles`, `auditLogs`, (Redis: `otp:*`, `refresh:*`)
- **Depends on APIs:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/verify-email`

---

### 1.2 Dashboard

- **Owner role:** System (per-user composition)
- **Access:** All roles (role-specific views)
- **Core features:**
  - Role-aware widget layout (Manager pipeline vs. Developer tasks vs. Client status)
  - KPI summary cards (revenue, open leads, active projects, overdue invoices)
  - "My day" actionable lists (tasks due, mentions, reminders)
  - Activity feed of recent relevant events
  - Quick actions (new lead, new task, new invoice) gated by permission
- **Key collections:** Read-only aggregations across `leads`, `projects`, `tasks`, `invoices`, `notifications`
- **Depends on APIs:** `GET /api/dashboard/summary`, `GET /api/dashboard/activity`, `GET /api/analytics/*`

---

### 1.3 Clients

- **Owner role:** Manager / Admin
- **Access:** SA, AD, MG (full) · DEV, DES, QA (read, scoped to assigned projects) · CL (own record, portal)
- **Core features:**
  - Client CRUD with company profile and multiple contacts
  - Billing details and default invoice settings
  - Associated projects, invoices, and files in one view
  - Interaction/history timeline
  - Search, filter, sort, and paginated listing
  - File attachments per client
- **Key collections:** `clients`, `contacts`, `projects`, `invoices`, `files`, `activities`
- **Depends on APIs:** `GET/POST /api/clients`, `GET/PATCH/DELETE /api/clients/:id`, `GET /api/clients/:id/projects`, `GET /api/clients/:id/invoices`, `GET /api/clients/:id/files`

---

### 1.4 Leads

- **Owner role:** Manager / Admin
- **Access:** SA, AD, MG (full) · DEV/DES/QA (none) · CL (none)
- **Core features:**
  - Lead CRUD with source, estimated value, and owner
  - Pipeline stages (New → Contacted → Qualified → Proposal → Won/Lost)
  - Follow-up reminders and next-action scheduling
  - Convert won lead → Client (and optional initial Project)
  - Pipeline (Kanban) and list views with value totals
  - Lead activity/notes timeline
- **Key collections:** `leads`, `activities`, `clients` (on conversion), `notifications`
- **Depends on APIs:** `GET/POST /api/leads`, `GET/PATCH/DELETE /api/leads/:id`, `POST /api/leads/:id/convert`, `POST /api/leads/:id/activities`

---

### 1.5 Projects

- **Owner role:** Manager
- **Access:** SA, AD, MG (full) · DEV, DES, QA (read + update on assigned) · CL (read own, portal)
- **Core features:**
  - Project CRUD linked to a client
  - Milestones and phases with target dates
  - Team assignment (members + roles on project)
  - Budget, status, and health tracking
  - Linked tasks, invoices, and files
  - Progress rollup from tasks/milestones
- **Key collections:** `projects`, `milestones`, `tasks`, `invoices`, `files`, `users`
- **Depends on APIs:** `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id`, `GET /api/projects/:id/tasks`, `POST /api/projects/:id/members`, `GET /api/projects/:id/milestones`

---

### 1.6 Tasks

- **Owner role:** Manager (assigns) / Developer-Designer-QA (executes)
- **Access:** SA, AD, MG (full) · DEV, DES, QA (read all on project, update own) · CL (none)
- **Core features:**
  - Task CRUD with title, description, project, milestone link
  - Assignee, status, priority, estimate, due date
  - Board (Kanban) and list views, drag-and-drop status
  - Dependencies / blocking relationships
  - Comments, attachments, and time logs
  - Mentions that trigger notifications
- **Key collections:** `tasks`, `timeLogs`, `comments`, `files`, `notifications`, `users`
- **Depends on APIs:** `GET/POST /api/tasks`, `GET/PATCH/DELETE /api/tasks/:id`, `PATCH /api/tasks/:id/status`, `POST /api/tasks/:id/time-logs`, `POST /api/tasks/:id/comments`

---

### 1.7 Invoices

- **Owner role:** Admin / Manager
- **Access:** SA, AD, MG (full) · DEV/DES/QA (none) · CL (read own, portal)
- **Core features:**
  - Invoice generation from project/contract data
  - Line items, taxes, discounts, totals
  - Status lifecycle (Draft → Sent → Paid → Overdue → Void)
  - PDF export (Puppeteer) and email delivery
  - Payment recording and reconciliation status
  - Overdue detection (node-cron) and reminders
- **Key collections:** `invoices`, `payments`, `clients`, `projects`, `files`, `notifications`
- **Depends on APIs:** `GET/POST /api/invoices`, `GET/PATCH/DELETE /api/invoices/:id`, `POST /api/invoices/:id/send`, `GET /api/invoices/:id/pdf`, `POST /api/invoices/:id/payments`

---

### 1.8 Employees

- **Owner role:** Admin / Super Admin
- **Access:** SA, AD (full) · MG (read + assign) · DEV/DES/QA (read own profile) · CL (none)
- **Core features:**
  - Employee profile CRUD (linked to a user account)
  - Role and skill management
  - Availability and current workload/utilization
  - Assignment overview (projects/tasks per employee)
  - Activation / deactivation of accounts
- **Key collections:** `users`, `employees`, `roles`, `tasks`, `projects`
- **Depends on APIs:** `GET/POST /api/employees`, `GET/PATCH/DELETE /api/employees/:id`, `PATCH /api/employees/:id/role`, `GET /api/employees/:id/workload`

---

### 1.9 Realtime Communication

- **Owner role:** System
- **Access:** SA, AD, MG, DEV, DES, QA (internal channels & DMs) · CL (project channel, read/limited)
- **Core features:**
  - Project channels and task threads
  - Direct messages between users
  - Presence (online/offline) and typing indicators
  - @mentions that create notifications
  - Message history persistence and unread counts
- **Key collections:** `messages`, `channels`, `conversations`, `notifications`, (Redis: socket adapter, presence)
- **Depends on APIs:** Socket.IO events (`message:send`, `message:received`, `typing`, `presence:update`); REST: `GET /api/messages`, `GET /api/channels`

---

### 1.10 AI Features *(later phase)*

- **Owner role:** Admin (config) / All internal (usage)
- **Access:** SA, AD, MG, DEV, DES, QA (feature-gated) · CL (none)
- **Core features:**
  - Draft client emails and proposals
  - Summarize long task/message threads
  - Suggest task breakdown from a project brief
  - Auto-categorize and score leads
  - Generate report narratives for analytics
- **Key collections:** `aiJobs`, `aiUsage`, plus read access to `leads`, `projects`, `tasks`, `messages`
- **Depends on APIs:** `POST /api/ai/draft`, `POST /api/ai/summarize`, `POST /api/ai/suggest-tasks`, `POST /api/ai/categorize-lead` (backed by OpenAI via BullMQ jobs)

---

### 1.11 File Management

- **Owner role:** System (per-entity owners)
- **Access:** All internal roles (scoped to entities they can access) · CL (own project/invoice files)
- **Core features:**
  - Signed direct uploads to Cloudinary
  - Per-entity attachment (client/project/task/invoice)
  - File type and size validation
  - Access control inherited from parent entity
  - Versioning metadata and soft delete
- **Key collections:** `files`, references on `clients`/`projects`/`tasks`/`invoices`
- **Depends on APIs:** `POST /api/files/sign`, `POST /api/files`, `GET /api/files/:id`, `DELETE /api/files/:id`

---

### 1.12 Notifications

- **Owner role:** System
- **Access:** All roles (each receives own notifications)
- **Core features:**
  - Multi-channel delivery: in-app, realtime (Socket.IO), email (Nodemailer)
  - Event triggers (task assigned, mention, invoice overdue, lead reminder)
  - Per-user preferences and channel opt-out
  - Durable store with read/unread state
  - BullMQ-backed async delivery and retries
- **Key collections:** `notifications`, `notificationPreferences`, (Redis/BullMQ queues)
- **Depends on APIs:** `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`, `GET/PATCH /api/notifications/preferences`

---

### 1.13 Analytics

- **Owner role:** Manager / Admin
- **Access:** SA, AD, MG (full) · DEV/DES/QA (personal stats only) · CL (own project metrics)
- **Core features:**
  - Revenue and invoicing trends
  - Pipeline forecast and conversion funnel
  - Resource utilization and capacity
  - Delivery performance (on-time %, cycle time)
  - Exportable reports (ExcelJS / PDF)
- **Key collections:** Aggregations across `invoices`, `leads`, `projects`, `tasks`, `timeLogs`, `users`
- **Depends on APIs:** `GET /api/analytics/revenue`, `GET /api/analytics/pipeline`, `GET /api/analytics/utilization`, `GET /api/analytics/delivery`, `GET /api/analytics/export`

---

### 1.14 Security *(cross-cutting)*

- **Owner role:** Super Admin
- **Access:** Enforced for all; configurable by SA/AD
- **Core features:**
  - RBAC enforcement and permission matrix
  - Input validation (Zod) on every endpoint
  - Rate limiting and security headers (Helmet)
  - Audit logging of sensitive actions
  - Secrets management and data protection
- **Key collections:** `auditLogs`, `roles`, `users` (security fields)
- **Depends on APIs:** Middleware layer across all routes; `GET /api/audit-logs` (SA only), `GET /api/security/sessions`

---

## 2. Module Dependency Map

Arrows mean **"depends on / is built on top of."** Authentication and Security are foundational and underpin everything.

```
                         ┌─────────────────────────┐
                         │   Security (x-cutting)   │  ← enforced on every request
                         └────────────┬────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │     Authentication      │  → [ALL MODULES]
                         └────────────┬────────────┘
                                      │
        ┌───────────────┬────────────┼────────────┬───────────────┐
        ▼               ▼            ▼             ▼               ▼
   ┌─────────┐    ┌──────────┐  ┌─────────┐  ┌───────────┐  ┌──────────┐
   │  Leads  │    │  Clients │  │Employees│  │File Mgmt  │  │ Notif.   │
   └────┬────┘    └────┬─────┘  └────┬────┘  └─────┬─────┘  └────┬─────┘
        │ convert      │             │             │             ▲
        └──────────────►             │             │             │
                       │  Clients    │             │             │
                       ▼             ▼             │             │
                  ┌─────────────────────┐          │             │
                  │      Projects       │◄─────────┘ (attach)    │
                  └──────────┬──────────┘                        │
                             │ has many                          │
                             ▼                                   │
                        ┌─────────┐  assign/mention ─────────────┤
                        │  Tasks  │─────────────────────────────►│
                        └────┬────┘                              │
                             │ billable work                     │
                             ▼                                   │
                        ┌─────────┐  status events ──────────────┘
                        │Invoices │
                        └────┬────┘
                             │
   ┌─────────────────────────┼─────────────────────────┐
   ▼                         ▼                          ▼
┌───────────────┐     ┌─────────────┐          ┌──────────────────┐
│  Analytics    │     │  Dashboard  │          │ Realtime Comm.   │
│ (reads ALL)   │     │ (reads ALL) │          │ (Projects/Tasks) │
└───────────────┘     └─────────────┘          └──────────────────┘
                             ▲
                             │ reads
                      ┌─────────────┐
                      │ AI Features │  (reads Leads/Projects/Tasks/Messages)
                      └─────────────┘
```

**Dependency notes (explicit):**

| Module | Depends On |
|--------|------------|
| Authentication | Security |
| Security | — (foundational) |
| Clients | Authentication, File Management |
| Leads | Authentication, Clients (on conversion), Notifications |
| Projects | Authentication, Clients, Employees, File Management |
| Tasks | Authentication, Projects, Employees, Notifications, File Management |
| Invoices | Authentication, Clients, Projects, File Management, Notifications |
| Employees | Authentication, Roles |
| Realtime Communication | Authentication, Projects, Tasks, Notifications |
| Notifications | Authentication, BullMQ/Redis, Email |
| File Management | Authentication, Cloudinary |
| Dashboard | Reads: Leads, Projects, Tasks, Invoices, Notifications, Analytics |
| Analytics | Reads: Invoices, Leads, Projects, Tasks, TimeLogs, Employees |
| AI Features | Authentication, Reads: Leads, Projects, Tasks, Messages; OpenAI |

---

## 3. Data Flow Summary

### Journey A — Lead → Client → Project → Invoice → Payment

The core revenue lifecycle, owned primarily by Manager/Admin.

```
[Manager creates Lead]
   │  POST /api/leads  → leads collection (stage: New)
   ▼
[Lead progresses through pipeline]
   │  PATCH /api/leads/:id (stage updates) + activities + reminders
   ▼
[Lead is WON → convert]
   │  POST /api/leads/:id/convert
   │     ├─ create clients document (copies profile/contacts)
   │     ├─ link lead → client (traceability)
   │     └─ optional: scaffold initial projects document
   ▼
[Manager creates / completes Project]
   │  POST /api/projects (clientId) → milestones, team, budget
   │     └─ Tasks created under project (delivery work)
   ▼
[Project work completed]
   │  task statuses roll up → project status = Completed
   ▼
[Admin generates Invoice from project]
   │  POST /api/invoices (projectId, clientId) → line items, totals
   │     ├─ Puppeteer renders PDF → stored via File Management
   │     └─ POST /api/invoices/:id/send → Nodemailer + Notification
   ▼
[Client pays; payment recorded]
   │  POST /api/invoices/:id/payments → payments collection
   │     └─ invoice.status = Paid → Analytics revenue updated
   ▼
[Dashboards + Analytics reflect new revenue]
```
**Collections touched:** `leads → clients → projects → milestones → tasks → invoices → payments → files → notifications`, aggregated by `analytics`.

---

### Journey B — Employee → Task Assignment → Progress → Completion

The delivery/accountability loop, owned by Manager (assigns) and DEV/DES/QA (execute).

```
[Manager opens a Project board]
   │  GET /api/projects/:id/tasks
   ▼
[Manager creates & assigns a Task]
   │  POST /api/tasks (projectId, assigneeId, priority, estimate, dueDate)
   │     └─ Notification → assignee (in-app + realtime + email)
   ▼
[Developer/Designer/QA sees task on Dashboard]
   │  GET /api/dashboard/summary → "My tasks due"
   ▼
[Assignee starts work → updates status]
   │  PATCH /api/tasks/:id/status (To Do → In Progress)
   │     ├─ POST /api/tasks/:id/time-logs (time tracking)
   │     └─ comments + @mentions → Notifications + Realtime thread
   ▼
[Task moves through workflow]
   │  In Progress → In Review → (QA) → Done   (drag-and-drop on board)
   ▼
[Task completed]
   │  status = Done → milestone/project progress recalculated
   │     └─ time logs feed Utilization analytics
   ▼
[Manager sees updated progress on Dashboard/Analytics]
```
**Collections touched:** `tasks → timeLogs → comments → files → notifications → projects/milestones`, aggregated by `analytics` (utilization, delivery).

---

### Journey C — New User → Registration → Role Assignment → Dashboard

The onboarding and access-control loop, owned by Super Admin/Admin.

```
[Admin invites a new user]
   │  POST /api/auth/register (email, name, intended role)
   │     ├─ users document created (status: pending, hashed temp/no password)
   │     └─ verification + set-password email (Nodemailer)
   ▼
[User verifies email & sets password]
   │  POST /api/auth/verify-email + reset-password
   │     └─ bcrypt(12) hash stored; status: active
   ▼
[Admin assigns / confirms role]
   │  PATCH /api/employees/:id/role  (e.g., Developer)
   │     └─ roles + permission matrix bind to the user
   ▼
[User logs in]
   │  POST /api/auth/login → JWT (RS256) access + refresh (httpOnly cookies)
   │     └─ Security middleware loads role → permission set
   ▼
[RBAC resolves what the user can see]
   │  Authorization middleware filters routes/modules by role
   ▼
[Role-aware Dashboard renders]
   │  GET /api/dashboard/summary → widgets scoped to role
   │     (Developer → tasks · Manager → pipeline · Client → project status)
```
**Collections touched:** `users → sessions → roles → employees → auditLogs`; Redis for OTP/refresh; Dashboard reads scoped per role.

---

*End of Module Map.*
