# Software House CRM

> Internal CRM for a software house — manage clients, leads, projects, tasks, invoices, employees, realtime communication, files, notifications, and analytics, plus a read-only client portal.

![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Overview

This is an **npm-workspaces monorepo** with three packages:

| Package | Path      | Description                                                                |
| ------- | --------- | -------------------------------------------------------------------------- |
| Client  | `client/` | React 18 + Vite SPA (Tailwind, Redux Toolkit + RTK Query, React Router v6) |
| Server  | `server/` | Node 20 + Express REST API (Mongoose, JWT, Socket.IO, BullMQ, Zod)         |
| Shared  | `shared/` | Constants (roles, statuses, permissions) and JSDoc types shared by both    |

Architecture, goals, roles, and standards are documented in [`docs/`](./docs):

- [`docs/01_CRM_Goals.md`](./docs/01_CRM_Goals.md) — goals, KPIs, non-goals, acceptance criteria
- [`docs/02_Module_Map.md`](./docs/02_Module_Map.md) — modules, dependencies, data-flow journeys
- [`docs/03_User_Roles.md`](./docs/03_User_Roles.md) — roles and per-module permissions
- [`docs/04_Tech_Stack.md`](./docs/04_Tech_Stack.md) — technology decisions
- [`docs/05_Development_Standards.md`](./docs/05_Development_Standards.md) — coding standards

---

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, shadcn/ui, Redux Toolkit, RTK Query, React Router v6, React Hook Form, Zod, Axios, Socket.IO-client, Recharts, @dnd-kit, react-window.

**Backend:** Node.js, Express, Mongoose, JWT, bcrypt, Socket.IO, BullMQ, Redis (ioredis), Winston, Morgan, Helmet, express-rate-limit, Zod, Multer, Nodemailer, node-cron.

**Data & infra:** MongoDB Atlas, Redis, Cloudinary, Vercel (frontend), Render (backend), Cloudflare.

---

## Prerequisites

- **Node.js** `>= 20` and npm `>= 9`
- **MongoDB** running locally or a MongoDB Atlas connection string
- **Redis** running locally or a managed Redis URL
- (Optional) **Cloudinary** account for file uploads and **SMTP** credentials for email

---

## Installation

```bash
# 1. Clone
git clone https://github.com/Ad33lHub/CRM-system crm-software-house
cd crm-software-house

# 2. Install all workspaces from the root
npm install

# 3. Configure environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
# then edit both .env files with your values

# 4. Start dev (runs server + client together)
npm run dev
```

- Client dev server: <http://localhost:5173>
- API dev server: <http://localhost:5000> (health check: `GET /api/health`)

You can also run a single workspace:

```bash
npm run dev -w server     # backend only
npm run dev -w client     # frontend only
```

---

## Folder Structure

```
crm-software-house/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── assets/         # images, icons
│       ├── components/     # ui / common / layout components
│       ├── features/       # per-module slices, components, hooks
│       ├── hooks/          # global hooks (useAuth, useSocket, useDebounce)
│       ├── lib/            # axios, socket, utils
│       ├── pages/          # route-level pages
│       ├── routes/         # router + route config
│       ├── services/       # RTK Query API slices
│       ├── store/          # Redux store + rootReducer
│       ├── constants/      # roles, routes, api endpoints
│       └── styles/         # Tailwind globals
├── server/                 # Node + Express backend
│   └── src/
│       ├── config/         # db, redis, cloudinary, socket, env
│       ├── controllers/    # request handlers
│       ├── middleware/     # auth, rbac, validate, upload, rateLimiter, errorHandler
│       ├── models/         # Mongoose schemas
│       ├── routes/         # Express routers
│       ├── services/       # email, token, otp, upload, notification, queue
│       ├── validators/     # Zod request schemas
│       ├── utils/          # logger, apiResponse, asyncHandler, pagination
│       ├── jobs/           # BullMQ workers
│       └── sockets/        # Socket.IO handlers
├── shared/                 # constants + types shared by client and server
├── docs/                   # planning & architecture
├── .editorconfig
├── .gitignore
└── package.json            # npm workspaces root
```

---

## Available npm Scripts

Run from the repository root:

| Script          | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Run server + client concurrently  |
| `npm run build` | Build the client for production   |
| `npm run start` | Start the server (production)     |
| `npm run lint`  | Lint client and server            |
| `npm run test`  | Run server and client test suites |

Workspace-scoped (append `-w client` or `-w server`):

| Script                     | Description                |
| -------------------------- | -------------------------- |
| `npm run dev -w server`    | Start API with nodemon     |
| `npm run dev -w client`    | Start Vite dev server      |
| `npm run lint -w server`   | ESLint the server          |
| `npm run format -w client` | Prettier-format the client |

---

## Environment Variables

### Server (`server/.env`)

| Variable                  | Description                  | Example / Default                   |
| ------------------------- | ---------------------------- | ----------------------------------- |
| `NODE_ENV`                | Runtime environment          | `development`                       |
| `PORT`                    | API port                     | `5000`                              |
| `MONGO_URI`               | MongoDB connection string    | `mongodb://127.0.0.1:27017/crm_dev` |
| `REDIS_URL`               | Redis connection string      | `redis://127.0.0.1:6379`            |
| `JWT_ACCESS_SECRET`       | Access-token signing secret  | (long random string)                |
| `JWT_REFRESH_SECRET`      | Refresh-token signing secret | (long random string)                |
| `JWT_ACCESS_EXPIRES`      | Access-token lifetime        | `15m`                               |
| `JWT_REFRESH_EXPIRES`     | Refresh-token lifetime       | `7d`                                |
| `CLIENT_URL`              | Allowed CORS origin          | `http://localhost:5173`             |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary cloud name        | (optional)                          |
| `CLOUDINARY_API_KEY`      | Cloudinary API key           | (optional)                          |
| `CLOUDINARY_API_SECRET`   | Cloudinary API secret        | (optional)                          |
| `SMTP_HOST` / `SMTP_PORT` | SMTP server                  | (optional)                          |
| `SMTP_USER` / `SMTP_PASS` | SMTP credentials             | (optional)                          |
| `MAIL_FROM`               | Default from-address         | `no-reply@crm.local`                |
| `LOG_LEVEL`               | Winston log level            | `info`                              |

### Client (`client/.env`)

| Variable          | Description          | Default                     |
| ----------------- | -------------------- | --------------------------- |
| `VITE_API_URL`    | Base URL of the API  | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:5000`     |

> **Note:** `.env` files are gitignored. Commit only `.env.example`.

---

## Contributing

Please read the [Development Standards](./docs/05_Development_Standards.md) before contributing. In short:

- Branch from `dev` using `feature/*`, `fix/*`, `hotfix/*`, or `release/*`.
- Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`…).
- All API responses use the standard response envelope; validate input with Zod.
- Open a PR into `dev` — at least 1 review and green CI are required to merge. No direct commits to `main`/`dev`.

---

## License

Released under the **MIT License**.
