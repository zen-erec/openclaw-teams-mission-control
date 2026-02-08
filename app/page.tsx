"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { TaskDetailPanel } from "@/components/board/TaskDetailPanel";
import { CheckCircle2, Users } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export default function HomePage() {
  const tasks = useQuery(api.tasks.list, { limit: 100 });
  const agents = useQuery(api.agents.list);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);

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

  useEffect(() => {
    const syncFromLocation = () => {
      const taskId = new URLSearchParams(window.location.search).get("taskId");
      setSelectedTaskId((taskId as Id<"tasks"> | null) ?? null);
    };

    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

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
