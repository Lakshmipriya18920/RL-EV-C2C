"use client";

import React from "react";
import { Sparkles, Split, ZapOff, RefreshCw, Zap } from "lucide-react";
import { SimulationRequest, SimulationMode } from "@/types/simulation";
import { GooeyInput } from "@/components/ui/gooey-input";

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
  const update = (field: keyof SimulationRequest, raw: string) => {
    const value = field === "ev_count" || field === "critical_duration_steps" || field === "seed"
      ? parseInt(raw)
      : parseFloat(raw);
    if (!isNaN(value as number)) {
      onChangeConfig({ ...config, [field]: value });
    }
  };

  return (
    <div className="w-full rounded-[28px] bg-[#f8f8f7] dark:bg-[#111115] border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
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
        <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-3 py-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 w-fit">
          5 Active Variables
        </span>
      </div>

      {/* 5 GooeyInput Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">

        {/* 1. Transformer Capacity */}
        <GooeyInput
          label="1. Transformer Capacity"
          type="number"
          value={config.transformer_capacity_kw}
          min={50}
          max={150}
          step={5}
          unit="kVA"
          placeholder="100"
          onChange={(v) => update("transformer_capacity_kw", v)}
        />

        {/* 2. EV Fleet Count */}
        <GooeyInput
          label="2. Connected EV Fleet"
          type="number"
          value={config.ev_count}
          min={2}
          max={20}
          step={1}
          unit="EVs"
          placeholder="16"
          onChange={(v) => update("ev_count", v)}
        />

        {/* 3. Peak Base Load */}
        <GooeyInput
          label="3. Peak Base Load"
          type="number"
          value={config.base_load_kw}
          min={30}
          max={90}
          step={2}
          unit="kW"
          placeholder="65"
          onChange={(v) => update("base_load_kw", v)}
        />

        {/* 4. Charger Power Rating */}
        <GooeyInput
          label="4. Charger Power Rating"
          type="number"
          value={config.charging_power_kw}
          min={3.7}
          max={11.0}
          step={0.1}
          unit="kW"
          placeholder="7.4"
          onChange={(v) => update("charging_power_kw", v)}
        />

        {/* 5. Outage Trip Threshold */}
        <div className="md:col-span-2 lg:col-span-2">
          <GooeyInput
            label="5. Protective Overload Trip Threshold"
            type="number"
            value={config.outage_threshold_loading_percent}
            min={95}
            max={130}
            step={1}
            unit="%"
            placeholder="110"
            accentColor="#ef4444"
            onChange={(v) => update("outage_threshold_loading_percent", v)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.06] dark:border-white/[0.08] pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onRunSimulation("compare")}
            disabled={isLoading}
            className={`flex items-center space-x-2 rounded-full px-6 py-3 text-xs sm:text-sm font-medium transition-all shadow-sm ${
              activeMode === "compare"
                ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md"
                : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-black/[0.08] dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Split className="h-4 w-4" />}
            <span>Compare (Uncontrolled vs RL)</span>
          </button>

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
