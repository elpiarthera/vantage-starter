/**
 * Generic auto-title derivation — no knowledge of any particular kind of
 * session lives here. Any table that stores a conversation (chats,
 * architectSessions, or a future kind) can call this to turn its own first
 * exchange into a display name, without this module knowing what the caller
 * is.
 *
 * Precedence rule lives in the DATA, not in call order: callers must gate
 * this on their own `isTitleCustom` flag — once a user has renamed a
 * session, the automatic mechanism must never run again for that row.
 */

const MAX_TITLE_LENGTH = 60;

/**
 * Derives a short display title from free-form conversation content.
 * Pure function — same input always produces the same output, no I/O,
 * no knowledge of the caller's domain.
 */
export function deriveTitleFromContent(content: string): string {
	const firstLine = content.split("\n")[0]?.trim() ?? "";
	const collapsed = firstLine.replace(/\s+/g, " ").trim();

	if (collapsed.length <= MAX_TITLE_LENGTH) {
		return collapsed;
	}

	return `${collapsed.slice(0, MAX_TITLE_LENGTH).trimEnd()}…`;
}
