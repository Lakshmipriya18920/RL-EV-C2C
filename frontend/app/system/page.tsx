"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import AnimatedHeading from "@/components/AnimatedHeading";
import { motion } from "framer-motion";
import { Layers, Database, Cpu, ShieldCheck, Zap, Activity, ChevronRight, Server, Code, GitBranch } from "lucide-react";

interface FlowStep {
  id: string;
  stepNum: string;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  tech: string;
  color: string;
  description: string;
  inputs: string[];
  outputs: string[];
}

export default function SystemPage() {
  const [selectedStep, setSelectedStep] = useState<number>(0);

  const flowSteps: FlowStep[] = [
    {
      id: "data",
      stepNum: "01",
      name: "ACN Dataset / Grid Data",
      subtitle: "Empirical Ingestion",
      icon: Database,
      tech: "Caltech ACN API / Pandapower Network",
      color: "text-blue-400",
      description: "Ingests real-world EV session profiles (arrival times, initial SOC, battery capacities) and 11 kV feeder distribution topology models.",
      inputs: ["Caltech Adaptive Charging Dataset", "Pandapower bus & line impedance parameters"],
      outputs: ["Normalized state vectors (s_t)", "Base residential load profile curve"],
    },
    {
      id: "sim",
      stepNum: "02",
      name: "Simulation Environment",
      subtitle: "AC Power Flow Engine",
      icon: Server,
      tech: "Pandapower (Python) / AC Newton-Raphson",
      color: "text-cyan-400",
      description: "Computes non-linear AC power flow equations at each 15-minute timestep to determine line loading %, bus voltage p.u., and thermal limits.",
      inputs: ["Current allocation vector a_t", "Grid base demand kW"],
      outputs: ["Transformer load %", "Min bus voltage p.u.", "Thermal trip flags"],
    },
    {
      id: "rl",
      stepNum: "03",
      name: "PPO RL Agent",
      subtitle: "Policy Neural Network",
      icon: Cpu,
      tech: "PyTorch (PPO Actor-Critic)",
      color: "text-purple-400",
      description: "Actor-Critic neural network evaluates state vector s_t and outputs continuous charging power actions for every active EV charger.",
      inputs: ["Normalized grid state & EV urgency matrix"],
      outputs: ["Continuous action logits [a_1, ..., a_N]"],
    },
    {
      id: "decision",
      stepNum: "04",
      name: "Decision Engine",
      subtitle: "Safety & Action Bounds",
      icon: ShieldCheck,
      tech: "Hard Constraint Verification",
      color: "text-emerald-400",
      description: "Applies thermal limit overrides and Jain's fairness index optimization to prevent transformer overload trips.",
      inputs: ["Raw PPO actions", "Transformer 100 kW threshold"],
      outputs: ["Safe dispatched power kW per station"],
    },
    {
      id: "actions",
      stepNum: "05",
      name: "EV Charging Actions",
      subtitle: "Physical Charger Control",
      icon: Zap,
      tech: "OCPP Protocol / Hardware Interface",
      color: "text-amber-400",
      description: "Dispatches continuous current commands (0 to 7.4 kW) to physical or simulated EVSE charging stations.",
      inputs: ["Dispatched power commands kW"],
      outputs: ["Updated EV SOC %", "Delivered kWh"],
    },
    {
      id: "metrics",
      stepNum: "06",
      name: "Metrics & Explainability",
      subtitle: "Telemetry & Rationale",
      icon: Activity,
      tech: "FastAPI + Next.js 16 + Recharts",
      color: "text-rose-400",
      description: "Generates real-time telemetry, load curves, PPO training loss, and human-readable decision explanations.",
      inputs: ["Complete episode trajectory log"],
      outputs: ["Live dashboard UI", "JSON API telemetry endpoints"],
    },
  ];

  const current = flowSteps[selectedStep];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8 flex-1">
        {/* Page Title Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-400 mb-2">
              <Layers className="h-3.5 w-3.5" />
              <span>SYSTEM ARCHITECTURE & PIPELINE</span>
            </div>
            <AnimatedHeading
              text="Project Architecture & Data Flow Diagram"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono"
            />
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Complete technical schematic depicting data flow from dataset ingestion to PPO RL inference and AC power flow execution.
            </p>
          </div>
        </div>

        {/* --- SYSTEM VISUAL ARCHITECTURAL FLOW DIAGRAM --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6 md:p-8 backdrop-blur-xl space-y-8"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-cyan-400" />
              <span>End-to-End Architectural Flow Pipeline</span>
            </h2>
            <span className="text-xs font-mono text-cyan-400">Click stage to inspect code modules</span>
          </div>

          {/* Interactive Flow Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
            {flowSteps.map((step, idx) => {
              const isSelected = selectedStep === idx;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  onClick={() => setSelectedStep(idx)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all relative overflow-hidden ${
                    isSelected
                      ? "bg-zinc-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                      : "bg-zinc-950 border-white/10 hover:border-white/20 hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-zinc-900 border border-white/10 ${step.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-xs text-zinc-500 font-bold">{step.stepNum}</span>
                  </div>

                  <h3 className="text-xs font-bold text-white font-mono leading-tight mb-1">{step.name}</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">{step.subtitle}</p>

                  {idx < flowSteps.length - 1 && (
                    <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 text-zinc-600">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Stage Deep-Dive Inspection Card */}
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/10 bg-zinc-900/90 p-6 backdrop-blur-xl space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center space-x-3">
                <span className={`font-mono text-sm font-bold ${current.color}`}>STAGE {current.stepNum}</span>
                <span className="text-zinc-600">•</span>
                <h3 className="text-lg font-bold text-white font-mono">{current.name}</h3>
              </div>

              <div className="inline-flex items-center space-x-2 font-mono text-xs bg-zinc-950 border border-white/10 px-3 py-1.5 rounded-lg text-cyan-400">
                <Code className="h-3.5 w-3.5" />
                <span>{current.tech}</span>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed font-sans">{current.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-mono text-xs">
              <div className="bg-zinc-950/80 p-4 rounded-lg border border-white/5 space-y-2">
                <span className="text-zinc-500 uppercase block text-[10px] font-bold">STAGE INPUTS</span>
                <ul className="space-y-1">
                  {current.inputs.map((inp, i) => (
                    <li key={i} className="text-zinc-300 flex items-center space-x-2">
                      <span className="h-1 w-1 rounded-full bg-cyan-400" />
                      <span>{inp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-zinc-950/80 p-4 rounded-lg border border-white/5 space-y-2">
                <span className="text-zinc-500 uppercase block text-[10px] font-bold">STAGE OUTPUTS</span>
                <ul className="space-y-1">
                  {current.outputs.map((out, i) => (
                    <li key={i} className="text-emerald-300 flex items-center space-x-2">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Technology Stack Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="space-y-4"
        >
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
            Production Technology Stack
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 font-mono text-xs space-y-1">
              <span className="text-cyan-400 font-bold block">Pandapower</span>
              <span className="text-zinc-400 text-[11px] block">AC Power Flow Engine</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 font-mono text-xs space-y-1">
              <span className="text-purple-400 font-bold block">PyTorch</span>
              <span className="text-zinc-400 text-[11px] block">PPO Policy Network</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 font-mono text-xs space-y-1">
              <span className="text-emerald-400 font-bold block">FastAPI</span>
              <span className="text-zinc-400 text-[11px] block">Python REST Backend</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 font-mono text-xs space-y-1">
              <span className="text-amber-400 font-bold block">Next.js 16</span>
              <span className="text-zinc-400 text-[11px] block">App Router Infrastructure</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 font-mono text-xs space-y-1">
              <span className="text-blue-400 font-bold block">Recharts + Canvas</span>
              <span className="text-zinc-400 text-[11px] block">Telemetry Visualizer</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 font-mono text-xs space-y-1">
              <span className="text-rose-400 font-bold block">Caltech ACN</span>
              <span className="text-zinc-400 text-[11px] block">Empirical EV Dataset</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
