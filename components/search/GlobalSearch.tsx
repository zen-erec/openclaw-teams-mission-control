"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  Search,
  CheckSquare,
  FileText,
  Activity,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type ResultItem = {
  id: string;
  type: "task" | "document" | "activity";
  label: string;
  href: string;
};

export function GlobalSearch() {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(input, 300);
  const shouldSearch = debouncedQuery.length >= 2;

  const taskResults = useQuery(
    api.tasks.search,
    shouldSearch ? { query: debouncedQuery, limit: 5 } : "skip"
  );
  const docResults = useQuery(
    api.documents.search,
    shouldSearch ? { query: debouncedQuery, limit: 5 } : "skip"
  );
  const activityResults = useQuery(
    api.activities.search,
    shouldSearch ? { query: debouncedQuery, limit: 5 } : "skip"
  );

  const results = useMemo<ResultItem[]>(() => {
    if (!shouldSearch) return [];
    const items: ResultItem[] = [];

    if (taskResults) {
      for (const t of taskResults) {
        items.push({
          id: t._id,
          type: "task",
          label: t.title,
          href: `/?taskId=${t._id}`,
        });
      }
    }
    if (docResults) {
      for (const d of docResults) {
        const href = d.taskId ? `/?taskId=${d.taskId}` : "/";
        items.push({
          id: d._id,
          type: "document",
          label: d.title,
          href,
        });
      }
    }
    if (activityResults) {
      for (const a of activityResults) {
        items.push({
          id: a._id,
          type: "activity",
          label: a.message,
          href: "/activity",
        });
      }
    }
    return items;
  }, [shouldSearch, taskResults, docResults, activityResults]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setInput("");
      router.push(href);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setInput("");
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigate(results[activeIndex].href);
    }
  };

  const typeIcon = (type: ResultItem["type"]) => {
    switch (type) {
      case "task":
        return <CheckSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case "document":
        return <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
      case "activity":
        return <Activity className="w-4 h-4 text-amber-500 flex-shrink-0" />;
    }
  };

  const typeLabel = (type: ResultItem["type"]) => {
    switch (type) {
      case "task":
        return "タスク";
      case "document":
        return "ドキュメント";
      case "activity":
        return "アクティビティ";
    }
  };

  // Group results by type for display
  const grouped = useMemo(() => {
    const groups: { type: ResultItem["type"]; items: ResultItem[] }[] = [];
    let currentGroup: (typeof groups)[number] | null = null;

    for (const item of results) {
      if (!currentGroup || currentGroup.type !== item.type) {
        currentGroup = { type: item.type, items: [] };
        groups.push(currentGroup);
      }
      currentGroup.items.push(item);
    }
    return groups;
  }, [results]);

  const showDropdown = open && input.length >= 2;
  const isLoading =
    shouldSearch &&
    (taskResults === undefined ||
      docResults === undefined ||
      activityResults === undefined);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="検索..."
          className="w-full pl-9 pr-12 py-2 text-sm rounded-md border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder-zinc-400"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-400 font-mono">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg border border-zinc-200 shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-400" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm text-zinc-400">
              一致する結果はありません
            </div>
          ) : (
            <div className="py-1">
              {grouped.map((group) => (
                <div key={group.type}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    {typeLabel(group.type)}
                  </div>
                  {group.items.map((item) => {
                    const flatIndex = results.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.href)}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-50 transition-colors",
                          flatIndex === activeIndex && "bg-zinc-100"
                        )}
                      >
                        {typeIcon(item.type)}
                        <span className="truncate text-zinc-800">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
