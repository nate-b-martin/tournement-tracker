type RuntimeProcess = { env?: Record<string, string | undefined> };

const BROWSER_CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

export function getConvexUrl(): string | undefined {
	if (typeof window !== "undefined") {
		return BROWSER_CONVEX_URL;
	}

	const runtimeEnv = (globalThis as { process?: RuntimeProcess }).process?.env;

	return runtimeEnv?.CONVEX_SSR_URL || BROWSER_CONVEX_URL;
}
