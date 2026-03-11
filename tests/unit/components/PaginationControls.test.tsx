import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaginationControls } from "@/components/PaginationControls";

describe("PaginationControls", () => {
	it("renders current page and total pages", () => {
		render(
			<PaginationControls
				currentPage={1}
				totalPages={5}
				pageSize={10}
				totalCount={50}
				hasNextPage={true}
				hasPreviousPage={true}
				onPageChange={vi.fn()}
				onPageSizeChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("Page 2 of 5")).toBeTruthy();
	});

	it("disables previous controls on the first page", () => {
		render(
			<PaginationControls
				currentPage={0}
				totalPages={3}
				pageSize={10}
				totalCount={30}
				hasNextPage={true}
				hasPreviousPage={false}
				onPageChange={vi.fn()}
				onPageSizeChange={vi.fn()}
			/>,
		);

		expect(
			(screen.getByRole("button", { name: "First" }) as HTMLButtonElement)
				.disabled,
		).toBe(true);
		expect(
			(
				screen.getByRole("button", {
					name: "Previous",
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
	});

	it("disables next controls on the last page", () => {
		render(
			<PaginationControls
				currentPage={2}
				totalPages={3}
				pageSize={10}
				totalCount={30}
				hasNextPage={false}
				hasPreviousPage={true}
				onPageChange={vi.fn()}
				onPageSizeChange={vi.fn()}
			/>,
		);

		expect(
			(screen.getByRole("button", { name: "Next" }) as HTMLButtonElement)
				.disabled,
		).toBe(true);
		expect(
			(screen.getByRole("button", { name: "Last" }) as HTMLButtonElement)
				.disabled,
		).toBe(true);
	});

	it("calls onPageChange with expected values", () => {
		const onPageChange = vi.fn();

		render(
			<PaginationControls
				currentPage={2}
				totalPages={5}
				pageSize={10}
				totalCount={50}
				hasNextPage={true}
				hasPreviousPage={true}
				onPageChange={onPageChange}
				onPageSizeChange={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "First" }));
		fireEvent.click(screen.getByRole("button", { name: "Previous" }));
		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		fireEvent.click(screen.getByRole("button", { name: "Last" }));

		expect(onPageChange).toHaveBeenNthCalledWith(1, 0);
		expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
		expect(onPageChange).toHaveBeenNthCalledWith(3, 3);
		expect(onPageChange).toHaveBeenNthCalledWith(4, 4);
	});

	it("calls onPageSizeChange when selecting a new page size", () => {
		const onPageSizeChange = vi.fn();

		render(
			<PaginationControls
				currentPage={0}
				totalPages={10}
				pageSize={10}
				totalCount={100}
				hasNextPage={true}
				hasPreviousPage={false}
				onPageChange={vi.fn()}
				onPageSizeChange={onPageSizeChange}
			/>,
		);

		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "25" },
		});

		expect(onPageSizeChange).toHaveBeenCalledWith(25);
	});
});
