# MetaCollab
> A real-time, high-performance collaborative project management application.

## Overview
MetaCollab is a full-stack project management application designed to streamline team collaboration. It provides a robust set of tools including role-based access control, real-time Kanban boards with drag-and-drop support, and secure transient messaging. Built with a modern Next.js 15 architecture, MetaCollab focuses on performance, optimistic UI updates, and strict separation of concerns to deliver a seamless user experience.

## Tech Stack
**Frontend**
- Next.js 15 (App Router)
- React 19
- Tailwind CSS v4 & shadcn/ui
- Zustand (Client State Management)
- `@hello-pangea/dnd` (Drag and Drop)

**Backend**
- Next.js API Routes (Serverless)
- Node.js

**Database & Auth**
- PostgreSQL
- Prisma ORM
- Clerk (Authentication & User Management)

**Realtime & Integration**
- Pusher (WebSockets)

## Key Features
- **Real-Time Kanban Board:** Effortless task tracking with optimistic drag-and-drop synchronization across all connected clients.
- **Role-Based Access Control (RBAC):** Project-specific roles (`owner`, `admin`, `member`) governing task manipulation and project settings.
- **Transient Live Chat:** Ephemeral, real-time chat scoped to individual projects. Messages are purposely not persisted to the database to ensure maximum privacy.
- **Secure Invitation System:** Email-based team invitations managed via secure, auto-expiring 32-byte cryptographic tokens.
- **Instant Synchronization:** Global state updates powered by Pusher integrations, broadcasting events seamlessly to subscribed channels.

## Architecture
MetaCollab employs a monolith architecture via Next.js, bridging the gap between a robust React frontend and secure backend API routes. The primary data source is a PostgreSQL database managed via Prisma ORM. For real-time functionality, whenever a mutation occurs (e.g., a task is moved), the API route updates the database and simultaneously dispatches an event via the Pusher server. Connected clients listen on authenticated Pusher channels and dynamically update their UI via Zustand stores.

```mermaid
flowchart TD
    %% Styling definitions
    classDef client fill:#e0f7fa,stroke:#006064,stroke-width:2px,color:#006064,font-weight:bold;
    classDef server fill:#fce4ec,stroke:#880e4f,stroke-width:2px,color:#880e4f,font-weight:bold;
    classDef db fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#e65100,font-weight:bold;
    classDef external fill:#f3e5f5,stroke:#4a148c,stroke-width:2px,color:#4a148c,font-weight:bold;

    User((👤 User))

    subgraph Frontend["🖥️ Frontend (Next.js Client Components)"]
        direction TB
        UI["React Interface\n(shadcn/ui, dnd)"]:::client
        State["Zustand Store\n(Optimistic State)"]:::client
        ServiceClient["Service API Client\n(fetcher.ts)"]:::client
        PusherHook["Pusher Client Hooks\n(WebSocket Listener)"]:::client
    end

    subgraph SaaS["☁️ External SaaS Services"]
        direction LR
        Clerk["🛡️ Clerk Auth\n(Session & JWT)"]:::external
        Pusher["⚡ Pusher Channels\n(Realtime Pub/Sub)"]:::external
    end

    subgraph Backend["⚙️ Backend (Next.js API Routes / Node.js)"]
        direction TB
        Middleware["Middleware\n(Auth Protection)"]:::server
        API["API Route Handlers\n(Zod Validations)"]:::server
        PrismaClient["Prisma Library"]:::server
        PusherServer["Pusher SDK\n(Server Events)"]:::server
    end

    subgraph Database["💾 Data Layer"]
        Postgres[("🐘 PostgreSQL\n(Relational Storage)")]:::db
    end

    %% Auth Flow
    User -.->|Signs up & Logs in| Clerk
    Middleware -.->|Verifies Session Token| Clerk

    %% Happy Path / Interaction Flow
    User == 1. Drags & Drops Task ==> UI
    UI == 2. Optimistic Update ==> State
    State == 3. Background Sync (Debounced HTTP) ==> ServiceClient
    ServiceClient == 4. Protected Request ==> Middleware
    
    %% Backend Processing
    Middleware -- 5. Route to Logic --> API
    API -- 6. Executes Query --> PrismaClient
    PrismaClient -- 7. Raw SQL Transaction --> Postgres
    
    %% Realtime Pub/Sub Edge
    API -- 8. Dispatches Notification --> PusherServer
    PusherServer -- 9. Publishes Event --> Pusher
    
    %% WebSockets
    Pusher == 10. Broadcasts to multiple clients via WSS ==> PusherHook
    PusherHook -- 11. Overwrites Store safely --> State
    State -- 12. Re-renders UI --> UI
```

## How It Works
The development approach emphasizes strict separation of concerns and maintainability:
- **State Management:** UI components exclusively read and write to Zustand stores rather than handling complex local states. 
- **Service Layer Pattern:** Stores do not fetch data directly; they delegate requests to a dedicated `services/` layer, keeping the state logic pure and agnostic of network implementations.
- **Optimistic UI:** When a user interacts with the Kanban board, the UI updates instantly. A debounced background request is then sent to the server to persist the new layout, effectively hiding network latency from the user.

## Project Structure
```text
MetaCollab/
├── app/                  # Next.js App Router (Pages & API Routes)
│   ├── (auth)/           # Clerk authentication boundaries
│   ├── api/              # Secure backend API endpoints
│   ├── dashboard/        # User dashboard and settings
│   └── projects/[id]/    # Project-specific views (Board, Chat)
├── components/           # Reusable React components
│   ├── chat/             # Transient messaging UI
│   ├── project/          # Kanban board and task components
│   ├── realtime/         # Pusher subscription wrappers
│   └── ui/               # shadcn/ui primitives
├── hooks/                # Custom React hooks (real-time listeners, theme)
├── lib/                  # Core utilities (Prisma client, Pusher config, Schemas)
├── prisma/               # Database schema and migration files
├── services/             # Abstraction layer for data fetching and API calls
└── store/                # Zustand state slices (Project, Task, UI, Invitation)
```

## Installation
Ensure you have Node.js 18+ and a local or remote PostgreSQL instance running.

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/metacollab.git
cd metacollab

# 2. Install dependencies (Requires --legacy-peer-deps for React 19 compatibility)
npm install --legacy-peer-deps

# 3. Synchronize Prisma Schema
npx prisma generate
npx prisma db push
```

## Usage
Once configured, start the development server:

```bash
# Start development server
npm run dev

# Run static type-checking and linting
npm run check-all

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables
Create a `.env.local` file in the root directory and configure the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Pusher Realtime
PUSHER_APP_ID="your_pusher_app_id"
NEXT_PUBLIC_PUSHER_KEY="your_pusher_key"
PUSHER_SECRET="your_pusher_secret"
NEXT_PUBLIC_PUSHER_CLUSTER="your_cluster"
```

## Future Improvements
- **Comprehensive Testing:** Implement end-to-end testing via Playwright to ensure seamless drag-and-drop workflows.
- **Analytics Dashboard:** Aggregate task completion metrics and burndown charts for deeper project insights.

---
