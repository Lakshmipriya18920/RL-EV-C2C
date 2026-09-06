"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import AnimatedHeading from "@/components/AnimatedHeading";
import GridTopologyDiagram from "@/components/GridTopologyDiagram";
import { motion } from "framer-motion";
import { checkBackendHealth, fetchComparisonSimulation } from "@/lib/api";
import { ComparisonSimulationResponse } from "@/types/simulation";
import { Zap, ShieldCheck, Activity, Layers, Server } from "lucide-react";

export default function GridTopologyPage() {
  const [simulationData, setSimulationData] = useState<ComparisonSimulationResponse | null>(null);

  useEffect(() => {
    fetchComparisonSimulation({
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
    }).then(setSimulationData);
  }, []);

  const rlData = simulationData?.rl;
  const currentLoadKw = rlData ? rlData.total_load_kw[rlData.total_load_kw.length - 1] || 78.4 : 78.4;
  const minVoltagePu = rlData ? rlData.metrics.min_voltage_pu : 0.985;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8 flex-1">
        {/* Page Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-400 mb-2">
              <Zap className="h-3.5 w-3.5" />
              <span>ELECTRICAL POWER FLOW SCHEMATIC</span>
            </div>
            <AnimatedHeading
              text="Feeder & Transformer Topology"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono"
            />
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Interactive distribution network map showing grid power flow from 11 kV Substation to EV Charging Clusters.
            </p>
          </div>
        </div>

        {/* Central Interactive Electrical Network Visualizer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GridTopologyDiagram
            currentLoadKw={currentLoadKw}
            capacityKw={100.0}
            voltagePu={minVoltagePu}
            temperatureC={62.5}
          />
        </motion.div>

        {/* Technical Network Specs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4"
        >
          <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold">
              <Server className="h-4 w-4" />
              <span>SUBSTATION IMPEDANCE</span>
            </div>
            <h3 className="text-sm font-semibold text-white">Line R/X Calibration</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pandapower AC power flow modeled with R = 0.125 Ω/km, X = 0.085 Ω/km per feeder segment to compute real distribution line losses.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>THERMAL LIMITS</span>
            </div>
            <h3 className="text-sm font-semibold text-white">Protection Relays</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Automatic overcurrent trip set to 110% loading threshold (110 kW) with a 2-step critical duration hold timer.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 font-bold">
              <Layers className="h-4 w-4" />
              <span>VOLTAGE STABILITY</span>
            </div>
            <h3 className="text-sm font-semibold text-white">ANSI C84.1 Range</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Maintains bus voltage within ±5% nominal (0.95 to 1.05 p.u.) during max peak charging hours.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
