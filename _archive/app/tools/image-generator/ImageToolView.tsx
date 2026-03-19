"use client";

import { ImageCombiner } from "@/components/image-generator";

/**
 * Image Tool wrapper.
 * ImageCombiner handles both Generate (T2I) and Edit (I2I) modes internally
 * via its own PremiumTabSystem tab bar and dynamic model selector.
 *
 * Sprint 30–34: Legacy separate ImageEditPanel removed — ImageCombiner now
 * handles all 9 models (5 T2I + 4 I2I) via the dynamic schema system.
 */
export function ImageToolView() {
	return (
		<div className="w-full px-4 pt-24 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-28 md:pt-32 md:px-6 lg:px-8">
			<ImageCombiner />
		</div>
	);
}
