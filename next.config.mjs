import createNextIntlPlugin from "next-intl/plugin";
import { buildCsp } from "./lib/csp.mjs";

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
	// CSP: built in lib/csp.mjs — one source shared with middleware.ts.
	async headers() {
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
						value: buildCsp(),
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
