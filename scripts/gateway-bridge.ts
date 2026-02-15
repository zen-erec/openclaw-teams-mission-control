/**
 * Gateway → Convex Activity Bridge
 *
 * OpenClaw GatewayのWebSocketイベントをリアルタイムでConvexに書き込むブリッジデーモン。
 * Discord会話・エージェント実行のイベントをMission Controlのアクティビティフィードに反映する。
 *
 * Usage:
 *   npx tsx scripts/gateway-bridge.ts
 *
 * Environment:
 *   CONVEX_URL          - Convex deployment URL (required)
 *   GATEWAY_URL         - Gateway WebSocket URL (default: ws://127.0.0.1:18789)
 *   GATEWAY_AUTH_TOKEN  - Gateway auth token (default: reads from openclaw.json)
 */

import WebSocket from "ws";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import * as fs from "fs";
import * as path from "path";

// Convex API references (avoids _generated import issues with tsx)
const api = anyApi as any;

// =============================================================================
// Configuration
// =============================================================================

const CONVEX_URL = process.env.CONVEX_URL;
if (!CONVEX_URL) {
  console.error("Error: CONVEX_URL environment variable is required");
  process.exit(1);
}

const GATEWAY_URL = process.env.GATEWAY_URL ?? "ws://127.0.0.1:18789";

// Auth token: env var or read from openclaw.json
function resolveGatewayToken(): string {
  if (process.env.GATEWAY_AUTH_TOKEN) {
    return process.env.GATEWAY_AUTH_TOKEN;
  }
  try {
    const configPath = path.join(
      process.env.HOME ?? "/Users/zen",
      ".openclaw/openclaw.json"
    );
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const token = config?.gateway?.auth?.token;
    if (token) return token;
  } catch {}
  console.error("Error: No gateway auth token found. Set GATEWAY_AUTH_TOKEN or configure gateway.auth.token in openclaw.json");
  process.exit(1);
}

const GATEWAY_TOKEN = resolveGatewayToken();

// Throttling
const HEARTBEAT_INTERVAL_MS = 60_000;       // 1 agent heartbeat per 60s
const AGENT_MAP_REFRESH_MS = 5 * 60_000;    // Refresh agent list every 5min
const MAX_TRACKED_RUNS = 1000;              // Dedup set size
const RATE_LIMIT_PER_SEC = 10;              // Token bucket: 10 mutations/sec

// Reconnection
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const TICK_TIMEOUT_FACTOR = 2;              // Timeout after 2x tickIntervalMs

// =============================================================================
// Convex Client
// =============================================================================

const convex = new ConvexHttpClient(CONVEX_URL);

// =============================================================================
// State
// =============================================================================

// sessionKey → Convex agentId mapping
let agentMap = new Map<string, string>();
let agentDisplayNames = new Map<string, string>();

// Run dedup
const seenRunIds = new Set<string>();
const seenRunIdsQueue: string[] = []; // For eviction

// Heartbeat throttle: agentId → last heartbeat timestamp
const lastHeartbeat = new Map<string, number>();

// Token bucket for rate limiting
let tokenBucket = RATE_LIMIT_PER_SEC;
let lastTokenRefill = Date.now();

// Reconnection
let reconnectAttempts = 0;
let ws: WebSocket | null = null;
let tickTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
let tickIntervalMs = 5_000; // Default, updated from hello-ok

// Stats
let stats = {
  eventsReceived: 0,
  activitiesWritten: 0,
  errorsCount: 0,
  lastEventAt: 0,
};

// =============================================================================
// Token Bucket Rate Limiter
// =============================================================================

function consumeToken(): boolean {
  const now = Date.now();
  const elapsed = now - lastTokenRefill;
  const refill = Math.floor(elapsed / 1000) * RATE_LIMIT_PER_SEC;
  if (refill > 0) {
    tokenBucket = Math.min(RATE_LIMIT_PER_SEC, tokenBucket + refill);
    lastTokenRefill = now;
  }
  if (tokenBucket > 0) {
    tokenBucket--;
    return true;
  }
  return false;
}

async function rateLimitedMutation<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!consumeToken()) {
    console.log("[RateLimit] Mutation dropped — bucket empty");
    return null;
  }
  try {
    return await fn();
  } catch (err: any) {
    stats.errorsCount++;
    console.error("[Convex Error]", err.message);
    return null;
  }
}

// =============================================================================
// Agent Map
// =============================================================================

async function refreshAgentMap(): Promise<void> {
  try {
    const agents = await convex.query(api.agents.list, {});
    agentMap.clear();
    agentDisplayNames.clear();
    for (const agent of agents) {
      agentMap.set(agent.sessionKey, agent._id);
      agentDisplayNames.set(agent.sessionKey, `${agent.emoji} ${agent.displayName}`);
    }
    console.log(`[AgentMap] Loaded ${agentMap.size} agents`);
  } catch (err: any) {
    console.error("[AgentMap Error]", err.message);
  }
}

// =============================================================================
// Run Dedup
// =============================================================================

function trackRunId(runId: string): boolean {
  if (seenRunIds.has(runId)) return false;
  seenRunIds.add(runId);
  seenRunIdsQueue.push(runId);
  // Evict oldest
  while (seenRunIdsQueue.length > MAX_TRACKED_RUNS) {
    const old = seenRunIdsQueue.shift();
    if (old) seenRunIds.delete(old);
  }
  return true;
}

// =============================================================================
// Event Handlers
// =============================================================================

function resolveAgentId(sessionKey?: string): string | undefined {
  if (!sessionKey) return undefined;
  return agentMap.get(sessionKey);
}

async function handleAgentEvent(payload: any): Promise<void> {
  const { runId, seq, state, sessionKey } = payload;

  // Only record agent_run_started for seq===0 (new run)
  if (seq === 0 && runId && trackRunId(runId)) {
    const agentId = resolveAgentId(sessionKey);
    const displayName = sessionKey ? (agentDisplayNames.get(sessionKey) ?? sessionKey) : "Agent";

    await rateLimitedMutation(() =>
      convex.mutation(api.activities.create, {
        type: "agent_run_started",
        message: `${displayName} が推論実行を開始 (run: ${runId.slice(0, 8)}…)`,
        agentId,
        details: { runId, sessionKey },
      })
    );
    stats.activitiesWritten++;
    console.log(`[Activity] agent_run_started: ${displayName} run=${runId.slice(0, 8)}`);
  }

  // Record agent_run_completed on final/error/aborted state
  if (state === "final" || state === "error" || state === "aborted") {
    const agentId = resolveAgentId(sessionKey);
    const displayName = sessionKey ? (agentDisplayNames.get(sessionKey) ?? sessionKey) : "Agent";
    const stateLabel = state === "final" ? "完了" : state === "error" ? "エラー" : "中断";

    await rateLimitedMutation(() =>
      convex.mutation(api.activities.create, {
        type: "agent_run_completed",
        message: `${displayName} が推論実行を${stateLabel} (run: ${runId?.slice(0, 8) ?? "?"}…)`,
        agentId,
        details: { runId, state, sessionKey },
      })
    );
    stats.activitiesWritten++;
    console.log(`[Activity] agent_run_completed: ${displayName} state=${state}`);
  }
}

async function handleChatEvent(payload: any): Promise<void> {
  const { runId, sessionKey, state, seq, message, errorMessage } = payload;

  // Only record on final state (skip delta)
  if (state !== "final") return;

  const agentId = resolveAgentId(sessionKey);
  const displayName = sessionKey ? (agentDisplayNames.get(sessionKey) ?? sessionKey) : "Agent";

  // Extract a preview of the chat content
  let preview = "";
  if (typeof message === "string") {
    preview = message.slice(0, 100);
  } else if (message?.content) {
    const text = typeof message.content === "string"
      ? message.content
      : JSON.stringify(message.content);
    preview = text.slice(0, 100);
  }

  await rateLimitedMutation(() =>
    convex.mutation(api.activities.create, {
      type: "chat_received",
      message: `${displayName} チャット: ${preview || "(メッセージ)"}${preview.length >= 100 ? "…" : ""}`,
      agentId,
      details: { runId, sessionKey },
    })
  );
  stats.activitiesWritten++;
  console.log(`[Activity] chat_received: ${displayName}`);
}

async function handlePresenceEvent(payload: any): Promise<void> {
  const { reason, tags, text } = payload;

  // Try to find an agent session from the presence data
  // Presence events don't always have sessionKey directly,
  // but we can match by tags or other identifiers
  if (!reason) return;

  // Throttle presence-based heartbeat updates
  for (const [sessionKey, agentId] of agentMap) {
    // Check if this presence event relates to an agent
    // We'll use a simple heuristic: if presence tags contain the agent name
    const agentName = sessionKey.split(":")[1]; // e.g. "jarvis" from "agent:jarvis:main"
    if (!agentName) continue;

    const matchesTags = tags?.some((t: string) => t.includes(agentName));
    const matchesText = text?.includes(agentName);
    if (!matchesTags && !matchesText) continue;

    const now = Date.now();
    const lastHb = lastHeartbeat.get(String(agentId)) ?? 0;
    if (now - lastHb < HEARTBEAT_INTERVAL_MS) continue;

    lastHeartbeat.set(String(agentId), now);

    const newStatus = reason === "disconnect" ? "offline" as const : "active" as const;
    await rateLimitedMutation(() =>
      convex.mutation(api.agents.updateStatus, {
        id: agentId,
        status: newStatus,
      })
    );
    console.log(`[Presence] ${agentName} → ${newStatus}`);
    break;
  }
}

// =============================================================================
// Tick Timeout (detect stale connection)
// =============================================================================

function resetTickTimeout(): void {
  if (tickTimeoutHandle) clearTimeout(tickTimeoutHandle);
  tickTimeoutHandle = setTimeout(() => {
    console.warn("[Timeout] No tick received for", tickIntervalMs * TICK_TIMEOUT_FACTOR, "ms — reconnecting");
    ws?.close();
  }, tickIntervalMs * TICK_TIMEOUT_FACTOR);
}

// =============================================================================
// WebSocket Connection
// =============================================================================

function connect(): void {
  console.log(`[WS] Connecting to ${GATEWAY_URL}...`);

  ws = new WebSocket(GATEWAY_URL);
  let connectId = `bridge-${Date.now()}`;
  let connected = false;

  ws.on("open", () => {
    console.log("[WS] Socket opened, sending connect request...");

    // Send connect handshake
    const connectReq = {
      type: "req",
      id: connectId,
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "gateway-client",
          version: "1.0.0",
          platform: process.platform,
          displayName: "Mission Control Bridge",
          mode: "backend",
        },
        auth: {
          token: GATEWAY_TOKEN,
        },
        role: "operator",
      },
    };

    ws!.send(JSON.stringify(connectReq));
  });

  ws.on("message", async (data) => {
    let frame: any;
    try {
      frame = JSON.parse(data.toString());
    } catch {
      console.warn("[WS] Non-JSON message received");
      return;
    }

    // Handle hello-ok response
    if (frame.type === "res" && frame.id === connectId) {
      if (frame.ok) {
        connected = true;
        reconnectAttempts = 0;
        const policy = frame.payload?.policy;
        if (policy?.tickIntervalMs) {
          tickIntervalMs = policy.tickIntervalMs;
        }
        const serverVersion = frame.payload?.server?.version ?? "unknown";
        console.log(`[WS] Connected! Server v${serverVersion}, tick=${tickIntervalMs}ms`);
        resetTickTimeout();
      } else {
        console.error("[WS] Connect rejected:", frame.error?.message ?? "unknown error");
        ws!.close();
      }
      return;
    }

    // Handle events
    if (frame.type === "event") {
      stats.eventsReceived++;
      stats.lastEventAt = Date.now();

      switch (frame.event) {
        case "tick":
          resetTickTimeout();
          break;

        case "agent":
          await handleAgentEvent(frame.payload);
          break;

        case "chat":
          await handleChatEvent(frame.payload);
          break;

        case "presence":
          await handlePresenceEvent(frame.payload);
          break;

        case "shutdown":
          console.log("[WS] Server shutting down:", frame.payload?.reason);
          break;
      }
    }
  });

  ws.on("close", (code, reason) => {
    connected = false;
    if (tickTimeoutHandle) clearTimeout(tickTimeoutHandle);

    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(2, reconnectAttempts),
      RECONNECT_MAX_MS
    );
    reconnectAttempts++;

    console.log(`[WS] Closed (code=${code}). Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);
    setTimeout(connect, delay);
  });

  ws.on("error", (err) => {
    console.error("[WS Error]", err.message);
  });
}

// =============================================================================
// Status Reporter
// =============================================================================

function startStatusReporter(): void {
  setInterval(() => {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    console.log(
      `[Status] uptime=${h}h${m}m events=${stats.eventsReceived} written=${stats.activitiesWritten} errors=${stats.errorsCount} agents=${agentMap.size}`
    );
  }, 60_000);
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  console.log("===========================================");
  console.log(" Mission Control - Gateway Activity Bridge");
  console.log("===========================================");
  console.log(`Convex URL: ${CONVEX_URL}`);
  console.log(`Gateway URL: ${GATEWAY_URL}`);
  console.log("");

  // Initial agent map load
  await refreshAgentMap();

  // Periodic agent map refresh
  setInterval(refreshAgentMap, AGENT_MAP_REFRESH_MS);

  // Start status reporter
  startStatusReporter();

  // Connect to gateway
  connect();

  console.log("Bridge started. Press Ctrl+C to stop.");
  console.log("");
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[Shutdown] Received SIGINT, closing...");
  if (tickTimeoutHandle) clearTimeout(tickTimeoutHandle);
  ws?.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[Shutdown] Received SIGTERM, closing...");
  if (tickTimeoutHandle) clearTimeout(tickTimeoutHandle);
  ws?.close();
  process.exit(0);
});

// Run
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
