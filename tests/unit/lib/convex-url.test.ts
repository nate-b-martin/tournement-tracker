import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { getConvexUrl } from "@/lib/convex-url";

const BUILD_TIME_URL = import.meta.env.VITE_CONVEX_URL;
const SERVER_URL = "http://convex-backend:3210";

const asServer = (env: Record<string, string | undefined>) => {
	vi.stubGlobal("window", undefined);
	vi.stubGlobal("process", { env });
};

describe("getConvexUrl", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("uses the build-time URL in the browser", () => {
		vi.stubGlobal("process", { env: { CONVEX_SSR_URL: SERVER_URL } });

		expect(getConvexUrl()).toBe(BUILD_TIME_URL);
		expect(getConvexUrl()).not.toBe(SERVER_URL);
	});

	it("uses the runtime URL during server-side rendering", () => {
		asServer({ CONVEX_SSR_URL: SERVER_URL });

		expect(getConvexUrl()).toBe(SERVER_URL);
	});

	it("falls back to the build-time URL when the runtime URL is unset", () => {
		asServer({});

		expect(getConvexUrl()).toBe(BUILD_TIME_URL);
	});

	it("falls back to the build-time URL when the runtime URL is empty", () => {
		asServer({ CONVEX_SSR_URL: "" });

		expect(getConvexUrl()).toBe(BUILD_TIME_URL);
	});

	it("falls back to the build-time URL when no process global exists", () => {
		vi.stubGlobal("window", undefined);
		vi.stubGlobal("process", undefined);

		expect(getConvexUrl()).toBe(BUILD_TIME_URL);
	});

	it("does not resolve SSR to the browser's URL when a runtime URL is set", () => {
		asServer({ CONVEX_SSR_URL: SERVER_URL });

		expect(getConvexUrl()).not.toBe(BUILD_TIME_URL);
	});
});
