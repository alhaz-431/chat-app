# Chat API Documentation

Base URL: `https://frontend-task-chatapp.onrender.com/api`
WebSocket: `https://frontend-task-chatapp.onrender.com` (root origin, not `/api`)

> The official spec intentionally omits response bodies/status codes. The
> shapes below are inferred from the request schemas plus the app's own
> integration testing — verify against the live API before relying on them.

## Authentication
All protected endpoints require `Authorization: Bearer <token>`.

### `POST /auth/login`
Log in, or register automatically if the phone number is new.

Request body:
```json
{ "phone": "string", "name": "string" }
```
Inferred response:
```json
{ "token": "jwt-string", "user": { "id": "string", "name": "string", "phone": "string" } }
```

### `GET /auth/me`
Returns the currently authenticated user. `Authorization` header required.

---

## Users

### `GET /users/search?q=<term>`
Search users by name or phone. `q` is required.

Inferred response: `User[]`

---

## Conversations

### `GET /conversations`
List the current user's conversations (direct + group).

Inferred response: `Conversation[]`

### `POST /conversations`
Start a direct (1-to-1) conversation.

Request body:
```json
{ "userId": "string" }
```

### `GET /conversations/{id}/messages?limit=20&before=<cursor>`
Paginated message history, oldest-page-first via `before` cursor.

Query params:
- `limit` (integer, optional) — page size, e.g. `20`
- `before` (string, optional) — cursor for the page before a given message

Inferred response: `Message[]`

---

## Groups

### `POST /conversations/group`
Create a group conversation (3+ members). Creator becomes the first admin.

Request body:
```json
{ "name": "string", "participantIds": ["string"] }
```

### `POST /conversations/{id}/participants`
Add members to a group. Admins only.

Request body:
```json
{ "userIds": ["string"] }
```

### `DELETE /conversations/{id}/participants/{userId}`
Remove a member, or leave the group (removing yourself).

### `POST /conversations/{id}/admins`
Promote a member to admin. Admins only.

Request body:
```json
{ "userId": "string" }
```

### `PATCH /conversations/{id}`
Rename a group. Admins only.

Request body:
```json
{ "name": "string" }
```

---

## Messages

### `POST /messages`
Send a message (works for both direct and group conversations).

Request body:
```json
{ "conversationId": "string", "text": "string" }
```

Inferred response: the saved `Message` object.

---

## Real-time (Socket.io)
Connect to the server root (not `/api`), with the JWT in the handshake:
```js
const socket = io("https://frontend-task-chatapp.onrender.com", {
  auth: { token },
});
```

| Direction        | Event                 | Payload                              |
|-------------------|------------------------|---------------------------------------|
| client → server  | `message:send`        | `{ conversationId, text }` (+ optional ack) |
| server → client  | `message:new`         | `Message`                             |
| server → client  | `conversation:updated`| `Conversation` (created/renamed/membership changed) |

---

## System

### `GET /health`
Health check, no auth required.

---

## Schemas (request bodies, from the OpenAPI spec)

| Schema | Fields |
|---|---|
| `LoginRequest` | `phone: string`, `name: string` |
| `StartConversationRequest` | `userId: string` |
| `SendMessageRequest` | `conversationId: string`, `text: string` |
| `CreateGroupRequest` | `name: string`, `participantIds: string[]` |
| `AddParticipantsRequest` | `userIds: string[]` |
| `PromoteRequest` | `userId: string` |
| `RenameGroupRequest` | `name: string` |