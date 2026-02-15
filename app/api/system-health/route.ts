import { NextResponse } from "next/server";
import os from "os";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const uptime = os.uptime();

    // Disk usage
    let diskUsage = { total: "N/A", used: "N/A", available: "N/A", percent: "N/A" };
    try {
      const df = execSync("df -h / | tail -1", { encoding: "utf-8" }).trim();
      const parts = df.split(/\s+/);
      diskUsage = {
        total: parts[1] || "N/A",
        used: parts[2] || "N/A",
        available: parts[3] || "N/A",
        percent: parts[4] || "N/A",
      };
    } catch {}

    // OpenClaw gateway status
    let gatewayStatus = "unknown";
    try {
      const result = execSync("pgrep -f 'openclaw.*gateway' >/dev/null 2>&1 && echo running || echo stopped", {
        encoding: "utf-8",
        timeout: 3000,
      }).trim();
      gatewayStatus = result;
    } catch {
      gatewayStatus = "unknown";
    }

    // Node.js version
    const nodeVersion = process.version;

    return NextResponse.json({
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percentUsed: Math.round((usedMem / totalMem) * 100),
      },
      cpu: {
        model: cpus[0]?.model || "Unknown",
        cores: cpus.length,
        loadAvg: loadAvg.map((l) => Math.round(l * 100) / 100),
      },
      disk: diskUsage,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime,
        nodeVersion,
      },
      gateway: gatewayStatus,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
