# 08 — Environment Variables

Authoritative reference for every environment variable used by the CRM. Server
variables are validated at boot in [`server/src/config/env.js`](../server/src/config/env.js);
client variables are read via Vite's `import.meta.env` (must be prefixed `VITE_`).

> **Never commit real secrets.** `.env` and `.env.local` are gitignored. Only the
> `.env.example` files (keys only, empty values) are committed. Read config through
> `config/env.js` on the server — never `process.env.*` directly in feature code.

**Required vs optional:**

- **Required** — the server exits on boot if missing (see `requiredVars`).
- **Optional** — the server logs a warning and disables the related feature
  (Cloudinary uploads, OpenAI/AI). All other variables fall back to a sensible default.

---

## Server (`server/.env`)

### App

| Variable      | Location | Required | Description                                      | Example Value           |
| ------------- | -------- | -------- | ------------------------------------------------ | ----------------------- |
| `PORT`        | server   | Yes      | Port the API listens on                          | `5000`                  |
| `NODE_ENV`    | server   | Yes      | Runtime mode (`development`/`production`/`test`) | `development`           |
| `CLIENT_URL`  | server   | Yes      | Allowed client origin for CORS / Socket.IO       | `http://localhost:3000` |
| `APP_NAME`    | server   | No       | Application display name                         | `Software House CRM`    |
| `APP_VERSION` | server   | No       | Application version string                       | `1.0.0`                 |

### MongoDB

| Variable           | Location | Required | Description                               | Example Value                                         |
| ------------------ | -------- | -------- | ----------------------------------------- | ----------------------------------------------------- |
| `MONGODB_URI`      | server   | Yes      | Primary connection string (MongoDB Atlas) | `mongodb+srv://user:pass@cluster.mongodb.net/crm_dev` |
| `MONGODB_URI_TEST` | server   | No       | Local DB used by the test suite           | `mongodb://localhost:27017/crm_test`                  |

### Redis

| Variable         | Location | Required | Description                          | Example Value            |
| ---------------- | -------- | -------- | ------------------------------------ | ------------------------ |
| `REDIS_URL`      | server   | No       | Cache / session store connection     | `redis://localhost:6379` |
| `REDIS_PASSWORD` | server   | No       | Redis password (blank for local dev) | _(empty)_                |

### JWT

| Variable                 | Location | Required | Description                                   | Example Value                      |
| ------------------------ | -------- | -------- | --------------------------------------------- | ---------------------------------- |
| `JWT_ACCESS_SECRET`      | server   | Yes      | Secret for signing access tokens (≥64 chars)  | _(64-char random hex — see below)_ |
| `JWT_REFRESH_SECRET`     | server   | Yes      | Secret for signing refresh tokens (≥64 chars) | _(64-char random hex — see below)_ |
| `JWT_ACCESS_EXPIRES_IN`  | server   | No       | Access token lifetime                         | `15m`                              |
| `JWT_REFRESH_EXPIRES_IN` | server   | No       | Refresh token lifetime                        | `7d`                               |

### Bcrypt

| Variable             | Location | Required | Description                  | Example Value |
| -------------------- | -------- | -------- | ---------------------------- | ------------- |
| `BCRYPT_SALT_ROUNDS` | server   | No       | Password hashing cost factor | `12`          |

### Cloudinary (optional)

| Variable                | Location | Required | Description           | Example Value     |
| ----------------------- | -------- | -------- | --------------------- | ----------------- |
| `CLOUDINARY_CLOUD_NAME` | server   | No\*     | Cloudinary cloud name | `my-cloud`        |
| `CLOUDINARY_API_KEY`    | server   | No\*     | Cloudinary API key    | `123456789012345` |
| `CLOUDINARY_API_SECRET` | server   | No\*     | Cloudinary API secret | _(secret)_        |

\* Optional to boot — a warning is logged and file uploads are disabled if unset.

### Email (SMTP)

| Variable             | Location | Required | Description                         | Example Value             |
| -------------------- | -------- | -------- | ----------------------------------- | ------------------------- |
| `SMTP_HOST`          | server   | Yes      | SMTP server host                    | `smtp.gmail.com`          |
| `SMTP_PORT`          | server   | No       | SMTP server port                    | `587`                     |
| `SMTP_SECURE`        | server   | No       | Use TLS on connect (`true`/`false`) | `false`                   |
| `SMTP_USER`          | server   | Yes      | SMTP username                       | `mailer@yourcompany.com`  |
| `SMTP_PASS`          | server   | Yes      | SMTP password / app password        | _(secret)_                |
| `EMAIL_FROM_NAME`    | server   | No       | Default sender display name         | `Software House CRM`      |
| `EMAIL_FROM_ADDRESS` | server   | No       | Default sender address              | `noreply@yourcompany.com` |

### Rate Limiting

| Variable                  | Location | Required | Description                            | Example Value |
| ------------------------- | -------- | -------- | -------------------------------------- | ------------- |
| `RATE_LIMIT_WINDOW_MS`    | server   | No       | Global rate-limit window (ms)          | `900000`      |
| `RATE_LIMIT_MAX_REQUESTS` | server   | No       | Max requests per window (global)       | `100`         |
| `AUTH_RATE_LIMIT_MAX`     | server   | No       | Max requests per window on auth routes | `5`           |

> **Note:** the variable is `RATE_LIMIT_MAX_REQUESTS` (consumed in
> `middleware/rateLimiter.middleware.js`), not `RATE_LIMIT_MAX`.

### Logging

| Variable    | Location | Required | Description             | Example Value |
| ----------- | -------- | -------- | ----------------------- | ------------- |
| `LOG_LEVEL` | server   | No       | Winston log level       | `debug`       |
| `LOG_DIR`   | server   | No       | Directory for log files | `./logs`      |

### BullMQ

| Variable         | Location | Required | Description                                               | Example Value            |
| ---------------- | -------- | -------- | --------------------------------------------------------- | ------------------------ |
| `BULL_REDIS_URL` | server   | No       | Redis connection for job queues (defaults to `REDIS_URL`) | `redis://localhost:6379` |

### AI (Phase 11 — optional)

| Variable         | Location | Required | Description     | Example Value |
| ---------------- | -------- | -------- | --------------- | ------------- |
| `OPENAI_API_KEY` | server   | No\*     | OpenAI API key  | _(secret)_    |
| `OPENAI_MODEL`   | server   | No       | OpenAI model id | `gpt-4o`      |

\* Optional to boot — a warning is logged and AI features are disabled if unset.

---

## Client (`client/.env`)

All client variables **must** be prefixed `VITE_` to be exposed to the browser
bundle. Never put a server secret in a `VITE_` variable — anything here ships to
the client.

### App

| Variable           | Location | Required | Description         | Example Value        |
| ------------------ | -------- | -------- | ------------------- | -------------------- |
| `VITE_APP_NAME`    | client   | No       | App display name    | `Software House CRM` |
| `VITE_APP_VERSION` | client   | No       | App version string  | `1.0.0`              |
| `VITE_ENV`         | client   | No       | Client runtime mode | `development`        |

### API

| Variable          | Location | Required | Description             | Example Value               |
| ----------------- | -------- | -------- | ----------------------- | --------------------------- |
| `VITE_API_URL`    | client   | Yes      | REST API base URL       | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | client   | Yes      | Socket.IO server origin | `http://localhost:5000`     |

### Cloudinary (public — upload preset only)

| Variable                        | Location | Required | Description                  | Example Value         |
| ------------------------------- | -------- | -------- | ---------------------------- | --------------------- |
| `VITE_CLOUDINARY_CLOUD_NAME`    | client   | No       | Public Cloudinary cloud name | `my-cloud`            |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | client   | No       | Unsigned upload preset name  | `crm_unsigned_preset` |

---

## How to generate secure JWT secrets

Generate a fresh 64-byte (128 hex-char) random secret per environment. Run once
for each of `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — they must be different:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste each output into the matching variable in `server/.env`. Rotate these
secrets if they are ever exposed; rotating invalidates all issued tokens.
