"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import SimulationControls from "@/components/SimulationControls";
import GridCanvasVisualizer from "@/components/GridCanvasVisualizer";
import LoadCurvesChart from "@/components/LoadCurvesChart";
import MetricCards from "@/components/MetricCards";
import DriverExplanationsFeed from "@/components/DriverExplanationsFeed";
import PlaybackController from "@/components/PlaybackController";
import {
  SimulationRequest,
  ComparisonSimulationResponse,
  EpisodeSimulationResponse,
  SimulationMode,
} from "@/types/simulation";
import { fetchComparisonSimulation, fetchSingleSimulation } from "@/lib/api";

const PRESET_SCENARIOS: Record<string, Partial<SimulationRequest>> = {
  normal_day: {
    scenario_name: "normal_day",
    ev_count: 8,
    transformer_capacity_kw: 100.0,
    base_load_kw: 55.0,
    charging_power_kw: 7.4,
    battery_capacity_kwh: 50.0,
    target_soc: 0.85,
    outage_threshold_loading_percent: 115.0,
  },
  high_ev_penetration: {
    scenario_name: "high_ev_penetration",
    ev_count: 16,
    transformer_capacity_kw: 100.0,
    base_load_kw: 65.0,
    charging_power_kw: 7.4,
    battery_capacity_kwh: 55.0,
    target_soc: 0.90,
    outage_threshold_loading_percent: 110.0,
  },
  transformer_stressed: {
    scenario_name: "transformer_stressed",
    ev_count: 10,
    transformer_capacity_kw: 75.0,
    base_load_kw: 60.0,
    charging_power_kw: 7.4,
    battery_capacity_kwh: 50.0,
    target_soc: 0.85,
    outage_threshold_loading_percent: 110.0,
  },
  outage_prone: {
    scenario_name: "outage_prone",
    ev_count: 14,
    transformer_capacity_kw: 80.0,
    base_load_kw: 62.0,
    charging_power_kw: 7.4,
    battery_capacity_kwh: 50.0,
    target_soc: 0.90,
    outage_threshold_loading_percent: 105.0,
  },
};

export default function Home() {
  const [config, setConfig] = useState<SimulationRequest>({
    scenario_name: "high_ev_penetration",
    ev_count: 16,
    transformer_capacity_kw: 100.0,
    base_load_kw: 65.0,
    charging_power_kw: 7.4,
    battery_capacity_kwh: 50.0,
    target_soc: 0.85,
    duration_hours: 8,
    time_step_minutes: 15,
    outage_threshold_loading_percent: 110.0,
    critical_duration_steps: 2,
    seed: 42,
  });

  const [activeMode, setActiveMode] = useState<SimulationMode>("compare");
  const [comparisonData, setComparisonData] = useState<ComparisonSimulationResponse | null>(null);
  const [singleData, setSingleData] = useState<EpisodeSimulationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Playback state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Run simulation
  const handleRunSimulation = useCallback(
    async (mode: SimulationMode = activeMode) => {
      setIsLoading(true);
      setActiveMode(mode);

      if (mode === "compare") {
        const res = await fetchComparisonSimulation(config);
        setComparisonData(res);
        setSingleData(null);
      } else {
        const res = await fetchSingleSimulation(config, mode);
        setSingleData(res);
        setComparisonData(null);
      }

      setCurrentStep(0);
      setIsPlaying(true);
      setIsLoading(false);
    },
    [config, activeMode]
  );

  // Initial simulation run on load
  useEffect(() => {
    handleRunSimulation("compare");
  }, []);

  // Preset scenario selection
  const handleSelectScenario = (scKey: string) => {
    const preset = PRESET_SCENARIOS[scKey];
    if (preset) {
      const newCfg = { ...config, ...preset };
      setConfig(newCfg);
      // Auto-run updated scenario
      setIsLoading(true);
      fetchComparisonSimulation(newCfg).then((res) => {
        setComparisonData(res);
        setSingleData(null);
        setActiveMode("compare");
        setCurrentStep(0);
        setIsLoading(false);
      });
    }
  };

  const timestamps =
    comparisonData?.timestamps || singleData?.timestamps || [];
  const totalSteps = timestamps.length || 32;

  const activeRLData =
    activeMode === "compare" ? comparisonData?.rl : activeMode === "rl" ? singleData : null;
  const activeBaselineData =
    activeMode === "compare" ? comparisonData?.baseline : activeMode === "baseline" ? singleData : null;

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      <Navbar
        onSelectScenario={handleSelectScenario}
        currentScenario={config.scenario_name || "high_ev_penetration"}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 space-y-6">
        {/* KPI Metric Cards */}
        <MetricCards
          baselineMetrics={comparisonData?.baseline.metrics || (activeMode === "baseline" ? singleData?.metrics : null) || null}
          rlMetrics={comparisonData?.rl.metrics || (activeMode === "rl" ? singleData?.metrics : null) || null}
          mode={activeMode}
        />

        {/* Configuration Panel */}
        <SimulationControls
          config={config}
          onChangeConfig={setConfig}
          onRunSimulation={handleRunSimulation}
          isLoading={isLoading}
          activeMode={activeMode}
        />

        {/* Centerpiece Grid Visualizer (Dual or Single) */}
        {activeMode === "compare" && comparisonData ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <GridCanvasVisualizer
              currentStep={currentStep}
              data={comparisonData.baseline}
              modeLabel="Baseline (Uncontrolled FCFS)"
              isRL={false}
            />
            <GridCanvasVisualizer
              currentStep={currentStep}
              data={comparisonData.rl}
              modeLabel="RL Load-Balancer (Intelligent Schedule)"
              isRL={true}
            />
          </div>
        ) : (
          <GridCanvasVisualizer
            currentStep={currentStep}
            data={singleData || comparisonData?.rl || null}
            modeLabel={activeMode === "baseline" ? "Baseline (Uncontrolled FCFS)" : "RL Load-Balancer"}
            isRL={activeMode === "rl"}
          />
        )}

        {/* Demand Curves Chart & Explainability Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LoadCurvesChart
              comparisonData={comparisonData}
              singleData={singleData}
              mode={activeMode}
              trafoCapacityKw={config.transformer_capacity_kw}
              currentStep={currentStep}
            />
          </div>
          <div>
            <DriverExplanationsFeed
              currentStep={currentStep}
              data={activeRLData || activeBaselineData || null}
              trafoCapacityKw={config.transformer_capacity_kw}
            />
          </div>
        </div>

        {/* Bottom Floating Playback Controller */}
        <PlaybackController
          currentStep={currentStep}
          totalSteps={totalSteps}
          timestamps={timestamps}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onSeek={setCurrentStep}
          onReset={() => {
            setCurrentStep(0);
            setIsPlaying(true);
          }}
          speed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
        />
      </main>
    </div>
  );
}
