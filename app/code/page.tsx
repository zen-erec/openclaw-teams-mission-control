"use client";

import { useEffect, useState } from "react";
import { GitBranch, GitCommit, RefreshCw, Circle, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepoInfo {
  name: string;
  path: string;
  branch: string;
  lastCommit: string;
  lastCommitDate: string;
  status: string;
  ahead: number;
  behind: number;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function CodePipelinePage() {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/code-pipeline");
      const data = await res.json();
      setRepos(data.repos || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const dirtyCount = repos.filter((r) => r.status === "dirty").length;
  const aheadCount = repos.filter((r) => r.ahead > 0).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">コードパイプライン</h1>
        <button
          onClick={fetchRepos}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200 transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          更新
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-sm text-zinc-500">リポジトリ数</div>
          <div className="text-2xl font-bold">{repos.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-sm text-zinc-500">クリーン</div>
          <div className="text-2xl font-bold text-green-600">{repos.length - dirtyCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-sm text-zinc-500">未コミット変更</div>
          <div className="text-2xl font-bold text-yellow-600">{dirtyCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="text-sm text-zinc-500">未プッシュ</div>
          <div className="text-2xl font-bold text-blue-600">{aheadCount}</div>
        </div>
      </div>

      {/* Repo List */}
      <div className="space-y-3">
        {repos.map((repo) => (
          <div key={repo.path} className="bg-white rounded-lg border border-zinc-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    repo.status === "clean" ? "bg-green-500" : "bg-yellow-500"
                  )}
                />
                <div>
                  <div className="text-base font-semibold text-zinc-900">{repo.name}</div>
                  <div className="text-xs text-zinc-400 font-mono">{repo.path}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {repo.ahead > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    <ArrowUp className="w-3 h-3" /> {repo.ahead}
                  </span>
                )}
                {repo.behind > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    <ArrowDown className="w-3 h-3" /> {repo.behind}
                  </span>
                )}
                <span
                  className={cn(
                    "text-xs font-medium rounded-full px-2 py-0.5",
                    repo.status === "clean"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  )}
                >
                  {repo.status === "clean" ? "クリーン" : "変更あり"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
              <div className="flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5" />
                <span className="font-mono">{repo.branch}</span>
              </div>
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <GitCommit className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{repo.lastCommit || "—"}</span>
              </div>
              <div className="text-xs text-zinc-400 flex-shrink-0">{formatDate(repo.lastCommitDate)}</div>
            </div>
          </div>
        ))}

        {repos.length === 0 && !loading && (
          <div className="text-center py-12 text-zinc-400">
            リポジトリが見つかりません
          </div>
        )}
      </div>
    </div>
  );
}
