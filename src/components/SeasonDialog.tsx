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
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

type Season = Doc<"seasons">;

function toDateInputValue(ms: number | undefined): string {
	if (!ms) return "";
	const d = new Date(ms);
	return d.toISOString().split("T")[0];
}

function fromDateInputValue(dateStr: string): number | undefined {
	if (!dateStr) return undefined;
	return new Date(`${dateStr}T00:00:00`).getTime();
}

interface SeasonDialogProps {
	mode: "create" | "edit";
	season?: Season;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function SeasonDialog({
	mode,
	season,
	open,
	onOpenChange,
	onSuccess,
}: SeasonDialogProps) {
	const formId = useId();
	const createSeason = useMutation(api.seasons.create);
	const updateSeason = useMutation(api.seasons.update);

	const [name, setName] = useState(season?.name || "");
	const [sport, setSport] = useState(season?.sport || "");
	const [startDate, setStartDate] = useState(
		toDateInputValue(season?.startDate),
	);
	const [endDate, setEndDate] = useState(toDateInputValue(season?.endDate));
	const [description, setDescription] = useState(season?.description || "");
	const [status, setStatus] = useState(season?.status || "planning");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = () => {
		setName(season?.name || "");
		setSport(season?.sport || "");
		setStartDate(toDateInputValue(season?.startDate));
		setEndDate(toDateInputValue(season?.endDate));
		setDescription(season?.description || "");
		setStatus(season?.status || "planning");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Season name is required");
			return;
		}
		if (!sport.trim()) {
			toast.error("Sport is required");
			return;
		}

		setIsSubmitting(true);
		try {
			const seasonData = {
				name: name.trim(),
				sport: sport.trim(),
				startDate: fromDateInputValue(startDate) || Date.now(),
				endDate: fromDateInputValue(endDate) || Date.now(),
				description: description.trim() || undefined,
				status: status as "planning" | "active" | "complete",
			};

			if (mode === "create") {
				await createSeason(seasonData);
				toast.success("Season created successfully");
			} else if (season) {
				await updateSeason({
					id: season._id,
					...seasonData,
				});
				toast.success("Season updated successfully");
			}
			onOpenChange(false);
			onSuccess?.();
		} catch {
			toast.error(
				mode === "create"
					? "Failed to create season"
					: "Failed to update season",
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
					<DialogTitle>
						{mode === "create" ? "Create Season" : "Edit Season"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Set up a new season"
							: "Update season settings"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-name`}>Season Name *</Label>
							<Input
								id={`${formId}-name`}
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Spring 2025"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-sport`}>Sport *</Label>
							<Input
								id={`${formId}-sport`}
								value={sport}
								onChange={(e) => setSport(e.target.value)}
								placeholder="Baseball"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor={`${formId}-startDate`}>Start Date</Label>
							<Input
								id={`${formId}-startDate`}
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`${formId}-endDate`}>End Date</Label>
							<Input
								id={`${formId}-endDate`}
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${formId}-status`}>Status</Label>
						<Select value={status} onValueChange={setStatus}>
							<SelectTrigger id={`${formId}-status`}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="planning">Planning</SelectItem>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="complete">Complete</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${formId}-description`}>Description</Label>
						<Textarea
							id={`${formId}-description`}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Season overview and notes..."
							rows={3}
						/>
					</div>

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
									? "Create Season"
									: "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
