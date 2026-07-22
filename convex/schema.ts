import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tournaments: defineTable({
    // core info
    name: v.string(),
    description: v.optional(v.string()),
    sport: v.string(),
    location: v.string(),

    // Timing
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    registrationDeadline: v.optional(v.number()),

    // Format & Limits
    maxTeams: v.number(),
    minTeams: v.number(),
    currentTeamCount: v.number(),
    bracketType: v.union(
      v.literal("single_elimination"),
      v.literal("double_elimination"),
      v.literal("round_robin"),
    ),

    // Game Managment
    fieldsAvailable: v.number(),
    gameDuration: v.number(), // minutes
    breakBetweenGames: v.number(), // minutes

    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("registration_open"),
      v.literal("registration_closed"),
      v.literal("active"),
      v.literal("complete"),
    ),

    // Admin
    organizerId: v.string(), // Clerk user ID
    seasonId: v.optional(v.id("seasons")),
    seedingType: v.union(
      v.literal("random"),
      v.literal("manual"),
      v.literal("ranking"),
    ),
    gameFormatRules: v.optional(v.any()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }),

  seasons: defineTable({
    name: v.string(),
    sport: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("complete"),
    ),
    organizerId: v.string(),
    regularSeasonWeeks: v.optional(v.number()),
    gamesPerWeek: v.optional(v.number()),
    gameDays: v.optional(v.array(v.number())),
    scheduleType: v.optional(
      v.union(
        v.literal("single_round_robin"),
        v.literal("double_round_robin"),
      ),
    ),
    regularSeasonComplete: v.optional(v.boolean()),
    playoffTeamsCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_organizerId", ["organizerId"]),

  seasonTeams: defineTable({
    seasonId: v.id("seasons"),
    teamId: v.id("teams"),
    createdAt: v.number(),
  })
    .index("by_seasonId", ["seasonId"])
    .index("by_teamId", ["teamId"]),

  seasonGames: defineTable({
    seasonId: v.id("seasons"),
    homeTeamId: v.id("teams"),
    awayTeamId: v.id("teams"),
    scheduledDate: v.number(),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
    ),
    location: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_seasonId", ["seasonId"]),

  teams: defineTable({
    tournamentId: v.id("tournaments"),
    name: v.string(),
    description: v.optional(v.string()),
    coachName: v.string(),
    coachEmail: v.string(),
    coachPhone: v.string(),
    city: v.optional(v.string()),
    homeField: v.optional(v.string()),
    organization: v.optional(v.string()),
    teamAgeGroup: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended"),
    ),
    captainPlayerId: v.optional(v.id("players")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  players: defineTable({
    userId: v.optional(v.string()), //clerk user ID if they have an account
    teamId: v.optional(v.id("teams")),
    firstName: v.string(),
    lastName: v.string(),
    jerseyNumber: v.optional(v.number()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    birthDate: v.optional(v.number()), //timestamp
    isCaptain: v.boolean(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("injured"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  games: defineTable({
    tournamentId: v.id("tournaments"),
    round: v.number(),
    gameNumber: v.number(),
    team1Id: v.optional(v.id("teams")),
    team2Id: v.optional(v.id("teams")),
    winnerId: v.optional(v.id("teams")),
    scheduledTime: v.optional(v.number()),
    actualStartTime: v.optional(v.number()),
    actualEndTime: v.optional(v.number()),
    fieldId: v.optional(v.id("fields")),
    team1Score: v.optional(v.number()),
    team2Score: v.optional(v.number()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("postponed"),
      v.literal("cancelled"),
    ),
  }).index("by_tournamentId", ["tournamentId"]),

  fields: defineTable({
    tournamentId: v.id("tournaments"),
    name: v.string(),
    location: v.optional(v.string()),
    status: v.union(
      v.literal("available"),
      v.literal("maintenance"),
      v.literal("unavailable"),
    ),
  }),

  gameStats: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    sportType: v.optional(v.string()),
    gamesPlayed: v.number(),
    atBats: v.number(),
    hits: v.number(),
    singles: v.number(),
    doubles: v.number(),
    triples: v.number(),
    homeRuns: v.number(),
    rbi: v.number(),
  }),

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
    .index("by_userId", ["userId"])
    .index("by_role", ["role"]),
});
