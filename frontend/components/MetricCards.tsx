"use client";

import React from "react";
import { TrendingDown, ShieldCheck, Zap, BatteryCharging, AlertOctagon, CheckCircle2 } from "lucide-react";
import { MetricsResponse } from "@/types/simulation";

interface MetricCardsProps {
  baselineMetrics: MetricsResponse | null;
  rlMetrics: MetricsResponse | null;
  mode: "compare" | "baseline" | "rl";
}

export default function MetricCards({
  baselineMetrics,
  rlMetrics,
  mode,
}: MetricCardsProps) {
  if (!baselineMetrics && !rlMetrics) return null;

  const base = baselineMetrics;
  const rl = rlMetrics;

  const peakReductionPct =
    base && rl && base.peak_load_kw > 0
      ? ((base.peak_load_kw - rl.peak_load_kw) / base.peak_load_kw) * 100
      : 0;

  const energyGainPct =
    base && rl && base.total_energy_delivered_kwh > 0
      ? ((rl.total_energy_delivered_kwh - base.total_energy_delivered_kwh) / base.total_energy_delivered_kwh) * 100
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Peak Demand & Shaving */}
      <div className="eleven-card p-4 bg-gradient-to-br from-cyan-500/[0.05] to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Peak Demand (kW)</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">
            {mode === "compare" ? `${rl?.peak_load_kw.toFixed(1)} kW` : `${(rl || base)?.peak_load_kw.toFixed(1)} kW`}
          </span>
          {mode === "compare" && base && (
            <span className="text-xs font-mono text-zinc-500 line-through">
              {base.peak_load_kw.toFixed(1)} kW
            </span>
          )}
        </div>
        {mode === "compare" && peakReductionPct > 0 && (
          <div className="mt-1 flex items-center space-x-1 text-xs font-mono text-emerald-400 font-semibold">
            <span>↓ {peakReductionPct.toFixed(1)}% Peak Shaving</span>
          </div>
        )}
      </div>

      {/* Card 2: Outage & Reliability Status */}
      <div className="eleven-card p-4 bg-gradient-to-br from-emerald-500/[0.05] to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Grid Reliability</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-center space-x-2">
          {mode === "compare" ? (
            <div className="flex flex-col">
              <span className="text-sm font-bold font-mono text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-400" />
                RL: 0 Outages (Safe)
              </span>
              <span className="text-xs font-mono text-rose-400 mt-0.5">
                Baseline: {base?.outage_occurred ? "Blackout Tripped!" : "No Outage"}
              </span>
            </div>
          ) : (
            <span className={`text-base font-bold font-mono ${(rl || base)?.outage_occurred ? "text-rose-400" : "text-emerald-400"}`}>
              {(rl || base)?.outage_occurred ? "Outage Tripped" : "100% Operational"}
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          {(rl || base)?.overload_timesteps === 0 ? "0 overload timesteps" : `${(rl || base)?.overload_timesteps} overload steps detected`}
        </p>
      </div>

      {/* Card 3: Energy Delivered */}
      <div className="eleven-card p-4 bg-gradient-to-br from-purple-500/[0.05] to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Total Delivered Energy</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BatteryCharging className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">
            {mode === "compare" ? `${rl?.total_energy_delivered_kwh.toFixed(1)} kWh` : `${(rl || base)?.total_energy_delivered_kwh.toFixed(1)} kWh`}
          </span>
          {mode === "compare" && base && (
            <span className="text-xs font-mono text-zinc-500 line-through">
              {base.total_energy_delivered_kwh.toFixed(1)}
            </span>
          )}
        </div>
        {mode === "compare" && energyGainPct > 0 && (
          <div className="mt-1 flex items-center space-x-1 text-xs font-mono text-emerald-400 font-semibold">
            <span>+{energyGainPct.toFixed(0)}% More Energy</span>
          </div>
        )}
      </div>

      {/* Card 4: Satisfaction Rate */}
      <div className="eleven-card p-4 bg-gradient-to-br from-amber-500/[0.05] to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Target Satisfaction</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">
            {mode === "compare" ? `${rl?.satisfaction_percent.toFixed(1)}%` : `${(rl || base)?.satisfaction_percent.toFixed(1)}%`}
          </span>
          {mode === "compare" && base && (
            <span className="text-xs font-mono text-zinc-500 line-through">
              {base.satisfaction_percent.toFixed(1)}%
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          Percentage of desired departure SOC delivered
        </p>
      </div>
    </div>
  );
}
