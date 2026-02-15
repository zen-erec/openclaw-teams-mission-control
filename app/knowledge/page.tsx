"use client";

import { useState, useEffect } from "react";
import { Search, FileText, FolderOpen, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileInfo {
  path: string;
  size: number;
  modified: number;
}

interface SearchResult {
  path: string;
  matches: string[];
  score: number;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"browse" | "search">("browse");

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge");
      const data = await res.json();
      setFiles(data.files || []);
      setTotalFiles(data.total || 0);
      setMode("browse");
    } catch {}
    setLoading(false);
  };

  const searchFiles = async (q: string) => {
    if (!q.trim()) {
      fetchFiles();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setMode("search");
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchFiles(query);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">ナレッジ検索</h1>
        <span className="text-sm text-zinc-500">
          {mode === "browse" ? `${totalFiles}ファイル` : `${results.length}件の結果`}
        </span>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ワークスペース内を検索..."
            className="w-full rounded-lg border border-zinc-300 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          {loading && (
            <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 animate-spin" />
          )}
        </div>
      </form>

      {/* Browse Mode */}
      {mode === "browse" && (
        <div className="bg-white rounded-lg border border-zinc-200 divide-y divide-zinc-100">
          {files.map((file) => (
            <div key={file.path} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50">
              <FileText className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-800 truncate">{file.path}</div>
              </div>
              <div className="text-xs text-zinc-400 flex-shrink-0">{formatSize(file.size)}</div>
              <div className="text-xs text-zinc-400 flex-shrink-0">{formatDate(file.modified)}</div>
            </div>
          ))}
          {files.length === 0 && !loading && (
            <div className="px-4 py-8 text-center text-zinc-400">
              <FolderOpen className="w-8 h-8 mx-auto mb-2" />
              ファイルが見つかりません
            </div>
          )}
        </div>
      )}

      {/* Search Mode */}
      {mode === "search" && (
        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.path} className="bg-white rounded-lg border border-zinc-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-800">{r.path}</span>
                <span className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                  スコア: {r.score}
                </span>
              </div>
              {r.matches.length > 0 && (
                <div className="space-y-1">
                  {r.matches.map((m, i) => (
                    <div
                      key={i}
                      className="text-xs text-zinc-600 bg-zinc-50 rounded px-3 py-1.5 font-mono truncate"
                    >
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-zinc-400">
              <Search className="w-8 h-8 mx-auto mb-2" />
              検索結果がありません
            </div>
          )}
        </div>
      )}
    </div>
  );
}
