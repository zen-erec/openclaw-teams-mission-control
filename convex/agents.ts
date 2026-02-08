import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// =============================================================================
// Agents - エージェント管理
// =============================================================================

// エージェント一覧取得
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

// エージェント詳細取得（名前で）
export const getByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

// エージェント詳細取得（IDで）
export const get = query({
  args: {
    id: v.id("agents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ステータス別エージェント取得
export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked"),
      v.literal("offline")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// 複数エージェント取得（IDリストから）
export const getByIds = query({
  args: {
    ids: v.array(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const agents = [];
    for (const id of args.ids) {
      const agent = await ctx.db.get(id);
      if (agent) {
        agents.push(agent);
      }
    }
    return agents;
  },
});

// エージェント作成（初期セットアップ用）
export const create = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    role: v.string(),
    emoji: v.string(),
    sessionKey: v.string(),
    model: v.string(),
    level: v.union(
      v.literal("intern"),
      v.literal("specialist"),
      v.literal("lead")
    ),
    heartbeatIntervalMin: v.number(),
  },
  handler: async (ctx, args) => {
    // 既存チェック
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error(`Agent "${args.name}" already exists`);
    }

    return await ctx.db.insert("agents", {
      ...args,
      status: "idle",
    });
  },
});

// エージェント状態更新
export const updateStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked"),
      v.literal("offline")
    ),
    currentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      currentTaskId: args.currentTaskId,
    });
  },
});

// Heartbeat記録
export const recordHeartbeat = mutation({
  args: {
    id: v.id("agents"),
    status: v.optional(v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked")
    )),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.id, {
      lastHeartbeat: now,
      ...(args.status ? { status: args.status } : {}),
    });

    // アクティビティ記録（頻度を抑えるため、activeの場合のみ）
    if (args.status === "active") {
      const agent = await ctx.db.get(args.id);
      await ctx.db.insert("activities", {
        type: "agent_heartbeat",
        agentId: args.id,
        message: `${agent?.displayName ?? "Agent"} is active`,
        createdAt: now,
      });
    }
  },
});

// エージェント情報更新
export const update = mutation({
  args: {
    id: v.id("agents"),
    displayName: v.optional(v.string()),
    role: v.optional(v.string()),
    emoji: v.optional(v.string()),
    model: v.optional(v.string()),
    level: v.optional(v.union(
      v.literal("intern"),
      v.literal("specialist"),
      v.literal("lead")
    )),
    heartbeatIntervalMin: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    // undefined値を除外
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(id, filteredUpdates);
    }
    return await ctx.db.get(id);
  },
});

// 全エージェント削除（再シード前のクリーンアップ用）
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    for (const agent of agents) {
      await ctx.db.delete(agent._id);
    }
    return { deleted: agents.length };
  },
});

// 全エージェント初期登録・同期
export const seedAgents = mutation({
  args: {},
  handler: async (ctx) => {
    // gateway/config.json と同期させること
    const agents = [
      { name: "jarvis", displayName: "Zen（善）", role: "Squad Lead", emoji: "🧘", sessionKey: "agent:jarvis:main", model: "anthropic:opus", level: "lead" as const, heartbeatIntervalMin: 15 },
      { name: "shuri", displayName: "Shuri", role: "Product Analyst", emoji: "🔬", sessionKey: "agent:shuri:main", model: "z_ai:glm47", level: "specialist" as const, heartbeatIntervalMin: 15 },
      { name: "fury", displayName: "Fury", role: "Customer Researcher", emoji: "🕵️", sessionKey: "agent:fury:main", model: "z_ai:glm47", level: "specialist" as const, heartbeatIntervalMin: 15 },
      { name: "vision", displayName: "Vision", role: "SEO Analyst", emoji: "👁️", sessionKey: "agent:vision:main", model: "openrouter:kimi-k2.5", level: "specialist" as const, heartbeatIntervalMin: 15 },
      { name: "loki", displayName: "Loki", role: "Content Writer", emoji: "✍️", sessionKey: "agent:loki:main", model: "anthropic:sonnet", level: "specialist" as const, heartbeatIntervalMin: 15 },
      { name: "quill", displayName: "Quill", role: "Social Media Manager", emoji: "🐦", sessionKey: "agent:quill:main", model: "openrouter:kimi-k2.5", level: "specialist" as const, heartbeatIntervalMin: 15 },
      { name: "wanda", displayName: "Wanda", role: "Designer", emoji: "🎨", sessionKey: "agent:wanda:main", model: "anthropic:sonnet", level: "specialist" as const, heartbeatIntervalMin: 15 },
      { name: "pepper", displayName: "Pepper", role: "Email Marketing", emoji: "📧", sessionKey: "agent:pepper:main", model: "anthropic:sonnet", level: "specialist" as const, heartbeatIntervalMin: 15 },
      { name: "friday", displayName: "Friday", role: "Developer", emoji: "💻", sessionKey: "agent:friday:main", model: "anthropic:sonnet", level: "specialist" as const, heartbeatIntervalMin: 15 },
      { name: "wong", displayName: "Wong", role: "Documentation", emoji: "📚", sessionKey: "agent:wong:main", model: "anthropic:haiku", level: "specialist" as const, heartbeatIntervalMin: 15 },
    ];

    const results = [];
    for (const agent of agents) {
      const existing = await ctx.db
        .query("agents")
        .withIndex("by_name", (q) => q.eq("name", agent.name))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("agents", {
          ...agent,
          status: "idle",
        });
        results.push({ name: agent.name, id, status: "created" });
      } else {
        // 既存エージェントを更新（ステータスとcurrentTaskIdは保持）
        await ctx.db.patch(existing._id, {
          displayName: agent.displayName,
          role: agent.role,
          emoji: agent.emoji,
          sessionKey: agent.sessionKey,
          model: agent.model,
          level: agent.level,
          heartbeatIntervalMin: agent.heartbeatIntervalMin,
        });
        results.push({ name: agent.name, id: existing._id, status: "updated" });
      }
    }

    return results;
  },
});
