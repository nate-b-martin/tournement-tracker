import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Scrypt } from "lucia";
import { describe, expect, it } from "vite-plus/test";

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
	readFileSync(resolve(repoRoot, relativePath), "utf8");

const seedTs = readRepoFile("convex/seed.ts");

const packageJson = JSON.parse(readRepoFile("package.json")) as {
	dependencies: Record<string, string>;
};

describe("seeded auth accounts (Password provider contract)", () => {
	it("hashes seed passwords with lucia Scrypt, like the Password provider", () => {
		expect(seedTs).toContain('import { Scrypt } from "lucia";');
		expect(seedTs).toContain("new Scrypt().hash(account.password)");
	});

	it("writes authAccounts in the shape retrieveAccountWithCredentials reads", () => {
		// Sign-in lookup is scoped by (provider, providerAccountId) via the
		// `providerAndAccountId` index; `providerAccountId` is the email.
		expect(seedTs).toContain('withIndex("providerAndAccountId"');
		expect(seedTs).toContain('provider: "password"');
		expect(seedTs).toContain("providerAccountId: account.email");
		expect(seedTs).toContain("secret,");
	});

	it("stores only provider-compatible profile fields on users", () => {
		// The `users` table has no boolean `emailVerified` field; verifier
		// state uses `emailVerificationTime`, which seeding must not fake.
		expect(seedTs).not.toContain("emailVerified");
	});

	it("declares lucia as a direct dependency", () => {
		expect(packageJson.dependencies.lucia).toBeDefined();
	});
});

describe("seed ownership fixtures", () => {
	it("leaves zero user_clerk_* string literals", () => {
		expect(seedTs).not.toMatch(/user_clerk_/);
	});

	it("reuses the seeded admin id for organizerId ownership", () => {
		expect(seedTs).toContain(
			"const { admin: adminUserId } = await ensureSeedAuthUsers(ctx);",
		);
		expect(seedTs).toMatch(/organizerId: adminUserId,/);
	});

	it("does not link seeded players to account owners", () => {
		// player.userId is optional and owner-linked players are not part of
		// the seed fixture domain anymore (checked against players.ts).
		expect(seedTs).not.toMatch(/insert\("players", \{\s*\n\s*userId/);
	});
});

describe("idempotent seeding", () => {
	it("exports ensureAuthSeedUsers for CI/test preflight", () => {
		expect(seedTs).toContain("export const ensureAuthSeedUsers = mutation(");
	});

	it("skips account creation when the auth account already exists", () => {
		const ensureAuthUser = seedTs.slice(
			seedTs.indexOf("async function ensureAuthUser("),
		);
		expect(ensureAuthUser).toContain("if (existingAccount) {");
	});

	it("creates the three RBAC roles", () => {
		expect(seedTs).toMatch(/role: "admin"/);
		expect(seedTs).toMatch(/role: "organizer"/);
		expect(seedTs).toMatch(/role: "spectator"/);
	});
});

describe("bootstrap seeding authorization", () => {
	it("requires a logged-in admin once a real account exists", () => {
		expect(seedTs).toContain("Unauthorized: Must be logged in");
		expect(seedTs).toContain("Forbidden: Admin access required");
	});

	it("only trusts anonymous callers on seed-only databases", () => {
		expect(seedTs).toContain("databaseIsSeedOnly");
	});
});

describe("clearAllData auth wipe", () => {
	it("clears the Convex Auth tables along with domain tables", () => {
		for (const table of [
			"users",
			"authAccounts",
			"authSessions",
			"authRefreshTokens",
			"authVerificationCodes",
		]) {
			expect(seedTs).toMatch(new RegExp(`"${table}",`));
		}
	});
});

describe(".env.example seed credentials", () => {
	const envExample = readRepoFile(".env.example");

	it("documents overrides for all three seeded accounts", () => {
		expect(envExample).toMatch(/^SITE_ADMIN_EMAIL=/m);
		expect(envExample).toMatch(/^SITE_ORGANIZER_EMAIL=/m);
		expect(envExample).toMatch(/^SITE_SPECTATOR_EMAIL=/m);
	});

	it("stores placeholder-style password values", () => {
		// The .env.example password stays a placeholder; the committed code
		// default is the documented `dev-password`.
		expect(envExample).toMatch(/^SITE_ADMIN_PASSWORD=<.+>$/m);
		expect(seedTs).toContain('?? "dev-password"');
	});
});

describe("Scrypt hash contract", () => {
	it("verifies the right password and rejects the wrong one", async () => {
		const scrypt = new Scrypt();
		const hash = await scrypt.hash("dev-password");
		expect(await scrypt.verify(hash, "dev-password")).toBe(true);
		expect(await scrypt.verify(hash, "wrong-password")).toBe(false);
	});
});
