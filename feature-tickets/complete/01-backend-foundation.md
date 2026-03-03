# Phase 1: Backend Foundation - Convex Auth Schema & Functions

## Overview
Set up the backend infrastructure for admin authentication by updating the Convex schema and creating user profile functions. This phase establishes the foundation for role-based access control with automatic admin promotion for the first user.

## Current State
- `userProfiles` table exists in schema but lacks database indexes
- No Convex functions exist for user profile CRUD operations
- No way to check if a user is an admin or if any admin exists

## Implementation Steps

### Step 1: Update Schema with Indexes
Modify `convex/schema.ts` to add efficient lookups:

```typescript
userProfiles: defineTable({
  userId: v.string(), // Clerk user ID
  role: v.union(
    v.literal("organizer"),
    v.literal("player"),
    v.literal("spectator"),
    v.literal("admin"),
  ),
  displayName: v.optional(v.string()),
  email: v.optional(v.string()),
})
  .index("by_userId", ["userId"])  // NEW - Fast user lookups
  .index("by_role", ["role"]),      // NEW - Check for existing admins
```

### Step 2: Create User Profile Queries
Create `convex/userProfiles.ts` with these queries:

**getCurrentUser**
```typescript
// Returns full user profile by Clerk userId
// Uses index: by_userId
// Returns: UserProfile | null
```

**getUserRole**
```typescript
// Returns just the role string for a user
// Uses index: by_userId
// Returns: "admin" | "organizer" | "player" | "spectator" | null
```

**getIsFirstUser**
```typescript
// Checks if any userProfiles exist in the database
// Used for auto-promoting first user to admin
// Returns: boolean
```

### Step 3: Create User Profile Mutations

**createUserProfile**
```typescript
// Args: { userId: string, email: string, displayName?: string }
// Logic:
// 1. Check getIsFirstUser()
// 2. If true: role = "admin" (first user becomes admin)
// 3. If false: role = "spectator" (subsequent users)
// 4. Insert new userProfiles document
// Returns: UserProfile (with _id and _creationTime)
```

**updateUserRole**
```typescript
// Args: { userId: string, role: Role }
// Auth: Verify caller has admin role before executing
// Returns: Updated UserProfile
// Note: Currently admin-only, for future multi-admin support
```

### Step 4: Test Convex Functions
Test in Convex dashboard:
- Verify indexes work correctly
- Test getIsFirstUser returns true on empty database
- Test createUserProfile assigns admin to first user
- Test createUserProfile assigns spectator to second user

## Acceptance Criteria
- [ ] Schema updated with `by_userId` and `by_role` indexes
- [ ] `convex/userProfiles.ts` created with all 5 functions
- [ ] `getCurrentUser` query returns user by Clerk ID
- [ ] `getUserRole` query returns role string
- [ ] `getIsFirstUser` correctly detects empty database
- [ ] `createUserProfile` auto-assigns admin to first user
- [ ] `createUserProfile` assigns spectator to subsequent users
- [ ] `updateUserRole` verifies admin permission before updating
- [ ] All functions have proper TypeScript types
- [ ] Functions tested in Convex dashboard

## Testing Considerations
- Clear userProfiles table and test first-user flow
- Create multiple profiles and verify role assignment
- Test edge cases: duplicate userId, null values
- Verify indexes improve query performance

## Related Files
- `convex/schema.ts` - Add indexes
- `convex/userProfiles.ts` - New file with auth functions
- `convex/_generated/` - Auto-generated types (will update on `npx convex dev`)

## Helpful Resources

### Convex Documentation
- [Convex Schema & Indexes](https://docs.convex.dev/database/schemas)
- [Convex Queries](https://docs.convex.dev/functions/query-functions)
- [Convex Mutations](https://docs.convex.dev/functions/mutation-functions)
- [Authentication Patterns](https://docs.convex.dev/auth/clerk)

### TypeScript Patterns
- [Convex Validator Types](https://docs.convex.dev/database/types)
- [Index Definitions](https://docs.convex.dev/database/indexes)

## Notes
- Run `npx convex dev` after schema changes to regenerate types
- First-user detection is a one-time check - once any user exists, no auto-promotion
- Role union type includes "organizer" for future multi-admin tournament organizers
- Consider adding `.unique()` constraint on userId if Clerk guarantees uniqueness
- Keep functions idempotent - createUserProfile should handle re-calls gracefully
