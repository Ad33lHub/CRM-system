# 10 — API Testing Guide

API tests for the CRM backend live in [`tests/postman/`](../tests/postman) and run
both interactively (Postman) and headless (Newman CLI / CI).

```
tests/
├── postman/
│   ├── CRM_API_Collection.json     # the collection (generated)
│   ├── generate.mjs                # regenerates the collection + envs
│   └── envs/
│       ├── development.json
│       ├── staging.json
│       └── production.json
└── reports/
    └── .gitkeep                    # api-report.html lands here (gitignored)
```

> **Status note (Phase 1):** the collection asserts each endpoint's **intended
> final behavior** (200/201, token flow, full CRUD). The backend is still being
> built — only the static stub GETs (`/health`, `GET /auth`, `GET /clients` +
> `/:id`) pass today. The remaining requests fail with 404 (route not implemented)
> or 500 (needs a database / auth). Those failures are accurate TODOs: as each
> endpoint is implemented in its phase, its request here should pass unchanged.

## Importing into Postman

1. Open Postman → **Import** → select `tests/postman/CRM_API_Collection.json`.
2. **Import** each environment file under `tests/postman/envs/`.
3. Top-right environment selector → choose **CRM — Development**.

## Switching environments

Pick the environment from the selector (top-right). Each defines `base_url` and
auth-related variables:

| Environment       | `base_url`                                 |
| ----------------- | ------------------------------------------ |
| CRM — Development | `http://localhost:5000/api`                |
| CRM — Staging     | `https://crm-api-staging.onrender.com/api` |
| CRM — Production  | `https://crm-api.onrender.com/api`         |

`access_token` / `refresh_token` are populated automatically by the
**Login - Admin (Save Tokens)** request once the auth endpoints exist. The
collection-level pre-request script attaches `Authorization: Bearer <token>`
whenever `access_token` is set.

## Running via Newman (CLI)

Start the server first, then from the repo root:

```bash
npm run test:api
```

This runs:

```
newman run tests/postman/CRM_API_Collection.json \
  -e tests/postman/envs/development.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export tests/reports/api-report.html
```

To run against another environment, point `-e` at `staging.json` / `production.json`.
To run a single folder: append `--folder "Clients"`.

## Where reports are saved

The HTML report is written to **`tests/reports/api-report.html`** after every run.
It is **gitignored** (a build artifact); only `.gitkeep` is tracked. Open it in a
browser for a per-request/assertion breakdown.

## Adding a new request (conventions)

The collection is generated — **edit [`generate.mjs`](../tests/postman/generate.mjs)
and regenerate**, rather than hand-editing the JSON:

```bash
node tests/postman/generate.mjs
```

Conventions:

- Use `{{base_url}}` for the host; never hardcode URLs.
- Group requests under the matching module folder.
- Every request needs a **Tests** block asserting at minimum the HTTP status and
  the response envelope (`success` boolean) — see the `apiResponse` envelope in
  `docs/05_Development_Standards.md`.
- Save IDs/tokens to variables for chaining (e.g. `pm.collectionVariables.set('test_client_id', ...)`),
  guarded by a status check so they only set on success.
- Keep secrets in the environment, not in the collection.

## CI (future)

`test:api` is ready to wire into the CI `test` job once the backend endpoints are
implemented and a seeded test database is available to the runner.
