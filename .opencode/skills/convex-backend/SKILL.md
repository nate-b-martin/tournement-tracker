---
name: convex-backend
description: Convex backend patterns for TanStack Tournament Tracker - schema design, queries, mutations, indexing, auth integration, seed data
metadata:
  audience: developers
  stack: convex-typescript
---

## Schema Design

### Table Definitions
All schemas live in `convex/schema.ts`. Use `defineTable` with `v` validators:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  myTable: defineTable({
    name: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive")),
    optionalField: v.optional(v.string()),
    fkId: v.id("otherTable"),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_fkId", ["fkId"]),
});
```

### Field Validators
- `v.string()` — text fields
- `v.number()` — timestamps (store as `Date.now()`), counts, scores
- `v.boolean()` — flags like `isCaptain`
- `v.id("tableName")` — foreign key references for type-safe joins
- `v.union(v.literal("a"), v.literal("b"))` — enum-style status fields
- `v.optional(v.type())` — nullable fields
- `v.any()` — only for flexible config (e.g., `gameFormatRules`)
- `v.array(v.string())` — for filter arrays in query args

### Indices
- Add `.index("by_fieldName", ["fieldName"])` for every frequently-queried field
- Compound indices: `.index("by_tournament_status", ["tournamentId", "status"])`
- Without indices, Convex does full table scans (`collect()` + in-memory filter)
- Current tables missing indices: `teams`, `players`, `games`, `fields`, `gameStats`
- **Always** add indices before deploying to production

## Query Patterns

### Basic Count Query
```typescript
import { query } from "./_generated/server";

export const count = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const items = await ctx.db.query("myTable").collect();
    return items.length;
  },
});
```

### Paginated List with Filtering & Sorting
Use the `ListArgs` pattern from `convex/teams.ts` and `convex/players.ts`:

```typescript
const ListArgs = {
  pagination: v.optional(v.object({
    pageIndex: v.number(),
    pageSize: v.number(),
  })),
  sorting: v.optional(v.object({
    field: v.string(),
    direction: v.union(v.literal("asc"), v.literal("desc")),
  })),
  filtering: v.optional(v.object({
    search: v.optional(v.string()),
    status: v.optional(v.array(v.string())),
  })),
};

export const list = query({
  args: ListArgs,
  handler: async (ctx, args) => {
    let items = await ctx.db.query("myTable").collect();

    // Apply filters (always in-memory until indices are added)
    if (args.filtering?.search) { /* filter logic */ }
    if (args.filtering?.status?.length) { /* filter logic */ }

    // Apply sorting
    if (args.sorting) { items.sort(/* sort logic */); }

    const totalCount = items.length;

    // Apply pagination
    if (args.pagination) {
      const { pageIndex, pageSize } = args.pagination;
      items = items.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
    }

    return { data: items, totalCount, hasMore: /* boolean */ };
  },
});
```

### Get Single Record
```typescript
export const getById = query({
  args: { id: v.id("myTable") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

### Joins (Fetching Related Documents)
Fetch related documents manually (Convex is not relational):

```typescript
const itemsWithRelated = await Promise.all(
  items.map(async (item) => {
    const related = await ctx.db.get(item.fkId);
    return { ...item, related };
  }),
);
```

## Mutation Patterns

### Basic Auth-Guarded Mutation
```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("myTable", {
      ...args,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

### Update Mutation
```typescript
export const update = mutation({
  args: {
    id: v.id("myTable"),
    name: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { id, ...fields } = args;
    return await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});
```

### Delete Mutation
```typescript
export const remove = mutation({
  args: { id: v.id("myTable") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.delete(args.id);
  },
});
```

## Auth Integration

### Server-Side Validation
Always validate auth in mutations:

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthorized");
```

### Role Checking
Use the `userProfiles` table for role checks:

```typescript
const profile = await ctx.db
  .query("userProfiles")
  .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
  .first();

if (!profile || profile.role !== "admin") {
  throw new Error("Admin access required");
}
```

## Seed Data

Seed data lives in `convex/seed.ts`. Use `npx convex seed` to run:

```typescript
import { mutation } from "./_generated/server";

export const seed = mutation({
  handler: async (ctx) => {
    // Clear existing data
    const existing = await ctx.db.query("myTable").collect();
    for (const item of existing) {
      await ctx.db.delete(item._id);
    }

    // Insert seed data
    await ctx.db.insert("myTable", { name: "Seed Item", status: "active" });
  },
});

export const clearAllData = mutation({
  handler: async (ctx) => {
    const all = await ctx.db.query("myTable").collect();
    for (const item of all) {
      await ctx.db.delete(item._id);
    }
  },
});
```

## Development Commands
- `npx convex dev` — Start local Convex backend (must run alongside `npm run dev`)
- `npx convex seed` — Run the seed mutation to populate test data
- `npx convex deploy` — Deploy to production
- `npx convex dashboard` — Open Convex dashboard
- `npx convex logs` — View function logs
