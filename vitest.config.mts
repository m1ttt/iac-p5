import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./wrangler.jsonc" },
		}),
	],
	test: {
		coverage: {
			// The Workers runtime has no V8 coverage API, so the plugin needs Istanbul.
			provider: "istanbul",
			include: ["src/**/*.ts"],
			reporter: [["text", { skipFull: false }], "html", "json-summary"],
			// Quality gate: the pipeline fails when the coverage drops below 80%.
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 80,
				statements: 80,
			},
		},
	},
});
