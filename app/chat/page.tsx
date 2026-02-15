"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: number;
}

const COMMANDS: Record<string, string> = {
  "/help": "利用可能なコマンド一覧を表示します",
  "/status": "システムステータスを確認します",
  "/agents": "アクティブなエージェント一覧を表示します",
  "/tasks": "現在のタスク一覧を表示します",
  "/clear": "チャット履歴をクリアします",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "system",
      content:
        "Mission Control チャットへようこそ！コマンドを入力するか、`/help` で利用可能なコマンド一覧を確認してください。",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role: "user" | "system", content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, role, content, timestamp: Date.now() },
    ]);
  };

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim();

    if (trimmed === "/help") {
      const lines = Object.entries(COMMANDS)
        .map(([k, v]) => `**${k}** — ${v}`)
        .join("\n");
      addMessage("system", lines);
      return;
    }

    if (trimmed === "/clear") {
      setMessages([]);
      return;
    }

    if (trimmed === "/status") {
      try {
        const res = await fetch("/api/system-health");
        const data = await res.json();
        addMessage(
          "system",
          `🖥️ **システムステータス**\n` +
            `CPU: ${data.cpu?.model} (${data.cpu?.cores}コア)\n` +
            `メモリ: ${data.memory?.percentUsed}% 使用中\n` +
            `ディスク: ${data.disk?.percent} 使用\n` +
            `稼働時間: ${Math.floor((data.system?.uptime || 0) / 3600)}時間\n` +
            `Gateway: ${data.gateway}`
        );
      } catch {
        addMessage("system", "❌ ステータス取得に失敗しました");
      }
      return;
    }

    if (trimmed === "/agents") {
      addMessage(
        "system",
        "エージェント情報はエージェント一覧ページで確認してください。\nサイドバーの「エージェント」をクリックしてください。"
      );
      return;
    }

    if (trimmed === "/tasks") {
      addMessage(
        "system",
        "タスク情報はダッシュボードで確認してください。\nサイドバーの「ダッシュボード」をクリックしてください。"
      );
      return;
    }

    if (trimmed.startsWith("/")) {
      addMessage("system", `❓ 不明なコマンド: \`${trimmed}\`\n\`/help\` で利用可能なコマンドを確認してください。`);
      return;
    }

    // Regular message echo
    addMessage("system", `受信: "${trimmed}"\n（チャットバックエンドは今後実装予定です）`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addMessage("user", input.trim());
    handleCommand(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-zinc-900">チャット / コマンド</h1>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Terminal className="w-4 h-4" />
          <span>コマンドモード</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-zinc-200 p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === "user" ? "bg-zinc-900" : "bg-zinc-200"
              )}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-zinc-600" />
              )}
            </div>
            <div
              className={cn(
                "rounded-lg px-4 py-2 max-w-[80%] text-sm whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-800"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="コマンドまたはメッセージを入力..."
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-white hover:bg-zinc-800 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
