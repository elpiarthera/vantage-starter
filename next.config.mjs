import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	logging: {
		browserToTerminal: true,
	},
	// CSP: Clerk (FAPI + Cloudflare Turnstile CAPTCHA), Convex (eval), Vercel Live, blob: for voice recording.
	// Cloudflare Turnstile requires https://challenges.cloudflare.com in both script-src AND frame-src.
	// script-src-elem must mirror script-src (browsers fall back to script-src but explicit avoids the CSP warning).
	async headers() {
		const scriptSrcHosts = [
			"'self'",
			"'unsafe-eval'",
			"'unsafe-inline'",
			"https://*.clerk.accounts.dev",
			"https://clerk.myreeldream.ai",
			"https://challenges.cloudflare.com",
			"https://vercel.live",
		].join(" ");

		return [
			{
				source: "/:path*",
				headers: [
					// Security hardening headers
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "SAMEORIGIN",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
					{
						key: "Content-Security-Policy",
						value: [
							"default-src 'self'",
							`script-src ${scriptSrcHosts}`,
							`script-src-elem ${scriptSrcHosts}`,
							"worker-src 'self' blob:",
							"style-src 'self' 'unsafe-inline' https:",
							"img-src 'self' data: blob: https:",
							"media-src 'self' blob: data: https:",
							"font-src 'self' data: https:",
							"connect-src 'self' blob: https: wss:",
							"frame-src 'self' https://challenges.cloudflare.com https://clerk.myreeldream.ai https://*.clerk.accounts.dev https://vercel.live https://polar.sh https://sandbox.polar.sh",
							"object-src 'none'",
							"base-uri 'self'",
							"form-action 'self' https:",
							"frame-ancestors 'self'",
							"upgrade-insecure-requests",
						].join("; "),
					},
				],
			},
		];
	},
	webpack: (config, { dev, isServer }) => {
		if (!dev && !isServer) {
			config.optimization.splitChunks = {
				chunks: "all",
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: "vendors",
						chunks: "all",
					},
				},
			};
		}
		return config;
	},
};

// Bundle analyzer setup
const withBundleAnalyzer =
	process.env.ANALYZE === "true"
		? require("@next/bundle-analyzer")({ enabled: true })
		: (config) => config;

export default withBundleAnalyzer(withNextIntl(nextConfig));
