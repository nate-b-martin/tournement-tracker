import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { query } from "./_generated/server";

// Mirrors the Convex Auth `users` table defined by `authTables` in schema.ts.
const authUserValidator = v.object({
	_id: v.id("users"),
	_creationTime: v.number(),
	name: v.optional(v.string()),
	email: v.optional(v.string()),
	phone: v.optional(v.string()),
	image: v.optional(v.string()),
	emailVerificationTime: v.optional(v.number()),
	phoneVerificationTime: v.optional(v.number()),
	isAnonymous: v.optional(v.boolean()),
});

/**
 * Returns the signed-in user's Convex Auth `users` document, or `null` when
 * unauthenticated. Only ever reads the caller's own document — the user id
 * is resolved from the session token, never from client arguments.
 */
export const getCurrent = query({
	args: {},
	returns: v.union(authUserValidator, v.null()),
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (userId === null) {
			return null;
		}

		return await ctx.db.get(userId);
	},
});
