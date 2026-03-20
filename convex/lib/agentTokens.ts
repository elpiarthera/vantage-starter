/**
 * Agent token utilities — V8-safe (Convex runtime).
 *
 * DO NOT import node:crypto here. Convex V8 runtime does not have it.
 * Use Web Crypto API (crypto.getRandomValues, globalThis.crypto).
 */

/**
 * Generate a 32-byte hex agent token using Web Crypto.
 * Returns a 64-character lowercase hex string.
 */
export function generateAgentToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Constant-time string comparison — V8-safe replacement for node:crypto timingSafeEqual.
 *
 * Both strings are encoded to UTF-8 bytes and compared with XOR.
 * Length difference short-circuits early (leaks length), but agent tokens are
 * always 64-character hex strings so length is not a secret — safe.
 *
 * Returns true only if every byte is identical.
 */
export function timingSafeEqualV8(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	const aBytes = new TextEncoder().encode(a);
	const bBytes = new TextEncoder().encode(b);
	let diff = 0;
	for (let i = 0; i < aBytes.length; i++) {
		diff |= aBytes[i] ^ bBytes[i];
	}
	return diff === 0;
}
