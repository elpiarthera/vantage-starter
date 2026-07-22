import "@testing-library/jest-dom";

// jsdom ships no TransformStream/ReadableStream/WritableStream. The `ai`
// SDK (imported transitively by any chat component) requires them at
// module-load time (`eventsource-parser`), so any suite that imports a
// component pulling in `ai` throws `ReferenceError: TransformStream is not
// defined` before a single test runs. Polyfill from Node's `stream/web`.
import {
	ReadableStream,
	TransformStream,
	WritableStream,
} from "node:stream/web";

if (typeof globalThis.TransformStream === "undefined") {
	Object.assign(globalThis, {
		ReadableStream,
		TransformStream,
		WritableStream,
	});
}

// jsdom's realm does not carry Node's built-in `fetch`/`Request`/`Response`/
// `Headers` (jsdom 26 implements neither; Node's own `fetch` global lives in
// the outer process realm, not the jsdom vm context jest-environment-jsdom
// evaluates test files in -- so a bare reference to it here is a
// `ReferenceError`, not merely `undefined`). `@clerk/backend`'s runtime
// shim only reads `typeof globalThis.fetch` at module-load time to pick a
// runtime adapter; it is never actually called by these suites (no test
// here performs network I/O), so a presence-only stub is sufficient.
// Needed so any suite importing the real (unmocked) `@clerk/nextjs/server`
// -- required for the `createRouteMatcher` suites to exercise the actual
// primitive instead of a re-typed mock -- doesn't throw before a single
// test runs.
if (typeof globalThis.fetch === "undefined") {
	class MinimalHeaders {
		private readonly map = new Map<string, string>();
		constructor(init?: Record<string, string>) {
			for (const [k, v] of Object.entries(init ?? {})) this.map.set(k, v);
		}
		get(name: string) {
			return this.map.get(name) ?? null;
		}
		set(name: string, value: string) {
			this.map.set(name, value);
		}
	}
	class MinimalRequest {
		constructor(
			public readonly url: string,
			public readonly init?: unknown,
		) {}
	}
	class MinimalResponse {
		constructor(
			public readonly body?: unknown,
			public readonly init?: unknown,
		) {}
	}
	Object.assign(globalThis, {
		fetch: async () => {
			throw new Error(
				"jest.setup.ts fetch stub: no suite in this repo performs real " +
					"network I/O through the global fetch; if one now does, replace " +
					"this stub with a real polyfill.",
			);
		},
		Request: MinimalRequest,
		Response: MinimalResponse,
		Headers: MinimalHeaders,
	});
}

// jsdom ships no PointerEvent constructor. Base UI's `useButton`/interaction
// primitives (checkbox, radio, accordion trigger, slider thumb, etc.)
// dispatch real PointerEvents for press handling, so any suite driving a
// Base UI component via `@testing-library/user-event` throws
// `PointerEvent is not a constructor` before the click resolves. Polyfill
// with a minimal MouseEvent-based subclass — sufficient for the pointerId/
// pointerType fields Base UI reads.
if (typeof globalThis.PointerEvent === "undefined") {
	class PointerEventPolyfill extends MouseEvent {
		public pointerId: number;
		public pointerType: string;
		public isPrimary: boolean;

		constructor(type: string, params: PointerEventInit = {}) {
			super(type, params);
			this.pointerId = params.pointerId ?? 0;
			this.pointerType = params.pointerType ?? "mouse";
			this.isPrimary = params.isPrimary ?? true;
		}
	}
	Object.assign(globalThis, { PointerEvent: PointerEventPolyfill });
}

// jsdom ships no `Element.prototype.getAnimations`. Base UI's ScrollArea
// viewport calls it (to wait out in-flight scrollbar fade animations before
// hiding them) whenever a scroll event fires, so any suite mounting a
// `ScrollArea` consumer and dispatching a real `scroll` event throws
// `viewport.getAnimations is not a function`. Polyfill with a no-op
// returning an empty animation list — sufficient since jsdom never runs
// real CSS animations in the first place.
if (typeof Element.prototype.getAnimations === "undefined") {
	Element.prototype.getAnimations = () => [];
}
