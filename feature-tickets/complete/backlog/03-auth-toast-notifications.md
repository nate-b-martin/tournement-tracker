# Feature: Auth Toast Notifications

## Overview
Add toast notifications for authentication events to improve user feedback when accessing protected routes.

## Current State
- Phase 3 route protection implemented with inline error messages
- Sonner toast library installed
- Toaster component added to app
- No toast notifications firing on auth events

## Implementation Steps

### Step 1: Add toast to ProtectedRoute Component
Enhance `src/components/ProtectedRoute.tsx` to trigger toasts when redirecting:

```typescript
import { toast } from "sonner";

export function ProtectedRoute({ children, requireAdmin, fallback }) {
  const { isLoading, isSignedIn, isAdmin } = useAuth();

  // Show toast and redirect for auth errors
  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      toast.error("Sign In Required", {
        description: "Please sign in to access this page.",
      });
    }
  }, [isLoading, isSignedIn]);

  useEffect(() => {
    if (!isLoading && isSignedIn && !isAdmin && requireAdmin) {
      toast.error("Admin Access Required", {
        description: "You need admin privileges to access this page.",
      });
    }
  }, [isLoading, isSignedIn, isAdmin, requireAdmin]);
  
  // ... rest of component
}
```

### Step 2: (Optional) Homepage Query Param Handler
If we want to handle redirect query params on homepage:

```typescript
// In src/routes/index.tsx
import { useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

function HomePage() {
  const search = useSearch({ from: "/" });
  
  useEffect(() => {
    if (search.auth === "required") {
      toast.error("Sign In Required", {
        description: "Please sign in to access that page.",
      });
    }
    
    if (search.error === "admin_required") {
      toast.error("Admin Access Required", {
        description: "You need admin privileges to access that page.",
      });
    }
  }, [search]);
  
  // ... rest of component
}
```

## Acceptance Criteria
- [ ] Toast appears when accessing protected route while signed out
- [ ] Toast appears when accessing admin route as non-admin
- [ ] Toasts are dismissible
- [ ] Toast messages are user-friendly

## Related Files
- `src/components/ProtectedRoute.tsx` - MODIFY - Add toast calls
- `src/routes/index.tsx` - OPTIONAL - Handle query params

## Dependencies
- sonner (already installed)

## Notes
- Sonner provides nice defaults - toasts auto-dismiss after 4 seconds
- Use `toast.error()` for auth failures (red color)
- Consider using `duration: Infinity` for important messages
- Test on mobile to ensure toasts are visible
