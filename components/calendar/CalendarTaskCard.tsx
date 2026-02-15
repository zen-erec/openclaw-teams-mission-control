"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Task = Doc<"tasks">;

const PRIORITY_BORDER: Record<Task["priority"], string> = {
  low: "border-l-blue-400",
  medium: "border-l-yellow-400",
  high: "border-l-orange-400",
  urgent: "border-l-red-500",
};

const STATUS_BADGE: Record<Task["status"], string> = {
  inbox: "bg-gray-100 text-gray-600",
  assigned: "bg-blue-100 text-blue-600",
  in_progress: "bg-yellow-100 text-yellow-600",
  review: "bg-purple-100 text-purple-600",
  done: "bg-green-100 text-green-600",
  blocked: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<Task["status"], string> = {
  inbox: "Inbox",
  assigned: "Assigned",
  in_progress: "進行中",
  review: "Review",
  done: "Done",
  blocked: "Blocked",
};

interface CalendarTaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function CalendarTaskCard({ task, onClick }: CalendarTaskCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md border border-zinc-200 border-l-4 bg-white p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
        PRIORITY_BORDER[task.priority]
      )}
    >
      <p className="text-xs font-medium text-zinc-900 truncate">{task.title}</p>
      <span
        className={cn(
          "mt-1 inline-block text-[10px] leading-tight px-1.5 py-0.5 rounded-full font-medium",
          STATUS_BADGE[task.status]
        )}
      >
        {STATUS_LABELS[task.status]}
      </span>
    </button>
  );
}
