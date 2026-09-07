"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import HeroGridCanvas from "@/components/HeroGridCanvas";
import AnimatedHeading from "@/components/AnimatedHeading";
import HowSystemThinks from "@/components/HowSystemThinks";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col font-sans relative selection:bg-white/20 selection:text-white">
      {/* Background Grid Canvas across entire home page */}
      <HeroGridCanvas />

      {/* Top Navigation */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 px-6 overflow-hidden z-10">
        <div className="relative max-w-5xl mx-auto text-center">
          {/* Letter-by-letter Animated Heading */}
          <AnimatedHeading
            text="Bringing intelligence to the grid"
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6"
          />

          {/* Project Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed mb-10 font-normal"
          >
            An autonomous energy management platform using Proximal Policy Optimization (PPO) reinforcement learning to schedule high-density EV charging, protect distribution transformers from thermal overload trips, improve electrical grid stability, and maintain fair power allocation across fleets.
          </motion.p>

          {/* Exactly Two CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/simulation"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-lg bg-white text-black font-semibold px-7 py-3.5 text-sm transition-all hover:bg-zinc-200 active:scale-95 shadow-md"
            >
              <span>Explore Simulation</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/system"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 text-white font-medium px-7 py-3.5 text-sm transition-all backdrop-blur-md active:scale-95"
            >
              <span>View System Architecture</span>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Engineering Stats Divider with Scroll Reveal */}
      <section className="relative z-10 border-y border-white/[0.08] bg-black/60 py-10 px-6 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          <div className="flex flex-col border-l border-white/10 pl-4">
            <span className="text-2xl md:text-3xl font-bold font-mono text-white">100 kW</span>
            <span className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-mono">Transformer Capacity</span>
          </div>
          <div className="flex flex-col border-l border-white/10 pl-4">
            <span className="text-2xl md:text-3xl font-bold font-mono text-white">0 Overloads</span>
            <span className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-mono">Under RL Dispatch</span>
          </div>
          <div className="flex flex-col border-l border-white/10 pl-4">
            <span className="text-2xl md:text-3xl font-bold font-mono text-white">98.4%</span>
            <span className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-mono">Satisfaction Score</span>
          </div>
          <div className="flex flex-col border-l border-white/10 pl-4">
            <span className="text-2xl md:text-3xl font-bold font-mono text-white">30,000+</span>
            <span className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-mono">ACN Caltech Sessions</span>
          </div>
        </motion.div>
      </section>

      {/* "How the System Thinks" Flow Section (With Scroll Animations inside component) */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto w-full">
        <HowSystemThinks />
      </section>

      {/* Engineering Core Capabilities (Text Boxes with No Icons & Scroll Reveal) */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto w-full border-t border-white/[0.08]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, staggerChildren: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Box 1 (No icon) */}
          <div className="border border-white/10 rounded-xl p-6 bg-zinc-950/80 backdrop-blur-md">
            <div className="text-xs font-mono text-zinc-400 uppercase mb-2">01 / SAFETY</div>
            <h3 className="text-lg font-semibold text-white mb-2">Thermal Protection</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-normal">
              Pandapower AC power flow equations continuously compute line impedance losses and distribution transformer loading to guarantee zero thermal trip events.
            </p>
          </div>

          {/* Box 2 (No icon) */}
          <div className="border border-white/10 rounded-xl p-6 bg-zinc-950/80 backdrop-blur-md">
            <div className="text-xs font-mono text-zinc-400 uppercase mb-2">02 / MODEL</div>
            <h3 className="text-lg font-semibold text-white mb-2">PPO Actor-Critic</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-normal">
              Trained via Proximal Policy Optimization with continuous action outputs, balancing immediate peak clipping with long-term EV dwell completion requirements.
            </p>
          </div>

          {/* Box 3 (No icon) */}
          <div className="border border-white/10 rounded-xl p-6 bg-zinc-950/80 backdrop-blur-md">
            <div className="text-xs font-mono text-zinc-400 uppercase mb-2">03 / DATASET</div>
            <h3 className="text-lg font-semibold text-white mb-2">Caltech ACN Calibrated</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-normal">
              Real-world session profiles calibrated against the Caltech Adaptive Charging Network (ACN) dataset for realistic arrival distributions and SOC requirements.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Minimal Engineering Footer */}
      <footer className="relative z-10 mt-auto border-t border-white/[0.08] py-8 px-6 text-center md:text-left text-xs text-zinc-500 font-mono bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-zinc-400">COOKED RL Energy Platform • Production v2.4</span>
          </div>
          <div className="flex items-center space-x-6 text-zinc-400">
            <Link href="/simulation" className="hover:text-white transition-colors">Simulation</Link>
            <Link href="/grid-topology" className="hover:text-white transition-colors">Topology</Link>
            <Link href="/ev-fleet" className="hover:text-white transition-colors">EV Fleet</Link>
            <Link href="/analytics" className="hover:text-white transition-colors">Analytics</Link>
            <Link href="/explainability" className="hover:text-white transition-colors">Explainability</Link>
            <Link href="/system" className="hover:text-white transition-colors">Architecture</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
