# Feature: Fields Management

## Overview
Add CRUD and UI for tournament fields (physical playing locations). Fields are referenced by games and help schedule where and when games take place. Currently fields exist only in the schema and seed data with no way to manage them.

## Current State
- `convex/schema.ts` has `fields` table with: tournamentId, name, location?, status (available/maintenance/unavailable)
- Seed data has 2 fields: "Field A (Main Diamond)" and "Field B (Secondary Diamond)"
- No `convex/fields.ts` Convex functions exist
- No fields route, component, or hook
- Fields are referenced by games but cannot be created or managed in the UI

## Prerequisites
- [ ] Ticket `06-crud-mutations.md` — tournament mutations exist
- [ ] Ticket `10-tournament-detail-bracket.md` — tournament detail page exists

## Implementation

### Minimal Viable Implementation

Fields are a secondary entity that primarily supports game scheduling. The MVP approach is:

1. **Fields tab** on tournament detail page (under an "Info" or "Settings" section)
2. **Field management** accessible from tournament detail for admins
3. **Field selector** in Game create/edit dialog

### Files to Create

- `convex/fields.ts` — count, list, getByTournament, create, update, remove
- `src/hooks/useFields.ts` — hook wrapping field queries
- `src/components/FieldsList.tsx` — simple list/card display of tournament fields
- `src/components/FieldDialog.tsx` — create/edit field dialog

### Field Convex Functions

```typescript
export const getByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    const allFields = await ctx.db.query("fields").collect();
    return allFields.filter((f) => f.tournamentId === args.tournamentId);
  },
});

export const create = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    name: v.string(),
    location: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("available"),
      v.literal("maintenance"),
      v.literal("unavailable"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return await ctx.db.insert("fields", {
      ...args,
      status: args.status ?? "available",
    });
  },
});

export const update = mutation({ ... });
export const remove = mutation({ ... });
```

## Acceptance Criteria
- [ ] Fields can be created, edited, and deleted within a tournament context
- [ ] Fields tab/section exists on tournament detail page
- [ ] Field selector available in game create/edit dialog
- [ ] Field status is visible (available/maintenance/unavailable) with colored badges
- [ ] Only admins can manage fields
- [ ] Deleting a field that is assigned to games should warn or prevent deletion

## Related Files
- `convex/fields.ts` — NEW
- `src/hooks/useFields.ts` — NEW
- `src/components/FieldsList.tsx` — NEW
- `src/components/FieldDialog.tsx` — NEW
- `src/routes/tournaments/$id/index.tsx` — MODIFY (add fields tab)
- `src/components/GameDialog.tsx` — MODIFY (field selector)

## Notes
- Fields are always scoped to a tournament (no global field list)
- Consider adding a field availability calendar for tournament scheduling (future)
- Field status affects game scheduling — unavailable fields should be hidden from game creation
- Simple implementation: list of fields with status badges and admin CRUD
