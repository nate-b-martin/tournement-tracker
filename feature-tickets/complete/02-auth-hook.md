# Phase 2: Frontend Auth Hook - Combined Clerk & Convex State

## Overview
Create a unified authentication hook that combines Clerk's identity management with Convex's role storage. This hook provides the single source of truth for auth state across the application and handles automatic user profile creation.

## Current State
- Clerk is configured and working (`src/integrations/clerk/`)
- No hook exists to bridge Clerk auth with Convex user profiles
- No automatic profile creation on first sign-in
- Components manually check Clerk auth state without role information

## Implementation Steps

### Step 1: Create useAuth Hook
Create `src/hooks/useAuth.ts`:

```typescript
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

export function useAuth() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  
  // Query for existing user profile
  const profile = useQuery(
    api.userProfiles.getCurrentUser,
    isSignedIn && user ? { userId: user.id } : "skip"
  );
  
  // Mutation for creating profile
  const createProfile = useMutation(api.userProfiles.createUserProfile);
  
  // Auto-create profile on first sign-in
  useEffect(() => {
    if (
      isLoaded && 
      isSignedIn && 
      user && 
      profile === null && 
      !isCreatingProfile
    ) {
      setIsCreatingProfile(true);
      createProfile({
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        displayName: user.fullName || user.username,
      }).finally(() => {
        setIsCreatingProfile(false);
      });
    }
  }, [isLoaded, isSignedIn, user, profile, isCreatingProfile]);
  
  const isAdmin = profile?.role === "admin";
  const isSpectator = profile?.role === "spectator";
  const isPlayer = profile?.role === "player";
  const isOrganizer = profile?.role === "organizer";
  
  return {
    // Clerk state
    isLoaded,
    isSignedIn,
    user,
    
    // Convex state
    profile,
    isAdmin,
    isSpectator,
    isPlayer,
    isOrganizer,
    
    // Loading states
    isLoading: !isLoaded || isCreatingProfile || (isSignedIn && profile === undefined),
  };
}
```

### Step 2: Add Error Handling
Enhance hook with error states:

```typescript
export function useAuth() {
  // ... existing code ...
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (isLoaded && isSignedIn && user && profile === null && !isCreatingProfile) {
      setIsCreatingProfile(true);
      setError(null);
      
      createProfile({
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        displayName: user.fullName || user.username,
      })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error("Failed to create profile"));
          console.error("Failed to create user profile:", err);
        })
        .finally(() => {
          setIsCreatingProfile(false);
        });
    }
  }, [isLoaded, isSignedIn, user, profile, isCreatingProfile]);
  
  return {
    // ... existing returns ...
    error,
    hasError: error !== null,
  };
}
```

### Step 3: Test Hook Integration
Test the hook in a safe environment:

```typescript
// Test in demo route or new test route
function AuthTest() {
  const auth = useAuth();
  
  if (auth.isLoading) return <div>Loading auth state...</div>;
  if (auth.hasError) return <div>Error: {auth.error.message}</div>;
  
  return (
    <div>
      <p>Signed In: {auth.isSignedIn ? "Yes" : "No"}</p>
      <p>Role: {auth.profile?.role || "N/A"}</p>
      <p>Is Admin: {auth.isAdmin ? "Yes" : "No"}</p>
    </div>
  );
}
```

### Step 4: Verify Auto-Profile Creation
1. Clear userProfiles table in Convex
2. Sign in with Clerk
3. Verify profile is created with admin role
4. Sign out
5. Sign in with different account
6. Verify second profile created with spectator role

## Acceptance Criteria
- [ ] `src/hooks/useAuth.ts` created with combined Clerk + Convex state
- [ ] Hook returns: isLoaded, isSignedIn, user, profile, isAdmin, isLoading, error
- [ ] Auto-creates user profile on first sign-in using createUserProfile mutation
- [ ] Profile creation uses Clerk user data (id, email, displayName)
- [ ] Proper loading state while Clerk initializes and profile queries
- [ ] Error state captures profile creation failures
- [ ] Computed booleans for each role (isAdmin, isSpectator, etc.)
- [ ] Hook is reusable across components
- [ ] Tested with first user (should become admin)
- [ ] Tested with second user (should be spectator)

## Testing Considerations
- Test loading states with slow network
- Test error handling when Convex is unreachable
- Verify hook doesn't create duplicate profiles
- Test rapid sign-in/sign-out cycles
- Ensure proper cleanup on unmount

## Related Files
- `src/hooks/useAuth.ts` - NEW - Main auth hook
- `convex/userProfiles.ts` - Dependency for queries/mutations
- `src/routes/demo/clerk.tsx` - Can use for testing
- `src/integrations/clerk/provider.tsx` - Clerk context provider

## Helpful Resources

### React Hooks
- [React useEffect Hook](https://react.dev/reference/react/useEffect)
- [React useState Hook](https://react.dev/reference/react/useState)
- [Custom Hooks Pattern](https://react.dev/learn/reusing-logic-with-custom-hooks)

### Clerk React
- [useUser Hook](https://clerk.com/docs/references/react/use-user)
- [Clerk React Overview](https://clerk.com/docs/references/react/overview)

### Convex React
- [useQuery Hook](https://docs.convex.dev/client/react#usequery)
- [useMutation Hook](https://docs.convex.dev/client/react#usemutation)
- [React Client](https://docs.convex.dev/client/react)

## Notes
- Hook must be used within ClerkProvider AND ConvexProvider
- Profile creation is automatic - users don't need to fill out forms
- First user detection happens server-side in Convex mutation
- Consider adding retry logic for profile creation failures
- Keep hook lightweight - don't add unnecessary computations
- Use "skip" pattern for conditional queries to prevent errors
