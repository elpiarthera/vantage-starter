import type { Metadata } from "next";
import type React from "react";
import "./globals.css";

export const metadata: Metadata = {
	title: "VantageStarter",
	description: "Create stunning AI-powered video in minutes",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}

// Required for next-intl to work with non-locale routes
export function generateStaticParams() {
	return [];
}
