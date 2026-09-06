"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import ElevenSpheresShowcase from "@/components/ElevenSpheresShowcase";
import SimulationControls from "@/components/SimulationControls";
import GridCanvasVisualizer from "@/components/GridCanvasVisualizer";
import LoadCurvesChart from "@/components/LoadCurvesChart";
import MetricCards from "@/components/MetricCards";
import DriverExplanationsFeed from "@/components/DriverExplanationsFeed";
import PlaybackController from "@/components/PlaybackController";
import { ArrowRight, Sparkles, Zap, Shield, BarChart3 } from "lucide-react";
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

  const simRef = useRef<HTMLDivElement | null>(null);

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

  const scrollToSim = () => {
    if (simRef.current) {
      simRef.current.scrollIntoView({ behavior: "smooth" });
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
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors selection:bg-amber-500/20 selection:text-amber-700 dark:selection:text-amber-300">
      {/* ElevenLabs Navbar */}
      <Navbar
        onSelectScenario={handleSelectScenario}
        currentScenario={config.scenario_name || "high_ev_penetration"}
        onLaunchModal={scrollToSim}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-8 sm:py-12 space-y-16">
        {/* ========================================================= */}
        {/* SECTION 1: ELEVENLABS EXACT HERO HEADER & TYPOGRAPHY      */}
        {/* ========================================================= */}
        <section id="overview" className="pt-4 sm:pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Headline */}
            <div className="lg:col-span-6 space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-zinc-950 dark:text-white leading-[1.1]">
                Bringing <br />
                <span className="font-semibold">intelligence to the grid</span>
              </h1>

              {/* Action Buttons (Pill shaped solid black + outline) */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleRunSimulation("compare")}
                  className="rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-6 py-3 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm hover:shadow active:scale-95"
                >
                  Run Simulation
                </button>
                <button
                  onClick={scrollToSim}
                  className="rounded-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 border border-black/[0.1] dark:border-white/10 px-6 py-3 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm active:scale-95"
                >
                  Explore Scenarios
                </button>
              </div>
            </div>

            {/* Right Value Proposition */}
            <div className="lg:col-span-6 lg:pt-3">
              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
                Powering stable distribution networks, EV fleet operators, and utility transformers.
                From RL-driven peak shaving to cross-session driver fairness and blackout prevention.
              </p>

              {/* Feature Pills */}
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center space-x-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] px-3 py-1">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span>pandapower 3.5 AC Solver</span>
                </span>
                <span className="flex items-center space-x-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                  <span>Stable-Baselines3 PPO</span>
                </span>
                <span className="flex items-center space-x-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] px-3 py-1">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Jain's Fairness Ledger</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: ELEVENLABS 3D SPHERES & THUNDER ARC CAROUSEL   */}
        {/* ========================================================= */}
        <section className="w-full rounded-[36px] bg-[#f8f8f7] dark:bg-[#111115] border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.04)]">
          <ElevenSpheresShowcase
            onTriggerSim={() => handleRunSimulation("compare")}
          />
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: 5 INPUT PARAMETERS CONFIGURATION PANEL        */}
        {/* ========================================================= */}
        <section id="parameters" ref={simRef} className="space-y-4">
          <SimulationControls
            config={config}
            onChangeConfig={setConfig}
            onRunSimulation={handleRunSimulation}
            isLoading={isLoading}
            activeMode={activeMode}
          />
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: LIVE OUTPUT TELEMETRY METRIC CARDS             */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
              Simulation Telemetry & Metrics
            </h2>
            <span className="text-xs font-mono text-zinc-400">
              Comparing Uncontrolled vs RL Scheduling
            </span>
          </div>
          <MetricCards
            baselineMetrics={
              comparisonData?.baseline.metrics ||
              (activeMode === "baseline" ? singleData?.metrics : null) ||
              null
            }
            rlMetrics={
              comparisonData?.rl.metrics ||
              (activeMode === "rl" ? singleData?.metrics : null) ||
              null
            }
            mode={activeMode}
          />
        </section>

        {/* ========================================================= */}
        {/* SECTION 5: INTERACTIVE POWER GRID VISUALIZER              */}
        {/* ========================================================= */}
        <section id="live-grid" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
                Distribution Feeder & Transformer Topology
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                11 kV Grid Substation → 100 kVA Transformer → 20 Connected EV Charging Stations
              </p>
            </div>
            <span className="text-xs font-mono bg-black/[0.04] dark:bg-white/[0.06] px-3 py-1 rounded-full text-zinc-600 dark:text-zinc-400">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>

          {activeMode === "compare" && comparisonData ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <GridCanvasVisualizer
                currentStep={currentStep}
                data={comparisonData.baseline}
                modeLabel="Uncontrolled Baseline (FCFS Spike)"
                isRL={false}
              />
              <GridCanvasVisualizer
                currentStep={currentStep}
                data={comparisonData.rl}
                modeLabel="RL Load-Balancer (Peak Shaved)"
                isRL={true}
              />
            </div>
          ) : (
            <GridCanvasVisualizer
              currentStep={currentStep}
              data={singleData || comparisonData?.rl || null}
              modeLabel={
                activeMode === "baseline"
                  ? "Baseline (Uncontrolled FCFS)"
                  : "RL Load-Balancer"
              }
              isRL={activeMode === "rl"}
            />
          )}
        </section>

        {/* ========================================================= */}
        {/* SECTION 6: LOAD CURVES & DRIVER EXPLAINABILITY            */}
        {/* ========================================================= */}
        <section id="analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LoadCurvesChart
              comparisonData={comparisonData}
              singleData={singleData}
              mode={activeMode}
              trafoCapacityKw={config.transformer_capacity_kw}
              currentStep={currentStep}
            />
          </div>
          <div id="explainability">
            <DriverExplanationsFeed
              currentStep={currentStep}
              data={activeRLData || activeBaselineData || null}
              trafoCapacityKw={config.transformer_capacity_kw}
            />
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 7: STICKY PLAYBACK CONTROLLER TIMELINE            */}
        {/* ========================================================= */}
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

        {/* ========================================================= */}
        {/* FOOTER                                                    */}
        {/* ========================================================= */}
        <footer className="border-t border-black/[0.06] dark:border-white/[0.08] pt-8 pb-12 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <span className="font-semibold text-zinc-900 dark:text-white">COOKED</span>
            <span>—</span>
            <span>Reinforcement Learning for EV Charging Load-Balancing on Unreliable Grids</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Educational & Research Simulation • pandapower • Gymnasium • Stable-Baselines3 • Next.js • Tailwind CSS
          </p>
        </footer>
      </main>
    </div>
  );
}
