"use client";

import { Doc, Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { X, User, Calendar, Tag, Activity, FileText, MessageSquare } from "lucide-react";
import { useState } from "react";

// Temporary workaround: use string instead of Id<"tasks"> to build issue
type TaskId = string;

interface TaskDetailPanelProps {
  taskId: TaskId | null;
  onClose: () => void;
}

const STATUS_LABELS: Record<Doc<"tasks">["status"], string> = {
  inbox: "Inbox",
  assigned: "Assigned",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
  blocked: "Blocked",
};

const STATUS_COLORS: Record<Doc<"tasks">["status"], string> = {
  inbox: "bg-gray-100 text-gray-700",
  assigned: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
};

const PRIORITY_LABELS: Record<Doc<"tasks">["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_COLORS: Record<Doc<"tasks">["priority"], string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
  const task = useQuery(api.tasks.get, taskId ? { id: taskId as Id<"tasks"> } : "skip");
  const assignees = useQuery(api.agents.getByIds, { ids: task?.assigneeIds ?? [] });
  const activities = useQuery(api.activities.listByTask, {
    taskId: taskId as Id<"tasks">,
    limit: 50,
  });

  const updateTask = useMutation(api.tasks.update);

  if (!taskId || !task) {
    return null;
  }

  const handleStatusChange = async (newStatus: Doc<"tasks">["status"]) => {
    await updateTask({ id: task._id as Id<"tasks">, status: newStatus });
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div className="lg:hidden fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">タスク詳細</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Title & Description */}
            <div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                  {task.description}
                </p>
              )}
            </div>

            {/* Status & Priority */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">ステータス</label>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value as Doc<"tasks">["status"])}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">優先度</label>
                <span className={cn(
                  "inline-block px-2 py-1 rounded-full text-sm font-medium",
                  PRIORITY_COLORS[task.priority]
                )}>
                  {PRIORITY_LABELS[task.priority]}
                </span>
              </div>
            </div>

            {/* Assignees */}
            {assignees && assignees.length > 0 && (
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">担当者</label>
                <div className="flex flex-wrap gap-2">
                  {assignees.map((agent) => (
                    <div key={agent._id} className="flex items-center gap-1.5 bg-gray-100 rounded-full px-2.5 py-1">
                      <span>{agent.emoji}</span>
                      <span className="text-sm">{agent.displayName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">タグ</label>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1 text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded-full">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-zinc-600">
                <Calendar className="w-4 h-4" />
                <span>作成: {new Date(task.createdAt).toLocaleDateString("ja-JP")}</span>
              </div>
              {task.updatedAt && (
                <div className="flex items-center gap-2 text-zinc-600">
                  <Activity className="w-4 h-4" />
                  <span>更新: {new Date(task.updatedAt).toLocaleDateString("ja-JP")}</span>
                </div>
              )}
            </div>

            {/* Activity Log */}
            {activities && activities.length > 0 && (
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-2 block">アクティビティログ</label>
                <div className="space-y-2">
                  {activities.slice(0, 10).map((activity) => (
                    <div key={activity._id} className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded">
                      <Activity className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-700 truncate">{activity.message}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {new Date(activity.createdAt).toLocaleString("ja-JP")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
