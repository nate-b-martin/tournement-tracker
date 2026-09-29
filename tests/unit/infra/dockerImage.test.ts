import { existsSync, readFileSync } from "node:fs";
import { posix, resolve } from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
	readFileSync(resolve(repoRoot, relativePath), "utf8");

const SERVER_ENTRY = "dist/server/server.js";
const CLIENT_ASSET_DIR = "dist/client";
const HOST_REACHABLE_CONVEX_URL = "http://localhost:3210";
const COMPOSE_INTERNAL_HOSTNAME = "convex-backend:3210";

const dockerfile = readRepoFile("Dockerfile");
const dockerignore = readRepoFile(".dockerignore");
const compose = parse(readRepoFile("docker-compose.yml"));
const packageJson = JSON.parse(readRepoFile("package.json"));

const ignorePatterns = dockerignore
	.split("\n")
	.map((line) => line.trim())
	.filter((line) => line !== "" && !line.startsWith("#"));

const frontendService = compose.services?.frontend;

describe("Dockerfile", () => {
	it("is a multi-stage build that keeps build tooling out of the runtime image", () => {
		expect(dockerfile).toMatch(/^FROM\s+\S+\s+AS\s+build$/m);
		expect(dockerfile).toMatch(/^FROM\s+\S+\s+AS\s+runtime$/m);
	});

	it("pins the Node image to the version used by CI", () => {
		const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
		const ciNodeVersion = ciWorkflow.match(/node-version:\s*"?(\d+)/)?.[1];

		expect(ciNodeVersion).toBeDefined();
		expect(dockerfile).toContain(`ARG NODE_VERSION=${ciNodeVersion}-alpine`);
	});

	it("installs dependencies from the lockfile so builds are reproducible", () => {
		expect(dockerfile).toMatch(/^COPY\s+package\.json\s+package-lock\.json/m);
		expect(dockerfile).toMatch(/^RUN\s+npm ci\b/m);
		expect(dockerfile).not.toMatch(/^RUN\s+npm install\b/m);
	});

	it("bakes VITE_CONVEX_URL in at build time, defaulting to the host-reachable URL", () => {
		expect(dockerfile).toMatch(
			/^ARG\s+VITE_CONVEX_URL=http:\/\/localhost:3210$/m,
		);
		expect(dockerfile).toMatch(/^ENV\s+VITE_CONVEX_URL=\$\{VITE_CONVEX_URL\}$/m);
		expect(dockerfile).toMatch(/^RUN\s+npm run build$/m);
	});

	it("never bakes the compose-internal Convex hostname into the client bundle", () => {
		// Vite inlines build-stage `VITE_*` values into the client bundle, so the
		// compose-internal hostname must not appear there. It is allowed in the
		// runtime stage, where it is read from `process.env` and never shipped.
		const [, buildStage] = dockerfile.split(/^FROM .* AS /m);

		expect(buildStage).not.toContain(COMPOSE_INTERNAL_HOSTNAME);
		expect(dockerfile).not.toMatch(
			new RegExp(`^ARG\\s+VITE_\\S*=${COMPOSE_INTERNAL_HOSTNAME}`, "m"),
		);
	});

	it("gives the SSR bundle a container-reachable Convex URL at runtime", () => {
		// `CONVEX_SSR_URL` must be a plain ENV, not an ARG/ENV pair: it is read
		// from `process.env` at runtime, so it never reaches the client bundle.
		expect(dockerfile).toMatch(
			/^ENV\s+CONVEX_SSR_URL=http:\/\/convex-backend:3210$/m,
		);
		expect(dockerfile).not.toMatch(/^ARG\s+CONVEX_SSR_URL/m);
		expect(dockerfile).not.toMatch(/^ENV\s+CONVEX_SSR_URL=\$\{/m);
	});

	it("keeps the SSR URL out of the build stage entirely", () => {
		const [, buildStage, runtimeStage] = dockerfile.split(/^FROM .* AS /m);
		const ssrEnvLines = dockerfile
			.split("\n")
			.filter((line) => line.startsWith("ENV CONVEX_SSR_URL"));

		expect(ssrEnvLines).toHaveLength(1);
		expect(runtimeStage).toContain("ENV CONVEX_SSR_URL=");
		expect(buildStage).not.toContain("CONVEX_SSR_URL");
	});

	it("ships only the build output and installed packages to the runtime stage", () => {
		expect(dockerfile).toContain("COPY --from=build /app/dist ./dist");
		expect(dockerfile).toContain("COPY --from=build /app/node_modules ./node_modules");
		expect(dockerfile).toContain("COPY --from=build /app/package.json ./package.json");
	});

	it("never copies environment files into an image layer", () => {
		const copyInstructions = dockerfile
			.split("\n")
			.filter((line) => /^COPY\s/.test(line.trim()));

		expect(copyInstructions.length).toBeGreaterThan(0);
		for (const instruction of copyInstructions) {
			expect(instruction).not.toMatch(/\.env/);
		}
	});

	it("runs the SSR server directly as a non-root user on port 3000", () => {
		expect(dockerfile).toMatch(/^ENV\s+PORT=3000$/m);
		expect(dockerfile).toMatch(/^EXPOSE\s+3000$/m);
		expect(dockerfile).toMatch(/^USER\s+node$/m);

		const cmd = dockerfile.match(/^CMD\s+(.+)$/m)?.[1];
		expect(cmd).toBeDefined();
		// Exec the binary rather than `npm run start` so Node is PID 1 and
		// receives SIGTERM for graceful shutdown.
		expect(cmd).not.toContain("npm");
		expect(cmd).toContain(SERVER_ENTRY);
	});

	it("mounts the built fetch handler together with the static client assets", () => {
		const cmd = dockerfile.match(/^CMD\s+(.+)$/m)?.[1] ?? "";
		const argv = JSON.parse(cmd) as string[];

		expect(argv[0]).toBe("./node_modules/.bin/srvx");
		expect(argv).toContain("--prod");
		expect(argv[argv.length - 2]).toBe(`/app/${CLIENT_ASSET_DIR}`);
		expect(argv[argv.length - 1]).toBe(`/app/${SERVER_ENTRY}`);
	});
});

describe(".dockerignore", () => {
	it("keeps dependencies and build output out of the build context", () => {
		for (const pattern of ["node_modules", "dist", ".tanstack", ".vinxi"]) {
			expect(ignorePatterns).toContain(pattern);
		}
	});

	it("keeps every environment file out of the build context", () => {
		for (const pattern of [".env", ".env.local", ".env.*.local"]) {
			expect(ignorePatterns).toContain(pattern);
		}
	});

	it("excludes VCS metadata and local tooling artefacts", () => {
		for (const pattern of [".git", "playwright-report", "test-results"]) {
			expect(ignorePatterns).toContain(pattern);
		}
	});

	it("still ships every input the Vite build reads", () => {
		// Dropping any of these (e.g. `convex` for its generated API types)
		// breaks `npm run build` inside the image.
		for (const required of [
			"src",
			"convex",
			"public",
			"vite.config.ts",
			"tsconfig.json",
		]) {
			expect(ignorePatterns).not.toContain(required);
		}
	});
});

describe("docker-compose.yml", () => {
	it("defines a frontend service built from the repository root", () => {
		expect(frontendService).toBeDefined();
		expect(frontendService.build.context).toBe(".");
	});

	it("passes the host-reachable Convex URL to the image build", () => {
		const args = frontendService.build.args;

		expect(args.VITE_CONVEX_URL).toBe(
			`\${VITE_CONVEX_URL:-${HOST_REACHABLE_CONVEX_URL}}`,
		);
		expect(JSON.stringify(args)).not.toContain(COMPOSE_INTERNAL_HOSTNAME);
	});

	it("publishes the app on port 3000", () => {
		expect(frontendService.ports).toContain("3000:3000");
	});

	it("passes the compose-internal Convex URL to the container at runtime", () => {
		const environment = frontendService.environment;

		expect(environment).toContain(
			`CONVEX_SSR_URL=\${CONVEX_SSR_URL:-http://${COMPOSE_INTERNAL_HOSTNAME}}`,
		);
		// Runtime env only: it must not be a build arg, or a restart would not
		// pick up a change.
		expect(JSON.stringify(frontendService.build)).not.toContain(
			"CONVEX_SSR_URL",
		);
	});

	it("waits for the Convex backend to report healthy before starting", () => {
		expect(frontendService.depends_on["convex-backend"]).toEqual({
			condition: "service_healthy",
		});
	});

	it("keeps the backend and dashboard services from ticket 01 intact", () => {
		expect(compose.services["convex-backend"]).toBeDefined();
		expect(compose.services["convex-dashboard"]).toBeDefined();
	});
});

describe("npm scripts", () => {
	it("builds the assets the runtime image serves", () => {
		expect(packageJson.scripts.build).toBe("vite build");
	});

	it("exposes a start command that mounts the same entry as the image CMD", () => {
		const start = packageJson.scripts.start;

		expect(start).toBeDefined();
		expect(start).toContain("srvx");
		expect(start).toContain(SERVER_ENTRY);

		// srvx resolves `-s` relative to the server entry's directory, so the
		// effective asset directory has to be checked, not the literal string.
		const staticDir = start.match(/-s\s+(\S+)/)?.[1];
		expect(staticDir).toBeDefined();
		expect(
			posix.resolve("/", posix.dirname(SERVER_ENTRY), staticDir as string),
		).toBe(`/${CLIENT_ASSET_DIR}`);
	});

	it("pins srvx as a runtime dependency so the image does not need to rebuild it", () => {
		expect(packageJson.dependencies.srvx).toBeDefined();
	});
});

describe.skipIf(!existsSync(resolve(repoRoot, SERVER_ENTRY)))(
	SERVER_ENTRY,
	() => {
		it("exports a fetch handler rather than listening on a socket", async () => {
			const entry = await import(
				/* @vite-ignore */ resolve(repoRoot, SERVER_ENTRY)
			);

			expect(typeof entry.default.fetch).toBe("function");
		});
	},
);
