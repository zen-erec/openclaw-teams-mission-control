"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { User, CheckCircle2, Clock, Activity } from "lucide-react";

interface AgentCardProps {
  agent: Doc<"agents">;
  taskCounts: {
    total: number;
    completed: number;
    inProgress: number;
    lastActivity: number;
  };
}

export function AgentCard({ agent, taskCounts }: AgentCardProps) {
  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "直近";
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return new Date(timestamp).toLocaleDateString("ja-JP");
  };

  const completionRate = taskCounts.total > 0
    ? Math.round((taskCounts.completed / taskCounts.total) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{agent.emoji}</div>
          <div>
            <h3 className="font-semibold text-zinc-900">{agent.displayName}</h3>
            <p className="text-sm text-zinc-500">@{agent.name}</p>
          </div>
        </div>
        <span className={cn(
          "px-2 py-1 text-xs font-medium rounded-full",
          agent.status === "active"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-700"
        )}>
          {agent.status === "active" ? "アクティブ" : "非アクティブ"}
        </span>
      </div>

      {/* Role */}
      <div className="mb-4">
        <p className="text-sm text-zinc-600">{agent.role}</p>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        {/* Total Tasks */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-zinc-600">
            <User className="w-4 h-4" />
            <span>担当タスク</span>
          </div>
          <span className="font-semibold text-zinc-900">{taskCounts.total}</span>
        </div>

        {/* Completed */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-zinc-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>完了</span>
          </div>
          <span className="font-semibold text-green-600">{taskCounts.completed}</span>
        </div>

        {/* In Progress */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-zinc-600">
            <Clock className="w-4 h-4" />
            <span>進行中</span>
          </div>
          <span className="font-semibold text-blue-600">{taskCounts.inProgress}</span>
        </div>

        {/* Completion Rate */}
        {taskCounts.total > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-zinc-600">完了率</span>
              <span className="font-semibold text-zinc-900">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}

        {/* Last Activity */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 pt-2">
          <Activity className="w-4 h-4" />
          <span>最終活動: {formatDate(taskCounts.lastActivity)}</span>
        </div>
      </div>
    </div>
  );
}
