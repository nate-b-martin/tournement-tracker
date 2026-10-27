import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vite-plus/test";

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
	readFileSync(resolve(repoRoot, relativePath), "utf8");

const netlify = readRepoFile("netlify.toml");
const envExample = readRepoFile(".env.example");
const readme = readRepoFile("README.md");
const gitignore = readRepoFile(".gitignore");

const csp =
	netlify.match(/^Content-Security-Policy\s*=\s*"([^"]+)"$/m)?.[1] ?? "";

const directive = (name: string): string[] => {
	const value = csp
		.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${name} `));

	return value ? value.slice(name.length + 1).split(/\s+/) : [];
};

const ignorePatterns = gitignore
	.split("\n")
	.map((line) => line.trim())
	.filter((line) => line !== "" && !line.startsWith("#"));

describe("netlify.toml Content-Security-Policy", () => {
	it("allows the self-hosted Convex sync origins, including websockets", () => {
		const connectSrc = directive("connect-src");

		for (const origin of [
			"'self'",
			"http://localhost:3210",
			"ws://localhost:3210",
			"http://127.0.0.1:3210",
			"ws://127.0.0.1:3210",
		]) {
			expect(connectSrc).toContain(origin);
		}
	});

	it("allows the Convex site origin used for HTTP actions and JWKS", () => {
		const connectSrc = directive("connect-src");

		expect(connectSrc).toContain("http://localhost:3211");
		expect(connectSrc).toContain("http://127.0.0.1:3211");
	});

	it("drops cloud Convex and Clerk origins", () => {
		expect(csp).not.toMatch(/convex\.cloud/);
		expect(csp).not.toMatch(/clerk\.accounts/);
	});

	it("keeps the rest of the policy unchanged", () => {
		expect(directive("default-src")).toEqual(["'self'"]);
		expect(directive("style-src")).toEqual(["'self'", "'unsafe-inline'"]);
		expect(directive("object-src")).toEqual(["'none'"]);
		expect(directive("base-uri")).toEqual(["'self'"]);
		expect(directive("frame-ancestors")).toEqual(["'self'"]);
		expect(directive("img-src")).toEqual([
			"'self'",
			"data:",
			"blob:",
			"https:",
		]);
		expect(directive("font-src")).toEqual(["'self'", "data:"]);
	});
});

describe(".env.example", () => {
	it("documents every variable used by the Docker and local-dev workflows", () => {
		const required = [
			"VITE_CONVEX_URL",
			"VITE_CONVEX_SITE_URL",
			"CONVEX_SELF_HOSTED_URL",
			"CONVEX_SELF_HOSTED_ADMIN_KEY",
			"INSTANCE_NAME",
			"INSTANCE_SECRET",
			"CONVEX_CLOUD_ORIGIN",
			"CONVEX_SITE_ORIGIN",
			"SITE_ADMIN_EMAIL",
			"SITE_ADMIN_PASSWORD",
			"E2E_ADMIN_EMAIL",
			"E2E_ADMIN_PASSWORD",
		];

		for (const key of required) {
			expect(envExample).toMatch(new RegExp(`^${key}=`, "m"));
		}
	});

	it("explains the two env files and the one-backend-at-a-time rule", () => {
		expect(envExample).toContain(".env.local");
		expect(envExample).toMatch(/one backend at a time/i);
		expect(envExample).toMatch(/never both/i);
	});

	it("warns that CONVEX_DEPLOYMENT must stay unset for the Docker backend", () => {
		expect(envExample).toMatch(/^#?\s*CONVEX_DEPLOYMENT=$/m);
	});

	it("contains placeholders instead of real secrets", () => {
		expect(envExample).not.toMatch(/pk_(test|live)_[A-Za-z0-9]{8,}/);
		expect(envExample).not.toMatch(/sk_(test|live)_[A-Za-z0-9]{8,}/);
		expect(envExample).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
	});
});

describe("README self-hosting docs", () => {
	it("has a dedicated Self-Hosted Docker Deployment section", () => {
		expect(readme).toMatch(/^## Self-Hosted Docker Deployment$/m);
		expect(readme).toContain("./scripts/docker-up.sh");
	});

	it("documents the one-backend-at-a-time rule", () => {
		expect(readme).toMatch(/^### One backend at a time$/m);
		expect(readme).toMatch(/port `3210`/);
		expect(readme).toMatch(/never both/i);
	});

	it("documents volume backup and restore commands", () => {
		expect(readme).toMatch(/^### Backups$/m);
		expect(readme).toContain("tar czf");
		expect(readme).toContain("convex-backup-");
		expect(readme).toMatch(/^### Restore$/m);
		expect(readme).toContain("find /data -mindepth 1 -delete");
	});

	it("documents pinned-image upgrades and the self-hosted limitations", () => {
		expect(readme).toMatch(/^### Upgrades$/m);
		expect(readme).toContain(
			"image: ghcr.io/get-convex/convex-backend:v1.xx.x",
		);
		expect(readme).toMatch(/self-hosted\/README\.md/);

		expect(readme).toMatch(/single node/i);
		expect(readme).toMatch(/FSL/);
		expect(readme).toMatch(/Apache-2\.0/);
		expect(readme).toMatch(/no official vendor support/i);
	});

	it("states that the Docker stack uses no cloud Convex or Clerk", () => {
		expect(readme).toMatch(/no `convex\.cloud` and no Clerk/i);
	});
});

describe(".gitignore", () => {
	it("covers local env files while keeping templates tracked", () => {
		expect(ignorePatterns).toContain(".env");
		expect(ignorePatterns).toContain("*.local");
		expect(ignorePatterns).not.toContain(".env.example");
		expect(ignorePatterns).not.toContain("docker-compose.env.example");
	});

	it("ignores database backups written to the repository root", () => {
		expect(ignorePatterns).toContain("convex-backup-*.tar.gz");
	});
});
