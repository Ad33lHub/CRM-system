# Rule: Frontend / React

Modular instruction file imported by `.claude/CLAUDE.md`. Applies to `client/` (React 18 + Vite).

## Structure

- Organize by **feature**, not by type: `client/src/features/<module>/` holds
  `components/`, `api/` (RTK Query slice), `hooks/`, `<module>-slice.js`, `<module>.schema.js`.
- Reusable primitives live in `components/ui/` (shadcn) and `components/common/`.
- Route-level composition lives in `pages/` and `layouts/`; routes are declared in `app/router.jsx`.

## State & data

- **Server state → RTK Query.** Never hand-roll `useEffect` + `fetch` for API data. Define endpoints
  in the feature's `api/` slice and use the generated hooks; rely on cache tags for invalidation.
- **Client/UI state → Redux Toolkit slices** (or local `useState` when it's truly local). Avoid prop-drilling.
- The Axios instance (`lib/axios.js`) owns auth headers, the refresh-token flow, and error normalization —
  use it; don't create ad-hoc axios calls.

## Forms & validation

- All forms use **React Hook Form** with a **Zod** resolver. Reuse the Zod schema shape that the server validates
  with, so the client and server agree on the contract.
- Show field errors inline; surface API validation errors (`error.fields`) back onto the matching inputs.

## Components

- Function components + hooks only. One component per file; file **kebab-case**, export **PascalCase**.
- Keep components presentational where possible; push data fetching to the feature's hooks/api layer.
- Compose styles with Tailwind utilities and `cn()` (clsx + tailwind-merge). Don't write bespoke CSS files
  unless a utility approach genuinely can't express it.
- Use shadcn/ui primitives before introducing any new UI dependency.

## Performance & UX

- Virtualize long lists/boards with **react-window** (clients, tasks, notifications).
- Use **@dnd-kit** for the task board drag-and-drop (keyboard-accessible).
- Charts use **Recharts**; keep chart components dumb and feed them already-shaped data.
- Realtime uses the shared **socket.io-client** setup (`lib/socket.js`) — one connection, subscribe per feature.

## Access & portal

- Gate UI by role using the permission matrix in `docs/03_User_Roles.md`; never render actions a role can't perform.
- The **Client portal** is read-only — no create/update/delete controls beyond the few allowed (own contact details,
  own project channel). Treat portal routes as a separate `portal-layout.jsx`.

## Quality

- Run `npm run lint` and the client tests before finishing. No `console.log` left in committed components.
- Keep imports ordered (enforced by `import/order`); no unused imports/vars.
