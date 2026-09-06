"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, AlertTriangle, Activity, Server, Radio, Cpu, Layers } from "lucide-react";

interface GridTopologyProps {
  currentLoadKw?: number;
  capacityKw?: number;
  voltagePu?: number;
  temperatureC?: number;
  evActiveCount?: number;
}

export default function GridTopologyDiagram({
  currentLoadKw = 78.4,
  capacityKw = 100.0,
  voltagePu = 0.985,
  temperatureC = 58.2,
  evActiveCount = 12,
}: GridTopologyProps) {
  const [activeNode, setActiveNode] = useState<string>("transformer");
  const loadingPct = Math.min(130, Math.round((currentLoadKw / capacityKw) * 100));

  // Determine state color
  let statusColor = "text-cyan-400";
  let strokeColor = "#06b6d4";
  let glowColor = "rgba(6, 182, 212, 0.25)";
  let statusText = "OPTIMAL";

  if (loadingPct >= 100) {
    statusColor = "text-rose-500";
    strokeColor = "#ef4444";
    glowColor = "rgba(239, 68, 68, 0.35)";
    statusText = "OVERLOADED";
  } else if (loadingPct >= 80) {
    statusColor = "text-amber-400";
    strokeColor = "#f59e0b";
    glowColor = "rgba(245, 158, 11, 0.3)";
    statusText = "HIGH LOAD";
  }

  // Calculate ring arc SVG parameters
  const ringRadius = 54;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (Math.min(100, loadingPct) / 100) * circumference;

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 p-6 md:p-8 backdrop-blur-xl space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white font-mono tracking-tight">
              11 kV Distribution Feeder & Substation Topology
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time power flow directional routing from 11 kV grid down to low-voltage EV charging clusters.
          </p>
        </div>

        {/* Live Status Telemetry Pill */}
        <div className="flex items-center space-x-4 bg-zinc-900/80 border border-white/10 px-4 py-2 rounded-lg font-mono text-xs">
          <div>
            <span className="text-zinc-500 block text-[10px]">GRID FREQ</span>
            <span className="text-white font-semibold">50.02 Hz</span>
          </div>
          <div className="h-6 w-[1px] bg-white/10" />
          <div>
            <span className="text-zinc-500 block text-[10px]">VOLTAGE</span>
            <span className={`font-semibold ${voltagePu < 0.95 ? "text-amber-400" : "text-emerald-400"}`}>
              {voltagePu.toFixed(3)} p.u.
            </span>
          </div>
          <div className="h-6 w-[1px] bg-white/10" />
          <div>
            <span className="text-zinc-500 block text-[10px]">STATUS</span>
            <span className={`font-bold ${statusColor}`}>{statusText}</span>
          </div>
        </div>
      </div>

      {/* Main Hierarchical Visual Network Diagram */}
      <div className="relative w-full min-h-[580px] bg-zinc-900/40 rounded-xl border border-white/5 p-6 flex flex-col items-center justify-between overflow-hidden">
        {/* Animated Background Power Lines Canvas Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        {/* --- STAGE 1: TOP 11 kV MAIN GRID & SUBSTATION --- */}
        <motion.div
          onMouseEnter={() => setActiveNode("grid")}
          whileHover={{ scale: 1.02 }}
          className={`cursor-pointer z-10 rounded-xl border px-8 py-4 bg-zinc-950/90 flex items-center space-x-4 shadow-lg transition-all ${
            activeNode === "grid" ? "border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]" : "border-white/15"
          }`}
        >
          <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-cyan-400 font-bold">NODE 01</span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-400 font-mono">11 kV / 415 V</span>
            </div>
            <h3 className="text-base font-bold text-white">Central Regional Substation</h3>
            <p className="text-xs text-zinc-400">High Voltage Distribution Feeder Bus #1</p>
          </div>
        </motion.div>

        {/* Vertical Connecting Feeder Line from Substation to Transformer */}
        <div className="relative h-16 w-1 bg-white/10 my-1 z-0">
          <motion.div
            className="absolute top-0 left-0 w-full bg-cyan-400 rounded-full"
            style={{ height: "40%" }}
            animate={{ y: [0, 40] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* --- STAGE 2: CENTER PROMINENT TRANSFORMER WITH LOAD RING METER --- */}
        <motion.div
          onMouseEnter={() => setActiveNode("transformer")}
          whileHover={{ scale: 1.02 }}
          className={`cursor-pointer z-10 w-full max-w-xl rounded-2xl border p-6 bg-zinc-950/95 shadow-2xl transition-all relative overflow-hidden ${
            activeNode === "transformer"
              ? "border-cyan-400/60 shadow-[0_0_35px_rgba(6,182,212,0.25)]"
              : "border-white/15"
          }`}
        >
          {/* Subtle Ambient Glow corresponding to transformer load state */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-500"
            style={{ background: `radial-gradient(circle at center, ${strokeColor}, transparent 70%)` }}
          />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            {/* Center Load Meter Ring */}
            <div className="relative flex items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r={ringRadius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Dynamic Load Ring */}
                <motion.circle
                  cx="72"
                  cy="72"
                  r={ringRadius}
                  stroke={strokeColor}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>

              {/* Inner Ring Text */}
              <div className="absolute text-center">
                <span className={`text-2xl font-bold font-mono ${statusColor}`}>
                  {loadingPct}%
                </span>
                <span className="text-[10px] text-zinc-400 font-mono block uppercase">Loading</span>
              </div>
            </div>

            {/* Transformer Detailed Telemetry Metrics */}
            <div className="flex-1 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-zinc-300 font-semibold">100 kVA Distribution Transformer</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${statusColor} bg-white/5`}>
                  {statusText}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[10px]">ACTIVE LOAD</span>
                  <span className="text-white font-bold">{currentLoadKw.toFixed(1)} kW / {capacityKw} kW</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">OIL TEMP</span>
                  <span className={`font-bold ${temperatureC > 70 ? "text-amber-400" : "text-zinc-200"}`}>
                    {temperatureC.toFixed(1)} °C
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">BUS VOLTAGE</span>
                  <span className="text-zinc-200 font-bold">{voltagePu.toFixed(3)} p.u.</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">HEADROOM</span>
                  <span className="text-cyan-400 font-bold">{Math.max(0, capacityKw - currentLoadKw).toFixed(1)} kW</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Branching Feeder Lines connecting Transformer to 3 Feeder Branches */}
        <div className="relative w-full max-w-3xl h-14 my-1 z-0">
          <svg className="w-full h-full">
            <path
              d="M 50% 0 L 50% 20 L 16.6% 20 L 16.6% 100% M 50% 20 L 50% 100% M 50% 20 L 83.3% 20 L 83.3% 100%"
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* --- STAGE 3: BOTTOM 3 FEEDER BRANCHES & EV CLUSTERS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full z-10">
          {/* Feeder 1 */}
          <motion.div
            onMouseEnter={() => setActiveNode("feeder1")}
            whileHover={{ y: -3 }}
            className={`cursor-pointer rounded-xl border p-4 bg-zinc-950/90 transition-all ${
              activeNode === "feeder1" ? "border-cyan-400 bg-zinc-900/60" : "border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-cyan-400">FEEDER LINE #1</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white">Residential Chargers A</h4>
            <p className="text-xs text-zinc-400 mt-1">6 Active Stations (44.4 kW Total)</p>
            <div className="mt-3 flex items-center space-x-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-2 flex-1 rounded-full bg-cyan-500" title={`Station A-${i+1}: 7.4 kW`} />
              ))}
            </div>
          </motion.div>

          {/* Feeder 2 */}
          <motion.div
            onMouseEnter={() => setActiveNode("feeder2")}
            whileHover={{ y: -3 }}
            className={`cursor-pointer rounded-xl border p-4 bg-zinc-950/90 transition-all ${
              activeNode === "feeder2" ? "border-cyan-400 bg-zinc-900/60" : "border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-cyan-400">FEEDER LINE #2</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                BALANCED
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white">Commercial Fleet Cluster B</h4>
            <p className="text-xs text-zinc-400 mt-1">6 Active Stations (34.0 kW Throttle)</p>
            <div className="mt-3 flex items-center space-x-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i % 2 === 0 ? "bg-cyan-400" : "bg-purple-400"}`} />
              ))}
            </div>
          </motion.div>

          {/* Feeder 3 */}
          <motion.div
            onMouseEnter={() => setActiveNode("feeder3")}
            whileHover={{ y: -3 }}
            className={`cursor-pointer rounded-xl border p-4 bg-zinc-950/90 transition-all ${
              activeNode === "feeder3" ? "border-cyan-400 bg-zinc-900/60" : "border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-cyan-400">FEEDER LINE #3</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                STANDBY
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white">Fast Depot Cluster C</h4>
            <p className="text-xs text-zinc-400 mt-1">4 Active Stations (0 kW Paused)</p>
            <div className="mt-3 flex items-center space-x-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-2 flex-1 rounded-full bg-zinc-700" title={`Station C-${i+1}: Paused`} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
