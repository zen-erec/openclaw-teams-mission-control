"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { WeeklyGrid } from "@/components/calendar/WeeklyGrid";
import { TaskDetailPanel } from "@/components/board/TaskDetailPanel";
import type { Id } from "@/convex/_generated/dataModel";

export default function CalendarPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);

  const weekEnd = useMemo(
    () => endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
    [currentWeekStart]
  );

  const startTime = startOfDay(currentWeekStart).getTime();
  const endTime = endOfDay(weekEnd).getTime();

  const tasks = useQuery(api.tasks.listByDueRange, { startTime, endTime });

  const goToPrevWeek = () => setCurrentWeekStart((w) => subWeeks(w, 1));
  const goToNextWeek = () => setCurrentWeekStart((w) => addWeeks(w, 1));
  const goToToday = () =>
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const headerLabel = `${format(currentWeekStart, "yyyy年M月d日", { locale: ja })} - ${format(weekEnd, "M月d日", { locale: ja })}`;

  const handleSelectTask = (taskId: Id<"tasks">) => {
    setSelectedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  const handleCloseTask = () => setSelectedTaskId(null);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-zinc-700" />
            <h1 className="text-2xl font-bold text-zinc-900">カレンダー</h1>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4 bg-white rounded-lg border border-zinc-200 p-3">
          <button
            onClick={goToPrevWeek}
            className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-600" />
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-zinc-900">
              {headerLabel}
            </span>
            <button
              onClick={goToToday}
              className="text-xs px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors font-medium"
            >
              今日
            </button>
          </div>

          <button
            onClick={goToNextWeek}
            className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </button>
        </div>

        {/* Grid */}
        {tasks === undefined ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
          </div>
        ) : (
          <WeeklyGrid
            weekStart={currentWeekStart}
            tasks={tasks}
            onSelectTask={handleSelectTask}
          />
        )}
      </div>

      {selectedTaskId && (
        <TaskDetailPanel taskId={selectedTaskId} onClose={handleCloseTask} />
      )}
    </div>
  );
}
