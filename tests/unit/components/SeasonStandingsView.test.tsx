import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeasonStandingsView } from "@/components/SeasonStandingsView";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { SeasonGameWithTeams } from "@/hooks/useSeasonGames";

const mockTeams: Doc<"teams">[] = [
	{
		_id: "team-1",
		_creationTime: Date.now(),
		name: "Diamond Divas",
		tournamentId: "tournament-1",
		coachName: "Coach A",
		coachEmail: "a@test.com",
		coachPhone: "555-0101",
		status: "active",
		createdAt: Date.now(),
		updatedAt: Date.now(),
	},
	{
		_id: "team-2",
		_creationTime: Date.now(),
		name: "Swing Sisters",
		tournamentId: "tournament-1",
		coachName: "Coach B",
		coachEmail: "b@test.com",
		coachPhone: "555-0102",
		status: "active",
		createdAt: Date.now(),
		updatedAt: Date.now(),
	},
	{
		_id: "team-3",
		_creationTime: Date.now(),
		name: "Ball Busters",
		tournamentId: "tournament-1",
		coachName: "Coach C",
		coachEmail: "c@test.com",
		coachPhone: "555-0103",
		status: "active",
		createdAt: Date.now(),
		updatedAt: Date.now(),
	},
];

const baseGame: Partial<SeasonGameWithTeams> = {
	_creationTime: Date.now(),
	seasonId: "season-1",
	createdAt: Date.now(),
	updatedAt: Date.now(),
};

function makeGame(
	id: string,
	homeTeamId: string,
	awayTeamId: string,
	homeScore: number | undefined,
	awayScore: number | undefined,
	status: "scheduled" | "completed",
	homeName: string,
	awayName: string,
): SeasonGameWithTeams {
	return {
		...baseGame,
		_id: id,
		homeTeamId: homeTeamId as unknown as import("convex/values").Id<"teams">,
		awayTeamId: awayTeamId as unknown as import("convex/values").Id<"teams">,
		scheduledDate: Date.now(),
		homeScore,
		awayScore,
		status,
		homeTeam: { ...mockTeams.find((t) => t._id === homeTeamId)!, name: homeName },
		awayTeam: { ...mockTeams.find((t) => t._id === awayTeamId)!, name: awayName },
	} as SeasonGameWithTeams;
}

describe("SeasonStandingsView", () => {
	it("shows empty state when no completed games exist", () => {
		const games = [makeGame("g1", "team-1", "team-2", undefined, undefined, "scheduled", "Diamond Divas", "Swing Sisters")];

		render(<SeasonStandingsView games={games} teams={mockTeams} />);

		expect(
			screen.getByText("No completed games to calculate standings."),
		).toBeTruthy();
	});

	it("renders standings with correct W/L/T from completed games", () => {
		const games = [
			makeGame("g1", "team-1", "team-2", 8, 3, "completed", "Diamond Divas", "Swing Sisters"),
			makeGame("g2", "team-1", "team-3", 5, 5, "completed", "Diamond Divas", "Ball Busters"),
		];

		render(<SeasonStandingsView games={games} teams={mockTeams} />);

		expect(screen.getByText("Diamond Divas")).toBeTruthy();
		expect(screen.getByText("Swing Sisters")).toBeTruthy();
		expect(screen.getByText("Ball Busters")).toBeTruthy();

		const rows = screen.getAllByRole("row");
		expect(rows.length).toBeGreaterThan(1);
	});

	it("shows Win % as - for teams with 0 games played", () => {
		const games: SeasonGameWithTeams[] = [];

		render(<SeasonStandingsView games={games} teams={mockTeams} />);

		expect(
			screen.getByText("No completed games to calculate standings."),
		).toBeTruthy();
	});

	it("ignores scheduled games in standings", () => {
		const games = [
			makeGame("g1", "team-1", "team-2", 8, 3, "completed", "Diamond Divas", "Swing Sisters"),
			makeGame("g2", "team-1", "team-3", undefined, undefined, "scheduled", "Diamond Divas", "Ball Busters"),
		];

		render(<SeasonStandingsView games={games} teams={mockTeams} />);

		expect(screen.queryByText("No completed games")).toBeNull();
	});

	it("applies green highlight to top 2 rows", () => {
		const games = [
			makeGame("g1", "team-1", "team-2", 8, 3, "completed", "Diamond Divas", "Swing Sisters"),
			makeGame("g2", "team-1", "team-3", 5, 5, "completed", "Diamond Divas", "Ball Busters"),
		];

		const { container } = render(
			<SeasonStandingsView games={games} teams={mockTeams} />,
		);

		const rows = container.querySelectorAll("tbody tr");
		expect(rows[0].className).toContain("bg-emerald-500/5");
		expect(rows[1].className).toContain("bg-emerald-500/5");
	});

	it("displays column headers", () => {
		const games = [
			makeGame("g1", "team-1", "team-2", 8, 3, "completed", "Diamond Divas", "Swing Sisters"),
		];

		render(<SeasonStandingsView games={games} teams={mockTeams} />);

		expect(screen.getByText("GP")).toBeTruthy();
		expect(screen.getByText("W")).toBeTruthy();
		expect(screen.getByText("L")).toBeTruthy();
		expect(screen.getByText("T")).toBeTruthy();
		expect(screen.getByText("Win %")).toBeTruthy();
		expect(screen.getByText("PF")).toBeTruthy();
		expect(screen.getByText("PA")).toBeTruthy();
	});
});
