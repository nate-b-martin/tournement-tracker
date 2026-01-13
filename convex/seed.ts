import { mutation } from "./_generated/server"
import { v } from "convex/values"

/**
 * Seed function to populate the database with test data for MVP testing.
 *
 * This function inserts minimal test data including:
 * - 1 active tournament
 * - 2 fields
 * - 4 teams with 8 players each, 2 games (1 completed, 1 scheduled)
 * - Player stats for the completed game
 *
 * DATA INSERTION ORDER (critical for foreign key constraints):
 * 1. Tournament (no dependencies)
 * 2. Fields (depend on tournament)
 * 3. Teams (depend on tournament)
 * 4. Players (depend on teams)
 * 5. Games (depend on tournament and teams)
 * 6. GameStats (depend on games and players)
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // ============================================================
    // STEP 1: INSERT TOURNAMENT
    // ============================================================
    // Create a single active tournament that all other entities will reference.
    // The tournament is set to "active" status so we can test game management.
    const tournamentId = await ctx.db.insert("tournaments", {
      name: "Summer Softball Classic 2026",
      description: "Annual summer softball tournament for recreational teams",
      sport: "softball",
      location: "Central Park Sports Complex",

      // Timing configuration
      // Using Unix timestamps (milliseconds since epoch)
      startDate: new Date("2026-07-15T08:00:00Z").getTime(),
      endDate: new Date("2026-07-17T18:00:00Z").getTime(),
      registrationDeadline: new Date("2026-07-01T23:59:59Z").getTime(),

      // Format and team limits
      maxTeams: 32,
      minTeams: 4,
      currentTeamCount: 4,
      bracketType: "single_elimination",

      // Field and game scheduling configuration
      fieldsAvailable: 4,
      gameDuration: 60, // Each game is 60 minutes
      breakBetweenGames: 15, // 15 minute break between games

      // Tournament status - "active" means games are being played
      status: "active",

      // Admin configuration
      organizerId: "user_clerk_test_001", // Mock Clerk user ID
      seedingType: "random",
      gameFormatRules: {
        innings: 7,
        mercyRule: true,
        mercyRunLimit: 8,
        timeLimit: 60,
        extraInnings: "California",
      },
    })

    // ============================================================
    // STEP 2: INSERT FIELDS
    // ============================================================
    // Create fields that belong to the tournament.
    // These will be referenced by games for field assignments.
    const field1Id = await ctx.db.insert("fields", {
      tournamentId,
      name: "Field A - Main Diamond",
      location: "North end of complex, adjacent to parking",
      status: "available",
    })

    const field2Id = await ctx.db.insert("fields", {
      tournamentId,
      name: "Field B - Secondary Diamond",
      location: "East side of complex, near concession stand",
      status: "available",
    })

    // ============================================================
    // STEP 3: INSERT TEAMS
    // ============================================================
    // Create 4 teams that will participate in the tournament.
    // Each team references the tournament via tournamentId.
    // We'll store team IDs in variables to use when creating players and games.
    const team1Id = await ctx.db.insert("teams", {
      tournamentId,
      name: "Diamond Divas",
      description: "Recreational team founded in 2020",
      coachName: "Sarah Johnson",
      coachEmail: "sarah.johnson@email.com",
      coachPhone: "555-0101",
      city: "Springfield",
      homeField: "Community Park Field 1",
      organization: "Springfield Rec Department",
      teamAgeGroup: "Adult",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    const team2Id = await ctx.db.insert("teams", {
      tournamentId,
      name: "Swing Sisters",
      description: "Competitive recreational team",
      coachName: "Maria Garcia",
      coachEmail: "maria.garcia@email.com",
      coachPhone: "555-0102",
      city: "Springfield",
      homeField: "High School Field",
      organization: "Springfield High School",
      teamAgeGroup: "Adult",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    const team3Id = await ctx.db.insert("teams", {
      tournamentId,
      name: "Ball Busters",
      description: "Fun-loving team that plays for the love of the game",
      coachName: "Jennifer Smith",
      coachEmail: "jennifer.smith@email.com",
      coachPhone: "555-0103",
      city: "Riverside",
      homeField: "Riverside Park",
      organization: "Riverside Parks & Rec",
      teamAgeGroup: "Adult",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    const team4Id = await ctx.db.insert("teams", {
      tournamentId,
      name: "Pitch Please",
      description: "New team looking to compete",
      coachName: "Lisa Chen",
      coachEmail: "lisa.chen@email.com",
      coachPhone: "555-0104",
      city: "Lakeside",
      homeField: "Lakeside Community Field",
      organization: "Lakeside Softball League",
      teamAgeGroup: "Adult",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // ============================================================
    // STEP 4: INSERT PLAYERS
    // ============================================================
    // Create 8 players for each team (32 total).
    // Each player references their team via teamId.
    // We'll store player IDs to use when creating game stats.

    // Team 1 Players (Diamond Divas)
    const team1PlayerIds = []
    const team1PlayerNames = [
      { firstName: "Emma", lastName: "Wilson" },
      { firstName: "Olivia", lastName: "Brown" },
      { firstName: "Ava", lastName: "Davis" },
      { firstName: "Sophia", lastName: "Miller" },
      { firstName: "Isabella", lastName: "Moore" },
      { firstName: "Mia", lastName: "Taylor" },
      { firstName: "Charlotte", lastName: "Anderson" },
      { firstName: "Amelia", lastName: "Thomas" },
    ]
    for (let i = 0; i < team1PlayerNames.length; i++) {
      const id = await ctx.db.insert("players", {
        userId: `user_clerk_team1_p${i + 1}`,
        teamId: team1Id,
        firstName: team1PlayerNames[i].firstName,
        lastName: team1PlayerNames[i].lastName,
        jerseyNumber: i + 1,
        email: `${team1PlayerNames[i].firstName.toLowerCase()}.${team1PlayerNames[i].lastName.toLowerCase()}@email.com`,
        phone: `555-100${i + 1}`,
        birthDate: new Date(`1990-${(i + 1).toString().padStart(2, "0")}-15`).getTime(),
        isCaptain: i === 0, // First player is captain
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      team1PlayerIds.push(id)
    }

    // Team 2 Players (Swing Sisters)
    const team2PlayerIds = []
    const team2PlayerNames = [
      { firstName: "Harper", lastName: "Jackson" },
      { firstName: "Evelyn", lastName: "White" },
      { firstName: "Abigail", lastName: "Harris" },
      { firstName: "Emily", lastName: "Martin" },
      { firstName: "Elizabeth", lastName: "Thompson" },
      { firstName: "Sofia", lastName: "Robinson" },
      { firstName: "Avery", lastName: "Clark" },
      { firstName: "Ella", lastName: "Rodriguez" },
    ]
    for (let i = 0; i < team2PlayerNames.length; i++) {
      const id = await ctx.db.insert("players", {
        userId: `user_clerk_team2_p${i + 1}`,
        teamId: team2Id,
        firstName: team2PlayerNames[i].firstName,
        lastName: team2PlayerNames[i].lastName,
        jerseyNumber: i + 10,
        email: `${team2PlayerNames[i].firstName.toLowerCase()}.${team2PlayerNames[i].lastName.toLowerCase()}@email.com`,
        phone: `555-200${i + 1}`,
        birthDate: new Date(`1992-0${i + 1}-20`).getTime(),
        isCaptain: i === 0,
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      team2PlayerIds.push(id)
    }

    // Team 3 Players (Ball Busters)
    const team3PlayerIds = []
    const team3PlayerNames = [
      { firstName: "Scarlett", lastName: "Lewis" },
      { firstName: "Victoria", lastName: "Walker" },
      { firstName: "Madison", lastName: "Hall" },
      { firstName: "Riley", lastName: "Allen" },
      { firstName: "Aria", lastName: "Young" },
      { firstName: "Grace", lastName: "King" },
      { firstName: "Chloe", lastName: "Wright" },
      { firstName: "Luna", lastName: "Lopez" },
    ]
    for (let i = 0; i < team3PlayerNames.length; i++) {
      const id = await ctx.db.insert("players", {
        userId: `user_clerk_team3_p${i + 1}`,
        teamId: team3Id,
        firstName: team3PlayerNames[i].firstName,
        lastName: team3PlayerNames[i].lastName,
        jerseyNumber: i + 20,
        email: `${team3PlayerNames[i].firstName.toLowerCase()}.${team3PlayerNames[i].lastName.toLowerCase()}@email.com`,
        phone: `555-300${i + 1}`,
        birthDate: new Date(`1988-0${i + 1}-10`).getTime(),
        isCaptain: i === 0,
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      team3PlayerIds.push(id)
    }

    // Team 4 Players (Pitch Please)
    const team4PlayerIds = []
    const team4PlayerNames = [
      { firstName: "Zoe", lastName: "Hill" },
      { firstName: "Stella", lastName: "Scott" },
      { firstName: "Hazel", lastName: "Green" },
      { firstName: "Aurora", lastName: "Adams" },
      { firstName: "Violet", lastName: "Baker" },
      { firstName: "Willow", lastName: "Nelson" },
      { firstName: "Iris", lastName: "Carter" },
      { firstName: "Bella", lastName: "Mitchell" },
    ]
    for (let i = 0; i < team4PlayerNames.length; i++) {
      const id = await ctx.db.insert("players", {
        userId: `user_clerk_team4_p${i + 1}`,
        teamId: team4Id,
        firstName: team4PlayerNames[i].firstName,
        lastName: team4PlayerNames[i].lastName,
        jerseyNumber: i + 30,
        email: `${team4PlayerNames[i].firstName.toLowerCase()}.${team4PlayerNames[i].lastName.toLowerCase()}@email.com`,
        phone: `555-400${i + 1}`,
        birthDate: new Date(`1995-0${i + 1}-25`).getTime(),
        isCaptain: i === 0,
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      team4PlayerIds.push(id)
    }

    // ============================================================
    // STEP 5: INSERT GAMES
    // ============================================================
    // Create games that reference the tournament and teams.
    // Game 1: COMPLETED - Team 1 vs Team 2 (Team 1 won 8-3)
    // Game 2: SCHEDULED - Team 3 vs Team 4 (no results yet)

    const game1Id = await ctx.db.insert("games", {
      tournamentId,
      round: 1, // First round (quarterfinals in a 4-team bracket)
      gameNumber: 1, // First game of the round
      team1Id,
      team2Id,
      winnerId: team1Id, // Team 1 won
      scheduledTime: new Date("2026-07-15T09:00:00Z").getTime(),
      actualStartTime: new Date("2026-07-15T09:05:00Z").getTime(),
      actualEndTime: new Date("2026-07-15T10:12:00Z").getTime(),
      fieldId: field1Id,
      team1Score: 8,
      team2Score: 3,
      status: "completed",
    })

    const game2Id = await ctx.db.insert("games", {
      tournamentId,
      round: 1,
      gameNumber: 2,
      team1Id: team3Id,
      team2Id: team4Id,
      winnerId: undefined, // No winner yet
      scheduledTime: new Date("2026-07-15T11:00:00Z").getTime(),
      actualStartTime: undefined,
      actualEndTime: undefined,
      fieldId: field2Id,
      team1Score: undefined,
      team2Score: undefined,
      status: "scheduled",
    })

    // ============================================================
    // STEP 6: INSERT GAME STATS
    // ============================================================
    // Add batting statistics for players in the completed game.
    // This tests the gameStats table for stats retrieval.

    // Team 1 players stats (Diamond Divas - won 8-3)
    // Player 1: 3 at-bats, 2 hits (1 double, 1 single), 2 RBI
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team1PlayerIds[0],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 3,
      hits: 2,
      singles: 1,
      doubles: 1,
      triples: 0,
      homeRuns: 0,
      rbi: 2,
    })

    // Player 2: 4 at-bats, 3 hits (2 singles, 1 triple), 1 RBI
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team1PlayerIds[1],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 4,
      hits: 3,
      singles: 2,
      doubles: 0,
      triples: 1,
      homeRuns: 0,
      rbi: 1,
    })

    // Player 3: 3 at-bats, 2 hits (2 singles), 3 RBI
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team1PlayerIds[2],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 3,
      hits: 2,
      singles: 2,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      rbi: 3,
    })

    // Player 4: 2 at-bats, 1 hit (1 single), 1 RBI
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team1PlayerIds[3],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 2,
      hits: 1,
      singles: 1,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      rbi: 1,
    })

    // Team 2 players stats (Swing Sisters - lost 3-8)
    // Player 1: 3 at-bats, 1 hit (1 single), 0 RBI
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team2PlayerIds[0],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 3,
      hits: 1,
      singles: 1,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      rbi: 0,
    })

    // Player 2: 4 at-bats, 2 hits (2 singles), 2 RBI
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team2PlayerIds[1],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 4,
      hits: 2,
      singles: 2,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      rbi: 2,
    })

    // Player 3: 3 at-bats, 0 hits, 0 RBI
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team2PlayerIds[2],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 3,
      hits: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      rbi: 0,
    })

    // ============================================================
    // RETURN SUMMARY
    // ============================================================
    // Return IDs for reference and verification.
    // In production, you might want to return more structured data
    // or log these to the console.
    return {
      tournamentId,
      fieldIds: [field1Id, field2Id],
      teamIds: [team1Id, team2Id, team3Id, team4Id],
      gameIds: [game1Id, game2Id],
      playerCount: 32,
      message: "Seed data inserted successfully. 1 tournament, 2 fields, 4 teams (8 players each), 2 games, and 7 player stat records for the completed game.",
    }
  },
})

/**
 * Clear function to remove all seeded data.
 * Useful for resetting the database before re-seeding.
 *
 * WARNING: This will delete ALL data in the database, not just seed data.
 * In production, you would want to add checks or use a separate
 * collection for test data.
 */
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Query all tables and delete all records.
    // Note: This is destructive and should only be used in development.
    const tables = [
      "gameStats",
      "games",
      "players",
      "teams",
      "fields",
      "tournaments",
      "userProfiles",
    ]

    for (const table of tables) {
      const documents = await ctx.db.query(table as any).collect()
      for (const doc of documents) {
        await ctx.db.delete(doc._id)
      }
    }

    return { message: `Cleared ${tables.length} tables` }
  },
})
