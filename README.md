Main Submission Write-up (`README.md`)
আপনার প্রজেক্টের রুট ডিরেক্টরির `README.md` ফাইলে এই টেক্সটটি পেস্ট করে দিন:

```markdown
# PulseChat - Real-Time Chat Engine

A full-featured real-time messaging web application supporting 1-to-1 direct messaging, group chat management, smart auto-scroll, and live updates via Socket.io.

## Architecture & Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **State Management:** React Hooks & State Sync
- **Networking:** Axios API Client with JWT Bearer Interceptors
- **Real-time Sync:** Socket.io Client

## Thought Process & Design Decisions

### 1. Smart Auto-Scroll Behavior
- Implemented via a container scroll listener tracking `scrollHeight - scrollTop - clientHeight`.
- Automatically snaps to bottom when a new message arrives *if* the user is already near the bottom.
- If the user has scrolled up to inspect older messages, incoming messages will not disrupt their reading position.

### 2. Group Management & Administration
- Clean separation of direct conversations and group chats.
- Group creators maintain admin privileges allowing dynamic renaming and participant addition via dedicated endpoints.

### 3. API Resilience & Token Handling
- Centralized Axios instance injects JWT authorization headers smoothly.
- Real-time fallback ensures seamless socket connection maintenance during chat transitions.

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Run local server
npm run dev# chat-app
