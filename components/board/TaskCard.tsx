"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { GripVertical, User, Tag } from "lucide-react";

type Task = Doc<"tasks">;

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const PRIORITY_LABELS: Record<Task["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const firstTag = task.tags?.[0];
  const extraTagCount = Math.max(0, (task.tags?.length ?? 0) - 1);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white rounded-lg border border-zinc-200 p-3 shadow-sm hover:shadow-md transition-shadow",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-1 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-zinc-900 truncate">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                PRIORITY_COLORS[task.priority]
              )}
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
            {firstTag && (
              <span className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                <Tag size={10} />
                {firstTag}
                {extraTagCount > 0 ? ` +${extraTagCount}` : null}
              </span>
            )}
            {task.assigneeIds.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <User size={12} />
                {task.assigneeIds.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
