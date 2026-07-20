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

vi.mock("@/components/SetupWizard", () => ({
	SetupWizard: ({ open }: { open: boolean }) => <div data-testid="setup-wizard" />,
}));

describe("Homepage - Setup Wizard Integration", () => {
	beforeEach(() => {
		mockUseAuth.mockReturnValue({
			isAdmin: true,
			isSignedIn: true,
			isLoading: false,
		});
	});

	it("shows Setup Wizard button in Admin Quick Actions for admin", async () => {
		const { Route } = await import("@/routes/index");
		const Component = Route.options.component;
		render(<Component />);

		expect(screen.getByText("Setup Wizard")).toBeTruthy();
	});

	it("hides Setup Wizard button for non-admin", async () => {
		mockUseAuth.mockReturnValue({
			isAdmin: false,
			isSignedIn: true,
			isLoading: false,
		});

		const { Route } = await import("@/routes/index");
		const Component = Route.options.component;
		render(<Component />);

		expect(screen.queryByText("Setup Wizard")).toBeNull();
	});
});
