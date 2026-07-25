import { Component, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error boundary for authentication-related errors
 * Catches errors during auth initialization and profile creation
 */
export class AuthErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false, error: null };

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		if (import.meta.env.DEV) {
			console.error("Auth error:", error, errorInfo);
		}
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: null });
		window.location.reload();
	};

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="p-4">
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Authentication Error</AlertTitle>
							<AlertDescription>
								An authentication issue occurred. Please try again.
							</AlertDescription>
						</Alert>
						<Button onClick={this.handleRetry} className="mt-4">
							Retry
						</Button>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
