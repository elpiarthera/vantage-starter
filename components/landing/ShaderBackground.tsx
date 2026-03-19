"use client";

import { useRef, useEffect, useState } from "react";

interface ShaderBackgroundProps {
	/** Path to the shader HTML file served from /public */
	src?: string;
	/** Opacity of the shader layer (0–1). Default 0.9. */
	opacity?: number;
}

/**
 * ShaderBackground — renders a Radiant WebGL shader as an iframe behind hero content.
 *
 * Accessibility: aria-hidden, tabIndex -1, pointer-events none.
 * Motion: respects prefers-reduced-motion — falls back to static gradient.
 * Mobile: on < md the shader still renders (WebGL is GPU-side and performant),
 *         but if reduced-motion is set we skip it entirely.
 * SSR: safe — component only mounts client-side, iframe is an HTML element.
 */
export function ShaderBackground({
	src = "/shaders/hero-bg.html",
	opacity = 0.9,
}: ShaderBackgroundProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [prefersReduced, setPrefersReduced] = useState(false);
	const [iframeReady, setIframeReady] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		setPrefersReduced(mq.matches);
		const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	// Slow down the animation slightly once the iframe loads — more calming for a hero
	useEffect(() => {
		if (!iframeReady || prefersReduced) return;
		const timer = setTimeout(() => {
			iframeRef.current?.contentWindow?.postMessage(
				{ type: "param", name: "timeScale", value: 0.07 },
				"*",
			);
		}, 400);
		return () => clearTimeout(timer);
	}, [iframeReady, prefersReduced]);

	// Static fallback gradient — used when prefers-reduced-motion is set
	if (prefersReduced) {
		return (
			<div
				className="absolute inset-0 pointer-events-none"
				aria-hidden="true"
				style={{
					background:
						"linear-gradient(135deg, oklch(0.08 0.025 44) 0%, oklch(0.12 0.04 44) 50%, oklch(0.15 0.05 44) 100%)",
				}}
			/>
		);
	}

	return (
		<>
			{/* Fallback gradient — renders immediately, hidden once iframe loads */}
			<div
				className="absolute inset-0 pointer-events-none transition-opacity duration-700"
				aria-hidden="true"
				style={{
					background:
						"linear-gradient(135deg, oklch(0.08 0.025 44) 0%, oklch(0.12 0.04 44) 50%, oklch(0.15 0.05 44) 100%)",
					opacity: iframeReady ? 0 : 1,
				}}
			/>

			{/* Shader iframe */}
			<iframe
				ref={iframeRef}
				src={src}
				className="absolute inset-0 w-full h-full pointer-events-none"
				style={{
					border: "none",
					opacity: iframeReady ? opacity : 0,
					transition: "opacity 0.7s ease-in",
				}}
				aria-hidden="true"
				tabIndex={-1}
				loading="lazy"
				title="Animated background shader"
				onLoad={() => setIframeReady(true)}
			/>
		</>
	);
}
