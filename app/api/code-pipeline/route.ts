import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

const SCAN_DIRS = [
  path.join(process.env.HOME || "~", "openclaw-teams"),
  path.join(process.env.HOME || "~", ".openclaw/workspace"),
];

interface RepoInfo {
  name: string;
  path: string;
  branch: string;
  lastCommit: string;
  lastCommitDate: string;
  status: string; // clean / dirty
  ahead: number;
  behind: number;
}

function getRepoInfo(repoPath: string): RepoInfo | null {
  try {
    const gitDir = path.join(repoPath, ".git");
    if (!fs.existsSync(gitDir)) return null;

    const opts = { cwd: repoPath, encoding: "utf-8" as const, timeout: 5000 };

    const branch = execSync("git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown", opts).trim();
    const lastCommit = execSync('git log -1 --pretty=format:"%s" 2>/dev/null || echo ""', opts).trim();
    const lastCommitDate = execSync('git log -1 --pretty=format:"%ci" 2>/dev/null || echo ""', opts).trim();
    const statusOut = execSync("git status --porcelain 2>/dev/null || echo ''", opts).trim();
    const status = statusOut.length === 0 ? "clean" : "dirty";

    let ahead = 0;
    let behind = 0;
    try {
      const ab = execSync("git rev-list --left-right --count HEAD...@{u} 2>/dev/null", opts).trim();
      const [a, b] = ab.split(/\s+/);
      ahead = parseInt(a) || 0;
      behind = parseInt(b) || 0;
    } catch {}

    return {
      name: path.basename(repoPath),
      path: repoPath,
      branch,
      lastCommit,
      lastCommitDate,
      status,
      ahead,
      behind,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const repos: RepoInfo[] = [];

  for (const scanDir of SCAN_DIRS) {
    if (!fs.existsSync(scanDir)) continue;

    // Check if scanDir itself is a repo
    const selfRepo = getRepoInfo(scanDir);
    if (selfRepo) repos.push(selfRepo);

    // Check children
    try {
      const entries = fs.readdirSync(scanDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
        const full = path.join(scanDir, entry.name);
        const info = getRepoInfo(full);
        if (info) repos.push(info);
      }
    } catch {}
  }

  // Deduplicate by path
  const seen = new Set<string>();
  const unique = repos.filter((r) => {
    if (seen.has(r.path)) return false;
    seen.add(r.path);
    return true;
  });

  unique.sort((a, b) => (b.lastCommitDate || "").localeCompare(a.lastCommitDate || ""));
  return NextResponse.json({ repos: unique });
}
