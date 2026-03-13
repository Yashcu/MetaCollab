# MetaCollab

A full-stack collaborative project management app built with Next.js 14, MongoDB, Clerk, Pusher, and Zustand.

---

## Tech Stack

- **Framework** — Next.js 15 (App Router)
- **Auth** — Clerk
- **Database** — MongoDB via Mongoose
- **Realtime** — Pusher
- **State** — Zustand
- **UI** — Tailwind CSS v4 + shadcn/ui
- **Drag & Drop** — @hello-pangea/dnd

---

## Features

- **Project Management** — Create projects and manage team members with role-based permissions.
- **Kanban Board** — Effortless task tracking with real-time drag-and-drop synchronization.
- **Transient Live Chat** — Private, real-time project chat. Messages are ephemeral and never stored in the database for maximum privacy.
- **Invitation System** — Secure, email-based team invitations with auto-expiring tokens.
- **Real-time Updates** — Instant UI updates across all users via Pusher.
- **User Authentication** — Robust auth and profile management powered by Clerk.

---

## Project Structure

```text
MetaCollab/
├── app/                          # Next.js App Router pages and API routes
│   ├── (auth)/                   # Clerk sign-in / sign-up pages
│   ├── api/                      # API route handlers
│   │   ├── admin/
│   │   ├── invitations/
│   │   ├── projects/
│   │   ├── pusher/
│   │   ├── tasks/
│   │   └── users/
│   ├── dashboard/                # Dashboard pages
│   │   ├── settings/             # User settings page
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── projects/
│   │   └── [id]/                 # Project pages (tasks, chat)
│   │       ├── chat/
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── fonts/                    # Local font assets
│   ├── globals.css
│   ├── layout.tsx                # Root layout (ClerkProvider, ThemeProvider)
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── page.tsx                  # Landing / redirect page
├── components/                   # React components
│   ├── chat/                     # Chat UI
│   ├── dashboard/                # Dashboard-specific components
│   ├── project/                  # Project-specific components
│   ├── realtime/                 # Pusher channel subscription wrappers
│   ├── shared/                   # Layout shells, sidebar, spinner
│   └── ui/                       # shadcn/ui primitives
├── hooks/                        # Custom React hooks
│   ├── useDashboardRealtime.ts
│   ├── useInvitationRealtime.ts
│   ├── useKickedFromProject.ts
│   └── useTheme.ts
├── lib/
│   ├── models/                   # Mongoose models
│   │   ├── Invitation.ts
│   │   ├── Project.ts
│   │   ├── Task.ts
│   │   └── User.ts
│   ├── mongodb.ts                # DB connection with hot-reload guard
│   ├── pusher.ts                 # Server-side Pusher instance
│   ├── pusher-client.ts          # Client-side Pusher instance
│   └── utils.ts                  # Shared utility helpers
├── services/                     # Business logic (no DB calls in routes)
│   ├── adminService.ts
│   ├── fetcher.ts
│   ├── invitationService.ts
│   ├── projectService.ts
│   ├── taskService.ts
│   └── userService.ts
├── store/                        # Zustand stores (UI state only)
│   ├── chatStore.ts
│   ├── invitationStore.ts
│   ├── projectStore.ts
│   └── uiStore.ts
├── middleware.ts                  # Clerk auth guards
├── next.config.mjs
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB instance (local or Atlas)
- Clerk account
- Pusher account

### Environment Variables

Create a `.env.local` file in the root:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Pusher
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler check |
| `npm run check-all` | Lint + type-check together |

---

## Data Models

### User

Synced from Clerk on first sign-in. Stores `clerkUserId`, `name`, `email`, `role`, and optional `avatarUrl`.

### Project

Has a name, description, owner (clerkUserId), and an embedded `members` array with per-member roles (`owner`, `admin`, `member`).

### Task

Belongs to a project. Tracks title, description, assignee, status (`todo`, `in-progress`, `done`), priority (`low`, `medium`, `high`), drag-and-drop `order`, and optional `dueDate`.

### Invitation

Email-based invite system. Generates a secure 32-byte token. Auto-expires after 7 days via MongoDB TTL index. Prevents duplicate pending invites via a partial unique index.

---

## Audit Progress

| Phase | Day | Scope | Status |
| --- | --- | --- | --- |
| Phase 0 | Day 1 | package.json, tsconfig, next.config, postcss, middleware | ✅ Done |
| Phase 1 | Day 2 | mongodb.ts, all Mongoose models | ✅ Done |
| Phase 1 | Day 3 | Index verification, schema review | 🔄 Next |
| Phase 2 | Day 4-5 | Service layer | ⏳ Pending |
| Phase 3 | Day 6-8 | API routes | ⏳ Pending |
| Phase 4 | Day 9-10 | Stores + realtime hooks | ⏳ Pending |
| Phase 5 | Day 11-14 | Components + pages | ⏳ Pending |

---

## Notes

- ESLint is disabled during builds (`ignoreDuringBuilds: true`) until all lint issues are resolved.
- The `backend/` and `frontend/` folders from the previous Express + Vite architecture have been removed. Everything now lives in this Next.js monorepo.
