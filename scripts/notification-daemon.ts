/**
 * Notification Delivery Daemon
 *
 * OpenClawセッションに通知を配信するデーモン。
 * pm2 で常駐させることを想定。
 *
 * Usage:
 *   npx ts-node scripts/notification-daemon.ts
 *
 * pm2:
 *   pm2 start scripts/notification-daemon.ts --name notify-daemon --interpreter ts-node
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Convex クライアント初期化
const CONVEX_URL = process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("Error: CONVEX_URL environment variable is required");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// 設定
const POLL_INTERVAL_MS = 2000; // 2秒ごとにポーリング
const MAX_RETRIES = 3;

// エージェントセッションマッピング
const AGENT_SESSIONS: Record<string, string> = {
  jarvis: "agent:jarvis:main",
  vision: "agent:vision:main",
  loki: "agent:loki:main",
  quill: "agent:quill:main",
  wanda: "agent:wanda:main",
  friday: "agent:friday:main",
  wong: "agent:wong:main",
};

/**
 * OpenClawセッションにメッセージを送信
 */
async function sendToSession(
  sessionKey: string,
  message: string
): Promise<boolean> {
  try {
    // openclaw sessions send コマンドを実行
    const escapedMessage = message.replace(/"/g, '\\"');
    const { stdout, stderr } = await execAsync(
      `openclaw sessions send --session "${sessionKey}" --message "${escapedMessage}"`
    );

    if (stderr && !stderr.includes("warning")) {
      console.error(`[Send Error] ${sessionKey}: ${stderr}`);
      return false;
    }

    console.log(`[Delivered] ${sessionKey}: ${message.slice(0, 50)}...`);
    return true;
  } catch (error: any) {
    // セッションが非アクティブの場合はエラーになるが、通知は保持される
    if (error.message?.includes("session not active")) {
      console.log(`[Queued] ${sessionKey}: Session not active, will retry`);
      return false;
    }
    console.error(`[Error] ${sessionKey}: ${error.message}`);
    return false;
  }
}

/**
 * 未配信通知を処理
 */
async function processNotifications(): Promise<void> {
  try {
    // 未配信通知を取得
    const notifications = await client.query(api.notifications.getUndelivered, {
      limit: 50,
    });

    if (notifications.length === 0) {
      return;
    }

    console.log(`[Processing] ${notifications.length} notifications`);

    for (const notif of notifications) {
      if (!notif.agent) {
        console.warn(`[Skip] No agent info for notification ${notif._id}`);
        continue;
      }

      const sessionKey = notif.agent.sessionKey;
      const success = await sendToSession(sessionKey, notif.content);

      if (success) {
        // 配信済みとしてマーク
        await client.mutation(api.notifications.markDelivered, {
          id: notif._id,
        });
      }
      // 失敗した場合は次回のポーリングで再試行される
    }
  } catch (error: any) {
    console.error(`[Poll Error] ${error.message}`);
  }
}

/**
 * メインループ
 */
async function main(): Promise<void> {
  console.log("===========================================");
  console.log(" Mission Control - Notification Daemon");
  console.log("===========================================");
  console.log(`Convex URL: ${CONVEX_URL}`);
  console.log(`Poll Interval: ${POLL_INTERVAL_MS}ms`);
  console.log("");
  console.log("Daemon started. Press Ctrl+C to stop.");
  console.log("");

  // メインループ
  while (true) {
    await processNotifications();
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

// 実行
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
