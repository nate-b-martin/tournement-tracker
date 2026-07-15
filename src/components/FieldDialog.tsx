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

type Field = Doc<"fields">;

interface FieldDialogProps {
	mode: "create" | "edit";
	field?: Field;
	tournamentId: Id<"tournaments">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function FieldDialog({
	mode,
	field,
	tournamentId,
	open,
	onOpenChange,
	onSuccess,
}: FieldDialogProps) {
	const formId = useId();
	const createField = useMutation(api.fields.create);
	const updateField = useMutation(api.fields.update);

	const [name, setName] = useState(field?.name || "");
	const [location, setLocation] = useState(field?.location || "");
	const [status, setStatus] = useState(field?.status || "available");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = () => {
		setName(field?.name || "");
		setLocation(field?.location || "");
		setStatus(field?.status || "available");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Field name is required");
			return;
		}

		setIsSubmitting(true);
		try {
			if (mode === "create") {
				await createField({
					tournamentId,
					name: name.trim(),
					location: location.trim() || undefined,
					status: status as Field["status"],
				});
				toast.success("Field created successfully");
			} else if (field) {
				await updateField({
					id: field._id,
					name: name.trim(),
					location: location.trim() || undefined,
					status: status as Field["status"],
				});
				toast.success("Field updated successfully");
			}
			onOpenChange(false);
			onSuccess?.();
		} catch {
			toast.error(
				mode === "create" ? "Failed to create field" : "Failed to update field",
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
			<DialogContent className="sm:max-w-[450px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Add Field" : "Edit Field"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Add a new playing field to this tournament"
							: "Update field information"}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={`${formId}-name`}>Field Name *</Label>
						<Input
							id={`${formId}-name`}
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Field A"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${formId}-location`}>Location</Label>
						<Input
							id={`${formId}-location`}
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							placeholder="123 Main St, Springfield"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${formId}-status`}>Status</Label>
						<Select value={status} onValueChange={setStatus}>
							<SelectTrigger id={`${formId}-status`}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="available">Available</SelectItem>
								<SelectItem value="maintenance">Maintenance</SelectItem>
								<SelectItem value="unavailable">Unavailable</SelectItem>
							</SelectContent>
						</Select>
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
									? "Create Field"
									: "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
