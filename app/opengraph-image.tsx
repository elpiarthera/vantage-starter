import { ImageResponse } from "next/og";

/**
 * NAMED EXCEPTION (i18n): this file convention only applies to a route
 * segment that has a matching `page.tsx` at the same level. There is no
 * `app/page.tsx` — the real homepage lives at `app/[locale]/page.tsx`, which
 * already overrides `openGraph.images` with the static, pre-rendered
 * `/og-image.png` and locale-correct `t("og_title")`/`t("og_description")`
 * text (see that file's `generateMetadata`). Verified: no reachable route
 * resolves to this file, so translating its English copy would be dead work
 * with zero user-facing effect. Kept only as a Next.js convention fallback
 * for tooling that probes the bare root.
 */
export const runtime = "edge";

export const alt = "VantageStarter — AI SaaS Starter Kit";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image() {
	return new ImageResponse(
		<div
			style={{
				background:
					"linear-gradient(135deg, #0a0a0a 0%, #1a1208 50%, #0a0a0a 100%)",
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			{/* Logo / Brand mark */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "16px",
					marginBottom: "32px",
				}}
			>
				<div
					style={{
						width: "64px",
						height: "64px",
						borderRadius: "16px",
						background: "oklch(0.62 0.16 44)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: "32px",
						color: "white",
						fontWeight: 700,
					}}
				>
					V
				</div>
				<div
					style={{
						fontSize: "56px",
						fontWeight: 700,
						color: "white",
						letterSpacing: "-2px",
					}}
				>
					VantageStarter
				</div>
			</div>

			{/* Tagline */}
			<div
				style={{
					fontSize: "28px",
					color: "#a1a1aa",
					maxWidth: "700px",
					textAlign: "center",
					lineHeight: 1.4,
				}}
			>
				The AI SaaS starter kit that ships with everything
			</div>

			{/* Domain */}
			<div
				style={{
					position: "absolute",
					bottom: "40px",
					fontSize: "18px",
					color: "#52525b",
				}}
			>
				vantagestarter.ai
			</div>
		</div>,
		{
			...size,
		},
	);
}
