"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Calendar, LayoutDashboard, Settings, Users, Clock, MessageSquare, Server, FileText, Search, GitBranch, Brain, FolderOpen } from "lucide-react";
import clsx from "clsx";
import { GlobalSearch } from "@/components/search/GlobalSearch";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/calendar", label: "カレンダー", icon: Calendar },
  { href: "/agents", label: "エージェント", icon: Users },
  { href: "/activity", label: "アクティビティ", icon: Activity },
  { href: "/cron", label: "Cronジョブ", icon: Clock },
  { href: "/chat", label: "チャット", icon: MessageSquare },
  { href: "/system", label: "システム", icon: Server },
  { href: "/content", label: "コンテンツ", icon: FileText },
  { href: "/knowledge", label: "ナレッジ", icon: Search },
  { href: "/memory", label: "メモリ", icon: Brain },
  { href: "/documents", label: "成果物", icon: FolderOpen },
  { href: "/code", label: "コード", icon: GitBranch },
  { href: "/settings", label: "設定", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SidebarNav() {
  const pathname = usePathname() ?? "/";

  const linkBase =
    "rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300";
  const linkActive = "bg-zinc-100 text-zinc-600";
  const linkInactive = "text-zinc-700 hover:bg-zinc-500/10 hover:text-zinc-500";

  return (
    <>
      {/* Mobile: search + horizontal nav */}
      <div className="md:hidden bg-zinc-50 border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-3 pt-2">
          <GlobalSearch />
        </div>
      </div>
      <nav className="md:hidden bg-zinc-50 border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-3 py-2">
          <div className="flex items-stretch justify-between gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    linkBase,
                    active ? linkActive : linkInactive,
                    "flex flex-1 flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop: vertical sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:flex-shrink-0 bg-zinc-50 border-r border-zinc-200">
        <div className="h-16 px-4 flex items-center border-b border-zinc-200">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-900 hover:text-zinc-700 transition-colors"
          >
            <span className="h-8 w-8 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center font-semibold">
              MC
            </span>
            <span className="font-semibold">Mission Control</span>
          </Link>
        </div>

        <div className="p-3 border-b border-zinc-200">
          <GlobalSearch />
        </div>

        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  linkBase,
                  active ? linkActive : linkInactive,
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

