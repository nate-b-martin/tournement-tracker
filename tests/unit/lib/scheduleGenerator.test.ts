import { describe, expect, it } from "vitest";
import {
	computeGameDays,
	generateRoundRobinPairings,
} from "@/lib/scheduleGenerator";

const MS_PER_DAY = 86400000;

describe("computeGameDays", () => {
	// Jan 5, 2026 is a Monday — construct as local time so getDay() math is
	// deterministic regardless of the runner's timezone (date-only string
	// literals parse as UTC and shift the local weekday).
	const startDate = new Date(2026, 0, 5).getTime(); // Monday

	it("returns correct dates for a single week", () => {
		const result = computeGameDays({
			startDate,
			regularSeasonWeeks: 1,
			gameDays: [1, 3], // Mon, Wed
		});

		expect(result).toHaveLength(2);
		expect(new Date(result[0]).getDay()).toBe(1); // Monday
		expect(new Date(result[1]).getDay()).toBe(3); // Wednesday
	});

	it("returns dates spread across multiple weeks", () => {
		const result = computeGameDays({
			startDate,
			regularSeasonWeeks: 3,
			gameDays: [1],
		});

		expect(result).toHaveLength(3); // 3 Mondays
		const week1 = new Date(result[0]);
		const week2 = new Date(result[1]);
		const week3 = new Date(result[2]);
		expect(week2.getTime() - week1.getTime()).toBe(7 * 86400000);
		expect(week3.getTime() - week2.getTime()).toBe(7 * 86400000);
	});

	it("handles start date mid-week, returns next occurrence", () => {
		const wedStart = new Date(2026, 0, 7).getTime(); // Wednesday
		const result = computeGameDays({
			startDate: wedStart,
			regularSeasonWeeks: 1,
			gameDays: [1], // Monday (next Monday after Wednesday)
		});

		expect(result).toHaveLength(1);
		expect(new Date(result[0]).getDay()).toBe(1);
		expect(result[0]).toBeGreaterThan(wedStart); // Next Monday after Wednesday
	});

	it("handles weekend game days", () => {
		const result = computeGameDays({
			startDate,
			regularSeasonWeeks: 1,
			gameDays: [0, 6], // Sun, Sat
		});

		expect(result).toHaveLength(2);
		// Week of Mon Jan 5, 2026: Sat Jan 10 comes before Sun Jan 11 chronologically.
		expect(new Date(result[0]).getDay()).toBe(6);
		expect(new Date(result[1]).getDay()).toBe(0);
		expect(result[1] - result[0]).toBe(MS_PER_DAY);
	});

	it("sorts returned dates chronologically", () => {
		const result = computeGameDays({
			startDate,
			regularSeasonWeeks: 2,
			gameDays: [5, 1, 3], // Fri, Mon, Wed (out of order)
		});

		for (let i = 1; i < result.length; i++) {
			expect(result[i]).toBeGreaterThan(result[i - 1]);
		}
	});
});

describe("generateRoundRobinPairings", () => {
	it("generates correct number of rounds for 4 teams single round-robin", () => {
		const rounds = generateRoundRobinPairings(4, "single_round_robin");
		expect(rounds).toHaveLength(3);
	});

	it("generates correct number of rounds for 4 teams double round-robin", () => {
		const rounds = generateRoundRobinPairings(4, "double_round_robin");
		expect(rounds).toHaveLength(6);
	});

	it("each team plays every other team exactly once in single round-robin", () => {
		const rounds = generateRoundRobinPairings(6, "single_round_robin");
		const matchups = new Set<string>();

		for (const round of rounds) {
			for (const game of round) {
				const key = [game.homeTeamIndex, game.awayTeamIndex]
					.sort()
					.join("-");
				matchups.add(key);
			}
		}

		const expectedMatchups = (6 * (6 - 1)) / 2;
		expect(matchups.size).toBe(expectedMatchups);
	});

	it("each team plays every other team twice in double round-robin", () => {
		const rounds = generateRoundRobinPairings(4, "double_round_robin");
		const matchups = new Map<string, number>();

		for (const round of rounds) {
			for (const game of round) {
				const sorted = [game.homeTeamIndex, game.awayTeamIndex].sort().join("-");
				matchups.set(sorted, (matchups.get(sorted) || 0) + 1);
			}
		}

		for (const count of matchups.values()) {
			expect(count).toBeGreaterThanOrEqual(2);
		}
	});

	it("handles odd number of teams without creating bye games", () => {
		const rounds = generateRoundRobinPairings(5, "single_round_robin");
		let totalGames = 0;

		for (const round of rounds) {
			totalGames += round.length;
		}

		const expectedGames = (5 * (5 - 1)) / 2;
		expect(totalGames).toBe(expectedGames);
	});

	it("handles 2 teams single round-robin", () => {
		const rounds = generateRoundRobinPairings(2, "single_round_robin");
		expect(rounds).toHaveLength(1);
		expect(rounds[0]).toHaveLength(1);
	});

	it("handles 2 teams double round-robin", () => {
		const rounds = generateRoundRobinPairings(2, "double_round_robin");
		expect(rounds).toHaveLength(2);
		expect(rounds[0]).toHaveLength(1);
		expect(rounds[1]).toHaveLength(1);
	});

	it("alternates home/away across rounds", () => {
		const rounds = generateRoundRobinPairings(4, "single_round_robin");

		for (const round of rounds) {
			for (const game of round) {
				expect(game.homeTeamIndex).not.toBe(game.awayTeamIndex);
			}
		}
	});

	it("generates all games for 10 teams single round-robin", () => {
		const rounds = generateRoundRobinPairings(10, "single_round_robin");
		let totalGames = 0;
		for (const round of rounds) {
			totalGames += round.length;
		}

		expect(rounds).toHaveLength(9);
		expect(totalGames).toBe(45); // 10*9/2
	});
});
