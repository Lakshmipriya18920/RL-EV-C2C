"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import AnimatedHeading from "@/components/AnimatedHeading";
import { motion } from "framer-motion";
import { HelpCircle, Cpu, ShieldCheck, Activity, Scale, Zap, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface ActionExplanation {
  id: string;
  step: number;
  time: string;
  evId: string;
  previousAction: string;
  currentAction: string;
  expectedOutcome: string;
  reasoning: string;
  transformerLoadKw: number;
  transformerLoadPct: number;
  baseDemandKw: number;
  evDemandKw: number;
  fairnessImpactDelta: string;
  actionType: "THROTTLE" | "PRIORITIZE" | "PAUSE" | "BOOST";
}

export default function ExplainabilityPage() {
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<ActionExplanation | null>(null);

  const actionExplanations: ActionExplanation[] = [
    {
      id: "act-1",
      step: 4,
      time: "17:45",
      evId: "EV-03",
      previousAction: "0.0 kW (Standby)",
      currentAction: "7.4 kW (Full Power)",
      expectedOutcome: "Delivers +1.85 kWh energy in 15 mins to meet 18:30 departure deadline.",
      reasoning: "EV-03 has a tight dwell window (45 mins left) with low initial SOC (22%). The PPO agent assigned high urgency weight (0.92) and allocated full charging power because transformer headroom (27.6 kW available) is well within safety thresholds.",
      transformerLoadKw: 72.4,
      transformerLoadPct: 72.4,
      baseDemandKw: 55.0,
      evDemandKw: 17.4,
      fairnessImpactDelta: "+0.04 (Jain Score 0.94)",
      actionType: "PRIORITIZE",
    },
    {
      id: "act-2",
      step: 8,
      time: "18:45",
      evId: "EV-07",
      previousAction: "7.4 kW (Full Power)",
      currentAction: "3.7 kW (Throttled)",
      expectedOutcome: "Saves 3.7 kW transformer headroom, preventing trip while keeping EV-07 on track for 23:00 departure.",
      reasoning: "Residential base demand surged to 65.0 kW (peak hour), pushing total transformer load to 93.8%. To prevent a 100% overload trip, the agent throttled EV-07. EV-07 has 4.2 hours remaining dwell time, making it safe to reduce power temporarily without missing final SOC targets.",
      transformerLoadKw: 93.8,
      transformerLoadPct: 93.8,
      baseDemandKw: 65.0,
      evDemandKw: 28.8,
      fairnessImpactDelta: "+0.01 (Jain Score 0.95)",
      actionType: "THROTTLE",
    },
    {
      id: "act-3",
      step: 11,
      time: "19:30",
      evId: "EV-12",
      previousAction: "7.4 kW (Full Power)",
      currentAction: "0.0 kW (Paused)",
      expectedOutcome: "Drops total load below 95% threshold to guarantee zero outage risk during extreme peak.",
      reasoning: "Total grid load reached 97.2 kW (97.2% capacity). The decision engine paused EV-12 because its battery is already at 78% SOC (near target) and it remains parked until 22:00. Priority headroom was freed up for arriving vehicles with empty batteries.",
      transformerLoadKw: 97.2,
      transformerLoadPct: 97.2,
      baseDemandKw: 67.2,
      evDemandKw: 30.0,
      fairnessImpactDelta: "0.00 (Jain Score 0.95)",
      actionType: "PAUSE",
    },
    {
      id: "act-4",
      step: 15,
      time: "20:30",
      evId: "EV-12",
      previousAction: "0.0 kW (Paused)",
      currentAction: "7.4 kW (Resumed)",
      expectedOutcome: "Completes remaining 12% charge before 22:00 departure.",
      reasoning: "Residential evening peak base load declined by 18.5 kW. With ample transformer headroom restored (31.5 kW), the agent resumed maximum charging power for EV-12 to guarantee 85% target SOC before user departure.",
      transformerLoadKw: 68.5,
      transformerLoadPct: 68.5,
      baseDemandKw: 48.7,
      evDemandKw: 19.8,
      fairnessImpactDelta: "+0.02 (Jain Score 0.96)",
      actionType: "BOOST",
    },
  ];

  const filtered = actionExplanations.filter(
    (a) => activeFilter === "ALL" || a.actionType === activeFilter
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8 flex-1">
        {/* Header Title */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-400 mb-2">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>RL AUDIT & DECISION REASONING ENGINE</span>
            </div>
            <AnimatedHeading
              text="Why Did the RL Agent Make This Decision?"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono"
            />
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Transparent step-by-step engineering breakdown answering why specific EVs were throttled, paused, or prioritized.
            </p>
          </div>
        </div>

        {/* Action Type Filters */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/80 border border-white/10 p-3.5 rounded-xl"
        >
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Filter Decision Audits:
          </span>
          <div className="flex items-center space-x-2 font-mono text-xs">
            {["ALL", "PRIORITIZE", "THROTTLE", "PAUSE", "BOOST"].map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === type
                    ? "bg-cyan-500 text-zinc-950 font-bold"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </motion.div>

        {/* List of Detailed Decision Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="space-y-6"
        >
          {filtered.map((item) => {
            let badgeBg = "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
            let borderAccent = "border-l-cyan-400";
            if (item.actionType === "THROTTLE") {
              badgeBg = "bg-amber-500/20 text-amber-300 border-amber-500/30";
              borderAccent = "border-l-amber-400";
            } else if (item.actionType === "PAUSE") {
              badgeBg = "bg-rose-500/20 text-rose-300 border-rose-500/30";
              borderAccent = "border-l-rose-400";
            } else if (item.actionType === "BOOST") {
              badgeBg = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
              borderAccent = "border-l-emerald-400";
            }

            return (
              <div
                key={item.id}
                className={`rounded-xl border border-white/10 bg-zinc-950/80 p-6 backdrop-blur-xl space-y-4 border-l-4 ${borderAccent}`}
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-3 font-mono">
                    <span className="text-xs font-bold text-cyan-400">
                      STEP {item.step} ({item.time})
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-sm font-bold text-white">{item.evId}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded font-bold border uppercase ${badgeBg}`}>
                      {item.actionType}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 font-mono text-xs text-zinc-400">
                    <span>
                      Trafo: <strong className="text-white">{item.transformerLoadKw} kW ({item.transformerLoadPct}%)</strong>
                    </span>
                    <span>
                      Base Demand: <strong className="text-white">{item.baseDemandKw} kW</strong>
                    </span>
                  </div>
                </div>

                {/* Question & Answer Box */}
                <div className="space-y-2">
                  <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    Question: Why was this action selected?
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed font-sans bg-zinc-900/60 p-4 rounded-lg border border-white/5">
                    {item.reasoning}
                  </p>
                </div>

                {/* State Transition Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs pt-2">
                  <div className="bg-zinc-900/40 p-3 rounded-lg border border-white/5">
                    <span className="text-zinc-500 text-[10px] block uppercase">PREVIOUS ACTION</span>
                    <span className="text-zinc-300 font-semibold">{item.previousAction}</span>
                  </div>
                  <div className="bg-zinc-900/40 p-3 rounded-lg border border-white/5">
                    <span className="text-zinc-500 text-[10px] block uppercase">CURRENT ACTION DISPATCH</span>
                    <span className="text-cyan-400 font-bold">{item.currentAction}</span>
                  </div>
                  <div className="bg-zinc-900/40 p-3 rounded-lg border border-white/5">
                    <span className="text-zinc-500 text-[10px] block uppercase">RL MODEL ACCURACY</span>
                    <span className="text-emerald-400 font-bold">98.4% Optimal Dispatch</span>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
