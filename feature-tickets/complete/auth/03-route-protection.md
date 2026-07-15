# Phase 3: Route Protection - beforeLoad Guards & Protected Components

## Overview
Implement route-level protection using TanStack Router's `beforeLoad` function to prevent unauthorized access to admin-only routes. Also create a reusable ProtectedRoute component for component-level protection.

## Current State
- TanStack Router configured with file-based routing
- No route guards or auth checks in place
- All routes are publicly accessible
- `/dashboard` shows data without verifying admin status
- No redirect logic for unauthorized access

## Implementation Steps

### Step 1: Update Root Route with Auth Context
Modify `src/routes/__root.tsx` to provide auth context:

```typescript
import { createRootRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";

export const Route = createRootRoute({
  // ... existing head config ...
  
  beforeLoad: async ({ context }) => {
    // Auth context will be available in all child routes
    return {
      auth: {
        isLoaded: false,
        isSignedIn: false,
        isAdmin: false,
      },
    };
  },
  
  component: RootDocument,
});

// Hook to access auth in route components
export function useRouteAuth() {
  const { auth } = Route.useRouteContext();
  return auth;
}
```

### Step 2: Protect Dashboard Route
Update `src/routes/dashboard/index.tsx`:

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";

export const Route = createFileRoute("/dashboard/")({
  beforeLoad: async ({ context }) => {
    // Wait for auth to initialize (this is tricky - see notes)
    // Option: Check auth state synchronously from context
    
    if (!context.auth.isLoaded) {
      // Still loading, let component handle it
      return;
    }
    
    if (!context.auth.isSignedIn) {
      throw redirect({
        to: "/",
        search: { auth: "required" },
      });
    }
    
    if (!context.auth.isAdmin) {
      throw redirect({
        to: "/",
        search: { error: "admin_required" },
      });
    }
  },
  
  component: DashboardPage,
});

function DashboardPage() {
  const auth = useAuth();
  
  if (auth.isLoading) {
    return <DashboardSkeleton />;
  }
  
  // Component-level check as backup
  if (!auth.isAdmin) {
    return <AccessDenied />;
  }
  
  return (
    // ... existing dashboard content ...
  );
}
```

### Step 3: Create ProtectedRoute Component
Create `src/components/ProtectedRoute.tsx`:

```typescript
import { useAuth } from "../hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
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
```

### Step 4: Handle Query Parameters on Homepage
Update `src/routes/index.tsx` to show auth messages:

```typescript
import { useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { useToast } from "../hooks/useToast";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const search = useSearch({ from: "/" });
  const { toast } = useToast();
  
  useEffect(() => {
    if (search.auth === "required") {
      toast({
        title: "Sign In Required",
        description: "Please sign in to access that page.",
        variant: "destructive",
      });
    }
    
    if (search.error === "admin_required") {
      toast({
        title: "Admin Access Required",
        description: "You need admin privileges to access that page.",
        variant: "destructive",
      });
    }
  }, [search, toast]);
  
  return (
    // ... existing homepage content ...
  );
}
```

### Step 5: Test Route Protection
1. Sign out and navigate to `/dashboard` directly
2. Should redirect to `/` with "Sign In Required" toast
3. Sign in as spectator
4. Navigate to `/dashboard` directly
5. Should redirect to `/` with "Admin Access Required" toast
6. Sign in as admin
7. Should access `/dashboard` successfully

## Acceptance Criteria
- [ ] `src/routes/__root.tsx` provides auth context to child routes
- [ ] `src/routes/dashboard/index.tsx` has beforeLoad protection
- [ ] `src/components/ProtectedRoute.tsx` created for component-level protection
- [ ] Unauthenticated users redirected to `/` with auth message
- [ ] Non-admin users redirected to `/` with admin message
- [ ] Homepage displays toast messages from query params
- [ ] Loading states shown during auth checks
- [ ] Access denied UI is user-friendly with clear messaging
- [ ] No flash of protected content before redirect
- [ ] Component-level protection works as backup
- [ ] Tests verify all redirect scenarios

## Testing Considerations
- Test direct URL access to `/dashboard` while signed out
- Test direct URL access with spectator role
- Test navigation via Link components (should also trigger beforeLoad)
- Test browser refresh on protected route
- Test back button after redirect
- Verify toast messages display correctly
- Ensure loading states prevent UI flicker

## Related Files
- `src/routes/__root.tsx` - MODIFY - Add auth context
- `src/routes/dashboard/index.tsx` - MODIFY - Add beforeLoad
- `src/routes/index.tsx` - MODIFY - Handle query params
- `src/components/ProtectedRoute.tsx` - NEW - Reusable wrapper
- `src/hooks/useAuth.ts` - Used for component-level checks

## Helpful Resources

### TanStack Router
- [beforeLoad Documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#using-beforeload)
- [Redirecting in beforeLoad](https://tanstack.com/router/latest/docs/framework/react/guide/navigation#programmatic-navigation)
- [Route Context](https://tanstack.com/router/latest/docs/framework/react/guide/route-context)
- [Route Protection Patterns](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes)

### React Patterns
- [Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Loading States](https://react.dev/reference/react/Suspense)

## Notes
- beforeLoad runs before component renders - ideal for redirects
- beforeLoad is synchronous - can't use async auth checks easily
- Consider using component-level protection as primary guard
- beforeLoad can validate params but auth state might still be loading
- Route context persists across navigations - good for caching auth state
- Query params (?auth=required) allow homepage to show contextual messages
- Keep ProtectedRoute flexible - accept custom fallback components
- Consider adding "requireSignIn" prop (not just requireAdmin) for future use
- Test with React DevTools to verify no unnecessary re-renders
