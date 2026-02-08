import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// Mission Control Schema
// 汎用マルチエージェント用タスク管理データベース
// =============================================================================

export default defineSchema({
  // ---------------------------------------------------------------------------
  // Agents テーブル
  // 各AIエージェントの状態を管理
  // ---------------------------------------------------------------------------
  agents: defineTable({
    // 基本情報
    name: v.string(),                    // "jarvis", "shuri", etc.
    displayName: v.string(),             // "Jarvis", "Shuri", etc.
    role: v.string(),                    // "Squad Lead", "Product Analyst", etc.
    emoji: v.string(),                   // "🤖", "🔬", etc.

    // セッション情報
    sessionKey: v.string(),              // "agent:jarvis:main"
    model: v.string(),                   // "anthropic:opus", "anthropic:sonnet", etc.

    // 状態
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked"),
      v.literal("offline")
    ),
    currentTaskId: v.optional(v.id("tasks")),
    lastHeartbeat: v.optional(v.number()),  // Unix timestamp

    // レベル
    level: v.union(
      v.literal("intern"),
      v.literal("specialist"),
      v.literal("lead")
    ),
    heartbeatIntervalMin: v.number(),    // 15 など
  })
    .index("by_name", ["name"])
    .index("by_session_key", ["sessionKey"])
    .index("by_status", ["status"]),

  // ---------------------------------------------------------------------------
  // Tasks テーブル（簡素化）
  // タスクの管理
  // ---------------------------------------------------------------------------
  tasks: defineTable({
    // 基本情報
    title: v.string(),
    description: v.string(),

    // 状態
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),

    // 担当
    assigneeIds: v.array(v.id("agents")),
    createdBy: v.optional(v.id("agents")),

    // 依存関係
    blockedBy: v.optional(v.array(v.id("tasks"))),
    blocks: v.optional(v.array(v.id("tasks"))),

    // タイムスタンプ
    createdAt: v.number(),
    updatedAt: v.number(),
    dueAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),

    // メタデータ
    tags: v.optional(v.array(v.string())),
  })
    .index("by_status", ["status"])
    .index("by_assignee", ["assigneeIds"])
    .index("by_created", ["createdAt"]),

  // ---------------------------------------------------------------------------
  // Messages テーブル
  // タスクへのコメント・会話
  // ---------------------------------------------------------------------------
  messages: defineTable({
    taskId: v.id("tasks"),
    fromAgentId: v.optional(v.id("agents")),  // null = 人間
    fromHuman: v.optional(v.boolean()),

    content: v.string(),

    // @mention
    mentions: v.optional(v.array(v.id("agents"))),

    // 添付
    attachments: v.optional(v.array(v.id("documents"))),

    // メタデータ
    messageType: v.optional(v.union(
      v.literal("comment"),
      v.literal("status_update"),
      v.literal("escalation"),
      v.literal("system"),
      v.literal("quality_report")
    )),

    createdAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_agent", ["fromAgentId"])
    .index("by_created", ["createdAt"]),

  // ---------------------------------------------------------------------------
  // Activities テーブル
  // 全体のアクティビティフィード
  // ---------------------------------------------------------------------------
  activities: defineTable({
    type: v.union(
      v.literal("task_created"),
      v.literal("task_updated"),
      v.literal("task_completed"),
      v.literal("message_sent"),
      v.literal("document_created"),
      v.literal("agent_heartbeat"),
      v.literal("escalation"),
      v.literal("quality_gate_updated")
    ),

    agentId: v.optional(v.id("agents")),
    taskId: v.optional(v.id("tasks")),
    documentId: v.optional(v.id("documents")),

    message: v.string(),
    details: v.optional(v.any()),

    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_agent", ["agentId"])
    .index("by_task", ["taskId"])
    .index("by_created", ["createdAt"]),

  // ---------------------------------------------------------------------------
  // Documents テーブル
  // 成果物・ドキュメント管理
  // ---------------------------------------------------------------------------
  documents: defineTable({
    title: v.string(),
    content: v.optional(v.string()),      // Markdown content
    filePath: v.optional(v.string()),     // ファイルパス（ローカル）

    type: v.union(
      v.literal("research"),
      v.literal("content"),
      v.literal("design"),
      v.literal("code"),
      v.literal("deliverable"),
      v.literal("other")
    ),

    // 紐付け
    taskId: v.optional(v.id("tasks")),

    // 作成者
    createdByAgentId: v.optional(v.id("agents")),

    // バージョン
    version: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_type", ["type"]),

  // ---------------------------------------------------------------------------
  // Notifications テーブル
  // @mention通知
  // ---------------------------------------------------------------------------
  notifications: defineTable({
    mentionedAgentId: v.id("agents"),

    // ソース
    messageId: v.optional(v.id("messages")),
    taskId: v.optional(v.id("tasks")),

    content: v.string(),

    // 状態
    delivered: v.boolean(),
    deliveredAt: v.optional(v.number()),
    read: v.boolean(),
    readAt: v.optional(v.number()),

    createdAt: v.number(),
  })
    .index("by_agent", ["mentionedAgentId"])
    .index("by_undelivered", ["mentionedAgentId", "delivered"])
    .index("by_unread", ["mentionedAgentId", "read"]),

  // ---------------------------------------------------------------------------
  // Subscriptions テーブル
  // タスクへの購読（自動通知）
  // ---------------------------------------------------------------------------
  subscriptions: defineTable({
    agentId: v.id("agents"),
    taskId: v.id("tasks"),

    reason: v.union(
      v.literal("assigned"),
      v.literal("mentioned"),
      v.literal("commented"),
      v.literal("manual")
    ),

    createdAt: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_task", ["taskId"])
    .index("by_agent_task", ["agentId", "taskId"]),
});
