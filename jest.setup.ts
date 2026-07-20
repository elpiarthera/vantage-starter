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
