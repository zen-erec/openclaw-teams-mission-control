"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Brain, FileText, Calendar, BookOpen, FolderOpen, Search, RefreshCw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "active" | "daily" | "longterm" | "references";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "active", label: "進行中タスク", icon: FileText },
  { key: "daily", label: "デイリーノート", icon: Calendar },
  { key: "longterm", label: "長期記憶", icon: BookOpen },
  { key: "references", label: "リファレンス", icon: FolderOpen },
];

interface FileInfo {
  name: string;
  size: number;
  modified: number;
}

interface SearchResult {
  file: string;
  lines: string[];
}

function formatDate(name: string) {
  const d = name.replace(".md", "");
  try {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
  } catch {
    return d;
  }
}

function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc prose-sm max-w-none prose-headings:text-zinc-800 prose-a:text-blue-600 prose-code:bg-zinc-100 prose-code:px-1 prose-code:rounded prose-pre:bg-zinc-900 prose-pre:text-zinc-100">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default function MemoryPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchContent = useCallback(async (t: Tab, file?: string) => {
    setLoading(true);
    try {
      let url = `/api/memory?type=${t}`;
      if (t === "daily" && file) url += `&date=${file.replace(".md", "")}`;
      if (t === "references" && file) url += `&file=${encodeURIComponent(file)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.content !== undefined) {
        setContent(data.content);
      } else if (data.files) {
        setFiles(data.files);
        setContent("");
      }
    } catch {
      setContent("# エラーが発生しました");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setSelectedFile(null);
    setContent("");
    setFiles([]);
    setSearchResults([]);
    setSearchQuery("");
    fetchContent(tab);
  }, [tab, fetchContent]);

  const handleFileSelect = (name: string) => {
    setSelectedFile(name);
    fetchContent(tab, name);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/memory?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {}
    setSearching(false);
  };

  const showFileList = (tab === "daily" || tab === "references") && !selectedFile && !content;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-7 h-7 text-zinc-600" />
        <h1 className="text-2xl font-bold text-zinc-900">メモリ</h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="メモリ内を検索..."
            className="w-full rounded-lg border border-zinc-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          {searching && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 animate-spin" />}
        </div>
      </form>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-6 space-y-2">
          <div className="text-sm font-medium text-zinc-500 mb-2">{searchResults.length}件の検索結果</div>
          {searchResults.map((r) => (
            <div key={r.file} className="bg-white rounded-lg border border-zinc-200 p-3">
              <div className="text-sm font-medium text-zinc-800 mb-1">{r.file}</div>
              {r.lines.map((l, i) => (
                <div key={i} className="text-xs text-zinc-600 bg-zinc-50 rounded px-2 py-1 mt-1 font-mono truncate">
                  {l}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-zinc-100 rounded-lg p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center",
                tab === t.key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-zinc-200 min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
          </div>
        ) : showFileList ? (
          <div className="divide-y divide-zinc-100">
            {selectedFile === null && files.length > 0 && (
              <>
                {files.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => handleFileSelect(f.name)}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-zinc-50 text-left transition-colors"
                  >
                    <FileText className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-800">
                        {tab === "daily" ? formatDate(f.name) : f.name}
                      </div>
                      <div className="text-xs text-zinc-400">{f.name}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300" />
                  </button>
                ))}
              </>
            )}
            {files.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                <FolderOpen className="w-8 h-8 mb-2" />
                <span className="text-sm">ファイルが見つかりません</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            {selectedFile && (
              <button
                onClick={() => { setSelectedFile(null); setContent(""); fetchContent(tab); }}
                className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 flex items-center gap-1"
              >
                ← 一覧に戻る
              </button>
            )}
            <MarkdownView content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
