"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { ImageToolView } from "./ImageToolView";

function Loading() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Loader2 className="h-12 w-12 animate-spin text-primary" />
		</div>
	);
}

export default function ImageGeneratorPage() {
	return (
		<Suspense fallback={<Loading />}>
			<main className="min-h-screen bg-background">
				<ImageToolView />
			</main>
		</Suspense>
	);
}
