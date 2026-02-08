"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Doc } from "@/convex/_generated/dataModel";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { CreateTaskModal } from "./CreateTaskModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type Task = Doc<"tasks">;
type TaskStatus = Task["status"];

// Temporary workaround: use string instead of Id<"tasks"> to build issue
// This is a workaround for a TypeScript build issue where Id<"tasks"> is not being recognized
type TaskId = string;
type AgentId = string;

const STATUS_ORDER: TaskStatus[] = [
  "inbox",
  "assigned",
  "in_progress",
  "review",
  "done",
];

interface KanbanBoardProps {
  tasks: Task[];
  selectedTaskId?: TaskId | null;
  onSelectTask?: (taskId: TaskId) => void;
}

export function KanbanBoard({ tasks, selectedTaskId, onSelectTask }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  type StatusFilter = "all" | "todo" | "in_progress" | "review" | "done";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<AgentId | "all">(
    "all"
  );
  const [priorityFilter, setPriorityFilter] = useState<
    Task["priority"] | "all"
  >("all");
  const updateTask = useMutation(api.tasks.update);

  const agents = useQuery(api.agents.list, {});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const agentById = new Map((agents ?? []).map((a) => [a._id, a]));

  // Get unique assignees from tasks (IDs) and show human-friendly labels.
  const allAssignees = Array.from(new Set(tasks.flatMap((t) => t.assigneeIds)))
    .map((id) => {
      const agent = agentById.get(id);
      const label = agent ? `${agent.emoji} ${agent.displayName}` : String(id);
      return { id, label };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  // Apply filters
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== "all") {
      const matchesStatus =
        statusFilter === "todo"
          ? task.status === "inbox" || task.status === "assigned"
          : task.status === statusFilter;
      if (!matchesStatus) return false;
    }

    if (
      assigneeFilter !== "all" &&
      !task.assigneeIds.includes(assigneeFilter as any)
    ) {
      return false;
    }

    if (priorityFilter !== "all" && task.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  const tasksByStatus = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = filteredTasks
        .filter((t) => t.status === status)
        .sort((a, b) => b.createdAt - a.createdAt);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

  const findTaskById = (id: string) =>
    tasks.find((t) => t._id === id);

  const handleDragStart = (event: DragStartEvent) => {
    const task = findTaskById(event.active.id as string);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Visual feedback only - actual update happens on drag end
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = findTaskById(activeId);
    if (!activeTask) return;

    // Check if dropped on a column
    if (STATUS_ORDER.includes(overId as TaskStatus)) {
      const newStatus = overId as TaskStatus;
      if (activeTask.status !== newStatus) {
        await updateTask({
          id: activeTask._id as any,
          status: newStatus,
        });
      }
      return;
    }

    // Dropped on another task - use that task's status
    const overTask = findTaskById(overId);
    if (overTask && activeTask.status !== overTask.status) {
      await updateTask({
        id: activeTask._id as any,
        status: overTask.status,
      });
    }
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label
              htmlFor="status-filter"
              className="text-xs font-medium text-zinc-700"
            >
              Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger id="status-filter" className="w-full" />
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="assignee-filter"
              className="text-xs font-medium text-zinc-700"
            >
              Assignee
            </label>
            <Select
              value={assigneeFilter}
              onValueChange={(v) =>
                setAssigneeFilter(v === "all" ? "all" : v)
              }
            >
              <SelectTrigger id="assignee-filter" className="w-full" />
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {allAssignees.map(({ id, label }) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="priority-filter"
              className="text-xs font-medium text-zinc-700"
            >
              Priority
            </label>
            <Select
              value={priorityFilter}
              onValueChange={(v) =>
                setPriorityFilter(v as Task["priority"] | "all")
              }
            >
              <SelectTrigger id="priority-filter" className="w-full" />
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setAssigneeFilter("all");
                setPriorityFilter("all");
              }}
              className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onAddTask={status === "inbox" ? () => setShowCreateModal(true) : undefined}
              onSelectTask={(taskId) => onSelectTask?.(taskId)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>

      {showCreateModal && (
        <CreateTaskModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  );
}
