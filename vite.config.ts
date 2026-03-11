import { defineConfig } from "vitest/config";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import netlify from "@netlify/vite-plugin-tanstack-start";

const config = defineConfig({
  plugins: [
    devtools(),
    // netlify(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-utils/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
});

export default config;
