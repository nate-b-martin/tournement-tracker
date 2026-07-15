# Design System

## Overview

This project uses [shadcn/ui](https://ui.shadcn.com/) (New York style) with [Tailwind CSS v4](https://tailwindcss.com/) for styling. shadcn components are copied directly into `src/components/ui/` and customized as needed — they are NOT a separate npm package.

## Configuration

**File**: [`components.json`](../components.json)

```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- **Style**: New York (cleaner borders, subtle shadows)
- **Base Color**: Zinc (neutral grays)
- **CSS Variables**: Enabled (covers background, foreground, primary, secondary, accent, destructive, muted, border, ring)
- **RSC**: Disabled (this is a client-side app, not Next.js)
- **Icons**: Lucide React

## `cn()` Utility

**File**: [`src/lib/utils.ts`](../src/lib/utils.ts)

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Combines `clsx` (conditional class names) with `tailwind-merge` (resolves conflicting Tailwind classes). Used by all shadcn components and throughout the app.

## shadcn/ui Components

The following components from shadcn are available in `src/components/ui/`:

| Component | File | Used In |
|-----------|------|---------|
| `alert-dialog` | `ui/alert-dialog.tsx` | `ConfirmDelete`, destructive confirmations |
| `alert` | `ui/alert.tsx` | `AuthErrorBoundary`, `ProtectedRoute`, spectator notice |
| `badge` | `ui/badge.tsx` | Status badges (tournament, game, player), sport badges |
| `button` | `ui/button.tsx` | Everywhere — primary, outline, ghost, destructive variants |
| `card` | `ui/card.tsx` | Stat cards, detail cards, form sections |
| `dialog` | `ui/dialog.tsx` | All CRUD dialogs (Tournament, Team, Player, etc.) |
| `form` | `ui/form.tsx` | (Available — not yet widely used; dialogs use manual form state) |
| `input` | `ui/input.tsx` | Text/number inputs in dialogs |
| `label` | `ui/label.tsx` | Form field labels in dialogs |
| `select` | `ui/select.tsx` | Dropdown selects in dialogs (status, team, tournament) |
| `separator` | `ui/separator.tsx` | Section dividers |
| `sonner` | `ui/sonner.tsx` | Toast notification provider |
| `table` | `ui/table.tsx` | `DataTable` component |
| `tabs` | `ui/tabs.tsx` | Tournament detail page tab groups |
| `textarea` | `ui/textarea.tsx` | Multi-line text inputs in dialogs |
| `tooltip` | `ui/tooltip.tsx` | Hover tooltips |

### Adding New Components

```bash
bunx shadcn@latest add <component-name>
```

Then run `npm run format` to organize imports.

## Tailwind CSS Patterns

### Common Layout Patterns

```tsx
// Page container
<div className="container mx-auto px-6 py-8">

// Card grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Flex row with spacing
<div className="flex items-center justify-between mb-8">

// Centered spinner
<div className="flex items-center justify-center min-h-[60vh]">
```

### Common Component Patterns

```tsx
// Stat card
<Card>
  <CardHeader>
    <CardTitle>Total Teams</CardTitle>
    <CardDescription>{count}</CardDescription>
  </CardHeader>
</Card>

// Badge status
<Badge variant="outline">{sport}</Badge>
<Badge>{status.replace(/_/g, " ")}</Badge>

// Admin button bar
{isAdmin && (
  <Button onClick={handleCreate}>
    <Plus className="mr-2 h-4 w-4" />
    New Tournament
  </Button>
)}

// Spectator banner
<div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
  Viewing as spectator.
</div>

// Empty state
<div className="text-center py-12 text-muted-foreground">
  No items found.
</div>
```

### Dark Mode

`next-themes` is installed but **no toggle UI is implemented yet**. Dark mode styles are prepared via Tailwind's `dark:` prefix:

```tsx
// Card with dark mode
<Card className="bg-white dark:bg-slate-800 rounded-xl shadow-sm">
```

The current `src/styles.css` imports `tw-animate-css` for animation utilities but the theme toggle (light/dark/system) is a future addition.

## Styling Resources

| Resource | Location |
|----------|----------|
| Global CSS | `src/styles.css` |
| shadcn/ui theme | `components.json` |
| cn() utility | `src/lib/utils.ts` |
| Icons | `lucide-react` (import by name) |
| Animations | `tw-animate-css` (Tailwind v4 plugin) |

## Accessibility

- All buttons not in forms should have `type="button"` to prevent unintended form submission
- Icon-only buttons must have `aria-label`
- Color contrast follows Zinc base color scheme
- DataTable headers support keyboard sorting via click
- Dialogs are focus-trapped (shadcn default)
- Tooltips provide additional context on hover
