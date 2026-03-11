import { describe, expect, it } from "vitest";
import { usePagination } from "@/hooks/usePagination";

describe("usePagination", () => {
	it("calculates basic pagination values", () => {
		const result = usePagination(100, 0, 10);

		expect(result.currentPage).toBe(0);
		expect(result.pageSize).toBe(10);
		expect(result.totalPages).toBe(10);
		expect(result.startIndex).toBe(1);
		expect(result.endIndex).toBe(10);
		expect(result.hasPreviousPage).toBe(false);
		expect(result.hasNextPage).toBe(true);
	});

	it("handles middle page values", () => {
		const result = usePagination(95, 2, 10);

		expect(result.totalPages).toBe(10);
		expect(result.startIndex).toBe(21);
		expect(result.endIndex).toBe(30);
		expect(result.hasPreviousPage).toBe(true);
		expect(result.hasNextPage).toBe(true);
	});

	it("handles last page values", () => {
		const result = usePagination(95, 9, 10);

		expect(result.startIndex).toBe(91);
		expect(result.endIndex).toBe(95);
		expect(result.hasNextPage).toBe(false);
		expect(result.hasPreviousPage).toBe(true);
	});

	it("handles empty datasets", () => {
		const result = usePagination(0, 0, 10);

		expect(result.totalPages).toBe(1);
		expect(result.startIndex).toBe(0);
		expect(result.endIndex).toBe(0);
		expect(result.hasNextPage).toBe(false);
		expect(result.hasPreviousPage).toBe(false);
		expect(result.itemCount).toBe(0);
	});

	it("ensures at least one total page for small datasets", () => {
		const result = usePagination(1, 0, 10);

		expect(result.totalPages).toBe(1);
		expect(result.startIndex).toBe(1);
		expect(result.endIndex).toBe(1);
	});
});
