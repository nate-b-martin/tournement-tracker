import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSeasons } from "@/hooks/useSeasons";

vi.mock("convex/react", () => ({
	useQuery: vi.fn(() => undefined),
	useMutation: vi.fn(() => vi.fn()),
}));

import { useQuery } from "convex/react";

describe("useSeasons", () => {
	it("returns loading state when query is undefined", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useSeasons());

		expect(result.current.isLoading).toBe(true);
		expect(result.current.seasons).toEqual([]);
		expect(result.current.totalCount).toBe(0);
	});

	it("returns season data when query resolves", () => {
		const mockData = {
			data: [
				{
					_id: "s1",
					_creationTime: Date.now(),
					name: "Spring 2025",
					sport: "baseball",
					status: "active",
				},
			],
			totalCount: 1,
		};

		vi.mocked(useQuery).mockReturnValue(mockData);

		const { result } = renderHook(() => useSeasons());

		expect(result.current.isLoading).toBe(false);
		expect(result.current.seasons).toHaveLength(1);
		expect(result.current.totalCount).toBe(1);
	});

	it("provides default pagination options when none given", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useSeasons());

		expect(result.current.currentOptions?.pagination).toEqual({
			pageIndex: 0,
			pageSize: 10,
		});
		expect(result.current.currentOptions?.sorting).toEqual({
			field: "name",
			direction: "asc",
		});
	});

	it("uses provided initial options", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() =>
			useSeasons({
				pagination: { pageIndex: 1, pageSize: 20 },
				sorting: { field: "startDate", direction: "desc" },
			}),
		);

		expect(result.current.currentOptions?.pagination).toEqual({
			pageIndex: 1,
			pageSize: 20,
		});
		expect(result.current.currentOptions?.sorting).toEqual({
			field: "startDate",
			direction: "desc",
		});
	});

	it("updates pagination via setPagination", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useSeasons());

		act(() => {
			result.current.setPagination({ pageIndex: 2, pageSize: 50 });
		});

		expect(result.current.currentOptions?.pagination).toEqual({
			pageIndex: 2,
			pageSize: 50,
		});
	});

	it("updates sorting via setSorting", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useSeasons());

		act(() => {
			result.current.setSorting({ field: "endDate", direction: "asc" });
		});

		expect(result.current.currentOptions?.sorting).toEqual({
			field: "endDate",
			direction: "asc",
		});
	});

	it("resets page index to 0 when filtering changes", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() =>
			useSeasons({
				pagination: { pageIndex: 3, pageSize: 10 },
				sorting: { field: "name", direction: "asc" },
			}),
		);

		act(() => {
			result.current.setFiltering({ search: "spring" });
		});

		expect(result.current.currentOptions?.pagination?.pageIndex).toBe(0);
	});

	it("sets filtering to undefined when called without args", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() =>
			useSeasons({
				filtering: { search: "spring" },
				pagination: { pageIndex: 0, pageSize: 10 },
				sorting: { field: "name", direction: "asc" },
			}),
		);

		act(() => {
			result.current.setFiltering(undefined);
		});

		expect(result.current.currentOptions?.filtering).toBeUndefined();
	});

	it("returns empty season array when result is undefined", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useSeasons());

		expect(result.current.seasons).toEqual([]);
	});

	it("returns count from query result when available", () => {
		const mockData = { data: [], totalCount: 5 };
		vi.mocked(useQuery).mockReturnValue(mockData);

		const { result } = renderHook(() => useSeasons());

		expect(result.current.totalCount).toBe(5);
	});
});
