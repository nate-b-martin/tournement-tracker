import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
	useAuth: () => mockUseAuth(),
}));

vi.mock("convex/react", () => ({
	useQuery: vi.fn(() => 0),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: vi.fn(() => (opts: { component: React.FC }) => ({
		options: { component: opts.component },
	})),
	Link: ({
		children,
		to,
	}: { children: React.ReactNode; to: string; params?: Record<string, string> }) => (
		<a href={to}>{children}</a>
	),
}));

vi.mock("@/components/ProtectedRoute", () => ({
	ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/SetupWizard", () => ({
	SetupWizard: ({ open }: { open: boolean }) => <div data-testid="setup-wizard" />,
}));

vi.mock("@/components/PlayersTable", () => ({
	PlayersTable: () => <div>PlayersTable</div>,
}));

vi.mock("@/components/TournamentTable", () => ({
	TournamentTable: () => <div>TournamentTable</div>,
}));

describe("Dashboard - Setup Wizard Integration", () => {
	beforeEach(() => {
		mockUseAuth.mockReturnValue({
			isAdmin: true,
			isSignedIn: true,
			isLoading: false,
		});
	});

	it("shows Quick Setup Wizard card for admin", async () => {
		const { Route } = await import("@/routes/dashboard");
		const Component = Route.options.component;
		render(<Component />);

		expect(screen.getByText("Quick Setup Wizard")).toBeTruthy();
		expect(screen.getByText("Launch Setup Wizard")).toBeTruthy();
	});

	it("hides Quick Setup Wizard card for non-admin", async () => {
		mockUseAuth.mockReturnValue({
			isAdmin: false,
			isSignedIn: true,
			isLoading: false,
		});

		const { Route } = await import("@/routes/dashboard");
		const Component = Route.options.component;
		render(<Component />);

		expect(screen.queryByText("Quick Setup Wizard")).toBeNull();
	});

	it("renders SetupWizard dialog component", async () => {
		const { Route } = await import("@/routes/dashboard");
		const Component = Route.options.component;
		render(<Component />);

		expect(screen.getByTestId("setup-wizard")).toBeTruthy();
	});
});
