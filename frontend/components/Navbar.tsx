"use client";

import React, { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { checkBackendHealth } from "@/lib/api";

interface NavbarProps {
  onSelectScenario: (scenario: string) => void;
  currentScenario: string;
  onLaunchModal?: () => void;
}

export default function Navbar({
  onSelectScenario,
  currentScenario,
  onLaunchModal,
}: NavbarProps) {
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  useEffect(() => {
    checkBackendHealth().then(setBackendOnline);
    const interval = setInterval(() => {
      checkBackendHealth().then(setBackendOnline);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-black/[0.05] dark:border-white/[0.06] transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand / Logo (ElevenLabs || Brand Style) */}
        <div className="flex items-center space-x-8">
          <a href="#" className="flex items-center space-x-2 text-zinc-950 dark:text-white group">
            {/* Signature Twin Bars Icon */}
            <div className="flex items-center space-x-[3px] font-bold text-lg tracking-tighter">
              <span className="inline-block w-[3.5px] h-4 bg-zinc-900 dark:bg-white rounded-[1px] group-hover:scale-y-110 transition-transform" />
              <span className="inline-block w-[3.5px] h-4 bg-zinc-900 dark:bg-white rounded-[1px] group-hover:scale-y-110 transition-transform" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-zinc-950 dark:text-white">
              COOKED
            </span>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a
              href="#overview"
              className="hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              Overview
            </a>
            <a
              href="#live-grid"
              className="hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              Live Grid
            </a>
            <a
              href="#parameters"
              className="hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              Parameters
            </a>
            <a
              href="#analytics"
              className="hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              Load Curves
            </a>
            <a
              href="#explainability"
              className="hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              Explainability
            </a>
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Status Dot */}
          <div className="hidden sm:flex items-center space-x-2 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full ${
                backendOnline
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"
                  : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
              }`}
            />
            <span className="text-[11px] font-mono">
              {backendOnline ? "FastAPI 8000" : "Vercel / Local"}
            </span>
          </div>

          <a
            href="https://github.com/varungit222/Transformer-RL-C2C"
            target="_blank"
            rel="noreferrer"
            className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors hidden sm:block"
          >
            GitHub
          </a>

          <button
            onClick={onLaunchModal}
            className="rounded-full bg-zinc-950 dark:bg-white px-5 py-2 text-xs sm:text-sm font-medium text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm hover:shadow"
          >
            Run Simulation
          </button>
        </div>
      </div>
    </header>
  );
}
