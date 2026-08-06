import { useMutation } from "convex/react";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Id } from "../../convex/_generated/dataModel";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface GenerateScheduleDialogProps {
	seasonId: Id<"seasons">;
	startDate: number;
	teamCount: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function GenerateScheduleDialog({
	seasonId,
	startDate,
	teamCount,
	open,
	onOpenChange,
	onSuccess,
}: GenerateScheduleDialogProps) {
	const formId = useId();
	const generateSchedule = useMutation(api.seasonGames.generateSchedule);

	const [scheduleType, setScheduleType] = useState<
		"single_round_robin" | "double_round_robin"
	>("single_round_robin");
	const [regularSeasonWeeks, setRegularSeasonWeeks] = useState(10);
	const [gamesPerWeek, setGamesPerWeek] = useState(2);
	const [selectedDays, setSelectedDays] = useState<number[]>([1, 3]);

	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = () => {
		setScheduleType("single_round_robin");
		setRegularSeasonWeeks(10);
		setGamesPerWeek(2);
		setSelectedDays([1, 3]);
	};

	const totalRounds = useMemo(() => {
		const n = teamCount % 2 !== 0 ? teamCount + 1 : teamCount;
		return scheduleType === "single_round_robin" ? n - 1 : 2 * (n - 1);
	}, [teamCount, scheduleType]);

	const totalSlots = regularSeasonWeeks * gamesPerWeek;

	const hasEnoughSlots = totalSlots >= totalRounds;

	const totalGames = useMemo(() => {
		const gamesPerRound = Math.floor(teamCount / 2);
		return gamesPerRound * totalRounds;
	}, [teamCount, totalRounds]);

	const firstGameDate = useMemo(() => {
		if (selectedDays.length === 0) return null;
		const MS_PER_DAY = 86400000;
		const startDay = new Date(startDate).getDay();
		let diff = selectedDays[0] - startDay;
		if (diff < 0) diff += 7;
		return new Date(startDate + diff * MS_PER_DAY).toLocaleDateString();
	}, [startDate, selectedDays]);

	const handleDayToggle = (day: number) => {
		setSelectedDays((prev) => {
			if (prev.includes(day)) {
				return prev.filter((d) => d !== day);
			}
			if (prev.length >= gamesPerWeek) {
				toast.error(`Maximum ${gamesPerWeek} game day(s) per week allowed`);
				return prev;
			}
			return [...prev, day];
		});
	};

	const handleGamesPerWeekChange = (val: string) => {
		const num = Number.parseInt(val, 10);
		if (Number.isNaN(num) || num < 1) {
			setGamesPerWeek(1);
			return;
		}
		if (num > 7) {
			setGamesPerWeek(7);
			return;
		}
		setGamesPerWeek(num);
		setSelectedDays((prev) => prev.filter((_, i) => i < num));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (teamCount < 2) {
			toast.error("Need at least 2 teams to generate a schedule");
			return;
		}
		if (selectedDays.length === 0) {
			toast.error("Select at least one game day");
			return;
		}
		if (!hasEnoughSlots) {
			toast.error(
				`Not enough slots: ${totalRounds} rounds needed, ${regularSeasonWeeks} weeks × ${gamesPerWeek} games/week = ${totalSlots} slots`,
			);
			return;
		}

		setIsSubmitting(true);
		try {
			const result = await generateSchedule({
				seasonId,
				regularSeasonWeeks,
				gamesPerWeek,
				gameDays: selectedDays,
				scheduleType,
			});
			toast.success(
				`Schedule generated: ${result.gameCount} games across ${result.weeksUsed} weeks`,
			);
			onOpenChange(false);
			onSuccess?.();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to generate schedule",
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
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Generate Season Schedule</DialogTitle>
					<DialogDescription>
						Configure the regular season schedule. This will replace any
						existing schedule.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={`${formId}-type`}>Schedule Type</Label>
						<Select
							value={scheduleType}
							onValueChange={(val) =>
								setScheduleType(
									val as "single_round_robin" | "double_round_robin",
								)
							}
						>
							<SelectTrigger id={`${formId}-type`}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="single_round_robin">
									Single Round-Robin
								</SelectItem>
								<SelectItem value="double_round_robin">
									Double Round-Robin
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-weeks`}>Regular Season Weeks</Label>
							<Input
								id={`${formId}-weeks`}
								type="number"
								min={1}
								max={52}
								value={regularSeasonWeeks}
								onChange={(e) =>
									setRegularSeasonWeeks(
										Math.max(1, Number.parseInt(e.target.value, 10) || 1),
									)
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-gperw`}>Games Per Week</Label>
							<Input
								id={`${formId}-gperw`}
								type="number"
								min={1}
								max={7}
								value={gamesPerWeek}
								onChange={(e) => handleGamesPerWeekChange(e.target.value)}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Game Days</Label>
						<div className="flex flex-wrap gap-3">
							{DAY_LABELS.map((label, idx) => (
								<div key={label} className="flex items-center gap-1.5">
									<Checkbox
										id={`${formId}-day-${idx}`}
										checked={selectedDays.includes(idx)}
										onCheckedChange={() => handleDayToggle(idx)}
										disabled={isSubmitting}
									/>
									<Label
										htmlFor={`${formId}-day-${idx}`}
										className="text-sm font-normal cursor-pointer"
									>
										{label}
									</Label>
								</div>
							))}
						</div>
						<p className="text-xs text-muted-foreground">
							Select up to {gamesPerWeek} day(s) per week
						</p>
					</div>

					<div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
						<p className="font-medium">Summary</p>
						<p>
							{teamCount} team{teamCount !== 1 ? "s" : ""},{" "}
							{scheduleType === "single_round_robin" ? "Single" : "Double"}{" "}
							Round-Robin
						</p>
						<p>
							{totalRounds} round{totalRounds !== 1 ? "s" : ""} = {totalGames}{" "}
							game{totalGames !== 1 ? "s" : ""}
						</p>
						<p>
							Slots: {regularSeasonWeeks} week
							{regularSeasonWeeks !== 1 ? "s" : ""} × {gamesPerWeek}/week ={" "}
							{totalSlots} {hasEnoughSlots ? "✅" : "❌"}
						</p>
						{!hasEnoughSlots && (
							<p className="text-xs text-destructive">
								Need {totalRounds} slots, increase weeks or games per week
							</p>
						)}
						{selectedDays.length > 0 && (
							<p>
								Game days: {selectedDays.map((d) => DAY_LABELS[d]).join(", ")}
							</p>
						)}
						{firstGameDate && <p>First game: {firstGameDate}</p>}
						{teamCount % 2 !== 0 && (
							<p className="text-xs text-amber-400">
								Odd number of teams: one bye per round
							</p>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting || !hasEnoughSlots}>
							{isSubmitting ? "Generating..." : "Generate Schedule"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
