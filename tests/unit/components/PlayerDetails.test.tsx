import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerDetails } from "@/components/PlayerDetails";
import type { Id } from "../../../convex/_generated/dataModel";

const mockUseAuth = vi.fn();
const mockUsePlayerById = vi.fn();
const mockUseGameStatsByPlayer = vi.fn();
const mockUseQuery = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
	useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/usePlayerById", () => ({
	usePlayerById: (...args: unknown[]) => mockUsePlayerById(...args),
}));

vi.mock("@/hooks/useGameStats", () => ({
	useGameStatsByPlayer: (...args: unknown[]) =>
		mockUseGameStatsByPlayer(...args),
}));

vi.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
	useMutation: vi.fn(() => vi.fn()),
}));

vi.mock("@/components/PlayerGameStatsDialog", () => ({
	PlayerGameStatsDialog: vi.fn(() => (
		<div data-testid="player-game-stats-dialog">Game Stats Dialog</div>
	)),
}));

vi.mock("@/components/PlayerDialog", () => ({
	PlayerDialog: vi.fn(({ open }: { open: boolean }) =>
		open ? <div data-testid="player-edit-dialog" /> : null,
	),
}));

const mockPlayer = {
	_id: "player_001" as Id<"players">,
	firstName: "Emma",
	lastName: "Wilson",
	teamId: "team_001" as Id<"teams">,
	team: {
		_id: "team_001" as Id<"teams">,
		name: "Broncos",
		city: "Portland",
	},
	jerseyNumber: 23,
	position: "Pitcher",
	email: "emma@example.com",
	phone: "(555) 123-4567",
	status: "active" as const,
	isCaptain: true,
	organization: "Example Corp",
	createdAt: Date.now(),
	updatedAt: Date.now(),
};

const mockPlayerNoTeam = {
	_id: "player_002" as Id<"players">,
	firstName: "John",
	lastName: "Doe",
	teamId: undefined,
	team: null,
	jerseyNumber: 10,
	position: "Fielder",
	email: "john@example.com",
	phone: "(555) 987-6543",
	status: "inactive" as const,
	isCaptain: false,
	organization: "Example Corp",
	createdAt: Date.now(),
	updatedAt: Date.now(),
};

describe("PlayerDetails component", () => {
	beforeEach(() => {
		mockUseAuth.mockReturnValue({
			isAdmin: true,
			isLoaded: true,
			isSignedIn: true,
			isLoading: false,
			profile: null,
			user: null,
			isOrganizer: false,
			isPlayer: false,
			isSpectator: false,
		});
	});

	it("renders loading skeleton when player is undefined", () => {
		mockUsePlayerById.mockReturnValue(undefined);
		mockUseGameStatsByPlayer.mockReturnValue(undefined);
		mockUseQuery.mockReturnValue([]);

		const { container } = render(
			<PlayerDetails
				playerId={"player_001" as Id<"players">}
				onBack={() => {}}
			/>,
		);

		expect(container.querySelector(".space-y-4")).toBeTruthy();
	});

	it("renders player not found message when player is null", () => {
		mockUsePlayerById.mockReturnValue(null);
		mockUseGameStatsByPlayer.mockReturnValue(undefined);
		mockUseQuery.mockReturnValue([]);

		render(
			<PlayerDetails
				playerId={"player_001" as Id<"players">}
				onBack={() => {}}
			/>,
		);

		expect(screen.getByText(/player not found/i)).toBeTruthy();
		expect(screen.getByText(/back to players/i)).toBeTruthy();
	});

	it("renders player details", () => {
		mockUsePlayerById.mockReturnValue(mockPlayer);
		mockUseGameStatsByPlayer.mockReturnValue([]);
		mockUseQuery.mockReturnValue([]);

		render(
			<PlayerDetails
				playerId={"player_001" as Id<"players">}
				onBack={() => {}}
			/>,
		);

		expect(screen.getByText(/emma wilson/i)).toBeTruthy();
		expect(screen.getAllByText(/broncos/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/emma@example.com/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/pitcher/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/active/i).length).toBeGreaterThanOrEqual(1);
	});

	it("renders game stats tab and stats card", () => {
		mockUsePlayerById.mockReturnValue(mockPlayer);
		mockUseGameStatsByPlayer.mockReturnValue([
			{
				_id: "stat_001",
				playerId: "player_001",
				gameId: "game_001",
				points: 15,
				assists: 3,
				rebounds: 7,
				game: {
					_id: "game_001",
					date: Date.now(),
					homeTeam: "Team A",
					awayTeam: "Team B",
				},
			},
		]);
		mockUseQuery.mockReturnValue([]);

		render(
			<PlayerDetails
				playerId={"player_001" as Id<"players">}
				onBack={() => {}}
			/>,
		);

		expect(screen.getByText("Game Stats")).toBeTruthy();
		expect(screen.getByText("Stats")).toBeTruthy();
	});

	it("hides edit button for non-admin users", () => {
		mockUseAuth.mockReturnValue({
			isAdmin: false,
			isLoaded: true,
			isSignedIn: true,
			isLoading: false,
			profile: null,
			user: null,
			isOrganizer: false,
			isPlayer: false,
			isSpectator: true,
		});
		mockUsePlayerById.mockReturnValue(mockPlayer);
		mockUseGameStatsByPlayer.mockReturnValue([]);
		mockUseQuery.mockReturnValue([]);

		render(
			<PlayerDetails
				playerId={"player_001" as Id<"players">}
				onBack={() => {}}
			/>,
		);

		expect(screen.queryByLabelText("Edit player")).toBeFalsy();
	});

	it("shows edit button for admin users", () => {
		mockUsePlayerById.mockReturnValue(mockPlayer);
		mockUseGameStatsByPlayer.mockReturnValue([]);
		mockUseQuery.mockReturnValue([]);

		render(
			<PlayerDetails
				playerId={"player_001" as Id<"players">}
				onBack={() => {}}
			/>,
		);

		expect(screen.getByLabelText("Edit player")).toBeTruthy();
	});

	it("renders player with no team", () => {
		mockUsePlayerById.mockReturnValue(mockPlayerNoTeam);
		mockUseGameStatsByPlayer.mockReturnValue([]);
		mockUseQuery.mockReturnValue([]);

		render(
			<PlayerDetails
				playerId={"player_002" as Id<"players">}
				onBack={() => {}}
			/>,
		);

		expect(screen.getByText(/no team assigned/i)).toBeTruthy();
	});

	it("shows no game stats message when stats are empty", () => {
		mockUsePlayerById.mockReturnValue(mockPlayer);
		mockUseGameStatsByPlayer.mockReturnValue([]);
		mockUseQuery.mockReturnValue([]);

		render(
			<PlayerDetails
				playerId={"player_001" as Id<"players">}
				onBack={() => {}}
			/>,
		);

		expect(screen.getByText(/no game stats recorded/i)).toBeTruthy();
	});
});
