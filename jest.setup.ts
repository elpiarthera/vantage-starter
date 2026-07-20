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
