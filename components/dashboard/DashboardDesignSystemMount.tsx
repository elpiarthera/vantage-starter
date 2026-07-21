"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { DesignSystemProvider } from "@/providers/DesignSystemProvider";

/**
 * Mounts the design-system provider ABOVE every dashboard route (Day defect
 * #3 — a saved theme used to apply only inside the configurator's own
 * preview box, because DesignSystemProvider only mounted on
 * /dashboard/configurator and /create).
 *
 * Mounting it once here, at the layout level, is the single app-wide owner
 * of applied tokens for the whole dashboard. /dashboard/configurator no
 * longer mounts its own DesignSystemProvider (see that page) — a second
 * mount would tear down the shared <style id="design-system-theme-vars">
 * and body classes on its own unmount (route change away from the
 * configurator) even though this outer instance is still active, wiping the
 * app-wide theme. Live editing on the configurator page still works because
 * useDesignSystem() (nuqs) is shared URL-bound state — the Customizer's
 * pickers update the same params this provider reads and reacts to.
 */
export function DashboardDesignSystemMount({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<NuqsAdapter>
			<DesignSystemProvider>{children}</DesignSystemProvider>
		</NuqsAdapter>
	);
}
