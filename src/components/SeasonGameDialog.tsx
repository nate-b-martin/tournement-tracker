import { useMutation } from "convex/react";
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

type SeasonGame = Doc<"seasonGames">;
type Team = Doc<"teams">;

interface SeasonGameDialogProps {
	mode: "create" | "edit";
	game?: SeasonGame;
	seasonId: Id<"seasons">;
	teams: Team[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function SeasonGameDialog({
	mode,
	game,
	seasonId,
	teams,
	open,
	onOpenChange,
	onSuccess,
}: SeasonGameDialogProps) {
	const formId = useId();
	const createGame = useMutation(api.seasonGames.create);
	const updateGame = useMutation(api.seasonGames.update);

	const [homeTeamId, setHomeTeamId] = useState<Id<"teams"> | "">(
		game?.homeTeamId || "",
	);
	const [awayTeamId, setAwayTeamId] = useState<Id<"teams"> | "">(
		game?.awayTeamId || "",
	);
	const [scheduledDate, setScheduledDate] = useState(
		game?.scheduledDate
			? new Date(game.scheduledDate).toISOString().slice(0, 10)
			: "",
	);
	const [location, setLocation] = useState(game?.location || "");
	const [homeScore, setHomeScore] = useState(game?.homeScore?.toString() || "");
	const [awayScore, setAwayScore] = useState(game?.awayScore?.toString() || "");
	const [status, setStatus] = useState<"scheduled" | "completed">(
		game?.status || "scheduled",
	);

	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = () => {
		setHomeTeamId(game?.homeTeamId || "");
		setAwayTeamId(game?.awayTeamId || "");
		setScheduledDate(
			game?.scheduledDate
				? new Date(game.scheduledDate).toISOString().slice(0, 10)
				: "",
		);
		setLocation(game?.location || "");
		setHomeScore(game?.homeScore?.toString() || "");
		setAwayScore(game?.awayScore?.toString() || "");
		setStatus(game?.status || "scheduled");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!homeTeamId || !awayTeamId) {
			toast.error("Both teams are required");
			return;
		}
		if (homeTeamId === awayTeamId) {
			toast.error("Home and away teams must be different");
			return;
		}
		if (!scheduledDate) {
			toast.error("Date is required");
			return;
		}

		setIsSubmitting(true);
		try {
			const scheduledDateMs = new Date(scheduledDate).getTime();

			if (mode === "create") {
				await createGame({
					seasonId,
					homeTeamId: homeTeamId as Id<"teams">,
					awayTeamId: awayTeamId as Id<"teams">,
					scheduledDate: scheduledDateMs,
					location: location || undefined,
				});
				toast.success("Game scheduled successfully");
			} else if (game) {
				const t1Score =
					homeScore !== "" ? Number.parseInt(homeScore, 10) : undefined;
				const t2Score =
					awayScore !== "" ? Number.parseInt(awayScore, 10) : undefined;

				await updateGame({
					id: game._id,
					homeScore: status === "completed" ? t1Score : undefined,
					awayScore: status === "completed" ? t2Score : undefined,
					status,
					scheduledDate: scheduledDateMs,
					location: location || undefined,
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

	const showScores = status === "completed";

	return (
		<Dialog
			open={open}
			onOpenChange={(val) => {
				onOpenChange(val);
				if (!val) resetForm();
			}}
		>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Schedule Game" : "Edit Game"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Schedule a new regular season game"
							: "Update game details or record scores"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-homeTeam`}>Home Team *</Label>
							<Select
								value={homeTeamId.toString()}
								onValueChange={(val) => setHomeTeamId(val as Id<"teams">)}
							>
								<SelectTrigger id={`${formId}-homeTeam`}>
									<SelectValue placeholder="Select team" />
								</SelectTrigger>
								<SelectContent>
									{teams.map((t) => (
										<SelectItem
											key={t._id}
											value={t._id}
											disabled={t._id === awayTeamId}
										>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-awayTeam`}>Away Team *</Label>
							<Select
								value={awayTeamId.toString()}
								onValueChange={(val) => setAwayTeamId(val as Id<"teams">)}
							>
								<SelectTrigger id={`${formId}-awayTeam`}>
									<SelectValue placeholder="Select team" />
								</SelectTrigger>
								<SelectContent>
									{teams.map((t) => (
										<SelectItem
											key={t._id}
											value={t._id}
											disabled={t._id === homeTeamId}
										>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-date`}>Date *</Label>
							<Input
								id={`${formId}-date`}
								type="date"
								value={scheduledDate}
								onChange={(e) => setScheduledDate(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-status`}>Status</Label>
							<Select
								value={status}
								onValueChange={(val) => {
									setStatus(val as "scheduled" | "completed");
									if (val === "scheduled") {
										setHomeScore("");
										setAwayScore("");
									}
								}}
							>
								<SelectTrigger id={`${formId}-status`}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="scheduled">Scheduled</SelectItem>
									<SelectItem value="completed">Completed</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${formId}-location`}>Location</Label>
						<Input
							id={`${formId}-location`}
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							placeholder="e.g. Field A"
						/>
					</div>

					{showScores && (
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor={`${formId}-homeScore`}>
									{teams.find((t) => t._id === homeTeamId)?.name || "Home"}{" "}
									Score
								</Label>
								<Input
									id={`${formId}-homeScore`}
									type="number"
									min={0}
									value={homeScore}
									onChange={(e) => setHomeScore(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`${formId}-awayScore`}>
									{teams.find((t) => t._id === awayTeamId)?.name || "Away"}{" "}
									Score
								</Label>
								<Input
									id={`${formId}-awayScore`}
									type="number"
									min={0}
									value={awayScore}
									onChange={(e) => setAwayScore(e.target.value)}
								/>
							</div>
						</div>
					)}

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
