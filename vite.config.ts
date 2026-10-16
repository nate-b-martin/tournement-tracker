import netlify from "@netlify/vite-plugin-tanstack-start";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	fmt: {
		// Match the project's pre-existing Biome conventions (tabs, 80 columns,
		// double quotes, sorted imports) so the swap keeps the same style.
		useTabs: true,
		tabWidth: 2,
		printWidth: 80,
		singleQuote: false,
		sortImports: true,
		ignorePatterns: [
			// Generated: emitted by the TanStack Router plugin and the Convex CLI.
			"src/routeTree.gen.ts",
			"convex/_generated/**",
			// Prose and design mockups were never formatted by the previous
			// toolchain, and Markdown formatting also rewrites code samples in docs.
			"**/*.md",
			"**/*.html",
		],
	},
	lint: {
		jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
		rules: { "vite-plus/prefer-vite-plus-imports": "error" },
		options: {
			// Type-aware lint rules stay on. The full type-check pass is off until the
			// repo's pre-existing TypeScript errors (77 at migration time) are fixed:
			// turning it on today would fail `vp check` for reasons unrelated to Vite+.
			typeAware: true,
			typeCheck: false,
		},
	},
	plugins: lazyPlugins(() => [
		devtools(),
		// netlify(),
		// this is the plugin that enables path aliases
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		...(!process.env.VITEST ? [tanstackStart()] : []),
		viteReact(),
	]),
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test-utils/setup.ts"],
		include: ["tests/unit/**/*.test.{ts,tsx}"],
	},
});

export default config;
