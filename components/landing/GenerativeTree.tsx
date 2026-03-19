"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/* ============================================================================
   GenerativeTree — Canvas 2D branching tree shader
   Reads --primary and --background CSS variables from the active preset.
   Renders on client only (SSR-safe via next/dynamic ssr:false at usage site).
   prefers-reduced-motion: shows static gradient instead of animated tree.
   Mobile: caps branch depth for performance.
   ============================================================================ */

interface Branch {
  x: number;
  y: number;
  angle: number;
  length: number;
  depth: number;
  life: number;       // 0..1 — how much of this branch has grown
  speed: number;      // growth speed
  opacity: number;
  children: Branch[];
  hasSpawned: boolean;
}

function createBranch(
  x: number,
  y: number,
  angle: number,
  length: number,
  depth: number,
): Branch {
  return {
    x,
    y,
    angle,
    length,
    depth,
    life: 0,
    speed: 0.002 + Math.random() * 0.003,
    opacity: 0.85 - depth * 0.06,
    children: [],
    hasSpawned: false,
  };
}

function parseCSSColor(raw: string): string {
  const trimmed = raw.trim();
  // Canvas 2D fillStyle accepts oklch() natively in modern browsers
  // Chrome 111+, Firefox 113+, Safari 15.4+ — all supported
  return trimmed || "oklch(0.68 0.22 232)";
}

interface GenerativeTreeProps {
  className?: string;
  /** Opacity of the canvas layer (0–1). Default 0.75 dark, 0.4 light. */
  opacity?: number;
}

function GenerativeTreeInner({ className = "", opacity }: GenerativeTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const branchesRef = useRef<Branch[]>([]);
  const [prefersReduced, setPrefersReduced] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Canvas 2D animation
  useEffect(() => {
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Read CSS variables from the active preset
    const computedStyle = getComputedStyle(document.documentElement);
    const rawPrimary = computedStyle.getPropertyValue("--primary");
    const rawBg = computedStyle.getPropertyValue("--background");
    const primaryColor = parseCSSColor(rawPrimary);
    const bgColor = parseCSSColor(rawBg);

    // DPR-aware canvas sizing (max 2x for performance)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isMobile = window.innerWidth < 768;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      if (ctx) ctx.scale(dpr, dpr);
    }
    resize();

    // Cap branch depth on mobile for CPU budget
    const maxDepth = isMobile ? 6 : 9;
    const branchFactor = isMobile ? 0.65 : 0.72;

    // Seed — trunk starts from bottom center, grows upward
    // Trunk length scaled to canvas height so tree fills the viewport
    const seedX = canvas.width / dpr / 2;
    const seedY = canvas.height / dpr;
    const trunkLength = Math.max(120, (canvas.height / dpr) * 0.22);
    branchesRef.current = [
      createBranch(seedX, seedY, -Math.PI / 2, trunkLength, 0),
    ];

    // Trail opacity for previous frames (motion blur feel)
    const trailAlpha = 0.08;

    function spawnChildren(branch: Branch) {
      const tipX = branch.x + Math.cos(branch.angle) * branch.length;
      const tipY = branch.y + Math.sin(branch.angle) * branch.length;

      // Two children with slight angle deviation + random asymmetry
      const spread = (0.3 + Math.random() * 0.25);
      const childLen = branch.length * (branchFactor - Math.random() * 0.05);

      if (branch.depth < maxDepth - 1) {
        branch.children.push(
          createBranch(tipX, tipY, branch.angle - spread, childLen, branch.depth + 1),
          createBranch(tipX, tipY, branch.angle + spread, childLen, branch.depth + 1),
        );

        // Occasionally add a third branch for visual density
        if (branch.depth < 3 && Math.random() > 0.6) {
          branch.children.push(
            createBranch(tipX, tipY, branch.angle + (Math.random() - 0.5) * 0.2, childLen * 0.85, branch.depth + 1),
          );
        }
      }
      branch.hasSpawned = true;
    }

    function drawBranch(branch: Branch) {
      if (!ctx || !canvas) return;

      const currentLength = branch.length * branch.life;
      const endX = branch.x + Math.cos(branch.angle) * currentLength;
      const endY = branch.y + Math.sin(branch.angle) * currentLength;

      // Line width tapers with depth: trunk thick, twigs thin
      const baseWidth = Math.max(0.4, 2.5 - branch.depth * 0.28);
      ctx.beginPath();
      ctx.moveTo(branch.x, branch.y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = primaryColor;
      ctx.globalAlpha = branch.opacity * branch.life;
      ctx.lineWidth = baseWidth;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Spawn children once branch has grown past 90%
      if (branch.life > 0.9 && !branch.hasSpawned) {
        spawnChildren(branch);
      }

      // Recurse into children
      for (const child of branch.children) {
        child.life = Math.min(1, child.life + child.speed);
        if (child.life > 0) drawBranch(child);
      }
    }

    let firstFrame = true;

    function tick() {
      if (!canvas || !ctx) return;

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      if (firstFrame) {
        // Fill background on first frame only — subsequent frames use trail
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
        firstFrame = false;
      } else {
        // Soft trail: semi-transparent background overlay
        ctx.fillStyle = bgColor;
        ctx.globalAlpha = trailAlpha;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      // Grow trunk
      for (const branch of branchesRef.current) {
        branch.life = Math.min(1, branch.life + branch.speed);
        drawBranch(branch);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);

    const resizeObserver = new ResizeObserver(() => {
      // Reset on resize
      cancelAnimationFrame(animFrameRef.current);
      const seedX2 = canvas.clientWidth / 2;
      const seedY2 = canvas.clientHeight;
      const trunkLength2 = Math.max(120, canvas.clientHeight * 0.22);
      branchesRef.current = [createBranch(seedX2, seedY2, -Math.PI / 2, trunkLength2, 0)];
      firstFrame = true;
      resize();
      animFrameRef.current = requestAnimationFrame(tick);
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [prefersReduced]);

  // Determine opacity: caller-provided, or auto dark/light
  const isDark =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const resolvedOpacity = opacity ?? (isDark ? 0.75 : 0.40);

  // prefers-reduced-motion fallback: static gradient using CSS vars
  if (prefersReduced) {
    return (
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(135deg, var(--card) 0%, var(--background) 60%, var(--background) 100%)",
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity: resolvedOpacity }}
      aria-hidden="true"
    />
  );
}

// Lazy-load with SSR disabled — canvas only runs on client
export const GenerativeTree = dynamic(
  () => Promise.resolve(GenerativeTreeInner),
  { ssr: false },
);
