"use client";

import React, { useEffect, useState } from "react";
import { Zap, Activity, Cpu, Layers } from "lucide-react";
import { checkBackendHealth } from "@/lib/api";

interface NavbarProps {
  onSelectScenario: (scenario: string) => void;
  currentScenario: string;
}

export default function Navbar({ onSelectScenario, currentScenario }: NavbarProps) {
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  useEffect(() => {
    checkBackendHealth().then(setBackendOnline);
    const interval = setInterval(() => {
      checkBackendHealth().then(setBackendOnline);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#060608]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 via-cyan-500/10 to-purple-500/20 border border-cyan-400/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Zap className="h-5 w-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold tracking-tight text-white">
                VoltBalance <span className="text-cyan-400 font-mono text-xs font-normal">RL</span>
              </span>
              <span className="rounded-full bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                pandapower v3.5
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 hidden sm:block">
              Reinforcement Learning for EV Load-Balancing on Unreliable Grids
            </p>
          </div>
        </div>

        {/* Center / Presets */}
        <div className="hidden md:flex items-center space-x-1 rounded-full bg-white/[0.04] p-1 border border-white/[0.08]">
          {[
            { id: "normal_day", label: "Normal Day", evs: 8 },
            { id: "high_ev_penetration", label: "High EV Density", evs: 16 },
            { id: "transformer_stressed", label: "Stressed 75kVA", evs: 10 },
            { id: "outage_prone", label: "Outage Prone", evs: 14 },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                currentScenario === sc.id
                  ? "bg-white/10 text-white shadow-sm border border-white/15 text-cyan-300"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Right Status Badges */}
        <div className="flex items-center space-x-3">
          {/* Backend Health Badge */}
          <div className="flex items-center space-x-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1 text-xs text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full ${
                backendOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
              }`}
            />
            <span className="text-[11px] font-mono">
              {backendOnline ? "FastAPI Connected" : "Local Engine"}
            </span>
          </div>

          {/* GitHub Repo */}
          <a
            href="https://github.com/varungit222/Transformer-RL-C2C"
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
