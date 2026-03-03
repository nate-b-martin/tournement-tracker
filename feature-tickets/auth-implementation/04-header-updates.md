# Phase 4: Header Updates - Auth Widget with Role Indicators

## Overview
Replace the existing ClerkHeader component with a comprehensive authentication widget that displays user state, role badges, and sign-in/sign-out actions in the sidebar navigation.

## Current State
- Header uses simple `ClerkHeader` component from `src/integrations/clerk/header-user.tsx`
- Only shows SignInButton or UserButton - no role information
- No visual distinction between admin and non-admin users
- Sign out not accessible in sidebar

## Implementation Steps

### Step 1: Create Enhanced Auth Widget
Replace ClerkHeader usage in `src/components/Header.tsx`:

```typescript
import { useAuth } from "../hooks/useAuth";
import { SignInButton, UserButton, useClerk } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { LogOut, Shield, Eye } from "lucide-react";

function AuthWidget() {
  const { isLoaded, isSignedIn, isAdmin, isLoading, user, profile } = useAuth();
  const { signOut } = useClerk();
  
  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center gap-2 p-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }
  
  // Signed out state
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
        >
          <span>Sign In</span>
        </Button>
      </SignInButton>
    );
  }
  
  // Signed in - show user info and role
  return (
    <div className="flex flex-col gap-2">
      {/* User row with avatar and badge */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800">
        <div className="flex items-center gap-2">
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {profile?.displayName || user?.firstName || "User"}
            </span>
            <span className="text-xs text-gray-400">
              {profile?.email || user?.primaryEmailAddress?.emailAddress}
            </span>
          </div>
        </div>
        
        {/* Role badge */}
        {isAdmin ? (
          <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-600 text-gray-200 border-0">
            <Eye className="w-3 h-3 mr-1" />
            View Only
          </Badge>
        )}
      </div>
      
      {/* Sign out button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut()}
        className="w-full justify-start gap-2 text-gray-400 hover:text-white hover:bg-gray-800"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>
    </div>
  );
}
```

### Step 2: Update Header Component
Modify `src/components/Header.tsx`:

```typescript
// Replace import
// import ClerkHeader from "../integrations/clerk/header-user.tsx";
import { AuthWidget } from "./AuthWidget";

// Replace usage in sidebar footer
<div className="p-4 border-t border-gray-700 bg-gray-800 flex flex-col gap-2">
  <AuthWidget />
</div>
```

### Step 3: Create Separate AuthWidget Component (Optional)
For cleaner code organization, create `src/components/AuthWidget.tsx`:

```typescript
// Extract the AuthWidget code from Step 1 into its own file
// Export it for use in Header.tsx
```

### Step 4: Update Navigation Items Based on Role
Conditionally show/hide nav items:

```typescript
function Header() {
  const { isAdmin, isSignedIn } = useAuth();
  
  return (
    // ... existing header code ...
    
    <nav className="flex-1 p-4 overflow-y-auto">
      {/* Public nav items */}
      <NavLink to="/">Home</NavLink>
      <NavLink to="/playerspage">Players</NavLink>
      <NavLink to="/teamspage">Teams</NavLink>
      <NavLink to="/tournamentspage">Tournaments</NavLink>
      
      {/* Admin-only nav items */}
      {isAdmin && (
        <>
          <div className="my-2 border-t border-gray-700" />
          <span className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
            Admin
          </span>
          <NavLink to="/dashboard">Dashboard</NavLink>
          {/* Future admin routes */}
        </>
      )}
    </nav>
    
    // ... auth widget ...
  );
}
```

### Step 5: Style Role Badges
Create distinct visual styles for roles:

```typescript
// Admin badge
<Badge className="bg-purple-600 hover:bg-purple-700 text-white">
  <Shield className="w-3 h-3 mr-1" />
  Admin
</Badge>

// View only badge
<Badge className="bg-gray-600 text-gray-200">
  <Eye className="w-3 h-3 mr-1" />
  View Only
</Badge>

// Future: Organizer badge
<Badge className="bg-blue-600 text-white">
  <Trophy className="w-3 h-3 mr-1" />
  Organizer
</Badge>
```

### Step 6: Test All States
1. **Loading state**: Refresh page, verify skeleton shows
2. **Signed out**: Verify "Sign In" button appears
3. **First user sign-in**: Verify admin badge appears, profile created
4. **Second user sign-in**: Verify "View Only" badge appears
5. **Navigation**: Verify admin-only links show for admins only

## Acceptance Criteria
- [ ] `src/components/Header.tsx` updated with new AuthWidget
- [ ] Loading skeleton shows while auth state initializes
- [ ] Signed out state shows "Sign In" button (opens Clerk modal)
- [ ] Signed in state shows UserButton (avatar) + user info
- [ ] Admin users see purple "Admin" badge with shield icon
- [ ] Non-admin users see gray "View Only" badge with eye icon
- [ ] Sign Out button appears for signed-in users
- [ ] Admin-only navigation items hidden for non-admins
- [ ] Visual divider separates admin nav from public nav
- [ ] User email/name displayed in widget
- [ ] Component handles all auth states gracefully
- [ ] No layout shifts during state transitions

## Testing Considerations
- Test loading state with slow network
- Verify Clerk modal opens on sign-in click
- Test sign-out flow redirects to home
- Check mobile responsiveness of widget
- Verify badges are colorblind-friendly (icons + color)
- Test long names and emails don't break layout
- Ensure keyboard navigation works (tab order)

## Related Files
- `src/components/Header.tsx` - MODIFY - Replace ClerkHeader
- `src/components/AuthWidget.tsx` - NEW - Extracted auth widget (optional)
- `src/hooks/useAuth.ts` - Dependency for auth state
- `src/components/ui/badge.tsx` - Badge component
- `src/components/ui/skeleton.tsx` - Skeleton loading component
- `src/components/ui/button.tsx` - Button component

## Helpful Resources

### Clerk React
- [UserButton Component](https://clerk.com/docs/components/user/user-button)
- [SignInButton Component](https://clerk.com/docs/components/authentication/sign-in-button)
- [useClerk Hook](https://clerk.com/docs/references/react/use-clerk)

### UI Components
- [shadcn/ui Badge](https://ui.shadcn.com/docs/components/badge)
- [shadcn/ui Skeleton](https://ui.shadcn.com/docs/components/skeleton)
- [Lucide Icons](https://lucide.dev/icons/)

### Accessibility
- [ARIA Labels](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [Accessible Badges](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships)

## Notes
- Keep widget compact - sidebar space is limited
- Use consistent icon style (Lucide icons throughout)
- Consider truncating long emails with ellipsis
- Admin nav section helps users understand permission boundaries
- Color choices: Purple = Admin (distinctive), Gray = Spectator (neutral)
- Sign-out in widget is more accessible than buried in UserButton menu
- After sign out, redirect to home to avoid being on protected route
- Consider adding hover tooltips for badges explaining permissions
- Test with actual Clerk accounts, not just dev environment
