import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSeasonGames } from "@/hooks/useSeasonGames";

vi.mock("convex/react", () => ({
	useQuery: vi.fn(() => undefined),
	useMutation: vi.fn(() => vi.fn()),
}));

import { useQuery } from "convex/react";

describe("useSeasonGames", () => {
	it("returns loading state when query is undefined", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useSeasonGames("season-1"));

		expect(result.current.isLoading).toBe(true);
		expect(result.current.games).toEqual([]);
	});

	it("returns games when query resolves", () => {
		const mockGames = [
			{
				_id: "game-1",
				_creationTime: Date.now(),
				seasonId: "season-1",
				homeTeamId: "team-1",
				awayTeamId: "team-2",
				homeScore: 8,
				awayScore: 3,
				scheduledDate: Date.now(),
				status: "completed",
				location: "Field A",
				createdAt: Date.now(),
				updatedAt: Date.now(),
				homeTeam: { _id: "team-1", name: "Diamond Divas" },
				awayTeam: { _id: "team-2", name: "Swing Sisters" },
			},
		];

		vi.mocked(useQuery).mockReturnValue(mockGames);

		const { result } = renderHook(() => useSeasonGames("season-1"));

		expect(result.current.isLoading).toBe(false);
		expect(result.current.games).toHaveLength(1);
		expect(result.current.games[0].homeTeam?.name).toBe("Diamond Divas");
	});

	it("returns empty array when result is undefined", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useSeasonGames("season-1"));

		expect(result.current.games).toEqual([]);
	});

	it("skips query when seasonId is undefined", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useSeasonGames(undefined));

		expect(vi.mocked(useQuery)).toHaveBeenCalledWith(
			expect.anything(),
			"skip",
		);
		expect(result.current.isLoading).toBe(true);
		expect(result.current.games).toEqual([]);
	});
});
