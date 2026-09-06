"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface Stage {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  technicalDetails: string[];
}

const STAGES: Stage[] = [
  {
    id: "grid",
    number: "01",
    title: "Grid Conditions",
    subtitle: "Input State Vector",
    description:
      "Captures real-time 11 kV feeder line voltages, base residential load profiles, transformer oil temperature estimates, and incoming EV arrival/departure windows.",
    technicalDetails: [
      "AC Power Flow state (Pandapower solver)",
      "Continuous base demand tracking (kW)",
      "Individual EV arrival & target SOC metrics",
    ],
  },
  {
    id: "observe",
    number: "02",
    title: "RL Agent Observes",
    subtitle: "PPO Policy Neural Net",
    description:
      "The Proximal Policy Optimization (PPO) neural network processes normalized state vectors and projects safe headroom under transformer thermal limits.",
    technicalDetails: [
      "Actor-Critic Dual-Head Deep Neural Network",
      "Dynamic state space normalization",
      "Calculates urgency weights per EV charger",
    ],
  },
  {
    id: "decide",
    number: "03",
    title: "Charging Decisions",
    subtitle: "Continuous Power Limits",
    description:
      "Generates continuous current/power allocation vector [a_1, a_2, ..., a_N] where each action represents power output (0.0 to 7.4 kW) per active station.",
    technicalDetails: [
      "Real-time action space bounds checking",
      "Sub-second dispatch response time",
      "Dynamic step adjustments (15-min intervals)",
    ],
  },
  {
    id: "protect",
    number: "04",
    title: "Transformer Protection",
    subtitle: "Thermal & Voltage Guard",
    description:
      "Enforces strict hard limits on peak demand to prevent transformer loading from exceeding 100% capacity, averting fuse trips and catastrophic outages.",
    technicalDetails: [
      "Prevents cascade thermal breakdown",
      "Maintains distribution voltage >= 0.95 p.u.",
      "Eliminates utility overload penalties",
    ],
  },
  {
    id: "fairness",
    number: "05",
    title: "Fair EV Distribution",
    subtitle: "Jain's Fairness Index",
    description:
      "Optimizes Jain's Fairness Index across all connected vehicles, ensuring vehicles with short dwell times or low initial state-of-charge (SOC) are prioritized fairly.",
    technicalDetails: [
      "Jain's Index maximization (>0.92 score)",
      "Equal opportunity energy delivery ratio",
      "Prevents starvation of delayed arrivals",
    ],
  },
];

export default function HowSystemThinks() {
  const [activeStage, setActiveStage] = useState<Stage>(STAGES[0]);

  // Animation variants for section title scroll reveal
  const titleVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  // Animation variants for staggered stages reveal
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  };

  const boxVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="w-full">
      {/* Scroll-Revealed Section Header */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={titleVariants}
        className="mb-10 text-center md:text-left"
      >
        <div className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-mono text-zinc-400 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse" />
          <span>RL CONTROL ARCHITECTURE</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
          How the System Thinks
        </h2>
        <p className="mt-2 text-sm text-zinc-400 max-w-2xl font-normal">
          An autonomous 5-stage reinforcement learning loop continuously balancing high-density EV charging demand against local distribution transformer limits.
        </p>
      </motion.div>

      {/* Engineering Interactive Flow diagram */}
      <div className="relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden lg:block absolute top-[44px] left-[6%] right-[6%] h-[1px] bg-white/10 z-0">
          <motion.div
            className="h-full w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ["0%", "450%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* 5 Stages Grid - Scroll Revealed with Stagger */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10"
        >
          {STAGES.map((stage, idx) => {
            const isSelected = activeStage.id === stage.id;

            return (
              <motion.div
                key={stage.id}
                variants={boxVariants}
                onMouseEnter={() => setActiveStage(stage)}
                onClick={() => setActiveStage(stage)}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`cursor-pointer rounded-xl p-5 backdrop-blur-md transition-all duration-300 relative group ${
                  isSelected
                    ? "bg-zinc-900 border border-white/30 shadow-2xl"
                    : "bg-zinc-950/80 border border-white/10 hover:border-white/20 hover:bg-zinc-900/40"
                }`}
              >
                {/* Active Top Bar Indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="activeBar"
                    className="absolute top-0 left-0 right-0 h-[2px] bg-white"
                  />
                )}

                {/* Stage Number (No colored icons) */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                    {stage.number}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">STAGE</span>
                </div>

                {/* Title & Subtitle */}
                <h3 className="font-semibold text-white text-base leading-tight mb-1 group-hover:text-zinc-200 transition-colors">
                  {stage.title}
                </h3>
                <p className="text-xs font-mono text-zinc-400 mb-2">
                  {stage.subtitle}
                </p>

                {/* Chevron arrow on desktop */}
                {idx < STAGES.length - 1 && (
                  <div className="hidden lg:flex items-center text-zinc-600 absolute right-1 top-[40px] translate-x-1/2 z-20">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Selected Stage Deep-Dive Display Panel */}
        <motion.div
          key={activeStage.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-6 rounded-xl border border-white/10 bg-zinc-950/90 p-6 backdrop-blur-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center space-x-3 font-mono">
              <span className="text-sm font-bold text-white">
                STAGE {activeStage.number}
              </span>
              <span className="text-zinc-600">/</span>
              <h4 className="text-lg font-semibold text-white font-sans">
                {activeStage.title}
              </h4>
              <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                {activeStage.subtitle}
              </span>
            </div>
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              Hover any stage box to inspect real-time logic
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <p className="text-sm leading-relaxed text-zinc-300">
                {activeStage.description}
              </p>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-4 border border-white/5">
              <span className="text-xs font-mono text-zinc-400 block mb-2 font-medium uppercase tracking-wider">
                Technical Specifications
              </span>
              <ul className="space-y-2">
                {activeStage.technicalDetails.map((detail, index) => (
                  <li key={index} className="text-xs text-zinc-300 flex items-center space-x-2">
                    <span className="h-1 w-1 rounded-full bg-zinc-400" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
