import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function computeGameDays(
	startDate: number,
	regularSeasonWeeks: number,
	gameDays: number[],
): number[] {
	const days: number[] = [];
	const MS_PER_DAY = 86400000;
	const MS_PER_WEEK = 7 * MS_PER_DAY;
	const startDayOfWeek = new Date(startDate).getDay();

	for (let week = 0; week < regularSeasonWeeks; week++) {
		const weekStart = startDate + week * MS_PER_WEEK;
		for (const dayOfWeek of gameDays) {
			let diff = dayOfWeek - startDayOfWeek;
			if (diff < 0) diff += 7;
			days.push(weekStart + diff * MS_PER_DAY);
		}
	}

	return days.sort((a, b) => a - b);
}

interface RoundRobinPairing {
	homeTeamIndex: number;
	awayTeamIndex: number;
}

function generateRoundRobinPairings(
	teamCount: number,
	scheduleType: "single_round_robin" | "double_round_robin",
): RoundRobinPairing[][] {
	const isOdd = teamCount % 2 !== 0;
	const n = isOdd ? teamCount + 1 : teamCount;
	const totalRounds =
		scheduleType === "single_round_robin" ? n - 1 : 2 * (n - 1);
	const rounds: RoundRobinPairing[][] = [];
	const teams: number[] = [];

	for (let i = 0; i < teamCount; i++) teams.push(i);
	if (isOdd) teams.push(-1);

	const gamesPerRound = n / 2;

	for (let round = 0; round < totalRounds; round++) {
		const roundGames: RoundRobinPairing[] = [];

		for (let g = 0; g < gamesPerRound; g++) {
			const home = teams[g];
			const away = teams[n - 1 - g];

			const shouldSwap =
				scheduleType === "double_round_robin"
					? round >= n - 1
						? round % 2 === 0
						: round % 2 !== 0
					: round % 2 !== 0;

			if (home >= 0 && away >= 0) {
				roundGames.push(
					shouldSwap
						? { homeTeamIndex: away, awayTeamIndex: home }
						: { homeTeamIndex: home, awayTeamIndex: away },
				);
			}
		}

		rounds.push(roundGames);

		if (round < totalRounds - 1) {
			const fixed = teams[0];
			const rotating = teams.slice(1);
			const last = rotating.pop();
			if (last !== undefined) {
				rotating.unshift(last);
			}
			teams[0] = fixed;
			for (let i = 1; i < n; i++) {
				teams[i] = rotating[i - 1];
			}
		}
	}

	return rounds;
}

export const listBySeason = query({
  args: { seasonId: v.id("seasons") },
  handler: async (ctx, args) => {
    const games = await ctx.db
      .query("seasonGames")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
      .collect();

    const gamesWithTeams = await Promise.all(
      games.map(async (game) => {
        const homeTeam = await ctx.db.get(game.homeTeamId);
        const awayTeam = await ctx.db.get(game.awayTeamId);
        return {
          ...game,
          homeTeam,
          awayTeam,
        };
      }),
    );

    return gamesWithTeams;
  },
});

export const create = mutation({
  args: {
    seasonId: v.id("seasons"),
    homeTeamId: v.id("teams"),
    awayTeamId: v.id("teams"),
    scheduledDate: v.number(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("seasonGames", {
      ...args,
      status: "scheduled",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("seasonGames"),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("scheduled"), v.literal("completed")),
    ),
    scheduledDate: v.optional(v.number()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("seasonGames") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});

export const generateSchedule = mutation({
  args: {
    seasonId: v.id("seasons"),
    regularSeasonWeeks: v.number(),
    gamesPerWeek: v.number(),
    gameDays: v.array(v.number()),
    scheduleType: v.union(
      v.literal("single_round_robin"),
      v.literal("double_round_robin"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    if (!profile || (profile.role !== "admin" && profile.role !== "organizer")) {
      throw new Error("Admin or organizer access required");
    }

    const season = await ctx.db.get(args.seasonId);
    if (!season) throw new Error("Season not found");

    const seasonTeamsEntries = await ctx.db
      .query("seasonTeams")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
      .collect();

    const teamIds = seasonTeamsEntries.map((e) => e.teamId);
    if (teamIds.length < 2) {
      throw new Error("Season must have at least 2 teams to generate a schedule");
    }

    const existingGames = await ctx.db
      .query("seasonGames")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
      .collect();

    const hasCompletedGames = existingGames.some(
      (g) => g.status === "completed",
    );
    if (hasCompletedGames) {
      throw new Error(
        "Cannot regenerate schedule: season already has completed games. Clear scores first.",
      );
    }

    const pairings = generateRoundRobinPairings(
      teamIds.length,
      args.scheduleType,
    );

    if (pairings.length === 0) {
      throw new Error("No pairings could be generated");
    }

    const totalSlots = args.regularSeasonWeeks * args.gamesPerWeek;
    if (totalSlots < pairings.length) {
      throw new Error(
        `Not enough time slots: ${pairings.length} rounds needed but only ${totalSlots} slots available (${args.regularSeasonWeeks} weeks × ${args.gamesPerWeek} games/week). Increase weeks or games per week.`,
      );
    }

    const gameDays = computeGameDays(
      season.startDate,
      args.regularSeasonWeeks,
      args.gameDays,
    );

    if (gameDays.length < pairings.length) {
      throw new Error(
        `Not enough game days: ${pairings.length} rounds needed but only ${gameDays.length} days available based on selected days of week.`,
      );
    }

    for (const existingGame of existingGames) {
      await ctx.db.delete(existingGame._id);
    }

    let gameDayIndex = 0;
    let gamesInserted = 0;

    for (let roundIdx = 0; roundIdx < pairings.length; roundIdx++) {
      const round = pairings[roundIdx];
      const roundDate = gameDays[gameDayIndex];

      for (const pairing of round) {
        if (teamIds[pairing.homeTeamIndex] && teamIds[pairing.awayTeamIndex]) {
          await ctx.db.insert("seasonGames", {
            seasonId: args.seasonId,
            homeTeamId: teamIds[pairing.homeTeamIndex],
            awayTeamId: teamIds[pairing.awayTeamIndex],
            scheduledDate: roundDate,
            status: "scheduled",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          gamesInserted++;
        }
      }

      gameDayIndex++;
    }

    await ctx.db.patch(args.seasonId, {
      regularSeasonWeeks: args.regularSeasonWeeks,
      gamesPerWeek: args.gamesPerWeek,
      gameDays: args.gameDays,
      scheduleType: args.scheduleType,
      updatedAt: Date.now(),
    });

    return {
      gameCount: gamesInserted,
      totalRounds: pairings.length,
      weeksUsed: Math.ceil(pairings.length / args.gamesPerWeek),
    };
  },
});
