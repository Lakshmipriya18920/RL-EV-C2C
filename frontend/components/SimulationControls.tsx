"use client";

import React from "react";
import { Sliders, Sparkles, Split, ZapOff, RefreshCw, Zap } from "lucide-react";
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
    <div className="w-full rounded-[28px] bg-[#f8f8f7] dark:bg-[#111115] border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
            Grid & Fleet Parameters
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tune electrical constraints and EV load characteristics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-3 py-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            5 Active Variables
          </span>
        </div>
      </div>

      {/* 5 Input Parameters Grid (Pill style, smooth sliders, modern typography) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {/* Param 1: Transformer Capacity */}
        <div className="flex flex-col space-y-2 rounded-2xl bg-white dark:bg-zinc-900/60 p-4 border border-black/[0.04] dark:border-white/[0.06] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              1. Transformer Capacity
            </span>
            <span className="text-xs font-semibold font-mono text-zinc-900 dark:text-white bg-black/[0.04] dark:bg-white/[0.08] px-2 py-0.5 rounded-md">
              {config.transformer_capacity_kw} kVA
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={150}
            step={5}
            value={config.transformer_capacity_kw}
            onChange={(e) => updateField("transformer_capacity_kw", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer accent-zinc-900 dark:accent-white"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>50 kVA (Rural)</span>
            <span>100 kVA (Standard)</span>
            <span>150 kVA</span>
          </div>
        </div>

        {/* Param 2: EV Fleet Size */}
        <div className="flex flex-col space-y-2 rounded-2xl bg-white dark:bg-zinc-900/60 p-4 border border-black/[0.04] dark:border-white/[0.06] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              2. Connected EV Fleet
            </span>
            <span className="text-xs font-semibold font-mono text-zinc-900 dark:text-white bg-black/[0.04] dark:bg-white/[0.08] px-2 py-0.5 rounded-md">
              {config.ev_count} Vehicles
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={config.ev_count}
            onChange={(e) => updateField("ev_count", parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer accent-zinc-900 dark:accent-white"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>2 EVs</span>
            <span>10 EVs (Standard)</span>
            <span>20 EVs (Dense)</span>
          </div>
        </div>

        {/* Param 3: Peak Base Load */}
        <div className="flex flex-col space-y-2 rounded-2xl bg-white dark:bg-zinc-900/60 p-4 border border-black/[0.04] dark:border-white/[0.06] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              3. Peak Base Load
            </span>
            <span className="text-xs font-semibold font-mono text-zinc-900 dark:text-white bg-black/[0.04] dark:bg-white/[0.08] px-2 py-0.5 rounded-md">
              {config.base_load_kw} kW
            </span>
          </div>
          <input
            type="range"
            min={30}
            max={90}
            step={2}
            value={config.base_load_kw}
            onChange={(e) => updateField("base_load_kw", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer accent-zinc-900 dark:accent-white"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>30 kW (Light)</span>
            <span>60 kW (Average)</span>
            <span>90 kW (Heavy)</span>
          </div>
        </div>

        {/* Param 4: Charger Rated Power */}
        <div className="flex flex-col space-y-2 rounded-2xl bg-white dark:bg-zinc-900/60 p-4 border border-black/[0.04] dark:border-white/[0.06] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              4. Charger Power Rating
            </span>
            <span className="text-xs font-semibold font-mono text-zinc-900 dark:text-white bg-black/[0.04] dark:bg-white/[0.08] px-2 py-0.5 rounded-md">
              {config.charging_power_kw} kW
            </span>
          </div>
          <input
            type="range"
            min={3.7}
            max={11.0}
            step={0.1}
            value={config.charging_power_kw}
            onChange={(e) => updateField("charging_power_kw", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer accent-zinc-900 dark:accent-white"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>3.7 kW (L1)</span>
            <span>7.4 kW (L2 Fast)</span>
            <span>11 kW (3-Phase)</span>
          </div>
        </div>

        {/* Param 5: Outage Trip Threshold */}
        <div className="flex flex-col space-y-2 rounded-2xl bg-white dark:bg-zinc-900/60 p-4 border border-black/[0.04] dark:border-white/[0.06] shadow-sm md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              5. Protective Overload Trip Threshold
            </span>
            <span className="text-xs font-semibold font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/50 dark:border-rose-900/40">
              {config.outage_threshold_loading_percent}% Trafo Stress
            </span>
          </div>
          <input
            type="range"
            min={95}
            max={130}
            step={1}
            value={config.outage_threshold_loading_percent}
            onChange={(e) => updateField("outage_threshold_loading_percent", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer accent-rose-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>95% (Strict Safety)</span>
            <span>110% (ANSI Standard)</span>
            <span>130% (High Tolerance)</span>
          </div>
        </div>
      </div>

      {/* Action Execution Pills */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.06] dark:border-white/[0.08] pt-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Primary Action Button: Compare */}
          <button
            onClick={() => onRunSimulation("compare")}
            disabled={isLoading}
            className={`flex items-center space-x-2 rounded-full px-6 py-3 text-xs sm:text-sm font-medium transition-all shadow-sm ${
              activeMode === "compare"
                ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-200"
                : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-black/[0.08] dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Split className="h-4 w-4" />
            )}
            <span>Compare (Uncontrolled vs RL)</span>
          </button>

          {/* RL Isolated Mode */}
          <button
            onClick={() => onRunSimulation("rl")}
            disabled={isLoading}
            className={`flex items-center space-x-2 rounded-full px-5 py-3 text-xs sm:text-sm font-medium transition-all ${
              activeMode === "rl"
                ? "bg-cyan-500 text-white shadow-md"
                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.08] dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>RL Smart Balancing</span>
          </button>

          {/* Baseline Isolated Mode */}
          <button
            onClick={() => onRunSimulation("baseline")}
            disabled={isLoading}
            className={`flex items-center space-x-2 rounded-full px-5 py-3 text-xs sm:text-sm font-medium transition-all ${
              activeMode === "baseline"
                ? "bg-rose-500 text-white shadow-md"
                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.08] dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            <ZapOff className="h-4 w-4 text-rose-400" />
            <span>Uncontrolled Baseline</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-zinc-400 font-mono">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>96 Time Steps (24-Hour Horizon)</span>
        </div>
      </div>
    </div>
  );
}
