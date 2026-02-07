"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KanbanBoard } from "@/components/board/KanbanBoard";

export default function HomePage() {
  const tasks = useQuery(api.tasks.list, { limit: 100 });

  if (tasks === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">タスクボード</h1>
      </div>
      <KanbanBoard tasks={tasks} />
    </div>
  );
}
