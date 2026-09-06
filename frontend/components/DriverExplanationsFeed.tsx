"use client";

import React from "react";
import { Terminal, Shield, Info, AlertTriangle } from "lucide-react";
import { EpisodeSimulationResponse } from "@/types/simulation";

interface DriverExplanationsFeedProps {
  currentStep: number;
  data: EpisodeSimulationResponse | null;
  trafoCapacityKw: number;
}

export default function DriverExplanationsFeed({
  currentStep,
  data,
  trafoCapacityKw,
}: DriverExplanationsFeedProps) {
  if (!data || !data.timestamps) return null;

  const step = Math.min(currentStep, data.timestamps.length - 1);
  const time = data.timestamps[step] || "17:00";
  const loadingPct = data.transformer_loading_percent[step] || 0;
  const loadKw = data.total_load_kw[step] || 0;
  const state = data.transformer_state[step] || "NORMAL";

  const throttledEvs = data.ev_states
    .filter((ev) => ev.state_series[step] === "REDUCED")
    .map((ev) => ev.ev_id);

  const pausedEvs = data.ev_states
    .filter((ev) => ev.state_series[step] === "WAITING")
    .map((ev) => ev.ev_id);

  const chargingEvs = data.ev_states
    .filter((ev) => ev.state_series[step] === "CHARGING")
    .map((ev) => ev.ev_id);

  return (
    <div className="eleven-card p-5">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            RL Scheduling Decision & Driver Narrative
          </span>
        </div>
        <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
          Transparency Log
        </span>
      </div>

      <div className="rounded-xl bg-black/40 border border-white/[0.06] p-3 font-mono text-xs text-zinc-300 space-y-2">
        <div className="flex items-start space-x-2">
          <span className="text-cyan-400">[{time}]</span>
          <div>
            {state === "SIMULATED_OUTAGE" ? (
              <p className="text-rose-400">
                ⚠️ CATASTROPHIC OUTAGE: Sustained overload exceeded transformer thermal trip limit. All chargers disconnected.
              </p>
            ) : loadingPct > 95 ? (
              <p className="text-amber-300">
                ⚡ PEAK LOAD BALANCING: Transformer demand reached {loadKw.toFixed(1)} kW ({loadingPct.toFixed(1)}% of {trafoCapacityKw} kW). RL agent prioritized urgent departures and throttled {throttledEvs.length} vehicles ({throttledEvs.join(", ")}) to 3.7 kW to prevent blackout.
              </p>
            ) : (
              <p className="text-emerald-400">
                ✓ SAFE HEADROOM: Grid loading is {loadingPct.toFixed(1)}%. {chargingEvs.length} EVs charging at full 7.4 kW rated power ({chargingEvs.join(", ")}).
              </p>
            )}
          </div>
        </div>

        {/* Explainability Breakdown */}
        <div className="mt-2 pt-2 border-t border-white/[0.06] flex flex-wrap gap-4 text-[11px] text-zinc-400">
          <div>
            <span className="text-zinc-500">Full Power:</span>{" "}
            <span className="text-emerald-400 font-bold">{chargingEvs.length}</span>
          </div>
          <div>
            <span className="text-zinc-500">Throttled (3.7 kW):</span>{" "}
            <span className="text-amber-400 font-bold">{throttledEvs.length}</span>
          </div>
          <div>
            <span className="text-zinc-500">Queued / Waiting:</span>{" "}
            <span className="text-cyan-400 font-bold">{pausedEvs.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
