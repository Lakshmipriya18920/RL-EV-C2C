"use client";

import React from "react";
import { Zap, AlertTriangle, BatteryCharging, CheckCircle2, Clock, ShieldAlert, Home, Radio } from "lucide-react";
import { EpisodeSimulationResponse } from "@/types/simulation";

interface GridVisualizerProps {
  currentStep: number;
  data: EpisodeSimulationResponse | null;
  modeLabel: string;
  isRL: boolean;
}

export default function GridCanvasVisualizer({
  currentStep,
  data,
  modeLabel,
  isRL,
}: GridVisualizerProps) {
  if (!data || !data.timestamps || data.timestamps.length === 0) {
    return (
      <div className="eleven-card flex h-96 items-center justify-center p-6 text-zinc-500">
        <p>No simulation data loaded. Click Run to start.</p>
      </div>
    );
  }

  const step = Math.min(currentStep, data.timestamps.length - 1);
  const timeLabel = data.timestamps[step] || "17:00";
  const trafoLoadKw = data.total_load_kw[step] || 0;
  const trafoLoadingPct = data.transformer_loading_percent[step] || 0;
  const baseLoadKw = data.base_load_kw[step] || 0;
  const evTotalKw = data.ev_load_kw[step] || 0;
  const minVoltagePu = data.min_bus_voltage_pu[step] || 1.0;
  const trafoState = data.transformer_state[step] || "NORMAL";

  const isOutage = trafoState === "SIMULATED_OUTAGE" || trafoState === "OFFLINE";
  const isCritical = trafoState === "CRITICAL";
  const isOverload = trafoState === "OVERLOAD";
  const isHighLoad = trafoState === "HIGH_LOAD";

  // Transformer color scheme
  let trafoColor = "from-emerald-500/20 border-emerald-500/40 text-emerald-400";
  let trafoGlow = "shadow-[0_0_30px_rgba(16,185,129,0.2)]";
  let trafoBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

  if (isOutage) {
    trafoColor = "from-zinc-800 border-zinc-700 text-zinc-500";
    trafoGlow = "shadow-[0_0_20px_rgba(239,68,68,0.3)]";
    trafoBadge = "bg-rose-950/50 text-rose-400 border-rose-500/50 animate-pulse";
  } else if (isCritical || isOverload) {
    trafoColor = "from-rose-500/20 border-rose-500/50 text-rose-400";
    trafoGlow = "shadow-[0_0_35px_rgba(239,68,68,0.35)] animate-pulse";
    trafoBadge = "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse";
  } else if (isHighLoad) {
    trafoColor = "from-amber-500/20 border-amber-500/40 text-amber-400";
    trafoGlow = "shadow-[0_0_25px_rgba(245,158,11,0.2)]";
    trafoBadge = "bg-amber-500/10 text-amber-400 border-amber-500/30";
  }

  return (
    <div className="eleven-card relative overflow-hidden p-6">
      {/* Background glow orbs */}
      <div className="glow-orb-cyan -top-20 -left-20 opacity-30" />
      <div className="glow-orb-purple -bottom-20 -right-20 opacity-20" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-3 w-3 items-center justify-center">
            <span className={`h-2.5 w-2.5 rounded-full ${isOutage ? "bg-rose-500" : isRL ? "bg-cyan-400" : "bg-zinc-400"} animate-ping`} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            {modeLabel} Active Topology
          </span>
          <span className="rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-0.5 text-xs font-mono text-zinc-300">
            Step {step + 1} / {data.timestamps.length} ({timeLabel})
          </span>
        </div>

        {/* Live Metrics Pill */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <span>Base:</span>
            <span className="text-zinc-200 font-semibold">{baseLoadKw.toFixed(1)} kW</span>
          </div>
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <span>EVs:</span>
            <span className="text-cyan-300 font-semibold">{evTotalKw.toFixed(1)} kW</span>
          </div>
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <span>Voltage:</span>
            <span className={`font-semibold ${minVoltagePu < 0.95 ? "text-rose-400" : "text-emerald-400"}`}>
              {minVoltagePu.toFixed(3)} pu
            </span>
          </div>
        </div>
      </div>

      {/* Main Electrical Network SVG Architecture */}
      <div className="mt-6 flex flex-col items-center">
        {/* Layer 1: Substation Grid */}
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2 rounded-xl bg-white/[0.03] border border-white/10 px-4 py-1.5 text-xs font-medium text-zinc-300 shadow-sm">
            <Radio className="h-4 w-4 text-purple-400" />
            <span>11 kV Medium Voltage Grid</span>
          </div>
          {/* Transmission Line Pulse */}
          <div className="h-6 w-0.5 bg-gradient-to-b from-purple-400/50 to-cyan-400/50" />
        </div>

        {/* Layer 2: Distribution Transformer (The Centerpiece) */}
        <div className={`relative flex w-full max-w-md flex-col items-center rounded-2xl bg-gradient-to-b ${trafoColor} ${trafoGlow} border p-4 text-center backdrop-blur-xl transition-all duration-300`}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span className="text-xs font-semibold tracking-tight text-white">
                11/0.4 kV Distribution Transformer
              </span>
            </div>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase font-bold tracking-wider ${trafoBadge}`}>
              {trafoState}
            </span>
          </div>

          {/* Transformer Loading Percentage Bar */}
          <div className="mt-3 w-full">
            <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
              <span>Loading: {trafoLoadingPct.toFixed(1)}%</span>
              <span>{trafoLoadKw.toFixed(1)} kW</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/40 border border-white/10">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  trafoLoadingPct > 100
                    ? "bg-gradient-to-r from-amber-500 to-rose-500"
                    : trafoLoadingPct > 85
                    ? "bg-gradient-to-r from-emerald-400 to-amber-400"
                    : "bg-gradient-to-r from-cyan-400 to-emerald-400"
                }`}
                style={{ width: `${Math.min(100, trafoLoadingPct)}%` }}
              />
            </div>
          </div>

          {isOutage && (
            <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-rose-400 font-semibold animate-pulse">
              <ShieldAlert className="h-4 w-4" />
              <span>SIMULATED OUTAGE TRIPPED — Grid Offline</span>
            </div>
          )}
        </div>

        {/* Feeder Distribution Bus Line */}
        <div className="h-6 w-0.5 bg-white/20" />
        <div className="w-full max-w-4xl h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Layer 3: Branch Consumers (Households & EV Fleet) */}
        <div className="mt-4 grid w-full max-w-5xl grid-cols-1 md:grid-cols-4 gap-4">
          {/* Household Base Load Card */}
          <div className="eleven-card flex flex-col justify-between p-4 bg-white/[0.02] border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Home className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-zinc-200">Residential Base</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400 font-semibold">
                {baseLoadKw.toFixed(1)} kW
              </span>
            </div>
            <p className="mt-3 text-[11px] text-zinc-500">
              Neighborhood cooking, HVAC & baseline evening demand.
            </p>
          </div>

          {/* EV Fleet Charger Nodes Grid */}
          <div className="md:col-span-3 eleven-card p-4 bg-white/[0.02] border-white/[0.06]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <BatteryCharging className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-medium text-zinc-200">
                  Connected EV Fleet ({data.ev_states.length} Chargers)
                </span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                Total EV Load: {evTotalKw.toFixed(1)} kW
              </span>
            </div>

            {/* Individual EV Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {data.ev_states.map((ev) => {
                const evSoc = ev.soc_series[step] !== undefined ? ev.soc_series[step] : 0.0;
                const evState = ev.state_series[step] || "DISCONNECTED";
                const evKw = ev.power_kw_series[step] !== undefined ? ev.power_kw_series[step] : 0.0;

                let stateBadge = "bg-zinc-800/60 text-zinc-500 border-zinc-700/50";
                let iconColor = "text-zinc-500";
                let cardGlow = "border-white/[0.05]";

                if (evState === "CHARGING") {
                  stateBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                  iconColor = "text-emerald-400";
                  cardGlow = "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                } else if (evState === "REDUCED") {
                  stateBadge = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                  iconColor = "text-amber-400";
                  cardGlow = "border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.12)]";
                } else if (evState === "WAITING") {
                  stateBadge = "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
                  iconColor = "text-cyan-400";
                  cardGlow = "border-cyan-500/20";
                } else if (evState === "FULLY_CHARGED") {
                  stateBadge = "bg-teal-500/10 text-teal-300 border-teal-500/30";
                  iconColor = "text-teal-300";
                  cardGlow = "border-teal-500/30";
                }

                return (
                  <div
                    key={ev.ev_id}
                    className={`flex flex-col rounded-xl bg-white/[0.02] border ${cardGlow} p-2.5 transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-zinc-300">{ev.ev_id}</span>
                      <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-mono font-medium ${stateBadge}`}>
                        {evState === "CHARGING" ? "7.4 kW" : evState === "REDUCED" ? "3.7 kW" : evState === "FULLY_CHARGED" ? "FULL" : evState === "WAITING" ? "PAUSED" : "OFF"}
                      </span>
                    </div>

                    {/* SOC Gauge */}
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>SOC: {(evSoc * 100).toFixed(0)}%</span>
                      {evState === "FULLY_CHARGED" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                      ) : (
                        <Zap className={`h-3 w-3 ${iconColor} ${evKw > 0 ? "animate-pulse" : ""}`} />
                      )}
                    </div>

                    {/* SOC Progress Bar */}
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          evState === "FULLY_CHARGED"
                            ? "bg-teal-400"
                            : evState === "REDUCED"
                            ? "bg-amber-400"
                            : "bg-cyan-400"
                        }`}
                        style={{ width: `${Math.min(100, evSoc * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
