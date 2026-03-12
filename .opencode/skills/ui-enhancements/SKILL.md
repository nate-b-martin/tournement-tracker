---
name: ui-enhancements
description: UI patterns for TanStack Tournament Tracker - dark mode toggle, empty states, loading skeletons, detail views, responsive design
metadata:
  audience: developers
  stack: react-tailwindcss-shadcn
---

## Design System Reference

### Existing Patterns (check these before adding new UI)
- Container: `max-w-7xl mx-auto px-6`
- Cards: `bg-white dark:bg-slate-800 rounded-xl shadow-sm`
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Borders: `border border-card-outline/70`
- Backgrounds: `bg-card/50`, `bg-background/70`
- Text: `text-muted-foreground`, `text-foreground`

### shadcn Components Available
- `Button` — 6 variants (default, secondary, destructive, outline, ghost, link), 5 sizes
- `Card` — Header, Title, Description, Content, Footer, Action
- `Table` — Header, Body, Footer, Row, Head, Cell, Caption
- `Badge` — 6 variants
- `Alert` — default, destructive
- `Dialog` — for modals/forms
- `DropdownMenu` — for context menus
- `Input` — for form fields

Run `bunx shadcn@latest add <component>` to add new shadcn components (e.g., `Skeleton`, `Tabs`, `Sheet`, `Tooltip`).

## Empty States

### Current Empty State Pattern (DataTable.tsx:227-234)
```typescript
{data.length === 0 && (
  <div className="rounded-xl border border-dashed border-card-outline/80 bg-card/20 px-6 py-12 text-center text-muted-foreground">
    <div className="mb-2 font-orbitron text-lg text-foreground/80">
      No results
    </div>
    <div>{emptyMessage}</div>
  </div>
)}
```

### Enhanced Empty State Ideas
For better UX, consider adding context-aware empty states:

```typescript
// src/components/EmptyState.tsx
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-card-outline/80 bg-card/20 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-muted-foreground/50">{icon}</div>}
      <h3 className="font-orbitron text-lg text-foreground/80">{title || "No results"}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button type="button" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

## Loading States

### Current Loading Pattern (DataTable.tsx:83-89)
```typescript
if (isLoading) {
  return (
    <div className="mt-3 rounded-2xl border border-card-outline/70 bg-card/50 p-10 text-center text-muted-foreground">
      Loading {itemName}...
    </div>
  );
}
```

### Skeleton Pattern (requires `bunx shadcn@latest add skeleton`)
```typescript
import { Skeleton } from "@/components/ui/skeleton";

// Table row skeleton
<Skeleton className="h-12 w-full" />;

// Card skeleton
<div className="space-y-3">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
  <Skeleton className="h-4 w-[150px]" />
</div>;
```

### Auth Loading Pattern (from ProtectedRoute.tsx:17-23)
```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
```

## Dark Mode Toggle

`next-themes` is already installed. Add a theme toggle using the existing `Button` component:

```typescript
// src/components/ThemeToggle.tsx
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

Place it in `src/components/Header.tsx` alongside the `AuthWidget` component.

## Detail Views

### Detail Page Pattern (for future routes like `/teams/:id`)
```typescript
// src/components/TeamDetails.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TeamDetailsProps {
  team: Team;
}

export function TeamDetails({ team }: TeamDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {team.name}
          <Badge variant={team.status === "active" ? "default" : "secondary"}>
            {team.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Coach</dt>
            <dd className="text-sm font-medium">{team.coachName}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="text-sm font-medium">{team.coachEmail}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
```

## Responsive Design Guide

### Breakpoints (TailwindCSS defaults)
- `sm: 640px` — Large phones
- `md: 768px` — Tablets
- `lg: 1024px` — Desktop
- `xl: 1280px` — Wide desktop

### Existing Responsive Patterns
- Toolbar: `flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between` (DataTable.tsx:95)
- Grids: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Sidebar: Slide-out (mobile) vs. visible (desktop) via `Header.tsx`

### Mobile-First Approach
```typescript
// Hide on mobile, show on desktop
<div className="hidden lg:block">
  Desktop content
</div>

// Show on mobile, hide on desktop
<div className="block lg:hidden">
  Mobile content
</div>
```

## Animations

`tw-animate-css` is installed. Common animation classes:
- `animate-spin` — Loading spinners (already used in ProtectedRoute)
- `animate-pulse` — Skeleton loading effects
- `transition-colors` — Hover/active transitions (already used in table filters)

## Key Files to Reference
- `src/components/DataTable/DataTable.tsx` — Empty state and loading patterns
- `src/components/ProtectedRoute.tsx` — Auth loading spinner pattern
- `src/components/Header.tsx` — Sidebar navigation layout
- `src/styles/` or root CSS — Tailwind theme customization
- `src/components/ui/` — All shadcn component wrappers
