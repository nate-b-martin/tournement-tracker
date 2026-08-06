import { useMutation, useQuery } from "convex/react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type Game = Doc<"games">;

interface GameDialogProps {
	mode: "create" | "edit";
	game?: Game;
	tournamentId?: Id<"tournaments">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function GameDialog({
	mode,
	game,
	tournamentId,
	open,
	onOpenChange,
	onSuccess,
}: GameDialogProps) {
	const formId = useId();
	const createGame = useMutation(api.games.create);
	const updateGame = useMutation(api.games.update);

	const teamsResult = useQuery(api.teams.list, {
		filtering: tournamentId
			? { tournamentId }
			: game?.tournamentId
				? { tournamentId: game.tournamentId as Id<"tournaments"> }
				: undefined,
	});
	const allTeams = teamsResult?.teams || [];

	const fieldsTournamentId = tournamentId || game?.tournamentId;
	const fieldsResult = useQuery(
		api.fields.listByTournament,
		fieldsTournamentId
			? { tournamentId: fieldsTournamentId as Id<"tournaments"> }
			: "skip",
	);
	const allFields = fieldsResult || [];

	const [selectedTournamentId] = useState<Id<"tournaments"> | "">(
		tournamentId || game?.tournamentId || "",
	);
	const [round, setRound] = useState(game?.round.toString() || "1");
	const [gameNumber, setGameNumber] = useState(
		game?.gameNumber.toString() || "1",
	);
	const [team1Id, setTeam1Id] = useState<Id<"teams"> | "">(game?.team1Id || "");
	const [team2Id, setTeam2Id] = useState<Id<"teams"> | "">(game?.team2Id || "");
	const [fieldId, setFieldId] = useState<Id<"fields"> | "">(
		game?.fieldId || "",
	);
	const [scheduledTime, setScheduledTime] = useState(
		game?.scheduledTime
			? new Date(game.scheduledTime).toISOString().slice(0, 16)
			: "",
	);
	const [status, setStatus] = useState(game?.status || "scheduled");

	const [team1Score, setTeam1Score] = useState(
		game?.team1Score?.toString() || "",
	);
	const [team2Score, setTeam2Score] = useState(
		game?.team2Score?.toString() || "",
	);
	const [winnerId, setWinnerId] = useState<Id<"teams"> | "auto" | "">(
		game?.winnerId || "auto",
	);
	const [actualStartTime, setActualStartTime] = useState(
		game?.actualStartTime
			? new Date(game.actualStartTime).toISOString().slice(0, 16)
			: "",
	);
	const [actualEndTime, setActualEndTime] = useState(
		game?.actualEndTime
			? new Date(game.actualEndTime).toISOString().slice(0, 16)
			: "",
	);

	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = () => {
		setRound(game?.round.toString() || "1");
		setGameNumber(game?.gameNumber.toString() || "1");
		setTeam1Id(game?.team1Id || "");
		setTeam2Id(game?.team2Id || "");
		setFieldId(game?.fieldId || "");
		setScheduledTime(
			game?.scheduledTime
				? new Date(game.scheduledTime).toISOString().slice(0, 16)
				: "",
		);
		setStatus(game?.status || "scheduled");
		setTeam1Score(game?.team1Score?.toString() || "");
		setTeam2Score(game?.team2Score?.toString() || "");
		setWinnerId(game?.winnerId || "auto");
		setActualStartTime(
			game?.actualStartTime
				? new Date(game.actualStartTime).toISOString().slice(0, 16)
				: "",
		);
		setActualEndTime(
			game?.actualEndTime
				? new Date(game.actualEndTime).toISOString().slice(0, 16)
				: "",
		);
	};

	const calculateWinner = (
		t1Score: number,
		t2Score: number,
	): Id<"teams"> | undefined => {
		if (t1Score > t2Score) return team1Id as Id<"teams">;
		if (t2Score > t1Score) return team2Id as Id<"teams">;
		return undefined;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!selectedTournamentId) {
			toast.error("Tournament is required");
			return;
		}
		if (!team1Id || !team2Id) {
			toast.error("Both teams are required");
			return;
		}
		if (team1Id === team2Id) {
			toast.error("A game cannot have the same team twice");
			return;
		}

		setIsSubmitting(true);
		try {
			const scheduledTimeMs = scheduledTime
				? new Date(scheduledTime).getTime()
				: undefined;
			const actualStartMs = actualStartTime
				? new Date(actualStartTime).getTime()
				: undefined;
			const actualEndMs = actualEndTime
				? new Date(actualEndTime).getTime()
				: undefined;

			const t1Score = team1Score ? Number.parseInt(team1Score, 10) : undefined;
			const t2Score = team2Score ? Number.parseInt(team2Score, 10) : undefined;

			let resolvedWinnerId: Id<"teams"> | undefined;
			if (
				winnerId === "auto" &&
				t1Score !== undefined &&
				t2Score !== undefined
			) {
				resolvedWinnerId = calculateWinner(t1Score, t2Score);
			} else if (winnerId && winnerId !== "auto") {
				resolvedWinnerId = winnerId as Id<"teams">;
			}

			if (mode === "create") {
				await createGame({
					tournamentId: selectedTournamentId as Id<"tournaments">,
					round: Number.parseInt(round, 10),
					gameNumber: Number.parseInt(gameNumber, 10),
					team1Id: team1Id as Id<"teams">,
					team2Id: team2Id as Id<"teams">,
					scheduledTime: scheduledTimeMs,
					fieldId: fieldId ? (fieldId as Id<"fields">) : undefined,
					status: status as Game["status"],
				});
				toast.success("Game created successfully");
			} else if (game) {
				await updateGame({
					id: game._id,
					round: Number.parseInt(round, 10),
					gameNumber: Number.parseInt(gameNumber, 10),
					status: status as Game["status"],
					scheduledTime: scheduledTimeMs,
					actualStartTime: actualStartMs,
					actualEndTime: actualEndMs,
					fieldId: fieldId ? (fieldId as Id<"fields">) : undefined,
					team1Score: t1Score,
					team2Score: t2Score,
					winnerId: resolvedWinnerId,
				});
				toast.success("Game updated successfully");
			}
			onOpenChange(false);
			onSuccess?.();
		} catch {
			toast.error(
				mode === "create" ? "Failed to create game" : "Failed to update game",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(val) => {
				onOpenChange(val);
				if (!val) resetForm();
			}}
		>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Schedule Game" : "Edit Game"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Schedule a new game between two teams"
							: "Update game details or record scores"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-round`}>Round *</Label>
							<Input
								id={`${formId}-round`}
								type="number"
								min={1}
								value={round}
								onChange={(e) => setRound(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-gameNumber`}>Game # *</Label>
							<Input
								id={`${formId}-gameNumber`}
								type="number"
								min={1}
								value={gameNumber}
								onChange={(e) => setGameNumber(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-status`}>Status</Label>
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger id={`${formId}-status`}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="scheduled">Scheduled</SelectItem>
									<SelectItem value="in_progress">In Progress</SelectItem>
									<SelectItem value="completed">Completed</SelectItem>
									<SelectItem value="postponed">Postponed</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-team1`}>Team 1 *</Label>
							<Select
								value={team1Id.toString()}
								onValueChange={(val) => setTeam1Id(val as Id<"teams">)}
							>
								<SelectTrigger id={`${formId}-team1`}>
									<SelectValue placeholder="Select team" />
								</SelectTrigger>
								<SelectContent>
									{allTeams.map((t) => (
										<SelectItem
											key={t._id}
											value={t._id}
											disabled={t._id === team2Id}
										>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-team2`}>Team 2 *</Label>
							<Select
								value={team2Id.toString()}
								onValueChange={(val) => setTeam2Id(val as Id<"teams">)}
							>
								<SelectTrigger id={`${formId}-team2`}>
									<SelectValue placeholder="Select team" />
								</SelectTrigger>
								<SelectContent>
									{allTeams.map((t) => (
										<SelectItem
											key={t._id}
											value={t._id}
											disabled={t._id === team1Id}
										>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{mode === "edit" && (
						<fieldset className="rounded-lg border p-4">
							<legend className="px-2 text-sm font-medium text-muted-foreground">
								Scores & Result
							</legend>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor={`${formId}-team1Score`}>
											{allTeams.find((t) => t._id === team1Id)?.name ||
												"Team 1"}{" "}
											Score
										</Label>
										<Input
											id={`${formId}-team1Score`}
											type="number"
											min={0}
											value={team1Score}
											onChange={(e) => setTeam1Score(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor={`${formId}-team2Score`}>
											{allTeams.find((t) => t._id === team2Id)?.name ||
												"Team 2"}{" "}
											Score
										</Label>
										<Input
											id={`${formId}-team2Score`}
											type="number"
											min={0}
											value={team2Score}
											onChange={(e) => setTeam2Score(e.target.value)}
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor={`${formId}-winner`}>Winner</Label>
										<Select
											value={winnerId.toString()}
											onValueChange={(val) =>
												setWinnerId(val as Id<"teams"> | "auto")
											}
										>
											<SelectTrigger id={`${formId}-winner`}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="auto">Auto (from scores)</SelectItem>
												{allTeams
													.filter((t) => t._id === team1Id || t._id === team2Id)
													.map((t) => (
														<SelectItem key={t._id} value={t._id}>
															{t.name}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</fieldset>
					)}

					<fieldset className="rounded-lg border p-4">
						<legend className="px-2 text-sm font-medium text-muted-foreground">
							Scheduling
						</legend>
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor={`${formId}-scheduledTime`}>
										Scheduled Time
									</Label>
									<Input
										id={`${formId}-scheduledTime`}
										type="datetime-local"
										value={scheduledTime}
										onChange={(e) => setScheduledTime(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`${formId}-field`}>Field</Label>
									<Select
										value={fieldId.toString()}
										onValueChange={(val) => setFieldId(val as Id<"fields">)}
									>
										<SelectTrigger id={`${formId}-field`}>
											<SelectValue placeholder="Select field" />
										</SelectTrigger>
										<SelectContent>
											{allFields.map((f) => (
												<SelectItem key={f._id} value={f._id}>
													{f.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							{mode === "edit" && (
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor={`${formId}-actualStart`}>
											Actual Start
										</Label>
										<Input
											id={`${formId}-actualStart`}
											type="datetime-local"
											value={actualStartTime}
											onChange={(e) => setActualStartTime(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor={`${formId}-actualEnd`}>Actual End</Label>
										<Input
											id={`${formId}-actualEnd`}
											type="datetime-local"
											value={actualEndTime}
											onChange={(e) => setActualEndTime(e.target.value)}
										/>
									</div>
								</div>
							)}
						</div>
					</fieldset>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? "Saving..."
								: mode === "create"
									? "Schedule Game"
									: "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
