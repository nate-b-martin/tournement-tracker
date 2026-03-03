import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, Loader2 } from "lucide-react";
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}
export function ProtectedRoute({
  children,
  requireAdmin = true,
  fallback,
}: ProtectedRouteProps) {
  const { isLoading, isSignedIn, isAdmin } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!isSignedIn) {
    return (
      fallback || (
        <AccessDeniedMessage
          title="Authentication Required"
          description="Please sign in to access this content."
        />
      )
    );
  }
  if (requireAdmin && !isAdmin) {
    return (
      fallback || (
        <AccessDeniedMessage
          title="Admin Access Required"
          description="You don't have permission to access this page."
          showContact
        />
      )
    );
  }
  return <>{children}</>;
}
function AccessDeniedMessage({
  title,
  description,
  showContact = false,
}: {
  title: string;
  description: string;
  showContact?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Alert className="max-w-md">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
        {showContact && (
          <p className="mt-2 text-sm text-muted-foreground">
            Contact the tournament administrator if you need access.
          </p>
        )}
      </Alert>
      <Button asChild className="mt-4">
        <Link to="/">Go Home</Link>
      </Button>
    </div>
  );
}
