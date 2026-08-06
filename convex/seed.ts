import { mutation, type MutationCtx } from "./_generated/server"
import { type Id } from "./_generated/dataModel"

async function assertSeedOperationAuthorized(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error("Unauthorized: Must be logged in")
  }

  const adminProfile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .unique()

  if (!adminProfile || adminProfile.role !== "admin") {
    throw new Error("Forbidden: Admin access required")
  }

  const runtimeEnv = (
    process.env.CONVEX_DEPLOYMENT ??
    process.env.APP_ENV ??
    process.env.NODE_ENV ??
    ""
  ).toLowerCase()

  const allowedEnvironments = ["", "development", "dev", "staging", "test"]
  if (!allowedEnvironments.includes(runtimeEnv)) {
    throw new Error("Seed operations are disabled in production")
  }
}

/**
 * Seed function to populate the database with comprehensive test data for MVP testing.
 *
 * DATA INSERTION ORDER (critical for foreign key constraints):
 *  1. userProfiles       — no dependencies
 *  2. seasons            — no FK dependencies
 *  3. tournaments        — seasonId is optional, insert without it first
 *  4. fields             — tournaments
 *  5. teams              — tournaments
 *  6. players            — teams
 *  7. seasonTeams        — seasons, teams
 *  8. seasonGames        — seasons, teams
 *  9. games              — tournaments, teams, fields
 * 10. gameStats          — games, players
 * 11. Patch tournaments  — link tournament.seasonId after seasons exist
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    await assertSeedOperationAuthorized(ctx)

    // ============================================================
    // STEP 1: INSERT USER PROFILE
    // ============================================================
    await ctx.db.insert("userProfiles", {
      userId: "user_clerk_test_001",
      role: "admin",
      email: "admin@tournament-tracker.test",
      displayName: "Test Admin",
    })

    // ============================================================
    // STEP 2: INSERT SEASONS (3 records)
    // ============================================================
    const season1Id = await ctx.db.insert("seasons", {
      name: "Spring 2026",
      sport: "softball",
      description: "Annual spring softball season",
      startDate: new Date("2026-03-01T00:00:00Z").getTime(),
      endDate: new Date("2026-06-30T23:59:59Z").getTime(),
      status: "active",
      organizerId: "user_clerk_test_001",
      regularSeasonWeeks: 8,
      gamesPerWeek: 2,
      gameDays: [1, 3],
      scheduleType: "single_round_robin",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    const season2Id = await ctx.db.insert("seasons", {
      name: "Fall 2025",
      sport: "softball",
      description: "Previous fall season",
      startDate: new Date("2025-09-01T00:00:00Z").getTime(),
      endDate: new Date("2025-12-31T23:59:59Z").getTime(),
      status: "complete",
      organizerId: "user_clerk_test_001",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    const season3Id = await ctx.db.insert("seasons", {
      name: "Summer 2026",
      sport: "baseball",
      description: "Summer baseball season — planning phase, no teams yet",
      startDate: new Date("2026-07-01T00:00:00Z").getTime(),
      endDate: new Date("2026-09-30T23:59:59Z").getTime(),
      status: "planning",
      organizerId: "user_clerk_test_001",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // ============================================================
    // STEP 3: INSERT TOURNAMENTS (3 records)
    // ============================================================
    // 1 — Summer Softball Classic 2026 (existing, keep as-is)
    const tournamentId = await ctx.db.insert("tournaments", {
      name: "Summer Softball Classic 2026",
      description: "Annual summer softball tournament for recreational teams",
      sport: "softball",
      location: "Central Park Sports Complex",
      startDate: new Date("2026-07-15T08:00:00Z").getTime(),
      endDate: new Date("2026-07-17T18:00:00Z").getTime(),
      registrationDeadline: new Date("2026-07-01T23:59:59Z").getTime(),
      maxTeams: 32,
      minTeams: 4,
      currentTeamCount: 4,
      bracketType: "single_elimination",
      fieldsAvailable: 4,
      gameDuration: 60,
      breakBetweenGames: 15,
      status: "active",
      organizerId: "user_clerk_test_001",
      seedingType: "random",
      gameFormatRules: {
        innings: 7,
        mercyRule: true,
        mercyRunLimit: 8,
        timeLimit: 60,
        extraInnings: "California",
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // 2 — Winter Indoor Tournament 2026 (new, draft, basketball)
    const winterTournamentId = await ctx.db.insert("tournaments", {
      name: "Winter Indoor Tournament 2026",
      description: "Indoor basketball tournament for recreational teams",
      sport: "basketball",
      location: "Sports Dome Indoor Center",
      startDate: new Date("2026-01-10T08:00:00Z").getTime(),
      endDate: new Date("2026-01-12T18:00:00Z").getTime(),
      registrationDeadline: new Date("2025-12-20T23:59:59Z").getTime(),
      maxTeams: 16,
      minTeams: 2,
      currentTeamCount: 2,
      bracketType: "double_elimination",
      fieldsAvailable: 2,
      gameDuration: 45,
      breakBetweenGames: 10,
      status: "draft",
      organizerId: "user_clerk_test_001",
      seedingType: "random",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // 3 — Fall Championship Series 2026 (new, registration_open, baseball)
    const fallTournamentId = await ctx.db.insert("tournaments", {
      name: "Fall Championship Series 2026",
      description: "Fall baseball championship tournament",
      sport: "baseball",
      location: "Riverfield Sports Park",
      startDate: new Date("2026-10-01T08:00:00Z").getTime(),
      endDate: new Date("2026-10-04T18:00:00Z").getTime(),
      registrationDeadline: new Date("2026-09-15T23:59:59Z").getTime(),
      maxTeams: 8,
      minTeams: 4,
      currentTeamCount: 0,
      bracketType: "round_robin",
      fieldsAvailable: 3,
      gameDuration: 90,
      breakBetweenGames: 20,
      status: "registration_open",
      organizerId: "user_clerk_test_001",
      seedingType: "manual",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // ============================================================
    // STEP 4: INSERT FIELDS (6 records — 2 existing, 4 new)
    // ============================================================
    // Summer Softball Classic fields (existing)
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

    // Winter Indoor Tournament fields (new)
    await ctx.db.insert("fields", {
      tournamentId: winterTournamentId,
      name: "Court 1 — Main Arena",
      location: "Sports Dome, Center Court",
      status: "available",
    })

    await ctx.db.insert("fields", {
      tournamentId: winterTournamentId,
      name: "Court 2 — Practice Court",
      location: "Sports Dome, East Wing",
      status: "maintenance",
    })

    // Fall Championship Series fields (new)
    await ctx.db.insert("fields", {
      tournamentId: fallTournamentId,
      name: "Diamond 1 — Championship Field",
      location: "Riverfield Sports Park, Main Entrance",
      status: "available",
    })

    await ctx.db.insert("fields", {
      tournamentId: fallTournamentId,
      name: "Diamond 2 — Practice Field",
      location: "Riverfield Sports Park, Back Lot",
      status: "unavailable",
    })

    // ============================================================
    // STEP 5: INSERT TEAMS (8 records — 4 existing, 4 new)
    // ============================================================
    // Existing teams (Summer Softball Classic)
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

    // New teams — Winter Indoor Tournament (basketball)
    const team5Id = await ctx.db.insert("teams", {
      tournamentId: winterTournamentId,
      name: "Hoops Heroes",
      description: "Community basketball team",
      coachName: "Marcus Williams",
      coachEmail: "marcus.williams@email.com",
      coachPhone: "555-0105",
      city: "Northville",
      homeField: "Northville Community Center",
      organization: "Northville Basketball League",
      teamAgeGroup: "Adult",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    const team6Id = await ctx.db.insert("teams", {
      tournamentId: winterTournamentId,
      name: "Net Navigators",
      description: "Travel basketball team",
      coachName: "David Thompson",
      coachEmail: "david.thompson@email.com",
      coachPhone: "555-0106",
      city: "Eastwood",
      homeField: "Eastwood High Gym",
      organization: "Eastwood Athletic Association",
      teamAgeGroup: "Adult",
      status: "inactive",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // New teams — Fall Championship Series (baseball)
    const team7Id = await ctx.db.insert("teams", {
      tournamentId: fallTournamentId,
      name: "Slugger Squad",
      description: "Competitive baseball team from the local league",
      coachName: "Roberto Martinez",
      coachEmail: "roberto.martinez@email.com",
      coachPhone: "555-0107",
      city: "Westfield",
      homeField: "Westfield Stadium",
      organization: "Westfield Baseball Club",
      teamAgeGroup: "Adult",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    const team8Id = await ctx.db.insert("teams", {
      tournamentId: fallTournamentId,
      name: "Basepath Bandits",
      description: "Newly formed baseball team",
      coachName: "Chris Anderson",
      coachEmail: "chris.anderson@email.com",
      coachPhone: "555-0108",
      city: "Southpark",
      homeField: "Southpark Recreation Field",
      organization: "Southpark Youth Sports",
      teamAgeGroup: "Adult",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // ============================================================
    // STEP 6: INSERT PLAYERS (48 records — 32 existing, 16 new)
    // ============================================================

    // Team 1 Players (Diamond Divas) — 8 existing
    const team1PlayerIds: Id<"players">[] = []
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
        isCaptain: i === 0,
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      team1PlayerIds.push(id)
    }

    // Team 2 Players (Swing Sisters) — 8 existing
    const team2PlayerIds: Id<"players">[] = []
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

    // Team 3 Players (Ball Busters) — 8 existing
    const team3PlayerIds: Id<"players">[] = []
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

    // Team 4 Players (Pitch Please) — 8 existing
    const team4PlayerIds: Id<"players">[] = []
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

    // New Team 5 Players (Hoops Heroes — basketball, Winter tournament)
    const team5PlayerIds: Id<"players">[] = []
    const team5PlayerData = [
      { firstName: "Jaylen", lastName: "Carter", jersey: 0, isCaptain: true, status: "active" as const },
      { firstName: "Andre", lastName: "Foster", jersey: 1, isCaptain: false, status: "active" as const },
      { firstName: "Malik", lastName: "Simmons", jersey: 2, isCaptain: false, status: "active" as const },
      { firstName: "Darius", lastName: "Reynolds", jersey: 3, isCaptain: false, status: "active" as const },
      { firstName: "Tyrone", lastName: "Crawford", jersey: 4, isCaptain: false, status: "active" as const },
      { firstName: "Kobe", lastName: "Jennings", jersey: 5, isCaptain: false, status: "injured" as const },
      { firstName: "Jamal", lastName: "Gibson", jersey: 6, isCaptain: false, status: "active" as const },
      { firstName: "Corey", lastName: "Blake", jersey: 7, isCaptain: false, status: "inactive" as const },
    ]
    for (let i = 0; i < team5PlayerData.length; i++) {
      const id = await ctx.db.insert("players", {
        userId: `user_clerk_team5_p${i + 1}`,
        teamId: team5Id,
        firstName: team5PlayerData[i].firstName,
        lastName: team5PlayerData[i].lastName,
        jerseyNumber: team5PlayerData[i].jersey,
        email: `${team5PlayerData[i].firstName.toLowerCase()}.${team5PlayerData[i].lastName.toLowerCase()}@email.com`,
        phone: `555-500${i + 1}`,
        birthDate: new Date(`1991-${(i + 1).toString().padStart(2, "0")}-10`).getTime(),
        isCaptain: team5PlayerData[i].isCaptain,
        status: team5PlayerData[i].status,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      team5PlayerIds.push(id)
    }

    // New Team 6 Players (Net Navigators — basketball, Winter tournament)
    const team6PlayerIds: Id<"players">[] = []
    const team6PlayerData = [
      { firstName: "Brandon", lastName: "Knight", jersey: 10, isCaptain: true, status: "active" as const },
      { firstName: "Isaiah", lastName: "Ford", jersey: 11, isCaptain: false, status: "active" as const },
      { firstName: "Cameron", lastName: "Wells", jersey: 12, isCaptain: false, status: "active" as const },
      { firstName: "Devin", lastName: "Hunt", jersey: 13, isCaptain: false, status: "active" as const },
      { firstName: "Elijah", lastName: "Pierce", jersey: 14, isCaptain: false, status: "active" as const },
      { firstName: "Jaden", lastName: "Cole", jersey: 15, isCaptain: false, status: "active" as const },
      { firstName: "Xander", lastName: "Brooks", jersey: 16, isCaptain: false, status: "active" as const },
      { firstName: "Tristan", lastName: "Hayes", jersey: 17, isCaptain: false, status: "active" as const },
    ]
    for (let i = 0; i < team6PlayerData.length; i++) {
      const id = await ctx.db.insert("players", {
        userId: `user_clerk_team6_p${i + 1}`,
        teamId: team6Id,
        firstName: team6PlayerData[i].firstName,
        lastName: team6PlayerData[i].lastName,
        jerseyNumber: team6PlayerData[i].jersey,
        email: `${team6PlayerData[i].firstName.toLowerCase()}.${team6PlayerData[i].lastName.toLowerCase()}@email.com`,
        phone: `555-600${i + 1}`,
        birthDate: new Date(`1993-${(i + 1).toString().padStart(2, "0")}-05`).getTime(),
        isCaptain: team6PlayerData[i].isCaptain,
        status: team6PlayerData[i].status,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      team6PlayerIds.push(id)
    }

    // New Team 7 Players (Slugger Squad — baseball, Fall tournament)
    const team7PlayerIds: Id<"players">[] = []
    const team7PlayerData = [
      { firstName: "Antonio", lastName: "Ramirez", jersey: 40, isCaptain: true, status: "active" as const },
      { firstName: "Carlos", lastName: "Ortiz", jersey: 41, isCaptain: false, status: "active" as const },
      { firstName: "Miguel", lastName: "Sanchez", jersey: 42, isCaptain: false, status: "active" as const },
      { firstName: "Javier", lastName: "Torres", jersey: 43, isCaptain: false, status: "active" as const },
      { firstName: "Diego", lastName: "Flores", jersey: 44, isCaptain: false, status: "active" as const },
      { firstName: "Luis", lastName: "Castillo", jersey: 45, isCaptain: false, status: "active" as const },
      { firstName: "Santiago", lastName: "Reyes", jersey: 46, isCaptain: false, status: "active" as const },
      { firstName: "Hector", lastName: "Vargas", jersey: 47, isCaptain: false, status: "active" as const },
    ]
    for (let i = 0; i < team7PlayerData.length; i++) {
      const id = await ctx.db.insert("players", {
        userId: `user_clerk_team7_p${i + 1}`,
        teamId: team7Id,
        firstName: team7PlayerData[i].firstName,
        lastName: team7PlayerData[i].lastName,
        jerseyNumber: team7PlayerData[i].jersey,
        email: `${team7PlayerData[i].firstName.toLowerCase()}.${team7PlayerData[i].lastName.toLowerCase()}@email.com`,
        phone: `555-700${i + 1}`,
        birthDate: new Date(`1989-${(i + 1).toString().padStart(2, "0")}-15`).getTime(),
        isCaptain: team7PlayerData[i].isCaptain,
        status: team7PlayerData[i].status,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      team7PlayerIds.push(id)
    }

    // New Team 8 Players (Basepath Bandits — baseball, Fall tournament)
    const team8PlayerIds: Id<"players">[] = []
    const team8PlayerData = [
      { firstName: "Ethan", lastName: "Walker", jersey: 50, isCaptain: true, status: "active" as const },
      { firstName: "Liam", lastName: "Parker", jersey: 51, isCaptain: false, status: "active" as const },
      { firstName: "Noah", lastName: "Bennett", jersey: 52, isCaptain: false, status: "active" as const },
      { firstName: "Oliver", lastName: "Collins", jersey: 53, isCaptain: false, status: "active" as const },
      { firstName: "William", lastName: "Stewart", jersey: 54, isCaptain: false, status: "active" as const },
      { firstName: "James", lastName: "Morgan", jersey: 55, isCaptain: false, status: "injured" as const },
      { firstName: "Benjamin", lastName: "Cooper", jersey: 56, isCaptain: false, status: "active" as const },
      { firstName: "Lucas", lastName: "Peterson", jersey: 57, isCaptain: false, status: "active" as const },
    ]
    for (let i = 0; i < team8PlayerData.length; i++) {
      const id = await ctx.db.insert("players", {
        userId: `user_clerk_team8_p${i + 1}`,
        teamId: team8Id,
        firstName: team8PlayerData[i].firstName,
        lastName: team8PlayerData[i].lastName,
        jerseyNumber: team8PlayerData[i].jersey,
        email: `${team8PlayerData[i].firstName.toLowerCase()}.${team8PlayerData[i].lastName.toLowerCase()}@email.com`,
        phone: `555-800${i + 1}`,
        birthDate: new Date(`1994-${(i + 1).toString().padStart(2, "0")}-20`).getTime(),
        isCaptain: team8PlayerData[i].isCaptain,
        status: team8PlayerData[i].status,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      team8PlayerIds.push(id)
    }

    // ============================================================
    // STEP 7: INSERT SEASON TEAMS (6 records — 4 existing, 2 new)
    // ============================================================
    // Spring 2026 → Diamond Divas (existing)
    await ctx.db.insert("seasonTeams", {
      seasonId: season1Id,
      teamId: team1Id,
      createdAt: Date.now(),
    })
    // Spring 2026 → Swing Sisters (existing)
    await ctx.db.insert("seasonTeams", {
      seasonId: season1Id,
      teamId: team2Id,
      createdAt: Date.now(),
    })
    // Spring 2026 → Ball Busters (new)
    await ctx.db.insert("seasonTeams", {
      seasonId: season1Id,
      teamId: team3Id,
      createdAt: Date.now(),
    })
    // Spring 2026 → Pitch Please (new)
    await ctx.db.insert("seasonTeams", {
      seasonId: season1Id,
      teamId: team4Id,
      createdAt: Date.now(),
    })
    // Fall 2025 → Ball Busters (existing)
    await ctx.db.insert("seasonTeams", {
      seasonId: season2Id,
      teamId: team3Id,
      createdAt: Date.now(),
    })
    // Fall 2025 → Pitch Please (existing)
    await ctx.db.insert("seasonTeams", {
      seasonId: season2Id,
      teamId: team4Id,
      createdAt: Date.now(),
    })

    // ============================================================
    // STEP 8: INSERT SEASON GAMES (8 records — Spring 2026)
    // ============================================================
    // Game 1 — Week 1: Diamond Divas vs Swing Sisters (completed, DD 5-3)
    await ctx.db.insert("seasonGames", {
      seasonId: season1Id,
      homeTeamId: team1Id,
      awayTeamId: team2Id,
      scheduledDate: new Date("2026-03-02T18:00:00Z").getTime(),
      homeScore: 5,
      awayScore: 3,
      status: "completed",
      location: "Field A - Main Diamond",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Game 2 — Week 1: Ball Busters vs Pitch Please (completed, tie 2-2)
    await ctx.db.insert("seasonGames", {
      seasonId: season1Id,
      homeTeamId: team3Id,
      awayTeamId: team4Id,
      scheduledDate: new Date("2026-03-02T18:00:00Z").getTime(),
      homeScore: 2,
      awayScore: 2,
      status: "completed",
      location: "Field B - Secondary Diamond",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Game 3 — Week 2: Swing Sisters vs Ball Busters (completed, BB 6-4)
    await ctx.db.insert("seasonGames", {
      seasonId: season1Id,
      homeTeamId: team2Id,
      awayTeamId: team3Id,
      scheduledDate: new Date("2026-03-09T18:00:00Z").getTime(),
      homeScore: 4,
      awayScore: 6,
      status: "completed",
      location: "Field A - Main Diamond",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Game 4 — Week 2: Pitch Please vs Diamond Divas (completed, DD 8-1)
    await ctx.db.insert("seasonGames", {
      seasonId: season1Id,
      homeTeamId: team4Id,
      awayTeamId: team1Id,
      scheduledDate: new Date("2026-03-09T18:00:00Z").getTime(),
      homeScore: 1,
      awayScore: 8,
      status: "completed",
      location: "Field B - Secondary Diamond",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Game 5 — Week 3: Diamond Divas vs Ball Busters (completed, BB 4-3)
    await ctx.db.insert("seasonGames", {
      seasonId: season1Id,
      homeTeamId: team1Id,
      awayTeamId: team3Id,
      scheduledDate: new Date("2026-03-16T18:00:00Z").getTime(),
      homeScore: 3,
      awayScore: 4,
      status: "completed",
      location: "Field A - Main Diamond",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Game 6 — Week 3: Swing Sisters vs Pitch Please (completed, SS 7-5)
    await ctx.db.insert("seasonGames", {
      seasonId: season1Id,
      homeTeamId: team2Id,
      awayTeamId: team4Id,
      scheduledDate: new Date("2026-03-16T18:00:00Z").getTime(),
      homeScore: 7,
      awayScore: 5,
      status: "completed",
      location: "Field B - Secondary Diamond",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Game 7 — Week 4: Ball Busters vs Pitch Please (scheduled)
    await ctx.db.insert("seasonGames", {
      seasonId: season1Id,
      homeTeamId: team3Id,
      awayTeamId: team4Id,
      scheduledDate: new Date("2026-03-23T18:00:00Z").getTime(),
      status: "scheduled",
      location: "Field A - Main Diamond",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Game 8 — Week 4: Swing Sisters vs Diamond Divas (scheduled)
    await ctx.db.insert("seasonGames", {
      seasonId: season1Id,
      homeTeamId: team2Id,
      awayTeamId: team1Id,
      scheduledDate: new Date("2026-03-23T18:00:00Z").getTime(),
      status: "scheduled",
      location: "Field B - Secondary Diamond",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // ============================================================
    // STEP 9: INSERT TOURNAMENT GAMES (4 records — 2 existing, 2 new)
    // ============================================================
    // Game 1 — Round 1: Diamond Divas vs Swing Sisters (completed, DD 8-3)
    const game1Id = await ctx.db.insert("games", {
      tournamentId,
      round: 1,
      gameNumber: 1,
      team1Id,
      team2Id,
      winnerId: team1Id,
      scheduledTime: new Date("2026-07-15T09:00:00Z").getTime(),
      actualStartTime: new Date("2026-07-15T09:05:00Z").getTime(),
      actualEndTime: new Date("2026-07-15T10:12:00Z").getTime(),
      fieldId: field1Id,
      team1Score: 8,
      team2Score: 3,
      status: "completed",
    })

    // Game 2 — Round 1: Ball Busters vs Pitch Please (scheduled)
    const game2Id = await ctx.db.insert("games", {
      tournamentId,
      round: 1,
      gameNumber: 2,
      team1Id: team3Id,
      team2Id: team4Id,
      scheduledTime: new Date("2026-07-15T11:00:00Z").getTime(),
      fieldId: field2Id,
      status: "scheduled",
    })

    // New Game 3 — Round 2 (Semifinal): Diamond Divas vs Ball Busters (completed, DD 6-4)
    const game3Id = await ctx.db.insert("games", {
      tournamentId,
      round: 2,
      gameNumber: 3,
      team1Id,
      team2Id: team3Id,
      winnerId: team1Id,
      scheduledTime: new Date("2026-07-16T09:00:00Z").getTime(),
      actualStartTime: new Date("2026-07-16T09:10:00Z").getTime(),
      actualEndTime: new Date("2026-07-16T10:30:00Z").getTime(),
      fieldId: field1Id,
      team1Score: 6,
      team2Score: 4,
      status: "completed",
    })

    // New Game 4 — Round 3 (Championship): Diamond Divas vs TBD (scheduled)
    await ctx.db.insert("games", {
      tournamentId,
      round: 3,
      gameNumber: 4,
      team1Id,
      scheduledTime: new Date("2026-07-17T10:00:00Z").getTime(),
      fieldId: field1Id,
      status: "scheduled",
    })

    // ============================================================
    // STEP 10: INSERT GAME STATS (14 records — 7 existing, 7 new)
    // ============================================================
    // === Existing — Game 1 stats (Diamond Divas vs Swing Sisters) ===
    // Diamond Divas — Game 1 batting
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team1PlayerIds[0],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 3, hits: 2, singles: 1, doubles: 1, triples: 0, homeRuns: 0, rbi: 2,
    })
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team1PlayerIds[1],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 4, hits: 3, singles: 2, doubles: 0, triples: 1, homeRuns: 0, rbi: 1,
    })
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team1PlayerIds[2],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 3, hits: 2, singles: 2, doubles: 0, triples: 0, homeRuns: 0, rbi: 3,
    })
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team1PlayerIds[3],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 2, hits: 1, singles: 1, doubles: 0, triples: 0, homeRuns: 0, rbi: 1,
    })

    // Swing Sisters — Game 1 batting
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team2PlayerIds[0],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 3, hits: 1, singles: 1, doubles: 0, triples: 0, homeRuns: 0, rbi: 0,
    })
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team2PlayerIds[1],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 4, hits: 2, singles: 2, doubles: 0, triples: 0, homeRuns: 0, rbi: 2,
    })
    await ctx.db.insert("gameStats", {
      gameId: game1Id,
      playerId: team2PlayerIds[2],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 3, hits: 0, singles: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0,
    })

    // === New — Game 3 stats (Diamond Divas vs Ball Busters) ===
    // Diamond Divas — Game 3 batting (same players, for multi-game aggregation)
    await ctx.db.insert("gameStats", {
      gameId: game3Id,
      playerId: team1PlayerIds[0],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 4, hits: 3, singles: 2, doubles: 1, triples: 0, homeRuns: 0, rbi: 2,
    })
    await ctx.db.insert("gameStats", {
      gameId: game3Id,
      playerId: team1PlayerIds[1],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 3, hits: 1, singles: 1, doubles: 0, triples: 0, homeRuns: 0, rbi: 1,
    })
    await ctx.db.insert("gameStats", {
      gameId: game3Id,
      playerId: team1PlayerIds[2],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 4, hits: 2, singles: 2, doubles: 0, triples: 0, homeRuns: 0, rbi: 1,
    })
    await ctx.db.insert("gameStats", {
      gameId: game3Id,
      playerId: team1PlayerIds[3],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 2, hits: 0, singles: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0,
    })

    // Ball Busters — Game 3 batting (first stats for these players)
    await ctx.db.insert("gameStats", {
      gameId: game3Id,
      playerId: team3PlayerIds[0],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 3, hits: 2, singles: 1, doubles: 1, triples: 0, homeRuns: 0, rbi: 1,
    })
    await ctx.db.insert("gameStats", {
      gameId: game3Id,
      playerId: team3PlayerIds[1],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 4, hits: 1, singles: 0, doubles: 0, triples: 1, homeRuns: 0, rbi: 1,
    })
    await ctx.db.insert("gameStats", {
      gameId: game3Id,
      playerId: team3PlayerIds[2],
      sportType: "softball",
      gamesPlayed: 1,
      atBats: 3, hits: 0, singles: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0,
    })

    // ============================================================
    // STEP 11: PATCH TOURNAMENT SEASON LINKS
    // ============================================================
    // Link Summer Softball Classic to Spring 2026 season
    await ctx.db.patch(tournamentId, {
      seasonId: season1Id,
      updatedAt: Date.now(),
    })
    // Winter and Fall tournaments intentionally left unlinked
    // (Winter is "draft", Fall is "registration_open" — not yet associated with a season)

    // ============================================================
    // RETURN SUMMARY
    // ============================================================
    return {
      tournamentId,
      tournamentIds: [tournamentId, winterTournamentId, fallTournamentId],
      fieldIds: [field1Id, field2Id],
      teamIds: [team1Id, team2Id, team3Id, team4Id, team5Id, team6Id, team7Id, team8Id],
      gameIds: [game1Id, game2Id, game3Id],
      playerCount: 48,
      seasonIds: [season1Id, season2Id, season3Id],
      message:
        "Seed data inserted successfully: 1 user profile, 3 seasons, 3 tournaments, 6 fields, 8 teams (48 players), 6 seasonTeams, 8 seasonGames (6 completed, 2 scheduled), 4 tournament games (2 completed, 1 scheduled, 1 TBD), and 14 gameStats records.",
    }
  },
})

/**
 * Clear function to remove all seeded data.
 * Useful for resetting the database before re-seeding.
 *
 * WARNING: This will delete ALL data in the database, not just seed data.
 */
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    await assertSeedOperationAuthorized(ctx)

    // Query all tables and delete all records.
    const tables = [
      "seasonGames",
      "seasonTeams",
      "seasons",
      "gameStats",
      "games",
      "players",
      "teams",
      "fields",
      "tournaments",
      "userProfiles",
    ]

    for (const table of tables) {
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic table name
      const documents = await ctx.db.query(table as any).collect()
      for (const doc of documents) {
        await ctx.db.delete(doc._id)
      }
    }

    return { message: `Cleared ${tables.length} tables` }
  },
})
