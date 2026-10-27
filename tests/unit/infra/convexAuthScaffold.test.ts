import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vite-plus/test";

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
	readFileSync(resolve(repoRoot, relativePath), "utf8");

const authTs = readRepoFile("convex/auth.ts");
const httpTs = readRepoFile("convex/http.ts");
const authConfigTs = readRepoFile("convex/auth.config.ts");
const schemaTs = readRepoFile("convex/schema.ts");
const envExample = readRepoFile(".env.example");
const dockerUp = readRepoFile("scripts/docker-up.sh");
const authEnvScript = readRepoFile("scripts/convex-auth-env.sh");

const packageJson = JSON.parse(readRepoFile("package.json")) as {
	dependencies: Record<string, string>;
};

describe("convex/auth.ts", () => {
	it("uses the Password provider and exports the auth API", () => {
		expect(authTs).toContain(
			'import { Password } from "@convex-dev/auth/providers/Password";',
		);
		expect(authTs).toContain(
			'import { convexAuth } from "@convex-dev/auth/server";',
		);
		expect(authTs).toContain("providers: [Password]");
		expect(authTs).toMatch(
			/export const \{ auth, signIn, signOut, store, isAuthenticated \}/,
		);
	});
});

describe("convex/http.ts", () => {
	it("mounts the Convex Auth HTTP routes", () => {
		expect(httpTs).toContain('import { httpRouter } from "convex/server";');
		expect(httpTs).toContain('import { auth } from "./auth";');
		expect(httpTs).toContain("auth.addHttpRoutes(http)");
		expect(httpTs).toContain("export default http");
	});
});

describe("convex/auth.config.ts", () => {
	it("trusts the deployment's own site origin as the issuer", () => {
		expect(authConfigTs).toContain("process.env.CONVEX_SITE_URL");
		expect(authConfigTs).toContain('applicationID: "convex"');
	});

	it("no longer references the Clerk issuer", () => {
		expect(authConfigTs).not.toMatch(/clerk/i);
	});
});

describe("convex/schema.ts", () => {
	it("includes the Convex Auth tables", () => {
		expect(schemaTs).toContain(
			'import { authTables } from "@convex-dev/auth/server";',
		);
		expect(schemaTs).toContain("...authTables");
	});
});

describe("Convex Auth dependencies", () => {
	it("installs @convex-dev/auth and @auth/core", () => {
		expect(packageJson.dependencies["@convex-dev/auth"]).toBeDefined();
		expect(packageJson.dependencies["@auth/core"]).toBe("0.41.1");
	});

	it("pins @convex-dev/auth exactly (it is still beta)", () => {
		expect(packageJson.dependencies["@convex-dev/auth"]).toMatch(
			/^\d+\.\d+\.\d+$/,
		);
	});
});

describe("Convex Auth env bootstrap", () => {
	it("documents the deployment-level auth variables", () => {
		for (const name of ["SITE_URL", "JWT_PRIVATE_KEY", "JWKS"]) {
			expect(envExample).toContain(name);
		}
	});

	it("is wired into docker-up.sh", () => {
		expect(dockerUp).toContain("bash scripts/convex-auth-env.sh");
	});

	it("only generates keys when they are missing", () => {
		expect(authEnvScript).toContain("env_is_set");
		expect(authEnvScript).toContain("env get");
		expect(authEnvScript).toContain("if env_is_set JWT_PRIVATE_KEY &&");
	});
});

describe("scripts/generate-auth-keys.mjs", () => {
	it("writes a single-line PKCS8 private key and a public JWKS", () => {
		const outDir = mkdtempSync(join(tmpdir(), "convex-auth-keys-"));

		try {
			execFileSync(
				process.execPath,
				[resolve(repoRoot, "scripts/generate-auth-keys.mjs"), outDir],
				{ stdio: "pipe" },
			);

			const privateKeyPath = join(outDir, "JWT_PRIVATE_KEY");
			const jwksPath = join(outDir, "JWKS");

			const privateKey = readFileSync(privateKeyPath, "utf8");
			expect(privateKey.startsWith("-----BEGIN PRIVATE KEY-----")).toBe(true);
			expect(privateKey.trimEnd().endsWith("-----END PRIVATE KEY-----")).toBe(
				true,
			);
			expect(privateKey).not.toContain("\n");
			expect(privateKey).not.toContain("\r");

			const jwks = JSON.parse(readFileSync(jwksPath, "utf8")) as {
				keys: Array<Record<string, unknown>>;
			};
			expect(jwks.keys).toHaveLength(1);
			expect(jwks.keys[0]).toMatchObject({
				use: "sig",
				kty: "RSA",
			});
			expect(typeof jwks.keys[0].n).toBe("string");
			expect(typeof jwks.keys[0].e).toBe("string");
			// Never publish the private exponent.
			expect(jwks.keys[0].d).toBeUndefined();

			expect(statSync(privateKeyPath).mode & 0o777).toBe(0o600);
			expect(statSync(jwksPath).mode & 0o777).toBe(0o600);
		} finally {
			rmSync(outDir, { recursive: true, force: true });
		}
	});
});
