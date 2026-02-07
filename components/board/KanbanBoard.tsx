"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
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
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { CreateTaskModal } from "./CreateTaskModal";

type Task = Doc<"tasks">;
type TaskStatus = Task["status"];

const STATUS_ORDER: TaskStatus[] = [
  "inbox",
  "assigned",
  "in_progress",
  "review",
  "done",
];

interface KanbanBoardProps {
  tasks: Task[];
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const updateTask = useMutation(api.tasks.update);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasksByStatus = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = tasks
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
          id: activeTask._id as Id<"tasks">,
          status: newStatus,
        });
      }
      return;
    }

    // Dropped on another task - use that task's status
    const overTask = findTaskById(overId);
    if (overTask && activeTask.status !== overTask.status) {
      await updateTask({
        id: activeTask._id as Id<"tasks">,
        status: overTask.status,
      });
    }
  };

  return (
    <>
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
