"use client";

import React, { useId, useRef, useState } from "react";

interface GooeyInputProps {
  placeholder?: string;
  label?: string;
  value?: string | number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  type?: "text" | "number";
  onChange?: (value: string) => void;
  accentColor?: string;
  badge?: string;
}

export function GooeyInput({
  placeholder = "",
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  type = "text",
  onChange,
  accentColor = "#18181b",
  badge,
}: GooeyInputProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isActive = focused || hovered;

  return (
    <div className="relative w-full group">
      {/* SVG Gooey filter definition */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id={`gooey-${id}`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400 transition-colors group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
        >
          {label}
        </label>
      )}

      {/* Outer gooey morphing shell */}
      <div
        className="relative"
        style={{ filter: `url(#gooey-${id})` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Blob blob that morphs on focus */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl transition-all duration-500"
          style={{
            background: isActive
              ? `${accentColor}12`
              : "transparent",
            transform: isActive ? "scale(1.04)" : "scale(1)",
            borderRadius: isActive ? "20px" : "14px",
          }}
        />

        {/* The actual input */}
        <input
          ref={inputRef}
          id={id}
          type={type}
          min={min}
          max={max}
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="relative w-full rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white placeholder-zinc-400 outline-none transition-all duration-300 focus:border-black/20 dark:focus:border-white/20 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] dark:focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] hover:border-black/15 dark:hover:border-white/15 pr-16"
          style={{
            fontVariantNumeric: "tabular-nums",
          }}
        />

        {/* Unit + badge pill on the right */}
        {(unit || badge) && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center space-x-1.5">
            {unit && (
              <span className="rounded-full bg-black/[0.05] dark:bg-white/[0.08] px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400 transition-all group-hover:bg-black/[0.08] dark:group-hover:bg-white/[0.12]">
                {unit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Range track below (only for number types with min/max) */}
      {type === "number" && min !== undefined && max !== undefined && (
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-[10px] font-mono text-zinc-400">{min}{unit}</span>
          <div className="relative flex-1 h-1 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
              style={{
                width: `${(((Number(value) || min) - min) / (max - min)) * 100}%`,
                background: accentColor,
                opacity: 0.5,
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-400">{max}{unit}</span>
        </div>
      )}
    </div>
  );
}
