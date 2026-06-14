# Project Subagents

Drop project-specific subagent definitions here as `*.md` files. Each agent is a Markdown
file with YAML frontmatter (`name`, `description`, optional `tools`, `model`) followed by the
agent's system prompt. Claude Code auto-discovers them and can dispatch tasks to them.

This directory is intentionally empty for now — add agents when a repeatable, well-scoped job emerges
(e.g. a `db-schema-reviewer` that checks Mongoose models against `docs/03_User_Roles.md`, or an
`api-contract-checker` that verifies controllers use the standard response envelope).

Example skeleton (`.claude/agents/db-schema-reviewer.md`):

```markdown
---
name: db-schema-reviewer
description: Reviews Mongoose schemas for indexes, naming, and RBAC alignment.
tools: Read, Grep, Glob
model: sonnet
---

You review MongoDB/Mongoose schema changes for the Software House CRM...
```
