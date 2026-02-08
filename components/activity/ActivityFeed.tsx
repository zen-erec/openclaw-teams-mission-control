"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Clock,
} from "lucide-react";

interface ActivityFeedProps {
  activities: Doc<"activities">[];
  tasks?: Doc<"tasks">[];
  agents?: Doc<"agents">[];
  filterType?: Doc<"activities">["type"];
}

type ActivityType = Doc<"activities">["type"];

// アクティビティタイプの設定
const activityConfig = {
  task_created: {
    icon: CheckCircle2,
    color: "text-blue-600 bg-blue-100",
    label: "タスク作成",
  },
  task_updated: {
    icon: Clock,
    color: "text-amber-600 bg-amber-100",
    label: "タスク更新",
  },
  task_completed: {
    icon: CheckCircle2,
    color: "text-green-600 bg-green-100",
    label: "タスク完了",
  },
  message_sent: {
    icon: MessageSquare,
    color: "text-purple-600 bg-purple-100",
    label: "メッセージ",
  },
  document_created: {
    icon: FileText,
    color: "text-cyan-600 bg-cyan-100",
    label: "ドキュメント",
  },
  agent_heartbeat: {
    icon: Activity,
    color: "text-gray-600 bg-gray-100",
    label: "ハートビート",
  },
  quality_gate_updated: {
    icon: AlertTriangle,
    color: "text-orange-600 bg-orange-100",
    label: "品質ゲート",
  },
  escalation: {
    icon: AlertTriangle,
    color: "text-red-600 bg-red-100",
    label: "エスカレーション",
  },
} as const satisfies Record<
  ActivityType,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    label: string;
  }
>;

export function ActivityFeed({ activities, tasks, agents, filterType }: ActivityFeedProps) {
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "たった今";
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return new Date(timestamp).toLocaleDateString("ja-JP");
  };

  const getAgent = (agentId?: Doc<"agents">["_id"]) => {
    if (!agentId) return null;
    return agents?.find((a) => a._id === agentId) ?? null;
  };

  const getTask = (taskId?: Doc<"tasks">["_id"]) => {
    if (!taskId) return null;
    return tasks?.find((t) => t._id === taskId) ?? null;
  };

  // filterTypeがある場合でフィルタリング
  const filteredActivities = filterType
    ? activities.filter(a => a.type === filterType)
    : activities;

  return (
    <div className="space-y-3">
      {filteredActivities.map((activity) => {
        const config = activityConfig[activity.type];
        const Icon = config.icon;
        const agent = getAgent(activity.agentId);
        const task = getTask(activity.taskId);

        return (
          <div
            key={activity._id}
            className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
          >
            {/* Icon */}
            <div className={cn("flex-shrink-0 p-2 rounded-lg", config.color)}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {/* Agent Name + Type Badge */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {activity.agentId && (
                      <Link
                        href={`/agents?agentId=${activity.agentId}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {agent ? `${agent.emoji} ${agent.displayName}` : "不明なエージェント"}
                      </Link>
                    )}
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full",
                      config.color
                    )}>
                      {config.label}
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-zinc-700 break-words">
                    {activity.message}
                  </p>

                  {/* Task Reference */}
                  {activity.taskId && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                      <FileText className="w-3 h-3" />
                      <Link
                        href={`/?taskId=${activity.taskId}`}
                        className="truncate hover:underline"
                        title={task?.title ?? String(activity.taskId)}
                      >
                        {task?.title ?? "タスクを開く"}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="flex-shrink-0">
                  <span className="text-xs text-zinc-400 whitespace-nowrap">
                    {formatTimestamp(activity.createdAt)}
                  </span>
                </div>
              </div>

              {/* Details */}
              {activity.details && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-zinc-600">
                  <pre className="whitespace-pre-wrap font-mono">
                    {JSON.stringify(activity.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {filteredActivities.length === 0 && (
        <div className="text-center py-8 text-zinc-500">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>アクティビティがありません</p>
        </div>
      )}
    </div>
  );
}

// アクティビティタイプフィルターコンポーネント
interface ActivityFilterProps {
  currentType: ActivityType | undefined;
  onTypeChange: (type: ActivityType | undefined) => void;
}

export function ActivityFilter({ currentType, onTypeChange }: ActivityFilterProps) {
  const filters: { value: ActivityType | undefined; label: string }[] = [
    { value: undefined, label: "すべて" },
    { value: "task_created", label: "タスク作成" },
    { value: "task_updated", label: "タスク更新" },
    { value: "task_completed", label: "タスク完了" },
    { value: "message_sent", label: "メッセージ" },
    { value: "document_created", label: "ドキュメント" },
    { value: "agent_heartbeat", label: "ハートビート" },
    { value: "quality_gate_updated", label: "品質ゲート" },
    { value: "escalation", label: "エスカレーション" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isSelected = currentType === filter.value;

        return (
          <button
            key={filter.value ?? "all"}
            onClick={() => onTypeChange(filter.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full transition-colors",
              isSelected
                ? "bg-zinc-900 text-white"
                : "bg-gray-100 text-zinc-700 hover:bg-gray-200"
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
