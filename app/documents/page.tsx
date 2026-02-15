"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { FileText, Search, RefreshCw, Download, ArrowLeft, Filter, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocInfo {
  name: string;
  path: string;
  project: string;
  category: string;
  size: number;
  modified: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  "設計書": "bg-blue-100 text-blue-700",
  "レポート": "bg-green-100 text-green-700",
  "計画書": "bg-amber-100 text-amber-700",
  "ポリシー": "bg-purple-100 text-purple-700",
};

function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc prose-sm max-w-none prose-headings:text-zinc-800 prose-a:text-blue-600 prose-code:bg-zinc-100 prose-code:px-1 prose-code:rounded prose-pre:bg-zinc-900 prose-pre:text-zinc-100">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<{ content: string; name: string; path: string } | null>(null);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searching, setSearching] = useState(false);

  const fetchDocuments = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const url = query ? `/api/documents?q=${encodeURIComponent(query)}` : "/api/documents";
      const res = await fetch(url);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      setDocuments([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    await fetchDocuments(searchQuery || undefined);
    setSearching(false);
  };

  const handleDocClick = async (doc: DocInfo) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?path=${encodeURIComponent(doc.path)}`);
      const data = await res.json();
      setSelectedDoc({ content: data.content, name: data.name, path: data.path });
    } catch {
      setSelectedDoc({ content: "# エラーが発生しました", name: doc.name, path: doc.path });
    }
    setLoading(false);
  };

  const handleDownload = (docPath: string) => {
    window.open(`/api/documents?path=${encodeURIComponent(docPath)}&download=true`, "_blank");
  };

  const projects = Array.from(new Set(documents.map((d) => d.project))).sort();
  const categories = Array.from(new Set(documents.map((d) => d.category))).sort();

  const filtered = documents.filter((d) => {
    if (filterProject !== "all" && d.project !== filterProject) return false;
    if (filterCategory !== "all" && d.category !== filterCategory) return false;
    return true;
  });

  // Group by project
  const grouped = filtered.reduce<Record<string, DocInfo[]>>((acc, doc) => {
    (acc[doc.project] ||= []).push(doc);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-7 h-7 text-zinc-600" />
        <h1 className="text-2xl font-bold text-zinc-900">成果物</h1>
        <span className="text-sm text-zinc-400 ml-2">{documents.length} ドキュメント</span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ドキュメントを検索（ファイル名・内容）..."
            className="w-full rounded-lg border border-zinc-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          {searching && (
            <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 animate-spin" />
          )}
        </div>
      </form>

      {/* Filters */}
      {!selectedDoc && (
        <div className="flex gap-3 mb-4 flex-wrap items-center">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 bg-white"
          >
            <option value="all">全プロジェクト</option>
            {projects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 bg-white"
          >
            <option value="all">全種類</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* Content View */}
      {selectedDoc ? (
        <div className="bg-white rounded-lg border border-zinc-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
            <button
              onClick={() => setSelectedDoc(null)}
              className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              一覧に戻る
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-700">{selectedDoc.name}</span>
              <button
                onClick={() => handleDownload(selectedDoc.path)}
                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                ダウンロード
              </button>
            </div>
          </div>
          <div className="p-6">
            <MarkdownView content={selectedDoc.content} />
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <FolderOpen className="w-8 h-8 mb-2" />
          <span className="text-sm">ドキュメントが見つかりません</span>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, "ja")).map(([project, docs]) => (
            <div key={project}>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">{project}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map((doc) => (
                  <button
                    key={doc.path}
                    onClick={() => handleDocClick(doc)}
                    className="bg-white rounded-lg border border-zinc-200 p-4 text-left hover:border-zinc-400 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-zinc-400 mt-0.5 flex-shrink-0 group-hover:text-zinc-600" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-zinc-800 truncate">{doc.name}</div>
                        <div className="text-xs text-zinc-400 truncate mt-0.5">{doc.path}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", CATEGORY_COLORS[doc.category] || "bg-zinc-100 text-zinc-600")}>
                            {doc.category}
                          </span>
                          <span className="text-xs text-zinc-400">{formatSize(doc.size)}</span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">{formatDate(doc.modified)}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
