"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Doc } from "@/convex/_generated/dataModel";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

type Task = Doc<"tasks">;
type TaskStatus = Task["status"];

const STATUS_LABELS: Record<TaskStatus, string> = {
  inbox: "Inbox",
  assigned: "Assigned",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
  blocked: "Blocked",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  inbox: "border-t-zinc-400",
  assigned: "border-t-blue-400",
  in_progress: "border-t-yellow-400",
  review: "border-t-purple-400",
  done: "border-t-green-400",
  blocked: "border-t-red-400",
};

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask?: () => void;
}

export function Column({ status, tasks, onAddTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className={cn(
        "flex flex-col bg-zinc-50 rounded-lg border-t-4 min-h-[500px] w-72 flex-shrink-0",
        STATUS_COLORS[status]
      )}
    >
      <div className="p-3 border-b border-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-700">
            {STATUS_LABELS[status]}
          </h3>
          <span className="text-xs text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 space-y-2 overflow-y-auto transition-colors",
          isOver && "bg-zinc-100"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </SortableContext>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="w-full p-2 border-2 border-dashed border-zinc-300 rounded-lg text-zinc-500 hover:border-zinc-400 hover:text-zinc-600 transition-colors flex items-center justify-center gap-1 text-sm"
          >
            <Plus size={16} />
            タスク追加
          </button>
        )}
      </div>
    </div>
  );
}
