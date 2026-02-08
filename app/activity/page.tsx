"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ActivityFeed, ActivityFilter } from "@/components/activity/ActivityFeed";
import { useState } from "react";
import { Activity } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

export default function ActivityPage() {
  const [filterType, setFilterType] = useState<Doc<"activities">["type"] | undefined>(
    undefined
  );

  const activities = useQuery(api.activities.recent, {
    limit: 100,
    type: filterType,
  });

  const tasks = useQuery(api.tasks.list, { limit: 100 });
  const agents = useQuery(api.agents.list);

  if (activities === undefined || tasks === undefined || agents === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-zinc-900" />
          <h1 className="text-2xl font-bold text-zinc-900">アクティビティフィード</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-zinc-500 mb-1">総アクティビティ</div>
          <div className="text-2xl font-bold text-zinc-900">{activities.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-zinc-500 mb-1">アクティブエージェント</div>
          <div className="text-2xl font-bold text-zinc-900">
            {agents.filter(a => a.status === "active").length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-zinc-500 mb-1">完了タスク</div>
          <div className="text-2xl font-bold text-green-600">
            {tasks.filter(t => t.status === "done").length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-zinc-500 mb-1">進行中</div>
          <div className="text-2xl font-bold text-blue-600">
            {tasks.filter(t => ["in_progress", "review"].includes(t.status)).length}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <ActivityFilter currentType={filterType} onTypeChange={setFilterType} />
      </div>

      {/* Feed */}
      <ActivityFeed
        activities={activities}
        tasks={tasks}
        agents={agents}
        filterType={filterType}
      />
    </div>
  );
}
