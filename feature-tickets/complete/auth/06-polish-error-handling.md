# Phase 6: Polish - Loading States & Error Handling

## Overview
Add loading skeletons for auth initialization, implement comprehensive error handling with user-friendly messages, and add toast notifications for auth-related events.

## Current State
- No visual feedback while auth state loads
- Errors during profile creation are logged but not shown to users
- No toast notifications for auth events (sign in, sign out, access denied)
- Silent failures can confuse users

## Implementation Steps

### Step 6.1: Add Auth Loading Skeleton to Header
Enhance `AuthWidget` with skeleton states:

```typescript
// In AuthWidget component
if (!isLoaded || isLoading) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}
```

### Step 6.2: Create Error Boundary for Auth
Create `src/components/AuthErrorBoundary.tsx`:

```typescript
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

export class AuthErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Auth error:", error, errorInfo);
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
                {this.state.error?.message || "Failed to initialize authentication"}
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
```

### Step 6.3: Add Toast Notifications for Auth Events
Enhance `useAuth` hook with toast integration:

```typescript
import { useToast } from "./useToast";

export function useAuth() {
  const { toast } = useToast();
  // ... existing hook code ...
  
  // Show toast on successful profile creation
  useEffect(() => {
    if (profile && !isCreatingProfile && !error) {
      const isFirstTime = profile._creationTime > Date.now() - 5000;
      if (isFirstTime) {
        toast({
          title: profile.role === "admin" 
            ? "Welcome, Admin!" 
            : "Welcome!",
          description: profile.role === "admin"
            ? "You have full access to manage tournaments."
            : "You have view-only access to tournament data.",
        });
      }
    }
  }, [profile, isCreatingProfile, error, toast]);
  
  // Show toast on profile creation error
  useEffect(() => {
    if (error) {
      toast({
        title: "Setup Error",
        description: "Failed to complete user setup. Please try signing out and back in.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // ... rest of hook ...
}
```

### Step 6.4: Add Global Toast Notifications
Create auth event listener in `src/routes/__root.tsx`:

```typescript
import { useEffect } from "react";
import { useToast } from "../hooks/useToast";

function RootDocument({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  
  // Listen for sign out events
  useEffect(() => {
    const handleSignOut = () => {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    };
    
    window.addEventListener("clerk:signout", handleSignOut);
    return () => window.removeEventListener("clerk:signout", handleSignOut);
  }, [toast]);
  
  return (
    // ... existing JSX ...
  );
}
```

### Step 6.5: Enhanced Error States in useAuth
Add retry logic to `useAuth`:

```typescript
export function useAuth() {
  // ... existing state ...
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  const retry = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setError(null);
      setRetryCount((c) => c + 1);
    }
  }, [retryCount]);
  
  // In error effect, offer retry
  useEffect(() => {
    if (error && retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        retry();
      }, 2000 * (retryCount + 1)); // Exponential backoff
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, retry]);
  
  return {
    // ... existing returns ...
    retry,
    retryCount,
    hasMaxRetries: retryCount >= MAX_RETRIES,
  };
}
```

### Step 6.6: Loading States for Route Transitions
Add global loading indicator for route changes:

```typescript
// In __root.tsx or a layout component
import { useRouterState } from "@tanstack/react-router";

function LoadingIndicator() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  
  if (!isLoading) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-purple-600 z-50 animate-pulse">
      <div className="h-full bg-purple-400 animate-[loading_1s_ease-in-out_infinite]" />
    </div>
  );
}
```

### Step 6.7: Network Error Handling
Add offline detection:

```typescript
export function useAuth() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  
  // Show offline warning
  useEffect(() => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Some features may be unavailable until you're back online.",
        variant: "warning",
      });
    }
  }, [isOnline, toast]);
  
  return {
    // ... existing returns ...
    isOnline,
  };
}
```

### Step 6.8: Test All Error Scenarios
1. **Profile creation failure**: Block Convex network request
2. **Offline mode**: Disable network, verify warning shows
3. **Auth initialization failure**: Break Clerk config
4. **Rate limiting**: Rapid sign in/out
5. **Session expiration**: Wait for Clerk session to expire

## Acceptance Criteria
- [ ] Auth widget shows skeleton while loading
- [ ] `AuthErrorBoundary` catches and displays auth errors
- [ ] Toast notifications on sign in (welcome message with role)
- [ ] Toast notification on sign out
- [ ] Toast notification on profile creation error
- [ ] Toast notification when access denied (from query params)
- [ ] Retry logic with exponential backoff for failed operations
- [ ] Offline mode detection and warning
- [ ] Loading indicator for route transitions
- [ ] Graceful degradation when services unavailable
- [ ] All errors have user-friendly messages
- [ ] No silent failures - all errors surfaced to UI

## Testing Considerations
- Test slow 3G network conditions
- Test offline mode thoroughly
- Test with Convex dev server stopped
- Test with invalid Clerk keys
- Verify error boundaries catch unexpected errors
- Test retry logic exhausts after 3 attempts
- Verify toasts don't stack excessively
- Test error states on all auth flows

## Related Files
- `src/components/AuthWidget.tsx` - ADD - Skeleton states
- `src/components/AuthErrorBoundary.tsx` - NEW - Error boundary
- `src/hooks/useAuth.ts` - MODIFY - Toast integration, retry logic
- `src/routes/__root.tsx` - MODIFY - Global toasts, loading indicator
- `src/hooks/useToast.ts` - Dependency (existing)
- `src/components/ui/skeleton.tsx` - Loading skeletons
- `src/components/ui/alert.tsx` - Error displays

## Helpful Resources

### Error Handling
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Error Handling Patterns](https://www.patterns.dev/posts/react-error-handling)

### Loading States
- [Skeleton Screens](https://www.nngroup.com/articles/skeleton-screens/)
- [Progressive Loading](https://www.nngroup.com/articles/progressive-image-loading/)

### Toast Notifications
- [Toast UI Pattern](https://www.nngroup.com/articles/notifications/)
- [Sonner Toast Library](https://sonner.emilkowal.ski/)

## Notes
- Keep loading states subtle - don't block UI unnecessarily
- Error messages should be actionable (tell user what to do)
- Toast notifications auto-dismiss to avoid clutter
- Retry logic prevents temporary network issues from breaking UX
- Offline warnings help users understand limited functionality
- Skeletons should match the shape of final content to reduce layout shift
- Consider adding error reporting service (Sentry) for production
- Test error scenarios in staging before production deployment
