"use client";

import { useRef, useEffect, useState } from "react";

interface ShaderBackgroundProps {
	/** Path to the shader HTML file served from /public. Default: fluid-amber. */
	src?: string;
	/** Opacity of the shader layer (0–1). Default 0.6. */
	opacity?: number;
	/** Time scale sent to the shader once loaded. Lower = calmer. Default 0.07. */
	timeScale?: number;
}

/**
 * ShaderBackground — renders a Radiant WebGL shader as an iframe behind hero content.
 *
 * Accessibility: aria-hidden, tabIndex -1, pointer-events none.
 * Motion: respects prefers-reduced-motion — falls back to static gradient.
 * Mobile: WebGL is GPU-side; renders on mobile. Reduced-motion skips entirely.
 * SSR: safe — component only mounts client-side; iframe is a plain HTML element.
 * X-Frame-Options: next.config.mjs must set SAMEORIGIN (not DENY) for same-origin iframes.
 */
export function ShaderBackground({
	src = "/shaders/fluid-amber.html",
	opacity = 0.6,
	timeScale = 0.07,
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

	// Send timeScale to shader once iframe has loaded
	useEffect(() => {
		if (!iframeReady || prefersReduced) return;
		const timer = setTimeout(() => {
			iframeRef.current?.contentWindow?.postMessage(
				{ type: "param", name: "timeScale", value: timeScale },
				"*",
			);
		}, 400);
		return () => clearTimeout(timer);
	}, [iframeReady, prefersReduced, timeScale]);

	// Static fallback gradient — prefers-reduced-motion
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
			{/* CSS fallback renders immediately; fades out once shader is ready */}
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
