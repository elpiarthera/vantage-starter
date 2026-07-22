/**
 * "use client": uses `useState`/`useEffect` and reads `window` — client-only
 * React APIs, same class of defect fixed in `post-card.tsx`/`post-detail.tsx`
 * (`components/ui/`). Its only caller today, `components/ui/sidebar.tsx`, is
 * already `"use client"`, so this file was never build-breaking — the
 * directive is added anyway so this hook is never the next occurrence of
 * that class, per this repo's `fix-the-class` rule.
 */
"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
	const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
		undefined,
	);

	React.useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		const onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};
		mql.addEventListener("change", onChange);
		setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	return !!isMobile;
}
