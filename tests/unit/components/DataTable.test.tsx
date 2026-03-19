import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "@/components/DataTable/DataTable";
import type { ColumnDef } from "@/components/DataTable/types";

interface TestItem {
	_id: string;
	name: string;
	status: "active" | "inactive";
}

const columns: ColumnDef<TestItem>[] = [
	{
		header: "Name",
		field: "name",
		sortable: true,
		cell: (item) => item.name,
	},
	{
		header: "Status",
		field: "status",
		sortable: false,
		cell: (item) => item.status,
	},
];

const baseData: TestItem[] = [
	{ _id: "1", name: "Alpha", status: "active" },
	{ _id: "2", name: "Beta", status: "inactive" },
];

describe("DataTable", () => {
	it("calls onSort when clicking a sortable header", () => {
		const onSort = vi.fn();

		render(
			<DataTable
				data={baseData}
				columns={columns}
				isLoading={false}
				totalCount={2}
				pagination={{ pageIndex: 0, pageSize: 10 }}
				onPaginationChange={vi.fn()}
				sorting={{ field: "name", direction: "asc" }}
				onSort={onSort}
				itemName="players"
			/>,
		);

		fireEvent.click(screen.getByText("Name"));
		expect(onSort).toHaveBeenCalledWith("name");
	});

	it("renders empty message when no rows are available", () => {
		render(
			<DataTable
				data={[]}
				columns={columns}
				isLoading={false}
				totalCount={0}
				pagination={{ pageIndex: 0, pageSize: 10 }}
				onPaginationChange={vi.fn()}
				emptyMessage="No players found"
				itemName="players"
			/>,
		);

		expect(screen.getByText("No players found")).toBeTruthy();
	});

	it("renders loading state before the table", () => {
		render(
			<DataTable
				data={baseData}
				columns={columns}
				isLoading={true}
				totalCount={2}
				pagination={{ pageIndex: 0, pageSize: 10 }}
				onPaginationChange={vi.fn()}
				itemName="players"
			/>,
		);

		expect(screen.getByText("Loading players...")).toBeTruthy();
	});

	it("wires toolbar search and chips callbacks", () => {
		const onSearchChange = vi.fn();
		const onFilterClick = vi.fn();

		render(
			<DataTable
				data={baseData}
				columns={columns}
				isLoading={false}
				totalCount={2}
				pagination={{ pageIndex: 0, pageSize: 10 }}
				onPaginationChange={vi.fn()}
				itemName="players"
				toolbar={{
					search: {
						value: "",
						onChange: onSearchChange,
						placeholder: "Search players...",
					},
					filters: [
						{ label: "Active", active: true, onClick: onFilterClick },
					],
				}}
			/>,
		);

		fireEvent.change(screen.getByPlaceholderText("Search players..."), {
			target: { value: "Alpha" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Active" }));

		expect(onSearchChange).toHaveBeenCalledWith("Alpha");
		expect(onFilterClick).toHaveBeenCalledOnce();
	});

	it("renders actions column and routes row handlers", () => {
		const onEdit = vi.fn();
		const onDelete = vi.fn();

		render(
			<DataTable
				data={baseData}
				columns={columns}
				isLoading={false}
				totalCount={2}
				pagination={{ pageIndex: 0, pageSize: 10 }}
				onPaginationChange={vi.fn()}
				itemName="players"
				actions={{
					canEdit: true,
					canDelete: true,
					onEdit,
					onDelete,
				}}
			/>,
		);

		const editButtons = screen.getAllByRole("button", { name: "Edit" });
		const deleteButtons = screen.getAllByRole("button", { name: "Delete" });

		fireEvent.click(editButtons[0]);
		fireEvent.click(deleteButtons[0]);

		expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ _id: "1" }));
		expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ _id: "1" }));
	});

	describe("Filter chips rendering", () => {
		it("renders filter chips with correct labels", () => {
			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						filters: [
							{ label: "Active", active: false, onClick: vi.fn() },
							{ label: "Inactive", active: true, onClick: vi.fn() },
						],
					}}
				/>,
			);

			expect(screen.getByRole("button", { name: "Active" })).toBeTruthy();
			expect(screen.getByRole("button", { name: "Inactive" })).toBeTruthy();
		});

		it("renders active filter chip with primary styling", () => {
			const { container } = render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						filters: [
							{ label: "Active", active: true, onClick: vi.fn() },
						],
					}}
				/>,
			);

			const activeChip = screen.getByRole("button", { name: "Active" });
			expect(activeChip.className).toContain("border-primary");
		});

		it("renders inactive filter chip with default styling", () => {
			const { container } = render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						filters: [
							{ label: "Inactive", active: false, onClick: vi.fn() },
						],
					}}
				/>,
			);

			const inactiveChip = screen.getByRole("button", { name: "Inactive" });
			expect(inactiveChip.className).toContain("border-card-outline");
		});

		it("renders multiple filters independently", () => {
			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						filters: [
							{ label: "Filter 1", active: true, onClick: vi.fn() },
							{ label: "Filter 2", active: false, onClick: vi.fn() },
							{ label: "Filter 3", active: true, onClick: vi.fn() },
						],
					}}
				/>,
			);

			expect(screen.getByRole("button", { name: "Filter 1" })).toBeTruthy();
			expect(screen.getByRole("button", { name: "Filter 2" })).toBeTruthy();
			expect(screen.getByRole("button", { name: "Filter 3" })).toBeTruthy();
		});
	});

	describe("Filter chip interactions", () => {
		it("calls onClick callback when filter chip is clicked", () => {
			const onFilterClick = vi.fn();

			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						filters: [
							{ label: "Active", active: false, onClick: onFilterClick },
						],
					}}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Active" }));
			expect(onFilterClick).toHaveBeenCalledOnce();
		});

		it("calls individual onClick handlers for each filter independently", () => {
			const onFilter1Click = vi.fn();
			const onFilter2Click = vi.fn();
			const onFilter3Click = vi.fn();

			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						filters: [
							{ label: "Filter 1", active: false, onClick: onFilter1Click },
							{ label: "Filter 2", active: false, onClick: onFilter2Click },
							{ label: "Filter 3", active: false, onClick: onFilter3Click },
						],
					}}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Filter 2" }));
			expect(onFilter1Click).not.toHaveBeenCalled();
			expect(onFilter2Click).toHaveBeenCalledOnce();
			expect(onFilter3Click).not.toHaveBeenCalled();
		});
	});

	describe("Search input rendering", () => {
		it("renders search input with correct placeholder", () => {
			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						search: {
							value: "",
							placeholder: "Search players...",
							onChange: vi.fn(),
						},
					}}
				/>,
			);

			expect(screen.getByPlaceholderText("Search players...")).toBeTruthy();
		});

		it("renders search input with initial value", () => {
			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						search: {
							value: "test query",
							placeholder: "Search...",
							onChange: vi.fn(),
						},
					}}
				/>,
			);

			const searchInput = screen.getByPlaceholderText(
				"Search...",
			) as HTMLInputElement;
			expect(searchInput.value).toBe("test query");
		});

		it("renders search input as type text", () => {
			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						search: {
							value: "",
							placeholder: "Search...",
							onChange: vi.fn(),
						},
					}}
				/>,
			);

			const searchInput = screen.getByPlaceholderText(
				"Search...",
			) as HTMLInputElement;
			expect(searchInput.type).toBe("text");
		});

		it("renders search icon before input", () => {
			const { container } = render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						search: {
							value: "",
							placeholder: "Search...",
							onChange: vi.fn(),
						},
					}}
				/>,
			);

			// Search icon should be rendered as SVG (lucide-react)
			const svgElements = container.querySelectorAll("svg");
			expect(svgElements.length).toBeGreaterThan(0);
		});
	});

	describe("Search input interactions", () => {
		it("calls onChange callback when search input value changes", () => {
			const onSearchChange = vi.fn();

			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						search: {
							value: "",
							placeholder: "Search...",
							onChange: onSearchChange,
						},
					}}
				/>,
			);

			fireEvent.change(screen.getByPlaceholderText("Search..."), {
				target: { value: "Alpha" },
			});

			expect(onSearchChange).toHaveBeenCalledWith("Alpha");
		});

		it("handles empty string search input", () => {
			const onSearchChange = vi.fn();

			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						search: {
							value: "test",
							placeholder: "Search...",
							onChange: onSearchChange,
						},
					}}
				/>,
			);

			fireEvent.change(screen.getByPlaceholderText("Search..."), {
				target: { value: "" },
			});

			expect(onSearchChange).toHaveBeenCalledWith("");
		});

		it("handles search input with special characters", () => {
			const onSearchChange = vi.fn();

			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						search: {
							value: "",
							placeholder: "Search...",
							onChange: onSearchChange,
						},
					}}
				/>,
			);

			fireEvent.change(screen.getByPlaceholderText("Search..."), {
				target: { value: "test@#$%^&*()" },
			});

			expect(onSearchChange).toHaveBeenCalledWith("test@#$%^&*()");
		});

		it("handles search input with spaces", () => {
			const onSearchChange = vi.fn();

			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						search: {
							value: "",
							placeholder: "Search...",
							onChange: onSearchChange,
						},
					}}
				/>,
			);

			fireEvent.change(screen.getByPlaceholderText("Search..."), {
				target: { value: "  multiple   spaces  " },
			});

			expect(onSearchChange).toHaveBeenCalledWith("  multiple   spaces  ");
		});
	});

	describe("Toolbar responsive layout", () => {
		it("renders toolbar with flex layout container", () => {
			const { container } = render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						search: {
							value: "",
							placeholder: "Search...",
							onChange: vi.fn(),
						},
						filters: [{ label: "Filter", active: false, onClick: vi.fn() }],
					}}
				/>,
			);

			// Toolbar should exist with flex layout classes
			const toolbar = container.querySelector("[class*='flex']");
			expect(toolbar).toBeTruthy();
		});

		it("renders search and filters together on left section", () => {
			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						search: {
							value: "",
							placeholder: "Search players...",
							onChange: vi.fn(),
						},
						filters: [{ label: "Active", active: false, onClick: vi.fn() }],
					}}
				/>,
			);

			expect(screen.getByPlaceholderText("Search players...")).toBeTruthy();
			expect(screen.getByRole("button", { name: "Active" })).toBeTruthy();
		});

		it("renders action buttons on right section separately", () => {
			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						search: {
							value: "",
							placeholder: "Search...",
							onChange: vi.fn(),
						},
						actions: [
							{
								label: "Clear filters",
								variant: "ghost",
								onClick: vi.fn(),
							},
						],
					}}
				/>,
			);

			expect(screen.getByRole("button", { name: "Clear filters" })).toBeTruthy();
		});

		it("renders all toolbar sections together without search", () => {
			render(
				<DataTable
					data={baseData}
					columns={columns}
					isLoading={false}
					totalCount={2}
					pagination={{ pageIndex: 0, pageSize: 10 }}
					onPaginationChange={vi.fn()}
					itemName="players"
					toolbar={{
						filters: [
							{ label: "Filter 1", active: false, onClick: vi.fn() },
							{ label: "Filter 2", active: true, onClick: vi.fn() },
						],
						actions: [
							{
								label: "Reset",
								variant: "outline",
								onClick: vi.fn(),
							},
						],
					}}
				/>,
			);

			expect(screen.getByRole("button", { name: "Filter 1" })).toBeTruthy();
			expect(screen.getByRole("button", { name: "Filter 2" })).toBeTruthy();
			expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
		});
	});
});
