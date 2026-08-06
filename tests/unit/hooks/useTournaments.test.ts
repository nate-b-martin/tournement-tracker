import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTournaments } from "@/hooks/useTournaments";

vi.mock("convex/react", () => ({
	useQuery: vi.fn(() => undefined),
	useMutation: vi.fn(() => vi.fn()),
}));

import { useQuery } from "convex/react";

describe("useTournaments", () => {
	it("returns loading state when query is undefined", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useTournaments());

		expect(result.current.isLoading).toBe(true);
		expect(result.current.tournaments).toEqual([]);
		expect(result.current.totalCount).toBe(0);
	});

	it("returns tournament data when query resolves", () => {
		const mockData = {
			data: [
				{
					_id: "t1",
					_creationTime: Date.now(),
					name: "Spring Championship",
					sport: "baseball",
					status: "registration_open",
				},
			],
			totalCount: 1,
		};

		vi.mocked(useQuery).mockReturnValue(mockData);

		const { result } = renderHook(() => useTournaments());

		expect(result.current.isLoading).toBe(false);
		expect(result.current.tournaments).toHaveLength(1);
		expect(result.current.totalCount).toBe(1);
	});

	it("provides default pagination options when none given", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useTournaments());

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
			useTournaments({
				pagination: { pageIndex: 2, pageSize: 25 },
				sorting: { field: "status", direction: "desc" },
			}),
		);

		expect(result.current.currentOptions?.pagination).toEqual({
			pageIndex: 2,
			pageSize: 25,
		});
		expect(result.current.currentOptions?.sorting).toEqual({
			field: "status",
			direction: "desc",
		});
	});

	it("updates pagination via setPagination", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useTournaments());

		act(() => {
			result.current.setPagination({ pageIndex: 3, pageSize: 50 });
		});

		expect(result.current.currentOptions?.pagination).toEqual({
			pageIndex: 3,
			pageSize: 50,
		});
	});

	it("updates sorting via setSorting", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useTournaments());

		act(() => {
			result.current.setSorting({ field: "startDate", direction: "desc" });
		});

		expect(result.current.currentOptions?.sorting).toEqual({
			field: "startDate",
			direction: "desc",
		});
	});

	it("resets page index to 0 when filtering changes", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() =>
			useTournaments({
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
			useTournaments({
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

	it("returns empty tournament array when result is undefined", () => {
		vi.mocked(useQuery).mockReturnValue(undefined);

		const { result } = renderHook(() => useTournaments());

		expect(result.current.tournaments).toEqual([]);
	});

	it("returns count from query result when available", () => {
		const mockData = { data: [], totalCount: 5 };
		vi.mocked(useQuery).mockReturnValue(mockData);

		const { result } = renderHook(() => useTournaments());

		expect(result.current.totalCount).toBe(5);
	});
});
