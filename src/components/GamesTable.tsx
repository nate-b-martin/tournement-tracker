import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	type GameListOptions,
	type GameWithTeams,
	useGames,
} from "@/hooks/useGames";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ConfirmDelete } from "./ConfirmDelete";
import { DataTable } from "./DataTable/DataTable";
import type { ColumnDef } from "./DataTable/types";
import { GameDialog } from "./GameDialog";
import { GameStatsSheet } from "./GameStatsSheet";

interface GamesTableProps {
	initialOptions?: GameListOptions;
	isAdmin?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
	scheduled: "border border-blue-500/30 bg-blue-500/15 text-blue-300",
	in_progress: "border border-amber-500/30 bg-amber-500/15 text-amber-300",
	completed: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
	postponed: "border border-purple-500/30 bg-purple-500/15 text-purple-300",
	cancelled: "border border-red-500/30 bg-red-500/15 text-red-300",
};

const STATUS_FILTERS = [
	{ value: "all", label: "All Statuses" },
	{ value: "scheduled", label: "Scheduled" },
	{ value: "in_progress", label: "In Progress" },
	{ value: "completed", label: "Completed" },
	{ value: "postponed", label: "Postponed" },
	{ value: "cancelled", label: "Cancelled" },
];

function TeamNameCell({
	name,
	isWinner,
}: {
	name: string | undefined | null;
	isWinner?: boolean;
}) {
	return (
		<span
			className={cn(
				"font-medium",
				isWinner && "text-emerald-400",
				!name && "text-muted-foreground italic",
			)}
		>
			{name || "Deleted Team"}
			{isWinner && " ★"}
		</span>
	);
}

function ScoreCell({
	score,
	isWinner,
}: {
	score: number | undefined | null;
	isWinner?: boolean;
}) {
	return (
		<span
			className={cn("tabular-nums", isWinner && "font-bold text-emerald-400")}
		>
			{score !== null && score !== undefined ? score : "-"}
		</span>
	);
}

const gameColumns: ColumnDef<GameWithTeams>[] = [
	{
		header: "Round",
		field: "round",
		sortable: true,
		cell: (game) => <span>{game.round}</span>,
	},
	{
		header: "Game #",
		field: "gameNumber",
		sortable: true,
		cell: (game) => <span>{game.gameNumber}</span>,
	},
	{
		header: "Team 1",
		field: "team1Id",
		sortable: false,
		cell: (game) => (
			<TeamNameCell
				name={game.team1?.name}
				isWinner={game.status === "completed" && game.winnerId === game.team1Id}
			/>
		),
	},
	{
		header: "Team 2",
		field: "team2Id",
		sortable: false,
		cell: (game) => (
			<TeamNameCell
				name={game.team2?.name}
				isWinner={game.status === "completed" && game.winnerId === game.team2Id}
			/>
		),
	},
	{
		header: "Score",
		field: "team1Score",
		sortable: true,
		cell: (game) => (
			<span className="flex items-center gap-1 tabular-nums">
				<ScoreCell
					score={game.team1Score}
					isWinner={
						game.status === "completed" && game.winnerId === game.team1Id
					}
				/>
				<span className="text-muted-foreground">-</span>
				<ScoreCell
					score={game.team2Score}
					isWinner={
						game.status === "completed" && game.winnerId === game.team2Id
					}
				/>
			</span>
		),
	},
	{
		header: "Field",
		field: "fieldId",
		sortable: false,
		cell: (game) => (
			<span className="text-muted-foreground">{game.fieldId || "-"}</span>
		),
	},
	{
		header: "Status",
		field: "status",
		sortable: true,
		cell: (game) => (
			<span
				className={cn(
					"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
					STATUS_STYLES[game.status] || STATUS_STYLES.scheduled,
				)}
			>
				{game.status.replace(/_/g, " ")}
			</span>
		),
	},
	{
		header: "Scheduled",
		field: "scheduledTime",
		sortable: true,
		cell: (game) => (
			<span className="tabular-nums text-muted-foreground">
				{game.scheduledTime
					? new Date(game.scheduledTime).toLocaleString()
					: "-"}
			</span>
		),
	},
];

export function GamesTable({ initialOptions, isAdmin }: GamesTableProps) {
	const {
		games,
		totalCount,
		isLoading,
		setPagination,
		setSorting,
		setFiltering,
		currentOptions,
	} = useGames(initialOptions);
	const deleteGame = useMutation(api.games.remove);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingGame, setEditingGame] = useState<GameWithTeams | undefined>();
	const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deletingGame, setDeletingGame] = useState<GameWithTeams | undefined>();
	const [isDeleting, setIsDeleting] = useState(false);
	const [statsGame, setStatsGame] = useState<GameWithTeams | undefined>();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>(
		initialOptions?.filtering?.status?.[0] || "all",
	);

	const filterGamesBySearch = (gameList: GameWithTeams[], query: string) => {
		const trimmedQuery = query.trim().toLowerCase();
		if (!trimmedQuery) return gameList;

		return gameList.filter(
			(game) =>
				game.team1?.name?.toLowerCase().includes(trimmedQuery) ||
				game.team2?.name?.toLowerCase().includes(trimmedQuery) ||
				game.round.toString().includes(trimmedQuery) ||
				game.gameNumber.toString().includes(trimmedQuery) ||
				game.status.toLowerCase().includes(trimmedQuery),
		);
	};

	const buildFiltering = (status: string): GameListOptions["filtering"] => {
		const nextFiltering: NonNullable<GameListOptions["filtering"]> = {};

		if (status !== "all") {
			nextFiltering.status = [status];
		}

		if (currentOptions?.filtering?.tournamentId) {
			nextFiltering.tournamentId = currentOptions.filtering.tournamentId;
		}

		if (currentOptions?.filtering?.round !== undefined) {
			nextFiltering.round = currentOptions.filtering.round;
		}

		return Object.keys(nextFiltering).length > 0 ? nextFiltering : undefined;
	};

	const applyStatusFilter = (status: string) => {
		setFiltering(buildFiltering(status));
		setPagination({
			pageIndex: 0,
			pageSize: currentOptions?.pagination?.pageSize || 10,
		});
	};

	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("all");
		setFiltering(undefined);
		setPagination({
			pageIndex: 0,
			pageSize: currentOptions?.pagination?.pageSize || 10,
		});
	};

	const statsColumn: ColumnDef<GameWithTeams> = {
		header: "",
		field: "stats",
		sortable: false,
		cell: (game) => (
			<Button
				type="button"
				size="sm"
				variant="outline"
				onClick={() => setStatsGame(game)}
			>
				Stats
			</Button>
		),
	};

	const displayColumns = isAdmin ? [...gameColumns, statsColumn] : gameColumns;

	const filteredGames = filterGamesBySearch(games, searchQuery);

	const handleSort = (field: string) => {
		const currentSort = currentOptions?.sorting;
		const newDirection =
			currentSort?.field === field && currentSort?.direction === "asc"
				? "desc"
				: "asc";
		setSorting({ field, direction: newDirection });
	};

	const handlePaginationChange = (pagination: {
		pageIndex: number;
		pageSize: number;
	}) => {
		setPagination(pagination);
	};

	const handleEdit = (game: GameWithTeams) => {
		setEditingGame(game);
		setDialogMode("edit");
		setDialogOpen(true);
	};

	const handleDelete = (game: GameWithTeams) => {
		setDeletingGame(game);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = async () => {
		if (!deletingGame) return;
		setIsDeleting(true);
		try {
			await deleteGame({ id: deletingGame._id as Id<"games"> });
			toast.success("Game deleted");
			setDeleteConfirmOpen(false);
			setDeletingGame(undefined);
		} catch {
			toast.error("Failed to delete game");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleAddGame = () => {
		setEditingGame(undefined);
		setDialogMode("create");
		setDialogOpen(true);
	};

	const toolbarFilters = STATUS_FILTERS.map((f) => ({
		label: f.label,
		active: statusFilter === f.value,
		onClick: () => {
			setStatusFilter(f.value);
			applyStatusFilter(f.value);
		},
	}));

	return (
		<>
			<DataTable
				data={filteredGames}
				columns={displayColumns}
				isLoading={isLoading}
				totalCount={totalCount}
				pagination={
					currentOptions?.pagination || { pageIndex: 0, pageSize: 10 }
				}
				onPaginationChange={handlePaginationChange}
				sorting={currentOptions?.sorting}
				onSort={handleSort}
				emptyMessage="No games found"
				itemName="games"
				toolbar={{
					search: {
						value: searchQuery,
						placeholder: "Search teams, round, game #...",
						onChange: (value) => {
							setSearchQuery(value);
						},
					},
					filters: toolbarFilters,
					actions: [
						...(isAdmin
							? [
									{
										label: "Add Game",
										variant: "default" as const,
										onClick: handleAddGame,
									},
								]
							: []),
						{
							label: "Clear filters",
							variant: "ghost" as const,
							onClick: clearFilters,
						},
					],
				}}
				actions={{
					canEdit: isAdmin ?? false,
					canDelete: isAdmin ?? false,
					onEdit: handleEdit,
					onDelete: handleDelete,
				}}
			/>
			<GameDialog
				mode={dialogMode}
				game={editingGame}
				tournamentId={currentOptions?.filtering?.tournamentId}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSuccess={() => {
					setEditingGame(undefined);
				}}
			/>
			<ConfirmDelete
				open={deleteConfirmOpen}
				onOpenChange={(val) => {
					setDeleteConfirmOpen(val);
					if (!val) setDeletingGame(undefined);
				}}
				itemName={
					deletingGame
						? `Game ${deletingGame.gameNumber} (Round ${deletingGame.round})`
						: "this game"
				}
				onConfirm={confirmDelete}
				isLoading={isDeleting}
			/>
			{statsGame && (
				<GameStatsSheet
					game={statsGame}
					open={!!statsGame}
					onOpenChange={(val) => {
						if (!val) setStatsGame(undefined);
					}}
					isAdmin={isAdmin}
				/>
			)}
		</>
	);
}
