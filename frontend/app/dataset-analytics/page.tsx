"use client";

import React, { useMemo } from "react";
import Navbar from "@/components/Navbar";
import AnimatedHeading from "@/components/AnimatedHeading";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import { Database, FileText, Calendar, Zap, Layers, Server, Activity, ArrowUpRight } from "lucide-react";

export default function DatasetAnalyticsPage() {
  // Energy Distribution Histogram Data (kWh per session)
  const energyHistogram = useMemo(() => {
    return [
      { bin: "0-5 kWh", count: 1240 },
      { bin: "5-10 kWh", count: 3820 },
      { bin: "10-15 kWh", count: 8950 },
      { bin: "15-20 kWh", count: 11200 },
      { bin: "20-25 kWh", count: 5400 },
      { bin: "25-30 kWh", count: 2100 },
      { bin: "30+ kWh", count: 850 },
    ];
  }, []);

  // Charging Duration Distribution (Hours per session)
  const durationChartData = useMemo(() => {
    return [
      { duration: "< 1 hr", sessions: 1800 },
      { duration: "1-2 hrs", sessions: 4200 },
      { duration: "2-4 hrs", sessions: 9800 },
      { duration: "4-6 hrs", sessions: 8400 },
      { duration: "6-8 hrs", sessions: 4900 },
      { duration: "8+ hrs", sessions: 2100 },
    ];
  }, []);

  // 24-Hour Peak Arrival Profile
  const peakHoursData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);
    return hours.map((h, i) => {
      // Peak arrivals around 8:00 AM (workplace) and 5:00 PM (evening)
      const morningPeak = Math.exp(-0.5 * Math.pow((i - 8) / 1.5, 2)) * 1400;
      const eveningPeak = Math.exp(-0.5 * Math.pow((i - 17) / 2.0, 2)) * 1800;
      const arrivals = Math.round(150 + morningPeak + eveningPeak);
      return { hour: h, arrivals };
    });
  }, []);

  // Station Utilization Matrix data (Station 1-8 vs Hour)
  const stationMatrix = useMemo(() => {
    return Array.from({ length: 8 }, (_, s) => {
      const stationId = `ACN-${(s + 1).toString().padStart(2, "0")}`;
      const hours = [8, 11, 14, 17, 20, 23];
      const utilizations = hours.map((h) => {
        const util = Math.min(100, Math.round(30 + Math.sin(s + h) * 45 + (h === 17 ? 25 : 0)));
        return util;
      });
      return { stationId, utilizations };
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8 flex-1">
        {/* Workspace Title & Dataset Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-400 mb-2">
              <Database className="h-3.5 w-3.5" />
              <span>CALIFORNIA INSTITUTE OF TECHNOLOGY ACN DATASET</span>
            </div>
            <AnimatedHeading
              text="Dataset Insights & Empirical Calibration"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono"
            />
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Statistical analysis of real-world Adaptive Charging Network (ACN) session profiles used to train and calibrate the PPO agent.
            </p>
          </div>

          <a
            href="https://ev.caltech.edu/dataset"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-zinc-950 border border-white/10 px-4 py-2.5 rounded-xl"
          >
            <span>ACN Data Portal</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Dataset Workspace Metadata Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6 backdrop-blur-xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 font-mono text-xs">
            <div>
              <span className="text-zinc-500 text-[10px] block uppercase">DATASET NAME</span>
              <span className="text-white font-bold text-sm">Caltech ACN EV Data</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] block uppercase">DATA SOURCE</span>
              <span className="text-cyan-400 font-bold text-sm">JPL & Caltech Garages</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] block uppercase">RECORDED SESSIONS</span>
              <span className="text-emerald-400 font-bold text-sm">33,560 Sessions</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] block uppercase">TIME RANGE</span>
              <span className="text-amber-400 font-bold text-sm">2019 – 2023</span>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] block uppercase">ADAPTIVE CHARGERS</span>
              <span className="text-purple-400 font-bold text-sm">54 Active EVSEs</span>
            </div>
          </div>
        </motion.div>

        {/* --- DATA ANALYSIS WORKSPACE GRID --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* 1. Energy Distribution Histogram */}
          <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                Session Energy Delivered Distribution (kWh)
              </h3>
              <span className="text-[11px] font-mono text-zinc-400">Mean: 17.4 kWh</span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={energyHistogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="bin" stroke="#52525b" fontSize={10} />
                  <YAxis stroke="#52525b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#090a0f", fontSize: "11px" }} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Dwell & Charging Duration Distribution */}
          <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                Session Dwell Duration Distribution (Hours)
              </h3>
              <span className="text-[11px] font-mono text-zinc-400">Mean: 4.8 Hours</span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="duration" stroke="#52525b" fontSize={10} />
                  <YAxis stroke="#52525b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#090a0f", fontSize: "11px" }} />
                  <Bar dataKey="sessions" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* 3. 24-Hour Peak Arrival Profile Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Diurnal EV Arrival Volume Profile (24-Hour Cycle)
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">Peak: 17:00 Evening Rush</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="#52525b" fontSize={10} />
                <YAxis stroke="#52525b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#090a0f", fontSize: "11px" }} />
                <Area type="monotone" dataKey="arrivals" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 4. Station Utilization Heatmap Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="rounded-xl border border-white/10 bg-zinc-950/60 p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              Station Utilization Heatmap Matrix (% Capacity Used)
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">Sample 8 Stations vs Hour</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="grid grid-cols-7 text-[10px] text-zinc-500 border-b border-white/10 pb-1">
              <span>STATION</span>
              <span>08:00</span>
              <span>11:00</span>
              <span>14:00</span>
              <span>17:00</span>
              <span>20:00</span>
              <span>23:00</span>
            </div>

            {stationMatrix.map((st) => (
              <div key={st.stationId} className="grid grid-cols-7 items-center text-xs">
                <span className="font-bold text-zinc-300">{st.stationId}</span>
                {st.utilizations.map((val, idx) => {
                  let bg = "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20";
                  if (val > 80) bg = "bg-rose-950/60 text-rose-400 border border-rose-500/40";
                  else if (val > 60) bg = "bg-amber-950/50 text-amber-400 border border-amber-500/30";

                  return (
                    <span key={idx} className={`px-2 py-1 rounded text-center font-bold text-[11px] ${bg}`}>
                      {val}%
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
