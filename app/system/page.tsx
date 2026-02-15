"use client";

import { useEffect, useState } from "react";
import { Cpu, HardDrive, MemoryStick, Server, RefreshCw, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemData {
  memory: { total: number; used: number; free: number; percentUsed: number };
  cpu: { model: string; cores: number; loadAvg: number[] };
  disk: { total: string; used: string; available: string; percent: string };
  system: { platform: string; arch: string; hostname: string; uptime: number; nodeVersion: string };
  gateway: string;
}

function formatBytes(bytes: number) {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}日 ${hours}時間`;
  if (hours > 0) return `${hours}時間 ${mins}分`;
  return `${mins}分`;
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-zinc-200 rounded-full h-2.5">
      <div
        className={cn("h-2.5 rounded-full transition-all", color)}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export default function SystemHealthPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system-health");
      setData(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const diskPercent = data?.disk?.percent ? parseInt(data.disk.percent) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">システムヘルス</h1>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200 transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          更新
        </button>
      </div>

      {!data ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* System Info */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-zinc-500" />
              <h2 className="text-lg font-semibold">システム情報</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-zinc-500">ホスト名</div>
                <div className="font-medium">{data.system.hostname}</div>
              </div>
              <div>
                <div className="text-zinc-500">プラットフォーム</div>
                <div className="font-medium">{data.system.platform} ({data.system.arch})</div>
              </div>
              <div>
                <div className="text-zinc-500">稼働時間</div>
                <div className="font-medium">{formatUptime(data.system.uptime)}</div>
              </div>
              <div>
                <div className="text-zinc-500">Node.js</div>
                <div className="font-medium">{data.system.nodeVersion}</div>
              </div>
            </div>
          </div>

          {/* Gateway Status */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-5 h-5 text-zinc-500" />
              <h2 className="text-lg font-semibold">Gateway ステータス</h2>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  data.gateway === "running" ? "bg-green-500" : "bg-red-500"
                )}
              />
              <span className="text-sm font-medium">
                {data.gateway === "running" ? "稼働中" : data.gateway === "stopped" ? "停止" : "不明"}
              </span>
            </div>
          </div>

          {/* CPU */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-zinc-500" />
              <h2 className="text-lg font-semibold">CPU</h2>
            </div>
            <div className="text-sm text-zinc-600 mb-3">{data.cpu.model} — {data.cpu.cores}コア</div>
            <div className="grid grid-cols-3 gap-4">
              {["1分", "5分", "15分"].map((label, i) => (
                <div key={i}>
                  <div className="text-xs text-zinc-500 mb-1">負荷 ({label})</div>
                  <div className="text-xl font-bold">{data.cpu.loadAvg[i]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Memory */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MemoryStick className="w-5 h-5 text-zinc-500" />
              <h2 className="text-lg font-semibold">メモリ</h2>
            </div>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span>{formatBytes(data.memory.used)} / {formatBytes(data.memory.total)}</span>
              <span className="font-medium">{data.memory.percentUsed}%</span>
            </div>
            <ProgressBar
              value={data.memory.percentUsed}
              color={data.memory.percentUsed > 90 ? "bg-red-500" : data.memory.percentUsed > 70 ? "bg-yellow-500" : "bg-green-500"}
            />
          </div>

          {/* Disk */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="w-5 h-5 text-zinc-500" />
              <h2 className="text-lg font-semibold">ディスク</h2>
            </div>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span>{data.disk.used} / {data.disk.total}</span>
              <span className="font-medium">{data.disk.percent}</span>
            </div>
            <ProgressBar
              value={diskPercent}
              color={diskPercent > 90 ? "bg-red-500" : diskPercent > 70 ? "bg-yellow-500" : "bg-green-500"}
            />
            <div className="text-xs text-zinc-500 mt-1">残り: {data.disk.available}</div>
          </div>
        </div>
      )}
    </div>
  );
}
