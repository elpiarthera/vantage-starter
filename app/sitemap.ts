import type { MetadataRoute } from "next";

const BASE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://vantagestarter.ai";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		// Landing pages
		{
			url: BASE_URL,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${BASE_URL}/fr`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.9,
		},
		// Waitlist
		{
			url: `${BASE_URL}/waitlist`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${BASE_URL}/fr/waitlist`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.7,
		},
		// Auth
		{
			url: `${BASE_URL}/sign-in`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${BASE_URL}/sign-up`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.5,
		},
		// Legal
		{
			url: `${BASE_URL}/privacy`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${BASE_URL}/terms`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		// Accessibility declarations (EN + FR)
		{
			url: `${BASE_URL}/en/accessibility`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.2,
		},
		{
			url: `${BASE_URL}/fr/accessibilite`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.2,
		},
		{
			url: `${BASE_URL}/en/accessibility-plan`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.2,
		},
		{
			url: `${BASE_URL}/fr/schema-accessibilite`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.2,
		},
	];
}
