import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
	}: { children: React.ReactNode; to: string; params: Record<string, string> }) => (
		<a
			href={to}
			onClick={(e) => e.preventDefault()}
			data-testid="router-link"
		>
			{children}
		</a>
	),
	useParams: vi.fn(() => ({})),
}));

vi.mock("@/hooks/useTournaments", () => ({
	useTournaments: vi.fn(),
}));

import { TournamentTable } from "@/components/TournamentTable";
import type { Doc } from "../../../convex/_generated/dataModel";

import { useTournaments } from "@/hooks/useTournaments";

type Tournament = Doc<"tournaments">;

const mockTournament: Tournament = {
	_id: "t1" as unknown as Doc<"tournaments">["_id"],
	_creationTime: Date.now() - 86400000 * 30,
	name: "Spring Championship",
	description: "Annual spring tournament",
	sport: "baseball",
	location: "Springfield Complex",
	startDate: Date.now() + 86400000 * 14,
	endDate: Date.now() + 86400000 * 17,
	registrationDeadline: Date.now() + 86400000 * 7,
	maxTeams: 16,
	minTeams: 4,
	currentTeamCount: 6,
	bracketType: "single_elimination",
	fieldsAvailable: 4,
	gameDuration: 90,
	breakBetweenGames: 15,
	status: "registration_open",
	organizerId: "user_1",
	seasonId: undefined,
	seedingType: "random",
	gameFormatRules: undefined,
	createdAt: Date.now() - 86400000 * 30,
	updatedAt: Date.now() - 86400000 * 1,
};

const mockTournamentNoDates: Tournament = {
	...mockTournament,
	_id: "t2" as unknown as Doc<"tournaments">["_id"],
	name: "Draft Tournament",
	location: "",
	startDate: undefined,
	endDate: undefined,
	registrationDeadline: undefined,
	currentTeamCount: 0,
	status: "draft",
	bracketType: "round_robin",
};

const defaultHookReturn = {
	tournaments: [mockTournament],
	totalCount: 1,
	isLoading: false,
	setPagination: vi.fn(),
	setSorting: vi.fn(),
	setFiltering: vi.fn(),
	currentOptions: {
		pagination: { pageIndex: 0, pageSize: 10 },
		sorting: { field: "name", direction: "asc" },
	},
};

describe("TournamentTable", () => {
	it("renders tournament name as a link", () => {
		vi.mocked(useTournaments).mockReturnValue(defaultHookReturn);

		render(<TournamentTable />);

		expect(screen.getByText("Spring Championship")).toBeTruthy();
	});

	it("renders all column headers", () => {
		vi.mocked(useTournaments).mockReturnValue(defaultHookReturn);

		render(<TournamentTable />);

		expect(screen.getByText("Name")).toBeTruthy();
		expect(screen.getByText("Sport")).toBeTruthy();
		expect(screen.getByText("Teams")).toBeTruthy();
		expect(screen.getByText("Bracket")).toBeTruthy();
		expect(screen.getByText("Status")).toBeTruthy();
		expect(screen.getByText("Location")).toBeTruthy();
		expect(screen.getByText("Start Date")).toBeTruthy();
	});

	it("displays the sport name in lowercase", () => {
		vi.mocked(useTournaments).mockReturnValue(defaultHookReturn);

		render(<TournamentTable />);

		expect(screen.getByText("baseball")).toBeTruthy();
	});

	it("shows team count as current/max", () => {
		vi.mocked(useTournaments).mockReturnValue(defaultHookReturn);

		render(<TournamentTable />);

		expect(screen.getByText("6 / 16")).toBeTruthy();
	});

	it("displays bracket type as human-readable label", () => {
		vi.mocked(useTournaments).mockReturnValue(defaultHookReturn);

		render(<TournamentTable />);

		expect(screen.getByText("Single Elim")).toBeTruthy();
	});

	it("shows status with human-readable text", () => {
		vi.mocked(useTournaments).mockReturnValue(defaultHookReturn);

		render(<TournamentTable />);

		expect(screen.getByText("registration open")).toBeTruthy();
	});

	it("displays location", () => {
		vi.mocked(useTournaments).mockReturnValue(defaultHookReturn);

		render(<TournamentTable />);

		expect(screen.getByText("Springfield Complex")).toBeTruthy();
	});

	it("shows dash for missing location", () => {
		vi.mocked(useTournaments).mockReturnValue({
			...defaultHookReturn,
			tournaments: [mockTournamentNoDates],
		});

		render(<TournamentTable />);

		expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
	});

	it("shows dash for missing start date", () => {
		vi.mocked(useTournaments).mockReturnValue({
			...defaultHookReturn,
			tournaments: [mockTournamentNoDates],
		});

		render(<TournamentTable />);

		expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
	});

	it("renders loading state", () => {
		vi.mocked(useTournaments).mockReturnValue({
			...defaultHookReturn,
			isLoading: true,
			tournaments: [],
		});

		render(<TournamentTable />);

		expect(screen.getByText("Loading tournaments...")).toBeTruthy();
	});

	it("renders empty state when no tournaments", () => {
		vi.mocked(useTournaments).mockReturnValue({
			...defaultHookReturn,
			tournaments: [],
			totalCount: 0,
		});

		render(<TournamentTable />);

		expect(screen.getByText("No tournaments found")).toBeTruthy();
	});

	it("calls onEdit when edit button clicked as admin", () => {
		const onEdit = vi.fn();
		vi.mocked(useTournaments).mockReturnValue(defaultHookReturn);

		render(<TournamentTable isAdmin={true} onEdit={onEdit} />);

		const editButton = screen.getByRole("button", { name: "Edit" });
		fireEvent.click(editButton);

		expect(onEdit).toHaveBeenCalledWith(
			expect.objectContaining({ _id: mockTournament._id }),
		);
	});

	it("calls onDelete when delete button clicked as admin", () => {
		const onDelete = vi.fn();
		vi.mocked(useTournaments).mockReturnValue(defaultHookReturn);

		render(<TournamentTable isAdmin={true} onDelete={onDelete} />);

		const deleteButton = screen.getByRole("button", { name: "Delete" });
		fireEvent.click(deleteButton);

		expect(onDelete).toHaveBeenCalledWith(
			expect.objectContaining({ _id: mockTournament._id }),
		);
	});

	it("hides edit and delete buttons when not admin", () => {
		vi.mocked(useTournaments).mockReturnValue(defaultHookReturn);

		render(<TournamentTable isAdmin={false} />);

		expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
	});

	it("renders toolbar with search and filters", () => {
		vi.mocked(useTournaments).mockReturnValue(defaultHookReturn);

		render(<TournamentTable isAdmin={false} />);

		expect(
			screen.getByPlaceholderText("Search tournaments..."),
		).toBeTruthy();
		expect(screen.getByRole("button", { name: "All Statuses" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Draft" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Open" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Closed" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Active" })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Complete" })).toBeTruthy();
	});

	it("filters tournaments based on status filter", () => {
		const setFiltering = vi.fn();
		vi.mocked(useTournaments).mockReturnValue({
			...defaultHookReturn,
			setFiltering,
		});

		render(<TournamentTable />);

		fireEvent.click(screen.getByRole("button", { name: "Active" }));

		expect(setFiltering).toHaveBeenCalledWith({ status: ["active"] });
	});

	it("shows clear filters button", () => {
		const setFiltering = vi.fn();
		vi.mocked(useTournaments).mockReturnValue({
			...defaultHookReturn,
			setFiltering,
		});

		render(<TournamentTable />);

		fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

		expect(setFiltering).toHaveBeenCalledWith(undefined);
	});

	it("displays round_robin as Round Robin", () => {
		vi.mocked(useTournaments).mockReturnValue({
			...defaultHookReturn,
			tournaments: [mockTournamentNoDates],
		});

		render(<TournamentTable />);

		expect(screen.getByText("Round Robin")).toBeTruthy();
	});
});
