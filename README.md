# Mission Control

Task management dashboard for the multi-agent system.

## Setup

### 1. Install Dependencies

```bash
cd mission-control
npm install
```

### 2. Create Convex Project

```bash
npx convex dev
```

First run will prompt you to create a project.

### 3. Register Agents

```bash
npx convex run agents:seedAgents
```

### 4. Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 5. Start Development Server

```bash
# Start Convex and Next.js together
npm run convex:dev &
npm run dev
```

Open http://localhost:3000 in your browser

## Features

### Kanban Board

- **Drag & Drop**: Move tasks between columns
- **Real-time Updates**: Convex reactive queries
- **Task Creation**: Add new tasks to Inbox
- **Status Management**: inbox → assigned → in_progress → review → done

### CLI Operations

```bash
# List tasks
npx convex run tasks:list

# Tasks by status
npx convex run tasks:listByStatus '{"status": "inbox"}'

# Create task
npx convex run tasks:create '{"title": "New task", "description": "Details"}'

# Send message
npx convex run messages:create '{"taskId": "xxx", "content": "@loki Please review"}'

# Check notifications
npx convex run notifications:getUnread '{"agentId": "xxx"}'
```

### Notification Daemon

```bash
# Direct run
npm run daemon:notify

# Run with pm2
pm2 start scripts/notification-daemon.ts --name notify-daemon --interpreter ts-node
```

## Schema

### Tables

| Table | Description |
|-------|-------------|
| agents | Agent info |
| tasks | Tasks |
| messages | Task comments |
| activities | Activity feed |
| documents | Documents & deliverables |
| notifications | @mention notifications |
| subscriptions | Task subscriptions |

### Task Status Flow

```
inbox → assigned → in_progress → review → done
                         ↓
                      blocked
```

## Project Structure

```
mission-control/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          # Kanban Board
├── components/
│   └── board/
│       ├── KanbanBoard.tsx
│       ├── Column.tsx
│       ├── TaskCard.tsx
│       └── CreateTaskModal.tsx
├── convex/
│   ├── schema.ts
│   ├── tasks.ts
│   ├── messages.ts
│   ├── notifications.ts
│   ├── activities.ts
│   └── agents.ts
├── lib/
│   └── utils.ts
├── scripts/
│   └── notification-daemon.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Architecture

```
┌─────────────────────────────────────┐
│         Mission Control UI          │
│    (Next.js + Kanban Board)         │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│           Convex DB                 │
│  ┌─────┬────────┬──────────────┐   │
│  │tasks│messages│notifications │   │
│  └─────┴────────┴──────────────┘   │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│     Notification Daemon             │
│   (Poll → OpenClaw sessions)        │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│        OpenClaw Gateway             │
│   (10 Agent Sessions)               │
└─────────────────────────────────────┘
```
