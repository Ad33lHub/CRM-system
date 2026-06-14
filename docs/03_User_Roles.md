# Software House CRM — User Roles & Permissions

> **Document:** 03 — User Roles
> **Project:** Software House CRM
> **Status:** Approved for Phase 1
> **Last Updated:** 2026-06-06

This document is the authoritative specification for roles, their CRUD permissions per module, their explicit restrictions, and their default dashboard. The backend RBAC middleware (Phase 5) is implemented directly from these tables.

**Modules referenced:** Authentication, Dashboard, Clients, Leads, Projects, Tasks, Invoices, Employees, Realtime Communication, AI Features, File Management, Notifications, Analytics, Security.

**CRUD legend:** ✅ Full · 🔸 Scoped (only records the user owns/is assigned to) · 👁 Read-only · ❌ None

---

## 1. Super Admin

### Description
The highest-privilege account, typically held by a company founder/CTO or lead engineer. The Super Admin owns the platform itself: manages all other accounts and roles, configures system-wide security, views audit logs, and can access every module without restriction. There is at least one and usually only one or two Super Admins.

### Permissions

| Module | Create | Read | Update | Delete | Special Permissions |
|--------|:------:|:----:|:------:|:------:|---------------------|
| Authentication | ✅ | ✅ | ✅ | ✅ | Create/disable any account, force logout, reset any password |
| Dashboard | ✅ | ✅ | ✅ | ✅ | View any user's dashboard; configure global widgets |
| Clients | ✅ | ✅ | ✅ | ✅ | Reassign client owners |
| Leads | ✅ | ✅ | ✅ | ✅ | Reassign lead owners; override stage |
| Projects | ✅ | ✅ | ✅ | ✅ | Archive/restore any project |
| Tasks | ✅ | ✅ | ✅ | ✅ | Reassign any task |
| Invoices | ✅ | ✅ | ✅ | ✅ | Void invoices; edit posted invoices |
| Employees | ✅ | ✅ | ✅ | ✅ | Assign any role incl. Admin |
| Realtime Comm. | ✅ | ✅ | ✅ | ✅ | Moderate/delete any message; access any channel |
| AI Features | ✅ | ✅ | ✅ | ✅ | Configure AI provider, prompts, and limits |
| File Management | ✅ | ✅ | ✅ | ✅ | Delete any file regardless of owner |
| Notifications | ✅ | ✅ | ✅ | ✅ | Send system-wide broadcasts |
| Analytics | ✅ | ✅ | ✅ | ✅ | Access all reports and raw exports |
| Security | ✅ | ✅ | ✅ | ✅ | Manage roles/permissions, view audit logs, manage sessions |

### Restrictions
- Cannot delete the last remaining Super Admin account (system enforces ≥1).
- Sensitive actions (role changes, invoice voids, account deletions) are always written to the audit log and cannot be silently bypassed.

### Default Dashboard
**System Overview** — platform health, user activity, security/audit highlights, plus company-wide KPIs (revenue, pipeline, utilization, delivery).

---

## 2. Admin

### Description
Operational administrator (e.g., Operations Manager / COO). Runs day-to-day company operations: manages clients, leads, projects, invoices, and employees, and assigns work. Has nearly full access but is below Super Admin: cannot manage security configuration, roles at the Super Admin level, or audit logs.

### Permissions

| Module | Create | Read | Update | Delete | Special Permissions |
|--------|:------:|:----:|:------:|:------:|---------------------|
| Authentication | ✅ | ✅ | ✅ | 🔸 | Invite users, reset passwords (non-SA accounts) |
| Dashboard | ✅ | ✅ | ✅ | 🔸 | Configure team dashboards |
| Clients | ✅ | ✅ | ✅ | ✅ | Reassign client owners |
| Leads | ✅ | ✅ | ✅ | ✅ | Reassign leads; convert leads |
| Projects | ✅ | ✅ | ✅ | ✅ | Manage all projects and teams |
| Tasks | ✅ | ✅ | ✅ | ✅ | Assign/reassign any task |
| Invoices | ✅ | ✅ | ✅ | 🔸 | Send invoices, record payments, void (with audit) |
| Employees | ✅ | ✅ | ✅ | 🔸 | Assign roles up to Manager; deactivate accounts |
| Realtime Comm. | ✅ | ✅ | ✅ | 🔸 | Moderate team channels |
| AI Features | ✅ | ✅ | ✅ | ❌ | Use all AI features; manage usage limits |
| File Management | ✅ | ✅ | ✅ | ✅ | Manage files across entities |
| Notifications | ✅ | ✅ | ✅ | 🔸 | Send team announcements |
| Analytics | 👁 | ✅ | ❌ | ❌ | View and export all reports |
| Security | ❌ | 👁 | ❌ | ❌ | View own sessions only; no role/permission editing |

### Restrictions
- Cannot create, edit, or delete Super Admin accounts.
- Cannot assign the Super Admin role.
- Cannot edit security policy, RBAC permission matrix, or view full audit logs.
- Cannot configure the AI provider/keys (usage only).

### Default Dashboard
**Operations Overview** — pipeline, active projects, overdue invoices, team workload, and recent activity across the company.

---

## 3. Manager

### Description
Project/delivery manager and account owner. Owns clients, leads, projects, and the teams delivering them. Creates and assigns tasks, tracks delivery, generates/sends invoices, and monitors team utilization. Cannot manage company-wide accounts or security.

### Permissions

| Module | Create | Read | Update | Delete | Special Permissions |
|--------|:------:|:----:|:------:|:------:|---------------------|
| Authentication | ❌ | ✅ | 🔸 | ❌ | Manage own profile/sessions only |
| Dashboard | ❌ | ✅ | 🔸 | ❌ | Configure own dashboard |
| Clients | ✅ | ✅ | ✅ | 🔸 | Manage clients they own |
| Leads | ✅ | ✅ | ✅ | 🔸 | Manage/convert leads they own |
| Projects | ✅ | ✅ | ✅ | 🔸 | Manage projects they own; assign team |
| Tasks | ✅ | ✅ | ✅ | ✅ | Create/assign/reassign tasks within their projects |
| Invoices | ✅ | ✅ | ✅ | ❌ | Generate & send invoices for their projects; record payments |
| Employees | ❌ | ✅ | 🔸 | ❌ | View team & workload; assign to projects/tasks |
| Realtime Comm. | ✅ | ✅ | 🔸 | 🔸 | Manage their project channels |
| AI Features | ✅ | ✅ | 🔸 | ❌ | Use drafting/summarize/task-suggestion features |
| File Management | ✅ | ✅ | 🔸 | 🔸 | Manage files on their projects/clients |
| Notifications | ✅ | ✅ | 🔸 | ❌ | Notify their team |
| Analytics | 👁 | ✅ | ❌ | ❌ | View team & project analytics (not full company finance) |
| Security | ❌ | ❌ | ❌ | ❌ | No access |

### Restrictions
- Scoped to clients/leads/projects they own or are members of — cannot edit other managers' accounts unless explicitly shared.
- Cannot manage user accounts, roles, or platform security.
- Cannot void posted invoices (must request Admin/Super Admin).
- Cannot delete clients/leads/projects that have posted invoices or payment history.

### Default Dashboard
**Manager Workspace** — owned pipeline, active projects with health, tasks at risk, team utilization, and pending invoices.

---

## 4. Developer

### Description
Software engineer who executes delivery work. Sees the projects they are assigned to, works the tasks they own, logs time, communicates with the team, and attaches deliverables. Has no access to sales, finance, or account administration.

### Permissions

| Module | Create | Read | Update | Delete | Special Permissions |
|--------|:------:|:----:|:------:|:------:|---------------------|
| Authentication | ❌ | ✅ | 🔸 | ❌ | Manage own profile/sessions |
| Dashboard | ❌ | ✅ | 🔸 | ❌ | Personal dashboard |
| Clients | ❌ | 🔸 | ❌ | ❌ | Read clients of assigned projects only |
| Leads | ❌ | ❌ | ❌ | ❌ | No access |
| Projects | ❌ | 🔸 | 🔸 | ❌ | Read assigned projects; update progress notes |
| Tasks | 🔸 | ✅ | 🔸 | ❌ | Create subtasks; update status/time on own tasks |
| Invoices | ❌ | ❌ | ❌ | ❌ | No access |
| Employees | ❌ | 🔸 | 🔸 | ❌ | View team directory; edit own profile |
| Realtime Comm. | ✅ | ✅ | 🔸 | 🔸 | Participate in their project channels/DMs |
| AI Features | ✅ | ✅ | 🔸 | ❌ | Use summarize/task-suggestion (no client emails) |
| File Management | 🔸 | 🔸 | 🔸 | 🔸 | Attach/manage files on their tasks |
| Notifications | ❌ | ✅ | 🔸 | ❌ | Receive & manage own notifications |
| Analytics | ❌ | 🔸 | ❌ | ❌ | View own utilization/stats only |
| Security | ❌ | ❌ | ❌ | ❌ | No access |

### Restrictions
- No access to Leads, Invoices, finance, or company-wide analytics.
- Cannot see clients/projects they are not assigned to.
- Cannot reassign tasks to others or change tasks outside their assignment.
- Cannot manage any user accounts or roles.

### Default Dashboard
**My Work** — tasks due today/this week, in-progress items, mentions, time logged, and their assigned project channels.

---

## 5. Designer

### Description
UI/UX or graphic designer. Functionally equivalent to a Developer in access scope but oriented toward design tasks and deliverables. Works assigned design tasks, uploads assets/mockups, and collaborates in project channels. No sales or finance access.

### Permissions

| Module | Create | Read | Update | Delete | Special Permissions |
|--------|:------:|:----:|:------:|:------:|---------------------|
| Authentication | ❌ | ✅ | 🔸 | ❌ | Manage own profile/sessions |
| Dashboard | ❌ | ✅ | 🔸 | ❌ | Personal dashboard |
| Clients | ❌ | 🔸 | ❌ | ❌ | Read clients of assigned projects only |
| Leads | ❌ | ❌ | ❌ | ❌ | No access |
| Projects | ❌ | 🔸 | 🔸 | ❌ | Read assigned projects; update progress notes |
| Tasks | 🔸 | ✅ | 🔸 | ❌ | Create subtasks; update status/time on own tasks |
| Invoices | ❌ | ❌ | ❌ | ❌ | No access |
| Employees | ❌ | 🔸 | 🔸 | ❌ | View team directory; edit own profile |
| Realtime Comm. | ✅ | ✅ | 🔸 | 🔸 | Participate in their project channels/DMs |
| AI Features | ✅ | ✅ | 🔸 | ❌ | Use summarize/asset-ideation features |
| File Management | 🔸 | 🔸 | 🔸 | 🔸 | Upload/manage design assets on their tasks |
| Notifications | ❌ | ✅ | 🔸 | ❌ | Receive & manage own notifications |
| Analytics | ❌ | 🔸 | ❌ | ❌ | View own utilization/stats only |
| Security | ❌ | ❌ | ❌ | ❌ | No access |

### Restrictions
- Identical restrictions to Developer: no Leads, Invoices, finance, or company analytics.
- Cannot see clients/projects they are not assigned to.
- Cannot reassign tasks or alter others' work.
- Cannot manage accounts or roles.

### Default Dashboard
**My Work** — design tasks due, in-review items, asset uploads pending, mentions, and assigned project channels.

---

## 6. QA Engineer

### Description
Quality assurance engineer responsible for testing and verifying delivery. Sees assigned projects, picks up tasks in the "In Review/Testing" stage, logs defects (as tasks/comments), and signs off completion. Like Developer/Designer, has no sales or finance access, but has slightly broader task-read across the project to verify cross-cutting work.

### Permissions

| Module | Create | Read | Update | Delete | Special Permissions |
|--------|:------:|:----:|:------:|:------:|---------------------|
| Authentication | ❌ | ✅ | 🔸 | ❌ | Manage own profile/sessions |
| Dashboard | ❌ | ✅ | 🔸 | ❌ | Personal dashboard |
| Clients | ❌ | 🔸 | ❌ | ❌ | Read clients of assigned projects only |
| Leads | ❌ | ❌ | ❌ | ❌ | No access |
| Projects | ❌ | 🔸 | 🔸 | ❌ | Read assigned projects; update QA status notes |
| Tasks | 🔸 | ✅ | 🔸 | ❌ | Create defect tasks; move tasks through review/test states |
| Invoices | ❌ | ❌ | ❌ | ❌ | No access |
| Employees | ❌ | 🔸 | 🔸 | ❌ | View team directory; edit own profile |
| Realtime Comm. | ✅ | ✅ | 🔸 | 🔸 | Participate in their project channels/DMs |
| AI Features | ✅ | ✅ | 🔸 | ❌ | Use summarize/test-case-suggestion features |
| File Management | 🔸 | 🔸 | 🔸 | 🔸 | Attach test reports/evidence to tasks |
| Notifications | ❌ | ✅ | 🔸 | ❌ | Receive & manage own notifications |
| Analytics | ❌ | 🔸 | ❌ | ❌ | View own/test-related stats (defect rate, throughput) |
| Security | ❌ | ❌ | ❌ | ❌ | No access |

### Restrictions
- No access to Leads, Invoices, finance, or company analytics.
- Cannot see clients/projects they are not assigned to.
- Can change task **status** within review/test workflow but cannot reassign ownership outside QA flow.
- Cannot manage accounts or roles.

### Default Dashboard
**QA Board** — tasks awaiting review/testing, open defects, sign-off queue, and assigned project channels.

---

## 7. Client (Read-Only Portal)

### Description
External customer of the software house. Accesses a restricted portal to view the status of their own projects, see and download their invoices and shared files, and receive updates. Cannot view internal data, other clients, finances beyond their own invoices, or any management tooling. Strictly read-only except where noted (acknowledgements/messages in their project channel).

### Permissions

| Module | Create | Read | Update | Delete | Special Permissions |
|--------|:------:|:----:|:------:|:------:|---------------------|
| Authentication | ❌ | ✅ | 🔸 | ❌ | Manage own portal login only |
| Dashboard | ❌ | 🔸 | ❌ | ❌ | Read-only portal dashboard (own projects) |
| Clients | ❌ | 🔸 | 🔸 | ❌ | View/limited-edit own company contact details |
| Leads | ❌ | ❌ | ❌ | ❌ | No access |
| Projects | ❌ | 🔸 | ❌ | ❌ | Read own projects' status/milestones |
| Tasks | ❌ | ❌ | ❌ | ❌ | No access (internal only) |
| Invoices | ❌ | 🔸 | ❌ | ❌ | View/download own invoices |
| Employees | ❌ | ❌ | ❌ | ❌ | No access |
| Realtime Comm. | 🔸 | 🔸 | ❌ | ❌ | Post/read in own project channel only |
| AI Features | ❌ | ❌ | ❌ | ❌ | No access |
| File Management | ❌ | 🔸 | ❌ | ❌ | Download files shared on own projects/invoices |
| Notifications | ❌ | 🔸 | 🔸 | ❌ | Receive own project/invoice notifications |
| Analytics | ❌ | 🔸 | ❌ | ❌ | View own project progress metrics only |
| Security | ❌ | ❌ | ❌ | ❌ | No access |

### Restrictions
- Sees **only** their own client record, projects, invoices, and shared files — never internal tasks, employees, leads, costs, or other clients.
- Cannot view internal financials beyond their own issued invoices (no margins, no cost data).
- Cannot create projects, tasks, or invoices.
- Cannot access any internal channel; messaging is limited to their own project channel.
- Cannot use AI features or analytics beyond their own project progress.

### Default Dashboard
**Client Portal** — their active projects with status/milestones, outstanding & paid invoices, shared files, and latest updates.

---

## 8. Role Hierarchy Diagram

Permission flows **downward**: a higher role includes the visibility of the roles beneath it within its scope, plus its own elevated privileges. The Client is **outside** the internal chain (external, read-only).

```
                        ┌──────────────────────────┐
                        │       SUPER ADMIN        │   Level 0 — platform owner
                        │  full + security + audit │
                        └────────────┬─────────────┘
                                     │ delegates operations
                                     ▼
                        ┌──────────────────────────┐
                        │          ADMIN           │   Level 1 — company operations
                        │ all ops, accounts ≤ Mgr  │
                        └────────────┬─────────────┘
                                     │ delegates delivery
                                     ▼
                        ┌──────────────────────────┐
                        │         MANAGER          │   Level 2 — projects & teams
                        │ owns clients/projects/    │
                        │ leads/invoices (scoped)  │
                        └────────────┬─────────────┘
                                     │ assigns work
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
     ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
     │    DEVELOPER    │   │     DESIGNER    │   │   QA ENGINEER   │   Level 3 — execution
     │ assigned tasks  │   │ assigned tasks  │   │ review & test   │   (peers, equal scope)
     └─────────────────┘   └─────────────────┘   └─────────────────┘

   ───────────────────────────────────────────────────────────────────
   EXTERNAL (outside internal hierarchy)
                        ┌──────────────────────────┐
                        │   CLIENT (read-only)     │   Portal — own data only
                        │  own projects/invoices   │
                        └──────────────────────────┘
```

**Authority summary:**

| Level | Role | Scope of Authority |
|:-----:|------|--------------------|
| 0 | Super Admin | Everything, incl. security, roles, and audit |
| 1 | Admin | All company operations; manage accounts up to Manager |
| 2 | Manager | Own clients/leads/projects/teams/invoices (scoped) |
| 3 | Developer / Designer / QA | Assigned tasks and project participation only |
| — | Client | Own projects, invoices, and shared files (read-only) |

---

*End of User Roles & Permissions.*
