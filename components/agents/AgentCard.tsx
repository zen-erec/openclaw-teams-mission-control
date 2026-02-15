"use client";

import { Heart, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const ABILITY_ORDER = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;

type AbilityKey = (typeof ABILITY_ORDER)[number];

const ABILITY_LABELS: Record<AbilityKey, string> = {
  STR: "筋力",
  DEX: "敏捷",
  CON: "耐久",
  INT: "知力",
  WIS: "判断",
  CHA: "魅力",
};

const ABILITY_BAR_COLORS: Record<AbilityKey, string> = {
  STR: "bg-rose-500",
  DEX: "bg-emerald-500",
  CON: "bg-sky-500",
  INT: "bg-violet-500",
  WIS: "bg-amber-500",
  CHA: "bg-fuchsia-500",
};

export interface RpgAgentProfile {
  name: string;
  role: string;
  agentClass: string;
  level: number;
  hp: {
    current: number;
    max: number;
  };
  abilities: Record<AbilityKey, number>;
}

interface AgentCardProps {
  agent: RpgAgentProfile;
}

function clampPercent(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

function getModifier(score: number) {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export function AgentCard({ agent }: AgentCardProps) {
  const hpPercent = clampPercent(agent.hp.current, agent.hp.max);
  const proficiencyBonus = Math.floor((agent.level - 1) / 4) + 2;
  const initiative = getModifier(agent.abilities.DEX);
  const armorClass = 10 + Math.floor((agent.abilities.DEX - 10) / 2) + Math.floor(agent.level / 3);

  return (
    <article className="relative overflow-hidden rounded-xl border-2 border-amber-800/40 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-5 shadow-md transition-transform duration-200 hover:-translate-y-1">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(120deg,transparent_40%,rgba(120,53,15,.2)_50%,transparent_60%)]" />

      <header className="relative mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-wide text-amber-900">{agent.name}</h2>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700/90">
            {agent.agentClass}
          </p>
        </div>
        <div className="rounded-lg border border-amber-700/40 bg-amber-100/70 px-3 py-1 text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">Level</div>
          <div className="text-3xl font-black leading-none text-amber-900">{agent.level}</div>
        </div>
      </header>

      <p className="mb-4 text-sm font-medium text-amber-900/85">{agent.role}</p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-amber-700/30 bg-amber-100/60 px-3 py-2 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
            Proficiency
          </p>
          <p className="font-bold text-amber-900">+{proficiencyBonus}</p>
        </div>
        <div className="rounded-md border border-amber-700/30 bg-amber-100/60 px-3 py-2 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">Initiative</p>
          <p className="font-bold text-amber-900">{initiative}</p>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-rose-800/20 bg-rose-50/60 p-3">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-rose-800">
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4" />
            <span>HP</span>
          </div>
          <span>{agent.hp.current}/{agent.hp.max}</span>
        </div>
        <div className="h-2 rounded-full bg-rose-200/80">
          <div
            className={cn(
              "h-2 rounded-full transition-all",
              hpPercent > 60 ? "bg-emerald-600" : hpPercent > 30 ? "bg-amber-500" : "bg-rose-600"
            )}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ABILITY_ORDER.map((ability) => {
          const score = agent.abilities[ability];
          const modifier = getModifier(score);
          const ratio = clampPercent(score, 20);

          return (
            <div
              key={ability}
              className="rounded-md border border-amber-700/25 bg-amber-50/80 px-2.5 py-2"
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900">{ability}</span>
                <span className="font-semibold text-amber-800">
                  {score} ({modifier})
                </span>
              </div>
              <p className="text-[10px] font-medium text-amber-700">{ABILITY_LABELS[ability]}</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-amber-200">
                <div
                  className={cn("h-1.5 rounded-full", ABILITY_BAR_COLORS[ability])}
                  style={{ width: `${ratio}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-4 flex items-center justify-between text-xs font-semibold text-amber-800/90">
        <span className="inline-flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" />
          AC {armorClass}
        </span>
        <span className="inline-flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          Ready
        </span>
      </footer>
    </article>
  );
}
