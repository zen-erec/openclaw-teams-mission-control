import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const WORKSPACE = path.join(process.env.HOME || "~", ".openclaw/workspace");

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function listDir(dir: string): { name: string; size: number; modified: number }[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => {
        const stat = fs.statSync(path.join(dir, e.name));
        return { name: e.name, size: stat.size, modified: stat.mtimeMs };
      })
      .sort((a, b) => b.name.localeCompare(a.name));
  } catch {
    return [];
  }
}

function searchFiles(dir: string, query: string, results: { file: string; lines: string[] }[] = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && !e.name.startsWith(".")) {
        searchFiles(full, query, results);
      } else if (e.isFile() && e.name.endsWith(".md")) {
        try {
          const content = fs.readFileSync(full, "utf-8");
          const matching = content.split("\n").filter((l) => l.toLowerCase().includes(query));
          if (matching.length > 0) {
            results.push({
              file: path.relative(WORKSPACE, full),
              lines: matching.slice(0, 5).map((l) => l.trim().slice(0, 200)),
            });
          }
        } catch {}
      }
    }
  } catch {}
  return results;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "active";
  const date = searchParams.get("date");
  const file = searchParams.get("file");
  const query = searchParams.get("q")?.toLowerCase().trim();

  // Search across all memory files
  if (query) {
    const memoryDir = path.join(WORKSPACE, "memory");
    const results = searchFiles(memoryDir, query);
    // Also search MEMORY.md and active-tasks.md
    for (const f of ["MEMORY.md", "memory/active-tasks.md"]) {
      const full = path.join(WORKSPACE, f);
      try {
        const content = fs.readFileSync(full, "utf-8");
        const matching = content.split("\n").filter((l) => l.toLowerCase().includes(query));
        if (matching.length > 0) {
          results.unshift({ file: f, lines: matching.slice(0, 5).map((l) => l.trim().slice(0, 200)) });
        }
      } catch {}
    }
    return NextResponse.json({ results });
  }

  switch (type) {
    case "active": {
      const content = readFileSafe(path.join(WORKSPACE, "memory/active-tasks.md"));
      return NextResponse.json({ content: content || "# ファイルが見つかりません" });
    }
    case "daily": {
      if (date) {
        const content = readFileSafe(path.join(WORKSPACE, `memory/${date}.md`));
        return NextResponse.json({ content: content || `# ${date} のノートが見つかりません`, date });
      }
      const files = listDir(path.join(WORKSPACE, "memory"))
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f.name));
      return NextResponse.json({ files });
    }
    case "longterm": {
      const content = readFileSafe(path.join(WORKSPACE, "MEMORY.md"));
      return NextResponse.json({ content: content || "# MEMORY.md が見つかりません" });
    }
    case "references": {
      const refDir = path.join(WORKSPACE, "memory/references");
      if (file) {
        const content = readFileSafe(path.join(refDir, file));
        return NextResponse.json({ content: content || "# ファイルが見つかりません", file });
      }
      const files = listDir(refDir);
      return NextResponse.json({ files });
    }
    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }
}
