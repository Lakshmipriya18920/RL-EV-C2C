"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Play, Zap, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

interface SphereItem {
  id: string;
  category: string;
  name: string;
  tagline: string;
  badge: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textureType: "mist" | "holographic" | "solar" | "cosmic" | "pearl";
  details: {
    label1: string;
    val1: string;
    label2: string;
    val2: string;
  };
}

const SPHERES: SphereItem[] = [
  {
    id: "ambient",
    category: "Baseload",
    name: "Base Feeder Load",
    tagline: "Uncontrolled residential & rural baseline demand profile",
    badge: "11 kV Feeder",
    primaryColor: "#c2c8d2",
    secondaryColor: "#9aa3b2",
    accentColor: "#64748b",
    textureType: "mist",
    details: {
      label1: "Evening Peak",
      val1: "48.2 kW",
      label2: "Feeder PF",
      val2: "0.94 Lag",
    },
  },
  {
    id: "fleet",
    category: "Uncoordinated",
    name: "EV Fleet Influx",
    tagline: "Uncoordinated simultaneous EV charging causing severe spikes",
    badge: "20 EV Bays",
    primaryColor: "#b388ff",
    secondaryColor: "#80d8ff",
    accentColor: "#3d5afe",
    textureType: "holographic",
    details: {
      label1: "Max EV Demand",
      val1: "74.0 kW",
      label2: "Simultaneous",
      val2: "100% Unthrottled",
    },
  },
  {
    id: "transformer",
    category: "Core Physics",
    name: "Transformer Core & Thunder Arc",
    tagline: "Real-time thermal stress accumulator with Newton-Raphson power flow",
    badge: "100 kVA Trafo",
    primaryColor: "#ff6d00",
    secondaryColor: "#ff9100",
    accentColor: "#ffd600",
    textureType: "solar",
    details: {
      label1: "Rated Capacity",
      val1: "100 kVA / 80 kW",
      label2: "Thermal Limit",
      val2: "120°C Coil Trip",
    },
  },
  {
    id: "stress",
    category: "Failure Mode",
    name: "Overload & Outage Risk",
    tagline: "Cascading thermal degradation leading to protective trip blackouts",
    badge: "Simulated Outage",
    primaryColor: "#3e2723",
    secondaryColor: "#d84315",
    accentColor: "#ff1744",
    textureType: "cosmic",
    details: {
      label1: "Peak Overload",
      val1: "148.2%",
      label2: "Trip Risk",
      val2: "HIGH (>110%)",
    },
  },
  {
    id: "rl_balance",
    category: "RL Optimizer",
    name: "PPO Intelligent Dispatch",
    tagline: "Equitable multi-agent peak shaving & cross-session debt balance",
    badge: "PPO Agent",
    primaryColor: "#e0f2f1",
    secondaryColor: "#80cbc4",
    accentColor: "#00bfa5",
    textureType: "pearl",
    details: {
      label1: "Peak Shaved",
      val1: "30.5%",
      label2: "Jain's Fairness",
      val2: "0.94 / 1.00",
    },
  },
];

const TABS = [
  { id: "all", label: "Overview", dot: "#ff7a00" },
  { id: "physics", label: "Transformer Physics", dot: "#00f0ff" },
  { id: "rl", label: "RL Dispatcher", dot: "#10b981" },
  { id: "fairness", label: "Driver Fairness", dot: "#8b5cf6" },
];

export default function ElevenSpheresShowcase({
  onSelectSphere,
  onTriggerSim,
}: {
  onSelectSphere?: (id: string) => void;
  onTriggerSim?: () => void;
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [activeIndex, setActiveIndex] = useState(2); // Center active (solar orb)
  const [isPlayingZap, setIsPlayingZap] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeSphere = SPHERES[activeIndex];

  // WebGL 3D Energy & Interactive Lightning Bolt Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 340;
    const height = 340;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.6;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Custom Shaded Plasma / Solar Sphere
    const geometry = new THREE.SphereGeometry(1.22, 64, 64);

    // Custom procedural noise shader for the sphere
    const sphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(activeSphere.primaryColor) },
        uColor2: { value: new THREE.Color(activeSphere.secondaryColor) },
        uAccent: { value: new THREE.Color(activeSphere.accentColor) },
        uNoiseScale: { value: 3.5 },
        uThunderPulse: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;
        uniform float uThunderPulse;

        // Simplex noise approximation
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          
          // Subtle organic surface displacement + thunder twitch
          float noise = snoise(position * 2.0 + uTime * 0.4);
          vec3 newPos = position + normal * (noise * 0.05 + uThunderPulse * 0.04 * sin(uTime * 40.0));
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        uniform float uThunderPulse;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          // Fresnel rim glow
          vec3 viewDir = vec3(0.0, 0.0, 1.0);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.2);
          
          // Solar gradient swirl
          float swirl = sin(vPosition.x * 3.0 + uTime * 0.8) * cos(vPosition.y * 3.0 + uTime * 0.6);
          vec3 baseColor = mix(uColor1, uColor2, clamp(swirl * 0.5 + 0.5, 0.0, 1.0));
          
          // Electric filament highlight
          float filament = smoothstep(0.7, 0.95, sin(vPosition.z * 10.0 + uTime * 2.5 + swirl * 4.0));
          vec3 finalColor = mix(baseColor, uAccent, filament * 0.8 + fresnel * 0.6);
          
          // Thunder zap flash
          if (uThunderPulse > 0.01) {
            finalColor += vec3(1.0, 0.95, 0.8) * uThunderPulse * 0.7;
          }

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    const mesh = new THREE.Mesh(geometry, sphereMaterial);
    scene.add(mesh);

    // Interactive 3D Lightning Arc geometry
    const lightningCount = 12;
    const lightningCurves: THREE.Line[] = [];
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
      transparent: true,
      opacity: 0.0,
    });

    for (let k = 0; k < 3; k++) {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < lightningCount; i++) {
        const phi = Math.PI * (i / lightningCount);
        const theta = Math.PI * 2 * (k / 3) + Math.random() * 0.2;
        const r = 1.25 + (Math.random() - 0.5) * 0.15;
        points.push(
          new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          )
        );
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeo, lineMaterial.clone());
      scene.add(line);
      lightningCurves.push(line);
    }

    // Interactive mouse rotation tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 1.5;
      targetRotX = y * 1.5;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      sphereMaterial.uniforms.uTime.value = elapsed;

      // Smooth damped rotation towards cursor
      mesh.rotation.y += (targetRotY - mesh.rotation.y) * 0.08 + delta * 0.2;
      mesh.rotation.x += (targetRotX - mesh.rotation.x) * 0.08;

      // Animate electric crackles when zapping or active
      if (isPlayingZap) {
        sphereMaterial.uniforms.uThunderPulse.value =
          0.5 + 0.5 * Math.sin(elapsed * 25.0);
        lightningCurves.forEach((line) => {
          (line.material as THREE.LineBasicMaterial).opacity =
            0.6 + Math.random() * 0.4;
          line.rotation.y += 0.05;
        });
      } else {
        sphereMaterial.uniforms.uThunderPulse.value = Math.max(
          0,
          sphereMaterial.uniforms.uThunderPulse.value - delta * 2.0
        );
        lightningCurves.forEach((line) => {
          (line.material as THREE.LineBasicMaterial).opacity = 0;
        });
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      geometry.dispose();
      sphereMaterial.dispose();
    };
  }, [activeIndex, activeSphere, isPlayingZap]);

  const handleZap = () => {
    setIsPlayingZap(true);
    if (onTriggerSim) onTriggerSim();
    setTimeout(() => setIsPlayingZap(false), 2400);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : SPHERES.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < SPHERES.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="w-full">
      {/* Top Segmented Tab Switcher (ElevenLabs exact pill container) */}
      <div className="mx-auto flex max-w-fit items-center space-x-1 rounded-full bg-black/[0.03] dark:bg-white/[0.05] p-1.5 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] mb-8 sm:mb-12">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-[#1a1a20] text-zinc-900 dark:text-white shadow-sm border border-black/[0.08] dark:border-white/10"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: tab.dot }}
            />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Hero 5 Spheres Horizon (ElevenLabs 3D Aesthetic) */}
      <div className="relative flex items-center justify-center py-6 sm:py-10 overflow-hidden">
        {/* Ambient Glow Aura */}
        <div
          className="absolute h-96 w-96 rounded-full blur-[100px] opacity-25 pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: activeSphere.primaryColor }}
        />

        {/* Spheres Row */}
        <div className="flex items-center justify-center space-x-4 sm:space-x-8 md:space-x-12 px-4">
          {SPHERES.map((sphere, idx) => {
            const isCenter = idx === activeIndex;
            const dist = Math.abs(idx - activeIndex);

            return (
              <div
                key={sphere.id}
                onClick={() => {
                  setActiveIndex(idx);
                  if (onSelectSphere) onSelectSphere(sphere.id);
                }}
                className={`relative flex flex-col items-center cursor-pointer transition-all duration-500 select-none ${
                  isCenter
                    ? "scale-105 z-20"
                    : dist === 1
                    ? "scale-90 opacity-70 hover:opacity-100 z-10 hidden sm:flex"
                    : "scale-75 opacity-35 hover:opacity-75 hidden md:flex"
                }`}
              >
                {/* Sphere Visual */}
                <div className="relative flex items-center justify-center">
                  {isCenter ? (
                    // Centerpiece Active Sphere with 3D WebGL Canvas
                    <div className="relative h-[220px] w-[220px] sm:h-[260px] sm:w-[260px] md:h-[290px] md:w-[290px] flex items-center justify-center">
                      <canvas
                        ref={canvasRef}
                        className="h-full w-full rounded-full cursor-grab active:cursor-grabbing drop-shadow-[0_20px_35px_rgba(0,0,0,0.25)]"
                      />
                      {/* Central Interactive Play / Zap Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZap();
                        }}
                        title="Simulate Power Flow Pulse"
                        className="absolute flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/90 dark:bg-white text-zinc-950 shadow-[0_4px_25px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 transition-all duration-200 border border-white/50 backdrop-blur-md group"
                      >
                        {isPlayingZap ? (
                          <Zap className="h-6 w-6 text-amber-500 animate-bounce fill-amber-500" />
                        ) : (
                          <Play className="h-6 w-6 fill-zinc-950 ml-1 text-zinc-950 group-hover:scale-105 transition-transform" />
                        )}
                      </button>
                    </div>
                  ) : (
                    // Inactive Surrounding Spheres (Luminous Gradient Render)
                    <div
                      className="h-[140px] w-[140px] sm:h-[180px] sm:w-[180px] md:h-[210px] md:w-[210px] rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.15)] transition-transform duration-300 hover:scale-105"
                      style={{
                        background: `radial-gradient(circle at 35% 30%, ${sphere.secondaryColor} 0%, ${sphere.primaryColor} 60%, ${sphere.accentColor} 100%)`,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Caption, Navigation Chevrons, and Plain-English Description */}
      <div className="mx-auto max-w-xl text-center px-4 mt-4 sm:mt-6">
        <div className="flex items-center justify-center space-x-4 mb-2">
          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:scale-105 transition-all shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Title with Arrow */}
          <div className="flex items-center space-x-1.5 cursor-pointer group">
            <span className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors">
              {activeSphere.name}
            </span>
            <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:scale-105 transition-all shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal max-w-md mx-auto leading-relaxed">
          {activeSphere.tagline}
        </p>

        {/* Mini Pill Metrics */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
          <div>
            <span className="text-zinc-400 dark:text-zinc-500 mr-1.5">
              {activeSphere.details.label1}:
            </span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {activeSphere.details.val1}
            </span>
          </div>
          <div className="h-3 w-[1px] bg-black/10 dark:bg-white/10" />
          <div>
            <span className="text-zinc-400 dark:text-zinc-500 mr-1.5">
              {activeSphere.details.label2}:
            </span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {activeSphere.details.val2}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
