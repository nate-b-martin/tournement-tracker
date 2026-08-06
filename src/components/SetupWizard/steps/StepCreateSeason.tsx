import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWizard } from "../SetupWizardContext";

export function StepCreateSeason() {
	const formId = useId();
	const { state, dispatch } = useWizard();
	const { season } = state;

	const setField = (field: string, value: string | number) => {
		dispatch({ type: "SET_SEASON", season: { [field]: value } });
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Create Season</h3>
				<p className="text-sm text-muted-foreground">
					Define the season that will contain your teams and tournament.
				</p>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor={`${formId}-name`}>Season Name *</Label>
					<Input
						id={`${formId}-name`}
						value={season.name}
						onChange={(e) => setField("name", e.target.value)}
						placeholder="Spring 2026"
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${formId}-sport`}>Sport *</Label>
					<Input
						id={`${formId}-sport`}
						value={season.sport}
						onChange={(e) => setField("sport", e.target.value)}
						placeholder="Baseball"
						required
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor={`${formId}-startDate`}>Start Date *</Label>
					<Input
						id={`${formId}-startDate`}
						type="date"
						value={
							season.startDate
								? new Date(season.startDate).toISOString().split("T")[0]
								: ""
						}
						onChange={(e) => {
							const value = e.target.value;
							setField(
								"startDate",
								value ? new Date(`${value}T00:00:00`).getTime() : 0,
							);
						}}
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${formId}-endDate`}>End Date *</Label>
					<Input
						id={`${formId}-endDate`}
						type="date"
						value={
							season.endDate
								? new Date(season.endDate).toISOString().split("T")[0]
								: ""
						}
						onChange={(e) => {
							const value = e.target.value;
							setField(
								"endDate",
								value ? new Date(`${value}T00:00:00`).getTime() : 0,
							);
						}}
						required
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor={`${formId}-description`}>Description</Label>
				<Textarea
					id={`${formId}-description`}
					value={season.description}
					onChange={(e) => setField("description", e.target.value)}
					placeholder="Optional season description..."
					rows={3}
				/>
			</div>
		</div>
	);
}
