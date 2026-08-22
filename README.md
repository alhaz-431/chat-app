# Chatline — Real-time Chat App (Take-Home Assignment)

## Tech stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Zustand (auth + chat state, persisted to localStorage)
- Axios (REST) + Socket.io-client (real-time)
- react-hot-toast (error/status feedback)

## Setup & run
```bash
npm install
cp .env.local.example .env.local   # adjust if the API URL changes
npm run dev
```
Visit `http://localhost:3000` — it redirects to `/login` if signed out, `/chat` if signed in.
Landing page: `http://localhost:3000/landing`.

## Live demo links
- Part 1 (chat app): TODO — add Vercel URL after deploy
- Part 2 (landing page): TODO — add Vercel URL (`/landing` route) after deploy

## API documentation
See [`docs/api-docs.md`](./docs/api-docs.md) for the full endpoint reference,
including response shapes inferred by inspecting the live API (the spec
intentionally omits response bodies).

---

## Part 3 — Thought process

### Architecture & approach
I used Next.js App Router with a thin client-side data layer rather than
server components, since this app is fundamentally a real-time, stateful
client (auth token, socket connection, live message stream) — server
rendering would add complexity without much benefit here. State is split
into two Zustand stores: `authStore` (persisted, holds the JWT/current user)
and `chatStore` (in-memory, holds conversations and messages keyed by
conversation id). Zustand over Redux/Context because the state shape is
simple and doesn't need the ceremony.

For real-time, I connect a single Socket.io client once the user is
authenticated, and route `message:new` / `conversation:updated` events
straight into the Zustand store so any component reading from it re-renders
automatically. Sending a message is optimistic: it's added to the store
immediately with a `sending` status, then replaced with the server's
version (or marked `failed`) once the REST call resolves — this keeps the
UI responsive even on a slow connection.

Auto-scroll tracks whether the user is within ~120px of the bottom of the
message list. If they are, new messages scroll them down automatically; if
they've scrolled up to read history, new messages instead surface a small
"N new messages ↓" pill instead of forcing the view down.

**Trade-off:** I didn't build pagination/infinite-scroll for older messages
in the UI (the API supports it via `limit`/`before`), given the time box —
that's the first thing I'd add back with more time.

### Design choices (Part 2)
I picked a warm paper background with a single deep-pine accent color and a
Space Grotesk/Inter pairing, specifically to avoid the generic
indigo-on-white or dark-mode-neon look that's the default reach for most
AI-assisted or template UIs. The landing page leads with a real (not stock)
message-bubble mockup styled identically to the actual app, so the promise
and the product visually match.

### AI tool usage
I used Claude (Anthropic) as a pair-programmer for this assignment:
scaffolding the Next.js project, generating component boilerplate (message
list, conversation sidebar, modals), and drafting this README. I reviewed
and adjusted the generated API client against the real Swagger schemas
(several field names in my first draft were wrong — e.g. `StartConversationRequest`
uses `userId` not `participantId`, `AddParticipantsRequest` uses `userIds`
not `participantIds` — and I corrected those after inspecting the actual
spec). I wrote/reviewed the final auto-scroll and optimistic-send logic
by hand rather than accepting the first draft, since those are the pieces
most likely to have subtle bugs.

### What I'd improve with more time
- Pagination for message history (infinite scroll upward)
- Optimistic UI for group actions (add/remove/promote) instead of waiting
  on the round-trip
- Proper skeleton loaders instead of plain "Loading…" text
- Unit tests around the auto-scroll threshold logic and the optimistic
  send/failure path
- Debounced "typing…" indicator using the socket connection

### Issues encountered with the API
The OpenAPI spec deliberately omits response bodies and status codes by
design (noted directly in the docs) — so response shapes for each endpoint
were inferred by calling the live API and inspecting results, then typed
accordingly in `src/types/index.ts`. [Add any other real quirks you hit
once you test end-to-end — mismatched field casing, unexpected nesting,
etc.]