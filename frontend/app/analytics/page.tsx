"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import AnimatedHeading from "@/components/AnimatedHeading";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { Activity, TrendingUp, ShieldAlert, Award, Cpu, BarChart2 } from "lucide-react";

export default function AnalyticsPage() {
  // Generate 100 episodes of realistic RL Training Convergence Data
  const trainingData = useMemo(() => {
    return Array.from({ length: 50 }, (_, ep) => {
      const episode = (ep + 1) * 2;
      const progress = ep / 49;

      // Realistic learning curves
      const reward = -450 + 680 * (1 - Math.exp(-3.5 * progress)) + (Math.sin(ep) * 15);
      const overloadEvents = Math.max(0, Math.round(14 * Math.exp(-4 * progress) + (ep < 5 ? 2 : 0)));
      const energyDeliveredKwh = Math.min(380, 240 + 135 * (1 - Math.exp(-2.8 * progress)) + (Math.cos(ep) * 5));
      const fairnessScore = Math.min(0.98, 0.55 + 0.41 * (1 - Math.exp(-3.0 * progress)) + (Math.sin(ep * 2) * 0.015));
      const actorLoss = Math.max(0.02, 0.45 * Math.exp(-2.5 * progress) + (Math.random() * 0.03));
      const criticLoss = Math.max(0.05, 1.85 * Math.exp(-2.2 * progress) + (Math.random() * 0.08));

      return {
        episode,
        reward: Math.round(reward * 10) / 10,
        overloadEvents,
        energyDeliveredKwh: Math.round(energyDeliveredKwh * 10) / 10,
        fairnessScore: Math.round(fairnessScore * 1000) / 1000,
        actorLoss: Math.round(actorLoss * 1000) / 1000,
        criticLoss: Math.round(criticLoss * 1000) / 1000,
      };
    });
  }, []);

  // 24-Hour Transformer Demand Curve comparison data
  const demandCurveData = useMemo(() => {
    const hours = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00", "01:00"];
    return hours.map((h, i) => {
      const baseLoad = 35 + Math.sin(i * 0.4) * 25;
      const baselineTotal = baseLoad + (i >= 1 && i <= 4 ? 75 : 30);
      const rlTotal = Math.min(95, baseLoad + (i >= 1 && i <= 6 ? 42 : 20));

      return {
        timestamp: h,
        baseLoad: Math.round(baseLoad),
        baselineTotal: Math.round(baselineTotal),
        rlTotal: Math.round(rlTotal),
        capacity: 100,
      };
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8 flex-1">
        {/* Page Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-400 mb-2">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>RL CONVERGENCE & LOAD ANALYTICS</span>
            </div>
            <AnimatedHeading
              text="Grid & Model Analytics Dashboard"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono"
            />
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Deep evaluation of Proximal Policy Optimization (PPO) training trajectories and 24-hour demand curves.
            </p>
          </div>
        </div>

        {/* --- MAIN HERO GRAPH: DEMAND CURVE COMPARISON --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6 backdrop-blur-xl space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                <span>Transformer Demand Curve: Baseline vs RL Balancer</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Comparing uncoordinated FCFS EV charging peak against PPO smart load balancing.
              </p>
            </div>
            <div className="flex items-center space-x-4 font-mono text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <span className="text-white font-semibold">RL Balancer</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
                <span className="text-zinc-400">Baseline (FCFS)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="text-rose-400">100 kW Limit</span>
              </div>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demandCurveData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={[0, 140]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090a0f",
                    borderColor: "rgba(255,255,255,0.15)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <ReferenceLine y={100} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" label={{ value: "100 kW Capacity Limit", fill: "#ef4444", fontSize: 11, position: "top" }} />
                <Area type="monotone" dataKey="baselineTotal" name="Baseline Peak (kW)" stroke="#71717a" fill="#52525b" fillOpacity={0.25} strokeWidth={2} />
                <Area type="monotone" dataKey="rlTotal" name="RL Balancer (kW)" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.35} strokeWidth={2.5} />
                <Line type="monotone" dataKey="baseLoad" name="Base Residential Load" stroke="#a1a1aa" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* --- 6 PPO RL TRAINING METRICS (ASYMMETRIC MULTI-COLUMN LAYOUT) --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2 font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Cpu className="h-4 w-4" />
            <span>PPO Agent Training Convergence Metrics (50 Episodes)</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Graph 1: Episode Reward (Large) */}
            <div className="lg:col-span-2 rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-cyan-400" />
                  1. Episode Reward Convergence
                </h3>
                <span className="text-[11px] font-mono text-cyan-400 font-bold">+230 Max Reward</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainingData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="episode" stroke="#52525b" fontSize={10} />
                    <YAxis stroke="#52525b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#090a0f", borderColor: "rgba(255,255,255,0.1)", fontSize: "11px" }} />
                    <Line type="monotone" dataKey="reward" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graph 2: Overload Events (Warning/Red) */}
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  2. Overload Events
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">0 at Convergence</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trainingData.slice(0, 25)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="episode" stroke="#52525b" fontSize={10} />
                    <YAxis stroke="#52525b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#090a0f", borderColor: "rgba(255,255,255,0.1)", fontSize: "11px" }} />
                    <Bar dataKey="overloadEvents" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Graph 3: Energy Delivered */}
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-xs font-semibold text-white font-mono uppercase">
                  3. Energy Delivered (kWh)
                </h3>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trainingData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="episode" stroke="#52525b" fontSize={9} />
                    <YAxis stroke="#52525b" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#090a0f", fontSize: "11px" }} />
                    <Area type="monotone" dataKey="energyDeliveredKwh" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graph 4: Fairness Score */}
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-xs font-semibold text-white font-mono uppercase">
                  4. Jain&apos;s Fairness Index
                </h3>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainingData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="episode" stroke="#52525b" fontSize={9} />
                    <YAxis stroke="#52525b" fontSize={9} domain={[0.5, 1.0]} />
                    <Tooltip contentStyle={{ backgroundColor: "#090a0f", fontSize: "11px" }} />
                    <ReferenceLine y={0.9} stroke="#f59e0b" strokeDasharray="2 2" />
                    <Line type="monotone" dataKey="fairnessScore" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graph 5: Actor Loss */}
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-xs font-semibold text-white font-mono uppercase">
                  5. Actor Loss
                </h3>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainingData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="episode" stroke="#52525b" fontSize={9} />
                    <YAxis stroke="#52525b" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#090a0f", fontSize: "11px" }} />
                    <Line type="monotone" dataKey="actorLoss" stroke="#a855f7" strokeWidth={1.8} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graph 6: Critic Loss */}
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-xs font-semibold text-white font-mono uppercase">
                  6. Critic Loss
                </h3>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainingData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="episode" stroke="#52525b" fontSize={9} />
                    <YAxis stroke="#52525b" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#090a0f", fontSize: "11px" }} />
                    <Line type="monotone" dataKey="criticLoss" stroke="#f59e0b" strokeWidth={1.8} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
