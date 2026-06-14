# Project Slash Commands (Skills)

Add project slash commands here as `*.md` files. The filename becomes the command
(`new-module.md` → `/new-module`). Each file holds the prompt/instructions Claude runs when invoked,
optionally with YAML frontmatter (`description`, `argument-hint`, `allowed-tools`). Use `$ARGUMENTS`
to capture input.

This directory is intentionally empty for now — add commands for repeatable workflows on this CRM,
for example:

- `/new-module <name>` — scaffold a server module (routes/controller/service/validation/model) and a
  client feature folder following `docs/05_Development_Standards.md`.
- `/api-endpoint <module> <verb> <path>` — generate a route + Zod schema + controller using the
  standard response envelope.
- `/check-rbac` — verify every protected route enforces the matrix in `docs/03_User_Roles.md`.

Example skeleton (`.claude/skills/new-module.md`):

```markdown
---
description: Scaffold a new CRM module on client and server.
argument-hint: <module-name>
---

Create a new module named "$ARGUMENTS" following docs/05_Development_Standards.md:
1. server/src/modules/$ARGUMENTS/ with routes, controller, service, validation, model
2. client/src/features/$ARGUMENTS/ with components, api slice, hooks, schema
...
```
