"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import AnimatedHeading from "@/components/AnimatedHeading";
import { motion } from "framer-motion";
import { Search, ChevronRight, X, Battery, Zap, Clock, ShieldCheck, Cpu } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface EVNodeData {
  id: string;
  station: string;
  batteryCapacityKwh: number;
  currentSoc: number; // 0.0 - 1.0
  targetSoc: number;
  status: "CHARGING" | "PAUSED" | "WAITING" | "DISCONNECTED" | "COMPLETE";
  chargingPowerKw: number;
  waitTimeMins: number;
  arrivalTime: string;
  departureTime: string;
  urgency: number;
}

export default function EVFleetPage() {
  const [selectedEvId, setSelectedEvId] = useState<string | null>(null);
  const [hoveredEv, setHoveredEv] = useState<EVNodeData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 16 Compact EV Fleet Nodes dataset
  const fleetNodes: EVNodeData[] = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const id = `EV-${(i + 1).toString().padStart(2, "0")}`;
      const station = `STATION-${(i + 1).toString().padStart(2, "0")}`;
      const batteryCap = 50 + (i % 3) * 10;
      const isComplete = i % 5 === 0;
      const isPaused = i === 3 || i === 7 || i === 11;
      const isWaiting = i === 9;
      const isDisconnected = i === 14;

      let status: EVNodeData["status"] = "CHARGING";
      let power = 7.4;
      let soc = 0.35 + ((i * 4) % 45) / 100;
      let waitMins = 0;

      if (isComplete) {
        status = "COMPLETE";
        power = 0;
        soc = 0.92;
      } else if (isPaused) {
        status = "PAUSED";
        power = 0;
        waitMins = 15 + i * 5;
      } else if (isWaiting) {
        status = "WAITING";
        power = 0;
        waitMins = 30;
      } else if (isDisconnected) {
        status = "DISCONNECTED";
        power = 0;
        soc = 0.2;
      } else if (i % 2 === 1) {
        power = 3.7; // Reduced power by RL
      }

      return {
        id,
        station,
        batteryCapacityKwh: batteryCap,
        currentSoc: soc,
        targetSoc: 0.85,
        status,
        chargingPowerKw: power,
        waitTimeMins: waitMins,
        arrivalTime: "17:00",
        departureTime: "21:00",
        urgency: Math.round((0.85 - soc) * 100) / 100,
      };
    });
  }, []);

  const filteredNodes = useMemo(() => {
    return fleetNodes.filter((ev) => {
      const matchSearch = ev.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || ev.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [fleetNodes, searchQuery, statusFilter]);

  const activeEv = fleetNodes.find((ev) => ev.id === selectedEvId) || null;

  // Counts
  const countCharging = fleetNodes.filter((ev) => ev.status === "CHARGING").length;
  const countPaused = fleetNodes.filter((ev) => ev.status === "PAUSED").length;
  const countWaiting = fleetNodes.filter((ev) => ev.status === "WAITING").length;
  const countComplete = fleetNodes.filter((ev) => ev.status === "COMPLETE").length;
  const totalFleetKw = fleetNodes.reduce((acc, ev) => acc + ev.chargingPowerKw, 0);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8 flex-1">
        {/* Page Title & Status Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-400 mb-2">
              <Cpu className="h-3.5 w-3.5" />
              <span>RL FLEET DISPATCH MATRIX</span>
            </div>
            <AnimatedHeading
              text="EV Fleet Dispatch & Station Matrix"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono"
            />
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Compact interactive node matrix displaying real-time charging status, SOC, power allocation, and wait times per vehicle.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center space-x-4 bg-zinc-950 border border-white/10 px-4 py-2.5 rounded-xl font-mono text-xs">
            <div>
              <span className="text-zinc-500 text-[10px] block">TOTAL FLEET DEMAND</span>
              <span className="text-cyan-400 font-bold text-base">{totalFleetKw.toFixed(1)} kW</span>
            </div>
            <div className="h-7 w-[1px] bg-white/10" />
            <div>
              <span className="text-zinc-500 text-[10px] block">CHARGING / PAUSED</span>
              <span className="text-white font-bold text-base">{countCharging} / {countPaused}</span>
            </div>
            <div className="h-7 w-[1px] bg-white/10" />
            <div>
              <span className="text-zinc-500 text-[10px] block">TARGET COMPLETE</span>
              <span className="text-emerald-400 font-bold text-base">{countComplete} EVs</span>
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/80 border border-white/10 p-3.5 rounded-xl"
        >
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search EV ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-mono">
            {["ALL", "CHARGING", "PAUSED", "WAITING", "COMPLETE"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === st
                    ? "bg-cyan-500 text-zinc-950 font-bold"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </motion.div>

        {/* --- COMPACT INTERACTIVE EV FLEET MATRIX --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 relative"
        >
          {filteredNodes.map((ev) => {
            const isHovered = hoveredEv?.id === ev.id;
            const isSelected = selectedEvId === ev.id;
            const socPct = Math.round(ev.currentSoc * 100);

            // Styling based on state
            let borderStyle = "border-white/10 bg-zinc-950/60";
            let badgeBg = "bg-zinc-800 text-zinc-400";
            let dotBg = "bg-zinc-500";
            let powerColor = "text-zinc-400";

            if (ev.status === "CHARGING") {
              borderStyle = "border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-400";
              badgeBg = "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
              dotBg = "bg-cyan-400 animate-pulse";
              powerColor = "text-cyan-400";
            } else if (ev.status === "PAUSED") {
              borderStyle = "border-amber-500/30 bg-amber-950/20 hover:border-amber-400";
              badgeBg = "bg-amber-500/20 text-amber-300 border border-amber-500/30";
              dotBg = "bg-amber-400";
              powerColor = "text-amber-400";
            } else if (ev.status === "COMPLETE") {
              borderStyle = "border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-400";
              badgeBg = "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
              dotBg = "bg-emerald-400";
              powerColor = "text-emerald-400";
            } else if (ev.status === "WAITING") {
              borderStyle = "border-purple-500/30 bg-purple-950/20 hover:border-purple-400";
              badgeBg = "bg-purple-500/20 text-purple-300 border border-purple-500/30";
              dotBg = "bg-purple-400";
            }

            return (
              <div
                key={ev.id}
                onMouseEnter={() => setHoveredEv(ev)}
                onMouseLeave={() => setHoveredEv(null)}
                onClick={() => setSelectedEvId(ev.id)}
                className={`cursor-pointer rounded-xl border p-3.5 backdrop-blur-md transition-all duration-200 relative group ${borderStyle} ${
                  isSelected ? "ring-2 ring-cyan-400 bg-zinc-900" : ""
                }`}
              >
                {/* Top Node Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-white group-hover:text-cyan-300">
                    {ev.id}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${dotBg}`} />
                </div>

                {/* SOC Meter Bar */}
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                    <span>SOC</span>
                    <span className="font-bold text-white">{socPct}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        ev.status === "COMPLETE"
                          ? "bg-emerald-400"
                          : ev.status === "PAUSED"
                          ? "bg-amber-400"
                          : "bg-cyan-400"
                      }`}
                      style={{ width: `${socPct}%` }}
                    />
                  </div>
                </div>

                {/* Power & Status */}
                <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                  <span className={`font-semibold ${powerColor}`}>
                    {ev.chargingPowerKw > 0 ? `${ev.chargingPowerKw} kW` : "0 kW"}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase ${badgeBg}`}>
                    {ev.status}
                  </span>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Hover Inspector Tooltip Panel */}
        {hoveredEv && (
          <div className="rounded-xl border border-white/10 bg-zinc-900/90 p-4 backdrop-blur-xl font-mono text-xs transition-all">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <Battery className="h-4 w-4 text-cyan-400" />
                <span className="font-bold text-white">{hoveredEv.id} Live Telemetry</span>
                <span className="text-zinc-500">({hoveredEv.station})</span>
              </div>
              <span className="text-cyan-400 font-semibold">Click node for deep audit log</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <span className="text-zinc-500 text-[10px] block uppercase">State of Charge</span>
                <span className="text-white font-bold text-sm">{(hoveredEv.currentSoc * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block uppercase">Charging Power</span>
                <span className="text-cyan-400 font-bold text-sm">{hoveredEv.chargingPowerKw} kW</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block uppercase">Current Status</span>
                <span className="text-emerald-400 font-bold text-sm">{hoveredEv.status}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block uppercase">Waiting Time</span>
                <span className="text-amber-400 font-bold text-sm">{hoveredEv.waitTimeMins} mins</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] block uppercase">Battery Capacity</span>
                <span className="text-zinc-300 font-bold text-sm">{hoveredEv.batteryCapacityKwh} kWh</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected EV Drawer Modal */}
        {activeEv && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-lg bg-zinc-950 border-l border-white/10 p-6 space-y-6 overflow-y-auto h-full font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{activeEv.id} Detailed Inspector</h3>
                  <p className="text-xs text-zinc-400 font-sans">Station: {activeEv.station}</p>
                </div>
                <button
                  onClick={() => setSelectedEvId(null)}
                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-white/10 rounded-lg p-3">
                  <span className="text-zinc-500 text-[10px] block">BATTERY CAPACITY</span>
                  <span className="text-white font-bold text-sm">{activeEv.batteryCapacityKwh} kWh</span>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-lg p-3">
                  <span className="text-zinc-500 text-[10px] block">ALLOCATED POWER</span>
                  <span className="text-cyan-400 font-bold text-sm">{activeEv.chargingPowerKw} kW</span>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-lg p-3">
                  <span className="text-zinc-500 text-[10px] block">ESTIMATED DWELL</span>
                  <span className="text-white font-bold text-sm">{activeEv.arrivalTime} – {activeEv.departureTime}</span>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-lg p-3">
                  <span className="text-zinc-500 text-[10px] block">RL URGENCY SCORE</span>
                  <span className="text-purple-400 font-bold text-sm">{activeEv.urgency}</span>
                </div>
              </div>

              <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  RL Dispatch Rationale
                </h4>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  {activeEv.status === "PAUSED"
                    ? "Vehicle power temporarily paused by PPO agent to resolve 94% transformer overload condition. Higher urgency EVs prioritized."
                    : activeEv.status === "CHARGING"
                    ? "Allocated full 7.4 kW charge. Dwell window tight relative to remaining 45% battery deficit."
                    : "Target state of charge (85%) fully satisfied. Charger switched to standby mode."}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
