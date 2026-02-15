"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { TaskDetailPanel } from "@/components/board/TaskDetailPanel";
import { CheckCircle2, Users, TrendingUp, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

export default function HomePage() {
  const tasks = useQuery(api.tasks.list, { limit: 100 });
  const agents = useQuery(api.agents.list);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);

  useEffect(() => {
    const syncFromLocation = () => {
      const taskId = new URLSearchParams(window.location.search).get("taskId");
      setSelectedTaskId((taskId as Id<"tasks"> | null) ?? null);
    };

    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  if (tasks === undefined || agents === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

  // Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeAgents = agents.filter(a => a.status === "active").length;

  // Calculate task counts per agent
  const agentTaskCounts = agents.reduce((acc, agent) => {
    const assignedTasks = tasks.filter(t =>
      t.assigneeIds?.includes(agent._id)
    );
    const completedTasks = assignedTasks.filter(t => t.status === "done");
    const inProgressTasks = assignedTasks.filter(t =>
      ["in_progress", "review"].includes(t.status)
    );

    acc[agent._id] = {
      total: assignedTasks.length,
      completed: completedTasks.length,
      inProgress: inProgressTasks.length,
      completionRate: assignedTasks.length > 0
        ? Math.round((completedTasks.length / assignedTasks.length) * 100)
        : 0,
      lastActivity: assignedTasks.length > 0
        ? Math.max(...assignedTasks.map(t => t.createdAt))
        : agent._creationTime,
    };
    return acc;
  }, {} as Record<string, {
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
    lastActivity: number;
  }>);

  // Agent statistics
  const totalAgents = agents.length;
  const averageTasks = totalAgents > 0
    ? Math.round(tasks.length / totalAgents)
    : 0;
  const averageCompletionRate = activeAgents > 0
    ? Math.round(
        agents
          .filter(a => a.status === "active")
          .reduce((sum, a) => sum + (agentTaskCounts[a._id]?.completionRate ?? 0), 0) /
          activeAgents
      )
    : 0;

  // Top 3 agents by completion count
  const topAgents = agents
    .filter(a => a.status === "active")
    .sort((a, b) => {
      const aCompleted = agentTaskCounts[a._id]?.completed ?? 0;
      const bCompleted = agentTaskCounts[b._id]?.completed ?? 0;
      return bCompleted - aCompleted;
    })
    .slice(0, 3);

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

  const setTaskIdInUrl = (taskId: Id<"tasks"> | null) => {
    const url = new URL(window.location.href);
    if (taskId) {
      url.searchParams.set("taskId", taskId);
    } else {
      url.searchParams.delete("taskId");
    }
    window.history.replaceState({}, "", url.toString());
  };

  const handleSelectTask = (taskId: Id<"tasks">) => {
    const next = selectedTaskId === taskId ? null : taskId;
    setSelectedTaskId(next);
    setTaskIdInUrl(next);
  };

  const handleCloseTask = () => {
    setSelectedTaskId(null);
    setTaskIdInUrl(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">タスクボード</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Total Tasks */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-500 mb-1">総タスク数</div>
                <div className="text-2xl font-bold text-zinc-900">{totalTasks}</div>
              </div>
              <CheckCircle2 className="w-10 h-10 text-zinc-200" />
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-500 mb-1">完了率</div>
                <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-200" />
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Active Agents */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-500 mb-1">アクティブエージェント</div>
                <div className="text-2xl font-bold text-zinc-900">{activeAgents}</div>
              </div>
              <Users className="w-10 h-10 text-zinc-200" />
            </div>
          </div>
        </div>

        {/* Agent Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-zinc-900">エージェント統計</h2>
            </div>
            <Link
              href="/agents"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              エージェント一覧へ
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {/* Total Agents */}
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-900">{totalAgents}</div>
              <div className="text-sm text-zinc-500">総エージェント数</div>
            </div>

            {/* Active Agents */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{activeAgents}</div>
              <div className="text-sm text-zinc-500">アクティブ</div>
            </div>

            {/* Average Tasks */}
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-900">{averageTasks}</div>
              <div className="text-sm text-zinc-500">平均担当タスク</div>
            </div>

            {/* Average Completion Rate */}
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{averageCompletionRate}%</div>
              <div className="text-sm text-zinc-500">平均完了率</div>
            </div>
          </div>

          {/* Top 3 Agents */}
          {topAgents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-yellow-600" />
                <h3 className="text-sm font-medium text-zinc-900">トップエージェント（完了数順）</h3>
              </div>
              <div className="space-y-2">
                {topAgents.map((agent, index) => {
                  const counts = agentTaskCounts[agent._id];
                  const medalColor = index === 0 ? "text-yellow-600" : index === 1 ? "text-gray-500" : "text-amber-700";
                  const bgColor = index === 0 ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200";

                  return (
                    <div
                      key={agent._id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${bgColor}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-bold ${medalColor}`}>
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </div>
                        <div className="text-xl">{agent.emoji}</div>
                        <div>
                          <div className="font-medium text-zinc-900">{agent.displayName}</div>
                          <div className="text-xs text-zinc-500">@{agent.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-zinc-900">
                          {counts?.completed ?? 0} / {counts?.total ?? 0}
                        </div>
                        <div className="text-xs text-zinc-500">
                          完了率: {counts?.completionRate ?? 0}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <KanbanBoard
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={handleSelectTask}
        />
      </div>

      {selectedTaskId && (
        <TaskDetailPanel taskId={selectedTaskId} onClose={handleCloseTask} />
      )}
    </div>
  );
}
