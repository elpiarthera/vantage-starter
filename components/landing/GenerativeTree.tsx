"use client";

import { useEffect, useRef, useState } from "react";

/* ============================================================================
   GenerativeTree — Radiant original generative branching tree shader.
   Source: https://github.com/pbakaus/radiant (generative-tree.html)
   Served as a same-origin iframe from /public/shaders/generative-tree.html.

   Visual: painterly multi-stroke branches, particles, canopy glow, sway.
   Color: amber palette shifted to electric blue via CSS hue-rotate(200deg).
   Interaction: mouse wind + click shake — pointer-events enabled on iframe.
   Motion: prefers-reduced-motion → static gradient fallback.
   A11y: aria-hidden, tabIndex -1.
   X-Frame-Options: requires SAMEORIGIN in next.config.mjs (already set).
   ============================================================================ */

interface GenerativeTreeProps {
  className?: string;
}

export function GenerativeTree({ className = "" }: GenerativeTreeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Send params once iframe loads
  useEffect(() => {
    if (!loaded || prefersReduced) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Small delay to ensure the shader's message listener is registered
    const timer = setTimeout(() => {
      iframe.contentWindow?.postMessage(
        { type: "param", name: "GROWTH_SPEED_BASE", value: 0.025 },
        "*",
      );
      iframe.contentWindow?.postMessage(
        { type: "param", name: "MAX_DEPTH", value: 14 },
        "*",
      );
    }, 200);

    return () => clearTimeout(timer);
  }, [loaded, prefersReduced]);

  // prefers-reduced-motion: static dark gradient
  if (prefersReduced) {
    return (
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.08 0.04 232) 0%, oklch(0.06 0.02 232) 60%, #0a0a0a 100%)",
        }}
      />
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src="/shaders/generative-tree.html"
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{
        border: "none",
        // Amber → electric blue: hue-rotate(200deg) shifts warm amber palette
        // into cool electric blue. This is how Radiant's own gallery applies colour variants.
        filter: "hue-rotate(200deg)",
        // Fade in on load to avoid flash
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.8s ease-in",
      }}
      aria-hidden="true"
      tabIndex={-1}
      loading="eager"
      title=""
      onLoad={() => setLoaded(true)}
    />
  );
}
