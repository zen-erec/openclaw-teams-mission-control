"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CronJob {
  id: string;
  agentId: string;
  name: string;
  enabled: boolean;
  schedule: { kind: string; expr: string };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
    consecutiveErrors?: number;
  };
}

function formatTime(ms: number | undefined) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number | undefined) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusBadge({ status, errors }: { status?: string; errors?: number }) {
  if (!status) return <span className="text-zinc-400 text-sm">未実行</span>;
  const isOk = status === "ok";
  const hasErrors = (errors || 0) > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isOk && !hasErrors && "bg-green-100 text-green-700",
        isOk && hasErrors && "bg-yellow-100 text-yellow-700",
        !isOk && "bg-red-100 text-red-700"
      )}
    >
      {isOk && !hasErrors && <CheckCircle2 className="w-3 h-3" />}
      {isOk && hasErrors && <AlertTriangle className="w-3 h-3" />}
      {!isOk && <XCircle className="w-3 h-3" />}
      {status}
      {hasErrors ? ` (${errors}エラー)` : ""}
    </span>
  );
}

export default function CronHealthPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cron-health");
      const data = await res.json();
      setJobs(data.jobs || []);
      setError(data.error || null);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const enabledJobs = jobs.filter((j) => j.enabled);
  const disabledJobs = jobs.filter((j) => !j.enabled);
  const healthyCount = enabledJobs.filter(
    (j) => j.state?.lastStatus === "ok" && (j.state?.consecutiveErrors || 0) === 0
  ).length;
  const errorCount = enabledJobs.filter(
    (j) => j.state?.lastStatus !== "ok" || (j.state?.consecutiveErrors || 0) > 0
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Cronジョブ監視</h1>
        <button
          onClick={fetchJobs}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200 transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          更新
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-sm text-zinc-500">総ジョブ数</div>
          <div className="text-2xl font-bold">{jobs.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-sm text-zinc-500">有効</div>
          <div className="text-2xl font-bold text-green-600">{enabledJobs.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-sm text-zinc-500">正常</div>
          <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-sm text-zinc-500">エラーあり</div>
          <div className="text-2xl font-bold text-red-600">{errorCount}</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Jobs Table */}
      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">ジョブ名</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">エージェント</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">スケジュール</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">ステータス</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">最終実行</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">実行時間</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">次回実行</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {jobs.map((job) => (
              <tr key={job.id} className={cn(!job.enabled && "opacity-50")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span className="font-medium">{job.name}</span>
                    {!job.enabled && (
                      <span className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">無効</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">{job.agentId}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{job.schedule?.expr}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={job.state?.lastStatus}
                    errors={job.state?.consecutiveErrors}
                  />
                </td>
                <td className="px-4 py-3 text-zinc-500">{formatTime(job.state?.lastRunAtMs)}</td>
                <td className="px-4 py-3 text-zinc-500">{formatDuration(job.state?.lastDurationMs)}</td>
                <td className="px-4 py-3 text-zinc-500">{formatTime(job.state?.nextRunAtMs)}</td>
              </tr>
            ))}
            {jobs.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                  Cronジョブが見つかりません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
