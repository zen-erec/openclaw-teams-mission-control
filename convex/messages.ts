import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// =============================================================================
// Messages - タスクへのコメント
// =============================================================================

// タスクのメッセージ取得
export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    return await ctx.db
      .query("messages")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("asc")
      .take(limit);
  },
});

// メッセージ作成
export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
    fromAgentId: v.optional(v.id("agents")),
    fromHuman: v.optional(v.boolean()),
    messageType: v.optional(v.union(
      v.literal("comment"),
      v.literal("status_update"),
      v.literal("quality_report"),
      v.literal("escalation"),
      v.literal("system")
    )),
    attachments: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // @mention を解析
    const mentionPattern = /@(\w+)/g;
    const mentionMatches = args.content.match(mentionPattern) ?? [];
    const mentionedNames = mentionMatches.map((m) => m.slice(1).toLowerCase());

    // エージェント名からIDを取得
    const mentionedAgentIds: string[] = [];
    for (const name of mentionedNames) {
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_name", (q) => q.eq("name", name))
        .first();
      if (agent) {
        mentionedAgentIds.push(agent._id);
      }
    }

    // メッセージ作成
    const messageId = await ctx.db.insert("messages", {
      taskId: args.taskId,
      content: args.content,
      fromAgentId: args.fromAgentId,
      fromHuman: args.fromHuman ?? !args.fromAgentId,
      messageType: args.messageType ?? "comment",
      mentions: mentionedAgentIds.length > 0 ? mentionedAgentIds as any : undefined,
      attachments: args.attachments,
      createdAt: now,
    });

    // アクティビティ記録
    let agentName = "Human";
    if (args.fromAgentId) {
      const agent = await ctx.db.get(args.fromAgentId);
      agentName = agent?.displayName ?? "Unknown Agent";
    }

    await ctx.db.insert("activities", {
      type: "message_sent",
      taskId: args.taskId,
      agentId: args.fromAgentId,
      message: `${agentName}がタスク「${task.title}」にコメントしました`,
      createdAt: now,
    });

    // @mention通知
    for (const agentId of mentionedAgentIds) {
      await ctx.db.insert("notifications", {
        mentionedAgentId: agentId as any,
        messageId,
        taskId: args.taskId,
        content: `@mention: ${args.content.slice(0, 100)}...`,
        delivered: false,
        read: false,
        createdAt: now,
      });

      // 購読追加（まだなければ）
      const existing = await ctx.db
        .query("subscriptions")
        .withIndex("by_agent_task", (q) =>
          q.eq("agentId", agentId as any).eq("taskId", args.taskId)
        )
        .first();

      if (!existing) {
        await ctx.db.insert("subscriptions", {
          agentId: agentId as any,
          taskId: args.taskId,
          reason: "mentioned",
          createdAt: now,
        });
      }
    }

    // 購読者への通知（@mention以外）
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    for (const sub of subscriptions) {
      // 送信者自身と@mention済みは除外
      if (
        sub.agentId === args.fromAgentId ||
        mentionedAgentIds.includes(sub.agentId)
      ) {
        continue;
      }

      await ctx.db.insert("notifications", {
        mentionedAgentId: sub.agentId,
        messageId,
        taskId: args.taskId,
        content: `タスク「${task.title}」に新しいコメント`,
        delivered: false,
        read: false,
        createdAt: now,
      });
    }

    // 送信者を購読に追加
    if (args.fromAgentId) {
      const existing = await ctx.db
        .query("subscriptions")
        .withIndex("by_agent_task", (q) =>
          q.eq("agentId", args.fromAgentId!).eq("taskId", args.taskId)
        )
        .first();

      if (!existing) {
        await ctx.db.insert("subscriptions", {
          agentId: args.fromAgentId,
          taskId: args.taskId,
          reason: "commented",
          createdAt: now,
        });
      }
    }

    return messageId;
  },
});

// 最近のメッセージ取得（全体）
export const recent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("messages")
      .order("desc")
      .take(limit);
  },
});
