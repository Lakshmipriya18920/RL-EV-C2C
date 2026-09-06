"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { ComparisonSimulationResponse, EpisodeSimulationResponse } from "@/types/simulation";

interface LoadCurvesChartProps {
  comparisonData: ComparisonSimulationResponse | null;
  singleData: EpisodeSimulationResponse | null;
  mode: "compare" | "baseline" | "rl";
  trafoCapacityKw: number;
  currentStep: number;
}

interface ChartDataPoint {
  timestamp: string;
  base_load_kw: number;
  baseline_total_kw?: number;
  rl_total_kw?: number;
  baseline_ev_kw?: number;
  rl_ev_kw?: number;
  total_load_kw?: number;
  ev_load_kw?: number;
  trafo_capacity: number;
}

export default function LoadCurvesChart({
  comparisonData,
  singleData,
  mode,
  trafoCapacityKw,
  currentStep,
}: LoadCurvesChartProps) {
  // Assemble time-series records for Recharts
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    if (mode === "compare" && comparisonData) {
      const ts = comparisonData.timestamps;
      return ts.map((t, idx) => ({
        timestamp: t,
        base_load_kw: comparisonData.baseline.base_load_kw[idx] || 0,
        baseline_total_kw: comparisonData.baseline.total_load_kw[idx] || 0,
        rl_total_kw: comparisonData.rl.total_load_kw[idx] || 0,
        baseline_ev_kw: comparisonData.baseline.ev_load_kw[idx] || 0,
        rl_ev_kw: comparisonData.rl.ev_load_kw[idx] || 0,
        trafo_capacity: trafoCapacityKw,
      }));
    } else if (singleData) {
      return singleData.timestamps.map((t, idx) => ({
        timestamp: t,
        base_load_kw: singleData.base_load_kw[idx] || 0,
        total_load_kw: singleData.total_load_kw[idx] || 0,
        ev_load_kw: singleData.ev_load_kw[idx] || 0,
        trafo_capacity: trafoCapacityKw,
      }));
    }
    return [];
  }, [comparisonData, singleData, mode, trafoCapacityKw]);

  if (chartData.length === 0) {
    return (
      <div className="eleven-card flex h-80 items-center justify-center text-zinc-500 text-xs">
        No chart data available.
      </div>
    );
  }

  const activeTimestamp = chartData[Math.min(currentStep, chartData.length - 1)]?.timestamp;

  return (
    <div className="eleven-card p-5">
      <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Transformer Demand Curves (kW)
          </h3>
          <p className="text-[11px] text-zinc-500">
            {mode === "compare" ? "Uncontrolled Baseline vs RL Load-Balancer Overlay" : `${mode.toUpperCase()} Trajectory`}
          </p>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-zinc-400">Baseline</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-zinc-400">RL Balancer</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-500" />
            <span className="text-zinc-400">Base Load</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="timestamp"
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#27272a" }}
            />
            <YAxis
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#27272a" }}
              domain={[0, "auto"]}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#09090b",
                borderColor: "#27272a",
                borderRadius: "0.75rem",
                fontSize: "11px",
                fontFamily: "monospace",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              }}
              itemStyle={{ color: "#f4f4f5" }}
            />

            {/* Rated Transformer Capacity line */}
            <ReferenceLine
              y={trafoCapacityKw}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{
                value: `Capacity: ${trafoCapacityKw} kW`,
                fill: "#ef4444",
                fontSize: 10,
                position: "top",
              }}
            />

            {/* Current Scrub Position line */}
            {activeTimestamp && (
              <ReferenceLine
                x={activeTimestamp}
                stroke="#00f0ff"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
            )}

            {/* Base Load */}
            <Line
              type="monotone"
              dataKey="base_load_kw"
              name="Base Load"
              stroke="#71717a"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
            />

            {mode === "compare" ? (
              <>
                {/* Baseline Total */}
                <Area
                  type="monotone"
                  dataKey="baseline_total_kw"
                  name="Baseline Load"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="url(#baseGradient)"
                  dot={false}
                />
                {/* RL Total */}
                <Area
                  type="monotone"
                  dataKey="rl_total_kw"
                  name="RL Scheduled Load"
                  stroke="#00f0ff"
                  strokeWidth={2.5}
                  fill="url(#rlGradient)"
                  dot={false}
                />
              </>
            ) : mode === "baseline" ? (
              <Area
                type="monotone"
                dataKey="total_load_kw"
                name="Baseline Load"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#baseGradient)"
                dot={false}
              />
            ) : (
              <Area
                type="monotone"
                dataKey="total_load_kw"
                name="RL Scheduled Load"
                stroke="#00f0ff"
                strokeWidth={2.5}
                fill="url(#rlGradient)"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
