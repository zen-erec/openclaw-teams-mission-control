"use client";

import { useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  addDays,
  format,
  isToday,
  isSameDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import { Doc } from "@/convex/_generated/dataModel";
import { CalendarTaskCard } from "./CalendarTaskCard";
import type { Id } from "@/convex/_generated/dataModel";

interface WeeklyGridProps {
  weekStart: Date;
  tasks: Doc<"tasks">[];
  onSelectTask: (taskId: Id<"tasks">) => void;
}

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

export function WeeklyGrid({ weekStart, tasks, onSelectTask }: WeeklyGridProps) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<number, Doc<"tasks">[]>();
    for (let i = 0; i < 7; i++) {
      map.set(i, []);
    }
    for (const task of tasks) {
      if (!task.dueAt) continue;
      const taskDate = new Date(task.dueAt);
      for (let i = 0; i < 7; i++) {
        if (isSameDay(taskDate, days[i])) {
          map.get(i)!.push(task);
          break;
        }
      }
    }
    return map;
  }, [tasks, days]);

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 min-w-[700px] gap-px bg-zinc-200 rounded-lg overflow-hidden border border-zinc-200">
        {/* Header */}
        {days.map((day, i) => (
          <div
            key={i}
            className={
              "px-3 py-2 text-center text-sm font-medium " +
              (isToday(day)
                ? "bg-blue-50 text-blue-700"
                : "bg-zinc-50 text-zinc-600")
            }
          >
            <span className="block">{DAY_LABELS[i]}</span>
            <span className="block text-lg font-bold">
              {format(day, "d", { locale: ja })}
            </span>
            <span className="block text-xs text-zinc-400">
              {format(day, "M月", { locale: ja })}
            </span>
          </div>
        ))}

        {/* Cells */}
        {days.map((day, i) => {
          const dayTasks = tasksByDay.get(i) ?? [];
          return (
            <div
              key={`cell-${i}`}
              className={
                "min-h-[200px] p-2 space-y-1.5 " +
                (isToday(day) ? "bg-blue-50/50" : "bg-white")
              }
            >
              {dayTasks.map((task) => (
                <CalendarTaskCard
                  key={task._id}
                  task={task}
                  onClick={() => onSelectTask(task._id)}
                />
              ))}
              {dayTasks.length === 0 && (
                <div className="flex items-center justify-center h-full text-xs text-zinc-300">
                  -
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
