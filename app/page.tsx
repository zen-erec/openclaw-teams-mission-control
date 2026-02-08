"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { TaskDetailPanel } from "@/components/board/TaskDetailPanel";
import { CheckCircle2, Users, Clock } from "lucide-react";

// Temporary workaround: use string instead of Id<"tasks"> to build issue
type TaskId = string;

export default function HomePage() {
  const tasks = useQuery(api.tasks.list, { limit: 100 });
  const agents = useQuery(api.agents.list);
  const [selectedTaskId, setSelectedTaskId] = useState<TaskId | null>(null);

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
  const inProgressTasks = tasks.filter(t => ["in_progress", "review"].includes(t.status)).length;
  const blockedTasks = tasks.filter(t => t.status === "blocked").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeAgents = agents.filter(a => a.status === "active").length;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">タスクボード</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

          {/* In Progress */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-500 mb-1">進行中</div>
                <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
              </div>
              <Clock className="w-10 h-10 text-blue-200" />
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

        <KanbanBoard tasks={tasks} selectedTaskId={selectedTaskId} onSelectTask={setSelectedTaskId} />
      </div>

      {selectedTaskId && (
        <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
}
