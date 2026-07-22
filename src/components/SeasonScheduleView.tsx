import { useMutation } from "convex/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	type SeasonGameWithTeams,
	useSeasonGames,
} from "@/hooks/useSeasonGames";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { ConfirmDelete } from "./ConfirmDelete";
import { DataTable } from "./DataTable/DataTable";
import type { ColumnDef } from "./DataTable/types";
import { GenerateScheduleDialog } from "./GenerateScheduleDialog";
import { SeasonGameDialog } from "./SeasonGameDialog";

type Team = Doc<"teams">;

interface SeasonScheduleViewProps {
	seasonId: Id<"seasons">;
	teams: Team[];
	isAdmin: boolean;
	seasonStartDate: number;
	scheduleConfig?: {
		regularSeasonWeeks: number;
		gamesPerWeek: number;
		gameDays: number[];
		scheduleType: "single_round_robin" | "double_round_robin";
		regularSeasonComplete?: boolean;
	};
}

const STATUS_STYLES: Record<string, string> = {
	scheduled: "border border-blue-500/30 bg-blue-500/15 text-blue-300",
	completed: "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
};

const STATUS_FILTERS = [
	{ value: "all", label: "All" },
	{ value: "scheduled", label: "Scheduled" },
	{ value: "completed", label: "Completed" },
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
				"inline-block max-w-[150px] truncate font-medium",
				isWinner && "text-emerald-400",
				!name && "text-muted-foreground italic",
			)}
		>
			{name || "Deleted Team"}
		</span>
	);
}

function ScoreCell({
	homeScore,
	awayScore,
	status,
	homeIsWinner,
	awayIsWinner,
}: {
	homeScore?: number | null;
	awayScore?: number | null;
	status: string;
	homeIsWinner?: boolean;
	awayIsWinner?: boolean;
}) {
	if (status !== "completed") {
		return <span className="text-muted-foreground">-</span>;
	}
	return (
		<span className="flex items-center gap-1 tabular-nums">
			<span className={cn(homeIsWinner && "font-bold text-emerald-400")}>
				{homeScore ?? 0}
			</span>
			<span className="text-muted-foreground">-</span>
			<span className={cn(awayIsWinner && "font-bold text-emerald-400")}>
				{awayScore ?? 0}
			</span>
		</span>
	);
}

export function SeasonScheduleView({
	seasonId,
	teams,
	isAdmin,
	seasonStartDate,
	scheduleConfig,
}: SeasonScheduleViewProps) {
	const { games, isLoading } = useSeasonGames(seasonId);
	const deleteGame = useMutation(api.seasonGames.remove);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingGame, setEditingGame] = useState<
		SeasonGameWithTeams | undefined
	>();
	const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deletingGame, setDeletingGame] = useState<
		SeasonGameWithTeams | undefined
	>();
	const [isDeleting, setIsDeleting] = useState(false);

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	});

	const filteredGames = useMemo(() => {
		let result = games;

		if (statusFilter !== "all") {
			result = result.filter((g) => g.status === statusFilter);
		}

		const trimmedQuery = searchQuery.trim().toLowerCase();
		if (trimmedQuery) {
			result = result.filter(
				(game) =>
					game.homeTeam?.name?.toLowerCase().includes(trimmedQuery) ||
					game.awayTeam?.name?.toLowerCase().includes(trimmedQuery) ||
					game.location?.toLowerCase().includes(trimmedQuery),
			);
		}

		return result;
	}, [games, statusFilter, searchQuery]);

	const paginatedGames = useMemo(() => {
		const start = pagination.pageIndex * pagination.pageSize;
		return filteredGames.slice(start, start + pagination.pageSize);
	}, [filteredGames, pagination]);

	const handleDelete = (game: SeasonGameWithTeams) => {
		setDeletingGame(game);
		setDeleteConfirmOpen(true);
	};

	const confirmDelete = async () => {
		if (!deletingGame) return;
		setIsDeleting(true);
		try {
			await deleteGame({ id: deletingGame._id as Id<"seasonGames"> });
			toast.success("Game deleted");
			setDeleteConfirmOpen(false);
			setDeletingGame(undefined);
		} catch {
			toast.error("Failed to delete game");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleEdit = (game: SeasonGameWithTeams) => {
		setEditingGame(game);
		setDialogMode("edit");
		setDialogOpen(true);
	};

	const handleAddGame = () => {
		setEditingGame(undefined);
		setDialogMode("create");
		setDialogOpen(true);
	};

	const columns: ColumnDef<SeasonGameWithTeams>[] = [
		{
			header: "Date",
			field: "scheduledDate",
			sortable: true,
			cell: (game) => (
				<span className="tabular-nums">
					{new Date(game.scheduledDate).toLocaleDateString()}
				</span>
			),
		},
		{
			header: "Home Team",
			field: "homeTeamId",
			sortable: false,
			cell: (game) => (
				<TeamNameCell
					name={game.homeTeam?.name}
					isWinner={
						game.status === "completed" &&
						game.homeScore !== undefined &&
						game.awayScore !== undefined &&
						game.homeScore > game.awayScore
					}
				/>
			),
		},
		{
			header: "Away Team",
			field: "awayTeamId",
			sortable: false,
			cell: (game) => (
				<TeamNameCell
					name={game.awayTeam?.name}
					isWinner={
						game.status === "completed" &&
						game.homeScore !== undefined &&
						game.awayScore !== undefined &&
						game.awayScore > game.homeScore
					}
				/>
			),
		},
		{
			header: "Score",
			field: "status",
			sortable: true,
			cell: (game) => (
				<ScoreCell
					homeScore={game.homeScore}
					awayScore={game.awayScore}
					status={game.status}
					homeIsWinner={
						game.status === "completed" &&
						game.homeScore !== undefined &&
						game.awayScore !== undefined &&
						game.homeScore > game.awayScore
					}
					awayIsWinner={
						game.status === "completed" &&
						game.homeScore !== undefined &&
						game.awayScore !== undefined &&
						game.awayScore > game.homeScore
					}
				/>
			),
		},
		{
			header: "Location",
			field: "location",
			sortable: false,
			cell: (game) => (
				<span className="text-muted-foreground">{game.location || "-"}</span>
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
					{game.status}
				</span>
			),
		},
	];

	const toolbarFilters = STATUS_FILTERS.map((f) => ({
		label: f.label,
		active: statusFilter === f.value,
		onClick: () => {
			setStatusFilter(f.value);
			setPagination((prev) => ({ ...prev, pageIndex: 0 }));
		},
	}));

	return (
		<>
			<DataTable
				data={paginatedGames}
				columns={columns}
				isLoading={isLoading}
				totalCount={filteredGames.length}
				pagination={pagination}
				onPaginationChange={setPagination}
				emptyMessage="No games scheduled yet"
				itemName="games"
				toolbar={{
					search: {
						value: searchQuery,
						placeholder: "Search by team name...",
						onChange: (value) => {
							setSearchQuery(value);
							setPagination((prev) => ({ ...prev, pageIndex: 0 }));
						},
					},
					filters: toolbarFilters,
					actions: [
						...(isAdmin
							? [
									{
										label: "Generate Schedule",
										variant: "default" as const,
										onClick: () => setGenerateDialogOpen(true),
									},
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
							onClick: () => {
								setSearchQuery("");
								setStatusFilter("all");
								setPagination((prev) => ({ ...prev, pageIndex: 0 }));
							},
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
			{scheduleConfig && (
				<div className="mt-2 text-xs text-muted-foreground text-right">
					Schedule: {scheduleConfig.regularSeasonWeeks} weeks,{" "}
					{scheduleConfig.gamesPerWeek} game(s)/week,{" "}
					{scheduleConfig.scheduleType.replace(/_/g, " ")}
					{scheduleConfig.regularSeasonComplete && (
						<span className="text-emerald-400 ml-2">(complete)</span>
					)}
				</div>
			)}
			<GenerateScheduleDialog
				seasonId={seasonId}
				startDate={seasonStartDate}
				teamCount={teams.length}
				open={generateDialogOpen}
				onOpenChange={setGenerateDialogOpen}
			/>
			<SeasonGameDialog
				mode={dialogMode}
				game={editingGame}
				seasonId={seasonId}
				teams={teams}
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
						? `game on ${new Date(deletingGame.scheduledDate).toLocaleDateString()}`
						: "this game"
				}
				onConfirm={confirmDelete}
				isLoading={isDeleting}
			/>
		</>
	);
}
