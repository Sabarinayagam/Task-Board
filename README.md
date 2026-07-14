# Real-Time Task Board

A shared, real-time Trello-style task board. Every visitor sees the same three columns
(**To Do**, **In Progress**, **Done**) and any change — creating, editing, deleting, or
dragging a card — is instantly broadcast to every other connected browser via Socket.IO.
No authentication, no per-user boards: it's one board for everyone.

```
task-board/
├── backend/     Express + Socket.IO + Prisma + PostgreSQL API
└── frontend/    Next.js 15 (App Router) + React 19 + React Query + dnd-kit
```

---

## 1. Prerequisites

- Node.js 18.18+ (Node 20 LTS recommended)
- PostgreSQL 14+ (local install, Docker, or a hosted instance)
- npm 9+

## 2. Quick Start

### 2.1 Database

Create a database (or use an existing PostgreSQL instance):

```bash
createdb task_board
# or with Docker:
docker run --name task-board-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=task_board -p 5432:5432 -d postgres:16
```

### 2.2 Backend

```bash
cd backend
cp .env.example .env        # edit DATABASE_URL if needed
npm install
npm run prisma:migrate      # creates tables from prisma/schema.prisma
npm run prisma:seed         # inserts sample cards
npm run dev                 # starts API + Socket.IO on http://localhost:4000
```

### 2.3 Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # starts Next.js on http://localhost:3000
```

Open `http://localhost:3000` in two browser windows/tabs and confirm changes in one
appear instantly in the other.

### 2.4 Production build

```bash
# backend
cd backend && npm run build && npm run prisma:deploy && npm start

# frontend
cd frontend && npm run build && npm start
```

---

## 3. Environment Variables

### backend/.env

| Variable       | Description                                   | Example                                                        |
|----------------|------------------------------------------------|-----------------------------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma    | `postgresql://postgres:postgres@localhost:5432/task_board`     |
| `PORT`         | Port the API/Socket.IO server listens on       | `4000`                                                          |
| `CORS_ORIGIN`  | Allowed origin for the frontend                | `http://localhost:3000`                                         |

### frontend/.env.local

| Variable                    | Description                     | Example                        |
|------------------------------|----------------------------------|----------------------------------|
| `NEXT_PUBLIC_API_URL`        | Base URL of the REST API        | `http://localhost:4000/api`     |
| `NEXT_PUBLIC_SOCKET_URL`     | Base URL of the Socket.IO server| `http://localhost:4000`         |

---

## 4. Database Schema (Prisma)

```prisma
enum CardStatus {
  TODO
  IN_PROGRESS
  DONE
}

model Card {
  id        String     @id @default(uuid())
  title     String
  status    CardStatus @default(TODO)
  position  Float
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([status, position])
  @@map("cards")
}
```

`position` is a `Float` rather than an integer. This lets a single
drag-and-drop move (e.g. inserting a card between position `1.0` and `2.0`)
be written as `1.5` — recalculating that one row — instead of having to
re-index every card in the column. The board still recomputes clean
integer-like positions after any full-column reorder for simplicity
(see `PATCH /cards/reorder`), so drift never accumulates.

---

## 5. REST API

Base path: `/api`

| Method | Path                  | Description                                            |
|--------|-----------------------|----------------------------------------------------------|
| GET    | `/cards`               | Returns all cards, ordered by `status` then `position`   |
| POST   | `/cards`               | Creates a card. Body: `{ title, status? }`                |
| PUT    | `/cards/:id`           | Renames a card. Body: `{ title }`                         |
| PATCH  | `/cards/:id/status`    | Moves a card between columns. Body: `{ status, position? }` |
| PATCH  | `/cards/reorder`       | Bulk-updates position/status after drag-and-drop. Body: `{ cards: [{ id, status, position }] }` |
| DELETE | `/cards/:id`           | Deletes a card                                             |

All request bodies are validated with **Zod**. Validation failures return
`400` with a structured `details` array; missing resources return `404`;
unhandled errors return `500`. Successful mutations return `200`/`201`,
deletes return `204`.

---

## 6. Real-Time Sync (Socket.IO)

Broadcast events (payload always includes `originSocketId`):

- `card_created`
- `card_updated`
- `card_deleted`
- `card_moved`
- `cards_reordered`
- `presence_update` — `{ count }`, sent whenever a socket connects/disconnects

**Avoiding self-duplication:** every mutating REST request carries an
`X-Socket-Id` header set to the browser's current Socket.IO connection id.
The backend controller reads that header and stamps it onto the broadcast
event as `originSocketId`. Each client compares that value to its own
`socket.id` and skips re-applying an event it originated — because its
own optimistic React Query update (or the mutation's success response)
already reflects that change.

**Reconnect logic:** the client uses `socket.io-client`'s built-in
reconnection (infinite attempts, backoff up to 5s). While disconnected the
header shows **🟡 Reconnecting**. On `connect` (including every
reconnect), the client invalidates the React Query cache, which triggers a
fresh `GET /cards` — guaranteeing the UI is fully synchronized with the
database even if events were missed while offline. Once connected it shows
**🟢 Connected**.

---

## 7. Frontend Architecture

- **Next.js App Router** (`app/`) — a single route renders the `<Board />` client component; a `Providers` wrapper sets up the shared `QueryClient`.
- **React Query** (`hooks/useCards.ts`) owns all server state (the `cards` list) with **optimistic updates**: every mutation (create/rename/move/delete/reorder) updates the cache immediately, then reconciles with the server response, and rolls back on error.
- **`hooks/useSocket.ts`** wires Socket.IO events directly into the same React Query cache via `queryClient.setQueryData`, so remote changes appear without a network round trip or refetch.
- **`@dnd-kit`** (not `react-beautiful-dnd`, which is unmaintained and incompatible with React 18/19 strict mode) powers drag-and-drop. `Board.tsx` owns the single `DndContext`; each `Column` is a droppable + `SortableContext`; each `Card` is `useSortable`.
- **Services layer** (`services/api.ts`, `services/socket.ts`) isolates all `fetch`/socket wiring from components and hooks.

## 8. Backend Architecture

Layered, framework-agnostic core:

```
routes/       → HTTP routing only
controllers/  → parses req/res, calls services, triggers socket broadcasts
services/     → business logic (positions, status transitions)
repositories/ → the only layer that touches Prisma
socket/       → Socket.IO server setup, presence tracking, broadcast helpers
validation/   → Zod schemas
middleware/   → centralized error handling + asyncHandler wrapper
```

This separation means the business logic in `services/` has zero
dependency on Express or Socket.IO and can be unit-tested in isolation;
swapping Prisma for another data layer would only require changing
`repositories/`.

---

## 9. Conflict Handling: Last-Write-Wins

This board uses a **Last-Write-Wins (LWW)** strategy, the simplest
consistency model that fits a lightweight, no-auth collaborative tool:

- Every mutation is a single `UPDATE`/`INSERT` against Postgres; whichever
  request reaches the database last determines the final state of that row.
  `updatedAt` (`@updatedAt`) records when that happened.
- There is no explicit version/ETag check before a write, so two users
  editing the *same* card's title within milliseconds of each other will
  simply have the second request's title win — the first is silently
  overwritten.
- Reordering is applied per-column as a batch transaction
  (`prisma.$transaction`), so a single drag-and-drop is atomic, but two
  *simultaneous* drags affecting the same column are still resolved
  last-write-wins at the transaction level.
- This is an acceptable trade-off for a shared task board where edits are
  infrequent and low-stakes compared to, say, a financial ledger. It keeps
  the API stateless and simple to reason about.

**Where this would break down:** rapid concurrent edits to the exact same
card by two people at the same instant. See "Future Improvements" below
for how this could be hardened.

---

## 10. Trade-offs

- **No authentication** — deliberately out of scope per the spec; anyone
  with the URL can edit the board. Fine for an internal/demo tool, not for
  production multi-tenant use.
- **In-memory presence count** — online-user tracking lives in a single
  process (`socket/presence.ts`). It's simple and fast but won't be correct
  across multiple horizontally-scaled backend instances without adding a
  shared store (Redis) and the Socket.IO Redis adapter.
- **LWW over CRDTs/OT** — chosen for simplicity and speed of delivery. A
  proper conflict-free approach (CRDT or operational transform) would add
  significant complexity for a feature (task titles) where lost updates are
  low-cost.
- **Float positions instead of a linked list** — simple and fast for the
  common case; an extremely long-lived column with thousands of
  micro-reorders could theoretically exhaust floating point precision
  between two adjacent positions (mitigated by renormalizing positions to
  integers on every full reorder call).

## 11. Future Improvements

- Add authentication + per-board multi-tenancy (still keeping one shared
  board per team/workspace).
- Move presence tracking and Socket.IO adapter to Redis for horizontal
  scaling across multiple backend instances.
- Add optimistic-concurrency version checks (`updatedAt` compare-and-swap)
  or field-level CRDTs for true conflict resolution instead of LWW.
- Add card details: descriptions, due dates, labels, assignees, comments.
- Add automated tests: Jest/Vitest for services & repositories, Playwright
  for end-to-end drag-and-drop and multi-tab real-time sync.
- Add rate limiting and request logging/observability (e.g. OpenTelemetry).
- Persist and animate a full audit/activity log of board changes.

---

## 12. Tech Stack Summary

| Layer      | Technology                                                       |
|------------|--------------------------------------------------------------------|
| Frontend   | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS        |
| Data layer | TanStack React Query (server state + optimistic updates)          |
| Drag/drop  | `@dnd-kit/core` + `@dnd-kit/sortable`                              |
| Realtime   | Socket.IO (client + server)                                        |
| Backend    | Node.js, Express.js, TypeScript                                    |
| Database   | PostgreSQL via Prisma ORM                                          |
| Validation | Zod                                                                 |
