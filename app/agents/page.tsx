"use client";

import { Crown, ScrollText, Swords } from "lucide-react";
import { AgentCard, type RpgAgentProfile } from "@/components/agents/AgentCard";

const AGENT_ROSTER: RpgAgentProfile[] = [
  {
    name: "Zen",
    role: "Squad Lead",
    agentClass: "Paladin",
    level: 20,
    hp: { current: 178, max: 190 },
    abilities: { STR: 16, DEX: 13, CON: 18, INT: 14, WIS: 17, CHA: 19 },
  },
  {
    name: "Jarvis",
    role: "Strategic Orchestrator",
    agentClass: "Artificer",
    level: 19,
    hp: { current: 150, max: 164 },
    abilities: { STR: 10, DEX: 14, CON: 14, INT: 20, WIS: 16, CHA: 15 },
  },
  {
    name: "Vision",
    role: "SEO Analyst",
    agentClass: "Cleric",
    level: 17,
    hp: { current: 139, max: 152 },
    abilities: { STR: 14, DEX: 12, CON: 16, INT: 18, WIS: 17, CHA: 15 },
  },
  {
    name: "Loki",
    role: "Content Writer",
    agentClass: "Bard",
    level: 16,
    hp: { current: 116, max: 130 },
    abilities: { STR: 10, DEX: 17, CON: 13, INT: 16, WIS: 14, CHA: 20 },
  },
  {
    name: "Quill",
    role: "Social Media Manager",
    agentClass: "Ranger",
    level: 15,
    hp: { current: 122, max: 136 },
    abilities: { STR: 13, DEX: 17, CON: 14, INT: 13, WIS: 15, CHA: 18 },
  },
  {
    name: "Wanda",
    role: "Designer",
    agentClass: "Sorcerer",
    level: 18,
    hp: { current: 129, max: 145 },
    abilities: { STR: 8, DEX: 14, CON: 14, INT: 17, WIS: 16, CHA: 20 },
  },
  {
    name: "Friday",
    role: "Developer",
    agentClass: "Warlock",
    level: 16,
    hp: { current: 118, max: 132 },
    abilities: { STR: 9, DEX: 15, CON: 14, INT: 19, WIS: 14, CHA: 16 },
  },
  {
    name: "Wong",
    role: "Documentation",
    agentClass: "Monk",
    level: 16,
    hp: { current: 130, max: 142 },
    abilities: { STR: 13, DEX: 17, CON: 15, INT: 16, WIS: 19, CHA: 12 },
  },
];

export default function AgentsPage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(circle_at_top,rgba(180,83,9,0.2),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(146,64,14,0.12),transparent_45%)]" />

      <section className="mb-8 rounded-2xl border-2 border-amber-800/35 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-800/40 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              <Crown className="h-3.5 w-3.5" />
              Mission Control Guild
            </p>
            <h1 className="text-3xl font-black tracking-wide text-amber-950">Agent Status Codex</h1>
            <p className="mt-1 text-sm text-amber-900/80">
              D&amp;Dスタイルの8エージェントステータスカード
            </p>
          </div>

          <div className="flex gap-2 text-xs font-semibold text-amber-800">
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-800/30 bg-amber-50 px-2.5 py-1.5">
              <Swords className="h-3.5 w-3.5" />
              Active Party: {AGENT_ROSTER.length}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-800/30 bg-amber-50 px-2.5 py-1.5">
              <ScrollText className="h-3.5 w-3.5" />
              Campaign: /agents
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {AGENT_ROSTER.map((agent) => (
          <AgentCard key={agent.name} agent={agent} />
        ))}
      </section>
    </div>
  );
}
