"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import AnimatedHeading from "@/components/AnimatedHeading";
import { motion } from "framer-motion";
import SimulationControls from "@/components/SimulationControls";
import GridCanvasVisualizer from "@/components/GridCanvasVisualizer";
import MetricCards from "@/components/MetricCards";
import LoadCurvesChart from "@/components/LoadCurvesChart";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import {
  SimulationRequest,
  ComparisonSimulationResponse,
  EpisodeSimulationResponse,
  SimulationMode,
} from "@/types/simulation";
import { fetchComparisonSimulation, fetchSingleSimulation } from "@/lib/api";

export default function SimulationPage() {
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

  // Timestep scrubber state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true); // Default active playback

  // Auto step timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const total = comparisonData?.timestamps.length || singleData?.timestamps.length || 32;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => (prev >= total - 1 ? 0 : prev + 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, comparisonData, singleData]);

  // Run simulation handler: triggers fetch AND automatically starts step playback
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
      setIsPlaying(true); // Automatically start stepping through timesteps on Run Simulation click
      setIsLoading(false);
    },
    [config, activeMode]
  );

  useEffect(() => {
    handleRunSimulation("compare");
  }, []);

  const timestamps = comparisonData?.timestamps || singleData?.timestamps || [];
  const totalSteps = timestamps.length || 32;

  // Prepare chart dataset for EV charging activity
  const evActivityData = React.useMemo(() => {
    const data = comparisonData?.rl || singleData;
    if (!data) return [];

    return data.timestamps.map((t, stepIdx) => {
      const point: Record<string, any> = { timestamp: t };
      data.ev_states.forEach((ev) => {
        point[ev.ev_id] = ev.power_kw_series[stepIdx] || 0;
      });
      return point;
    });
  }, [comparisonData, singleData]);

  // Prepare base load vs EV load decomposition dataset
  const gridDecompositionData = React.useMemo(() => {
    const data = comparisonData?.rl || singleData;
    if (!data) return [];

    return data.timestamps.map((t, idx) => ({
      timestamp: t,
      base_load_kw: data.base_load_kw[idx] || 0,
      ev_load_kw: data.ev_load_kw[idx] || 0,
      total_load_kw: data.total_load_kw[idx] || 0,
      trafo_capacity: config.transformer_capacity_kw,
    }));
  }, [comparisonData, singleData, config.transformer_capacity_kw]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8 flex-1">
        {/* Header Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <AnimatedHeading
            text="AC Simulation Engine & Control"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono"
          />
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time pandapower evaluation comparing Uncontrolled FCFS vs RL Smart Balancer.
          </p>
        </div>

        {/* Inline Timestep Controller */}
        <div className="energy-card px-4 py-2 flex items-center space-x-3 text-xs font-mono">
          <button
            onClick={() => setCurrentStep(0)}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-7 w-7 rounded-md bg-cyan-500 hover:bg-cyan-400 text-zinc-950 flex items-center justify-center font-bold transition-all"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
          </button>
          <button
            onClick={() => setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1))}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="border-l border-white/10 pl-3 flex items-center space-x-2">
            <span className="text-cyan-400 font-bold">{timestamps[currentStep] || "17:00"}</span>
            <span className="text-zinc-500">
              ({currentStep + 1}/{totalSteps})
            </span>
          </div>
        </div>
      </div>

      {/* Simulation Controls Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <SimulationControls
          config={config}
          onChangeConfig={setConfig}
          onRunSimulation={handleRunSimulation}
          isLoading={isLoading}
          activeMode={activeMode}
        />
      </motion.div>

      {/* Live Telemetry Metric Cards */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
          Simulation Output Telemetry
        </h2>
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
      </motion.section>

      {/* Live Grid Canvas Visualizer */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            Feeder & Transformer Topology
          </h2>
          <span className="text-xs font-mono text-cyan-400">
            Timestep {currentStep + 1}: {timestamps[currentStep] || "17:00"}
          </span>
        </div>

        {activeMode === "compare" && comparisonData ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <GridCanvasVisualizer
              currentStep={currentStep}
              data={comparisonData.baseline}
              modeLabel="Uncontrolled Baseline (FCFS Peak)"
              isRL={false}
            />
            <GridCanvasVisualizer
              currentStep={currentStep}
              data={comparisonData.rl}
              modeLabel="RL Smart Balancer (Shaved Peak)"
              isRL={true}
            />
          </div>
        ) : (
          <GridCanvasVisualizer
            currentStep={currentStep}
            data={singleData || comparisonData?.rl || null}
            modeLabel={activeMode === "baseline" ? "Uncontrolled Baseline" : "RL Load Balancer"}
            isRL={activeMode === "rl"}
          />
        )}
      </motion.section>

      {/* Real Interactive Recharts Graphs */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-6"
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
          Real-Time Demand Curves & Load Analytics
        </h2>

        {/* 1. Large Transformer Load Over Time */}
        <LoadCurvesChart
          comparisonData={comparisonData}
          singleData={singleData}
          mode={activeMode}
          trafoCapacityKw={config.transformer_capacity_kw}
          currentStep={currentStep}
        />

        {/* 2 & 3. Side by Side EV Charging Activity & Grid Load Decomposition */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* EV Charging Activity Over Time */}
          <div className="energy-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                EV Charging Activity Over Time (kW)
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">Per-Vehicle Power</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="timestamp" stroke="#52525b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090a0f",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "0.5rem",
                      fontSize: "11px",
                    }}
                  />
                  {comparisonData?.rl.ev_states.slice(0, 6).map((ev, i) => {
                    const colors = ["#06b6d4", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];
                    return (
                      <Area
                        key={ev.ev_id}
                        type="monotone"
                        dataKey={ev.ev_id}
                        stackId="1"
                        stroke={colors[i % colors.length]}
                        fill={colors[i % colors.length]}
                        fillOpacity={0.4}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Base Load vs EV Load vs Total Grid Load */}
          <div className="energy-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                Base Load vs EV Load Decomposition
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">Grid Load Breakdown</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gridDecompositionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="timestamp" stroke="#52525b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090a0f",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "0.5rem",
                      fontSize: "11px",
                    }}
                  />
                  <ReferenceLine y={config.transformer_capacity_kw} stroke="#ef4444" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="base_load_kw" name="Base Residential Load" stackId="1" stroke="#71717a" fill="#3f3f46" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="ev_load_kw" name="EV Charging Demand" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  </div>
);
}
