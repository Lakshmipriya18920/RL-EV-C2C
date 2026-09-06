"use client";

import React, { useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, FastForward } from "lucide-react";

interface PlaybackControllerProps {
  currentStep: number;
  totalSteps: number;
  timestamps: string[];
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (step: number) => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export default function PlaybackController({
  currentStep,
  totalSteps,
  timestamps,
  isPlaying,
  onTogglePlay,
  onSeek,
  onReset,
  speed,
  onSpeedChange,
}: PlaybackControllerProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(100, 1000 / speed);
      timerRef.current = setInterval(() => {
        onSeek(currentStep >= totalSteps - 1 ? 0 : currentStep + 1);
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentStep, totalSteps, speed, onSeek]);

  const currentTime = timestamps[currentStep] || "17:00";

  return (
    <div className="eleven-card sticky bottom-4 z-40 p-4 border-white/[0.12] bg-[#09090c]/90 backdrop-blur-2xl shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Playback Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onReset}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
            title="Reset Timeline"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => onSeek(Math.max(0, currentStep - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
            title="Previous Step"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Big Play/Pause button */}
          <button
            onClick={onTogglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-xl eleven-btn-primary transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => onSeek(Math.min(totalSteps - 1, currentStep + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
            title="Next Step"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex flex-1 min-w-[200px] items-center space-x-3">
          <span className="text-xs font-mono font-bold text-cyan-400 min-w-[45px]">
            {currentTime}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStep}
            onChange={(e) => onSeek(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-mono text-zinc-500 min-w-[65px]">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>

        {/* Playback Speeds */}
        <div className="flex items-center space-x-1 rounded-xl bg-white/[0.04] p-1 border border-white/[0.08]">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-mono font-medium transition-all ${
                speed === s
                  ? "bg-white/15 text-cyan-300 font-bold border border-white/10"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
