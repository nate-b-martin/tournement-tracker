import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useAuth", () => ({
	useAuth: () => ({
		isLoaded: true,
		isSignedIn: true,
		isAdmin: true,
		profile: { role: "admin" },
	}),
}));

vi.mock("@/components/SeasonsTable", () => ({
	SeasonsTable: () => <div data-testid="seasons-table" />,
}));

vi.mock("convex/react", () => ({
	useQuery: vi.fn(() => undefined),
	useMutation: vi.fn(() => vi.fn()),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: vi.fn(() => (opts: { component: React.FC }) => ({
		options: { component: opts.component },
	})),
}));

describe("SeasonsPage", () => {
	it("renders the seasons heading and description", async () => {
		const { Route } = await import("@/routes/seasonspage");
		const Component = Route.options.component;
		render(<Component />);

		expect(screen.getByText("Seasons")).toBeTruthy();
		expect(screen.getByText("Browse and manage seasons")).toBeTruthy();
	});
});
