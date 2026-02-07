import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// =============================================================================
// Tasks - タスク管理
// =============================================================================

// タスク一覧取得
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("tasks")
      .order("desc")
      .take(limit);
  },
});

// ステータス別タスク取得
export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(limit);
  },
});

// 担当者別タスク取得
export const listByAssignee = query({
  args: {
    assigneeId: v.id("agents"),
    includeCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db.query("tasks").collect();
    return tasks.filter((task) => {
      const isAssigned = task.assigneeIds.includes(args.assigneeId);
      if (!args.includeCompleted && task.status === "done") {
        return false;
      }
      return isAssigned;
    });
  },
});

// タスク詳細取得
export const get = query({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// タスク作成
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    assigneeIds: v.optional(v.array(v.id("agents"))),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    tags: v.optional(v.array(v.string())),
    createdByAgentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: args.assigneeIds && args.assigneeIds.length > 0 ? "assigned" : "inbox",
      priority: args.priority ?? "medium",
      assigneeIds: args.assigneeIds ?? [],
      createdBy: args.createdByAgentId,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });

    // アクティビティ記録
    await ctx.db.insert("activities", {
      type: "task_created",
      taskId,
      agentId: args.createdByAgentId,
      message: `Task "${args.title}" created`,
      createdAt: now,
    });

    // 担当者への通知
    if (args.assigneeIds) {
      for (const agentId of args.assigneeIds) {
        await ctx.db.insert("notifications", {
          mentionedAgentId: agentId,
          taskId,
          content: `New task assigned: ${args.title}`,
          delivered: false,
          read: false,
          createdAt: now,
        });

        // 自動購読
        await ctx.db.insert("subscriptions", {
          agentId,
          taskId,
          reason: "assigned",
          createdAt: now,
        });
      }
    }

    return taskId;
  },
});

// タスク更新
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("inbox"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    assigneeIds: v.optional(v.array(v.id("agents"))),
    updatedByAgentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    const { id, updatedByAgentId, ...updates } = args;
    const now = Date.now();

    const task = await ctx.db.get(id);
    if (!task) throw new Error("Task not found");

    // 更新実行
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
      ...(updates.status === "done" ? { completedAt: now } : {}),
    });

    // アクティビティ記録
    let message = `Task "${task.title}" updated`;
    if (updates.status) {
      message = `Task "${task.title}" status changed to "${updates.status}"`;
    }

    await ctx.db.insert("activities", {
      type: updates.status === "done" ? "task_completed" : "task_updated",
      taskId: id,
      agentId: updatedByAgentId,
      message,
      details: updates,
      createdAt: now,
    });

    return id;
  },
});

// 担当者追加
export const addAssignee = mutation({
  args: {
    taskId: v.id("tasks"),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    if (!task.assigneeIds.includes(args.agentId)) {
      const now = Date.now();

      await ctx.db.patch(args.taskId, {
        assigneeIds: [...task.assigneeIds, args.agentId],
        status: task.status === "inbox" ? "assigned" : task.status,
        updatedAt: now,
      });

      // 通知
      await ctx.db.insert("notifications", {
        mentionedAgentId: args.agentId,
        taskId: args.taskId,
        content: `Added to task: ${task.title}`,
        delivered: false,
        read: false,
        createdAt: now,
      });

      // 購読追加
      await ctx.db.insert("subscriptions", {
        agentId: args.agentId,
        taskId: args.taskId,
        reason: "assigned",
        createdAt: now,
      });
    }
  },
});

// ブロッカー設定
export const setBlockedBy = mutation({
  args: {
    taskId: v.id("tasks"),
    blockedByTaskIds: v.array(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.taskId, {
      blockedBy: args.blockedByTaskIds,
      status: args.blockedByTaskIds.length > 0 ? "blocked" : "assigned",
      updatedAt: now,
    });

    // 逆方向の blocks も更新
    for (const blockerId of args.blockedByTaskIds) {
      const blocker = await ctx.db.get(blockerId);
      if (blocker) {
        const currentBlocks = blocker.blocks ?? [];
        if (!currentBlocks.includes(args.taskId)) {
          await ctx.db.patch(blockerId, {
            blocks: [...currentBlocks, args.taskId],
          });
        }
      }
    }
  },
});
