"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AgentCard } from "@/components/agents/AgentCard";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export default function AgentsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<Id<"agents"> | null>(null);
  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list, { limit: 100 });

  useEffect(() => {
    const syncFromLocation = () => {
      const agentId = new URLSearchParams(window.location.search).get("agentId");
      setSelectedAgentId((agentId as Id<"agents"> | null) ?? null);
    };

    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  useEffect(() => {
    if (!selectedAgentId || !agents) return;
    const el = document.getElementById(`agent-${selectedAgentId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedAgentId, agents]);

  if (agents === undefined || tasks === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

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
      lastActivity: assignedTasks.length > 0
        ? Math.max(...assignedTasks.map(t => t.createdAt))
        : agent._creationTime,
    };
    return acc;
  }, {} as Record<string, { total: number; completed: number; inProgress: number; lastActivity: number }>);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">エージェント一覧</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const counts = agentTaskCounts[agent._id] || {
            total: 0,
            completed: 0,
            inProgress: 0,
            lastActivity: agent._creationTime,
          };

          return (
            <div
              key={agent._id}
              id={`agent-${agent._id}`}
              className={cn(
                selectedAgentId === agent._id &&
                  "ring-2 ring-zinc-900 ring-offset-2 ring-offset-zinc-100 rounded-lg"
              )}
            >
              <AgentCard agent={agent} taskCounts={counts} />
            </div>
          );
        })}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <p>エージェントが登録されていません</p>
        </div>
      )}
    </div>
  );
}
