"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileText, Plus, GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

type ContentStatus = "idea" | "drafting" | "review" | "published";

const COLUMNS: { key: ContentStatus; label: string; color: string }[] = [
  { key: "idea", label: "💡 アイデア", color: "bg-purple-100 text-purple-700" },
  { key: "drafting", label: "✏️ 執筆中", color: "bg-blue-100 text-blue-700" },
  { key: "review", label: "👀 レビュー", color: "bg-yellow-100 text-yellow-700" },
  { key: "published", label: "✅ 公開済", color: "bg-green-100 text-green-700" },
];

interface ContentDraft {
  _id: Id<"contentDrafts">;
  title: string;
  status: ContentStatus;
  type: string;
  assignee?: string;
  createdAt: number;
  updatedAt: number;
}

export default function ContentPipelinePage() {
  const drafts = useQuery(api.contentDrafts.list) as ContentDraft[] | undefined;
  const createDraft = useMutation(api.contentDrafts.create);
  const updateDraft = useMutation(api.contentDrafts.updateStatus);
  const deleteDraft = useMutation(api.contentDrafts.remove);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("blog");
  const [dragItem, setDragItem] = useState<Id<"contentDrafts"> | null>(null);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createDraft({
      title: newTitle.trim(),
      type: newType,
      status: "idea",
    });
    setNewTitle("");
    setShowCreate(false);
  };

  const handleDrop = async (status: ContentStatus) => {
    if (!dragItem) return;
    await updateDraft({ id: dragItem, status });
    setDragItem(null);
  };

  if (drafts === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">コンテンツパイプライン</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新規作成
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">新規コンテンツ</h2>
              <button onClick={() => setShowCreate(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">タイトル</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  placeholder="コンテンツのタイトル"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">タイプ</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  <option value="blog">ブログ記事</option>
                  <option value="tweet">ツイート</option>
                  <option value="video">動画スクリプト</option>
                  <option value="newsletter">ニュースレター</option>
                  <option value="other">その他</option>
                </select>
              </div>
              <button
                onClick={handleCreate}
                className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 transition-colors"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = drafts.filter((d) => d.status === col.key);
          return (
            <div
              key={col.key}
              className="bg-zinc-50 rounded-lg border border-zinc-200 p-3 min-h-[300px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.key)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={cn("text-sm font-medium rounded-full px-2.5 py-0.5", col.color)}>
                  {col.label}
                </span>
                <span className="text-xs text-zinc-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item._id}
                    draggable
                    onDragStart={() => setDragItem(item._id)}
                    className="bg-white rounded-md border border-zinc-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-zinc-300 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-800 truncate">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-zinc-500">{item.type}</span>
                          {item.assignee && (
                            <span className="text-xs text-zinc-400">@{item.assignee}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteDraft({ id: item._id })}
                        className="text-zinc-300 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
