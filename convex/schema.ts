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
  }),

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
    captainPlayerId: v.id("players"), // clerk user ID - maybe
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
});
