import { Eye } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ViewOnlyAlertProps {
	resourceName: string;
}

export function ViewOnlyAlert({ resourceName }: ViewOnlyAlertProps) {
	return (
		<Alert className="mb-4 bg-gray-800/50 border-gray-700">
			<Eye className="h-4 w-4 text-gray-400" />
			<AlertTitle className="text-gray-200">View Only Mode</AlertTitle>
			<AlertDescription className="text-gray-400">
				You can view {resourceName} but cannot make changes. Contact an admin if
				you need to add or edit {resourceName}.
			</AlertDescription>
		</Alert>
	);
}
