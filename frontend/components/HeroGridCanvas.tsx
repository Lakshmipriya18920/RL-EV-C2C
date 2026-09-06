"use client";

import React, { useEffect, useRef } from "react";

interface GridNode {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  pulsePhase: number;
}

interface PulseParticle {
  fromNode: number;
  toNode: number;
  progress: number; // 0.0 -> 1.0
  speed: number;
}

export default function HeroGridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      active: false,
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    let nodes: GridNode[] = [];
    let pulses: PulseParticle[] = [];

    function initNodes() {
      nodes = [];
      pulses = [];
      const spacing = 65;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const bx = c * spacing;
          const by = r * spacing;
          nodes.push({
            x: bx,
            y: by,
            baseX: bx,
            baseY: by,
            radius: 1.5,
            pulsePhase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    initNodes();

    let frameCount = 0;

    function render() {
      if (!ctx) return;
      frameCount++;
      ctx.clearRect(0, 0, width, height);

      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      const hoverRadius = 220;

      // Update positions and draw background structural grid lines
      nodes.forEach((n, idx) => {
        n.pulsePhase += 0.02;
        const dx = mouse.x - n.baseX;
        const dy = mouse.y - n.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Magnetic displacement towards cursor
        if (mouse.active && dist < hoverRadius) {
          const factor = (1 - dist / hoverRadius) * 16;
          n.x = n.baseX - (dx / dist) * factor;
          n.y = n.baseY - (dy / dist) * factor;
        } else {
          n.x += (n.baseX - n.x) * 0.08;
          n.y += (n.baseY - n.y) * 0.08;
        }

        // Draw structural grid connections to nearby nodes
        const isNearMouse = mouse.active && dist < hoverRadius;

        nodes.forEach((n2, idx2) => {
          if (idx2 <= idx) return; // avoid duplicate lines
          const d2 = Math.sqrt(Math.pow(n.x - n2.x, 2) + Math.pow(n.y - n2.y, 2));

          if (d2 < 75) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);

            if (isNearMouse) {
              const alpha = (1 - dist / hoverRadius) * 0.35;
              ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
              ctx.lineWidth = 1.0;
            } else {
              ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
              ctx.lineWidth = 0.5;
            }
            ctx.stroke();
          }
        });
      });

      // Draw Grid Nodes with glow effects near mouse
      nodes.forEach((n) => {
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isNearMouse = mouse.active && dist < hoverRadius;

        ctx.beginPath();
        if (isNearMouse) {
          const pulseR = 2.5 + Math.sin(n.pulsePhase) * 0.8;
          ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(6, 182, 212, 0.9)";
          ctx.shadowColor = "#06b6d4";
          ctx.shadowBlur = 8;
        } else {
          ctx.arc(n.x, n.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow
      });

      // Periodically spawn traveling energy pulses along hover lines
      if (mouse.active && frameCount % 6 === 0) {
        const nearNodeIndices: number[] = [];
        nodes.forEach((n, idx) => {
          const d = Math.sqrt(Math.pow(mouse.x - n.x, 2) + Math.pow(mouse.y - n.y, 2));
          if (d < hoverRadius) nearNodeIndices.push(idx);
        });

        if (nearNodeIndices.length >= 2) {
          const i1 = nearNodeIndices[Math.floor(Math.random() * nearNodeIndices.length)];
          const i2 = nearNodeIndices[Math.floor(Math.random() * nearNodeIndices.length)];
          if (i1 !== i2) {
            const d = Math.sqrt(
              Math.pow(nodes[i1].x - nodes[i2].x, 2) + Math.pow(nodes[i1].y - nodes[i2].y, 2)
            );
            if (d < 90) {
              pulses.push({
                fromNode: i1,
                toNode: i2,
                progress: 0.0,
                speed: 0.04 + Math.random() * 0.04,
              });
            }
          }
        }
      }

      // Draw and update active energy pulses
      pulses.forEach((p, idx) => {
        p.progress += p.speed;
        const n1 = nodes[p.fromNode];
        const n2 = nodes[p.toNode];

        if (n1 && n2) {
          const px = n1.x + (n2.x - n1.x) * p.progress;
          const py = n1.y + (n2.y - n1.y) * p.progress;

          ctx.beginPath();
          ctx.arc(px, py, 2.0, 0, Math.PI * 2);
          ctx.fillStyle = "#38bdf8";
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Filter out completed pulses
      pulses = pulses.filter((p) => p.progress < 1.0);

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-80"
    />
  );
}
