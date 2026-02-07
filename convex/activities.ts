import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// =============================================================================
// Activities - アクティビティフィード
// =============================================================================

// 最近のアクティビティ取得
export const recent = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal("task_created"),
      v.literal("task_updated"),
      v.literal("task_completed"),
      v.literal("message_sent"),
      v.literal("document_created"),
      v.literal("agent_heartbeat"),
      v.literal("quality_gate_updated"),
      v.literal("escalation")
    )),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.type) {
      return await ctx.db
        .query("activities")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("activities")
      .order("desc")
      .take(limit);
  },
});

// タスク別アクティビティ
export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    return await ctx.db
      .query("activities")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .take(limit);
  },
});

// エージェント別アクティビティ
export const listByAgent = query({
  args: {
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("activities")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(limit);
  },
});

// アクティビティ作成（手動）
export const create = mutation({
  args: {
    type: v.union(
      v.literal("task_created"),
      v.literal("task_updated"),
      v.literal("task_completed"),
      v.literal("message_sent"),
      v.literal("document_created"),
      v.literal("agent_heartbeat"),
      v.literal("quality_gate_updated"),
      v.literal("escalation")
    ),
    message: v.string(),
    agentId: v.optional(v.id("agents")),
    taskId: v.optional(v.id("tasks")),
    documentId: v.optional(v.id("documents")),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Daily Standup用: 今日のアクティビティサマリー
export const dailySummary = query({
  args: {
    date: v.optional(v.string()), // "2026-02-02" 形式、省略時は今日
  },
  handler: async (ctx, args) => {
    // 日付範囲を計算
    const dateStr = args.date ?? new Date().toISOString().split("T")[0];
    const startOfDay = new Date(dateStr).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const activities = await ctx.db
      .query("activities")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startOfDay),
          q.lt(q.field("createdAt"), endOfDay)
        )
      )
      .collect();

    // タイプ別に集計
    const summary = {
      date: dateStr,
      total: activities.length,
      byType: {} as Record<string, number>,
      completedTasks: [] as string[],
      newTasks: [] as string[],
      activeAgents: new Set<string>(),
    };

    for (const activity of activities) {
      // タイプ別カウント
      summary.byType[activity.type] =
        (summary.byType[activity.type] ?? 0) + 1;

      // 完了タスク
      if (activity.type === "task_completed" && activity.taskId) {
        const task = await ctx.db.get(activity.taskId);
        if (task) summary.completedTasks.push(task.title);
      }

      // 新規タスク
      if (activity.type === "task_created" && activity.taskId) {
        const task = await ctx.db.get(activity.taskId);
        if (task) summary.newTasks.push(task.title);
      }

      // アクティブエージェント
      if (activity.agentId) {
        summary.activeAgents.add(activity.agentId);
      }
    }

    return {
      ...summary,
      activeAgents: summary.activeAgents.size,
    };
  },
});
