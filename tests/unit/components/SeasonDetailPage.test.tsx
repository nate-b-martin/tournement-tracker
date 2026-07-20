import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();
const mockUseSeasonById = vi.fn();
const mockUseSeasonTeams = vi.fn();
const mockUseQuery = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
	useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/useSeasons", () => ({
	useSeasonById: (...args: unknown[]) => mockUseSeasonById(...args),
}));

vi.mock("@/hooks/useSeasonTeams", () => ({
	useSeasonTeams: (...args: unknown[]) => mockUseSeasonTeams(...args),
}));

vi.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
	useMutation: vi.fn(() => vi.fn()),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: vi.fn(() => (opts: { component: React.FC }) => ({
		options: { component: opts.component },
	})),
	useParams: vi.fn(() => ({ id: "season-1" })),
	useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock("@/components/SeasonDialog", () => ({
	SeasonDialog: ({ open }: { open: boolean }) =>
		open ? <div data-testid="season-dialog" /> : null,
}));

const mockSeason = {
	_id: "season-1",
	_creationTime: Date.now(),
	name: "Spring 2025",
	sport: "Baseball",
	description: "Spring season description",
	startDate: new Date("2025-03-01").getTime(),
	endDate: new Date("2025-06-30").getTime(),
	status: "active" as const,
	organizerId: "user-1",
	teamCount: 3,
	createdAt: Date.now(),
	updatedAt: Date.now(),
};

const mockTeams = [
	{
		_id: "team-1",
		_creationTime: Date.now(),
		name: "Eagles",
		tournamentId: "tournament-1",
		coachName: "Coach A",
		coachEmail: "a@test.com",
		coachPhone: "555-0101",
		status: "active" as const,
		city: "Portland",
		createdAt: Date.now(),
		updatedAt: Date.now(),
	},
	{
		_id: "team-2",
		_creationTime: Date.now(),
		name: "Hawks",
		tournamentId: "tournament-1",
		coachName: "Coach B",
		coachEmail: "b@test.com",
		coachPhone: "555-0102",
		status: "active" as const,
		city: "Salem",
		createdAt: Date.now(),
		updatedAt: Date.now(),
	},
];

const mockTournament = {
	_id: "tournament-1",
	_creationTime: Date.now(),
	name: "Spring Championship",
	sport: "Baseball",
	status: "active" as const,
};

describe("SeasonDetailPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseAuth.mockReturnValue({
			isAdmin: true,
			isSignedIn: true,
			isLoading: false,
		});
		mockUseSeasonById.mockReturnValue(mockSeason);
		mockUseSeasonTeams.mockReturnValue({ teams: mockTeams, isLoading: false });
		mockUseQuery.mockReturnValue(mockTournament);
	});

	const renderPage = async () => {
		const { Route } = await import("@/routes/seasons/$id/index");
		const Component = Route.options.component;
		return render(<Component />);
	};

	it("renders season name in the title", async () => {
		await renderPage();
		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading.textContent).toBe("Spring 2025");
		const activeBadges = screen.getAllByText("active");
		expect(activeBadges.length).toBeGreaterThanOrEqual(1);
		const baseballElements = screen.getAllByText("Baseball");
		expect(baseballElements.length).toBeGreaterThanOrEqual(1);
	});

	it("shows loading state while fetching season data", async () => {
		mockUseSeasonById.mockReturnValue(undefined);
		await renderPage();
		const skeletons = document.querySelectorAll(".animate-pulse");
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("shows not found message when season is null", async () => {
		mockUseSeasonById.mockReturnValue(null);
		await renderPage();
		expect(screen.getByText("Season not found")).toBeTruthy();
		expect(
			screen.getByText("This season doesn't exist or has been deleted."),
		).toBeTruthy();
	});

	it("shows back button that navigates to seasons page", async () => {
		await renderPage();
		const backButton = screen.getByText("Back to Seasons");
		expect(backButton).toBeTruthy();
	});

	it("shows teams count in the teams card", async () => {
		await renderPage();
		expect(screen.getByText("3")).toBeTruthy();
		const teamsLabels = screen.getAllByText("Teams");
		expect(teamsLabels.length).toBeGreaterThanOrEqual(1);
	});

	it("shows team names in the overview tab", async () => {
		await renderPage();
		expect(screen.getByText("Eagles")).toBeTruthy();
		expect(screen.getByText("Hawks")).toBeTruthy();
	});

	it("shows empty state when season has no teams", async () => {
		mockUseSeasonTeams.mockReturnValue({ teams: [], isLoading: false });
		await renderPage();
		expect(screen.getByText("No teams added yet.")).toBeTruthy();
	});

	it("shows tournament link when tournament exists", async () => {
		await renderPage();
		expect(screen.getByText("Spring Championship")).toBeTruthy();
	});

	it("shows no tournament message when no linked tournament", async () => {
		mockUseQuery.mockReturnValue(null);
		await renderPage();
		expect(screen.getByText("No tournament configured")).toBeTruthy();
	});

	it("shows admin edit button for admin users", async () => {
		await renderPage();
		const editButton = screen.getByLabelText("Edit season");
		expect(editButton).toBeTruthy();
	});

	it("hides admin edit button for non-admin users", async () => {
		mockUseAuth.mockReturnValue({
			isAdmin: false,
			isSignedIn: true,
			isLoading: false,
		});
		await renderPage();
		expect(screen.queryByLabelText("Edit season")).toBeNull();
	});

	it("shows season date range in details card", async () => {
		await renderPage();
		const startStr = new Date(mockSeason.startDate).toLocaleDateString();
		const endStr = new Date(mockSeason.endDate).toLocaleDateString();
		const dateText = `${startStr} — ${endStr}`;
		expect(screen.getByText(dateText)).toBeTruthy();
	});

	it("shows season description in details card", async () => {
		await renderPage();
		expect(screen.getByText("Spring season description")).toBeTruthy();
	});

	it("disables schedule and standings tabs", async () => {
		await renderPage();
		const scheduleTab = screen.getByText("Schedule");
		const standingsTab = screen.getByText("Standings");
		expect(scheduleTab.closest('[disabled]')).toBeTruthy();
		expect(standingsTab.closest('[disabled]')).toBeTruthy();
	});
});
