import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

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
			teamId: v.optional(v.id("teams")),
		}),
	),
};

interface AggregatedTotals {
	gamesPlayed: number;
	atBats: number;
	hits: number;
	singles: number;
	doubles: number;
	triples: number;
	homeRuns: number;
	rbi: number;
}

type PlayerStatsRow = Doc<"players"> & {
	team: Doc<"teams"> | null;
	battingAverage: number;
} & AggregatedTotals;

const EMPTY_TOTALS: AggregatedTotals = {
	gamesPlayed: 0,
	atBats: 0,
	hits: 0,
	singles: 0,
	doubles: 0,
	triples: 0,
	homeRuns: 0,
	rbi: 0,
};

function addToTotals(current: AggregatedTotals, entry: Doc<"gameStats">): AggregatedTotals {
	return {
		gamesPlayed: current.gamesPlayed + entry.gamesPlayed,
		atBats: current.atBats + entry.atBats,
		hits: current.hits + entry.hits,
		singles: current.singles + entry.singles,
		doubles: current.doubles + entry.doubles,
		triples: current.triples + entry.triples,
		homeRuns: current.homeRuns + entry.homeRuns,
		rbi: current.rbi + entry.rbi,
	};
}

function applyFiltering(
	rows: PlayerStatsRow[],
	filtering?: {
		search?: string;
		status?: string[];
		teamId?: Id<"teams">;
	},
): PlayerStatsRow[] {
	let filtered = rows;

	if (filtering?.teamId) {
		filtered = filtered.filter((row) => row.teamId === filtering.teamId);
	}

	if (filtering?.status && filtering.status.length > 0) {
		filtered = filtered.filter((row) => filtering.status?.includes(row.status));
	}

	if (filtering?.search) {
		const searchTerm = filtering.search.toLowerCase();
		filtered = filtered.filter((row) => {
			const fullName = `${row.firstName} ${row.lastName}`.toLowerCase();
			return (
				fullName.includes(searchTerm) ||
				row.firstName.toLowerCase().includes(searchTerm) ||
				row.lastName.toLowerCase().includes(searchTerm) ||
				(row.email ? row.email.toLowerCase().includes(searchTerm) : false)
			);
		});
	}

	return filtered;
}

function applySorting(
	rows: PlayerStatsRow[],
	sorting?: {
		field: string;
		direction: "asc" | "desc";
	},
): PlayerStatsRow[] {
	if (!sorting) {
		return rows;
	}

	const sorted = [...rows];
	sorted.sort((a, b) => {
		const directionMultiplier = sorting.direction === "asc" ? 1 : -1;

		if (sorting.field === "fullName") {
			const aValue = `${a.firstName} ${a.lastName}`;
			const bValue = `${b.firstName} ${b.lastName}`;
			return aValue.localeCompare(bValue) * directionMultiplier;
		}

		const aValue = a[sorting.field as keyof PlayerStatsRow];
		const bValue = b[sorting.field as keyof PlayerStatsRow];

		if (aValue === undefined && bValue === undefined) return 0;
		if (aValue === undefined) return 1 * directionMultiplier;
		if (bValue === undefined) return -1 * directionMultiplier;

		if (typeof aValue === "number" && typeof bValue === "number") {
			return (aValue - bValue) * directionMultiplier;
		}

		return String(aValue).localeCompare(String(bValue)) * directionMultiplier;
	});

	return sorted;
}

async function getRows(ctx: QueryCtx): Promise<PlayerStatsRow[]> {
	const [players, gameStats, teams] = await Promise.all([
		ctx.db.query("players").collect(),
		ctx.db.query("gameStats").collect(),
		ctx.db.query("teams").collect(),
	]);

	const totalsByPlayerId = new Map<string, AggregatedTotals>();
	const teamsById = new Map(teams.map((team) => [String(team._id), team]));

	for (const stat of gameStats) {
		const key = String(stat.playerId);
		const current = totalsByPlayerId.get(key) ?? EMPTY_TOTALS;
		totalsByPlayerId.set(key, addToTotals(current, stat));
	}

	return players.map((player) => {
		const totals = totalsByPlayerId.get(String(player._id)) ?? EMPTY_TOTALS;
		const team = teamsById.get(String(player.teamId)) ?? null;
		const battingAverage = totals.atBats > 0 ? totals.hits / totals.atBats : 0;

		return {
			...player,
			team,
			...totals,
			battingAverage,
		};
	});
}

export const count = query({
	args: {
		filtering: ListArgs.filtering,
	},
	handler: async (ctx, args): Promise<number> => {
		const rows = await getRows(ctx);
		return applyFiltering(rows, args.filtering).length;
	},
});

export const list = query({
	args: ListArgs,
	handler: async (ctx, args) => {
		const rows = await getRows(ctx);
		const filtered = applyFiltering(rows, args.filtering);
		const sorted = applySorting(filtered, args.sorting);
		const totalCount = sorted.length;

		if (!args.pagination) {
			return {
				data: sorted,
				totalCount,
				hasMore: false,
			};
		}

		const { pageIndex, pageSize } = args.pagination;
		const startIndex = pageIndex * pageSize;
		const data = sorted.slice(startIndex, startIndex + pageSize);

		return {
			data,
			totalCount,
			hasMore: (pageIndex + 1) * pageSize < totalCount,
		};
	},
});