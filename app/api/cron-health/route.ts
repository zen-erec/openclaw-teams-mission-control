import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jobsPath = path.join(
      process.env.HOME || "~",
      ".openclaw/cron/jobs.json"
    );
    if (!fs.existsSync(jobsPath)) {
      return NextResponse.json({ jobs: [], error: "jobs.json not found" });
    }
    const raw = fs.readFileSync(jobsPath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ jobs: data.jobs || [] });
  } catch (e: any) {
    return NextResponse.json({ jobs: [], error: e.message }, { status: 500 });
  }
}
