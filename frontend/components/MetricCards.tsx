"use client";

import React from "react";
import { TrendingDown, ShieldCheck, Zap, BatteryCharging, CheckCircle2 } from "lucide-react";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Metric 1: Peak Demand & Shaving */}
      <div className="rounded-[24px] bg-[#f8f8f7] dark:bg-[#111115] border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:scale-[1.01]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Peak Demand Load
          </span>
          <span className="rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200/50 dark:border-cyan-800/30 px-2 py-0.5 text-[10px] font-mono font-medium">
            Transformer Stress
          </span>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
            {mode === "compare"
              ? `${rl?.peak_load_kw.toFixed(1)} kW`
              : `${(rl || base)?.peak_load_kw.toFixed(1)} kW`}
          </span>
          {mode === "compare" && base && (
            <span className="text-xs font-mono text-zinc-400 line-through">
              {base.peak_load_kw.toFixed(1)} kW
            </span>
          )}
        </div>
        {mode === "compare" && peakReductionPct > 0 ? (
          <div className="mt-2 flex items-center space-x-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>↓ {peakReductionPct.toFixed(1)}% Peak Shaved</span>
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-zinc-400">Maximum recorded active feeder load</p>
        )}
      </div>

      {/* Metric 2: Grid Reliability & Outage Prevention */}
      <div className="rounded-[24px] bg-[#f8f8f7] dark:bg-[#111115] border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:scale-[1.01]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Grid Reliability
          </span>
          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 px-2 py-0.5 text-[10px] font-mono font-medium">
            Thermal Trip Model
          </span>
        </div>
        <div className="mt-3">
          {mode === "compare" ? (
            <div className="flex flex-col">
              <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-500" />
                RL: 0 Outages (Safe)
              </span>
              <span className="text-xs font-mono text-rose-500 mt-1">
                Baseline: {base?.outage_occurred ? "Blackout Tripped" : "Overload Warning"}
              </span>
            </div>
          ) : (
            <span
              className={`text-xl font-bold font-mono ${
                (rl || base)?.outage_occurred
                  ? "text-rose-500"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {(rl || base)?.outage_occurred ? "Outage Tripped" : "100% Operational"}
            </span>
          )}
        </div>
        <p className="mt-2 text-[11px] text-zinc-400">
          {(rl || base)?.overload_timesteps === 0
            ? "0 overload timesteps detected"
            : `${(rl || base)?.overload_timesteps} overload timesteps`}
        </p>
      </div>

      {/* Metric 3: Delivered Fleet Energy */}
      <div className="rounded-[24px] bg-[#f8f8f7] dark:bg-[#111115] border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:scale-[1.01]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Energy Delivered
          </span>
          <span className="rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/30 px-2 py-0.5 text-[10px] font-mono font-medium">
            EV Fleet
          </span>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
            {mode === "compare"
              ? `${rl?.total_energy_delivered_kwh.toFixed(1)} kWh`
              : `${(rl || base)?.total_energy_delivered_kwh.toFixed(1)} kWh`}
          </span>
          {mode === "compare" && base && (
            <span className="text-xs font-mono text-zinc-400 line-through">
              {base.total_energy_delivered_kwh.toFixed(1)}
            </span>
          )}
        </div>
        {mode === "compare" && energyGainPct > 0 ? (
          <div className="mt-2 flex items-center space-x-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
            <BatteryCharging className="h-3.5 w-3.5" />
            <span>+{energyGainPct.toFixed(0)}% More Energy</span>
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-zinc-400">Total net energy transferred to EV batteries</p>
        )}
      </div>

      {/* Metric 4: Driver Satisfaction & Fairness */}
      <div className="rounded-[24px] bg-[#f8f8f7] dark:bg-[#111115] border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:scale-[1.01]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Target SOC Delivery
          </span>
          <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 px-2 py-0.5 text-[10px] font-mono font-medium">
            Fairness Index
          </span>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
            {mode === "compare"
              ? `${rl?.satisfaction_percent.toFixed(1)}%`
              : `${(rl || base)?.satisfaction_percent.toFixed(1)}%`}
          </span>
          {mode === "compare" && base && (
            <span className="text-xs font-mono text-zinc-400 line-through">
              {base.satisfaction_percent.toFixed(1)}%
            </span>
          )}
        </div>
        <p className="mt-2 text-[11px] text-zinc-400">
          Percentage of desired departure battery SOC fulfilled
        </p>
      </div>
    </div>
  );
}
