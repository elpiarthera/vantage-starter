import type { MetadataRoute } from "next";

const BASE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://vantagestarter.ai";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/api/",
				"/admin/",
				"/dashboard/",
				"/guided/",
				"/tools/",
				"/settings/",
			],
		},
		sitemap: `${BASE_URL}/sitemap.xml`,
	};
}
