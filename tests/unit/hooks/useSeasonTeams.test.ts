import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSeasonTeams } from "@/hooks/useSeasonTeams";

vi.mock("convex/react", () => ({
	useQuery: vi.fn(() => undefined),
	useMutation: vi.fn(() => vi.fn()),
}));

import { useQuery } from "convex/react";

describe("useSeasonTeams", () => {
	it("returns loading state when query is undefined", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useSeasonTeams("season-1"));

		expect(result.current.isLoading).toBe(true);
		expect(result.current.teams).toEqual([]);
	});

	it("returns teams when query resolves", () => {
		const mockTeams = [
			{
				_id: "team-1",
				_creationTime: Date.now(),
				name: "Eagles",
				sport: "baseball",
				status: "active",
			},
			{
				_id: "team-2",
				_creationTime: Date.now(),
				name: "Hawks",
				sport: "baseball",
				status: "active",
			},
		];

		vi.mocked(useQuery).mockReturnValue(mockTeams);

		const { result } = renderHook(() => useSeasonTeams("season-1"));

		expect(result.current.isLoading).toBe(false);
		expect(result.current.teams).toHaveLength(2);
		expect(result.current.teams[0].name).toBe("Eagles");
	});

	it("returns empty array when result is undefined", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useSeasonTeams("season-1"));

		expect(result.current.teams).toEqual([]);
	});

	it("skips query when seasonId is undefined", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useSeasonTeams(undefined));

		expect(vi.mocked(useQuery)).toHaveBeenCalledWith(
			expect.anything(),
			"skip",
		);
		expect(result.current.isLoading).toBe(true);
		expect(result.current.teams).toEqual([]);
	});
});
