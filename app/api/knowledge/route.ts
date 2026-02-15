import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const WORKSPACE_ROOT = path.join(process.env.HOME || "~", ".openclaw/workspace");
const SEARCH_EXTENSIONS = [".md", ".txt", ".json", ".ts", ".tsx", ".js", ".jsx", ".yaml", ".yml"];
const MAX_FILES = 500;
const MAX_RESULTS = 30;

function walkDir(dir: string, files: string[] = [], depth = 0): string[] {
  if (depth > 5 || files.length >= MAX_FILES) return files;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= MAX_FILES) break;
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === ".next") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(full, files, depth + 1);
      } else if (SEARCH_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
        files.push(full);
      }
    }
  } catch {}
  return files;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").toLowerCase().trim();

  if (!query) {
    // Return file tree summary
    const files = walkDir(WORKSPACE_ROOT);
    const tree = files.map((f) => ({
      path: path.relative(WORKSPACE_ROOT, f),
      size: fs.statSync(f).size,
      modified: fs.statSync(f).mtimeMs,
    }));
    tree.sort((a, b) => b.modified - a.modified);
    return NextResponse.json({ files: tree.slice(0, 100), total: tree.length });
  }

  // Search
  const files = walkDir(WORKSPACE_ROOT);
  const results: { path: string; matches: string[]; score: number }[] = [];

  for (const filePath of files) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > 200_000) continue; // skip large files
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      const matchingLines: string[] = [];

      for (const line of lines) {
        if (line.toLowerCase().includes(query)) {
          matchingLines.push(line.trim().slice(0, 200));
        }
      }

      const relPath = path.relative(WORKSPACE_ROOT, filePath);
      const nameMatch = relPath.toLowerCase().includes(query) ? 10 : 0;

      if (matchingLines.length > 0 || nameMatch > 0) {
        results.push({
          path: relPath,
          matches: matchingLines.slice(0, 3),
          score: matchingLines.length + nameMatch,
        });
      }
    } catch {}
  }

  results.sort((a, b) => b.score - a.score);
  return NextResponse.json({ results: results.slice(0, MAX_RESULTS), query });
}
