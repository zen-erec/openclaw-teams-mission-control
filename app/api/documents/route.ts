import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { glob } from "glob";

export const dynamic = "force-dynamic";

const WORKSPACE = path.join(process.env.HOME || "~", ".openclaw/workspace");

const KNOWN_FILES = [
  "erec-corporate/AI_BUSINESS_PLAN.md",
  "民泊/MIGRATION_PLAN.md",
  "民泊/STRAPI_SCHEMA.md",
  "民泊/高砂/PROJECT_SUMMARY.md",
  "民泊/高砂/REQUIREMENTS.md",
  "民泊/高砂/DESIGN_GUIDELINES.md",
  "民泊/高砂/WIREFRAMES.md",
  "民泊/高砂/SETUP_GUIDE.md",
  "民泊/高砂/PMS_SELECTION_REPORT.md",
  "民泊/須崎/SITE_MAP.md",
  "民泊/須崎/FRONTEND_DESIGN.md",
  "erec-corporate/SITE_MAP.md",
  "erec-corporate/FRONTEND_DESIGN.md",
  "propify-ai/TASKS_BACKLOG.md",
  "contracts/adsense-account-rental-agreement.md",
  "民泊/高砂/CONTENT_DRAFT.md",
  "民泊/高砂/CONTENT_EXTENDED.md",
  "民泊/高砂/CONTENT_PAGES.md",
  "ai-jitsumu-lab/PLAN.md",
  "ai-jitsumu-lab/X_OWNER_ACCOUNT_PLAN.md",
];

const DYNAMIC_PATTERNS = [
  "**/REPORT*.md",
  "**/*_REPORT.md",
  "**/COMPLETION_REPORTS.md",
  "TEAM_POLICY.md",
  "**/*_PLAN.md",
  "**/*_DESIGN.md",
  "**/*_GUIDELINES.md",
  "**/*_SCHEMA.md",
  "**/*_STRATEGY.md",
  "**/PROJECT_SUMMARY.md",
  "**/SITE_MAP.md",
  "**/SETUP_GUIDE.md",
  "**/REQUIREMENTS.md",
  "**/WIREFRAMES.md",
  "**/CONTENT_*.md",
  "**/PMS_*.md",
  "contracts/*.md",
  "ai-jitsumu-lab/x-tweets/*.md",
];

interface DocInfo {
  name: string;
  path: string;
  project: string;
  category: string;
  size: number;
  modified: number;
}

function classifyProject(filePath: string): string {
  if (filePath.startsWith("民泊/高砂")) return "民泊高砂";
  if (filePath.startsWith("民泊/須崎")) return "民泊須崎";
  if (filePath.startsWith("民泊")) return "民泊";
  if (filePath.startsWith("erec-corporate")) return "eREC";
  if (filePath.startsWith("propify-ai")) return "Propify";
  if (filePath.startsWith("contracts")) return "契約書";
  if (filePath.startsWith("ai-jitsumu-lab")) return "AI実務ラボ";
  const first = filePath.split("/")[0];
  return first || "その他";
}

function classifyCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("report") || lower.includes("completion")) return "レポート";
  if (lower.includes("plan") || lower.includes("backlog") || lower.includes("migration")) return "計画書";
  if (lower.includes("policy")) return "ポリシー";
  return "設計書";
}

async function scanDocuments(): Promise<DocInfo[]> {
  const docs = new Map<string, DocInfo>();

  // Known files
  for (const rel of KNOWN_FILES) {
    const full = path.join(WORKSPACE, rel);
    try {
      const stat = fs.statSync(full);
      docs.set(rel, {
        name: path.basename(rel),
        path: rel,
        project: classifyProject(rel),
        category: classifyCategory(path.basename(rel)),
        size: stat.size,
        modified: stat.mtimeMs,
      });
    } catch {}
  }

  // Dynamic patterns
  for (const pattern of DYNAMIC_PATTERNS) {
    try {
      const matches = await glob(pattern, { cwd: WORKSPACE, nodir: true, ignore: ["node_modules/**", ".git/**", "**/node_modules/**"] });
      for (const rel of matches) {
        if (docs.has(rel)) continue;
        const full = path.join(WORKSPACE, rel);
        try {
          const stat = fs.statSync(full);
          docs.set(rel, {
            name: path.basename(rel),
            path: rel,
            project: classifyProject(rel),
            category: classifyCategory(path.basename(rel)),
            size: stat.size,
            modified: stat.mtimeMs,
          });
        } catch {}
      }
    } catch {}
  }

  return Array.from(docs.values()).sort((a, b) => b.modified - a.modified);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");
  const download = searchParams.get("download") === "true";
  const query = searchParams.get("q")?.toLowerCase().trim();

  // Single file content or download
  if (filePath) {
    const normalized = path.normalize(filePath);
    if (normalized.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    const full = path.join(WORKSPACE, normalized);
    if (!full.startsWith(WORKSPACE)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    try {
      const content = fs.readFileSync(full, "utf-8");
      if (download) {
        return new NextResponse(content, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="${path.basename(full)}"`,
          },
        });
      }
      const stat = fs.statSync(full);
      return NextResponse.json({ content, name: path.basename(full), path: normalized, modified: stat.mtimeMs, size: stat.size });
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }

  // List / search
  const docs = await scanDocuments();

  if (query) {
    const results = docs.filter((d) => {
      if (d.name.toLowerCase().includes(query) || d.path.toLowerCase().includes(query)) return true;
      try {
        const content = fs.readFileSync(path.join(WORKSPACE, d.path), "utf-8");
        return content.toLowerCase().includes(query);
      } catch {
        return false;
      }
    });
    return NextResponse.json({ documents: results });
  }

  return NextResponse.json({ documents: docs });
}
