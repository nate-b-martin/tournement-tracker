import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
	useAuth: () => mockUseAuth(),
}));

const queryValues: unknown[] = [];
vi.mock("convex/react", () => ({
	useQuery: vi.fn(() => queryValues.shift()),
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

vi.mock("@clerk/clerk-react", () => ({
	SignInButton: ({ children }: { children: React.ReactNode }) => (
		<span>{children}</span>
	),
}));

async function renderHomepage() {
	const { Route } = await import("@/routes/index");
	const Component = Route.options.component;
	render(<Component />);
	return Component;
}

function signedInAuth(overrides: Record<string, boolean> = {}) {
	return {
		isLoading: false,
		isSignedIn: true,
		isAdmin: false,
		isOrganizer: false,
		isPlayer: false,
		isSpectator: true,
		...overrides,
	};
}

describe("Homepage", () => {
	beforeEach(() => {
		vi.resetModules();
		queryValues.length = 0;
	});

	it("renders title and subtitle", async () => {
		mockUseAuth.mockReturnValue(signedInAuth());
		await renderHomepage();

		expect(screen.getByText("Tournament Tracker")).toBeTruthy();
		expect(
			screen.getByText(/Manage tournaments, teams, players, and seasons/),
		).toBeTruthy();
	});

	it("shows loading ellipsis while counts are undefined", async () => {
		mockUseAuth.mockReturnValue(signedInAuth());
		queryValues.push(
			undefined,
			undefined,
			undefined,
			undefined,
			{ data: [] },
			{ data: [] },
		);
		await renderHomepage();

		expect(screen.getAllByText("...").length).toBeGreaterThanOrEqual(4);
	});

	it("renders stat cards with the returned counts", async () => {
		mockUseAuth.mockReturnValue(signedInAuth());
		queryValues.push(10, 25, 4, 2, { data: [] }, { data: [] });
		await renderHomepage();

		expect(screen.getAllByText("Teams").length).toBeGreaterThan(0);
		expect(screen.getByText("10")).toBeTruthy();
		expect(screen.getAllByText("Players").length).toBeGreaterThan(0);
		expect(screen.getByText("25")).toBeTruthy();
		expect(screen.getAllByText("Tournaments").length).toBeGreaterThan(0);
		expect(screen.getByText("4")).toBeTruthy();
		expect(screen.getAllByText("Seasons").length).toBeGreaterThan(0);
		expect(screen.getByText("2")).toBeTruthy();
	});

	it("renders empty states for recent lists when there is no data", async () => {
		mockUseAuth.mockReturnValue(signedInAuth());
		queryValues.push(0, 0, 0, 0, { data: [] }, { data: [] });
		await renderHomepage();

		expect(screen.getByText("No tournaments yet.")).toBeTruthy();
		expect(screen.getByText("No seasons yet.")).toBeTruthy();
	});

	it("renders recent tournaments and seasons with their metadata", async () => {
		mockUseAuth.mockReturnValue(signedInAuth());
		queryValues.push(
			0,
			0,
			0,
			0,
			{
				data: [
					{ _id: "t1", name: "Summer Cup", sport: "Tennis" },
					{ _id: "t2", name: "Winter Open", sport: "Soccer" },
				],
			},
			{
				data: [
					{ _id: "s1", name: "Fall League", status: "active" },
					{ _id: "s2", name: "Spring League", status: "planning" },
				],
			},
		);
		await renderHomepage();

		expect(screen.getByText("Recent Tournaments")).toBeTruthy();
		expect(screen.getByText("Summer Cup")).toBeTruthy();
		expect(screen.getByText("Tennis")).toBeTruthy();
		expect(screen.getByText("Winter Open")).toBeTruthy();

		expect(screen.getByText("Recent Seasons")).toBeTruthy();
		expect(screen.getByText("Fall League")).toBeTruthy();
		expect(screen.getByText("active")).toBeTruthy();
		expect(screen.getByText("Spring League")).toBeTruthy();
	});

	it("shows quick access nav cards when signed in", async () => {
		mockUseAuth.mockReturnValue(signedInAuth());
		queryValues.push(0, 0, 0, 0, { data: [] }, { data: [] });
		await renderHomepage();

		expect(screen.getByText("Quick Access")).toBeTruthy();
		expect(screen.getByText("View and manage teams")).toBeTruthy();
		expect(screen.getByText("View and manage player rosters")).toBeTruthy();
	});

	it("hides quick access and recent lists when signed out", async () => {
		mockUseAuth.mockReturnValue({
			isLoading: false,
			isSignedIn: false,
			isAdmin: false,
			isOrganizer: false,
		});
		queryValues.push(0, 0, 0, 0, { data: [] }, { data: [] });
		await renderHomepage();

		expect(screen.queryByText("Quick Access")).toBeNull();
		expect(screen.queryByText("Recent Tournaments")).toBeNull();
	});

	it("shows the sign-in prompt for unauthenticated visitors", async () => {
		mockUseAuth.mockReturnValue({
			isLoading: false,
			isSignedIn: false,
			isAdmin: false,
			isOrganizer: false,
		});
		queryValues.push(0, 0, 0, 0, { data: [] }, { data: [] });
		await renderHomepage();

		expect(screen.getByText("Tournament Administrator?")).toBeTruthy();
		expect(screen.getByText("Sign In")).toBeTruthy();
	});

	it("does not render the sign-in prompt while still loading", async () => {
		mockUseAuth.mockReturnValue({
			isLoading: true,
			isSignedIn: false,
			isAdmin: false,
			isOrganizer: false,
		});
		queryValues.push(0, 0, 0, 0, { data: [] }, { data: [] });
		await renderHomepage();

		expect(screen.queryByText("Tournament Administrator?")).toBeNull();
	});

	it("hides the Setup & Management panel for spectators", async () => {
		mockUseAuth.mockReturnValue(signedInAuth({ isSpectator: true }));
		queryValues.push(0, 0, 0, 0, { data: [] }, { data: [] });
		await renderHomepage();

		expect(screen.queryByText("Setup & Management")).toBeNull();
	});

	it("shows Setup & Management for organizers without the Setup Wizard button", async () => {
		mockUseAuth.mockReturnValue(signedInAuth({ isOrganizer: true }));
		queryValues.push(0, 0, 0, 0, { data: [] }, { data: [] });
		await renderHomepage();

		expect(screen.getByText("Setup & Management")).toBeTruthy();
		expect(screen.getByText("Open Dashboard")).toBeTruthy();
		expect(screen.queryByText("Setup Wizard")).toBeNull();
	});

	it("shows Setup & Management with the Setup Wizard button for admins", async () => {
		mockUseAuth.mockReturnValue(signedInAuth({ isAdmin: true }));
		queryValues.push(0, 0, 0, 0, { data: [] }, { data: [] });
		await renderHomepage();

		expect(screen.getByText("Setup & Management")).toBeTruthy();
		expect(screen.getByText("Setup Wizard")).toBeTruthy();
	});
});