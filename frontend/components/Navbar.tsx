"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Live Simulation", href: "/simulation" },
  { label: "Grid Topology", href: "/grid-topology" },
  { label: "EV Fleet", href: "/ev-fleet" },
  { label: "Analytics", href: "/analytics" },
  { label: "Dataset Insights", href: "/dataset-analytics" },
  { label: "Explainability", href: "/explainability" },
  { label: "System", href: "/system" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#09090b]/85 backdrop-blur-xl border-b border-white/[0.06] transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand / Logo (Twin Bars || COOKED) */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2.5 text-white group">
            <div className="flex items-center space-x-[3px] font-bold text-lg tracking-tighter">
              <span className="inline-block w-[3.5px] h-4 bg-white rounded-[1px] group-hover:scale-y-110 transition-transform" />
              <span className="inline-block w-[3.5px] h-4 bg-white rounded-[1px] group-hover:scale-y-110 transition-transform" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">
              COOKED
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7 text-sm font-medium text-zinc-400">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`transition-colors ${
                    isActive
                      ? "text-white font-semibold"
                      : "hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* GitHub Link */}
          <a
            href="https://github.com/varungit222/Transformer-RL-C2C"
            target="_blank"
            rel="noreferrer"
            className="text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
          >
            GitHub
          </a>

          {/* Solid White Pill Run Simulation Button */}
          <Link
            href="/simulation"
            className="rounded-full bg-white text-zinc-950 px-5 py-2 text-xs sm:text-sm font-semibold hover:bg-zinc-200 transition-all shadow-sm active:scale-95"
          >
            Run Simulation
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg bg-white/[0.04] border border-white/[0.08]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#09090b] px-4 pt-2 pb-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              href="/simulation"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center rounded-full bg-white py-2.5 text-xs font-semibold text-zinc-950"
            >
              Run Simulation
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
