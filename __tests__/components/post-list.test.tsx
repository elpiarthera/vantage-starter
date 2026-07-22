/**
 * Coverage for the mcpcn `post-list` block's four variants
 * (`list`, `grid`, `carousel`, `fullwidth`) — `components/ui/post-list.tsx`.
 * See that file's header for the upstream-parity declaration this test
 * proves.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { PostList } from "@/components/ui/post-list";

// `PostList`'s `"carousel"` variant reuses `components/ui/carousel.tsx`
// (`embla-carousel-react`), which reads `window.matchMedia` and
// `IntersectionObserver` on mount — jsdom implements neither, so both are
// stubbed. `matchMedia` follows the same shape the sidebar suites already
// use (`__tests__/components/app-sidebar-tooltip.test.tsx`).
beforeAll(() => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			addListener: jest.fn(),
			removeListener: jest.fn(),
			dispatchEvent: jest.fn(),
		}),
	});

	class MockIntersectionObserver implements IntersectionObserver {
		readonly root: Element | Document | null = null;
		readonly rootMargin: string = "";
		readonly thresholds: ReadonlyArray<number> = [];
		disconnect = jest.fn();
		observe = jest.fn();
		takeRecords = jest.fn(() => []);
		unobserve = jest.fn();
	}
	window.IntersectionObserver =
		MockIntersectionObserver as unknown as typeof IntersectionObserver;

	class MockResizeObserver implements ResizeObserver {
		disconnect = jest.fn();
		observe = jest.fn();
		unobserve = jest.fn();
	}
	window.ResizeObserver =
		MockResizeObserver as unknown as typeof ResizeObserver;
});

function Post({ id }: { id: number }) {
	return <article data-testid={`post-${id}`}>{`Post ${id}`}</article>;
}

function posts(count: number) {
	const ids = Array.from({ length: count }, (_, i) => i);
	return ids.map((id) => <Post key={`post-${id}`} id={id} />);
}

describe("PostList — list variant", () => {
	test("stacks posts in a single column (flex-col), not a grid", () => {
		const { container } = render(
			<PostList variant="list">{posts(3)}</PostList>,
		);
		const root = container.querySelector('[data-slot="post-list"]');
		expect(root).toHaveClass("flex", "flex-col");
		expect(root).not.toHaveClass("grid");
		expect(screen.getAllByTestId(/post-\d/)).toHaveLength(3);
	});
});

describe("PostList — grid variant (default)", () => {
	test("renders posts in a responsive grid", () => {
		const { container } = render(<PostList>{posts(3)}</PostList>);
		const root = container.querySelector('[data-slot="post-list"]');
		expect(root).toHaveClass("grid");
		expect(screen.getAllByTestId(/post-\d/)).toHaveLength(3);
	});
});

describe("PostList — carousel variant", () => {
	const labels = {
		carouselPrevious: "Previous entries",
		carouselNext: "Next entries",
	};

	test("renders every post inside carousel slides with reachable controls", () => {
		render(
			<PostList variant="carousel" labels={labels}>
				{posts(3)}
			</PostList>,
		);
		expect(screen.getAllByTestId(/post-\d/)).toHaveLength(3);
		expect(
			screen.getByRole("button", { name: "Previous entries" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Next entries" }),
		).toBeInTheDocument();
	});

	test("carousel controls are keyboard-reachable (native <button>, tabbable)", () => {
		render(
			<PostList variant="carousel" labels={labels}>
				{posts(3)}
			</PostList>,
		);
		const next = screen.getByRole("button", { name: "Next entries" });
		expect(next.tagName).toBe("BUTTON");
		expect(next).not.toHaveAttribute("tabindex", "-1");
	});
});

describe("PostList — fullwidth variant (paginated)", () => {
	const labels = {
		paginationPrevious: "Previous page",
		paginationNext: "Next page",
		paginationStatus: (current: number, total: number) =>
			`Page ${current} of ${total}`,
	};

	test("shows exactly one page of posts for the given page size", () => {
		render(
			<PostList variant="fullwidth" pageSize={2} labels={labels}>
				{posts(5)}
			</PostList>,
		);
		expect(screen.getByTestId("post-0")).toBeInTheDocument();
		expect(screen.getByTestId("post-1")).toBeInTheDocument();
		expect(screen.queryByTestId("post-2")).not.toBeInTheDocument();
		expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
	});

	test("moves to the next page and back on control click", () => {
		render(
			<PostList variant="fullwidth" pageSize={2} labels={labels}>
				{posts(5)}
			</PostList>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Next page" }));
		expect(screen.getByTestId("post-2")).toBeInTheDocument();
		expect(screen.getByTestId("post-3")).toBeInTheDocument();
		expect(screen.queryByTestId("post-0")).not.toBeInTheDocument();
		expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
		expect(screen.getByTestId("post-0")).toBeInTheDocument();
		expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
	});

	test("disables the previous control on the first page and next on the last", () => {
		render(
			<PostList variant="fullwidth" pageSize={2} labels={labels}>
				{posts(5)}
			</PostList>,
		);
		expect(
			screen.getByRole("button", { name: "Previous page" }),
		).toBeDisabled();

		fireEvent.click(screen.getByRole("button", { name: "Next page" }));
		fireEvent.click(screen.getByRole("button", { name: "Next page" }));
		expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
	});

	test("no pagination controls render when everything fits on one page", () => {
		render(
			<PostList variant="fullwidth" pageSize={10} labels={labels}>
				{posts(3)}
			</PostList>,
		);
		expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
	});
});
