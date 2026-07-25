import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";

const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;

async function isViewerAdmin(ctx: QueryCtx): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;

  const viewerProfile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .unique();

  return viewerProfile?.role === "admin";
}

function sanitizeSearchTerm(search?: string): string {
  return (search ?? "").trim().toLowerCase().slice(0, MAX_SEARCH_LENGTH);
}

function clampPagination(
  pagination?: { pageIndex: number; pageSize: number },
): { pageIndex: number; pageSize: number } | undefined {
  if (!pagination) return undefined;

  return {
    pageIndex: Math.max(0, pagination.pageIndex),
    pageSize: Math.min(Math.max(1, pagination.pageSize), MAX_PAGE_SIZE),
  };
}

function redactTeam<T extends { coachEmail: string; coachPhone: string }>(
  team: T,
  adminView: boolean,
): T {
  if (adminView) {
    return team;
  }

  return {
    ...team,
    coachEmail: "",
    coachPhone: "",
  };
}

const ListArgs = {
  pagination: v.optional(
    v.object({
      pageIndex: v.number(),
      pageSize: v.number(),
    }),
  ),
  sorting: v.optional(
    v.object({
      field: v.string(),
      direction: v.union(v.literal("asc"), v.literal("desc")),
    }),
  ),
  filtering: v.optional(
    v.object({
      search: v.optional(v.string()),
      status: v.optional(v.array(v.string())),
      tournamentId: v.optional(v.id("tournaments")),
    }),
  ),
};

export const count = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const teams = await ctx.db.query("teams").collect();
    return teams.length;
  },
});

export const list = query({
  args: ListArgs,
  handler: async (ctx, args) => {
    const adminView = await isViewerAdmin(ctx);
    let teams = await ctx.db.query("teams").collect();

    // Apply tournamentId filter
    if (args.filtering?.tournamentId) {
      teams = teams.filter(
        (team) => team.tournamentId === args.filtering!.tournamentId,
      );
    }

    // Apply text search filter
    if (args.filtering?.search) {
      const searchTerm = sanitizeSearchTerm(args.filtering.search);
      if (!searchTerm) {
        teams = [];
      }

      teams = teams.filter(
        (team) =>
          team.name.toLowerCase().includes(searchTerm) ||
          team.coachName.toLowerCase().includes(searchTerm) ||
          (adminView && team.coachEmail && team.coachEmail.toLowerCase().includes(searchTerm)) ||
          (team.organization &&
            team.organization.toLowerCase().includes(searchTerm)),
      );
    }

    // Apply status filter
    if (args.filtering?.status && args.filtering.status.length > 0) {
      teams = teams.filter((team) =>
        args.filtering!.status!.includes(team.status),
      );
    }

    // Apply sorting
    if (args.sorting) {
      teams.sort((a, b) => {
        const { field, direction } = args.sorting!;
        let aValue: any = a[field as keyof typeof a];
        let bValue: any = b[field as keyof typeof b];

        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return direction === "asc" ? 1 : -1;
        if (bValue === undefined) return direction === "asc" ? -1 : 1;

        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Get total count before pagination
    const totalCount = teams.length;

    // Apply pagination
    const normalizedPagination = clampPagination(args.pagination);
    if (normalizedPagination) {
      const { pageIndex, pageSize } = normalizedPagination;
      const startIndex = pageIndex * pageSize;
      teams = teams.slice(startIndex, startIndex + pageSize);
    }

    const safeTeams = teams.map((team) => redactTeam(team, adminView));

    return {
      teams: safeTeams,
      totalCount,
    };
  },
});
