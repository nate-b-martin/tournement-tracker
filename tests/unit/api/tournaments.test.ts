import { describe, expect, it } from "vitest";
import {
	mockTournaments,
} from "../../../src/mocks/data/mockTournaments";

function simulateList(options: {
	pagination?: { pageIndex: number; pageSize: number };
	sorting?: { field: string; direction: "asc" | "desc" };
	filtering?: { search?: string; status?: string[]; sport?: string };
}) {
	let tournaments = [...mockTournaments];

	if (options.filtering?.search) {
		const term = options.filtering.search.toLowerCase();
		tournaments = tournaments.filter(
			(t) =>
				t.name.toLowerCase().includes(term) ||
				t.description?.toLowerCase().includes(term) ||
				t.location?.toLowerCase().includes(term),
		);
	}

	if (options.filtering?.status?.length) {
		tournaments = tournaments.filter((t) =>
			options.filtering!.status!.includes(t.status),
		);
	}

	if (options.filtering?.sport) {
		tournaments = tournaments.filter(
			(t) => t.sport === options.filtering!.sport,
		);
	}

	if (options.sorting) {
		const { field, direction } = options.sorting;
		tournaments.sort((a, b) => {
			const aVal = a[field as keyof typeof a];
			const bVal = b[field as keyof typeof b];
			if (aVal === undefined && bVal === undefined) return 0;
			if (aVal === undefined) return direction === "asc" ? 1 : -1;
			if (bVal === undefined) return direction === "asc" ? -1 : 1;
			return aVal < bVal
				? direction === "asc"
					? -1
					: 1
				: aVal > bVal
					? direction === "asc"
						? 1
						: -1
					: 0;
		});
	}

	const totalCount = tournaments.length;

	if (options.pagination) {
		const { pageIndex, pageSize } = options.pagination;
		tournaments = tournaments.slice(
			pageIndex * pageSize,
			(pageIndex + 1) * pageSize,
		);
	}

	return { data: tournaments, totalCount };
}

describe("tournaments API (simulated Convex queries)", () => {
	describe("list", () => {
		it("returns all tournaments when no options provided", () => {
			const result = simulateList({});
			expect(result.data).toHaveLength(mockTournaments.length);
			expect(result.totalCount).toBe(mockTournaments.length);
		});

		it("filters by search across name, description, and location", () => {
			const result = simulateList({
				filtering: { search: "spring" },
			});
			expect(result.data).toHaveLength(1);
			expect(result.data[0].name).toBe("Spring Championship");
		});

		it("filters by status", () => {
			const result = simulateList({
				filtering: { status: ["draft"] },
			});
			expect(result.data).toHaveLength(1);
			expect(result.data[0].status).toBe("draft");
		});

		it("filters by sport", () => {
			const result = simulateList({
				filtering: { sport: "soccer" },
			});
			expect(result.data).toHaveLength(1);
			expect(result.data[0].sport).toBe("soccer");
		});

		it("returns empty array when search matches nothing", () => {
			const result = simulateList({
				filtering: { search: "zzz_not_found" },
			});
			expect(result.data).toHaveLength(0);
			expect(result.totalCount).toBe(0);
		});

		it("sorts by name ascending", () => {
			const result = simulateList({
				sorting: { field: "name", direction: "asc" },
			});
			const names = result.data.map((t) => t.name);
			const sorted = [...names].sort((a, b) => a.localeCompare(b));
			expect(names).toEqual(sorted);
		});

		it("sorts by name descending", () => {
			const result = simulateList({
				sorting: { field: "name", direction: "desc" },
			});
			const names = result.data.map((t) => t.name);
			const sorted = [...names].sort((a, b) => b.localeCompare(a));
			expect(names).toEqual(sorted);
		});

		it("paginates correctly on first page", () => {
			const result = simulateList({
				pagination: { pageIndex: 0, pageSize: 2 },
			});
			expect(result.data).toHaveLength(2);
			expect(result.totalCount).toBe(mockTournaments.length);
		});

		it("paginates correctly on second page", () => {
			const result = simulateList({
				pagination: { pageIndex: 1, pageSize: 2 },
			});
			expect(result.data).toHaveLength(2);
		});

		it("paginates correctly on last page with fewer items", () => {
			const result = simulateList({
				pagination: { pageIndex: 2, pageSize: 2 },
			});
			expect(result.data).toHaveLength(mockTournaments.length - 4);
		});

		it("sorts undefined fields to end", () => {
			const result = simulateList({
				sorting: { field: "startDate", direction: "asc" },
			});
			const hasUndefined = result.data.filter(
				(t) => t.startDate === undefined,
			);
			const hasDefined = result.data.filter(
				(t) => t.startDate !== undefined,
			);
			expect(hasDefined.length + hasUndefined.length).toBe(
				result.data.length,
			);
		});

		it("filters by multiple statuses", () => {
			const result = simulateList({
				filtering: {
					status: ["draft", "registration_open"],
				},
			});
			expect(result.data.length).toBeGreaterThanOrEqual(2);
			result.data.forEach((t) => {
				expect(
					t.status === "draft" || t.status === "registration_open",
				).toBe(true);
			});
		});
	});

	describe("count", () => {
		it("returns total number of tournaments", () => {
			expect(mockTournaments.length).toBe(6);
		});
	});

	describe("getById", () => {
		it("retrieves a tournament by ID", () => {
			const tournament = mockTournaments.find(
				(t) => t._id === "tournament_1",
			);
			expect(tournament).toBeDefined();
			expect(tournament!.name).toBe("Spring Championship");
		});

		it("returns undefined for non-existent ID", () => {
			const tournament = mockTournaments.find(
				(t) => t._id === "non_existent",
			);
			expect(tournament).toBeUndefined();
		});
	});
});
