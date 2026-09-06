"use client";

import React from "react";
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
      <div className="energy-card flex h-80 items-center justify-center p-6 text-zinc-500 text-xs">
        <p>No simulation dataset available. Click Explore Simulation to start.</p>
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
  const isOverload = trafoState === "CRITICAL" || trafoState === "OVERLOAD";

  return (
    <div className="energy-card p-6 space-y-6 font-mono">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.1] pb-4">
        <div className="flex items-center space-x-3">
          <span className={`h-3 w-3 rounded-full ${isOutage ? "bg-rose-500" : isRL ? "bg-cyan-400" : "bg-zinc-400"}`} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            {modeLabel}
          </h3>
        </div>

        <div className="flex items-center space-x-6 text-xs text-zinc-300">
          <span>Bus Voltage: <strong className={minVoltagePu < 0.95 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{minVoltagePu.toFixed(3)} p.u.</strong></span>
          <span>Step {step + 1} ({timeLabel})</span>
        </div>
      </div>

      {/* Grid Network Topology Flow (Spacious Layout) */}
      <div className="space-y-6">
        {/* Layer 1: Substation & Transformer Line */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Substation Text Box */}
          <div className="p-4 bg-black/60 border border-white/10 rounded-xl space-y-1.5">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold">Primary Substation</span>
            <div className="font-extrabold text-white text-base">11.0 kV Feeder</div>
            <div className="text-xs text-zinc-400">1.02 p.u. Nominal</div>
          </div>

          {/* Transformer Core Node */}
          <div className={`p-4 bg-black/60 border rounded-xl space-y-1.5 ${isOutage ? "border-rose-500/60" : isOverload ? "border-amber-500/60" : "border-cyan-500/40"}`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold">Transformer State</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isOutage ? "bg-rose-500/20 text-rose-300" : isOverload ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                {trafoState}
              </span>
            </div>
            <div className="font-extrabold text-white text-base">{trafoLoadKw.toFixed(1)} kW Load</div>
            <div className="text-xs text-zinc-400">100 kVA Rated Capacity</div>
          </div>

          {/* Base Load Text Box */}
          <div className="p-4 bg-black/60 border border-white/10 rounded-xl space-y-1.5">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold">Base Demand</span>
            <div className="font-extrabold text-zinc-200 text-base">{baseLoadKw.toFixed(1)} kW</div>
            <div className="text-xs text-zinc-400">Residential Baseline</div>
          </div>
        </div>

        {/* Layer 2: EV Fleet Charger Cards Grid (Spacious 4-Column Layout) */}
        <div className="p-5 bg-black/40 border border-white/10 rounded-xl space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-white/10 pb-3">
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Connected EV Fleet Ports ({data.ev_states.length} Active Stations)
            </span>
            <span className="text-sm font-bold text-cyan-400">
              Total EV Load: {evTotalKw.toFixed(1)} kW
            </span>
          </div>

          {/* Spacious EV Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {data.ev_states.map((ev) => {
              const evSoc = ev.soc_series[step] !== undefined ? ev.soc_series[step] : 0.0;
              const evState = ev.state_series[step] || "DISCONNECTED";
              const evKw = ev.power_kw_series[step] !== undefined ? ev.power_kw_series[step] : 0.0;

              const statusColor =
                evState === "CHARGING"
                  ? "text-cyan-300 border-cyan-500/40 bg-cyan-500/10"
                  : evState === "REDUCED"
                  ? "text-amber-300 border-amber-500/40 bg-amber-500/10"
                  : evState === "FULLY_CHARGED"
                  ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                  : "text-zinc-400 border-zinc-800 bg-zinc-900/60";

              return (
                <div
                  key={ev.ev_id}
                  className={`p-3.5 rounded-lg border space-y-2 ${statusColor}`}
                >
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span className="text-white">{ev.ev_id}</span>
                    <span className="text-xs font-mono">{evKw > 0 ? `${evKw.toFixed(1)} kW` : evState}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <span>State of Charge</span>
                    <span className="font-bold">{(evSoc * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
