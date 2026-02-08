# TASK-008B Report: KanbanBoard Filtering

## Summary
- Added a responsive filter bar to the Kanban board with dropdowns for:
  - Status (Todo, In Progress, Review, Done)
  - Assignee (agent)
  - Priority (High, Medium, Low, Urgent)
- Filters are managed via `useState` and applied to the task list before rendering columns.

## Implementation Notes
- Implemented a lightweight `components/ui/select.tsx` dropdown component (shadcn-inspired API) using a native `<select>` to avoid new network-fetched dependencies in this environment.
- Status filter maps `Todo` to both `inbox` and `assigned` task statuses.
- Assignee dropdown shows agent-friendly labels (`emoji + displayName`) via `api.agents.list`.

## Files Changed
- `components/board/KanbanBoard.tsx`
- `components/ui/select.tsx`

## Verification
- `npm run build` (pass)

