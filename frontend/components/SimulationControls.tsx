"use client";

import React from "react";
import { Sliders, Play, Split, ZapOff, Sparkles, RefreshCw } from "lucide-react";
import { SimulationRequest, SimulationMode } from "@/types/simulation";

interface SimulationControlsProps {
  config: SimulationRequest;
  onChangeConfig: (newConfig: SimulationRequest) => void;
  onRunSimulation: (mode: SimulationMode) => void;
  isLoading: boolean;
  activeMode: SimulationMode;
}

export default function SimulationControls({
  config,
  onChangeConfig,
  onRunSimulation,
  isLoading,
  activeMode,
}: SimulationControlsProps) {
  const updateField = (field: keyof SimulationRequest, value: number | string) => {
    onChangeConfig({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="eleven-card p-5">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <Sliders className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Grid & EV Configuration
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">FastAPI Simulation Payload</span>
      </div>

      {/* Grid of Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* EV Count */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400">EV Fleet Count</span>
            <span className="text-cyan-300 font-bold">{config.ev_count} Vehicles</span>
          </div>
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={config.ev_count}
            onChange={(e) => updateField("ev_count", parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Transformer Capacity */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400">Transformer Capacity</span>
            <span className="text-cyan-300 font-bold">{config.transformer_capacity_kw} kVA</span>
          </div>
          <input
            type="range"
            min={50}
            max={150}
            step={5}
            value={config.transformer_capacity_kw}
            onChange={(e) => updateField("transformer_capacity_kw", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Base Load Peak */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400">Peak Base Load</span>
            <span className="text-cyan-300 font-bold">{config.base_load_kw} kW</span>
          </div>
          <input
            type="range"
            min={30}
            max={90}
            step={2}
            value={config.base_load_kw}
            onChange={(e) => updateField("base_load_kw", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* EV Charger Rated Power */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400">Charger Rated Power</span>
            <span className="text-cyan-300 font-bold">{config.charging_power_kw} kW</span>
          </div>
          <input
            type="range"
            min={3.7}
            max={11.0}
            step={0.1}
            value={config.charging_power_kw}
            onChange={(e) => updateField("charging_power_kw", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Outage Trip Threshold */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400">Outage Trip Threshold</span>
            <span className="text-rose-400 font-bold">{config.outage_threshold_loading_percent}%</span>
          </div>
          <input
            type="range"
            min={95}
            max={130}
            step={1}
            value={config.outage_threshold_loading_percent}
            onChange={(e) => updateField("outage_threshold_loading_percent", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Target SOC */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400">Target SOC</span>
            <span className="text-emerald-400 font-bold">{(config.target_soc * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={0.6}
            max={1.0}
            step={0.05}
            value={config.target_soc}
            onChange={(e) => updateField("target_soc", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
        <div className="flex items-center space-x-2">
          {/* Compare Button (Default & Recommended) */}
          <button
            onClick={() => onRunSimulation("compare")}
            disabled={isLoading}
            className={`flex items-center space-x-2 rounded-xl px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              activeMode === "compare"
                ? "eleven-btn-primary"
                : "eleven-btn-secondary"
            }`}
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Split className="h-4 w-4" />}
            <span>Compare (Baseline vs RL)</span>
          </button>

          {/* Run With RL */}
          <button
            onClick={() => onRunSimulation("rl")}
            disabled={isLoading}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-all ${
              activeMode === "rl"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                : "eleven-btn-secondary"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Run With RL</span>
          </button>

          {/* Run Without RL */}
          <button
            onClick={() => onRunSimulation("baseline")}
            disabled={isLoading}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-all ${
              activeMode === "baseline"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "eleven-btn-secondary"
            }`}
          >
            <ZapOff className="h-3.5 w-3.5 text-rose-400" />
            <span>Run Without RL</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-zinc-500">
          8-Hour Evening Window (15m Steps)
        </div>
      </div>
    </div>
  );
}
