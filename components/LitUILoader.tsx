"use client";

import { useEffect } from "react";

/**
 * LitUILoader — injects the lit-ui web component bundle into the document.
 *
 * Renders nothing. Appends a <script type="module"> pointing to
 * /lit-ui/bundle.js the first time the component mounts on the client.
 * The bundle self-registers all <lui-*> / <ui-button> custom elements.
 *
 * Usage: render once inside the root layout body.
 */
export function LitUILoader() {
	useEffect(() => {
		const script = document.createElement("script");
		script.type = "module";
		script.src = "/lit-ui/bundle.js";
		document.head.appendChild(script);
		return () => {
			if (document.head.contains(script)) {
				document.head.removeChild(script);
			}
		};
	}, []);

	return null;
}
