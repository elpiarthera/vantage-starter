"use client";

import type React from "react";
import { DeviceProvider } from "@/contexts/DeviceContext";

export default function ToolsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <DeviceProvider>{children}</DeviceProvider>;
}
