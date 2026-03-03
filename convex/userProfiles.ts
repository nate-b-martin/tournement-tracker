import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export type Role = "admin" | "organizer" | "player" | "spectator";

const userProfileValidator = v.object({
  _id: v.id("userProfiles"),
  _creationTime: v.number(),
  userId: v.string(),
  role: v.union(
    v.literal("admin"),
    v.literal("organizer"),
    v.literal("player"),
    v.literal("spectator"),
  ),
  displayName: v.optional(v.string()),
  email: v.optional(v.string()),
});

export const getCurrentUser = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(userProfileValidator, v.null()),
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    return userProfile;
  },
});

export const getUserRole = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(
    v.literal("admin"),
    v.literal("organizer"),
    v.literal("player"),
    v.literal("spectator"),
    v.null(),
  ),
  handler: async (
    ctx,
    args,
  ): Promise<Role | null> => {
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    return userProfile?.role ?? null;
  },
});

export const getIsFirstUser = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx): Promise<boolean> => {
    const user = await ctx.db.query("userProfiles").first();
    return user === null;
  },
});

export const createUserProfile = mutation({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
  },
  returns: v.union(userProfileValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Must be logged in to create a profile");
    }

    if (args.userId !== identity.subject) {
      throw new Error("Unauthorized: Cannot create profile for another user");
    }

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingProfile) {
      throw new Error("User profile already exists");
    }

    const existingUser = await ctx.db.query("userProfiles").first();
    const isFirstUser = existingUser === null;
    const role: Role = isFirstUser ? "admin" : "spectator";

    const userProfileId = await ctx.db.insert("userProfiles", {
      userId: args.userId,
      email: args.email,
      displayName: args.displayName,
      role,
    });

    return await ctx.db.get(userProfileId);
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.string(),
    newRole: v.union(
      v.literal("admin"),
      v.literal("organizer"),
      v.literal("player"),
      v.literal("spectator"),
    ),
  },
  returns: v.union(userProfileValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const adminProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Only admins can update user roles");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    await ctx.db.patch(userProfile._id, { role: args.newRole });
    return await ctx.db.get(userProfile._id);
  },
});
